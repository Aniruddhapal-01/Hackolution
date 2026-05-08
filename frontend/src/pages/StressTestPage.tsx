import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Zap, CheckCircle, XCircle, ArrowLeft, TrendingDown, Loader2 } from "lucide-react";
import Sidebar from "../components/Sidebar";
import TopNavBar from "../components/TopNavBar";
import { StatusBadge, MetricCard, ProgressBar, Button, C, FONT, MONO } from "../components/ui";
import { useEvaluation, useEvaluations } from "../hooks/useProject";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";



export default function StressTestPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { evaluation, loading } = useEvaluation(id!, 3000);
  const { evaluations } = useEvaluations();

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Loader2 size={24} color="#facc15" style={{ animation: "spin 1s linear infinite" }} />
    </div>
  );
  if (!evaluation) return null;

  const ev = evaluation;
  const results = ev.stress_test_results || [];
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const avgDeg = results.length ? (results.reduce((a,r) => a + (r.degradation_pct||0), 0) / results.length).toFixed(1) : "0";

  const chartData = results.map(r => ({
    name: (r.stressor_label || r.stressor_key).replace(/_/g," ").slice(0,12),
    original: Math.round((r.original_score||0)*100),
    stressed: Math.round((r.stressed_score||0)*100),
  }));

  const barColor = (v: number) => v < 40 ? "#ef4444" : v < 60 ? "#f59e0b" : "#10b981";

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
                <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#fff" }}>Stress Test Results</h1>
                <StatusBadge status={ev.status} />
              </div>
              <p style={{ fontSize: "14px", color: "#94a3b8", marginTop: "2px" }}>{ev.name}</p>
            </div>
          </div>
          <Button onClick={() => navigate(`/evaluations/${id}/report`)} variant="success" size="sm">View Full Report</Button>
        </div>

        {results.length === 0 ? (
          <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "12px", padding: "64px 20px", textAlign: "center" }}>
            <Zap size={32} color="#64748b" style={{ margin: "0 auto 16px" }} />
            <p style={{ color: "#cbd5e1" }}>No stress test results yet. Run the evaluation first.</p>
            <div style={{ marginTop: "16px" }}>
              <Button onClick={() => navigate(`/evaluations/${id}`)} variant="secondary">Go to Evaluation</Button>
            </div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "20px" }}>
              <MetricCard label="Robustness Score" value={`${ev.robustness_score?.toFixed(1)||0}%`}
                color={ev.robustness_score && ev.robustness_score>=80 ? "green" : ev.robustness_score && ev.robustness_score>=60 ? "yellow" : "red"} />
              <MetricCard label="Tests Passed" value={`${passed} / ${results.length}`} color="green" />
              <MetricCard label="Tests Failed" value={failed} color="red" />
              <MetricCard label="Avg Degradation" value={`${avgDeg}%`} color="yellow" />
            </div>

            {/* Bar chart */}
            <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
              <p style={{ fontSize: "13px", color: "#facc15", textTransform: "uppercase", letterSpacing: "0.15em", fontFamily: MONO, marginBottom: "16px" }}>
                Original vs Stressed Accuracy
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: MONO }} />
                  <YAxis domain={[0,100]} tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: MONO }} />
                  <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #facc15", borderRadius: "8px", fontSize: 11, fontFamily: MONO }} />
                  <Bar dataKey="original" name="Original %" fill="#3b82f6" radius={[3,3,0,0]} />
                  <Bar dataKey="stressed" name="Stressed %" radius={[3,3,0,0]}>
                    {chartData.map((entry, i) => <Cell key={i} fill={barColor(entry.stressed)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", gap: "20px", justifyContent: "center", marginTop: "12px" }}>
                {[["#3b82f6","Original"],["#10b981","Stressed (pass)"],["#ef4444","Stressed (fail)"]].map(([c,l]) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: c }} />
                    <span style={{ fontSize: "13px", color: "#cbd5e1", fontFamily: MONO }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Per-stressor */}
            <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "12px", padding: "20px" }}>
              <p style={{ fontSize: "13px", color: "#facc15", textTransform: "uppercase", letterSpacing: "0.15em", fontFamily: MONO, marginBottom: "16px" }}>
                Per-Stressor Breakdown
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {results.map(r => (
                  <div key={r.id} style={{
                    padding: "16px", borderRadius: "10px",
                    background: r.passed ? "#0a0a0a" : "#1a0000",
                    border: `1px solid ${r.passed ? "#1a1a1a" : "#ef4444"}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {r.passed ? <CheckCircle size={14} color="#10b981" /> : <XCircle size={14} color="#ef4444" />}
                        <span style={{ fontWeight: 700, color: "#fff", fontSize: "13px" }}>{r.stressor_label || r.stressor_key}</span>
                      </div>
                      <div style={{ display: "flex", gap: "16px", fontSize: "13px", fontFamily: MONO }}>
                        <span style={{ color: "#94a3b8" }}>Original: <span style={{ color: "#3b82f6" }}>{Math.round((r.original_score||0)*100)}%</span></span>
                        <span style={{ color: "#94a3b8" }}>Stressed: <span style={{ color: r.passed ? "#10b981" : "#ef4444" }}>{Math.round((r.stressed_score||0)*100)}%</span></span>
                        <span style={{ display: "flex", alignItems: "center", gap: "3px", color: (r.degradation_pct||0) > 20 ? "#ef4444" : "#f59e0b" }}>
                          <TrendingDown size={11} /> {(r.degradation_pct||0).toFixed(1)}%
                        </span>
                        <span style={{ color: "#64748b" }}>{r.sample_count} samples</span>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "8px" }}>
                      <ProgressBar progress={Math.round((r.original_score||0)*100)} label="Original" color="blue" />
                      <ProgressBar progress={Math.round((r.stressed_score||0)*100)} label="Stressed" color={r.passed ? "green" : "red"} />
                    </div>
                    {r.notes && <p style={{ fontSize: "13px", color: "#94a3b8", fontFamily: MONO }}>{r.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
