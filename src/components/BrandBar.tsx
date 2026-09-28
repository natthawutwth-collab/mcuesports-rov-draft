import React from 'react';
import { Users, Swords, History } from 'lucide-react';

interface BrandBarProps {
  status?: 'ready' | 'drafting' | 'complete';
  currentView: 'draft' | 'players' | 'history';
  onSelectView: (view: 'draft' | 'players' | 'history') => void;
  playersCount?: number;
  draftsCount?: number;
}

export const BrandBar: React.FC<BrandBarProps> = ({
  currentView,
  onSelectView,
  playersCount = 5,
  draftsCount = 0,
}) => {
  return (
    <header className="w-full flex items-center justify-between gap-1.5 sm:gap-3 px-2.5 sm:px-4 py-1.5 sm:py-2.5 bg-[#0a0c14]/95 border border-slate-700/70 rounded-xl sm:rounded-2xl shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
        <button
          onClick={() => onSelectView('draft')}
          className="flex items-center font-['Orbitron'] font-black text-sm sm:text-lg tracking-[1.5px] sm:tracking-[3px] text-white hover:opacity-90 transition-opacity cursor-pointer group"
        >
          <span className="text-[#38bdf8] drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]">MCU</span>
          <span className="text-[#f43f5e] ml-1 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]">ROV</span>
        </button>
        <div className="hidden sm:flex items-center gap-1.5 text-[10px] tracking-[2px] text-slate-300 font-bold border-l border-slate-700/80 pl-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24]"></span>
          <span>DRAFT ASSISTANT</span>
        </div>
      </div>

      {/* Navigation tabs */}
      <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 ml-auto">
        <button
          onClick={() => onSelectView('draft')}
          className={`px-2 sm:px-3 py-0.5 sm:py-1.5 text-[9.5px] sm:text-[11px] font-['Orbitron'] font-bold tracking-[0.5px] sm:tracking-[1.5px] rounded-lg transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 whitespace-nowrap border ${
            currentView === 'draft'
              ? 'text-white bg-[#0284c7]/30 border-[#38bdf8] shadow-[0_0_10px_rgba(56,189,248,0.35)]'
              : 'text-slate-300 hover:text-white hover:bg-white/5 border-transparent'
          }`}
        >
          <Swords size={11} className={currentView === 'draft' ? 'text-[#38bdf8]' : 'text-slate-400'} />
          <span>DRAFT</span>
        </button>

        <button
          onClick={() => onSelectView('history')}
          className={`px-2 sm:px-3 py-0.5 sm:py-1.5 text-[9.5px] sm:text-[11px] font-['Orbitron'] font-bold tracking-[0.5px] sm:tracking-[1.5px] rounded-lg transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 whitespace-nowrap border ${
            currentView === 'history'
              ? 'text-white bg-[#d97706]/30 border-[#fbbf24] shadow-[0_0_10px_rgba(251,191,36,0.35)]'
              : 'text-slate-300 hover:text-white hover:bg-white/5 border-transparent'
          }`}
        >
          <History size={11} className={currentView === 'history' ? 'text-[#fbbf24]' : 'text-slate-400'} />
          <span className="hidden sm:inline">DRAFT </span>
          <span>HISTORY</span>
          {draftsCount > 0 && (
            <span className="font-['Barlow_Condensed'] text-[8.5px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.2 rounded bg-amber-400/20 text-[#fbbf24] border border-amber-400/30">
              {draftsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectView('players')}
          className={`px-2 sm:px-3 py-0.5 sm:py-1.5 text-[9.5px] sm:text-[11px] font-['Orbitron'] font-bold tracking-[0.5px] sm:tracking-[1.5px] rounded-lg transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 whitespace-nowrap border ${
            currentView === 'players'
              ? 'text-white bg-[#e11d48]/30 border-[#f43f5e] shadow-[0_0_10px_rgba(244,63,94,0.35)]'
              : 'text-slate-300 hover:text-white hover:bg-white/5 border-transparent'
          }`}
        >
          <Users size={11} className={currentView === 'players' ? 'text-[#f43f5e]' : 'text-slate-400'} />
          <span>PLAYERS</span>
          <span className="font-['Barlow_Condensed'] text-[8.5px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.2 rounded bg-rose-400/20 text-[#f43f5e] border border-rose-400/30">
            {playersCount}
          </span>
        </button>
      </nav>
    </header>
  );
};
