import os, json, logging
from datetime import datetime
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")


def generate_report(evaluation_id: str, evaluation_data: Dict[str, Any]) -> str:
    """Generate PDF + DOCX reports. Returns URL to the PDF."""
    report = _build_report_dict(evaluation_id, evaluation_data)
    out_dir = os.path.join(DATA_DIR, "reports", evaluation_id)
    os.makedirs(out_dir, exist_ok=True)

    # Save JSON
    with open(os.path.join(out_dir, "report.json"), "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, default=str)

    # Generate PDF
    pdf_path = os.path.join(out_dir, "report.pdf")
    _build_pdf(report, pdf_path)

    # Generate DOCX
    docx_path = os.path.join(out_dir, "report.docx")
    _build_docx(report, docx_path)

    logger.info(f"[ReportGen] PDF={pdf_path} DOCX={docx_path}")
    return f"http://localhost:8000/media/reports/{evaluation_id}/report.pdf"
