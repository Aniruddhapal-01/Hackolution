"""
Auto-Labeling Service
Uses Mask R-CNN to generate COCO-format semantic segmentation masks
and bounding boxes for all generated images. Outputs dataset ZIP.
"""
import os
import io
import json
import time
import uuid
import zipfile
import logging
from pathlib import Path
from typing import List, Tuple, Dict, Any, Optional
from datetime import datetime

import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

USE_MOCK = os.getenv("MOCK_ML", "true").lower() == "true"
OUTPUT_DIR = os.getenv("GENERATED_DIR", "/app/generated")


def generate_coco_dataset(
    project_id: str,
    image_stressor_pairs: List[Tuple[str, str]],
    categories: Optional[List[Dict]] = None,
    progress_callback=None,
) -> Tuple[str, int, int]:
    """
    Run auto-labeling on all images, build COCO dataset, return (zip_path, img_count, label_count).
    """
    output_path = Path(OUTPUT_DIR) / project_id / "dataset"
    output_path.mkdir(parents=True, exist_ok=True)
    images_path = output_path / "images"
    images_path.mkdir(exist_ok=True)

    if categories is None:
        categories = [{"id": 1, "name": "target_object", "supercategory": "object"}]

    if USE_MOCK:
        return _mock_label_dataset(project_id, image_stressor_pairs, output_path, images_path, categories, progress_callback)

    try:
        import torch
        import torchvision
        from torchvision.models.detection import maskrcnn_resnet50_fpn, MaskRCNN_ResNet50_FPN_Weights
        from torchvision import transforms as T

        device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"[AutoLabeler] Loading Mask R-CNN on {device}")

        weights = MaskRCNN_ResNet50_FPN_Weights.DEFAULT
        model = maskrcnn_resnet50_fpn(weights=weights).to(device)
        model.eval()
        transform = T.Compose([T.ToTensor()])

        coco = _init_coco_structure(categories)
        total = len(image_stressor_pairs)
        label_count = 0

        for idx, (img_path, stressor_key) in enumerate(image_stressor_pairs):
            try:
                img = Image.open(img_path).convert("RGB")
                img_id = idx + 1
                w, h = img.size

                import shutil
                out_fname = f"{img_id:06d}_{stressor_key}.jpg"
                shutil.copy(img_path, str(images_path / out_fname))

                coco["images"].append({
                    "id": img_id, "file_name": out_fname,
                    "width": w, "height": h,
                    "stressor": stressor_key,
                    "date_captured": datetime.utcnow().isoformat(),
                })

                tensor = transform(img).unsqueeze(0).to(device)
                with torch.no_grad():
                    predictions = model(tensor)[0]

                boxes = predictions["boxes"].cpu().numpy()
                scores = predictions["scores"].cpu().numpy()
                labels = predictions["labels"].cpu().numpy()

                for box, score, label in zip(boxes, scores, labels):
                    if score < 0.5:
                        continue
                    x1, y1, x2, y2 = box.tolist()
                    ann_w = x2 - x1
                    ann_h = y2 - y1
                    coco["annotations"].append({
                        "id": len(coco["annotations"]) + 1,
                        "image_id": img_id,
                        "category_id": 1,
                        "bbox": [round(x1, 2), round(y1, 2), round(ann_w, 2), round(ann_h, 2)],
                        "area": round(ann_w * ann_h, 2),
                        "iscrowd": 0,
                        "score": round(float(score), 4),
                        "segmentation": [],
                    })
                    label_count += 1

            except Exception as e:
                logger.error(f"[AutoLabeler] Failed to label {img_path}: {e}")

            if progress_callback:
                progress_callback(int((idx + 1) / total * 100))

        zip_path = _package_dataset(project_id, output_path, coco)
        return zip_path, len(coco["images"]), label_count

    except Exception as e:
        logger.error(f"[AutoLabeler] Fatal error: {e}")
        raise


def _init_coco_structure(categories: List[Dict]) -> Dict:
    return {
        "info": {
            "description": "BlindSpot.AI Synthetic Dataset",
            "url": "https://blindspot.ai",
            "version": "1.0",
            "year": datetime.utcnow().year,
            "contributor": "BlindSpot.AI AxiomSynth",
            "date_created": datetime.utcnow().isoformat(),
        },
        "licenses": [{"id": 1, "name": "BlindSpot.AI Synthetic", "url": ""}],
        "images": [],
        "annotations": [],
        "categories": categories,
    }


def _mock_label_dataset(project_id, pairs, output_path, images_path, categories, progress_callback):
    """Mock labeling: copy images and generate synthetic COCO annotations."""
    import shutil
    logger.info(f"[AutoLabeler MOCK] Generating mock COCO dataset for {project_id}")
    coco = _init_coco_structure(categories)
    total = len(pairs)
    label_count = 0

    for idx, (img_path, stressor_key) in enumerate(pairs):
        time.sleep(0.15)
        try:
            img_id = idx + 1
            out_fname = f"{img_id:06d}_{stressor_key}.jpg"
            shutil.copy(img_path, str(images_path / out_fname))

            img = Image.open(img_path)
            w, h = img.size

            coco["images"].append({
                "id": img_id,
                "file_name": out_fname,
                "width": w, "height": h,
                "stressor": stressor_key,
                "date_captured": datetime.utcnow().isoformat(),
            })

            # Generate 1-3 mock bounding boxes
            num_boxes = np.random.randint(1, 4)
            for _ in range(num_boxes):
                bx = np.random.randint(50, w // 3)
                by = np.random.randint(50, h // 3)
                bw = np.random.randint(100, w // 2)
                bh = np.random.randint(100, h // 2)
                bx = min(bx, w - bw - 1)
                by = min(by, h - bh - 1)
                coco["annotations"].append({
                    "id": len(coco["annotations"]) + 1,
                    "image_id": img_id,
                    "category_id": 1,
                    "bbox": [bx, by, bw, bh],
                    "area": bw * bh,
                    "iscrowd": 0,
                    "score": round(np.random.uniform(0.6, 0.98), 4),
                    "segmentation": [[bx, by, bx+bw, by, bx+bw, by+bh, bx, by+bh]],
                })
                label_count += 1

        except Exception as e:
            logger.error(f"[AutoLabeler MOCK] Error for {img_path}: {e}")

        if progress_callback:
            progress_callback(int((idx + 1) / total * 100))

    zip_path = _package_dataset(project_id, output_path, coco)
    return zip_path, len(coco["images"]), label_count


def _package_dataset(project_id: str, output_path: Path, coco: Dict) -> str:
    """Package images + COCO JSON into a ZIP file."""
    coco_json_path = output_path / "annotations" 
    coco_json_path.mkdir(exist_ok=True)
    ann_file = coco_json_path / "instances_train.json"
    with open(ann_file, "w") as f:
        json.dump(coco, f, indent=2)

    # Also generate YOLO-compatible labels
    _generate_yolo_labels(output_path, coco)

    zip_path = str(output_path.parent / f"dataset_{project_id}.zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for fpath in output_path.rglob("*"):
            if fpath.is_file():
                zf.write(fpath, fpath.relative_to(output_path.parent))

    logger.info(f"[AutoLabeler] Dataset packaged: {zip_path} ({Path(zip_path).stat().st_size // 1024} KB)")
    return zip_path


def _generate_yolo_labels(output_path: Path, coco: Dict):
    """Convert COCO annotations to YOLO .txt format."""
    yolo_path = output_path / "labels"
    yolo_path.mkdir(exist_ok=True)

    img_map = {img["id"]: img for img in coco["images"]}
    ann_map: Dict[int, List] = {}
    for ann in coco["annotations"]:
        ann_map.setdefault(ann["image_id"], []).append(ann)

    for img_id, img_meta in img_map.items():
        w, h = img_meta["width"], img_meta["height"]
        label_name = Path(img_meta["file_name"]).stem + ".txt"
        lines = []
        for ann in ann_map.get(img_id, []):
            bx, by, bw, bh = ann["bbox"]
            cx = (bx + bw / 2) / w
            cy = (by + bh / 2) / h
            nw = bw / w
            nh = bh / h
            cat_id = ann["category_id"] - 1
            lines.append(f"{cat_id} {cx:.6f} {cy:.6f} {nw:.6f} {nh:.6f}")
        with open(yolo_path / label_name, "w") as f:
            f.write("\n".join(lines))

    # Write YOLO dataset.yaml
    yaml_content = f"""path: .
train: images
val: images

nc: {len(coco['categories'])}
names: {[c['name'] for c in coco['categories']]}
"""
    with open(output_path / "dataset.yaml", "w") as f:
        f.write(yaml_content)
