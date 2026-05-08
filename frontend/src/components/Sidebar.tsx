import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, LayoutDashboard, Cpu, Trash2 } from "lucide-react";
import { Evaluation, ACTIVE_STATUSES } from "../api/client";

interface SidebarProps {
  evaluations?: Evaluation[];
  activeId?: string;
  onNew?: () => void;
  onDelete?: (id: string) => void;
}

const DOT: Record<string, string> = {
  active:  "#facc15",
  ready:   "#10b981",
  failed:  "#ef4444",
  default: "#94a3b8",
};

export default function Sidebar({ evaluations = [], activeId, onNew, onDelete }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside style={{
      position: "fixed", left: 0, top: 0, height: "100%", width: "256px",
      background: "#000000", borderRight: "2px solid #facc15",
      zIndex: 50, display: "flex", flexDirection: "column",
      fontFamily: "'Google Sans', sans-serif",
    }}>

      {/* Logo */}
      <div
        onClick={() => navigate("/")}
        style={{
          padding: "20px", borderBottom: "1px solid #1a1a1a",
          cursor: "pointer", display: "flex", alignItems: "center", gap: "10px",
        }}
      >
        <div style={{
          width: "32px", height: "32px", background: "#facc15",
          borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Cpu size={16} color="#000" />
        </div>
        <div>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "#fff", lineHeight: 1 }}>BlindSpot.AI</p>
          <p style={{ fontSize: "13px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.15em", marginTop: "3px", fontFamily: "'JetBrains Mono', monospace" }}>
            Robustness Platform
          </p>
        </div>
      </div>

      {/* Dashboard nav */}
      <nav style={{ padding: "12px", borderBottom: "1px solid #1a1a1a" }}>
        <button
          onClick={() => navigate("/evaluations")}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: "10px",
            padding: "8px 12px", borderRadius: "8px", border: "none", cursor: "pointer",
            fontSize: "13px", fontWeight: 600, fontFamily: "'Google Sans', sans-serif",
            background: location.pathname === "/evaluations" ? "#facc15" : "transparent",
            color: location.pathname === "/evaluations" ? "#000" : "#cbd5e1",
            transition: "all 150ms",
          }}
          onMouseEnter={e => { if (location.pathname !== "/evaluations") (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
          onMouseLeave={e => { if (location.pathname !== "/evaluations") (e.currentTarget as HTMLButtonElement).style.color = "#cbd5e1"; }}
        >
          <LayoutDashboard size={15} />
          Dashboard
        </button>
      </nav>

      {/* New Evaluation */}
      <div style={{ padding: "12px", borderBottom: "1px solid #1a1a1a" }}>
        <button
          onClick={onNew}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            padding: "8px 12px", borderRadius: "8px", cursor: "pointer",
            fontSize: "14px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
            background: "#facc15", color: "#000", border: "none",
            transition: "opacity 150ms",
          }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = "1"}
        >
          <Plus size={14} /> New Evaluation
        </button>
      </div>

      {/* Evaluations list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
        <p style={{
          fontSize: "13px", color: "#94a3b8", textTransform: "uppercase",
          letterSpacing: "0.2em", padding: "0 8px", marginBottom: "8px",
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          Recent Evaluations
        </p>

        {evaluations.map(ev => {
          const isActive  = ACTIVE_STATUSES.includes(ev.status as any);
          const isCurrent = ev.id === activeId;
          const dotColor  = isActive ? DOT.active : ev.status === "ready" ? DOT.ready : ev.status === "failed" ? DOT.failed : DOT.default;

          return (
            <div
              key={ev.id}
              onClick={() => navigate(`/evaluations/${ev.id}`)}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "10px 12px", borderRadius: "8px", cursor: "pointer",
                marginBottom: "2px",
                background: isCurrent ? "#111111" : "transparent",
                border: isCurrent ? "1px solid #facc15" : "1px solid transparent",
                transition: "all 150ms",
              }}
              className="group"
            >
              <div style={{
                width: "7px", height: "7px", borderRadius: "50%",
                background: dotColor, flexShrink: 0,
                animation: isActive ? "pulse 2s infinite" : "none",
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {ev.name}
                </p>
                <p style={{ fontSize: "13px", color: "#94a3b8", textTransform: "capitalize", fontFamily: "'JetBrains Mono', monospace", marginTop: "2px" }}>
                  {ev.status.replace(/_/g, " ")}
                </p>
              </div>
              {onDelete && (
                <button
                  onClick={e => { e.stopPropagation(); onDelete(ev.id); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: "2px", opacity: 0, transition: "opacity 150ms" }}
                  className="group-hover:opacity-100"
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8"; (e.currentTarget as HTMLButtonElement).style.opacity = "0"; }}
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          );
        })}

        {evaluations.length === 0 && (
          <p style={{ fontSize: "13px", color: "#64748b", textAlign: "center", padding: "16px 8px", fontFamily: "'JetBrains Mono', monospace" }}>
            No evaluations yet
          </p>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "16px", borderTop: "1px solid #1a1a1a", display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10b981" }} />
        <span style={{ fontSize: "13px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.15em", fontFamily: "'JetBrains Mono', monospace" }}>
          API Connected
        </span>
      </div>
    </aside>
  );
}
