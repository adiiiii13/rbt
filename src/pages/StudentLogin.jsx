import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function StudentLogin({ isPopup, onClose, onSwitchToSignup }) {
  const [mode, setMode] = useState(null); // null = choose, 'batch', 'basic'
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [upgradeConfirm, setUpgradeConfirm] = useState(false); // New state for confirmation
  const { loginWithGoogle, loginStudent } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // For email/password login
  const handleEmailLogin = async (e, isBatch = false) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const result = await loginStudent(email, password, isBatch);
      if (result.success) {
        if (onClose) onClose();
        const dest = (result.user?.batch || result.user?.batchStatus === 'pending') ? '/student-initialization' : (result.user?.batch ? '/student' : '/basic');
        navigate(dest, { replace: true });
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google login
  const handleGoogleLogin = async (isBatch = false) => {
    setError('');
    setIsLoading(true);
    try {
      const result = await loginWithGoogle(isBatch);
      
      if (result.success) {
        if (onClose) onClose();
        const dest = (result.user?.batch || result.user?.batchStatus === 'pending') ? '/student-initialization' : (result.user?.batch ? '/student' : '/basic');
        navigate(dest, { replace: true });
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M47.532 24.5528C47.532 22.9214 47.3997 21.2811 47.1175 19.6761H24.48V28.9181H37.4434C36.9055 31.8988 35.177 34.5356 32.6461 36.2111V42.2078H40.3801C44.9217 38.0278 47.532 31.8547 47.532 24.5528Z" fill="#4285F4"/>
      <path d="M24.48 48.0016C30.9529 48.0016 36.4116 45.8764 40.3888 42.2078L32.6549 36.2111C30.5031 37.675 27.7252 38.5039 24.4888 38.5039C18.2275 38.5039 12.9187 34.2798 11.0139 28.6006H3.03296V34.7825C7.10718 42.8868 15.4056 48.0016 24.48 48.0016Z" fill="#34A853"/>
      <path d="M11.0051 28.6006C9.99973 25.6199 9.99973 22.3922 11.0051 19.4115V13.2296H3.03296C-0.371021 20.0112 -0.371021 28.0009 3.03296 34.7825L11.0051 28.6006Z" fill="#FBBC05"/>
      <path d="M24.48 9.49932C27.9016 9.44641 31.2086 10.7339 33.6866 13.0973L40.5387 6.24523C36.2 2.17101 30.4414 -0.068932 24.48 0.00161733C15.4056 0.00161733 7.10718 5.11644 3.03296 13.2296L11.0051 19.4115C12.901 13.7235 18.2187 9.49932 24.48 9.49932Z" fill="#EA4335"/>
    </svg>
  );

  const loginContent = (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10 w-full max-w-md">
      <div className="bg-[#0d1117] backdrop-blur-xl p-8 rounded-2xl border border-white/10 relative overflow-hidden shadow-2xl">
        {isPopup && (
          <button onClick={onClose} className="absolute top-4 right-4 z-210 w-8 h-8 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        )}

        <div className="absolute top-0 right-0 w-32 h-32 bg-green-brand/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-8 relative z-10">
          <Link to="/" onClick={() => { if (onClose) onClose(); }} className="inline-flex items-center gap-3 no-underline mb-6 group">
            <div className="relative">
              <div className="absolute -inset-1 bg-linear-to-r from-green-brand to-emerald-400 rounded-xl blur opacity-10 group-hover:opacity-20 transition duration-500"></div>
              <img src="/Images/RBT Logo.jpeg" alt="RBT Mission Learning" width="48" height="48" className="relative w-12 h-12 rounded-xl object-cover shadow-lg" />
            </div>
            <div className="text-left">
              <h2 className="text-white font-bold text-lg leading-tight">RBT MISSION</h2>
              <p className="text-green-brand text-[10px] tracking-widest font-semibold uppercase">Learning</p>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Student Login</h1>
          <p className="text-slate-400 text-sm">Choose your login type to continue</p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* MODE SELECT */}
          {!mode && (
            <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 relative z-10">
              <button onClick={() => setMode('batch')} className="w-full bg-green-brand/10 hover:bg-green-brand/20 border border-green-brand/30 text-white font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-brand/20 flex items-center justify-center text-green-brand">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                  </div>
                  <div className="text-left">
                    <p className="text-white font-bold">Batch Student Login</p>
                    <p className="text-xs text-slate-400">For enrolled batch students. Full dashboard access.</p>
                  </div>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400 group-hover:text-white transition-colors"><path d="m9 18 6-6-6-6"/></svg>
              </button>

              <button onClick={() => setMode('basic')} className="w-full bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-white font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  </div>
                  <div className="text-left">
                    <p className="text-white font-bold">Basic Login</p>
                    <p className="text-xs text-slate-400">Demo videos, courses, free test series.</p>
                  </div>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400 group-hover:text-white transition-colors"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </motion.div>
          )}

          {/* BATCH LOGIN */}
          {mode === 'batch' && (
            <motion.div key="batch" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 relative z-10">
              <button onClick={() => setMode(null)} className="text-slate-400 text-sm hover:text-white transition-colors mb-2 flex items-center gap-1 cursor-pointer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                Back
              </button>
              <h3 className="text-white font-bold text-lg">Batch Student Login</h3>
              <p className="text-slate-400 text-sm mb-4">Log in to access your batch dashboard.</p>

              <button onClick={() => handleGoogleLogin(true)} disabled={isLoading} className="w-full bg-green-brand hover:bg-green-600 text-white font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50">
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <GoogleIcon />
                )}
                Sign in with Google
              </button>
              
              <div className="relative flex items-center py-2">
                <div className="grow border-t border-white/10"></div>
                <span className="shrink-0 mx-4 text-slate-500 text-sm">or login with email</span>
                <div className="grow border-t border-white/10"></div>
              </div>
              
              <form onSubmit={(e) => handleEmailLogin(e, true)} className="space-y-3">
                <input required type="email" autoComplete="email" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-green-brand focus:ring-1 focus:ring-green-brand transition-all text-sm" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <div className="relative">
                  <input required type={showPassword ? "text" : "password"} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder:text-slate-500 focus:outline-none focus:border-green-brand focus:ring-1 focus:ring-green-brand transition-all text-sm" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" tabIndex="-1">{showPassword ? 'HIDE' : 'SHOW'}</button>
                </div>
                <button type="submit" disabled={isLoading} className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3 px-4 rounded-xl transition-all text-sm cursor-pointer disabled:opacity-50">
                  {isLoading ? 'Logging in...' : 'Login as Batch Student'}
                </button>
              </form>

            </motion.div>
          )}

          {/* BASIC LOGIN */}
          {mode === 'basic' && (
            <motion.div key="basic" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 relative z-10">
              <button onClick={() => setMode(null)} className="text-slate-400 text-sm hover:text-white transition-colors mb-2 flex items-center gap-1 cursor-pointer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                Back
              </button>
              <h3 className="text-white font-bold text-lg">Basic Login</h3>
              <p className="text-slate-400 text-sm">Sign in with Google or Email to access free content.</p>

              <button onClick={() => handleGoogleLogin(false)} disabled={isLoading} className="w-full bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-white font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50">
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <GoogleIcon />
                )}
                Sign in with Google
              </button>

              <div className="relative flex items-center py-2">
                <div className="grow border-t border-white/10"></div>
                <span className="shrink-0 mx-4 text-slate-500 text-sm">or login with email</span>
                <div className="grow border-t border-white/10"></div>
              </div>
              
              <form onSubmit={(e) => handleEmailLogin(e, false)} className="space-y-3">
                <input required type="email" autoComplete="email" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <div className="relative">
                  <input required type={showPassword ? "text" : "password"} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" tabIndex="-1">{showPassword ? 'HIDE' : 'SHOW'}</button>
                </div>
                <button type="submit" disabled={isLoading} className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3 px-4 rounded-xl transition-all text-sm cursor-pointer disabled:opacity-50">
                  {isLoading ? 'Logging in...' : 'Login as Basic Student'}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="text-center mt-8 space-y-2 relative z-10">
        <p className="text-slate-400 text-sm">
          Don't have an account?{' '}
          <button type="button" onClick={onSwitchToSignup} className="text-green-brand font-semibold no-underline hover:text-emerald-400 transition-colors ml-1 cursor-pointer">
            Sign up here
          </button>
        </p>
        <p className="text-slate-400 text-sm">
          Are you an administrator? <Link to="/admin-login" onClick={() => { if (onClose) onClose(); }} className="text-green-brand font-semibold no-underline hover:text-emerald-400 transition-colors ml-1">Login here</Link>
        </p>
      </div>
    </motion.div>
  );

  if (isPopup) {
    return (
      <motion.div initial={{ opacity: 0, backdropFilter: "blur(0px)" }} animate={{ opacity: 1, backdropFilter: "blur(10px)" }} exit={{ opacity: 0, backdropFilter: "blur(0px)" }} className="fixed inset-0 z-200 flex items-center justify-center px-4 bg-black/80" onClick={onClose}>
        <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md">{loginContent}</div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050B14] flex items-center justify-center px-4 py-24 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-125 h-125 bg-green-brand/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-75 h-75 bg-blue-500/5 rounded-full blur-[80px]" />
      </div>
      {loginContent}
    </div>
  );
}
