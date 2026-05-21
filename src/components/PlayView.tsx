import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTango } from '../context/TangoContext';
import { PlaylistItemType } from '../types';
import { getFile } from '../lib/db';
import { MediaStage } from './MediaStage';
import { SyncMaster } from './SyncMaster';
import { PlaylistQueue } from './PlaylistQueue';

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const PlayView: React.FC = () => {
  const { playlists, items, schedules, addSchedule, removeSchedule } = useTango();
  
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [queueIndex, setQueueIndex] = useState(0);
  const [currentRepeat, setCurrentRepeat] = useState(1);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const lastHandledRef = useRef<string>('');

  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const loadIdRef = useRef(0);
  const previousUrlRef = useRef<string | null>(null);
  const lastScheduledIdRef = useRef<string | null>(null);

  // Flattened queue structure
  const flatQueue = React.useMemo(() => {
    if (!activePlaylistId || !playlists[activePlaylistId]) return [];

    const getFlattenedItems = (pId: string, topIdx: number): { itemId: string; topIdx: number }[] => {
      const pl = playlists[pId];
      if (!pl) return [];
      let expanded: { itemId: string; topIdx: number }[] = [];
      pl.itemIds.forEach((id) => {
        const item = items[id];
        if (!item) return;
        if (item.type === PlaylistItemType.PLAYLIST && item.playlistId) {
          for (let i = 0; i < item.repeatCount; i++) {
            expanded = [...expanded, ...getFlattenedItems(item.playlistId, topIdx)];
          }
        } else {
          expanded.push({ itemId: id, topIdx });
        }
      });
      return expanded;
    };

    const root = playlists[activePlaylistId];
    let result: { itemId: string; topIdx: number }[] = [];
    root.itemIds.forEach((id, idx) => {
        const item = items[id];
        if (!item) return;
        if (item.type === PlaylistItemType.PLAYLIST && item.playlistId) {
            for (let i = 0; i < item.repeatCount; i++) {
                result = [...result, ...getFlattenedItems(item.playlistId, idx)];
            }
        } else {
            result.push({ itemId: id, topIdx: idx });
        }
    });
    return result;
  }, [activePlaylistId, playlists, items]);

  const currentItem = React.useMemo(() => {
    const queueEntry = flatQueue[queueIndex];
    return queueEntry ? items[queueEntry.itemId] : null;
  }, [flatQueue, queueIndex, items]);

  const topLevelActiveIndex = flatQueue[queueIndex]?.topIdx ?? -1;

  const onTopLevelItemClick = useCallback((idx: number) => {
    const qIdx = flatQueue.findIndex(q => q.topIdx === idx);
    if (qIdx !== -1) {
        setQueueIndex(qIdx);
        setCurrentRepeat(1);
    }
  }, [flatQueue]);

  // Scheduler Engine
  useEffect(() => {
    const day = currentTime.getDay();
    const hours = currentTime.getHours().toString().padStart(2, '0');
    const minutes = currentTime.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;
    
    const trigger = schedules.find(s => s.active && s.day === day && s.time === timeStr);
    
    if (trigger && lastScheduledIdRef.current !== `${trigger.id}-${timeStr}`) {
        lastScheduledIdRef.current = `${trigger.id}-${timeStr}`;
        setActivePlaylistId(trigger.playlistId);
        setQueueIndex(0);
        setCurrentRepeat(1);
        setIsPlaying(true);
    }
  }, [currentTime, schedules]);

  // Clock Update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Safe object URL management
  useEffect(() => {
    return () => {
      if (mediaUrl) {
        URL.revokeObjectURL(mediaUrl);
      }
    };
  }, [mediaUrl]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    if (videoRef.current) videoRef.current.volume = volume;
  }, [volume]);

  // Load current item with race condition protection
  const loadItem = useCallback(async () => {
    const loadId = ++loadIdRef.current;
    
    // Reset mediaUrl immediately when item changes to stop previous playback
    setMediaUrl(null);

    if (!currentItem) return;

    if (currentItem.type === PlaylistItemType.AUDIO || currentItem.type === PlaylistItemType.VIDEO) {
      if (currentItem.sourceId) {
        try {
          const fileData = await getFile(currentItem.sourceId);
          // Protection against stale requests
          if (loadId !== loadIdRef.current) return;

          if (fileData) {
            const url = URL.createObjectURL(fileData.blob);
            setMediaUrl(url);
          }
        } catch (err) {
          console.error("Error loading file:", err);
        }
      }
    }
  }, [currentItem]);

  const onLoadedMetadata = (e: React.SyntheticEvent<HTMLMediaElement>) => {
    const media = e.currentTarget;
    if (currentItem && currentItem.start) {
        media.currentTime = currentItem.start;
    }
    if (isPlaying) {
        media.play().catch(err => {
            console.warn("Auto-play blocked after metadata load", err);
        });
    }
  };

  const onTimeUpdate = (e: React.SyntheticEvent<HTMLMediaElement>) => {
    if (isPlaying && currentItem && currentItem.end && e.currentTarget.currentTime >= currentItem.end) {
        handleNext(queueIndex, currentRepeat);
    }
  };

  const onMediaEnded = () => {
    handleNext(queueIndex, currentRepeat);
  };

  useEffect(() => {
    loadItem();
  }, [loadItem]);

  // Handle play/pause commands from isPlaying state
  useEffect(() => {
    const media = currentItem?.type === PlaylistItemType.AUDIO ? audioRef.current : videoRef.current;
    if (!media || !mediaUrl) return;

    if (isPlaying) {
      // Small buffer to ensure browser is ready
      const playPromise = media.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
             console.error("Playback failed:", error);
          }
        });
      }
    } else {
      media.pause();
    }
  }, [isPlaying, mediaUrl, currentItem, currentRepeat, queueIndex]);

  // Handle item completion
  const handleNext = useCallback((targetIndex?: number | React.BaseSyntheticEvent, targetRepeat?: number) => {
    // If targets are provided as numbers, verify they match current state to avoid race conditions/skipping
    // Events might be passed if called directly from onClick
    const verifiedIndex = typeof targetIndex === 'number' ? targetIndex : undefined;
    if (verifiedIndex !== undefined && verifiedIndex !== queueIndex) return;
    if (targetRepeat !== undefined && targetRepeat !== currentRepeat) return;

    if (!flatQueue.length || !currentItem) return;

    // Prevent double triggering for the same item/repeat
    const currentId = `${queueIndex}-${currentRepeat}`;
    if (lastHandledRef.current === currentId) return;
    lastHandledRef.current = currentId;

    if (currentRepeat < currentItem.repeatCount) {
      setCurrentRepeat(prev => prev + 1);
      const media = currentItem.type === PlaylistItemType.AUDIO ? audioRef.current : videoRef.current;
      if (media) {
          media.currentTime = currentItem.start || 0;
          if (isPlaying) {
            media.play().catch(() => {});
          }
      }
    } else {
      setCurrentRepeat(1);
      setQueueIndex(prev => {
          if (prev < flatQueue.length - 1) {
              return prev + 1;
          } else {
              setIsPlaying(false);
              return 0;
          }
      });
    }
  }, [flatQueue, currentItem, currentRepeat, isPlaying, queueIndex]);

  useEffect(() => {
    if (isPlaying && currentItem) {
        if (currentItem.type === PlaylistItemType.SILENCE) {
            const currentIdx = queueIndex;
            const currentRep = currentRepeat;
            const timer = setTimeout(() => handleNext(currentIdx, currentRep), currentItem.duration * 1000);
            return () => clearTimeout(timer);
        }
    }
  }, [isPlaying, currentItem, handleNext, queueIndex, currentRepeat]);

  // Scheduling state
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [schedDay, setSchedDay] = useState(0);
  const [schedTime, setSchedTime] = useState('12:00');
  const [schedPId, setSchedPId] = useState('');

  return (
    <div className="flex flex-col h-full gap-8 bg-slate-950 overflow-y-auto custom-scrollbar p-6">
      <div className="flex-1 flex flex-col lg:flex-row gap-8">
        <div className="flex-1 flex flex-col gap-6">
            <MediaStage 
                activePlaylistId={activePlaylistId}
                currentItem={currentItem}
                currentItemIndex={topLevelActiveIndex}
                currentRepeat={currentRepeat}
                mediaUrl={mediaUrl}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                audioRef={audioRef}
                videoRef={videoRef}
                onLoadedMetadata={onLoadedMetadata}
                onTimeUpdate={onTimeUpdate}
                onEnded={onMediaEnded}
                handleNext={handleNext}
            />

            <SyncMaster 
                currentTime={currentTime}
                schedules={schedules}
                playlists={playlists}
                days={days}
                showScheduleForm={showScheduleForm}
                setShowScheduleForm={setShowScheduleForm}
                removeSchedule={removeSchedule}
                schedDay={schedDay}
                setSchedDay={setSchedDay}
                schedTime={schedTime}
                setSchedTime={setSchedTime}
                schedPId={schedPId}
                setSchedPId={setSchedPId}
                addSchedule={addSchedule}
            />
        </div>

        <PlaylistQueue 
            playlists={playlists}
            items={items}
            activePlaylistId={activePlaylistId}
            setActivePlaylistId={setActivePlaylistId}
            topLevelActiveIndex={topLevelActiveIndex}
            onTopLevelItemClick={onTopLevelItemClick}
            setCurrentRepeat={setCurrentRepeat}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            handleNext={handleNext}
            volume={volume}
            setVolume={setVolume}
        />
      </div>
    </div>
  );
};
