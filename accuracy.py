"""
BlindSpot.AI — Quick Accuracy Check
Run: python accuracy.py
"""
import sys, os, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

BENCHMARK_DIR = os.path.join(os.path.dirname(__file__), "backend", "data", "benchmark")
report_path   = os.path.join(BENCHMARK_DIR, "generation_accuracy_report.json")

# If a saved report exists, just print it instantly
if os.path.exists(report_path):
    with open(report_path, encoding="utf-8") as f:
        report = json.load(f)
    acc   = report["overall_accuracy"]
    grade = report["grade"]
    by    = report.get("by_type", {})
    print(f"\n  Dataset Generation Accuracy : {acc}%  ({grade})")
    for dtype, score in by.items():
        print(f"  {dtype.capitalize():<12} : {score}%")
    print()
else:
    # No saved report — run the evaluator now
    print("  Running evaluation against benchmark...")
    try:
        from evaluate_generation_accuracy import evaluate
        result = evaluate()
        acc   = result["overall_accuracy"]
        grade = result["grade"]
        by    = result.get("by_type", {})
        print(f"\n  Dataset Generation Accuracy : {acc}%  ({grade})")
        for dtype, score in by.items():
            print(f"  {dtype.capitalize():<12} : {score}%")
        print()
    except Exception as e:
        print(f"  Error: {e}")
        print("  Run: python build_benchmark.py  first")
