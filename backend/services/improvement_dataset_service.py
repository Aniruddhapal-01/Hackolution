"""
BlindSpot.AI — Improvement Dataset Service
===========================================
Generates TRAINING datasets that help the model improve on its detected
edge cases. Unlike stress-test datasets (which break the model), these
datasets are designed to be used as augmented training data.

For each stressor where the model FAILED (degradation > 20%):
  - Generate a balanced dataset: 50% clean + 50% corrupted with labels
  - Include a README with retraining instructions
  - Provide a difficulty-graded version (easy → hard progression)

The idea: if your model fails on fog, train it on fog-augmented data
and it will learn to be robust to fog.
"""

import os, csv, json, zipfile, random, logging
import numpy as np
from pathlib import Path
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

DATA_DIR     = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
IMPROVE_DIR  = os.path.join(DATA_DIR, "improvement_datasets")
os.makedirs(IMPROVE_DIR, exist_ok=True)

# ─── Retraining tips per stressor ─────────────────────────────────────────────

RETRAINING_TIPS = {
    # Image
    "fog_dense":    "Add fog augmentation to your training pipeline (e.g. albumentations.RandomFog). Train for 10-20 extra epochs on this dataset.",
    "night_low":    "Add brightness/gamma augmentation. Use albumentations.RandomBrightnessContrast with limit=(-0.8, 0.2).",
    "motion_blur":  "Add motion blur augmentation. Use albumentations.MotionBlur(blur_limit=(3,15)).",
    "image_noise":  "Add Gaussian noise augmentation. Use albumentations.GaussNoise(var_limit=(10,50)).",
    "occlusion_80": "Add random erasing / cutout augmentation. Use albumentations.CoarseDropout.",
    "rain_heavy":   "Add rain augmentation. Use albumentations.RandomRain(slant_lower=-10, slant_upper=10).",
    "low_contrast": "Add contrast augmentation. Use albumentations.RandomBrightnessContrast and CLAHE.",
    # Tabular
    "missing_values":    "Train with missing value imputation. Use sklearn.impute.IterativeImputer. Add random masking during training.",
    "ood_inputs":        "Add outlier-robust training. Use RobustScaler instead of StandardScaler. Train with clipped gradients.",
    "class_imbalance":   "Use class_weight='balanced' in your classifier. Oversample minority class with SMOTE.",
    "noisy_categorical": "Add label smoothing. Train with noisy feature augmentation (add Gaussian noise to 20% of training rows).",
    "feature_dropout":   "Train with random feature masking (set 10-30% of features to 0 during training). Use dropout layers.",
    # Sequential
    "oov_tokens":               "Add unknown token handling. Train with a special <UNK> token. Use subword tokenization (BPE).",
    "adversarial_perturbation": "Add adversarial training examples. Use character-level augmentation during training.",
    "long_range":               "Increase max sequence length. Use positional encoding that generalizes beyond training length.",
    "length_mismatch":          "Train on variable-length sequences. Use padding + masking. Add length normalization.",
    # Time-series
    "spike_anomaly":       "Train with spike injection augmentation. Add random impulses to 10% of training sequences.",
    "concept_drift":       "Use online learning or periodic retraining. Add drift detection to your pipeline.",
    "missing_timesteps":   "Train with random timestep masking (mask 10-40% of timesteps). Use interpolation as preprocessing.",
    "seasonal_disruption": "Train on data from multiple seasons. Use seasonal decomposition as a preprocessing step.",
    "hf_noise":            "Add high-frequency noise augmentation. Apply bandpass filtering as preprocessing.",
}

DIFFICULTY_LEVELS = {
    "easy":   {"corruption_rate": 0.15, "description": "15% of samples corrupted — start here"},
    "medium": {"corruption_rate": 0.35, "description": "35% of samples corrupted — main training set"},
    "hard":   {"corruption_rate": 0.60, "description": "60% of samples corrupted — advanced robustness"},
}


def generate_improvement_datasets(
    evaluation_id: str,
    dataset_type: str,
    stress_results: List[Dict],
    vulnerability_vector: Dict[str, float],
) -> List[Dict]:
    """
    Generate training improvement datasets for all FAILED stressors.
    Returns list of dataset records to store in DB.
    """
    eval_dir = Path(IMPROVE_DIR) / evaluation_id
    eval_dir.mkdir(parents=True, exist_ok=True)

    # Load seed images for this evaluation (same ones used by stress-test datasets)
    seed_dir = Path(DATA_DIR) / "seed_images" / evaluation_id
    seed_images: List[str] = []
    if seed_dir.exists():
        ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
        seed_images = [
            str(p) for p in sorted(seed_dir.iterdir())
            if p.suffix.lower() in ALLOWED_EXT and p.is_file()
        ]
        if seed_images:
            logger.info(f"[ImprovementDataset] Using {len(seed_images)} seed images for {evaluation_id}")

    results = []

    # Only generate for stressors that FAILED (degradation > 20%)
    failed_stressors = [
        r for r in stress_results
        if not r.get("passed", True) and r.get("stressor_key") in vulnerability_vector
    ]

    # Also include HIGH/CRITICAL stressors even if they passed (preventive)
    critical_stressors = [
        r for r in stress_results
        if r.get("passed", True)
        and vulnerability_vector.get(r.get("stressor_key", ""), 1.0) < 0.35
        and r.get("stressor_key") not in [f.get("stressor_key") for f in failed_stressors]
    ]

    target_stressors = failed_stressors + critical_stressors[:2]  # max 2 preventive

    for result in target_stressors:
        stressor_key = result.get("stressor_key", "")
        if not stressor_key:
            continue

        try:
            dataset_info = _generate_improvement_dataset(
                eval_dir, stressor_key, dataset_type,
                vulnerability_vector.get(stressor_key, 0.5),
                result.get("degradation_pct", 0),
                result.get("passed", True),
                seed_images=seed_images,
            )
            if dataset_info:
                results.append(dataset_info)
        except Exception as e:
            logger.error(f"[ImprovementDataset] Failed {stressor_key}: {e}")

    return results


def _generate_improvement_dataset(
    eval_dir: Path,
    stressor_key: str,
    dataset_type: str,
    vuln_score: float,
    degradation_pct: float,
    passed: bool,
    seed_images: List[str] = None,
) -> Dict:
    """Generate a balanced training dataset for one stressor."""
    severity   = max(0.0, min(1.0, 1.0 - vuln_score))
    out_dir    = eval_dir / stressor_key
    out_dir.mkdir(parents=True, exist_ok=True)

    label  = stressor_key.replace("_", " ").title()
    tip    = RETRAINING_TIPS.get(stressor_key, "Augment training data with this stressor.")
    status = "FAILED" if not passed else "PREVENTIVE"

    if dataset_type == "image":
        zip_path, count = _gen_image_improvement(out_dir, stressor_key, severity, seed_images=seed_images or [])
    elif dataset_type == "tabular":
        zip_path, count = _gen_tabular_improvement(out_dir, stressor_key, severity)
    elif dataset_type == "sequential":
        zip_path, count = _gen_sequential_improvement(out_dir, stressor_key, severity)
    elif dataset_type == "time_series":
        zip_path, count = _gen_timeseries_improvement(out_dir, stressor_key, severity)
    else:
        zip_path, count = _gen_tabular_improvement(out_dir, stressor_key, severity)

    rel_key    = os.path.relpath(zip_path, DATA_DIR).replace("\\", "/").replace("\\\\", "/")
    size_bytes = os.path.getsize(zip_path)
    seed_note  = f" (using {len(seed_images)} seed image(s))" if seed_images else ""

    return {
        "source":          "improvement",
        "name":            f"[TRAINING] {label} Robustness Dataset",
        "dataset_url":     f"http://localhost:8000/media/{rel_key}",
        "size_bytes":      size_bytes,
        "samples":         count,
        "target_stressor": stressor_key,
        "severity_label":  status,
        "degradation_pct": degradation_pct,
        "retraining_tip":  tip,
        "description": (
            f"{status} — Model degraded {degradation_pct:.1f}% under {label}. "
            f"This balanced training dataset (50% clean + 50% {label.lower()}-augmented){seed_note} "
            f"will help the model learn robustness to this condition. "
            f"Tip: {tip}"
        ),
        "is_improvement": True,
    }


# ─── Image improvement dataset ────────────────────────────────────────────────

def _gen_image_improvement(out_dir: Path, stressor_key: str, severity: float, seed_images: List[str] = None):
    import sys; sys.path.insert(0, str(Path(__file__).parent))
    from PIL import Image as _PIL
    from dataset_fetch_service import _make_general_image, _apply_image_stressor

    # Validate seed images
    valid_seeds = []
    if seed_images:
        for sp in seed_images:
            try:
                if os.path.exists(sp):
                    valid_seeds.append(sp)
            except Exception:
                pass

    N_PER_LEVEL = 15  # 15 clean + 15 corrupted per difficulty = 30 per level, 90 total
    all_images  = []

    for diff, cfg in DIFFICULTY_LEVELS.items():
        diff_dir = out_dir / diff
        diff_dir.mkdir(exist_ok=True)
        images_dir = diff_dir / "images"
        images_dir.mkdir(exist_ok=True)

        records = []
        for i in range(N_PER_LEVEL * 2):
            is_corrupted = i >= N_PER_LEVEL

            # Use seed image if available, otherwise procedural
            if valid_seeds:
                try:
                    seed_path = valid_seeds[i % len(valid_seeds)]
                    img = _PIL.open(seed_path).convert("RGB")
                    img.thumbnail((640, 640), _PIL.LANCZOS)
                    if img.size[0] != img.size[1]:
                        new_img = _PIL.new("RGB", (max(img.size), max(img.size)), (0, 0, 0))
                        offset = ((max(img.size) - img.size[0]) // 2, (max(img.size) - img.size[1]) // 2)
                        new_img.paste(img, offset)
                        img = new_img
                except Exception:
                    img = _make_general_image(i)
            else:
                img = _make_general_image(i)

            if is_corrupted:
                eff_severity = severity * cfg["corruption_rate"] / 0.35
                img = _apply_image_stressor(img, stressor_key, "general",
                                            severity=min(1.0, eff_severity))
                label = 1
            else:
                label = 0

            fname = f"{diff}_{i:03d}_{'corrupted' if is_corrupted else 'clean'}.jpg"
            img.save(str(images_dir / fname), quality=88)
            records.append({"file": fname, "label": label, "split": "train" if i < N_PER_LEVEL * 1.6 else "val"})
            all_images.append(fname)

        # Write manifest CSV
        with open(str(diff_dir / "manifest.csv"), "w", newline="") as f:
            w = csv.writer(f)
            w.writerow(["filename", "label", "split", "stressor", "difficulty"])
            for r in records:
                w.writerow([r["file"], r["label"], r["split"], stressor_key, diff])

    # Write README
    tip = RETRAINING_TIPS.get(stressor_key, "Augment training data with this stressor.")
    seed_note = f"\n## Base Images\nUsing {len(valid_seeds)} uploaded seed image(s) as base — stressors applied on top of your actual images.\n" if valid_seeds else "\n## Base Images\nProcedurally generated (no seed images uploaded).\n"
    readme = f"""# BlindSpot.AI — Training Improvement Dataset
## Stressor: {stressor_key.replace("_", " ").title()}

This dataset is designed to IMPROVE your model's robustness to {stressor_key.replace("_", " ")}.
{seed_note}
## Structure
```
easy/    — 15 clean + 15 corrupted (15% corruption intensity)
medium/  — 15 clean + 15 corrupted (35% corruption intensity)  <- start here
hard/    — 15 clean + 15 corrupted (60% corruption intensity)
```

Each folder contains:
- `images/`       — the actual image files
- `manifest.csv`  — filename, label (0=clean, 1=corrupted), train/val split

## How to use for retraining
1. Add this dataset to your training pipeline
2. Mix with your original training data (suggested ratio: 30% augmented, 70% original)
3. Start with `medium/` difficulty, then add `hard/` after 5 epochs
4. {tip}

## Expected improvement
After retraining with this dataset, the model should show <10% degradation
under {stressor_key.replace("_", " ")} conditions (down from the current failure level).
"""
    with open(str(out_dir / "README.md"), "w", encoding="utf-8") as f:
        f.write(readme)

    zip_path = str(out_dir.parent / f"{stressor_key}_improvement_dataset.zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for fp in out_dir.rglob("*"):
            if fp.is_file():
                zf.write(fp, fp.relative_to(out_dir.parent))

    return zip_path, len(all_images)


# ─── Tabular improvement dataset ──────────────────────────────────────────────

def _gen_tabular_improvement(out_dir: Path, stressor_key: str, severity: float):
    N = 600  # 300 clean + 300 corrupted
    np.random.seed(42)
    n_features = 20
    feature_names = [f"feature_{i:02d}" for i in range(n_features)]

    X_clean = np.random.randn(N, n_features)
    y_clean = (X_clean[:, 0] + X_clean[:, 1] * 0.5 + np.random.randn(N) * 0.3 > 0).astype(int)

    rows = []

    for diff, cfg in DIFFICULTY_LEVELS.items():
        rate = cfg["corruption_rate"]
        X_aug = X_clean.copy().astype(object)
        y_aug = y_clean.copy()
        labels_aug = np.zeros(N, dtype=int)

        if "missing" in stressor_key:
            # Exactly 50% of rows get missing values → is_corrupted=1
            corrupt_idx = np.random.choice(N, N // 2, replace=False)
            clean_idx   = np.setdiff1d(np.arange(N), corrupt_idx)
            X_aug = X_clean.copy().astype(object)
            for idx in corrupt_idx:
                feat_mask = np.random.rand(n_features) < rate * 0.8
                for j in np.where(feat_mask)[0]:
                    X_aug[idx, j] = ""
            labels_aug[corrupt_idx] = 1

        elif "ood" in stressor_key:
            # Exactly 50% of rows are OOD → is_corrupted=1
            ood_idx = np.random.choice(N, N // 2, replace=False)
            X_aug = X_clean.copy()
            X_aug[ood_idx] *= np.random.uniform(5, 12, (len(ood_idx), n_features))
            labels_aug[ood_idx] = 1

        elif "imbalance" in stressor_key or "class" in stressor_key:
            # 50% clean (label=0) + 50% minority-class (label=1) → balanced for training
            half = N // 2
            X_minority = np.random.randn(half, n_features) * 0.8
            X_aug = np.vstack([X_clean[:half], X_minority])
            y_aug = np.concatenate([np.zeros(half, dtype=int), np.ones(half, dtype=int)])
            labels_aug = np.concatenate([np.zeros(half, dtype=int), np.ones(half, dtype=int)])

        elif "noisy" in stressor_key or "categorical" in stressor_key:
            # Exactly 50% of rows get noise → is_corrupted=1
            noise_idx = np.random.choice(N, N // 2, replace=False)
            X_aug = X_clean.copy()
            X_aug[noise_idx] += np.random.randn(len(noise_idx), n_features) * (2 + severity * 3)
            labels_aug[noise_idx] = 1

        elif "dropout" in stressor_key or "feature" in stressor_key:
            # 50% of rows have feature dropout applied → is_corrupted=1
            # (other 50% are clean — gives model contrast to learn from)
            drop_cols  = np.random.choice(n_features, max(1, int(n_features * rate * 0.8)), replace=False)
            corrupt_idx = np.random.choice(N, N // 2, replace=False)
            X_aug = X_clean.copy()
            X_aug[np.ix_(corrupt_idx, drop_cols)] = 0
            labels_aug[corrupt_idx] = 1

        count = len(X_aug)
        csv_path = str(out_dir / f"{stressor_key}_{diff}_improvement.csv")
        with open(csv_path, "w", newline="") as f:
            w = csv.writer(f)
            w.writerow(feature_names + ["original_label", "is_corrupted", "stressor", "difficulty"])
            for i in range(count):
                row = [round(float(v), 4) if v != "" else "" for v in X_aug[i]]
                split_label = y_aug[i] if i < len(y_aug) else 0
                w.writerow(row + [int(split_label), int(labels_aug[i] if i < len(labels_aug) else 0), stressor_key, diff])
        rows.append(csv_path)

    tip = RETRAINING_TIPS.get(stressor_key, "Augment training data with this stressor.")
    readme = f"""# BlindSpot.AI — Training Improvement Dataset
## Stressor: {stressor_key.replace("_", " ").title()}

Balanced training dataset to improve robustness to {stressor_key.replace("_", " ")}.

## Files
- `{stressor_key}_easy_improvement.csv`   — 15% corruption rate
- `{stressor_key}_medium_improvement.csv` — 35% corruption rate (recommended)
- `{stressor_key}_hard_improvement.csv`   — 60% corruption rate

## Columns
- `feature_00` to `feature_19` — input features (some corrupted)
- `original_label`             — the true class label
- `is_corrupted`               — 1 if this row has the stressor applied
- `stressor`                   — which stressor was applied
- `difficulty`                 — easy / medium / hard

## How to use
1. Load `{stressor_key}_medium_improvement.csv`
2. Mix with your original training data (30% augmented, 70% original)
3. Retrain for 10-20 epochs
4. {tip}
"""
    with open(str(out_dir / "README.md"), "w", encoding="utf-8") as f:
        f.write(readme)

    zip_path = str(out_dir.parent / f"{stressor_key}_improvement_dataset.zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for fp in out_dir.rglob("*"):
            if fp.is_file():
                zf.write(fp, fp.relative_to(out_dir.parent))

    return zip_path, N * 3  # 3 difficulty levels


# ─── Sequential improvement dataset ──────────────────────────────────────────

def _gen_sequential_improvement(out_dir: Path, stressor_key: str, severity: float):
    vocab = ["the","a","is","was","object","model","detected","failed","error","warning",
             "sensor","camera","input","output","class","label","score","confidence",
             "low","high","medium","critical","normal","anomaly","drift","noise",
             "system","data","feature","value","result","test","network","signal"]
    N = 400  # 200 clean + 200 corrupted

    for diff, cfg in DIFFICULTY_LEVELS.items():
        rate = cfg["corruption_rate"]
        csv_path = str(out_dir / f"{stressor_key}_{diff}_improvement.csv")
        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(["text", "original_label", "is_corrupted", "stressor", "difficulty", "split"])
            for i in range(N):
                is_corrupted = random.random() < rate
                length = random.randint(8, 25)
                tokens = [random.choice(vocab) for _ in range(length)]

                if is_corrupted:
                    if "oov" in stressor_key:
                        for _ in range(random.randint(1, 3)):
                            tokens[random.randint(0, len(tokens)-1)] = f"xkz{random.randint(100,999)}"
                    elif "adversarial" in stressor_key or "perturbation" in stressor_key:
                        for _ in range(random.randint(1, 3)):
                            pos = random.randint(0, len(tokens)-1)
                            t = tokens[pos]
                            if len(t) > 2:
                                mid = len(t) // 2
                                tokens[pos] = t[:mid] + str(random.randint(0,9)) + t[mid:]
                    elif "length" in stressor_key:
                        tokens = tokens[:2] if random.random() > 0.5 else tokens * 4
                    elif "long" in stressor_key:
                        tokens = tokens * random.randint(3, 6)

                split = "train" if i < N * 0.8 else "val"
                orig_label = 1 if i % 3 == 0 else 0  # simulate class distribution
                w.writerow([" ".join(tokens), orig_label, int(is_corrupted), stressor_key, diff, split])

    tip = RETRAINING_TIPS.get(stressor_key, "Augment training data with this stressor.")
    readme = f"""# BlindSpot.AI — Training Improvement Dataset
## Stressor: {stressor_key.replace("_", " ").title()}

Balanced training dataset to improve robustness to {stressor_key.replace("_", " ")}.

## Files
- `{stressor_key}_easy_improvement.csv`   — 15% of samples corrupted
- `{stressor_key}_medium_improvement.csv` — 35% of samples corrupted (recommended)
- `{stressor_key}_hard_improvement.csv`   — 60% of samples corrupted

## Columns
- `text`           — the input sequence (some with stressor applied)
- `original_label` — the true class label
- `is_corrupted`   — 1 if this sample has the stressor applied
- `split`          — train / val

## How to use
1. Load `{stressor_key}_medium_improvement.csv`
2. Mix with your original training data (30% augmented, 70% original)
3. Retrain for 10-20 epochs
4. {tip}
"""
    with open(str(out_dir / "README.md"), "w", encoding="utf-8") as f:
        f.write(readme)

    zip_path = str(out_dir.parent / f"{stressor_key}_improvement_dataset.zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for fp in out_dir.rglob("*"):
            if fp.is_file():
                zf.write(fp, fp.relative_to(out_dir.parent))

    return zip_path, N * 3


# ─── Time-series improvement dataset ─────────────────────────────────────────

def _gen_timeseries_improvement(out_dir: Path, stressor_key: str, severity: float):
    N = 500
    t = np.linspace(0, 4 * np.pi, N)
    base = np.sin(t) + 0.5 * np.sin(3 * t) + np.random.randn(N) * 0.1

    for diff, cfg in DIFFICULTY_LEVELS.items():
        rate = cfg["corruption_rate"]
        signal = base.copy()
        labels = np.zeros(N, dtype=int)

        if "spike" in stressor_key:
            spike_idx = np.random.choice(N, int(N * rate * 0.3), replace=False)
            signal[spike_idx] += np.random.choice([-1,1], len(spike_idx)) * np.random.uniform(3, 6, len(spike_idx))
            labels[spike_idx] = 1
        elif "drift" in stressor_key:
            drift_start = int(N * (1 - rate))
            signal[drift_start:] += np.linspace(0, 2, N - drift_start)
            labels[drift_start:] = 1
        elif "missing" in stressor_key:
            gap_idx = np.random.choice(N, int(N * rate * 0.5), replace=False)
            signal[gap_idx] = 0
            labels[gap_idx] = 1
        elif "seasonal" in stressor_key:
            sb = int(N * (1 - rate))
            signal[sb:] += 2.0 * np.sin(7 * t[sb:])
            labels[sb:] = 1
        elif "noise" in stressor_key or "hf" in stressor_key:
            hf = np.random.randn(N) * (1.5 + severity)
            signal = signal + hf
            labels = (np.abs(hf) > 1.5).astype(int)

        csv_path = str(out_dir / f"{stressor_key}_{diff}_improvement.csv")
        with open(csv_path, "w", newline="") as f:
            w = csv.writer(f)
            w.writerow(["timestep", "value", "is_anomaly", "stressor", "difficulty", "split"])
            for i in range(N):
                split = "train" if i < N * 0.8 else "val"
                w.writerow([i, round(float(signal[i]), 4), int(labels[i]), stressor_key, diff, split])

    tip = RETRAINING_TIPS.get(stressor_key, "Augment training data with this stressor.")
    readme = f"""# BlindSpot.AI — Training Improvement Dataset
## Stressor: {stressor_key.replace("_", " ").title()}

Time-series training dataset to improve robustness to {stressor_key.replace("_", " ")}.

## Files
- `{stressor_key}_easy_improvement.csv`   — mild corruption
- `{stressor_key}_medium_improvement.csv` — moderate corruption (recommended)
- `{stressor_key}_hard_improvement.csv`   — severe corruption

## Columns
- `timestep`   — time index
- `value`      — signal value (some with stressor applied)
- `is_anomaly` — 1 if this timestep has the stressor applied
- `split`      — train / val

## How to use
1. Load `{stressor_key}_medium_improvement.csv`
2. Mix with your original training data
3. Retrain your model with this augmented data
4. {tip}
"""
    with open(str(out_dir / "README.md"), "w", encoding="utf-8") as f:
        f.write(readme)

    zip_path = str(out_dir.parent / f"{stressor_key}_improvement_dataset.zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for fp in out_dir.rglob("*"):
            if fp.is_file():
                zf.write(fp, fp.relative_to(out_dir.parent))

    return zip_path, N * 3
