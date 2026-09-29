import React, { useState } from 'react';
import { MatchWinner, DraftHistoryRecord } from '../types/draftHistory';
import { PickSlotState } from '../hooks/useDraconmindDraft';
import { Hero } from '../types/draft';
import { getHeroImageUrl } from '../data/heroes';
import { Save, X, Trophy, AlertCircle, FileText } from 'lucide-react';

interface SaveDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: string;
  match: string;
  gameNumber: number;
  patch: string;
  blueTeamName: string;
  redTeamName: string;
  blueBans: (Hero | null)[];
  redBans: (Hero | null)[];
  bluePicks: PickSlotState[];
  redPicks: PickSlotState[];
  onSave: (data: {
    tournament: string;
    match: string;
    gameNumber: number;
    patch: string;
    winner: MatchWinner;
    notes: string;
  }) => void;
}

export const SaveDraftModal: React.FC<SaveDraftModalProps> = ({
  isOpen,
  onClose,
  tournament,
  match,
  gameNumber,
  patch,
  blueTeamName,
  redTeamName,
  blueBans,
  redBans,
  bluePicks,
  redPicks,
  onSave,
}) => {
  const [winner, setWinner] = useState<MatchWinner>('blue');
  const [notes, setNotes] = useState<string>('');
  const [currentTournament, setCurrentTournament] = useState(tournament);
  const [currentMatch, setCurrentMatch] = useState(match);
  const [currentGameNum, setCurrentGameNum] = useState(gameNumber);
  const [currentPatch, setCurrentPatch] = useState(patch);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      tournament: currentTournament,
      match: currentMatch,
      gameNumber: currentGameNum,
      patch: currentPatch,
      winner,
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn select-none font-['Prompt']">
      <div className="relative w-full max-w-2xl bg-white border-2 border-[#F3D5E2] rounded-2xl shadow-2xl overflow-hidden text-[#1F2937] flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-[#FFF0F5] border-b border-[#F3D5E2] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shadow-xs">
              <Save size={18} />
            </div>
            <div>
              <h2 className="font-['Orbitron'] text-base font-bold tracking-wider text-[#1F2937]">
                SAVE DRAFT TO CLOUD & HISTORY
              </h2>
              <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                <span>☁️ ซิงค์ขึ้น Cloud อัตโนมัติ — บันทึกแล้วข้อมูลไม่หาย เปิดจากเครื่องอื่นก็ยังอยู่</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shadow-2xs"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-['Prompt']">
          {/* Match Info Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-[#FFF8FB] border border-[#F3D5E2] rounded-xl shadow-2xs">
            <div>
              <span className="block text-[10px] text-slate-500 font-bold">TOURNAMENT</span>
              <span className="font-bold text-[#1F2937] truncate block text-[11px]">
                {currentTournament}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 font-bold">MATCH</span>
              <span className="font-bold text-[#1F2937] truncate block text-[11px]">
                {currentMatch}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 font-bold">GAME #</span>
              <span className="font-bold text-[#E91E63] block text-[11px]">
                Game {currentGameNum}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 font-bold">PATCH</span>
              <span className="font-bold text-slate-700 block text-[11px] truncate">
                {currentPatch}
              </span>
            </div>
          </div>

          {/* Draft Recap: Blue vs Red Team */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Blue Team Recap */}
            <div className="p-3 bg-[#F0F9FF] border border-[#BAE6FD] rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#0284C7] flex items-center gap-1.5">
                  <span>🔵</span>
                  <span className="font-['Prompt'] text-sm tracking-wider uppercase">
                    {blueTeamName}
                  </span>
                </span>
                <span className="text-[10px] text-[#0284C7] font-bold uppercase">
                  BLUE SIDE
                </span>
              </div>

              {/* Bans */}
              <div className="space-y-1">
                <span className="text-[9.5px] text-slate-500 uppercase font-bold">
                  Bans:
                </span>
                <div className="flex items-center gap-1 flex-wrap">
                  {blueBans.map((h, i) =>
                    h ? (
                      <div
                        key={i}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white border border-red-300 text-[10px] shadow-2xs"
                      >
                        <img
                          src={h.avatarUrl || getHeroImageUrl(h.name)}
                          alt={h.name}
                          className="w-4 h-4 rounded-full object-cover"
                        />
                        <span className="font-bold text-slate-800">{h.name}</span>
                      </div>
                    ) : (
                      <span key={i} className="text-slate-400 text-[10px]">—</span>
                    )
                  )}
                </div>
              </div>

              {/* Picks */}
              <div className="space-y-1 pt-1 border-t border-[#BAE6FD]">
                <span className="text-[9.5px] text-slate-500 uppercase font-bold">
                  Picks:
                </span>
                <div className="grid grid-cols-5 gap-1">
                  {bluePicks.map((p, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center p-1 rounded bg-white border border-[#BAE6FD] shadow-2xs"
                    >
                      <span className="text-[8px] font-bold text-[#0284C7]">
                        {p.pos}
                      </span>
                      {p.hero ? (
                        <img
                          src={p.hero.avatarUrl || getHeroImageUrl(p.hero.name)}
                          alt={p.hero.name}
                          title={p.hero.name}
                          className="w-6 h-6 rounded-full object-cover mt-0.5 border border-slate-200"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-[9px] text-slate-400 mt-0.5">
                          —
                        </div>
                      )}
                      <span className="text-[8.5px] text-[#1F2937] font-medium truncate max-w-[40px] mt-0.5">
                        {p.hero?.name || '-'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Red Team Recap */}
            <div className="p-3 bg-[#FFF1F2] border border-[#FECDD3] rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#E11D48] flex items-center gap-1.5">
                  <span>🔴</span>
                  <span className="font-['Prompt'] text-sm tracking-wider uppercase">
                    {redTeamName}
                  </span>
                </span>
                <span className="text-[10px] text-[#E11D48] font-bold uppercase">
                  RED SIDE
                </span>
              </div>

              {/* Bans */}
              <div className="space-y-1">
                <span className="text-[9.5px] text-slate-500 uppercase font-bold">
                  Bans:
                </span>
                <div className="flex items-center gap-1 flex-wrap">
                  {redBans.map((h, i) =>
                    h ? (
                      <div
                        key={i}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white border border-red-300 text-[10px] shadow-2xs"
                      >
                        <img
                          src={h.avatarUrl || getHeroImageUrl(h.name)}
                          alt={h.name}
                          className="w-4 h-4 rounded-full object-cover"
                        />
                        <span className="font-bold text-slate-800">{h.name}</span>
                      </div>
                    ) : (
                      <span key={i} className="text-slate-400 text-[10px]">—</span>
                    )
                  )}
                </div>
              </div>

              {/* Picks */}
              <div className="space-y-1 pt-1 border-t border-[#FECDD3]">
                <span className="text-[9.5px] text-slate-500 uppercase font-bold">
                  Picks:
                </span>
                <div className="grid grid-cols-5 gap-1">
                  {redPicks.map((p, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center p-1 rounded bg-white border border-[#FECDD3] shadow-2xs"
                    >
                      <span className="text-[8px] font-bold text-[#E11D48]">
                        {p.pos}
                      </span>
                      {p.hero ? (
                        <img
                          src={p.hero.avatarUrl || getHeroImageUrl(p.hero.name)}
                          alt={p.hero.name}
                          title={p.hero.name}
                          className="w-6 h-6 rounded-full object-cover mt-0.5 border border-slate-200"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-[9px] text-slate-400 mt-0.5">
                          —
                        </div>
                      )}
                      <span className="text-[8.5px] text-[#1F2937] font-medium truncate max-w-[40px] mt-0.5">
                        {p.hero?.name || '-'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 1. Winner Selection */}
          <div className="space-y-1.5">
            <label className="font-['Prompt'] text-xs font-bold tracking-wider uppercase text-slate-700 flex items-center gap-1.5">
              <Trophy size={14} className="text-amber-500" />
              <span>MATCH WINNER (ผู้ชนะการแข่งขัน) *</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setWinner('blue')}
                className={`py-2 px-3 rounded-lg border font-['Prompt'] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                  winner === 'blue'
                    ? 'bg-[#0284C7] border-[#0284C7] text-white shadow-xs'
                    : 'bg-white border-[#BAE6FD] text-[#0284C7] hover:bg-[#F0F9FF]'
                }`}
              >
                <span>🔵</span>
                <span className="truncate">{blueTeamName} WIN</span>
              </button>

              <button
                type="button"
                onClick={() => setWinner('red')}
                className={`py-2 px-3 rounded-lg border font-['Prompt'] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                  winner === 'red'
                    ? 'bg-[#E11D48] border-[#E11D48] text-white shadow-xs'
                    : 'bg-white border-[#FECDD3] text-[#E11D48] hover:bg-[#FFF1F2]'
                }`}
              >
                <span>🔴</span>
                <span className="truncate">{redTeamName} WIN</span>
              </button>

              <button
                type="button"
                onClick={() => setWinner('undecided')}
                className={`py-2 px-3 rounded-lg border font-['Prompt'] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                  winner === 'undecided'
                    ? 'bg-slate-200 border-slate-400 text-slate-800 shadow-xs'
                    : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>⏳</span>
                <span>ยังไม่แข่ง / ซ้อม</span>
              </button>
            </div>
          </div>

          {/* 2. Notes / Post-Match Review */}
          <div className="space-y-1.5">
            <label className="font-['Prompt'] text-xs font-bold tracking-wider uppercase text-slate-700 flex items-center gap-1.5">
              <FileText size={14} className="text-[#E91E63]" />
              <span>COACH NOTES & DRAFT ANALYSIS (บันทึกของโค้ช)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="บันทึกข้อคิดเห็นของโค้ช เช่น แผนการเดินเกม, จุดได้เปรียบ/เสียเปรียบ, การแก้ทางคอมพ์, หรือข้อผิดพลาดในดราฟ..."
              className="w-full px-3 py-2 bg-[#FFF8FB] border border-[#F3D5E2] focus:border-[#E91E63] focus:bg-white rounded-lg text-[#1F2937] text-xs outline-none transition-colors"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#F3D5E2] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-['Prompt'] font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-['Prompt'] font-bold text-xs tracking-wider shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <Save size={14} />
              <span>CONFIRM & SAVE DRAFT</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
