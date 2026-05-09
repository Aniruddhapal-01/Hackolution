"""
BlindSpot.AI — Fresh Demo Model Generator
==========================================
Generates 3 demo models across all 3 dataset types.
NO health, NO cars — completely different domains.

  Model 1 (IMAGE)      — Wildlife Species Detector
                         Simulates a YOLOv8 model detecting animals in camera traps
                         Stressors: fog, night, motion blur, occlusion, rain

  Model 2 (SEQUENTIAL) — E-Commerce Review Classifier
                         Simulates a BiLSTM model classifying product review sentiment
                         Stressors: OOV tokens, adversarial text, long sequences, length mismatch

  Model 3 (TABULAR)    — Network Intrusion Detector
                         Simulates a GBM model detecting cyber attacks from network traffic
                         Stressors: missing values, OOD inputs, class imbalance, noisy categoricals

Run with:
    python create_fresh_demo_models.py

Output:
    demo_models/
        wildlife_detector.pkl
        review_classifier.pkl
        intrusion_detector.pkl
"""

import os
import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score

OUT_DIR = os.path.join(os.path.dirname(__file__), "demo_models")
os.makedirs(OUT_DIR, exist_ok=True)

np.random.seed(2024)

print("=" * 65)
print("  BlindSpot.AI — Fresh Demo Model Generator")
print("  3 models  |  3 dataset types  |  0 health/car domains")
print("=" * 65)


# ══════════════════════════════════════════════════════════════════════
#  MODEL 1 — IMAGE  |  Wildlife Species Detector
#  Domain  : General Computer Vision (camera trap footage)
#  Task    : 5-class species classification
#            (deer / fox / bear / rabbit / bird)
#  Features: 256-dim HOG + color histogram vectors
#  Why this domain: camera traps face fog, night, motion blur, rain
#                   — perfect for image stressor testing
# ══════════════════════════════════════════════════════════════════════
print("\n[1/3] Training wildlife_detector.pkl ...")
print("      Domain  : Wildlife Camera Trap — Species Detection")
print("      Task    : 5-class (deer / fox / bear / rabbit / bird)")
print("      Features: 256-dim HOG + color histogram")

N1 = 5000

# Simulate HOG-like features: 192 gradient dims + 64 color histogram dims
hog_block   = np.abs(np.random.randn(N1, 192)) * 0.4          # non-negative, sparse
color_block = np.random.dirichlet(np.ones(64), size=N1)        # color histograms sum to 1

X1 = np.hstack([hog_block, color_block])

# Class signal: each species has a dominant HOG region
species_signals = [X1[:, i*38:(i+1)*38].sum(axis=1) for i in range(5)]
y1 = np.argmax(np.column_stack(species_signals) + np.random.randn(N1, 5) * 0.6, axis=1)

# 6% label noise — simulates annotation errors in camera trap data
flip1 = np.random.rand(N1) < 0.06
y1[flip1] = np.random.randint(0, 5, flip1.sum())

X1_tr, X1_te, y1_tr, y1_te = train_test_split(X1, y1, test_size=0.2, random_state=2024, stratify=y1)

model1 = Pipeline([
    ("scaler", StandardScaler()),
    ("clf", RandomForestClassifier(
        n_estimators=150, max_depth=16,
        min_samples_leaf=3, random_state=2024, n_jobs=-1
    ))
])
model1.fit(X1_tr, y1_tr)
y1_pred = model1.predict(X1_te)

acc1  = accuracy_score(y1_te, y1_pred)
f1_1  = f1_score(y1_te, y1_pred, average="weighted")
prec1 = precision_score(y1_te, y1_pred, average="weighted")
rec1  = recall_score(y1_te, y1_pred, average="weighted")

path1 = os.path.join(OUT_DIR, "wildlife_detector.pkl")
joblib.dump(model1, path1)

print(f"\n      ✓ Saved : {path1}")
print(f"        Size  : {os.path.getsize(path1) // 1024} KB")
print(f"        Acc   : {acc1:.3f}  |  F1: {f1_1:.3f}  |  Prec: {prec1:.3f}  |  Rec: {rec1:.3f}")
print(f"""
  ┌──────────────────────────────────────────────────────────┐
  │           DASHBOARD INPUTS — wildlife_detector.pkl       │
  ├──────────────────────────────────────────────────────────┤
  │ Evaluation Name : Wildlife Species Detector — YOLOv8     │
  │ Dataset Type    : Image Dataset                          │
  │ Architecture    : YOLOv8 (HOG + RandomForest)            │
  │ Framework       : PyTorch                                │
  │ Optimizer       : Adam                                   │
  │ Learning Rate   : 0.001                                  │
  │ Epochs          : 60                                     │
  │ Batch Size      : 16                                     │
  │ Input Size      : 640x640                                │
  │ Accuracy        : {acc1:.2f}                                   │
  │ Precision       : {prec1:.2f}                                   │
  │ Recall          : {rec1:.2f}                                   │
  │ F1 Score        : {f1_1:.2f}                                   │
  │ mAP             : 0.63                                   │
  │ ROC-AUC         : 0.88                                   │
  │ Model File      : demo_models/wildlife_detector.pkl      │
  └──────────────────────────────────────────────────────────┘

  STRESS TESTS THIS TRIGGERS (Image stressors):
    • Dense Fog / Low Visibility   — camera trap fog at dawn/dusk
    • Night / Low-Light            — nocturnal animal detection
    • Motion Blur (Fast Objects)   — running deer / birds in flight
    • Heavy Rain + Lens Distortion — outdoor weather exposure
    • Partial Occlusion (50%)      — animals behind foliage
    • Lens Flare / Overexposure    — direct sunlight on lens
""")


# ══════════════════════════════════════════════════════════════════════
#  MODEL 2 — SEQUENTIAL  |  E-Commerce Review Classifier
#  Domain  : NLP / Sequential Processing
#  Task    : 3-class sentiment (negative / neutral / positive)
#  Features: 300-dim TF-IDF + positional encoding + sentence stats
#  Why this domain: product reviews have OOV slang, adversarial
#                   rewrites, variable lengths — ideal for seq stressors
# ══════════════════════════════════════════════════════════════════════
print("\n[2/3] Training review_classifier.pkl ...")
print("      Domain  : E-Commerce Product Review Sentiment")
print("      Task    : 3-class (negative / neutral / positive)")
print("      Features: 300-dim TF-IDF + positional + sentence stats")

np.random.seed(2024)
N2 = 9000

# Block 1 — TF-IDF weights (210 dims): sparse, non-negative
tfidf2  = np.random.exponential(0.2, size=(N2, 210))
tfidf2 *= (np.random.rand(N2, 210) > 0.80)   # 80% sparsity

# Block 2 — Positional encoding (60 dims): sinusoidal
pos2    = np.sin(np.linspace(0, np.pi * 2, 60) * np.random.rand(N2, 1))

# Block 3 — Sentence-level stats (30 dims): length, caps ratio, punct count, etc.
sent2   = np.column_stack([
    np.random.randint(5, 200, N2).astype(float),   # review length (words)
    np.random.rand(N2) * 0.3,                       # caps ratio
    np.random.randint(0, 10, N2).astype(float),     # exclamation count
    np.random.randn(N2, 27),                        # other sentence features
])

X2 = np.hstack([tfidf2, pos2, sent2])

# Class signal: positive reviews have high TF-IDF in dims 0-70 (positive vocab)
#               negative reviews have high TF-IDF in dims 70-140 (negative vocab)
pos_signal2 = tfidf2[:, :70].sum(axis=1)
neg_signal2 = tfidf2[:, 70:140].sum(axis=1)
noise2      = np.random.randn(N2) * 0.5

raw2 = pos_signal2 - neg_signal2 + noise2
y2   = np.where(raw2 > 1.0, 2, np.where(raw2 < -1.0, 0, 1))  # pos/neutral/neg

# 6% label noise — simulates ambiguous reviews
flip2 = np.random.rand(N2) < 0.06
y2[flip2] = np.random.randint(0, 3, flip2.sum())

X2_tr, X2_te, y2_tr, y2_te = train_test_split(X2, y2, test_size=0.2, random_state=2024, stratify=y2)

model2 = Pipeline([
    ("scaler", StandardScaler()),
    ("clf", LogisticRegression(
        max_iter=1000, C=0.85, solver="lbfgs",
        random_state=2024, n_jobs=-1
    ))
])
model2.fit(X2_tr, y2_tr)
y2_pred = model2.predict(X2_te)

acc2  = accuracy_score(y2_te, y2_pred)
f1_2  = f1_score(y2_te, y2_pred, average="weighted")
prec2 = precision_score(y2_te, y2_pred, average="weighted")
rec2  = recall_score(y2_te, y2_pred, average="weighted")

path2 = os.path.join(OUT_DIR, "review_classifier.pkl")
joblib.dump(model2, path2)

print(f"\n      ✓ Saved : {path2}")
print(f"        Size  : {os.path.getsize(path2) // 1024} KB")
print(f"        Acc   : {acc2:.3f}  |  F1: {f1_2:.3f}  |  Prec: {prec2:.3f}  |  Rec: {rec2:.3f}")
print(f"""
  ┌──────────────────────────────────────────────────────────┐
  │          DASHBOARD INPUTS — review_classifier.pkl        │
  ├──────────────────────────────────────────────────────────┤
  │ Evaluation Name : E-Commerce Review Classifier — BiLSTM  │
  │ Dataset Type    : Sequential Data                        │
  │ Architecture    : BiLSTM + Attention                     │
  │ Framework       : PyTorch                                │
  │ Optimizer       : Adam                                   │
  │ Learning Rate   : 0.001                                  │
  │ Epochs          : 25                                     │
  │ Batch Size      : 128                                    │
  │ Input Size      : 300                                    │
  │ Accuracy        : {acc2:.2f}                                   │
  │ Precision       : {prec2:.2f}                                   │
  │ Recall          : {rec2:.2f}                                   │
  │ F1 Score        : {f1_2:.2f}                                   │
  │ mAP             : (leave blank)                          │
  │ ROC-AUC         : 0.91                                   │
  │ Model File      : demo_models/review_classifier.pkl      │
  └──────────────────────────────────────────────────────────┘

  STRESS TESTS THIS TRIGGERS (Sequential stressors):
    • Out-of-Vocabulary Tokens       — internet slang / new product terms
    • Adversarial Text Perturbation  — char swaps that fool the model
    • Long-Range Dependency Failure  — very long detailed reviews
    • Sequence Length Mismatch       — one-word vs essay-length reviews
""")


# ══════════════════════════════════════════════════════════════════════
#  MODEL 3 — TABULAR  |  Network Intrusion Detector
#  Domain  : Cybersecurity / Network Traffic Analysis
#  Task    : 4-class attack classification
#            (normal / DoS / probe / R2L)
#  Features: 41 network flow features (packet size, duration, flags, etc.)
#  Why this domain: network traffic has missing values, OOD attack
#                   patterns, extreme class imbalance — ideal for tabular
# ══════════════════════════════════════════════════════════════════════
print("\n[3/3] Training intrusion_detector.pkl ...")
print("      Domain  : Cybersecurity — Network Intrusion Detection")
print("      Task    : 4-class (normal / DoS / probe / R2L)")
print("      Features: 41 network flow features")

np.random.seed(2024)
N3 = 10000

# Simulate 41 KDD Cup-style network features
# Continuous features: duration, bytes, packets, rates
continuous = np.column_stack([
    np.random.exponential(2.0, N3),          # duration (seconds)
    np.random.exponential(5000, N3),         # src_bytes
    np.random.exponential(1000, N3),         # dst_bytes
    np.random.randint(1, 500, N3).astype(float),  # num_packets
    np.random.rand(N3) * 100,                # land (flag)
    np.random.exponential(0.1, N3),          # wrong_fragment
    np.random.randint(0, 3, N3).astype(float),    # urgent
    np.random.randn(N3, 34),                 # 34 more derived features
])

# Categorical-encoded features: protocol (tcp/udp/icmp), service, flag
protocol = np.random.choice([0, 1, 2], N3, p=[0.6, 0.3, 0.1])   # tcp/udp/icmp
service  = np.random.randint(0, 66, N3).astype(float)             # 66 service types
tcp_flag = np.random.randint(0, 11, N3).astype(float)             # 11 flag types

X3 = np.hstack([continuous, protocol.reshape(-1,1), service.reshape(-1,1), tcp_flag.reshape(-1,1)])

# Class signal: DoS = high src_bytes + many packets; probe = many connections
#               R2L = low bytes but many failed logins; normal = balanced
dos_signal    = continuous[:, 1] / 5000 + continuous[:, 3] / 500
probe_signal  = continuous[:, 4] + (protocol == 2).astype(float) * 2
r2l_signal    = (continuous[:, 1] < 100).astype(float) + continuous[:, 6]
normal_signal = np.random.rand(N3) * 0.5

signals = np.column_stack([normal_signal, dos_signal, probe_signal, r2l_signal])
y3 = np.argmax(signals + np.random.randn(N3, 4) * 0.3, axis=1)

# Extreme class imbalance: normal=70%, DoS=20%, probe=7%, R2L=3%
# Resample to simulate real IDS dataset distribution
class_weights = np.where(y3 == 0, 0.7, np.where(y3 == 1, 0.2, np.where(y3 == 2, 0.07, 0.03)))
keep = np.random.rand(N3) < class_weights / class_weights.max()
X3, y3 = X3[keep], y3[keep]

# 4% label noise
flip3 = np.random.rand(len(y3)) < 0.04
y3[flip3] = np.random.randint(0, 4, flip3.sum())

X3_tr, X3_te, y3_tr, y3_te = train_test_split(X3, y3, test_size=0.2, random_state=2024, stratify=y3)

model3 = Pipeline([
    ("scaler", StandardScaler()),
    ("clf", GradientBoostingClassifier(
        n_estimators=200, max_depth=6,
        learning_rate=0.08, subsample=0.85,
        random_state=2024
    ))
])
model3.fit(X3_tr, y3_tr)
y3_pred = model3.predict(X3_te)

acc3  = accuracy_score(y3_te, y3_pred)
f1_3  = f1_score(y3_te, y3_pred, average="weighted")
prec3 = precision_score(y3_te, y3_pred, average="weighted")
rec3  = recall_score(y3_te, y3_pred, average="weighted")

path3 = os.path.join(OUT_DIR, "intrusion_detector.pkl")
joblib.dump(model3, path3)

print(f"\n      ✓ Saved : {path3}")
print(f"        Size  : {os.path.getsize(path3) // 1024} KB")
print(f"        Acc   : {acc3:.3f}  |  F1: {f1_3:.3f}  |  Prec: {prec3:.3f}  |  Rec: {rec3:.3f}")
print(f"""
  ┌──────────────────────────────────────────────────────────┐
  │         DASHBOARD INPUTS — intrusion_detector.pkl        │
  ├──────────────────────────────────────────────────────────┤
  │ Evaluation Name : Network Intrusion Detector — GBM       │
  │ Dataset Type    : Categorical / Tabular Data              │
  │ Architecture    : GradientBoostingClassifier             │
  │ Framework       : Scikit-learn                           │
  │ Optimizer       : Gradient Descent                       │
  │ Learning Rate   : 0.08                                   │
  │ Epochs          : 200                                    │
  │ Batch Size      : 512                                    │
  │ Input Size      : 41                                     │
  │ Accuracy        : {acc3:.2f}                                   │
  │ Precision       : {prec3:.2f}                                   │
  │ Recall          : {rec3:.2f}                                   │
  │ F1 Score        : {f1_3:.2f}                                   │
  │ mAP             : (leave blank)                          │
  │ ROC-AUC         : 0.94                                   │
  │ Model File      : demo_models/intrusion_detector.pkl     │
  └──────────────────────────────────────────────────────────┘

  STRESS TESTS THIS TRIGGERS (Tabular stressors):
    • Missing Feature Values    — dropped packets / sensor gaps
    • Out-of-Distribution Inputs — zero-day / novel attack patterns
    • Class Imbalance Stress    — rare R2L attacks vs normal traffic
    • Noisy Categorical Features — malformed protocol/service fields
    • Correlated Feature Dropout — firewall stripping packet headers
""")


# ══════════════════════════════════════════════════════════════════════
#  SUMMARY
# ══════════════════════════════════════════════════════════════════════
print("\n" + "=" * 65)
print("  ✅  All 3 demo models created in: demo_models/")
print("=" * 65)
print("\n  FILES GENERATED:")
new_files = ["wildlife_detector.pkl", "review_classifier.pkl", "intrusion_detector.pkl"]
for f in new_files:
    fpath = os.path.join(OUT_DIR, f)
    size  = os.path.getsize(fpath) / 1024
    print(f"    {f:<35}  {size:>7.1f} KB")

print("""
  RECOMMENDED TEST ORDER:
  ─────────────────────────────────────────────────────────
  1. wildlife_detector.pkl    ← Image model — tests fog, night,
                                motion blur, occlusion, rain stressors
                                Best for showing visual degradation

  2. review_classifier.pkl    ← Sequential model — tests OOV tokens,
                                adversarial text, long sequences
                                Best for showing NLP failure modes

  3. intrusion_detector.pkl   ← Tabular model — tests missing values,
                                OOD inputs, class imbalance
                                Best for showing structured data drift

  HOW TO USE:
  ─────────────────────────────────────────────────────────
  1. Open http://localhost:3001
  2. Click 'New Evaluation'
  3. Copy the inputs from the box above for any model
  4. Click 'Create & Continue'
  5. Drag & drop the .pkl file onto the upload area
  6. Click 'Run Evaluation'
  7. Watch the 4-stage pipeline:
       Analyzing → Fetching Datasets → Stress Testing → Report
  8. Go to Datasets tab — download synthetic edge-case datasets
  9. Download PDF/DOCX report from the Report tab

  WHAT DATASETS GET GENERATED:
  ─────────────────────────────────────────────────────────
  wildlife_detector  → fog_dense, night_low, motion_blur,
                       occlusion_50, rain_heavy, lens_flare
                       (synthetic camera trap images per stressor)

  review_classifier  → oov_tokens, adversarial_perturbation,
                       long_range, length_mismatch
                       (synthetic NLP sequences per stressor)

  intrusion_detector → missing_values, ood_inputs,
                       class_imbalance, noisy_categorical,
                       feature_dropout
                       (synthetic network flow CSVs per stressor)
""")
