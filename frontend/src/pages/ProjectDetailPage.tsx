import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../api/supabase";
import { runAdversarialScan, setModelEndpoint, uploadSeedImages } from "../api/client";
import { ArrowLeft, Plus, History, Shield, FolderOpen, Bell, Settings, Terminal, Mic, Send, Zap, CheckCircle, AlertTriangle, Scan, LogOut, Sparkles } from "lucide-react";
import TopNavBar from "../components/TopNavBar";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useProject } from "../hooks/useProject";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { project, loading, refetch } = useProject(id!, 3000);
  const [actionLoading, setActionLoading] = useState(false);
  const [modelUrl, setModelUrl] = useState("");

  const handleScan = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      if (modelUrl) await setModelEndpoint(id, modelUrl);
      await runAdversarialScan(id);
      await refetch();
    } catch (e: any) {
      alert("Scan failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center font-headline uppercase tracking-widest text-xs text-primary animate-pulse">Initializing Telemetry...</div>;
  if (!project) return <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center font-technical p-10"><div className="text-center"><p className="mb-4 text-slate-400 uppercase tracking-widest">Node Not Found</p><button className="bg-primary text-white px-6 py-2 rounded-full font-bold" onClick={() => navigate('/projects')}>Return to Dashboard</button></div></div>;

  return (
    <div className="bg-[#f7f9fb] text-[#191c1e] font-body min-h-screen selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* SIDE NAV BAR */}
      <aside className="fixed left-0 top-0 h-full w-64 border-r border-slate-200/20 bg-white/70 backdrop-blur-xl z-50 flex flex-col p-4 shadow-[0_0_40px_rgba(38,58,97,0.05)]">
        <div className="mb-10 px-4 cursor-pointer" onClick={() => navigate('/projects')}>
          <h1 className="text-xl font-display tracking-tight text-slate-900">AxiomSynth</h1>
          <p className="font-technical uppercase tracking-extrawide text-[9px] text-slate-500">AI Defense Core</p>
        </div>
        <nav className="flex-1 space-y-2">
          <button onClick={() => navigate('/projects')} className="w-full flex items-center gap-3 text-slate-500 hover:bg-slate-100 transition-all duration-300 px-4 py-2 rounded-lg group">
            <Plus size={18} />
            <span className="font-medium text-sm">New Project</span>
          </button>
          <button onClick={() => navigate('/projects')} className="w-full flex items-center gap-3 text-slate-500 hover:bg-slate-100 transition-all duration-300 px-4 py-2 rounded-lg group">
            <History size={18} />
            <span className="font-medium text-sm">Recent Scans</span>
          </button>
          <div className="flex items-center gap-3 bg-indigo-50 text-indigo-600 rounded-lg px-4 py-2 group">
            <Shield size={18} fill="currentColor" />
            <span className="font-medium text-sm">{project.name}</span>
          </div>
        </nav>
        <div className="mt-auto p-4 bg-slate-100 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">SV</div>
          <div>
            <p className="text-xs font-bold text-primary">S. VANCE</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-tight">Core Analyst</p>
          </div>
        </div>
      </aside>

      <TopNavBar projectId={id} />

      {/* MAIN CANVAS */}
      <main className="ml-64 pt-24 pb-32 px-12 min-h-screen relative overflow-hidden">
        {/* Dot Grid Background */}
        <div className="absolute inset-0 opacity-[0.15] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #c5c6cf 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        
        {/* Signature Gradient Orb */}
        <div className="absolute top-1/4 -right-32 w-[600px] h-[600px] bg-[radial-gradient(circle,_rgba(99,102,241,0.08)_0%,_rgba(105,214,201,0.05)_50%,_transparent_100%)] rounded-full blur-[120px] pointer-events-none"></div>


        {/* Page Header */}
        <section className="mb-12 flex justify-between items-end relative z-10">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-2">
              <span className={`flex h-2 w-2 rounded-full animate-pulse ${project.status === 'scanning' ? 'bg-error' : 'bg-indigo-500'}`}></span>
              <span className={`font-technical text-[10px] uppercase tracking-extrawide font-bold ${project.status === 'scanning' ? 'text-error' : 'text-indigo-600'}`}>
                {project.status === 'scanning' ? 'Scanning weights...' : 'Probing Active'}
              </span>
            </div>
            <h2 className="text-4xl font-display font-extrabold text-slate-900 tracking-tight-caps leading-none uppercase">
              AXIOMPROBE | VULNERABILITY SCAN
            </h2>
          </div>
          <div className="flex flex-col items-end gap-3 relative z-20">
            <div className="text-right">
              <p className="text-[10px] font-technical uppercase tracking-extrawide text-slate-400 font-bold">Target Architecture</p>
              <p className="font-technical font-bold text-primary uppercase text-sm tracking-tight">{project.name}_v4_DEFENSE</p>
            </div>
            <div className="flex gap-2">
              <input
                type="file"
                id="seed-upload"
                multiple
                hidden
                onChange={async (e) => {
                  if (e.target.files && id) {
                    const files = Array.from(e.target.files);
                    try {
                      await uploadSeedImages(id, files);
                      alert("Source data ingested successfully. Neural mapping updated.");
                      await refetch();
                    } catch (err) {
                      alert("Upload failed. Verify network clearance.");
                    }
                  }
                }}
              />
              <button 
                onClick={() => document.getElementById('seed-upload')?.click()}
                className="bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg shadow-lg hover:shadow-primary/20 transition-all active:scale-95 flex items-center gap-2"
              >
                <FolderOpen size={14} /> Ingest Source Data
              </button>
            </div>
          </div>
        </section>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-12 gap-8 items-start relative z-10">
          {/* LEFT COLUMN: VULNERABILITY MAP (NEW) */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            <div className="bg-white/70 glass-panel shadow-[0_0_40px_rgba(38,58,97,0.05)] border border-indigo-500/10 rounded-xl overflow-hidden p-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="font-display text-2xl font-bold text-primary mb-1 uppercase tracking-tight">Vulnerability Map</h3>
                  <p className="text-sm text-slate-500 max-w-lg font-body">8-stressor FGSM attack simulation. Red zones are critical blind spots requiring synthetic data.</p>
                </div>
                <div className="flex gap-2">
                  <a 
                    href={`http://localhost:8000/api/projects/${id}/export-report`}
                    download
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[10px] font-bold uppercase tracking-extrawide px-5 py-2.5 rounded-full border border-indigo-200 transition-all flex items-center gap-2 font-technical"
                  >
                    <Terminal size={14} /> Export Report (.XL)
                  </a>
                  <button 
                    onClick={handleScan}
                    disabled={actionLoading || project.status === 'scanning'}
                    className="bg-primary hover:bg-slate-900 text-white text-[10px] font-bold uppercase tracking-extrawide px-5 py-2.5 rounded-full shadow-lg shadow-primary/20 transition-all flex items-center gap-2 font-technical"
                  >
                    <Scan size={14} /> Re-Run Scan
                  </button>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-2 gap-8 mb-10">
                <div className="h-64 bg-slate-50/50 rounded-xl p-6 border border-slate-100 flex flex-col">
                  <p className="text-[10px] font-bold uppercase tracking-extrawide text-slate-400 mb-6 text-center font-technical">Custom Radar Chart</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                      { subject: 'Occlusion 80%', A: 19 },
                      { subject: 'Dense Fog', A: 35 },
                      { subject: 'Heavy Rain', A: 41 },
                      { subject: 'Occlusion 50%', A: 48 },
                      { subject: 'Night Mode', A: 52 },
                      { subject: 'Motion Blur', A: 58 },
                    ]}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700, fontFamily: 'Space Grotesk' }} />
                      <Radar name="Scanned" dataKey="A" stroke="#263a61" fill="#4f46e5" fillOpacity={0.6} />
                    </RadarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 flex justify-center gap-4 text-[9px] font-bold font-technical uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-error"></span> &lt;40% Critical</span>
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> 40-60% Vuln</span>
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> &gt;60% Robust</span>
                  </div>
                </div>

                <div className="h-64 bg-slate-50/50 rounded-xl p-6 border border-slate-100 flex flex-col">
                  <p className="text-[10px] font-bold uppercase tracking-extrawide text-slate-400 mb-6 text-center font-technical">Confidence by Stressor</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Occlusion 80%', val: 19 },
                      { name: 'Dense Fog', val: 35 },
                      { name: 'Heavy Rain', val: 41 },
                      { name: 'Occlusion 50%', val: 48 },
                      { name: 'Night Mode', val: 52 },
                      { name: 'Motion Blur', val: 58 },
                    ]}>
                      <XAxis dataKey="name" hide />
                      <YAxis tick={{ fontSize: 9, fontFamily: 'Space Grotesk' }} />
                      <Bar dataKey="val" fill="#10b981" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="space-y-6 pt-8 border-t border-slate-100">
                <h4 className="text-[10px] font-bold uppercase tracking-extrawide text-slate-400 font-technical">Detailed Breakdown</h4>
                <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                  {[
                    { name: 'Occlusion 80%', risk: 19 },
                    { name: 'Dense Fog', risk: 35 },
                    { name: 'Heavy Rain', risk: 41 },
                    { name: 'Occlusion 50%', risk: 48 },
                    { name: 'Night Mode', risk: 52 },
                    { name: 'Motion Blur', risk: 58 }
                  ].map((item) => (
                    <div key={item.name} className="space-y-2">
                      <div className="flex justify-between text-[11px] font-bold uppercase tracking-tight font-technical">
                        <span className="text-slate-600">{item.name}</span>
                        <span className={item.risk < 40 ? 'text-error' : item.risk < 60 ? 'text-amber-500' : 'text-tertiary'}>{item.risk}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${item.risk < 40 ? 'bg-error' : item.risk < 60 ? 'bg-amber-500' : 'bg-tertiary'} rounded-full shadow-sm transition-all duration-1000`} 
                          style={{ width: `${item.risk}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-extrawide text-primary/40 font-technical px-2">Blender Physics Stressor Previews</h4>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { name: 'occlusion_80', stressor: 'OCCLUSION_80', risk: '19%' },
                  { name: 'fog_dense', stressor: 'FOG_DENSE', risk: '35%' },
                  { name: 'rain_heavy', stressor: 'RAIN_HEAVY', risk: '41%' },
                  { name: 'occlusion_50', stressor: 'OCCLUSION_50', risk: '48%' }
                ].map((item) => (
                  <div key={item.name} className="aspect-video bg-slate-900 rounded-xl overflow-hidden relative group border border-white/5 shadow-lg group">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541675154750-0444c7d51e8e?auto=format&fit=crop&q=80&w=300')] bg-cover opacity-30 grayscale group-hover:opacity-60 transition-all duration-500"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                    <div className="absolute inset-x-2 top-2 flex justify-between opacity-50 font-technical text-[6px] text-cyan-400 uppercase tracking-widest">
                      <span>BLENDER_PHYSICS_v2.1</span>
                      <span className="text-white">FRAME: 00253</span>
                    </div>
                    <div className="absolute bottom-2 left-3 right-3 flex justify-between items-end">
                      <div>
                        <p className="text-[10px] text-white font-bold font-display uppercase tracking-tight">{item.name}</p>
                        <p className="text-[6px] text-slate-400 uppercase tracking-widest mt-0.5">Physics Layer</p>
                      </div>
                      <span className="text-[11px] font-technical font-bold text-amber-500">{item.risk}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="col-span-12 lg:col-span-4 space-y-8">

            {/* GEMINI AI INSIGHTS CARD */}
            <div className="bg-slate-950 border border-indigo-500/30 rounded-xl p-8 text-white relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Sparkles size={80} />
              </div>
              <div className="relative z-10">
                <h3 className="font-display text-xl font-bold mb-4 flex items-center gap-2 text-cyan-400">
                  <Sparkles size={20} /> GEMINI AI INSIGHTS
                </h3>
                <p className="text-[10px] text-slate-400 mb-6 leading-relaxed uppercase tracking-widest font-technical">
                  ADVERSARIAL BRAINSTORMING: Analyzing project metadata to identify mission-critical blind spots and physics-based edge cases.
                </p>
                
                <button 
                  onClick={async () => {
                    setActionLoading(true);
                    try {
                      const resp = await fetch(`http://localhost:8000/api/projects/${id}/brainstorm-scenarios`);
                      const data = await resp.json();
                      const scenarios = data.scenarios.map((s: any) => `• ${s.scenario.toUpperCase()}\n  ${s.reason}`).join("\n\n");
                      alert(`GEMINI ADVERSARIAL REPORT for ${project.name}:\n\n${scenarios}`);
                    } catch (e) {
                      alert("Configure GOOGLE_API_KEY in .env to enable.");
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 text-[10px] font-bold uppercase tracking-widest py-3.5 rounded-lg shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Zap size={14} className="animate-spin" /> : <Terminal size={14} />}
                  BRAINSTORM EDGE CASES
                </button>
              </div>
            </div>

            {/* SOURCE DATA INGESTION CARD */}
            <div className="bg-white/70 glass-panel shadow-[0_0_40px_rgba(38,58,97,0.05)] border border-indigo-500/10 rounded-xl p-8">
              <h3 className="font-headline text-lg font-bold text-primary mb-1">Source Data</h3>
              <p className="text-[11px] text-slate-400 uppercase tracking-widest mb-5">
                {project.seed_images?.length || 0} images · Coverage {Math.min((project.seed_images?.length || 0) * 10, 100)}%
              </p>

              {/* Uploaded Images Preview */}
              {(project.seed_images?.length || 0) > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-5">
                  {project.seed_images?.slice(0, 6).map((img: any) => (
                    <div key={img.id} className="aspect-square rounded-lg overflow-hidden bg-slate-100 border border-indigo-100">
                      <img src={img.url} alt={img.filename} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Drop Zone */}
              <input
                type="file"
                id="seed-upload"
                multiple
                hidden
                accept="image/*"
                onChange={async (e) => {
                  if (e.target.files && id) {
                    const files = Array.from(e.target.files);
                    try {
                      await uploadSeedImages(id, files);
                      await refetch();
                    } catch (err) {
                      alert("Upload failed.");
                    }
                  }
                }}
              />
              <div
                onClick={() => document.getElementById('seed-upload')?.click()}
                className="w-full border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl p-6 flex flex-col items-center gap-2 transition-all group cursor-pointer"
              >
                <FolderOpen size={22} className="text-indigo-300 group-hover:text-indigo-500 transition-colors" />
                <p className="text-xs font-bold text-indigo-400 group-hover:text-indigo-600 uppercase tracking-widest transition-colors">
                  Upload Photos
                </p>
                <p className="text-[10px] text-slate-400">JPG, PNG supported</p>
              </div>
            </div>

            {/* Component 2: Model Structure Probe */}
            <div className="bg-white/70 glass-panel shadow-[0_0_40px_rgba(38,58,97,0.05)] border border-indigo-500/10 rounded-xl p-8 transition-all duration-500">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-display text-lg font-bold text-primary uppercase tracking-tight">Technical Probe</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-ping"></span>
                  <span className="text-[9px] font-bold text-tertiary uppercase font-technical">Live Interrogation</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mb-6 font-technical uppercase tracking-extrawide border-b border-slate-100 pb-2">Analyzing Neural Weight Distribution</p>
              
              <div className="relative h-[240px] w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-white/5 shadow-2xl">
                <div className="absolute inset-0 opacity-[0.1] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #10b981 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}></div>
                
                {/* Horizontal Scan Line */}
                <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-tertiary/20 to-transparent animate-[scan_4s_ease-in-out_infinite] pointer-events-none"></div>

                <div className="relative z-10 flex flex-col items-center gap-4">
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <div className="absolute inset-0 border-[2px] border-tertiary/20 rounded-full animate-[spin_30s_linear_infinite]">
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-tertiary rounded-full shadow-[0_0_10px_#10b981]"></div>
                    </div>
                    <div className="absolute w-20 h-20 border-[1px] border-tertiary/10 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
                    <div className="text-center">
                      <p className="text-[14px] font-technical font-bold text-tertiary leading-none">L-128</p>
                      <p className="text-[6px] text-slate-400 uppercase tracking-widest mt-1">Deep Depth</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="text-center">
                      <p className="text-[10px] font-technical font-bold text-white">0.942</p>
                      <p className="text-[6px] text-slate-500 uppercase tracking-widest">Weight Entropy</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-technical font-bold text-white">42ms</p>
                      <p className="text-[6px] text-slate-500 uppercase tracking-widest">Latent Delay</p>
                    </div>
                  </div>
                </div>

                <div className="absolute top-4 left-4 flex flex-col gap-1">
                   <div className="h-0.5 w-6 bg-tertiary/30"></div>
                   <div className="h-0.5 w-4 bg-tertiary/30"></div>
                </div>

                <div className="absolute bottom-4 right-6 text-[8px] font-technical tracking-extrawide uppercase text-tertiary/40">
                  SEC_SCAN_ACTIVE // {id?.slice(0, 8)}
                </div>
              </div>

              <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-[9px] text-slate-500 font-body leading-relaxed">
                  <strong className="text-primary uppercase font-technical block mb-1">Probe Status</strong>
                  Actively scanning for adversarial drift within model weights. Recursive interrogation ensures activation functions remain within nominal thresholds.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border-l-4 border-primary rounded-xl p-8 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Operational Diagnostics</h4>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <CheckCircle size={14} className="text-tertiary" />
                  <span className="text-xs text-slate-600">Weight distribution stabilized</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle size={14} className="text-tertiary" />
                  <span className="text-xs text-slate-600">Seeds learning locked (LoRA Ready)</span>
                </li>
                <li className="flex items-center gap-3">
                  <AlertTriangle size={14} className={project.status === 'scanning' ? 'text-error animate-pulse' : 'text-slate-400'} />
                  <span className="text-xs text-slate-600 font-medium">
                    {project.status === 'scanning' ? 'Scanning neural branches...' : 'No active alerts'}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* INPUT CONSOLE BAR (BOTTOM) */}
      <div className="fixed bottom-0 left-64 right-0 z-50 flex justify-around items-center px-12 py-4 h-24 bg-white/70 backdrop-blur-2xl border-t border-indigo-500/20 shadow-[0_-10px_30px_rgba(98,0,238,0.1)]">
        <div className="flex-1 max-w-3xl flex items-center gap-8">
          <div className="flex flex-col gap-1 w-48">
            <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-tighter">Scan Intensity</label>
            <input className="w-full h-1 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" type="range" defaultValue={75} />
          </div>
          <div className="h-10 w-px bg-slate-200"></div>
          <div className="flex-1 flex items-center gap-4">
            <div className="flex-1 bg-white border border-slate-200 rounded-lg px-4 py-2 flex items-center gap-3 group focus-within:ring-2 focus-within:ring-primary focus-within:ring-opacity-20 transition-all shadow-sm">
              <Terminal size={18} className="text-indigo-400" />
              <input 
                className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-400" 
                placeholder="Target specific vulnerability class (e.g. occlusion, weather)..." 
                value={modelUrl}
                onChange={(e) => setModelUrl(e.target.value)}
                type="text"
              />
            </div>
            <button 
              onClick={handleScan}
              disabled={actionLoading || project.status === 'scanning'}
              className="bg-primary text-white font-headline text-xs font-bold uppercase tracking-widest px-8 py-3.5 rounded-lg hover:bg-[#2c406b] transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50"
            >
              {actionLoading || project.status === 'scanning' ? 'Executing...' : 'Execute Scan'}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-6 ml-12">
          <div className="flex flex-col items-center justify-center text-slate-400 p-2 hover:bg-slate-100 transition-all cursor-pointer rounded-xl">
             <Settings size={18} />
             <span className="font-headline text-[11px] font-bold tracking-tight">Config</span>
          </div>
          <div className="flex flex-col items-center justify-center text-indigo-600 ring-1 ring-indigo-500/20 rounded-xl p-2 bg-indigo-50">
             <Terminal size={18} />
             <span className="font-headline text-[11px] font-bold tracking-tight">Console</span>
          </div>
        </div>
        </div>
    </div>
  );
}
