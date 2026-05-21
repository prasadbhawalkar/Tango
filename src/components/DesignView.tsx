/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useTango } from '../context/TangoContext';
import { Plus, Download, Upload, ListMusic, PlusCircle, VolumeX, Save, Check } from 'lucide-react';
import { PlaylistItemEditor } from './PlaylistItemEditor';
import { PlaylistItemType, PlaylistItem } from '../types';
import { saveFile } from '../lib/db';
import { exportToM3U, parseM3U } from '../lib/m3u';

export const DesignView: React.FC = () => {
  const { 
    playlists, 
    items, 
    addPlaylist, 
    updatePlaylist, 
    deletePlaylist, 
    addItem, 
    updateItem, 
    deleteItem,
    reorderItems 
  } = useTango();

  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const m3uInputRef = useRef<HTMLInputElement>(null);

  const activePlaylist = selectedPlaylistId ? playlists[selectedPlaylistId] : null;

  const handleImportM3UFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const { name, rawItems } = parseM3U(content);
      const playlistId = addPlaylist(name || 'Imported Playlist');
      
      const newItemIds: string[] = [];
      for (const raw of rawItems) {
        const id = crypto.randomUUID();
        const item: PlaylistItem = {
          id,
          type: PlaylistItemType.AUDIO, // Defaulting to audio for M3U, though we can't easily verify blob source
          title: raw.title,
          duration: raw.duration || 180,
          start: 0,
          end: raw.duration || 180,
          repeatCount: 1,
        };
        addItem(item);
        newItemIds.push(id);
      }
      
      updatePlaylist(playlistId, { itemIds: newItemIds });
      setSelectedPlaylistId(playlistId);
    };
    reader.readAsText(file);
  };

  const handleSave = () => {
    setIsSaving(true);
    // Force sync if needed, but context handles auto-save
    setTimeout(() => setIsSaving(false), 1500);
  };

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      const id = addPlaylist(newPlaylistName.trim());
      setSelectedPlaylistId(id);
      setNewPlaylistName('');
      setIsCreating(false);
    }
  };

  const getMediaDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const element = document.createElement(file.type.startsWith('audio') ? 'audio' : 'video');
      element.preload = 'metadata';
      element.onloadedmetadata = () => {
        resolve(element.duration || 0);
        URL.revokeObjectURL(element.src);
      };
      element.onerror = () => {
        resolve(0);
        URL.revokeObjectURL(element.src);
      };
      element.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !selectedPlaylistId) return;

    for (const file of Array.from(files) as File[]) {
      const sourceId = await saveFile(file);
      const id = crypto.randomUUID();
      
      const duration = await getMediaDuration(file);

      const item = {
        id,
        type: file.type.startsWith('audio') ? PlaylistItemType.AUDIO : PlaylistItemType.VIDEO,
        title: file.name,
        sourceId,
        duration: Math.round(duration),
        start: 0,
        end: Math.round(duration) || (file.type.startsWith('audio') ? 180 : 300),
        repeatCount: 1,
      };

      addItem(item);
      const playlist = playlists[selectedPlaylistId];
      updatePlaylist(selectedPlaylistId, {
        itemIds: [...playlist.itemIds, id],
      });
    }
  };

  const addSilence = () => {
    if (!selectedPlaylistId) return;
    const id = crypto.randomUUID();
    const item = {
      id,
      type: PlaylistItemType.SILENCE,
      title: 'Silence',
      duration: 5,
      start: 0,
      end: 5,
      repeatCount: 1,
    };
    addItem(item);
    updatePlaylist(selectedPlaylistId, {
      itemIds: [...playlists[selectedPlaylistId].itemIds, id],
    });
  };

  const handleExport = () => {
    if (!activePlaylist) return;
    const m3u = exportToM3U(activePlaylist, items);
    const blob = new Blob([m3u], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activePlaylist.name}.m3u`;
    a.click();
  };

  return (
    <div className="flex flex-col md:flex-row h-full gap-0 -m-8">
      {/* Sidebar: Playlists */}
      <aside className="w-full md:w-64 bg-slate-900/50 border-r border-slate-800 flex flex-col p-6 gap-6">
        <div>
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">My Libraries</h3>
          <div className="flex flex-col gap-2 overflow-y-auto">
            {Object.values(playlists).map((p: any) => (
              <button
                key={p.id}
                onClick={() => setSelectedPlaylistId(p.id)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all text-sm font-semibold ${
                  selectedPlaylistId === p.id 
                    ? 'bg-slate-800 border-orange-500/30 text-orange-400 shadow-lg' 
                    : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="truncate pr-2">{p.name}</div>
                {selectedPlaylistId === p.id ? (
                  <span className="text-[9px] bg-orange-500/20 px-2 py-0.5 rounded tracking-widest uppercase">Active</span>
                ) : (
                  <span className="text-[9px] text-slate-600">{p.itemIds.length} ITEMS</span>
                )}
              </button>
            ))}
          </div>
        </div>
        
        <div className="mt-auto flex flex-col gap-2">
          <input 
            type="file" 
            accept=".m3u" 
            className="hidden" 
            ref={m3uInputRef} 
            onChange={handleImportM3UFile} 
          />
          <button 
            onClick={() => m3uInputRef.current?.click()}
            className="w-full py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-white hover:border-slate-500 transition-all"
          >
            Import M3U
          </button>
          <div 
            onClick={() => !isCreating && setIsCreating(true)}
            className={`w-full py-4 bg-slate-900 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 font-bold text-xs uppercase tracking-widest hover:border-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all text-center ${!isCreating ? 'cursor-pointer' : ''}`}
          >
          {isCreating ? (
            <div className="px-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
              <input 
                autoFocus
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 flex-1 text-white lowercase"
                placeholder="name..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreatePlaylist();
                  if (e.key === 'Escape') setIsCreating(false);
                }}
              />
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleCreatePlaylist();
                }} 
                className="text-teal-500 px-2 py-1 hover:bg-white/5 rounded transition-colors"
              >
                OK
              </button>
            </div>
          ) : (
            '+ New Playlist'
          )}
        </div>
      </div>
    </aside>

      {/* Main Content: Items */}
      <section className="flex-1 flex flex-col p-8 gap-8 bg-slate-950 overflow-hidden">
        {activePlaylist ? (
          <>
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 group">
                  <input
                    type="text"
                    value={activePlaylist.name}
                    onChange={(e) => updatePlaylist(activePlaylist.id, { name: e.target.value })}
                    className="text-2xl font-bold text-white bg-transparent border-b border-transparent focus:border-orange-500 focus:outline-none transition-all hover:bg-white/5 px-2 -ml-2 rounded"
                  />
                  <span className="text-slate-500 font-normal text-xs uppercase tracking-widest bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">
                    {activePlaylist.itemIds.length} Sequences
                  </span>
                </div>
                <div className="flex gap-4 mt-2 items-center">
                  <button 
                    onClick={handleSave} 
                    className={`px-3 py-1.5 rounded-lg border text-[10px] uppercase font-black tracking-widest transition-all flex items-center gap-2 ${
                      isSaving 
                        ? 'bg-teal-500/10 border-teal-500 text-teal-400' 
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
                    }`}
                  >
                    {isSaving ? <Check size={12} strokeWidth={3} /> : <Save size={12} />}
                    {isSaving ? 'Synchronized' : 'Save Config'}
                  </button>
                  <div className="h-4 w-[1px] bg-slate-800 ml-1 mr-1"></div>
                  <button onClick={handleExport} className="text-[10px] uppercase font-bold text-slate-500 hover:text-orange-500 transition-colors flex items-center gap-1.5">
                    <Download size={12} /> Export M3U
                  </button>
                  <button onClick={() => deletePlaylist(activePlaylist.id)} className="text-[10px] uppercase font-bold text-slate-500 hover:text-red-500 transition-colors flex items-center gap-1.5">
                    <VolumeX size={12} /> Purge Playlist
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <input 
                  type="file" 
                  multiple 
                  accept="audio/*,video/*" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-teal-500 text-slate-950 rounded uppercase text-[10px] font-black tracking-widest hover:bg-teal-400 transition-all shadow-lg shadow-teal-500/10"
                >
                  + Audio/Video
                </button>
                <div className="relative group">
                  <button 
                    className="px-4 py-2 bg-amber-500 text-slate-950 rounded uppercase text-[10px] font-black tracking-widest hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/10"
                  >
                    + Playlist
                  </button>
                  <div className="absolute top-full right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                    <div className="p-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-950/50">Select to Nest</div>
                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                      {Object.values(playlists)
                        .filter((p: any) => p.id !== selectedPlaylistId)
                        .map((p: any) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              const id = crypto.randomUUID();
                              const item = {
                                id,
                                type: PlaylistItemType.PLAYLIST,
                                title: `${p.name}`,
                                playlistId: p.id,
                                duration: 0,
                                start: 0,
                                end: 0,
                                repeatCount: 1,
                              };
                              addItem(item);
                              updatePlaylist(selectedPlaylistId!, {
                                itemIds: [...activePlaylist!.itemIds, id],
                              });
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors border-t border-slate-800/50"
                          >
                            {p.name}
                          </button>
                        ))}
                      {Object.values(playlists).filter((p: any) => p.id !== selectedPlaylistId).length === 0 && (
                        <div className="px-4 py-3 text-[10px] text-slate-600 italic">No other playlists</div>
                      )}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={addSilence}
                  className="px-4 py-2 bg-indigo-500 text-slate-950 rounded uppercase text-[10px] font-black tracking-widest hover:bg-indigo-400 transition-all shadow-lg shadow-indigo-500/10"
                >
                  + Silence
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto pr-4 pb-10 space-y-3 custom-scrollbar">
              {activePlaylist.itemIds.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-text-secondary border-2 border-dashed border-white/10 rounded-2xl">
                   <ListMusic size={40} className="mb-4 opacity-20" />
                   <p className="mono-label">No items in this playlist yet</p>
                </div>
              ) : (
                activePlaylist.itemIds.map((itemId, index) => (
                  <PlaylistItemEditor
                    key={itemId}
                    currentIndex={index}
                    item={items[itemId]}
                    onUpdate={(upd) => updateItem(itemId, upd)}
                    onDelete={() => deleteItem(itemId, activePlaylist.id)}
                    onReorder={(newIdx) => {
                      const newIds = [...activePlaylist.itemIds];
                      const [removed] = newIds.splice(index, 1);
                      newIds.splice(Math.max(0, Math.min(newIdx, newIds.length)), 0, removed);
                      reorderItems(activePlaylist.id, newIds);
                    }}
                  />
                ))
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-text-secondary opacity-40">
             <ListMusic size={64} className="mb-4" />
             <p className="text-xl font-medium">Select or create a playlist to start</p>
          </div>
        )}
      </section>
    </div>
  );
};
