import React, { useState } from 'react';
import { RotateCcw, Save, Undo2, Play, Users, MoreHorizontal, Settings, FileText, Database } from 'lucide-react';
import { TeamCategory } from '../types/player';

interface DraftHeaderProps {
  blueTeamName: string;
  setBlueTeamName: (name: string) => void;
  redTeamName: string;
  setRedTeamName: (name: string) => void;
  blueIsUs: boolean;
  setBlueIsUs: (isUs: boolean) => void;
  swapSides: () => void;
  phaseLabel: string;
  onUndo: () => void;
  canUndo: boolean;
  onReset: () => void;
  onStartNewDraft: () => void;
  onSaveMatchNote: () => void;
  onOpenSaveDraft?: () => void;
  onOpenSetupModal?: () => void;
  isDraftComplete?: boolean;
  matchMetadata?: {
    tournament: string;
    match: string;
    gameNumber: number;
    patch: string;
    teamCategory?: string;
  };
  draftActive: boolean;
  isSidePanelOpen?: boolean;
  sidePanelTab?: 'coach' | 'stats';
  onToggleCoachPanel?: () => void;
  onToggleStatsPanel?: () => void;
  onOpenDataModal?: () => void;
  selectedTeamCategory?: TeamCategory;
  onChangeTeamCategory?: (cat: TeamCategory) => void;
  playerCounts?: {
    all: number;
    male: number;
    female: number;
    mixed: number;
  };
  isRosterBarOpen?: boolean;
  onToggleRosterBar?: () => void;
}

export const DraftHeader: React.FC<DraftHeaderProps> = ({
  blueTeamName,
  setBlueTeamName,
  redTeamName,
  setRedTeamName,
  blueIsUs,
  setBlueIsUs,
  swapSides,
  phaseLabel,
  onUndo,
  canUndo,
  onReset,
  onStartNewDraft,
  onSaveMatchNote,
  onOpenSaveDraft,
  onOpenSetupModal,
  isDraftComplete,
  matchMetadata,
  draftActive,
  isSidePanelOpen = false,
  sidePanelTab = 'coach',
  onToggleCoachPanel,
  onToggleStatsPanel,
  onOpenDataModal,
  selectedTeamCategory = 'male',
  onChangeTeamCategory,
  playerCounts,
  isRosterBarOpen = true,
  onToggleRosterBar,
}) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  return (
    <div className="w-full flex flex-col gap-1.5 sm:gap-2.5 p-2 sm:p-3 bg-[#0a0c14]/95 border border-slate-700/70 rounded-xl sm:rounded-2xl shadow-xl backdrop-blur-md">
      {/* ROW 1: Team Matchup Card (Symmetrical, Compact, Esports Pro) */}
      <div className="w-full grid grid-cols-[1fr_auto_1fr] items-center gap-1 sm:gap-2">
        {/* Blue Team Box */}
        <div className="flex items-center gap-1 sm:gap-1.5 bg-[#09182b] p-1 sm:p-2 rounded-lg sm:rounded-xl border border-[#0284c7]/50 shadow-sm min-w-0">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-[#0284c7]/30 border border-[#38bdf8] flex items-center justify-center text-[10px] sm:text-xs select-none shadow-[0_0_8px_rgba(56,189,248,0.3)] flex-shrink-0">
            🔵
          </div>
          <input
            type="text"
            value={blueTeamName}
            onChange={(e) => setBlueTeamName(e.target.value)}
            placeholder="BLUE SIDE"
            className="flex-1 min-w-0 bg-black/50 border border-slate-700 text-white font-['Barlow_Condensed'] font-bold text-[11px] sm:text-[13px] tracking-wider px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]/40 transition-all placeholder-slate-400"
          />
          <button
            type="button"
            onClick={() => setBlueIsUs(!blueIsUs)}
            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg font-['Barlow_Condensed'] font-black text-[9px] sm:text-[11px] border cursor-pointer transition-all flex-shrink-0 ${
              blueIsUs
                ? 'bg-[#0284c7]/30 border-[#38bdf8] text-[#38bdf8] shadow-[0_0_8px_rgba(56,189,248,0.3)]'
                : 'bg-black/50 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="คลิกเพื่อสลับสถานะ ทีมเรา (US) / คู่แข่ง (OPP)"
          >
            {blueIsUs ? '★ US' : 'OPP'}
          </button>
        </div>

        {/* Center: Swap Button & Match Info */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 flex-shrink-0">
          <button
            onClick={swapSides}
            title="สลับฝั่ง Blue ↔ Red"
            className="group inline-flex items-center gap-1 bg-gradient-to-r from-[#0284c7]/20 via-purple-600/20 to-[#e11d48]/20 hover:from-[#0284c7]/35 hover:to-[#e11d48]/35 border border-slate-600 hover:border-white/50 text-white font-['Orbitron'] text-[9px] sm:text-[11px] font-black tracking-[0.5px] sm:tracking-[1.5px] px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm"
          >
            <span className="inline-block transition-transform duration-300 group-hover:rotate-180 text-xs sm:text-sm leading-none text-[#fbbf24]">
              ⇄
            </span>
            <span className="font-['Orbitron'] hidden xs:inline">SWAP</span>
          </button>

          {matchMetadata && (
            <button
              onClick={onOpenSetupModal}
              title="คลิกเพื่อแก้ไขข้อมูลแมตช์การแข่งขัน"
              className="flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-black/60 border border-slate-700 hover:border-[#fbbf24] text-[9.5px] sm:text-[11px] text-slate-200 hover:text-white transition-all cursor-pointer shadow-sm"
            >
              <span className="text-[#fbbf24] font-black">G{matchMetadata.gameNumber}</span>
              <span className="max-w-[70px] sm:max-w-[130px] truncate font-medium hidden sm:inline">{matchMetadata.match}</span>
            </button>
          )}
        </div>

        {/* Red Team Box */}
        <div className="flex items-center gap-1 sm:gap-1.5 bg-[#260914] p-1 sm:p-2 rounded-lg sm:rounded-xl border border-[#e11d48]/50 shadow-sm min-w-0">
          <button
            type="button"
            onClick={() => setBlueIsUs(!blueIsUs)}
            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg font-['Barlow_Condensed'] font-black text-[9px] sm:text-[11px] border cursor-pointer transition-all flex-shrink-0 ${
              !blueIsUs
                ? 'bg-[#e11d48]/30 border-[#f43f5e] text-[#f43f5e] shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                : 'bg-black/50 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="คลิกเพื่อสลับสถานะ ทีมเรา (US) / คู่แข่ง (OPP)"
          >
            {!blueIsUs ? '★ US' : 'OPP'}
          </button>
          <input
            type="text"
            value={redTeamName}
            onChange={(e) => setRedTeamName(e.target.value)}
            placeholder="RED SIDE"
            className="flex-1 min-w-0 bg-black/50 border border-slate-700 text-white font-['Barlow_Condensed'] font-bold text-[11px] sm:text-[13px] tracking-wider px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md outline-none text-right focus:border-[#f43f5e] focus:ring-1 focus:ring-[#f43f5e]/40 transition-all placeholder-slate-400"
          />
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-[#e11d48]/30 border border-[#f43f5e] flex items-center justify-center text-[10px] sm:text-xs select-none shadow-[0_0_8px_rgba(244,63,94,0.3)] flex-shrink-0">
            🔴
          </div>
        </div>
      </div>

      {/* ROW 2: Phase Badge & Action Buttons Cluster */}
      <div className="w-full flex items-center justify-between gap-1.5 sm:gap-2 pt-1 border-t border-slate-800/80">
        {/* Phase Indicator */}
        <div className="flex items-center gap-1.5 font-['Barlow_Condensed'] text-[10px] sm:text-[12px] text-slate-200 tracking-wider font-bold px-2 py-0.5 bg-black/50 border border-slate-800 rounded-md sm:rounded-lg max-w-full">
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#fbbf24] animate-pulse flex-shrink-0" />
          <span className="truncate">{phaseLabel}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 ml-auto">
          {/* Undo */}
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title="ย้อนกลับการกระทำล่าสุด"
            className="font-['Barlow_Condensed'] text-[9.5px] sm:text-[11px] font-extrabold tracking-wider uppercase bg-black/60 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-700 text-slate-200 hover:text-white px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg cursor-pointer transition-all flex items-center gap-1 shadow-sm"
          >
            <Undo2 size={11} />
            <span className="hidden xs:inline">Undo</span>
          </button>

          {/* Save Draft */}
          {onOpenSaveDraft && (
            <button
              type="button"
              onClick={onOpenSaveDraft}
              title="บันทึกผลดราฟต์ลงคลังประวัติ (Draft History)"
              className={`font-['Barlow_Condensed'] text-[9.5px] sm:text-[11px] font-black tracking-wider uppercase border px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg cursor-pointer transition-all flex items-center gap-1 shadow-sm ${
                isDraftComplete
                  ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse'
                  : 'bg-emerald-950/60 hover:bg-emerald-900/60 border-emerald-700/60 text-emerald-300 hover:text-white'
              }`}
            >
              <Save size={11} className="text-emerald-300" />
              <span>SAVE</span>
            </button>
          )}

          {/* Primary Action: New Draft / Restart */}
          <button
            type="button"
            onClick={onStartNewDraft}
            className={`font-['Barlow_Condensed'] text-[10px] sm:text-[11.5px] font-black tracking-wider uppercase px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg cursor-pointer transition-all flex items-center gap-1 shadow-md ${
              draftActive
                ? 'bg-[#e11d48] border border-[#f43f5e] text-white hover:bg-[#be123c]'
                : 'bg-emerald-500 hover:bg-emerald-400 border border-emerald-300 text-black font-black'
            }`}
          >
            <Play size={10} className={draftActive ? 'text-white' : 'fill-black text-black'} />
            <span>{draftActive ? 'Restart' : '▶ NEW'}</span>
          </button>

          {/* More Menu Dropdown for Secondary Actions */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMoreMenuOpen((prev) => !prev)}
              title="เมนูเพิ่มเติม (Match Notes, Data Layer, Setup, Reset)"
              className="p-1 rounded-md sm:rounded-lg bg-black/60 hover:bg-white/10 border border-slate-700 text-slate-300 hover:text-white cursor-pointer transition-all flex items-center justify-center"
            >
              <MoreHorizontal size={14} />
            </button>

            {isMoreMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsMoreMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#0a0c14] border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-1 text-[11px] font-['Barlow_Condensed'] font-bold">
                  {onOpenSetupModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        onOpenSetupModal();
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg text-left text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                    >
                      <Settings size={12} className="text-[#fbbf24]" />
                      <span>ตั้งค่าแมตช์ (Setup)</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      onSaveMatchNote();
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                  >
                    <FileText size={12} className="text-purple-400" />
                    <span>บันทึก Match Note</span>
                  </button>

                  {onOpenDataModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        onOpenDataModal();
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg text-left text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                    >
                      <Database size={12} className="text-sky-400" />
                      <span>Data Layer (JSON/CSV)</span>
                    </button>
                  )}

                  <div className="h-px bg-slate-800 my-0.5" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      onReset();
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left text-rose-300 hover:text-white hover:bg-rose-950/50 flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw size={12} />
                    <span>รีเซ็ตดราฟต์ (Reset)</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ROW 3: Team Division Selector & Roster Bar Toggle */}
      <div className="w-full flex items-center justify-between gap-1 sm:gap-2 pt-1 border-t border-slate-800/80">
        {/* Category Pills */}
        {onChangeTeamCategory && (
          <div className="flex items-center gap-0.5 sm:gap-1 bg-black/60 p-0.5 rounded-lg sm:rounded-xl border border-slate-800 shadow-inner overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => onChangeTeamCategory('male')}
              className={`font-['Barlow_Condensed'] text-[9.5px] sm:text-[11px] font-black tracking-wider px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg border transition-all cursor-pointer flex items-center gap-0.5 sm:gap-1 ${
                selectedTeamCategory === 'male'
                  ? 'bg-sky-600 border-sky-400 text-white shadow-[0_0_8px_rgba(56,189,248,0.4)]'
                  : 'border-transparent bg-transparent text-slate-400 hover:text-white'
              }`}
            >
              <span>👨</span>
              <span>ชาย</span>
              {playerCounts !== undefined && (
                <span className={`text-[8.5px] sm:text-[9.5px] px-1 py-0.1 rounded font-normal ${selectedTeamCategory === 'male' ? 'bg-black/30' : 'bg-slate-800 text-slate-400'}`}>
                  {playerCounts.male}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => onChangeTeamCategory('female')}
              className={`font-['Barlow_Condensed'] text-[9.5px] sm:text-[11px] font-black tracking-wider px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg border transition-all cursor-pointer flex items-center gap-0.5 sm:gap-1 ${
                selectedTeamCategory === 'female'
                  ? 'bg-rose-600 border-rose-400 text-white shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                  : 'border-transparent bg-transparent text-slate-400 hover:text-white'
              }`}
            >
              <span>👩</span>
              <span>หญิง</span>
              {playerCounts !== undefined && (
                <span className={`text-[8.5px] sm:text-[9.5px] px-1 py-0.1 rounded font-normal ${selectedTeamCategory === 'female' ? 'bg-black/30' : 'bg-slate-800 text-slate-400'}`}>
                  {playerCounts.female}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => onChangeTeamCategory('mixed')}
              className={`font-['Barlow_Condensed'] text-[9.5px] sm:text-[11px] font-black tracking-wider px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg border transition-all cursor-pointer flex items-center gap-0.5 sm:gap-1 ${
                selectedTeamCategory === 'mixed'
                  ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                  : 'border-transparent bg-transparent text-slate-400 hover:text-white'
              }`}
            >
              <span>👥</span>
              <span>ผสม</span>
              {playerCounts !== undefined && (
                <span className={`text-[8.5px] sm:text-[9.5px] px-1 py-0.1 rounded font-normal ${selectedTeamCategory === 'mixed' ? 'bg-black/30' : 'bg-slate-800 text-slate-400'}`}>
                  {playerCounts.mixed}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => onChangeTeamCategory('all')}
              className={`font-['Barlow_Condensed'] text-[9.5px] sm:text-[11px] font-black tracking-wider px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg border transition-all cursor-pointer flex items-center gap-0.5 sm:gap-1 ${
                selectedTeamCategory === 'all'
                  ? 'bg-white border-white text-black shadow-sm'
                  : 'border-transparent bg-transparent text-slate-400 hover:text-white'
              }`}
            >
              <span>🌐</span>
              <span>ทั้งหมด</span>
              {playerCounts !== undefined && (
                <span className={`text-[8.5px] sm:text-[9.5px] px-1 py-0.1 rounded font-normal ${selectedTeamCategory === 'all' ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {playerCounts.all}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Roster Bar Toggle Button */}
        {onToggleRosterBar && (
          <button
            type="button"
            onClick={onToggleRosterBar}
            title={isRosterBarOpen ? 'ซ่อนแถบข้อมูลนักแข่ง' : 'แสดงแถบข้อมูลนักแข่ง'}
            className={`font-['Barlow_Condensed'] text-[9.5px] sm:text-[11px] font-black tracking-wider px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg border transition-all cursor-pointer flex items-center gap-1 shadow-sm ml-auto ${
              isRosterBarOpen
                ? 'bg-[#fbbf24]/20 border-[#fbbf24] text-[#fbbf24] shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                : 'bg-black/60 border-slate-700 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Users size={11} className="text-[#fbbf24]" />
            <span>{isRosterBarOpen ? 'ซ่อนนักแข่ง' : 'แสดงนักแข่ง'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
