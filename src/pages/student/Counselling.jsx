import { useState, useEffect } from 'react'
import { ListSkeleton } from '../../components/ui/Skeleton'
import { useAuth } from '../../context/AuthContext'
import { getCollectionWhere } from '../../lib/firebaseHelpers'
import CounsellingForm from '../../components/CounsellingForm'
import { CalendarIcon, ClockIcon, UsersIcon, VideoIcon } from '../../components/Icons'

const HeadsetIcon = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </svg>
)

export default function StudentCounselling() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { if (user) loadBookings() }, [user])

  const loadBookings = async () => {
    setLoading(true)
    try {
      const all = await getCollectionWhere('counsellingBookings', 'studentName', '==', user.name || '')
      setBookings(all)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const statusColors = { pending: 'badge-gold', approved: 'badge-green', completed: 'badge-navy', rejected: 'badge-red' }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/15 flex items-center justify-center text-teal-400">
            <HeadsetIcon size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Counselling Room</h1>
            <p className="text-slate-400 text-sm">Book and manage your counselling sessions</p>
          </div>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Close' : '+ Book Session'}
        </button>
      </div>

      {showForm && (
        <div className="bg-[#111111] rounded-2xl p-6 border border-slate-800 mb-6">
          <h3 className="text-lg font-bold text-white mb-4">New Booking</h3>
          <CounsellingForm compact onSuccess={() => { setShowForm(false); loadBookings() }} />
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-lg font-bold text-white mb-4">Your Sessions</h2>
        {loading ? (
          <div className="py-8"><ListSkeleton count={3} /></div>
        ) : bookings.length === 0 ? (
          <div className="bg-[#111111] rounded-2xl p-8 border border-slate-800 text-center">
            <HeadsetIcon size={32} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 mb-2">No counselling sessions yet</p>
            <p className="text-sm text-slate-500">Book your first session to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(b => (
              <div key={b.id} className="bg-[#111111] rounded-2xl p-5 border border-slate-800 hover:border-teal-500/20 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-white">{b.topic}</h3>
                    <p className="text-xs text-slate-500">{b.studentName} {b.parentName ? `& ${b.parentName}` : ''}</p>
                  </div>
                  <span className={`badge ${statusColors[b.status] || 'badge-navy'}`}>{b.status}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <span className="inline-flex items-center gap-1.5"><CalendarIcon size={14} className="text-slate-500" /> {b.preferredDate}</span>
                  <span className="inline-flex items-center gap-1.5"><ClockIcon size={14} className="text-slate-500" /> {b.preferredTime}</span>
                </div>
                {b.meetingLink && b.status === 'approved' && (
                  <a href={b.meetingLink} target="_blank" rel="noopener noreferrer" className="btn-primary mt-3 text-sm no-underline inline-flex items-center gap-2">
                    <VideoIcon size={16} /> Join Meeting
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-green-brand to-green-dark rounded-2xl p-6 text-white">
        <h3 className="font-bold mb-2 flex items-center gap-2"><HeadsetIcon size={18} /> About Counselling</h3>
        <p className="text-sm text-white/90 mb-3">Our counselling sessions are conducted via Google Meet. Both student and parent can join.</p>
        <ul className="text-sm text-white/80 space-y-1.5">
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-white/60" /> Sessions are 30-45 minutes long</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-white/60" /> Available Mon-Sat, 9AM-8PM</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-white/60" /> Free for enrolled students</li>
        </ul>
      </div>
    </div>
  )
}
