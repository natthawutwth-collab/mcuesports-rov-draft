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
    <div className="w-full flex items-center gap-2.5 flex-wrap px-4 py-3 bg-[rgba(20,20,26,0.7)] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-lg backdrop-blur-md">
      {/* Title & Match Metadata Indicator */}
      <div className="flex items-center gap-2 mr-1">
        <div className="font-['Orbitron'] font-bold text-[14px] sm:text-[15px] tracking-[2.5px] text-[#e6f1ff] flex items-center gap-1.5">
          <span>🎯</span>
          <span>
            <span className="text-[#a82844]">DRAFT</span> SIMULATOR
          </span>
        </div>
        {matchMetadata && (
          <button
            onClick={onOpenSetupModal}
            title="คลิกเพื่อแก้ไขข้อมูลแมตช์การแข่งขัน"
            className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-black/40 border border-white/10 hover:border-[#d4a857]/60 text-[10.5px] text-white/80 hover:text-white transition-all cursor-pointer"
          >
            <span className="text-[#d4a857] font-bold">G{matchMetadata.gameNumber}:</span>
            <span className="max-w-[140px] truncate">{matchMetadata.match}</span>
            <span className="text-white/40 text-[9.5px]">({matchMetadata.patch.split(' ')[0]})</span>
          </button>
        )}
      </div>

      {/* Blue Team Box */}
      <div className="flex items-center gap-1.5 bg-black/20 p-1 rounded-lg border border-white/5">
        <div className="w-7 h-7 rounded-md bg-[rgba(20,20,26,0.65)] border border-sky-400/40 flex items-center justify-center text-xs select-none">
          🔵
        </div>
        <input
          type="text"
          value={blueTeamName}
          onChange={(e) => setBlueTeamName(e.target.value)}
          placeholder="BLUE SIDE"
          className="bg-[rgba(20,20,26,0.6)] border border-white/10 text-white font-['Barlow_Condensed'] font-bold text-[13px] tracking-wider px-2.5 py-1 rounded-md outline-none w-28 sm:w-36 focus:border-[#6b8fb8] focus:ring-1 focus:ring-[#6b8fb8]/30 transition-all"
        />
        <select
          value={blueIsUs ? 'us' : 'opp'}
          onChange={(e) => setBlueIsUs(e.target.value === 'us')}
          className="bg-[rgba(20,20,26,0.6)] border border-white/10 text-[#e5e5e8] font-['Barlow_Condensed'] font-bold text-[11px] px-2 py-1 rounded-md cursor-pointer outline-none hover:border-white/20 transition-colors"
        >
          <option value="us" className="bg-[#13131a] text-white">= US</option>
          <option value="opp" className="bg-[#13131a] text-white">= OPP</option>
        </select>
      </div>

      {/* Swap Sides Button */}
      <button
        onClick={swapSides}
        title="สลับฝั่ง Blue ↔ Red"
        className="group inline-flex items-center gap-1.5 bg-gradient-to-br from-[#a82844]/10 to-[#9b6da8]/10 hover:from-[#a82844]/20 hover:to-[#9b6da8]/20 border border-white/20 text-[#e5e5e8] hover:text-white font-['Orbitron'] text-[9.5px] font-bold tracking-[2px] px-2.5 py-1.5 rounded-md cursor-pointer transition-all active:scale-95"
      >
        <span className="inline-block transition-transform duration-300 group-hover:rotate-180 text-sm leading-none">
          ⇄
        </span>
        <span className="hidden sm:inline">SWAP</span>
      </button>

      {/* Red Team Box */}
      <div className="flex items-center gap-1.5 bg-black/20 p-1 rounded-lg border border-white/5">
        <select
          value={blueIsUs ? 'opp' : 'us'}
          onChange={(e) => setBlueIsUs(e.target.value !== 'us')}
          className="bg-[rgba(20,20,26,0.6)] border border-white/10 text-[#e5e5e8] font-['Barlow_Condensed'] font-bold text-[11px] px-2 py-1 rounded-md cursor-pointer outline-none hover:border-white/20 transition-colors"
        >
          <option value="opp" className="bg-[#13131a] text-white">= OPP</option>
          <option value="us" className="bg-[#13131a] text-white">= US</option>
        </select>
        <input
          type="text"
          value={redTeamName}
          onChange={(e) => setRedTeamName(e.target.value)}
          placeholder="RED SIDE"
          className="bg-[rgba(20,20,26,0.6)] border border-white/10 text-white font-['Barlow_Condensed'] font-bold text-[13px] tracking-wider px-2.5 py-1 rounded-md outline-none w-28 sm:w-36 text-right focus:border-[#a82844] focus:ring-1 focus:ring-[#a82844]/30 transition-all"
        />
        <div className="w-7 h-7 rounded-md bg-[rgba(20,20,26,0.65)] border border-red-400/40 flex items-center justify-center text-xs select-none">
          🔴
        </div>
      </div>

      {/* Phase Label */}
      <div className="hidden xl:block font-['Barlow_Condensed'] text-[12px] text-[#e5e5e8] tracking-[1.5px] uppercase font-semibold mx-1">
        {phaseLabel}
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1.5 ml-auto flex-wrap">
        {/* Coach Analysis Panel Toggle */}
        {onToggleCoachPanel && (
          <button
            onClick={onToggleCoachPanel}
            title="เปิด/ปิด Coach Analysis Panel (Player Fit, Matchup, Team Comp, Warnings, Suggested Picks)"
            className={`font-['Barlow_Condensed'] text-[11px] font-black tracking-[1px] uppercase border px-2.5 py-1.5 rounded-md cursor-pointer transition-all flex items-center gap-1.5 ${
              isSidePanelOpen && sidePanelTab === 'coach'
                ? 'bg-[#d4a857] border-[#ffdd80] text-black shadow-[0_0_14px_rgba(212,168,87,0.6)]'
                : 'bg-[#d4a857]/15 hover:bg-[#d4a857]/25 border-[#d4a857]/40 text-[#d4a857] hover:text-[#ffdd80]'
            }`}
          >
            <span>🎯</span>
            <span className="hidden sm:inline">COACH ANALYSIS</span>
            <span className="sm:hidden">COACH</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse hidden md:inline-block"></span>
          </button>
        )}

        {/* Stats & Matchups Panel Toggle */}
        {onToggleStatsPanel && (
          <button
            onClick={onToggleStatsPanel}
            title="เปิด/ปิด Side Panel สถิติ Hero และ Matchup แพ้ทาง/ชนะทาง"
            className={`font-['Barlow_Condensed'] text-[11px] font-extrabold tracking-[1px] uppercase border px-2.5 py-1.5 rounded-md cursor-pointer transition-all flex items-center gap-1.5 ${
              isSidePanelOpen && sidePanelTab === 'stats'
                ? 'bg-[#a82844] border-[#ff7b95] text-white shadow-[0_0_12px_rgba(168,40,68,0.5)]'
                : 'bg-white/5 hover:bg-white/10 border-white/15 text-[#e5e5e8] hover:text-white'
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
            className="font-['Barlow_Condensed'] text-[11px] font-extrabold tracking-[1px] uppercase bg-white/5 hover:bg-white/10 border border-white/15 text-[#e5e5e8] hover:text-white px-2 py-1.5 rounded-md cursor-pointer transition-all flex items-center gap-1"
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
          className="font-['Barlow_Condensed'] text-[11px] font-extrabold tracking-[1px] uppercase bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/15 text-[#e5e5e8] hover:text-white px-2.5 py-1.5 rounded-md cursor-pointer transition-all flex items-center gap-1"
        >
          <Undo2 size={13} />
          <span>Undo</span>
        </button>

        {/* Save Draft to History */}
        {onOpenSaveDraft && (
          <button
            onClick={onOpenSaveDraft}
            title="บันทึกผลดราฟต์ลงคลังประวัติ (Draft History: Ban, Pick, Winner, Team, Notes)"
            className={`font-['Barlow_Condensed'] text-[11px] font-extrabold tracking-[1px] uppercase border px-2.5 py-1.5 rounded-md cursor-pointer transition-all flex items-center gap-1 ${
              isDraftComplete
                ? 'bg-emerald-600/30 hover:bg-emerald-600/50 border-emerald-500/80 text-emerald-300 hover:text-white shadow-[0_0_12px_rgba(16,185,129,0.3)] animate-pulse'
                : 'bg-white/5 hover:bg-emerald-950/40 border-white/15 hover:border-emerald-500/40 text-[#e5e5e8] hover:text-emerald-200'
            }`}
          >
            <Save size={13} className="text-emerald-400" />
            <span className="hidden sm:inline">SAVE DRAFT</span>
            <span className="sm:hidden">SAVE</span>
          </button>
        )}

        {/* Save to Match Note */}
        <button
          onClick={onSaveMatchNote}
          title="บันทึกผลดราฟลง Match Notes ด้านล่าง"
          className="font-['Barlow_Condensed'] text-[11px] font-extrabold tracking-[1px] uppercase bg-white/5 hover:bg-[#a82844]/20 border border-white/15 hover:border-[#a82844]/60 text-[#e5e5e8] hover:text-white px-2.5 py-1.5 rounded-md cursor-pointer transition-all flex items-center gap-1"
        >
          <Save size={13} className="text-[#d4a857]" />
          <span className="hidden sm:inline">บันทึก Match Note</span>
          <span className="sm:hidden">NOTE</span>
        </button>

        {/* Reset */}
        <button
          onClick={onReset}
          title="รีเซ็ตการดราฟทั้งหมด"
          className="font-['Barlow_Condensed'] text-[11px] font-extrabold tracking-[1px] uppercase bg-white/5 hover:bg-red-500/15 border border-red-400/25 hover:border-red-400/60 text-red-300 hover:text-red-100 px-2.5 py-1.5 rounded-md cursor-pointer transition-all flex items-center gap-1"
        >
          <RotateCcw size={13} />
          <span>Reset</span>
        </button>

        {/* New Draft */}
        <button
          onClick={onStartNewDraft}
          className={`font-['Barlow_Condensed'] text-[11px] font-extrabold tracking-[1.2px] uppercase px-3 py-1.5 rounded-md cursor-pointer transition-all flex items-center gap-1 shadow-md ${
            draftActive
              ? 'bg-[#a82844]/25 border border-[#a82844] text-white hover:bg-[#a82844]/40'
              : 'bg-emerald-600/30 border border-emerald-500/60 text-emerald-200 hover:bg-emerald-600/50 hover:text-white shadow-[0_0_12px_rgba(16,185,129,0.2)]'
          }`}
        >
          <Play size={13} className={draftActive ? 'text-[#d4a857]' : 'text-emerald-400 fill-emerald-400'} />
          <span>{draftActive ? 'Restart Draft' : '▶ New Draft'}</span>
        </button>
      </div>
    </div>
  );
};
