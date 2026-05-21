import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { messaging, db } from '../lib/firebase'
import { getToken } from 'firebase/messaging'
import { doc, updateDoc } from 'firebase/firestore'
import toast from 'react-hot-toast'

// Inline SVG icon map — avoids tree-shake issues with lazy-loaded chunks
const I = (d) => ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d={d} /></svg>
)
const IC = {
  home: I("m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"),
  book: I("M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"),
  file: I("M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"),
  pdf: I("M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z M14.5 2v5.5H19"),
  play: I("m5 3 14 9-14 9V3z"),
  bell: I("M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"),
  trophy: I("M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"),
  users: I("M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"),
  msg: I("M7.9 20A9 9 0 1 0 4 16.1L2 22z"),
  star: I("M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.13 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"),
  calendar: I("M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"),
  card: I("M11 18h2M12 18v4M8 2h8l4 4v10a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4z"),
  mail: I("M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8"),
  headset: I("M3 18v-6a9 9 0 0 1 18 0v6M3 18a3 3 0 0 0 3 3h1a3 3 0 0 0 3-3v-4a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v4zM21 18a3 3 0 0 1-3 3h-1a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3h1a3 3 0 0 1 3 3v4z"),
  help: I("M2 12c0 5.5 4.5 10 10 10s10-4.5 10-10S17.5 2 12 2 2 6.5 2 12zm5.5 3.5a5 5 0 0 1 9 0"),
  receipt: I("M4 2v20l4-2 4 2 4-2 4 2V2l-4 2-4-2-4 2-4-2zM8 10h8M8 14h5"),
}

export default function DashboardLayout({ type }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const studentLinks = [
    { to: '/student', label: 'Dashboard', icon: <IC.home size={18} />, end: true },
    { to: '/student/courses', label: 'My Courses', icon: <IC.book size={18} /> },
    { to: '/student/test-papers', label: 'Test Papers', icon: <IC.file size={18} /> },
    { to: '/student/pdfs', label: 'Study Material', icon: <IC.pdf size={18} /> },
    { to: '/student/videos', label: 'Demo Videos', icon: <IC.play size={18} /> },
    { to: '/student/counselling', label: 'Counselling', icon: <IC.headset size={18} /> },
    { to: '/student/invoices', label: 'My Invoices', icon: <IC.receipt size={18} /> },
    { to: '/student/notices', label: 'Notices', icon: <IC.bell size={18} /> },
    { to: '/student/achievements', label: 'Achievements', icon: <IC.trophy size={18} /> },
    { to: '/student/doubts', label: 'My Doubts', icon: <IC.msg size={18} /> },
    { to: '/student/mock-results', label: 'My Results', icon: <IC.trophy size={18} /> },
  ]

  const basicLinks = [
    { to: '/basic', label: 'Dashboard', icon: <IC.home size={18} />, end: true },
    { to: '/basic/courses', label: 'Courses', icon: <IC.book size={18} /> },
    { to: '/basic/videos', label: 'Demo Videos', icon: <IC.play size={18} /> },
    { to: '/basic/test-papers', label: 'Free Test Series', icon: <IC.file size={18} /> },
    { to: '/basic/payment', label: 'Payment', icon: <IC.card size={18} /> },
  ]

  const adminLinks = [
    { to: '/admin', label: 'Dashboard', icon: <IC.home size={18} />, end: true },
    { to: '/admin/courses', label: 'Manage Courses', icon: <IC.book size={18} /> },
    { to: '/admin/pdfs', label: 'Manage PDFs', icon: <IC.file size={18} /> },
    { to: '/admin/mock-tests', label: 'Manage Mock Tests', icon: <IC.file size={18} /> },
    { to: '/admin/mock-results', label: 'Mock Results', icon: <IC.trophy size={18} /> },
    { to: '/admin/study-material', label: 'Study Material', icon: <IC.file size={18} /> },
    { to: '/admin/videos', label: 'Manage Videos', icon: <IC.play size={18} /> },
    { to: '/admin/gallery', label: 'Manage Gallery', icon: <IC.users size={18} /> },
    { to: '/admin/testimonials', label: 'Testimonials', icon: <IC.msg size={18} /> },
    { to: '/admin/achievements', label: 'Achievements', icon: <IC.trophy size={18} /> },
    { to: '/admin/students', label: 'Students', icon: <IC.users size={18} /> },
    { to: '/admin/notices', label: 'Notices', icon: <IC.bell size={18} /> },
    { to: '/admin/payments', label: 'Payments', icon: <IC.card size={18} /> },
    { to: '/admin/counselling', label: 'Counselling', icon: <IC.calendar size={18} /> },
    { to: '/admin/offers', label: 'Offers', icon: <IC.bell size={18} /> },
    { to: '/admin/inquiries', label: 'Inquiries', icon: <IC.mail size={18} /> },
    { to: '/admin/doubts', label: 'Doubts', icon: <IC.msg size={18} /> },
    { to: '/admin/notifications', label: 'Send Notifications', icon: <IC.bell size={18} /> },
    { to: '/admin/invoices', label: 'Create Invoices', icon: <IC.receipt size={18} /> },
    { to: '/admin/help', label: 'Help', icon: <IC.star size={18} /> },
  ]

  const links = type === 'admin' ? adminLinks : type === 'basic' ? basicLinks : studentLinks

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  useEffect(() => {
    const setupFCM = async () => {
      try {
        const msg = await messaging
        if (!msg) return
        
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {
          // Register SW manually so we can pass config
          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
          registration.active?.postMessage({
            type: 'FIREBASE_CONFIG',
            config: {
              apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
              projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
              messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
              appId: import.meta.env.VITE_FIREBASE_APP_ID,
            }
          });

          const currentToken = await getToken(msg, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeZ1vskM29Z1vskM', // Placeholder if no vapidKey
            serviceWorkerRegistration: registration,
          })

          if (currentToken && user?.uid && user.role === 'student') {
            await updateDoc(doc(db, 'students', user.uid), {
              fcmToken: currentToken
            })
          }
        }
      } catch (err) {
        console.log('[FCM] Token error', err)
      }
    }
    setupFCM()
  }, [user])

  return (
    <div className="flex h-screen bg-[#f1f5f9] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-[260px] bg-navy text-white shrink-0">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img src="/Images/RBT Logo.jpeg" alt="RBT Mission Learning" className="w-9 h-9 rounded-lg object-cover" />
            <div>
              <h3 className="text-sm font-bold">RBT MISSION</h3>
              <p className="text-[9px] tracking-widest text-green-light">LEARNING</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
          {links.map((link, idx) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `sidebar-link group ${isActive ? 'active' : ''}`
              }
            >
              <span className="sidebar-icon-wrap">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-9 h-9 rounded-full bg-green-brand/20 flex items-center justify-center text-green-light font-bold text-sm overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0) || 'U'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-400 truncate">
                {user?.role === 'admin' ? 'Administrator' : user?.course || 'Student'}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <NavLink
              to="/"
              className="w-full py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-sm font-medium transition-all text-center no-underline"
            >
              ⌂ Back to Home
            </NavLink>
            <button
              onClick={handleLogout}
              className="w-full py-2.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-400 text-sm font-medium transition-all cursor-pointer"
            >
              ← Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-[#0a1628] border-b border-slate-800 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-10 h-10 rounded-lg hover:bg-white/10 flex items-center justify-center text-xl text-white"
              aria-label="Open sidebar"
            >
              ☰
            </button>
            <div>
              <h2 className="text-base font-semibold text-white">
                {type === 'admin' ? 'Admin Panel' : type === 'basic' ? 'Basic Portal' : 'Student Portal'}
              </h2>
              <p className="text-xs text-slate-400">
                {user?.name || 'User'}
                {user?.studentId ? ` • ${user.studentId}` : user?.id ? ` • RBT-${user.id.substring(0, 6).toUpperCase()}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Refresh"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
            </button>
            <span className={`badge ${type === 'admin' ? 'badge-navy' : 'badge-green'}`}>
              {type === 'admin' ? 'Admin' : 'Student'}
            </span>
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-[#0a0a0a]">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden flex items-center justify-around bg-[#0a1628] border-t border-slate-800 py-2 shrink-0 overflow-x-auto">
          {links.slice(0, type === 'admin' ? 8 : 7).map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-xs no-underline transition-colors ${
                  isActive ? 'text-green-brand' : 'text-slate-400'
                }`
              }
            >
              {link.icon}
              <span className="font-medium">{link.label.split(' ').pop()}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-[280px] bg-navy text-white z-50 flex flex-col lg:hidden"
            >
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src="/Images/RBT Logo.jpeg" alt="RBT Mission Learning" className="w-9 h-9 rounded-lg object-cover" />
                  <div>
                    <h3 className="text-sm font-bold">RBT MISSION</h3>
                    <p className="text-[9px] tracking-widest text-green-light">LEARNING</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60"
                >
                  ✕
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
                {links.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `sidebar-link group ${isActive ? 'active' : ''}`
                    }
                  >
                    <span className="sidebar-icon-wrap">{link.icon}</span>
                    {link.label}
                  </NavLink>
                ))}
              </nav>

              <div className="p-4 border-t border-white/10">
                <div className="flex flex-col gap-2">
                  <NavLink
                    to="/"
                    className="w-full py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-sm font-medium transition-all text-center no-underline"
                  >
                    ⌂ Back to Home
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="w-full py-2.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-400 text-sm font-medium transition-all cursor-pointer"
                  >
                    ← Logout
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
