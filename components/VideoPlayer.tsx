
import React, { useMemo } from 'react';
import { getYoutubeId } from '../utils';

interface VideoPlayerProps {
  url: string | null;
  title: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, title }) => {
  const videoId = useMemo(() => (url ? getYoutubeId(url) : null), [url]);

  if (!videoId) {
    return (
      <div className="w-full aspect-video bg-slate-900 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-800 group hover:border-pink-500/50 transition-colors">
        <div className="text-center p-6">
          <div className="mb-4 text-slate-700 group-hover:text-pink-500/50 transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
             </svg>
          </div>
          <p className="text-slate-500 font-medium">Video non disponibile</p>
          <p className="text-slate-600 text-sm mt-1">Incolla un link di YouTube nel campo sottostante</p>
        </div>
      </div>
    );
  }

  // Use youtube-nocookie.com and minimal params to avoid Error 153 (configuration error)
  // Removing 'origin' often fixes issues where the environment doesn't match the expected domain.
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0`;

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden neon-border bg-black shadow-2xl">
      <iframe
        className="absolute top-0 left-0 w-full h-full"
        src={embedUrl}
        title={title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      ></iframe>
      {/* Quick link for restricted videos */}
      <div className="absolute bottom-4 right-4 opacity-0 hover:opacity-100 transition-opacity">
          <a 
            href={`https://www.youtube.com/watch?v=${videoId}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-pink-600 text-[10px] font-bold text-white px-3 py-1.5 rounded-full shadow-lg hover:bg-pink-500 transition-colors uppercase tracking-wider"
          >
            Apri su YouTube
          </a>
      </div>
    </div>
  );
};

export default VideoPlayer;
