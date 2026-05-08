import React from "react";
import { Loader2 } from "lucide-react";
import { STATUS_LABELS, STATUS_COLORS } from "../api/client";

// ─── Status Badge ─────────────────────────────────────────────────────────────

export function StatusBadge({ status }: { status: string }) {
  const colorClass = STATUS_COLORS[status] || STATUS_COLORS.created;
  const label = STATUS_LABELS[status] || status;
  const isActive = ["training_lora", "scanning", "generating", "labeling"].includes(status);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-mono ${colorClass}`}>
      {isActive && <Loader2 size={10} className="animate-spin" />}
      {!isActive && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {label}
    </span>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

export function ProgressBar({
  progress,
  label,
  color = "teal",
}: {
  progress: number;
  label?: string;
  color?: "teal" | "blue" | "amber";
}) {
  const colorMap = {
    teal: "bg-emerald-400",
    blue: "bg-blue-400",
    amber: "bg-amber-400",
  };
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-1.5">
          <span className="text-xs font-mono text-gray-400">{label}</span>
          <span className="text-xs font-mono text-emerald-400">{progress}%</span>
        </div>
      )}
      <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className={`h-full ${colorMap[color]} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function Card({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-[#13161c] border border-white/[0.07] rounded-xl p-5 ${onClick ? "cursor-pointer hover:border-white/[0.15] transition-colors" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-[0.15em] mb-1">
      {children}
    </p>
  );
}

// ─── Confidence Bar ───────────────────────────────────────────────────────────

export function ConfidenceBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(value * 100);
  const color = pct < 40 ? "bg-red-400" : pct < 60 ? "bg-amber-400" : "bg-emerald-400";
  const textColor = pct < 40 ? "text-red-400" : pct < 60 ? "text-amber-400" : "text-emerald-400";
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-mono text-gray-300">{label}</span>
        <span className={`text-xs font-mono font-medium ${textColor}`}>{pct}%</span>
      </div>
      <div className="w-full h-2 bg-white/[0.05] rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────

export function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}) {
  const base = "inline-flex items-center gap-2 font-mono rounded-lg transition-all border";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-6 py-3 text-sm" };
  const variants = {
    primary: "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-400 disabled:opacity-40",
    secondary: "bg-white/[0.04] border-white/10 text-gray-300 hover:bg-white/[0.08] disabled:opacity-40",
    danger: "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 disabled:opacity-40",
    ghost: "bg-transparent border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]",
  };
  return (
    <button
      onClick={(e) => onClick && onClick(e)}
      disabled={disabled || loading}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

export function EmptyState({ icon, title, description, action }: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {icon && <div className="mb-4 text-gray-600">{icon}</div>}
      <h3 className="font-display font-semibold text-gray-300 mb-2">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-6 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

export function StatCard({ label, value, color = "white" }: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4 text-center">
      <div className={`text-2xl font-display font-bold mb-1 ${color}`}>{value}</div>
      <div className="text-xs font-mono text-gray-500 uppercase tracking-wider">{label}</div>
    </div>
  );
}
