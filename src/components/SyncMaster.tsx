import React from 'react';
import { Calendar, X } from 'lucide-react';
import { motion } from 'motion/react';
import { ScheduledPlay, Playlist } from '../types';

interface SyncMasterProps {
  currentTime: Date;
  schedules: ScheduledPlay[];
  playlists: Record<string, Playlist>;
  days: string[];
  showScheduleForm: boolean;
  setShowScheduleForm: (show: boolean) => void;
  removeSchedule: (id: string) => void;
  schedDay: number;
  setSchedDay: (day: number) => void;
  schedTime: string;
  setSchedTime: (time: string) => void;
  schedPId: string;
  setSchedPId: (id: string) => void;
  addSchedule: (task: { day: number; time: string; playlistId: string; active: boolean }) => void;
}

export const SyncMaster: React.FC<SyncMasterProps> = ({
  currentTime,
  schedules,
  playlists,
  days,
  showScheduleForm,
  setShowScheduleForm,
  removeSchedule,
  schedDay,
  setSchedDay,
  schedTime,
  setSchedTime,
  schedPId,
  setSchedPId,
  addSchedule
}) => {
  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-800/50 min-h-[160px]">
        <div className="p-6 md:w-56 bg-slate-950/20 flex flex-col items-center justify-center text-center relative group">
            <div className="absolute top-0 left-0 w-full h-1 bg-orange-500/50"></div>
            <span className="text-[9px] font-black text-orange-500 uppercase tracking-[.3em] mb-2 px-1">Sync Master</span>
            <div className="text-4xl font-black font-mono tracking-tighter text-white tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                {currentTime.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                <span className="text-orange-500 text-sm ml-1 opacity-80 animate-pulse">:{currentTime.getSeconds().toString().padStart(2, '0')}</span>
            </div>
        </div>

        <div className="flex-1 p-6 relative">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-teal-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Scheduler</span>
                </div>
                <button 
                    onClick={() => setShowScheduleForm(!showScheduleForm)}
                    className="bg-slate-950 px-3 py-1 border border-slate-800 rounded-lg text-[9px] font-black uppercase text-orange-500 hover:text-white transition-all focus:outline-none"
                    id="toggle-schedule-form"
                >
                    {showScheduleForm ? 'Hide' : '+ New Task'}
                </button>
            </div>

            {showScheduleForm && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-4 space-y-4 p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl relative z-20"
                >
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Day</span>
                            <select value={schedDay} onChange={(e) => setSchedDay(parseInt(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white">
                                {days.map((d, i) => <option key={d} value={i}>{d}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Time</span>
                            <input type="time" value={schedTime} onChange={(e) => setSchedTime(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white" />
                        </div>
                    </div>
                    <select value={schedPId} onChange={(e) => setSchedPId(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white">
                        <option value="">Target Sequence...</option>
                        {Object.values(playlists).map((p: Playlist) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                    </select>
                    <button 
                        onClick={() => { if (schedPId) { addSchedule({ day: schedDay, time: schedTime, playlistId: schedPId, active: true }); setShowScheduleForm(false); } }} 
                        className="w-full bg-teal-500 text-slate-950 rounded-lg py-2 text-[10px] font-black uppercase tracking-widest hover:bg-teal-400 transition-colors"
                        id="add-schedule-btn"
                    >
                        Save Operation
                    </button>
                </motion.div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                {schedules.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-2 bg-slate-950/40 rounded-xl border border-slate-800/30 group">
                        <div className="flex items-center gap-2">
                            <span className="text-[8px] font-black text-orange-500/80 uppercase">{days[s.day].slice(0,3)}</span>
                            <span className="text-xs font-mono font-bold text-white">{s.time}</span>
                            <span className="text-[9px] font-bold text-slate-600 uppercase truncate max-w-[80px]">{playlists[s.playlistId]?.name}</span>
                        </div>
                        <button 
                            onClick={() => removeSchedule(s.id)} 
                            className="text-slate-700 hover:text-red-500 transition-all p-1"
                            title="Delete Task"
                            id={`remove-schedule-${s.id}`}
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
                {schedules.length === 0 && <p className="col-span-full text-[9px] font-bold text-slate-700 text-center py-4 border border-dashed border-slate-800 rounded-xl">No Pending Automations</p>}
            </div>
        </div>
    </div>
  );
};
