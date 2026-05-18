import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getCollectionWhere, addDocument } from '../../lib/firebaseHelpers'
import CounsellingForm from '../../components/CounsellingForm'

export default function StudentCounselling() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadBookings()
  }, [user])

  const loadBookings = async () => {
    if (!user) return
    setLoading(true)
    try {
      // Get bookings matching student phone or name
      const all = await getCollectionWhere('counsellingBookings', 'studentName', '==', user.name || '')
      setBookings(all)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const statusColors = {
    pending: 'badge-gold',
    approved: 'badge-green',
    completed: 'badge-navy',
    rejected: 'badge-red',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy mb-1">Counselling Room</h1>
          <p className="text-slate-500 text-sm">Book and manage your counselling sessions</p>
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

      {/* Upcoming Sessions */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-navy mb-4">Your Sessions</h2>
        {loading ? (
          <div className="text-center py-8 text-slate-400">Loading...</div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
            <p className="text-slate-500 mb-2">No counselling sessions yet</p>
            <p className="text-sm text-slate-400">Book your first session to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <div key={b.id} className="bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-navy">{b.topic}</h3>
                    <p className="text-xs text-slate-500">{b.studentName} {b.parentName ? `& ${b.parentName}` : ''}</p>
                  </div>
                  <span className={`badge ${statusColors[b.status] || 'badge-navy'}`}>{b.status}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <span>{b.preferredDate}</span>
                  <span>{b.preferredTime}</span>
                </div>
                {b.meetingLink && b.status === 'approved' && (
                  <a
                    href={b.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary mt-3 text-sm no-underline inline-flex items-center gap-2"
                  >
                    Join Meeting
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-gradient-to-br from-green-brand to-green-dark rounded-2xl p-6 text-white">
        <h3 className="font-bold mb-2">About Counselling</h3>
        <p className="text-sm text-white/90 mb-3">
          Our counselling sessions are conducted via Google Meet. Both student and parent can join the same session.
        </p>
        <ul className="text-sm text-white/80 space-y-1">
          <li>• Sessions are 30-45 minutes long</li>
          <li>• Available Mon-Sat, 9AM-8PM</li>
          <li>• Free for enrolled students</li>
        </ul>
      </div>
    </div>
  )
}
