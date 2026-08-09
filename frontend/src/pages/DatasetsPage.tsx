import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Database, ExternalLink, ArrowLeft, Loader2, Download, Sparkles, BookOpen, RefreshCw, TrendingUp } from "lucide-react";
import Sidebar from "../components/Sidebar";
import TopNavBar from "../components/TopNavBar";
import { MetricCard, Card, Button, FONT, MONO } from "../components/ui";
import { useEvaluation, useEvaluations } from "../hooks/useProject";
import { api } from "../api/client";

const SOURCE_COLORS: Record<string, string> = {
  kaggle:      "text-blue-400 bg-blue-500/10 border-blue-500/20",
  huggingface: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  roboflow:    "text-violet-400 bg-violet-500/10 border-violet-500/20",
  synthetic:   "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

export default function DatasetsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { evaluation, loading, refetch } = useEvaluation(id!, 5000);
  const { evaluations } = useEvaluations();
  const [regenerating, setRegenerating] = useState(false);

  const handleRegenerate = async () => {
    if (!id) return;
    setRegenerating(true);
    try {
      await api.post(`/api/evaluations/${id}/regenerate-datasets`);
      setTimeout(() => { refetch(); setRegenerating(false); }, 10000);
    } catch {
      setRegenerating(false);
    }
  };

  const handleDownload = (datasetId: string, name: string) => {
    const url = `http://localhost:8000/api/evaluations/${id}/datasets/${datasetId}/download`;
    const a = document.createElement("a");
    a.href = url;
    a.download = name.replace(/\s+/g, "_") + ".zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#080b10] flex items-center justify-center">
      <Loader2 size={24} className="animate-spin text-blue-500" />
    </div>
  );
  if (!evaluation) return null;

  const ev = evaluation;
  const datasets      = ev.dataset_records || [];
  const generated     = datasets.filter((d: any) => d.source === "synthetic");
  const suggestions   = datasets.filter((d: any) => d.source !== "synthetic");
  const hasOldFakeUrls = generated.length === 0 && datasets.length > 0;
  const totalGenSamples = generated.reduce((a: number, d: any) => a + (d.sample_count || 0), 0);
  const totalGenSizeMB  = generated.reduce((a: number, d: any) => a + (d.size_bytes || 0), 0) / 1024 / 1024;

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
              <h1 className="text-2xl font-bold text-white">Datasets</h1>
            </div>
            <p className="text-sm text-slate-500 ml-6">{ev.name} — generated datasets + real suggestions</p>
          </div>
          <div className="flex items-center gap-3">
            {(datasets.length === 0 || hasOldFakeUrls) && ev.status === "ready" && (
              <Button onClick={handleRegenerate} variant="secondary" size="sm" loading={regenerating}>
                <RefreshCw size={13} /> {regenerating ? "Generating..." : "Generate Datasets"}
              </Button>
            )}
            {ev.status === "ready" && (
              <Button onClick={() => navigate(`/evaluations/${id}/improvement`)} variant="primary" size="sm">
                <TrendingUp size={13} /> Improvement Datasets
              </Button>
            )}
            <Button onClick={() => navigate(`/evaluations/${id}/report`)} variant="success" size="sm">
              View Report
            </Button>
          </div>
        </div>

        {/* Empty / loading states */}
        {datasets.length === 0 && !regenerating ? (
          <Card className="text-center py-16">
            <Database size={32} className="text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400 mb-2">No datasets generated yet.</p>
            <p className="text-sm text-slate-600 mb-6">
              {ev.status === "ready"
                ? "Click Generate Datasets above to create synthetic stress-test data."
                : "Run the evaluation pipeline first."}
            </p>
            {ev.status !== "ready" && (
              <Button onClick={() => navigate(`/evaluations/${id}`)} variant="secondary">Go to Evaluation</Button>
            )}
          </Card>
        ) : regenerating ? (
          <Card className="text-center py-16">
            <Loader2 size={32} className="animate-spin text-emerald-400 mx-auto mb-4" />
            <p className="text-white font-medium mb-2">Generating synthetic datasets...</p>
            <p className="text-sm text-slate-500">Creating physics-stressed data for each vulnerability stressor. This takes ~10 seconds.</p>
          </Card>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <MetricCard label="Generated Datasets" value={generated.length}                  color="green"  />
              <MetricCard label="Generated Samples"  value={totalGenSamples.toLocaleString()}  color="blue"   />
              <MetricCard label="Generated Size"     value={totalGenSizeMB.toFixed(1) + " MB"} color="purple" />
              <MetricCard label="Real Suggestions"   value={suggestions.length}                color="yellow" />
            </div>

            {/* Generated Synthetic Datasets */}
            {generated.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Sparkles size={14} className="text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Generated Synthetic Datasets</h2>
                    <p className="text-xs text-slate-500">Real files on disk with physics-accurate stressor augmentation. Click Download ZIP.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {generated.map((ds: any) => (
                    <div key={ds.id} className="bg-[#0d1117] border border-emerald-500/20 rounded-xl p-5 hover:border-emerald-500/40 transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                              synthetic
                            </span>
                            {ds.target_stressor && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-500 bg-white/[0.03] border border-white/[0.06]">
                                {ds.target_stressor.replace(/_/g, " ")}
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-white text-sm">{ds.dataset_name}</h3>
                        </div>
                        <button
                          onClick={() => handleDownload(ds.id, ds.dataset_name || ds.target_stressor || "dataset")}
                          className="ml-3 flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-semibold rounded-lg transition-all">
                          <Download size={12} /> ZIP
                        </button>
                      </div>
                      {ds.description && <p className="text-xs text-slate-500 mb-3 leading-relaxed">{ds.description}</p>}
                      <div className="flex items-center gap-4 text-xs font-mono">
                        {ds.sample_count != null && <span className="text-emerald-400">{ds.sample_count.toLocaleString()} samples</span>}
                        {ds.size_bytes != null && (
                          <span className="text-slate-600">
                            {ds.size_bytes > 1048576
                              ? (ds.size_bytes / 1048576).toFixed(1) + " MB"
                              : (ds.size_bytes / 1024).toFixed(0) + " KB"}
                          </span>
                        )}
                        <span className="text-slate-700">COCO JSON + YOLO TXT</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Real Dataset Suggestions */}
            {suggestions.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <BookOpen size={14} className="text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Real Dataset Suggestions</h2>
                    <p className="text-xs text-slate-500">Curated real-world datasets from Kaggle, HuggingFace, and Roboflow. Click Open to visit.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {suggestions.map((ds: any) => (
                    <div key={ds.id} className="bg-[#0d1117] border border-white/[0.07] rounded-xl p-5 hover:border-white/[0.14] transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${SOURCE_COLORS[ds.source] || "text-slate-400 bg-white/[0.04] border-white/10"}`}>
                              {ds.source}
                            </span>
                            {ds.target_stressor && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-500 bg-white/[0.03] border border-white/[0.06]">
                                {ds.target_stressor.replace(/_/g, " ")}
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-white text-sm">{ds.dataset_name}</h3>
                        </div>
                        {ds.dataset_url && (
                          <a href={ds.dataset_url} target="_blank" rel="noopener noreferrer"
                            className="ml-3 flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 text-slate-300 text-xs font-mono font-semibold rounded-lg transition-all">
                            <ExternalLink size={12} /> Open
                          </a>
                        )}
                      </div>
                      {ds.description && <p className="text-xs text-slate-500 mb-3 leading-relaxed">{ds.description}</p>}
                      <div className="flex items-center gap-4 text-xs font-mono text-slate-600">
                        {ds.sample_count != null && <span>{ds.sample_count.toLocaleString()} samples</span>}
                        <span className="capitalize">{ds.source}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Improvement datasets callout */}
            {ev.status === "ready" && (
              <div style={{
                background: "linear-gradient(135deg, #0a1628 0%, #0d1117 100%)",
                border: "1px solid #3b82f630",
                borderRadius: "12px", padding: "20px 24px",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "9px", flexShrink: 0,
                    background: "#1e3a5f", border: "1px solid #3b82f6",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <TrendingUp size={16} color="#3b82f6" />
                  </div>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "#fff", margin: "0 0 3px" }}>
                      Training Improvement Datasets
                    </p>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                      Generate augmented training data to fix your model's detected weaknesses — 3 difficulty levels per failed stressor.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/evaluations/${id}/improvement`)}
                  style={{
                    flexShrink: 0, display: "flex", alignItems: "center", gap: "6px",
                    padding: "8px 16px", background: "#3b82f6", border: "none",
                    color: "#fff", fontSize: "13px", fontFamily: MONO, fontWeight: 700,
                    borderRadius: "8px", cursor: "pointer", whiteSpace: "nowrap",
                  }}>
                  <TrendingUp size={13} /> Go to Improvement
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
