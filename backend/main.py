"""
BlindSpot.AI — FastAPI Backend
Main application with all REST endpoints.
"""
import os
import io
import uuid
import logging
import shutil
from typing import Optional, List, Any
from datetime import datetime
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from storage import upload_bytes, get_presigned_url, upload_file
from tasks import train_lora_task, full_pipeline_task
from services.adversarial_agent import run_vulnerability_scan, STRESSORS
import httpx

from models import get_db, Project, SeedImage, ProjectStatus, init_db
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure local database is ready
    init_db()
    logger.info("Local SQLite Database Initialized")
    yield
    # Shutdown: Clean up any open streams
    logger.info("Shutting down BlindSpot.AI API")


app = FastAPI(
    title="BlindSpot.AI API",
    description="Industrial-grade synthetic data generation for AI robustness (Local Mode)",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(os.path.join(os.path.dirname(__file__), "data"), exist_ok=True)
app.mount("/media", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "data")), name="media")


# ─── Pydantic Schemas ──────────────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class ModelEndpointRequest(BaseModel):
    endpoint: str

class SeedImageResponse(BaseModel):
    id: str
    filename: str
    url: str
    class Config:
        from_attributes = True

class GeneratedImageResponse(BaseModel):
    id: str
    stressor: Optional[str]
    storage_key: str
    confidence_score: Optional[float]
    class Config:
        from_attributes = True

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    status: str
    progress: int
    current_stage: Optional[str]
    model_endpoint: Optional[str]
    vulnerability_vector: Optional[dict]
    dataset_url: Optional[str]
    image_count: int
    label_count: int
    seed_images: List[SeedImageResponse] = []
    generated_images: List[GeneratedImageResponse] = []
    created_at: Optional[Any]
    updated_at: Optional[Any]

    class Config:
        from_attributes = True


# ─── Projects ─────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "BlindSpot.AI API (Local Mode)"}


@app.post("/api/projects", response_model=ProjectResponse)
def create_project_endpoint(body: ProjectCreate, db: Session = Depends(get_db)):
    project = Project(
        name=body.name,
        description=body.description,
        status=ProjectStatus.CREATED,
        progress=0
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@app.get("/api/projects", response_model=List[ProjectResponse])
def list_projects_endpoint(db: Session = Depends(get_db)):
    return db.query(Project).order_by(desc(Project.created_at)).all()


@app.get("/api/projects/{project_id}", response_model=ProjectResponse)
def get_project_endpoint(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).options(
        joinedload(Project.seed_images),
        joinedload(Project.generated_images)
    ).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@app.delete("/api/projects/{project_id}")
def delete_project_endpoint(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
         raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"deleted": True}


# ─── Seed Images ──────────────────────────────────────────────────────────────

@app.post("/api/projects/{project_id}/seed-images")
async def upload_seed_images_endpoint(
    project_id: str,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    uploaded = []
    for file in files:
        data = await file.read()
        ext = Path(file.filename).suffix or ".jpg"
        storage_key = f"project-seeds/{project_id}/{uuid.uuid4().hex}{ext}"
        
        upload_bytes(data, storage_key, content_type=file.content_type)
        url = f"http://localhost:8000/media/{storage_key}"

        seed = SeedImage(
            project_id=project_id,
            filename=file.filename,
            storage_key=storage_key,
            url=url
        )
        db.add(seed)
        uploaded.append(seed)

    db.commit()
    
    # Update project image count
    project.image_count = db.query(SeedImage).filter(SeedImage.project_id == project_id).count()
    db.commit()
    
    return {"uploaded": len(uploaded), "message": "Images uploaded successfully"}


# ─── Model Endpoint ───────────────────────────────────────────────────────────

@app.post("/api/projects/{project_id}/model-endpoint")
def set_model_endpoint(project_id: str, body: ModelEndpointRequest, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project.model_endpoint = body.endpoint
    db.commit()
    return {"endpoint": body.endpoint, "message": "Model endpoint registered"}


# ─── LoRA Training ────────────────────────────────────────────────────────────

@app.post("/api/projects/{project_id}/train-lora")
def trigger_lora_training(project_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if not project.seed_images:
        raise HTTPException(status_code=400, detail="No seed images uploaded")

    storage_keys = [si.storage_key for si in project.seed_images]
    
    project.status = ProjectStatus.TRAINING_LORA
    project.current_stage = "Starting LoRA training..."
    db.commit()

    background_tasks.add_task(train_lora_task.delay, project_id, storage_keys)
    
    return {"message": "LoRA training started"}


# ─── Adversarial Scan ─────────────────────────────────────────────────────────

def run_scan_bg(project_id, model_endpoint, seed_paths):
    from models import SessionLocal as SessionMakerLocal
    from sqlalchemy.orm import Session as SessionType
    
    db: SessionType = SessionMakerLocal()
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project: return

        v_vec = run_vulnerability_scan(project_id, model_endpoint, seed_paths)
        
        project.vulnerability_vector = v_vec
        project.status = ProjectStatus.READY
        project.current_stage = f"Scan complete — {len(v_vec)} blind spots found"
        db.commit()
    except Exception as e:
        logger.error(f"Scan failed: {e}")
        if project:
            project.status = ProjectStatus.READY
            project.error_message = str(e)
            db.commit()
    finally:
        db.close()

@app.post("/api/projects/{project_id}/run-adversarial-scan")
def run_adversarial_scan_endpoint(project_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project.status = ProjectStatus.SCANNING
    project.current_stage = "Running adversarial scan..."
    db.commit()

    # Prepare seeds
    seed_paths = []
    tmp_dir = Path("data") / f"scan_{project_id}"
    tmp_dir.mkdir(parents=True, exist_ok=True)

    for i, si in enumerate(project.seed_images[:5]):
        local = str(tmp_dir / f"seed_{i}.jpg")
        try:
            # Files are local
            shutil.copy(os.path.join(os.path.dirname(__file__), "data", si.storage_key), local)
            seed_paths.append(local)
        except Exception as e:
            logger.warning(f"Could not copy seed image: {e}")

    background_tasks.add_task(run_scan_bg, project_id, project.model_endpoint or "", seed_paths)

    return {"message": "Scan started"}


# ─── Full Generation Pipeline ─────────────────────────────────────────────────

@app.patch("/api/projects/{project_id}/status")
def update_project_status(project_id: str, payload: dict, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    for key, value in payload.items():
        if hasattr(project, key):
            setattr(project, key, value)
    
    db.commit()
    return {"status": "success"}

@app.post("/api/projects/{project_id}/generate")
def trigger_generation(project_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project.status in [ProjectStatus.GENERATING, ProjectStatus.TRAINING_LORA, ProjectStatus.SCANNING, ProjectStatus.LABELING]:
        return {"message": "Pipeline already active", "status": project.status}

    project.status = ProjectStatus.GENERATING
    project.progress = 0
    project.current_stage = "Pipeline queued..."
    db.commit()

    background_tasks.add_task(full_pipeline_task.delay, project_id)

    return {"message": "Generation pipeline started"}


# ─── Status ───────────────────────────────────────────────────────────────────

@app.get("/api/projects/{project_id}/status")
def get_status(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return {
        "project_id": project_id,
        "status": project.status,
        "progress": project.progress,
        "current_stage": project.current_stage,
        "image_count": project.image_count,
        "label_count": project.label_count,
        "error_message": project.error_message,
    }


# ─── Dataset ──────────────────────────────────────────────────────────────────

@app.get("/api/projects/{project_id}/dataset")
def get_dataset(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project.status != ProjectStatus.READY:
        raise HTTPException(status_code=400, detail="Dataset not ready yet")

    return {
        "project_id": project_id,
        "download_url": project.dataset_url,
        "image_count": project.image_count,
        "label_count": project.label_count,
        "vulnerability_vector": project.vulnerability_vector,
        "format": "COCO JSON + YOLO labels",
    }


import csv
from fastapi.responses import StreamingResponse

@app.get("/api/projects/{project_id}/export-report")
def export_vulnerability_report(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    from models import GeneratedImage
    generated = db.query(GeneratedImage).filter(GeneratedImage.project_id == project_id).all()
    
    # Sort by confidence score (ascending) to show "worst cases" first
    generated.sort(key=lambda x: x.confidence_score or 1.0)

    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        "SCENARIO_ID", 
        "TARGET_MODEL", 
        "ENVIRONMENTAL_STRESSOR", 
        "VULNERABILITY_SCORE", 
        "CONFIDENCE_LEVEL", 
        "STATUS",
        "GENERATED_AT"
    ])
    
    for gen in generated:
        # Vulnerability is high when confidence is low
        v_score = 1 - (gen.confidence_score or 0)
        risk = "CRITICAL" if v_score > 0.6 else "VULNERABLE" if v_score > 0.4 else "ROBUST"
        writer.writerow([
            gen.id,
            project.name,
            gen.stressor.upper() if gen.stressor else "UNKNOWN",
            f"{int(v_score * 100)}%",
            gen.confidence_score,
            risk,
            gen.created_at
        ])
    
    # Add vulnerability vector summary if available
    if project.vulnerability_vector:
        writer.writerow([])
        writer.writerow(["SUMMARY_BY_STRESSOR"])
        for stressor, score in project.vulnerability_vector.items():
            writer.writerow([stressor.upper(), f"{score}%"])

    output.seek(0)
    
    filename = f"Vulnerability_Report_{project.name}_{datetime.now().strftime('%Y%m%d')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


from services.gemini_service import gemini_service

@app.get("/api/projects/{project_id}/brainstorm-scenarios")
def brainstorm_scenarios_endpoint(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    scenarios = gemini_service.generate_edge_cases(project.name, project.description or "")
    return {"scenarios": scenarios}


@app.get("/api/stressors")
def list_stressors():
    return {"stressors": STRESSORS}
