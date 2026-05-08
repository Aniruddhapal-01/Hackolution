import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, Settings } from "lucide-react";

interface TopNavBarProps { evaluationId?: string; projectId?: string; }

export default function TopNavBar({ evaluationId, projectId }: TopNavBarProps) {
  const id   = evaluationId || projectId;
  const path = useLocation().pathname;

  const navItems = [
    { label: "Dashboard",   href: "/evaluations",                           active: path === "/evaluations" },
    { label: "Analysis",    href: id ? `/evaluations/${id}` : null,         active: id ? path === `/evaluations/${id}` : false },
    { label: "Stress Test", href: id ? `/evaluations/${id}/stress` : null,  active: id ? path.includes("/stress") : false },
    { label: "Datasets",    href: id ? `/evaluations/${id}/datasets` : null,active: id ? path.includes("/datasets") : false },
    { label: "Report",      href: id ? `/evaluations/${id}/report` : null,  active: id ? path.includes("/report") : false },
  ];

  return (
    <header style={{
      position: "fixed", top: 0, left: "256px", right: 0, zIndex: 40,
      height: "64px", background: "#000000", borderBottom: "2px solid #facc15",
      display: "flex", alignItems: "center", padding: "0 24px", gap: "24px",
      fontFamily: "'Google Sans', sans-serif",
    }}>
      {/* Live indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginRight: "8px" }}>
        <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10b981" }} />
        <span style={{ fontSize: "13px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.2em", fontFamily: "'JetBrains Mono', monospace" }}>
          Live
        </span>
      </div>

      {/* Nav links */}
      <nav style={{ display: "flex", alignItems: "center", gap: "4px", flex: 1 }}>
        {navItems.map(item =>
          item.href ? (
            <Link
              key={item.label}
              to={item.href}
              style={{
                padding: "6px 14px", borderRadius: "6px", textDecoration: "none",
                fontSize: "14px", fontWeight: 600, transition: "all 150ms",
                background: item.active ? "#facc15" : "transparent",
                color: item.active ? "#000" : "#cbd5e1",
                border: item.active ? "none" : "1px solid transparent",
              }}
              onMouseEnter={e => { if (!item.active) { (e.currentTarget as HTMLAnchorElement).style.color = "#fff"; (e.currentTarget as HTMLAnchorElement).style.background = "#111"; } }}
              onMouseLeave={e => { if (!item.active) { (e.currentTarget as HTMLAnchorElement).style.color = "#cbd5e1"; (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; } }}
            >
              {item.label}
            </Link>
          ) : (
            <span
              key={item.label}
              style={{ padding: "6px 14px", fontSize: "14px", color: "#64748b", cursor: "not-allowed" }}
            >
              {item.label}
            </span>
          )
        )}
      </nav>

      {/* Right icons */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <Bell size={16} style={{ color: "#94a3b8", cursor: "pointer" }} />
        <Settings size={16} style={{ color: "#94a3b8", cursor: "pointer" }} />
      </div>
    </header>
  );
}
