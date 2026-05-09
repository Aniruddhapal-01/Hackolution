import React, { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Upload, Play, AlertTriangle, CheckCircle, Cpu, FileText, Zap, Loader2, RefreshCw, Trash2 } from "lucide-react";
import Sidebar from "../components/Sidebar";
import TopNavBar from "../components/TopNavBar";
import { StatusBadge, RiskBadge, ProgressBar, PipelineSteps, Button, MetricCard, Card, ConfidenceBar, C, FONT, MONO } from "../components/ui";
import { useEvaluation, useEvaluations } from "../hooks/useProject";
import { uploadModel, runEvaluation, deleteEvaluation, ACTIVE_STATUSES } from "../api/client";

export default function EvaluationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { evaluation, loading, refetch } = useEvaluation(id!, 2500);
  const { evaluations } = useEvaluations();
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [running, setRunning]     = useState(false);
  const [dragOver, setDragOver]   = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!id) return;
    setUploading(true); setUploadPct(0);
    try { await uploadModel(id, file, p => setUploadPct(p)); await refetch(); }
    catch (e: any) { alert(e?.response?.data?.detail || "Upload failed"); }
    finally { setUploading(false); }
  };

  const handleRun = async () => {
    if (!id) return;
    setRunning(true);
    try { await runEvaluation(id); await refetch(); }
    catch (e: any) { alert(e?.response?.data?.detail || "Failed to start pipeline"); }
    finally { setRunning(false); }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm(`Delete "${evaluation?.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteEvaluation(id);
      navigate("/evaluations");
    } catch (e: any) {
      alert(e?.response?.data?.detail || "Delete failed");
      setDeleting(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Loader2 size={24} color="#facc15" style={{ animation: "spin 1s linear infinite" }} />
    </div>
  );
  if (!evaluation) return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#cbd5e1", marginBottom: "16px" }}>Evaluation not found</p>
        <Button onClick={() => navigate("/evaluations")} variant="secondary">Back to Dashboard</Button>
      </div>
    </div>
  );

  const ev = evaluation;
  const isActive = ACTIVE_STATUSES.includes(ev.status as any);
  const canRun   = !isActive && ev.status !== "ready";
  const hasModel = !!ev.model_filename;
  const vulnEntries = Object.entries(ev.vulnerability_vector || {});
  const edgeCases   = ev.edge_case_analysis || [];

  return (
    <div style={{ background: "#000", minHeight: "100vh", fontFamily: FONT }}>
      <Sidebar evaluations={evaluations} activeId={id} onNew={() => navigate("/evaluations")} />
      <TopNavBar evaluationId={id} />

      <div className="page-layout page-content">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
              <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#fff" }}>{ev.name}</h1>
              <StatusBadge status={ev.status} />
              {ev.risk_level && <RiskBadge level={ev.risk_level} />}
            </div>
            <div style={{ display: "flex", gap: "12px", fontSize: "13px", color: "#94a3b8", fontFamily: MONO }}>
              {ev.dataset_type  && <span style={{ textTransform: "capitalize" }}>{ev.dataset_type.replace("_"," ")}</span>}
              {ev.framework     && <span>{ev.framework}</span>}
              {ev.architecture  && <span>{ev.architecture}</span>}
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
            {ev.status === "ready" && (
              <Button onClick={() => navigate(`/evaluations/${id}/report`)} variant="success" size="sm">
                <FileText size={13} /> View Report
              </Button>
            )}
            <Button onClick={handleRun} variant="primary" size="sm" disabled={!canRun || running} loading={running}>
              <Play size={13} /> {isActive ? "Running..." : ev.status === "ready" ? "Re-run" : "Run Evaluation"}
            </Button>
            <Button onClick={handleDelete} variant="danger" size="sm" loading={deleting} disabled={isActive}>
              <Trash2 size={13} /> Delete
            </Button>
          </div>
        </div>

        {/* Pipeline progress */}
        {(isActive || ev.status === "ready") && (
          <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "12px", padding: "20px", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isActive ? "16px" : "0" }}>
              <PipelineSteps currentStatus={ev.status} />
              {isActive && (
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "13px", color: "#cbd5e1", fontFamily: MONO }}>{ev.current_stage}</p>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "#facc15", fontFamily: MONO }}>{ev.progress}%</p>
                </div>
              )}
            </div>
            {isActive && <ProgressBar progress={ev.progress} color="yellow" />}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px" }}>
          {/* LEFT */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Upload */}
            <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "12px", padding: "20px" }}>
              <p style={{ fontSize: "13px", color: "#facc15", textTransform: "uppercase", letterSpacing: "0.15em", fontFamily: MONO, marginBottom: "14px" }}>Model File</p>
              {hasModel ? (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", background: "#001a0a", border: "1px solid #10b981", borderRadius: "8px" }}>
                  <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0 }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.model_filename}</p>
                    <p style={{ fontSize: "13px", color: "#94a3b8", fontFamily: MONO }}>{ev.model_size_bytes ? `${(ev.model_size_bytes/1024/1024).toFixed(1)} MB` : ""}</p>
                  </div>
                  <button onClick={() => fileRef.current?.click()} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                    <RefreshCw size={13} />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragOver ? "#facc15" : "#64748b"}`, borderRadius: "10px",
                    padding: "32px 16px", textAlign: "center", cursor: "pointer",
                    background: dragOver ? "#1a1400" : "transparent", transition: "all 150ms",
                  }}
                >
                  {uploading ? (
                    <div>
                      <Loader2 size={24} color="#facc15" style={{ animation: "spin 1s linear infinite", margin: "0 auto 8px" }} />
                      <p style={{ fontSize: "13px", color: "#facc15", fontFamily: MONO }}>{uploadPct}%</p>
                    </div>
                  ) : (
                    <>
                      <Upload size={24} color="#64748b" style={{ margin: "0 auto 10px" }} />
                      <p style={{ fontSize: "13px", color: "#cbd5e1", marginBottom: "4px" }}>Drop model file here</p>
                      <p style={{ fontSize: "13px", color: "#64748b", fontFamily: MONO }}>.pt .pth .onnx .h5 .pkl .joblib</p>
                    </>
                  )}
                </div>
              )}
              <input ref={fileRef} type="file" hidden accept=".pt,.pth,.onnx,.h5,.pkl,.joblib"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>

            {/* Params */}
            <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "12px", padding: "20px" }}>
              <p style={{ fontSize: "13px", color: "#facc15", textTransform: "uppercase", letterSpacing: "0.15em", fontFamily: MONO, marginBottom: "14px" }}>Model Parameters</p>
              {[
                { label: "Architecture", value: ev.architecture },
                { label: "Framework",    value: ev.framework },
                { label: "Optimizer",    value: ev.optimizer },
                { label: "Learning Rate",value: ev.learning_rate },
                { label: "Epochs",       value: ev.epochs },
                { label: "Batch Size",   value: ev.batch_size },
                { label: "Input Size",   value: ev.input_size },
              ].filter(r => r.value != null && r.value !== "").map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #111" }}>
                  <span style={{ fontSize: "13px", color: "#94a3b8", fontFamily: MONO }}>{row.label}</span>
                  <span style={{ fontSize: "13px", color: "#e2e8f0", fontFamily: MONO }}>{String(row.value)}</span>
                </div>
              ))}
            </div>

            {/* Metrics */}
            <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "12px", padding: "20px" }}>
              <p style={{ fontSize: "13px", color: "#facc15", textTransform: "uppercase", letterSpacing: "0.15em", fontFamily: MONO, marginBottom: "14px" }}>Original Metrics</p>
              {[
                { label: "Accuracy",  value: ev.metric_accuracy  },
                { label: "Precision", value: ev.metric_precision },
                { label: "Recall",    value: ev.metric_recall    },
                { label: "F1 Score",  value: ev.metric_f1        },
                { label: "mAP",       value: ev.metric_map       },
                { label: "ROC-AUC",   value: ev.metric_roc_auc   },
              ].filter(r => r.value != null).map(row => (
                <ConfidenceBar key={row.label} label={row.label} value={Number(row.value)} />
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {ev.robustness_score != null && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <MetricCard label="Robustness Score" value={`${ev.robustness_score.toFixed(1)}%`}
                  color={ev.robustness_score >= 80 ? "green" : ev.robustness_score >= 60 ? "yellow" : "red"} />
                <MetricCard label="Deployment Ready" value={ev.deployment_ready ? "YES" : "NO"}
                  color={ev.deployment_ready ? "green" : "red"} />
                <MetricCard label="Test Samples" value={ev.total_test_samples?.toLocaleString() || "—"} color="blue" />
              </div>
            )}

            {ev.scope_summary && (
              <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "12px", padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <Cpu size={14} color="#facc15" />
                  <p style={{ fontSize: "13px", color: "#facc15", textTransform: "uppercase", letterSpacing: "0.15em", fontFamily: MONO }}>Scope Analysis</p>
                </div>
                {ev.detected_task_type && (
                  <span style={{ display: "inline-block", padding: "3px 10px", background: "#1a1400", border: "1px solid #facc15", borderRadius: "6px", fontSize: "13px", color: "#facc15", fontFamily: MONO, marginBottom: "10px" }}>
                    {ev.detected_task_type}
                  </span>
                )}
                <p style={{ fontSize: "13px", color: "#cbd5e1", lineHeight: 1.6 }}>{ev.scope_summary}</p>
              </div>
            )}

            {vulnEntries.length > 0 && (
              <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "12px", padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <AlertTriangle size={14} color="#f59e0b" />
                    <p style={{ fontSize: "13px", color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.15em", fontFamily: MONO }}>Vulnerability Map</p>
                  </div>
                  <span style={{ fontSize: "13px", color: "#94a3b8", fontFamily: MONO }}>{vulnEntries.length} stressors</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>
                  {vulnEntries.map(([key, val]) => (
                    <ConfidenceBar key={key} label={key.replace(/_/g," ")} value={Number(val)} />
                  ))}
                </div>
              </div>
            )}

            {edgeCases.length > 0 && (
              <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "12px", padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Zap size={14} color="#a855f7" />
                    <p style={{ fontSize: "13px", color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.15em", fontFamily: MONO }}>Edge Cases Detected</p>
                  </div>
                  <div style={{ display: "flex", gap: "8px", fontSize: "13px", fontFamily: MONO }}>
                    <span style={{ color: "#ef4444" }}>{edgeCases.filter((e:any) => e.severity==="critical").length} critical</span>
                    <span style={{ color: "#94a3b8" }}>·</span>
                    <span style={{ color: "#f59e0b" }}>{edgeCases.filter((e:any) => e.severity==="high").length} high</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {edgeCases.slice(0,6).map((ec:any, i:number) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px", background: "#111", borderRadius: "8px", border: "1px solid #1a1a1a" }}>
                      <span style={{ width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0, marginTop: "4px", background: ec.severity==="critical" ? "#ef4444" : ec.severity==="high" ? "#f59e0b" : "#10b981" }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "#e2e8f0" }}>{ec.name}</p>
                        <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "2px" }}>{ec.description}</p>
                      </div>
                      <span style={{ fontSize: "14px", fontFamily: MONO, textTransform: "uppercase", flexShrink: 0, color: ec.severity==="critical" ? "#ef4444" : ec.severity==="high" ? "#f59e0b" : "#10b981" }}>{ec.severity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {ev.status === "ready" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                {[
                  { label: "Stress Results", sub: "Per-stressor breakdown", color: "#f59e0b", path: `/evaluations/${id}/stress` },
                  { label: "Datasets",       sub: `${(ev.dataset_records||[]).length} sources fetched`, color: "#a855f7", path: `/evaluations/${id}/datasets` },
                  { label: "Full Report",    sub: "Download PDF/DOCX", color: "#10b981", path: `/evaluations/${id}/report` },
                ].map(item => (
                  <button key={item.label} onClick={() => navigate(item.path)} style={{
                    padding: "16px", background: "#0a0a0a", border: `1px solid ${item.color}`,
                    borderRadius: "12px", cursor: "pointer", textAlign: "left", transition: "background 150ms",
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "#111"}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "#0a0a0a"}>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>{item.label}</p>
                    <p style={{ fontSize: "13px", color: "#94a3b8" }}>{item.sub}</p>
                  </button>
                ))}
              </div>
            )}

            {!isActive && ev.status === "created" && !ev.scope_summary && (
              <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "12px", padding: "48px 20px", textAlign: "center" }}>
                <Play size={32} color="#64748b" style={{ margin: "0 auto 16px" }} />
                <p style={{ color: "#e2e8f0", fontWeight: 600, marginBottom: "8px" }}>Ready to evaluate</p>
                <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "24px" }}>
                  {hasModel ? "Click Run Evaluation to start the 4-stage pipeline." : "Upload a model file first, then run the evaluation."}
                </p>
                {hasModel && <Button onClick={handleRun} variant="primary" loading={running}><Play size={14} /> Run Evaluation</Button>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
