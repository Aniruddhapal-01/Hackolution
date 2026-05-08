import React, { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Upload, Play, AlertTriangle, CheckCircle, Cpu, FileText,
  Zap, Loader2, RefreshCw, ChevronRight, File as FileIcon
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import TopNavBar from "../components/TopNavBar";
import {
  StatusBadge, RiskBadge, ProgressBar, PipelineSteps,
  Button, MetricCard, Card, ConfidenceBar
} from "../components/ui";
import { useEvaluation, useEvaluations } from "../hooks/useProject";
import { uploadModel, runEvaluation, ACTIVE_STATUSES } from "../api/client";

// ─── Step indicator used in the setup wizard ──────────────────────────────────
function SetupStep({
  number, title, subtitle, done, active, children
}: {
  number: number; title: string; subtitle: string;
  done: boolean; active: boolean; children?: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border transition-all ${
      active ? "border-blue-500/40 bg-blue-500/[0.04]" :
      done   ? "border-emerald-500/30 bg-emerald-500/[0.03]" :
               "border-white/[0.06] bg-white/[0.02] opacity-50"
    }`}>
      <div className="flex items-center gap-4 p-5">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border flex-shrink-0 ${
          done   ? "bg-emerald-600 border-emerald-500 text-white" :
          active ? "bg-blue-600 border-blue-400 text-white" :
                   "bg-white/[0.04] border-white/10 text-slate-600"
        }`}>
          {done ? "✓" : number}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${active || done ? "text-white" : "text-slate-500"}`}>{title}</p>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        {done && !active && <ChevronRight size={14} className="text-slate-600 flex-shrink-0" />}
      </div>
      {active && children && (
        <div className="px-5 pb-5 pt-0 border-t border-white/[0.06] mt-0">
          {children}
        </div>
      )}
    </div>
  );
}

export default function EvaluationPage() {
  const { id }      = useParams<{ id: string }>();
  const navigate    = useNavigate();
  const { evaluation, loading, refetch } = useEvaluation(id!, 2500);
  const { evaluations }                  = useEvaluations();

  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [running,   setRunning]   = useState(false);
  const [dragOver,  setDragOver]  = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!id) return;
    setUploading(true); setUploadPct(0);
    try {
      await uploadModel(id, file, pct => setUploadPct(pct));
      await refetch();
    } catch (e: any) {
      alert(e?.response?.data?.detail || "Upload failed. Check file format.");
    } finally { setUploading(false); }
  };

  const handleRun = async () => {
    if (!id) return;
    setRunning(true);
    try {
      await runEvaluation(id);
      await refetch();
    } catch (e: any) {
      alert(e?.response?.data?.detail || "Failed to start pipeline.");
    } finally { setRunning(false); }
  };

  // ── Loading / not found ────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#080b10] flex items-center justify-center">
      <Loader2 size={24} className="animate-spin text-blue-500" />
    </div>
  );
  if (!evaluation) return (
    <div className="min-h-screen bg-[#080b10] flex items-center justify-center">
      <div className="text-center">
        <p className="text-slate-400 mb-4">Evaluation not found</p>
        <Button onClick={() => navigate("/evaluations")} variant="secondary">Back to Dashboard</Button>
      </div>
    </div>
  );

  const ev       = evaluation;
  const isActive = ACTIVE_STATUSES.includes(ev.status as any);
  const hasModel = !!ev.model_filename;
  const isReady  = ev.status === "ready";
  const isFailed = ev.status === "failed";

  // Wizard step states
  const step1Done = hasModel;
  const step2Done = isActive || isReady;
  const step3Done = isReady;

  // Which step is currently active
  const activeStep = isReady || isActive ? 0 :   // no wizard when running/done
                     hasModel ? 2 : 1;            // 1=upload, 2=run

  const vulnEntries = Object.entries(ev.vulnerability_vector || {});
  const edgeCases   = (ev.edge_case_analysis || []) as any[];

  return (
    <div className="min-h-screen bg-[#080b10]">
      <Sidebar evaluations={evaluations} activeId={id} onNew={() => navigate("/evaluations")} />
      <TopNavBar evaluationId={id} />

      <div className="page-layout page-content">

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white">{ev.name}</h1>
              <StatusBadge status={ev.status} />
              {ev.risk_level && <RiskBadge level={ev.risk_level} />}
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
              {ev.dataset_type && <span className="capitalize">{ev.dataset_type.replace("_"," ")}</span>}
              {ev.framework    && <><span className="text-slate-700">·</span><span>{ev.framework}</span></>}
              {ev.architecture && <><span className="text-slate-700">·</span><span>{ev.architecture}</span></>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isReady && (
              <Button onClick={() => navigate(`/evaluations/${id}/report`)} variant="success" size="sm">
                <FileText size={13} /> View Report
              </Button>
            )}
            {(isReady || isFailed) && (
              <Button onClick={handleRun} variant="secondary" size="sm" loading={running}>
                <RefreshCw size={13} /> Re-run
              </Button>
            )}
          </div>
        </div>

        {/* ── Pipeline progress bar (shown while running or done) ──────────── */}
        {(isActive || isReady) && (
          <Card className="mb-8">
            <div className="flex items-center justify-between mb-5">
              <PipelineSteps currentStatus={ev.status} />
              {isActive && (
                <div className="text-right ml-4">
                  <p className="text-xs font-mono text-slate-400">{ev.current_stage}</p>
                  <p className="text-xs font-mono text-blue-400 font-bold mt-0.5">{ev.progress}%</p>
                </div>
              )}
            </div>
            {isActive && <ProgressBar progress={ev.progress} color="blue" />}
          </Card>
        )}

        {/* ── SETUP WIZARD (shown only when status = created and not running) ── */}
        {!isActive && !isReady && !isFailed && (
          <div className="max-w-2xl mx-auto mb-10">
            <p className="text-xs font-mono text-slate-600 uppercase tracking-widest text-center mb-6">
              Complete these steps to run your evaluation
            </p>

            <div className="space-y-3">

              {/* STEP 1 — already done (metadata was filled in dashboard) */}
              <SetupStep number={1} title="Model Details & Metrics"
                subtitle="Architecture, framework, and baseline metrics"
                done={true} active={false} />

              {/* STEP 2 — Upload model file */}
              <SetupStep number={2} title="Upload Model File"
                subtitle="Drag & drop your .pt .pth .onnx .h5 .pkl or .joblib file"
                done={step1Done} active={!step1Done}>
                {/* Upload zone — shown inside step when active */}
                <div className="pt-4">
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => {
                      e.preventDefault(); setDragOver(false);
                      const f = e.dataTransfer.files[0];
                      if (f) handleFile(f);
                    }}
                    onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                      dragOver
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-white/10 hover:border-blue-500/50 hover:bg-blue-500/[0.03]"
                    }`}>
                    {uploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 size={32} className="animate-spin text-blue-400" />
                        <p className="text-sm font-mono text-blue-400">Uploading... {uploadPct}%</p>
                        <div className="w-48 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all duration-300"
                            style={{ width: `${uploadPct}%` }} />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                          <Upload size={24} className="text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white font-semibold mb-1">Drop your model file here</p>
                          <p className="text-sm text-slate-500">or click to browse</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap justify-center mt-1">
                          {[".pt", ".pth", ".onnx", ".h5", ".pkl", ".joblib"].map(ext => (
                            <span key={ext} className="px-2 py-0.5 bg-white/[0.04] border border-white/[0.08] rounded text-[10px] font-mono text-slate-500">
                              {ext}
                            </span>
                          ))}
                        </div>
                        <p className="text-[10px] font-mono text-slate-700 mt-1">Max 500 MB</p>
                      </div>
                    )}
                  </div>
                  <input ref={fileRef} type="file" hidden
                    accept=".pt,.pth,.onnx,.h5,.pkl,.joblib"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                </div>
              </SetupStep>

              {/* If model is uploaded, show it confirmed */}
              {step1Done && (
                <div className="flex items-center gap-3 px-5 py-3 bg-emerald-500/[0.04] border border-emerald-500/20 rounded-xl">
                  <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{ev.model_filename}</p>
                    <p className="text-xs font-mono text-slate-500">
                      {ev.model_size_bytes ? `${(ev.model_size_bytes / 1024 / 1024).toFixed(1)} MB · ` : ""}
                      Model file ready
                    </p>
                  </div>
                  <button onClick={() => fileRef.current?.click()}
                    className="text-slate-500 hover:text-white transition-colors flex-shrink-0 flex items-center gap-1 text-xs font-mono">
                    <RefreshCw size={12} /> Replace
                  </button>
                  <input ref={fileRef} type="file" hidden
                    accept=".pt,.pth,.onnx,.h5,.pkl,.joblib"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                </div>
              )}

              {/* STEP 3 — Run */}
              <SetupStep number={3} title="Run Evaluation Pipeline"
                subtitle="4-stage automated analysis: inspect → fetch datasets → stress test → report"
                done={step2Done} active={step1Done}>
                {step1Done && (
                  <div className="pt-4 space-y-4">
                    {/* Pipeline preview */}
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: "Model Analysis",   color: "blue",   desc: "Detect task type & vulnerabilities" },
                        { label: "Dataset Fetch",    color: "violet", desc: "Kaggle · HuggingFace · Roboflow"    },
                        { label: "Stress Testing",   color: "amber",  desc: "Per-stressor degradation metrics"   },
                        { label: "Report",           color: "emerald",desc: "Robustness score + CSV download"    },
                      ].map((s, i) => (
                        <div key={i} className={`p-3 rounded-lg bg-${s.color}-500/[0.05] border border-${s.color}-500/20 text-center`}>
                          <p className={`text-[10px] font-mono font-bold text-${s.color}-400 mb-1`}>{i + 1}</p>
                          <p className="text-xs font-semibold text-white mb-1">{s.label}</p>
                          <p className="text-[9px] text-slate-500 leading-tight">{s.desc}</p>
                        </div>
                      ))}
                    </div>
                    <Button onClick={handleRun} variant="primary" size="lg"
                      loading={running} className="w-full justify-center">
                      <Play size={15} /> Run Full Evaluation
                    </Button>
                  </div>
                )}
              </SetupStep>

            </div>
          </div>
        )}

        {/* ── RESULTS (shown after pipeline completes) ─────────────────────── */}
        {(isReady || isActive) && (
          <div className="grid grid-cols-3 gap-6">

            {/* LEFT: model info summary */}
            <div className="col-span-1 space-y-5">

              {/* Uploaded model */}
              <Card>
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-3">Model File</p>
                <div className="flex items-center gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                  <FileIcon size={16} className="text-emerald-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{ev.model_filename}</p>
                    <p className="text-xs font-mono text-slate-500">
                      {ev.model_size_bytes ? `${(ev.model_size_bytes / 1024 / 1024).toFixed(1)} MB` : ""}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Params */}
              <Card>
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-3">Parameters</p>
                <div className="space-y-2">
                  {[
                    { label: "Architecture", value: ev.architecture },
                    { label: "Framework",    value: ev.framework    },
                    { label: "Optimizer",    value: ev.optimizer    },
                    { label: "Learning Rate",value: ev.learning_rate },
                    { label: "Epochs",       value: ev.epochs       },
                    { label: "Batch Size",   value: ev.batch_size   },
                    { label: "Input Size",   value: ev.input_size   },
                  ].filter(r => r.value !== undefined && r.value !== null && r.value !== "")
                   .map(row => (
                    <div key={row.label} className="flex justify-between py-1.5 border-b border-white/[0.04]">
                      <span className="text-xs font-mono text-slate-500">{row.label}</span>
                      <span className="text-xs font-mono text-slate-300">{String(row.value)}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Original metrics */}
              <Card>
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-3">Original Metrics</p>
                <div className="space-y-2">
                  {[
                    { label: "Accuracy",  value: ev.metric_accuracy  },
                    { label: "Precision", value: ev.metric_precision },
                    { label: "Recall",    value: ev.metric_recall    },
                    { label: "F1 Score",  value: ev.metric_f1        },
                    { label: "mAP",       value: ev.metric_map       },
                    { label: "ROC-AUC",   value: ev.metric_roc_auc   },
                  ].filter(r => r.value !== undefined && r.value !== null)
                   .map(row => (
                    <ConfidenceBar key={row.label} label={row.label} value={Number(row.value)} />
                  ))}
                </div>
              </Card>
            </div>

            {/* RIGHT: analysis results */}
            <div className="col-span-2 space-y-5">

              {/* Robustness summary */}
              {ev.robustness_score !== undefined && ev.robustness_score !== null && (
                <div className="grid grid-cols-3 gap-4">
                  <MetricCard label="Robustness Score"
                    value={`${ev.robustness_score.toFixed(1)}%`}
                    color={ev.robustness_score >= 80 ? "emerald" : ev.robustness_score >= 60 ? "amber" : "red"} />
                  <MetricCard label="Deployment Ready"
                    value={ev.deployment_ready ? "YES" : "NO"}
                    color={ev.deployment_ready ? "emerald" : "red"} />
                  <MetricCard label="Test Samples"
                    value={ev.total_test_samples?.toLocaleString() || "—"} color="blue" />
                </div>
              )}

              {/* Scope */}
              {ev.scope_summary && (
                <Card>
                  <div className="flex items-center gap-2 mb-3">
                    <Cpu size={14} className="text-blue-400" />
                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Scope Analysis</p>
                  </div>
                  {ev.detected_task_type && (
                    <span className="inline-block px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-xs font-mono text-blue-400 mb-3">
                      {ev.detected_task_type}
                    </span>
                  )}
                  <p className="text-sm text-slate-400 leading-relaxed">{ev.scope_summary}</p>
                </Card>
              )}

              {/* Vulnerability map */}
              {vulnEntries.length > 0 && (
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={14} className="text-amber-400" />
                      <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Vulnerability Map</p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-600">{vulnEntries.length} stressors identified</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                    {vulnEntries.map(([key, val]) => (
                      <ConfidenceBar key={key} label={key.replace(/_/g," ")} value={Number(val)} />
                    ))}
                  </div>
                </Card>
              )}

              {/* Edge cases */}
              {edgeCases.length > 0 && (
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Zap size={14} className="text-violet-400" />
                      <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Edge Cases Detected</p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono">
                      <span className="text-red-400">{edgeCases.filter((e:any) => e.severity==="critical").length} critical</span>
                      <span className="text-slate-700">·</span>
                      <span className="text-amber-400">{edgeCases.filter((e:any) => e.severity==="high").length} high</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {edgeCases.slice(0, 6).map((ec: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                        <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                          ec.severity === "critical" ? "bg-red-500" :
                          ec.severity === "high"     ? "bg-amber-500" : "bg-emerald-500"
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-300">{ec.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{ec.description}</p>
                        </div>
                        <span className={`text-[9px] font-mono uppercase flex-shrink-0 ${
                          ec.severity === "critical" ? "text-red-400" :
                          ec.severity === "high"     ? "text-amber-400" : "text-emerald-400"
                        }`}>{ec.severity}</span>
                      </div>
                    ))}
                    {edgeCases.length > 6 && (
                      <p className="text-[10px] font-mono text-slate-600 text-center pt-1">
                        +{edgeCases.length - 6} more in report
                      </p>
                    )}
                  </div>
                </Card>
              )}

              {/* Navigation cards when ready */}
              {isReady && (
                <div className="grid grid-cols-3 gap-4">
                  <button onClick={() => navigate(`/evaluations/${id}/stress`)}
                    className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl hover:bg-amber-500/10 transition-all text-left">
                    <Zap size={18} className="text-amber-400 mb-2" />
                    <p className="text-sm font-semibold text-white">Stress Results</p>
                    <p className="text-xs text-slate-500 mt-1">Per-stressor breakdown</p>
                  </button>
                  <button onClick={() => navigate(`/evaluations/${id}/datasets`)}
                    className="p-4 bg-violet-500/5 border border-violet-500/20 rounded-xl hover:bg-violet-500/10 transition-all text-left">
                    <Cpu size={18} className="text-violet-400 mb-2" />
                    <p className="text-sm font-semibold text-white">Datasets</p>
                    <p className="text-xs text-slate-500 mt-1">{(ev.dataset_records || []).length} sources fetched</p>
                  </button>
                  <button onClick={() => navigate(`/evaluations/${id}/report`)}
                    className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/10 transition-all text-left">
                    <FileText size={18} className="text-emerald-400 mb-2" />
                    <p className="text-sm font-semibold text-white">Full Report</p>
                    <p className="text-xs text-slate-500 mt-1">Download CSV</p>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Error state ──────────────────────────────────────────────────── */}
        {isFailed && (
          <Card className="border-red-500/20 bg-red-500/[0.03] mt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-400 mb-1">Pipeline Failed</p>
                <p className="text-sm text-slate-400">{ev.error_message || "An unexpected error occurred."}</p>
                <Button onClick={handleRun} variant="danger" size="sm" className="mt-3" loading={running}>
                  <RefreshCw size={13} /> Retry
                </Button>
              </div>
            </div>
          </Card>
        )}

      </div>
    </div>
  );
}
