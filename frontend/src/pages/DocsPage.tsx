import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Cpu, ArrowRight, ChevronRight, Upload, Shield, Database, Zap, FileText, Code, Terminal, BookOpen, AlertTriangle, CheckCircle } from "lucide-react";

const FONT = "'Google Sans', sans-serif";
const MONO = "'JetBrains Mono', monospace";

const sections = [
  { id: "overview",      label: "Overview",          icon: <BookOpen size={14} /> },
  { id: "quickstart",    label: "Quick Start",        icon: <Zap size={14} /> },
  { id: "upload",        label: "Model Upload",       icon: <Upload size={14} /> },
  { id: "analysis",      label: "Analysis Engine",    icon: <Shield size={14} /> },
  { id: "datasets",      label: "Dataset Fetching",   icon: <Database size={14} /> },
  { id: "stress",        label: "Stress Testing",     icon: <AlertTriangle size={14} /> },
  { id: "reports",       label: "Reports",            icon: <FileText size={14} /> },
  { id: "api",           label: "API Reference",      icon: <Code size={14} /> },
  { id: "formats",       label: "Supported Formats",  icon: <Terminal size={14} /> },
];

function CodeBlock({ code, children }: { code?: string; children?: React.ReactNode }) {
  return (
    <pre style={{
      background: "#0f0f0f", border: "1px solid #2d2d2d", borderRadius: "10px",
      padding: "16px 20px", fontFamily: MONO, fontSize: "13px", color: "#e2e8f0",
      overflowX: "auto", lineHeight: 1.7, margin: "12px 0",
    }}>
      <code>{code ?? children}</code>
    </pre>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <div id={id} style={{ marginBottom: "56px", scrollMarginTop: "100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", paddingBottom: "12px", borderBottom: "2px solid #facc15" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#fff", fontFamily: FONT }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: "15px", color: "#cbd5e1", lineHeight: 1.8, marginBottom: "14px" }}>{children}</p>;
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#facc15", marginBottom: "10px", marginTop: "24px", fontFamily: FONT }}>{children}</h3>;
}

function Badge({ children, color = "#facc15" }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: "9999px", background: color + "22", border: `1px solid ${color}`, color, fontSize: "12px", fontFamily: MONO, fontWeight: 700, marginRight: "6px", marginBottom: "6px" }}>
      {children}
    </span>
  );
}

function InfoBox({ type, children }: { type: "info" | "warning" | "success"; children: React.ReactNode }) {
  const map = {
    info:    { bg: "#0a1628", border: "#3b82f6", icon: <Code size={14} color="#3b82f6" />, color: "#93c5fd" },
    warning: { bg: "#1a1200", border: "#facc15", icon: <AlertTriangle size={14} color="#facc15" />, color: "#fde68a" },
    success: { bg: "#001a0a", border: "#10b981", icon: <CheckCircle size={14} color="#10b981" />, color: "#6ee7b7" },
  };
  const s = map[type];
  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: "10px", padding: "14px 18px", margin: "14px 0", display: "flex", gap: "12px", alignItems: "flex-start" }}>
      <div style={{ flexShrink: 0, marginTop: "2px" }}>{s.icon}</div>
      <p style={{ fontSize: "14px", color: s.color, lineHeight: 1.7, margin: 0 }}>{children}</p>
    </div>
  );
}

export default function DocsPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");

  return (
    <div style={{ background: "#000", minHeight: "100vh", fontFamily: FONT }}>
      {/* Navbar */}
      <nav style={{
        position: "fixed", top: "20px", left: "50%", transform: "translateX(-50%)",
        zIndex: 50, width: "calc(100% - 4rem)", maxWidth: "900px",
        background: "#0a0a0a", border: "2px solid #facc15", borderRadius: "9999px",
        padding: "0 1.5rem", height: "56px", display: "flex", alignItems: "center",
        justifyContent: "space-between", boxShadow: "0 4px 32px rgba(250,204,21,0.15)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => navigate("/")}>
          <div style={{ width: "28px", height: "28px", background: "#facc15", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Cpu size={14} color="#000" />
          </div>
          <span style={{ fontWeight: 700, color: "#fff", fontSize: "15px" }}>BlindSpot.AI</span>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {[["Pricing", "/pricing"], ["Dashboard", "/evaluations"]].map(([l, p]) => (
            <button key={l} onClick={() => navigate(p)} style={{ background: "none", border: "none", cursor: "pointer", color: "#cbd5e1", fontSize: "14px", fontFamily: FONT, padding: "6px 12px", borderRadius: "9999px", transition: "all 150ms" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#fff"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#cbd5e1"; (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
            >{l}</button>
          ))}
          <button onClick={() => navigate("/evaluations")} style={{ background: "#facc15", color: "#000", border: "none", borderRadius: "9999px", padding: "7px 18px", fontWeight: 700, fontSize: "14px", cursor: "pointer", fontFamily: FONT }}>
            Get Started <ArrowRight size={13} style={{ display: "inline", verticalAlign: "middle" }} />
          </button>
        </div>
      </nav>

      <div style={{ display: "flex", maxWidth: "1200px", margin: "0 auto", padding: "100px 2rem 4rem" }}>
        {/* Sidebar */}
        <aside style={{ width: "220px", flexShrink: 0, position: "sticky", top: "100px", height: "fit-content", marginRight: "48px" }}>
          <p style={{ fontSize: "11px", color: "#facc15", textTransform: "uppercase", letterSpacing: "0.15em", fontFamily: MONO, fontWeight: 700, marginBottom: "12px" }}>Contents</p>
          {sections.map(s => (
            <a key={s.id} href={`#${s.id}`}
              onClick={() => setActiveSection(s.id)}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "8px 12px", borderRadius: "8px", textDecoration: "none",
                fontSize: "14px", fontWeight: activeSection === s.id ? 700 : 500,
                color: activeSection === s.id ? "#facc15" : "#94a3b8",
                background: activeSection === s.id ? "#1a1400" : "transparent",
                marginBottom: "2px", transition: "all 150ms",
              }}
              onMouseEnter={e => { if (activeSection !== s.id) (e.currentTarget as HTMLAnchorElement).style.color = "#fff"; }}
              onMouseLeave={e => { if (activeSection !== s.id) (e.currentTarget as HTMLAnchorElement).style.color = "#94a3b8"; }}
            >
              {s.icon} {s.label}
            </a>
          ))}
        </aside>

        {/* Content */}
        <main style={{ flex: 1, minWidth: 0 }}>

          <Section id="overview" title="Overview">
            <P>BlindSpot.AI is an AI robustness evaluation platform that automatically identifies vulnerabilities in your trained models, generates targeted stress-test datasets, and produces professional deployment readiness reports.</P>
            <P>The platform supports all major model formats and dataset types — from computer vision models to tabular classifiers, time-series forecasters, and NLP models.</P>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", margin: "20px 0" }}>
              {[
                { title: "No GPU Required", desc: "Runs fully in mock mode on any machine" },
                { title: "5-Stage Pipeline", desc: "Upload → Analyze → Fetch → Test → Report" },
                { title: "Multi-Format", desc: ".pt .pth .onnx .h5 .pkl .joblib" },
                { title: "Real Datasets", desc: "Kaggle, HuggingFace, Roboflow integration" },
              ].map(c => (
                <div key={c.title} style={{ background: "#0f0f0f", border: "1px solid #2d2d2d", borderRadius: "10px", padding: "16px" }}>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "#facc15", marginBottom: "4px" }}>{c.title}</p>
                  <p style={{ fontSize: "13px", color: "#94a3b8" }}>{c.desc}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="quickstart" title="Quick Start">
            <P>Get your first evaluation running in under 2 minutes.</P>
            <H3>1. Generate a demo model</H3>
            <CodeBlock>{`# From the project root
python create_demo_models.py

# This creates 4 demo models in demo_models/
#   car_detector.pkl        (9.9 MB)
#   car_classifier.pkl      (1.7 MB)
#   car_damage_detector.pkl (15 KB)
#   car_counter.pkl         (4 KB)`}</CodeBlock>
            <H3>2. Start the platform</H3>
            <CodeBlock>{`# Backend (FastAPI)
cd backend
uvicorn main:app --reload --port 8000

# Frontend (React) — in a new terminal
cd frontend
npm start   # runs on http://localhost:3001`}</CodeBlock>
            <H3>3. Create an evaluation</H3>
            <P>Open <code style={{ background: "#111", padding: "2px 6px", borderRadius: "4px", fontFamily: MONO, color: "#facc15" }}>http://localhost:3001</code>, click <strong style={{ color: "#fff" }}>New Evaluation</strong>, fill in the model details, upload the <code style={{ background: "#111", padding: "2px 6px", borderRadius: "4px", fontFamily: MONO, color: "#facc15" }}>.pkl</code> file, and click <strong style={{ color: "#fff" }}>Run Evaluation</strong>.</P>
            <InfoBox type="success">The full pipeline completes in ~30 seconds in mock mode. No GPU or internet connection required.</InfoBox>
          </Section>

          <Section id="upload" title="Model Upload">
            <P>BlindSpot.AI accepts trained model files in the following formats:</P>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", margin: "16px 0" }}>
              {[".pt", ".pth", ".onnx", ".h5", ".pkl", ".joblib"].map(f => <Badge key={f}>{f}</Badge>)}
            </div>
            <H3>Supported Frameworks</H3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", margin: "12px 0" }}>
              {["PyTorch", "TensorFlow/Keras", "Scikit-learn", "ONNX", "JAX"].map(f => <Badge key={f} color="#3b82f6">{f}</Badge>)}
            </div>
            <H3>File Size Limit</H3>
            <P>Maximum upload size is <strong style={{ color: "#fff" }}>500 MB</strong>. For larger models, contact us for enterprise options.</P>
            <H3>API Upload</H3>
            <CodeBlock>{`POST /api/evaluations/{evaluation_id}/upload-model
Content-Type: multipart/form-data

# Field: file (the model file)
curl -X POST http://localhost:8000/api/evaluations/{id}/upload-model \\
  -F "file=@car_detector.pkl"`}</CodeBlock>
            <InfoBox type="warning">Ensure your model file is saved with the correct extension. A PyTorch model saved as <code>.pkl</code> will still be analyzed correctly.</InfoBox>
          </Section>

          <Section id="analysis" title="Analysis Engine">
            <P>After upload, the analysis engine inspects your model to detect:</P>
            <ul style={{ paddingLeft: "20px", color: "#cbd5e1", fontSize: "15px", lineHeight: 2 }}>
              <li>Task type (classification, detection, regression, forecasting)</li>
              <li>Operational domain (computer vision, NLP, tabular, time-series)</li>
              <li>Vulnerability surface per stressor category</li>
              <li>Edge cases specific to your dataset type</li>
              <li>Baseline metric analysis (accuracy, F1, mAP, ROC-AUC)</li>
            </ul>
            <H3>Supported Dataset Types</H3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", margin: "12px 0" }}>
              {["Image", "Tabular", "Time Series", "Sequential", "Vector"].map(t => <Badge key={t} color="#a855f7">{t}</Badge>)}
            </div>
            <H3>Vulnerability Stressors (Image)</H3>
            <CodeBlock>{`fog_dense      — Dense atmospheric fog (visibility < 30%)
rain_heavy     — Heavy rain with lens distortion
occlusion_80   — 80% object occlusion
occlusion_50   — 50% object occlusion
night_low      — Night / low-light conditions
motion_blur    — Fast motion blur
lens_flare     — Lens flare / overexposure`}</CodeBlock>
          </Section>

          <Section id="datasets" title="Dataset Fetching">
            <P>For each detected vulnerability, the platform fetches or generates targeted datasets.</P>
            <H3>Generated Synthetic Datasets</H3>
            <P>Physics-accurate synthetic datasets are generated on disk for every stressor. Each ZIP contains:</P>
            <ul style={{ paddingLeft: "20px", color: "#cbd5e1", fontSize: "15px", lineHeight: 2 }}>
              <li>40 stressed images per stressor (JPEG)</li>
              <li>YOLO <code style={{ fontFamily: MONO, color: "#facc15" }}>.txt</code> annotation files</li>
              <li>COCO JSON <code style={{ fontFamily: MONO, color: "#facc15" }}>instances.json</code></li>
              <li>README with real dataset suggestions</li>
            </ul>
            <H3>Real Dataset Suggestions</H3>
            <P>The platform also suggests verified real-world datasets from:</P>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", margin: "12px 0" }}>
              {["Kaggle", "HuggingFace", "Roboflow"].map(s => <Badge key={s} color="#f59e0b">{s}</Badge>)}
            </div>
            <H3>Download API</H3>
            <CodeBlock>{`GET /api/evaluations/{id}/datasets/{dataset_id}/download
# Returns: application/zip

# Regenerate datasets for an existing evaluation
POST /api/evaluations/{id}/regenerate-datasets`}</CodeBlock>
          </Section>

          <Section id="stress" title="Stress Testing">
            <P>The stress testing engine evaluates your model against each detected stressor and computes degradation metrics.</P>
            <H3>Metrics Computed</H3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", margin: "16px 0" }}>
              {[
                { m: "Original Score", d: "Baseline accuracy before stress" },
                { m: "Stressed Score", d: "Accuracy under stressor conditions" },
                { m: "Degradation %", d: "Percentage accuracy drop" },
                { m: "Confidence Stability", d: "Variance in prediction confidence" },
                { m: "Robustness Score", d: "Overall 0–100 robustness rating" },
                { m: "Risk Level", d: "Low / Medium / High / Critical" },
              ].map(r => (
                <div key={r.m} style={{ background: "#0f0f0f", border: "1px solid #2d2d2d", borderRadius: "8px", padding: "12px" }}>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "#facc15", marginBottom: "3px", fontFamily: MONO }}>{r.m}</p>
                  <p style={{ fontSize: "12px", color: "#94a3b8" }}>{r.d}</p>
                </div>
              ))}
            </div>
            <H3>Risk Thresholds</H3>
            <CodeBlock>{`Robustness Score >= 80  →  LOW risk     (deployment approved)
Robustness Score 60-79  →  MEDIUM risk  (conditional deployment)
Robustness Score 40-59  →  HIGH risk    (retraining recommended)
Robustness Score < 40   →  CRITICAL     (not deployment ready)`}</CodeBlock>
          </Section>

          <Section id="reports" title="Reports">
            <P>After evaluation completes, download professional reports in PDF or DOCX format.</P>
            <H3>Report Sections</H3>
            <ul style={{ paddingLeft: "20px", color: "#cbd5e1", fontSize: "15px", lineHeight: 2 }}>
              <li>Model Overview (architecture, framework, metrics)</li>
              <li>Scope Analysis (task type, operational domain)</li>
              <li>Edge Case Analysis (severity-ranked vulnerabilities)</li>
              <li>Dataset Summary (generated + suggested datasets)</li>
              <li>Stress Test Results (before/after comparison table)</li>
              <li>Final Assessment (robustness score, deployment recommendation)</li>
            </ul>
            <H3>Download API</H3>
            <CodeBlock>{`# PDF report
GET /api/evaluations/{id}/report?fmt=pdf

# DOCX report
GET /api/evaluations/{id}/report?fmt=docx`}</CodeBlock>
          </Section>

          <Section id="api" title="API Reference">
            <P>BlindSpot.AI exposes a REST API at <code style={{ background: "#111", padding: "2px 6px", borderRadius: "4px", fontFamily: MONO, color: "#facc15" }}>http://localhost:8000</code>. Interactive docs at <code style={{ background: "#111", padding: "2px 6px", borderRadius: "4px", fontFamily: MONO, color: "#facc15" }}>/docs</code>.</P>
            <H3>Core Endpoints</H3>
            <CodeBlock>{`POST   /api/evaluations                          Create evaluation
GET    /api/evaluations                          List all evaluations
GET    /api/evaluations/{id}                     Get evaluation detail
DELETE /api/evaluations/{id}                     Delete evaluation
POST   /api/evaluations/{id}/upload-model        Upload model file
POST   /api/evaluations/{id}/run                 Start pipeline
GET    /api/evaluations/{id}/status              Poll pipeline status
GET    /api/evaluations/{id}/report?fmt=pdf      Download PDF report
GET    /api/evaluations/{id}/report?fmt=docx     Download DOCX report
GET    /api/evaluations/{id}/datasets/{did}/download  Download dataset ZIP
POST   /api/evaluations/{id}/regenerate-datasets Regenerate datasets`}</CodeBlock>
            <InfoBox type="info">Full OpenAPI schema available at <code style={{ fontFamily: MONO }}>http://localhost:8000/docs</code> (Swagger UI) and <code style={{ fontFamily: MONO }}>http://localhost:8000/redoc</code> (ReDoc).</InfoBox>
          </Section>

          <Section id="formats" title="Supported Formats">
            <H3>Model Formats</H3>
            <CodeBlock>{`.pt / .pth    PyTorch state dict or full model
.onnx         ONNX cross-framework format
.h5           TensorFlow / Keras HDF5 format
.pkl          Scikit-learn pickle (joblib or pickle)
.joblib       Scikit-learn joblib format`}</CodeBlock>
            <H3>Dataset Types</H3>
            <CodeBlock>{`image         Computer vision — object detection, classification
tabular       Structured CSV data — classification, regression
time_series   Sequential numeric data — forecasting, anomaly detection
sequential    Text / token sequences — NLP, classification
vector        Embedding vectors — similarity search, retrieval`}</CodeBlock>
            <H3>Report Formats</H3>
            <CodeBlock>{`PDF    Professional formatted report (reportlab)
DOCX   Editable Word document (python-docx)
JSON   Raw structured data (always generated)`}</CodeBlock>
          </Section>

        </main>
      </div>
    </div>
  );
}
