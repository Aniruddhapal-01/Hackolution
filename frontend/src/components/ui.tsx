import React from "react";
import { Loader2, CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";
import { EvaluationStatus, RiskLevel, STATUS_LABELS, STATUS_COLORS, RISK_COLORS, RISK_BG } from "../api/client";

export function StatusBadge({ status }: { status: EvaluationStatus }) {
  const colorClass = STATUS_COLORS[status] || STATUS_COLORS.created;
  const label = STATUS_LABELS[status] || status;
  const isActive = ["analyzing","fetching_data","stress_testing","generating_report"].includes(status);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-mono font-semibold ${colorClass}`}>
      {isActive ? <Loader2 size={10} className="animate-spin" /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {label}
    </span>
  );
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  const icons: Record<RiskLevel, React.ReactNode> = {
    low: <CheckCircle size={12}/>, medium: <Info size={12}/>,
    high: <AlertTriangle size={12}/>, critical: <XCircle size={12}/>
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md border text-[11px] font-mono font-bold uppercase tracking-wider ${RISK_BG[level]} ${RISK_COLORS[level]}`}>
      {icons[level]} {level}
    </span>
  );
}

export function ProgressBar({ progress, label, color = "blue" }: {
  progress: number; label?: string; color?: "blue"|"emerald"|"amber"|"violet";
}) {
  const colorMap = { blue:"bg-blue-500", emerald:"bg-emerald-500", amber:"bg-amber-500", violet:"bg-violet-500" };
  const textMap  = { blue:"text-blue-400", emerald:"text-emerald-400", amber:"text-amber-400", violet:"text-violet-400" };
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-1.5">
          <span className="text-xs font-mono text-slate-400">{label}</span>
          <span className={`text-xs font-mono font-bold ${textMap[color]}`}>{progress}%</span>
        </div>
      )}
      <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div className={`h-full ${colorMap[color]} rounded-full transition-all duration-700`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
      </div>
    </div>
  );
}

export function Card({ children, className = "", onClick, glow }: {
  children: React.ReactNode; className?: string; onClick?: () => void; glow?: string;
}) {
  return (
    <div onClick={onClick}
      className={`bg-[#0d1117] border border-white/[0.07] rounded-xl p-5 transition-all duration-200 hover:border-white/[0.12] hover:shadow-lg ${onClick ? "cursor-pointer" : ""} ${className}`}>
      {children}
    </div>
  );
}

export function Button({ children, onClick, variant = "primary", size = "md", disabled = false, loading = false, className = "", type = "button" }: {
  children: React.ReactNode; onClick?: (e: React.MouseEvent) => void;
  variant?: "primary"|"secondary"|"danger"|"ghost"|"success";
  size?: "sm"|"md"|"lg"; disabled?: boolean; loading?: boolean; className?: string; type?: "button"|"submit";
}) {
  const base = "inline-flex items-center gap-2 font-mono font-semibold rounded-lg transition-all duration-150 border focus:outline-none";
  const sizes = { sm:"px-3 py-1.5 text-xs", md:"px-4 py-2 text-sm", lg:"px-6 py-3 text-sm" };
  const variants = {
    primary:   "bg-blue-600 border-blue-500 text-white hover:bg-blue-500 disabled:opacity-40",
    secondary: "bg-white/[0.05] border-white/10 text-slate-300 hover:bg-white/[0.09] disabled:opacity-40",
    danger:    "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 disabled:opacity-40",
    ghost:     "bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]",
    success:   "bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500 disabled:opacity-40",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}

export function Input({ label, value, onChange, placeholder, type = "text", required, className = "" }: {
  label?: string; value: string | number; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean; className?: string;
}) {
  return (
    <div className={className}>
      {label && <label className="block text-xs font-mono text-slate-400 mb-1.5">{label}{required && <span className="text-red-400 ml-1">*</span>}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={required}
        className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-colors" />
    </div>
  );
}

export function Select({ label, value, onChange, options, required, className = "" }: {
  label?: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; required?: boolean; className?: string;
}) {
  return (
    <div className={className}>
      {label && <label className="block text-xs font-mono text-slate-400 mb-1.5">{label}{required && <span className="text-red-400 ml-1">*</span>}</label>}
      <select value={value} onChange={e => onChange(e.target.value)} required={required}
        className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/60 transition-colors">
        <option value="">Select...</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function MetricCard({ label, value, sub, color = "blue" }: {
  label: string; value: string | number; sub?: string;
  color?: "blue"|"emerald"|"amber"|"violet"|"red";
}) {
  const colorMap = { blue:"text-blue-400", emerald:"text-emerald-400", amber:"text-amber-400", violet:"text-violet-400", red:"text-red-400" };
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
      <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-2xl font-bold font-mono ${colorMap[color]}`}>{value}</p>
      {sub && <p className="text-[10px] text-slate-600 mt-1">{sub}</p>}
    </div>
  );
}

export function SectionHeader({ step, title, subtitle }: { step?: number; title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      {step !== undefined && (
        <div className="flex items-center gap-2 mb-2">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">{step}</span>
          <span className="text-xs font-mono text-blue-400 uppercase tracking-widest">Step {step}</span>
        </div>
      )}
      <h2 className="text-xl font-bold text-white">{title}</h2>
      {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: {
  icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {icon && <div className="mb-4 text-slate-600">{icon}</div>}
      <h3 className="font-semibold text-slate-300 mb-2">{title}</h3>
      {description && <p className="text-sm text-slate-500 mb-6 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}

export function ConfidenceBar({ value, label }: { value: number; label: string }) {
  const pct   = Math.round(value * 100);
  const color = pct < 40 ? "bg-red-500" : pct < 60 ? "bg-amber-500" : "bg-emerald-500";
  const text  = pct < 40 ? "text-red-400" : pct < 60 ? "text-amber-400" : "text-emerald-400";
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-mono text-slate-400">{label}</span>
        <span className={`text-xs font-mono font-bold ${text}`}>{pct}%</span>
      </div>
      <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function PipelineSteps({ currentStatus }: { currentStatus: EvaluationStatus }) {
  const steps = [
    { key: "created",           label: "Upload"    },
    { key: "analyzing",         label: "Analysis"  },
    { key: "fetching_data",     label: "Datasets"  },
    { key: "stress_testing",    label: "Testing"   },
    { key: "generating_report", label: "Report"    },
    { key: "ready",             label: "Done"      },
  ];
  const order = steps.map(s => s.key);
  const currentIdx = order.indexOf(currentStatus);
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const done   = i < currentIdx || currentStatus === "ready";
        const active = order[i] === currentStatus && currentStatus !== "ready";
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                done   ? "bg-emerald-600 border-emerald-500 text-white" :
                active ? "bg-blue-600 border-blue-400 text-white animate-pulse" :
                         "bg-white/[0.04] border-white/10 text-slate-600"
              }`}>{done ? "✓" : i + 1}</div>
              <span className={`text-[9px] font-mono uppercase tracking-wider ${
                done ? "text-emerald-400" : active ? "text-blue-400" : "text-slate-600"
              }`}>{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-px w-6 mb-4 transition-all ${done ? "bg-emerald-600" : "bg-white/[0.06]"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
