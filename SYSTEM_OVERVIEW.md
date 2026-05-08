# BlindSpot.AI System Overview

**Industrial-grade synthetic data generation for AI robustness.**

BlindSpot.AI is a specialized platform designed to identify "blind spots" in computer vision models and generate targeted synthetic datasets to retrain and fix those vulnerabilities.

---

## 🚀 How It Runs

### 1. Development Mode (Current Setup)
To run the system locally without high-end GPU hardware, I have configured it in **Mock Mode**:
*   **Backend**: Python FastAPI.
*   **Database**: SQLite (`blindspot.db`).
*   **Storage**: Local filesystem storage (`backend/data/`).
*   **ML Engine**: Uses simulated outputs for LoRA training and image generation to allow testing on standard laptops.

**To Run:**
```powershell
# Terminal 1: Backend
cd backend
.\venv\Scripts\python.exe -m uvicorn main:app --port 8000 --reload

# Terminal 2: Frontend
cd frontend
npm run dev  # Runs on http://localhost:3001
```

### 2. Production / GPU Mode
In a production environment with an NVIDIA GPU (16GB+ VRAM):
*   Change `MOCK_ML=false` in `.env`.
*   Uses **Stable Diffusion XL** for photorealistic image generation.
*   Uses **Mask R-CNN** for pixel-accurate auto-labeling.
*   Uses **Blender** for physics-grounded weather stressors.

---

## ✨ Key Features

### 🛡️ Adversarial Scan
Probes your existing model (via an API endpoint) by applying 20+ different stressors (rain, fog, low light, occlusion) to your seed images. It identifies exactly which conditions make your model's confidence drop.

### 🎨 Generative Engine
Trains a **LoRA (Low-Rank Adaptation)** on your uploaded seed images. This allows the AI to "learn" the specific visual identity of your target object (e.g., a specific industrial drone or a specialized medical tool).

### ⛈️ Physics Refinement Layer
Unlike standard "filters," this layer applies physics-grounded stressors:
*   **Atmospheric**: Heavy Rain, Dense Fog, Snow.
*   **Lighting**: Night (Low Light), High Contrast, Lens Flare.
*   **Physical**: 50% Occlusion, Motion Blur, Glass Refraction.

### 🏷️ Auto-Labeling
Automatically generates high-fidelity annotations for every generated image:
*   **COCO JSON**: Full instance segmentation masks.
*   **YOLO TXT**: Bounding boxes for real-time models.

---

## 🔄 User Flow

The platform follows a linear industrial workflow:

| Step | Action | User Input | System Output |
| :--- | :--- | :--- | :--- |
| **1** | **Project Creation** | Project Name & Description | Unique Workspace ID |
| **2** | **Data Seeding** | 5-10 images of the object | Visual identity learned by AI |
| **3** | **Model Probing** | Model API Endpoint URL (Optional) | Vulnerability Vector (Blind Spots) |
| **4** | **Generation** | Select quantity & stressors | Target synthetic image batch |
| **5** | **Auto-Labeling** | (Automatic) | COCO + YOLO annotation files |
| **6** | **Export** | Click Download | **Dataset ZIP** ready for training |

---

## 📦 Output Structure
When you download a dataset, you receive:
```text
dataset_uuid.zip
├── train/
│   ├── images/      # Targeted synthetic images
│   └── labels/      # YOLO format annotations
├── annotations.json # COCO format Instance Segmentation
├── metadata.json    # Stressor stats and confidence scores
└── readme.txt       # Summary of the blind spots addressed
```

---

## 🛠️ Technology Stack
*   **Frontend**: React 18, Tailwind CSS, Lucide Icons, Recharts (for vulnerability maps).
*   **Backend**: FastAPI, SQLAlchemy, Celery (Task Queue).
*   **AI Stack**: SDXL, LoRA, ControlNet, Mask R-CNN.
*   **Storage**: MinIO (S3 Compatible) / Local Disk.
