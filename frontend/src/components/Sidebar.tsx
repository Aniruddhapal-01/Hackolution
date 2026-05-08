import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, LayoutDashboard, Cpu, ChevronRight, Trash2, Activity } from "lucide-react";
import { Evaluation, STATUS_COLORS, ACTIVE_STATUSES } from "../api/client";

interface SidebarProps {
  evaluations?: Evaluation[];
  activeId?: string;
  onNew?: () => void;
  onDelete?: (id: string) => void;
}

export default function Sidebar({ evaluations = [], activeId, onNew, onDelete }: SidebarProps) {
  const navigate  = useNavigate();
  const location  = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#080b10] border-r border-white/[0.06] z-50 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.06] cursor-pointer" onClick={() => navigate("/")}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <Cpu size={14} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">BlindSpot.AI</p>
            <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest mt-0.5">Robustness Platform</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="px-3 py-4 border-b border-white/[0.06]">
        <button onClick={() => navigate("/evaluations")}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            location.pathname === "/evaluations"
              ? "bg-blue-600/15 text-blue-300 border border-blue-500/20"
              : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]"
          }`}>
          <LayoutDashboard size={15} />
          Dashboard
        </button>
      </nav>

      {/* New Evaluation */}
      <div className="px-3 py-3 border-b border-white/[0.06]">
        <button onClick={onNew}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono font-semibold text-blue-400 border border-blue-500/20 bg-blue-600/10 hover:bg-blue-600/20 transition-all">
          <Plus size={14} /> New Evaluation
        </button>
      </div>

      {/* Evaluations list */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest px-2 mb-2">Recent Evaluations</p>
        <div className="space-y-1">
          {evaluations.map(ev => {
            const isActive = ACTIVE_STATUSES.includes(ev.status as any);
            const isCurrent = ev.id === activeId;
            return (
              <div key={ev.id}
                onClick={() => navigate(`/evaluations/${ev.id}`)}
                className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                  isCurrent
                    ? "bg-white/[0.07] border border-white/[0.1]"
                    : "hover:bg-white/[0.04]"
                }`}>
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  isActive ? "bg-blue-400 animate-pulse" :
                  ev.status === "ready" ? "bg-emerald-500" :
                  ev.status === "failed" ? "bg-red-500" : "bg-slate-600"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-300 truncate">{ev.name}</p>
                  <p className="text-[9px] font-mono text-slate-600 truncate capitalize">{ev.status.replace("_"," ")}</p>
                </div>
                {onDelete && (
                  <button onClick={e => { e.stopPropagation(); onDelete(ev.id); }}
                    className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all">
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            );
          })}
          {evaluations.length === 0 && (
            <p className="text-[10px] font-mono text-slate-700 px-2 py-4 text-center">No evaluations yet</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">API Connected</span>
        </div>
      </div>
    </aside>
  );
}
