import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, BookOpen, Download, Edit3, PlaySquare, Calendar, 
  VolumeX, AlertTriangle, CheckCircle2, Copy, Save, Check, 
  Play, Pause, SkipBack, SkipForward, Volume2, ListMusic, Plus
} from 'lucide-react';

interface UserManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManualModal: React.FC<UserManualModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'design' | 'play'>('overview');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    const manualContent = `# MUSIC SATHI (म्युझिक साथी) - TECHNICAL USER MANUAL
*Operational Guide for Dual-Mode Multimedia Sequencing, Audio/Video Queue Processing, and Local Playlists*

---

## Welcome to Music Sathi!
Music Sathi (म्युझिक साथी) is an offline-first multimedia sequencer and playlist player. Since the application values your library's absolute integrity, all media files, sequence structures, and schedules are saved securely inside your browser's sandboxed local database (IndexedDB), providing zero-latency playback entirely offline without third-party servers.

---

## 1. Dual-Mode Interface Layout
The workspace is structured around two top-level navigation modes:
- Play Mode [ ▶ PLAY ]: Tailored for media stage viewing, real-time queues, volume sliders, and automated scheduler clocks.
- Design Mode [ ✎ DESIGN ]: Tailored for building libraries, sequencing audio/video media blocks, organizing track sorting, and adjusting precise playback trims.

---

## 2. Design View: Playlist Sequencing and Configuration
The Design panel is split into a library indexing sidebar on the left and a sequencing board on the right.

- Managing Playlists: Select active directories labeled with ACTIVE tags or item counts. Create playlists via "+ New Playlist" text inputs.
- Sequencing: Utilise the action bar [+ Audio/Video] (load files), [+ Playlist] (nest other sequences), or [+ Silence] (quiet gaps).
- Card properties: Use the Numerical Badge circle of each item to reorder sorting, click [Copy] to clone, click [Delete] to wipe tracks, edit PLAYS: loops to repeat, or type start/stop values inside Playback Trim boxes.
- Sync Deck: Use [Save Config] (becomes "Synchronized"), [Export M3U], and [Purge Playlist] buttons to manage sequences.

---

## 3. Play View: Dedicated Technical Execution
The play screen handles continuous playbacks, countdowns, and scheduled automations.

- Media Stage: Features a circularStatus Ring Indicator showing track indexes, metadata loops, and wave/video stages. Underloaded files render a "No Source File Connected" alert with a manual button to [Skip Track].
- Queue List Sidebar: Use "-- Choose Target --" dropdown to select libraries. Highlighted active cards indicate active playback, and completed tracks are checked. Tap any row to jump focus.
- Transport Deck: Previous [ ◀ ], Play/Pause toggles, Next [ ▶ ] circles, and sound sliders (adjusting from 0 to 1 with mute speaker).
- Sync Master: Integrated military chronometer featuring blinking seconds clocks. Form trigger [ + New Task ] lets you bind times (clock formats) and specific days to auto-launch programs.

---
Developed with love and precision. Music Sathi (म्युझिक साथी) is secure, standalone, and offline-compatible.`;

    const blob = new Blob([manualContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Music_Sathi_User_Manual.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-2 md:p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl h-full max-h-[92vh] md:max-h-[85vh] flex flex-col overflow-hidden shadow-2xl text-slate-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top banner header */}
          <div className="p-4 md:p-6 bg-slate-950 border-b border-slate-800/80 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-500/10 text-orange-500 rounded-2xl border border-orange-500/10 shadow-lg">
                <BookOpen size={22} className="stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-black tracking-tight text-white flex items-center gap-2">
                  Music Sathi <span className="text-orange-500 font-medium">Interactive Guide</span>
                </h2>
                <p className="text-[11px] text-slate-400">Step-by-step guidance showing exact button designs and UI controls.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 bg-slate-800 border border-slate-700 hover:border-orange-500/40 hover:bg-slate-755 text-white hover:text-white px-3.5 py-2 rounded-xl transition-all text-xs font-bold"
              >
                {downloadSuccess ? (
                  <>
                    <CheckCircle2 size={13} className="text-teal-400 animate-pulse stroke-[3]" />
                    <span className="text-teal-400">Downloaded!</span>
                  </>
                ) : (
                  <>
                    <Download size={13} className="text-orange-550" />
                    <span>Download Manual (.md)</span>
                  </>
                )}
              </button>
              <button 
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all border border-transparent hover:border-slate-700"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-[350px]">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-56 bg-slate-950/40 p-3 md:p-4 border-b md:border-b-0 md:border-r border-slate-800/60 flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto shrink-0 scrollbar-none">
              {[
                { id: 'overview', label: '📖 Workspace Overview', icon: BookOpen },
                { id: 'design', label: '🎨 Design Mode View', icon: Edit3 },
                { id: 'play', label: '▶ Play Mode View', icon: PlaySquare },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`text-left px-3.5 py-2 md:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 whitespace-nowrap md:w-full select-none ${
                      activeTab === tab.id
                        ? 'bg-orange-500 text-slate-950 font-black shadow-lg shadow-orange-500/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <Icon size={14} className={activeTab === tab.id ? 'text-slate-950' : 'text-orange-500'} />
                    <span>{tab.label.split(' ').slice(1).join(' ')}</span>
                  </button>
                );
              })}
              
              <div className="hidden md:block mt-auto pt-4 border-t border-slate-800/30 text-[10px] text-slate-500 font-mono text-center">
                म्युझिक साथी • Offline Native
              </div>
            </div>

            {/* Main Tabs Deck */}
            <div className="flex-1 p-5 md:p-6 overflow-y-auto custom-scrollbar bg-[#0f1013] text-slate-300 space-y-6">
              
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="p-4 md:p-5 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>
                    <span className="text-[9px] uppercase font-black tracking-widest text-orange-500 block mb-1">Architecture Outline</span>
                    <h3 className="text-base font-black text-white mb-2">Welcome to your Multimedia Sequencer</h3>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                      Music Sathi operates entirely inside your local web browser using **IndexedDB**. This ensures that heavy audio/video tracks remain stored securely in your browser cache, providing safe playback without requiring online database servers.
                    </p>
                  </div>

                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Header View Toggle</h4>
                  <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-3">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Toggle active workspaces instantly using the high-contrast physical slider switch located in the center of the navigation bar:
                    </p>
                    <div className="flex bg-slate-850 p-1 rounded-xl shadow-inner border border-slate-700/80 w-fit">
                      <span className="px-3 py-1.5 rounded-lg bg-orange-500 text-white shadow-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 select-none">
                        <PlaySquare size={12} /> Play
                      </span>
                      <span className="px-3 py-1.5 rounded-lg text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 select-none ml-1">
                        <Edit3 size={12} /> Design
                      </span>
                    </div>
                    <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-1.5 leading-relaxed pl-1 pt-1">
                      <li>Select <span className="text-white font-bold">Design View</span> to compile tracks, adjust loop counts, and manage trim metrics.</li>
                      <li>Select <span className="text-white font-bold">Play View</span> to run active programs, check schedules, and adjust volumes.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* TAB 2: DESIGN MODE */}
              {activeTab === 'design' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <Edit3 size={16} className="text-orange-500 stroke-[2.5]" />
                      <span>Design View: Playlist Sequencing and Configuration</span>
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed mt-1">
                      Construct, reorder, clone, and configure individual blocks of content within your database.
                    </p>
                  </div>

                  {/* Sidebar controls */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">1. Libraries Sidebar (Left column)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Library Selectors</span>
                        <div className="p-2.5 rounded-lg border border-orange-500/30 text-orange-400 bg-slate-800 font-bold text-xs flex justify-between items-center w-48">
                          <span className="truncate">Morning Playlist</span>
                          <span className="text-[8px] bg-orange-500/20 px-1.5 py-0.5 rounded tracking-widest uppercase">Active</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Selected lists highlight in orange with an active tag. Other rows display length offsets (e.g. `5 ITEMS`).
                        </p>
                      </div>

                      <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Creation and M3U Ingests</span>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="py-2 px-3 bg-slate-950 border border-dashed border-slate-800 rounded-lg text-slate-500 font-bold text-[10px] uppercase tracking-wider select-none">
                            + New Playlist
                          </div>
                          <div className="py-1.5 px-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 font-bold text-[9px] uppercase tracking-wider select-none">
                            Import M3U
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Click **+ New Playlist** to open the <span className="text-slate-200 font-bold font-mono">name...</span> prompt and enter a name. Use **Import M3U** to convert standard indexes instantly.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Main toolbar actions */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">2. Sequence Insertion Options</h4>
                    <div className="p-4 bg-slate-900/65 border border-slate-800/80 rounded-xl space-y-3">
                      <p className="text-xs text-slate-300 leading-relaxed">
                        To add media blocks, use the colored toolbar triggers located in the playlist panel header:
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3.5 py-1.5 bg-teal-500 text-slate-950 rounded text-[9px] font-black tracking-widest uppercase select-none shadow-sm shadow-teal-500/10">
                          + Audio/Video
                        </span>
                        <span className="px-3.5 py-1.5 bg-amber-500 text-slate-950 rounded text-[9px] font-black tracking-widest uppercase select-none shadow-sm shadow-amber-500/10">
                          + Playlist
                        </span>
                        <span className="px-3.5 py-1.5 bg-indigo-500 text-slate-950 rounded text-[9px] font-black tracking-widest uppercase select-none shadow-sm shadow-indigo-500/10">
                          + Silence
                        </span>
                      </div>
                      <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-1.5 leading-relaxed pl-1 pt-1">
                        <li><span className="text-teal-400 font-bold">+ Audio/Video</span>: Prompts file selection to load MP3/MP4 files directly into IndexedDB.</li>
                        <li><span className="text-amber-400 font-bold">+ Playlist</span>: Opens a list of other playlists to nest them seamlessly inside this loop.</li>
                        <li><span className="text-indigo-400 font-bold">+ Silence</span>: Places clean interval pauses between tracks (ideal for transition segments).</li>
                      </ul>
                    </div>
                  </div>

                  {/* List items parameters and card properties */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">3. Row Item Settings & Cards Layout</h4>
                    <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
                      
                      {/* Circle indicator badge reordering */}
                      <div className="flex items-start gap-4 pb-4 border-b border-slate-800/40">
                        <div className="w-10 h-10 rounded-full border-2 border-teal-500/80 text-teal-400 bg-teal-500/10 flex items-center justify-center font-bold text-sm tracking-tight shrink-0 select-none shadow-md">
                          01
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-teal-400 uppercase tracking-wider block">Numerical Reorder Badge</span>
                          <p className="text-[11px] text-slate-400 leading-normal">
                            **Reordering**: Try clicking directly inside this circular badge, entering a new row target index number, and clicking out of the circle boundary (or hitting Enter). The block moves to its new sequence row position automatically!
                          </p>
                        </div>
                      </div>

                      {/* Item actions */}
                      <div className="flex items-start gap-4 pb-4 border-b border-slate-800/40">
                        <div className="flex gap-1.5 shrink-0">
                          <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-400 rounded-md text-[9px] font-black uppercase tracking-wider select-none">Copy</span>
                          <span className="px-2.5 py-1 bg-red-950/20 border border-red-500/10 text-red-500 rounded-md text-[9px] font-black uppercase tracking-wider select-none">Delete</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Row Utility buttons</span>
                          <p className="text-[11px] text-slate-400 leading-normal">
                            Click **Copy** to instantly duplicate the media entry row, and **Delete** to permanently remove it from the database block.
                          </p>
                        </div>
                      </div>

                      {/* Loop setting plays */}
                      <div className="flex items-start gap-4 pb-4 border-b border-slate-800/40">
                        <div className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-teal-450 text-xs font-bold shrink-0 font-mono text-teal-400 select-none">
                          PLAYS: 1
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-teal-400 uppercase tracking-wider block">Plays Loop modifier</span>
                          <p className="text-[11px] text-slate-400 leading-normal">
                            Edit the value in the **PLAYS:** input field to repeat the specific file `N` times before sequence advances.
                          </p>
                        </div>
                      </div>

                      {/* Start and Stop Trims */}
                      <div className="flex items-start gap-4">
                        <div className="flex gap-1 items-center shrink-0 select-none">
                          <span className="px-2 py-1 bg-slate-800 text-[10px] text-slate-400 rounded-md font-mono border border-slate-700">0:00</span>
                          <span className="text-slate-600 font-mono text-xs">-</span>
                          <span className="px-2 py-1 bg-slate-800 text-[10px] text-slate-405 text-slate-300 rounded-md font-mono border border-slate-700">1:45</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Playback Trim (HH:MM:SS)</span>
                          <p className="text-[11px] text-slate-400 leading-normal">
                            To trim silence or unwanted intro blocks from your audios or videos, configure custom start and stop values here.
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Top-right commands saves */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">4. Synchronization Header Commands</h4>
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                      <p className="text-xs text-slate-300">
                        Manage save targets and exports inside your playlist heading action tray:
                      </p>
                      
                      <div className="flex flex-col gap-3 py-1">
                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-slate-400 text-[9px] font-black tracking-widest inline-flex items-center gap-1 uppercase select-none">
                            <Save size={11} /> Save Config
                          </span>
                          <span className="text-[11px] text-slate-400 leading-snug">
                            Click to sync current lists. The button updates to say <span className="text-teal-400 font-bold"><Check size={11} className="inline" /> Synchronized</span>.
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[9px] uppercase font-black text-slate-400/80 inline-flex items-center gap-1 select-none">
                            <Download size={11} className="text-orange-500" /> Export M3U
                          </span>
                          <span className="text-[11px] text-slate-400 leading-snug">
                            Generates and downloads a standard, system-compatible `.m3u` file.
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[9px] uppercase font-black text-slate-400/85 inline-flex items-center gap-1 select-none">
                            <VolumeX size={11} className="text-red-500" /> Purge Playlist
                          </span>
                          <span className="text-[11px] text-slate-400 leading-snug">
                            Permanently wipes and deletes the active playlist library from index caches.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PLAY MODE */}
              {activeTab === 'play' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <PlaySquare size={16} className="text-orange-500 stroke-[2.5]" />
                      <span>Play View: Dedicated Presentation Stage & Automation</span>
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed mt-1">
                      Monitor continuous tracks execution, jump items dynamically, and set up routine clock timers.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Visual Media Stage */}
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">1. The Media Stage Player</span>
                        <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                          <div className="w-12 h-12 rounded-full border-4 border-orange-500/10 flex items-center justify-center text-white shrink-0 select-none">
                            <span className="text-base font-mono font-black text-orange-500">01</span>
                          </div>
                          <div>
                            <span className="text-[9px] block font-black text-orange-500 tracking-wider">AUDIO • PLAYING</span>
                            <span className="text-xs text-white block truncate max-w-[120px] font-bold">Prayer Song.mp3</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        - **Progress ring indicator**: Large circular orange counter tracking the index executing on stage.
                        - **Missing File warning**: If tracks cannot load, tap **Skip Track →** on the red warning box.
                      </p>
                    </div>

                    {/* Progress Queue Sidebar */}
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">2. Interactive Queue Sidebar</span>
                        <div className="p-2.5 rounded-lg border border-slate-800 text-slate-300 bg-slate-950 text-[11px] font-bold w-fit select-none mb-2">
                          -- Choose Target --
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed text-slate-400">
                        - **Select program**: Use `-- Choose Target --` selector box on top to initialize a queue.
                        - **Timeline jump**: Tap any past or incoming items in the sidebar queue list to skip instantly to that index.
                      </p>
                    </div>
                  </div>

                  {/* Active deck transport and Mutes */}
                  <div className="space-y-3 block">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">3. Transport controls and Decibel deck</h4>
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 p-1 px-2 border border-slate-800 rounded text-slate-500 select-none shrink-0 text-xs">
                          <SkipBack size={13} />
                        </div>
                        <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-slate-950 shrink-0 select-none shadow-md shadow-orange-500/15">
                          <Play size={14} fill="currentColor" />
                        </div>
                        <div className="flex items-center gap-1.5 p-1 px-2 border border-slate-800 rounded text-slate-500 select-none shrink-0 text-xs">
                          <SkipForward size={13} />
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed flex-1 sm:max-w-md">
                        Control program play/pause cycles, jump linear indices, and drag the volume slider track (0 to 1 scaling) or tap the speaker icon to trigger physical mute checks.
                      </p>
                    </div>
                  </div>

                  {/* Sync Master Automation block */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">4. Integrated System Alarm (Sync Master)</h4>
                    <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl space-y-4">
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-1.5">
                        <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-1 w-max select-none shadow-inner shrink-0">
                          <span className="text-[8px] font-extrabold text-orange-500 uppercase tracking-widest block">Sync Master</span>
                          <span className="font-mono text-white text-lg font-black tracking-tight">
                            18:30<span className="text-orange-500 animate-pulse font-bold">:00</span>
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block"> Dynamic 24-hours clock</span>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            Continuous real-time system clock with high precision red pulsing seconds tracker (:00) monitoring match coordinates daily.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="flex items-center gap-2 shrink-0 select-none">
                          <span className="bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-lg text-[9px] font-extrabold text-orange-500 uppercase">
                            + New Task
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Scheduler Automation Form</span>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            Click **+ New Task** to load the trigger interface. Define target week-days, choose precision 24-Hour timelines (e.g. `12:45`), bind a target playlist sequence, and save it instantly. Play View loads automatically to execute alarms.
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>

          {/* Dialog footer info */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-[10px] md:text-[11px] text-slate-500 font-medium px-4 md:px-6 shrink-0 z-10">
            <span>© 2026 Music Sathi (म्युझिक साथी) • Audio Deck</span>
            <button 
              onClick={onClose} 
              className="text-orange-500 hover:text-orange-400 font-extrabold uppercase text-[10.5px] tracking-widest select-none"
            >
              Close Manual
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
