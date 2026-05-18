import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCollection, getCollectionWhere } from '../../lib/firebaseHelpers'
import { useAuth } from '../../context/AuthContext'
import { PlayCircleIcon, LockIcon } from '../../components/Icons'
import { formatCurrency } from '../../lib/invoice'
import Modal from '../../components/Modal'
import HlsPlayer from '../../components/HlsPlayer'

export default function StudentVideos() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [videos, setVideos] = useState([])
  const [purchasedIds, setPurchasedIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [playingVideo, setPlayingVideo] = useState(null)

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    setLoading(true)
    try {
      const vids = await getCollection('videos')
      setVideos(vids)

      // Get purchased video IDs
      if (user) {
        const payments = await getCollectionWhere('payments', 'studentId', '==', user.studentId || user.id || '')
        const verified = payments.filter(p => p.status === 'verified').map(p => p.videoId)
        setPurchasedIds(new Set(verified))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleVideoClick = (video) => {
    if (video.isFree || purchasedIds.has(video.id)) {
      // Open video player page in new tab
      if (video.videoUrl && video.videoUrl !== '#') {
        window.open(`/video/${video.id}`, '_blank');
      }
    } else {
      navigate('/student/payment', { state: { video } })
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-1">Demo Videos</h1>
      <p className="text-slate-500 text-sm mb-6">Watch expert-led video lectures</p>

      {loading ? (
        <p className="text-slate-400 text-center py-8">Loading...</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((v) => {
            const isLocked = !v.isFree && !purchasedIds.has(v.id)
            return (
              <div
                key={v.id}
                onClick={() => handleVideoClick(v)}
                className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer"
              >
                <div className="relative aspect-video bg-navy-light flex items-center justify-center">
                  {v.thumbnailUrl ? (
                    <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-navy to-navy-lighter" />
                      <span className="relative opacity-30 text-white"><PlayCircleIcon size={40} /></span>
                    </>
                  )}
                  <div className="absolute bottom-2 left-2">
                    <span className="badge badge-green text-xs">{v.subject}</span>
                  </div>
                  <div className="absolute bottom-2 right-2 text-white/70 text-xs">{v.duration}</div>

                  {isLocked ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="text-center">
                        <LockIcon size={32} className="text-white/80 mx-auto mb-2" />
                        <span className="badge badge-gold text-sm">{formatCurrency(v.price)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                      <div className="w-12 h-12 rounded-full bg-green-brand flex items-center justify-center text-white text-xl">
                        ▶
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-navy text-sm mb-1">{v.title}</h3>
                  <p className="text-xs text-slate-500">{v.teacher} • {v.class}</p>
                  {!v.isFree && !purchasedIds.has(v.id) && (
                    <p className="text-xs text-green-brand font-semibold mt-1">Pay to unlock</p>
                  )}
                  {(v.isFree || purchasedIds.has(v.id)) && (
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

      {/* Video Player Modal */}
      <Modal 
        isOpen={!!playingVideo} 
        onClose={() => setPlayingVideo(null)} 
        title={playingVideo?.title || 'Video Player'}
      >
        {playingVideo && (
          <div className="bg-black/20 p-2 rounded-2xl border border-white/5">
            <HlsPlayer 
              url={playingVideo.videoUrl} 
              onEnded={() => {
                // Optional: mark video as watched in Firestore
              }}
            />
            <div className="mt-4 px-2 pb-2">
              <h4 className="text-white font-bold">{playingVideo.title}</h4>
              <p className="text-sm text-slate-400 mt-1">{playingVideo.teacher} • {playingVideo.class}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
