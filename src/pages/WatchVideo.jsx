import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { defaultVideos } from '../data/videos';
import HlsPlayer from '../components/HlsPlayer';
import { Skeleton } from '../components/ui/Skeleton';

export default function WatchVideo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'videos', id));
        if (snap.exists()) {
          setVideo({ id: snap.id, ...snap.data() });
          setLoading(false);
          return;
        }
      } catch { /* Firestore error — try default data */ }

      const defaultVideo = defaultVideos.find(v => v.id === id);
      if (defaultVideo) {
        setVideo(defaultVideo);
        setLoading(false);
        return;
      }

      setError('Video not found');
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-[#050B14]">
      <div className="bg-[#0a1628] border-b border-slate-800 px-4 py-3 flex items-center gap-3 animate-pulse">
        <Skeleton className="w-8 h-8 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="w-1/3 h-5" />
          <Skeleton className="w-1/4 h-3" />
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-6">
        <Skeleton className="w-full aspect-video rounded-xl mb-6" />
        <div className="bg-[#111111] rounded-2xl p-6 border border-slate-800 animate-pulse">
          <Skeleton className="w-1/2 h-7 mb-4" />
          <div className="flex gap-3 mb-4">
            <Skeleton className="w-16 h-6 rounded-full" />
            <Skeleton className="w-20 h-6 rounded-full" />
          </div>
          <Skeleton className="w-full h-4 mb-2" />
          <Skeleton className="w-3/4 h-4 mb-2" />
          <Skeleton className="w-1/2 h-4" />
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-slate-400 mb-4">{error}</p>
        <button onClick={() => navigate(-1)} className="btn-primary">Go Back</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050B14]">
      <div className="bg-[#0a1628] border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
        </button>
        <div className="flex-1">
          <h1 className="text-white font-bold text-lg truncate">{video?.title}</h1>
          <p className="text-slate-400 text-xs">{video?.subject} • {video?.class} • {video?.duration}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <HlsPlayer url={video?.videoUrl} watermark={user?.email || 'RBT SECURE STREAM'} />
        </motion.div>

        <div className="mt-6 bg-[#111111] rounded-2xl p-6 border border-slate-800">
          <h2 className="text-xl font-bold text-white mb-2">{video?.title}</h2>
          <div className="flex flex-wrap gap-3 mb-3">
            {video?.class && <span className="badge badge-green">{video?.class}</span>}
            {video?.subject && <span className="badge badge-navy">{video?.subject}</span>}
            {video?.teacher && <span className="badge badge-gold">{video?.teacher}</span>}
            {video?.duration && <span className="text-xs text-slate-500">{video?.duration}</span>}
          </div>
          {video?.description && (
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">{video.description}</p>
          )}
          {video?.isFree !== false ? (
            <p className="text-sm text-green-brand">Free to watch</p>
          ) : (
            <p className="text-sm text-amber-400">Paid content — ₹{video?.price}</p>
          )}
        </div>

        <div className="mt-6 flex gap-4">
          <Link to="/videos" className="text-sm text-slate-400 hover:text-white no-underline">All Videos</Link>
          {user && <Link to="/student/videos" className="text-sm text-slate-400 hover:text-white no-underline">Student Videos</Link>}
        </div>
      </div>
    </div>
  );
}
