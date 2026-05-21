import React from 'react';
import { PlaySquare, Monitor, CheckCircle2, SkipBack, SkipForward, Pause, Play, VolumeX } from 'lucide-react';
import { Playlist, PlaylistItem } from '../types';

interface PlaylistQueueProps {
  playlists: Record<string, Playlist>;
  items: Record<string, PlaylistItem>;
  activePlaylistId: string | null;
  setActivePlaylistId: (id: string) => void;
  topLevelActiveIndex: number;
  onTopLevelItemClick: (index: number) => void;
  setCurrentRepeat: (repeat: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  handleNext: (targetIndex?: number, targetRepeat?: number) => void;
  volume: number;
  setVolume: (v: number) => void;
}

export const PlaylistQueue: React.FC<PlaylistQueueProps> = ({
  playlists,
  items,
  activePlaylistId,
  setActivePlaylistId,
  topLevelActiveIndex,
  onTopLevelItemClick,
  setCurrentRepeat,
  isPlaying,
  setIsPlaying,
  handleNext,
  volume,
  setVolume
}) => {
  const currentPlaylist = activePlaylistId ? playlists[activePlaylistId] : null;

  return (
    <div className="w-full lg:w-96 flex flex-col gap-4">
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 flex flex-col gap-6 shadow-xl leading-relaxed min-h-[400px] flex-1">
            <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active sequence</span>
                <div className="flex gap-1">
                    {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-orange-500"></div>)}
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex flex-col gap-2">
                    <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest px-1">Selected Program</span>
                    <select 
                        value={activePlaylistId || ''} 
                        onChange={(e) => {
                            setActivePlaylistId(e.target.value);
                            onTopLevelItemClick(0);
                            setCurrentRepeat(1);
                            setIsPlaying(true);
                        }}
                        className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-orange-500/30 w-full appearance-none cursor-pointer hover:border-slate-700 transition-colors"
                        id="playlist-selector"
                    >
                        <option value="">-- Choose Target --</option>
                        {Object.values(playlists).map((p: Playlist) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {currentPlaylist && (
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Live queue</span>
                        <span className="text-[8px] font-black text-orange-500/50 uppercase">{currentPlaylist.itemIds.length} ITEMS</span>
                    </div>
                    <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                        {currentPlaylist.itemIds.map((itemId, idx) => {
                            const item = items[itemId];
                            const isActive = idx === topLevelActiveIndex;
                            const isPlayed = idx < topLevelActiveIndex;

                            return (
                                <div 
                                    key={`${itemId}-${idx}`}
                                    onClick={() => onTopLevelItemClick(idx)}
                                    className={`group flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 cursor-pointer ${
                                        isActive 
                                        ? 'bg-orange-500 border-orange-400 shadow-[0_4px_20px_rgba(249,115,22,0.3)] scale-[1.02]' 
                                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                                    }`}
                                    id={`queue-item-${idx}`}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-black ${
                                            isActive ? 'bg-white text-orange-500' : 'bg-slate-900 text-slate-500'
                                        }`}>
                                            {idx + 1}
                                        </div>
                                        <div className="min-w-0">
                                            <p className={`text-[11px] font-bold truncate uppercase tracking-tight ${
                                                isActive ? 'text-white' : 'text-slate-300'
                                            }`}>
                                                {item?.title}
                                            </p>
                                            <div className={`flex items-center gap-2 mt-0.5 ${
                                                isActive ? 'text-white/70' : 'text-slate-600'
                                            }`}>
                                                {item?.type === 'audio' ? <PlaySquare size={10} /> : <Monitor size={10} />}
                                                <span className="text-[8px] font-black tracking-widest uppercase">
                                                    {item?.type} • {item?.duration}S
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {isPlayed && !isActive && <CheckCircle2 size={14} className="text-teal-500" />}
                                    {isActive && <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {!currentPlaylist && (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 py-12">
                   <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-800 flex items-center justify-center mb-4">
                        <PlaySquare size={20} />
                   </div>
                   <p className="text-[9px] font-bold uppercase tracking-widest">Queue Suspended</p>
                </div>
            )}
        </div>

        {/* Global Controls */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 flex flex-col gap-6 shadow-xl">
            <div className="flex justify-around items-center">
                <button 
                    onClick={() => {
                        if (topLevelActiveIndex > 0) {
                            onTopLevelItemClick(topLevelActiveIndex - 1);
                        }
                    }} 
                    className="w-12 h-12 flex items-center justify-center text-slate-500 hover:text-white transition-all hover:bg-slate-800 rounded-full" 
                    id="prev-btn"
                >
                    <SkipBack size={24} />
                </button>
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-16 h-16 rounded-full bg-orange-500 text-slate-950 flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:scale-105 active:scale-95 transition-all"
                  id="play-pause-btn"
                >
                    {isPlaying ? <Pause size={32} /> : <Play size={32} fill="currentColor" />}
                </button>
                <button onClick={handleNext} className="w-12 h-12 flex items-center justify-center text-slate-500 hover:text-white transition-all hover:bg-slate-800 rounded-full" id="next-btn">
                    <SkipForward size={24} />
                </button>
            </div>

            <div className="flex items-center gap-4 px-2">
                <button onClick={() => setVolume(volume === 0 ? 1 : 0)} className="text-slate-500 hover:text-white" id="mute-btn">
                    <VolumeX size={18} className={volume === 0 ? 'text-red-500' : ''} />
                </button>
                <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01" 
                    value={volume} 
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="flex-1 accent-orange-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    id="volume-slider"
                />
            </div>
        </div>
    </div>
  );
};
