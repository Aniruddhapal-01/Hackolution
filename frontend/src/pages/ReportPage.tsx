import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FileText, Download, CheckCircle, XCircle, AlertTriangle, ArrowLeft, Loader2, Shield } from "lucide-react";
import Sidebar from "../components/Sidebar";
import TopNavBar from "../components/TopNavBar";
import { StatusBadge, RiskBadge, MetricCard, Button, ConfidenceBar, C, FONT, MONO } from "../components/ui";
import { useEvaluation, useEvaluations } from "../hooks/useProject";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";



export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { evaluation, loading } = useEvaluation(id!, 5000);
  const { evaluations } = useEvaluations();

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Loader2 size={24} color="#facc15" style={{ animation: "spin 1s linear infinite" }} />
    </div>
  );
  if (!evaluation) return null;

  const ev = evaluation;
  const results  = ev.stress_test_results || [];
  const datasets = ev.dataset_records     || [];
  const edges    = ev.edge_case_analysis  || [];
  const weakness = ev.weakness_report;
  const score    = ev.robustness_score || 0;
  const scoreColor = score >= 80 ? "#10b981" : score >= 60 ? "#facc15" : "#ef4444";

  const radarData = results.slice(0,7).map(r => ({
    subject: (r.stressor_label || r.stressor_key).replace(/_/g," ").slice(0,12),
    score:   Math.round((r.stressed_score||0)*100),
  }));

  return (
    <div style={{ background: "#000", minHeight: "100vh", fontFamily: FONT }}>
      <Sidebar evaluations={evaluations} activeId={id} onNew={() => navigate("/evaluations")} />
      <TopNavBar evaluationId={id} />

      <div className="page-layout page-content">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={() => navigate(`/evaluations/${id}`)} style={{ background: "none", border: "none", cursor: "pointer", color: "#cbd5e1", padding: "4px" }}>
              <ArrowLeft size={16} />
            </button>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#fff" }}>Evaluation Report</h1>
                <StatusBadge status={ev.status} />
              </div>
              <p style={{ fontSize: "14px", color: "#94a3b8", marginTop: "2px" }}>{ev.name}</p>
            </div>
          </div>
          {ev.status === "ready" && (
            <div style={{ display: "flex", gap: "10px" }}>
              <a href={`http://localhost:8000/api/evaluations/${id}/report?fmt=pdf`} download>
                <Button variant="primary" size="sm"><Download size={13} /> Download PDF</Button>
              </a>
              <a href={`http://localhost:8000/api/evaluations/${id}/report?fmt=docx`} download>
                <Button variant="secondary" size="sm"><Download size={13} /> Download DOCX</Button>
              </a>
            </div>
          )}
        </div>

        {ev.status !== "ready" ? (
          <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "12px", padding: "64px 20px", textAlign: "center" }}>
            <FileText size={32} color="#64748b" style={{ margin: "0 auto 16px" }} />
            <p style={{ color: "#cbd5e1", marginBottom: "16px" }}>Report will be available after evaluation completes.</p>
            <Button onClick={() => navigate(`/evaluations/${id}`)} variant="secondary">Go to Evaluation</Button>
          </div>
        ) : (
          <>
            {/* Score Banner */}
            <div style={{ background: "#0a0a0a", border: `2px solid ${scoreColor}`, borderRadius: "12px", padding: "24px", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "56px", height: "56px", borderRadius: "12px", background: "#111", border: `2px solid ${scoreColor}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Shield size={24} color={scoreColor} />
                </div>
                <div>
                  <p style={{ fontSize: "13px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.15em", fontFamily: MONO, marginBottom: "4px" }}>Final Assessment</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "36px", fontWeight: 700, color: scoreColor, fontFamily: MONO, lineHeight: 1 }}>{score.toFixed(1)}%</span>
                    <span style={{ fontSize: "14px", color: "#cbd5e1" }}>Robustness Score</span>
                    {ev.risk_level && <RiskBadge level={ev.risk_level} />}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "13px", color: "#94a3b8", fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>Deployment Ready</p>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end", color: ev.deployment_ready ? "#10b981" : "#ef4444" }}>
                  {ev.deployment_ready ? <CheckCircle size={18} /> : <XCircle size={18} />}
                  <span style={{ fontWeight: 700, fontSize: "18px" }}>{ev.deployment_ready ? "YES" : "NO"}</span>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "16px" }}>
              {/* Left */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {/* Model overview */}
                <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "12px", padding: "18px" }}>
                  <p style={{ fontSize: "13px", color: "#facc15", textTransform: "uppercase", letterSpacing: "0.15em", fontFamily: MONO, marginBottom: "12px" }}>Model Overview</p>
                  {[
                    { label: "Name",         value: ev.name },
                    { label: "Architecture", value: ev.architecture },
                    { label: "Framework",    value: ev.framework },
                    { label: "Dataset Type", value: ev.dataset_type?.replace("_"," ") },
                    { label: "Task Type",    value: ev.detected_task_type },
                    { label: "Model File",   value: ev.model_filename },
                  ].filter(r => r.value).map(row => (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #111" }}>
                      <span style={{ fontSize: "13px", color: "#94a3b8", fontFamily: MONO }}>{row.label}</span>
                      <span style={{ fontSize: "13px", color: "#e2e8f0", fontFamily: MONO, textAlign: "right", maxWidth: "55%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* Metrics */}
                <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "12px", padding: "18px" }}>
                  <p style={{ fontSize: "13px", color: "#facc15", textTransform: "uppercase", letterSpacing: "0.15em", fontFamily: MONO, marginBottom: "12px" }}>Original Metrics</p>
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

                {/* Weaknesses */}
                {weakness?.weaknesses && (
                  <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "12px", padding: "18px" }}>
                    <p style={{ fontSize: "13px", color: "#facc15", textTransform: "uppercase", letterSpacing: "0.15em", fontFamily: MONO, marginBottom: "12px" }}>Weaknesses</p>
                    {weakness.weaknesses.map((w: string, i: number) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "8px" }}>
                        <AlertTriangle size={11} color="#f59e0b" style={{ flexShrink: 0, marginTop: "2px" }} />
                        <span style={{ fontSize: "13px", color: "#cbd5e1" }}>{w}</span>
                      </div>
                    ))}
                    {weakness.risk_factors?.length > 0 && (
                      <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #111" }}>
                        <p style={{ fontSize: "14px", color: "#64748b", fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Risk Factors</p>
                        {weakness.risk_factors.map((rf: string, i: number) => (
                          <p key={i} style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "4px" }}>• {rf}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {/* Radar */}
                {radarData.length > 0 && (
                  <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "12px", padding: "18px" }}>
                    <p style={{ fontSize: "13px", color: "#facc15", textTransform: "uppercase", letterSpacing: "0.15em", fontFamily: MONO, marginBottom: "12px" }}>Robustness Radar</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#1a1a1a" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: MONO }} />
                        <Radar name="Stressed Score" dataKey="score" stroke="#facc15" fill="#facc15" fillOpacity={0.15} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Stress summary */}
                {results.length > 0 && (
                  <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "12px", padding: "18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                      <p style={{ fontSize: "13px", color: "#facc15", textTransform: "uppercase", letterSpacing: "0.15em", fontFamily: MONO }}>Stress Test Summary</p>
                      <div style={{ display: "flex", gap: "12px", fontSize: "13px", fontFamily: MONO }}>
                        <span style={{ color: "#10b981" }}>{results.filter(r=>r.passed).length} passed</span>
                        <span style={{ color: "#ef4444" }}>{results.filter(r=>!r.passed).length} failed</span>
                      </div>
                    </div>
                    {results.map(r => (
                      <div key={r.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: "1px solid #111" }}>
                        {r.passed ? <CheckCircle size={12} color="#10b981" style={{ flexShrink: 0 }} /> : <XCircle size={12} color="#ef4444" style={{ flexShrink: 0 }} />}
                        <span style={{ fontSize: "14px", color: "#e2e8f0", flex: 1 }}>{r.stressor_label || r.stressor_key}</span>
                        <span style={{ fontSize: "13px", color: "#3b82f6", fontFamily: MONO }}>{Math.round((r.original_score||0)*100)}%</span>
                        <span style={{ fontSize: "13px", color: "#94a3b8", fontFamily: MONO }}>→</span>
                        <span style={{ fontSize: "13px", fontFamily: MONO, color: r.passed ? "#10b981" : "#ef4444" }}>{Math.round((r.stressed_score||0)*100)}%</span>
                        <span style={{ fontSize: "13px", color: "#f59e0b", fontFamily: MONO, width: "48px", textAlign: "right" }}>-{(r.degradation_pct||0).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Edge cases */}
                {edges.length > 0 && (
                  <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "12px", padding: "18px" }}>
                    <p style={{ fontSize: "13px", color: "#facc15", textTransform: "uppercase", letterSpacing: "0.15em", fontFamily: MONO, marginBottom: "12px" }}>Edge Case Analysis</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      {edges.map((ec: any, i: number) => (
                        <div key={i} style={{
                          padding: "10px", borderRadius: "8px",
                          background: ec.severity==="critical" ? "#1a0000" : ec.severity==="high" ? "#1a0a00" : "#0a0a0a",
                          border: `1px solid ${ec.severity==="critical" ? "#ef4444" : ec.severity==="high" ? "#f59e0b" : "#1a1a1a"}`,
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                            <span style={{ fontSize: "13px", fontWeight: 600, color: "#e2e8f0" }}>{ec.name}</span>
                            <span style={{ fontSize: "14px", fontFamily: MONO, textTransform: "uppercase", color: ec.severity==="critical" ? "#ef4444" : ec.severity==="high" ? "#f59e0b" : "#10b981" }}>{ec.severity}</span>
                          </div>
                          <p style={{ fontSize: "13px", color: "#94a3b8", lineHeight: 1.5 }}>{ec.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Datasets */}
                {datasets.length > 0 && (
                  <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "12px", padding: "18px" }}>
                    <p style={{ fontSize: "13px", color: "#facc15", textTransform: "uppercase", letterSpacing: "0.15em", fontFamily: MONO, marginBottom: "12px" }}>
                      Datasets Used ({datasets.length})
                    </p>
                    {datasets.map(ds => {
                      const srcColor: Record<string,string> = { kaggle:"#3b82f6", huggingface:"#f59e0b", roboflow:"#a855f7", synthetic:"#10b981" };
                      const c = srcColor[ds.source] || "#cbd5e1";
                      return (
                        <div key={ds.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "7px 0", borderBottom: "1px solid #111" }}>
                          <span style={{ padding: "2px 8px", borderRadius: "4px", background: "#111", border: `1px solid ${c}`, fontSize: "14px", fontFamily: MONO, color: c, flexShrink: 0 }}>{ds.source}</span>
                          <span style={{ fontSize: "14px", color: "#e2e8f0", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ds.dataset_name}</span>
                          <span style={{ fontSize: "13px", color: "#94a3b8", fontFamily: MONO, flexShrink: 0 }}>{ds.sample_count?.toLocaleString()} samples</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
