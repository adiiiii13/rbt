import { useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';

export default function HlsPlayer({ url, onEnded }) {
  const playerRef = useRef(null);

  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  return (
    <div className="relative pt-[56.25%] w-full bg-black rounded-lg overflow-hidden border border-white/10 shadow-2xl">
      <div className="absolute top-0 left-0 w-full h-full">
        <ReactPlayer
          ref={playerRef}
          url={url}
          width="100%"
          height="100%"
          controls={true}
          playing={true}
          onEnded={onEnded}
          config={{
            file: {
              forceHLS: url?.includes('.m3u8'),
              attributes: {
                controlsList: 'nodownload',
                disablePictureInPicture: true,
              },
            },
          }}
        />
      </div>
      <div className="absolute top-4 right-4 pointer-events-none opacity-30 text-white font-bold text-sm tracking-widest z-10">
        RBT SECURE STREAM
      </div>
    </div>
  );
}
