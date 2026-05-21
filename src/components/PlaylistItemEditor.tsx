/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PlaylistItem, PlaylistItemType } from '../types';
import { X, Repeat, Scissors, Clock } from 'lucide-react';

interface Props {
  item: PlaylistItem;
  onUpdate: (updates: Partial<PlaylistItem>) => void;
  onDelete: () => void;
  onReorder: (newIndex: number) => void;
  currentIndex: number;
}

export const PlaylistItemEditor: React.FC<Props> = ({ item, onUpdate, onDelete, onReorder, currentIndex }) => {
  const [startDraft, setStartDraft] = useState('');
  const [endDraft, setEndDraft] = useState('');
  const [durationDraft, setDurationDraft] = useState('');
  const typeStyles = {
    [PlaylistItemType.AUDIO]: 'border-teal-500 text-teal-500 bg-teal-500/10',
    [PlaylistItemType.VIDEO]: 'border-teal-500 text-teal-500 bg-teal-500/10',
    [PlaylistItemType.SILENCE]: 'border-indigo-500 text-indigo-500 bg-indigo-500/10',
    [PlaylistItemType.PLAYLIST]: 'border-amber-500 text-amber-500 bg-amber-500/10',
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const parseTime = (val: string) => {
    const parts = val.split(':').map(p => parseInt(p) || 0);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return parseInt(val) || 0;
  };

  useEffect(() => {
    setStartDraft(formatTime(item.start));
  }, [item.start]);

  useEffect(() => {
    setEndDraft(formatTime(item.end));
  }, [item.end]);

  useEffect(() => {
    setDurationDraft(formatTime(item.duration));
  }, [item.duration]);

  const [repeatDraft, setRepeatDraft] = useState(item.repeatCount.toString());

  useEffect(() => {
    setRepeatDraft(item.repeatCount.toString());
  }, [item.repeatCount]);

  const triggerRepeatUpdate = () => {
    const val = parseInt(repeatDraft.replace(/[^0-9]/g, ''));
    if (!isNaN(val) && val > 0) {
      onUpdate({ repeatCount: val });
    } else {
      setRepeatDraft(item.repeatCount.toString());
    }
  };

  const [indexDraft, setIndexDraft] = useState((currentIndex + 1).toString());

  useEffect(() => {
    setIndexDraft((currentIndex + 1).toString());
  }, [currentIndex]);

  const triggerReorder = () => {
    const val = parseInt(indexDraft.replace(/[^0-9]/g, ''));
    if (!isNaN(val) && val !== currentIndex + 1) {
      onReorder(val - 1);
    } else {
      setIndexDraft((currentIndex + 1).toString());
    }
  };

  return (
    <div className={`p-4 bg-slate-900 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col gap-4 ${item.type === PlaylistItemType.PLAYLIST ? 'ring-1 ring-amber-500/20' : ''}`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-lg text-center focus:outline-none focus:ring-2 focus:ring-white/20 transition-all cursor-pointer ${typeStyles[item.type]}`}
            value={indexDraft}
            onChange={(e) => setIndexDraft(e.target.value)}
            onBlur={triggerReorder}
            onKeyDown={(e) => {
              if (e.key === 'Enter') triggerReorder();
              if (e.key === 'Escape') setIndexDraft((currentIndex + 1).toString());
            }}
          />
          <div>
            <h3 className={`font-semibold ${item.type === PlaylistItemType.SILENCE ? 'text-slate-400 italic' : 'text-slate-100'}`}>{item.title}</h3>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{item.type} • {item.type === PlaylistItemType.PLAYLIST ? 'Nested' : 'Source File'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => (onUpdate as any)({ _duplicate: true })}
            className="p-2 hover:bg-white/5 rounded-xl text-slate-600 hover:text-teal-500 transition-all font-bold uppercase text-[10px] tracking-widest px-3"
          >
            Copy
          </button>
          <button
            onClick={onDelete}
            className="p-2 hover:bg-red-500/10 rounded-xl text-slate-600 hover:text-red-500 transition-all font-bold uppercase text-[10px] tracking-widest px-3"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        {/* Repeating */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">
            Loop Count
          </label>
          <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
              <div className="flex-1 flex items-center px-3 gap-2">
                <span className="text-[10px] text-slate-500 font-bold shrink-0">PLAYS:</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={repeatDraft}
                  onChange={(e) => setRepeatDraft(e.target.value)}
                  onBlur={triggerRepeatUpdate}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') triggerRepeatUpdate();
                    if (e.key === 'Escape') setRepeatDraft(item.repeatCount.toString());
                  }}
                  className="w-full bg-transparent text-left font-bold text-sm focus:outline-none text-teal-400"
                />
              </div>
          </div>
        </div>

        {/* Trimming */}
        {(item.type === PlaylistItemType.AUDIO || item.type === PlaylistItemType.VIDEO) && (
          <div className="md:col-span-2">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-2 flex justify-between">
              <span>Playback Trim (HH:MM:SS)</span>
              <span className="text-slate-600">Total: {formatTime(item.duration)}</span>
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="text"
                placeholder="0:00"
                value={startDraft}
                onChange={(e) => setStartDraft(e.target.value)}
                onBlur={(e) => onUpdate({ start: parseTime(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-teal-500 text-center"
              />
              <span className="text-slate-700">-</span>
              <input
                type="text"
                placeholder={formatTime(item.duration)}
                value={endDraft}
                onChange={(e) => setEndDraft(e.target.value)}
                onBlur={(e) => onUpdate({ end: parseTime(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-teal-500 text-center"
              />
            </div>
          </div>
        )}

        {item.type === PlaylistItemType.SILENCE && (
          <div className="md:col-span-2">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-2 block">
              Duration (HH:MM:SS)
            </label>
            <input
              type="text"
              placeholder="0:30"
              value={durationDraft}
              onChange={(e) => setDurationDraft(e.target.value)}
              onBlur={(e) => {
                const val = parseTime(e.target.value);
                onUpdate({ duration: Math.max(1, val) });
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm font-bold focus:outline-none focus:border-indigo-500 font-mono text-center"
            />
          </div>
        )}


        {item.type === PlaylistItemType.PLAYLIST && (
           <div className="md:col-span-2">
             <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-amber-500/20">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Repeat size={14} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Linked Playlist</p>
                  <p className="text-xs text-slate-400">Repeats entire sequence {item.repeatCount} times</p>
                </div>
             </div>
           </div>
        )}
      </div>
    </div>
  );
};
