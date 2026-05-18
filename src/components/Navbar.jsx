import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onOpenLogin }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const isDashboard = location.pathname.startsWith('/student') || location.pathname.startsWith('/admin');
  if (isDashboard) return null;

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
    { to: '/courses', label: 'Courses' },
    { to: '/videos', label: 'Demo Videos' },
    { to: '/gallery', label: 'Gallery' },
    { to: '/achievements', label: 'Achievements' },
    { to: '/counselling', label: 'Counselling' },
    { to: '/contact', label: 'Contact' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-black/90 backdrop-blur-lg shadow-lg shadow-green-brand/5 border-b border-white/5'
            : 'bg-transparent'
        }`}
      >
        <div className="container-main">
          <div className="flex items-center justify-between h-[72px]">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 no-underline group">
              <div className="relative">
                <div className="absolute -inset-1 bg-green-brand/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <img src="/Images/RBT Logo.jpeg" alt="RBT Mission Learning" width="40" height="40" decoding="async" className="relative w-10 h-10 rounded-xl object-cover shadow-lg" />
              </div>
              <div>
                <h1 className="text-base font-bold leading-tight tracking-tight font-[var(--font-heading)] text-white">
                  RBT MISSION
                </h1>
                <p className="text-[10px] font-medium tracking-widest uppercase text-green-brand">
                  LEARNING
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all no-underline ${
                    location.pathname === link.to
                      ? 'text-green-brand'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {link.label}
                  {location.pathname === link.to && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute inset-0 bg-green-brand/10 rounded-lg border border-green-brand/20"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              {user ? (
                <div className="relative">
                  <button 
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full py-1.5 px-2 pr-4 transition-all"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-brand text-white flex items-center justify-center font-bold text-sm overflow-hidden border border-white/20">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        user.name ? user.name.charAt(0).toUpperCase() : 'S'
                      )}
                    </div>
                    <span className="text-white text-sm font-medium">
                      {user.name ? user.name.split(' ')[0] : 'Student'}
                    </span>
                    <svg className={`w-4 h-4 text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-48 bg-[#111] border border-white/10 rounded-xl shadow-2xl py-2 z-50 overflow-hidden"
                      >
                        <Link
                          to={user.role === 'admin' ? '/admin' : '/student'}
                          onClick={() => setProfileOpen(false)}
                          className="block px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors no-underline"
                        >
                          Dashboard
                        </Link>
                        <button 
                          onClick={() => { setProfileOpen(false); handleLogout(); }} 
                          className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors"
                        >
                          Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  onClick={onOpenLogin}
                  className="btn-primary !py-2 !px-5 !text-sm"
                >
                  Student Login
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden flex flex-col items-center justify-center w-10 h-10 gap-1.5 relative z-[60]"
              aria-label="Toggle menu"
            >
              <motion.span
                animate={menuOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
                className="block w-6 h-0.5 rounded-full bg-white origin-center"
              />
              <motion.span
                animate={menuOpen ? { opacity: 0, scale: 0 } : { opacity: 1, scale: 1 }}
                className="block w-6 h-0.5 rounded-full bg-white"
              />
              <motion.span
                animate={menuOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
                className="block w-6 h-0.5 rounded-full bg-white origin-center"
              />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMenuOpen(false)}
            />
            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 w-[280px] z-50 bg-[#0a0a0a] border-l border-white/10 lg:hidden overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <img src="/Images/RBT Logo.jpeg" alt="RBT" width="32" height="32" decoding="async" className="w-8 h-8 rounded-lg object-cover" />
                    <span className="text-sm font-bold text-white">RBT MISSION</span>
                  </div>
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                    </svg>
                  </button>
                </div>

                <nav className="flex flex-col gap-1">
                  {navLinks.map((link, i) => (
                    <motion.div
                      key={link.to}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link
                        to={link.to}
                        className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium no-underline transition-all ${
                          location.pathname === link.to
                            ? 'bg-green-brand/10 text-green-brand border border-green-brand/20'
                            : 'text-white/70 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  ))}
                </nav>

                <div className="border-t border-white/10 my-6" />

                {user ? (
                  <div className="space-y-2 mt-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-green-brand text-white flex items-center justify-center font-bold text-lg overflow-hidden border border-white/20">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          user.name ? user.name.charAt(0).toUpperCase() : 'S'
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.name || 'Student'}</p>
                        <p className="text-xs text-slate-400 capitalize">{user.role || 'Student'}</p>
                      </div>
                    </div>
                    <Link 
                      to={user.role === 'admin' ? '/admin' : '/student'} 
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-center w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors no-underline"
                    >
                      Go to Dashboard
                    </Link>
                    <button 
                      onClick={() => { setMenuOpen(false); handleLogout(); }} 
                      className="flex items-center justify-center w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-medium transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenLogin();
                    }}
                    className="btn-primary text-center w-full"
                  >
                    Student Login
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
