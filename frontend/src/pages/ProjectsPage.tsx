import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../api/supabase";
import { Plus, Trash2, Shield, FolderOpen, Terminal, Mic, Send, TrendingUp, AlertTriangle, Zap, LogOut, History, Settings } from "lucide-react";
import TopNavBar from "../components/TopNavBar";
import { listProjects, createProject, deleteProject } from "../api/client";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const fetchProjectsData = async () => {
    setLoading(true);
    try {
      const data = await listProjects();
      setProjects(data);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectsData();
  }, []);

  const stats = useMemo(() => ({
    totalModels: projects.length,
    vulnerabilities: 0, // We will calculate this later from the simulations table
    totalImages: 0,
    totalLabels: 0,
  }), [projects]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    
    try {
      const newProject = await createProject(name.trim(), description.trim());
      
      // Upload files if selected
      if (selectedFiles.length > 0) {
        try {
          const { uploadSeedImages } = await import("../api/client");
          await uploadSeedImages(newProject.id, selectedFiles);
        } catch (uploadErr) {
          console.error("Initial data ingestion failed:", uploadErr);
        }
      }

      setProjects([newProject, ...projects]);
      setShowForm(false);
      setName("");
      setDescription("");
      setSelectedFiles([]);
      navigate(`/projects/${newProject.id}`);
    } catch (err) {
      alert("Failed to initialize node. Check network clearance.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProj = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Delete this project and all its data?")) return;
    
    try {
      await deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
    } catch (err) {
      alert("Clearance denied for deletion.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="bg-[#f7f9fb] text-[#191c1e] font-body min-h-screen">
      {/* Background Decoration */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(circle, #c5c6cf 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#263a61]/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-5%] left-[5%] w-[400px] h-[400px] bg-[#00423c]/5 blur-[100px] rounded-full"></div>
      </div>

      {/* SideNavBar */}
      <aside className="fixed left-0 top-0 h-full w-64 border-r border-slate-200/20 bg-white/70 backdrop-blur-xl z-50 flex flex-col p-4 shadow-[0_0_40px_rgba(38,58,97,0.05)]">
        <div className="mb-12 px-4 cursor-pointer" onClick={() => navigate('/')}>
          <h1 className="text-xl font-display tracking-tight text-slate-900">AxiomSynth</h1>
          <p className="font-technical uppercase tracking-extrawide text-[9px] text-slate-500">AI Defense Core</p>
        </div>
        
        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setShowForm(true)}
            className="w-full flex items-center gap-3 text-slate-500 px-4 py-2 hover:bg-slate-100 transition-all rounded-lg"
          >
            <Plus size={18} />
            <span className="font-headline uppercase tracking-widest text-[10px]">New Project</span>
          </button>
          
          <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Active Nodes</div>
          
          {projects.map(p => (
            <div 
               key={p.id}
               onClick={() => navigate(`/projects/${p.id}`)}
               className="flex items-center justify-between group cursor-pointer text-slate-500 hover:text-primary px-4 py-2 hover:bg-slate-100 rounded-lg transition-all"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <Shield size={16} className={p.status === 'ready' ? 'text-tertiary' : 'text-primary animate-pulse'} />
                <span className="font-headline uppercase tracking-widest text-[10px] truncate">{p.name}</span>
              </div>
              <button 
                onClick={(e) => handleDeleteProj(e, p.id)}
                className="opacity-0 group-hover:opacity-100 text-error hover:scale-110 transition-all"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </nav>

        <div className="mt-auto space-y-4">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 text-slate-400 px-4 py-2 hover:text-error transition-all rounded-lg group"
          >
            <LogOut size={16} className="group-hover:scale-110 transition-transform" />
            <span className="font-headline uppercase tracking-widest text-[10px]">Sign Out</span>
          </button>

          <div className="p-4 flex items-center gap-3 bg-white/50 border border-slate-200/20 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold">X</div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold truncate text-slate-900">Operator 07-X</p>
              <p className="text-[10px] text-slate-500 truncate uppercase tracking-tighter">Level 4 Clearance</p>
            </div>
          </div>
        </div>
      </aside>

      <TopNavBar />

      {/* Modal - Create Project */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-10 w-full max-w-lg shadow-2xl border border-white/20">
            <div className="mb-8">
              <span className="text-[10px] font-bold text-primary/60 uppercase tracking-[0.2em]">New Node Initialization</span>
              <h2 className="text-3xl font-headline font-bold text-slate-900 mt-2">Initialize Project</h2>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Project Name</label>
                <input
                  className="w-full bg-slate-50 border-b-2 border-slate-200 px-4 py-4 text-sm focus:outline-none focus:border-primary transition-colors"
                  placeholder="Model Name or Deployment ID"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Operational Context</label>
                <textarea
                  className="w-full bg-slate-50 border-b-2 border-slate-200 px-4 py-4 text-sm focus:outline-none focus:border-primary transition-colors resize-none"
                  rows={3}
                  placeholder="Describe the target environment stressors..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Initialize Physical Data (Optional)</label>
                <div 
                  onClick={() => document.getElementById('project-seed-upload')?.click()}
                  className="w-full border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary hover:bg-slate-50 transition-all group"
                >
                  <FolderOpen size={24} className="text-slate-300 group-hover:text-primary transition-colors" />
                  <p className="text-xs font-bold text-slate-500 group-hover:text-primary">
                    {selectedFiles.length > 0 ? `${selectedFiles.length} files selected` : "Select Target Photos"}
                  </p>
                  <input
                    type="file"
                    id="project-seed-upload"
                    multiple
                    hidden
                    onChange={(e) => {
                      if (e.target.files) setSelectedFiles(Array.from(e.target.files));
                    }}
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button 
                  onClick={handleCreate}
                  disabled={creating || !name.trim()}
                  className="flex-1 bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  {creating ? "Initializing..." : "Initialize Core"}
                </button>
                <button onClick={() => setShowForm(false)} className="px-8 py-4 font-bold text-slate-500 hover:text-slate-900 transition-colors">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="ml-64 pt-24 pb-32 px-12 relative z-10">
        <div className="mb-12 flex justify-between items-end">
          <div className="flex-1">
            <span className="text-[10px] uppercase tracking-extrawide text-primary/40 font-bold font-technical">AxiomSynth Operational Environment</span>
            <h2 className="text-4xl font-display font-extrabold text-[#191c1e] tracking-tight-caps mt-1 leading-none uppercase">AI DEFENSE CORE</h2>
          </div>
          <div className="bg-white/50 backdrop-blur-md px-5 py-2.5 rounded-full flex items-center gap-3 border border-slate-200/20 shadow-sm transition-all hover:bg-white/80">
            <div className="w-2 h-2 rounded-full bg-[#6bd8cb] animate-pulse"></div>
            <span className="font-technical text-[10px] font-bold tracking-extrawide text-[#00423c] uppercase">STATUS: OPTIMAL</span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-8 flex flex-col gap-8">
            <section className="bg-white rounded-xl p-8 shadow-[0_0_40px_rgba(38,58,97,0.05)] border border-white/20">
              <h3 className="font-headline text-2xl font-bold mb-8">Overall Intelligence</h3>
              <div className="flex gap-12">
                <div className="w-1/2 aspect-square bg-[#f2f4f6] rounded-2xl relative overflow-hidden">
                  <img 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCnOtboJxmvWqDJuo96xKtfei-W1CMwmeGc6Tyk3SeSmSwWpW6gee0hHK6njtGbLwuUUA3TQvEmdd5cc4-wYGhGVema7wro32DIHrg7meZ_xJGaACTP_x9JYtq1TBDFbw7WIvuahmdLNZiDqGDodXGwTfClOA7dymHfH5dUSl64Gt-CGtIbfugquEtgtfag5R6D5r2aAOai5h9P-0wzsmbBEix2m6iJlO7nZQfj6T-xP6NsOtg3I286-uvJ97RJ7Qthb2vycW__Xag" 
                    className="w-full h-full object-cover mix-blend-multiply opacity-80" 
                    alt="AI Visualization" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#263a61]/10 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4 bg-white/70 backdrop-blur-md p-3 rounded-lg border border-white/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Active Probing Stream</p>
                    <div className="w-full h-1 bg-slate-200 mt-2 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-2/3 animate-[pulse_2s_infinite]"></div>
                    </div>
                  </div>
                </div>

                <div className="w-1/2 grid grid-cols-2 gap-4">
                  <div className="bg-[#f2f4f6]/50 p-6 rounded-2xl border border-white/50 transition-all hover:bg-white hover:shadow-xl group">
                    <p className="text-[9px] uppercase tracking-extrawide text-slate-400 mb-2 font-bold font-technical">Nodes Active</p>
                    <p className="text-4xl font-technical font-bold text-primary tracking-tight">{stats.totalModels}</p>
                    <div className="mt-4 flex items-center gap-2 text-[#00423c] text-[10px] font-bold font-technical">
                      <TrendingUp size={12} /> +{stats.totalModels > 0 ? 12 : 0}%
                    </div>
                  </div>
                  <div className="bg-[#f2f4f6]/50 p-6 rounded-2xl border border-white/50 transition-all hover:bg-white hover:shadow-xl group">
                    <p className="text-[9px] uppercase tracking-extrawide text-slate-400 mb-2 font-bold font-technical">Blind Spots</p>
                    <p className="text-4xl font-technical font-bold text-error tracking-tight">{stats.vulnerabilities}</p>
                    <div className="mt-4 flex items-center gap-2 text-error text-[10px] font-bold uppercase tracking-extrawide font-technical">
                      <AlertTriangle size={12} /> {stats.vulnerabilities > 0 ? 'Urgent' : 'Secure'}
                    </div>
                  </div>
                  <div className="bg-[#f2f4f6]/50 p-6 rounded-2xl border border-white/50 transition-all hover:bg-white hover:shadow-xl group">
                    <p className="text-[9px] uppercase tracking-extrawide text-slate-400 mb-2 font-bold font-technical">Defense Integrity</p>
                    <p className="text-4xl font-technical font-bold text-tertiary tracking-tight">98.2%</p>
                    <div className="mt-4 w-full h-1 bg-slate-100 rounded-full">
                      <div className="h-full bg-tertiary w-[98%] shadow-[0_0_8px_rgba(16,185,129,0.3)]"></div>
                    </div>
                  </div>
                  <div className="bg-[#f2f4f6]/50 p-6 rounded-2xl border border-white/50 transition-all hover:bg-white hover:shadow-xl group">
                    <p className="text-[9px] uppercase tracking-extrawide text-slate-400 mb-2 font-bold font-technical">3D Visuals</p>
                    <p className="text-4xl font-technical font-bold text-secondary tracking-tight">{(stats.totalImages / 1000).toFixed(1)}k</p>
                    <div className="mt-4 flex gap-1">
                      {[1,2,3].map(i => <div key={i} className="w-2 h-2 rounded-full bg-secondary" style={{ opacity: i * 0.33 }}></div>)}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="bg-[#263a61] text-white p-12 rounded-xl shadow-2xl relative overflow-hidden text-center">
              <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(105,214,201,0.15)_0%,transparent_70%)] animate-pulse"></div>
              <Shield className="mx-auto mb-6 text-[#89f5e7]" size={64} fill="currentColor" />
              <h4 className="text-3xl font-headline font-light tracking-tight max-w-lg mx-auto leading-tight">
                AxiomSynth AI Defense Core <span className="font-bold">Operational</span>
              </h4>
              <p className="text-[#b1c4f4] text-xs mt-4 tracking-widest uppercase opacity-80">Autonomous integrity monitoring active • No breaches detected</p>
            </div>
          </div>

          <aside className="col-span-4 flex flex-col gap-8">
            <div className="bg-[#f2f4f6] rounded-xl p-8 flex-1">
              <h3 className="font-headline text-xl font-bold mb-6">Tactical Control</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <Zap size={20} />, label: "Rapid Probe", color: "text-primary" },
                  { icon: <History size={20} />, label: "Synthetic DNA", color: "text-tertiary" },
                  { icon: <Shield size={20} />, label: "Neural Map", color: "text-secondary" },
                  { icon: <Plus size={20} />, label: "New Node", color: "text-slate-400", action: () => setShowForm(true) }
                ].map((item, i) => (
                  <button 
                    key={i}
                    onClick={item.action}
                    className="flex flex-col items-center justify-center p-6 bg-white rounded-xl hover:shadow-xl transition-all group border border-slate-200/10"
                  >
                    <div className={`${item.color} mb-3 group-hover:scale-110 transition-transform`}>{item.icon}</div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{item.label}</span>
                  </button>
                ))}
              </div>

              <h3 className="font-headline text-xl font-bold mt-12 mb-6">Recent Deployments</h3>
              <div className="space-y-6">
                {projects.slice(0, 4).map(p => (
                  <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)} className="flex gap-4 cursor-pointer group">
                    <div className="w-1 h-12 bg-primary/20 rounded-full group-hover:bg-primary transition-colors"></div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{p.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 lowercase truncate w-40">{p.status}</p>
                      <p className="text-[9px] text-slate-400 mt-2">Active Protocol</p>
                    </div>
                  </div>
                ))}
                {projects.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Active Nodes</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#e0e3e5] rounded-xl p-6 relative overflow-hidden">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDI_Br4V9ZnmknsaTihzj54OndYdcFXQCJHTyKJRb6q8DL_pv2l14xA0P7FHs3v35Ue-JXFx-0DUq-hXcjskaVoDivqM4ejKpYDU-iQOa821cotwAofGb1XjEzoZRJCJu1HVBc1VgP1G8FYCWrHOjn4rd0xsLSM_a6mTlLi5a1GgnthaVQqBvyXrrSrxhK5j0TqF6StegUwBdC6P4eLrKFnhx4MSG9eUnT8ik2a4hYO8YeNv6p4yASiyZBUjvUaTojXV_jshGmYzhQ" 
                className="w-full h-32 object-cover rounded-lg mb-4 opacity-70" 
                alt="Network Health" 
              />
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary/60 mb-2">Network Health Index</p>
              <div className="flex justify-between items-end">
                <span className="text-4xl font-headline font-bold text-slate-900">99.4%</span>
                <span className="text-[#00423c] font-bold text-xs uppercase">Nominal</span>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Bottom Console */}
      <nav className="fixed bottom-0 left-64 right-0 z-50 flex justify-around items-center px-12 py-4 h-24 bg-white/70 backdrop-blur-2xl border-t border-primary/10 shadow-[0_-10px_30px_rgba(38,58,97,0.05)]">
        <div className="flex-1 max-w-2xl bg-slate-100 border border-white/30 rounded-2xl px-6 py-2 flex items-center gap-4">
          <Terminal size={18} className="text-slate-400" />
          <input 
            className="bg-transparent border-none focus:ring-0 w-full text-sm font-body tracking-wide placeholder:text-slate-400/50" 
            placeholder="Initialize defense protocol command..." 
            type="text"
          />
          <div className="flex gap-2 text-primary">
            <Mic size={18} className="cursor-pointer hover:scale-110 transition-transform" />
            <Send size={18} className="cursor-pointer hover:scale-110 transition-transform" />
          </div>
        </div>
        <div className="flex gap-8 ml-12">
          <div className="flex flex-col items-center justify-center text-primary ring-1 ring-primary/20 rounded-xl p-2 bg-primary/5">
           <Terminal size={16} />
           <span className="font-body text-[11px] font-bold tracking-tight">Input</span>
          </div>
          <div className="flex flex-col items-center justify-center text-slate-400 p-2 hover:bg-slate-200 transition-all rounded-xl cursor-not-allowed">
            <Settings size={16} />
            <span className="font-body text-[11px] font-bold tracking-tight">Config</span>
          </div>
        </div>
      </nav>
    </div>
  );
}
