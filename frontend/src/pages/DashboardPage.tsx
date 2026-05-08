import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Cpu, ArrowRight, Trash2, Clock, CheckCircle, AlertTriangle, Loader2, X } from "lucide-react";
import Sidebar from "../components/Sidebar";
import TopNavBar from "../components/TopNavBar";
import { StatusBadge, RiskBadge, Button, Input, Select, MetricCard } from "../components/ui";
import { useEvaluations } from "../hooks/useProject";
import { createEvaluation, deleteEvaluation, EvaluationCreate, ACTIVE_STATUSES } from "../api/client";

const DATASET_TYPES = [
  { value: "image",       label: "Image Dataset" },
  { value: "tabular",     label: "Categorical / Tabular Data" },
  { value: "sequential",  label: "Sequential Data" },
  { value: "time_series", label: "Time-Series Data" },
  { value: "vector",      label: "Vector / Embedding Dataset" },
];

const FRAMEWORKS = [
  { value: "pytorch",     label: "PyTorch" },
  { value: "tensorflow",  label: "TensorFlow / Keras" },
  { value: "sklearn",     label: "Scikit-learn" },
  { value: "onnx",        label: "ONNX" },
  { value: "jax",         label: "JAX" },
  { value: "other",       label: "Other" },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { evaluations, loading, refetch } = useEvaluations(6000);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating]   = useState(false);

  const [form, setForm] = useState<EvaluationCreate & { dataset_type: string; framework: string }>({
    name: "", description: "", dataset_type: "", framework: "",
    architecture: "", optimizer: "", learning_rate: undefined,
    epochs: undefined, batch_size: undefined, embedding_dim: undefined, input_size: "",
    metric_accuracy: undefined, metric_precision: undefined, metric_recall: undefined,
    metric_f1: undefined, metric_map: undefined, metric_roc_auc: undefined,
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const ev = await createEvaluation({
        ...form,
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
    <div className="min-h-screen bg-[#080b10]">
      <Sidebar evaluations={evaluations} onNew={() => setShowModal(true)} onDelete={handleDelete} />
      <TopNavBar />

      <div className="page-layout page-content">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Evaluation Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">Model robustness evaluations</p>
          </div>
          <Button onClick={() => setShowModal(true)} variant="primary" size="md">
            <Plus size={14} /> New Evaluation
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <MetricCard label="Total Evaluations" value={stats.total}    color="blue"    />
          <MetricCard label="Running"            value={stats.active}  color="amber"   sub={stats.active > 0 ? "In progress" : "None active"} />
          <MetricCard label="Completed"          value={stats.ready}   color="emerald" />
          <MetricCard label="Critical Risk"      value={stats.critical} color="red"    sub={stats.critical > 0 ? "Needs attention" : "All clear"} />
        </div>

        {/* Evaluations list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-blue-500" />
          </div>
        ) : evaluations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-4">
              <Cpu size={28} className="text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No evaluations yet</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-sm">Upload your first AI model to start a robustness evaluation.</p>
            <Button onClick={() => setShowModal(true)} variant="primary">
              <Plus size={14} /> Create First Evaluation
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {evaluations.map(ev => {
              const isActive = ACTIVE_STATUSES.includes(ev.status as any);
              return (
                <div key={ev.id}
                  onClick={() => navigate(`/evaluations/${ev.id}`)}
                  className="bg-[#0d1117] border border-white/[0.07] rounded-xl p-5 cursor-pointer hover:border-white/[0.14] hover:bg-[#0f1520] transition-all group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        ev.status === "ready" ? "bg-emerald-500/10 border border-emerald-500/20" :
                        isActive ? "bg-blue-500/10 border border-blue-500/20" :
                        "bg-white/[0.04] border border-white/[0.07]"
                      }`}>
                        {isActive ? <Loader2 size={16} className="text-blue-400 animate-spin" /> :
                         ev.status === "ready" ? <CheckCircle size={16} className="text-emerald-400" /> :
                         ev.status === "failed" ? <AlertTriangle size={16} className="text-red-400" /> :
                         <Cpu size={16} className="text-slate-500" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-white truncate">{ev.name}</h3>
                          <StatusBadge status={ev.status} />
                          {ev.risk_level && <RiskBadge level={ev.risk_level} />}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500 font-mono">
                          {ev.dataset_type && <span className="capitalize">{ev.dataset_type.replace("_"," ")}</span>}
                          {ev.framework    && <span>{ev.framework}</span>}
                          {ev.architecture && <span>{ev.architecture}</span>}
                          {ev.current_stage && isActive && <span className="text-blue-400">{ev.current_stage}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 flex-shrink-0 ml-4">
                      {ev.robustness_score !== undefined && ev.robustness_score !== null && (
                        <div className="text-right">
                          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">Robustness</p>
                          <p className={`text-lg font-bold font-mono ${
                            ev.robustness_score >= 80 ? "text-emerald-400" :
                            ev.robustness_score >= 60 ? "text-amber-400" : "text-red-400"
                          }`}>{ev.robustness_score.toFixed(1)}%</p>
                        </div>
                      )}
                      {isActive && (
                        <div className="w-24">
                          <div className="flex justify-between text-[10px] font-mono text-slate-600 mb-1">
                            <span>Progress</span><span>{ev.progress}%</span>
                          </div>
                          <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all duration-500"
                              style={{ width: `${ev.progress}%` }} />
                          </div>
                        </div>
                      )}
                      <ArrowRight size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#0d1117] border border-white/[0.1] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-white/[0.07]">
              <div>
                <h2 className="text-lg font-bold text-white">New Evaluation</h2>
                <p className="text-xs text-slate-500 mt-0.5">Fill in model details to begin robustness evaluation</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic */}
              <div>
                <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-3">Basic Info</p>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Evaluation Name" value={form.name} onChange={v => set("name", v)} placeholder="e.g. ResNet50 Fog Test" required className="col-span-2" />
                  <Select label="Dataset Type" value={form.dataset_type} onChange={v => set("dataset_type", v)} options={DATASET_TYPES} required />
                  <Select label="Framework" value={form.framework} onChange={v => set("framework", v)} options={FRAMEWORKS} />
                </div>
              </div>

              {/* Model Params */}
              <div>
                <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-3">Model Parameters</p>
                <div className="grid grid-cols-3 gap-4">
                  <Input label="Architecture" value={form.architecture || ""} onChange={v => set("architecture", v)} placeholder="ResNet50, BERT, LSTM..." />
                  <Input label="Optimizer"    value={form.optimizer    || ""} onChange={v => set("optimizer", v)}    placeholder="Adam, SGD..." />
                  <Input label="Learning Rate" value={form.learning_rate || ""} onChange={v => set("learning_rate", v)} type="number" placeholder="0.001" />
                  <Input label="Epochs"      value={form.epochs      || ""} onChange={v => set("epochs", v)}      type="number" placeholder="100" />
                  <Input label="Batch Size"  value={form.batch_size  || ""} onChange={v => set("batch_size", v)}  type="number" placeholder="32" />
                  <Input label="Input Size"  value={form.input_size  || ""} onChange={v => set("input_size", v)}  placeholder="224x224 or 512" />
                </div>
              </div>

              {/* Metrics */}
              <div>
                <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-3">Existing Metrics (0–1 scale)</p>
                <div className="grid grid-cols-3 gap-4">
                  <Input label="Accuracy"  value={form.metric_accuracy  || ""} onChange={v => set("metric_accuracy", v)}  type="number" placeholder="0.92" />
                  <Input label="Precision" value={form.metric_precision || ""} onChange={v => set("metric_precision", v)} type="number" placeholder="0.89" />
                  <Input label="Recall"    value={form.metric_recall    || ""} onChange={v => set("metric_recall", v)}    type="number" placeholder="0.87" />
                  <Input label="F1 Score"  value={form.metric_f1        || ""} onChange={v => set("metric_f1", v)}        type="number" placeholder="0.88" />
                  <Input label="mAP"       value={form.metric_map       || ""} onChange={v => set("metric_map", v)}       type="number" placeholder="0.75" />
                  <Input label="ROC-AUC"   value={form.metric_roc_auc   || ""} onChange={v => set("metric_roc_auc", v)}   type="number" placeholder="0.94" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-white/[0.07]">
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
