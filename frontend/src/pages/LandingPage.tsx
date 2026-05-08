import React from "react";
import { useNavigate } from "react-router-dom";
import { Cpu, Shield, Zap, BarChart3, ArrowRight, CheckCircle } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#080b10] text-slate-200">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-[#080b10]/80 backdrop-blur-md border-b border-white/[0.06] px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <Cpu size={14} className="text-white" />
          </div>
          <span className="font-bold text-white">BlindSpot.AI</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/evaluations")}
            className="text-sm text-slate-400 hover:text-white transition-colors">Dashboard</button>
          <button onClick={() => navigate("/evaluations")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-all flex items-center gap-2">
            Get Started <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-8 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-mono mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          AI Robustness Evaluation Platform v2.0
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
          Find your model's<br />
          <span className="text-blue-400">blind spots</span> before<br />
          production does.
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Upload any AI model. BlindSpot.AI analyzes vulnerabilities, fetches targeted stress-test datasets,
          runs automated robustness evaluation, and generates a deployment readiness report.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => navigate("/evaluations")}
            className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all flex items-center gap-2 text-sm">
            Start Evaluation <ArrowRight size={16} />
          </button>
          <button className="px-8 py-3.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 text-slate-300 font-semibold rounded-xl transition-all text-sm">
            View Demo
          </button>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 px-8 max-w-6xl mx-auto">
        <p className="text-center text-xs font-mono text-slate-600 uppercase tracking-widest mb-12">5-Step Evaluation Pipeline</p>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { step: 1, icon: <Cpu size={20}/>,      title: "Model Upload",     desc: "Upload .pt .pth .onnx .h5 .pkl .joblib with architecture & metrics",  color: "blue"   },
            { step: 2, icon: <Shield size={20}/>,   title: "Analysis",         desc: "Detect task type, vulnerabilities, and edge cases automatically",      color: "violet" },
            { step: 3, icon: <BarChart3 size={20}/>,title: "Dataset Fetch",    desc: "Fetch targeted datasets from Kaggle, HuggingFace, Roboflow",           color: "amber"  },
            { step: 4, icon: <Zap size={20}/>,      title: "Stress Testing",   desc: "Evaluate model against all detected stressors and edge cases",         color: "orange" },
            { step: 5, icon: <CheckCircle size={20}/>,title:"Report",          desc: "Download deployment readiness report with robustness score",           color: "emerald"},
          ].map(s => (
            <div key={s.step} className="bg-[#0d1117] border border-white/[0.07] rounded-xl p-5 relative">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-4 text-${s.color}-400 bg-${s.color}-500/10`}>
                {s.icon}
              </div>
              <div className="absolute top-4 right-4 text-[10px] font-mono text-slate-700">0{s.step}</div>
              <h3 className="font-semibold text-white mb-2 text-sm">{s.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Supported formats */}
      <section className="py-16 px-8 max-w-6xl mx-auto border-t border-white/[0.06]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "Model Formats",   items: [".pt", ".pth", ".onnx", ".h5", ".pkl", ".joblib"] },
            { label: "Dataset Types",   items: ["Image", "Tabular", "Time Series", "Sequential", "Vector"] },
            { label: "Data Sources",    items: ["Kaggle", "HuggingFace", "Roboflow", "Synthetic"] },
            { label: "Report Outputs",  items: ["Robustness Score", "Risk Level", "CSV Report", "Edge Cases"] },
          ].map(col => (
            <div key={col.label}>
              <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-3">{col.label}</p>
              <div className="space-y-1.5">
                {col.items.map(item => (
                  <div key={item} className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-blue-500" />
                    <span className="text-xs text-slate-400 font-mono">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/[0.06] py-8 px-8 text-center">
        <p className="text-xs font-mono text-slate-700">BlindSpot.AI — AI Robustness Evaluation Platform · HACKOLUTION 2026</p>
      </footer>
    </div>
  );
}
