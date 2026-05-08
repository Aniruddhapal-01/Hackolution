import React from "react";
import { Link, useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="font-body text-[#191c1e] antialiased">
      {/* TopAppBar */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md shadow-[0_0_40px_0_rgba(38,58,97,0.05)]">
        <div className="flex justify-between items-center h-16 px-8 max-w-[1440px] mx-auto font-headline tracking-tight">
          <div className="text-xl font-bold tracking-[-0.02em] text-slate-900">AxiomSynth</div>
          <div className="hidden md:flex items-center gap-8">
            <Link className="text-slate-900 border-b-2 border-slate-900 pb-1 transition-colors duration-300" to="/">Overview</Link>
            <Link className="text-slate-500 font-medium hover:text-slate-900 transition-colors duration-300" to="/projects">Dashboard</Link>
            {/* <Link className="text-slate-500 font-medium hover:text-slate-900 transition-colors duration-300" to="#">Simulation</Link> */}
            {/* <Link className="text-slate-500 font-medium hover:text-slate-900 transition-colors duration-300" to="#">Datasets</Link> */}
          </div>
          <div className="flex items-center gap-6">
            <Link to="/signin" className="text-slate-500 font-medium hover:text-slate-900 transition-colors">Sign In</Link>
            <Link 
              to="/signup"
              className="bg-slate-900 text-white px-6 py-2.5 rounded-full font-bold shadow-lg shadow-slate-900/10 hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-widest"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative pt-16">
        {/* Background Signature Orbs */}
        <div className="fixed top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#263a61]/5 rounded-full blur-[120px] -z-10"></div>
        <div className="fixed bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#00423c]/5 rounded-full blur-[100px] -z-10"></div>

        {/* Hero Section */}
        <section className="min-h-[921px] flex flex-col justify-center px-8 max-w-[1440px] mx-auto relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#d8e2ff] text-[#33466e] rounded-full text-[10px] font-bold tracking-widest uppercase mb-6">
                <span className="material-symbols-outlined text-[14px]">shield_lock</span>
                Synthetic Immunity v4.0
              </div>
              <h1 className="font-headline text-[3.5rem] md:text-[5rem] leading-[1.05] font-bold tracking-[-0.04em] text-[#191c1e] mb-8">
                The Immune System <br /> for <span className="text-[#263a61] italic">Artificial Intelligence</span>.
              </h1>
              <p className="text-xl text-[#44474e] max-w-[600px] leading-relaxed mb-10">
                AxiomSynth builds deep-layer cryptographic and cognitive defenses. We protect neural weights from adversarial drift, injection, and extraction before the threat manifests.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="group flex items-center justify-center gap-3 bg-white border border-[#c5c6cf]/30 hover:border-[#263a61]/40 px-8 py-4 rounded-xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-all duration-300">
                  <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0ADZliQpjW_Qh8O2j8Ldldo4HXjpXwkuwwO_dHsfGtWVius-t8h7VjMNxclhW_sXW0GcSIDSyW4uVnJJonr4XUIIy8xQ48-U4wINoPBDTtpFQ6yBkVWL1-YBUH4pIkb65QiXrcZIh3hL4PaL6UuqCk5309P609byn4OPsXtarbHQzrfMgAHDX8kdmNbU5Y4OX0Cmlk7xPGbhlwnySncb-Ww8TqrTapgbtZZPHF571PqO8qN9mYu696lVK0wChFCWQ8vI-_p7yLgU" alt="Google Logo" className="w-5 h-5" />
                  <span className="font-bold text-[#191c1e]">Continue with Google</span>
                </button>
                <button 
                  onClick={() => navigate('/projects')}
                  className="bg-[#263a61] text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-[#263a61]/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Initialize Defense Core
                </button>
              </div>
            </div>
            <div className="lg:col-span-5 relative">
              <div className="relative w-full aspect-square rounded-[2rem] overflow-hidden shadow-2xl bg-[#e0e3e5]">
                <img 
                  className="w-full h-full object-cover mix-blend-multiply opacity-80" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCNTW8ZQr7LqPwWng_jejc31ackwj5DsY9P0Jmm-1_n1g7VIVWE-FXYBHJRNg4qKfdh7iRmJFU3AZddronFaCggvCrWqBVZhPMh3feKbPwhODsAtWznXIwhfBCA-Nmjdee3HOR7JZeIJ9vdPGbRU2Dba-oIeM4Mwfax7NPbG_rOdLfak7A4A1NrnWEE2h5dLi_w_gavj8wgbWIwFWAQjQbhwU-NDPbU-84-JxHNbwKZhStL3uLlSjcgdoGcUKaMrkl7kvLX49RP58U" 
                  alt="Abstract neural network" 
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-[#263a61]/20 to-transparent"></div>
                <div className="absolute bottom-8 left-8 right-8 glass-panel p-6 rounded-2xl border border-white/20">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#263a61] flex items-center justify-center">
                      <span className="material-symbols-outlined text-white">verified_user</span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#263a61] tracking-widest uppercase mb-1">Active Defense</div>
                      <div className="text-sm font-medium">99.9% Latency-Free Scrubbing</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Sections */}
        <section className="py-24 px-8 max-w-[1440px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 group relative overflow-hidden rounded-[2rem] bg-[#f2f4f6] p-10 border border-[#c5c6cf]/10 hover:shadow-2xl transition-all duration-500">
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-12">
                  <div>
                    <span className="material-symbols-outlined text-4xl mb-4 text-[#6200EE]">biotech</span>
                    <h3 className="font-headline text-3xl font-bold mb-4">Adversarial Probing</h3>
                    <p className="text-[#44474e] max-w-sm">Stress-test your models against 14,000+ vector-based injection techniques. Discover vulnerabilities before deployment.</p>
                  </div>
                  <div className="w-32 h-32 glass-panel rounded-full flex items-center justify-center border border-[#6200EE]/10 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-5xl text-[#6200EE] animate-pulse">radar</span>
                  </div>
                </div>
                <div className="mt-auto flex items-center gap-4">
                  <span className="px-4 py-1.5 rounded-full bg-[#6200EE]/10 text-[#6200EE] text-xs font-bold tracking-widest uppercase">Intelligence</span>
                  <div 
                    onClick={() => navigate('/projects')}
                    className="text-sm font-bold flex items-center gap-1 group-hover:gap-3 transition-all cursor-pointer"
                  >
                    Open Console <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-[2rem] bg-[#f2f4f6] p-10 border border-[#c5c6cf]/10 hover:shadow-2xl transition-all duration-500">
              <div className="relative z-10 flex flex-col h-full">
                <span className="material-symbols-outlined text-4xl mb-6 text-[#FF6D00]">model_training</span>
                <h3 className="font-headline text-3xl font-bold mb-4">Real-time Simulation</h3>
                <p className="text-[#44474e] mb-8 text-sm leading-relaxed">Execute twin-model environments to simulate malicious drift in high-fidelity sandbox networks.</p>
                <div className="mt-auto h-32 bg-[#eceef0] rounded-xl flex items-end p-4 gap-1">
                  <div className="flex-1 bg-[#FF6D00]/40 rounded-t h-[20%] group-hover:h-[60%] transition-all duration-700"></div>
                  <div className="flex-1 bg-[#FF6D00]/60 rounded-t h-[45%] group-hover:h-[85%] transition-all duration-700 delay-75"></div>
                  <div className="flex-1 bg-[#FF6D00]/40 rounded-t h-[30%] group-hover:h-[70%] transition-all duration-700 delay-150"></div>
                  <div className="flex-1 bg-[#FF6D00]/80 rounded-t h-[60%] group-hover:h-[40%] transition-all duration-700 delay-225"></div>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-[2rem] bg-[#f2f4f6] p-10 border border-[#c5c6cf]/10 hover:shadow-2xl transition-all duration-500">
              <div className="relative z-10 flex flex-col h-full">
                <span className="material-symbols-outlined text-4xl mb-6 text-[#00B8D4]">database</span>
                <h3 className="font-headline text-3xl font-bold mb-4">Immutable Datasets</h3>
                <p className="text-[#44474e] mb-8 text-sm leading-relaxed">Cryptographically signed data pools ensuring lineage and provenance for enterprise LLM training.</p>
                <div className="mt-auto flex -space-x-3">
                  <div className="w-10 h-10 rounded-full border-2 border-[#f2f4f6] bg-[#e0e3e5]"></div>
                  <div className="w-10 h-10 rounded-full border-2 border-[#f2f4f6] bg-[#263a61]"></div>
                  <div className="w-10 h-10 rounded-full border-2 border-[#f2f4f6] bg-[#00423c]"></div>
                  <div className="w-10 h-10 rounded-full border-2 border-[#f2f4f6] bg-[#00B8D4] flex items-center justify-center text-[10px] font-bold text-white">+82</div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 group relative overflow-hidden rounded-[2rem] bg-[#263a61] text-white p-12 hover:shadow-[0_40px_80px_-15px_rgba(38,58,97,0.3)] transition-all duration-500">
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="font-headline text-4xl font-bold mb-6 leading-tight">Defense is no longer optional. It's structural.</h3>
                  <p className="text-white/80 text-lg mb-8">In an era of automated attacks, static firewalls are obsolete. AxiomSynth provides the dynamic, self-healing core your AI ecosystem demands.</p>
                  <button onClick={() => navigate('/projects')} className="bg-white text-[#263a61] px-8 py-4 rounded-xl font-bold hover:bg-[#89f5e7] transition-colors">Start Integration</button>
                </div>
                <div className="relative">
                  <div className="w-full aspect-square border border-white/10 rounded-full flex items-center justify-center p-8">
                    <div className="w-full h-full border border-white/20 rounded-full flex items-center justify-center p-8 animate-[spin_20s_linear_infinite]">
                      <span className="material-symbols-outlined text-white/40 text-6xl">all_inclusive</span>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="material-symbols-outlined text-7xl text-[#6bd8cb]">shield_with_heart</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-32 px-8 text-center max-w-4xl mx-auto">
          <h2 className="font-headline text-5xl font-bold tracking-tight mb-8">Secure the synthetic frontier today.</h2>
          <p className="text-xl text-[#44474e] mb-12">No credit card required. Connect your cloud environment and begin probing in minutes.</p>
          <div className="flex justify-center gap-6">
            <button onClick={() => navigate('/projects')} className="bg-[#191c1e] text-white px-10 py-5 rounded-full font-bold text-lg hover:scale-105 active:scale-95 transition-all">Get Started for Free</button>
            <button className="flex items-center gap-2 font-bold px-10 py-5 rounded-full hover:bg-[#e6e8ea] transition-colors">Contact Sales <span className="material-symbols-outlined">call_made</span></button>
          </div>
        </section>
      </main>

      <footer className="w-full py-12 bg-[#f7f9fb] border-t border-[#c5c6cf]/20 font-headline text-sm">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col gap-2">
            <div className="font-bold text-slate-900 text-lg">AxiomSynth</div>
            <p className="text-slate-500">© 2024 AxiomSynth AI Defense Core. Built for Intellectual Clarity.</p>
          </div>
          <div className="flex gap-8">
            <Link className="text-slate-500 hover:text-slate-900 underline underline-offset-4 transition-all" to="#">Documentation</Link>
            <Link className="text-slate-500 hover:text-slate-900 underline underline-offset-4 transition-all" to="#">Privacy</Link>
            <Link className="text-slate-500 hover:text-slate-900 underline underline-offset-4 transition-all" to="#">Security</Link>
            <Link className="text-slate-500 hover:text-slate-900 underline underline-offset-4 transition-all" to="#">Terminal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
