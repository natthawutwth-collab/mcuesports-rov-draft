import React from 'react';
import { Users, Swords, History } from 'lucide-react';

interface BrandBarProps {
  status: 'ready' | 'drafting' | 'complete';
  currentView: 'draft' | 'players' | 'history';
  onSelectView: (view: 'draft' | 'players' | 'history') => void;
  playersCount?: number;
  draftsCount?: number;
}

export const BrandBar: React.FC<BrandBarProps> = ({
  status,
  currentView,
  onSelectView,
  playersCount = 5,
  draftsCount = 0,
}) => {
  return (
    <header className="w-full flex items-center justify-between gap-3 px-4 py-2.5 bg-[rgba(20,20,26,0.7)] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-lg backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={() => onSelectView('draft')}
          className="flex items-center font-['Orbitron'] font-bold text-lg tracking-[3px] text-[#e6f1ff] hover:opacity-90 transition-opacity cursor-pointer"
        >
          MCU <span className="text-[#a82844] ml-1">ROV</span>
        </button>
        <div className="hidden sm:block text-[10px] tracking-[2.5px] text-[#a0a0a8] font-bold border-l border-[rgba(255,255,255,0.08)] pl-3">
          DRAFT ASSISTANT
        </div>
      </div>

      {/* Navigation tabs */}
      <nav className="flex items-center gap-1.5 sm:border-l sm:border-[rgba(255,255,255,0.08)] sm:pl-3 sm:ml-2 overflow-x-auto py-0.5">
        <button
          onClick={() => onSelectView('draft')}
          className={`px-3 py-1.5 text-[11px] font-['Orbitron'] font-bold tracking-[1.5px] rounded transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            currentView === 'draft'
              ? 'text-white bg-[#a82844]/25 border border-[#a82844]/60 shadow-[0_0_12px_rgba(168,40,68,0.3)]'
              : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Swords size={13} className={currentView === 'draft' ? 'text-[#ff7b95]' : ''} />
          <span>DRAFT</span>
        </button>

        <button
          onClick={() => onSelectView('history')}
          className={`px-3 py-1.5 text-[11px] font-['Orbitron'] font-bold tracking-[1.5px] rounded transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            currentView === 'history'
              ? 'text-white bg-[#d4a857]/25 border border-[#d4a857]/60 shadow-[0_0_12px_rgba(212,168,87,0.3)]'
              : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <History size={13} className={currentView === 'history' ? 'text-[#ffdd80]' : ''} />
          <span>DRAFT HISTORY</span>
          {draftsCount > 0 && (
            <span className="font-['Barlow_Condensed'] text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-white/80">
              {draftsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectView('players')}
          className={`px-3 py-1.5 text-[11px] font-['Orbitron'] font-bold tracking-[1.5px] rounded transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            currentView === 'players'
              ? 'text-white bg-[#a82844]/25 border border-[#a82844]/60 shadow-[0_0_12px_rgba(168,40,68,0.3)]'
              : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Users size={13} className={currentView === 'players' ? 'text-[#ff7b95]' : ''} />
          <span>PLAYERS</span>
          <span className="font-['Barlow_Condensed'] text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-white/80">
            {playersCount}
          </span>
        </button>
      </nav>

      {/* Right status badge */}
      <div className="flex items-center gap-2">
        <div className="font-['Orbitron'] text-[10px] tracking-[2px] font-bold px-3 py-1 rounded bg-white/5 border border-white/10 text-[#a0a0a8] flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              status === 'drafting'
                ? 'bg-[#d4a857] animate-pulse'
                : status === 'complete'
                ? 'bg-emerald-400'
                : 'bg-white/40'
            }`}
          />
          <span className="hidden sm:inline">
            {status === 'drafting' ? 'DRAFTING' : status === 'complete' ? 'COMPLETE' : 'READY'}
          </span>
        </div>
      </div>
    </header>
  );
};
