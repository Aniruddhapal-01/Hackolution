from sqlalchemy import (
    create_engine, Column, String, Float, Integer,
    DateTime, JSON, Enum, ForeignKey, Text
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from sqlalchemy.sql import func
import enum
import uuid
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./blindspot.db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class ProjectStatus(str, enum.Enum):
    CREATED = "created"
    TRAINING_LORA = "training_lora"
    SCANNING = "scanning"
    GENERATING = "generating"
    LABELING = "labeling"
    READY = "ready"
    FAILED = "failed"


class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(ProjectStatus), default=ProjectStatus.CREATED, nullable=False)
    model_endpoint = Column(String(500), nullable=True)
    lora_weights_path = Column(String(500), nullable=True)
    vulnerability_vector = Column(JSON, nullable=True)
    celery_task_id = Column(String(200), nullable=True)
    progress = Column(Integer, default=0)
    current_stage = Column(String(100), nullable=True)
    dataset_url = Column(String(1000), nullable=True)
    image_count = Column(Integer, default=0)
    label_count = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    seed_images = relationship("SeedImage", back_populates="project", cascade="all, delete-orphan")
    generated_images = relationship("GeneratedImage", back_populates="project", cascade="all, delete-orphan")


class SeedImage(Base):
    __tablename__ = "seed_images"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    filename = Column(String(500), nullable=False)
    storage_key = Column(String(500), nullable=False)
    url = Column(String(1000), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="seed_images")


class GeneratedImage(Base):
    __tablename__ = "generated_images"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    stressor = Column(String(100), nullable=True)
    storage_key = Column(String(500), nullable=False)
    annotation_key = Column(String(500), nullable=True)
    confidence_score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="generated_images")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
