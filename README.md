# BlindSpot.AI — AI Model Robustness Evaluation Platform

> **HACKOLUTION 2026** · Built to find your model's blind spots before failure finds you.

[![Python](https://img.shields.io/badge/Python-3.11+-blue?style=flat-square)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.136-green?style=flat-square)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square)](https://react.dev)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

---

## What is BlindSpot.AI?

BlindSpot.AI is a full-stack platform that automatically evaluates the robustness of any trained ML model. You upload a model file, describe it, and the platform:

1. **Inspects the model internals** — reads feature importances, coefficients, and scaler statistics to understand what the model relies on
2. **Identifies specific weaknesses** — generates a model-specific vulnerability score for each stressor based on what was found inside the model
3. **Generates targeted datasets** — creates synthetic edge-case datasets calibrated to the model's exact failure modes
4. **Runs stress tests** — simulates accuracy degradation under each condition
5. **Generates a report** — produces a deployment readiness PDF/DOCX with robustness score and action items
6. **Generates improvement datasets** — creates balanced training data (50% clean + 50% corrupted, 3 difficulty levels) to fix detected weaknesses

No GPU required. Runs fully in mock mode. Results in under 30 seconds.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Demo Models](#demo-models)
- [How It Works](#how-it-works)
- [API Reference](#api-reference)
- [Dataset Generation Accuracy](#dataset-generation-accuracy)
- [Configuration](#configuration)
- [Tech Stack](#tech-stack)

---

## Features

### Core Pipeline (5 stages)

| Stage | What happens |
|---|---|
| **1. Model Upload** | Upload `.pt` `.pth` `.onnx` `.h5` `.pkl` `.joblib` — up to 500 MB |
| **2. Analysis** | Model internals inspected, domain detected, vulnerability vector computed |
| **3. Dataset Fetch** | Synthetic datasets generated + real dataset suggestions from Kaggle/HuggingFace |
| **4. Stress Testing** | Per-stressor accuracy degradation computed, robustness score calculated |
| **5. Report** | PDF + DOCX deployment readiness report generated |

### Model-Specific Vulnerability Detection

Unlike generic robustness tools, BlindSpot.AI reads the actual model file:

- **RandomForest / GradientBoosting** → reads `feature_importances_` to find over-reliant features
- **LogisticRegression / Ridge** → reads `coef_` to find sparse or dominant coefficients
- **All models** → reads `StandardScaler.scale_` to detect uneven feature scales

These signals drive model-specific vulnerability scores — a model with `coef_max_ratio = 39` gets more adversarial perturbation samples than one with `coef_max_ratio = 3`.

### Supported Dataset Types

| Type | Stressors |
|---|---|
| **Image** | fog, rain, night, motion blur, occlusion, lens flare, noise, low contrast, compression |
| **Tabular** | missing values, OOD inputs, class imbalance, noisy categoricals, feature dropout |
| **Sequential** | OOV tokens, adversarial perturbation, long-range dependency, length mismatch |
| **Time-Series** | spike anomaly, concept drift, missing timesteps, seasonal disruption, HF noise |
| **Vector** | adversarial perturbation, embedding drift, dimensionality mismatch, sparse vectors |

### Training Improvement Datasets

For every stressor where the model fails (>20% degradation), the platform generates:
- **3 difficulty levels**: easy (15% corruption) → medium (35%) → hard (60%)
- **Balanced split**: exactly 50% clean + 50% corrupted samples
- **Retraining instructions**: specific augmentation library calls per stressor
- **Label accuracy**: 91%+ (100% label correctness + 100% balance + 88% corruption fidelity)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
│  Landing → Dashboard → Evaluation → Stress Test → Datasets     │
│                      → Improvement → Report                     │
└─────────────────────────────┬───────────────────────────────────┘
                              │ REST API (port 8000)
┌─────────────────────────────▼───────────────────────────────────┐
│                      BACKEND (FastAPI)                          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Model        │  │ Dataset      │  │ Stress Testing       │  │
│  │ Analysis     │  │ Fetch        │  │ Service              │  │
│  │ Service      │  │ Service      │  │                      │  │
│  │              │  │              │  │ stressed = baseline  │  │
│  │ Inspects     │  │ PIL/NumPy    │  │ × (1 - severity×0.45)│  │
│  │ .pkl internals│  │ augmentation │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Improvement  │  │ Report       │  │ Dataset Quality      │  │
│  │ Dataset      │  │ Generation   │  │ Evaluator            │  │
│  │ Service      │  │ (PDF + DOCX) │  │ (87.4% accuracy)     │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                 │
│  SQLite DB (blindspot.db)  ·  Local file storage               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
Hackolution/
├── backend/
│   ├── main.py                          # FastAPI app, all routes
│   ├── models.py                        # SQLAlchemy models
│   ├── storage.py                       # File storage abstraction
│   ├── blindspot.db                     # SQLite database
│   └── services/
│       ├── model_analysis_service.py    # Model inspection + vulnerability scoring
│       ├── dataset_fetch_service.py     # Synthetic dataset generation (PIL/NumPy)
│       ├── stress_testing_service.py    # Degradation simulation
│       ├── improvement_dataset_service.py # Training improvement datasets
│       ├── report_generation_service.py # PDF + DOCX report builder
│       ├── dataset_quality_evaluator.py # Benchmark accuracy measurement
│       └── gemini_service.py            # Edge case brainstorming (optional)
│
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── LandingPage.tsx          # Marketing landing page
│       │   ├── DashboardPage.tsx        # Evaluation list + create modal
│       │   ├── EvaluationPage.tsx       # Model upload + pipeline trigger
│       │   ├── StressTestPage.tsx       # Stress test results table + chart
│       │   ├── DatasetsPage.tsx         # Generated + suggested datasets
│       │   ├── ImprovementPage.tsx      # Training improvement datasets
│       │   └── ReportPage.tsx           # Report download
│       ├── components/
│       │   ├── Sidebar.tsx
│       │   ├── TopNavBar.tsx
│       │   ├── PixelSnow.tsx            # Canvas particle background
│       │   └── ui.tsx                  # Design system components
│       ├── hooks/useProject.ts          # Data fetching hooks
│       └── api/client.ts               # Axios API client
│
├── demo_models/                         # Pre-trained demo .pkl files
│   ├── wildlife_detector.pkl            # Image — 5-class species (41% acc)
│   ├── review_classifier.pkl            # Sequential — sentiment (80% acc)
│   ├── intrusion_detector.pkl           # Tabular — network IDS (95% acc)
│   ├── satellite_classifier.pkl         # Image — land use (41% acc, 32 MB)
│   ├── code_review_analyzer.pkl         # Sequential — code review (83% acc)
│   ├── churn_predictor.pkl              # Tabular — churn (78% acc)
│   └── lstm_vibration_autoencoder.pkl   # Time-series — IoT anomaly (99% acc)
│
├── create_fresh_demo_models.py          # Generate wildlife/review/intrusion models
├── create_large_demo_models.py          # Generate satellite/code/churn models
├── create_lstm_autoencoder.py           # Generate LSTM autoencoder demo
├── build_benchmark.py                   # Build ground truth benchmark (run once)
├── evaluate_generation_accuracy.py      # Measure dataset generation accuracy
├── evaluate_datasets.py                 # Quick accuracy check on existing datasets
├── accuracy.py                          # One-command accuracy display
├── accuracy.bat                         # Windows shortcut: type `accuracy`
├── HOW_IT_WORKS.md                      # Technical deep-dive
└── .env.example                         # Environment variable template
```

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Windows / macOS / Linux

### 1. Clone and set up environment

```bash
git clone <repo-url>
cd Hackolution
cp .env.example .env
```

### 2. Install backend dependencies

```bash
cd backend
pip install uvicorn fastapi sqlalchemy python-multipart python-docx reportlab pillow numpy scikit-learn joblib
```

### 3. Start the backend

```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

You should see:
```
INFO: BlindSpot.AI v2.0 — Database initialized
INFO: Uvicorn running on http://127.0.0.1:8000
```

### 4. Install and start the frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs at **http://localhost:3001**

### 5. Generate demo models (optional)

```bash
# 3 models: wildlife (image), review (sequential), intrusion (tabular)
python create_fresh_demo_models.py

# 3 large models with distinct inspection signatures
python create_large_demo_models.py

# LSTM autoencoder with engineered corner case
python create_lstm_autoencoder.py
```

---

## Demo Models

All demo models are pre-trained sklearn Pipelines (StandardScaler + estimator) saved as `.pkl` files. Each is engineered with specific internal characteristics to produce distinct vulnerability vectors.

### Model 1 — `wildlife_detector.pkl` (Image)

| Field | Value |
|---|---|
| Evaluation Name | Wildlife Species Detector — YOLOv8 |
| Dataset Type | Image Dataset |
| Architecture | YOLOv8 (HOG + RandomForest) |
| Framework | PyTorch |
| Optimizer | Adam |
| Learning Rate | 0.001 |
| Epochs | 60 |
| Batch Size | 16 |
| Input Size | 640x640 |
| Accuracy | 0.39 |
| F1 Score | 0.39 |
| mAP | 0.63 |
| ROC-AUC | 0.88 |

**What it simulates:** YOLOv8 camera trap species detector (deer/fox/bear/rabbit/bird)  
**Key inspection signals:** `gini_concentration=0.99` → importance spread across all features → moderate vulnerability across all image stressors

---

### Model 2 — `review_classifier.pkl` (Sequential)

| Field | Value |
|---|---|
| Evaluation Name | E-Commerce Review Classifier — BiLSTM |
| Dataset Type | Sequential Data |
| Architecture | BiLSTM + Attention |
| Framework | PyTorch |
| Optimizer | Adam |
| Learning Rate | 0.001 |
| Epochs | 25 |
| Batch Size | 128 |
| Input Size | 300 |
| Accuracy | 0.80 |
| F1 Score | 0.80 |
| ROC-AUC | 0.91 |

**What it simulates:** BiLSTM sentiment classifier on product reviews  
**Key inspection signals:** `coef_max_ratio=9.31` → over-reliant on specific tokens → `oov_tokens` CRITICAL (187 samples)

---

### Model 3 — `intrusion_detector.pkl` (Tabular)

| Field | Value |
|---|---|
| Evaluation Name | Network Intrusion Detector — GBM |
| Dataset Type | Categorical / Tabular Data |
| Architecture | GradientBoostingClassifier |
| Framework | Scikit-learn |
| Optimizer | Gradient Descent |
| Learning Rate | 0.08 |
| Epochs | 200 |
| Batch Size | 512 |
| Input Size | 41 |
| Accuracy | 0.95 |
| F1 Score | 0.94 |
| ROC-AUC | 0.94 |

**What it simulates:** KDD Cup-style network intrusion detection (normal/DoS/probe/R2L)  
**Key inspection signals:** `input_std_variance=785` → wildly different feature scales → `noisy_categorical` CRITICAL

---

### Model 4 — `satellite_classifier.pkl` (Image, Large)

| Field | Value |
|---|---|
| Evaluation Name | Satellite Land Use Classifier |
| Dataset Type | Image Dataset |
| Architecture | RandomForest (Spectral + Texture) |
| Framework | Scikit-learn |
| Input Size | 512 |
| Accuracy | 0.41 |
| mAP | 0.58 |
| ROC-AUC | 0.87 |

**Size:** ~32 MB (500 trees, depth=20)  
**Key inspection signals:** `n_classes=6`, `gini_concentration=0.99` → `low_contrast` HIGH severity

---

### Model 5 — `code_review_analyzer.pkl` (Sequential, Large)

| Field | Value |
|---|---|
| Evaluation Name | Code Review Sentiment Analyzer |
| Dataset Type | Sequential Data |
| Architecture | LogisticRegression (TF-IDF 1024-dim) |
| Framework | Scikit-learn |
| Epochs | 2000 |
| Input Size | 1024 |
| Accuracy | 0.83 |
| ROC-AUC | 0.93 |

**Key inspection signals:** `coef_sparsity=0.003`, `coef_max_ratio=9.31` → `oov_tokens` CRITICAL (187 samples), `adversarial_perturbation` CRITICAL

---

### Model 6 — `churn_predictor.pkl` (Tabular, Large)

| Field | Value |
|---|---|
| Evaluation Name | E-Commerce Churn Predictor — GBM |
| Dataset Type | Categorical / Tabular Data |
| Architecture | GradientBoostingClassifier |
| Framework | Scikit-learn |
| Learning Rate | 0.05 |
| Epochs | 300 |
| Input Size | 60 |
| Accuracy | 0.78 |
| ROC-AUC | 0.91 |

**Key inspection signals:** `input_std_variance=142.6` → `noisy_categorical` HIGH, `ood_inputs` HIGH

---

### Model 7 — `lstm_vibration_autoencoder.pkl` (Time-Series)

| Field | Value |
|---|---|
| Evaluation Name | LSTM Vibration Autoencoder — IoT |
| Dataset Type | Time-Series Data |
| Architecture | LSTM Autoencoder (Encoder-Decoder) |
| Framework | PyTorch |
| Optimizer | Adam |
| Learning Rate | 0.001 |
| Epochs | 50 |
| Batch Size | 64 |
| Input Size | 48 |
| Accuracy | 0.99 |

**Corner case:** Reconstruction collapse on sparse inputs — model silently fails when >60% of timesteps are zero (sensor dropout). Reports near-zero MSE on completely wrong reconstruction.

---

## How It Works

### Stage 1 — Model Inspection

The system loads the `.pkl` file and reads the actual trained parameters:

```python
# For tree models: feature importances
top_feature_concentration = feature_importances_.max()
zero_importance_ratio     = (feature_importances_ < 1e-6).mean()

# For linear models: coefficients
coef_sparsity  = (abs(coef_).flatten() < 1e-4).mean()
coef_max_ratio = abs(coef_).max() / abs(coef_).mean()

# For all models: scaler statistics
input_std_variance = StandardScaler.scale_.std()
```

### Stage 2 — Vulnerability Scoring

Each inspection signal maps to a vulnerability score (0=fragile, 1=robust):

```python
# Example: tabular model
ood_score     = 0.15 + (C / 10) + top_feature_concentration * 0.3 + (1 - accuracy) * 0.4
missing_score = 0.20 + input_std_variance * 0.4 + (1 - accuracy) * 0.3
oov_score     = 0.20 + coef_sparsity * 0.5 + (1 - accuracy) * 0.35
```

### Stage 3 — Dataset Generation

Sample count scales with vulnerability severity:

```python
severity  = 1.0 - vuln_score          # 0=robust, 1=critical
scale     = 0.5 + severity * 2.5      # 0.5x to 3.0x multiplier
n_samples = base_samples * scale
```

Corruption intensity also scales with severity — a CRITICAL stressor gets heavier corruption than a LOW stressor.

### Stage 4 — Stress Testing

```python
stressed_score = baseline * (1 - vulnerability_severity * 0.45)
floor          = baseline * 0.30   # never drops below 30% of baseline
passed         = degradation_pct <= 20.0
```

### Stage 5 — Robustness Score

```python
robustness = (avg_stressed_ratio * 0.6 + pass_rate * 0.4) * 100
```

| Score | Risk | Deployment |
|---|---|---|
| 80–100% | Low | ✅ Approved |
| 60–80% | Medium | ⚠️ Conditional |
| 40–60% | High | ❌ Not recommended |
| 0–40% | Critical | ❌ Not recommended |

Deployment approved only if `robustness_score >= 65`.

---

## API Reference

All endpoints are at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### Evaluations

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/evaluations` | Create a new evaluation |
| `GET` | `/api/evaluations` | List all evaluations |
| `GET` | `/api/evaluations/{id}` | Get evaluation details |
| `DELETE` | `/api/evaluations/{id}` | Delete evaluation |
| `POST` | `/api/evaluations/{id}/upload-model` | Upload model file |
| `POST` | `/api/evaluations/{id}/run` | Trigger full pipeline |
| `GET` | `/api/evaluations/{id}/status` | Poll pipeline status |

### Datasets

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/evaluations/{id}/regenerate-datasets` | Regenerate synthetic datasets |
| `GET` | `/api/evaluations/{id}/datasets/{dataset_id}/download` | Download dataset ZIP |
| `POST` | `/api/evaluations/{id}/generate-improvement-datasets` | Generate training improvement data |
| `GET` | `/api/evaluations/{id}/improvement-datasets` | List improvement datasets |

### Reports & Quality

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/evaluations/{id}/report?fmt=pdf` | Download PDF report |
| `GET` | `/api/evaluations/{id}/report?fmt=docx` | Download DOCX report |
| `GET` | `/api/evaluations/{id}/dataset-quality` | Get dataset generation accuracy |
| `GET` | `/api/health` | Health check |

---

## Dataset Generation Accuracy

The platform measures its own dataset generation quality against a fixed ground truth benchmark.

```bash
# Build benchmark (run once)
python build_benchmark.py

# Measure accuracy
python evaluate_generation_accuracy.py

# Quick check
python accuracy.py
# or just type: accuracy
```

### Current accuracy: **87.4%** (Grade: B — Good)

| Type | Accuracy | Notes |
|---|---|---|
| Image | 79.7% | fog/night/blur calibrated to GT pixel statistics |
| Tabular | 91.0% | missing/OOD/imbalance/noisy/dropout all 50/50 balanced |
| Sequential | 96.2% | OOV/adversarial/length all match GT ratios |

### Improvement dataset accuracy: **91%+**

| Dimension | Score | Weight |
|---|---|---|
| Label Correctness | 100% | 40% |
| Balance Accuracy | 100% | 25% |
| Corruption Fidelity | 88% | 35% |
| **Overall** | **95.8%** | |

---

## Configuration

Copy `.env.example` to `.env` and adjust:

```env
# Run without GPU (default)
MOCK_ML=true

# Number of images generated per stressor
IMAGES_PER_STRESSOR=8

# Frontend API URL
REACT_APP_API_URL=http://localhost:8000
```

### MOCK_ML modes

| Mode | What runs | Requirements |
|---|---|---|
| `MOCK_ML=true` | PIL/NumPy augmentation pipeline | Python only, no GPU |
| `MOCK_ML=false` | Stable Diffusion XL + LoRA + ControlNet | GPU with 8GB+ VRAM |

---

## Tech Stack

### Backend
- **FastAPI** — REST API framework
- **SQLAlchemy + SQLite** — database (upgradeable to PostgreSQL)
- **Pillow (PIL)** — image augmentation
- **NumPy / scikit-learn** — tabular/sequential data generation and model inspection
- **ReportLab** — PDF generation
- **python-docx** — DOCX generation
- **joblib** — model serialization

### Frontend
- **React 18** — UI framework
- **TypeScript** — type safety
- **styled-components** — CSS-in-JS
- **Recharts** — stress test visualization charts
- **Lucide React** — icons
- **Axios** — API client

### Architecture decisions
- **SQLite over PostgreSQL** — zero-config for hackathon, schema-compatible for production upgrade
- **Local file storage** — datasets stored on disk, served via FastAPI static files
- **MOCK_ML=true default** — runs on any laptop without GPU
- **PIL augmentation** — deterministic, fast, no model weights needed

---

## Accuracy Inputs — Important Note

When creating an evaluation, enter accuracy as a **decimal between 0 and 1**:

| ✅ Correct | ❌ Wrong |
|---|---|
| `0.99` | `99` |
| `0.85` | `85` |
| `0.72` | `72` |

Entering `99` instead of `0.99` will store `-22.0` internally and show `-2200%` in the stress test dashboard.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Built at HACKOLUTION 2026

BlindSpot.AI was built as a hackathon project to demonstrate that ML robustness evaluation doesn't require a GPU, a research team, or weeks of work. The entire pipeline — from model inspection to synthetic dataset generation to PDF report — runs in under 30 seconds on a standard laptop.

> *"Find your model's blind spots before failure finds you."*
