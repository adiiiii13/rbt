import { motion } from 'framer-motion'
import { GridSkeleton } from '../components/ui/Skeleton'
import { useRealtimeCollection } from '../lib/useRealtimeCollection'
import { defaultVideos } from '../data/videos'
import { PlayCircleIcon, StarIcon } from '../components/Icons'

export default function Videos() {
  const { data: allVideosRaw, loading } = useRealtimeCollection('videos', { fallback: defaultVideos })
  const allVideos = allVideosRaw?.length ? allVideosRaw : defaultVideos
  const videos = allVideos.filter(v => v.isFree !== false)

  return (
    <div>
      <section className="relative pt-32 pb-20 overflow-hidden bg-navy">
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
          <div className="absolute inset-0 bg-blue-900/40 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#000000]/20 via-[#000000]/60 to-[#000000]"></div>
        </div>
        <div className="container-main relative z-10 text-center w-full">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-green-brand/10 border border-green-brand/20 text-green-brand text-sm font-medium mb-6">
            <PlayCircleIcon size={16} /><span>Video Tutorials</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 font-[var(--font-heading)]">
            Demo <span className="text-green-brand">Videos</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-slate-200 max-w-2xl mx-auto text-lg">
            Explore our free video lectures from expert instructors. Enhance your understanding with engaging visual content.
          </motion.p>
        </div>
      </section>

      <section className="py-24 bg-black">
        <div className="container-main">
          {loading && <GridSkeleton count={6} type="card" />}
          <motion.div initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {videos.map((v, i) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-green-brand/30 transition-all duration-500 flex flex-col cursor-pointer"
                onClick={() => v.videoUrl && v.videoUrl !== '#' && window.open(`/video/${v.id}`, '_blank')}
              >
                <div className="relative w-full aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center overflow-hidden">
                  {v.thumbnailUrl ? (
                    <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500" loading="lazy" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-10 text-white"><PlayCircleIcon size={60} /></div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
                    <div className="w-16 h-16 rounded-full bg-green-brand flex items-center justify-center text-white text-2xl shadow-2xl shadow-green-brand/40 group-hover:scale-110 transition-transform duration-300">
                      ▶
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3 flex gap-2">
                    <span className="badge badge-green text-[10px]">{v.subject}</span>
                    {v.class && <span className="badge badge-navy text-[10px]">{v.class}</span>}
                  </div>
                  <div className="absolute bottom-3 right-3 text-white/70 text-xs font-mono">{v.duration}</div>
                </div>
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-brand transition-colors">{v.title}</h3>
                  <p className="text-sm text-slate-400 mb-3 flex-grow">{v.teacher}</p>
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/10">
                    <div className="flex items-center gap-1.5">
                      <PlayCircleIcon size={15} className="text-green-brand" />
                      <span className="text-xs text-slate-400">{v.views || 0} views</span>
                    </div>
                    <span className="text-xs text-green-brand font-bold group-hover:underline">Watch Now</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
          {!loading && videos.length === 0 && <p className="text-slate-500 text-center py-12">No videos available yet.</p>}
        </div>
      </section>
    </div>
  );
}
