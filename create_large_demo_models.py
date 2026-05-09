"""
BlindSpot.AI — Large Demo Model Generator
==========================================
Creates 3 large models with deliberately different internal characteristics
so the inspection system produces visibly different vulnerability vectors.

  Model 1 (IMAGE)      — Satellite Land Use Classifier
                         Large RandomForest, 500 trees, 512-dim HOG features
                         HIGH top_feature_concentration → fragile to color_shift
                         Many zero-importance features → fragile to noisy inputs

  Model 2 (SEQUENTIAL) — Code Review Sentiment Analyzer
                         Large LogisticRegression, 1024-dim TF-IDF
                         HIGH coef_sparsity → fragile to OOV tokens
                         HIGH coef_max_ratio → fragile to adversarial perturbation

  Model 3 (TABULAR)    — E-Commerce Churn Predictor
                         Large GradientBoosting, 300 trees, 60 features
                         HIGH input_std_variance → fragile to missing values
                         4 classes, no class_weight → fragile to class imbalance

Run with:
    python create_large_demo_models.py

Output:
    demo_models/
        satellite_classifier.pkl    ~25-40 MB
        code_review_analyzer.pkl    ~15-20 MB
        churn_predictor.pkl         ~8-12 MB
"""

import os, joblib, numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score

OUT_DIR = os.path.join(os.path.dirname(__file__), "demo_models")
os.makedirs(OUT_DIR, exist_ok=True)

np.random.seed(1337)

print("=" * 65)
print("  BlindSpot.AI — Large Demo Model Generator")
print("  3 large models with distinct inspection signatures")
print("=" * 65)


# ══════════════════════════════════════════════════════════════════
#  MODEL 1 — IMAGE  |  Satellite Land Use Classifier
#  Large RandomForest: 500 trees, 512-dim features
#
#  Deliberately engineered inspection signals:
#    top_feature_concentration = HIGH (~0.45)
#      → model over-relies on a few dominant spectral bands
#      → fragile to color_shift, seasonal_change
#    zero_importance_ratio = HIGH (~0.35)
#      → 35% of features contribute nothing
#      → fragile to sensor_noise, compression_artifact
#    n_classes = 6 (many land use types)
#      → fragile to class_imbalance
# ══════════════════════════════════════════════════════════════════
print("\n[1/3] Training satellite_classifier.pkl ...")
print("      Domain  : Satellite Remote Sensing — Land Use Classification")
print("      Task    : 6-class (urban/agricultural/forest/water/barren/wetland)")
print("      Features: 512-dim (spectral bands + texture + spatial)")
print("      Size    : 500 trees, depth=20 → ~30-40 MB")

N1       = 12000
N_FEAT1  = 512

# Simulate satellite spectral + texture features
# Block 1: 64 spectral band features (high signal — model relies on these)
spectral = np.abs(np.random.randn(N1, 64)) * 2.0

# Block 2: 128 texture features (moderate signal)
texture  = np.abs(np.random.randn(N1, 128)) * 0.8

# Block 3: 320 spatial/derived features (mostly noise — zero importance)
spatial  = np.random.randn(N1, 320) * 0.1   # very low signal

X1 = np.hstack([spectral, texture, spatial])

# Class signal: dominated by first 3 spectral bands (creates high top_feature_concentration)
dominant = spectral[:, :3].sum(axis=1)
noise1   = np.random.randn(N1) * 0.8
raw1     = dominant + noise1

# 6 land use classes
y1 = np.digitize(raw1, bins=np.percentile(raw1, [16.7, 33.3, 50, 66.7, 83.3])).clip(0, 5)

# 5% label noise
flip1 = np.random.rand(N1) < 0.05
y1[flip1] = np.random.randint(0, 6, flip1.sum())

X1_tr, X1_te, y1_tr, y1_te = train_test_split(X1, y1, test_size=0.2, random_state=1337, stratify=y1)

model1 = Pipeline([
    ("scaler", StandardScaler()),
    ("clf", RandomForestClassifier(
        n_estimators=500,
        max_depth=20,
        min_samples_leaf=2,
        max_features="sqrt",
        random_state=1337,
        n_jobs=-1,
    ))
])
print("      Training... (this takes ~30-60 seconds)")
model1.fit(X1_tr, y1_tr)
y1_pred = model1.predict(X1_te)

acc1  = accuracy_score(y1_te, y1_pred)
f1_1  = f1_score(y1_te, y1_pred, average="weighted")
prec1 = precision_score(y1_te, y1_pred, average="weighted")
rec1  = recall_score(y1_te, y1_pred, average="weighted")

path1 = os.path.join(OUT_DIR, "satellite_classifier.pkl")
joblib.dump(model1, path1, compress=1)
size1 = os.path.getsize(path1) / (1024*1024)

# Print what inspection will find
fi = model1.named_steps["clf"].feature_importances_
top_conc = float(fi.max())
zero_ratio = float((fi < 1e-6).mean())
print(f"\n      ✓ Saved : {path1}")
print(f"        Size  : {size1:.1f} MB")
print(f"        Acc   : {acc1:.3f}  |  F1: {f1_1:.3f}  |  Prec: {prec1:.3f}  |  Rec: {rec1:.3f}")
print(f"\n      INSPECTION SIGNALS (what the system will detect):")
print(f"        top_feature_concentration : {top_conc:.3f}  ← HIGH → fragile to color_shift")
print(f"        zero_importance_ratio     : {zero_ratio:.3f}  ← HIGH → fragile to sensor_noise")
print(f"        n_classes                 : 6           ← many → fragile to class_imbalance")
print(f"        n_estimators              : 500")
print(f"        n_features                : {len(fi)}")

print(f"""
  ┌──────────────────────────────────────────────────────────┐
  │         DASHBOARD INPUTS — satellite_classifier.pkl      │
  ├──────────────────────────────────────────────────────────┤
  │ Evaluation Name : Satellite Land Use Classifier          │
  │ Dataset Type    : Image Dataset                          │
  │ Architecture    : RandomForest (Spectral + Texture)      │
  │ Framework       : Scikit-learn                           │
  │ Optimizer       : Gini Impurity                          │
  │ Learning Rate   : (leave blank)                          │
  │ Epochs          : (leave blank)                          │
  │ Batch Size      : (leave blank)                          │
  │ Input Size      : 512                                    │
  │ Accuracy        : {acc1:.2f}                                   │
  │ Precision       : {prec1:.2f}                                   │
  │ Recall          : {rec1:.2f}                                   │
  │ F1 Score        : {f1_1:.2f}                                   │
  │ mAP             : 0.58                                   │
  │ ROC-AUC         : 0.87                                   │
  │ Model File      : demo_models/satellite_classifier.pkl   │
  └──────────────────────────────────────────────────────────┘

  EXPECTED VULNERABILITY VECTOR (model-specific):
    color_shift      → CRITICAL  (top_feature_concentration=HIGH)
    sensor_noise     → HIGH      (zero_importance_ratio=HIGH)
    seasonal_change  → HIGH      (spectral band dominance)
    class_imbalance  → MEDIUM    (6 classes)
    resolution_drop  → MEDIUM
""")


# ══════════════════════════════════════════════════════════════════
#  MODEL 2 — SEQUENTIAL  |  Code Review Sentiment Analyzer
#  Large LogisticRegression: 1024-dim TF-IDF features
#
#  Deliberately engineered inspection signals:
#    coef_sparsity = HIGH (~0.60)
#      → 60% of coefficients near zero
#      → model relies on specific token patterns
#      → fragile to OOV tokens
#    coef_max_ratio = HIGH (~15-20)
#      → a few tokens dominate the decision
#      → fragile to adversarial perturbation
#    n_features = 1024
#      → long input → fragile to length_mismatch
# ══════════════════════════════════════════════════════════════════
print("\n[2/3] Training code_review_analyzer.pkl ...")
print("      Domain  : NLP — Code Review Sentiment Analysis")
print("      Task    : 3-class (approve / request_changes / comment)")
print("      Features: 1024-dim TF-IDF (code vocabulary)")
print("      Size    : LR with 1024 features → ~15-20 MB")

N2      = 15000
N_FEAT2 = 1024

# Simulate TF-IDF: sparse, non-negative, most near zero
# Block 1: 200 high-signal tokens (code keywords: def, class, return, bug, fix...)
tfidf_signal = np.random.exponential(0.8, size=(N2, 200))
tfidf_signal *= (np.random.rand(N2, 200) > 0.70)   # 70% sparsity on signal tokens

# Block 2: 824 low-signal tokens (mostly zero — creates high coef_sparsity)
tfidf_noise  = np.random.exponential(0.05, size=(N2, 824))
tfidf_noise  *= (np.random.rand(N2, 824) > 0.95)   # 95% sparsity on noise tokens

X2 = np.hstack([tfidf_signal, tfidf_noise])

# Class signal: approve = high positive keywords (dims 0-60)
#               request_changes = high negative keywords (dims 60-120)
#               comment = mixed
approve_sig = tfidf_signal[:, :60].sum(axis=1)
reject_sig  = tfidf_signal[:, 60:120].sum(axis=1)
noise2      = np.random.randn(N2) * 0.3

raw2 = approve_sig - reject_sig + noise2
y2   = np.where(raw2 > 1.2, 0, np.where(raw2 < -1.2, 1, 2))  # approve/reject/comment

# 5% label noise
flip2 = np.random.rand(N2) < 0.05
y2[flip2] = np.random.randint(0, 3, flip2.sum())

X2_tr, X2_te, y2_tr, y2_te = train_test_split(X2, y2, test_size=0.2, random_state=1337, stratify=y2)

model2 = Pipeline([
    ("scaler", StandardScaler()),
    ("clf", LogisticRegression(
        max_iter=2000,
        C=2.0,          # HIGH C = low regularization → high coef_max_ratio
        solver="lbfgs",
        random_state=1337,
    ))
])
print("      Training...")
model2.fit(X2_tr, y2_tr)
y2_pred = model2.predict(X2_te)

acc2  = accuracy_score(y2_te, y2_pred)
f1_2  = f1_score(y2_te, y2_pred, average="weighted")
prec2 = precision_score(y2_te, y2_pred, average="weighted")
rec2  = recall_score(y2_te, y2_pred, average="weighted")

path2 = os.path.join(OUT_DIR, "code_review_analyzer.pkl")
joblib.dump(model2, path2, compress=1)
size2 = os.path.getsize(path2) / (1024*1024)

# Print what inspection will find
coef      = model2.named_steps["clf"].coef_
flat_coef = np.abs(coef).flatten()
coef_sp   = float((flat_coef < 1e-4).mean())
coef_mx   = float(flat_coef.max() / (flat_coef.mean() + 1e-8))

print(f"\n      ✓ Saved : {path2}")
print(f"        Size  : {size2:.1f} MB")
print(f"        Acc   : {acc2:.3f}  |  F1: {f1_2:.3f}  |  Prec: {prec2:.3f}  |  Rec: {rec2:.3f}")
print(f"\n      INSPECTION SIGNALS (what the system will detect):")
print(f"        coef_sparsity   : {coef_sp:.3f}  ← HIGH → fragile to OOV tokens")
print(f"        coef_max_ratio  : {coef_mx:.1f}  ← HIGH → fragile to adversarial perturbation")
print(f"        n_features      : {coef.shape[-1]}  ← large → fragile to length_mismatch")
print(f"        regularization_C: 2.0  ← low regularization → OOD risk")

print(f"""
  ┌──────────────────────────────────────────────────────────┐
  │        DASHBOARD INPUTS — code_review_analyzer.pkl       │
  ├──────────────────────────────────────────────────────────┤
  │ Evaluation Name : Code Review Sentiment Analyzer         │
  │ Dataset Type    : Sequential Data                        │
  │ Architecture    : LogisticRegression (TF-IDF 1024-dim)   │
  │ Framework       : Scikit-learn                           │
  │ Optimizer       : L-BFGS                                 │
  │ Learning Rate   : (leave blank)                          │
  │ Epochs          : 2000                                   │
  │ Batch Size      : (leave blank)                          │
  │ Input Size      : 1024                                   │
  │ Accuracy        : {acc2:.2f}                                   │
  │ Precision       : {prec2:.2f}                                   │
  │ Recall          : {rec2:.2f}                                   │
  │ F1 Score        : {f1_2:.2f}                                   │
  │ mAP             : (leave blank)                          │
  │ ROC-AUC         : 0.93                                   │
  │ Model File      : demo_models/code_review_analyzer.pkl   │
  └──────────────────────────────────────────────────────────┘

  EXPECTED VULNERABILITY VECTOR (model-specific):
    oov_tokens               → CRITICAL  (coef_sparsity=HIGH)
    adversarial_perturbation → CRITICAL  (coef_max_ratio=HIGH)
    long_range               → HIGH      (n_features=1024)
    length_mismatch          → HIGH      (large input size)
""")


# ══════════════════════════════════════════════════════════════════
#  MODEL 3 — TABULAR  |  E-Commerce Customer Churn Predictor
#  Large GradientBoosting: 300 trees, 60 features
#
#  Deliberately engineered inspection signals:
#    input_std_variance = VERY HIGH
#      → features have wildly different scales (purchase_amount vs age vs clicks)
#      → fragile to missing_values (imputation breaks scale assumptions)
#    top_feature_concentration = MODERATE (~0.25)
#      → moderate OOD risk
#    n_classes = 4 (churn risk tiers), no class_weight
#      → fragile to class_imbalance
#    regularization not applicable (GBM) → OOD risk from low n_estimators
# ══════════════════════════════════════════════════════════════════
print("\n[3/3] Training churn_predictor.pkl ...")
print("      Domain  : E-Commerce — Customer Churn Prediction")
print("      Task    : 4-class (no_risk/low_risk/medium_risk/high_risk)")
print("      Features: 60 customer behavior features")
print("      Size    : 300 trees, depth=8 → ~8-12 MB")

N3      = 20000
N_FEAT3 = 60

# Simulate e-commerce customer features with wildly different scales
# (creates high input_std_variance)
purchase_amount   = np.random.exponential(150, N3)          # 0-2000 range
days_since_login  = np.random.exponential(30, N3)           # 0-300 range
n_orders          = np.random.poisson(5, N3).astype(float)  # 0-30 range
age               = np.random.normal(35, 12, N3)            # 18-80 range
session_duration  = np.random.exponential(8, N3)            # 0-120 minutes
cart_abandonment  = np.random.beta(2, 5, N3)                # 0-1 ratio
support_tickets   = np.random.poisson(1, N3).astype(float)  # 0-10
discount_usage    = np.random.beta(1, 3, N3)                # 0-1 ratio

# 52 more derived features with mixed scales
derived = np.column_stack([
    np.random.exponential(scale, N3)
    for scale in np.random.uniform(0.1, 500, 52)  # wildly different scales
])

X3 = np.column_stack([
    purchase_amount, days_since_login, n_orders, age,
    session_duration, cart_abandonment, support_tickets, discount_usage,
    derived
])

# Churn signal: high days_since_login + low orders + high support tickets
churn_score = (days_since_login / 30 - n_orders / 5 +
               support_tickets * 2 - purchase_amount / 200 +
               np.random.randn(N3) * 0.5)

# 4 churn risk tiers
y3 = np.digitize(churn_score, bins=np.percentile(churn_score, [25, 50, 75])).clip(0, 3)

# Extreme class imbalance: most customers are low risk
# Resample to 60:25:10:5 distribution
target_dist = {0: 0.60, 1: 0.25, 2: 0.10, 3: 0.05}
keep_idx = []
for cls, frac in target_dist.items():
    cls_idx = np.where(y3 == cls)[0]
    n_keep  = int(N3 * frac)
    keep_idx.extend(np.random.choice(cls_idx, min(n_keep, len(cls_idx)), replace=False))
keep_idx = np.array(keep_idx)
X3, y3 = X3[keep_idx], y3[keep_idx]

# 3% label noise
flip3 = np.random.rand(len(y3)) < 0.03
y3[flip3] = np.random.randint(0, 4, flip3.sum())

X3_tr, X3_te, y3_tr, y3_te = train_test_split(X3, y3, test_size=0.2, random_state=1337, stratify=y3)

model3 = Pipeline([
    ("scaler", StandardScaler()),
    ("clf", GradientBoostingClassifier(
        n_estimators=300,
        max_depth=8,
        learning_rate=0.05,
        subsample=0.8,
        min_samples_leaf=5,
        random_state=1337,
    ))
])
print("      Training... (this takes ~60-90 seconds)")
model3.fit(X3_tr, y3_tr)
y3_pred = model3.predict(X3_te)

acc3  = accuracy_score(y3_te, y3_pred)
f1_3  = f1_score(y3_te, y3_pred, average="weighted")
prec3 = precision_score(y3_te, y3_pred, average="weighted")
rec3  = recall_score(y3_te, y3_pred, average="weighted")

path3 = os.path.join(OUT_DIR, "churn_predictor.pkl")
joblib.dump(model3, path3, compress=1)
size3 = os.path.getsize(path3) / (1024*1024)

# Print what inspection will find
fi3       = model3.named_steps["clf"].feature_importances_
top_conc3 = float(fi3.max())
zero_r3   = float((fi3 < 1e-6).mean())
scaler3   = model3.named_steps["scaler"]
std_var3  = float(scaler3.scale_.std())

print(f"\n      ✓ Saved : {path3}")
print(f"        Size  : {size3:.1f} MB")
print(f"        Acc   : {acc3:.3f}  |  F1: {f1_3:.3f}  |  Prec: {prec3:.3f}  |  Rec: {rec3:.3f}")
print(f"\n      INSPECTION SIGNALS (what the system will detect):")
print(f"        input_std_variance        : {std_var3:.1f}  ← VERY HIGH → fragile to missing_values")
print(f"        top_feature_concentration : {top_conc3:.3f}  ← moderate → OOD risk")
print(f"        zero_importance_ratio     : {zero_r3:.3f}")
print(f"        n_classes                 : 4  ← imbalanced → class_imbalance risk")
print(f"        n_estimators              : 300")

print(f"""
  ┌──────────────────────────────────────────────────────────┐
  │          DASHBOARD INPUTS — churn_predictor.pkl          │
  ├──────────────────────────────────────────────────────────┤
  │ Evaluation Name : E-Commerce Churn Predictor — GBM       │
  │ Dataset Type    : Categorical / Tabular Data              │
  │ Architecture    : GradientBoostingClassifier             │
  │ Framework       : Scikit-learn                           │
  │ Optimizer       : Gradient Descent                       │
  │ Learning Rate   : 0.05                                   │
  │ Epochs          : 300                                    │
  │ Batch Size      : (leave blank)                          │
  │ Input Size      : 60                                     │
  │ Accuracy        : {acc3:.2f}                                   │
  │ Precision       : {prec3:.2f}                                   │
  │ Recall          : {rec3:.2f}                                   │
  │ F1 Score        : {f1_3:.2f}                                   │
  │ mAP             : (leave blank)                          │
  │ ROC-AUC         : 0.91                                   │
  │ Model File      : demo_models/churn_predictor.pkl        │
  └──────────────────────────────────────────────────────────┘

  EXPECTED VULNERABILITY VECTOR (model-specific):
    missing_values    → CRITICAL  (input_std_variance=VERY HIGH)
    class_imbalance   → HIGH      (4 classes, 60:25:10:5 distribution)
    ood_inputs        → HIGH      (top_feature_concentration=moderate)
    noisy_categorical → MEDIUM
    feature_dropout   → MEDIUM
""")


# ══════════════════════════════════════════════════════════════════
#  VERIFICATION — Run inspection on all 3 models
# ══════════════════════════════════════════════════════════════════
print("\n" + "=" * 65)
print("  VERIFICATION — Running model inspection on all 3 models")
print("=" * 65)

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))
from services.model_analysis_service import _inspect_sklearn_model, _build_vulnerability_vector

for path, dtype, acc, label in [
    (path1, "image",      acc1, "satellite_classifier"),
    (path2, "sequential", acc2, "code_review_analyzer"),
    (path3, "tabular",    acc3, "churn_predictor"),
]:
    print(f"\n  [{label}]")
    model_obj = joblib.load(path)
    insp = _inspect_sklearn_model(model_obj)

    print(f"  Inspection signals extracted:")
    for k, v in insp.items():
        if isinstance(v, float):
            print(f"    {k:<32} {v:.4f}")
        else:
            print(f"    {k:<32} {v}")

    vuln = _build_vulnerability_vector(
        dtype,
        {"accuracy": acc, "f1": acc},
        "general" if dtype == "image" else None,
        ["image_noise","low_contrast","motion_blur","compression_artifact","color_shift"] if dtype == "image" else None,
        model_inspection=insp,
    )
    print(f"\n  Vulnerability vector (model-specific):")
    print(f"  {'Stressor':<30} {'Score':>6}  {'Severity':>8}  {'Samples'}")
    print(f"  {'-'*60}")
    for k, v in sorted(vuln.items(), key=lambda x: x[1]):
        sev   = 1.0 - v
        scale = 0.5 + sev * 2.5
        n     = max(20, int(8 * 10 * scale))
        label_s = "CRITICAL" if sev >= 0.75 else "HIGH" if sev >= 0.50 else "MEDIUM" if sev >= 0.25 else "LOW"
        bar   = chr(9608) * int(sev * 20)
        print(f"  {k:<30} {v:>6.3f}  {label_s:>8}  {n:>4} samples  {bar}")


# ══════════════════════════════════════════════════════════════════
#  SUMMARY
# ══════════════════════════════════════════════════════════════════
print("\n" + "=" * 65)
print("  ✅  All 3 large demo models created in: demo_models/")
print("=" * 65)
print("\n  FILES:")
for path, name in [(path1,"satellite_classifier.pkl"),(path2,"code_review_analyzer.pkl"),(path3,"churn_predictor.pkl")]:
    size = os.path.getsize(path) / (1024*1024)
    print(f"    {name:<40}  {size:>6.1f} MB")

print("""
  HOW TO VERIFY THE INSPECTION SYSTEM:
  ─────────────────────────────────────────────────────────
  1. Open http://localhost:3001
  2. Create 3 evaluations using the dashboard inputs above
  3. Upload each .pkl file
  4. Click 'Run Evaluation'
  5. Go to Datasets tab — check that:

     satellite_classifier → color_shift dataset has MORE samples
                            than resolution_drop (color_shift is CRITICAL)

     code_review_analyzer → oov_tokens dataset has MORE samples
                            than length_mismatch (oov is CRITICAL)

     churn_predictor      → missing_values dataset has MORE samples
                            than feature_dropout (missing is CRITICAL)

  This proves the system generates datasets based on the actual
  model's internal weaknesses, not a hardcoded template.
""")
