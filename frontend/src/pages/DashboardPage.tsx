import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Cpu, ArrowRight, CheckCircle, AlertTriangle, Loader2, X } from "lucide-react";
import Sidebar from "../components/Sidebar";
import TopNavBar from "../components/TopNavBar";
import { StatusBadge, RiskBadge, Button, Input, Select, MetricCard, C, FONT, MONO } from "../components/ui";
import { useEvaluations } from "../hooks/useProject";
import { createEvaluation, deleteEvaluation, ACTIVE_STATUSES } from "../api/client";

const DATASET_TYPES = [
  { value: "image",       label: "Image Dataset" },
  { value: "tabular",     label: "Categorical / Tabular Data" },
  { value: "sequential",  label: "Sequential Data" },
  { value: "time_series", label: "Time-Series Data" },
  { value: "vector",      label: "Vector / Embedding Dataset" },
];

const IMAGE_DOMAINS = [
  { value: "",           label: "Auto-detect (recommended)" },
  { value: "general",    label: "General Computer Vision" },
  { value: "autonomous", label: "Autonomous Driving / Vehicles" },
  { value: "drone",      label: "Drone / UAV Detection" },
  { value: "medical",    label: "Medical Imaging (X-ray, MRI, CT)" },
  { value: "satellite",  label: "Satellite / Remote Sensing" },
];
const FRAMEWORKS = [
  { value: "pytorch",    label: "PyTorch" },
  { value: "tensorflow", label: "TensorFlow / Keras" },
  { value: "sklearn",    label: "Scikit-learn" },
  { value: "onnx",       label: "ONNX" },
  { value: "jax",        label: "JAX" },
  { value: "other",      label: "Other" },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { evaluations, loading, refetch } = useEvaluations(6000);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating]   = useState(false);
  const [form, setForm] = useState<any>({
    name:"", description:"", dataset_type:"", framework:"",
    architecture:"", optimizer:"", learning_rate:"", epochs:"", batch_size:"", input_size:"",
    image_domain_override:"",
    metric_accuracy:"", metric_precision:"", metric_recall:"",
    metric_f1:"", metric_map:"", metric_roc_auc:"",
  });
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const ev = await createEvaluation({
        ...form,
        image_domain_override: form.image_domain_override || undefined,
        learning_rate: form.learning_rate ? Number(form.learning_rate) : undefined,
        epochs:        form.epochs        ? Number(form.epochs)        : undefined,
        batch_size:    form.batch_size    ? Number(form.batch_size)    : undefined,
        metric_accuracy:  form.metric_accuracy  ? Number(form.metric_accuracy)  : undefined,
        metric_precision: form.metric_precision ? Number(form.metric_precision) : undefined,
        metric_recall:    form.metric_recall    ? Number(form.metric_recall)    : undefined,
        metric_f1:        form.metric_f1        ? Number(form.metric_f1)        : undefined,
        metric_map:       form.metric_map       ? Number(form.metric_map)       : undefined,
        metric_roc_auc:   form.metric_roc_auc   ? Number(form.metric_roc_auc)   : undefined,
      });
      setShowModal(false);
      navigate(`/evaluations/${ev.id}`);
    } catch { alert("Failed to create evaluation."); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this evaluation?")) return;
    await deleteEvaluation(id);
    refetch();
  };

  const stats = {
    total:    evaluations.length,
    active:   evaluations.filter(e => ACTIVE_STATUSES.includes(e.status as any)).length,
    ready:    evaluations.filter(e => e.status === "ready").length,
    critical: evaluations.filter(e => e.risk_level === "critical").length,
  };

  return (
    <div style={{ background: "#000", minHeight: "100vh", fontFamily: FONT }}>
      <Sidebar evaluations={evaluations} onNew={() => setShowModal(true)} onDelete={handleDelete} />
      <TopNavBar />

      <div className="page-layout page-content">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>Evaluation Dashboard</h1>
            <p style={{ fontSize: "13px", color: "#cbd5e1" }}>Model robustness evaluations</p>
          </div>
          <Button onClick={() => setShowModal(true)} variant="primary">
            <Plus size={14} /> New Evaluation
          </Button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
          <MetricCard label="Total Evaluations" value={stats.total}    color="yellow"  />
          <MetricCard label="Running"            value={stats.active}  color="blue"    sub={stats.active > 0 ? "In progress" : "None active"} />
          <MetricCard label="Completed"          value={stats.ready}   color="green"   />
          <MetricCard label="Critical Risk"      value={stats.critical} color="red"    sub={stats.critical > 0 ? "Needs attention" : "All clear"} />
        </div>

        {/* List */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "80px" }}>
            <Loader2 size={24} style={{ color: "#facc15", animation: "spin 1s linear infinite" }} />
          </div>
        ) : evaluations.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ width: "64px", height: "64px", background: "#111", border: "2px solid #facc15", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Cpu size={28} color="#facc15" />
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#fff", marginBottom: "8px" }}>No evaluations yet</h3>
            <p style={{ fontSize: "13px", color: "#cbd5e1", marginBottom: "24px" }}>Upload your first AI model to start a robustness evaluation.</p>
            <Button onClick={() => setShowModal(true)} variant="primary"><Plus size={14} /> Create First Evaluation</Button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {evaluations.map(ev => {
              const isActive = ACTIVE_STATUSES.includes(ev.status as any);
              return (
                <div
                  key={ev.id}
                  onClick={() => navigate(`/evaluations/${ev.id}`)}
                  style={{
                    background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "12px",
                    padding: "16px 20px", cursor: "pointer", display: "flex",
                    alignItems: "center", gap: "16px", transition: "border-color 150ms",
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = "#facc15"}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = "#1a1a1a"}
                >
                  {/* Icon */}
                  <div style={{
                    width: "40px", height: "40px", borderRadius: "10px", flexShrink: 0,
                    background: ev.status === "ready" ? "#001a0a" : isActive ? "#1a1400" : "#111",
                    border: `1px solid ${ev.status === "ready" ? "#10b981" : isActive ? "#facc15" : "#64748b"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {isActive ? <Loader2 size={16} color="#facc15" style={{ animation: "spin 1s linear infinite" }} /> :
                     ev.status === "ready" ? <CheckCircle size={16} color="#10b981" /> :
                     ev.status === "failed" ? <AlertTriangle size={16} color="#ef4444" /> :
                     <Cpu size={16} color="#94a3b8" />}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, color: "#fff", fontSize: "14px" }}>{ev.name}</span>
                      <StatusBadge status={ev.status} />
                      {ev.risk_level && <RiskBadge level={ev.risk_level} />}
                    </div>
                    <div style={{ display: "flex", gap: "12px", fontSize: "13px", color: "#94a3b8", fontFamily: MONO, flexWrap: "wrap" }}>
                      {ev.dataset_type && <span style={{ textTransform: "capitalize" }}>{ev.dataset_type.replace("_"," ")}</span>}
                      {ev.framework    && <span>{ev.framework}</span>}
                      {ev.architecture && <span>{ev.architecture}</span>}
                      {ev.current_stage && isActive && <span style={{ color: "#facc15" }}>{ev.current_stage}</span>}
                    </div>
                  </div>

                  {/* Right */}
                  <div style={{ display: "flex", alignItems: "center", gap: "20px", flexShrink: 0 }}>
                    {ev.robustness_score != null && (
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: "14px", color: "#94a3b8", fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.1em" }}>Robustness</p>
                        <p style={{ fontSize: "20px", fontWeight: 700, fontFamily: MONO, color: ev.robustness_score >= 80 ? "#10b981" : ev.robustness_score >= 60 ? "#f59e0b" : "#ef4444" }}>
                          {ev.robustness_score.toFixed(1)}%
                        </p>
                      </div>
                    )}
                    {isActive && (
                      <div style={{ width: "80px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontFamily: MONO, color: "#94a3b8", marginBottom: "4px" }}>
                          <span>Progress</span><span>{ev.progress}%</span>
                        </div>
                        <div style={{ height: "3px", background: "#1a1a1a", borderRadius: "9999px", overflow: "hidden" }}>
                          <div style={{ height: "100%", background: "#facc15", width: `${ev.progress}%`, transition: "width 500ms" }} />
                        </div>
                      </div>
                    )}
                    <ArrowRight size={16} color="#64748b" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#0a0a0a", border: "2px solid #facc15", borderRadius: "16px", width: "100%", maxWidth: "640px", maxHeight: "90vh", overflowY: "auto" }}>
            {/* Modal header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #1a1a1a" }}>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#fff" }}>New Evaluation</h2>
                <p style={{ fontSize: "14px", color: "#cbd5e1", marginTop: "2px" }}>Fill in model details to begin robustness evaluation</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#cbd5e1", padding: "4px" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Basic */}
              <div>
                <p style={{ fontSize: "13px", color: "#facc15", textTransform: "uppercase", letterSpacing: "0.15em", fontFamily: MONO, marginBottom: "12px" }}>Basic Info</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <Input label="Evaluation Name *" value={form.name} onChange={v => set("name",v)} placeholder="e.g. ResNet50 Fog Test" style={{ gridColumn: "1 / -1" }} />
                  <Select label="Dataset Type *" value={form.dataset_type} onChange={v => set("dataset_type",v)} options={DATASET_TYPES} required />
                  <Select label="Framework" value={form.framework} onChange={v => set("framework",v)} options={FRAMEWORKS} />
                  {form.dataset_type === "image" && (
                    <div style={{ gridColumn: "1 / -1" }}>
                      <Select
                        label="Image Domain (override auto-detection)"
                        value={form.image_domain_override}
                        onChange={v => set("image_domain_override", v)}
                        options={IMAGE_DOMAINS}
                      />
                      {!form.image_domain_override && (
                        <p style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", fontFamily: "monospace" }}>
                          Auto-detect uses the evaluation name + architecture to guess the domain.
                          Set this manually if the wrong stressors are generated.
                        </p>
                      )}
                      {form.image_domain_override && (
                        <p style={{ fontSize: "11px", color: "#facc15", marginTop: "4px", fontFamily: "monospace" }}>
                          ✓ Domain locked to "{IMAGE_DOMAINS.find(d => d.value === form.image_domain_override)?.label}" — auto-detection skipped.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Params */}
              <div>
                <p style={{ fontSize: "13px", color: "#facc15", textTransform: "uppercase", letterSpacing: "0.15em", fontFamily: MONO, marginBottom: "12px" }}>Model Parameters</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                  <Input label="Architecture" value={form.architecture} onChange={v => set("architecture",v)} placeholder="ResNet50, BERT..." />
                  <Input label="Optimizer"    value={form.optimizer}    onChange={v => set("optimizer",v)}    placeholder="Adam, SGD..." />
                  <Input label="Learning Rate" value={form.learning_rate} onChange={v => set("learning_rate",v)} type="number" placeholder="0.001" />
                  <Input label="Epochs"      value={form.epochs}      onChange={v => set("epochs",v)}      type="number" placeholder="100" />
                  <Input label="Batch Size"  value={form.batch_size}  onChange={v => set("batch_size",v)}  type="number" placeholder="32" />
                  <Input label="Input Size"  value={form.input_size}  onChange={v => set("input_size",v)}  placeholder="224x224" />
                </div>
              </div>

              {/* Metrics */}
              <div>
                <p style={{ fontSize: "13px", color: "#facc15", textTransform: "uppercase", letterSpacing: "0.15em", fontFamily: MONO, marginBottom: "12px" }}>Existing Metrics (0–1 scale)</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                  <Input label="Accuracy"  value={form.metric_accuracy}  onChange={v => set("metric_accuracy",v)}  type="number" placeholder="0.92" />
                  <Input label="Precision" value={form.metric_precision} onChange={v => set("metric_precision",v)} type="number" placeholder="0.89" />
                  <Input label="Recall"    value={form.metric_recall}    onChange={v => set("metric_recall",v)}    type="number" placeholder="0.87" />
                  <Input label="F1 Score"  value={form.metric_f1}        onChange={v => set("metric_f1",v)}        type="number" placeholder="0.88" />
                  <Input label="mAP"       value={form.metric_map}       onChange={v => set("metric_map",v)}       type="number" placeholder="0.75" />
                  <Input label="ROC-AUC"   value={form.metric_roc_auc}   onChange={v => set("metric_roc_auc",v)}   type="number" placeholder="0.94" />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", padding: "16px 24px", borderTop: "1px solid #1a1a1a" }}>
              <Button onClick={() => setShowModal(false)} variant="ghost">Cancel</Button>
              <Button onClick={handleCreate} variant="primary" loading={creating} disabled={!form.name.trim()}>
                Create & Continue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
