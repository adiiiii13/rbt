import { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { Skeleton } from './ui/Skeleton';

/**
 * Universal player — YouTube via iframe, MP4/HLS via video.
 * Falls back gracefully if react-player fails.
 */
export default function HlsPlayer({ url, onEnded, onProgress, autoPlay = true, watermark = 'RBT SECURE STREAM' }) {
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState(null);
  const playerRef = useRef(null);

  useEffect(() => {
    const handleContextMenu = (e) => {
      if (e.target.tagName === 'VIDEO') e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  if (!url || url === '#') {
    return (
      <div className="relative pt-[56.25%] w-full bg-black rounded-2xl overflow-hidden border border-white/10">
        <div className="absolute inset-0 flex items-center justify-center text-slate-500">
          No video URL configured.
        </div>
      </div>
    );
  }

  const isYouTube = /(?:youtube\.com|youtu\.be)/.test(url);

  // YouTube: direct iframe — most reliable
  if (isYouTube) {
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
    const ytId = ytMatch ? ytMatch[1] : null;
    if (!ytId) {
      return (
        <div className="relative pt-[56.25%] w-full bg-black rounded-2xl overflow-hidden border border-white/10">
          <div className="absolute inset-0 flex items-center justify-center text-slate-500">Invalid YouTube URL</div>
        </div>
      );
    }
    return (
      <div className="relative pt-[56.25%] w-full bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
        <iframe
          src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
          title="Video"
          className="absolute top-0 left-0 w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        <div className="absolute top-4 right-4 pointer-events-none opacity-30 text-white font-bold text-xs sm:text-sm tracking-widest z-10 select-none">
          {watermark}
        </div>
      </div>
    );
  }

  // MP4 / HLS / DASH: use ReactPlayer
  const handleTimeUpdate = (e) => {
    if (!onProgress) return;
    const video = e.target;
    if (!video || !video.duration) return;
    onProgress({
      played: video.currentTime / video.duration,
      playedSeconds: video.currentTime,
      loaded: video.buffered?.length ? video.buffered.end(0) / video.duration : 0,
      loadedSeconds: video.buffered?.length ? video.buffered.end(0) : 0,
    });
  };

  return (
    <div className="relative pt-[56.25%] w-full bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
      <div className="absolute top-0 left-0 w-full h-full">
        <ReactPlayer
          ref={playerRef}
          src={url}
          width="100%"
          height="100%"
          controls
          playing={autoPlay}
          playsInline
          controlsList="nodownload noremoteplayback"
          disablePictureInPicture
          onCanPlay={() => setReady(true)}
          onEnded={onEnded}
          onTimeUpdate={handleTimeUpdate}
          onError={(e) => { console.error('[HlsPlayer]', e); setErr('Playback error'); }}
        />
      </div>

      <div className="absolute top-4 right-4 pointer-events-none opacity-30 text-white font-bold text-xs sm:text-sm tracking-widest z-10 select-none">
        {watermark}
      </div>

      {!ready && !err && (
        <div className="absolute inset-0 pointer-events-none bg-slate-900 animate-pulse">
          <Skeleton className="w-full h-full rounded-none" />
        </div>
      )}
      {err && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-red-400 text-sm">
          {err}
        </div>
      )}
    </div>
  );
}
