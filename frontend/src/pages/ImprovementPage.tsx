import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, TrendingUp, Zap, Loader2, Download,
  CheckCircle, AlertTriangle, BookOpen, ChevronRight,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import TopNavBar from "../components/TopNavBar";
import { Button, FONT, MONO } from "../components/ui";
import { useEvaluation, useEvaluations } from "../hooks/useProject";
import { api } from "../api/client";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function severityColor(label: string) {
  if (label === "FAILED STRESSOR") return { bg: "#2a0000", border: "#ef4444", text: "#ef4444" };
  return { bg: "#001a3a", border: "#3b82f6", text: "#3b82f6" };
}

function diffColor(level: string) {
  if (level === "easy")   return { bg: "#001a0a", border: "#10b981", text: "#10b981" };
  if (level === "medium") return { bg: "#1a1400", border: "#f59e0b", text: "#f59e0b" };
  return                         { bg: "#1a0000", border: "#ef4444", text: "#ef4444" };
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ImprovementPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { evaluation, loading } = useEvaluation(id!, 5000);
  const { evaluations } = useEvaluations();

  const [generating, setGenerating]   = useState(false);
  const [datasets,   setDatasets]     = useState<any[]>([]);
  const [loaded,     setLoaded]       = useState(false);
  const [stressResults, setStressResults] = useState<any[]>([]);

  // Load existing improvement datasets + stress results on mount
  useEffect(() => {
    if (!id) return;
    api.get(`/api/evaluations/${id}/improvement-datasets`)
      .then(r => { setDatasets(r.data || []); setLoaded(true); })
      .catch(() => setLoaded(true));
    api.get(`/api/evaluations/${id}`)
      .then(r => setStressResults(r.data?.stress_test_results || []))
      .catch(() => {});
  }, [id]);

  const handleGenerate = async () => {
    if (!id) return;
    setGenerating(true);
    try {
      await api.post(`/api/evaluations/${id}/generate-improvement-datasets`);
      setTimeout(async () => {
        try {
          const r = await api.get(`/api/evaluations/${id}/improvement-datasets`);
          setDatasets(r.data || []);
        } catch {}
        setGenerating(false);
      }, 12000);
    } catch {
      setGenerating(false);
    }
  };

  const handleDownload = (dsId: string, name: string) => {
    const url = `http://localhost:8000/api/evaluations/${id}/datasets/${dsId}/download`;
    const a = document.createElement("a");
    a.href = url;
    a.download = (name || "improvement_dataset").replace(/\s+/g, "_") + ".zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Loader2 size={24} color="#3b82f6" style={{ animation: "spin 1s linear infinite" }} />
    </div>
  );
  if (!evaluation) return null;

  const ev = evaluation;
  const failedCount = stressResults.filter((r: any) => !r.passed).length;

  return (
    <div style={{ background: "#000", minHeight: "100vh", fontFamily: FONT }}>
      <Sidebar evaluations={evaluations} activeId={id} onNew={() => navigate("/evaluations")} />
      <TopNavBar evaluationId={id} />

      <div className="page-layout page-content">

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={() => navigate(`/evaluations/${id}/datasets`)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#cbd5e1", padding: "4px" }}>
              <ArrowLeft size={16} />
            </button>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "8px",
                  background: "#1e3a5f", border: "1px solid #3b82f6",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <TrendingUp size={16} color="#3b82f6" />
                </div>
                <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#fff" }}>
                  Training Improvement Datasets
                </h1>
              </div>
              <p style={{ fontSize: "13px", color: "#64748b", marginTop: "2px", marginLeft: "44px" }}>
                {ev.name} — augmented training data to fix detected weaknesses
              </p>
            </div>
          </div>
          <Button
            onClick={handleGenerate}
            variant="primary"
            size="sm"
            loading={generating}
            disabled={generating || ev.status !== "ready"}
          >
            <Zap size={13} />
            {generating ? "Generating..." : datasets.length > 0 ? "Regenerate" : "Generate Datasets"}
          </Button>
        </div>

        {/* ── Explainer banner ── */}
        <div style={{
          background: "linear-gradient(135deg, #0a1628 0%, #0d1f0d 100%)",
          border: "1px solid #3b82f630",
          borderRadius: "14px", padding: "20px 24px", marginBottom: "28px",
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px",
        }}>
          {[
            {
              icon: <AlertTriangle size={16} color="#ef4444" />,
              title: "Detect failures",
              body: "The stress test found the conditions where your model degrades beyond 20%.",
            },
            {
              icon: <TrendingUp size={16} color="#3b82f6" />,
              title: "Generate fix data",
              body: "For each failure, we generate a balanced dataset: 50% clean + 50% corrupted with that stressor.",
            },
            {
              icon: <BookOpen size={16} color="#10b981" />,
              title: "Retrain & improve",
              body: "Mix the improvement data with your original training set and retrain. 3 difficulty levels included.",
            },
          ].map(card => (
            <div key={card.title} style={{ display: "flex", gap: "12px" }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {card.icon}
              </div>
              <div>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>{card.title}</p>
                <p style={{ fontSize: "12px", color: "#64748b", margin: 0, lineHeight: 1.6 }}>{card.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Stress test summary ── */}
        {stressResults.length > 0 && (
          <div style={{
            background: "#0a0a0a", border: "1px solid #1a1a1a",
            borderRadius: "12px", padding: "16px 20px", marginBottom: "24px",
            display: "flex", alignItems: "center", gap: "24px",
          }}>
            <div>
              <p style={{ fontSize: "11px", color: "#64748b", fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 4px" }}>
                Stress test summary
              </p>
              <p style={{ fontSize: "13px", color: "#cbd5e1", margin: 0 }}>
                <span style={{ color: "#ef4444", fontWeight: 700 }}>{failedCount} stressor{failedCount !== 1 ? "s" : ""} failed</span>
                {" "}out of {stressResults.length} tested.
                {failedCount > 0
                  ? " Improvement datasets generated for each failure."
                  : " Your model passed all stress tests — no improvement data needed."}
              </p>
            </div>
            <button
              onClick={() => navigate(`/evaluations/${id}/stress`)}
              style={{
                marginLeft: "auto", flexShrink: 0,
                display: "flex", alignItems: "center", gap: "6px",
                background: "none", border: "1px solid #1a1a1a",
                color: "#64748b", fontSize: "12px", fontFamily: MONO,
                padding: "6px 12px", borderRadius: "8px", cursor: "pointer",
              }}>
              View stress test <ChevronRight size={12} />
            </button>
          </div>
        )}

        {/* ── Empty / generating states ── */}
        {ev.status !== "ready" && (
          <div style={{
            background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "12px",
            padding: "64px 20px", textAlign: "center",
          }}>
            <TrendingUp size={32} color="#374151" style={{ margin: "0 auto 16px" }} />
            <p style={{ color: "#cbd5e1", marginBottom: "16px" }}>
              Run the evaluation pipeline first to generate improvement datasets.
            </p>
            <Button onClick={() => navigate(`/evaluations/${id}`)} variant="secondary">
              Go to Evaluation
            </Button>
          </div>
        )}

        {ev.status === "ready" && generating && (
          <div style={{
            background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "12px",
            padding: "64px 20px", textAlign: "center",
          }}>
            <Loader2 size={32} color="#3b82f6" style={{ margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
            <p style={{ color: "#fff", fontWeight: 600, marginBottom: "6px" }}>
              Generating improvement datasets...
            </p>
            <p style={{ color: "#64748b", fontSize: "13px" }}>
              Creating 3 difficulty levels per failed stressor. Takes ~12 seconds.
            </p>
          </div>
        )}

        {ev.status === "ready" && !generating && loaded && datasets.length === 0 && (
          <div style={{
            background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "12px",
            padding: "64px 20px", textAlign: "center",
          }}>
            <CheckCircle size={32} color="#10b981" style={{ margin: "0 auto 16px" }} />
            <p style={{ color: "#10b981", fontWeight: 600, marginBottom: "6px" }}>
              {failedCount === 0 ? "All stressors passed!" : "No datasets yet"}
            </p>
            <p style={{ color: "#64748b", fontSize: "13px", marginBottom: "20px" }}>
              {failedCount === 0
                ? "Your model is robust — no improvement data needed."
                : "Click Generate Datasets above to create improvement training data."}
            </p>
            {failedCount > 0 && (
              <Button onClick={handleGenerate} variant="primary">
                <Zap size={13} /> Generate Datasets
              </Button>
            )}
          </div>
        )}

        {/* ── Dataset cards ── */}
        {!generating && datasets.length > 0 && (
          <>
            <p style={{ fontSize: "13px", color: "#64748b", fontFamily: MONO, marginBottom: "16px" }}>
              {datasets.length} improvement dataset{datasets.length !== 1 ? "s" : ""} — each contains 3 difficulty levels
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {datasets.map((ds: any) => {
                const stressor  = (ds.target_stressor || "").replace(/_/g, " ");
                const isFailed  = ds.description?.includes("FAILED");
                const sc        = severityColor(isFailed ? "FAILED STRESSOR" : "PREVENTIVE");
                const tip       = ds.description?.split("Tip:")?.[1]?.trim();
                const desc      = ds.description?.split("Tip:")?.[0]?.trim();

                return (
                  <div
                    key={ds.id}
                    style={{
                      background: "#0d1117",
                      border: `1px solid ${sc.border}30`,
                      borderRadius: "14px", padding: "20px",
                      transition: "border-color 150ms",
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = sc.border}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = sc.border + "30"}
                  >
                    {/* Card header */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "14px" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                          <span style={{
                            padding: "2px 8px", borderRadius: "4px", fontSize: "10px",
                            fontFamily: MONO, fontWeight: 700,
                            background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text,
                          }}>
                            {isFailed ? "FAILED STRESSOR" : "PREVENTIVE"}
                          </span>
                          <span style={{
                            padding: "2px 8px", borderRadius: "4px", fontSize: "10px",
                            fontFamily: MONO, color: "#64748b",
                            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                          }}>
                            {stressor}
                          </span>
                        </div>
                        <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#fff", margin: 0 }}>
                          {ds.name}
                        </h3>
                      </div>
                      <button
                        onClick={() => handleDownload(ds.id, ds.name || stressor)}
                        style={{
                          marginLeft: "12px", flexShrink: 0,
                          display: "flex", alignItems: "center", gap: "6px",
                          padding: "7px 14px", background: "#3b82f6",
                          border: "none", color: "#fff", fontSize: "12px",
                          fontFamily: MONO, fontWeight: 700,
                          borderRadius: "8px", cursor: "pointer",
                        }}>
                        <Download size={12} /> ZIP
                      </button>
                    </div>

                    {/* Difficulty pills */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px" }}>
                      {["easy", "medium", "hard"].map(level => {
                        const dc = diffColor(level);
                        return (
                          <span key={level} style={{
                            padding: "3px 10px", borderRadius: "9999px", fontSize: "10px",
                            fontFamily: MONO, background: dc.bg,
                            border: `1px solid ${dc.border}`, color: dc.text,
                          }}>
                            {level}
                          </span>
                        );
                      })}
                      <span style={{ fontSize: "10px", color: "#374151", fontFamily: MONO }}>
                        3 difficulty levels inside
                      </span>
                    </div>

                    {/* Description */}
                    {desc && (
                      <p style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.6, marginBottom: "12px" }}>
                        {desc}
                      </p>
                    )}

                    {/* Retraining tip */}
                    {tip && (
                      <div style={{
                        padding: "10px 14px",
                        background: "rgba(59,130,246,0.06)",
                        borderRadius: "8px", border: "1px solid rgba(59,130,246,0.15)",
                        marginBottom: "14px",
                      }}>
                        <p style={{ fontSize: "11px", color: "#93c5fd", margin: 0, lineHeight: 1.7 }}>
                          <span style={{ fontWeight: 700 }}>Retraining tip: </span>{tip}
                        </p>
                      </div>
                    )}

                    {/* Stats row */}
                    <div style={{ display: "flex", gap: "16px", fontSize: "11px", fontFamily: MONO }}>
                      {ds.sample_count != null && (
                        <span style={{ color: "#3b82f6" }}>{ds.sample_count.toLocaleString()} samples</span>
                      )}
                      {ds.size_bytes != null && (
                        <span style={{ color: "#374151" }}>
                          {ds.size_bytes > 1048576
                            ? (ds.size_bytes / 1048576).toFixed(1) + " MB"
                            : (ds.size_bytes / 1024).toFixed(0) + " KB"}
                        </span>
                      )}
                      <span style={{ color: "#374151" }}>50% clean + 50% augmented</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* How to use footer */}
            <div style={{
              marginTop: "28px", background: "#0a0a0a",
              border: "1px solid #1a1a1a", borderRadius: "12px", padding: "20px 24px",
            }}>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "#fff", marginBottom: "12px" }}>
                How to use these datasets
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                {[
                  { step: "1", text: "Download the ZIP for each failed stressor" },
                  { step: "2", text: "Start with the medium/ difficulty folder" },
                  { step: "3", text: "Mix 30% augmented + 70% original training data" },
                  { step: "4", text: "Retrain for 10–20 epochs" },
                  { step: "5", text: "Add hard/ difficulty after 5 epochs" },
                  { step: "6", text: "Re-run the evaluation to verify improvement" },
                ].map(item => (
                  <div key={item.step} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <span style={{
                      width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0,
                      background: "#1e3a5f", border: "1px solid #3b82f6",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "11px", fontWeight: 700, color: "#3b82f6", fontFamily: MONO,
                    }}>
                      {item.step}
                    </span>
                    <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0, lineHeight: 1.6 }}>
                      {item.text}
                    </p>
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
