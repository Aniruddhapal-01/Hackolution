"""
BlindSpot.AI — Ground Truth Benchmark Builder
==============================================
Creates the fixed reference dataset that defines what "correct" generated
output looks like. This is the equivalent of a training dataset for a
generative model — it's the ground truth we measure accuracy against.

Run ONCE to create the benchmark:
    python build_benchmark.py

Output:
    backend/data/benchmark/
        clean/                  ← 10 clean base images
        ground_truth/<stressor>/ ← hand-crafted correct corruptions
        tabular/                ← clean + correctly corrupted CSVs
        sequential/             ← clean + correctly corrupted sequences
        benchmark_stats.json    ← expected statistics per stressor
"""

import os, csv, json
import numpy as np
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

BENCHMARK_DIR = Path(__file__).parent / "backend" / "data" / "benchmark"
BENCHMARK_DIR.mkdir(parents=True, exist_ok=True)

np.random.seed(42)

print("=" * 65)
print("  BlindSpot.AI — Ground Truth Benchmark Builder")
print("=" * 65)


# ══════════════════════════════════════════════════════════════════
#  PART 1 — IMAGE BENCHMARK
#  10 clean base images + correctly corrupted versions per stressor
# ══════════════════════════════════════════════════════════════════

def make_clean_image(idx: int) -> Image.Image:
    """Create a clean, well-lit reference image with known statistics."""
    w, h = 256, 256
    img = Image.new("RGB", (w, h))
    draw = ImageDraw.Draw(img)

    # Sky gradient (top third)
    for y in range(h // 3):
        t = y / (h // 3)
        r = int(100 + 50 * t); g = int(149 + 30 * t); b = int(237 - 20 * t)
        draw.line([(0, y), (w, y)], fill=(r, g, b))

    # Ground (bottom two thirds)
    draw.rectangle([0, h // 3, w, h], fill=(80, 100, 60))

    # Central object (varies by index)
    colors = [(220,50,50),(50,100,220),(240,200,50),(50,200,100),(180,80,200),
              (220,140,50),(50,180,180),(200,200,200),(100,60,40),(160,160,80)]
    cx, cy = w // 2, h // 2
    obj_color = colors[idx % len(colors)]
    draw.rectangle([cx-40, cy-30, cx+40, cy+30], fill=obj_color, outline=(255,255,255), width=2)
    draw.text((cx - 20, cy - 8), f"OBJ{idx:02d}", fill=(0, 0, 0))

    return img


# Expected statistics for each stressor (ground truth targets)
STRESSOR_GROUND_TRUTH_STATS = {
    "fog_dense":    {"mean_brightness": (180, 240), "std_dev": (10, 35),  "contrast_range": (20, 80)},
    "night_low":    {"mean_brightness": (0,   30),  "std_dev": (5,  25),  "contrast_range": (10, 60)},
    "motion_blur":  {"laplacian_var":   (0,  200),  "std_dev": (20, 60)},
    "image_noise":  {"std_dev":         (60, 120),  "mean_brightness": (100, 160)},
    "occlusion_80": {"dark_pixel_ratio":(0.3, 0.9)},
    "rain_heavy":   {"std_dev":         (50, 100),  "mean_brightness": (60, 120)},
    "low_contrast": {"contrast_range":  (20,  80),  "mean_brightness": (60, 140)},
}


def apply_ground_truth_stressor(img: Image.Image, stressor: str) -> Image.Image:
    """Apply the CORRECT version of each stressor — this is the reference output."""
    arr = np.array(img, dtype=np.float32)
    w, h = img.size

    if stressor == "fog_dense":
        # Correct fog: blend with white at 70% density + slight blur
        fog = np.ones_like(arr) * 230
        result = arr * 0.30 + fog * 0.70
        img = Image.fromarray(np.clip(result, 0, 255).astype(np.uint8))
        img = img.filter(ImageFilter.GaussianBlur(radius=2))

    elif stressor == "night_low":
        # Correct night: multiply by 0.12, add tiny noise
        result = arr * 0.12 + np.random.normal(0, 5, arr.shape)
        result[:, :, 0] *= 0.7  # reduce red channel
        img = Image.fromarray(np.clip(result, 0, 255).astype(np.uint8))

    elif stressor == "motion_blur":
        # Correct motion blur: strong Gaussian blur (radius 8)
        img = img.filter(ImageFilter.GaussianBlur(radius=8))

    elif stressor == "image_noise":
        # Correct noise: Gaussian noise std=45
        noise = np.random.normal(0, 45, arr.shape)
        img = Image.fromarray(np.clip(arr + noise, 0, 255).astype(np.uint8))

    elif stressor == "occlusion_80":
        # Correct occlusion: cover 80% of image with black patches
        draw = ImageDraw.Draw(img)
        for _ in range(12):
            ox = np.random.randint(0, w - 40)
            oy = np.random.randint(0, h - 40)
            ow = np.random.randint(30, w // 2)
            oh = np.random.randint(30, h // 2)
            draw.rectangle([ox, oy, ox + ow, oy + oh], fill=(0, 0, 0))

    elif stressor == "rain_heavy":
        # Correct rain: darken + diagonal streaks
        result = arr * 0.75
        img2 = Image.fromarray(np.clip(result, 0, 255).astype(np.uint8))
        draw = ImageDraw.Draw(img2)
        for _ in range(1200):
            rx = np.random.randint(0, w)
            ry = np.random.randint(0, h - 15)
            draw.line([(rx, ry), (rx - 3, ry + 14)], fill=(200, 220, 255), width=1)
        img = img2.filter(ImageFilter.GaussianBlur(radius=0.5))

    elif stressor == "low_contrast":
        # Correct low contrast: compress pixel range to 60-140
        result = arr * 0.40 + 60
        img = Image.fromarray(np.clip(result, 0, 255).astype(np.uint8))

    return img


def build_image_benchmark():
    print("\n[1/3] Building image benchmark...")
    clean_dir = BENCHMARK_DIR / "clean"
    clean_dir.mkdir(exist_ok=True)

    clean_images = []
    for i in range(10):
        img = make_clean_image(i)
        path = clean_dir / f"clean_{i:02d}.png"
        img.save(str(path))
        clean_images.append(img)
    print(f"      ✓ {len(clean_images)} clean base images saved")

    gt_stats = {}
    for stressor in STRESSOR_GROUND_TRUTH_STATS.keys():
        gt_dir = BENCHMARK_DIR / "ground_truth" / stressor
        gt_dir.mkdir(parents=True, exist_ok=True)

        stressor_means, stressor_stds, stressor_laps = [], [], []
        stressor_contrasts, stressor_dark_ratios = [], []

        for i, clean_img in enumerate(clean_images):
            corrupted = apply_ground_truth_stressor(clean_img.copy(), stressor)
            path = gt_dir / f"{stressor}_{i:02d}.png"
            corrupted.save(str(path))

            arr = np.array(corrupted, dtype=np.float32)
            gray = arr.mean(axis=2)
            stressor_means.append(float(gray.mean()))
            stressor_stds.append(float(gray.std()))
            stressor_contrasts.append(float(gray.max() - gray.min()))
            stressor_dark_ratios.append(float((gray < 20).mean()))
            gy = np.diff(gray, axis=0); gx = np.diff(gray, axis=1)
            stressor_laps.append(float(np.var(gy) + np.var(gx)))

        gt_stats[stressor] = {
            "mean_brightness":   {"mean": float(np.mean(stressor_means)),   "std": float(np.std(stressor_means))},
            "std_dev":           {"mean": float(np.mean(stressor_stds)),    "std": float(np.std(stressor_stds))},
            "contrast_range":    {"mean": float(np.mean(stressor_contrasts)),"std": float(np.std(stressor_contrasts))},
            "dark_pixel_ratio":  {"mean": float(np.mean(stressor_dark_ratios)),"std": float(np.std(stressor_dark_ratios))},
            "laplacian_var":     {"mean": float(np.mean(stressor_laps)),    "std": float(np.std(stressor_laps))},
            "expected_ranges":   STRESSOR_GROUND_TRUTH_STATS[stressor],
        }
        print(f"      ✓ {stressor}: mean_brightness={np.mean(stressor_means):.1f}, std={np.mean(stressor_stds):.1f}")

    return gt_stats


# ══════════════════════════════════════════════════════════════════
#  PART 2 — TABULAR BENCHMARK
# ══════════════════════════════════════════════════════════════════

TABULAR_GT_STATS = {
    "missing_values":    {"missing_ratio":    {"target": 0.25, "tolerance": 0.05}},
    "ood_inputs":        {"outlier_ratio":    {"target": 0.20, "tolerance": 0.05}},
    "class_imbalance":   {"majority_ratio":   {"target": 0.95, "tolerance": 0.03}},
    "noisy_categorical": {"avg_feature_std":  {"target": 3.50, "tolerance": 0.50}},
    "feature_dropout":   {"zero_col_ratio":   {"target": 0.33, "tolerance": 0.05}},
}


def build_tabular_benchmark():
    print("\n[2/3] Building tabular benchmark...")
    tab_dir = BENCHMARK_DIR / "tabular"
    tab_dir.mkdir(exist_ok=True)

    N = 500
    n_features = 20
    feature_names = [f"feature_{i:02d}" for i in range(n_features)]

    # Clean baseline
    X_clean = np.random.randn(N, n_features)
    y_clean = (X_clean[:, 0] + X_clean[:, 1] * 0.5 + np.random.randn(N) * 0.3 > 0).astype(int)

    with open(tab_dir / "clean_baseline.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(feature_names + ["label"])
        for i in range(N):
            w.writerow([round(float(v), 4) for v in X_clean[i]] + [int(y_clean[i])])

    gt_stats = {}

    # missing_values GT: exactly 25% NaN
    X_mv = X_clean.astype(object).copy()
    mask = np.random.rand(N, n_features) < 0.25
    X_mv[mask] = ""
    with open(tab_dir / "missing_values_gt.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(feature_names + ["label", "stressor"])
        for i in range(N):
            w.writerow(list(X_mv[i]) + [int(y_clean[i]), "missing_values"])
    actual_missing = float(mask.mean())
    gt_stats["missing_values"] = {"missing_ratio": actual_missing}
    print(f"      ✓ missing_values: NaN rate={actual_missing:.2%}")

    # ood_inputs GT: 20% rows with z-score > 5
    X_ood = X_clean.copy()
    ood_idx = np.random.choice(N, N // 5, replace=False)
    X_ood[ood_idx] *= np.random.uniform(8, 15, (len(ood_idx), n_features))
    with open(tab_dir / "ood_inputs_gt.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(feature_names + ["label", "stressor"])
        for i in range(N):
            w.writerow([round(float(v), 4) for v in X_ood[i]] + [int(y_clean[i]), "ood_inputs"])
    flat = X_ood.flatten()
    z = np.abs((flat - flat.mean()) / (flat.std() + 1e-8))
    actual_outlier = float((z > 4).mean())
    gt_stats["ood_inputs"] = {"outlier_ratio": actual_outlier}
    print(f"      ✓ ood_inputs: outlier rate={actual_outlier:.2%}")

    # class_imbalance GT: 95:5 ratio
    n_minority = int(N * 0.05)
    n_majority = N - n_minority
    X_imb = np.vstack([X_clean[:n_majority], X_clean[:n_minority]])
    y_imb = np.array([0] * n_majority + [1] * n_minority)
    with open(tab_dir / "class_imbalance_gt.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(feature_names + ["label", "stressor"])
        for i in range(len(X_imb)):
            w.writerow([round(float(v), 4) for v in X_imb[i]] + [int(y_imb[i]), "class_imbalance"])
    actual_majority = float(n_majority / len(y_imb))
    gt_stats["class_imbalance"] = {"majority_ratio": actual_majority}
    print(f"      ✓ class_imbalance: majority ratio={actual_majority:.2%}")

    # noisy_categorical GT: add std=3.5 noise to 25% of rows
    X_noisy = X_clean.copy()
    noise_idx = np.random.choice(N, N // 4, replace=False)
    X_noisy[noise_idx] += np.random.randn(len(noise_idx), n_features) * 3.5
    with open(tab_dir / "noisy_categorical_gt.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(feature_names + ["label", "stressor"])
        for i in range(N):
            w.writerow([round(float(v), 4) for v in X_noisy[i]] + [int(y_clean[i]), "noisy_categorical"])
    actual_std = float(np.mean([np.std(X_noisy[:, c]) for c in range(n_features)]))
    gt_stats["noisy_categorical"] = {"avg_feature_std": actual_std}
    print(f"      ✓ noisy_categorical: avg std={actual_std:.2f}")

    # feature_dropout GT: zero out 33% of columns
    X_drop = X_clean.copy()
    drop_cols = np.random.choice(n_features, n_features // 3, replace=False)
    X_drop[:, drop_cols] = 0
    with open(tab_dir / "feature_dropout_gt.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(feature_names + ["label", "stressor"])
        for i in range(N):
            w.writerow([round(float(v), 4) for v in X_drop[i]] + [int(y_clean[i]), "feature_dropout"])
    actual_zero_ratio = float(len(drop_cols) / n_features)
    gt_stats["feature_dropout"] = {"zero_col_ratio": actual_zero_ratio}
    print(f"      ✓ feature_dropout: zero col ratio={actual_zero_ratio:.2%}")

    return gt_stats


# ══════════════════════════════════════════════════════════════════
#  PART 3 — SEQUENTIAL BENCHMARK
# ══════════════════════════════════════════════════════════════════

VOCAB = ["the","a","is","was","object","model","detected","failed","error",
         "warning","sensor","camera","input","output","class","label","score",
         "confidence","low","high","medium","critical","normal","anomaly",
         "drift","noise","system","data","feature","value","result","test"]

SEQUENTIAL_GT_STATS = {
    "oov_tokens":          {"oov_ratio":        {"target": 0.50, "tolerance": 0.10}},
    "adversarial_perturbation": {"perturbed_ratio": {"target": 0.60, "tolerance": 0.10}},
    "long_range":          {"avg_length":       {"target": 80,   "tolerance": 20}},
    "length_mismatch":     {"length_cv":        {"target": 1.20, "tolerance": 0.20}},
}


def build_sequential_benchmark():
    print("\n[3/3] Building sequential benchmark...")
    seq_dir = BENCHMARK_DIR / "sequential"
    seq_dir.mkdir(exist_ok=True)

    N = 200

    # Clean baseline
    with open(seq_dir / "clean_baseline.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["text", "label", "stressor"])
        for _ in range(N):
            length = np.random.randint(10, 25)
            tokens = [np.random.choice(VOCAB) for _ in range(length)]
            w.writerow([" ".join(tokens), 0, "clean"])

    gt_stats = {}

    # oov_tokens GT: 50% of samples have OOV tokens
    rows_oov = []
    for i in range(N):
        length = np.random.randint(10, 20)
        tokens = [np.random.choice(VOCAB) for _ in range(length)]
        if i < N // 2:  # 50% have OOV
            for _ in range(np.random.randint(2, 5)):
                pos = np.random.randint(0, len(tokens))
                tokens[pos] = f"xkz{np.random.randint(100, 999)}"
            label = 1
        else:
            label = 0
        rows_oov.append((" ".join(tokens), label))
    with open(seq_dir / "oov_tokens_gt.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["text", "label", "stressor"])
        for text, lbl in rows_oov:
            w.writerow([text, lbl, "oov_tokens"])
    oov_ratio = sum(1 for _, l in rows_oov if l == 1) / N
    gt_stats["oov_tokens"] = {"oov_ratio": oov_ratio}
    print(f"      ✓ oov_tokens: OOV sample ratio={oov_ratio:.2%}")

    # adversarial GT: 60% of samples have character-level perturbations
    rows_adv = []
    for i in range(N):
        length = np.random.randint(10, 20)
        tokens = [np.random.choice(VOCAB) for _ in range(length)]
        if i < int(N * 0.60):
            for _ in range(np.random.randint(2, 4)):
                pos = np.random.randint(0, len(tokens))
                t = tokens[pos]
                if len(t) > 2:
                    tokens[pos] = t[0] + t[2:] + t[1]  # swap chars
            label = 1
        else:
            label = 0
        rows_adv.append((" ".join(tokens), label))
    with open(seq_dir / "adversarial_gt.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["text", "label", "stressor"])
        for text, lbl in rows_adv:
            w.writerow([text, lbl, "adversarial_perturbation"])
    adv_ratio = sum(1 for _, l in rows_adv if l == 1) / N
    gt_stats["adversarial_perturbation"] = {"perturbed_ratio": adv_ratio}
    print(f"      ✓ adversarial: perturbed ratio={adv_ratio:.2%}")

    # long_range GT: avg length = 80 tokens
    rows_long = []
    for _ in range(N):
        length = np.random.randint(60, 100)
        tokens = [np.random.choice(VOCAB) for _ in range(length)]
        rows_long.append(" ".join(tokens))
    with open(seq_dir / "long_range_gt.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["text", "label", "stressor"])
        for text in rows_long:
            w.writerow([text, 1, "long_range"])
    avg_len = float(np.mean([len(t.split()) for t in rows_long]))
    gt_stats["long_range"] = {"avg_length": avg_len}
    print(f"      ✓ long_range: avg length={avg_len:.1f} tokens")

    # length_mismatch GT: mix of 2-token and 80-token sequences (high CV)
    rows_len = []
    for i in range(N):
        if i % 2 == 0:
            length = np.random.randint(1, 4)   # very short
        else:
            length = np.random.randint(60, 100) # very long
        tokens = [np.random.choice(VOCAB) for _ in range(length)]
        rows_len.append(" ".join(tokens))
    with open(seq_dir / "length_mismatch_gt.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["text", "label", "stressor"])
        for text in rows_len:
            w.writerow([text, 1, "length_mismatch"])
    lengths = [len(t.split()) for t in rows_len]
    cv = float(np.std(lengths) / (np.mean(lengths) + 1e-8))
    gt_stats["length_mismatch"] = {"length_cv": cv}
    print(f"      ✓ length_mismatch: length CV={cv:.2f}")

    return gt_stats


# ══════════════════════════════════════════════════════════════════
#  SAVE BENCHMARK STATS
# ══════════════════════════════════════════════════════════════════

def main():
    img_stats = build_image_benchmark()
    tab_stats = build_tabular_benchmark()
    seq_stats = build_sequential_benchmark()

    benchmark = {
        "version":     "1.0",
        "description": "BlindSpot.AI ground truth benchmark — fixed reference dataset for measuring dataset generation accuracy",
        "n_clean_images": 10,
        "image":       img_stats,
        "tabular":     tab_stats,
        "sequential":  seq_stats,
    }

    stats_path = BENCHMARK_DIR / "benchmark_stats.json"
    with open(stats_path, "w", encoding="utf-8") as f:
        json.dump(benchmark, f, indent=2)

    print(f"\n  ✓ Benchmark stats saved: {stats_path}")
    print(f"\n{'=' * 65}")
    print(f"  Benchmark built successfully.")
    print(f"  Location: {BENCHMARK_DIR}")
    print(f"  Now run:  python evaluate_generation_accuracy.py")
    print(f"{'=' * 65}\n")


if __name__ == "__main__":
    main()
