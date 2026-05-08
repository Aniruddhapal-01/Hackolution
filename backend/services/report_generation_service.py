"""
Report Generation Service
Generates a structured JSON report and a downloadable CSV summary
for a completed model evaluation.
"""
import os
import io
import csv
import json
import logging
from datetime import datetime
from typing import Dict, Any, List

from storage import upload_bytes

logger = logging.getLogger(__name__)


def generate_report(
    evaluation_id: str,
    evaluation_data: Dict[str, Any],
) -> str:
    """
    Build a full evaluation report, store it, and return the storage key.
    """
    report = _build_report(evaluation_id, evaluation_data)

    # ── Store JSON report ──────────────────────────────────────────────────
    json_key = f"reports/{evaluation_id}/report.json"
    upload_bytes(
        json.dumps(report, indent=2, default=str).encode("utf-8"),
        json_key,
        content_type="application/json",
    )

    # ── Store CSV summary ──────────────────────────────────────────────────
    csv_key = f"reports/{evaluation_id}/summary.csv"
    upload_bytes(
        _build_csv(report).encode("utf-8"),
        csv_key,
        content_type="text/csv",
    )

    logger.info(f"[ReportGen] Report stored at {json_key}")
    return f"http://localhost:8000/media/{csv_key}"


def _build_report(evaluation_id: str, d: Dict[str, Any]) -> Dict[str, Any]:
    """Assemble the full structured report dict."""
    stress_results = d.get("stress_results") or []
    datasets = d.get("fetched_datasets") or []
    edge_cases = d.get("edge_case_analysis") or []
    metrics = d.get("original_metrics") or {}
    weakness = d.get("weakness_report") or {}

    return {
        "report_id":        f"BSR-{evaluation_id[:8].upper()}",
        "generated_at":     datetime.utcnow().isoformat(),
        "platform":         "BlindSpot.AI v2.0",

        # ── Section 1: Model Overview ──────────────────────────────────────
        "model_overview": {
            "name":             d.get("name", "Unnamed Model"),
            "architecture":     d.get("architecture", "Unknown"),
            "framework":        d.get("framework", "Unknown"),
            "dataset_type":     d.get("dataset_type", "Unknown"),
            "model_file":       d.get("model_filename", "N/A"),
            "model_size_bytes": d.get("model_size_bytes", 0),
            "original_metrics": {
                "accuracy":  metrics.get("accuracy"),
                "precision": metrics.get("precision"),
                "recall":    metrics.get("recall"),
                "f1":        metrics.get("f1"),
                "mAP":       metrics.get("map"),
                "roc_auc":   metrics.get("roc_auc"),
            },
        },

        # ── Section 2: Scope Analysis ──────────────────────────────────────
        "scope_analysis": {
            "detected_task_type": d.get("detected_task_type", "Unknown"),
            "operational_domain": d.get("domain", "Unknown"),
            "scope_summary":      d.get("scope_summary", ""),
        },

        # ── Section 3: Edge Case Analysis ─────────────────────────────────
        "edge_case_analysis": {
            "total_identified": len(edge_cases),
            "critical_count":   sum(1 for e in edge_cases if e.get("severity") == "critical"),
            "high_count":       sum(1 for e in edge_cases if e.get("severity") == "high"),
            "medium_count":     sum(1 for e in edge_cases if e.get("severity") == "medium"),
            "cases":            edge_cases,
            "weakness_summary": weakness.get("weaknesses", []),
            "risk_factors":     weakness.get("risk_factors", []),
        },

        # ── Section 4: Dataset Summary ─────────────────────────────────────
        "dataset_summary": {
            "total_datasets":   len(datasets),
            "total_samples":    sum(d.get("samples", 0) for d in datasets),
            "sources_used":     list({d.get("source") for d in datasets}),
            "datasets":         datasets,
        },

        # ── Section 5: Testing Results ─────────────────────────────────────
        "testing_results": {
            "total_tests":       len(stress_results),
            "passed":            sum(1 for r in stress_results if r.get("passed")),
            "failed":            sum(1 for r in stress_results if not r.get("passed")),
            "avg_degradation":   round(
                sum(r.get("degradation_pct", 0) for r in stress_results) / len(stress_results), 1
            ) if stress_results else 0,
            "worst_stressor":    min(stress_results, key=lambda r: r.get("stressed_score", 1), default={}).get("stressor_label", "N/A"),
            "best_stressor":     max(stress_results, key=lambda r: r.get("stressed_score", 0), default={}).get("stressor_label", "N/A"),
            "per_stressor":      stress_results,
        },

        # ── Section 6: Final Assessment ────────────────────────────────────
        "final_assessment": {
            "robustness_score":  d.get("robustness_score", 0),
            "risk_level":        d.get("risk_level", "unknown"),
            "deployment_ready":  d.get("deployment_ready", False),
            "recommendation":    _generate_recommendation(
                d.get("robustness_score", 0),
                d.get("risk_level", "critical"),
                d.get("deployment_ready", False),
            ),
            "action_items":      _generate_action_items(stress_results, edge_cases),
        },
    }


def _build_csv(report: Dict[str, Any]) -> str:
    """Build a CSV summary of the stress test results."""
    output = io.StringIO()
    writer = csv.writer(output)

    # Header block
    writer.writerow(["BLINDSPOT.AI ROBUSTNESS EVALUATION REPORT"])
    writer.writerow(["Report ID", report["report_id"]])
    writer.writerow(["Generated At", report["generated_at"]])
    writer.writerow(["Model", report["model_overview"]["name"]])
    writer.writerow(["Architecture", report["model_overview"]["architecture"]])
    writer.writerow(["Framework", report["model_overview"]["framework"]])
    writer.writerow(["Robustness Score", f"{report['final_assessment']['robustness_score']}%"])
    writer.writerow(["Risk Level", report["final_assessment"]["risk_level"].upper()])
    writer.writerow(["Deployment Ready", "YES" if report["final_assessment"]["deployment_ready"] else "NO"])
    writer.writerow([])

    # Stress test results
    writer.writerow(["STRESS TEST RESULTS"])
    writer.writerow(["STRESSOR", "ORIGINAL SCORE", "STRESSED SCORE", "DEGRADATION %", "CONFIDENCE STABILITY", "SAMPLES", "STATUS", "NOTES"])
    for r in report["testing_results"]["per_stressor"]:
        writer.writerow([
            r.get("stressor_label", ""),
            r.get("original_score", ""),
            r.get("stressed_score", ""),
            f"{r.get('degradation_pct', 0)}%",
            r.get("confidence_stability", ""),
            r.get("sample_count", ""),
            "PASS" if r.get("passed") else "FAIL",
            r.get("notes", ""),
        ])
    writer.writerow([])

    # Edge cases
    writer.writerow(["EDGE CASE ANALYSIS"])
    writer.writerow(["NAME", "SEVERITY", "STRESSOR", "DESCRIPTION"])
    for ec in report["edge_case_analysis"]["cases"]:
        writer.writerow([
            ec.get("name", ""),
            ec.get("severity", "").upper(),
            ec.get("stressor", ""),
            ec.get("description", ""),
        ])
    writer.writerow([])

    # Recommendation
    writer.writerow(["FINAL RECOMMENDATION"])
    writer.writerow([report["final_assessment"]["recommendation"]])

    output.seek(0)
    return output.getvalue()


def _generate_recommendation(robustness_score: float, risk_level: str, deployment_ready: bool) -> str:
    if deployment_ready and robustness_score >= 80:
        return (
            f"Model demonstrates strong robustness with a score of {robustness_score}%. "
            "Approved for production deployment with standard monitoring in place."
        )
    elif robustness_score >= 60:
        return (
            f"Model shows moderate robustness ({robustness_score}%). "
            "Conditional deployment approved — implement targeted data augmentation for failed stressors "
            "and establish confidence threshold monitoring in production."
        )
    else:
        return (
            f"Model robustness score of {robustness_score}% is below production threshold. "
            "Deployment NOT recommended. Retrain with stress-augmented datasets for all FAILED stressors "
            "before re-evaluation."
        )


def _generate_action_items(stress_results: List[Dict], edge_cases: List[Dict]) -> List[str]:
    items = []
    failed = [r for r in stress_results if not r.get("passed")]
    for r in failed[:3]:
        items.append(
            f"Augment training data with {r['stressor_label']} samples "
            f"(current stressed accuracy: {r.get('stressed_score', 0)*100:.1f}%)"
        )
    critical_cases = [e for e in edge_cases if e.get("severity") == "critical"]
    for ec in critical_cases[:2]:
        items.append(f"Address critical edge case: {ec['name']}")
    if not items:
        items.append("Continue monitoring model performance in production with confidence threshold alerts.")
    return items
