"""
BlindSpot.AI — Demo Model Generator
Creates 4 real trained demo models for testing the platform.

Run with:  python create_demo_models.py

Output:
  demo_models/
    image_classifier.pkl       — RandomForest image classifier (CIFAR-like features)
    tabular_classifier.pkl     — GradientBoosting fraud detector
    timeseries_forecaster.pkl  — Ridge regression time-series model
    text_classifier.pkl        — LogisticRegression NLP classifier
"""

import os
import pickle
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
print("  BlindSpot.AI — Demo Model Generator")
print("=" * 60)


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
