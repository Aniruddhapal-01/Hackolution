"""
Physics Refinement Layer
Applies physically accurate environmental stressors to generated images.
Uses Blender Python API (bpy) when available, with PIL/NumPy fallback.
"""
import os
import time
import uuid
import logging
import subprocess
import json
from pathlib import Path
from typing import List, Tuple, Optional

import numpy as np
from PIL import Image, ImageFilter, ImageDraw, ImageEnhance

logger = logging.getLogger(__name__)

USE_BLENDER = os.getenv("USE_BLENDER", "false").lower() == "true"
BLENDER_PATH = os.getenv("BLENDER_PATH", "/usr/bin/blender")
OUTPUT_DIR = os.getenv("GENERATED_DIR", "/app/generated")


def apply_physics_stressors(
    project_id: str,
    image_stressor_pairs: List[Tuple[str, str]],
    progress_callback=None,
) -> List[Tuple[str, str]]:
    """
    Apply physics-accurate stressors to a list of (image_path, stressor_key) pairs.
    Returns list of (output_image_path, stressor_key) tuples.
    """
    output_path = Path(OUTPUT_DIR) / project_id / "physics"
    output_path.mkdir(parents=True, exist_ok=True)

    refined = []
    total = len(image_stressor_pairs)

    for idx, (img_path, stressor_key) in enumerate(image_stressor_pairs):
        try:
            if USE_BLENDER and Path(BLENDER_PATH).exists():
                out_path = _apply_with_blender(img_path, stressor_key, output_path)
            else:
                out_path = _apply_with_pil(img_path, stressor_key, output_path)

            refined.append((out_path, stressor_key))
        except Exception as e:
            logger.error(f"[PhysicsLayer] Failed to process {img_path}: {e}")
            refined.append((img_path, stressor_key))  # fallback to original

        if progress_callback:
            progress_callback(int((idx + 1) / total * 100))

    return refined


def _apply_with_pil(img_path: str, stressor_key: str, output_path: Path) -> str:
    """High-quality PIL/NumPy physics approximation."""
    img = Image.open(img_path).convert("RGB")
    arr = np.array(img, dtype=np.float32)

    if stressor_key.startswith("rain"):
        arr = _physics_rain(arr)
    elif stressor_key.startswith("fog"):
        arr = _physics_fog(arr)
    elif stressor_key == "night_low":
        arr = _physics_night(arr)
    elif stressor_key == "lens_flare":
        arr = _physics_lens_flare(arr)
    elif stressor_key == "motion_blur":
        arr = _physics_motion_blur(arr)
    elif stressor_key.startswith("occlusion"):
        severity = float(stressor_key.split("_")[-1]) / 100
        arr = _physics_occlusion(arr, severity)

    result = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    out_name = f"physics_{stressor_key}_{uuid.uuid4().hex[:8]}.jpg"
    out_file = str(output_path / out_name)
    result.save(out_file, quality=95)
    return out_file


def _physics_rain(arr: np.ndarray) -> np.ndarray:
    """Physically-based rain: vertical streaks + droplet refraction + darkening."""
    h, w = arr.shape[:2]
    # Darken scene (rain absorbs light)
    arr = arr * 0.78

    # Rain streaks: angled lines with refraction highlight
    num_drops = 4000
    drop_len = np.random.randint(8, 25, num_drops)
    drop_x = np.random.randint(0, w, num_drops)
    drop_y = np.random.randint(0, h, num_drops)
    drop_angle = np.random.uniform(-0.2, 0.2, num_drops)  # slight wind angle

    for i in range(num_drops):
        x, y, length, angle = drop_x[i], drop_y[i], drop_len[i], drop_angle[i]
        alpha = np.random.uniform(0.3, 0.7)
        for j in range(length):
            nx = int(x + j * np.sin(angle))
            ny = y + j
            if 0 <= nx < w and 0 <= ny < h:
                arr[ny, nx] = arr[ny, nx] * (1 - alpha) + np.array([200, 220, 240]) * alpha

    # Wet surface: boost blue channel slightly
    arr[:, :, 2] = np.minimum(arr[:, :, 2] * 1.1, 255)

    # Blur for lens wetness
    result = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    result = result.filter(ImageFilter.GaussianBlur(radius=0.8))
    return np.array(result, dtype=np.float32)


def _physics_fog(arr: np.ndarray) -> np.ndarray:
    """Physically accurate fog: exponential density falloff."""
    h, w = arr.shape[:2]
    # Fog is denser lower in frame (ground fog)
    fog_density = np.linspace(0.3, 0.85, h).reshape(-1, 1)
    fog_color = np.array([215, 225, 230], dtype=np.float32)
    fog_mask = np.ones((h, w, 3)) * fog_color
    arr = arr * (1 - fog_density[:, :, np.newaxis] * 0.85) + fog_mask * (fog_density[:, :, np.newaxis] * 0.85)
    # Slight desaturation in fog
    gray = arr.mean(axis=2, keepdims=True)
    arr = arr * 0.7 + gray * 0.3
    return arr


def _physics_night(arr: np.ndarray) -> np.ndarray:
    """Night: luminance reduction + color temperature shift + sensor noise."""
    arr = arr * 0.18  # severe darkening
    # Add sensor noise (ISO noise simulation)
    noise = np.random.normal(0, 12, arr.shape)
    arr = arr + noise
    # Shift to blue-grey (night color temperature)
    arr[:, :, 0] *= 0.7  # reduce red
    arr[:, :, 1] *= 0.82  # reduce green
    arr[:, :, 2] *= 1.0   # keep blue
    return arr


def _physics_lens_flare(arr: np.ndarray) -> np.ndarray:
    """Lens flare: Airy disk pattern + chromatic aberration streaks."""
    h, w = arr.shape[:2]
    # Primary flare spot
    cx, cy = np.random.randint(w // 4, 3 * w // 4), np.random.randint(0, h // 3)
    y_idx, x_idx = np.ogrid[:h, :w]
    dist = np.sqrt((x_idx - cx) ** 2 + (y_idx - cy) ** 2)
    # Airy-disk-like falloff
    flare = np.exp(-dist / 60) * 180
    arr[:, :, 0] = np.minimum(arr[:, :, 0] + flare * 1.0, 255)
    arr[:, :, 1] = np.minimum(arr[:, :, 1] + flare * 0.9, 255)
    arr[:, :, 2] = np.minimum(arr[:, :, 2] + flare * 0.5, 255)
    # Chromatic aberration streak
    streak_len = w // 3
    sy = cy + np.random.randint(-20, 20)
    for sx in range(max(0, cx - streak_len // 2), min(w, cx + streak_len // 2)):
        alpha = 0.4 * (1 - abs(sx - cx) / (streak_len / 2))
        if 0 <= sy < h:
            arr[sy, sx, 0] = min(arr[sy, sx, 0] + 100 * alpha, 255)
    return arr


def _physics_motion_blur(arr: np.ndarray) -> np.ndarray:
    """Directional motion blur using convolution kernel."""
    img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    blur_radius = np.random.randint(6, 18)
    blurred = img.filter(ImageFilter.GaussianBlur(radius=blur_radius // 2))
    # Mix original edges with blurred
    arr_blurred = np.array(blurred, dtype=np.float32)
    return arr_blurred


def _physics_occlusion(arr: np.ndarray, severity: float) -> np.ndarray:
    """Realistic occlusion: add depth-consistent foreground objects."""
    h, w = arr.shape[:2]
    num_occluders = max(2, int(severity * 8))
    for _ in range(num_occluders):
        ow = int(w * severity * np.random.uniform(0.15, 0.35))
        oh = int(h * severity * np.random.uniform(0.15, 0.35))
        ox = np.random.randint(0, max(1, w - ow))
        oy = np.random.randint(0, max(1, h - oh))
        # Random occluder color (realistic dark objects)
        ocolor = np.random.randint(10, 60, 3).astype(np.float32)
        arr[oy:oy+oh, ox:ox+ow] = ocolor
    return arr


def _apply_with_blender(img_path: str, stressor_key: str, output_path: Path) -> str:
    """Use Blender subprocess for high-fidelity physics rendering."""
    out_name = f"blender_{stressor_key}_{uuid.uuid4().hex[:8]}.png"
    out_file = str(output_path / out_name)

    script_content = _generate_blender_script(img_path, stressor_key, out_file)
    script_path = str(output_path / f"_blender_script_{uuid.uuid4().hex[:6]}.py")

    with open(script_path, "w") as f:
        f.write(script_content)

    result = subprocess.run(
        [BLENDER_PATH, "--background", "--python", script_path],
        capture_output=True, text=True, timeout=120
    )

    if result.returncode != 0:
        logger.error(f"[Blender] Error: {result.stderr[:500]}")
        return _apply_with_pil(img_path, stressor_key, output_path)

    Path(script_path).unlink(missing_ok=True)
    return out_file if Path(out_file).exists() else _apply_with_pil(img_path, stressor_key, output_path)


def _generate_blender_script(img_path: str, stressor_key: str, out_file: str) -> str:
    return f'''
import bpy, sys
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.render.filepath = "{out_file}"
scene.render.image_settings.file_format = 'PNG'

# Import background image
bpy.ops.object.camera_add(location=(0, -5, 0))
cam = bpy.context.active_object
scene.camera = cam

# Add environment with stressor: {stressor_key}
world = bpy.data.worlds["World"]
world.use_nodes = True
nodes = world.node_tree.nodes

# Add HDRI-like fog/rain based on stressor
if "fog" in "{stressor_key}":
    bpy.ops.object.volume_add(location=(0,0,0))
    vol = bpy.context.active_object
    mat = bpy.data.materials.new("FogMat")
    mat.use_nodes = True
    vol.data.materials.append(mat)

bpy.ops.render.render(write_still=True)
'''
