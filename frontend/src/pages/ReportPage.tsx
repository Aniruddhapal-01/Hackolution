import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FileText, Download, CheckCircle, XCircle, AlertTriangle, ArrowLeft, Loader2, Shield } from "lucide-react";
import Sidebar from "../components/Sidebar";
import TopNavBar from "../components/TopNavBar";
import { StatusBadge, RiskBadge, MetricCard, Card, Button, ConfidenceBar } from "../components/ui";
import { useEvaluation, useEvaluations } from "../hooks/useProject";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { evaluation, loading } = useEvaluation(id!, 5000);
  const { evaluations } = useEvaluations();

  if (loading) return (
    <div className="min-h-screen bg-[#080b10] flex items-center justify-center">
      <Loader2 size={24} className="animate-spin text-blue-500" />
    </div>
  );
  if (!evaluation) return null;

  const ev = evaluation;
  const results  = ev.stress_test_results || [];
  const datasets = ev.dataset_records     || [];
  const edges    = ev.edge_case_analysis  || [];
  const weakness = ev.weakness_report;

  const radarData = results.slice(0, 7).map(r => ({
    subject: (r.stressor_label || r.stressor_key).replace(/_/g," ").slice(0,12),
    score:   Math.round((r.stressed_score || 0) * 100),
  }));

  const score = ev.robustness_score || 0;
  const scoreColor = score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-red-400";
  const scoreBg    = score >= 80 ? "bg-emerald-500/10 border-emerald-500/30" : score >= 60 ? "bg-amber-500/10 border-amber-500/30" : "bg-red-500/10 border-red-500/30";

  return (
    <div className="min-h-screen bg-[#080b10]">
      <Sidebar evaluations={evaluations} activeId={id} onNew={() => navigate("/evaluations")} />
      <TopNavBar evaluationId={id} />

      <div className="page-layout page-content">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <button onClick={() => navigate(`/evaluations/${id}`)} className="text-slate-500 hover:text-white transition-colors">
                <ArrowLeft size={16} />
              </button>
              <h1 className="text-2xl font-bold text-white">Evaluation Report</h1>
              <StatusBadge status={ev.status} />
            </div>
            <p className="text-sm text-slate-500 ml-6">{ev.name}</p>
          </div>
          {ev.status === "ready" && (
            <div className="flex items-center gap-3">
              <a href={`http://localhost:8000/api/evaluations/${id}/report?fmt=pdf`} download>
                <Button variant="primary" size="sm">
                  <Download size={13} /> Download PDF
                </Button>
              </a>
              <a href={`http://localhost:8000/api/evaluations/${id}/report?fmt=docx`} download>
                <Button variant="secondary" size="sm">
                  <Download size={13} /> Download DOCX
                </Button>
              </a>
            </div>
          )}
        </div>

        {ev.status !== "ready" ? (
          <Card className="text-center py-16">
            <FileText size={32} className="text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400">Report will be available after evaluation completes.</p>
            <Button onClick={() => navigate(`/evaluations/${id}`)} variant="secondary" className="mt-4">
              Go to Evaluation
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Final Assessment Banner */}
            <div className={`rounded-2xl border p-6 ${scoreBg}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center ${scoreBg}`}>
                    <Shield size={28} className={scoreColor} />
                  </div>
                  <div>
                    <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-1">Final Assessment</p>
                    <div className="flex items-center gap-3">
                      <span className={`text-4xl font-bold font-mono ${scoreColor}`}>{score.toFixed(1)}%</span>
                      <span className="text-slate-400 text-sm">Robustness Score</span>
                      {ev.risk_level && <RiskBadge level={ev.risk_level} />}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono text-slate-500 mb-1">Deployment Ready</p>
                  <div className={`flex items-center gap-2 justify-end ${ev.deployment_ready ? "text-emerald-400" : "text-red-400"}`}>
                    {ev.deployment_ready ? <CheckCircle size={18} /> : <XCircle size={18} />}
                    <span className="font-bold text-lg">{ev.deployment_ready ? "YES" : "NO"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {/* Left column */}
              <div className="col-span-1 space-y-5">
                {/* Model overview */}
                <Card>
                  <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">Model Overview</p>
                  <div className="space-y-2.5">
                    {[
                      { label: "Name",         value: ev.name },
                      { label: "Architecture", value: ev.architecture },
                      { label: "Framework",    value: ev.framework },
                      { label: "Dataset Type", value: ev.dataset_type?.replace("_"," ") },
                      { label: "Task Type",    value: ev.detected_task_type },
                      { label: "Model File",   value: ev.model_filename },
                    ].filter(r => r.value).map(row => (
                      <div key={row.label} className="flex justify-between py-1.5 border-b border-white/[0.04]">
                        <span className="text-xs font-mono text-slate-500">{row.label}</span>
                        <span className="text-xs font-mono text-slate-300 text-right max-w-[60%] truncate">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Original metrics */}
                <Card>
                  <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">Original Metrics</p>
                  <div className="space-y-2">
                    {[
                      { label: "Accuracy",  value: ev.metric_accuracy  },
                      { label: "Precision", value: ev.metric_precision },
                      { label: "Recall",    value: ev.metric_recall    },
                      { label: "F1 Score",  value: ev.metric_f1        },
                      { label: "mAP",       value: ev.metric_map       },
                      { label: "ROC-AUC",   value: ev.metric_roc_auc   },
                    ].filter(r => r.value !== undefined && r.value !== null).map(row => (
                      <ConfidenceBar key={row.label} label={row.label} value={Number(row.value)} />
                    ))}
                  </div>
                </Card>

                {/* Weaknesses */}
                {weakness?.weaknesses && (
                  <Card>
                    <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">Identified Weaknesses</p>
                    <div className="space-y-2">
                      {weakness.weaknesses.map((w: string, i: number) => (
                        <div key={i} className="flex items-start gap-2">
                          <AlertTriangle size={12} className="text-amber-400 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-slate-400">{w}</span>
                        </div>
                      ))}
                    </div>
                    {weakness.risk_factors?.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/[0.06]">
                        <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-2">Risk Factors</p>
                        {weakness.risk_factors.map((rf: string, i: number) => (
                          <p key={i} className="text-xs text-slate-500 mb-1.5">• {rf}</p>
                        ))}
                      </div>
                    )}
                  </Card>
                )}
              </div>

              {/* Right column */}
              <div className="col-span-2 space-y-5">
                {/* Radar chart */}
                {radarData.length > 0 && (
                  <Card>
                    <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">Robustness Radar</p>
                    <ResponsiveContainer width="100%" height={240}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="rgba(255,255,255,0.06)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 10 }} />
                        <Radar name="Stressed Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </Card>
                )}

                {/* Stress results summary */}
                {results.length > 0 && (
                  <Card>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Stress Test Summary</p>
                      <div className="flex items-center gap-3 text-xs font-mono">
                        <span className="text-emerald-400">{results.filter(r=>r.passed).length} passed</span>
                        <span className="text-red-400">{results.filter(r=>!r.passed).length} failed</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {results.map(r => (
                        <div key={r.id} className="flex items-center gap-3 py-2 border-b border-white/[0.04]">
                          {r.passed ? <CheckCircle size={13} className="text-emerald-400 flex-shrink-0" /> : <XCircle size={13} className="text-red-400 flex-shrink-0" />}
                          <span className="text-sm text-slate-300 flex-1">{r.stressor_label || r.stressor_key}</span>
                          <span className="text-xs font-mono text-blue-400">{Math.round((r.original_score||0)*100)}%</span>
                          <span className="text-xs font-mono text-slate-600">→</span>
                          <span className={`text-xs font-mono ${r.passed ? "text-emerald-400" : "text-red-400"}`}>{Math.round((r.stressed_score||0)*100)}%</span>
                          <span className="text-xs font-mono text-amber-400 w-14 text-right">-{r.degradation_pct?.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Edge cases */}
                {edges.length > 0 && (
                  <Card>
                    <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">Edge Case Analysis</p>
                    <div className="grid grid-cols-2 gap-3">
                      {edges.map((ec: any, i: number) => (
                        <div key={i} className={`p-3 rounded-lg border ${
                          ec.severity === "critical" ? "bg-red-500/[0.04] border-red-500/20" :
                          ec.severity === "high"     ? "bg-amber-500/[0.04] border-amber-500/20" :
                          "bg-white/[0.02] border-white/[0.06]"
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-slate-300">{ec.name}</span>
                            <span className={`text-[9px] font-mono uppercase ${
                              ec.severity === "critical" ? "text-red-400" :
                              ec.severity === "high"     ? "text-amber-400" : "text-emerald-400"
                            }`}>{ec.severity}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-relaxed">{ec.description}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Datasets */}
                {datasets.length > 0 && (
                  <Card>
                    <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">
                      Datasets Used ({datasets.length})
                    </p>
                    <div className="space-y-2">
                      {datasets.map(ds => (
                        <div key={ds.id} className="flex items-center gap-3 py-2 border-b border-white/[0.04]">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${
                            ds.source === "kaggle"      ? "text-blue-400 bg-blue-500/10 border-blue-500/20" :
                            ds.source === "huggingface" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
                            ds.source === "roboflow"    ? "text-violet-400 bg-violet-500/10 border-violet-500/20" :
                            "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                          }`}>{ds.source}</span>
                          <span className="text-sm text-slate-300 flex-1 truncate">{ds.dataset_name}</span>
                          <span className="text-xs font-mono text-slate-600">{ds.sample_count?.toLocaleString()} samples</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
