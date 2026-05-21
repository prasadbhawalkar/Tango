import React from 'react';
import { Play, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PlaylistItem, PlaylistItemType } from '../types';

interface MediaStageProps {
  activePlaylistId: string | null;
  currentItem: PlaylistItem | null;
  currentItemIndex: number;
  currentRepeat: number;
  mediaUrl: string | null;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onLoadedMetadata: (e: React.SyntheticEvent<HTMLMediaElement>) => void;
  onTimeUpdate: (e: React.SyntheticEvent<HTMLMediaElement>) => void;
  onEnded: () => void;
  handleNext: (targetIndex?: number, targetRepeat?: number) => void;
}

export const MediaStage: React.FC<MediaStageProps> = ({
  activePlaylistId,
  currentItem,
  currentItemIndex,
  currentRepeat,
  mediaUrl,
  isPlaying,
  setIsPlaying,
  audioRef,
  videoRef,
  onLoadedMetadata,
  onTimeUpdate,
  onEnded,
  handleNext,
}) => {
  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 relative overflow-hidden flex flex-col items-center justify-center p-4 md:p-12 text-center shadow-2xl min-h-[400px]">
        {/* Animated Info Section */}
        <div className="w-full max-w-2xl px-2 mb-4 relative min-h-[80px] flex items-center justify-center">
            <AnimatePresence>
                {activePlaylistId ? (
                    <motion.div 
                        key={currentItemIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10, position: 'absolute' }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center w-full"
                    >
                        <div className="flex flex-row items-center gap-3 sm:gap-4 w-full justify-center mb-4">
                            <div className={`w-12 h-12 md:w-24 md:h-24 shrink-0 rounded-full border-2 md:border-4 border-orange-500 flex items-center justify-center bg-orange-500/10 text-orange-500 text-xl md:text-4xl font-black shadow-[0_0_20px_rgba(249,115,22,0.15)]`}>
                                {currentItemIndex + 1 < 10 ? `0${currentItemIndex + 1}` : currentItemIndex + 1}
                            </div>
                            <div className="text-left truncate flex-1 max-w-md">
                                <h2 className="text-base md:text-2xl font-bold tracking-tight uppercase italic truncate">{currentItem?.title}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[8px] md:text-[9px] uppercase font-bold tracking-widest text-slate-500 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
                                        Loop {currentRepeat} / {currentItem?.repeatCount}
                                    </span>
                                    <span className="text-[8px] md:text-[9px] uppercase font-bold tracking-widest text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20 text-center min-w-[60px]">
                                        {currentItem?.type.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <div className="text-slate-700 flex flex-col items-center">
                        <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-800 flex items-center justify-center mb-6">
                            <Play size={32} className="opacity-20" />
                        </div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em]">Select Active Playlist</p>
                    </div>
                )}
            </AnimatePresence>
        </div>
        
        {/* Stable Media Player Area */}
        {activePlaylistId && (
            <div className="w-full max-w-2xl px-2">
                <div className="w-full bg-slate-950 p-2 md:p-6 rounded-2xl border border-slate-800 shadow-inner">
                    {currentItem?.type === PlaylistItemType.AUDIO && (
                        <audio 
                            ref={audioRef}
                            src={mediaUrl ?? undefined}
                            onEnded={onEnded}
                            onLoadedMetadata={onLoadedMetadata}
                            onTimeUpdate={onTimeUpdate}
                            autoPlay={isPlaying}
                            controls
                            className="w-full accent-orange-500 h-10"
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => {
                                if (mediaUrl) setIsPlaying(false);
                            }}
                            id="audio-player"
                        />
                    )}
                    {currentItem?.type === PlaylistItemType.VIDEO && (
                        <video 
                            ref={videoRef}
                            src={mediaUrl ?? undefined}
                            playsInline
                            onEnded={onEnded}
                            onLoadedMetadata={onLoadedMetadata}
                            onTimeUpdate={onTimeUpdate}
                            autoPlay={isPlaying}
                            controls
                            className="w-full rounded-xl shadow-2xl border border-white/5 max-h-[40vh] md:max-h-[350px] bg-black"
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => {
                                if (mediaUrl) setIsPlaying(false);
                            }}
                            id="video-player"
                        />
                    )}
                    {currentItem?.type === PlaylistItemType.SILENCE && (
                        <div className="p-12 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50" id="silence-indicator">
                            <VolumeX size={40} className="mx-auto mb-4 text-indigo-500 opacity-50" />
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">Silence Active</p>
                            <p className="text-3xl font-mono mt-2 text-white">{currentItem?.duration}s</p>
                        </div>
                    )}

                    {!mediaUrl && currentItem?.type !== PlaylistItemType.SILENCE && (
                        <div className="p-12 flex flex-col items-center justify-center">
                            {!currentItem?.sourceId ? (
                                <>
                                    <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/10 mb-4">
                                        <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest text-center">No Source File Connected</p>
                                    </div>
                                    <button onClick={handleNext} className="text-[10px] font-bold text-orange-500 hover:text-white transition-colors" id="skip-missing-btn">Skip Track →</button>
                                </>
                            ) : (
                                <>
                                    <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Loading Source...</p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};
