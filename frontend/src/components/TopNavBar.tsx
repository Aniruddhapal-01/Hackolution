import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, Settings, Cpu } from "lucide-react";

interface TopNavBarProps { evaluationId?: string; projectId?: string; }

export default function TopNavBar({ evaluationId, projectId }: TopNavBarProps) {
  const id = evaluationId || projectId;
  const location = useLocation();
  const path = location.pathname;

  const navItems = [
    { label: "Dashboard",    href: "/evaluations",                                    active: path === "/evaluations" },
    { label: "Analysis",     href: id ? `/evaluations/${id}` : null,                  active: id ? path === `/evaluations/${id}` : false },
    { label: "Stress Test",  href: id ? `/evaluations/${id}/stress` : null,           active: id ? path.includes("/stress") : false },
    { label: "Datasets",     href: id ? `/evaluations/${id}/datasets` : null,         active: id ? path.includes("/datasets") : false },
    { label: "Report",       href: id ? `/evaluations/${id}/report` : null,           active: id ? path.includes("/report") : false },
  ];

  return (
    <header className="fixed top-0 left-64 right-0 z-40 h-16 bg-[#080b10]/80 backdrop-blur-md border-b border-white/[0.06] flex items-center px-6 gap-6">
      <div className="flex items-center gap-2 mr-4">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Live</span>
      </div>
      <nav className="flex items-center gap-1 flex-1">
        {navItems.map(item =>
          item.href ? (
            <Link key={item.label} to={item.href}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
                item.active
                  ? "bg-blue-600/20 text-blue-300 border border-blue-500/30"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]"
              }`}>
              {item.label}
            </Link>
          ) : (
            <span key={item.label}
              className="px-3 py-1.5 rounded-md text-xs font-mono text-slate-700 cursor-not-allowed">
              {item.label}
            </span>
          )
        )}
      </nav>
      <div className="flex items-center gap-3 text-slate-500">
        <Bell size={16} className="cursor-pointer hover:text-slate-300 transition-colors" />
        <Settings size={16} className="cursor-pointer hover:text-slate-300 transition-colors" />
      </div>
    </header>
  );
}
