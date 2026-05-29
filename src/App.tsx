/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TangoProvider, useTango } from './context/TangoContext';
import { DesignView } from './components/DesignView';
import { PlayView } from './components/PlayView';
import { Layout, Settings, PlaySquare, Edit3, Monitor, CheckCircle2, X, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserManualModal } from './components/UserManualModal';

const TangoApp = () => {
  const { activeMode, setMode, isLoaded, schedules, playlists } = useTango();
  const [notification, setNotification] = useState<string | null>(null);
  const [isManualOpen, setIsManualOpen] = useState(false);

  // Background Schedule Checker
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentDay = now.getDay();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      schedules.forEach(s => {
        if (s.active && s.day === currentDay && s.time === currentTime) {
          if (activeMode !== 'play') {
            setMode('play');
            setNotification(`Scheduled playing: ${playlists[s.playlistId]?.name}`);
          }
        }
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [schedules, activeMode, setMode, playlists]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#151619] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="mono-label">Initializing Hardware...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden text-sm bg-slate-950">
      {/* Top Navbar */}
      <nav className="h-16 px-6 bg-slate-900 flex items-center justify-between border-b border-slate-800 shadow-xl z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-500/20">
            M
          </div>
          <span className="text-white font-bold tracking-tight text-base md:text-xl text-nowrap flex flex-col md:flex-row md:items-center md:gap-2">
            <span>Music Sathi</span>
            <span className="text-orange-500 text-xs md:text-base font-medium hidden xs:inline">म्युझिक साथी</span>
          </span>
        </div>

        <div className="flex bg-slate-800 p-1 rounded-xl shadow-inner border border-slate-700">
          <button 
            onClick={() => setMode('play')}
            className={`px-3 md:px-6 py-2 rounded-lg flex items-center gap-2 transition-all uppercase text-xs font-bold ${
              activeMode === 'play' 
                ? 'bg-orange-500 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PlaySquare size={16} /> 
            <span>Play</span>
          </button>
          <button 
            onClick={() => setMode('design')}
            className={`px-3 md:px-6 py-2 rounded-lg flex items-center gap-2 transition-all uppercase text-xs font-bold ${
              activeMode === 'design' 
                ? 'bg-orange-500 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Edit3 size={16} /> 
            <span>Design</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
           <div className="hidden md:flex flex-col items-end">
              <span className="text-slate-500 mono-label text-[9px] uppercase tracking-widest">System Ready</span>
              <div className="flex gap-1.5 mt-1">
                 {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}></div>)}
              </div>
           </div>
           <button 
             onClick={() => setIsManualOpen(true)}
             className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all text-xs font-bold"
             title="Open User Manual"
           >
             <BookOpen size={14} className="text-orange-500" />
             <span className="hidden sm:inline">Manual</span>
           </button>
           <Settings size={20} className="text-slate-400 cursor-pointer hover:rotate-90 hover:text-white transition-all duration-500" />
        </div>
      </nav>

      {/* User Guide Interactive Modal */}
      <UserManualModal isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} />

      {/* Persistent Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 px-6 py-3 bg-accent text-white rounded-full shadow-2xl z-[100] flex items-center gap-3"
          >
            <CheckCircle2 size={18} />
            <span className="font-medium">{notification}</span>
            <button onClick={() => setNotification(null)} className="ml-4 opacity-70 hover:opacity-100"><X size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Sandbox */}
      <main className="flex-1 p-4 md:p-8 overflow-hidden">
        <motion.div 
          key={activeMode}
          initial={{ opacity: 0, x: activeMode === 'design' ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="h-full"
        >
          {activeMode === 'design' ? <DesignView /> : <PlayView />}
        </motion.div>
      </main>

      {/* Mobile Mode Warning */}
      <div className="md:hidden p-2 text-center text-[10px] mono-label tracking-wide bg-accent text-white">
        Hardware Mode: Mobile Optimized Interface
      </div>
    </div>
  );
};

export default function App() {
  return (
    <TangoProvider>
      <TangoApp />
    </TangoProvider>
  );
}
