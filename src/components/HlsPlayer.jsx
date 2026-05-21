import { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { Skeleton } from './ui/Skeleton';

/**
 * Universal player — handles YouTube, MP4, HLS (.m3u8), DASH (.mpd).
 * Adds RBT watermark, nodownload attr, right-click block on video element.
 */
export default function HlsPlayer({ url, onEnded, onProgress, autoPlay = true, watermark = 'RBT SECURE STREAM' }) {
  const playerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState(null);

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

  const isHls = typeof url === 'string' && url.includes('.m3u8');
  const isDash = typeof url === 'string' && url.includes('.mpd');

  return (
    <div className="relative pt-[56.25%] w-full bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
      <div className="absolute top-0 left-0 w-full h-full">
        <ReactPlayer
          ref={playerRef}
          url={url}
          width="100%"
          height="100%"
          controls
          playing={autoPlay}
          onReady={() => setReady(true)}
          onEnded={onEnded}
          onProgress={onProgress}
          onError={(e) => { console.error('[HlsPlayer]', e); setErr('Playback error'); }}
          config={{
            file: {
              forceHLS: isHls,
              forceDASH: isDash,
              attributes: {
                controlsList: 'nodownload noremoteplayback',
                disablePictureInPicture: true,
              },
            },
            youtube: {
              playerVars: {
                rel: 0,
                modestbranding: 1,
                showinfo: 0,
                fs: 1,
                iv_load_policy: 3,
              },
            },
          }}
        />
      </div>

      {/* Watermark */}
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
