import { useRealtimeCollection } from '../../lib/useRealtimeCollection'
import { defaultNotices } from '../../data/notices'
import { CalendarIcon, BellIcon } from '../../components/Icons'
import { useAuth } from '../../context/AuthContext'
import { useMemo } from 'react'

export default function StudentNotices() {
  const { user } = useAuth()
  const { data: noticesRaw } = useRealtimeCollection('notices', { fallback: defaultNotices })
  const notices = useMemo(() => {
    if (!noticesRaw?.length) return []
    const uid = user?.uid || user?.id || ''
    const userClass = user?.className || user?.class || ''
    const userBatch = user?.batch === true ? 'Batch Student' : (user?.batch || '')

    return noticesRaw.filter(n => {
      if (!n.audience || n.audience === 'all') return true
      if (n.audience === 'class') return n.targetClass === userClass
      if (n.audience === 'batch') return n.targetBatch === userBatch
      if (n.audience === 'specific') return (n.targetStudentIds || []).includes(uid)
      return true
    })
  }, [noticesRaw, user])

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
          <BellIcon size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Notices</h1>
          <p className="text-slate-400 text-sm">
            {notices.length} notice{notices.length !== 1 ? 's' : ''}
            {user?.className ? ` • ${user.className}` : ''}
            {user?.batch && user.batch !== true ? ` • ${user.batch}` : ''}
          </p>
        </div>
      </div>
      <div className="space-y-4">
        {notices.map(n => (
          <div key={n.id} className="bg-[#111111] rounded-2xl p-6 border border-slate-800">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${n.priority === 'high' ? 'bg-red-500' : n.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-500'}`} />
                <h3 className="font-bold text-white">{n.title}</h3>
              </div>
              <span className={`badge ${n.priority === 'high' ? 'badge-red' : n.priority === 'medium' ? 'badge-gold' : 'badge-green'}`}>{n.priority}</span>
            </div>
            <p className="text-sm text-slate-300 mb-2">{n.content}</p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1"><CalendarIcon size={12} /> {n.date}</span>
              <span className="badge badge-navy">{n.category}</span>
            </div>
          </div>
        ))}
        {notices.length === 0 && (
          <div className="bg-[#111111] rounded-2xl p-8 border border-slate-800 text-center">
            <BellIcon size={32} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 mb-2">No notices for you yet</p>
            <p className="text-sm text-slate-500">Complete your profile to receive targeted notices</p>
          </div>
        )}
      </div>
    </div>
  );
}
