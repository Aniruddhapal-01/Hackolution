import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Eye, ArrowLeft, UserPlus } from 'lucide-react';

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    // Mock login for local mode
    navigate('/projects');
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px]"></div>

      {/* Header */}
      <div className="p-8 flex justify-between items-center relative z-10">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-white shadow-xl rounded-xl flex items-center justify-center border border-indigo-50/50 group-hover:scale-110 transition-transform">
             <ArrowLeft size={18} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </div>
          <span className="text-xs font-technical font-bold uppercase tracking-widest text-slate-400">Back to Landing</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-[440px]">
          <div className="bg-white/70 backdrop-blur-2xl border border-white rounded-[40px] p-12 shadow-[0_32px_80px_rgba(31,38,135,0.07)]">
            
            {/* Logo Area */}
            <div className="mb-10 text-center">
              <div className="w-20 h-20 bg-emerald-500 rounded-3xl mx-auto flex items-center justify-center shadow-[0_20px_40px_rgba(16,185,129,0.2)] mb-6 ring-8 ring-emerald-50 transition-transform hover:-rotate-6">
                <UserPlus size={36} className="text-white" />
              </div>
              <h1 className="text-3xl font-display text-slate-900 mb-2">Create Account</h1>
              <p className="text-slate-500 text-sm font-body">Initialize your operator profile</p>
            </div>

            {/* Google Section */}
            <div className="space-y-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-slate-400 font-technical tracking-widest">Global Protocol</span></div>
              </div>

              <button 
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-4 py-4 bg-white rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md hover:bg-emerald-50/30 transition-all font-body font-bold text-slate-700"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                Sign Up with Google
              </button>

              <div className="text-center pt-4">
                <p className="text-xs text-slate-400 font-body">
                  Already have an account? <Link to="/signin" className="text-indigo-600 font-bold hover:underline">Sign In</Link>
                </p>
              </div>

              <p className="text-[10px] text-center text-slate-400 font-body px-8 leading-relaxed">
                By creating an account, you agree to comply with Autonomous Edge Defense protocols and data sovereignty standards.
              </p>
            </div>

            {/* Footer Features */}
            <div className="mt-12 pt-8 border-t border-slate-50 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
                <Lock size={12} className="text-indigo-600" />
                <span className="text-[9px] font-technical font-bold uppercase tracking-wider text-slate-600">Identity-Sec</span>
              </div>
              <div className="flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
                <Eye size={12} className="text-emerald-500" />
                <span className="text-[9px] font-technical font-bold uppercase tracking-wider text-slate-600">Traceable</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
