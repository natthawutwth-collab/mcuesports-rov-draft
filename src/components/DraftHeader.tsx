import React, { useState } from 'react';
import { RotateCcw, Save, Undo2, Play, MoreHorizontal, Settings, FileText, Database } from 'lucide-react';
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
}) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  return (
    <div className="w-full flex flex-col gap-1.5 p-2 sm:p-2.5 bg-white border border-[#F3D5E2] rounded-xl sm:rounded-2xl shadow-[0_2px_12px_rgba(233,30,99,0.05)]">
      {/* ROW 1: Team Matchup Card (Symmetrical, Compact, MCU eSports Light Theme) */}
      <div className="w-full grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 sm:gap-2">
        {/* Blue Team Box */}
        <div className="flex items-center gap-1.5 bg-[#F0F9FF] p-1 sm:p-1.5 rounded-xl border border-[#BAE6FD] shadow-xs min-w-0">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-[#E0F2FE] border border-[#7DD3FC] flex items-center justify-center text-xs select-none shadow-2xs flex-shrink-0">
            🔵
          </div>
          <input
            type="text"
            value={blueTeamName}
            onChange={(e) => setBlueTeamName(e.target.value)}
            placeholder="BLUE SIDE"
            className="flex-1 min-w-0 bg-white border border-[#E2E8F0] text-[#1F2937] font-['Prompt'] font-bold text-[11px] sm:text-[12px] tracking-wider px-2 py-0.5 rounded-md outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]/30 transition-all placeholder-slate-400 shadow-2xs"
          />
          <button
            type="button"
            onClick={() => setBlueIsUs(!blueIsUs)}
            className={`px-1.5 py-0.5 rounded-md font-['Prompt'] font-bold text-[9px] sm:text-[10px] border cursor-pointer transition-all flex-shrink-0 shadow-2xs ${
              blueIsUs
                ? 'bg-[#0284C7] border-[#0284C7] text-white shadow-2xs'
                : 'bg-white border-[#CBD5E1] text-[#64748B] hover:text-[#1F2937]'
            }`}
            title="คลิกเพื่อสลับสถานะ ทีมเรา (US) / คู่แข่ง (OPP)"
          >
            {blueIsUs ? '★ ทีมเรา' : 'คู่แข่ง'}
          </button>
        </div>

        {/* Center: Swap Button & Match Info (Reduced gap 4-6px, tightly clustered) */}
        <div className="flex items-center justify-center gap-1 sm:gap-1.5 flex-shrink-0 px-0.5">
          <button
            onClick={swapSides}
            title="สลับฝั่ง Blue ↔ Red"
            className="group inline-flex items-center gap-1 bg-[#FCE4EC] hover:bg-[#F8BBD0] border border-[#F48FB1] text-[#E91E63] font-['Prompt'] text-[9.5px] sm:text-[10.5px] font-bold px-2 py-0.5 rounded-lg cursor-pointer transition-all active:scale-95 shadow-2xs"
          >
            <span className="inline-block transition-transform duration-300 group-hover:rotate-180 text-xs leading-none text-[#E91E63]">
              ⇄
            </span>
            <span className="hidden xs:inline">สลับฝั่ง</span>
          </button>

          {matchMetadata && (
            <button
              onClick={onOpenSetupModal}
              title="คลิกเพื่อแก้ไขข้อมูลแมตช์การแข่งขัน"
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#F48FB1] text-[9.5px] sm:text-[10.5px] font-['Prompt'] text-[#1F2937] transition-all cursor-pointer shadow-2xs"
            >
              <span className="text-[#E91E63] font-black">G{matchMetadata.gameNumber}</span>
              <span className="max-w-[70px] sm:max-w-[110px] truncate font-medium hidden sm:inline text-[#64748B]">{matchMetadata.match}</span>
            </button>
          )}
        </div>

        {/* Red Team Box */}
        <div className="flex items-center gap-1.5 bg-[#FFF1F2] p-1 sm:p-1.5 rounded-xl border border-[#FECDD3] shadow-xs min-w-0">
          <button
            type="button"
            onClick={() => setBlueIsUs(!blueIsUs)}
            className={`px-1.5 py-0.5 rounded-md font-['Prompt'] font-bold text-[9px] sm:text-[10px] border cursor-pointer transition-all flex-shrink-0 shadow-2xs ${
              !blueIsUs
                ? 'bg-[#E11D48] border-[#E11D48] text-white shadow-2xs'
                : 'bg-white border-[#CBD5E1] text-[#64748B] hover:text-[#1F2937]'
            }`}
            title="คลิกเพื่อสลับสถานะ ทีมเรา (US) / คู่แข่ง (OPP)"
          >
            {!blueIsUs ? '★ ทีมเรา' : 'คู่แข่ง'}
          </button>
          <input
            type="text"
            value={redTeamName}
            onChange={(e) => setRedTeamName(e.target.value)}
            placeholder="RED SIDE"
            className="flex-1 min-w-0 bg-white border border-[#E2E8F0] text-[#1F2937] font-['Prompt'] font-bold text-[11px] sm:text-[12px] tracking-wider px-2 py-0.5 rounded-md outline-none text-right focus:border-[#E11D48] focus:ring-1 focus:ring-[#E11D48]/30 transition-all placeholder-slate-400 shadow-2xs"
          />
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-[#FFE4E6] border border-[#FDA4AF] flex items-center justify-center text-xs select-none shadow-2xs flex-shrink-0">
            🔴
          </div>
        </div>
      </div>

      {/* ROW 2: Control Toolbar (Action Buttons) */}
      <div className="w-full flex items-center justify-end gap-1.5 sm:gap-2 pt-1 border-t border-[#F3D5E2]">
        {/* Right Section: Lifecycle Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 ml-auto flex-shrink-0">
          {/* Undo Action */}
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title="ย้อนกลับการกระทำล่าสุด"
            className="font-['Prompt'] text-[9.5px] sm:text-[10.5px] font-semibold tracking-wide bg-white hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed border border-[#CBD5E1] text-[#475569] hover:text-[#1F2937] px-2 py-0.5 rounded-lg cursor-pointer transition-all flex items-center gap-1 shadow-2xs"
          >
            <Undo2 size={11} />
            <span className="hidden xs:inline">ย้อนกลับ</span>
          </button>

          {/* Save Draft */}
          {onOpenSaveDraft && (
            <button
              type="button"
              onClick={onOpenSaveDraft}
              title="บันทึกผลดราฟต์ลงคลังประวัติ (Draft History)"
              className={`font-['Prompt'] text-[9.5px] sm:text-[10.5px] font-bold tracking-wide border px-2 py-0.5 rounded-lg cursor-pointer transition-all flex items-center gap-1 shadow-2xs ${
                isDraftComplete
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-xs animate-pulse'
                  : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-700'
              }`}
            >
              <Save size={11} className={isDraftComplete ? 'text-white' : 'text-emerald-600'} />
              <span>บันทึกผล</span>
            </button>
          )}

          {/* Primary Action: New Draft / Restart */}
          <button
            type="button"
            onClick={onStartNewDraft}
            className="font-['Prompt'] text-[10px] sm:text-[11px] font-bold tracking-wide px-2.5 py-0.5 rounded-lg cursor-pointer transition-all flex items-center gap-1 shadow-xs text-white bg-[#E91E63] hover:bg-[#D81B60] border border-[#C2185B] active:scale-95"
          >
            <Play size={10} className="fill-white text-white" />
            <span>{draftActive ? 'เริ่มใหม่' : 'เริ่มดราฟต์'}</span>
          </button>

          {/* More Menu Dropdown for Secondary Actions */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMoreMenuOpen((prev) => !prev)}
              title="เมนูเพิ่มเติม (Match Notes, Data Layer, Setup, Reset)"
              className="p-1 rounded-lg bg-white hover:bg-[#FFF0F5] border border-[#CBD5E1] text-[#64748B] hover:text-[#E91E63] cursor-pointer transition-all flex items-center justify-center shadow-2xs"
            >
              <MoreHorizontal size={13} />
            </button>

            {isMoreMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsMoreMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-[#F3D5E2] rounded-xl shadow-xl p-1.5 z-50 flex flex-col gap-1 text-[11px] font-['Prompt'] font-semibold">
                  {onOpenSetupModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        onOpenSetupModal();
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg text-left text-[#1F2937] hover:text-[#E91E63] hover:bg-[#FFF0F5] flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Settings size={12} className="text-[#E91E63]" />
                      <span>ตั้งค่าแมตช์ (Setup)</span>
                    </button>
                  )}

                  {onToggleCoachPanel && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        onToggleCoachPanel();
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg text-left text-[#1F2937] hover:text-[#E91E63] hover:bg-[#FFF0F5] flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <span className="text-xs">🎯</span>
                      <span>{isSidePanelOpen ? 'ปิดแผงวิเคราะห์โค้ช / สถิติ' : 'เปิดแผงวิเคราะห์โค้ช / สถิติ'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      onSaveMatchNote();
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left text-[#1F2937] hover:text-purple-600 hover:bg-purple-50 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <FileText size={12} className="text-purple-500" />
                    <span>บันทึก Match Note</span>
                  </button>

                  {onOpenDataModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        onOpenDataModal();
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg text-left text-[#1F2937] hover:text-[#0284C7] hover:bg-sky-50 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Database size={12} className="text-sky-500" />
                      <span>Data Layer (JSON/CSV)</span>
                    </button>
                  )}

                  <div className="h-px bg-[#F3D5E2] my-0.5" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      onReset();
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer transition-colors"
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
    </div>
  );
};
