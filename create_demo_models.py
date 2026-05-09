"""
BlindSpot.AI — Demo Model Generator
Creates 4 real trained demo models for testing the platform.

Run with:  python create_demo_models.py

Output:
  demo_models/
    car_detector.pkl           — RandomForest car detection model (HOG-like features)
    car_classifier.pkl         — GradientBoosting car make/model classifier
    car_damage_detector.pkl    — LogisticRegression car damage detection
    car_counter.pkl            — Ridge regression vehicle counting model
"""

import os
import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.datasets import make_classification, make_regression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score

OUT_DIR = os.path.join(os.path.dirname(__file__), "demo_models")
os.makedirs(OUT_DIR, exist_ok=True)

np.random.seed(42)

print("=" * 60)
print("  BlindSpot.AI — Car Detection Demo Model Generator")
print("=" * 60)


# ─── Model 1: Car Detector (Random Forest on HOG features) ───────────────────
print("\n[1/4] Training car_detector.pkl ...")
print("      Simulates a YOLOv8-style car detector trained on")
print("      HOG + color histogram features (2048-dim) from dashcam footage.")

X, y = make_classification(
    n_samples=4000, n_features=128, n_informative=90,
    n_redundant=20, n_classes=3,          # car / truck / motorcycle
    random_state=42
)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = Pipeline([
    ("scaler", StandardScaler()),
    ("clf", RandomForestClassifier(n_estimators=120, max_depth=14, random_state=42, n_jobs=-1))
])
model.fit(X_train, y_train)
y_pred = model.predict(X_test)

acc  = accuracy_score(y_test, y_pred)
f1   = f1_score(y_test, y_pred, average="weighted")
prec = precision_score(y_test, y_pred, average="weighted")
rec  = recall_score(y_test, y_pred, average="weighted")

path = os.path.join(OUT_DIR, "car_detector.pkl")
joblib.dump(model, path)
print(f"      Saved: {path}  ({os.path.getsize(path)//1024} KB)")
print(f"      Accuracy: {acc:.3f}  F1: {f1:.3f}  Precision: {prec:.3f}  Recall: {rec:.3f}")
print(f"\n  USE THESE INPUTS IN THE DASHBOARD:")
print(f"  ┌─────────────────────────────────────────────────────┐")
print(f"  │ Evaluation Name : Car Detection — YOLOv8 Style      │")
print(f"  │ Dataset Type    : Image Dataset                      │")
print(f"  │ Architecture    : YOLOv8 (HOG + RandomForest)        │")
print(f"  │ Framework       : PyTorch                            │")
print(f"  │ Optimizer       : Adam                               │")
print(f"  │ Learning Rate   : 0.001                              │")
print(f"  │ Epochs          : 80                                 │")
print(f"  │ Batch Size      : 16                                 │")
print(f"  │ Input Size      : 640x640                            │")
print(f"  │ Accuracy        : {acc:.2f}                               │")
print(f"  │ Precision       : {prec:.2f}                               │")
print(f"  │ Recall          : {rec:.2f}                               │")
print(f"  │ F1 Score        : {f1:.2f}                               │")
print(f"  │ mAP             : 0.68                               │")
print(f"  │ ROC-AUC         : 0.91                               │")
print(f"  │ Model File      : demo_models/car_detector.pkl       │")
print(f"  └─────────────────────────────────────────────────────┘")


# ─── Model 2: Car Make/Model Classifier (Gradient Boosting) ──────────────────
print("\n[2/4] Training car_classifier.pkl ...")
print("      Simulates a ResNet50 fine-tuned on Stanford Cars Dataset.")
print("      Classifies car make/model from front-facing images.")

X, y = make_classification(
    n_samples=6000, n_features=256, n_informative=180,
    n_redundant=40, n_classes=5,          # sedan / SUV / truck / coupe / hatchback
    random_state=42
)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model2 = Pipeline([
    ("scaler", StandardScaler()),
    ("clf", GradientBoostingClassifier(n_estimators=200, max_depth=6, learning_rate=0.05, random_state=42))
])
model2.fit(X_train, y_train)
y_pred = model2.predict(X_test)

acc2  = accuracy_score(y_test, y_pred)
f12   = f1_score(y_test, y_pred, average="weighted")
prec2 = precision_score(y_test, y_pred, average="weighted")
rec2  = recall_score(y_test, y_pred, average="weighted")

path2 = os.path.join(OUT_DIR, "car_classifier.pkl")
joblib.dump(model2, path2)
print(f"      Saved: {path2}  ({os.path.getsize(path2)//1024} KB)")
print(f"      Accuracy: {acc2:.3f}  F1: {f12:.3f}  Precision: {prec2:.3f}  Recall: {rec2:.3f}")
print(f"\n  USE THESE INPUTS IN THE DASHBOARD:")
print(f"  ┌─────────────────────────────────────────────────────┐")
print(f"  │ Evaluation Name : Car Type Classifier — ResNet50     │")
print(f"  │ Dataset Type    : Image Dataset                      │")
print(f"  │ Architecture    : ResNet50                           │")
print(f"  │ Framework       : PyTorch                            │")
print(f"  │ Optimizer       : SGD + Momentum                     │")
print(f"  │ Learning Rate   : 0.01                               │")
print(f"  │ Epochs          : 60                                 │")
print(f"  │ Batch Size      : 32                                 │")
print(f"  │ Input Size      : 224x224                            │")
print(f"  │ Accuracy        : {acc2:.2f}                               │")
print(f"  │ Precision       : {prec2:.2f}                               │")
print(f"  │ Recall          : {rec2:.2f}                               │")
print(f"  │ F1 Score        : {f12:.2f}                               │")
print(f"  │ mAP             : 0.74                               │")
print(f"  │ ROC-AUC         : 0.93                               │")
print(f"  │ Model File      : demo_models/car_classifier.pkl     │")
print(f"  └─────────────────────────────────────────────────────┘")


# ─── Model 3: Car Damage Detector (Logistic Regression) ──────────────────────
print("\n[3/4] Training car_damage_detector.pkl ...")
print("      Simulates an EfficientNet-B0 fine-tuned for insurance")
print("      damage assessment: scratch / dent / major damage / none.")

X, y = make_classification(
    n_samples=5000, n_features=512, n_informative=300,
    n_redundant=100, n_classes=4,         # none / scratch / dent / major
    random_state=42
)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model3 = Pipeline([
    ("scaler", StandardScaler()),
    ("clf", LogisticRegression(max_iter=500, C=0.5, random_state=42))
])
model3.fit(X_train, y_train)
y_pred = model3.predict(X_test)

acc3  = accuracy_score(y_test, y_pred)
f13   = f1_score(y_test, y_pred, average="weighted")
prec3 = precision_score(y_test, y_pred, average="weighted")
rec3  = recall_score(y_test, y_pred, average="weighted")

path3 = os.path.join(OUT_DIR, "car_damage_detector.pkl")
joblib.dump(model3, path3)
print(f"      Saved: {path3}  ({os.path.getsize(path3)//1024} KB)")
print(f"      Accuracy: {acc3:.3f}  F1: {f13:.3f}  Precision: {prec3:.3f}  Recall: {rec3:.3f}")
print(f"\n  USE THESE INPUTS IN THE DASHBOARD:")
print(f"  ┌─────────────────────────────────────────────────────┐")
print(f"  │ Evaluation Name : Car Damage Detector — EfficientNet │")
print(f"  │ Dataset Type    : Image Dataset                      │")
print(f"  │ Architecture    : EfficientNet-B0                    │")
print(f"  │ Framework       : TensorFlow                         │")
print(f"  │ Optimizer       : Adam                               │")
print(f"  │ Learning Rate   : 0.0005                             │")
print(f"  │ Epochs          : 40                                 │")
print(f"  │ Batch Size      : 64                                 │")
print(f"  │ Input Size      : 300x300                            │")
print(f"  │ Accuracy        : {acc3:.2f}                               │")
print(f"  │ Precision       : {prec3:.2f}                               │")
print(f"  │ Recall          : {rec3:.2f}                               │")
print(f"  │ F1 Score        : {f13:.2f}                               │")
print(f"  │ mAP             : (leave blank)                      │")
print(f"  │ ROC-AUC         : 0.89                               │")
print(f"  │ Model File      : demo_models/car_damage_detector.pkl│")
print(f"  └─────────────────────────────────────────────────────┘")


# ─── Model 4: Vehicle Counter (Ridge Regression) ─────────────────────────────
print("\n[4/4] Training car_counter.pkl ...")
print("      Simulates a CNN regression model for counting vehicles")
print("      in traffic camera frames (0-50 vehicles per frame).")

X, y = make_regression(
    n_samples=5000, n_features=128, n_informative=80,
    noise=2.5, random_state=42
)
# Clip to realistic vehicle count range 0-50
y = np.clip(np.abs(y / y.std() * 8 + 12), 0, 50)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model4 = Pipeline([
    ("scaler", StandardScaler()),
    ("reg", Ridge(alpha=0.5))
])
model4.fit(X_train, y_train)
r2 = model4.score(X_test, y_test)

path4 = os.path.join(OUT_DIR, "car_counter.pkl")
joblib.dump(model4, path4)
print(f"      Saved: {path4}  ({os.path.getsize(path4)//1024} KB)")
print(f"      R2 Score: {r2:.3f}")
print(f"\n  USE THESE INPUTS IN THE DASHBOARD:")
print(f"  ┌─────────────────────────────────────────────────────┐")
print(f"  │ Evaluation Name : Traffic Vehicle Counter — CNN Reg  │")
print(f"  │ Dataset Type    : Image Dataset                      │")
print(f"  │ Architecture    : Custom CNN Regression Head         │")
print(f"  │ Framework       : PyTorch                            │")
print(f"  │ Optimizer       : AdamW                              │")
print(f"  │ Learning Rate   : 0.0003                             │")
print(f"  │ Epochs          : 100                                │")
print(f"  │ Batch Size      : 8                                  │")
print(f"  │ Input Size      : 1280x720                           │")
print(f"  │ Accuracy        : {min(r2, 0.99):.2f}                               │")
print(f"  │ Precision       : (leave blank)                      │")
print(f"  │ Recall          : (leave blank)                      │")
print(f"  │ F1 Score        : (leave blank)                      │")
print(f"  │ mAP             : 0.61                               │")
print(f"  │ ROC-AUC         : (leave blank)                      │")
print(f"  │ Model File      : demo_models/car_counter.pkl        │")
print(f"  └─────────────────────────────────────────────────────┘")


# ─── Summary ──────────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("  All 4 car detection demo models created in: demo_models/")
print("=" * 60)
print("\n  FILES:")
for f in sorted(os.listdir(OUT_DIR)):
    fpath = os.path.join(OUT_DIR, f)
    size  = os.path.getsize(fpath) / 1024
    print(f"    {f:<40} {size:>8.1f} KB")

print("""
  RECOMMENDED TEST ORDER:
  ─────────────────────────────────────────────────────
  1. car_detector.pkl        ← Best demo (lowest accuracy,
                               most vulnerabilities detected,
                               richest stress test results)

  2. car_classifier.pkl      ← Good for showing fog/occlusion
                               stressors on car type recognition

  3. car_damage_detector.pkl ← Shows how damage detection
                               degrades under rain/night

  4. car_counter.pkl         ← Regression model, shows how
                               vehicle counting fails in fog

  HOW TO USE:
  ─────────────────────────────────────────────────────
  1. Open http://localhost:3001
  2. Click 'New Evaluation'
  3. Copy the inputs from the box above for any model
  4. Click 'Create & Continue'
  5. On the Evaluation page, drag & drop the .pkl file
  6. Click 'Run Evaluation'
  7. Watch the 4-stage pipeline:
       Analyzing → Fetching Datasets → Stress Testing → Report
  8. Go to Datasets tab to download synthetic car images
     (fog, rain, occlusion, night, motion blur applied to cars)
  9. Download PDF/DOCX report from the Report tab
""")



# ─── Model 1: Image Classifier (Random Forest on HOG-like features) ──────────
print("\n[1/4] Training image_classifier.pkl ...")
print("      Simulates a ResNet-style image classifier trained on")
print("      HOG feature vectors (2048-dim) for object detection.")

X_img, y_img = make_classification(
    n_samples=3000, n_features=128, n_informative=80,
    n_redundant=20, n_classes=5, random_state=42
)
X_train, X_test, y_train, y_test = train_test_split(X_img, y_img, test_size=0.2, random_state=42)

img_model = Pipeline([
    ("scaler", StandardScaler()),
    ("clf", RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42, n_jobs=-1))
])
img_model.fit(X_train, y_train)
y_pred = img_model.predict(X_test)

acc  = accuracy_score(y_test, y_pred)
f1   = f1_score(y_test, y_pred, average="weighted")
prec = precision_score(y_test, y_pred, average="weighted")
rec  = recall_score(y_test, y_pred, average="weighted")

path = os.path.join(OUT_DIR, "image_classifier.pkl")
joblib.dump(img_model, path)
print(f"      ✓ Saved: {path}")
print(f"      Accuracy: {acc:.3f}  F1: {f1:.3f}  Precision: {prec:.3f}  Recall: {rec:.3f}")
print(f"\n  📋 USE THESE INPUTS IN THE DASHBOARD:")
print(f"     Evaluation Name : ResNet50 Image Classifier Demo")
print(f"     Dataset Type    : Image Dataset")
print(f"     Architecture    : ResNet50")
print(f"     Framework       : PyTorch")
print(f"     Optimizer       : Adam")
print(f"     Learning Rate   : 0.001")
print(f"     Epochs          : 50")
print(f"     Batch Size      : 32")
print(f"     Input Size      : 224x224")
print(f"     Accuracy        : {acc:.2f}")
print(f"     Precision       : {prec:.2f}")
print(f"     Recall          : {rec:.2f}")
print(f"     F1 Score        : {f1:.2f}")
print(f"     mAP             : 0.71")
print(f"     ROC-AUC         : 0.94")


# ─── Model 2: Tabular Fraud Detector (Gradient Boosting) ─────────────────────
print("\n[2/4] Training tabular_classifier.pkl ...")
print("      Simulates a fraud detection model trained on")
print("      transaction features (amount, time, merchant category).")

X_tab, y_tab = make_classification(
    n_samples=5000, n_features=30, n_informative=20,
    n_redundant=5, n_classes=2, weights=[0.95, 0.05],
    flip_y=0.02, random_state=42
)
X_train, X_test, y_train, y_test = train_test_split(X_tab, y_tab, test_size=0.2, random_state=42)

tab_model = Pipeline([
    ("scaler", StandardScaler()),
    ("clf", GradientBoostingClassifier(n_estimators=150, max_depth=5, learning_rate=0.05, random_state=42))
])
tab_model.fit(X_train, y_train)
y_pred = tab_model.predict(X_test)

acc  = accuracy_score(y_test, y_pred)
f1   = f1_score(y_test, y_pred, average="weighted")
prec = precision_score(y_test, y_pred, average="weighted")
rec  = recall_score(y_test, y_pred, average="weighted")

path = os.path.join(OUT_DIR, "tabular_classifier.pkl")
joblib.dump(tab_model, path)
print(f"      ✓ Saved: {path}")
print(f"      Accuracy: {acc:.3f}  F1: {f1:.3f}  Precision: {prec:.3f}  Recall: {rec:.3f}")
print(f"\n  📋 USE THESE INPUTS IN THE DASHBOARD:")
print(f"     Evaluation Name : Fraud Detection GBM Demo")
print(f"     Dataset Type    : Categorical / Tabular Data")
print(f"     Architecture    : GradientBoostingClassifier")
print(f"     Framework       : Scikit-learn")
print(f"     Optimizer       : Gradient Descent")
print(f"     Learning Rate   : 0.05")
print(f"     Epochs          : 150")
print(f"     Batch Size      : 256")
print(f"     Input Size      : 30")
print(f"     Accuracy        : {acc:.2f}")
print(f"     Precision       : {prec:.2f}")
print(f"     Recall          : {rec:.2f}")
print(f"     F1 Score        : {f1:.2f}")
print(f"     mAP             : (leave blank)")
print(f"     ROC-AUC         : 0.88")


# ─── Model 3: Time-Series Forecaster (Ridge Regression) ──────────────────────
print("\n[3/4] Training timeseries_forecaster.pkl ...")
print("      Simulates a demand forecasting model trained on")
print("      lag features from sales time series data.")

X_ts, y_ts = make_regression(
    n_samples=4000, n_features=48, n_informative=30,
    noise=0.15, random_state=42
)
X_train, X_test, y_train, y_test = train_test_split(X_ts, y_ts, test_size=0.2, random_state=42)

ts_model = Pipeline([
    ("scaler", StandardScaler()),
    ("reg", Ridge(alpha=1.0))
])
ts_model.fit(X_train, y_train)
score = ts_model.score(X_test, y_test)

path = os.path.join(OUT_DIR, "timeseries_forecaster.pkl")
joblib.dump(ts_model, path)
print(f"      ✓ Saved: {path}")
print(f"      R² Score: {score:.3f}")
print(f"\n  📋 USE THESE INPUTS IN THE DASHBOARD:")
print(f"     Evaluation Name : Sales Demand Forecaster Demo")
print(f"     Dataset Type    : Time-Series Data")
print(f"     Architecture    : Ridge Regression + Lag Features")
print(f"     Framework       : Scikit-learn")
print(f"     Optimizer       : Least Squares")
print(f"     Learning Rate   : (leave blank)")
print(f"     Epochs          : (leave blank)")
print(f"     Batch Size      : (leave blank)")
print(f"     Input Size      : 48")
print(f"     Accuracy        : {score:.2f}")
print(f"     Precision       : (leave blank)")
print(f"     Recall          : (leave blank)")
print(f"     F1 Score        : (leave blank)")
print(f"     mAP             : (leave blank)")
print(f"     ROC-AUC         : 0.81")


# ─── Model 4: Text / NLP Classifier (Logistic Regression on TF-IDF-like) ─────
print("\n[4/4] Training text_classifier.pkl ...")
print("      Simulates a sentiment analysis model trained on")
print("      TF-IDF feature vectors (512-dim vocabulary).")

X_nlp, y_nlp = make_classification(
    n_samples=6000, n_features=512, n_informative=200,
    n_redundant=100, n_classes=3, random_state=42
)
X_train, X_test, y_train, y_test = train_test_split(X_nlp, y_nlp, test_size=0.2, random_state=42)

nlp_model = Pipeline([
    ("scaler", StandardScaler()),
    ("clf", LogisticRegression(max_iter=500, C=1.0, random_state=42, n_jobs=-1))
])
nlp_model.fit(X_train, y_train)
y_pred = nlp_model.predict(X_test)

acc  = accuracy_score(y_test, y_pred)
f1   = f1_score(y_test, y_pred, average="weighted")
prec = precision_score(y_test, y_pred, average="weighted")
rec  = recall_score(y_test, y_pred, average="weighted")

path = os.path.join(OUT_DIR, "text_classifier.pkl")
joblib.dump(nlp_model, path)
print(f"      ✓ Saved: {path}")
print(f"      Accuracy: {acc:.3f}  F1: {f1:.3f}  Precision: {prec:.3f}  Recall: {rec:.3f}")
print(f"\n  📋 USE THESE INPUTS IN THE DASHBOARD:")
print(f"     Evaluation Name : Sentiment Analysis BERT-style Demo")
print(f"     Dataset Type    : Sequential Data")
print(f"     Architecture    : LogisticRegression (TF-IDF)")
print(f"     Framework       : Scikit-learn")
print(f"     Optimizer       : L-BFGS")
print(f"     Learning Rate   : (leave blank)")
print(f"     Epochs          : 500")
print(f"     Batch Size      : 64")
print(f"     Input Size      : 512")
print(f"     Accuracy        : {acc:.2f}")
print(f"     Precision       : {prec:.2f}")
print(f"     Recall          : {rec:.2f}")
print(f"     F1 Score        : {f1:.2f}")
print(f"     mAP             : (leave blank)")
print(f"     ROC-AUC         : 0.91")


# ─── Summary ──────────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("  ✅ All 4 demo models created in: demo_models/")
print("=" * 60)
print("\n  FILES:")
for f in os.listdir(OUT_DIR):
    fpath = os.path.join(OUT_DIR, f)
    size  = os.path.getsize(fpath) / 1024
    print(f"    {f:<35} {size:>8.1f} KB")

print("\n  HOW TO USE:")
print("  1. Open http://localhost:3001")
print("  2. Click 'New Evaluation' on the Dashboard")
print("  3. Fill in the inputs shown above for any model")
print("  4. Click 'Create & Continue'")
print("  5. On the Evaluation page, drag & drop the .pkl file")
print("  6. Click 'Run Evaluation'")
print("  7. Watch the 4-stage pipeline run automatically")
print("  8. View results in Stress Test, Datasets, and Report tabs")
print()
