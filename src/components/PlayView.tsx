/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTango } from '../context/TangoContext';
import { Play, Pause, SkipForward, SkipBack, Calendar, Clock, Check, X, VolumeX } from 'lucide-react';
import { PlaylistItem, PlaylistItemType } from '../types';
import { getFile } from '../lib/db';
import { motion, AnimatePresence } from 'motion/react';

export const PlayView: React.FC = () => {
  const { playlists, items, schedules, addSchedule, removeSchedule } = useTango();
  
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [currentRepeat, setCurrentRepeat] = useState(1);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const playlist = activePlaylistId ? playlists[activePlaylistId] : null;

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (mediaUrl) URL.revokeObjectURL(mediaUrl);
    };
  }, [mediaUrl]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    if (videoRef.current) videoRef.current.volume = volume;
  }, [volume]);

  // Load current item
  const loadItem = useCallback(async () => {
    if (!playlist) return;
    const itemId = playlist.itemIds[currentItemIndex];
    const item = items[itemId];
    if (!item) return;

    if (item.type === PlaylistItemType.AUDIO || item.type === PlaylistItemType.VIDEO) {
      if (item.sourceId) {
        const fileData = await getFile(item.sourceId);
        if (fileData) {
          if (mediaUrl) URL.revokeObjectURL(mediaUrl);
          const url = URL.createObjectURL(fileData.blob);
          setMediaUrl(url);
          
          // Seeking logic moved to onLoadedMetadata for better reliability
        } else {
          setMediaUrl(null);
        }
      } else {
        setMediaUrl(null);
      }
    } else {
        setMediaUrl(null);
    }
  }, [playlist, currentItemIndex, items]);

  const onLoadedMetadata = (e: React.SyntheticEvent<HTMLMediaElement>) => {
    const item = items[playlist?.itemIds[currentItemIndex]!];
    if (item && item.start) {
        e.currentTarget.currentTime = item.start;
    }
    if (isPlaying) {
        e.currentTarget.play().catch(err => {
            console.warn("Auto-play blocked after metadata load", err);
            // Don't set isPlaying(false) here, let the user trigger play manually if needed
        });
    }
  };

  const onTimeUpdate = (e: React.SyntheticEvent<HTMLMediaElement>) => {
    const item = items[playlist?.itemIds[currentItemIndex]!];
    if (isPlaying && item && item.end && e.currentTarget.currentTime >= item.end) {
        handleNext();
    }
  };

  useEffect(() => {
    loadItem();
  }, [loadItem]);

  useEffect(() => {
    const media = audioRef.current || videoRef.current;
    if (!media) return;

    if (isPlaying) {
      const playPromise = media.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Playback failed:", error);
          // Auto-play was probably blocked, or media not ready
          // We don't forcefully set isPlaying(false) here because it causes flickering
          // and prevents user from manually hitting play on the media controls.
        });
      }
    } else {
      media.pause();
    }
  }, [isPlaying, mediaUrl]);

  // Handle item completion
  const handleNext = useCallback(() => {
    if (!playlist) return;
    const itemId = playlist.itemIds[currentItemIndex];
    const item = items[itemId];

    if (currentRepeat < item.repeatCount) {
      setCurrentRepeat(prev => prev + 1);
      // Restart current media
      if (audioRef.current) audioRef.current.currentTime = item.start;
      if (videoRef.current) videoRef.current.currentTime = item.start;
    } else {
      setCurrentRepeat(1);
      if (currentItemIndex < playlist.itemIds.length - 1) {
        setCurrentItemIndex(prev => prev + 1);
      } else {
        setIsPlaying(false);
        setCurrentItemIndex(0);
      }
    }
  }, [playlist, currentItemIndex, currentRepeat, items]);

  useEffect(() => {
    if (isPlaying && playlist?.itemIds[currentItemIndex]) {
        const item = items[playlist.itemIds[currentItemIndex]];
        
        if (item.type === PlaylistItemType.SILENCE) {
            const timer = setTimeout(handleNext, item.duration * 1000);
            return () => clearTimeout(timer);
        }
        // Trim monitoring is now handled via onTimeUpdate for non-silence items
    }
  }, [isPlaying, currentItemIndex, playlist, items, handleNext]);

  // Scheduling state
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [schedDay, setSchedDay] = useState(0);
  const [schedTime, setSchedTime] = useState('12:00');
  const [schedPId, setSchedPId] = useState('');

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="flex flex-col h-full gap-8 bg-slate-950 overflow-y-auto custom-scrollbar">
      {/* Playback Area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-8">
        <div className="flex-1 bg-slate-900 rounded-3xl border border-slate-800 relative overflow-hidden flex flex-col items-center justify-center p-4 md:p-12 text-center shadow-2xl min-h-[400px]">
            <AnimatePresence mode="wait">
                {activePlaylistId ? (
                    <motion.div 
                        key={currentItemIndex}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="flex flex-col items-center w-full max-w-2xl px-2"
                    >
                        <div className="flex flex-row items-center gap-3 sm:gap-4 w-full justify-center mb-4">
                                <div className={`w-12 h-12 md:w-24 md:h-24 shrink-0 rounded-full border-2 md:border-4 border-orange-500 flex items-center justify-center bg-orange-500/10 text-orange-500 text-xl md:text-4xl font-black shadow-[0_0_20px_rgba(249,115,22,0.15)]`}>
                                    {currentItemIndex + 1 < 10 ? `0${currentItemIndex + 1}` : currentItemIndex + 1}
                                </div>
                                <div className="text-left truncate flex-1 max-w-md">
                                    <h2 className="text-base md:text-2xl font-bold tracking-tight uppercase italic truncate">{items[playlist?.itemIds[currentItemIndex]!]?.title}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[8px] md:text-[9px] uppercase font-bold tracking-widest text-slate-500 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
                                            Loop {currentRepeat} / {items[playlist?.itemIds[currentItemIndex]!]?.repeatCount}
                                        </span>
                                        <span className="text-[8px] md:text-[9px] uppercase font-bold tracking-widest text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                                            {items[playlist?.itemIds[currentItemIndex]!]?.type}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        
                        {/* Media Players */}
                        <div className="w-full bg-slate-950 p-2 md:p-6 rounded-2xl border border-slate-800 shadow-inner">
                            {mediaUrl && items[playlist?.itemIds[currentItemIndex]!]?.type === PlaylistItemType.AUDIO && (
                                <audio 
                                    ref={audioRef}
                                    src={mediaUrl}
                                    autoPlay={isPlaying}
                                    onEnded={handleNext}
                                    onLoadedMetadata={onLoadedMetadata}
                                    onTimeUpdate={onTimeUpdate}
                                    controls
                                    className="w-full accent-orange-500"
                                    onPlay={() => setIsPlaying(true)}
                                    onPause={() => setIsPlaying(false)}
                                />
                            )}
                            {mediaUrl && items[playlist?.itemIds[currentItemIndex]!]?.type === PlaylistItemType.VIDEO && (
                                <video 
                                    ref={videoRef}
                                    src={mediaUrl}
                                    autoPlay={isPlaying}
                                    onEnded={handleNext}
                                    onLoadedMetadata={onLoadedMetadata}
                                    onTimeUpdate={onTimeUpdate}
                                    controls
                                    className="w-full rounded-xl shadow-2xl border border-white/5 max-h-[40vh] md:max-h-[500px] bg-black"
                                    onPlay={() => setIsPlaying(true)}
                                    onPause={() => setIsPlaying(false)}
                                />
                            )}
                            {items[playlist?.itemIds[currentItemIndex]!]?.type === PlaylistItemType.SILENCE && (
                                <div className="p-12 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">
                                    <VolumeX size={40} className="mx-auto mb-4 text-indigo-500 opacity-50" />
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">Silent Sequence Active</p>
                                    <p className="text-3xl font-mono mt-2 text-white">{items[playlist?.itemIds[currentItemIndex]!]?.duration}s</p>
                                </div>
                            )}

                            {/* Custom Playback Progress Overlay */}
                            {!mediaUrl && items[playlist?.itemIds[currentItemIndex]!]?.type !== PlaylistItemType.SILENCE && (
                                <div className="p-8 border-2 border-dashed border-red-500/20 rounded-xl bg-red-500/5">
                                    <div className="text-red-400 font-bold text-xs uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
                                        <VolumeX size={14} /> Source Missing
                                    </div>
                                    <div className="text-slate-500 text-[10px] leading-relaxed">
                                        The media file for this item is not available in local storage.<br/>
                                        This often happens with imported M3U lists or cleared browser data.
                                    </div>
                                    <button 
                                        onClick={handleNext}
                                        className="mt-4 text-[10px] font-bold text-orange-500 hover:text-white transition-colors uppercase tracking-widest"
                                    >
                                        Skip to Next →
                                    </button>
                                </div>
                            )}
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

        {/* Playlist Selection and Queue */}
        <div className="w-full lg:w-96 flex flex-col gap-6">
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 flex flex-col gap-6 shadow-xl leading-relaxed min-h-[300px]">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active sequence</span>
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.6)]"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                    </div>
                </div>
                
                <select 
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50 appearance-none shadow-inner"
                    value={activePlaylistId || ''}
                    onChange={(e) => {
                        setActivePlaylistId(e.target.value);
                        setCurrentItemIndex(0);
                        setCurrentRepeat(1);
                    }}
                >
                    <option value="">-- SELECT PLAYLIST --</option>
                    {Object.values(playlists).map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>

                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar max-h-[400px]">
                    {playlist?.itemIds.map((id, idx) => (
                        <div 
                            key={id}
                            className={`p-4 rounded-2xl flex items-center gap-4 transition-all border ${
                                idx === currentItemIndex 
                                    ? 'bg-slate-800 border-orange-500/30 text-white shadow-lg translate-x-1' 
                                    : 'bg-slate-950/30 border-transparent text-slate-500 hover:border-slate-800'
                            }`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                                idx === currentItemIndex ? 'border-orange-500 bg-orange-500/10 text-orange-500' : 'border-slate-800 text-slate-700'
                            }`}>
                                {idx + 1}
                            </div>
                            <div className="flex-1 truncate">
                                <div className={`text-sm font-bold truncate ${idx === currentItemIndex ? 'text-white' : 'text-slate-400'}`}>
                                    {items[id]?.title}
                                </div>
                                <div className="text-[9px] uppercase tracking-widest font-bold opacity-50">
                                    {items[id]?.type} • {idx === currentItemIndex ? 'LIVE' : 'QUEUE'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Controls panel - No longer sticky to avoid overlaps */}
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 flex flex-col gap-6 shadow-xl">
                <div className="flex justify-around items-center">
                    <button onClick={() => setCurrentItemIndex(prev => Math.max(0, prev - 1))} className="w-12 h-12 flex items-center justify-center text-slate-500 hover:text-white transition-all hover:bg-slate-800 rounded-full">
                        <SkipBack size={24} />
                    </button>
                    <button 
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-16 h-16 rounded-full bg-orange-500 text-slate-950 flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:scale-105 active:scale-95 transition-all"
                    >
                        {isPlaying ? <Pause size={32} /> : <Play size={32} fill="currentColor" />}
                    </button>
                    <button onClick={handleNext} className="w-12 h-12 flex items-center justify-center text-slate-500 hover:text-white transition-all hover:bg-slate-800 rounded-full">
                        <SkipForward size={24} />
                    </button>
                </div>

                {/* Sound/Volume Controls */}
                <div className="flex items-center gap-4 px-2">
                    <button onClick={() => setVolume(v => v === 0 ? 1 : 0)} className="text-slate-500 hover:text-white">
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
                    />
                </div>
            </div>
        </div>
      </div>

      {/* Scheduling & Stats Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 bg-slate-900 rounded-3xl border border-slate-800 p-8 shadow-xl">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Execution Scheduler</span>
                </div>
                <button 
                    onClick={() => setShowScheduleForm(true)}
                    className="text-[10px] font-bold uppercase tracking-[.2em] text-orange-500 hover:text-white transition-colors"
                >
                    + NEW TASK
                </button>
              </div>

                {showScheduleForm && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-950 p-6 rounded-2xl border border-slate-800 mb-8 flex flex-wrap gap-6 items-end"
                    >
                        <div className="flex-1 min-w-[150px] flex flex-col gap-2">
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Occurrence Day</span>
                            <select 
                                value={schedDay} 
                                onChange={(e) => setSchedDay(parseInt(e.target.value))}
                                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-orange-500/30"
                            >
                                {days.map((d, i) => <option key={d} value={i}>{d}</option>)}
                            </select>
                        </div>
                        <div className="w-32 flex flex-col gap-2">
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Time</span>
                            <input 
                                type="time" 
                                value={schedTime} 
                                onChange={(e) => setSchedTime(e.target.value)}
                                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-orange-500/30"
                            />
                        </div>
                        <div className="flex-1 min-w-[200px] flex flex-col gap-2">
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Current Sequence</span>
                            <select 
                                value={schedPId} 
                                onChange={(e) => setSchedPId(e.target.value)}
                                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold w-full focus:outline-none focus:ring-1 focus:ring-orange-500/30"
                            >
                                <option value="">Select Target...</option>
                                {Object.values(playlists).map((p: any) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => {
                                    if (schedPId) {
                                        addSchedule({ day: schedDay, time: schedTime, playlistId: schedPId, active: true });
                                        setShowScheduleForm(false);
                                    }
                                }}
                                className="w-10 h-10 bg-teal-500 text-slate-950 rounded-xl flex items-center justify-center hover:bg-teal-400"
                            >
                                <Check size={20} strokeWidth={3} />
                            </button>
                            <button 
                                onClick={() => setShowScheduleForm(false)}
                                className="w-10 h-10 bg-slate-800 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-700"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </motion.div>
                )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {schedules.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-5 bg-slate-950 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors">
                          <div className="flex items-center gap-4">
                              <div className="bg-teal-500/10 px-3 py-1.5 rounded-lg text-teal-500 text-[10px] font-bold uppercase tracking-widest border border-teal-500/20">
                                  {days[s.day].slice(0, 3)}
                              </div>
                              <div>
                                  <div className="text-xl font-bold font-mono tracking-tighter text-white">{s.time}</div>
                                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate max-w-[120px]">{playlists[s.playlistId]?.name}</div>
                              </div>
                          </div>
                          <button onClick={() => removeSchedule(s.id)} className="text-slate-700 hover:text-red-500 p-2 transition-colors">
                              <X size={18} />
                          </button>
                      </div>
                  ))}
                  {schedules.length === 0 && <p className="col-span-full text-[10px] font-bold uppercase tracking-[0.2em] text-center py-12 text-slate-700 border-2 border-dashed border-slate-800 rounded-2xl">No schedules programmed</p>}
              </div>
          </div>

          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8 flex flex-col items-center justify-center text-center shadow-xl relative overflow-hidden">
              {/* Decorative items */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
              
              <Clock size={48} className="text-slate-700 mb-6" />
              <h3 className="text-[10px] font-bold text-orange-500 uppercase tracking-[.3em] mb-4">Master Sync Clock</h3>
              <div className="text-6xl font-black font-mono tracking-tighter text-white tabular-nums">
                  {new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-orange-500/50 text-xl font-mono mt-2 flex items-center gap-2">
                 <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping"></span>
                 {new Date().getSeconds().toString().padStart(2, '0')}
              </div>
              <div className="mt-8 pt-8 border-t border-slate-800 w-full opacity-50">
                 <div className="flex justify-center items-center text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">
                    <span>System Engine Active</span>
                 </div>
              </div>
          </div>
      </div>
    </div>
  );
};
