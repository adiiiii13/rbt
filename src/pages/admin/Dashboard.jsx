import { motion } from 'framer-motion'
import { useRealtimeCollection } from '../../lib/useRealtimeCollection'
import { formatCurrency } from '../../lib/invoice'
import { seedAll } from '../../lib/seedData'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { defaultCourses } from '../../data/courses'
import { defaultVideos } from '../../data/videos'
import { defaultPdfs } from '../../data/pdfs'
import { defaultAchievements } from '../../data/achievements'
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
  const { data: courses } = useRealtimeCollection('courses', { fallback: defaultCourses })
  const { data: students } = useRealtimeCollection('students')
  const { data: pdfs } = useRealtimeCollection('pdfs', { fallback: defaultPdfs })
  const { data: videos } = useRealtimeCollection('videos', { fallback: defaultVideos })
  const { data: testimonials } = useRealtimeCollection('testimonials', { fallback: [] })
  const { data: achievements } = useRealtimeCollection('achievements', { fallback: defaultAchievements })
  const { data: payments } = useRealtimeCollection('payments')
  const { data: bookings } = useRealtimeCollection('counsellingBookings')
  const [seeding, setSeeding] = useState(false)
  const [seedMsg, setSeedMsg] = useState('')

  const revenue = payments.filter(p => p.status === 'verified').reduce((sum, p) => sum + (p.amount || 0), 0)

  const stats = [
    { label: 'Courses', value: courses.length, icon: <BookOpenIcon size={22} /> },
    { label: 'Students', value: students.length, icon: <UsersIcon size={22} /> },
    { label: 'Test PDFs', value: pdfs.length, icon: <FileTextIcon size={22} /> },
    { label: 'Videos', value: videos.length, icon: <PlayCircleIcon size={22} /> },
    { label: 'Testimonials', value: testimonials.length, icon: <MessageSquareIcon size={22} /> },
    { label: 'Achievements', value: achievements.length, icon: <TrophyIcon size={22} /> },
    { label: 'Bookings', value: bookings.length, icon: <CalendarIcon size={22} /> },
    { label: 'Revenue', value: formatCurrency(revenue), icon: <CreditCardIcon size={22} /> },
  ]

  const handleSeed = async () => {
    setSeeding(true); setSeedMsg('')
    try { await seedAll(); setSeedMsg('Seed complete — reload'); toast.success('Seeded') }
    catch (err) { setSeedMsg('Error: ' + err.message); toast.error(err.message) }
    finally { setSeeding(false) }
  }

  const pendingPayments = payments.filter(p => p.status === 'pending').slice(0, 3)
  const pendingBookings = bookings.filter(b => b.status === 'pending').slice(0, 3)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold text-white">Admin Dashboard</h1><p className="text-sm text-slate-400">Welcome back</p></div>
        <button onClick={handleSeed} disabled={seeding} className="btn-primary text-sm disabled:opacity-50">{seeding ? 'Seeding...' : 'Seed Data'}</button>
      </div>
      {seedMsg && <p className="text-sm text-slate-400 mb-4">{seedMsg}</p>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`bg-gradient-to-br ${statColors[i].bg} rounded-2xl p-5 border ${statColors[i].border}`}>
            <div className={`${statColors[i].icon} mb-3`}>{s.icon}</div>
            <p className="text-2xl font-bold text-white mb-0.5">{s.value}</p>
            <p className="text-xs text-slate-400">{s.label}</p>
          </motion.div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-[#111111] rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-white">Recent Payments</h3></div>
          <div className="space-y-3">{pendingPayments.length ? pendingPayments.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-green-brand/10 transition-all">
              <div><p className="font-medium text-white text-sm">{p.studentName}</p><p className="text-xs text-slate-400">{p.course}</p></div>
              <span className={`badge ${p.status === 'verified' ? 'badge-green' : p.status === 'rejected' ? 'badge-red' : 'badge-gold'}`}>{formatCurrency(p.amount)}</span>
            </div>
          )) : <p className="text-slate-500 text-sm text-center py-4">No pending payments</p>}</div>
        </div>
        <div className="bg-[#111111] rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-white">Recent Bookings</h3></div>
          <div className="space-y-3">{pendingBookings.length ? pendingBookings.map(b => (
            <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-green-brand/10 transition-all">
              <div><p className="font-medium text-white text-sm">{b.topic}</p><p className="text-xs text-slate-400">{b.studentName} • {b.preferredDate}</p></div>
              <span className={`badge ${b.status === 'approved' ? 'badge-green' : b.status === 'rejected' ? 'badge-red' : 'badge-gold'}`}>{b.status}</span>
            </div>
          )) : <p className="text-slate-500 text-sm text-center py-4">No pending bookings</p>}</div>
        </div>
      </div>
    </div>
  )
}
