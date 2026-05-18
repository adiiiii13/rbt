import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { LockIcon, EyeIcon, EyeOffIcon } from '../components/Icons';

export default function AdminLogin({ isPopup, onClose }) {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/admin';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const result = await loginAdmin(id, password);
      if (result.success) {
        if (onClose) onClose();
        navigate(from, { replace: true });
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    }
  };

  const loginContent = (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10 w-full max-w-md">
      {isPopup && (
        <button 
          onClick={onClose}
          className="absolute -top-16 right-0 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full w-10 h-10 flex items-center justify-center transition-colors shadow-lg z-[210]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      )}
      
      <div className="text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-3 no-underline mb-6 group">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-brand to-emerald-400 rounded-xl blur opacity-10 group-hover:opacity-20 transition duration-500"></div>
            <img src="/Images/RBT Logo.jpeg" alt="RBT Mission Learning" className="relative w-12 h-12 rounded-xl object-cover shadow-lg" />
          </div>
          <div className="text-left">
            <h2 className="text-white font-bold text-lg leading-tight">RBT MISSION</h2>
            <p className="text-green-brand text-[10px] tracking-widest font-semibold uppercase">Learning</p>
          </div>
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-brand/10 border border-green-brand/20 flex items-center justify-center text-green-brand">
            <LockIcon size={20} />
          </div>
          Admin Login
        </h1>
        <p className="text-slate-400 text-sm">Secure access to the management panel</p>
      </div>

      <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 relative overflow-hidden shadow-2xl">
        {/* Internal gradient flare */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-brand/20 rounded-full blur-[40px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] pointer-events-none" />

        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <label className="text-sm font-medium text-slate-300 mb-2 block">Admin Email</label>
            <input
              required
              type="email"
              autoComplete="email"
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-green-brand focus:ring-1 focus:ring-green-brand focus:bg-black/40 transition-all"
              placeholder="admin@rbtmission.com"
              value={id}
              onChange={(e) => setId(e.target.value)}
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <label className="text-sm font-medium text-slate-300 mb-2 block">Password</label>
            <div className="relative">
              <input 
                required 
                type={showPassword ? "text" : "password"} 
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 pr-12 text-white placeholder:text-slate-500 focus:outline-none focus:border-green-brand focus:ring-1 focus:ring-green-brand focus:bg-black/40 transition-all" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-green-brand transition-colors focus:outline-none"
                tabIndex="-1"
              >
                {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
              </button>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="pt-2">
            <button type="submit" className="w-full bg-navy hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer border border-white/10">
              Login to Admin Panel <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
          </motion.div>
        </form>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-8 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400"><path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Authorized Personnel Only</p>
          </div>
          <p className="text-xs text-slate-400">
            Contact system administrator for access credentials.
          </p>
        </motion.div>
      </div>

      <p className="text-center mt-8 text-slate-400 text-sm">
        Are you a student? <Link to="/student-login" className="text-green-brand font-semibold no-underline hover:text-emerald-400 transition-colors ml-1">Login here</Link>
      </p>
    </motion.div>
  );

  if (isPopup) {
    return (
      <motion.div 
        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
        animate={{ opacity: 1, backdropFilter: "blur(10px)" }}
        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
        className="fixed inset-0 z-[200] flex items-center justify-center px-4 bg-transparent"
        onClick={onClose}
      >
        <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md">
          {loginContent}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050B14] flex items-center justify-center px-4 py-24 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-green-brand/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px]" />
      </div>
      {loginContent}
    </div>
  );
}

