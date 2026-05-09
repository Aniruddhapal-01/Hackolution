"""
BlindSpot.AI — Dataset Generation Accuracy Evaluator (CLI)
===========================================================
Measures the accuracy of the dataset generation system for any evaluation.

Usage:
    python evaluate_datasets.py                        # auto-picks latest evaluation
    python evaluate_datasets.py <evaluation_id>        # specific evaluation
    python evaluate_datasets.py --all                  # all evaluations in DB

Output:
    Prints a full accuracy report to the console.
    Overall accuracy = weighted score across 4 quality dimensions.
"""

import os, sys, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from services.dataset_quality_evaluator import evaluate_dataset_quality
from pathlib import Path

DATA_DIR     = os.path.join(os.path.dirname(__file__), "backend", "data")
DATASETS_DIR = os.path.join(DATA_DIR, "generated_datasets")


def _get_evaluation_ids():
    """Get all evaluation IDs that have generated datasets on disk."""
    d = Path(DATASETS_DIR)
    if not d.exists():
        return []
    return [p.name for p in d.iterdir() if p.is_dir()]


def _get_vuln_vector_from_db(evaluation_id: str):
    """Try to load vulnerability_vector from the SQLite DB."""
    try:
        db_path = os.path.join(os.path.dirname(__file__), "backend", "blindspot.db")
        import sqlite3, json as _json
        conn = sqlite3.connect(db_path)
        cur  = conn.cursor()
        cur.execute(
            "SELECT vulnerability_vector, dataset_type FROM model_evaluations WHERE id=?",
            (evaluation_id,)
        )
        row = cur.fetchone()
        conn.close()
        if row and row[0]:
            vuln = _json.loads(row[0]) if isinstance(row[0], str) else row[0]
            dtype = row[1] or "image"
            return vuln, dtype
    except Exception as e:
        print(f"  [DB] Could not load from DB: {e}")
    return None, None


def _infer_vuln_vector_from_disk(evaluation_id: str):
    """Infer vulnerability vector from the stressor directories on disk."""
    eval_dir = Path(DATASETS_DIR) / evaluation_id
    stressors = [p.name for p in eval_dir.iterdir() if p.is_dir()]

    # Guess dataset type from stressor names
    image_stressors    = {"fog_dense","rain_heavy","occlusion_80","occlusion_50","night_low",
                          "motion_blur","lens_flare","low_contrast","image_noise","cloud_cover",
                          "atmospheric_haze","sensor_noise","resolution_drop","seasonal_change",
                          "color_shift","compression_artifact","scanner_variation","overexposure"}
    tabular_stressors  = {"missing_values","ood_inputs","class_imbalance","noisy_categorical","feature_dropout"}
    seq_stressors      = {"long_range","oov_tokens","adversarial_perturbation","length_mismatch"}
    ts_stressors       = {"spike_anomaly","concept_drift","missing_timesteps","seasonal_disruption","hf_noise"}

    stressor_set = set(stressors)
    if stressor_set & image_stressors:    dtype = "image"
    elif stressor_set & tabular_stressors: dtype = "tabular"
    elif stressor_set & seq_stressors:    dtype = "sequential"
    elif stressor_set & ts_stressors:     dtype = "time_series"
    else:                                  dtype = "image"

    # Assign dummy vuln scores (0.5 = moderate vulnerability)
    vuln = {s: 0.5 for s in stressors}
    return vuln, dtype


def _print_report(result: dict):
    eid   = result["evaluation_id"]
    dtype = result["dataset_type"]
    acc   = result["overall_accuracy"]
    grade = result["grade"]
    s     = result["summary"]
    cov   = result["coverage"]

    print()
    print("=" * 65)
    print(f"  BlindSpot.AI — Dataset Generation Quality Report")
    print("=" * 65)
    print(f"  Evaluation ID : {eid}")
    print(f"  Dataset Type  : {dtype}")
    print()
    print(f"  ┌─────────────────────────────────────────────────────┐")
    print(f"  │  OVERALL ACCURACY : {acc:>5.1f}%   Grade: {grade:<20}│")
    print(f"  └─────────────────────────────────────────────────────┘")
    print()
    print(f"  DIMENSION BREAKDOWN:")
    print(f"  {'Dimension':<28} {'Score':>7}")
    print(f"  {'-'*36}")
    print(f"  {'Stressor Fidelity':<28} {s['avg_fidelity']:>6.1f}%")
    print(f"  {'Label Correctness':<28} {s['avg_label_acc']:>6.1f}%")
    print(f"  {'Distribution Shift':<28} {s['avg_distribution']:>6.1f}%")
    print(f"  {'Coverage Completeness':<28} {s['avg_coverage']:>6.1f}%")
    print()
    print(f"  Coverage: {cov['detail']}")
    print()
    print(f"  PER-STRESSOR RESULTS:")
    print(f"  {'Stressor':<30} {'Fidelity':>9} {'Labels':>7} {'Dist':>6} {'Overall':>8}")
    print(f"  {'-'*65}")

    for stressor, data in result["per_stressor"].items():
        fid  = data["fidelity"]["score"]   * 100
        lbl  = data["label"]["score"]      * 100
        dist = data["distribution"]["score"]* 100
        ov   = data["overall"]             * 100
        flag = "✓" if ov >= 70 else "✗"
        print(f"  {flag} {stressor:<28} {fid:>8.1f}% {lbl:>6.1f}% {dist:>5.1f}% {ov:>7.1f}%")

    print()
    print(f"  HOW TO READ THIS:")
    print(f"  ─────────────────────────────────────────────────────")
    print(f"  Stressor Fidelity   — Did the transform change data correctly?")
    print(f"                        (fog raised brightness, noise raised std, etc.)")
    print(f"  Label Correctness   — Are corrupted rows correctly labeled?")
    print(f"  Distribution Shift  — Is corrupted data statistically different?")
    print(f"  Coverage            — Were all expected stressors generated?")
    print()
    print(f"  GRADING SCALE:")
    print(f"  90-100% = A (Excellent)   70-80% = C (Acceptable)")
    print(f"  80-90%  = B (Good)        60-70% = D (Needs work)")
    print("=" * 65)
    print()


def main():
    args = sys.argv[1:]

    if "--all" in args:
        ids = _get_evaluation_ids()
        if not ids:
            print("No generated datasets found in:", DATASETS_DIR)
            return
        for eid in ids:
            vuln, dtype = _get_vuln_vector_from_db(eid)
            if not vuln:
                vuln, dtype = _infer_vuln_vector_from_disk(eid)
            result = evaluate_dataset_quality(eid, dtype, vuln)
            _print_report(result)
        return

    if args and not args[0].startswith("--"):
        eid = args[0]
    else:
        ids = _get_evaluation_ids()
        if not ids:
            print("No generated datasets found in:", DATASETS_DIR)
            print("Run an evaluation first via the dashboard.")
            return
        eid = ids[-1]  # latest
        print(f"Auto-selected latest evaluation: {eid}")

    vuln, dtype = _get_vuln_vector_from_db(eid)
    if not vuln:
        print(f"  Could not load from DB — inferring from disk...")
        vuln, dtype = _infer_vuln_vector_from_disk(eid)

    if not vuln:
        print(f"No stressor data found for evaluation: {eid}")
        return

    result = evaluate_dataset_quality(eid, dtype, vuln)
    _print_report(result)

    # Also save JSON
    out_path = os.path.join(DATA_DIR, "reports", eid, "dataset_quality.json")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)
    print(f"  JSON saved to: {out_path}")


if __name__ == "__main__":
    main()
