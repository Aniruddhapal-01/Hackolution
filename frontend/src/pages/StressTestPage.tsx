import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Zap, CheckCircle, XCircle, ArrowLeft, TrendingDown, Loader2 } from "lucide-react";
import Sidebar from "../components/Sidebar";
import TopNavBar from "../components/TopNavBar";
import { StatusBadge, RiskBadge, MetricCard, Card, ProgressBar, Button } from "../components/ui";
import { useEvaluation, useEvaluations } from "../hooks/useProject";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function StressTestPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { evaluation, loading } = useEvaluation(id!, 3000);
  const { evaluations } = useEvaluations();

  if (loading) return (
    <div className="min-h-screen bg-[#080b10] flex items-center justify-center">
      <Loader2 size={24} className="animate-spin text-blue-500" />
    </div>
  );
  if (!evaluation) return null;

  const ev = evaluation;
  const results = ev.stress_test_results || [];
  const summary = ev.stress_results ? {
    total: results.length,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    avgDeg: results.length ? (results.reduce((a, r) => a + (r.degradation_pct || 0), 0) / results.length).toFixed(1) : "0",
  } : null;

  const chartData = results.map(r => ({
    name: r.stressor_label || r.stressor_key,
    original: Math.round((r.original_score || 0) * 100),
    stressed: Math.round((r.stressed_score || 0) * 100),
    degradation: r.degradation_pct || 0,
  }));

  const getBarColor = (stressed: number) =>
    stressed < 40 ? "#ef4444" : stressed < 60 ? "#f59e0b" : "#10b981";

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
              <h1 className="text-2xl font-bold text-white">Stress Test Results</h1>
              <StatusBadge status={ev.status} />
            </div>
            <p className="text-sm text-slate-500 ml-6">{ev.name}</p>
          </div>
          <Button onClick={() => navigate(`/evaluations/${id}/report`)} variant="success" size="sm">
            View Full Report
          </Button>
        </div>

        {results.length === 0 ? (
          <Card className="text-center py-16">
            <Zap size={32} className="text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400">No stress test results yet. Run the evaluation first.</p>
            <Button onClick={() => navigate(`/evaluations/${id}`)} variant="secondary" className="mt-4">
              Go to Evaluation
            </Button>
          </Card>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <MetricCard label="Robustness Score" value={`${ev.robustness_score?.toFixed(1) || 0}%`}
                color={ev.robustness_score && ev.robustness_score >= 80 ? "emerald" : ev.robustness_score && ev.robustness_score >= 60 ? "amber" : "red"} />
              <MetricCard label="Tests Passed" value={`${summary?.passed || 0} / ${summary?.total || 0}`} color="emerald" />
              <MetricCard label="Tests Failed" value={summary?.failed || 0} color="red" />
              <MetricCard label="Avg Degradation" value={`${summary?.avgDeg || 0}%`} color="amber" />
            </div>

            {/* Bar chart */}
            <Card className="mb-6">
              <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">Original vs Stressed Accuracy</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "#94a3b8" }}
                  />
                  <Bar dataKey="original" name="Original %" fill="#3b82f6" radius={[3,3,0,0]} />
                  <Bar dataKey="stressed" name="Stressed %" radius={[3,3,0,0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={getBarColor(entry.stressed)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-6 mt-3 justify-center">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-blue-500" /><span className="text-xs font-mono text-slate-500">Original</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-500" /><span className="text-xs font-mono text-slate-500">Stressed (pass)</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-red-500" /><span className="text-xs font-mono text-slate-500">Stressed (fail)</span></div>
              </div>
            </Card>

            {/* Per-stressor table */}
            <Card>
              <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">Per-Stressor Breakdown</p>
              <div className="space-y-3">
                {results.map(r => (
                  <div key={r.id} className={`p-4 rounded-xl border transition-all ${
                    r.passed ? "bg-white/[0.02] border-white/[0.05]" : "bg-red-500/[0.03] border-red-500/20"
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {r.passed
                          ? <CheckCircle size={15} className="text-emerald-400" />
                          : <XCircle size={15} className="text-red-400" />}
                        <span className="font-medium text-white text-sm">{r.stressor_label || r.stressor_key}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <span className="text-slate-500">Original: <span className="text-blue-400">{Math.round((r.original_score || 0) * 100)}%</span></span>
                        <span className="text-slate-500">Stressed: <span className={r.passed ? "text-emerald-400" : "text-red-400"}>{Math.round((r.stressed_score || 0) * 100)}%</span></span>
                        <span className={`flex items-center gap-1 ${r.degradation_pct && r.degradation_pct > 20 ? "text-red-400" : "text-amber-400"}`}>
                          <TrendingDown size={11} /> {r.degradation_pct?.toFixed(1)}%
                        </span>
                        <span className="text-slate-600">{r.sample_count} samples</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-2">
                      <ProgressBar progress={Math.round((r.original_score || 0) * 100)} label="Original" color="blue" />
                      <ProgressBar progress={Math.round((r.stressed_score || 0) * 100)} label="Stressed"
                        color={r.passed ? "emerald" : "amber"} />
                    </div>
                    {r.notes && <p className="text-xs text-slate-500 mt-2">{r.notes}</p>}
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
