import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getCollectionWhere } from '../../lib/firebaseHelpers'
import DoubtForm from '../../components/DoubtForm'
import { MessageSquareIcon, ClockIcon, CheckCircleIcon } from '../../components/Icons'

export default function StudentDoubts() {
  const { user } = useAuth()
  const [doubts, setDoubts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { if (user) loadDoubts() }, [user])

  const loadDoubts = async () => {
    setLoading(true)
    try {
      const all = await getCollectionWhere('doubts', 'studentUid', '==', user.uid || user.id || '')
      setDoubts(all)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const statusColors = { pending: 'badge-gold', answered: 'badge-green' }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400">
            <MessageSquareIcon size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">My Doubts</h1>
            <p className="text-slate-400 text-sm">Ask questions with text or photo</p>
          </div>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Close' : '+ Ask Doubt'}
        </button>
      </div>

      {showForm && (
        <div className="bg-[#111111] rounded-2xl p-6 border border-slate-800 mb-6">
          <h3 className="text-lg font-bold text-white mb-4">New Doubt</h3>
          <DoubtForm onSuccess={() => { setShowForm(false); loadDoubts() }} />
        </div>
      )}

      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <ClockIcon size={18} className="text-slate-500" /> Your Doubts
      </h2>
      {loading ? (
        <div className="text-center py-8 text-slate-400">Loading...</div>
      ) : doubts.length === 0 ? (
        <div className="bg-[#111111] rounded-2xl p-8 border border-slate-800 text-center">
          <MessageSquareIcon size={32} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-2">No doubts yet</p>
          <p className="text-sm text-slate-500">Click "+ Ask Doubt" to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {doubts.map(d => (
            <div key={d.id} className="bg-[#111111] rounded-2xl p-5 border border-slate-800 hover:border-blue-500/20 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {d.subject && <span className="badge badge-navy text-xs">{d.subject}</span>}
                  <span className={`badge ${statusColors[d.status] || 'badge-navy'} inline-flex items-center gap-1`}>
                    {d.status === 'answered' && <CheckCircleIcon size={12} />}
                    {d.status}
                  </span>
                </div>
              </div>
              {d.text && <p className="text-sm text-slate-300 mb-3">{d.text}</p>}
              {d.imageUrl && (
                <a href={d.imageUrl} target="_blank" rel="noopener" className="block mb-3">
                  <img src={d.imageUrl} alt="Doubt" className="w-full max-h-48 object-contain rounded-lg border border-slate-700" loading="lazy" />
                </a>
              )}
              {d.adminReply && (
                <div className="mt-3 p-3 rounded-xl bg-green-brand/5 border border-green-brand/20">
                  <p className="text-xs font-bold text-green-brand uppercase mb-1 flex items-center gap-1.5">
                    <CheckCircleIcon size={12} /> Admin Reply
                  </p>
                  <p className="text-sm text-slate-300">{d.adminReply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
