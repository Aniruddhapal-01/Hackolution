"""
Generative Engine Service
Runs Stable Diffusion XL + LoRA + ControlNet to generate synthetic images
targeted at identified vulnerability blind spots.
"""
import os
import time
import uuid
import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np
from PIL import Image, ImageFilter, ImageDraw, ImageFont

logger = logging.getLogger(__name__)

USE_MOCK = os.getenv("MOCK_ML", "true").lower() == "true"
OUTPUT_DIR = os.getenv("GENERATED_DIR", "/app/generated")

STRESSOR_PROMPTS = {
    "occlusion_20": "partially obscured by foreground objects, 20% occluded, debris in foreground",
    "occlusion_50": "50% occluded by foreground obstacles, heavy debris, partial visibility",
    "occlusion_80": "severely occluded, only 20% visible, dense foreground clutter, extreme obstruction",
    "rain_heavy":   "torrential rain, heavy downpour, water droplets on lens, wet surfaces, storm",
    "fog_dense":    "extremely dense fog, low visibility, thick mist, foggy atmosphere, haze",
    "night_low":    "nighttime, low light, dark environment, minimal ambient lighting, high ISO noise",
    "lens_flare":   "harsh sunlight, lens flare, bright light source, overexposed highlights",
    "motion_blur":  "motion blur, fast movement, speed blur, kinetic action",
}

NEGATIVE_PROMPT = (
    "cartoon, anime, painting, unrealistic, deformed, blurry (except when blur is the stressor), "
    "duplicate, bad anatomy, watermark, text, logo"
)


def build_prompt(object_name: str, stressor_key: str, scene_context: Optional[str] = None) -> str:
    stressor_desc = STRESSOR_PROMPTS.get(stressor_key, "unusual lighting conditions")
    
    # Smart context detection
    if not scene_context:
        if "drone" in object_name.lower() or "uav" in object_name.lower():
            scene_context = "aerial high-altitude view, sky background, looking down at terrain"
        else:
            scene_context = "industrial environment, realistic background"

    return (
        f"photorealistic image of {object_name} in {scene_context}, "
        f"{stressor_desc}, "
        f"professional photography, drone footage style, RAW photo, high detail, 8k resolution, "
        f"realistic sensor data, ground truth training image"
    )


def generate_images(
    project_id: str,
    lora_weights_path: str,
    vulnerability_vector: Dict[str, float],
    seed_image_paths: List[str] = [],
    object_name: str = "industrial object",
    images_per_stressor: int = 10,
    progress_callback=None,
) -> List[Tuple[str, str]]:
    """
    Generate synthetic images for each vulnerability.
    Returns list of (local_image_path, stressor_key) tuples.
    """
    output_path = Path(OUTPUT_DIR) / project_id / "raw"
    output_path.mkdir(parents=True, exist_ok=True)

    if USE_MOCK:
        return _mock_generate(project_id, vulnerability_vector, output_path, seed_image_paths, images_per_stressor, progress_callback)

    try:
        import torch
        from diffusers import StableDiffusionXLPipeline, ControlNetModel, StableDiffusionXLControlNetPipeline
        from diffusers.utils import load_image

        device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"[GenerativeEngine] Loading SDXL pipeline on {device}")

        pipe = StableDiffusionXLPipeline.from_pretrained(
            "stabilityai/stable-diffusion-xl-base-1.0",
            torch_dtype=torch.float16 if device == "cuda" else torch.float32,
            use_safetensors=True,
        ).to(device)

        # Load LoRA weights if available and not mock
        if lora_weights_path and Path(lora_weights_path).exists() and Path(lora_weights_path).stat().st_size > 100:
            try:
                pipe.load_lora_weights(str(Path(lora_weights_path).parent))
                logger.info("[GenerativeEngine] LoRA weights loaded successfully")
            except Exception as e:
                logger.warning(f"[GenerativeEngine] Could not load LoRA weights: {e}")

        pipe.enable_attention_slicing()
        if device == "cuda":
            pipe.enable_model_cpu_offload()

        generated = []
        total_stressors = len(vulnerability_vector)

        for idx, (stressor_key, confidence) in enumerate(vulnerability_vector.items()):
            prompt = build_prompt(object_name, stressor_key)
            logger.info(f"[GenerativeEngine] Generating {images_per_stressor} images for {stressor_key}")

            for i in range(images_per_stressor):
                try:
                    result = pipe(
                        prompt=prompt,
                        negative_prompt=NEGATIVE_PROMPT,
                        num_inference_steps=30,
                        guidance_scale=7.5,
                        width=1024, height=1024,
                    )
                    img = result.images[0]
                    fname = f"{stressor_key}_{uuid.uuid4().hex[:8]}.jpg"
                    fpath = str(output_path / fname)
                    img.save(fpath, quality=95)
                    generated.append((fpath, stressor_key))
                except Exception as e:
                    logger.error(f"[GenerativeEngine] Image generation failed: {e}")

            if progress_callback:
                progress_callback(int((idx + 1) / total_stressors * 100))

        return generated

    except Exception as e:
        logger.error(f"[GenerativeEngine] Fatal error: {e}")
        raise


def _mock_generate(project_id, vulnerability_vector, output_path, seed_image_paths, images_per_stressor, progress_callback):
    """Create placeholder synthetic images for mock mode using seed images as basis."""
    logger.info(f"[GenerativeEngine MOCK] Generating mock images for {project_id} using {len(seed_image_paths)} seeds")
    generated = []
    total = len(vulnerability_vector)
    
    # Priority for seeds
    has_seeds = len(seed_image_paths) > 0

    for idx, (stressor_key, confidence) in enumerate(vulnerability_vector.items()):
        count = min(images_per_stressor, 12)

        for i in range(count):
            time.sleep(0.1)
            
            if has_seeds:
                seed_f = seed_image_paths[i % len(seed_image_paths)]
                try:
                    img = Image.open(seed_f).convert("RGB")
                    # If seed is too big, resize to standard ML size
                    if img.width > 1024 or img.height > 1024:
                        img.thumbnail((1024, 1024))
                except Exception as e:
                    logger.warning(f"Failed to use seed {seed_f}: {e}")
                    img = Image.new("RGB", (512, 512), color=(40, 40, 40))
            else:
                # Generate a thematic mock image (e.g. Drone silhouette)
                img = Image.new("RGB", (512, 512), color=(20, 25, 40))
                draw = ImageDraw.Draw(img)
                # Draw a simple drone-like shape if it's a drone project
                center_x, center_y = 256, 256
                # Main body
                draw.ellipse([center_x-40, center_y-20, center_x+40, center_y+20], fill=(100, 110, 130))
                # Rotors / Arms
                for angle in [45, 135, 225, 315]:
                    import math
                    rad = math.radians(angle)
                    arm_x = center_x + math.cos(rad) * 60
                    arm_y = center_y + math.sin(rad) * 60
                    draw.line([center_x, center_y, arm_x, arm_y], fill=(150, 160, 180), width=8)
                    draw.ellipse([arm_x-20, arm_y-10, arm_x+20, arm_y+10], fill=(200, 210, 230))
                
                draw.text((20, 20), "AxiomSynth Drone Mock", fill=(0, 210, 255))

            draw = ImageDraw.Draw(img)
            # Add subtle tech overlay to indicate it's a synthetic variant
            w, h = img.size
            draw.text((20, h-40), f"AxiomSynth // Variant {i+1} // {stressor_key.upper()}", fill=(255, 255, 255, 128))

            # Add stressor effect
            if "fog" in stressor_key:
                img = img.filter(ImageFilter.GaussianBlur(radius=4))
            elif "blur" in stressor_key:
                img = img.filter(ImageFilter.GaussianBlur(radius=6))
            elif "rain" in stressor_key:
                # Add rain streaks
                r_draw = ImageDraw.Draw(img)
                for _ in range(100):
                    rx = np.random.randint(0, w)
                    ry = np.random.randint(0, h)
                    r_draw.line([rx, ry, rx-5, ry+15], fill=(200, 220, 255, 100), width=1)

            fname = f"{stressor_key}_{uuid.uuid4().hex[:8]}.jpg"
            fpath = str(output_path / fname)
            img.save(fpath, quality=90)
            generated.append((fpath, stressor_key))

        if progress_callback:
            progress_callback(int((idx + 1) / total * 100))

    return generated
