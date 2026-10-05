import React from 'react';
import { Users, Swords, History, LayoutDashboard, Gamepad2, Zap } from 'lucide-react';

export type AppView = 'dashboard' | 'draft' | 'players' | 'history';

interface BrandBarProps {
  status?: 'ready' | 'drafting' | 'complete';
  currentView: AppView;
  onSelectView: (view: AppView) => void;
  playersCount?: number;
  draftsCount?: number;
  isCloudConnected?: boolean;
}

export const BrandBar: React.FC<BrandBarProps> = ({
  status = 'ready',
  currentView,
  onSelectView,
  playersCount = 5,
  draftsCount = 0,
  isCloudConnected = true,
}) => {
  return (
    <header className="w-full flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-[#F3D5E2] rounded-xl sm:rounded-2xl shadow-xs">
      {/* Brand Zone: MCU Esports Logo & Identity */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <button
          onClick={() => onSelectView('dashboard')}
          className="flex items-center gap-2.5 text-left cursor-pointer group transition-transform active:scale-98"
          title="หน้าหลัก MCU Esports"
        >
          {/* Official Pink Circular Badge */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#E91E63] via-[#D81B60] to-[#C2185B] text-white flex flex-col items-center justify-center shadow-md shadow-[#E91E63]/25 flex-shrink-0 ring-2 ring-[#FCE4EC]">
            <Gamepad2 size={16} className="text-white" />
            <span className="text-[7.5px] font-black tracking-tighter leading-none mt-0.5">MCU</span>
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 font-['Prompt'] font-bold text-sm sm:text-base text-slate-900 leading-tight group-hover:text-[#E91E63] transition-colors">
              <span>MCU Esports</span>
              <span className="text-[9.5px] font-black px-1.5 py-0.2 rounded-full bg-[#FCE4EC] text-[#E91E63] border border-[#F8BBD0]">
                ROV
              </span>
            </div>
            <div className="text-[10px] sm:text-xs font-['Prompt'] text-slate-500 font-medium leading-tight truncate">
              ชมรมมหาจุฬาอีสปอร์ต <span className="text-[#E91E63] font-semibold">• Draft Assistant</span>
            </div>
          </div>
        </button>
      </div>

      {/* Main Navigation Tabs */}
      <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {/* 1. Dashboard Tab */}
        <button
          onClick={() => onSelectView('dashboard')}
          className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-['Prompt'] font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
            currentView === 'dashboard'
              ? 'bg-[#FCE4EC] text-[#E91E63] border-[#F48FB1] shadow-2xs font-bold'
              : 'text-slate-600 hover:text-[#E91E63] hover:bg-[#FFF0F5] border-transparent'
          }`}
        >
          <LayoutDashboard size={14} className={currentView === 'dashboard' ? 'text-[#E91E63]' : 'text-slate-400'} />
          <span>แดชบอร์ด</span>
          <span className="hidden md:inline text-[10px] opacity-75 font-normal">(Overview)</span>
        </button>

        {/* 2. Draft Arena Tab */}
        <button
          onClick={() => onSelectView('draft')}
          className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-['Prompt'] font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
            currentView === 'draft'
              ? 'bg-[#FCE4EC] text-[#E91E63] border-[#F48FB1] shadow-2xs font-bold'
              : 'text-slate-600 hover:text-[#E91E63] hover:bg-[#FFF0F5] border-transparent'
          }`}
        >
          <Swords size={14} className={currentView === 'draft' ? 'text-[#E91E63]' : 'text-slate-400'} />
          <span>ห้องดราฟต์</span>
          {status === 'drafting' && (
            <span className="w-2 h-2 rounded-full bg-[#E91E63] animate-ping" title="กำลังดราฟต์อยู่" />
          )}
        </button>

        {/* 3. Players Roster Tab */}
        <button
          onClick={() => onSelectView('players')}
          className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-['Prompt'] font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
            currentView === 'players'
              ? 'bg-[#FCE4EC] text-[#E91E63] border-[#F48FB1] shadow-2xs font-bold'
              : 'text-slate-600 hover:text-[#E91E63] hover:bg-[#FFF0F5] border-transparent'
          }`}
        >
          <Users size={14} className={currentView === 'players' ? 'text-[#E91E63]' : 'text-slate-400'} />
          <span>นักกีฬา</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${
            currentView === 'players'
              ? 'bg-white text-[#E91E63] border-[#F48FB1]'
              : 'bg-[#FFF0F5] text-[#E91E63] border-[#F3D5E2]'
          }`}>
            {playersCount}
          </span>
        </button>

        {/* 4. Draft History Tab */}
        <button
          onClick={() => onSelectView('history')}
          className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-['Prompt'] font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
            currentView === 'history'
              ? 'bg-[#FCE4EC] text-[#E91E63] border-[#F48FB1] shadow-2xs font-bold'
              : 'text-slate-600 hover:text-[#E91E63] hover:bg-[#FFF0F5] border-transparent'
          }`}
        >
          <History size={14} className={currentView === 'history' ? 'text-[#E91E63]' : 'text-slate-400'} />
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
      </nav>

      {/* Cloud Status indicator (right corner) */}
      <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-[10.5px] font-['Prompt'] text-slate-500">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-semibold text-slate-700">Supabase Cloud</span>
      </div>
    </header>
  );
};
