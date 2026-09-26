import React from 'react';
import { RotateCcw, Save, Undo2, Play } from 'lucide-react';

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
  };
  draftActive: boolean;
  isSidePanelOpen?: boolean;
  sidePanelTab?: 'coach' | 'stats';
  onToggleCoachPanel?: () => void;
  onToggleStatsPanel?: () => void;
  onOpenDataModal?: () => void;
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
}) => {
  return (
    <div className="w-full flex items-center gap-2.5 flex-wrap px-4 py-3 bg-[#0a0c14]/95 border border-slate-700/70 rounded-xl shadow-2xl backdrop-blur-md">
      {/* Title & Match Metadata Indicator */}
      <div className="flex items-center gap-2 mr-1">
        <div className="font-['Orbitron'] font-extrabold text-[14px] sm:text-[15px] tracking-[2.5px] text-white flex items-center gap-1.5">
          <span className="text-base">⚔️</span>
          <span>
            <span className="text-[#38bdf8]">DRAFT</span>{' '}
            <span className="text-[#f43f5e]">ARENA</span>
          </span>
        </div>
        {matchMetadata && (
          <button
            onClick={onOpenSetupModal}
            title="คลิกเพื่อแก้ไขข้อมูลแมตช์การแข่งขัน"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-md bg-black/60 border border-slate-700 hover:border-[#fbbf24] text-[11px] text-slate-200 hover:text-white transition-all cursor-pointer shadow-sm"
          >
            <span className="text-[#fbbf24] font-black">G{matchMetadata.gameNumber}:</span>
            <span className="max-w-[140px] truncate font-medium">{matchMetadata.match}</span>
            <span className="text-slate-400 text-[10px]">({matchMetadata.patch.split(' ')[0]})</span>
          </button>
        )}
      </div>

      {/* Blue Team Box - Clear Compartment */}
      <div className="flex items-center gap-1.5 bg-[#09182b] p-1.5 rounded-lg border border-[#0284c7]/50 shadow-sm">
        <div className="w-7 h-7 rounded-md bg-[#0284c7]/30 border border-[#38bdf8] flex items-center justify-center text-xs select-none shadow-[0_0_8px_rgba(56,189,248,0.3)]">
          🔵
        </div>
        <input
          type="text"
          value={blueTeamName}
          onChange={(e) => setBlueTeamName(e.target.value)}
          placeholder="BLUE SIDE"
          className="bg-black/50 border border-slate-700 text-white font-['Barlow_Condensed'] font-bold text-[13px] tracking-wider px-2.5 py-1 rounded-md outline-none w-28 sm:w-36 focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]/40 transition-all placeholder-slate-400"
        />
        <select
          value={blueIsUs ? 'us' : 'opp'}
          onChange={(e) => setBlueIsUs(e.target.value === 'us')}
          className={`border font-['Barlow_Condensed'] font-black text-[11px] px-2 py-1 rounded-md cursor-pointer outline-none transition-colors ${
            blueIsUs
              ? 'bg-[#0284c7]/30 border-[#38bdf8] text-[#38bdf8]'
              : 'bg-black/50 border-slate-700 text-slate-300'
          }`}
        >
          <option value="us" className="bg-[#0b1320] text-sky-300">= US (ทีมเรา)</option>
          <option value="opp" className="bg-[#0b1320] text-slate-300">= OPP (คู่แข่ง)</option>
        </select>
      </div>

      {/* Swap Sides Button */}
      <button
        onClick={swapSides}
        title="สลับฝั่ง Blue ↔ Red"
        className="group inline-flex items-center gap-1.5 bg-gradient-to-r from-[#0284c7]/20 via-purple-600/20 to-[#e11d48]/20 hover:from-[#0284c7]/30 hover:to-[#e11d48]/30 border border-slate-600 hover:border-white/50 text-white font-['Orbitron'] text-[10px] font-black tracking-[2px] px-3 py-1.5 rounded-lg cursor-pointer transition-all active:scale-95 shadow-md"
      >
        <span className="inline-block transition-transform duration-300 group-hover:rotate-180 text-sm leading-none text-[#fbbf24]">
          ⇄
        </span>
        <span className="hidden sm:inline">SWAP</span>
      </button>

      {/* Red Team Box - Clear Compartment */}
      <div className="flex items-center gap-1.5 bg-[#260914] p-1.5 rounded-lg border border-[#e11d48]/50 shadow-sm">
        <select
          value={blueIsUs ? 'opp' : 'us'}
          onChange={(e) => setBlueIsUs(e.target.value !== 'us')}
          className={`border font-['Barlow_Condensed'] font-black text-[11px] px-2 py-1 rounded-md cursor-pointer outline-none transition-colors ${
            !blueIsUs
              ? 'bg-[#e11d48]/30 border-[#f43f5e] text-[#f43f5e]'
              : 'bg-black/50 border-slate-700 text-slate-300'
          }`}
        >
          <option value="opp" className="bg-[#1c080f] text-slate-300">= OPP (คู่แข่ง)</option>
          <option value="us" className="bg-[#1c080f] text-rose-300">= US (ทีมเรา)</option>
        </select>
        <input
          type="text"
          value={redTeamName}
          onChange={(e) => setRedTeamName(e.target.value)}
          placeholder="RED SIDE"
          className="bg-black/50 border border-slate-700 text-white font-['Barlow_Condensed'] font-bold text-[13px] tracking-wider px-2.5 py-1 rounded-md outline-none w-28 sm:w-36 text-right focus:border-[#f43f5e] focus:ring-1 focus:ring-[#f43f5e]/40 transition-all placeholder-slate-400"
        />
        <div className="w-7 h-7 rounded-md bg-[#e11d48]/30 border border-[#f43f5e] flex items-center justify-center text-xs select-none shadow-[0_0_8px_rgba(244,63,94,0.3)]">
          🔴
        </div>
      </div>

      {/* Phase Label */}
      <div className="hidden xl:flex items-center gap-2 font-['Barlow_Condensed'] text-[12px] text-slate-200 tracking-[1.5px] uppercase font-bold mx-1 px-2.5 py-1 bg-black/40 border border-slate-800 rounded-lg">
        <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24] animate-pulse"></span>
        <span>{phaseLabel}</span>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1.5 ml-auto flex-wrap">
        {/* Coach Analysis Panel Toggle */}
        {onToggleCoachPanel && (
          <button
            onClick={onToggleCoachPanel}
            title="เปิด/ปิด Coach Analysis Panel"
            className={`font-['Barlow_Condensed'] text-[11px] font-black tracking-[1px] uppercase border px-3 py-1.5 rounded-lg cursor-pointer transition-all flex items-center gap-1.5 shadow-md ${
              isSidePanelOpen && sidePanelTab === 'coach'
                ? 'bg-[#fbbf24] border-[#fde047] text-black shadow-[0_0_16px_rgba(251,191,36,0.6)]'
                : 'bg-[#fbbf24]/15 hover:bg-[#fbbf24]/25 border-[#fbbf24]/50 text-[#fbbf24] hover:text-[#fde047]'
            }`}
          >
            <span>🎯</span>
            <span className="hidden sm:inline">COACH ANALYSIS</span>
            <span className="sm:hidden">COACH</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse hidden md:inline-block"></span>
          </button>
        )}

        {/* Stats & Matchups Panel Toggle */}
        {onToggleStatsPanel && (
          <button
            onClick={onToggleStatsPanel}
            title="เปิด/ปิด Side Panel สถิติ Hero และ Matchup"
            className={`font-['Barlow_Condensed'] text-[11px] font-extrabold tracking-[1px] uppercase border px-3 py-1.5 rounded-lg cursor-pointer transition-all flex items-center gap-1.5 shadow-md ${
              isSidePanelOpen && sidePanelTab === 'stats'
                ? 'bg-[#e11d48] border-[#f43f5e] text-white shadow-[0_0_14px_rgba(244,63,94,0.5)]'
                : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200 hover:text-white'
            }`}
          >
            <span>📊</span>
            <span className="hidden md:inline">RPL STATS</span>
            <span className="md:hidden">STATS</span>
          </button>
        )}

        {/* Data Layer Manager */}
        {onOpenDataModal && (
          <button
            onClick={onOpenDataModal}
            title="จัดการ Data Layer (JSON / CSV / API)"
            className="font-['Barlow_Condensed'] text-[11px] font-bold tracking-[1px] uppercase bg-black/60 hover:bg-white/10 border border-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg cursor-pointer transition-all flex items-center gap-1"
          >
            <span>📁</span>
            <span className="hidden xl:inline">DATA LAYER</span>
          </button>
        )}

        {/* Undo Button */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="ย้อนกลับการกระทำล่าสุด"
          className="font-['Barlow_Condensed'] text-[11px] font-extrabold tracking-[1px] uppercase bg-black/60 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-700 text-slate-200 hover:text-white px-2.5 py-1.5 rounded-lg cursor-pointer transition-all flex items-center gap-1 shadow-sm"
        >
          <Undo2 size={13} />
          <span>Undo</span>
        </button>

        {/* Save Draft to History */}
        {onOpenSaveDraft && (
          <button
            onClick={onOpenSaveDraft}
            title="บันทึกผลดราฟต์ลงคลังประวัติ (Draft History)"
            className={`font-['Barlow_Condensed'] text-[11px] font-black tracking-[1px] uppercase border px-3 py-1.5 rounded-lg cursor-pointer transition-all flex items-center gap-1.5 shadow-md ${
              isDraftComplete
                ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_16px_rgba(16,185,129,0.5)] animate-pulse'
                : 'bg-emerald-950/60 hover:bg-emerald-900/60 border-emerald-700/60 text-emerald-300 hover:text-white'
            }`}
          >
            <Save size={13} className="text-emerald-300" />
            <span className="hidden sm:inline">SAVE DRAFT</span>
            <span className="sm:hidden">SAVE</span>
          </button>
        )}

        {/* Save to Match Note */}
        <button
          onClick={onSaveMatchNote}
          title="บันทึกผลดราฟลง Match Notes ด้านล่าง"
          className="font-['Barlow_Condensed'] text-[11px] font-bold tracking-[1px] uppercase bg-black/60 hover:bg-purple-900/40 border border-slate-700 hover:border-purple-500/60 text-slate-200 hover:text-white px-2.5 py-1.5 rounded-lg cursor-pointer transition-all flex items-center gap-1 shadow-sm"
        >
          <Save size={13} className="text-[#fbbf24]" />
          <span className="hidden sm:inline">MATCH NOTE</span>
          <span className="sm:hidden">NOTE</span>
        </button>

        {/* Reset */}
        <button
          onClick={onReset}
          title="รีเซ็ตการดราฟทั้งหมด"
          className="font-['Barlow_Condensed'] text-[11px] font-bold tracking-[1px] uppercase bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 hover:border-rose-500 text-rose-300 hover:text-white px-2.5 py-1.5 rounded-lg cursor-pointer transition-all flex items-center gap-1 shadow-sm"
        >
          <RotateCcw size={13} />
          <span>Reset</span>
        </button>

        {/* New Draft */}
        <button
          onClick={onStartNewDraft}
          className={`font-['Barlow_Condensed'] text-[11.5px] font-black tracking-[1.2px] uppercase px-3.5 py-1.5 rounded-lg cursor-pointer transition-all flex items-center gap-1.5 shadow-lg ${
            draftActive
              ? 'bg-[#e11d48] border border-[#f43f5e] text-white hover:bg-[#be123c] shadow-[0_0_14px_rgba(244,63,94,0.4)]'
              : 'bg-emerald-500 hover:bg-emerald-400 border border-emerald-300 text-black font-black shadow-[0_0_16px_rgba(16,185,129,0.5)]'
          }`}
        >
          <Play size={13} className={draftActive ? 'text-white' : 'fill-black text-black'} />
          <span>{draftActive ? 'Restart Draft' : '▶ NEW DRAFT'}</span>
        </button>
      </div>
    </div>
  );
};
