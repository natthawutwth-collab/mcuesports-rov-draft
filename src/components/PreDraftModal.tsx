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
    });
  };

  const handleSwapSides = () => {
    const temp = blueTeam;
    setBlueTeam(redTeam);
    setRedTeam(temp);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none font-['Kanit']">
      <div className="relative w-full max-w-lg bg-[#121217] border border-white/20 rounded-2xl shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-black/80 via-[#a82844]/20 to-black/80 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#a82844]/30 border border-[#a82844]/60 flex items-center justify-center text-[#ff7b95]">
              <Swords size={18} />
            </div>
            <div>
              <h2 className="font-['Orbitron'] text-base font-bold tracking-wider text-white">
                SETUP NEW DRAFT MATCH
              </h2>
              <p className="text-[11px] text-[#a0a0a8]">
                กรอกข้อมูลการแข่งขันก่อนเริ่มต้นการดราฟ
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* 1. Tournament */}
          <div>
            <label className="block font-['Barlow_Condensed'] text-xs font-black tracking-wider uppercase text-white/80 mb-1">
              TOURNAMENT (รายการแข่งขัน) <span className="text-[#a82844]">*</span>
            </label>
            <input
              type="text"
              list="tournament-options"
              value={tournament}
              onChange={(e) => setTournament(e.target.value)}
              placeholder="e.g. RoV Pro League 2026 Summer"
              required
              className="w-full px-3 py-2 bg-black/50 border border-white/15 focus:border-[#d4a857] rounded-lg text-white font-medium outline-none transition-colors"
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
              <label className="block font-['Barlow_Condensed'] text-xs font-black tracking-wider uppercase text-white/80 mb-1">
                MATCH (แมตช์ / สัปดาห์) <span className="text-[#a82844]">*</span>
              </label>
              <input
                type="text"
                value={match}
                onChange={(e) => setMatch(e.target.value)}
                placeholder="e.g. Bacon Time vs Talon Esports"
                required
                className="w-full px-3 py-2 bg-black/50 border border-white/15 focus:border-[#d4a857] rounded-lg text-white font-medium outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block font-['Barlow_Condensed'] text-xs font-black tracking-wider uppercase text-white/80 mb-1">
                GAME NUMBER <span className="text-[#a82844]">*</span>
              </label>
              <div className="flex items-center">
                <select
                  value={gameNumber}
                  onChange={(e) => setGameNumber(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-black/50 border border-white/15 focus:border-[#d4a857] rounded-lg text-white font-bold outline-none cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <option key={num} value={num} className="bg-[#1a1a20]">
                      Game {num}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 3. Teams (Blue vs Red) with Quick Swap Button */}
          <div className="p-3.5 bg-black/40 border border-white/10 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-['Barlow_Condensed'] text-xs font-black tracking-wider uppercase text-[#d4a857] flex items-center gap-1.5">
                <Shield size={13} />
                <span>TEAM SIDES (เลือกฝั่งทีม)</span>
              </span>
              <button
                type="button"
                onClick={handleSwapSides}
                title="สลับฝั่งทีม Blue ⇄ Red"
                className="font-['Barlow_Condensed'] text-[11px] font-bold text-white/70 hover:text-white px-2 py-1 rounded bg-white/10 hover:bg-white/20 border border-white/15 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={11} />
                <span>SWAP SIDES</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Blue Team */}
              <div>
                <label className="block text-[11px] font-bold text-[#6b8fb8] mb-1 flex items-center gap-1">
                  <span>🔵</span>
                  <span>BLUE TEAM (First Pick)</span>
                </label>
                <input
                  type="text"
                  value={blueTeam}
                  onChange={(e) => setBlueTeam(e.target.value)}
                  placeholder="e.g. Bacon Time"
                  required
                  className="w-full px-3 py-2 bg-[#6b8fb8]/10 border border-[#6b8fb8]/40 focus:border-[#6b8fb8] rounded-lg text-white font-bold outline-none"
                />
              </div>

              {/* Red Team */}
              <div>
                <label className="block text-[11px] font-bold text-[#ff7b95] mb-1 flex items-center gap-1">
                  <span>🔴</span>
                  <span>RED TEAM (Counter Pick)</span>
                </label>
                <input
                  type="text"
                  value={redTeam}
                  onChange={(e) => setRedTeam(e.target.value)}
                  placeholder="e.g. Talon Esports"
                  required
                  className="w-full px-3 py-2 bg-[#a82844]/10 border border-[#a82844]/40 focus:border-[#a82844] rounded-lg text-white font-bold outline-none"
                />
              </div>
            </div>
          </div>

          {/* 4. Patch */}
          <div>
            <label className="block font-['Barlow_Condensed'] text-xs font-black tracking-wider uppercase text-white/80 mb-1">
              PATCH (เวอร์ชันเกม / เซิร์ฟเวอร์) <span className="text-[#a82844]">*</span>
            </label>
            <input
              type="text"
              list="patch-options"
              value={patch}
              onChange={(e) => setPatch(e.target.value)}
              placeholder="e.g. Patch 1.56 (Summer 2026)"
              required
              className="w-full px-3 py-2 bg-black/50 border border-white/15 focus:border-[#d4a857] rounded-lg text-white font-medium outline-none transition-colors"
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
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white font-['Barlow_Condensed'] font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#a82844] to-[#ff476e] hover:brightness-110 text-white font-['Orbitron'] font-bold text-xs tracking-wider shadow-[0_0_15px_rgba(168,40,68,0.5)] transition-all cursor-pointer flex items-center gap-1.5"
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
