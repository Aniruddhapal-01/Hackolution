"""
Adversarial Agent Service
Probes a client's AI model endpoint with progressively severe stressors
to identify mathematical blind spots and confidence drop zones.
"""
import os
import io
import time
import logging
import random
from typing import Dict, List, Optional, Tuple

import numpy as np
from PIL import Image, ImageFilter, ImageEnhance, ImageDraw
import httpx

logger = logging.getLogger(__name__)

USE_MOCK = os.getenv("MOCK_ML", "true").lower() == "true"

STRESSORS = {
    "occlusion_20": {"label": "20% Occlusion", "severity": 0.2},
    "occlusion_50": {"label": "50% Occlusion", "severity": 0.5},
    "occlusion_80": {"label": "80% Occlusion", "severity": 0.8},
    "rain_heavy":   {"label": "Heavy Rain", "severity": 0.75},
    "fog_dense":    {"label": "Dense Fog", "severity": 0.7},
    "night_low":    {"label": "Night / Low Contrast", "severity": 0.65},
    "lens_flare":   {"label": "Lens Flare", "severity": 0.4},
    "motion_blur":  {"label": "Motion Blur", "severity": 0.5},
}

VULNERABILITY_THRESHOLD = 0.6


def apply_stressor(image: Image.Image, stressor_key: str) -> Image.Image:
    """Apply a visual stressor to an image."""
    img = image.convert("RGB").copy()
    severity = STRESSORS[stressor_key]["severity"]

    if stressor_key.startswith("occlusion"):
        img = _apply_occlusion(img, severity)
    elif stressor_key == "rain_heavy":
        img = _apply_rain(img, severity)
    elif stressor_key == "fog_dense":
        img = _apply_fog(img, severity)
    elif stressor_key == "night_low":
        img = _apply_night(img, severity)
    elif stressor_key == "lens_flare":
        img = _apply_lens_flare(img, severity)
    elif stressor_key == "motion_blur":
        img = _apply_motion_blur(img, severity)

    return img


def _apply_occlusion(img: Image.Image, severity: float) -> Image.Image:
    draw = ImageDraw.Draw(img)
    w, h = img.size
    num_rects = int(severity * 10) + 2
    for _ in range(num_rects):
        rx = random.randint(0, int(w * 0.8))
        ry = random.randint(0, int(h * 0.8))
        rw = int(w * severity * random.uniform(0.1, 0.3))
        rh = int(h * severity * random.uniform(0.1, 0.3))
        color = (random.randint(0, 80),) * 3
        draw.rectangle([rx, ry, rx + rw, ry + rh], fill=color)
    return img


def _apply_rain(img: Image.Image, severity: float) -> Image.Image:
    arr = np.array(img, dtype=np.float32)
    h, w = arr.shape[:2]
    num_drops = int(severity * 3000)
    for _ in range(num_drops):
        x = random.randint(0, w - 1)
        y = random.randint(0, h - 5)
        length = random.randint(5, 20)
        alpha = random.uniform(0.3, 0.8)
        for dy in range(min(length, h - y - 1)):
            arr[y + dy, x] = arr[y + dy, x] * (1 - alpha) + 200 * alpha
    arr = np.clip(arr, 0, 255).astype(np.uint8)
    result = Image.fromarray(arr)
    return result.filter(ImageFilter.GaussianBlur(radius=0.5))


def _apply_fog(img: Image.Image, severity: float) -> Image.Image:
    arr = np.array(img, dtype=np.float32)
    fog = np.ones_like(arr) * 220
    blended = arr * (1 - severity * 0.85) + fog * (severity * 0.85)
    return Image.fromarray(np.clip(blended, 0, 255).astype(np.uint8))


def _apply_night(img: Image.Image, severity: float) -> Image.Image:
    enhancer = ImageEnhance.Brightness(img)
    darkened = enhancer.enhance(1 - severity * 0.75)
    enhancer2 = ImageEnhance.Contrast(darkened)
    return enhancer2.enhance(1 - severity * 0.4)


def _apply_lens_flare(img: Image.Image, severity: float) -> Image.Image:
    draw = ImageDraw.Draw(img)
    w, h = img.size
    cx, cy = random.randint(w // 4, 3 * w // 4), random.randint(0, h // 3)
    for r in range(0, int(severity * 80), 5):
        alpha_val = max(0, 255 - r * 4)
        color = (255, 240, 180, alpha_val)
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(255, 240, 180))
    return img


def _apply_motion_blur(img: Image.Image, severity: float) -> Image.Image:
    radius = int(severity * 15) + 2
    return img.filter(ImageFilter.GaussianBlur(radius=radius))


def probe_model_endpoint(
    endpoint: str,
    test_images: List[Image.Image],
    stressor_key: str,
    timeout: float = 10.0,
) -> float:
    """
    Send stressed images to model endpoint and return average confidence.
    Expects endpoint to return JSON: {"confidence": float, "label": str}
    """
    scores = []
    client = httpx.Client(timeout=timeout)

    for img in test_images:
        stressed = apply_stressor(img, stressor_key)
        buf = io.BytesIO()
        stressed.save(buf, format="JPEG", quality=90)
        buf.seek(0)
        try:
            response = client.post(
                endpoint,
                files={"image": ("image.jpg", buf, "image/jpeg")},
            )
            if response.status_code == 200:
                data = response.json()
                confidence = data.get("confidence", data.get("score", 0.5))
                scores.append(float(confidence))
        except Exception as e:
            logger.warning(f"[AdversarialAgent] Request failed for stressor {stressor_key}: {e}")
            scores.append(0.0)

    return float(np.mean(scores)) if scores else 0.0


def run_vulnerability_scan(
    project_id: str,
    model_endpoint: str,
    seed_image_paths: List[str],
    progress_callback=None,
) -> Dict[str, float]:
    """
    Full adversarial scan against all stressors.
    Returns vulnerability_vector: {stressor_key: avg_confidence} for blind spots only.
    """
    if USE_MOCK or not model_endpoint:
        return _mock_vulnerability_scan(project_id, progress_callback)

    test_images = []
    for path in seed_image_paths[:5]:
        try:
            test_images.append(Image.open(path).convert("RGB").resize((640, 640)))
        except Exception as e:
            logger.warning(f"Could not load seed image {path}: {e}")

    if not test_images:
        logger.warning("[AdversarialAgent] No valid seed images — using mock scan")
        return _mock_vulnerability_scan(project_id, progress_callback)

    vulnerability_vector = {}
    total = len(STRESSORS)

    for i, (stressor_key, meta) in enumerate(STRESSORS.items()):
        logger.info(f"[AdversarialAgent] Testing stressor: {meta['label']}")
        avg_conf = probe_model_endpoint(model_endpoint, test_images, stressor_key)

        if avg_conf < VULNERABILITY_THRESHOLD:
            vulnerability_vector[stressor_key] = round(avg_conf, 4)
            logger.info(f"[AdversarialAgent] Blind spot found: {stressor_key} (conf={avg_conf:.3f})")

        if progress_callback:
            progress_callback(int((i + 1) / total * 100))

    return vulnerability_vector


def _mock_vulnerability_scan(project_id: str, progress_callback=None) -> Dict[str, float]:
    """Simulated scan returning realistic-looking vulnerability data."""
    logger.info(f"[AdversarialAgent MOCK] Simulating vulnerability scan for {project_id}")
    total = len(STRESSORS)
    results = {}

    mock_scores = {
        "occlusion_20": 0.72,
        "occlusion_50": 0.48,
        "occlusion_80": 0.19,
        "rain_heavy":   0.41,
        "fog_dense":    0.35,
        "night_low":    0.52,
        "lens_flare":   0.67,
        "motion_blur":  0.58,
    }

    for i, (key, score) in enumerate(mock_scores.items()):
        time.sleep(0.8)
        if score < VULNERABILITY_THRESHOLD:
            results[key] = score
        if progress_callback:
            progress_callback(int((i + 1) / total * 100))

    return results
