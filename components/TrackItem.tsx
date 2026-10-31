
import React from 'react';
import { VideoTrack } from '../types';
import { getThumbnail } from '../utils';

interface TrackItemProps {
  track: VideoTrack;
  isActive: boolean;
  onSelect: (track: VideoTrack) => void;
  onEdit?: (track: VideoTrack) => void;
}

const TrackItem: React.FC<TrackItemProps> = ({ track, isActive, onSelect, onEdit }) => {
  return (
    <div 
      className={`relative group flex items-center gap-4 p-4 rounded-xl transition-all duration-300 cursor-pointer 
        ${isActive ? 'bg-pink-600/20 ring-2 ring-pink-500' : 'bg-slate-800/50 hover:bg-slate-800 border border-slate-700'}`}
      onClick={() => onSelect(track)}
    >
      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-slate-900 rounded-lg font-retro text-2xl font-bold text-pink-500 neon-glow">
        #{track.rank}
      </div>
      
      <div className="flex-shrink-0 w-24 h-16 rounded overflow-hidden bg-slate-900">
        <img src={getThumbnail(track.youtubeUrl)} alt={track.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
      </div>

      <div className="flex-grow overflow-hidden">
        <h3 className={`font-semibold truncate ${isActive ? 'text-pink-400' : 'text-slate-100'}`}>
          {track.title || "Brano vuoto"}
        </h3>
        <p className="text-sm text-slate-400 truncate">{track.artist || "Sconosciuto"}</p>
      </div>

      {onEdit && (<button 
        onClick={(e) => { e.stopPropagation(); onEdit(track); }}
        className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
        </svg>
      </button>)}
    </div>
  );
};

export default TrackItem;
