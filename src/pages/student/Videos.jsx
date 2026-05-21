import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCollectionWhere } from '../../lib/firebaseHelpers'
import { useRealtimeCollection } from '../../lib/useRealtimeCollection'
import { useAuth } from '../../context/AuthContext'
import { PlayCircleIcon, LockIcon } from '../../components/Icons'
import { GridSkeleton } from '../../components/ui/Skeleton'
import { formatCurrency } from '../../lib/invoice'

export default function StudentVideos() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: videos, loading } = useRealtimeCollection('videos')
  const [purchasedIds, setPurchasedIds] = useState(new Set())

  useEffect(() => {
    if (!user) return
    let alive = true
    getCollectionWhere('payments', 'studentId', '==', user.studentId || user.id || '')
      .then(payments => {
        if (!alive) return
        const verified = payments.filter(p => p.status === 'verified').map(p => p.videoId)
        setPurchasedIds(new Set(verified))
      })
      .catch(console.error)
    return () => { alive = false }
  }, [user])

  const handleVideoClick = (video) => {
    if (video.isFree || purchasedIds.has(video.id)) {
      if (video.videoUrl && video.videoUrl !== '#') {
        window.open(`/video/${video.id}`, '_blank')
      }
    } else {
      navigate('/student/payment', { state: { video } })
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-pink-500/15 flex items-center justify-center text-pink-400">
          <PlayCircleIcon size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Demo Videos</h1>
          <p className="text-slate-400 text-sm">Watch expert-led video lectures</p>
        </div>
      </div>

      {loading ? (
        <div className="py-8"><GridSkeleton count={6} type="card" /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((v) => {
            const isLocked = !v.isFree && !purchasedIds.has(v.id)
            return (
              <div
                key={v.id}
                onClick={() => handleVideoClick(v)}
                className="bg-[#111111] rounded-2xl border border-slate-800 overflow-hidden hover:border-green-brand/30 transition-all group cursor-pointer"
              >
                <div className="relative aspect-video bg-white/5 flex items-center justify-center">
                  {v.thumbnailUrl ? (
                    <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/3" />
                      <span className="relative opacity-30 text-white"><PlayCircleIcon size={40} /></span>
                    </>
                  )}
                  <div className="absolute bottom-2 left-2">
                    <span className="badge badge-green text-xs">{v.subject}</span>
                  </div>
                  <div className="absolute bottom-2 right-2 text-white/70 text-xs">{v.duration}</div>

                  {isLocked ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
                      <div className="text-center">
                        <LockIcon size={32} className="text-white/80 mx-auto mb-2" />
                        <span className="badge badge-gold text-sm">{formatCurrency(v.price)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/30">
                      <div className="w-14 h-14 rounded-full bg-green-brand flex items-center justify-center text-white shadow-lg shadow-green-brand/40 transform group-hover:scale-110 transition-transform duration-300">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="m5 3 14 9-14 9V3z" /></svg>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-white text-sm mb-1">{v.title}</h3>
                  <p className="text-xs text-slate-500">{v.teacher} • {v.class}</p>
                  {isLocked && (
                    <p className="text-xs text-amber-400 font-semibold mt-1">Pay to unlock</p>
                  )}
                  {!isLocked && (
                    <p className="text-xs text-green-brand font-semibold mt-1">
                      {v.isFree ? 'Free' : 'Purchased'}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
