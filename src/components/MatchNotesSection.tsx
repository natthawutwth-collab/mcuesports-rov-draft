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
    <div className="w-full mt-3 p-4 sm:p-5 rounded-2xl border border-white/15 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(155,109,168,0.16),transparent_75%),radial-gradient(ellipse_80%_40%_at_50%_100%,rgba(168,40,68,0.10),transparent_75%),linear-gradient(180deg,rgba(38,28,52,0.55)_0%,rgba(28,22,38,0.55)_45%,rgba(35,25,42,0.55)_100%)] border-t-[3px] border-t-[#9b3a55] shadow-2xl backdrop-blur-md">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3 pb-3 mb-4 border-b border-white/10 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="font-['Orbitron'] font-extrabold text-[14.5px] sm:text-[16px] tracking-[3px] text-white flex items-center gap-2">
            <span>🎮</span>
            <span>MATCH NOTES — HEROS</span>
          </div>
          {games.length > 0 && (
            <div className="flex items-center gap-2 font-['Orbitron'] text-xs font-bold px-2.5 py-1 rounded bg-black/40 border border-white/10">
              <span className="text-sky-400">{usWins}</span>
              <span className="text-white/40">:</span>
              <span className="text-red-400">{oppWins}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {games.length > 0 && (
            <button
              onClick={onClearAllGames}
              className="font-['Barlow_Condensed'] text-[11px] font-bold tracking-wider text-red-300 hover:text-white bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 px-3 py-1.5 rounded cursor-pointer transition-colors flex items-center gap-1"
            >
              <Trash2 size={12} />
              <span>ล้างทั้งหมด</span>
            </button>
          )}

          <button
            onClick={onAddEmptyGame}
            disabled={games.length >= 7}
            className="font-['Barlow_Condensed'] text-[11px] font-extrabold tracking-wider text-white bg-[#a82844]/30 hover:bg-[#a82844]/50 disabled:opacity-40 border border-[#a82844] px-3.5 py-1.5 rounded cursor-pointer transition-colors flex items-center gap-1 shadow-sm"
          >
            <Plus size={13} />
            <span>＋ เพิ่มเกม (สูงสุด G7)</span>
          </button>
        </div>
      </div>

      {/* Games List */}
      <div className="flex flex-col gap-3">
        {games.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-black/30 border border-white/5 font-['Kanit'] text-sm text-[#a0a0a8]">
            <span>ยังไม่มีข้อมูลเกมใน Match Notes</span>
            <div className="text-xs text-white/40 mt-1">
              กดปุ่ม <strong className="text-white/80">"💾 บันทึก Match Note"</strong> บนหัวดราฟ หรือกด{' '}
              <strong className="text-white/80">"＋ เพิ่มเกม"</strong> เพื่อเริ่มบันทึกซีรีส์แข่งขัน
            </div>
          </div>
        ) : (
          games.map((g) => {
            const isUsBlue = g.usSide === 'blue';

            return (
              <div
                key={g.id}
                className="relative rounded-xl overflow-hidden border border-white/10 bg-[rgba(13,13,18,0.65)] hover:border-white/20 transition-all p-3 shadow-md"
              >
                {/* Game Top Details */}
                <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-white/10 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="font-['Orbitron'] font-black text-sm text-[#d4a857] px-2 py-0.5 rounded bg-black/40 border border-[#d4a857]/40">
                      G{g.gameNum}
                    </span>
                    <span className="font-['Barlow_Condensed'] font-bold text-xs text-white/70">
                      {isUsBlue ? 'US (Blue) vs OPP (Red)' : 'US (Red) vs OPP (Blue)'}
                    </span>
                  </div>

                  {/* Win / Loss Selector */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onUpdateWinner(g.id, 'us')}
                      className={`font-['Barlow_Condensed'] text-xs font-bold px-2.5 py-1 rounded border transition-colors flex items-center gap-1 ${
                        g.winner === 'us'
                          ? 'bg-emerald-600/40 border-emerald-500 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                          : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                      }`}
                    >
                      <Trophy size={12} className={g.winner === 'us' ? 'text-emerald-400' : ''} />
                      <span>US WIN</span>
                    </button>

                    <button
                      onClick={() => onUpdateWinner(g.id, 'opp')}
                      className={`font-['Barlow_Condensed'] text-xs font-bold px-2.5 py-1 rounded border transition-colors flex items-center gap-1 ${
                        g.winner === 'opp'
                          ? 'bg-red-600/40 border-red-500 text-red-200 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                          : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                      }`}
                    >
                      <Award size={12} className={g.winner === 'opp' ? 'text-red-400' : ''} />
                      <span>OPP WIN</span>
                    </button>

                    <button
                      onClick={() => onDeleteGame(g.id)}
                      title="ลบเกมนี้"
                      className="p-1 rounded hover:bg-red-500/20 text-white/40 hover:text-red-300 transition-colors ml-2"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Grid: US Side vs OPP Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* US Column */}
                  <div
                    className={`p-2.5 rounded-lg border flex flex-col gap-2 ${
                      isUsBlue
                        ? 'bg-sky-950/20 border-sky-500/20'
                        : 'bg-red-950/20 border-red-500/20'
                    }`}
                  >
                    <div className="flex items-center justify-between font-['Barlow_Condensed'] text-xs font-bold text-sky-300">
                      <span>🔵 {usLabel}</span>
                      <span className="text-[10px] text-white/40">US PICKS & BANS</span>
                    </div>

                    {/* Bans */}
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-['Barlow_Condensed'] font-bold text-red-400/80 mr-1 uppercase">
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
                            className="w-7 h-7 rounded border border-red-500/30 bg-black/50 overflow-hidden cursor-pointer flex items-center justify-center relative hover:border-red-400 transition-colors"
                            title={heroName ? `Ban: ${heroName}` : 'คลิกเพื่อเลือก Ban'}
                          >
                            {img ? (
                              <img src={img} alt={heroName} className="w-full h-full object-cover opacity-60 grayscale-[0.6]" />
                            ) : (
                              <span className="text-[9px] font-bold text-white/30">B{bIdx + 1}</span>
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
                            className={`flex flex-col items-center p-1 rounded border bg-black/40 cursor-pointer hover:border-white/40 transition-all ${pos.color}`}
                            title={heroName ? `${pos.label}: ${heroName}` : `เลือกฮีโร่ตำแหน่ง ${pos.label}`}
                          >
                            <span className="text-[8px] font-['Barlow_Condensed'] font-bold text-white/60 mb-0.5">
                              {pos.label}
                            </span>
                            <div className="w-8 h-8 rounded overflow-hidden bg-black/60 flex items-center justify-center">
                              {img ? (
                                <img src={img} alt={heroName} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[10px] text-white/20">—</span>
                              )}
                            </div>
                            <span className="text-[9px] font-['Barlow_Condensed'] font-bold text-white truncate w-full text-center mt-0.5">
                              {heroName || '—'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* OPP Column */}
                  <div
                    className={`p-2.5 rounded-lg border flex flex-col gap-2 ${
                      !isUsBlue
                        ? 'bg-sky-950/20 border-sky-500/20'
                        : 'bg-red-950/20 border-red-500/20'
                    }`}
                  >
                    <div className="flex items-center justify-between font-['Barlow_Condensed'] text-xs font-bold text-red-300">
                      <span>🔴 {oppLabel}</span>
                      <span className="text-[10px] text-white/40">OPP PICKS & BANS</span>
                    </div>

                    {/* Bans */}
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-['Barlow_Condensed'] font-bold text-red-400/80 mr-1 uppercase">
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
                            className="w-7 h-7 rounded border border-red-500/30 bg-black/50 overflow-hidden cursor-pointer flex items-center justify-center relative hover:border-red-400 transition-colors"
                            title={heroName ? `Ban: ${heroName}` : 'คลิกเพื่อเลือก Ban'}
                          >
                            {img ? (
                              <img src={img} alt={heroName} className="w-full h-full object-cover opacity-60 grayscale-[0.6]" />
                            ) : (
                              <span className="text-[9px] font-bold text-white/30">R{bIdx + 1}</span>
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
                            className={`flex flex-col items-center p-1 rounded border bg-black/40 cursor-pointer hover:border-white/40 transition-all ${pos.color}`}
                            title={heroName ? `${pos.label}: ${heroName}` : `เลือกฮีโร่ตำแหน่ง ${pos.label}`}
                          >
                            <span className="text-[8px] font-['Barlow_Condensed'] font-bold text-white/60 mb-0.5">
                              {pos.label}
                            </span>
                            <div className="w-8 h-8 rounded overflow-hidden bg-black/60 flex items-center justify-center">
                              {img ? (
                                <img src={img} alt={heroName} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[10px] text-white/20">—</span>
                              )}
                            </div>
                            <span className="text-[9px] font-['Barlow_Condensed'] font-bold text-white truncate w-full text-center mt-0.5">
                              {heroName || '—'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Game Note Textarea */}
                <div className="mt-2.5 pt-2 border-t border-white/5">
                  <input
                    type="text"
                    value={g.note}
                    onChange={(e) => onUpdateNote(g.id, e.target.value)}
                    placeholder={`โน้ตสถิติ / กลยุทธ์สำหรับ Game ${g.gameNum} (เช่น: โดนส่องเลนบนต้นเกม, อัลเลนแก๊งค์ป่าได้ดี)...`}
                    className="w-full bg-black/30 border border-white/10 hover:border-white/20 focus:border-[#a82844] text-white placeholder-white/30 text-xs font-['Kanit'] px-3 py-1.5 rounded-lg outline-none transition-colors"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Series Notes: US & OPP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-3 border-t border-white/10">
        <div className="flex flex-col gap-1.5">
          <label className="font-['Barlow_Condensed'] text-xs font-bold tracking-wider text-sky-300">
            📝 SERIES NOTES — {usLabel}
          </label>
          <textarea
            rows={3}
            value={blueSeriesNote}
            onChange={(e) => setBlueSeriesNote(e.target.value)}
            placeholder="จดบันทึกภาพรวมทีมเราในซีรีส์นี้ (เช่น ฮีโร่ที่ยังไม่ได้หยิบ, กลยุทธ์เกมถัดไป)..."
            className="w-full bg-black/30 border border-white/10 hover:border-white/20 focus:border-sky-400 text-white placeholder-white/30 text-xs font-['Kanit'] p-2.5 rounded-lg outline-none transition-colors resize-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-['Barlow_Condensed'] text-xs font-bold tracking-wider text-red-300">
            📝 SERIES NOTES — {oppLabel}
          </label>
          <textarea
            rows={3}
            value={redSeriesNote}
            onChange={(e) => setRedSeriesNote(e.target.value)}
            placeholder="จดบันทึกแผนและจุดอ่อนของคู่แข่ง (เช่น ชอบแย่งป่าเกม 1, ระวังฮายาเตะเกมท้าย)..."
            className="w-full bg-black/30 border border-white/10 hover:border-white/20 focus:border-red-400 text-white placeholder-white/30 text-xs font-['Kanit'] p-2.5 rounded-lg outline-none transition-colors resize-none"
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
