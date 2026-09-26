import React, { useState } from 'react';
import { MatchNoteGame, Hero } from '../types/draft';
import { HERO_IMG_MAP, HERO_IMG_OVERRIDE } from '../data/heroes';
import { HeroPickerModal } from './HeroPickerModal';
import { Trash2, Plus, Trophy, Award } from 'lucide-react';

interface MatchNotesSectionProps {
  games: MatchNoteGame[];
  blueTeamName: string;
  redTeamName: string;
  blueIsUs: boolean;
  blueSeriesNote: string;
  setBlueSeriesNote: (note: string) => void;
  redSeriesNote: string;
  setRedSeriesNote: (note: string) => void;
  onAddEmptyGame: () => void;
  onClearAllGames: () => void;
  onUpdateWinner: (gameId: string, winner: 'us' | 'opp' | null) => void;
  onUpdateNote: (gameId: string, note: string) => void;
  onUpdateSlot: (
    gameId: string,
    team: 'us' | 'opp',
    slotType: 'ban' | 'pick',
    slotKey: string,
    heroName: string
  ) => void;
  onDeleteGame: (gameId: string) => void;
}

function getHeroImg(name: string): string {
  if (!name) return '';
  if (HERO_IMG_OVERRIDE[name]) return HERO_IMG_OVERRIDE[name];
  return `https://res.cloudinary.com/dtzdhbllb/image/upload/${HERO_IMG_MAP[name] || name}.jpg`;
}

const POSITIONS = [
  { key: 'dsl', label: 'DSL', color: 'border-[#c47842]' },
  { key: 'jg', label: 'JG', color: 'border-[#5a8a6a]' },
  { key: 'mid', label: 'MID', color: 'border-[#9b6da8]' },
  { key: 'roam', label: 'SUP', color: 'border-[#6b8fb8]' },
  { key: 'adl', label: 'ADL', color: 'border-[#d4a857]' },
] as const;

export const MatchNotesSection: React.FC<MatchNotesSectionProps> = ({
  games,
  blueTeamName,
  redTeamName,
  blueIsUs,
  blueSeriesNote,
  setBlueSeriesNote,
  redSeriesNote,
  setRedSeriesNote,
  onAddEmptyGame,
  onClearAllGames,
  onUpdateWinner,
  onUpdateNote,
  onUpdateSlot,
  onDeleteGame,
}) => {
  // Modal State for slot editing
  const [pickerTarget, setPickerTarget] = useState<{
    gameId: string;
    team: 'us' | 'opp';
    slotType: 'ban' | 'pick';
    slotKey: string;
  } | null>(null);

  const usLabel = blueIsUs ? blueTeamName || 'US (BLUE)' : redTeamName || 'US (RED)';
  const oppLabel = blueIsUs ? redTeamName || 'OPP (RED)' : blueTeamName || 'OPP (BLUE)';

  const usWins = games.filter((g) => g.winner === 'us').length;
  const oppWins = games.filter((g) => g.winner === 'opp').length;

  return (
    <div className="w-full mt-4 p-4 sm:p-5 rounded-2xl border-2 border-slate-700/80 bg-[#0a0c14]/95 shadow-2xl backdrop-blur-md">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3 pb-3 mb-4 border-b-2 border-slate-700/80 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="font-['Orbitron'] font-black text-[15px] sm:text-[17px] tracking-[3px] text-white flex items-center gap-2">
            <span className="text-lg">🎮</span>
            <span>
              <span className="text-[#38bdf8]">MATCH NOTES</span> — <span className="text-[#fbbf24]">SERIES LOG</span>
            </span>
          </div>
          {games.length > 0 && (
            <div className="flex items-center gap-2 font-['Orbitron'] text-xs font-black px-3 py-1 rounded-lg bg-black/60 border border-slate-700 shadow-inner">
              <span className="text-[#38bdf8]">{usWins}</span>
              <span className="text-slate-400">:</span>
              <span className="text-[#f43f5e]">{oppWins}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {games.length > 0 && (
            <button
              onClick={onClearAllGames}
              className="font-['Barlow_Condensed'] text-[11px] font-black tracking-wider text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-700/50 px-3 py-1.5 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Trash2 size={13} />
              <span>ล้างทั้งหมด</span>
            </button>
          )}

          <button
            onClick={onAddEmptyGame}
            disabled={games.length >= 7}
            className="font-['Barlow_Condensed'] text-[11.5px] font-black tracking-wider text-black bg-[#fbbf24] hover:bg-[#fde047] disabled:opacity-40 border border-[#fde047] px-4 py-1.5 rounded-lg cursor-pointer transition-all flex items-center gap-1.5 shadow-md active:scale-95"
          >
            <Plus size={14} className="stroke-[3]" />
            <span>＋ เพิ่มเกมใหม่ (BO3 - BO7)</span>
          </button>
        </div>
      </div>

      {/* Games List */}
      <div className="flex flex-col gap-3.5">
        {games.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-black/40 border border-slate-800 font-['Kanit'] text-sm text-slate-400 shadow-inner">
            <span className="text-base font-semibold text-slate-300">ยังไม่มีข้อมูลเกมใน Match Notes</span>
            <div className="text-xs text-slate-400 mt-1">
              กดปุ่ม <strong className="text-[#fbbf24]">"MATCH NOTE"</strong> บนแถบเครื่องมือดราฟ หรือกด{' '}
              <strong className="text-[#fbbf24]">"＋ เพิ่มเกมใหม่"</strong> เพื่อบันทึกผลการแข่งขันและแบน/พิคแต่ละเกม
            </div>
          </div>
        ) : (
          games.map((g) => {
            const isUsBlue = g.usSide === 'blue';

            return (
              <div
                key={g.id}
                className="relative rounded-2xl overflow-hidden border-2 border-slate-700/80 bg-[#0d101a] hover:border-slate-500 transition-all p-3.5 shadow-lg"
              >
                {/* Game Top Details */}
                <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-slate-700/80 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <span className="font-['Orbitron'] font-black text-sm text-[#fbbf24] px-2.5 py-1 rounded-md bg-black/60 border border-[#fbbf24]/50 shadow-sm">
                      G{g.gameNum}
                    </span>
                    <span className="font-['Barlow_Condensed'] font-black text-[13px] text-slate-200">
                      {isUsBlue ? '🔵 US (BLUE) vs 🔴 OPP (RED)' : '🔴 US (RED) vs 🔵 OPP (BLUE)'}
                    </span>
                  </div>

                  {/* Win / Loss Selector */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateWinner(g.id, 'us')}
                      className={`font-['Barlow_Condensed'] text-xs font-black px-3 py-1 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                        g.winner === 'us'
                          ? 'bg-emerald-500 border-emerald-300 text-black shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                          : 'bg-black/50 border-slate-700 text-slate-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Trophy size={13} className={g.winner === 'us' ? 'text-black' : 'text-slate-400'} />
                      <span>US WIN (ชนะ)</span>
                    </button>

                    <button
                      onClick={() => onUpdateWinner(g.id, 'opp')}
                      className={`font-['Barlow_Condensed'] text-xs font-black px-3 py-1 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                        g.winner === 'opp'
                          ? 'bg-[#e11d48] border-[#f43f5e] text-white shadow-[0_0_12px_rgba(244,63,94,0.5)]'
                          : 'bg-black/50 border-slate-700 text-slate-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Award size={13} className={g.winner === 'opp' ? 'text-white' : 'text-slate-400'} />
                      <span>OPP WIN (แพ้)</span>
                    </button>

                    <button
                      onClick={() => onDeleteGame(g.id)}
                      title="ลบเกมนี้"
                      className="p-1.5 rounded-lg hover:bg-rose-950/60 border border-transparent hover:border-rose-500/50 text-slate-400 hover:text-rose-300 transition-colors ml-2 cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Grid: US Side vs OPP Side - Clear Compartments */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* US Column */}
                  <div
                    className={`p-3 rounded-xl border-2 flex flex-col gap-2.5 shadow-sm ${
                      isUsBlue
                        ? 'bg-[#08182d] border-[#0284c7]/50'
                        : 'bg-[#290a16] border-[#e11d48]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between font-['Barlow_Condensed'] text-[13px] font-black">
                      <span className={isUsBlue ? 'text-[#38bdf8]' : 'text-[#f43f5e]'}>
                        {isUsBlue ? '🔵' : '🔴'} {usLabel}
                      </span>
                      <span className="text-[10.5px] font-bold text-slate-400 tracking-wider">
                        OUR TEAM DRAFT
                      </span>
                    </div>

                    {/* Bans */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9.5px] font-['Barlow_Condensed'] font-black text-rose-400 mr-1 uppercase">
                        BANS:
                      </span>
                      {([0, 1, 2, 3] as const).map((bIdx) => {
                        const heroName = g.usBans[bIdx] || '';
                        const img = getHeroImg(heroName);

                        return (
                          <div
                            key={`us-ban-${bIdx}`}
                            onClick={() =>
                              setPickerTarget({
                                gameId: g.id,
                                team: 'us',
                                slotType: 'ban',
                                slotKey: String(bIdx),
                              })
                            }
                            className="w-8 h-8 rounded-lg border-2 border-rose-600/50 bg-black/60 overflow-hidden cursor-pointer flex items-center justify-center relative hover:border-rose-400 transition-all shadow-sm"
                            title={heroName ? `Ban: ${heroName}` : 'คลิกเพื่อเลือก Ban'}
                          >
                            {img ? (
                              <img src={img} alt={heroName} className="w-full h-full object-cover opacity-60 grayscale-[0.5]" />
                            ) : (
                              <span className="text-[9.5px] font-black text-slate-500 font-['Orbitron']">B{bIdx + 1}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Picks */}
                    <div className="grid grid-cols-5 gap-1.5 pt-1">
                      {POSITIONS.map((pos) => {
                        const heroName = g.usPicks[pos.key as keyof typeof g.usPicks] || '';
                        const img = getHeroImg(heroName);

                        return (
                          <div
                            key={`us-pick-${pos.key}`}
                            onClick={() =>
                              setPickerTarget({
                                gameId: g.id,
                                team: 'us',
                                slotType: 'pick',
                                slotKey: pos.key,
                              })
                            }
                            className={`flex flex-col items-center p-1.5 rounded-lg border-2 bg-black/60 cursor-pointer hover:border-white/60 transition-all shadow-sm ${pos.color}`}
                            title={heroName ? `${pos.label}: ${heroName}` : `เลือกฮีโร่ตำแหน่ง ${pos.label}`}
                          >
                            <span className="text-[8.5px] font-['Barlow_Condensed'] font-black text-slate-300 mb-0.5">
                              {pos.label}
                            </span>
                            <div className="w-8 h-8 rounded-md overflow-hidden bg-black/80 flex items-center justify-center border border-white/10">
                              {img ? (
                                <img src={img} alt={heroName} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[10px] text-slate-600 font-bold">—</span>
                              )}
                            </div>
                            <span className="text-[9.5px] font-['Barlow_Condensed'] font-black text-white truncate w-full text-center mt-1">
                              {heroName || '—'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* OPP Column */}
                  <div
                    className={`p-3 rounded-xl border-2 flex flex-col gap-2.5 shadow-sm ${
                      !isUsBlue
                        ? 'bg-[#08182d] border-[#0284c7]/50'
                        : 'bg-[#290a16] border-[#e11d48]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between font-['Barlow_Condensed'] text-[13px] font-black">
                      <span className={!isUsBlue ? 'text-[#38bdf8]' : 'text-[#f43f5e]'}>
                        {!isUsBlue ? '🔵' : '🔴'} {oppLabel}
                      </span>
                      <span className="text-[10.5px] font-bold text-slate-400 tracking-wider">
                        OPPONENT DRAFT
                      </span>
                    </div>

                    {/* Bans */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9.5px] font-['Barlow_Condensed'] font-black text-rose-400 mr-1 uppercase">
                        BANS:
                      </span>
                      {([0, 1, 2, 3] as const).map((bIdx) => {
                        const heroName = g.oppBans[bIdx] || '';
                        const img = getHeroImg(heroName);

                        return (
                          <div
                            key={`opp-ban-${bIdx}`}
                            onClick={() =>
                              setPickerTarget({
                                gameId: g.id,
                                team: 'opp',
                                slotType: 'ban',
                                slotKey: String(bIdx),
                              })
                            }
                            className="w-8 h-8 rounded-lg border-2 border-rose-600/50 bg-black/60 overflow-hidden cursor-pointer flex items-center justify-center relative hover:border-rose-400 transition-all shadow-sm"
                            title={heroName ? `Ban: ${heroName}` : 'คลิกเพื่อเลือก Ban'}
                          >
                            {img ? (
                              <img src={img} alt={heroName} className="w-full h-full object-cover opacity-60 grayscale-[0.5]" />
                            ) : (
                              <span className="text-[9.5px] font-black text-slate-500 font-['Orbitron']">R{bIdx + 1}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Picks */}
                    <div className="grid grid-cols-5 gap-1.5 pt-1">
                      {POSITIONS.map((pos) => {
                        const heroName = g.oppPicks[pos.key as keyof typeof g.oppPicks] || '';
                        const img = getHeroImg(heroName);

                        return (
                          <div
                            key={`opp-pick-${pos.key}`}
                            onClick={() =>
                              setPickerTarget({
                                gameId: g.id,
                                team: 'opp',
                                slotType: 'pick',
                                slotKey: pos.key,
                              })
                            }
                            className={`flex flex-col items-center p-1.5 rounded-lg border-2 bg-black/60 cursor-pointer hover:border-white/60 transition-all shadow-sm ${pos.color}`}
                            title={heroName ? `${pos.label}: ${heroName}` : `เลือกฮีโร่ตำแหน่ง ${pos.label}`}
                          >
                            <span className="text-[8.5px] font-['Barlow_Condensed'] font-black text-slate-300 mb-0.5">
                              {pos.label}
                            </span>
                            <div className="w-8 h-8 rounded-md overflow-hidden bg-black/80 flex items-center justify-center border border-white/10">
                              {img ? (
                                <img src={img} alt={heroName} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[10px] text-slate-600 font-bold">—</span>
                              )}
                            </div>
                            <span className="text-[9.5px] font-['Barlow_Condensed'] font-black text-white truncate w-full text-center mt-1">
                              {heroName || '—'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Notes Input Area for this Game */}
                <div className="mt-3 pt-2.5 border-t border-slate-700/80">
                  <input
                    type="text"
                    value={g.note || ''}
                    onChange={(e) => onUpdateNote(g.id, e.target.value)}
                    placeholder={`📝 โน้ตแท็กติก / ข้อผิดพลาด Game ${g.gameNum} (เช่น แพ้เพราะไฟต์เลน Dark Slayer, โดนล้วงแครี่...)`}
                    className="w-full bg-black/50 border border-slate-700 hover:border-slate-500 focus:border-[#fbbf24] text-white placeholder-slate-400 text-xs font-['Kanit'] px-3 py-1.5 rounded-lg outline-none transition-colors"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Series Notes: US & OPP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-4 pt-3.5 border-t-2 border-slate-700/80">
        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-[#08182d] border-2 border-[#0284c7]/50 shadow-sm">
          <label className="font-['Barlow_Condensed'] text-xs font-black tracking-wider text-[#38bdf8] flex items-center gap-1.5">
            <span>📝</span>
            <span>SERIES NOTES — {usLabel}</span>
          </label>
          <textarea
            rows={3}
            value={blueSeriesNote}
            onChange={(e) => setBlueSeriesNote(e.target.value)}
            placeholder="จดบันทึกภาพรวมทีมเราในซีรีส์นี้ (เช่น ฮีโร่ที่ยังไม่ได้หยิบ, กลยุทธ์เกมถัดไป)..."
            className="w-full bg-black/60 border border-slate-700 hover:border-[#38bdf8] focus:border-[#38bdf8] text-white placeholder-slate-400 text-xs font-['Kanit'] p-2.5 rounded-lg outline-none transition-colors resize-none shadow-inner"
          />
        </div>

        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-[#290a16] border-2 border-[#e11d48]/50 shadow-sm">
          <label className="font-['Barlow_Condensed'] text-xs font-black tracking-wider text-[#f43f5e] flex items-center gap-1.5">
            <span>📝</span>
            <span>SERIES NOTES — {oppLabel}</span>
          </label>
          <textarea
            rows={3}
            value={redSeriesNote}
            onChange={(e) => setRedSeriesNote(e.target.value)}
            placeholder="จดบันทึกแผนและจุดอ่อนของคู่แข่ง (เช่น ชอบแย่งป่าเกม 1, ระวังฮายาเตะเกมท้าย)..."
            className="w-full bg-black/60 border border-slate-700 hover:border-[#f43f5e] focus:border-[#f43f5e] text-white placeholder-slate-400 text-xs font-['Kanit'] p-2.5 rounded-lg outline-none transition-colors resize-none shadow-inner"
          />
        </div>
      </div>

      {/* Hero Picker Modal */}
      {pickerTarget && (
        <HeroPickerModal
          isOpen={true}
          onClose={() => setPickerTarget(null)}
          title={`เลือก Hero สำหรับ ${pickerTarget.team.toUpperCase()} (${pickerTarget.slotType.toUpperCase()} ${pickerTarget.slotKey})`}
          onSelect={(hero: Hero) => {
            onUpdateSlot(
              pickerTarget.gameId,
              pickerTarget.team,
              pickerTarget.slotType,
              pickerTarget.slotKey,
              hero.name
            );
          }}
        />
      )}
    </div>
  );
};
