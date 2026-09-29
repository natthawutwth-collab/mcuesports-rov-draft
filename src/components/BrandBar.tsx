import React from 'react';
import { Users, Swords, History, Gamepad2 } from 'lucide-react';

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
    <header className="w-full flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-5 py-2 sm:py-3 bg-white border border-[#F3D5E2] rounded-xl sm:rounded-2xl shadow-[0_2px_14px_rgba(233,30,99,0.06)]">
      {/* Brand Zone: MCU Esports Logo & Identity */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <button
          onClick={() => onSelectView('draft')}
          className="flex items-center gap-2.5 text-left cursor-pointer group transition-transform active:scale-98"
          title="MCU Esports RoV Draft Assistant"
        >
          {/* Official Pink Circular Badge (as in MCU reference image) */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#E91E63] via-[#D81B60] to-[#C2185B] text-white flex flex-col items-center justify-center shadow-[0_2px_8px_rgba(233,30,99,0.35)] flex-shrink-0 ring-2 ring-[#FCE4EC]">
            <Gamepad2 size={16} className="text-white" />
            <span className="text-[7.5px] font-black tracking-tighter leading-none mt-0.5">MCU</span>
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 font-['Prompt'] font-bold text-sm sm:text-base text-[#1F2937] leading-tight group-hover:text-[#E91E63] transition-colors">
              <span>MCU Esports</span>
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-[#FCE4EC] text-[#E91E63] border border-[#F8BBD0]">
                ROV
              </span>
            </div>
            <div className="text-[10px] sm:text-xs font-['Prompt'] text-[#64748B] font-medium leading-tight truncate">
              ชมรมมหาจุฬาอีสปอร์ต <span className="text-[#E91E63] font-semibold">• Draft Assistant</span>
            </div>
          </div>
        </button>
      </div>

      {/* Navigation tabs: MCU Light Theme with soft pink active states */}
      <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5 ml-auto">
        {/* Draft Tab */}
        <button
          onClick={() => onSelectView('draft')}
          className={`px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-[13px] font-['Prompt'] font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
            currentView === 'draft'
              ? 'bg-[#FCE4EC] text-[#E91E63] border-[#F48FB1] shadow-sm font-bold ring-1 ring-[#FCE4EC]'
              : 'text-[#64748B] hover:text-[#E91E63] hover:bg-[#FFF0F5] border-transparent'
          }`}
        >
          <Swords size={14} className={currentView === 'draft' ? 'text-[#E91E63]' : 'text-[#94A3B8]'} />
          <span>ดราฟต์</span>
          <span className="hidden sm:inline text-[10px] opacity-75 font-normal">(Draft)</span>
        </button>

        {/* Draft History Tab */}
        <button
          onClick={() => onSelectView('history')}
          className={`px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-[13px] font-['Prompt'] font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
            currentView === 'history'
              ? 'bg-[#FCE4EC] text-[#E91E63] border-[#F48FB1] shadow-sm font-bold ring-1 ring-[#FCE4EC]'
              : 'text-[#64748B] hover:text-[#E91E63] hover:bg-[#FFF0F5] border-transparent'
          }`}
        >
          <History size={14} className={currentView === 'history' ? 'text-[#E91E63]' : 'text-[#94A3B8]'} />
          <span>ประวัติดราฟต์</span>
          {draftsCount > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${
              currentView === 'history'
                ? 'bg-white text-[#E91E63] border-[#F48FB1]'
                : 'bg-[#FFF0F5] text-[#E91E63] border-[#F3D5E2]'
            }`}>
              {draftsCount}
            </span>
          )}
        </button>

        {/* Players Tab */}
        <button
          onClick={() => onSelectView('players')}
          className={`px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-[13px] font-['Prompt'] font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
            currentView === 'players'
              ? 'bg-[#FCE4EC] text-[#E91E63] border-[#F48FB1] shadow-sm font-bold ring-1 ring-[#FCE4EC]'
              : 'text-[#64748B] hover:text-[#E91E63] hover:bg-[#FFF0F5] border-transparent'
          }`}
        >
          <Users size={14} className={currentView === 'players' ? 'text-[#E91E63]' : 'text-[#94A3B8]'} />
          <span>นักกีฬา</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${
            currentView === 'players'
              ? 'bg-white text-[#E91E63] border-[#F48FB1]'
              : 'bg-[#FFF0F5] text-[#E91E63] border-[#F3D5E2]'
          }`}>
            {playersCount}
          </span>
        </button>
      </nav>
    </header>
  );
};
