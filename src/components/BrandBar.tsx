import React from 'react';
import { Users, Swords, History, LayoutDashboard, Gamepad2, Search, Trophy, Cpu, BarChart3, Scale, FileText } from 'lucide-react';

export type AppView = 'dashboard' | 'draft' | 'scouting' | 'series_prep' | 'simulator' | 'scrim' | 'calibration' | 'match_prep' | 'players' | 'history';

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

      {/* Streamlined Navigation Tabs: Draft, Players, History, plus Tools Dropdown */}
      <nav className="flex items-center gap-1 sm:gap-1.5 py-0.5">
        {/* 1. Draft Arena Tab (Primary Match Day View) */}
        <button
          onClick={() => onSelectView('draft')}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 text-[11.5px] sm:text-xs font-['Prompt'] font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap border shadow-2xs ${
            currentView === 'draft'
              ? 'bg-[#E91E63] text-white border-[#C2185B] shadow-xs'
              : 'bg-white text-slate-700 hover:text-[#E91E63] hover:bg-[#FFF0F5] border-[#F3D5E2]'
          }`}
        >
          <Swords size={14} className={currentView === 'draft' ? 'text-white' : 'text-[#E91E63]'} />
          <span>ห้องดราฟต์</span>
          {status === 'drafting' && (
            <span className="w-2 h-2 rounded-full bg-white animate-ping" title="กำลังดราฟต์อยู่" />
          )}
        </button>

        {/* 2. Players Roster Tab */}
        <button
          onClick={() => onSelectView('players')}
          className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-['Prompt'] font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
            currentView === 'players'
              ? 'bg-[#FCE4EC] text-[#E91E63] border-[#F48FB1] shadow-2xs font-bold'
              : 'text-slate-600 hover:text-[#E91E63] hover:bg-[#FFF0F5] border-transparent'
          }`}
        >
          <Users size={14} className={currentView === 'players' ? 'text-[#E91E63]' : 'text-slate-400'} />
          <span>จัดการทีม</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${
            currentView === 'players'
              ? 'bg-white text-[#E91E63] border-[#F48FB1]'
              : 'bg-[#FFF0F5] text-[#E91E63] border-[#F3D5E2]'
          }`}>
            {playersCount}
          </span>
        </button>

        {/* 3. Draft History Tab */}
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

        {/* 4. Compact Tools Dropdown Menu (Preserving all background preparation modules without cluttering) */}
        <div className="relative group/tools">
          <button
            type="button"
            className={`px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-['Prompt'] font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap border ${
              ['dashboard', 'scouting', 'series_prep', 'simulator', 'scrim', 'calibration', 'match_prep'].includes(currentView)
                ? 'bg-[#FCE4EC] text-[#E91E63] border-[#F48FB1] font-bold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border-slate-200'
            }`}
          >
            <span>⚙️ เครื่องมือเตรียมทีม</span>
            <span className="text-[9px] opacity-60">▼</span>
          </button>

          {/* Dropdown Panel */}
          <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-[#F3D5E2] rounded-xl shadow-xl py-1.5 z-50 hidden group-hover/tools:block animate-in fade-in duration-150">
            <div className="px-3 py-1 text-[9.5px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
              โมดูลวิเคราะห์และเตรียมทีม
            </div>

            <button
              onClick={() => onSelectView('dashboard')}
              className={`w-full px-3 py-1.5 text-left text-[11px] font-['Prompt'] flex items-center gap-2 hover:bg-[#FFF0F5] transition-colors cursor-pointer ${
                currentView === 'dashboard' ? 'text-[#E91E63] font-bold bg-[#FFF0F5]' : 'text-slate-700'
              }`}
            >
              <LayoutDashboard size={13} className="text-[#E91E63]" />
              <span>แดชบอร์ดภาพรวม (Overview)</span>
            </button>

            <button
              onClick={() => onSelectView('match_prep')}
              className={`w-full px-3 py-1.5 text-left text-[11px] font-['Prompt'] flex items-center gap-2 hover:bg-[#FFF0F5] transition-colors cursor-pointer ${
                currentView === 'match_prep' ? 'text-[#E91E63] font-bold bg-[#FFF0F5]' : 'text-slate-700'
              }`}
            >
              <FileText size={13} className="text-[#E91E63]" />
              <span>รายงานเตรียมแข่ง (Match Prep)</span>
            </button>

            <button
              onClick={() => onSelectView('series_prep')}
              className={`w-full px-3 py-1.5 text-left text-[11px] font-['Prompt'] flex items-center gap-2 hover:bg-[#FFF0F5] transition-colors cursor-pointer ${
                currentView === 'series_prep' ? 'text-[#E91E63] font-bold bg-[#FFF0F5]' : 'text-slate-700'
              }`}
            >
              <Trophy size={13} className="text-[#E91E63]" />
              <span>แผนซีรีส์ (BO3 / BO5 / BO7)</span>
            </button>

            <button
              onClick={() => onSelectView('scouting')}
              className={`w-full px-3 py-1.5 text-left text-[11px] font-['Prompt'] flex items-center gap-2 hover:bg-[#FFF0F5] transition-colors cursor-pointer ${
                currentView === 'scouting' ? 'text-[#E91E63] font-bold bg-[#FFF0F5]' : 'text-slate-700'
              }`}
            >
              <Search size={13} className="text-[#E91E63]" />
              <span>สเกาต์คู่แข่ง (Scouting)</span>
            </button>

            <button
              onClick={() => onSelectView('simulator')}
              className={`w-full px-3 py-1.5 text-left text-[11px] font-['Prompt'] flex items-center gap-2 hover:bg-[#FFF0F5] transition-colors cursor-pointer ${
                currentView === 'simulator' ? 'text-[#E91E63] font-bold bg-[#FFF0F5]' : 'text-slate-700'
              }`}
            >
              <Cpu size={13} className="text-[#E91E63]" />
              <span>ดราฟต์ซิมูเลเตอร์ (Simulator)</span>
            </button>

            <button
              onClick={() => onSelectView('scrim')}
              className={`w-full px-3 py-1.5 text-left text-[11px] font-['Prompt'] flex items-center gap-2 hover:bg-[#FFF0F5] transition-colors cursor-pointer ${
                currentView === 'scrim' ? 'text-[#E91E63] font-bold bg-[#FFF0F5]' : 'text-slate-700'
              }`}
            >
              <BarChart3 size={13} className="text-[#E91E63]" />
              <span>ผลงานทีม Scrim (Analytics)</span>
            </button>

            <button
              onClick={() => onSelectView('calibration')}
              className={`w-full px-3 py-1.5 text-left text-[11px] font-['Prompt'] flex items-center gap-2 hover:bg-[#FFF0F5] transition-colors cursor-pointer ${
                currentView === 'calibration' ? 'text-[#E91E63] font-bold bg-[#FFF0F5]' : 'text-slate-700'
              }`}
            >
              <Scale size={13} className="text-[#E91E63]" />
              <span>รีวิวและปรับสูตร (Calibration)</span>
            </button>
          </div>
        </div>
      </nav>

    </header>
  );
};
