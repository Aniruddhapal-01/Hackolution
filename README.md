# BlindSpot.AI

**Industrial-grade synthetic data generation for AI robustness**

BlindSpot.AI solves the Edge-Case Crisis in modern AI. It generates photorealistic, physics-grounded synthetic training data targeting the exact blind spots of your model — without staging dangerous real-world events.

---

## Quick Start

```bash
git clone https://github.com/yourname/blindspot-ai.git
cd blindspot-ai
cp .env.example .env
docker compose up --build
```

Open http://localhost:3000

. \venv\scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000

---

## What It Does

1. Upload 5-10 seed images of your target object
2. Run the Adversarial Scan — probes your model to find confidence drop zones
3. Generate — SDXL + LoRA + ControlNet creates targeted synthetic images
4. Physics Refine — applies accurate rain, fog, night, lens flare, occlusion
5. Auto-Label — Mask R-CNN generates COCO JSON + YOLO labels automatically
6. Export — download ready-to-train dataset ZIP

---

## Services

| Service | URL |
|---|---|
| Dashboard | http://localhost:3000 |
| API Docs | http://localhost:3000/api/docs |
| MinIO Console | http://localhost:9001 |

---

## Mock Mode (default)

`MOCK_ML=true` (default) runs the full pipeline without a GPU — generates placeholder images for testing and demo.

Set `MOCK_ML=false` for real Stable Diffusion XL inference (requires NVIDIA GPU with 16GB+ VRAM).

---

## Project Structure

```
blindspot-ai/
├── backend/
│   ├── main.py                 # FastAPI + all endpoints
│   ├── models.py               # SQLAlchemy models
│   ├── tasks.py                # Celery pipeline tasks
│   ├── storage.py              # MinIO S3 utilities
│   └── services/
│       ├── lora_trainer.py     # SDXL LoRA fine-tuning
│       ├── adversarial_agent.py # Model probing
│       ├── generative_engine.py # Image generation
│       ├── physics_layer.py    # Physics stressors
│       └── auto_labeler.py     # COCO/YOLO labeling
├── frontend/
│   └── src/
│       ├── pages/              # ProjectsPage, ProjectDetailPage
│       ├── components/ui.tsx   # Shared UI components
│       ├── hooks/useProject.ts # Auto-polling hook
│       └── api/client.ts       # Axios API client
├── docker-compose.yml
└── .env.example
```

---

## Environment Variables

See `.env.example` for full list. Key variables:

| Variable | Default | Description |
|---|---|---|
| MOCK_ML | true | Skip real ML inference |
| IMAGES_PER_STRESSOR | 8 | Images per blind-spot category |
| USE_BLENDER | false | Enable Blender physics rendering |

---

Camp Nou Coders · HACKTONIX 2026 · NSEC Kolkata
