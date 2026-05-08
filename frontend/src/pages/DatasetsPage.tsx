import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useProject } from "../hooks/useProject";
import { getDataset } from "../api/client";
import { Plus, History, Shield, Bell, Settings, Terminal, CloudDownload, Layers, Sparkles, Fingerprint, FolderOpen, Zap, CheckCircle } from "lucide-react";
import TopNavBar from "../components/TopNavBar";

export default function DatasetsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { project, status, loading, refetch } = useProject(id!, 3000);
  const [actionLoading, setActionLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState("COCO JSON");

  const handleExport = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const data = await getDataset(id);
      window.open(data.download_url, "_blank");
    } catch (e: any) {
      alert("Dataset generation in progress or not ready.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center font-headline uppercase tracking-widest text-xs text-primary animate-pulse">Initializing Data Warehouse...</div>;
  if (!project) return <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center"><button onClick={() => navigate('/projects')}>Node Not Found - Return</button></div>;

  return (
    <div className="bg-[#f7f9fb] text-[#191c1e] font-body min-h-screen selection:bg-tertiary-fixed selection:text-on-tertiary-fixed">
      {/* Background Decoration */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #c5c6cf 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.15 }}></div>
      <div className="fixed -top-20 -right-20 w-96 h-96 rounded-full bg-indigo-100 blur-[80px] opacity-20 pointer-events-none"></div>
      <div className="fixed top-1/2 left-0 w-64 h-64 rounded-full bg-blue-100 blur-[80px] opacity-20 pointer-events-none"></div>

      {/* SideNavBar (Shared Component) */}
      <aside className="fixed left-0 top-0 h-full w-64 border-r border-slate-200/20 bg-white/70 backdrop-blur-xl shadow-[0_0_40px_rgba(38,58,97,0.05)] flex flex-col p-4 z-50">
        <div className="mb-8 px-4 cursor-pointer" onClick={() => navigate('/')}>
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
          <button onClick={() => navigate('/projects')} className="w-full flex items-center gap-3 text-slate-500 px-4 py-2 hover:bg-slate-100 transition-all duration-300 rounded-lg group">
            <FolderOpen size={18} />
            <span className="font-headline uppercase tracking-widest text-[10px]">Historical Logs</span>
          </button>
        </nav>
        <button onClick={() => navigate('/projects')} className="mt-auto bg-primary text-white py-3 rounded-lg font-headline font-bold text-xs uppercase tracking-widest hover:bg-primary/90 transition-all">
          + New project
        </button>
      </aside>

      <TopNavBar projectId={id} />

      {/* Main Content Canvas */}
      <main className="pl-64 pt-24 pb-32 min-h-screen relative z-10">
        <div className="max-w-7xl mx-auto px-12">
          {/* Page Header */}
          <div className="mb-12 flex justify-between items-end">
            <div>
              <h2 className="font-headline font-extrabold text-5xl tracking-tighter text-primary mb-2 uppercase">
                AXIOMDATA | LABELED DATASET GENERATION
              </h2>
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full animate-pulse ${project.status === 'ready' ? 'bg-tertiary' : 'bg-orange-400'}`}></span>
                <span className="font-label text-[11px] uppercase tracking-widest text-slate-500 font-bold">
                  {project.image_count || 0} Unique samples {project.status === 'ready' ? 'processed' : 'generating'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-label text-[10px] uppercase tracking-[0.2em] text-slate-400">Dataset ID: AX-{id?.slice(-3).toUpperCase() || 'XXX'}-ALPHA</span>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-8">
            {/* Component 1: Dataset Overview */}
            <section className="col-span-12 lg:col-span-7">
              <div className="bg-white/80 backdrop-blur-md p-8 rounded-xl shadow-[0_0_40px_rgba(38,58,97,0.03)] border-l-4 border-primary">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-headline font-bold text-xl text-primary">Dataset Overview</h3>
                  <div className="flex gap-2">
                    <span className="bg-tertiary-fixed/20 text-tertiary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Auto-labeled</span>
                    <span className="bg-primary-fixed/20 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Synthetic</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-8">
                  {/* Real project seed images */}
                  {(project.seed_images || []).slice(0, 4).map((si) => (
                    <div key={si.id} className="relative group aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                      <img className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" src={si.url} alt={si.filename} />
                      <div className="absolute inset-0 border-2 border-primary opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                      <div className="absolute bottom-1 right-1 text-[8px] bg-primary text-white px-1 font-mono uppercase truncate max-w-full">HEX: {si.id?.slice(-3) || '??'}</div>
                    </div>
                  ))}
                  {/* Fill empty spots if less than 4 */}
                  {(project.seed_images || []).length < 4 && Array.from({ length: 4 - (project.seed_images || []).length }).map((_, i) => (
                    <div key={i} className="aspect-square rounded-lg bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center">
                      <Zap size={20} className="text-slate-200" />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-100">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Class Balance</p>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                      <div className="h-full bg-primary" style={{ width: '65%' }}></div>
                      <div className="h-full bg-tertiary-fixed-dim" style={{ width: '25%' }}></div>
                      <div className="h-full bg-slate-300" style={{ width: '10%' }}></div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2">Target (65%) | Background (25%)</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Export Resolution</p>
                    <p className="font-headline font-bold text-lg text-primary">3840 x 2160 (4K)</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Annotation Density</p>
                    <p className="font-headline font-bold text-lg text-primary">{project.label_count || 0} <span className="text-[10px] font-normal text-tertiary-fixed-variant">MASK READY</span></p>
                  </div>
                </div>
              </div>
            </section>

            {/* Component 2: Auto-Labeling Showcase */}
            <section className="col-span-12 lg:col-span-5">
              <div className="bg-white/80 backdrop-blur-md p-8 rounded-xl shadow-[0_0_40px_rgba(38,58,97,0.03)] h-full border border-slate-100">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-headline font-bold text-xl text-primary font-headline">Auto-Labeling Showcase</h3>
                  <Fingerprint className="text-tertiary animate-pulse" />
                </div>
                
                <div className="relative rounded-lg overflow-hidden border border-slate-200 mb-6 bg-slate-900 aspect-video group">
                  {/* Background Image (Mock Labeling) */}
                  <img className="w-full h-full object-cover opacity-60" src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=1000" alt="Labeling Preview" />
                  
                  {/* Bounding Boxes Overlay */}
                  <div className="absolute top-1/4 left-1/4 w-1/3 h-1/2 border-2 border-emerald-400 rounded transition-all duration-500 group-hover:scale-105">
                    <span className="absolute top-0 left-0 bg-emerald-400 text-white text-[8px] font-bold px-1 -translate-y-full uppercase tracking-widest">DETECTION: TARGET (99.8%)</span>
                  </div>

                  {/* Floating Metadata */}
                  <div className="absolute bottom-4 left-4 p-2 bg-black/60 backdrop-blur-md rounded border border-white/10">
                    <div className="space-y-1">
                      <div className="flex justify-between gap-4">
                        <span className="text-[8px] text-white/50 uppercase">Stressor</span>
                        <span className="text-[8px] text-emerald-400 font-mono">DENSITY_FOG_80</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[8px] text-white/50 uppercase">Instance</span>
                        <span className="text-[8px] text-emerald-400 font-mono">#0042</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded bg-indigo-50 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <Layers size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Multi-Layer Output</h4>
                      <p className="text-[10px] text-slate-500 leading-tight">Segmentation masks, depth maps, and COCO-compliant JSON generated.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Semantic Consistency</h4>
                      <p className="text-[10px] text-slate-500 leading-tight">Zero-shot identification of unusual edge-cases in extreme physics environments.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Bottom Control Terminal */}
      <footer className="fixed bottom-0 left-64 right-0 z-50 flex justify-around items-center px-12 py-4 h-24 bg-white/70 backdrop-blur-2xl shadow-[0_-10px_30px_rgba(98,0,238,0.1)] border-t border-indigo-500/20">
        <div className="flex items-center gap-12 w-full max-w-5xl">
          {/* Sample Input */}
          <div className="flex flex-col gap-1">
            <label className="font-headline text-[9px] font-bold tracking-[0.2em] text-slate-400 uppercase">Target Sample Count</label>
            <div className="flex items-center bg-white border border-slate-200 rounded-lg px-4 py-2 group focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <input className="bg-transparent border-none focus:ring-0 text-sm font-mono text-primary w-24" type="number" defaultValue={1000} />
              <span className="text-[10px] font-bold text-tertiary ml-2">SAMPLES</span>
            </div>
          </div>

          {/* Format Selector */}
          <div className="flex flex-col gap-1">
            <label className="font-headline text-[9px] font-bold tracking-[0.2em] text-slate-400 uppercase">Export Format</label>
            <div className="flex gap-2">
              <button 
                onClick={() => setExportFormat("COCO JSON")}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${exportFormat === "COCO JSON" ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-500/50' : 'text-slate-400 hover:bg-slate-100'}`}
              >
                COCO JSON
              </button>
              <button 
                onClick={() => setExportFormat("YOLO")}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${exportFormat === "YOLO" ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-500/50' : 'text-slate-400 hover:bg-slate-100'}`}
              >
                YOLO TXT
              </button>
              <button 
                onClick={() => setExportFormat("XL AUDIT")}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${exportFormat === "XL AUDIT" ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-500/50' : 'text-slate-400 hover:bg-slate-100'}`}
              >
                XL AUDIT
              </button>
            </div>
          </div>

          {/* Terminal Controls */}
          <div className="ml-auto flex items-center gap-4">
            <div className="flex flex-col items-center justify-center text-slate-400 p-2 hover:bg-slate-100 rounded-xl transition-all cursor-pointer">
              <Terminal size={20} />
              <span className="font-headline text-[11px] font-bold tracking-tight">Logs</span>
            </div>
            <button 
              onClick={() => {
                if (exportFormat === "XL AUDIT") {
                  window.open(`http://localhost:8000/api/projects/${id}/export-report`, "_blank");
                } else {
                  handleExport();
                }
              }}
              disabled={actionLoading || project.status !== 'ready'}
              className={`flex items-center gap-3 px-8 py-3.5 rounded-xl shadow-lg transition-all active:scale-95 ${project.status === 'ready' ? 'bg-primary text-white hover:shadow-primary/20' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
            >
              {actionLoading ? <Zap className="animate-spin" size={16} /> : <CloudDownload size={16} />}
              <span className="font-headline font-bold text-xs uppercase tracking-[0.15em]">{project.status === 'ready' ? (exportFormat === "XL AUDIT" ? "Export XL Report" : "Generate & Export") : 'Node Processing...'}</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
