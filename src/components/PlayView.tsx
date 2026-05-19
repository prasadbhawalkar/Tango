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
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [currentRepeat, setCurrentRepeat] = useState(1);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const loadIdRef = useRef(0);
  const previousUrlRef = useRef<string | null>(null);
  const lastScheduledIdRef = useRef<string | null>(null);

  const playlist = activePlaylistId ? playlists[activePlaylistId] : null;

  const currentItem = React.useMemo(() => {
    const itemId = playlist?.itemIds[currentItemIndex];
    return itemId ? items[itemId] : null;
  }, [playlist, currentItemIndex, items]);

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
        setCurrentItemIndex(0);
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
        handleNext();
    }
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
          if (error.name !== 'AbortError') {
             console.error("Playback failed:", error);
          }
        });
      }
    } else {
      media.pause();
    }
  }, [isPlaying, mediaUrl, currentItem]);

  // Handle item completion
  const handleNext = useCallback(() => {
    if (!playlist || !currentItem) return;

    if (currentRepeat < currentItem.repeatCount) {
      setCurrentRepeat(prev => prev + 1);
      const media = currentItem.type === PlaylistItemType.AUDIO ? audioRef.current : videoRef.current;
      if (media) {
          media.currentTime = currentItem.start || 0;
          if (isPlaying) media.play().catch(() => {});
      }
    } else {
      setCurrentRepeat(1);
      setCurrentItemIndex(prev => {
          if (prev < playlist.itemIds.length - 1) {
              return prev + 1;
          } else {
              setIsPlaying(false);
              return 0;
          }
      });
    }
  }, [playlist, currentItem, currentRepeat, isPlaying]);

  useEffect(() => {
    if (isPlaying && currentItem) {
        if (currentItem.type === PlaylistItemType.SILENCE) {
            const timer = setTimeout(handleNext, currentItem.duration * 1000);
            return () => clearTimeout(timer);
        }
    }
  }, [isPlaying, currentItem, handleNext]);

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
                currentItemIndex={currentItemIndex}
                currentRepeat={currentRepeat}
                mediaUrl={mediaUrl}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                audioRef={audioRef}
                videoRef={videoRef}
                onLoadedMetadata={onLoadedMetadata}
                onTimeUpdate={onTimeUpdate}
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
            currentItemIndex={currentItemIndex}
            setCurrentItemIndex={setCurrentItemIndex}
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
