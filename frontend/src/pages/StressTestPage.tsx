import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingDown, TrendingUp, Loader2, CheckCircle, XCircle, AlertTriangle, Zap } from "lucide-react";
import Sidebar from "../components/Sidebar";
import TopNavBar from "../components/TopNavBar";
import { StatusBadge, Button, FONT, MONO } from "../components/ui";
import { useEvaluation, useEvaluations } from "../hooks/useProject";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pctColor(v: number) {
  if (v >= 70) return "#10b981";
  if (v >= 50) return "#f59e0b";
  return "#ef4444";
}

function degradationColor(d: number) {
  if (d <= 8)  return "#10b981";
  if (d <= 20) return "#f59e0b";
  return "#ef4444";
}

function degradationLabel(d: number) {
  if (d <= 8)  return "Minimal impact";
  if (d <= 20) return "Moderate impact";
  if (d <= 35) return "Significant impact";
  return "Severe impact";
}

// ─── Simple score pill ────────────────────────────────────────────────────────

function ScorePill({ value, label }: { value: number; label: string }) {
  const color = pctColor(value);
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        display: "inline-flex", flexDirection: "column", alignItems: "center",
        padding: "8px 16px", borderRadius: "10px",
        background: color + "18", border: `1px solid ${color}`,
        minWidth: "72px",
      }}>
        <span style={{ fontSize: "22px", fontWeight: 700, color, fontFamily: MONO, lineHeight: 1 }}>
          {value}%
        </span>
        <span style={{ fontSize: "10px", color: "#64748b", fontFamily: MONO, marginTop: "3px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {label}
        </span>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

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
  const cmp = (ev.augmentation_comparison as any) ?? null;

  const baseAccuracy = results.length > 0
    ? Math.round((results[0].original_score || 0) * 100)
    : Math.round((ev.metric_accuracy || 0) * 100);

  const avgStressed = results.length > 0
    ? Math.round(results.reduce((a, r) => a + (r.stressed_score || 0), 0) / results.length * 100)
    : 0;

  const worstResult = results.length > 0
    ? results.reduce((a, b) => (a.stressed_score || 0) < (b.stressed_score || 0) ? a : b)
    : null;

  // Chart data — simple: one bar per stressor showing the drop
  const chartData = results.map(r => ({
    name: (r.stressor_label || r.stressor_key || "").replace(/_/g, " ").slice(0, 14),
    "Lab Accuracy":  Math.round((r.original_score || 0) * 100),
    "Real-World":    Math.round((r.stressed_score || 0) * 100),
    drop: Math.round((r.degradation_pct || 0) * 10) / 10,
  }));

  return (
    <div style={{ background: "#000", minHeight: "100vh", fontFamily: FONT }}>
      <Sidebar evaluations={evaluations} activeId={id} onNew={() => navigate("/evaluations")} />
      <TopNavBar evaluationId={id} />

      <div className="page-layout page-content">

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={() => navigate(`/evaluations/${id}`)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#cbd5e1", padding: "4px" }}>
              <ArrowLeft size={16} />
            </button>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#fff" }}>Stress Test Results</h1>
                <StatusBadge status={ev.status} />
              </div>
              <p style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>{ev.name}</p>
            </div>
          </div>
          <Button onClick={() => navigate(`/evaluations/${id}/report`)} variant="success" size="sm">
            Download Report
          </Button>
        </div>

        {results.length === 0 ? (
          <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "12px", padding: "64px 20px", textAlign: "center" }}>
            <Zap size={32} color="#374151" style={{ margin: "0 auto 16px" }} />
            <p style={{ color: "#cbd5e1", marginBottom: "16px" }}>No stress test results yet. Run the evaluation first.</p>
            <Button onClick={() => navigate(`/evaluations/${id}`)} variant="secondary">Go to Evaluation</Button>
          </div>
        ) : (
          <>
            {/* ── THE SIMPLE EXPLANATION BANNER ── */}
            <div style={{
              background: "#0a0a0a", border: "1px solid #2d2d2d", borderRadius: "14px",
              padding: "20px 24px", marginBottom: "24px",
              display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap",
            }}>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <p style={{ fontSize: "13px", color: "#64748b", fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>
                  What this page shows
                </p>
                <p style={{ fontSize: "14px", color: "#cbd5e1", lineHeight: 1.6 }}>
                  Your model scores <strong style={{ color: "#facc15" }}>{baseAccuracy}%</strong> in the lab.
                  Under real-world conditions it averages <strong style={{ color: pctColor(avgStressed) }}>{avgStressed}%</strong>.
                  {worstResult && (
                    <> The biggest drop is under <strong style={{ color: "#ef4444" }}>{worstResult.stressor_label || worstResult.stressor_key}</strong> — accuracy falls to <strong style={{ color: "#ef4444" }}>{Math.round((worstResult.stressed_score || 0) * 100)}%</strong>.</>
                  )}
                </p>
              </div>
              <div style={{ display: "flex", gap: "12px", flexShrink: 0 }}>
                <ScorePill value={baseAccuracy} label="Lab" />
                <div style={{ display: "flex", alignItems: "center", color: "#374151", fontSize: "20px" }}>→</div>
                <ScorePill value={avgStressed} label="Real World" />
              </div>
            </div>

            {/* ── THE MAIN COMPARISON TABLE ── */}
            <div style={{ background: "#0a0a0a", border: "2px solid #facc15", borderRadius: "14px", marginBottom: "24px", overflow: "hidden" }}>

              {/* Table title */}
              <div style={{ padding: "16px 24px", borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "center", gap: "10px" }}>
                <AlertTriangle size={16} color="#facc15" />
                <div>
                  <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#fff", margin: 0 }}>
                    Lab Accuracy vs Real-World Accuracy
                  </h2>
                  <p style={{ fontSize: "12px", color: "#64748b", fontFamily: MONO, marginTop: "2px" }}>
                    Each row = one real-world condition your model was tested under
                  </p>
                </div>
              </div>

              {/* Column headers */}
              <div style={{
                display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                padding: "10px 24px", background: "#111", borderBottom: "1px solid #1a1a1a",
              }}>
                {[
                  { t: "Condition Tested",       sub: "What we simulated"              },
                  { t: "Lab Accuracy",            sub: "Clean data"                    },
                  { t: "Real-World Accuracy",     sub: "Under this condition"          },
                  { t: "Accuracy Drop",           sub: "How much it fell"              },
                  { t: "Verdict",                 sub: "Safe to deploy?"               },
                ].map(col => (
                  <div key={col.t}>
                    <p style={{ fontSize: "11px", fontWeight: 700, color: "#facc15", fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>{col.t}</p>
                    <p style={{ fontSize: "10px", color: "#374151", fontFamily: MONO, margin: "2px 0 0" }}>{col.sub}</p>
                  </div>
                ))}
              </div>

              {/* Data rows */}
              {results.map((r, i) => {
                const orig    = Math.round((r.original_score || 0) * 100);
                const stressed = Math.round((r.stressed_score || 0) * 100);
                const drop    = Math.round((r.degradation_pct || 0) * 10) / 10;
                const passed  = r.passed;
                const rowBg   = i % 2 === 0 ? "#0a0a0a" : "#0d0d0d";

                return (
                  <div key={r.id || i} style={{
                    display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                    padding: "16px 24px", background: rowBg,
                    borderBottom: "1px solid #111", alignItems: "center",
                  }}>

                    {/* Condition name */}
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 600, color: "#e2e8f0", margin: 0 }}>
                        {r.stressor_label || r.stressor_key}
                      </p>
                      <p style={{ fontSize: "11px", color: "#374151", fontFamily: MONO, margin: "3px 0 0" }}>
                        {degradationLabel(drop)}
                      </p>
                    </div>

                    {/* Lab accuracy */}
                    <div style={{ textAlign: "center" }}>
                      <span style={{ fontSize: "20px", fontWeight: 700, color: "#3b82f6", fontFamily: MONO }}>
                        {orig}%
                      </span>
                    </div>

                    {/* Real-world accuracy */}
                    <div style={{ textAlign: "center" }}>
                      <span style={{ fontSize: "20px", fontWeight: 700, color: pctColor(stressed), fontFamily: MONO }}>
                        {stressed}%
                      </span>
                    </div>

                    {/* Drop */}
                    <div style={{ textAlign: "center" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: "4px",
                        fontSize: "15px", fontWeight: 700, fontFamily: MONO,
                        color: degradationColor(drop),
                      }}>
                        <TrendingDown size={13} />
                        -{drop}%
                      </span>
                    </div>

                    {/* Verdict */}
                    <div style={{ textAlign: "center" }}>
                      {passed ? (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "5px",
                          padding: "4px 12px", borderRadius: "9999px",
                          background: "#002a10", border: "1px solid #10b981",
                          fontSize: "12px", fontWeight: 700, color: "#10b981", fontFamily: MONO,
                        }}>
                          <CheckCircle size={11} /> SAFE
                        </span>
                      ) : (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "5px",
                          padding: "4px 12px", borderRadius: "9999px",
                          background: "#2a0000", border: "1px solid #ef4444",
                          fontSize: "12px", fontWeight: 700, color: "#ef4444", fontFamily: MONO,
                        }}>
                          <XCircle size={11} /> RISKY
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Summary footer */}
              <div style={{
                display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                padding: "14px 24px", background: "#111", borderTop: "2px solid #2d2d2d",
                alignItems: "center",
              }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#facc15", fontFamily: MONO, textTransform: "uppercase" }}>
                  AVERAGE ACROSS ALL CONDITIONS
                </span>
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "18px", fontWeight: 700, color: "#3b82f6", fontFamily: MONO }}>{baseAccuracy}%</span>
                </div>
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "18px", fontWeight: 700, color: pctColor(avgStressed), fontFamily: MONO }}>{avgStressed}%</span>
                </div>
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "15px", fontWeight: 700, color: degradationColor(baseAccuracy - avgStressed), fontFamily: MONO }}>
                    -{baseAccuracy - avgStressed}%
                  </span>
                </div>
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "12px", color: "#64748b", fontFamily: MONO }}>
                    {results.filter(r => r.passed).length}/{results.length} safe
                  </span>
                </div>
              </div>
            </div>

            {/* ── VISUAL CHART ── */}
            <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "14px", padding: "20px 24px", marginBottom: "24px" }}>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>
                Visual Comparison
              </p>
              <p style={{ fontSize: "12px", color: "#64748b", fontFamily: MONO, marginBottom: "16px" }}>
                Blue = lab accuracy (same for all). Colored bars = real-world accuracy per condition.
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barGap={4} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                  <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11, fontFamily: MONO }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11, fontFamily: MONO }}
                    tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{ background: "#0a0a0a", border: "1px solid #facc15", borderRadius: "8px", fontSize: 12, fontFamily: MONO }}
                    formatter={(value: any, name: string) => [`${value}%`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, fontFamily: MONO, color: "#94a3b8" }} />
                  <Bar dataKey="Lab Accuracy" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Real-World" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={pctColor(entry["Real-World"])} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* ── AUGMENTATION IMPROVEMENT ── */}
            {cmp && cmp.per_stressor && cmp.per_stressor.length > 0 && (
              <div style={{ background: "#0a0a0a", border: "2px solid #10b981", borderRadius: "14px", padding: "20px 24px", marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                  <TrendingUp size={16} color="#10b981" />
                  <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#fff", margin: 0 }}>
                    After Retraining with Our Generated Datasets
                  </h2>
                </div>
                <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px", lineHeight: 1.6 }}>
                  If you retrain your model using the synthetic datasets BlindSpot.AI generated,
                  here's the projected improvement in real-world accuracy:
                </p>

                {/* Simple 3-number summary */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                  {[
                    { label: "Real-World Accuracy Now",    value: `${cmp.before_avg_accuracy}%`, color: "#ef4444", sub: "Average across all conditions" },
                    { label: "Projected After Retraining", value: `${cmp.after_avg_accuracy}%`,  color: "#10b981", sub: "With our generated datasets"   },
                    { label: "Expected Improvement",       value: `+${cmp.accuracy_gain}%`,       color: "#facc15", sub: `${cmp.tests_recovered} more conditions become safe` },
                  ].map(card => (
                    <div key={card.label} style={{ background: "#111", border: `1px solid ${card.color}`, borderRadius: "10px", padding: "16px", textAlign: "center" }}>
                      <p style={{ fontSize: "11px", color: "#64748b", fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>{card.label}</p>
                      <p style={{ fontSize: "28px", fontWeight: 700, color: card.color, fontFamily: MONO, lineHeight: 1, marginBottom: "6px" }}>{card.value}</p>
                      <p style={{ fontSize: "11px", color: "#374151", fontFamily: MONO }}>{card.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Per-condition improvement table */}
                <div style={{ borderRadius: "10px", overflow: "hidden", border: "1px solid #1a1a1a" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "10px 16px", background: "#111", borderBottom: "1px solid #1a1a1a" }}>
                    {["Condition", "Now", "After Retraining", "Gain"].map(h => (
                      <span key={h} style={{ fontSize: "11px", color: "#facc15", fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>{h}</span>
                    ))}
                  </div>
                  {cmp.per_stressor.map((s: any, i: number) => (
                    <div key={i} style={{
                      display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr",
                      padding: "12px 16px", borderBottom: "1px solid #111",
                      background: s.was_failing && s.now_passing ? "#001a0a" : i % 2 === 0 ? "#0a0a0a" : "#0d0d0d",
                      alignItems: "center",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {s.was_failing && s.now_passing
                          ? <CheckCircle size={12} color="#10b981" />
                          : s.was_failing
                          ? <XCircle size={12} color="#ef4444" />
                          : <CheckCircle size={12} color="#10b981" />
                        }
                        <span style={{ fontSize: "13px", color: "#e2e8f0", fontWeight: 600 }}>
                          {s.stressor_label || s.stressor_key}
                        </span>
                        {s.was_failing && s.now_passing && (
                          <span style={{ fontSize: "10px", background: "#002a10", border: "1px solid #10b981", color: "#10b981", padding: "1px 7px", borderRadius: "9999px", fontFamily: MONO, fontWeight: 700 }}>
                            FIXED
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: "15px", fontWeight: 700, color: pctColor(Math.round(s.before_score * 100)), fontFamily: MONO }}>
                        {Math.round(s.before_score * 100)}%
                      </span>
                      <span style={{ fontSize: "15px", fontWeight: 700, color: "#10b981", fontFamily: MONO }}>
                        {Math.round(s.after_score * 100)}%
                      </span>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#facc15", fontFamily: MONO, display: "flex", alignItems: "center", gap: "3px" }}>
                        <TrendingUp size={11} /> +{s.improvement_abs.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>

                {/* Recommendation */}
                <div style={{ marginTop: "16px", background: "#111", borderRadius: "8px", padding: "14px 16px" }}>
                  <p style={{ fontSize: "13px", color: "#e2e8f0", lineHeight: 1.7, margin: 0 }}>
                    <span style={{ color: "#10b981", fontWeight: 700 }}>What to do: </span>
                    {cmp.recommendation}
                  </p>
                </div>
              </div>
            )}

            {/* ── DETAILED NOTES ── */}
            <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "14px", padding: "20px 24px" }}>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#fff", marginBottom: "16px" }}>
                Detailed Notes per Condition
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {results.map((r, i) => (
                  <div key={r.id || i} style={{
                    padding: "12px 16px", borderRadius: "8px",
                    background: r.passed ? "#0d0d0d" : "#1a0000",
                    border: `1px solid ${r.passed ? "#1a1a1a" : "#ef4444"}`,
                    display: "flex", alignItems: "flex-start", gap: "10px",
                  }}>
                    {r.passed
                      ? <CheckCircle size={14} color="#10b981" style={{ flexShrink: 0, marginTop: "2px" }} />
                      : <XCircle size={14} color="#ef4444" style={{ flexShrink: 0, marginTop: "2px" }} />
                    }
                    <div>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#e2e8f0" }}>
                        {r.stressor_label || r.stressor_key}
                      </span>
                      <span style={{ fontSize: "13px", color: "#64748b", fontFamily: MONO, marginLeft: "12px" }}>
                        {Math.round((r.original_score || 0) * 100)}% → {Math.round((r.stressed_score || 0) * 100)}%
                      </span>
                      {r.notes && (
                        <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0", lineHeight: 1.5 }}>{r.notes}</p>
                      )}
                    </div>
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
