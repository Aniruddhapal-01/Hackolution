"""
BlindSpot.AI — SQLAlchemy Models
Model-centric robustness evaluation platform.
"""
from sqlalchemy import (
    create_engine, Column, String, Float, Integer,
    DateTime, JSON, Enum, ForeignKey, Text, Boolean
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from sqlalchemy.sql import func
import enum
import uuid
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./blindspot.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ─── Enums ────────────────────────────────────────────────────────────────────

class EvaluationStatus(str, enum.Enum):
    CREATED       = "created"
    ANALYZING     = "analyzing"
    FETCHING_DATA = "fetching_data"
    STRESS_TESTING = "stress_testing"
    GENERATING_REPORT = "generating_report"
    READY         = "ready"
    FAILED        = "failed"


class DatasetType(str, enum.Enum):
    IMAGE         = "image"
    TABULAR       = "tabular"
    SEQUENTIAL    = "sequential"
    TIME_SERIES   = "time_series"
    VECTOR        = "vector"


class RiskLevel(str, enum.Enum):
    LOW           = "low"
    MEDIUM        = "medium"
    HIGH          = "high"
    CRITICAL      = "critical"


# ─── ModelEvaluation (core entity, replaces Project) ─────────────────────────

class ModelEvaluation(Base):
    """
    Central entity representing one end-to-end model robustness evaluation run.
    """
    __tablename__ = "model_evaluations"

    id              = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name            = Column(String(200), nullable=False)          # user-given name
    description     = Column(Text, nullable=True)

    # ── Model metadata (from Step 1 form) ──────────────────────────────────
    dataset_type    = Column(Enum(DatasetType), nullable=True)
    architecture    = Column(String(200), nullable=True)
    optimizer       = Column(String(100), nullable=True)
    learning_rate   = Column(Float, nullable=True)
    epochs          = Column(Integer, nullable=True)
    batch_size      = Column(Integer, nullable=True)
    framework       = Column(String(100), nullable=True)           # pytorch / tensorflow / sklearn
    embedding_dim   = Column(Integer, nullable=True)
    input_size      = Column(String(100), nullable=True)           # e.g. "224x224" or "512"

    # ── Existing metrics (from Step 1 form) ────────────────────────────────
    metric_accuracy = Column(Float, nullable=True)
    metric_precision= Column(Float, nullable=True)
    metric_recall   = Column(Float, nullable=True)
    metric_f1       = Column(Float, nullable=True)
    metric_map      = Column(Float, nullable=True)
    metric_roc_auc  = Column(Float, nullable=True)

    # ── Uploaded model file ────────────────────────────────────────────────
    model_filename  = Column(String(500), nullable=True)
    model_storage_key = Column(String(500), nullable=True)
    model_size_bytes  = Column(Integer, nullable=True)

    # ── Pipeline state ─────────────────────────────────────────────────────
    status          = Column(Enum(EvaluationStatus), default=EvaluationStatus.CREATED, nullable=False)
    progress        = Column(Integer, default=0)
    current_stage   = Column(String(200), nullable=True)
    error_message   = Column(Text, nullable=True)

    # ── Analysis results ───────────────────────────────────────────────────
    detected_task_type      = Column(String(100), nullable=True)   # classification / detection / regression
    scope_summary           = Column(Text, nullable=True)
    edge_case_analysis      = Column(JSON, nullable=True)          # list of {name, severity, description}
    vulnerability_vector    = Column(JSON, nullable=True)          # {stressor: score}
    weakness_report         = Column(JSON, nullable=True)          # structured weakness data

    # ── Dataset results ────────────────────────────────────────────────────
    fetched_datasets        = Column(JSON, nullable=True)          # list of {source, name, url, size}
    generated_dataset_url   = Column(String(1000), nullable=True)
    total_test_samples      = Column(Integer, default=0)

    # ── Stress test results ────────────────────────────────────────────────
    stress_results          = Column(JSON, nullable=True)          # per-stressor metrics
    augmentation_comparison = Column(JSON, nullable=True)          # before/after dataset augmentation comparison
    robustness_score        = Column(Float, nullable=True)         # 0-100
    risk_level              = Column(Enum(RiskLevel), nullable=True)
    deployment_ready        = Column(Boolean, nullable=True)

    # ── Report ─────────────────────────────────────────────────────────────
    report_url              = Column(String(1000), nullable=True)
    report_generated_at     = Column(DateTime(timezone=True), nullable=True)

    # ── Timestamps ─────────────────────────────────────────────────────────
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # ── Relationships ───────────────────────────────────────────────────────
    stress_test_results = relationship("StressTestResult", back_populates="evaluation", cascade="all, delete-orphan")
    dataset_records     = relationship("DatasetRecord", back_populates="evaluation", cascade="all, delete-orphan")


# ─── StressTestResult ─────────────────────────────────────────────────────────

class StressTestResult(Base):
    """
    Individual stress test result for one stressor/scenario against the model.
    """
    __tablename__ = "stress_test_results"

    id              = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    evaluation_id   = Column(String, ForeignKey("model_evaluations.id"), nullable=False)

    stressor_key    = Column(String(100), nullable=False)          # e.g. "fog_dense"
    stressor_label  = Column(String(200), nullable=True)
    severity        = Column(Float, nullable=True)

    # Metrics before vs after stress
    original_score  = Column(Float, nullable=True)
    stressed_score  = Column(Float, nullable=True)
    degradation_pct = Column(Float, nullable=True)                 # % drop
    confidence_stability = Column(Float, nullable=True)

    sample_count    = Column(Integer, default=0)
    passed          = Column(Boolean, default=True)
    notes           = Column(Text, nullable=True)

    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    evaluation      = relationship("ModelEvaluation", back_populates="stress_test_results")


# ─── DatasetRecord ────────────────────────────────────────────────────────────

class DatasetRecord(Base):
    """
    Tracks each dataset fetched or generated for an evaluation.
    """
    __tablename__ = "dataset_records"

    id              = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    evaluation_id   = Column(String, ForeignKey("model_evaluations.id"), nullable=False)

    source          = Column(String(50), nullable=False)           # "kaggle" | "huggingface" | "roboflow" | "synthetic"
    dataset_name    = Column(String(300), nullable=True)
    dataset_url     = Column(String(1000), nullable=True)
    storage_key     = Column(String(500), nullable=True)
    size_bytes      = Column(Integer, nullable=True)
    sample_count    = Column(Integer, nullable=True)
    target_stressor = Column(String(100), nullable=True)           # which weakness this targets
    description     = Column(Text, nullable=True)

    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    evaluation      = relationship("ModelEvaluation", back_populates="dataset_records")


# ─── DB helpers ───────────────────────────────────────────────────────────────

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
