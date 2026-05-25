import { useRealtimeCollection } from '../../lib/useRealtimeCollection'
import { defaultNotices } from '../../data/notices'
import { CalendarIcon, BellIcon } from '../../components/Icons'
import { useAuth } from '../../context/AuthContext'
import { useMemo } from 'react'
import { GridSkeleton } from '../../components/ui/Skeleton'

export default function StudentNotices() {
  const { user } = useAuth()
  const { data: noticesRaw, loading } = useRealtimeCollection('notices')

  const userClass = user?.className || user?.class || ''

  const notices = useMemo(() => {
    // If we have NO data from Firestore, show default notices for demo purposes
    if (!noticesRaw || (noticesRaw.length === 0 && !loading)) {
      return defaultNotices || []
    }

    const uid = user?.uid || user?.id || ''
    const userClass = user?.className || user?.class || ''
    const userBatchId = user?.assignedBatchId || user?.batchId || ''

    return noticesRaw.filter(n => {
      // 1. All/None audience -> Show to everyone
      if (!n.audience || n.audience === 'all' || n.audience === undefined) return true
      
      // 2. Class target -> Match student's class
      if (n.audience === 'class') {
        if (!userClass) return false // Student hasn't set their class yet
        return n.targetClass === userClass
      }
      
      // 3. Batch target -> Match student's batch
      if (n.audience === 'batch') {
        if (!userBatchId) return false // Student hasn't been assigned a batch yet
        return n.targetBatch === userBatchId
      }
      
      // 4. Specific student target
      if (n.audience === 'specific') {
        return (n.targetStudentIds || []).includes(uid)
      }

      // Default to showing if we don't recognize the audience type
      return true
    })
  }, [noticesRaw, user, loading])

  const hasAnyNoticesInDb = noticesRaw && noticesRaw.length > 0;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
          <BellIcon size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Notices</h1>
          <p className="text-slate-400 text-sm">
            {notices.length} notice{notices.length !== 1 ? 's' : ''} for you
            {userClass ? ` • ${userClass}` : ''}
          </p>
        </div>
      </div>
      
      {loading && <GridSkeleton count={3} />}
      
      {!loading && notices.length === 0 && (
        <div className="bg-[#111111] rounded-2xl p-12 border border-slate-800 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
            <BellIcon size={32} className="text-slate-600" />
          </div>
          <p className="text-white font-bold mb-2">No new notices for you</p>
          <p className="text-sm text-slate-500 max-w-xs mx-auto">
            {hasAnyNoticesInDb 
              ? "You've caught up with everything! New notices specific to your class or batch will appear here."
              : "The announcement board is quiet for now. Check back later for updates."
            }
          </p>
          {!userClass && (
            <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 max-w-sm mx-auto">
              <p className="text-xs text-blue-400">
                Tip: Complete your profile with your Class and Board to receive targeted academic notices.
              </p>
            </div>
          )}
        </div>
      )}
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
      </div>
    </div>
  );
}
