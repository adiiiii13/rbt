import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { defaultVideos } from '../data/videos';

function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

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
      } catch { /* try default */ }
      const def = defaultVideos.find(v => v.id === id);
      if (def) { setVideo(def); setLoading(false); return; }
      setError('Video not found');
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-[#050B14] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-slate-700 border-t-green-brand rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#050B14] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-slate-400 mb-4">{error}</p>
        <button onClick={() => navigate(-1)} className="btn-primary">Go Back</button>
      </div>
    </div>
  );

  const ytId = getYouTubeId(video?.videoUrl);

  return (
    <div className="min-h-screen bg-[#050B14]">
      <div className="bg-[#0a1628] border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
        </button>
        <div className="flex-1">
          <h1 className="text-white font-bold text-lg truncate">{video?.title}</h1>
          <p className="text-slate-400 text-xs">{video?.subject} • {video?.class} • {video?.duration}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full aspect-video rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl">
          {ytId ? (
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
              title={video?.title}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : video?.videoUrl ? (
            <video src={video.videoUrl} controls autoPlay className="w-full h-full" controlsList="nodownload" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-slate-500">No video URL.</p>
            </div>
          )}
        </motion.div>

        <div className="mt-6 bg-[#111111] rounded-2xl p-6 border border-slate-800">
          <h2 className="text-xl font-bold text-white mb-2">{video?.title}</h2>
          <div className="flex flex-wrap gap-3 mb-3">
            {video?.class && <span className="badge badge-green">{video?.class}</span>}
            {video?.subject && <span className="badge badge-navy">{video?.subject}</span>}
            {video?.teacher && <span className="badge badge-gold">{video?.teacher}</span>}
            {video?.duration && <span className="text-xs text-slate-500">{video?.duration}</span>}
          </div>
          {video?.isFree !== false ? (
            <p className="text-sm text-green-brand">Free to watch</p>
          ) : (
            <p className="text-sm text-amber-400">Paid — ₹{video?.price}</p>
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
