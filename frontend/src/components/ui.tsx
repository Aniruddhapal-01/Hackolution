import React from "react";
import { Loader2, CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";
import { EvaluationStatus, RiskLevel, STATUS_LABELS } from "../api/client";

const FONT = "'Google Sans', 'Inter', sans-serif";
const MONO = "'JetBrains Mono', monospace";

// Readable color palette — nothing below #94a3b8 on black backgrounds
const C = {
  text:     "#f1f5f9",   // primary text — near white
  sub:      "#cbd5e1",   // secondary text — light slate
  muted:    "#94a3b8",   // muted text — still readable
  label:    "#facc15",   // section labels — yellow
  border:   "#2d2d2d",   // card borders
  card:     "#0f0f0f",   // card background
  cardHov:  "#161616",   // card hover
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: EvaluationStatus }) {
  const isActive = ["analyzing","fetching_data","stress_testing","generating_report"].includes(status);
  const colors: Record<string, { bg: string; color: string; border: string }> = {
    created:           { bg: "#1a1a1a", color: "#94a3b8", border: "#64748b" },
    analyzing:         { bg: "#2a2000", color: "#facc15", border: "#facc15" },
    fetching_data:     { bg: "#1a0030", color: "#c084fc", border: "#a855f7" },
    stress_testing:    { bg: "#2a1500", color: "#fbbf24", border: "#f59e0b" },
    generating_report: { bg: "#002a2a", color: "#22d3ee", border: "#06b6d4" },
    ready:             { bg: "#002a10", color: "#34d399", border: "#10b981" },
    failed:            { bg: "#2a0000", color: "#f87171", border: "#ef4444" },
  };
  const c = colors[status] || colors.created;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      padding: "4px 12px", borderRadius: "9999px",
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      fontSize: "14px", fontWeight: 700, fontFamily: MONO,
      textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap",
    }}>
      {isActive
        ? <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} />
        : <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: c.color, display: "inline-block" }} />
      }
      {STATUS_LABELS[status] || status}
    </span>
  );
}

// ─── Risk Badge ───────────────────────────────────────────────────────────────
export function RiskBadge({ level }: { level: RiskLevel }) {
  const map: Record<RiskLevel, { bg: string; color: string; icon: React.ReactNode }> = {
    low:      { bg: "#002a10", color: "#34d399", icon: <CheckCircle size={11}/> },
    medium:   { bg: "#2a2000", color: "#fbbf24", icon: <Info size={11}/> },
    high:     { bg: "#2a1500", color: "#fb923c", icon: <AlertTriangle size={11}/> },
    critical: { bg: "#2a0000", color: "#f87171", icon: <XCircle size={11}/> },
  };
  const c = map[level];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "4px 12px", borderRadius: "9999px",
      background: c.bg, color: c.color, border: `1px solid ${c.color}`,
      fontSize: "14px", fontWeight: 700, fontFamily: MONO,
      textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap",
    }}>
      {c.icon} {level}
    </span>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
export function ProgressBar({ progress, label, color = "yellow" }: {
  progress: number; label?: string; color?: "yellow"|"green"|"red"|"blue"|"purple";
}) {
  const colorMap = { yellow: "#facc15", green: "#10b981", red: "#ef4444", blue: "#3b82f6", purple: "#a855f7" };
  const c = colorMap[color];
  return (
    <div style={{ width: "100%" }}>
      {label && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={{ fontSize: "13px", color: C.sub, fontFamily: MONO }}>{label}</span>
          <span style={{ fontSize: "13px", fontWeight: 700, color: c, fontFamily: MONO }}>{progress}%</span>
        </div>
      )}
      <div style={{ width: "100%", height: "5px", background: "#2d2d2d", borderRadius: "9999px", overflow: "hidden" }}>
        <div style={{
          height: "100%", background: c, borderRadius: "9999px",
          width: `${Math.min(100, Math.max(0, progress))}%`,
          transition: "width 700ms ease",
        }} />
      </div>
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className = "", onClick, style }: {
  children: React.ReactNode; className?: string; onClick?: () => void; style?: React.CSSProperties;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px",
        padding: "22px", transition: "border-color 150ms, background 150ms",
        cursor: onClick ? "pointer" : "default", ...style,
      }}
      onMouseEnter={e => {
        if (onClick) {
          (e.currentTarget as HTMLDivElement).style.borderColor = "#facc15";
          (e.currentTarget as HTMLDivElement).style.background = C.cardHov;
        }
      }}
      onMouseLeave={e => {
        if (onClick) {
          (e.currentTarget as HTMLDivElement).style.borderColor = C.border;
          (e.currentTarget as HTMLDivElement).style.background = C.card;
        }
      }}
      className={className}
    >
      {children}
    </div>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
export function Button({ children, onClick, variant = "primary", size = "md", disabled = false, loading = false, className = "", type = "button" }: {
  children: React.ReactNode; onClick?: (e: React.MouseEvent) => void;
  variant?: "primary"|"secondary"|"danger"|"ghost"|"success";
  size?: "sm"|"md"|"lg"; disabled?: boolean; loading?: boolean; className?: string; type?: "button"|"submit";
}) {
  const sizes = {
    sm: { padding: "7px 16px",  fontSize: "13px" },
    md: { padding: "10px 20px", fontSize: "14px" },
    lg: { padding: "13px 28px", fontSize: "15px" },
  };
  const variants: Record<string, React.CSSProperties> = {
    primary:   { background: "#facc15", color: "#000", border: "2px solid #facc15" },
    secondary: { background: "transparent", color: "#f1f5f9", border: "2px solid #4b5563" },
    danger:    { background: "transparent", color: "#f87171", border: "2px solid #ef4444" },
    ghost:     { background: "transparent", color: "#94a3b8", border: "2px solid transparent" },
    success:   { background: "#10b981", color: "#000", border: "2px solid #10b981" },
  };
  return (
    <button
      type={type} onClick={onClick} disabled={disabled || loading}
      style={{
        display: "inline-flex", alignItems: "center", gap: "7px",
        fontFamily: FONT, fontWeight: 700, borderRadius: "8px",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled || loading ? 0.45 : 1,
        transition: "all 150ms", whiteSpace: "nowrap",
        ...sizes[size], ...variants[variant],
      }}
      className={className}
    >
      {loading && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
      {children}
    </button>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input({ label, value, onChange, placeholder, type = "text", required, className = "", style }: {
  label?: string; value: string | number; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean; className?: string; style?: React.CSSProperties;
}) {
  return (
    <div className={className} style={style}>
      {label && (
        <label style={{ display: "block", fontSize: "14px", color: C.sub, marginBottom: "7px", fontFamily: MONO, fontWeight: 600 }}>
          {label}{required && <span style={{ color: "#f87171", marginLeft: "4px" }}>*</span>}
        </label>
      )}
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={required}
        style={{
          width: "100%", background: "#111", border: `1px solid ${C.border}`,
          borderRadius: "8px", padding: "10px 14px", fontSize: "14px",
          color: C.text, fontFamily: FONT, outline: "none",
          transition: "border-color 150ms",
        }}
        onFocus={e => (e.target as HTMLInputElement).style.borderColor = "#facc15"}
        onBlur={e => (e.target as HTMLInputElement).style.borderColor = C.border}
      />
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────
export function Select({ label, value, onChange, options, required, className = "" }: {
  label?: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; required?: boolean; className?: string;
}) {
  return (
    <div className={className}>
      {label && (
        <label style={{ display: "block", fontSize: "14px", color: C.sub, marginBottom: "7px", fontFamily: MONO, fontWeight: 600 }}>
          {label}{required && <span style={{ color: "#f87171", marginLeft: "4px" }}>*</span>}
        </label>
      )}
      <select
        value={value} onChange={e => onChange(e.target.value)} required={required}
        style={{
          width: "100%", background: "#111", border: `1px solid ${C.border}`,
          borderRadius: "8px", padding: "10px 14px", fontSize: "14px",
          color: C.text, fontFamily: FONT, outline: "none",
          transition: "border-color 150ms",
        }}
        onFocus={e => (e.target as HTMLSelectElement).style.borderColor = "#facc15"}
        onBlur={e => (e.target as HTMLSelectElement).style.borderColor = C.border}
      >
        <option value="" style={{ background: "#111", color: C.muted }}>Select...</option>
        {options.map(o => <option key={o.value} value={o.value} style={{ background: "#111", color: C.text }}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────
export function MetricCard({ label, value, sub, color = "yellow" }: {
  label: string; value: string | number; sub?: string;
  color?: "yellow"|"green"|"red"|"blue"|"purple"|"orange";
}) {
  const colorMap = { yellow: "#facc15", green: "#10b981", red: "#ef4444", blue: "#3b82f6", purple: "#a855f7", orange: "#f97316" };
  const c = colorMap[color];
  return (
    <div style={{ background: C.card, border: `1px solid ${c}`, borderRadius: "14px", padding: "20px" }}>
      <p style={{ fontSize: "14px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px", fontFamily: MONO, fontWeight: 600 }}>{label}</p>
      <p style={{ fontSize: "30px", fontWeight: 700, color: c, fontFamily: MONO, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: "14px", color: C.sub, marginTop: "6px", fontFamily: MONO }}>{sub}</p>}
    </div>
  );
}

// ─── Section Label (replaces tiny uppercase labels) ───────────────────────────
export function SectionLabel({ children, color = "#facc15" }: { children: React.ReactNode; color?: string }) {
  return (
    <p style={{ fontSize: "14px", color, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: MONO, fontWeight: 700, marginBottom: "16px" }}>
      {children}
    </p>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
export function SectionHeader({ step, title, subtitle }: { step?: number; title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      {step !== undefined && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#facc15", color: "#000", fontSize: "14px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO }}>{step}</span>
          <span style={{ fontSize: "14px", color: "#facc15", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: MONO, fontWeight: 700 }}>Step {step}</span>
        </div>
      )}
      <h2 style={{ fontSize: "22px", fontWeight: 700, color: C.text, fontFamily: FONT }}>{title}</h2>
      {subtitle && <p style={{ fontSize: "14px", color: C.sub, marginTop: "6px" }}>{subtitle}</p>}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: {
  icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", textAlign: "center" }}>
      {icon && <div style={{ marginBottom: "20px", color: "#94a3b8" }}>{icon}</div>}
      <h3 style={{ fontWeight: 700, fontSize: "18px", color: C.text, marginBottom: "10px", fontFamily: FONT }}>{title}</h3>
      {description && <p style={{ fontSize: "14px", color: C.sub, marginBottom: "28px", maxWidth: "360px", lineHeight: 1.6 }}>{description}</p>}
      {action}
    </div>
  );
}

// ─── Confidence Bar ───────────────────────────────────────────────────────────
export function ConfidenceBar({ value, label }: { value: number; label: string }) {
  const pct   = Math.round(value * 100);
  const color = pct < 40 ? "#ef4444" : pct < 60 ? "#f59e0b" : "#10b981";
  return (
    <div style={{ marginBottom: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
        <span style={{ fontSize: "13px", color: C.sub, fontFamily: MONO, textTransform: "capitalize" }}>{label}</span>
        <span style={{ fontSize: "13px", fontWeight: 700, color, fontFamily: MONO }}>{pct}%</span>
      </div>
      <div style={{ width: "100%", height: "5px", background: "#2d2d2d", borderRadius: "9999px", overflow: "hidden" }}>
        <div style={{ height: "100%", background: color, borderRadius: "9999px", width: `${pct}%`, transition: "width 700ms ease" }} />
      </div>
    </div>
  );
}

// ─── Pipeline Steps ───────────────────────────────────────────────────────────
export function PipelineSteps({ currentStatus }: { currentStatus: EvaluationStatus }) {
  const steps = [
    { key: "created",           label: "Upload"   },
    { key: "analyzing",         label: "Analysis" },
    { key: "fetching_data",     label: "Datasets" },
    { key: "stress_testing",    label: "Testing"  },
    { key: "generating_report", label: "Report"   },
    { key: "ready",             label: "Done"     },
  ];
  const order = steps.map(s => s.key);
  const currentIdx = order.indexOf(currentStatus);

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {steps.map((step, i) => {
        const done   = i < currentIdx || currentStatus === "ready";
        const active = order[i] === currentStatus && currentStatus !== "ready";
        return (
          <React.Fragment key={step.key}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "14px", fontWeight: 700, fontFamily: MONO,
                background: done ? "#facc15" : active ? "#facc15" : "#1a1a1a",
                color: done || active ? "#000" : "#cbd5e1",
                border: done || active ? "none" : `1px solid #374151`,
              }}>
                {done ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: "13px", fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.08em", color: done || active ? "#facc15" : "#cbd5e1", whiteSpace: "nowrap" }}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ height: "2px", width: "28px", marginBottom: "18px", background: done ? "#facc15" : "#2d2d2d", transition: "background 300ms" }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Export color constants for use in pages
export { C, FONT, MONO };
