import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { getCollectionWhere } from '../../lib/firebaseHelpers'
import { useRealtimeCollection } from '../../lib/useRealtimeCollection'
import { defaultCourses } from '../../data/courses'
import { defaultPdfs } from '../../data/pdfs'
import { defaultNotices } from '../../data/notices'
import {
  BookOpenIcon, FileTextIcon, BellIcon, PlayCircleIcon,
  MessageSquareIcon, CalendarIcon, CreditCardIcon, TrophyIcon
} from '../../components/Icons'

const statColors = [
  { bg: 'from-blue-500/10 to-blue-600/5', icon: 'text-blue-400', border: 'border-blue-500/20' },
  { bg: 'from-emerald-500/10 to-emerald-600/5', icon: 'text-emerald-400', border: 'border-emerald-500/20' },
  { bg: 'from-amber-500/10 to-amber-600/5', icon: 'text-amber-400', border: 'border-amber-500/20' },
  { bg: 'from-purple-500/10 to-purple-600/5', icon: 'text-purple-400', border: 'border-purple-500/20' },
]

export default function StudentDashboard() {
  const { user } = useAuth()
  const { data: allCoursesRaw } = useRealtimeCollection('courses', { fallback: defaultCourses })
  const { data: allPdfsRaw } = useRealtimeCollection('pdfs', { fallback: defaultPdfs })
  const { data: allNoticesRaw } = useRealtimeCollection('notices', { fallback: defaultNotices })
  const allCourses = allCoursesRaw?.length ? allCoursesRaw : defaultCourses
  const allPdfs = allPdfsRaw?.length ? allPdfsRaw : defaultPdfs
  const allNotices = allNoticesRaw?.length ? allNoticesRaw : defaultNotices
  const courses = allCourses.slice(0, 4)
  const pdfs = allPdfs.slice(0, 3)
  const notices = allNotices.slice(0, 3)
  const [payments, setPayments] = useState([])
  const [bookings, setBookings] = useState([])
  const [showSupportModal, setShowSupportModal] = useState(false)

  useEffect(() => {
    if (!user) return
    let alive = true
    Promise.all([
      getCollectionWhere('payments', 'studentId', '==', user.studentId || user.id || ''),
      getCollectionWhere('counsellingBookings', 'studentName', '==', user.name || ''),
    ]).then(([pay, book]) => {
      if (!alive) return
      setPayments(pay)
      setBookings(book)
    }).catch(console.error)
    return () => { alive = false }
  }, [user])

  const stats = [
    { label: 'Courses', value: courses.length, icon: <BookOpenIcon size={22} />, link: '/student/courses' },
    { label: 'Test Papers', value: pdfs.length, icon: <FileTextIcon size={22} />, link: '/student/pdfs' },
    { label: 'Payments', value: payments.length, icon: <CreditCardIcon size={22} />, link: '/student/invoices' },
    { label: 'Sessions', value: bookings.length, icon: <CalendarIcon size={22} />, link: '/student/counselling' },
  ]

  const quickLinks = [
    { label: 'Watch Videos', icon: <PlayCircleIcon size={20} />, to: '/student/videos', color: 'text-pink-400' },
    { label: 'Counselling', icon: <CalendarIcon size={20} />, to: '/student/counselling', color: 'text-teal-400' },
    { label: 'Achievements', icon: <TrophyIcon size={20} />, to: '/student/achievements', color: 'text-amber-400' },
    { label: 'Notices', icon: <BellIcon size={20} />, to: '/student/notices', color: 'text-blue-400' },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy-light to-navy-lighter p-6 lg:p-8 border border-white/5"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-green-brand/10 rounded-full blur-[60px]" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px]" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-green-brand/20 flex items-center justify-center text-green-brand font-bold text-lg">
              {user?.name?.charAt(0) || 'S'}
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-white">Welcome back, {user?.name || 'Student'}</h1>
              <p className="text-slate-400 text-sm">{user?.course || 'Enrolled Student'} • {user?.studentId || user?.id || ''}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Link
              to={s.link}
              className={`block bg-gradient-to-br ${statColors[i].bg} rounded-2xl p-5 border ${statColors[i].border} hover:border-green-brand/30 transition-all duration-300 hover:-translate-y-1 no-underline group`}
            >
              <div className={`${statColors[i].icon} mb-3`}>{s.icon}</div>
              <p className="text-2xl font-bold text-white mb-0.5">{s.value}</p>
              <p className="text-xs text-slate-400 font-medium">{s.label}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {quickLinks.map((link) => (
          <Link
            key={link.label}
            to={link.to}
            className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-green-brand/20 hover:bg-white/[0.06] transition-all duration-300 no-underline group"
          >
            <span className={`${link.color} opacity-70 group-hover:opacity-100 transition-opacity`}>{link.icon}</span>
            <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{link.label}</span>
          </Link>
        ))}
      </motion.div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Courses */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/[0.03] rounded-2xl p-6 border border-white/[0.06]"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <BookOpenIcon size={18} className="text-blue-400" /> Available Courses
              </h3>
              <Link to="/student/courses" className="text-xs text-green-brand hover:text-green-light no-underline">View all →</Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {courses.length === 0 ? (
                <p className="text-slate-500 text-sm col-span-2">No courses available yet</p>
              ) : courses.map((c) => (
                <div key={c.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-green-brand/20 transition-all group">
                  <h4 className="font-semibold text-white text-sm mb-1 group-hover:text-green-light transition-colors">{c.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{c.description}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Test Papers */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/[0.03] rounded-2xl p-6 border border-white/[0.06]"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <FileTextIcon size={18} className="text-emerald-400" /> Latest Test Papers
              </h3>
              <Link to="/student/pdfs" className="text-xs text-green-brand hover:text-green-light no-underline">View all →</Link>
            </div>
            <div className="space-y-3">
              {pdfs.length === 0 ? (
                <p className="text-slate-500 text-sm">No test papers available yet</p>
              ) : pdfs.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-green-brand/20 transition-all">
                  <div>
                    <h4 className="font-medium text-white text-sm">{p.title}</h4>
                    <p className="text-xs text-slate-500">{p.class} • {p.subject}</p>
                  </div>
                  {p.fileUrl ? (
                    <a href={p.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold bg-green-brand/10 text-green-brand py-1.5 px-3 rounded-lg hover:bg-green-brand/20 transition-all no-underline border border-green-brand/20">
                      Download
                    </a>
                  ) : (
                    <span className="text-xs text-slate-500">No file</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Notices */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/[0.03] rounded-2xl p-6 border border-white/[0.06]"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <BellIcon size={18} className="text-amber-400" /> Notices
              </h3>
              <Link to="/student/notices" className="text-xs text-green-brand hover:text-green-light no-underline">View all →</Link>
            </div>
            <div className="space-y-3">
              {notices.length === 0 ? (
                <p className="text-slate-500 text-sm">No notices yet</p>
              ) : (
                notices.map((n) => (
                  <div key={n.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${n.priority === 'high' ? 'bg-red-500' : n.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-500'}`} />
                      <h4 className="font-medium text-white text-sm">{n.title}</h4>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{n.content}</p>
                    <p className="text-[10px] text-slate-600 mt-1 uppercase tracking-wider">{n.date}</p>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Recent Payments */}
          {payments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/[0.03] rounded-2xl p-6 border border-white/[0.06]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <CreditCardIcon size={18} className="text-purple-400" /> Payments
                </h3>
                <Link to="/student/invoices" className="text-xs text-green-brand hover:text-green-light no-underline">View all →</Link>
              </div>
              <div className="space-y-2">
                {payments.slice(0, 3).map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="truncate mr-2">
                      <p className="text-sm text-white truncate">{p.videoTitle}</p>
                      <p className="text-xs text-slate-500">{p.invoiceNumber}</p>
                    </div>
                    <span className={`badge text-xs shrink-0 ${p.status === 'verified' ? 'badge-green' : p.status === 'pending' ? 'badge-gold' : 'badge-red'}`}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Help Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-br from-green-brand/10 to-green-dark/5 rounded-2xl p-6 border border-green-brand/20"
          >
            <h3 className="font-bold text-white mb-2 flex items-center gap-2">
              <MessageSquareIcon size={18} className="text-green-brand" /> Need Help?
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Book a counselling session or contact our support team.
            </p>
            <div className="flex gap-2">
              <Link to="/student/counselling" className="btn-primary text-xs !py-2 !px-4 no-underline flex-1 text-center">
                Book Session
              </Link>
              <button onClick={() => setShowSupportModal(true)} className="btn-navy text-xs !py-2 !px-4 flex-1">
                Contact
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowSupportModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0a0a0a] rounded-2xl p-6 max-w-md w-full border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white mb-4">Contact Support</h3>
            <div className="space-y-3">
              <a href="mailto:support@rbtmission.com" className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-green-brand/20 transition-all no-underline">
                <span className="text-green-brand"><MessageSquareIcon size={18} /></span>
                <div><p className="text-xs text-slate-400">Email</p><p className="text-sm text-white">support@rbtmission.com</p></div>
              </a>
              <a href="tel:+919876543210" className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-green-brand/20 transition-all no-underline">
                <span className="text-blue-400"><PlayCircleIcon size={18} /></span>
                <div><p className="text-xs text-slate-400">Phone</p><p className="text-sm text-white">+91 98765 43210</p></div>
              </a>
            </div>
            <button onClick={() => setShowSupportModal(false)} className="btn-primary w-full mt-4">Close</button>
          </motion.div>
        </div>
      )}
    </div>
  )
}
