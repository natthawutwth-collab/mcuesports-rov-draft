import React from 'react';
import { Users, Swords, History, Settings, Gamepad2 } from 'lucide-react';

export type AppView = 
  | 'draft' 
  | 'players' 
  | 'history' 
  | 'settings' 
  | 'dashboard' 
  | 'scouting' 
  | 'series_prep' 
  | 'simulator' 
  | 'scrim' 
  | 'calibration' 
  | 'match_prep';

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
  const isSettingsOrAdvancedActive = 
    currentView === 'settings' || 
    ['dashboard', 'scouting', 'series_prep', 'simulator', 'scrim', 'calibration', 'match_prep'].includes(currentView);

  return (
    <header className="w-full flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-[#F3D5E2] rounded-xl sm:rounded-2xl shadow-xs">
      {/* Brand Zone: MCU Esports Logo & Identity (Clicks to Primary Draft Arena) */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <button
          onClick={() => onSelectView('draft')}
          className="flex items-center gap-2.5 text-left cursor-pointer group transition-transform active:scale-98"
          title="MCU Esports RoV Draft Assistant - คลิกเพื่อไปหน้าดราฟต์"
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

      {/* 4 Core Renovated Navigation Tabs (Desktop & Tablet Optimized) */}
      <nav className="flex items-center gap-1 sm:gap-1.5 py-0.5">
        {/* 1. หน้าดราฟ (Draft Arena - Primary View) */}
        <button
          onClick={() => onSelectView('draft')}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 text-[11.5px] sm:text-xs font-['Prompt'] font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap border shadow-2xs ${
            currentView === 'draft'
              ? 'bg-[#E91E63] text-white border-[#C2185B] shadow-xs'
              : 'bg-white text-slate-700 hover:text-[#E91E63] hover:bg-[#FFF0F5] border-[#F3D5E2]'
          }`}
          title="ห้อง Ban/Pick สด"
        >
          <Swords size={14} className={currentView === 'draft' ? 'text-white' : 'text-[#E91E63]'} />
          <span>หน้าดราฟ</span>
          {status === 'drafting' && (
            <span className="w-2 h-2 rounded-full bg-white animate-ping" title="กำลังดราฟต์อยู่" />
          )}
        </button>

        {/* 2. จัดการทีม (Team Management) */}
        <button
          onClick={() => onSelectView('players')}
          className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-['Prompt'] font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
            currentView === 'players'
              ? 'bg-[#FCE4EC] text-[#E91E63] border-[#F48FB1] shadow-2xs font-bold'
              : 'text-slate-600 hover:text-[#E91E63] hover:bg-[#FFF0F5] border-transparent'
          }`}
          title="จัดการรายชื่อนักแข่งและ Hero Pool"
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

        {/* 3. สรุปดราฟ (Draft Summary & History) */}
        <button
          onClick={() => onSelectView('history')}
          className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-['Prompt'] font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
            currentView === 'history'
              ? 'bg-[#FCE4EC] text-[#E91E63] border-[#F48FB1] shadow-2xs font-bold'
              : 'text-slate-600 hover:text-[#E91E63] hover:bg-[#FFF0F5] border-transparent'
          }`}
          title="ประวัติการดราฟต์และสรุปผลหลังเกม"
        >
          <History size={14} className={currentView === 'history' ? 'text-[#E91E63]' : 'text-slate-400'} />
          <span>สรุปดราฟ</span>
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

        {/* 4. ตั้งค่า (Settings & Advanced Coach Tools) */}
        <button
          onClick={() => onSelectView('settings')}
          className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-['Prompt'] font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
            isSettingsOrAdvancedActive
              ? 'bg-[#FCE4EC] text-[#E91E63] border-[#F48FB1] shadow-2xs font-bold'
              : 'text-slate-600 hover:text-[#E91E63] hover:bg-[#FFF0F5] border-transparent'
          }`}
          title="ตั้งค่าระบบ, ฐานข้อมูล และเครื่องมือโค้ช"
        >
          <Settings size={14} className={isSettingsOrAdvancedActive ? 'text-[#E91E63]' : 'text-slate-400'} />
          <span>ตั้งค่า</span>
          {!isCloudConnected && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="ออฟไลน์" />
          )}
        </button>
      </nav>
    </header>
  );
};
