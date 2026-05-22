import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import HlsPlayer from '../components/HlsPlayer'

// Default videos data fallback
const DEFAULT_VIDEOS_MAP = {}

export default function WatchVideo() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [video, setVideo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'videos', id))
        if (snap.exists()) {
          setVideo({ id: snap.id, ...snap.data() })
          setLoading(false)
          return
        }
      } catch {}

      // Try default videos
      try {
        const { defaultVideos } = await import('../data/videos')
        const def = defaultVideos.find(v => v.id === id)
        if (def) { setVideo(def); setLoading(false); return }
      } catch {}

      setError('Video not found')
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-[#050B14] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-slate-700 border-t-green-brand rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-[#050B14] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-slate-400 mb-4">{error}</p>
        <button onClick={() => navigate(-1)} className="btn-primary">Go Back</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#050B14]">
      {/* Player */}
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <HlsPlayer url={video?.videoUrl} watermark={video?.title || 'RBT SECURE STREAM'} />
        </motion.div>

        {/* Video Info */}
        <div className="mt-6 bg-[#111111] rounded-2xl p-6 border border-slate-800">
          <h2 className="text-xl font-bold text-white mb-3">{video?.title}</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {video?.class && <span className="badge badge-green">{video.class}</span>}
            {video?.subject && <span className="badge badge-navy">{video.subject}</span>}
            {video?.teacher && <span className="badge badge-gold">{video.teacher}</span>}
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            {video?.duration && <span>{video.duration}</span>}
            {video?.views && <span>{video.views} views</span>}
          </div>
          {video?.isFree !== false && (
            <p className="text-sm text-green-brand font-medium mt-3">Free to watch</p>
          )}
          {video?.isFree === false && (
            <p className="text-sm text-amber-400 font-medium mt-3">Paid content — ₹{video?.price}</p>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex gap-4">
          <Link to="/videos" className="text-sm text-slate-400 hover:text-white no-underline">← All Videos</Link>
          {user && <Link to="/student/videos" className="text-sm text-slate-400 hover:text-white no-underline">Student Videos</Link>}
        </div>
      </div>
    </div>
  )
}
