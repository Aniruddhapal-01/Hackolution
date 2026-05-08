"""
BlindSpot.AI — FastAPI Backend v2.0
Model-centric robustness evaluation platform.
5-step pipeline: Upload → Analyze → Fetch Data → Stress Test → Report
"""
import os, io, uuid, logging, shutil, csv
from typing import Optional, List, Any
from datetime import datetime
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from storage import upload_bytes, upload_file, get_presigned_url
from models import (
    get_db, init_db, ModelEvaluation, StressTestResult, DatasetRecord,
    EvaluationStatus, DatasetType, RiskLevel
)
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ALLOWED_MODEL_EXTENSIONS = {".pt", ".pth", ".onnx", ".h5", ".pkl", ".joblib"}
MAX_MODEL_SIZE_MB = 500


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    logger.info("BlindSpot.AI v2.0 — Database initialized")
    yield
    logger.info("BlindSpot.AI v2.0 — Shutting down")


app = FastAPI(
    title="BlindSpot.AI API v2",
    description="Model-centric AI robustness evaluation platform",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)
app.mount("/media", StaticFiles(directory=DATA_DIR), name="media")


# ─── Pydantic Schemas ─────────────────────────────────────────────────────────

class EvaluationCreate(BaseModel):
    name: str
    description: Optional[str] = None
    dataset_type: Optional[str] = None
    architecture: Optional[str] = None
    optimizer: Optional[str] = None
    learning_rate: Optional[float] = None
    epochs: Optional[int] = None
    batch_size: Optional[int] = None
    framework: Optional[str] = None
    embedding_dim: Optional[int] = None
    input_size: Optional[str] = None
    metric_accuracy: Optional[float] = None
    metric_precision: Optional[float] = None
    metric_recall: Optional[float] = None
    metric_f1: Optional[float] = None
    metric_map: Optional[float] = None
    metric_roc_auc: Optional[float] = None


class StressTestResultOut(BaseModel):
    id: str
    stressor_key: str
    stressor_label: Optional[str]
    severity: Optional[float]
    original_score: Optional[float]
    stressed_score: Optional[float]
    degradation_pct: Optional[float]
    confidence_stability: Optional[float]
    sample_count: int
    passed: bool
    notes: Optional[str]
    class Config:
        from_attributes = True


class DatasetRecordOut(BaseModel):
    id: str
    source: str
    dataset_name: Optional[str]
    dataset_url: Optional[str]
    size_bytes: Optional[int]
    sample_count: Optional[int]
    target_stressor: Optional[str]
    description: Optional[str]
    class Config:
        from_attributes = True


class EvaluationResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    dataset_type: Optional[str]
    architecture: Optional[str]
    optimizer: Optional[str]
    learning_rate: Optional[float]
    epochs: Optional[int]
    batch_size: Optional[int]
    framework: Optional[str]
    embedding_dim: Optional[int]
    input_size: Optional[str]
    metric_accuracy: Optional[float]
    metric_precision: Optional[float]
    metric_recall: Optional[float]
    metric_f1: Optional[float]
    metric_map: Optional[float]
    metric_roc_auc: Optional[float]
    model_filename: Optional[str]
    model_size_bytes: Optional[int]
    status: str
    progress: int
    current_stage: Optional[str]
    error_message: Optional[str]
    detected_task_type: Optional[str]
    scope_summary: Optional[str]
    edge_case_analysis: Optional[Any]
    vulnerability_vector: Optional[Any]
    weakness_report: Optional[Any]
    fetched_datasets: Optional[Any]
    total_test_samples: int
    stress_results: Optional[Any]
    robustness_score: Optional[float]
    risk_level: Optional[str]
    deployment_ready: Optional[bool]
    report_url: Optional[str]
    stress_test_results: List[StressTestResultOut] = []
    dataset_records: List[DatasetRecordOut] = []
    created_at: Optional[Any]
    updated_at: Optional[Any]
    class Config:
        from_attributes = True


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _get_eval_or_404(evaluation_id: str, db: Session) -> ModelEvaluation:
    ev = db.query(ModelEvaluation).filter(ModelEvaluation.id == evaluation_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    return ev


def _update_eval(evaluation_id: str, **kwargs):
    """Thread-safe DB update helper for background tasks."""
    from models import SessionLocal
    db = SessionLocal()
    try:
        ev = db.query(ModelEvaluation).filter(ModelEvaluation.id == evaluation_id).first()
        if ev:
            for k, v in kwargs.items():
                if hasattr(ev, k):
                    setattr(ev, k, v)
            db.commit()
    except Exception as e:
        logger.error(f"[DB Update] {e}")
    finally:
        db.close()


# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "BlindSpot.AI API v2.0", "version": "2.0.0"}


# ─── Evaluations CRUD ─────────────────────────────────────────────────────────

@app.post("/api/evaluations", response_model=EvaluationResponse)
def create_evaluation(body: EvaluationCreate, db: Session = Depends(get_db)):
    """Create a new model evaluation with metadata and metrics."""
    ev = ModelEvaluation(
        name=body.name,
        description=body.description,
        dataset_type=body.dataset_type,
        architecture=body.architecture,
        optimizer=body.optimizer,
        learning_rate=body.learning_rate,
        epochs=body.epochs,
        batch_size=body.batch_size,
        framework=body.framework,
        embedding_dim=body.embedding_dim,
        input_size=body.input_size,
        metric_accuracy=body.metric_accuracy,
        metric_precision=body.metric_precision,
        metric_recall=body.metric_recall,
        metric_f1=body.metric_f1,
        metric_map=body.metric_map,
        metric_roc_auc=body.metric_roc_auc,
        status=EvaluationStatus.CREATED,
        progress=0,
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    logger.info(f"[Evaluation] Created: {ev.id} — {ev.name}")
    return ev


@app.get("/api/evaluations", response_model=List[EvaluationResponse])
def list_evaluations(db: Session = Depends(get_db)):
    return db.query(ModelEvaluation).order_by(desc(ModelEvaluation.created_at)).all()


@app.get("/api/evaluations/{evaluation_id}", response_model=EvaluationResponse)
def get_evaluation(evaluation_id: str, db: Session = Depends(get_db)):
    ev = db.query(ModelEvaluation).options(
        joinedload(ModelEvaluation.stress_test_results),
        joinedload(ModelEvaluation.dataset_records),
    ).filter(ModelEvaluation.id == evaluation_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    return ev


@app.delete("/api/evaluations/{evaluation_id}")
def delete_evaluation(evaluation_id: str, db: Session = Depends(get_db)):
    ev = _get_eval_or_404(evaluation_id, db)
    db.delete(ev)
    db.commit()
    return {"deleted": True}


@app.patch("/api/evaluations/{evaluation_id}")
def patch_evaluation(evaluation_id: str, payload: dict, db: Session = Depends(get_db)):
    """Partial update — used by frontend to update metadata."""
    ev = _get_eval_or_404(evaluation_id, db)
    for k, v in payload.items():
        if hasattr(ev, k):
            setattr(ev, k, v)
    db.commit()
    return {"updated": True}


# ─── Step 1: Model Upload ─────────────────────────────────────────────────────

@app.post("/api/evaluations/{evaluation_id}/upload-model")
async def upload_model(
    evaluation_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Upload a model file (.pt .pth .onnx .h5 .pkl .joblib)."""
    ev = _get_eval_or_404(evaluation_id, db)

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_MODEL_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format '{ext}'. Allowed: {', '.join(ALLOWED_MODEL_EXTENSIONS)}"
        )

    data = await file.read()
    size_mb = len(data) / (1024 * 1024)
    if size_mb > MAX_MODEL_SIZE_MB:
        raise HTTPException(status_code=413, detail=f"File too large ({size_mb:.1f} MB). Max: {MAX_MODEL_SIZE_MB} MB")

    storage_key = f"models/{evaluation_id}/{uuid.uuid4().hex}{ext}"
    upload_bytes(data, storage_key, content_type="application/octet-stream")

    ev.model_filename = file.filename
    ev.model_storage_key = storage_key
    ev.model_size_bytes = len(data)
    db.commit()

    logger.info(f"[Upload] Model uploaded for {evaluation_id}: {file.filename} ({size_mb:.1f} MB)")
    return {
        "filename": file.filename,
        "size_mb": round(size_mb, 2),
        "storage_key": storage_key,
        "message": "Model uploaded successfully",
    }


# ─── Step 2: Analysis Pipeline ────────────────────────────────────────────────

def _run_full_pipeline(evaluation_id: str):
    """
    Background task: runs all 4 pipeline stages sequentially.
    Stage 1: Model Analysis (0-25%)
    Stage 2: Dataset Fetching (25-50%)
    Stage 3: Stress Testing (50-85%)
    Stage 4: Report Generation (85-100%)
    """
    from models import SessionLocal, StressTestResult, DatasetRecord
    from services.model_analysis_service import analyze_model
    from services.dataset_fetch_service import fetch_datasets
    from services.stress_testing_service import run_stress_tests
    from services.report_generation_service import generate_report

    db = SessionLocal()
    try:
        ev = db.query(ModelEvaluation).filter(ModelEvaluation.id == evaluation_id).first()
        if not ev:
            return

        dataset_type = ev.dataset_type or "image"
        model_path = os.path.join(DATA_DIR, ev.model_storage_key) if ev.model_storage_key else ""
        metrics = {
            "accuracy":  ev.metric_accuracy,
            "precision": ev.metric_precision,
            "recall":    ev.metric_recall,
            "f1":        ev.metric_f1,
            "map":       ev.metric_map,
            "roc_auc":   ev.metric_roc_auc,
        }
        db.close()

        # ── STAGE 1: Model Analysis ──────────────────────────────────────
        _update_eval(evaluation_id, status=EvaluationStatus.ANALYZING, progress=5, current_stage="Inspecting model architecture...")

        def analysis_progress(pct):
            _update_eval(evaluation_id, progress=int(pct * 0.25), current_stage=f"Analyzing model... {pct}%")

        analysis = analyze_model(
            evaluation_id=evaluation_id,
            model_path=model_path,
            dataset_type=dataset_type,
            architecture=ev.architecture,
            framework=ev.framework,
            metrics=metrics,
            progress_callback=analysis_progress,
        )

        _update_eval(
            evaluation_id,
            progress=25,
            current_stage="Analysis complete — mapping vulnerabilities",
            detected_task_type=analysis.get("detected_task_type"),
            scope_summary=analysis.get("scope_summary"),
            edge_case_analysis=analysis.get("edge_case_analysis"),
            vulnerability_vector=analysis.get("vulnerability_vector"),
            weakness_report=analysis.get("weakness_report"),
        )

        # ── STAGE 2: Dataset Fetching ────────────────────────────────────
        _update_eval(evaluation_id, status=EvaluationStatus.FETCHING_DATA, progress=26, current_stage="Fetching targeted datasets...")

        def fetch_progress(pct):
            _update_eval(evaluation_id, progress=25 + int(pct * 0.25), current_stage=f"Fetching datasets... {pct}%")

        datasets = fetch_datasets(
            evaluation_id=evaluation_id,
            dataset_type=dataset_type,
            vulnerability_vector=analysis.get("vulnerability_vector", {}),
            progress_callback=fetch_progress,
        )

        # Persist dataset records
        db2 = SessionLocal()
        try:
            for ds in datasets:
                record = DatasetRecord(
                    evaluation_id=evaluation_id,
                    source=ds.get("source", "unknown"),
                    dataset_name=ds.get("name"),
                    dataset_url=ds.get("url"),
                    size_bytes=int(ds.get("size_mb", 0) * 1024 * 1024),
                    sample_count=ds.get("samples"),
                    target_stressor=ds.get("target_stressor"),
                    description=ds.get("description"),
                )
                db2.add(record)
            db2.commit()
        finally:
            db2.close()

        total_samples = sum(ds.get("samples", 0) for ds in datasets)
        _update_eval(
            evaluation_id,
            progress=50,
            current_stage=f"Datasets ready — {len(datasets)} sources, {total_samples:,} samples",
            fetched_datasets=datasets,
            total_test_samples=total_samples,
        )

        # ── STAGE 3: Stress Testing ──────────────────────────────────────
        _update_eval(evaluation_id, status=EvaluationStatus.STRESS_TESTING, progress=51, current_stage="Running stress tests...")

        def stress_progress(pct):
            _update_eval(evaluation_id, progress=50 + int(pct * 0.35), current_stage=f"Stress testing... {pct}%")

        stress_output = run_stress_tests(
            evaluation_id=evaluation_id,
            model_path=model_path,
            dataset_type=dataset_type,
            vulnerability_vector=analysis.get("vulnerability_vector", {}),
            original_metrics=metrics,
            progress_callback=stress_progress,
        )

        # Persist stress test results
        db3 = SessionLocal()
        try:
            for r in stress_output.get("stress_results", []):
                result = StressTestResult(
                    evaluation_id=evaluation_id,
                    stressor_key=r["stressor_key"],
                    stressor_label=r.get("stressor_label"),
                    severity=r.get("severity"),
                    original_score=r.get("original_score"),
                    stressed_score=r.get("stressed_score"),
                    degradation_pct=r.get("degradation_pct"),
                    confidence_stability=r.get("confidence_stability"),
                    sample_count=r.get("sample_count", 0),
                    passed=r.get("passed", True),
                    notes=r.get("notes"),
                )
                db3.add(result)
            db3.commit()
        finally:
            db3.close()

        risk_level_str = stress_output.get("risk_level", "high")
        try:
            risk_level_enum = RiskLevel(risk_level_str)
        except ValueError:
            risk_level_enum = RiskLevel.HIGH

        _update_eval(
            evaluation_id,
            progress=85,
            current_stage="Stress tests complete — generating report",
            stress_results=stress_output.get("stress_results"),
            robustness_score=stress_output.get("robustness_score"),
            risk_level=risk_level_enum,
            deployment_ready=stress_output.get("deployment_ready"),
        )

        # ── STAGE 4: Report Generation ───────────────────────────────────
        _update_eval(evaluation_id, status=EvaluationStatus.GENERATING_REPORT, progress=86, current_stage="Generating evaluation report...")

        db4 = SessionLocal()
        try:
            ev_final = db4.query(ModelEvaluation).filter(ModelEvaluation.id == evaluation_id).first()
            report_data = {
                "name":               ev_final.name if ev_final else "",
                "architecture":       ev_final.architecture if ev_final else "",
                "framework":          ev_final.framework if ev_final else "",
                "dataset_type":       ev_final.dataset_type if ev_final else "",
                "model_filename":     ev_final.model_filename if ev_final else "",
                "model_size_bytes":   ev_final.model_size_bytes if ev_final else 0,
                "original_metrics":   metrics,
                "detected_task_type": analysis.get("detected_task_type"),
                "domain":             analysis.get("domain"),
                "scope_summary":      analysis.get("scope_summary"),
                "edge_case_analysis": analysis.get("edge_case_analysis", []),
                "weakness_report":    analysis.get("weakness_report", {}),
                "fetched_datasets":   datasets,
                "stress_results":     stress_output.get("stress_results", []),
                "robustness_score":   stress_output.get("robustness_score"),
                "risk_level":         risk_level_str,
                "deployment_ready":   stress_output.get("deployment_ready"),
            }
        finally:
            db4.close()

        report_url = generate_report(evaluation_id, report_data)

        _update_eval(
            evaluation_id,
            status=EvaluationStatus.READY,
            progress=100,
            current_stage="Evaluation complete",
            report_url=report_url,
            report_generated_at=datetime.utcnow(),
        )
        logger.info(f"[Pipeline] Evaluation {evaluation_id} complete. Robustness: {stress_output.get('robustness_score')}%")

    except Exception as e:
        logger.error(f"[Pipeline] FAILED for {evaluation_id}: {e}", exc_info=True)
        _update_eval(
            evaluation_id,
            status=EvaluationStatus.FAILED,
            error_message=str(e),
            current_stage="Pipeline failed",
        )


@app.post("/api/evaluations/{evaluation_id}/run")
def run_evaluation(
    evaluation_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Trigger the full 4-stage evaluation pipeline."""
    ev = _get_eval_or_404(evaluation_id, db)

    if ev.status in [EvaluationStatus.ANALYZING, EvaluationStatus.FETCHING_DATA,
                     EvaluationStatus.STRESS_TESTING, EvaluationStatus.GENERATING_REPORT]:
        return {"message": "Pipeline already running", "status": ev.status}

    ev.status = EvaluationStatus.ANALYZING
    ev.progress = 0
    ev.current_stage = "Pipeline queued..."
    ev.error_message = None
    db.commit()

    background_tasks.add_task(_run_full_pipeline, evaluation_id)
    return {"message": "Evaluation pipeline started", "evaluation_id": evaluation_id}


# ─── Status polling ───────────────────────────────────────────────────────────

@app.get("/api/evaluations/{evaluation_id}/status")
def get_status(evaluation_id: str, db: Session = Depends(get_db)):
    ev = _get_eval_or_404(evaluation_id, db)
    return {
        "evaluation_id":  evaluation_id,
        "status":         ev.status,
        "progress":       ev.progress,
        "current_stage":  ev.current_stage,
        "error_message":  ev.error_message,
        "robustness_score": ev.robustness_score,
        "risk_level":     ev.risk_level,
        "deployment_ready": ev.deployment_ready,
    }


# ─── Report download ──────────────────────────────────────────────────────────

@app.get("/api/evaluations/{evaluation_id}/report")
def download_report(evaluation_id: str, db: Session = Depends(get_db)):
    """Stream the CSV report for download."""
    ev = _get_eval_or_404(evaluation_id, db)
    if ev.status != EvaluationStatus.READY:
        raise HTTPException(status_code=400, detail="Report not ready yet")

    csv_path = os.path.join(DATA_DIR, f"reports/{evaluation_id}/summary.csv")
    if not os.path.exists(csv_path):
        raise HTTPException(status_code=404, detail="Report file not found")

    with open(csv_path, "r") as f:
        content = f.read()

    filename = f"BlindSpot_Report_{ev.name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.csv"
    return StreamingResponse(
        iter([content]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# ─── Gemini edge case brainstorm ──────────────────────────────────────────────

@app.get("/api/evaluations/{evaluation_id}/brainstorm")
def brainstorm_edge_cases(evaluation_id: str, db: Session = Depends(get_db)):
    from services.gemini_service import gemini_service
    ev = _get_eval_or_404(evaluation_id, db)
    scenarios = gemini_service.generate_edge_cases(ev.name, ev.description or "")
    return {"scenarios": scenarios}


# ─── Stressors reference ──────────────────────────────────────────────────────

@app.get("/api/stressors")
def list_stressors():
    from services.adversarial_agent import STRESSORS
    return {"stressors": STRESSORS}


# ─── Legacy compatibility (old /api/projects routes redirect) ─────────────────

@app.get("/api/projects")
def legacy_list():
    return []


@app.post("/api/projects")
def legacy_create():
    raise HTTPException(status_code=410, detail="Use /api/evaluations instead")
