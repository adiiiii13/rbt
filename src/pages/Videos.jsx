import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getCollectionWhere } from '../lib/firebaseHelpers'
import { getTestimonials } from '../data/testimonials'
import { PlayCircleIcon, StarIcon } from '../components/Icons'

const EyeIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
  </svg>
)

export default function Videos() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const testimonials = getTestimonials()

  useEffect(() => {
    loadFreeVideos()
  }, [])

  const loadFreeVideos = async () => {
    setLoading(true)
    try {
      const freeVids = await getCollectionWhere('videos', 'isFree', '==', true)
      setVideos(freeVids)
    } catch (err) {
      console.error(err)
      // Fallback to localStorage
      try {
        const { getVideos } = await import('../data/videos')
        setVideos(getVideos())
      } catch (e) {}
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <section className="relative pt-32 pb-20 overflow-hidden bg-navy">
        {/* Standardized Hero Background */}
        <div className="absolute inset-0 z-0">
          <img
            src="/Images/Image-1.webp"
            alt="Background"
            width="1214"
            height="911"
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-blue-900/40 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        </div>

        <div className="container-main relative z-10 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl lg:text-5xl font-bold mb-4 font-[var(--font-heading)] text-white"
          >
            Free Demo Videos
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-200 max-w-2xl mx-auto font-medium"
          >
            Watch free expert lectures and hear what our community says.
          </motion.p>
        </div>
      </section>

      <section className="py-20 bg-[#000000]">
        <div className="container-main">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Free Demo Lectures</h2>
          {loading ? (
            <p className="text-slate-400 text-center py-8">Loading...</p>
          ) : videos.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No free videos available yet. Check back soon!</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((v, i) => (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card overflow-hidden group cursor-pointer"
                  onClick={() => v.videoUrl && v.videoUrl !== '#' && window.open(v.videoUrl, '_blank')}
                >
                  <div className="relative aspect-video bg-gradient-to-br from-navy to-navy-lighter flex items-center justify-center">
                    {v.thumbnailUrl ? (
                      <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white/20"><PlayCircleIcon size={56} /></span>
                    )}
                    <div className="absolute bottom-2 left-2"><span className="badge badge-green text-xs">{v.subject}</span></div>
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 text-white/70 text-xs"><EyeIcon /> {(v.views || 0).toLocaleString()}</div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40"><div className="w-14 h-14 rounded-full bg-green-brand flex items-center justify-center text-white text-2xl">▶</div></div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-white mb-1">{v.title}</h3>
                    <p className="text-sm text-slate-400">{v.teacher} • {v.class} • {v.duration}</p>
                    <span className="badge badge-green text-xs mt-2">FREE</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-navy">
        <div className="container-main">
          <h2 className="text-2xl font-bold text-white mb-2 text-center">What Our Students Say</h2>
          <p className="text-slate-400 text-center mb-10">Real feedback from our learning community</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.slice(0, 6).map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-6 border border-transparent hover:border-accent-gold/30 transition-all"
              >
                <div className="flex gap-1 mb-3">{[...Array(t.rating)].map((_, j) => <StarIcon key={j} size={16} className="text-accent-gold" />)}</div>
                <p className="text-sm text-slate-300 mb-4 italic leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-brand to-green-dark flex items-center justify-center text-white font-bold text-xs">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
