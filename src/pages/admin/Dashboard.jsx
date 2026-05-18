import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getCollection } from '../../lib/firebaseHelpers'
import { formatCurrency } from '../../lib/invoice'
import { seedAll } from '../../lib/seedData'
import {
  BookOpenIcon, UsersIcon, FileTextIcon, PlayCircleIcon,
  MessageSquareIcon, TrophyIcon, CalendarIcon, CreditCardIcon
} from '../../components/Icons'

const statColors = [
  { bg: 'from-blue-500/10 to-blue-600/5', icon: 'text-blue-400', border: 'border-blue-500/20' },
  { bg: 'from-emerald-500/10 to-emerald-600/5', icon: 'text-emerald-400', border: 'border-emerald-500/20' },
  { bg: 'from-amber-500/10 to-amber-600/5', icon: 'text-amber-400', border: 'border-amber-500/20' },
  { bg: 'from-purple-500/10 to-purple-600/5', icon: 'text-purple-400', border: 'border-purple-500/20' },
  { bg: 'from-pink-500/10 to-pink-600/5', icon: 'text-pink-400', border: 'border-pink-500/20' },
  { bg: 'from-yellow-500/10 to-yellow-600/5', icon: 'text-yellow-400', border: 'border-yellow-500/20' },
  { bg: 'from-green-500/10 to-green-600/5', icon: 'text-green-400', border: 'border-green-500/20' },
  { bg: 'from-teal-500/10 to-teal-600/5', icon: 'text-teal-400', border: 'border-teal-500/20' },
]

export default function AdminDashboard() {
  const [stats, setStats] = useState([])
  const [recentPayments, setRecentPayments] = useState([])
  const [recentBookings, setRecentBookings] = useState([])
  const [seeding, setSeeding] = useState(false)
  const [seedMsg, setSeedMsg] = useState('')

  useEffect(() => { loadStats() }, [])

  const loadStats = async () => {
    try {
      const [courses, students, pdfs, videos, testimonials, achievements, payments, bookings] = await Promise.all([
        getCollection('courses'),
        getCollection('students'),
        getCollection('pdfs'),
        getCollection('videos'),
        getCollection('testimonials'),
        getCollection('achievements'),
        getCollection('payments'),
        getCollection('counsellingBookings'),
      ])

      const revenue = payments.filter(p => p.status === 'verified').reduce((sum, p) => sum + (p.amount || 0), 0)

      setStats([
        { label: 'Courses', value: courses.length, icon: <BookOpenIcon size={22} /> },
        { label: 'Students', value: students.length, icon: <UsersIcon size={22} /> },
        { label: 'Test PDFs', value: pdfs.length, icon: <FileTextIcon size={22} /> },
        { label: 'Videos', value: videos.length, icon: <PlayCircleIcon size={22} /> },
        { label: 'Testimonials', value: testimonials.length, icon: <MessageSquareIcon size={22} /> },
        { label: 'Achievements', value: achievements.length, icon: <TrophyIcon size={22} /> },
        { label: 'Revenue', value: formatCurrency(revenue), icon: <CreditCardIcon size={22} /> },
        { label: 'Counselling', value: bookings.length, icon: <CalendarIcon size={22} /> },
      ])

      setRecentPayments(payments.slice(0, 5))
      setRecentBookings(bookings.slice(0, 5))
    } catch (err) {
      console.error(err)
    }
  }

  const handleSeed = async () => {
    setSeeding(true)
    setSeedMsg('')
    try {
      await seedAll()
      setSeedMsg('Data seeded successfully! Refresh to see changes.')
      loadStats()
    } catch (err) {
      setSeedMsg('Seeding failed: ' + err.message)
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-sm text-slate-400">Overview of your platform</p>
        </div>
        <button onClick={handleSeed} disabled={seeding} className="btn-primary text-sm">
          {seeding ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              Seeding...
            </span>
          ) : 'Seed Initial Data'}
        </button>
      </motion.div>

      {seedMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 rounded-xl text-sm ${seedMsg.includes('success') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}
        >
          {seedMsg}
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`bg-gradient-to-br ${statColors[i]?.bg || 'from-slate-500/10 to-slate-600/5'} rounded-2xl p-5 border ${statColors[i]?.border || 'border-slate-500/20'} hover:border-green-brand/20 transition-all duration-300 hover:-translate-y-1`}
          >
            <div className={`${statColors[i]?.icon || 'text-slate-400'} mb-3`}>{s.icon}</div>
            <p className="text-xl lg:text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-slate-400 font-medium">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/[0.03] rounded-2xl p-6 border border-white/[0.06]"
        >
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <CreditCardIcon size={18} className="text-green-brand" /> Recent Payments
          </h3>
          {recentPayments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm">No payments yet</p>
              <p className="text-slate-600 text-xs mt-1">Payments will appear here when students purchase videos</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-green-brand/10 transition-all">
                  <div className="min-w-0 mr-3">
                    <p className="text-sm text-white font-medium truncate">{p.studentName}</p>
                    <p className="text-xs text-slate-500 truncate">{p.videoTitle}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm text-green-brand font-semibold">{formatCurrency(p.amount)}</p>
                    <span className={`badge text-xs ${p.status === 'verified' ? 'badge-green' : p.status === 'pending' ? 'badge-gold' : 'badge-red'}`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Counselling */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/[0.03] rounded-2xl p-6 border border-white/[0.06]"
        >
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <CalendarIcon size={18} className="text-teal-400" /> Counselling Bookings
          </h3>
          {recentBookings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm">No bookings yet</p>
              <p className="text-slate-600 text-xs mt-1">Bookings will appear here when students book sessions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-green-brand/10 transition-all">
                  <div className="min-w-0 mr-3">
                    <p className="text-sm text-white font-medium truncate">{b.studentName}</p>
                    <p className="text-xs text-slate-500 truncate">{b.topic} • {b.preferredDate}</p>
                  </div>
                  <span className={`badge text-xs shrink-0 ${b.status === 'approved' ? 'badge-green' : b.status === 'pending' ? 'badge-gold' : b.status === 'completed' ? 'badge-navy' : 'badge-red'}`}>
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
