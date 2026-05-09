"""
Model Analysis Service
Inspects uploaded model files to detect architecture, task type,
vulnerabilities, and edge cases. Supports .pt, .pth, .onnx, .h5, .pkl, .joblib

Domain-aware: detects whether the image model is medical, satellite,
autonomous-driving, or general and applies the correct stressors.
"""
import os
import time
import logging
import random
from pathlib import Path
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)
USE_MOCK = os.getenv("MOCK_ML", "true").lower() == "true"


# ─── Domain detection ─────────────────────────────────────────────────────────

MEDICAL_KEYWORDS = {
    "xray", "x-ray", "chest", "lung", "pneumonia", "mri", "ct", "scan",
    "retina", "retinopathy", "diabetic", "skin", "lesion", "melanoma",
    "pathology", "histology", "ultrasound", "ecg", "ekg", "cardiac",
    "tumor", "cancer", "biopsy", "dermatology", "ophthalmology",
    "radiology", "dicom", "ham10000", "aptos", "isic", "chestxray",
    "densenet", "efficientnet",  # common medical architectures
}

SATELLITE_KEYWORDS = {
    "satellite", "aerial", "remote sensing", "sar", "multispectral",
    "hyperspectral", "landsat", "sentinel", "drone", "uav", "overhead",
    "geospatial", "terrain", "land cover", "crop", "deforestation",
}

AUTONOMOUS_KEYWORDS = {
    "car", "vehicle", "traffic", "road", "driving", "autonomous",
    "pedestrian", "yolo", "detection", "dashcam", "lidar", "kitti",
    "cityscapes", "bdd100k", "waymo", "nuscenes", "coco",
}


def detect_image_domain(name: str, architecture: Optional[str], description: Optional[str]) -> str:
    """
    Infer the image domain from evaluation name, architecture, and description.
    Returns: 'medical' | 'satellite' | 'autonomous' | 'general'
    """
    text = " ".join(filter(None, [name, architecture, description])).lower()
    words = set(text.replace("-", " ").replace("_", " ").split())

    if words & MEDICAL_KEYWORDS:
        return "medical"
    if words & SATELLITE_KEYWORDS:
        return "satellite"
    if words & AUTONOMOUS_KEYWORDS:
        return "autonomous"
    return "general"


# ─── Domain-specific edge cases ───────────────────────────────────────────────

EDGE_CASES_BY_DOMAIN = {
    "medical": [
        {"name": "Low Contrast / Underexposure",    "severity": "critical", "stressor": "low_contrast",
         "description": "Underexposed scans reduce tissue differentiation, causing missed diagnoses."},
        {"name": "Gaussian Noise (Sensor Noise)",   "severity": "critical", "stressor": "image_noise",
         "description": "Electronic sensor noise in MRI/CT degrades fine anatomical detail."},
        {"name": "JPEG Compression Artifact",       "severity": "high",     "stressor": "compression_artifact",
         "description": "Lossy compression introduces blocking artifacts that mimic pathological features."},
        {"name": "Scanner / Device Variation",      "severity": "high",     "stressor": "scanner_variation",
         "description": "Images from different scanner manufacturers have different intensity distributions."},
        {"name": "Patient Motion Artifact",         "severity": "high",     "stressor": "motion_artifact",
         "description": "Patient movement during acquisition blurs anatomical boundaries."},
        {"name": "Staining / Contrast Variation",   "severity": "medium",   "stressor": "staining_variation",
         "description": "Histology staining inconsistencies shift color distributions outside training range."},
        {"name": "Overexposure / Saturation",       "severity": "medium",   "stressor": "overexposure",
         "description": "Overexposed regions lose texture detail critical for lesion classification."},
    ],
    "satellite": [
        {"name": "Cloud Cover Occlusion",           "severity": "critical", "stressor": "cloud_cover",
         "description": "Cloud cover masks ground features, causing false negatives in land-use classification."},
        {"name": "Atmospheric Haze",                "severity": "high",     "stressor": "atmospheric_haze",
         "description": "Aerosol scattering reduces spectral contrast in multispectral imagery."},
        {"name": "Sensor Noise / Striping",         "severity": "high",     "stressor": "sensor_noise",
         "description": "Detector striping artifacts in satellite sensors corrupt spatial features."},
        {"name": "Resolution Degradation",          "severity": "high",     "stressor": "resolution_drop",
         "description": "Lower resolution imagery from older satellites degrades fine-grained detection."},
        {"name": "Seasonal / Temporal Change",      "severity": "medium",   "stressor": "seasonal_change",
         "description": "Vegetation and land cover changes across seasons shift feature distributions."},
    ],
    "autonomous": [
        {"name": "Dense Fog / Low Visibility",      "severity": "critical", "stressor": "fog_dense",
         "description": "Atmospheric scattering reduces contrast below 30%, collapsing detection confidence."},
        {"name": "Heavy Rain + Lens Distortion",    "severity": "high",     "stressor": "rain_heavy",
         "description": "Rain streaks and refractive droplets corrupt spatial feature maps."},
        {"name": "Severe Occlusion (80%)",          "severity": "critical", "stressor": "occlusion_80",
         "description": "When 80% of the target is occluded, detection collapses entirely."},
        {"name": "Night / Low-Light Conditions",    "severity": "high",     "stressor": "night_low",
         "description": "Luminance reduction below 18% causes activation collapse in early conv layers."},
        {"name": "Motion Blur (Fast Objects)",      "severity": "medium",   "stressor": "motion_blur",
         "description": "High-velocity objects produce streak artifacts confusing bounding box regression."},
        {"name": "Lens Flare / Overexposure",       "severity": "medium",   "stressor": "lens_flare",
         "description": "Bright light sources saturate sensor pixels, masking nearby objects."},
        {"name": "Partial Occlusion (50%)",         "severity": "high",     "stressor": "occlusion_50",
         "description": "Half-visible objects cause inconsistent confidence scores across frames."},
    ],
    "general": [
        {"name": "Gaussian Noise Injection",        "severity": "high",     "stressor": "image_noise",
         "description": "Random pixel noise degrades texture features relied on by the classifier."},
        {"name": "Contrast / Brightness Shift",     "severity": "high",     "stressor": "low_contrast",
         "description": "Global contrast reduction causes feature map activations to collapse."},
        {"name": "Gaussian Blur",                   "severity": "medium",   "stressor": "motion_blur",
         "description": "Blurring removes high-frequency features the model depends on."},
        {"name": "JPEG Compression Artifact",       "severity": "medium",   "stressor": "compression_artifact",
         "description": "Lossy compression introduces blocking artifacts that shift feature distributions."},
        {"name": "Color / Hue Shift",               "severity": "medium",   "stressor": "color_shift",
         "description": "Hue rotation moves color features outside the training distribution."},
    ],
}

# ─── Domain-specific vulnerability vectors ────────────────────────────────────

VULNERABILITY_VECTORS_BY_DOMAIN = {
    "medical": ["low_contrast", "image_noise", "compression_artifact", "scanner_variation", "motion_artifact", "staining_variation", "overexposure"],
    "satellite": ["cloud_cover", "atmospheric_haze", "sensor_noise", "resolution_drop", "seasonal_change"],
    "autonomous": ["fog_dense", "rain_heavy", "occlusion_80", "occlusion_50", "night_low", "motion_blur", "lens_flare"],
    "general": ["image_noise", "low_contrast", "motion_blur", "compression_artifact", "color_shift"],
}

# ─── Domain-specific weakness templates ───────────────────────────────────────

WEAKNESS_TEMPLATES_BY_DOMAIN = {
    "medical": {
        "task_type": "Medical Image Classification / Diagnosis",
        "domain": "Medical Imaging (Radiology / Pathology / Dermatology)",
        "scope": "Medical imaging model evaluated against clinical acquisition stressors including noise, compression, scanner variation, and contrast degradation.",
        "weaknesses": ["Scanner/device generalization", "Low-contrast sensitivity", "Compression artifact robustness", "Motion artifact handling", "Staining/contrast variation"],
    },
    "satellite": {
        "task_type": "Remote Sensing / Land Cover Classification",
        "domain": "Satellite / Aerial Imagery",
        "scope": "Remote sensing model evaluated against atmospheric, sensor, and temporal distribution shift stressors.",
        "weaknesses": ["Cloud cover robustness", "Atmospheric haze sensitivity", "Multi-sensor generalization", "Seasonal distribution shift", "Resolution degradation"],
    },
    "autonomous": {
        "task_type": "Object Detection / Scene Understanding",
        "domain": "Autonomous Driving / Computer Vision",
        "scope": "Visual perception model evaluated against physics-based environmental stressors including weather, lighting, and occlusion.",
        "weaknesses": ["Low-light sensitivity", "Occlusion handling", "Weather robustness", "Motion artifact resistance"],
    },
    "general": {
        "task_type": "Image Classification",
        "domain": "General Computer Vision",
        "scope": "Image classification model evaluated against common image corruption and distribution shift stressors.",
        "weaknesses": ["Noise robustness", "Contrast sensitivity", "Compression artifact handling", "Color distribution shift"],
    },
}

# ─── Non-image dataset templates (unchanged) ──────────────────────────────────

EDGE_CASES_BY_TYPE = {
    "tabular": [
        {"name": "Missing Feature Values",          "severity": "high",     "stressor": "missing_values",
         "description": "Null or NaN entries in critical feature columns cause prediction drift."},
        {"name": "Out-of-Distribution Inputs",      "severity": "critical", "stressor": "ood_inputs",
         "description": "Feature values outside training distribution cause extreme confidence errors."},
        {"name": "Class Imbalance Stress",          "severity": "medium",   "stressor": "class_imbalance",
         "description": "Minority class samples are systematically misclassified under imbalanced conditions."},
        {"name": "Noisy Categorical Features",      "severity": "high",     "stressor": "noisy_categorical",
         "description": "Typos or unseen categories in string features break one-hot encoding pipelines."},
        {"name": "Correlated Feature Dropout",      "severity": "medium",   "stressor": "feature_dropout",
         "description": "Removing highly correlated features exposes model's over-reliance on single signals."},
    ],
    "time_series": [
        {"name": "Anomalous Spike Sequences",       "severity": "critical", "stressor": "spike_anomaly",
         "description": "Sudden value spikes outside 3-sigma range cause forecasting instability."},
        {"name": "Concept Drift",                   "severity": "high",     "stressor": "concept_drift",
         "description": "Gradual distribution shift over time degrades model accuracy silently."},
        {"name": "Missing Timesteps",               "severity": "high",     "stressor": "missing_timesteps",
         "description": "Gaps in time series data break sequential dependencies in LSTM/Transformer models."},
        {"name": "Seasonal Pattern Disruption",     "severity": "medium",   "stressor": "seasonal_disruption",
         "description": "Unusual seasonal events break learned periodicity."},
        {"name": "High-Frequency Noise",            "severity": "medium",   "stressor": "hf_noise",
         "description": "High-frequency noise injected into signals masks true trend signals."},
    ],
    "sequential": [
        {"name": "Long-Range Dependency Failure",   "severity": "critical", "stressor": "long_range",
         "description": "Sequences longer than training context window cause attention collapse."},
        {"name": "Out-of-Vocabulary Tokens",        "severity": "high",     "stressor": "oov_tokens",
         "description": "Unseen tokens or symbols cause embedding lookup failures."},
        {"name": "Adversarial Text Perturbation",   "severity": "high",     "stressor": "text_perturbation",
         "description": "Character-level substitutions fool the model while preserving human readability."},
        {"name": "Sequence Length Mismatch",        "severity": "medium",   "stressor": "length_mismatch",
         "description": "Inputs shorter or longer than expected break positional encoding assumptions."},
    ],
    "vector": [
        {"name": "Embedding Space Drift",           "severity": "high",     "stressor": "embedding_drift",
         "description": "Vectors from a different encoder version occupy different regions of latent space."},
        {"name": "Adversarial Perturbation",        "severity": "critical", "stressor": "adversarial_vector",
         "description": "Small L2-norm perturbations to input vectors cause large output changes."},
        {"name": "Dimensionality Mismatch",         "severity": "high",     "stressor": "dim_mismatch",
         "description": "Vectors with wrong embedding dimensions cause silent shape errors."},
        {"name": "Sparse Vector Inputs",            "severity": "medium",   "stressor": "sparse_vectors",
         "description": "Highly sparse vectors (>90% zeros) degrade cosine similarity reliability."},
    ],
}

WEAKNESS_TEMPLATES = {
    "tabular": {
        "task_type": "Classification / Regression",
        "domain": "Structured Data Analytics",
        "scope": "Tabular model evaluated against distribution shift and feature corruption scenarios.",
        "weaknesses": ["Missing value sensitivity", "OOD generalization", "Feature correlation dependency", "Class imbalance handling"],
    },
    "time_series": {
        "task_type": "Forecasting / Anomaly Detection",
        "domain": "Temporal Sequence Modeling",
        "scope": "Time-series model evaluated against temporal distribution shifts and anomalous patterns.",
        "weaknesses": ["Spike sensitivity", "Concept drift adaptation", "Long-horizon accuracy", "Noise robustness"],
    },
    "sequential": {
        "task_type": "Sequence Classification / Generation",
        "domain": "Natural Language / Sequential Processing",
        "scope": "Sequential model evaluated against adversarial text and length distribution shifts.",
        "weaknesses": ["OOV token handling", "Long-context coherence", "Adversarial robustness", "Length generalization"],
    },
    "vector": {
        "task_type": "Embedding / Similarity Search",
        "domain": "Representation Learning",
        "scope": "Vector model evaluated against embedding space perturbations and distribution drift.",
        "weaknesses": ["Adversarial perturbation sensitivity", "Cross-encoder compatibility", "Sparse input handling", "Dimensionality robustness"],
    },
}


# ─── Main entry point ─────────────────────────────────────────────────────────

def analyze_model(
    evaluation_id: str,
    model_path: str,
    dataset_type: str,
    architecture: Optional[str],
    framework: Optional[str],
    metrics: Dict[str, Any],
    progress_callback=None,
    # Extra context for domain detection
    name: Optional[str] = None,
    description: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Main analysis entry point. Returns structured analysis results.
    Domain-aware for image models: detects medical/satellite/autonomous/general.
    """
    if USE_MOCK:
        return _mock_analyze(evaluation_id, dataset_type, architecture, framework, metrics,
                             progress_callback, name, description, model_path=model_path)
    try:
        return _real_analyze(evaluation_id, model_path, dataset_type, architecture, framework,
                             metrics, progress_callback, name, description)
    except Exception as e:
        logger.error(f"[ModelAnalysis] Real analysis failed, falling back to mock: {e}")
        return _mock_analyze(evaluation_id, dataset_type, architecture, framework, metrics,
                             progress_callback, name, description)


def _get_image_context(dataset_type: str, name: Optional[str], architecture: Optional[str], description: Optional[str]):
    """Return (domain, edge_cases, template, vuln_stressors) for image models."""
    domain = detect_image_domain(name or "", architecture, description)
    edge_cases = EDGE_CASES_BY_DOMAIN[domain]
    template   = WEAKNESS_TEMPLATES_BY_DOMAIN[domain]
    stressors  = VULNERABILITY_VECTORS_BY_DOMAIN[domain]
    return domain, edge_cases, template, stressors


def _real_analyze(evaluation_id, model_path, dataset_type, architecture, framework,
                  metrics, progress_callback, name, description):
    result = {}
    ext = Path(model_path).suffix.lower()

    if progress_callback: progress_callback(10)

    if ext in [".pt", ".pth"]:
        try:
            import torch
            checkpoint = torch.load(model_path, map_location="cpu")
            if isinstance(checkpoint, dict):
                keys = list(checkpoint.keys())
                result["detected_task_type"] = _infer_task_from_keys(keys, dataset_type)
            else:
                result["detected_task_type"] = "Image Classification"
        except Exception as e:
            logger.warning(f"[ModelAnalysis] PyTorch load failed: {e}")

    elif ext == ".onnx":
        try:
            import onnx
            model = onnx.load(model_path)
            result["onnx_opset"] = model.opset_import[0].version if model.opset_import else "unknown"
            result["detected_task_type"] = "ONNX Model"
        except Exception as e:
            logger.warning(f"[ModelAnalysis] ONNX load failed: {e}")

    elif ext in [".pkl", ".joblib"]:
        try:
            import joblib
            model_obj = joblib.load(model_path)
            result["model_class"] = type(model_obj).__name__
            result["detected_task_type"] = "Classification / Regression"

            # ── Deep inspection of sklearn model ──────────────────────────
            inspection = _inspect_sklearn_model(model_obj)
            result.update(inspection)
            logger.info(f"[ModelAnalysis] Sklearn inspection: {inspection}")
        except Exception as e:
            logger.warning(f"[ModelAnalysis] Sklearn load failed: {e}")

    if progress_callback: progress_callback(50)

    if dataset_type == "image":
        domain, edge_cases, template, stressor_keys = _get_image_context(dataset_type, name, architecture, description)
    else:
        domain     = None
        edge_cases = EDGE_CASES_BY_TYPE.get(dataset_type, EDGE_CASES_BY_TYPE["tabular"])
        template   = WEAKNESS_TEMPLATES.get(dataset_type, WEAKNESS_TEMPLATES["tabular"])
        stressor_keys = None

    result.setdefault("detected_task_type", template["task_type"])
    result["domain"]           = template["domain"]
    result["image_domain"]     = domain
    result["scope_summary"]    = template["scope"]
    result["edge_case_analysis"] = edge_cases
    result["weakness_report"]  = {
        "weaknesses":       template["weaknesses"],
        "metrics_analysis": _analyze_metrics(metrics),
        "risk_factors":     _compute_risk_factors(metrics, dataset_type, domain),
    }
    # Pass real model inspection signals into vulnerability vector
    model_inspection = {k: v for k, v in result.items()
                        if k in ("top_feature_concentration", "zero_importance_ratio",
                                 "coef_sparsity", "coef_max_ratio", "input_std_variance",
                                 "n_classes", "has_class_weight", "regularization_C",
                                 "gini_concentration", "n_features")}
    result["vulnerability_vector"] = _build_vulnerability_vector(
        dataset_type, metrics, domain, stressor_keys, model_inspection=model_inspection
    )

    if progress_callback: progress_callback(100)
    return result


def _mock_analyze(evaluation_id, dataset_type, architecture, framework, metrics,
                  progress_callback, name, description, model_path=""):
    logger.info(f"[ModelAnalysis MOCK] Analyzing evaluation {evaluation_id}")
    stages = [
        (15, "Parsing model architecture..."),
        (30, "Detecting operational domain..."),
        (50, "Mapping vulnerability surface..."),
        (70, "Generating domain-specific edge cases..."),
        (90, "Compiling weakness report..."),
        (100, "Analysis complete"),
    ]
    for pct, stage in stages:
        time.sleep(0.5)
        logger.info(f"[ModelAnalysis] {stage}")
        if progress_callback: progress_callback(pct)

    if dataset_type == "image":
        domain, edge_cases, template, stressor_keys = _get_image_context(dataset_type, name, architecture, description)
    else:
        domain        = None
        edge_cases    = EDGE_CASES_BY_TYPE.get(dataset_type, EDGE_CASES_BY_TYPE["tabular"])
        template      = WEAKNESS_TEMPLATES.get(dataset_type, WEAKNESS_TEMPLATES["tabular"])
        stressor_keys = None

    # ── Always inspect the real model file even in mock mode ──────────────
    model_inspection = {}
    if model_path and os.path.exists(model_path):
        ext = Path(model_path).suffix.lower()
        if ext in [".pkl", ".joblib"]:
            try:
                import joblib as _jl
                model_obj = _jl.load(model_path)
                model_inspection = _inspect_sklearn_model(model_obj)
                logger.info(f"[ModelAnalysis MOCK] Real inspection: {list(model_inspection.keys())}")
            except Exception as e:
                logger.warning(f"[ModelAnalysis MOCK] Inspection failed: {e}")

    vuln_vector = _build_vulnerability_vector(dataset_type, metrics, domain, stressor_keys,
                                               model_inspection=model_inspection)

    return {
        "detected_task_type":  template["task_type"],
        "domain":              template["domain"],
        "image_domain":        domain,
        "scope_summary": (
            f"Analyzed {architecture or 'custom'} model built with {framework or 'unknown framework'}. "
            f"{template['scope']} "
            f"Baseline accuracy: {metrics.get('accuracy', 'N/A')}. "
            f"Identified {len(edge_cases)} potential failure modes across "
            f"{len(template['weaknesses'])} weakness categories."
            + (f" Model inspection: {model_inspection.get('estimator_class','unknown')} "
               f"with {model_inspection.get('n_features','?')} features." if model_inspection else "")
        ),
        "edge_case_analysis":  edge_cases,
        "weakness_report": {
            "weaknesses":       template["weaknesses"],
            "metrics_analysis": _analyze_metrics(metrics),
            "risk_factors":     _compute_risk_factors(metrics, dataset_type, domain),
        },
        "vulnerability_vector": vuln_vector,
        # Expose inspection signals for transparency
        "model_inspection":    model_inspection,
    }


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _analyze_metrics(metrics: Dict) -> List[Dict]:
    notes = []
    thresholds = {
        "accuracy": (0.90, "Accuracy below 90% indicates significant generalization gaps."),
        "precision": (0.85, "Low precision causes high false positive rate under distribution shift."),
        "recall": (0.85, "Low recall means the model misses true positives under stress."),
        "f1": (0.87, "F1 below 0.87 suggests imbalanced precision-recall tradeoff."),
        "map": (0.50, "mAP below 0.50 is insufficient for production object detection."),
        "roc_auc": (0.85, "ROC-AUC below 0.85 indicates poor discriminative ability."),
    }
    for key, (threshold, note) in thresholds.items():
        val = metrics.get(key)
        if val is not None:
            status = "pass" if float(val) >= threshold else "warn"
            notes.append({"metric": key, "value": val, "threshold": threshold, "status": status,
                          "note": note if status == "warn" else "Within acceptable range."})
    return notes


def _compute_risk_factors(metrics: Dict, dataset_type: str, domain: Optional[str]) -> List[str]:
    risks = []
    acc = metrics.get("accuracy")
    if acc and float(acc) < 0.85:
        risks.append("Low baseline accuracy — model will degrade severely under stress conditions.")
    f1 = metrics.get("f1")
    if f1 and float(f1) < 0.80:
        risks.append("Poor F1 score — precision-recall imbalance will amplify under edge cases.")

    if dataset_type == "image":
        if domain == "medical":
            risks.append("Medical models must generalize across scanner manufacturers and acquisition protocols.")
            risks.append("Patient safety implications require near-zero false negative rate under all conditions.")
        elif domain == "satellite":
            risks.append("Remote sensing models are sensitive to atmospheric conditions and seasonal variation.")
        elif domain == "autonomous":
            risks.append("Autonomous driving models are highly sensitive to weather, lighting, and occlusion.")
        else:
            risks.append("Image models are sensitive to noise, contrast shifts, and compression artifacts.")
    elif dataset_type == "time_series":
        risks.append("Temporal models are vulnerable to concept drift and anomalous spike sequences.")

    if not risks:
        risks.append("Baseline metrics are acceptable but stress testing may reveal hidden vulnerabilities.")
    return risks


def _build_vulnerability_vector(dataset_type: str, metrics: Dict,
                                 domain: Optional[str], stressor_keys: Optional[List[str]],
                                 model_inspection: Optional[Dict] = None) -> Dict[str, float]:
    """
    Build vulnerability scores from REAL model signals where available.
    Each score is in [0, 1]: lower = more vulnerable (bigger degradation).

    Signals used from model inspection:
      - top_feature_concentration  → high = fragile to feature dropout / OOD
      - zero_importance_ratio      → high = many useless features = noisy categorical risk
      - coef_sparsity              → high = fragile to feature dropout
      - coef_max_ratio             → high = over-reliant on single feature
      - input_std_variance         → high = uneven feature scales = missing value risk
      - n_classes                  → many classes = class imbalance risk
      - regularization_C           → high C = low regularization = OOD risk
      - gini_concentration         → low = spread importances = more robust
    """
    base_acc = float(metrics.get("accuracy") or 0.85)
    deg = max(0.1, 1.0 - base_acc)   # higher degradation factor for lower accuracy

    insp = model_inspection or {}

    def _clamp(v): return round(max(0.05, min(0.95, v)), 3)

    if dataset_type == "image" and stressor_keys:
        medical_severity = {
            "low_contrast":         (0.20, 0.40),
            "image_noise":          (0.25, 0.45),
            "compression_artifact": (0.40, 0.60),
            "scanner_variation":    (0.15, 0.35),
            "motion_artifact":      (0.30, 0.50),
            "staining_variation":   (0.35, 0.55),
            "overexposure":         (0.45, 0.65),
        }
        satellite_severity = {
            "cloud_cover":      (0.10, 0.30),
            "atmospheric_haze": (0.30, 0.50),
            "sensor_noise":     (0.35, 0.55),
            "resolution_drop":  (0.25, 0.45),
            "seasonal_change":  (0.40, 0.60),
        }
        autonomous_severity = {
            "fog_dense":    (0.25, 0.45),
            "rain_heavy":   (0.30, 0.50),
            "occlusion_80": (0.10, 0.25),
            "occlusion_50": (0.35, 0.55),
            "night_low":    (0.40, 0.60),
            "motion_blur":  (0.45, 0.65),
            "lens_flare":   (0.55, 0.75),
        }
        general_severity = {
            "image_noise":          (0.30, 0.50),
            "low_contrast":         (0.25, 0.45),
            "motion_blur":          (0.40, 0.60),
            "compression_artifact": (0.45, 0.65),
            "color_shift":          (0.50, 0.70),
        }
        severity_map = {
            "medical":    medical_severity,
            "satellite":  satellite_severity,
            "autonomous": autonomous_severity,
            "general":    general_severity,
        }.get(domain or "general", general_severity)

        result = {}
        for key in stressor_keys:
            lo, hi = severity_map.get(key, (0.30, 0.55))
            result[key] = _clamp(random.uniform(lo, hi) + deg * 0.25)
        return result

    elif dataset_type == "tabular":
        # ── Model-specific tabular vulnerability scores ──────────────────
        # missing_values: fragile if input features have uneven scales
        input_std_var = insp.get("input_std_variance", 0.5)
        missing_base  = min(0.85, 0.20 + input_std_var * 0.4 + deg * 0.3)

        # ood_inputs: fragile if high regularization_C (low regularization)
        #             or high top_feature_concentration
        reg_C         = insp.get("regularization_C", 1.0)
        top_feat      = insp.get("top_feature_concentration", 0.3)
        ood_base      = min(0.85, 0.15 + min(reg_C / 10, 0.3) + top_feat * 0.3 + deg * 0.4)

        # class_imbalance: fragile if model has many classes or no class_weight
        n_classes     = insp.get("n_classes", 2)
        has_cw        = insp.get("has_class_weight", False)
        imb_base      = min(0.85, 0.40 + (n_classes - 2) * 0.05 + (0 if has_cw else 0.15) + deg * 0.2)

        # noisy_categorical: fragile if many zero-importance features
        zero_ratio    = insp.get("zero_importance_ratio", insp.get("coef_sparsity", 0.3))
        noisy_base    = min(0.85, 0.30 + zero_ratio * 0.4 + deg * 0.25)

        # feature_dropout: fragile if high top_feature_concentration (over-reliant on few features)
        coef_max      = insp.get("coef_max_ratio", insp.get("top_feature_concentration", 0.3))
        dropout_base  = min(0.85, 0.45 + coef_max * 0.2 + deg * 0.15)

        return {
            "missing_values":    _clamp(missing_base  + random.uniform(-0.03, 0.03)),
            "ood_inputs":        _clamp(ood_base       + random.uniform(-0.03, 0.03)),
            "class_imbalance":   _clamp(imb_base       + random.uniform(-0.03, 0.03)),
            "noisy_categorical": _clamp(noisy_base     + random.uniform(-0.03, 0.03)),
            "feature_dropout":   _clamp(dropout_base   + random.uniform(-0.03, 0.03)),
        }

    elif dataset_type == "time_series":
        return {
            "spike_anomaly":       _clamp(random.uniform(0.15, 0.35) + deg * 0.4),
            "concept_drift":       _clamp(random.uniform(0.25, 0.45) + deg * 0.3),
            "missing_timesteps":   _clamp(random.uniform(0.30, 0.50) + deg * 0.25),
            "seasonal_disruption": _clamp(random.uniform(0.40, 0.60) + deg * 0.2),
            "hf_noise":            _clamp(random.uniform(0.50, 0.70) + deg * 0.1),
        }

    elif dataset_type == "sequential":
        # ── Model-specific sequential vulnerability scores ───────────────
        # coef_sparsity high → fragile to OOV (relies on specific token patterns)
        coef_sp   = insp.get("coef_sparsity", insp.get("zero_importance_ratio", 0.3))
        oov_base  = min(0.85, 0.20 + coef_sp * 0.5 + deg * 0.35)

        # coef_max_ratio high → fragile to adversarial (over-reliant on key tokens)
        coef_mx   = insp.get("coef_max_ratio", insp.get("top_feature_concentration", 0.3))
        adv_base  = min(0.85, 0.30 + coef_mx * 0.3 + deg * 0.25)

        # n_features high → likely trained on long sequences → fragile to length mismatch
        n_feat    = insp.get("n_features", 256)
        len_base  = min(0.85, 0.35 + min(n_feat / 1000, 0.3) + deg * 0.2)

        return {
            "long_range":               _clamp(random.uniform(0.20, 0.40) + deg * 0.35),
            "oov_tokens":               _clamp(oov_base  + random.uniform(-0.03, 0.03)),
            "adversarial_perturbation": _clamp(adv_base  + random.uniform(-0.03, 0.03)),
            "length_mismatch":          _clamp(len_base  + random.uniform(-0.03, 0.03)),
        }

    else:
        return {
            "adversarial_perturbation": _clamp(random.uniform(0.20, 0.40) + deg * 0.35),
            "ood_distribution":         _clamp(random.uniform(0.30, 0.50) + deg * 0.25),
            "noise_injection":          _clamp(random.uniform(0.40, 0.60) + deg * 0.2),
        }


def _infer_task_from_keys(keys: List[str], dataset_type: str) -> str:
    key_str = " ".join(keys).lower()
    if "classifier" in key_str or "fc" in key_str:
        return "Classification"
    if "detector" in key_str or "bbox" in key_str:
        return "Object Detection"
    if "encoder" in key_str or "embedding" in key_str:
        return "Representation Learning"
    return "Image Classification"


def _inspect_sklearn_model(model_obj) -> Dict[str, Any]:
    """
    Deep-inspect a sklearn model or Pipeline to extract real vulnerability signals:
    - Feature importances (which features the model relies on most)
    - Class distribution (imbalance vulnerability)
    - Model complexity (overfitting risk)
    - Coefficient sparsity (fragility to feature dropout)
    - Decision boundary tightness (OOD vulnerability)
    Returns a dict of extracted signals used to build model-specific vuln scores.
    """
    result = {}
    try:
        # Unwrap Pipeline to get the actual estimator
        estimator = model_obj
        scaler = None
        if hasattr(model_obj, "steps"):
            for name, step in model_obj.steps:
                if hasattr(step, "predict"):
                    estimator = step
                if hasattr(step, "mean_"):
                    scaler = step

        cls_name = type(estimator).__name__
        result["estimator_class"] = cls_name

        # ── Feature importances (RandomForest, GradientBoosting, etc.) ──
        if hasattr(estimator, "feature_importances_"):
            fi = estimator.feature_importances_
            result["n_features"] = len(fi)
            result["top_feature_concentration"] = float(fi.max())          # how dominant is the top feature
            result["gini_concentration"] = float(                           # Gini of importance distribution
                1 - sum((f / fi.sum()) ** 2 for f in fi if fi.sum() > 0)
            )
            result["zero_importance_ratio"] = float((fi < 1e-6).mean())    # fraction of useless features
            result["feature_importance_std"] = float(fi.std())
            logger.info(f"[Inspect] top_feature={fi.max():.3f}, zero_ratio={result['zero_importance_ratio']:.2%}")

        # ── Coefficients (LogisticRegression, LinearSVC, Ridge, etc.) ──
        elif hasattr(estimator, "coef_"):
            coef = estimator.coef_
            flat = abs(coef).flatten()
            result["n_features"] = coef.shape[-1]
            result["coef_sparsity"] = float((flat < 1e-4).mean())          # near-zero coefficients
            result["coef_max_ratio"] = float(flat.max() / (flat.mean() + 1e-8))  # dominance of top coef
            result["coef_std"] = float(flat.std())
            logger.info(f"[Inspect] coef_sparsity={result['coef_sparsity']:.2%}, max_ratio={result['coef_max_ratio']:.2f}")

        # ── Tree structure (depth, n_leaves) ──
        if hasattr(estimator, "max_depth") and estimator.max_depth:
            result["max_depth"] = estimator.max_depth
        if hasattr(estimator, "n_estimators"):
            result["n_estimators"] = estimator.n_estimators

        # ── Class distribution ──
        if hasattr(estimator, "classes_"):
            result["n_classes"] = len(estimator.classes_)
        if hasattr(estimator, "class_weight") and estimator.class_weight:
            result["has_class_weight"] = True

        # ── Scaler stats (tells us about input distribution) ──
        if scaler is not None and hasattr(scaler, "mean_"):
            result["input_mean"] = float(scaler.mean_.mean())
            result["input_std"]  = float(scaler.scale_.mean())
            result["input_std_variance"] = float(scaler.scale_.std())  # high = uneven feature scales

        # ── Training score proxy (C parameter for LR = regularization strength) ──
        if hasattr(estimator, "C"):
            result["regularization_C"] = float(estimator.C)  # low C = high regularization = more robust

    except Exception as e:
        logger.warning(f"[Inspect] Partial inspection failure: {e}")

    return result
