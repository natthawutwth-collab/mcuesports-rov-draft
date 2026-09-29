import React, { useState } from 'react';
import { MatchNoteGame, Hero } from '../types/draft';
import { HERO_IMG_MAP, HERO_IMG_OVERRIDE } from '../data/heroes';
import { HeroPickerModal } from './HeroPickerModal';
import { Trash2, Plus, Trophy, Award, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [isCollapsed, setIsCollapsed] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 840 : false
  );

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
    <div className="w-full mt-2.5 sm:mt-4 p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 border-[#F3D5E2] bg-white shadow-md font-['Prompt'] text-[#1F2937]">
      {/* Top Bar */}
      <div className={`flex items-center justify-between gap-2 sm:gap-3 ${isCollapsed ? '' : 'pb-2 sm:pb-3 mb-3 sm:mb-4 border-b-2 border-[#F3D5E2]'} flex-wrap`}>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="font-['Prompt'] font-bold text-xs sm:text-base tracking-wide text-[#1F2937] flex items-center gap-1.5 sm:gap-2">
            <span className="text-sm sm:text-lg">🎮</span>
            <span>
              <span className="text-[#E91E63]">MATCH NOTES</span>{' '}
              <span className="text-slate-300 hidden sm:inline">—</span>{' '}
              <span className="text-[#B45309] hidden sm:inline">SERIES LOG</span>
            </span>
          </div>
          {games.length > 0 && (
            <div className="flex items-center gap-1.5 sm:gap-2 font-['Prompt'] text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-lg bg-[#FFF0F5] border border-[#F3D5E2] shadow-2xs">
              <span className="text-[#0284c7]">{usWins}</span>
              <span className="text-slate-400">:</span>
              <span className="text-[#e11d48]">{oppWins}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2 ml-auto">
          {!isCollapsed && games.length > 0 && (
            <button
              onClick={onClearAllGames}
              className="font-['Prompt'] text-[10.5px] sm:text-[11.5px] font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-300 px-2.5 py-1 rounded-lg cursor-pointer transition-colors flex items-center gap-1 shadow-2xs"
            >
              <Trash2 size={12} />
              <span>ล้าง</span>
            </button>
          )}

          {!isCollapsed && (
            <button
              onClick={onAddEmptyGame}
              disabled={games.length >= 7}
              className="font-['Prompt'] text-[10.5px] sm:text-[11.5px] font-bold text-white bg-[#E91E63] hover:bg-[#D81B60] disabled:opacity-40 border border-[#E91E63] px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg cursor-pointer transition-all flex items-center gap-1 shadow-xs active:scale-95"
            >
              <Plus size={13} className="stroke-[3]" />
              <span>＋ เพิ่มเกม</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#F3D5E2] hover:border-[#E91E63] text-slate-700 hover:text-[#E91E63] text-[10.5px] sm:text-[11.5px] font-['Prompt'] font-bold cursor-pointer transition-all shadow-2xs"
          >
            <span>{isCollapsed ? 'แสดง' : 'ซ่อน'}</span>
            {isCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Games List */}
      <div className="flex flex-col gap-3.5">
        {games.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-[#FFF8FB] border border-[#F3D5E2] font-['Prompt'] text-sm text-slate-500 shadow-xs">
            <span className="text-base font-bold text-slate-800">ยังไม่มีข้อมูลเกมใน Match Notes</span>
            <div className="text-xs text-slate-500 mt-1">
              กดปุ่ม <strong className="text-[#E91E63]">"MATCH NOTE"</strong> บนแถบเครื่องมือดราฟ หรือกด{' '}
              <strong className="text-[#E91E63]">"＋ เพิ่มเกมใหม่"</strong> เพื่อบันทึกผลการแข่งขันและแบน/พิคแต่ละเกม
            </div>
          </div>
        ) : (
          games.map((g) => {
            const isUsBlue = g.usSide === 'blue';

            return (
              <div
                key={g.id}
                className="relative rounded-2xl overflow-hidden border border-[#F3D5E2] bg-white hover:border-[#E91E63] transition-all p-3.5 shadow-xs"
              >
                {/* Game Top Details */}
                <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-[#F3D5E2] flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <span className="font-['Prompt'] font-bold text-xs text-[#E91E63] px-2.5 py-1 rounded-md bg-[#FFF0F5] border border-[#F48FB1] shadow-2xs">
                      G{g.gameNum}
                    </span>
                    <span className="font-['Prompt'] font-bold text-[13px] text-slate-800">
                      {isUsBlue ? '🔵 US (BLUE) vs 🔴 OPP (RED)' : '🔴 US (RED) vs 🔵 OPP (BLUE)'}
                    </span>
                  </div>

                  {/* Win / Loss Selector */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateWinner(g.id, 'us')}
                      className={`font-['Prompt'] text-xs font-bold px-3 py-1 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                        g.winner === 'us'
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Trophy size={13} className={g.winner === 'us' ? 'text-white' : 'text-slate-400'} />
                      <span>US WIN (ชนะ)</span>
                    </button>

                    <button
                      onClick={() => onUpdateWinner(g.id, 'opp')}
                      className={`font-['Prompt'] text-xs font-bold px-3 py-1 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                        g.winner === 'opp'
                          ? 'bg-[#e11d48] border-[#e11d48] text-white shadow-xs'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Award size={13} className={g.winner === 'opp' ? 'text-white' : 'text-slate-400'} />
                      <span>OPP WIN (แพ้)</span>
                    </button>

                    <button
                      onClick={() => onDeleteGame(g.id)}
                      title="ลบเกมนี้"
                      className="p-1.5 rounded-lg hover:bg-rose-50 border border-transparent hover:border-rose-300 text-slate-400 hover:text-rose-600 transition-colors ml-2 cursor-pointer shadow-2xs"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Grid: US Side vs OPP Side - Clear Compartments */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* US Column */}
                  <div
                    className={`p-3 rounded-xl border-2 flex flex-col gap-2.5 shadow-2xs ${
                      isUsBlue
                        ? 'bg-sky-50/60 border-sky-300'
                        : 'bg-rose-50/60 border-rose-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-['Prompt'] text-[13px] font-bold">
                      <span className={isUsBlue ? 'text-sky-800' : 'text-rose-800'}>
                        {isUsBlue ? '🔵' : '🔴'} {usLabel}
                      </span>
                      <span className="text-[10.5px] font-semibold text-slate-500 tracking-wider">
                        OUR TEAM DRAFT
                      </span>
                    </div>

                    {/* Bans */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-['Prompt'] font-bold text-rose-700 mr-1 uppercase">
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
                            className="w-8 h-8 rounded-lg border-2 border-rose-300 bg-white overflow-hidden cursor-pointer flex items-center justify-center relative hover:border-rose-500 transition-all shadow-2xs"
                            title={heroName ? `Ban: ${heroName}` : 'คลิกเพื่อเลือก Ban'}
                          >
                            {heroName && img ? (
                              <img src={img} alt={heroName} className="w-full h-full object-cover opacity-70 grayscale-[0.3]" />
                            ) : (
                              <span className="text-[9.5px] font-bold text-slate-400 font-['Prompt']">B{bIdx + 1}</span>
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
                            className="flex flex-col items-center p-1.5 rounded-lg border-2 bg-white cursor-pointer hover:border-[#E91E63] transition-all shadow-2xs border-[#F3D5E2]"
                            title={heroName ? `${pos.label}: ${heroName}` : `เลือกฮีโร่ตำแหน่ง ${pos.label}`}
                          >
                            <span className="text-[9px] font-['Prompt'] font-bold text-slate-500 mb-0.5">
                              {pos.label}
                            </span>
                            <div className="w-8 h-8 rounded-md overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200">
                              {heroName && img ? (
                                <img src={img} alt={heroName} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[10px] text-slate-400 font-bold">—</span>
                              )}
                            </div>
                            <span className="text-[9.5px] font-['Prompt'] font-bold text-slate-800 truncate w-full text-center mt-1">
                              {heroName || '—'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* OPP Column */}
                  <div
                    className={`p-3 rounded-xl border-2 flex flex-col gap-2.5 shadow-2xs ${
                      !isUsBlue
                        ? 'bg-sky-50/60 border-sky-300'
                        : 'bg-rose-50/60 border-rose-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-['Prompt'] text-[13px] font-bold">
                      <span className={!isUsBlue ? 'text-sky-800' : 'text-rose-800'}>
                        {!isUsBlue ? '🔵' : '🔴'} {oppLabel}
                      </span>
                      <span className="text-[10.5px] font-semibold text-slate-500 tracking-wider">
                        OPPONENT DRAFT
                      </span>
                    </div>

                    {/* Bans */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-['Prompt'] font-bold text-rose-700 mr-1 uppercase">
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
                            className="w-8 h-8 rounded-lg border-2 border-rose-300 bg-white overflow-hidden cursor-pointer flex items-center justify-center relative hover:border-rose-500 transition-all shadow-2xs"
                            title={heroName ? `Ban: ${heroName}` : 'คลิกเพื่อเลือก Ban'}
                          >
                            {heroName && img ? (
                              <img src={img} alt={heroName} className="w-full h-full object-cover opacity-70 grayscale-[0.3]" />
                            ) : (
                              <span className="text-[9.5px] font-bold text-slate-400 font-['Prompt']">R{bIdx + 1}</span>
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
                            className="flex flex-col items-center p-1.5 rounded-lg border-2 bg-white cursor-pointer hover:border-[#E91E63] transition-all shadow-2xs border-[#F3D5E2]"
                            title={heroName ? `${pos.label}: ${heroName}` : `เลือกฮีโร่ตำแหน่ง ${pos.label}`}
                          >
                            <span className="text-[9px] font-['Prompt'] font-bold text-slate-500 mb-0.5">
                              {pos.label}
                            </span>
                            <div className="w-8 h-8 rounded-md overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200">
                              {heroName && img ? (
                                <img src={img} alt={heroName} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[10px] text-slate-400 font-bold">—</span>
                              )}
                            </div>
                            <span className="text-[9.5px] font-['Prompt'] font-bold text-slate-800 truncate w-full text-center mt-1">
                              {heroName || '—'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Notes Input Area for this Game */}
                <div className="mt-3 pt-2.5 border-t border-[#F3D5E2]">
                  <input
                    type="text"
                    value={g.note || ''}
                    onChange={(e) => onUpdateNote(g.id, e.target.value)}
                    placeholder={`📝 โน้ตแท็กติก / ข้อผิดพลาด Game ${g.gameNum} (เช่น แพ้เพราะไฟต์เลน Dark Slayer, โดนล้วงแครี่...)`}
                    className="w-full bg-[#FFF8FB] border border-[#F3D5E2] hover:border-[#E91E63] focus:border-[#E91E63] text-[#1F2937] placeholder-slate-400 text-xs font-['Prompt'] px-3 py-1.5 rounded-lg outline-none transition-colors shadow-2xs"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Series Notes: US & OPP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-4 pt-3.5 border-t-2 border-[#F3D5E2]">
        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-sky-50/60 border-2 border-sky-300 shadow-2xs">
          <label className="font-['Prompt'] text-xs font-bold tracking-wide text-sky-900 flex items-center gap-1.5">
            <span>📝</span>
            <span>SERIES NOTES — {usLabel}</span>
          </label>
          <textarea
            rows={3}
            value={blueSeriesNote}
            onChange={(e) => setBlueSeriesNote(e.target.value)}
            placeholder="จดบันทึกภาพรวมทีมเราในซีรีส์นี้ (เช่น ฮีโร่ที่ยังไม่ได้หยิบ, กลยุทธ์เกมถัดไป)..."
            className="w-full bg-white border border-sky-300 hover:border-sky-500 focus:border-[#0284c7] text-[#1F2937] placeholder-slate-400 text-xs font-['Prompt'] p-2.5 rounded-lg outline-none transition-colors resize-none shadow-2xs"
          />
        </div>

        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-rose-50/60 border-2 border-rose-300 shadow-2xs">
          <label className="font-['Prompt'] text-xs font-bold tracking-wide text-rose-900 flex items-center gap-1.5">
            <span>📝</span>
            <span>SERIES NOTES — {oppLabel}</span>
          </label>
          <textarea
            rows={3}
            value={redSeriesNote}
            onChange={(e) => setRedSeriesNote(e.target.value)}
            placeholder="จดบันทึกแผนและจุดอ่อนของคู่แข่ง (เช่น ชอบแย่งป่าเกม 1, ระวังฮายาเตะเกมท้าย)..."
            className="w-full bg-white border border-rose-300 hover:border-rose-500 focus:border-[#e11d48] text-[#1F2937] placeholder-slate-400 text-xs font-['Prompt'] p-2.5 rounded-lg outline-none transition-colors resize-none shadow-2xs"
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
        </>
      )}
    </div>
  );
};
