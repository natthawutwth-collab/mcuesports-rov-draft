import React, { useState } from 'react';
import { DraftMatchMetadata } from '../types/draftHistory';
import { Play, RotateCcw, X, Shield, Swords } from 'lucide-react';

interface PreDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (metadata: DraftMatchMetadata) => void;
  initialMetadata?: DraftMatchMetadata;
}

const COMMON_TOURNAMENTS = [
  'RoV Pro League 2026 Summer',
  'Arena of Valor Premier League (APL 2026)',
  'AIC 2026',
  'Road to RPL Scrim & Practice',
  'MCU Internal Scrimmage',
];

const COMMON_PATCHES = [
  'Patch 1.56 (Summer 2026)',
  'Patch 1.55 (Spring 2026)',
  'Patch 1.54',
  'Tournament Server Standard',
];

export const PreDraftModal: React.FC<PreDraftModalProps> = ({
  isOpen,
  onClose,
  onStart,
  initialMetadata,
}) => {
  const [tournament, setTournament] = useState(
    initialMetadata?.tournament || 'RoV Pro League 2026 Summer'
  );
  const [match, setMatch] = useState(
    initialMetadata?.match || 'Match 1 - Regular Season'
  );
  const [gameNumber, setGameNumber] = useState<number>(
    initialMetadata?.gameNumber || 1
  );
  const [blueTeam, setBlueTeam] = useState(
    initialMetadata?.blueTeam || 'Blue Team'
  );
  const [redTeam, setRedTeam] = useState(
    initialMetadata?.redTeam || 'Red Team'
  );
  const [patch, setPatch] = useState(
    initialMetadata?.patch || 'Patch 1.56 (Summer 2026)'
  );
  const [teamCategory, setTeamCategory] = useState<'male' | 'female' | 'mixed'>(
    initialMetadata?.teamCategory || 'male'
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart({
      tournament: tournament.trim() || 'RoV Pro League 2026 Summer',
      match: match.trim() || 'Match 1',
      gameNumber: Number(gameNumber) || 1,
      blueTeam: blueTeam.trim() || 'Blue Team',
      redTeam: redTeam.trim() || 'Red Team',
      patch: patch.trim() || 'Patch 1.56',
      teamCategory,
    });
  };

  const handleSwapSides = () => {
    const temp = blueTeam;
    setBlueTeam(redTeam);
    setRedTeam(temp);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn select-none font-['Prompt']">
      <div className="relative w-full max-w-lg bg-white border-2 border-[#F3D5E2] rounded-2xl shadow-2xl overflow-hidden text-[#1F2937]">
        {/* Header */}
        <div className="p-4 bg-[#FFF0F5] border-b border-[#F3D5E2] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FCE4EC] border border-[#E91E63] flex items-center justify-center text-[#E91E63] shadow-xs">
              <Swords size={18} />
            </div>
            <div>
              <h2 className="font-['Orbitron'] text-base font-bold tracking-wider text-[#1F2937]">
                SETUP NEW DRAFT MATCH
              </h2>
              <p className="text-[11px] text-slate-500">
                กรอกข้อมูลการแข่งขันก่อนเริ่มต้นการดราฟ
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs font-['Prompt']">
          {/* 1. Tournament */}
          <div>
            <label className="block font-['Prompt'] text-xs font-bold tracking-wider uppercase text-slate-700 mb-1">
              TOURNAMENT (รายการแข่งขัน) <span className="text-[#E91E63]">*</span>
            </label>
            <input
              type="text"
              list="tournament-options"
              value={tournament}
              onChange={(e) => setTournament(e.target.value)}
              placeholder="e.g. RoV Pro League 2026 Summer"
              required
              className="w-full px-3 py-2 bg-[#FFF8FB] border border-[#F3D5E2] focus:border-[#E91E63] focus:bg-white rounded-lg text-[#1F2937] font-medium outline-none transition-colors"
            />
            <datalist id="tournament-options">
              {COMMON_TOURNAMENTS.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>

          {/* 2. Match & Game Number */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block font-['Prompt'] text-xs font-bold tracking-wider uppercase text-slate-700 mb-1">
                MATCH (แมตช์ / สัปดาห์) <span className="text-[#E91E63]">*</span>
              </label>
              <input
                type="text"
                value={match}
                onChange={(e) => setMatch(e.target.value)}
                placeholder="e.g. Bacon Time vs Talon Esports"
                required
                className="w-full px-3 py-2 bg-[#FFF8FB] border border-[#F3D5E2] focus:border-[#E91E63] focus:bg-white rounded-lg text-[#1F2937] font-medium outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block font-['Prompt'] text-xs font-bold tracking-wider uppercase text-slate-700 mb-1">
                GAME NUMBER <span className="text-[#E91E63]">*</span>
              </label>
              <div className="flex items-center">
                <select
                  value={gameNumber}
                  onChange={(e) => setGameNumber(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#FFF8FB] border border-[#F3D5E2] focus:border-[#E91E63] focus:bg-white rounded-lg text-[#1F2937] font-bold outline-none cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <option key={num} value={num}>
                      Game {num}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* หมวดหมู่ทีม: ทีมชาย / ทีมหญิง / ทีมผสม */}
          <div>
            <label className="block font-['Prompt'] text-xs font-bold tracking-wider uppercase text-slate-700 mb-1.5 flex items-center justify-between">
              <span>หมวดหมู่ทีม (TEAM DIVISION)</span>
              <span className="text-[10px] text-slate-500 font-normal">คัดกรองข้อมูลนักแข่งในหน้าดราฟ</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTeamCategory('male')}
                className={`py-2 px-2 rounded-xl border text-xs font-['Prompt'] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  teamCategory === 'male'
                    ? 'bg-sky-50 border-[#0284C7] text-[#0284C7] shadow-xs'
                    : 'bg-white border-[#F3D5E2] text-slate-600 hover:text-slate-900 hover:border-slate-400'
                }`}
              >
                <span>👨</span>
                <span>ทีมชาย (Men)</span>
              </button>
              <button
                type="button"
                onClick={() => setTeamCategory('female')}
                className={`py-2 px-2 rounded-xl border text-xs font-['Prompt'] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  teamCategory === 'female'
                    ? 'bg-rose-50 border-[#E11D48] text-[#E11D48] shadow-xs'
                    : 'bg-white border-[#F3D5E2] text-slate-600 hover:text-slate-900 hover:border-slate-400'
                }`}
              >
                <span>👩</span>
                <span>ทีมหญิง (Women)</span>
              </button>
              <button
                type="button"
                onClick={() => setTeamCategory('mixed')}
                className={`py-2 px-2 rounded-xl border text-xs font-['Prompt'] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  teamCategory === 'mixed'
                    ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-xs'
                    : 'bg-white border-[#F3D5E2] text-slate-600 hover:text-slate-900 hover:border-slate-400'
                }`}
              >
                <span>👥</span>
                <span>ทีมผสม (Mixed)</span>
              </button>
            </div>
          </div>

          {/* 3. Teams (Blue vs Red) with Quick Swap Button */}
          <div className="p-3.5 bg-[#FFF8FB] border border-[#F3D5E2] rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-['Prompt'] text-xs font-bold tracking-wider uppercase text-[#E91E63] flex items-center gap-1.5">
                <Shield size={13} />
                <span>TEAM SIDES (เลือกฝั่งทีม)</span>
              </span>
              <button
                type="button"
                onClick={handleSwapSides}
                title="สลับฝั่งทีม Blue ⇄ Red"
                className="font-['Prompt'] text-[11px] font-bold text-slate-700 hover:text-[#E91E63] px-2.5 py-1 rounded-lg bg-white hover:bg-[#FFF0F5] border border-[#F3D5E2] transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <RotateCcw size={11} />
                <span>SWAP SIDES</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Blue Team */}
              <div>
                <label className="block text-[11px] font-bold text-[#0284C7] mb-1 flex items-center gap-1">
                  <span>🔵</span>
                  <span>BLUE TEAM (First Pick)</span>
                </label>
                <input
                  type="text"
                  value={blueTeam}
                  onChange={(e) => setBlueTeam(e.target.value)}
                  placeholder="e.g. Bacon Time"
                  required
                  className="w-full px-3 py-2 bg-white border border-[#BAE6FD] focus:border-[#0284C7] rounded-lg text-[#0284C7] font-bold outline-none shadow-2xs"
                />
              </div>

              {/* Red Team */}
              <div>
                <label className="block text-[11px] font-bold text-[#E11D48] mb-1 flex items-center gap-1">
                  <span>🔴</span>
                  <span>RED TEAM (Counter Pick)</span>
                </label>
                <input
                  type="text"
                  value={redTeam}
                  onChange={(e) => setRedTeam(e.target.value)}
                  placeholder="e.g. Talon Esports"
                  required
                  className="w-full px-3 py-2 bg-white border border-[#FECDD3] focus:border-[#E11D48] rounded-lg text-[#E11D48] font-bold outline-none shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* 4. Patch */}
          <div>
            <label className="block font-['Prompt'] text-xs font-bold tracking-wider uppercase text-slate-700 mb-1">
              PATCH (เวอร์ชันเกม / เซิร์ฟเวอร์) <span className="text-[#E91E63]">*</span>
            </label>
            <input
              type="text"
              list="patch-options"
              value={patch}
              onChange={(e) => setPatch(e.target.value)}
              placeholder="e.g. Patch 1.56 (Summer 2026)"
              required
              className="w-full px-3 py-2 bg-[#FFF8FB] border border-[#F3D5E2] focus:border-[#E91E63] focus:bg-white rounded-lg text-[#1F2937] font-medium outline-none transition-colors"
            />
            <datalist id="patch-options">
              {COMMON_PATCHES.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-['Prompt'] font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#E91E63] hover:bg-[#D81B60] text-white font-['Prompt'] font-bold text-xs tracking-wider shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <Play size={13} fill="currentColor" />
              <span>START DRAFT</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
