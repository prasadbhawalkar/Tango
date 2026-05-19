/**
 * Hardened PlayView Component
 * Includes fixes for:
 * 1. Async race-safe media loading
 * 2. Safe current item extraction
 * 3. Explicit media element selection
 * 4. Media error recovery
 * 5. Reducer-based playback engine
 * 6. Internal responsibility separation
 * 7. Functional scheduler execution
 * 8. Playback state synchronization
 */

import React, {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useCallback,
  useState,
} from 'react';

import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  VolumeX,
  Calendar,
  X,
} from 'lucide-react';

import { useTango } from '../context/TangoContext';
import { PlaylistItemType } from '../types';
import { getFile } from '../lib/db';

/* =========================================================
   Reducer
========================================================= */

type PlaybackState = {
  activePlaylistId: string | null;
  currentItemIndex: number;
  currentRepeat: number;
  isPlaying: boolean;
};

type PlaybackAction =
  | { type: 'SET_PLAYLIST'; payload: string }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'NEXT'; playlistLength: number; repeatCount: number }
  | { type: 'PREV' }
  | { type: 'RESET' }
  | { type: 'SET_INDEX'; payload: number }
  | { type: 'MEDIA_PLAYING' }
  | { type: 'MEDIA_PAUSED' };

const initialState: PlaybackState = {
  activePlaylistId: null,
  currentItemIndex: 0,
  currentRepeat: 1,
  isPlaying: false,
};

function playbackReducer(
  state: PlaybackState,
  action: PlaybackAction
): PlaybackState {
  switch (action.type) {
    case 'SET_PLAYLIST':
      return {
        ...state,
        activePlaylistId: action.payload,
        currentItemIndex: 0,
        currentRepeat: 1,
      };

    case 'PLAY':
      return {
        ...state,
        isPlaying: true,
      };

    case 'PAUSE':
      return {
        ...state,
        isPlaying: false,
      };

    case 'MEDIA_PLAYING':
      return {
        ...state,
        isPlaying: true,
      };

    case 'MEDIA_PAUSED':
      return {
        ...state,
        isPlaying: false,
      };

    case 'NEXT': {
      if (state.currentRepeat < action.repeatCount) {
        return {
          ...state,
          currentRepeat: state.currentRepeat + 1,
        };
      }

      if (state.currentItemIndex < action.playlistLength - 1) {
        return {
          ...state,
          currentItemIndex: state.currentItemIndex + 1,
          currentRepeat: 1,
        };
      }

      return {
        ...state,
        currentItemIndex: 0,
        currentRepeat: 1,
        isPlaying: false,
      };
    }

    case 'PREV':
      return {
        ...state,
        currentItemIndex: Math.max(0, state.currentItemIndex - 1),
        currentRepeat: 1,
      };

    case 'SET_INDEX':
      return {
        ...state,
        currentItemIndex: action.payload,
        currentRepeat: 1,
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

/* =========================================================
   Component
========================================================= */

export const PlayView: React.FC = () => {
  const {
    playlists,
    items,
    schedules,
    addSchedule,
    removeSchedule,
  } = useTango();

  const [state, dispatch] = useReducer(
    playbackReducer,
    initialState
  );

  const {
    activePlaylistId,
    currentItemIndex,
    currentRepeat,
    isPlaying,
  } = state;

  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [schedDay, setSchedDay] = useState(0);
  const [schedTime, setSchedTime] = useState('12:00');
  const [schedPId, setSchedPId] = useState('');

  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const loadRequestRef = useRef(0);
  const previousUrlRef = useRef<string | null>(null);

  const executedSchedulesRef = useRef<Set<string>>(new Set());

  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  /* =========================================================
     Derived State
  ========================================================= */

  const playlist = useMemo(() => {
    if (!activePlaylistId) return null;
    return playlists[activePlaylistId] || null;
  }, [activePlaylistId, playlists]);

  const currentItemId = useMemo(() => {
    return playlist?.itemIds?.[currentItemIndex] || null;
  }, [playlist, currentItemIndex]);

  const currentItem = useMemo(() => {
    if (!currentItemId) return null;
    return items[currentItemId] || null;
  }, [currentItemId, items]);

  /* =========================================================
     Clock
  ========================================================= */

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /* =========================================================
     Scheduler Engine
  ========================================================= */

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();

      const day = now.getDay();

      const time = now.toLocaleTimeString([], {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      });

      schedules.forEach((schedule) => {
        const key = `${schedule.id}-${day}-${time}`;

        if (
          schedule.active &&
          schedule.day === day &&
          schedule.time === time &&
          !executedSchedulesRef.current.has(key)
        ) {
          executedSchedulesRef.current.add(key);

          dispatch({
            type: 'SET_PLAYLIST',
            payload: schedule.playlistId,
          });

          dispatch({ type: 'PLAY' });
        }
      });

      // Cleanup old entries
      if (executedSchedulesRef.current.size > 1000) {
        executedSchedulesRef.current.clear();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [schedules]);

  /* =========================================================
     Media Element Selection
  ========================================================= */

  const getMediaElement = useCallback(() => {
    if (!currentItem) return null;

    switch (currentItem.type) {
      case PlaylistItemType.AUDIO:
        return audioRef.current;

      case PlaylistItemType.VIDEO:
        return videoRef.current;

      default:
        return null;
    }
  }, [currentItem]);

  /* =========================================================
     Volume Sync
  ========================================================= */

  useEffect(() => {
    const media = getMediaElement();

    if (media) {
      media.volume = volume;
    }
  }, [volume, getMediaElement]);

  /* =========================================================
     Media Loader (Race Safe)
  ========================================================= */

  const loadMedia = useCallback(async () => {
    const requestId = ++loadRequestRef.current;

    if (!currentItem) {
      setMediaUrl(null);
      return;
    }

    if (
      currentItem.type !== PlaylistItemType.AUDIO &&
      currentItem.type !== PlaylistItemType.VIDEO
    ) {
      setMediaUrl(null);
      return;
    }

    if (!currentItem.sourceId) {
      setMediaUrl(null);
      return;
    }

    try {
      const fileData = await getFile(currentItem.sourceId);

      if (requestId !== loadRequestRef.current) {
        return;
      }

      if (!fileData) {
        setMediaUrl(null);
        return;
      }

      if (previousUrlRef.current) {
        URL.revokeObjectURL(previousUrlRef.current);
      }

      const url = URL.createObjectURL(fileData.blob);

      previousUrlRef.current = url;

      setMediaUrl(url);
    } catch (err) {
      console.error('Media load failed:', err);
      setMediaUrl(null);
    }
  }, [currentItem]);

  useEffect(() => {
    loadMedia();

    return () => {
      if (previousUrlRef.current) {
        URL.revokeObjectURL(previousUrlRef.current);
        previousUrlRef.current = null;
      }
    };
  }, [loadMedia]);

  /* =========================================================
     Playback Controls
  ========================================================= */

  const handleNext = useCallback(() => {
    if (!playlist || !currentItem) return;

    dispatch({
      type: 'NEXT',
      playlistLength: playlist.itemIds.length,
      repeatCount: currentItem.repeatCount || 1,
    });
  }, [playlist, currentItem]);

  const handlePrev = useCallback(() => {
    dispatch({ type: 'PREV' });
  }, []);

  /* =========================================================
     Silence Handling
  ========================================================= */

  useEffect(() => {
    if (
      !isPlaying ||
      !currentItem ||
      currentItem.type !== PlaylistItemType.SILENCE
    ) {
      return;
    }

    const timeout = setTimeout(() => {
      handleNext();
    }, (currentItem.duration || 0) * 1000);

    return () => clearTimeout(timeout);
  }, [isPlaying, currentItem, handleNext]);

  /* =========================================================
     Playback Synchronization
  ========================================================= */

  useEffect(() => {
    const media = getMediaElement();

    if (!media || !mediaUrl) return;

    if (isPlaying) {
      media
        .play()
        .then(() => {
          dispatch({ type: 'MEDIA_PLAYING' });
        })
        .catch((err) => {
          console.warn('Playback blocked:', err);

          dispatch({ type: 'MEDIA_PAUSED' });
        });
    } else {
      media.pause();
    }
  }, [
    isPlaying,
    mediaUrl,
    currentItemIndex,
    getMediaElement,
  ]);

  /* =========================================================
     Media Events
  ========================================================= */

  const handleLoadedMetadata = (
    e: React.SyntheticEvent<HTMLMediaElement>
  ) => {
    if (!currentItem) return;

    if (currentItem.start) {
      e.currentTarget.currentTime = currentItem.start;
    }
  };

  const handleTimeUpdate = (
    e: React.SyntheticEvent<HTMLMediaElement>
  ) => {
    if (!currentItem || !isPlaying) return;

    if (
      currentItem.end &&
      e.currentTarget.currentTime >= currentItem.end
    ) {
      handleNext();
    }
  };

  const handleMediaError = () => {
    console.error('Media playback error');
    handleNext();
  };

  /* =========================================================
     Playlist Safety
  ========================================================= */

  useEffect(() => {
    if (!playlist) return;

    if (currentItemIndex >= playlist.itemIds.length) {
      dispatch({ type: 'SET_INDEX', payload: 0 });
    }
  }, [playlist, currentItemIndex]);

  /* =========================================================
     Render
  ========================================================= */

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white p-6 gap-6 overflow-y-auto">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">
            Playback Engine
          </h1>

          <p className="text-slate-500 text-sm">
            Hardened Media Sequencer
          </p>
        </div>

        <div className="text-right">
          <div className="text-sm uppercase text-slate-500">
            Sync Clock
          </div>

          <div className="font-mono text-2xl font-black">
            {currentTime.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Playlist Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">

        <div className="flex justify-between items-center mb-4">
          <div className="text-xs uppercase tracking-widest text-slate-500">
            Active Playlist
          </div>

          <button
            onClick={() =>
              setShowScheduleForm(!showScheduleForm)
            }
            className="text-xs uppercase bg-orange-500 text-black px-3 py-1 rounded-lg font-bold"
          >
            Scheduler
          </button>
        </div>

        <select
          value={activePlaylistId || ''}
          onChange={(e) => {
            if (!e.target.value) return;

            dispatch({
              type: 'SET_PLAYLIST',
              payload: e.target.value,
            });
          }}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3"
        >
          <option value="">-- Select Playlist --</option>

          {Object.values(playlists).map((p: any) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* Scheduler */}
        <AnimatePresence>
          {showScheduleForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-6 p-4 bg-slate-950 rounded-2xl border border-slate-800"
            >
              <div className="grid grid-cols-3 gap-3">

                <select
                  value={schedDay}
                  onChange={(e) =>
                    setSchedDay(parseInt(e.target.value))
                  }
                  className="bg-slate-900 p-2 rounded-lg"
                >
                  {days.map((d, i) => (
                    <option key={d} value={i}>
                      {d}
                    </option>
                  ))}
                </select>

                <input
                  type="time"
                  value={schedTime}
                  onChange={(e) =>
                    setSchedTime(e.target.value)
                  }
                  className="bg-slate-900 p-2 rounded-lg"
                />

                <select
                  value={schedPId}
                  onChange={(e) =>
                    setSchedPId(e.target.value)
                  }
                  className="bg-slate-900 p-2 rounded-lg"
                >
                  <option value="">Playlist</option>

                  {Object.values(playlists).map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  if (!schedPId) return;

                  addSchedule({
                    day: schedDay,
                    time: schedTime,
                    playlistId: schedPId,
                    active: true,
                  });

                  setShowScheduleForm(false);
                }}
                className="mt-4 w-full bg-teal-500 text-black py-2 rounded-xl font-black uppercase"
              >
                Save Schedule
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Current Item */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">

        {!currentItem && (
          <div className="text-center text-slate-500 py-20">
            No media selected
          </div>
        )}

        {currentItem && (
          <>
            <div className="mb-6">
              <div className="text-xs uppercase text-orange-500 tracking-widest">
                Now Playing
              </div>

              <h2 className="text-3xl font-black mt-2">
                {currentItem.title}
              </h2>

              <div className="mt-2 text-sm text-slate-400">
                {currentItem.type} • Loop {currentRepeat}/
                {currentItem.repeatCount || 1}
              </div>
            </div>

            {/* AUDIO */}
            {currentItem.type === PlaylistItemType.AUDIO && (
              <audio
                ref={audioRef}
                src={mediaUrl || ''}
                controls
                className="w-full"
                onEnded={handleNext}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onError={handleMediaError}
                onPlay={() =>
                  dispatch({ type: 'MEDIA_PLAYING' })
                }
                onPause={() =>
                  dispatch({ type: 'MEDIA_PAUSED' })
                }
              />
            )}

            {/* VIDEO */}
            {currentItem.type === PlaylistItemType.VIDEO && (
              <video
                ref={videoRef}
                src={mediaUrl || ''}
                controls
                playsInline
                className="w-full rounded-xl bg-black max-h-[50vh]"
                onEnded={handleNext}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onError={handleMediaError}
                onPlay={() =>
                  dispatch({ type: 'MEDIA_PLAYING' })
                }
                onPause={() =>
                  dispatch({ type: 'MEDIA_PAUSED' })
                }
              />
            )}

            {/* SILENCE */}
            {currentItem.type === PlaylistItemType.SILENCE && (
              <div className="py-16 text-center border-2 border-dashed border-slate-700 rounded-2xl">
                <VolumeX
                  size={48}
                  className="mx-auto mb-4 text-slate-500"
                />

                <div className="text-xl font-black">
                  Silence Segment
                </div>

                <div className="text-slate-500 mt-2">
                  {currentItem.duration}s
                </div>
              </div>
            )}

            {/* Missing Media */}
            {!mediaUrl &&
              currentItem.type !==
                PlaylistItemType.SILENCE && (
                <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                  <div className="text-red-400 text-sm">
                    Media source missing
                  </div>

                  <button
                    onClick={handleNext}
                    className="mt-2 text-orange-400 text-sm font-bold"
                  >
                    Skip Track →
                  </button>
                </div>
              )}
          </>
        )}
      </div>

      {/* Queue */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <div className="text-xs uppercase tracking-widest text-slate-500 mb-4">
          Queue
        </div>

        <div className="space-y-2">
          {playlist?.itemIds.map((id, idx) => {
            const item = items[id];

            if (!item) return null;

            return (
              <div
                key={id}
                className={`p-4 rounded-xl border ${
                  idx === currentItemIndex
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-slate-800 bg-slate-950'
                }`}
              >
                <div className="font-bold">
                  {item.title}
                </div>

                <div className="text-xs text-slate-500 uppercase">
                  {item.type}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">

        <div className="flex justify-center items-center gap-6">

          <button
            onClick={handlePrev}
            className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center"
          >
            <SkipBack />
          </button>

          <button
            onClick={() =>
              dispatch({
                type: isPlaying ? 'PAUSE' : 'PLAY',
              })
            }
            className="w-20 h-20 rounded-full bg-orange-500 text-black flex items-center justify-center"
          >
            {isPlaying ? (
              <Pause size={36} />
            ) : (
              <Play size={36} fill="currentColor" />
            )}
          </button>

          <button
            onClick={handleNext}
            className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center"
          >
            <SkipForward />
          </button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-4 mt-6">

          <button
            onClick={() =>
              setVolume((v) => (v === 0 ? 1 : 0))
            }
          >
            <VolumeX
              className={
                volume === 0 ? 'text-red-500' : ''
              }
            />
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) =>
              setVolume(parseFloat(e.target.value))
            }
            className="flex-1"
          />
        </div>
      </div>

      {/* Schedule List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">

        <div className="flex items-center gap-2 mb-4">
          <Calendar size={16} />
          <div className="uppercase text-xs tracking-widest text-slate-500">
            Schedules
          </div>
        </div>

        <div className="space-y-2">
          {schedules.map((s) => (
            <div
              key={s.id}
              className="flex justify-between items-center p-3 rounded-xl bg-slate-950 border border-slate-800"
            >
              <div>
                <div className="font-bold">
                  {days[s.day]} {s.time}
                </div>

                <div className="text-xs text-slate-500">
                  {playlists[s.playlistId]?.name}
                </div>
              </div>

              <button
                onClick={() => removeSchedule(s.id)}
                className="text-red-500"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
