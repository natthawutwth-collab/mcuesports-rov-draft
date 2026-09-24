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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none font-['Kanit']">
      <div className="relative w-full max-w-2xl bg-[#121217] border border-white/20 rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-black/80 via-[#a82844]/25 to-black/80 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
              <Save size={18} />
            </div>
            <div>
              <h2 className="font-['Orbitron'] text-base font-bold tracking-wider text-white">
                SAVE DRAFT TO HISTORY
              </h2>
              <p className="text-[11px] text-[#a0a0a8]">
                บันทึกสถิติดราฟต์ ผลการแข่งขัน Ban/Pick และบทวิเคราะห์
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Match Info Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-black/40 border border-white/10 rounded-xl">
            <div>
              <span className="block text-[10px] text-[#a0a0a8] font-bold">TOURNAMENT</span>
              <span className="font-semibold text-white truncate block text-[11px]">
                {currentTournament}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-[#a0a0a8] font-bold">MATCH</span>
              <span className="font-semibold text-white truncate block text-[11px]">
                {currentMatch}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-[#a0a0a8] font-bold">GAME #</span>
              <span className="font-semibold text-[#d4a857] block text-[11px]">
                Game {currentGameNum}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-[#a0a0a8] font-bold">PATCH</span>
              <span className="font-semibold text-white/80 block text-[11px] truncate">
                {currentPatch}
              </span>
            </div>
          </div>

          {/* Draft Recap: Blue vs Red Team */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Blue Team Recap */}
            <div className="p-3 bg-[#6b8fb8]/10 border border-[#6b8fb8]/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span>🔵</span>
                  <span className="font-['Barlow_Condensed'] text-sm tracking-wider uppercase">
                    {blueTeamName}
                  </span>
                </span>
                <span className="text-[10px] text-[#6b8fb8] font-bold font-['Barlow_Condensed'] uppercase">
                  BLUE SIDE
                </span>
              </div>

              {/* Bans */}
              <div className="space-y-1">
                <span className="text-[9.5px] text-[#a0a0a8] uppercase font-['Barlow_Condensed']">
                  Bans:
                </span>
                <div className="flex items-center gap-1 flex-wrap">
                  {blueBans.map((h, i) =>
                    h ? (
                      <div
                        key={i}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-[10px]"
                      >
                        <img
                          src={h.avatarUrl || getHeroImageUrl(h.name)}
                          alt={h.name}
                          className="w-4 h-4 rounded-full object-cover"
                        />
                        <span className="font-medium text-white/90">{h.name}</span>
                      </div>
                    ) : (
                      <span key={i} className="text-white/30 text-[10px]">—</span>
                    )
                  )}
                </div>
              </div>

              {/* Picks */}
              <div className="space-y-1 pt-1 border-t border-white/5">
                <span className="text-[9.5px] text-[#a0a0a8] uppercase font-['Barlow_Condensed']">
                  Picks:
                </span>
                <div className="grid grid-cols-5 gap-1">
                  {bluePicks.map((p, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center p-1 rounded bg-black/40 border border-white/10"
                    >
                      <span className="text-[8px] font-['Barlow_Condensed'] font-bold text-[#6b8fb8]">
                        {p.pos}
                      </span>
                      {p.hero ? (
                        <img
                          src={p.hero.avatarUrl || getHeroImageUrl(p.hero.name)}
                          alt={p.hero.name}
                          title={p.hero.name}
                          className="w-6 h-6 rounded-full object-cover mt-0.5"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-dashed border-white/20 flex items-center justify-center text-[9px] text-white/30 mt-0.5">
                          —
                        </div>
                      )}
                      <span className="text-[8.5px] text-white font-medium truncate max-w-[40px] mt-0.5">
                        {p.hero?.name || '-'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Red Team Recap */}
            <div className="p-3 bg-[#a82844]/10 border border-[#a82844]/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span>🔴</span>
                  <span className="font-['Barlow_Condensed'] text-sm tracking-wider uppercase">
                    {redTeamName}
                  </span>
                </span>
                <span className="text-[10px] text-[#ff7b95] font-bold font-['Barlow_Condensed'] uppercase">
                  RED SIDE
                </span>
              </div>

              {/* Bans */}
              <div className="space-y-1">
                <span className="text-[9.5px] text-[#a0a0a8] uppercase font-['Barlow_Condensed']">
                  Bans:
                </span>
                <div className="flex items-center gap-1 flex-wrap">
                  {redBans.map((h, i) =>
                    h ? (
                      <div
                        key={i}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-[10px]"
                      >
                        <img
                          src={h.avatarUrl || getHeroImageUrl(h.name)}
                          alt={h.name}
                          className="w-4 h-4 rounded-full object-cover"
                        />
                        <span className="font-medium text-white/90">{h.name}</span>
                      </div>
                    ) : (
                      <span key={i} className="text-white/30 text-[10px]">—</span>
                    )
                  )}
                </div>
              </div>

              {/* Picks */}
              <div className="space-y-1 pt-1 border-t border-white/5">
                <span className="text-[9.5px] text-[#a0a0a8] uppercase font-['Barlow_Condensed']">
                  Picks:
                </span>
                <div className="grid grid-cols-5 gap-1">
                  {redPicks.map((p, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center p-1 rounded bg-black/40 border border-white/10"
                    >
                      <span className="text-[8px] font-['Barlow_Condensed'] font-bold text-[#ff7b95]">
                        {p.pos}
                      </span>
                      {p.hero ? (
                        <img
                          src={p.hero.avatarUrl || getHeroImageUrl(p.hero.name)}
                          alt={p.hero.name}
                          title={p.hero.name}
                          className="w-6 h-6 rounded-full object-cover mt-0.5"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-dashed border-white/20 flex items-center justify-center text-[9px] text-white/30 mt-0.5">
                          —
                        </div>
                      )}
                      <span className="text-[8.5px] text-white font-medium truncate max-w-[40px] mt-0.5">
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
            <label className="font-['Barlow_Condensed'] text-xs font-black tracking-wider uppercase text-[#d4a857] flex items-center gap-1.5">
              <Trophy size={14} />
              <span>MATCH WINNER (ผู้ชนะการแข่งขัน) *</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setWinner('blue')}
                className={`py-2 px-3 rounded-lg border font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  winner === 'blue'
                    ? 'bg-[#6b8fb8] border-[#8cb3dd] text-white shadow-[0_0_12px_rgba(107,143,184,0.4)]'
                    : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>🔵</span>
                <span className="truncate">{blueTeamName} WIN</span>
              </button>

              <button
                type="button"
                onClick={() => setWinner('red')}
                className={`py-2 px-3 rounded-lg border font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  winner === 'red'
                    ? 'bg-[#a82844] border-[#ff7b95] text-white shadow-[0_0_12px_rgba(168,40,68,0.5)]'
                    : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>🔴</span>
                <span className="truncate">{redTeamName} WIN</span>
              </button>

              <button
                type="button"
                onClick={() => setWinner('undecided')}
                className={`py-2 px-3 rounded-lg border font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  winner === 'undecided'
                    ? 'bg-white/20 border-white/40 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>⏳</span>
                <span>ยังไม่แข่ง / ซ้อม</span>
              </button>
            </div>
          </div>

          {/* 2. Notes / Post-Match Review */}
          <div className="space-y-1.5">
            <label className="font-['Barlow_Condensed'] text-xs font-black tracking-wider uppercase text-white/80 flex items-center gap-1.5">
              <FileText size={14} />
              <span>COACH NOTES & DRAFT ANALYSIS (บันทึกของโค้ช)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="บันทึกข้อคิดเห็นของโค้ช เช่น แผนการเดินเกม, จุดได้เปรียบ/เสียเปรียบ, การแก้ทางคอมพ์, หรือข้อผิดพลาดในดราฟ..."
              className="w-full px-3 py-2 bg-black/50 border border-white/15 focus:border-[#d4a857] rounded-lg text-white text-xs outline-none transition-colors"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white font-['Barlow_Condensed'] font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white font-['Orbitron'] font-bold text-xs tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all cursor-pointer flex items-center gap-1.5"
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
