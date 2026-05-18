import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { messaging, db } from '../lib/firebase'
import { getToken } from 'firebase/messaging'
import { doc, updateDoc } from 'firebase/firestore'
import toast from 'react-hot-toast'
import {
  HomeIcon, BookOpenIcon, FileTextIcon, PlayCircleIcon,
  BellIcon, TrophyIcon, UsersIcon, MessageSquareIcon,
  CalendarIcon, CreditCardIcon
} from './Icons'

const studentLinks = [
  { to: '/student', label: 'Dashboard', icon: <HomeIcon size={18} />, end: true },
  { to: '/student/courses', label: 'My Courses', icon: <BookOpenIcon size={18} /> },
  { to: '/student/test-papers', label: 'Test Papers', icon: <FileTextIcon size={18} /> },
  { to: '/student/pdfs', label: 'Study Material', icon: <FileTextIcon size={18} /> },
  { to: '/student/videos', label: 'Demo Videos', icon: <PlayCircleIcon size={18} /> },
  { to: '/student/counselling', label: 'Counselling', icon: <CalendarIcon size={18} /> },
  { to: '/student/invoices', label: 'My Invoices', icon: <CreditCardIcon size={18} /> },
  { to: '/student/notices', label: 'Notices', icon: <BellIcon size={18} /> },
  { to: '/student/achievements', label: 'Achievements', icon: <TrophyIcon size={18} /> },
]

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: <HomeIcon size={18} />, end: true },
  { to: '/admin/courses', label: 'Manage Courses', icon: <BookOpenIcon size={18} /> },
  { to: '/admin/test-papers', label: 'Manage Test Papers', icon: <FileTextIcon size={18} /> },
  { to: '/admin/pdfs', label: 'Manage PDFs', icon: <FileTextIcon size={18} /> },
  { to: '/admin/videos', label: 'Manage Videos', icon: <PlayCircleIcon size={18} /> },
  { to: '/admin/gallery', label: 'Manage Gallery', icon: <UsersIcon size={18} /> },
  { to: '/admin/testimonials', label: 'Testimonials', icon: <MessageSquareIcon size={18} /> },
  { to: '/admin/achievements', label: 'Achievements', icon: <TrophyIcon size={18} /> },
  { to: '/admin/students', label: 'Students', icon: <UsersIcon size={18} /> },
  { to: '/admin/notices', label: 'Notices', icon: <BellIcon size={18} /> },
  { to: '/admin/payments', label: 'Payments', icon: <CreditCardIcon size={18} /> },
  { to: '/admin/counselling', label: 'Counselling', icon: <CalendarIcon size={18} /> },
]

export default function DashboardLayout({ type }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const links = type === 'admin' ? adminLinks : studentLinks

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
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              {link.icon}
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
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-10 h-10 rounded-lg hover:bg-slate-100 flex items-center justify-center text-xl"
              aria-label="Open sidebar"
            >
              ☰
            </button>
            <div>
              <h2 className="text-base font-semibold text-navy">
                {type === 'admin' ? 'Admin Panel' : 'Student Portal'}
              </h2>
              <p className="text-xs text-slate-400">Welcome back, {user?.name || 'User'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`badge ${type === 'admin' ? 'badge-navy' : 'badge-green'}`}>
              {type === 'admin' ? 'Admin' : 'Student'}
            </span>
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-2 text-sm text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden flex items-center justify-around bg-white border-t border-slate-200 py-2 shrink-0">
          {links.slice(0, 5).map((link) => (
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
                      `sidebar-link ${isActive ? 'active' : ''}`
                    }
                  >
                    {link.icon}
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
