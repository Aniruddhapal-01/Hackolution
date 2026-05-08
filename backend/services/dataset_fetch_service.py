"""
Dataset Fetch Service
Fetches targeted datasets from Kaggle, HuggingFace, and Roboflow
based on detected model vulnerabilities.
"""
import os
import time
import logging
import random
from typing import Dict, List, Any

logger = logging.getLogger(__name__)
USE_MOCK = os.getenv("MOCK_ML", "true").lower() == "true"

# ─── Dataset catalog per stressor ─────────────────────────────────────────────

DATASET_CATALOG = {
    # Image stressors
    "fog_dense": [
        {"source": "kaggle",       "name": "Foggy Driving Dataset",         "url": "https://www.kaggle.com/datasets/sshikamaru/foggy-driving",          "size_mb": 1200, "samples": 3808},
        {"source": "huggingface",  "name": "Dense Fog Detection Dataset",   "url": "https://huggingface.co/datasets/keremberke/dense-fog-detection",    "size_mb": 850,  "samples": 2100},
        {"source": "roboflow",     "name": "Fog Augmented Vision",          "url": "https://universe.roboflow.com/fog-detection/fog-augmented-vision",   "size_mb": 420,  "samples": 1500},
    ],
    "rain_heavy": [
        {"source": "kaggle",       "name": "Rain Image Dataset",            "url": "https://www.kaggle.com/datasets/quadeer15sh/augmented-forest-segmentation", "size_mb": 980, "samples": 2800},
        {"source": "huggingface",  "name": "Rainy Weather Detection",       "url": "https://huggingface.co/datasets/keremberke/rainy-weather-detection", "size_mb": 760,  "samples": 2200},
        {"source": "roboflow",     "name": "Rain Streak Augmentation",      "url": "https://universe.roboflow.com/rain-detection/rain-streak-aug",       "size_mb": 310,  "samples": 1100},
    ],
    "occlusion_80": [
        {"source": "kaggle",       "name": "Occluded Object Detection",     "url": "https://www.kaggle.com/datasets/occluded-objects/detection",         "size_mb": 1500, "samples": 4200},
        {"source": "roboflow",     "name": "Partial Occlusion Dataset",     "url": "https://universe.roboflow.com/occlusion/partial-occlusion-v2",       "size_mb": 680,  "samples": 2400},
    ],
    "occlusion_50": [
        {"source": "roboflow",     "name": "50pct Occlusion Benchmark",     "url": "https://universe.roboflow.com/occlusion/50pct-benchmark",            "size_mb": 540,  "samples": 1800},
        {"source": "huggingface",  "name": "Occluded COCO Subset",          "url": "https://huggingface.co/datasets/occluded-coco/subset",               "size_mb": 920,  "samples": 3100},
    ],
    "night_low": [
        {"source": "kaggle",       "name": "ExDark Low-Light Dataset",      "url": "https://www.kaggle.com/datasets/soumikrakshit/exdark",               "size_mb": 2100, "samples": 7363},
        {"source": "huggingface",  "name": "NightOwls Pedestrian Dataset",  "url": "https://huggingface.co/datasets/nightowls/pedestrian",               "size_mb": 1800, "samples": 5000},
    ],
    "motion_blur": [
        {"source": "kaggle",       "name": "Motion Blur Benchmark",         "url": "https://www.kaggle.com/datasets/motion-blur/benchmark",              "size_mb": 760,  "samples": 2500},
        {"source": "roboflow",     "name": "Blur Augmented Detection",      "url": "https://universe.roboflow.com/blur/augmented-detection",             "size_mb": 380,  "samples": 1200},
    ],
    "lens_flare": [
        {"source": "roboflow",     "name": "Lens Flare Robustness Set",     "url": "https://universe.roboflow.com/flare/lens-flare-robustness",          "size_mb": 290,  "samples": 900},
    ],
    # Tabular stressors
    "missing_values": [
        {"source": "kaggle",       "name": "UCI Missing Data Repository",   "url": "https://www.kaggle.com/datasets/uci-ml/missing-data-benchmark",      "size_mb": 45,   "samples": 50000},
        {"source": "huggingface",  "name": "Tabular Missing Values Bench",  "url": "https://huggingface.co/datasets/inria-soda/tabular-benchmark",       "size_mb": 120,  "samples": 80000},
    ],
    "ood_inputs": [
        {"source": "kaggle",       "name": "OOD Tabular Benchmark",         "url": "https://www.kaggle.com/datasets/ood-tabular/benchmark",              "size_mb": 80,   "samples": 60000},
        {"source": "huggingface",  "name": "WILDS OOD Dataset",             "url": "https://huggingface.co/datasets/wilds/ood-benchmark",                "size_mb": 200,  "samples": 100000},
    ],
    # Time series stressors
    "spike_anomaly": [
        {"source": "kaggle",       "name": "Numenta Anomaly Benchmark",     "url": "https://www.kaggle.com/datasets/boltzmannbrain/nab",                 "size_mb": 12,   "samples": 365000},
        {"source": "huggingface",  "name": "SKAB Anomaly Benchmark",        "url": "https://huggingface.co/datasets/skab/anomaly-benchmark",             "size_mb": 8,    "samples": 200000},
    ],
    "concept_drift": [
        {"source": "kaggle",       "name": "Electricity Concept Drift",     "url": "https://www.kaggle.com/datasets/concept-drift/electricity",          "size_mb": 25,   "samples": 45312},
        {"source": "huggingface",  "name": "River Drift Streams",           "url": "https://huggingface.co/datasets/river/drift-streams",                "size_mb": 15,   "samples": 100000},
    ],
    # Generic
    "adversarial_perturbation": [
        {"source": "kaggle",       "name": "Adversarial Examples Dataset",  "url": "https://www.kaggle.com/datasets/adversarial/examples-benchmark",     "size_mb": 340,  "samples": 10000},
        {"source": "huggingface",  "name": "AdvGLUE Adversarial NLP",       "url": "https://huggingface.co/datasets/adv_glue",                           "size_mb": 5,    "samples": 14000},
    ],
}

SYNTHETIC_DESCRIPTIONS = {
    "image":       "Physics-based synthetic images generated with PIL stressors targeting identified visual weaknesses.",
    "tabular":     "Synthetically corrupted tabular data with injected missing values, noise, and distribution shifts.",
    "time_series": "Synthetically generated time series with injected anomalies, drift patterns, and noise sequences.",
    "sequential":  "Adversarially perturbed text sequences with OOV tokens and length variations.",
    "vector":      "Perturbed embedding vectors with controlled L2-norm perturbations and dimensionality variations.",
}


def fetch_datasets(
    evaluation_id: str,
    dataset_type: str,
    vulnerability_vector: Dict[str, float],
    progress_callback=None,
) -> List[Dict[str, Any]]:
    """
    Fetch or simulate fetching datasets for each detected vulnerability.
    Returns list of dataset records.
    """
    if USE_MOCK:
        return _mock_fetch(evaluation_id, dataset_type, vulnerability_vector, progress_callback)

    return _real_fetch(evaluation_id, dataset_type, vulnerability_vector, progress_callback)


def _mock_fetch(evaluation_id, dataset_type, vulnerability_vector, progress_callback):
    """Simulate dataset fetching with realistic catalog data."""
    logger.info(f"[DatasetFetch MOCK] Fetching datasets for {evaluation_id}")
    fetched = []
    stressors = list(vulnerability_vector.keys())
    total = len(stressors) + 1  # +1 for synthetic

    for i, stressor_key in enumerate(stressors):
        time.sleep(0.4)
        catalog = DATASET_CATALOG.get(stressor_key, [])
        if catalog:
            # Pick the best match (first entry)
            entry = catalog[0].copy()
            entry["target_stressor"] = stressor_key
            entry["description"] = f"Targeted dataset for {stressor_key.replace('_', ' ')} vulnerability. {entry['samples']:,} samples."
            fetched.append(entry)

        if progress_callback:
            progress_callback(int((i + 1) / total * 80))

    # Always add a synthetic dataset
    time.sleep(0.3)
    fetched.append({
        "source":           "synthetic",
        "name":             f"BlindSpot Synthetic — {dataset_type.replace('_', ' ').title()}",
        "url":              f"http://localhost:8000/media/datasets/{evaluation_id}/dataset_{evaluation_id}.zip",
        "size_mb":          random.randint(80, 400),
        "samples":          random.randint(500, 2000),
        "target_stressor":  "all",
        "description":      SYNTHETIC_DESCRIPTIONS.get(dataset_type, "Synthetically generated stress-test dataset."),
    })

    if progress_callback:
        progress_callback(100)

    return fetched


def _real_fetch(evaluation_id, dataset_type, vulnerability_vector, progress_callback):
    """Attempt real dataset fetching via APIs."""
    fetched = []
    stressors = list(vulnerability_vector.keys())
    total = len(stressors)

    for i, stressor_key in enumerate(stressors):
        catalog = DATASET_CATALOG.get(stressor_key, [])
        for entry in catalog[:1]:  # Take first match per stressor
            try:
                # Validate URL is reachable (HEAD request)
                import httpx
                resp = httpx.head(entry["url"], timeout=5.0, follow_redirects=True)
                if resp.status_code < 400:
                    record = entry.copy()
                    record["target_stressor"] = stressor_key
                    record["description"] = f"Fetched from {entry['source']}. {entry['samples']:,} samples targeting {stressor_key}."
                    fetched.append(record)
            except Exception as e:
                logger.warning(f"[DatasetFetch] Could not reach {entry['url']}: {e}")
                # Fall back to catalog entry without validation
                record = entry.copy()
                record["target_stressor"] = stressor_key
                record["description"] = f"Catalog entry from {entry['source']}. {entry['samples']:,} samples."
                fetched.append(record)

        if progress_callback:
            progress_callback(int((i + 1) / total * 100))

    return fetched
