import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useProject } from "../hooks/useProject";
import { Plus, History, Shield, Bell, Settings, Terminal, ShieldCheck, Wrench, TrendingDown, RefreshCw, Layers, Image as ImageIcon, Mic, Send, Activity, ChevronRight } from "lucide-react";
import TopNavBar from "../components/TopNavBar";

export default function AnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { project, loading } = useProject(id!, 3000);

  if (loading) return <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center font-headline uppercase tracking-widest text-xs text-primary animate-pulse">Synchronizing Intelligence Node...</div>;
  if (!project) return <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center"><button onClick={() => navigate('/projects')}>Node Not Found - Return</button></div>;

  return (
    <div className="bg-[#f7f9fb] font-body text-[#191c1e] selection:bg-tertiary-fixed selection:text-on-tertiary-fixed relative min-h-screen overflow-x-hidden">
      {/* Background Decoration */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#c5c6cf 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.15 }}></div>
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* SideNavBar */}
      <aside className="fixed left-0 top-0 h-full w-64 border-r border-slate-200/20 bg-slate-50/70 backdrop-blur-xl z-50 flex flex-col p-4 shadow-[0_0_40px_rgba(38,58,97,0.05)]">
        <div className="mb-12 px-4 cursor-pointer" onClick={() => navigate('/')}>
          <h1 className="text-xl font-bold tracking-tighter text-slate-900">AxiomSynth</h1>
          <p className="font-headline uppercase tracking-widest text-[10px] text-slate-500">AI Defense Core</p>
        </div>
        <nav className="flex-1 space-y-2">
          <button onClick={() => navigate('/projects')} className="w-full flex items-center gap-3 text-slate-500 px-4 py-2 hover:bg-slate-100 transition-all duration-300 rounded-lg group">
            <Plus size={18} />
            <span className="font-headline uppercase tracking-widest text-[10px]">New Project</span>
          </button>
          <button onClick={() => navigate('/projects')} className="w-full flex items-center gap-3 text-slate-500 px-4 py-2 hover:bg-slate-100 transition-all duration-300 rounded-lg group">
            <History size={18} />
            <span className="font-headline uppercase tracking-widest text-[10px]">Recent Scans</span>
          </button>
          <div className="flex items-center gap-3 bg-indigo-50 text-indigo-600 rounded-lg px-4 py-2 group">
            <Shield size={18} fill="currentColor" />
            <span className="font-headline uppercase tracking-widest text-[10px]">{project.name}</span>
          </div>
        </nav>
        <div className="mt-auto p-4 flex items-center gap-3 bg-slate-100 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold">OP7</div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold truncate">Operator 07-X</p>
            <p className="text-[10px] text-slate-400 truncate uppercase tracking-tighter">Level 4 Clearance</p>
          </div>
        </div>
      </aside>

      <TopNavBar projectId={id} />

      {/* Main Content Area */}
      <main className="ml-64 p-12 pt-24 pb-32 relative z-10">
        <header className="flex justify-between items-end mb-12">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-primary/60 font-bold font-headline">Axiom Operational Environment</span>
            <h2 className="text-5xl font-bold tracking-tighter text-on-surface font-headline uppercase mt-2">ROBUSTNESS INTELLIGENCE</h2>
          </div>
          <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-lg flex items-center gap-3 border border-slate-100 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="font-headline text-xs font-medium tracking-widest text-[#00423c]">CORE STATUS: OPTIMAL</span>
          </div>
        </header>

        {/* Top Section: Analysis Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="bg-white/70 backdrop-blur-md p-8 rounded-xl shadow-sm border border-slate-200/50 flex flex-col justify-between h-44 group hover:scale-[1.02] transition-all duration-300">
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-bold font-headline uppercase tracking-widest text-slate-500">Global Defense Score</p>
              <ShieldCheck size={18} className="text-primary" />
            </div>
            <div className="flex items-end justify-between">
              <span className="text-4xl font-bold font-headline text-primary">
                {project.status === 'ready' ? '98.8%' : 'TBD'}
              </span>
              <div className="relative w-12 h-12">
                <svg className="w-full h-full transform -rotate-90">
                  <circle className="text-emerald-100" cx="24" cy="24" fill="transparent" r="20" stroke="currentColor" strokeWidth="4"></circle>
                  <circle className={`transition-all duration-1000 ${project.status === 'ready' ? 'text-emerald-500' : 'text-slate-200'}`} cx="24" cy="24" fill="transparent" r="20" stroke="currentColor" strokeDasharray="125.6" strokeDashoffset={project.status === 'ready' ? '2.5' : '125.6'} strokeWidth="4"></circle>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-md p-8 rounded-xl shadow-sm border border-slate-200/50 flex flex-col justify-between h-44 group hover:scale-[1.02] transition-all duration-300">
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-bold font-headline uppercase tracking-widest text-slate-500">Edge-Cases Generated</p>
              <Wrench size={18} className="text-primary" />
            </div>
            <span className="text-4xl font-bold font-headline text-primary">{project.image_count || 0}</span>
            <p className="text-[10px] text-emerald-600 font-medium font-headline uppercase tracking-widest">+1,240 since last audit</p>
          </div>

          <div className="bg-white/70 backdrop-blur-md p-8 rounded-xl shadow-sm border border-slate-200/50 flex flex-col justify-between h-44 group hover:scale-[1.02] transition-all duration-300">
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-bold font-headline uppercase tracking-widest text-slate-500">Drift Delta</p>
              <TrendingDown size={18} className="text-primary" />
            </div>
            <span className="text-4xl font-bold font-headline text-primary">-12%</span>
            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-[12%]"></div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-md p-8 rounded-xl shadow-sm border border-slate-200/50 flex flex-col justify-between h-44 group hover:scale-[1.02] transition-all duration-300 overflow-hidden">
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-bold font-headline uppercase tracking-widest text-slate-500">Active Pipeline Loops</p>
              <RefreshCw size={18} className="text-primary" />
            </div>
            <span className="text-4xl font-bold font-headline text-primary">4</span>
            <div className="flex gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-10">
          {/* Vulnerability Radar */}
          <div className="lg:col-span-3 bg-white/70 backdrop-blur-md rounded-xl p-10 min-h-[480px] relative overflow-hidden border border-slate-200/50 shadow-sm">
            <div className="flex justify-between items-start mb-10 relative z-10">
              <div>
                <h3 className="text-2xl font-bold font-headline text-primary tracking-tight">Vulnerability Radar</h3>
                <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Live AI failure clusters across 3D stress environments</p>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 rounded bg-primary/5 text-primary text-[10px] font-bold font-headline tracking-widest uppercase">Target: Model_V4</span>
                <span className="px-3 py-1 rounded bg-emerald-50 text-emerald-600 text-[10px] font-bold font-headline tracking-widest uppercase">Active Node</span>
              </div>
            </div>
            
            <div className="relative w-full h-[320px] flex items-center justify-center">
              {/* Radar Grid Backdrop */}
              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <div className="w-64 h-64 border border-primary rounded-full"></div>
                <div className="absolute w-48 h-48 border border-primary rounded-full"></div>
                <div className="absolute w-32 h-32 border border-primary rounded-full"></div>
                <div className="absolute h-64 w-[1px] bg-primary"></div>
                <div className="absolute w-64 h-[1px] bg-primary"></div>
              </div>

              {/* Real Vulnerability Pins */}
              <div className="relative z-10 w-full h-full flex items-center justify-center">
                {project.vulnerability_vector && Object.entries(project.vulnerability_vector).map(([key, val], i, arr) => {
                  const angle = (i / arr.length) * 2 * Math.PI;
                  const dist = (val as number) * 120;
                  const x = Math.cos(angle) * dist;
                  const y = Math.sin(angle) * dist;
                  
                  return (
                    <div key={key} className="absolute group" style={{ transform: `translate(${x}px, ${y}px)` }}>
                      <div className="w-4 h-4 bg-primary rounded-full shadow-[0_0_15px_#263a61] cursor-crosshair hover:scale-150 transition-all"></div>
                      <div className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-900 text-white text-[8px] px-2 py-1 rounded font-technical uppercase">
                        {key}: {(val as number * 100).toFixed(1)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="absolute bottom-4 left-4 text-[9px] font-headline uppercase tracking-[0.2em] text-slate-400">Dim: Simulated Stressors</div>
            <div className="absolute top-4 right-4 text-[9px] font-headline uppercase tracking-[0.2em] text-slate-400">Source: Axiom_Probe_Net</div>
          </div>

          {/* Spline Chart */}
          <div className="lg:col-span-2 bg-white/70 backdrop-blur-md rounded-xl p-10 border-r-4 border-indigo-500/20 shadow-sm border-y border-l border-slate-200/50">
            <div className="mb-10">
              <h3 className="text-2xl font-bold font-headline text-primary tracking-tight">Accuracy vs Probing</h3>
              <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">AxiomSynth Probing Difficulty Coefficient</p>
            </div>
            <div className="h-64 relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 400 200">
                <line stroke="#f1f5f9" strokeWidth="1" x1="0" x2="400" y1="180" y2="180"></line>
                <line stroke="#f1f5f9" strokeWidth="1" x1="0" x2="400" y1="130" y2="130"></line>
                <line stroke="#f1f5f9" strokeWidth="1" x1="0" x2="400" y1="80" y2="80"></line>
                <line stroke="#f1f5f9" strokeWidth="1" x1="0" x2="400" y1="30" y2="30"></line>
                <path className="opacity-80" d="M0,160 Q50,140 100,100 T200,60 T300,120 T400,40" fill="none" stroke="#6366f1" strokeLinecap="round" strokeWidth="4"></path>
                <path d="M0,40 Q80,50 150,70 T250,90 T350,85 T400,100" fill="none" stroke="#10b981" strokeLinecap="round" strokeWidth="4"></path>
                <circle className="animate-pulse" cx="200" cy="60" fill="#6366f1" r="5"></circle>
                <circle cx="250" cy="90" fill="#10b981" r="5"></circle>
              </svg>
            </div>
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-4 h-1 bg-indigo-500 rounded-full"></span>
                  <span className="text-[10px] font-bold font-headline text-slate-600 uppercase tracking-widest">Probing Intensity</span>
                </div>
                <span className="text-sm font-mono font-bold text-primary">0.84 μ</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-4 h-1 bg-emerald-500 rounded-full"></span>
                  <span className="text-[10px] font-bold font-headline text-slate-600 uppercase tracking-widest">Target Accuracy</span>
                </div>
                <span className="text-sm font-mono font-bold text-primary">96.8%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Edge Case Dataset & Solution Register */}
        <section className="mb-24">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-[2px] w-12 bg-emerald-500/50"></div>
            <h2 className="text-xl font-bold font-headline uppercase tracking-[0.3em] text-[#00605a]">Edge Case Dataset & Solution Register</h2>
          </div>
          
          <div className="bg-[#0b0e11] rounded-2xl border border-emerald-500/10 shadow-[0_40px_100px_rgba(0,0,0,0.4)] overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-emerald-950/20 to-transparent border-b border-emerald-500/10">
              <p className="text-[10px] font-technical text-emerald-500/60 uppercase tracking-widest leading-relaxed">
                Comprehensive edge cases targeting AI model blind spots — each row is a unique failure scenario with severity classification, stressor configuration, and recommended solution.
              </p>
            </div>
            
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-emerald-500/20 scrollbar-track-transparent">
              <table className="w-full text-left border-collapse min-w-[1400px]">
                <thead>
                  <tr className="bg-[#12161a] border-b border-emerald-500/10">
                    <th className="px-6 py-4 text-[10px] font-bold font-headline uppercase tracking-tighter text-emerald-400">ID</th>
                    <th className="px-6 py-4 text-[10px] font-bold font-headline uppercase tracking-tighter text-emerald-400">Edge Case Name</th>
                    <th className="px-6 py-4 text-[10px] font-bold font-headline uppercase tracking-tighter text-emerald-400 text-center">Category</th>
                    <th className="px-6 py-4 text-[10px] font-bold font-headline uppercase tracking-tighter text-emerald-400">Stressor Key</th>
                    <th className="px-6 py-4 text-[10px] font-bold font-headline uppercase tracking-tighter text-emerald-400 text-center">Severity</th>
                    <th className="px-6 py-4 text-[10px] font-bold font-headline uppercase tracking-tighter text-emerald-400">Failure Mode</th>
                    <th className="px-6 py-4 text-[10px] font-bold font-headline uppercase tracking-tighter text-emerald-400 text-center">Drop (%)</th>
                    <th className="px-6 py-4 text-[10px] font-bold font-headline uppercase tracking-tighter text-emerald-400 w-64">Real-World Scenario</th>
                    <th className="px-6 py-4 text-[10px] font-bold font-headline uppercase tracking-tighter text-emerald-400 text-center">Blender</th>
                    <th className="px-6 py-4 text-[10px] font-bold font-headline uppercase tracking-tighter text-emerald-400">Solution Strategy</th>
                    <th className="px-6 py-4 text-[10px] font-bold font-headline uppercase tracking-tighter text-emerald-400">Impl. Hint</th>
                    <th className="px-6 py-4 text-[10px] font-bold font-headline uppercase tracking-tighter text-emerald-400 text-center">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-500/5">
                  {[
                    { 
                      id: 'EC-001', name: 'Partial Object Occlusion (20%)', cat: 'Occlusion', key: 'occlusion_20', sev: 0.2, fail: 'Partial Feature Loss', drop: '15%', scenario: 'Pedestrian partially behind lamppost on urban street; drone behind a thin branch', blender: 'No', solution: 'Augment training with partially masked objects using patch-based occlusion at 10-30% coverage', hint: 'In physics_layer.py: reduce occluder opacity to 40%, add gradient edge blend using ImageFilter.SMOOTH', priority: 'LOW' 
                    },
                    { 
                      id: 'EC-002', name: 'Half-Object Occlusion (50%)', cat: 'Occlusion', key: 'occlusion_50', sev: 0.5, fail: 'Critical Feature Loss', drop: '40%', scenario: 'Vehicle half-hidden behind building corner; industrial sensor behind pipes at 50% coverage', blender: 'No', solution: 'Train on pair-wise occlusion masks, use context-aware inpainting to reconstruct hidden regions for contrastive loss', hint: 'Modify physics_occlusion() to place rectangular occluders only on salient regions. Use saliency map from torchvision', priority: 'HIGH' 
                    },
                    { 
                      id: 'EC-003', name: 'Severe Occlusion (80%)', cat: 'Occlusion', key: 'occlusion_80', sev: 0.8, fail: 'Object Invisibility', drop: '75%', scenario: 'Car nearly fully hidden in underground parking; robot arm behind dense machinery', blender: 'Yes', solution: 'Generate images where only corner/edge features are visible. Use LoRA fine-tune to teach model to detect partial signatures', hint: 'In Blender: place large opaque mesh in front of target. Use Cycles with physically-based occlusion geometry', priority: 'CRITICAL' 
                    },
                    { 
                      id: 'EC-004', name: 'Moving Occluder (Intermittent)', cat: 'Occlusion', key: 'occlusion_50', sev: 0.55, fail: 'Temporal Inconsistency', drop: '45%', scenario: 'Bus temporarily blocking pedestrian while both are moving; tree branches swaying over sensor target', blender: 'Yes', solution: 'Generate sequence of 3-5 frames with occluder at increasing coverage levels. Train on temporal context window', hint: 'Create animated Blender scene: animate occluder mesh along a path. Export 5 frames at 0%, 25%, 50%, 75%, 100% coverage', priority: 'HIGH' 
                    },
                    { 
                      id: 'EC-005', name: 'Light Rain (Drizzle)', cat: 'Rain', key: 'rain_light', sev: 0.3, fail: 'Texture Blur', drop: '12%', scenario: 'Fog of war: sensor barely wet; early morning drizzle on car camera; road slightly wet with minimal puddles', blender: 'No', solution: 'Add low-intensity rain stressor (num_drops=800, alpha=0.2) as new stressor_key=\'rain_light\' in STRESSORS dict', hint: 'In physics_layer.py: copy physics_rain(), set num_drops=800, drop_len_max=12, alpha range=[0.1, 0.3], skip GaussianBlur', priority: 'LOW' 
                    },
                    { 
                      id: 'EC-006', name: 'Heavy Rain + Wind', cat: 'Rain', key: 'rain_heavy', sev: 0.75, fail: 'Streak Artifacts + Haze', drop: '55%', scenario: 'Tropical downpour on autonomous vehicle; stormy conditions reducing visibility to 50m; drone flying through heavy monsoon', blender: 'Yes', solution: 'Current rain stressor lacks wind angle variation. Increase drop angle variance to +/-45°. Add horizontal streaks for rain haze', hint: 'In _physics_rain(): change drop_angle range to (-0.8, 0.8). Add second pass of horizontal streaks at intensity=0.4', priority: 'HIGH' 
                    },
                    { 
                      id: 'EC-007', name: 'Rain on Lens (Water Droplets)', cat: 'Rain', key: 'rain_lens', sev: 0.8, fail: 'Refractive Distortion', drop: '65%', scenario: 'Camera dome covered in large droplets causing micro-lensing; front camera rain drops creating bright halos', blender: 'Yes', solution: 'New stressor: apply circular refraction patches simulating water droplets with magnification effect on small regions', hint: 'In Blender: use a fluid simulation with high surface tension to create spherical droplets on a glass plane', priority: 'HIGH' 
                    },
                    { 
                      id: 'EC-008', name: 'Rain + Night Combined', cat: 'Rain', key: 'rain_heavy', sev: 0.85, fail: 'Compound Degradation', drop: '80%', scenario: 'Nighttime highway rain causing maximum sensor confusion; wet road reflections + darkness + rain streaks', blender: 'Yes', solution: 'Compound stressor: chain physics_night() and physics_rain(). This is currently not implemented — each stressor is applied independently', hint: 'Create a new task in tasks.py: chain_physics_night_then_rain(). Ensure dark noise is applied before streak overlays', priority: 'CRITICAL' 
                    },
                    { 
                      id: 'EC-009', name: 'Ground-Level Fog (Tule Fog)', cat: 'Fog', key: 'fog_dense', sev: 0.7, fail: 'Low-Region Masking', drop: '60%', scenario: 'California ground fog masking vehicle wheels and road markings; morning valley fog hiding bottom 30% of scene', blender: 'No', solution: 'Current fog applies uniform density. Split fog into a ground gradient (bottom 60% heavily fogged, top 40% clear sky)', hint: 'Modify physics_fog(): change fog_density = np.concatenate([np.linspace(0.9, 0.2, h*0.6), np.linspace(0.2, 0.05, h*0.4)])', priority: 'MEDIUM' 
                    }
                  ].map((ec) => (
                    <tr key={ec.id} className="hover:bg-emerald-500/[0.02] transition-colors border-b border-emerald-500/5 group">
                      <td className="px-6 py-5 text-xs font-technical text-emerald-500 font-bold">{ec.id}</td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-medium text-slate-300 group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{ec.name}</p>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest ${
                          ec.cat === 'Occlusion' ? 'bg-indigo-500/10 text-indigo-400' : 
                          ec.cat === 'Rain' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {ec.cat}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-xs font-mono text-slate-500">{ec.key}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3 justify-center">
                          <span className={`text-xs font-bold ${ec.sev > 0.7 ? 'text-rose-500' : ec.sev > 0.4 ? 'text-amber-500' : 'text-emerald-500'}`}>{ec.sev}</span>
                          <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-1000 ${ec.sev > 0.7 ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : ec.sev > 0.4 ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-emerald-500 shadow-[0_0_8px_#10b981]'}`}
                              style={{ width: `${ec.sev * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-xs font-technical text-slate-400 uppercase tracking-tighter">{ec.fail}</td>
                      <td className="px-6 py-5 text-center text-xs font-bold text-rose-500/80">{ec.drop}</td>
                      <td className="px-6 py-5">
                        <p className="text-[10px] text-slate-500 leading-relaxed italic">{ec.scenario}</p>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`text-[10px] font-bold ${ec.blender === 'Yes' ? 'text-emerald-500' : 'text-slate-700'}`}>{ec.blender}</span>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-[11px] text-slate-400 leading-snug">{ec.solution}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-[9px] font-mono text-emerald-500/70 leading-relaxed max-w-xs">{ec.hint}</p>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                          ec.priority === 'CRITICAL' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 
                          ec.priority === 'HIGH' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                          ec.priority === 'MEDIUM' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                          'bg-slate-500/10 text-slate-400 border-slate-500/10'
                        }`}>
                          {ec.priority}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 bg-[#0d1115] border-t border-emerald-500/10 flex justify-between items-center">
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                  <span className="text-[9px] font-technical text-slate-500 uppercase tracking-widest">Critical Blind Spot</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-[9px] font-technical text-slate-500 uppercase tracking-widest">Active Resolution</span>
                </div>
              </div>
              <p className="text-[9px] font-technical text-emerald-500/40 uppercase tracking-[0.2em]">Axiom Database Ver 4.2.1-X</p>
            </div>
          </div>
        </section>
      </main>

      {/* Control Console */}
      <nav className="fixed bottom-0 left-64 right-0 z-50 flex justify-around items-center px-12 py-4 h-24 bg-white/70 backdrop-blur-2xl border-t border-indigo-500/20 shadow-[0_-10px_30px_rgba(98,0,238,0.1)]">
        <div className="flex-1 max-w-2xl bg-slate-50 border border-slate-200 rounded-2xl px-6 py-2 flex items-center gap-4 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <Terminal size={18} className="text-slate-400" />
          <input className="bg-transparent border-none focus:ring-0 w-full text-sm font-body tracking-wide placeholder:text-slate-400" placeholder="Initialize robustness audit command..." type="text" />
          <div className="flex gap-2">
            <Mic size={18} className="text-primary cursor-pointer hover:scale-110 transition-transform" />
            <Send size={18} className="text-primary cursor-pointer hover:scale-110 transition-transform" />
          </div>
        </div>
        <div className="flex gap-8 ml-12">
          <div className="flex flex-col items-center justify-center text-indigo-600 ring-1 ring-indigo-500/50 rounded-xl p-2 bg-indigo-50/50">
            <Terminal size={20} />
            <span className="font-headline text-[11px] font-bold tracking-tight uppercase mt-1">Audit</span>
          </div>
          <div className="flex flex-col items-center justify-center text-slate-400 p-2 hover:bg-slate-100 transition-all rounded-xl">
            <Activity size={20} />
            <span className="font-headline text-[11px] font-bold tracking-tight uppercase mt-1">Live</span>
          </div>
        </div>
      </nav>
    </div>
  );
}
