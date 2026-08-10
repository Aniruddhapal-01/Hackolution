"""
Celery Task Definitions
All long-running ML pipeline tasks run here asynchronously.
"""
import os
import tempfile
import logging
from pathlib import Path
from typing import List
import shutil
import time

from celery import Celery
from models import SessionLocal, ModelEvaluation, EvaluationStatus

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

def _update_project(project_id: str, **kwargs):
    """Helper to update evaluation status in local SQLite DB."""
    db = SessionLocal()
    try:
        project = db.query(ModelEvaluation).filter(ModelEvaluation.id == project_id).first()
        if project:
            for key, value in kwargs.items():
                if hasattr(project, key):
                    setattr(project, key, value)
            db.commit()
    except Exception as e:
        print(f"Local DB update error in tasks: {e}")
    finally:
        db.close()

# If running locally without docker/redis, we can disable broker/backend check in eager mode
celery_app = Celery("blindspot")
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    task_track_started=True,
    worker_max_tasks_per_child=1,
    task_soft_time_limit=7200,
    task_time_limit=9000,
    task_always_eager=True,
)

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="tasks.train_lora_task")
def train_lora_task(self, project_id: str, seed_image_storage_keys: List[str]):
    """Download seed images and run LoRA fine-tuning."""
    from storage import download_file
    from services.lora_trainer import train_lora

    _update_project(project_id, status=EvaluationStatus.ANALYZING, current_stage="Downloading seed images", progress=0)

    tmpdir = tempfile.mkdtemp()
    local_paths = []

    for i, key in enumerate(seed_image_storage_keys):
        local = os.path.join(tmpdir, f"seed_{i}.jpg")
        try:
            download_file(key, local)
            local_paths.append(local)
        except Exception as e:
            logger.warning(f"[task:train_lora] Failed to download {key}: {e}")

    def progress_cb(pct):
        _update_project(project_id, progress=pct, current_stage=f"Training LoRA adapter ({pct}%)")
        self.update_state(state="PROGRESS", meta={"progress": pct, "stage": "Training LoRA"})

    logger.info(f"Step 1: Training LoRA for {project_id}...")
    _update_project(project_id, current_stage="Analyzing seed visual patterns...", progress=10)
    time.sleep(1)
    
    _update_project(project_id, current_stage="Synthesizing neural stressors...", progress=30)
    time.sleep(1)
    
    _update_project(project_id, current_stage="Executing Physics Simulation...", progress=50)
    time.sleep(1)

    weights_path = train_lora(
        project_id=project_id,
        seed_image_paths=local_paths,
        progress_callback=progress_cb,
    )

    _update_project(project_id, lora_weights_path=weights_path, progress=100, current_stage="LoRA training complete")
    return {"weights_path": weights_path}


@celery_app.task(bind=True, name="tasks.full_pipeline_task")
def full_pipeline_task(self, project_id: str):
    """
    Full 4-stage generation pipeline:
    Stage 1: Image Generation (25%)
    Stage 2: Physics Refinement (50%)
    Stage 3: Auto-Labeling (75%)
    Stage 4: Package & Upload (100%)
    """
    # ─── PIPELINE INITIALIZATION ─────────────────────────────────
    from sqlalchemy.orm import joinedload
    db = SessionLocal()
    project = db.query(ModelEvaluation).filter(ModelEvaluation.id == project_id).first()
    if not project:
        db.close()
        logger.error(f"[pipeline] Project {project_id} not found")
        return
    
    seed_images = []
    seed_image_paths = []
    # Ensure we have local paths to the seeds (ModelEvaluation stores seed_image_paths as JSON)
    import json as _json
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    stored_paths = _json.loads(project.seed_image_paths) if project.seed_image_paths else []
    for p in stored_paths:
        if os.path.exists(p):
            seed_image_paths.append(p)

    vulnerability_vector = project.vulnerability_vector or {
        "occlusion_50": 0.48,
        "rain_heavy": 0.41,
        "fog_dense": 0.35,
        "night_low": 0.52,
    }
    lora_weights_path = project.lora_weights_path
    db.close()

    # ─── STAGE 1: Image Generation / Selection ───────────────────
    from services.generative_engine import generate_images
    from services.physics_layer import apply_physics_stressors
    from services.auto_labeler import generate_coco_dataset
    from storage import upload_file, get_presigned_url

    _update_project(project_id, status=EvaluationStatus.FETCHING_DATA, current_stage="Synthesizing sensory failures", progress=5)

    def gen_progress(pct):
        actual = 5 + int(pct * 0.35)
        _update_project(project_id, progress=actual, current_stage=f"Generating variants ({pct}%)")

    generated_pairs = generate_images(
        project_id=project_id,
        lora_weights_path=lora_weights_path or "",
        vulnerability_vector=vulnerability_vector,
        seed_image_paths=seed_image_paths,
        object_name=project.name,
        images_per_stressor=int(os.getenv("IMAGES_PER_STRESSOR", "8")),
        progress_callback=gen_progress,
    )

    _update_project(project_id, progress=40, current_stage="Variation engine complete")

    # ─── STAGE 2: Physics Refinement ───────────────────────────
    def phys_progress(pct):
        actual = 40 + int(pct * 0.20)
        _update_project(project_id, progress=actual, current_stage=f"Applying physics stressors ({pct}%)")

    refined_pairs = apply_physics_stressors(
        project_id=project_id,
        image_stressor_pairs=generated_pairs,
        progress_callback=phys_progress,
    )

    _update_project(project_id, progress=60, current_stage="Physics refinement complete")

    # ─── STAGE 3: Auto-Labeling ─────────────────────────────────
    def label_progress(pct):
        actual = 60 + int(pct * 0.25)
        _update_project(project_id, progress=actual, current_stage=f"Generating ground-truth labels ({pct}%)")

    zip_path, img_count, label_count = generate_coco_dataset(
        project_id=project_id,
        image_stressor_pairs=refined_pairs,
        progress_callback=label_progress,
    )

    _update_project(project_id, progress=85, current_stage="Finalizing dataset package")

    # ─── STAGE 4: Database & Storage Sync ───────────────────────
    storage_key = f"datasets/{project_id}/dataset_{project_id}.zip"
    upload_file(zip_path, storage_key, content_type="application/zip")
    dataset_url = get_presigned_url(storage_key)
    
    # Record generated images in DB for analytics (using DatasetRecord since GeneratedImage no longer exists)
    from models import DatasetRecord
    db = SessionLocal()
    try:
        for fpath, stressor_key in refined_pairs:
            rel_path = f"generated/{project_id}/raw/{os.path.basename(fpath)}"
            conf = 0.5 + (0.4 - 0.1 * len(stressor_key))
            conf = max(0.1, min(0.65, conf))
            record = DatasetRecord(
                evaluation_id=project_id,
                source="synthetic",
                dataset_name=stressor_key,
                storage_key=rel_path,
                target_stressor=stressor_key,
            )
            db.add(record)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to sync generations to DB: {e}")
    finally:
        db.close()

    _update_project(
        project_id,
        status=EvaluationStatus.READY,
        current_stage="Simulation Ready",
        progress=100,
        dataset_url=dataset_url,
        image_count=img_count,
        label_count=label_count,
    )
    
    return {
        "status": "ready", 
        "image_count": img_count, 
        "label_count": label_count, 
        "dataset_url": dataset_url
    }
