import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProject } from "../hooks/useProject";
import { triggerGeneration } from "../api/client";
import { Plus, History, Shield, Terminal, Zap, Activity, Wind, Radio } from "lucide-react";
import TopNavBar from "../components/TopNavBar";

export default function SimulationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { project, loading, error, refetch } = useProject(id!, 3000);
  const [actionLoading, setActionLoading] = useState(false);

  const handleStartSimulation = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      // Force clear any stuck state before re-running
      await triggerGeneration(id);
      await refetch();
    } catch (e: any) {
      alert("Simulation failed to initialize");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReset = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      // Reset status in Supabase
      await fetch(`http://localhost:8000/api/projects/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'created', progress: 0, current_stage: 'Dashboard Ready' })
      });
      await refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#101214] flex items-center justify-center font-technical uppercase tracking-widest text-xs text-emerald-500 animate-pulse">Initializing Simulation Core...</div>;
  
  if (error || !project) return (
    <div className="min-h-screen bg-[#101214] flex items-center justify-center font-technical p-10 text-center">
      <div className="max-w-md">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
          <Shield size={32} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-display font-bold text-white mb-2 tracking-tight uppercase">{error ? "Telemetry Error" : "Node Not Found"}</h2>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed">
          {error || "The requested project node could not be retrieved from the cloud mesh. Verify your credentials or return to the terminal."}
        </p>
        <button 
          className="bg-primary text-white px-10 py-3 rounded-full font-bold uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-xl shadow-primary/20"
          onClick={() => navigate('/projects')}
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );

  const isActive = ["generating", "training_lora", "labeling", "scanning"].includes(project.status) && (project.progress || 0) < 100;

  return (
    <div className="bg-[#f7f9fb] text-[#191c1e] font-body min-h-screen selection:bg-tertiary-fixed selection:text-on-tertiary-fixed overflow-x-hidden">
      {/* SIDE NAV BAR */}
      <aside className="fixed left-0 top-0 h-full w-64 border-r border-slate-200/20 bg-slate-50/70 backdrop-blur-xl z-50 flex flex-col p-4 shadow-[0_0_40px_rgba(38,58,97,0.05)]">
        <div className="mb-10 px-4 cursor-pointer" onClick={() => navigate('/projects')}>
          <h1 className="text-xl font-bold tracking-tighter text-slate-900 font-headline">AxiomSynth</h1>
          <p className="font-headline uppercase tracking-widest text-[10px] text-slate-500">AI Defense Core</p>
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
          <div className="flex items-center gap-3 bg-slate-200/50 text-indigo-600 rounded-lg px-4 py-2 group">
            <Shield size={18} fill="currentColor" />
            <span className="font-medium text-sm">{project.name}</span>
          </div>
        </nav>
        <div className="mt-auto p-4 bg-slate-100 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">AT</div>
          <div>
            <p className="text-xs font-bold text-on-surface">DR. ARIS T.</p>
            <p className="text-[10px] text-outline uppercase tracking-tighter">Senior Analyst</p>
          </div>
        </div>
      </aside>

      {/* MAIN CANVAS */}
      <main className="ml-64 min-h-screen relative dot-grid">
        <div className="absolute inset-0 opacity-[0.15] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#c5c6cf 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        
        <TopNavBar projectId={id} />

        <div className="pt-28 px-12 pb-48">
          {/* Hero Header Section */}
          <div className="mb-12 flex justify-between items-end relative z-10">
            <div>
              <h2 className="text-4xl font-bold tracking-tight text-on-surface font-headline mb-2 uppercase">
                AXIOMSIM | EXTREME EDGE CASE SIMULATION
              </h2>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full animate-pulse ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                <span className={`text-xs font-label uppercase tracking-[0.2em] font-bold ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {isActive ? 'Simulation active' : 'Simulation Standby'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-outline uppercase tracking-widest mb-1">Current Iteration</p>
              <p className="text-2xl font-headline font-bold text-primary">#SEV-{project.id?.slice(-3) || '000'}.{project.progress || '00'}</p>
            </div>
          </div>

          {/* Bento Grid Content */}
          <div className="grid grid-cols-12 gap-8 relative z-10">
            {/* LEFT: Simulation Control & Telemetry */}
            <div className="col-span-12 lg:col-span-8 space-y-8">
              <div className="bg-white/70 glass-panel shadow-[0_0_40px_rgba(38,58,97,0.05)] border border-indigo-500/10 rounded-xl p-8">
                 <div className="flex justify-between items-start mb-10">
                   <div>
                     <h3 className="font-display text-2xl font-bold text-primary uppercase tracking-tight">Advanced Simulation Control</h3>
                     <p className="text-sm text-slate-500 font-body">Configure synthetic data generation parameters for extreme edge-case simulation.</p>
                   </div>
                   <button 
                     onClick={handleStartSimulation}
                     disabled={actionLoading || isActive}
                     className="bg-primary hover:bg-slate-900 text-white text-[10px] font-bold uppercase tracking-extrawide px-6 py-3 rounded-full shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 font-technical"
                   >
                     {isActive ? 'Simulating...' : 'Initialize Loop'}
                   </button>
                 </div>

                 <div className="grid grid-cols-2 gap-12 mb-12">
                   {/* Physics Parameters */}
                   <div className="space-y-6">
                     <h4 className="text-[10px] font-bold uppercase tracking-extrawide text-slate-400 font-technical">Physics Parameters</h4>
                     {[
                       { label: 'Atmospheric Refraction', val: '1.33x', p: 75 },
                       { label: 'Scattering Density', val: '0.82ρ', p: 82 },
                       { label: 'Occular Occlusion', val: '40%', p: 40 }
                     ].map((p, i) => (
                       <div key={i} className="space-y-2">
                         <div className="flex justify-between text-[11px] font-bold font-technical uppercase">
                           <span>{p.label}</span>
                           <span className="text-blue-600">{p.val}</span>
                         </div>
                         <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                           <div className="h-full bg-blue-500/60 shadow-[0_0_8px_rgba(59,130,246,0.3)] transition-all duration-[2000ms]" style={{ width: isActive ? `${Math.max(p.p, project.progress || 0)}%` : '5%' }}></div>
                         </div>
                       </div>
                     ))}
                   </div>

                   {/* Environmental Stressors */}
                   <div className="space-y-6">
                     <h4 className="text-[10px] font-bold uppercase tracking-extrawide text-slate-400 font-technical">Stressor Intensity</h4>
                     <div className="grid grid-cols-2 gap-4">
                       {[
                         { id: 'fog', label: 'Fog', icon: <Wind size={14} />, active: true },
                         { id: 'rain', label: 'Rain', icon: <Zap size={14} />, active: false },
                         { id: 'night', label: 'Night', icon: <Activity size={14} />, active: true },
                         { id: 'glare', label: 'Glare', icon: <Zap size={14} />, active: false }
                       ].map((s) => (
                         <div key={s.id} className={`p-4 rounded-xl border ${s.active ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100 opacity-60'} flex items-center gap-3 transition-all cursor-default`}>
                            <div className={`${s.active ? 'text-indigo-600' : 'text-slate-400'}`}>{s.icon}</div>
                            <span className="text-[10px] font-bold uppercase font-technical text-slate-600">{s.label}</span>
                         </div>
                       ))}
                     </div>
                   </div>
                 </div>

                 {/* System Throughput (ENLARGED & INTERACTIVE) */}
                 <div className="bg-gradient-to-br from-[#263a61] to-[#1a2b4b] rounded-2xl shadow-2xl relative overflow-hidden group p-10 mt-8 mb-12">
                   <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #4f46e5 0px, #4f46e5 1px, transparent 1px, transparent 10px)' }}></div>
                   <div className="relative z-10">
                     <div className="flex justify-between items-center mb-10">
                       <h4 className="text-[12px] font-bold uppercase tracking-[0.4em] text-indigo-300/80 font-technical">System Performance Throughput</h4>
                       <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                         <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                         <span className="text-[11px] font-bold text-emerald-400 font-technical uppercase tracking-widest">842 Frames / Sec</span>
                       </div>
                     </div>
                     
                     <div className="flex items-end gap-5 h-56 px-4">
                       {[
                         { label: 'Neural Mapping', h: 65, meta: 'Interrogating 128 layers in real-time' },
                         { label: 'Physics Calc', h: 85, meta: 'Environmental scattering density at 0.82ρ' },
                         { label: 'Asset Stream', h: 45, meta: 'IO Throughput peaking at 1.2GB/s' },
                         { label: 'Raycasting', h: 95, meta: 'Light path tracing: 2M rays per frame' },
                         { label: 'Latent Space', h: 60, meta: 'Normalizing noise floor for generation' },
                         { label: 'Texture Sync', h: 75, meta: '8K map interrogation & sync active' },
                         { label: 'Occlusion', h: 35, meta: 'Solving refraction coefficients' },
                         { label: 'Vector Shift', h: 80, meta: 'Calculating physics momentum vectors' }
                       ].map((b, i) => (
                         <div key={i} className="flex-1 h-full group/bar relative flex flex-col justify-end">
                           <div 
                             className="w-full bg-gradient-to-t from-indigo-500/40 to-emerald-500/60 rounded-t-xl hover:from-indigo-500/60 hover:to-emerald-400 group-hover/bar:shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all duration-700 cursor-help border-x border-t border-white/10" 
                             style={{ height: `${b.h}%`, transitionDelay: `${i*50}ms` }}
                           ></div>
                           {/* Enhanced Hover Detail Card */}
                           <div className="absolute -top-24 left-1/2 -translate-x-1/2 bg-slate-900/98 backdrop-blur-lg text-white p-4 rounded-xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] opacity-0 group-hover/bar:opacity-100 group-hover/bar:-translate-y-2 transition-all duration-400 pointer-events-none z-50 min-w-[200px]">
                              <div className="flex items-center gap-2 mb-2">
                                <Activity size={12} className="text-emerald-400" />
                                <p className="text-[9px] font-technical font-bold text-emerald-400 uppercase tracking-widest">{b.label}</p>
                              </div>
                              <p className="text-[10px] text-slate-300 leading-relaxed font-body font-medium">{b.meta}</p>
                              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900/98 rotate-45 border-r border-b border-white/20"></div>
                           </div>
                         </div>
                       ))}
                     </div>
                     
                     <div className="mt-12 flex justify-between items-center border-t border-white/10 pt-8">
                        <div className="flex gap-12">
                           <div>
                              <p className="text-[9px] uppercase text-indigo-300/40 font-technical mb-2 tracking-widest">Compute Load</p>
                              <p className="text-lg font-technical font-bold text-white">74.2%</p>
                           </div>
                           <div>
                              <p className="text-[9px] uppercase text-indigo-300/40 font-technical mb-2 tracking-widest">Buffer Health</p>
                              <p className="text-lg font-technical font-bold text-emerald-400">NOMINAL</p>
                           </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] text-indigo-300/20 font-technical uppercase tracking-[0.5em] mb-1">Architecture</p>
                          <p className="text-[9px] text-indigo-300/40 font-technical uppercase">SENTINEL_CORE_V4</p>
                        </div>
                     </div>
                   </div>
                 </div>

                 {/* Active Simulation Feed */}
                 <div className="mt-12 pt-10 border-t border-slate-100 grid grid-cols-3 gap-6">
                    <div className="col-span-2 group">
                       <div className="relative h-64 rounded-xl overflow-hidden shadow-lg border border-slate-200">
                          <img 
                            className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" 
                            alt="Simulation Feed"
                            src="https://images.unsplash.com/photo-1541675154750-0444c7d51e8e?auto=format&fit=crop&q=80&w=600"
                          />
                          <div className="absolute inset-x-3 top-3 flex justify-between">
                             <span className="bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded tracking-widest uppercase font-technical">Live Stream</span>
                             <span className="font-technical text-[8px] text-white/60 tracking-widest">0x82.A_SEED</span>
                          </div>
                       </div>
                    </div>
                    <div className="col-span-1 bg-slate-900 rounded-xl p-6 flex flex-col justify-between border border-white/5 shadow-2xl">
                       <div>
                         <p className="text-[10px] font-technical font-bold text-tertiary uppercase tracking-widest mb-4">Neural Analytics</p>
                         <div className="space-y-4">
                            {[1,2,3].map(i => (
                               <div key={i} className="flex items-center gap-2">
                                  <div className="h-1 flex-1 bg-slate-800 rounded-full overflow-hidden">
                                     <div className="h-full bg-tertiary animate-pulse" style={{ width: isActive ? `${30 + i*15}%` : '10%' }}></div>
                                  </div>
                               </div>
                            ))}
                         </div>
                       </div>
                       <p className="text-[9px] text-slate-500 font-technical uppercase italic leading-tight">Analyzing Physics Coefficients for refractive data models...</p>
                    </div>
                 </div>
              </div>
            </div>

            {/* RIGHT: Stressor Previews */}
            <div className="col-span-12 lg:col-span-4 space-y-8">
               <div className="bg-white/70 glass-panel shadow-[0_0_40px_rgba(38,58,97,0.05)] border border-indigo-500/10 rounded-xl p-8">
                 <h3 className="font-display text-base font-bold text-primary mb-1 uppercase tracking-tight">Recent Artifacts</h3>
                 <p className="text-[10px] text-slate-400 mb-6 font-technical uppercase tracking-extrawide border-b border-indigo-50/50 pb-2">Completed synthetic clusters</p>
                                  <div className="space-y-3">
                    {[
                      { name: 'synthetic_3d_000.syn', icon: <Wind size={14} />, status: 'COMPLETED' },
                      { name: 'synthetic_3d_001.syn', icon: <Zap size={14} />, status: 'COMPLETED' },
                      { name: 'synthetic_3d_002.syn', icon: <Activity size={14} />, status: 'COMPLETED' }
                    ].map((c, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-slate-50/80 rounded-lg border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <div className="text-slate-400 group-hover:text-indigo-600 transition-colors">{c.icon}</div>
                          <span className="text-[10px] font-bold text-slate-600 font-technical tracking-tight">{c.name}</span>
                        </div>
                        <span className={`text-[8px] font-bold font-technical text-emerald-500`}>COMPLETED</span>
                      </div>
                    ))}
                 </div>

                 <div className="mt-8 relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 group">
                    <img 
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                      src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=400"
                      alt="Physical Test"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                    <p className="absolute bottom-4 left-4 text-white text-[10px] font-bold uppercase font-display tracking-widest">Actuator_Probe_V4</p>
                 </div>
               </div>
            </div>
          </div>

          {/* Blender Physics Stressor Previews Section */}
          <div className="mt-16 relative z-10">
            <div className="flex justify-between items-end mb-8">
              <div>
                 <h3 className="text-[12px] font-bold uppercase tracking-[0.4em] text-slate-400 font-technical mb-2">Blender Physics Stressor Previews</h3>
                 <div className="h-0.5 w-24 bg-gradient-to-r from-indigo-500 to-transparent"></div>
              </div>
              <p className="text-[9px] text-slate-400 font-technical uppercase tracking-widest">Diagnostic_Node: 0x88.3_BETA</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {(project.generated_images && project.generated_images.length > 0) ? (
                project.generated_images.map((img, i) => (
                  <div key={img.id} className="group relative rounded-2xl overflow-hidden border border-slate-900 shadow-2xl bg-slate-950 transition-all hover:scale-[1.02] hover:-translate-y-1">
                    <div className="absolute inset-0 grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-70 transition-all duration-700">
                        <img 
                          src={`http://localhost:8000/media/${img.storage_key}`} 
                          alt={img.stressor} 
                          className="w-full h-full object-cover" 
                        />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                    
                    <div className="relative p-6 h-48 flex flex-col justify-between z-10">
                        <div className="flex justify-between items-start">
                          <div>
                              <p className="text-[7px] text-indigo-400 font-technical uppercase tracking-widest mb-0.5">AxiomSynth_Output_V1</p>
                              <h4 className="text-sm font-technical font-bold text-white tracking-widest uppercase">{img.stressor?.replace('_', ' ') || 'VARIANT'}</h4>
                          </div>
                          <p className="text-[8px] font-technical text-slate-500 uppercase">#{i.toString().padStart(3, '0')}</p>
                        </div>
                        <div className="flex justify-between items-end">
                          <p className="text-[8px] font-technical text-slate-500 uppercase tracking-widest">Confidence</p>
                          <p className={`text-xl font-headline font-bold drop-shadow-[0_0_10px_rgba(242,194,59,0.3)] ${(img.confidence_score || 0) < 0.4 ? 'text-red-500' : 'text-tertiary'}`}>
                            {Math.round((img.confidence_score || 0) * 100)}%
                          </p>
                        </div>
                    </div>
                  </div>
                ))
              ) : (
                // Fallback drone placeholders if no images yet
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="group relative rounded-2xl overflow-hidden border border-slate-900 shadow-2xl bg-slate-950 transition-all opacity-40">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Wind className="text-slate-800" size={48} />
                    </div>
                    <div className="relative p-6 h-48 flex flex-col justify-end z-10">
                      <p className="text-[8px] font-technical text-slate-500 uppercase tracking-extrawide">Waiting for loop initialization...</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-16 grid grid-cols-12 gap-8">
               {/* Global Physics Constraint Topology */}
               <div className="col-span-12 lg:col-span-12 bg-[#020617] rounded-3xl p-12 border border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.05)] relative overflow-hidden group">
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
                  <div className="relative z-10 flex flex-col lg:flex-row gap-16 items-center">
                     <div className="lg:w-1/3">
                        <h4 className="text-[12px] font-bold text-emerald-400 uppercase tracking-[0.4em] font-technical mb-4">Global Physics Constraint Topology</h4>
                        <p className="text-slate-400 text-sm font-body leading-relaxed mb-8">Visualization of real-time physics engine node connections and environmental stress propagation vectors.</p>
                        <div className="space-y-4">
                           {[
                             { label: 'Ray-Tracing Density', val: '842k/s', pct: 84 },
                             { label: 'Shader Compilation', val: 'Active', pct: 100 },
                             { label: 'VRAM Allocation', val: '6.4GB', pct: 60 }
                           ].map((stat, i) => (
                             <div key={i} className="space-y-2">
                                <div className="flex justify-between text-[10px] font-technical uppercase text-slate-500">
                                   <span>{stat.label}</span>
                                   <span className="text-emerald-400 font-bold">{stat.val}</span>
                                </div>
                                <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden border border-emerald-500/10">
                                   <div className="h-full bg-emerald-500/50 group-hover:bg-emerald-500 transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${stat.pct}%` }}></div>
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>
                     <div className="flex-1 relative w-full h-80 flex items-center justify-center">
                        <div className="absolute w-64 h-64 border border-emerald-500/20 rounded-full animate-[spin_30s_linear_infinite]"></div>
                        <div className="absolute w-40 h-40 border border-emerald-500/30 rounded-full animate-[spin_15s_linear_reverse_infinite]"></div>
                        <div className="relative z-10 grid grid-cols-4 gap-4">
                           {Array.from({ length: 16 }).map((_, i) => (
                             <div key={i} className={`w-3 h-3 rounded-sm transform rotate-45 border ${i % 3 === 0 ? 'bg-emerald-500 border-emerald-400 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.8)]' : 'border-emerald-900/50'}`}></div>
                           ))}
                        </div>
                        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
                           <line x1="20%" y1="20%" x2="80%" y2="80%" stroke="#10b981" strokeWidth="0.5" strokeDasharray="4 4" />
                           <line x1="80%" y1="20%" x2="20%" y2="80%" stroke="#10b981" strokeWidth="0.5" strokeDasharray="4 4" />
                           <circle cx="50%" cy="50%" r="40" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="8 8" className="animate-[spin_10s_linear_infinite]" />
                           <circle cx="50%" cy="50%" r="80" fill="none" stroke="#10b981" strokeWidth="0.5" opacity="0.2" />
                        </svg>
                     </div>
                  </div>
               </div>

               {/* Simulation Cycle Narrative Feed */}
               <div className="col-span-12 bg-white/50 backdrop-blur-md rounded-2xl p-8 border border-slate-200 shadow-sm">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Simulation Cycle Narrative Feed</h4>
                  <div className="space-y-4 font-technical text-[11px] h-48 overflow-y-auto pr-4 custom-scrollbar">
                     {[
                       { time: 'T+44.22', msg: 'Initializing ray-casting array for frame sequence 00891...', code: 'OK' },
                       { time: 'T+45.08', msg: 'Stressor injection: FOG_DENSE (Sigma: 0.85) applied to environmental geometry.', code: 'INFO' },
                       { time: 'T+46.12', msg: 'Detecting model drift in geometric perception layer. Re-indexing...', code: 'WARN' },
                       { time: 'T+47.45', msg: 'Packet handshake complete. Syncing physics constraints with local cache.', code: 'OK' },
                       { time: 'T+48.33', msg: 'Neural stress test initiated: 1,420 vectors interrogated.', code: 'OK' },
                       { time: 'T+49.02', msg: 'Sim_Engine: Sequence validation success. Flushing frame buffers.', code: 'OK' }
                     ].map((log, i) => (
                       <div key={i} className="flex gap-6 items-start border-l border-slate-100 pl-4 py-2 hover:bg-slate-50/50 transition-colors group">
                          <span className="text-indigo-400 font-bold whitespace-nowrap">{log.time}</span>
                          <span className="flex-1 text-slate-600 line-clamp-1 group-hover:line-clamp-none transition-all">{log.msg}</span>
                          <span className={`font-bold ${log.code === 'WARN' ? 'text-amber-500' : log.code === 'ERROR' ? 'text-red-500' : 'text-emerald-500'}`}>{log.code}</span>
                       </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* Diagnostic Telemetry Flux */}
            <div className="mt-12 p-10 bg-[#0f172a]/90 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden relative group shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
              <div className="absolute top-0 right-0 p-6 opacity-30 group-hover:opacity-100 transition-opacity duration-500">
                 <Terminal size={48} className="text-emerald-500" />
              </div>
              <h4 className="text-[12px] font-bold text-emerald-400/90 uppercase tracking-[0.5em] font-technical mb-10 pl-1 border-l-2 border-emerald-500/50">Live Diagnostic Telemetry Flux</h4>
              
              <div className="grid grid-cols-4 gap-12">
                 {[
                   { label: 'Latency Jitter', val: '4.2ms', sub: 'Nominal', color: 'text-emerald-400' },
                   { label: 'Entropy Flow', val: '0.88λ', sub: 'Consistent', color: 'text-indigo-400' },
                   { label: 'Vector Drift', val: '0.002%', sub: 'Within Range', color: 'text-emerald-400' },
                   { label: 'Packet Integrity', val: '99.98%', sub: 'Secure', color: 'text-emerald-400' }
                 ].map((t, i) => (
                   <div key={i} className="relative">
                      <p className="text-[9px] uppercase text-indigo-200/60 font-technical mb-3 tracking-widest font-bold">{t.label}</p>
                      <p className={`text-2xl font-technical font-bold ${t.color} drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]`}>{t.val}</p>
                      <div className="mt-3 flex items-center gap-3">
                         <span className="text-[8px] uppercase font-technical text-indigo-300 font-bold tracking-tighter">{t.sub}</span>
                         <div className="flex-1 h-[1px] bg-white/10"></div>
                      </div>
                      <div className="absolute -left-6 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
                   </div>
                 ))}
              </div>
              
              <div className="mt-10 flex items-center gap-6">
                 <div className="flex-1 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-gradient-to-r from-indigo-500 via-emerald-400 to-indigo-500 animate-[move-gradient_6s_linear_infinite]" style={{ width: '100%', backgroundSize: '200% 100%' }}></div>
                 </div>
                 <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <p className="text-[9px] font-technical text-emerald-400/80 font-bold uppercase tracking-widest">Flux_Active: 0x88.3</p>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Simulation Console (Bottom Bar) */}
        <footer className="fixed bottom-0 left-64 right-0 z-50 flex justify-around items-center px-12 py-4 h-24 bg-white/70 backdrop-blur-2xl border-t border-indigo-500/20 shadow-[0_-10px_30px_rgba(98,0,238,0.1)]">
          {/* Parameters Left */}
          <div className="flex items-center gap-8">
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-tighter text-outline font-bold">Weather Severity</label>
              <input className="w-32 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500" type="range" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-tighter text-outline font-bold">Damage Protocol</label>
              <div className="flex gap-2">
                <button className="px-3 py-1 rounded bg-indigo-50 border border-indigo-200 text-indigo-600 text-[10px] font-bold font-headline">HULL</button>
                <button className="px-3 py-1 rounded bg-white border border-slate-200 text-slate-400 text-[10px] font-bold font-headline hover:bg-slate-50 transition-colors">JOINT</button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-10">
            <button className="flex flex-col items-center justify-center text-slate-400 p-2 hover:bg-slate-100 transition-all rounded-xl">
              <Terminal size={20} />
              <span className="font-body text-[11px] font-bold tracking-tight">Input</span>
            </button>
            {project.status === 'ready' ? (
              <a 
                href={project.dataset_url} 
                target="_blank" 
                rel="noreferrer"
                className="flex flex-col items-center justify-center rounded-xl p-3 px-6 transition-all scale-105 shadow-xl shadow-emerald-500/20 bg-emerald-500 text-white hover:bg-emerald-600 animate-bounce"
              >
                <Plus size={20} className="rotate-45" />
                <span className="font-headline text-[11px] font-bold tracking-tight mt-1">Download Out</span>
              </a>
            ) : (
              <button 
                onClick={handleStartSimulation}
                disabled={actionLoading}
                className={`flex flex-col items-center justify-center rounded-xl p-3 px-6 transition-all scale-105 shadow-lg ${isActive ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/50' : 'bg-primary text-white hover:bg-primary/90'}`}
              >
                {isActive ? <Activity size={20} className="animate-pulse" /> : <Zap size={20} />}
                <span className="font-headline text-[11px] font-bold tracking-tight mt-1">{isActive ? 'Simulating...' : 'Initialize'}</span>
              </button>
            )}
            <button 
              onClick={handleReset}
              className="flex flex-col items-center justify-center text-slate-400 p-2 hover:bg-red-50 hover:text-red-500 transition-all rounded-xl"
            >
              <Radio size={20} />
              <span className="font-body text-[11px] font-bold tracking-tight">Reset Core</span>
            </button>
          </div>

          <div className="hidden xl:flex items-center gap-4 bg-slate-900 rounded-lg px-4 py-2 w-72 border border-white/10 shadow-inner">
            <div className="flex-1 overflow-hidden">
              <p className="text-[10px] font-mono text-emerald-400 truncate tracking-tighter">&gt; EXEC_SIM_ENV: 0x88.3</p>
              <p className="text-[10px] font-mono text-slate-500 truncate tracking-tighter">&gt; PIPELINE: {project.current_stage || 'IDLE'}</p>
            </div>
            <Activity size={14} className="text-orange-500 animate-pulse" />
          </div>
        </footer>
      </main>
    </div>
  );
}
