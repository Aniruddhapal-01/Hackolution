import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Database, ExternalLink, ArrowLeft, Loader2 } from "lucide-react";
import Sidebar from "../components/Sidebar";
import TopNavBar from "../components/TopNavBar";
import { MetricCard, Card, Button } from "../components/ui";
import { useEvaluation, useEvaluations } from "../hooks/useProject";

const SOURCE_COLORS: Record<string, string> = {
  kaggle:       "text-blue-400 bg-blue-500/10 border-blue-500/20",
  huggingface:  "text-amber-400 bg-amber-500/10 border-amber-500/20",
  roboflow:     "text-violet-400 bg-violet-500/10 border-violet-500/20",
  synthetic:    "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

export default function DatasetsPage() {
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
  const datasets = ev.dataset_records || [];
  const totalSamples = datasets.reduce((a, d) => a + (d.sample_count || 0), 0);
  const totalSizeMB  = datasets.reduce((a, d) => a + (d.size_bytes || 0), 0) / 1024 / 1024;

  const bySource = datasets.reduce((acc: Record<string, number>, d) => {
    acc[d.source] = (acc[d.source] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#080b10]">
      <Sidebar evaluations={evaluations} activeId={id} onNew={() => navigate("/evaluations")} />
      <TopNavBar evaluationId={id} />

      <div className="page-layout page-content">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <button onClick={() => navigate(`/evaluations/${id}`)} className="text-slate-500 hover:text-white transition-colors">
                <ArrowLeft size={16} />
              </button>
              <h1 className="text-2xl font-bold text-white">Datasets</h1>
            </div>
            <p className="text-sm text-slate-500 ml-6">{ev.name} — targeted stress-test datasets</p>
          </div>
          <Button onClick={() => navigate(`/evaluations/${id}/report`)} variant="success" size="sm">
            View Report
          </Button>
        </div>

        {datasets.length === 0 ? (
          <Card className="text-center py-16">
            <Database size={32} className="text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400">No datasets fetched yet. Run the evaluation first.</p>
            <Button onClick={() => navigate(`/evaluations/${id}`)} variant="secondary" className="mt-4">
              Go to Evaluation
            </Button>
          </Card>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <MetricCard label="Total Datasets"  value={datasets.length}                    color="blue"    />
              <MetricCard label="Total Samples"   value={totalSamples.toLocaleString()}       color="violet"  />
              <MetricCard label="Total Size"      value={`${totalSizeMB.toFixed(0)} MB`}      color="amber"   />
              <MetricCard label="Sources"         value={Object.keys(bySource).length}        color="emerald" />
            </div>

            {/* Source breakdown */}
            <div className="flex items-center gap-3 mb-6">
              {Object.entries(bySource).map(([source, count]) => (
                <span key={source} className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold ${SOURCE_COLORS[source] || "text-slate-400 bg-white/[0.04] border-white/10"}`}>
                  {source} ({count})
                </span>
              ))}
            </div>

            {/* Dataset cards */}
            <div className="grid grid-cols-2 gap-4">
              {datasets.map(ds => (
                <Card key={ds.id} className="hover:border-white/[0.14]">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${SOURCE_COLORS[ds.source] || "text-slate-400 bg-white/[0.04] border-white/10"}`}>
                          {ds.source}
                        </span>
                        {ds.target_stressor && ds.target_stressor !== "all" && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-500 bg-white/[0.03] border border-white/[0.06]">
                            {ds.target_stressor.replace(/_/g," ")}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-white text-sm truncate">{ds.dataset_name}</h3>
                    </div>
                    {ds.dataset_url && (
                      <a href={ds.dataset_url} target="_blank" rel="noopener noreferrer"
                        className="text-slate-600 hover:text-blue-400 transition-colors ml-2 flex-shrink-0"
                        onClick={e => e.stopPropagation()}>
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                  {ds.description && (
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">{ds.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs font-mono text-slate-600">
                    {ds.sample_count && <span>{ds.sample_count.toLocaleString()} samples</span>}
                    {ds.size_bytes   && <span>{(ds.size_bytes / 1024 / 1024).toFixed(0)} MB</span>}
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
