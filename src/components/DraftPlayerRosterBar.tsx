import React from 'react';
import { Player, TeamCategory } from '../types/player';
import { Hero, TeamSide } from '../types/draft';
import { HEROES, getHeroImageUrl } from '../data/heroes';
import { Star, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';

interface DraftPlayerRosterBarProps {
  players: Player[];
  selectedCategory: TeamCategory;
  onChangeCategory?: (cat: TeamCategory) => void;
  isOpen: boolean;
  onToggleOpen?: () => void;
  onInspectHero?: (heroName: string) => void;
  onSelectHeroDirectly?: (hero: Hero) => void;
  onAssignPlayerToActiveSlot?: (player: Player) => void;
  currentTurnSlot?: {
    team: TeamSide;
    phase: 'ban' | 'pick';
    index: number;
  } | null;
}

const POS_ORDER = ['DSL', 'Jungle', 'Mid', 'Support', 'ADL'];

export const DraftPlayerRosterBar: React.FC<DraftPlayerRosterBarProps> = ({
  players,
  selectedCategory,
  onChangeCategory: _onChangeCategory,
  isOpen,
  onToggleOpen: _onToggleOpen,
  onInspectHero,
  onSelectHeroDirectly,
  onAssignPlayerToActiveSlot,
  currentTurnSlot,
}) => {
  // Filter players by category
  const filteredPlayers = React.useMemo(() => {
    let list = players;
    if (selectedCategory !== 'all') {
      list = players.filter((p) => {
        const cats = p.categories || [p.category || 'male'];
        return cats.includes(selectedCategory);
      });
    }
    // Sort by role order
    return [...list].sort((a, b) => {
      const idxA = POS_ORDER.indexOf(a.position);
      const idxB = POS_ORDER.indexOf(b.position);
      return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
    });
  }, [players, selectedCategory]);

  const canAssign = Boolean(currentTurnSlot && currentTurnSlot.phase === 'pick');

  if (!isOpen) {
    return null;
  }

  return (
    <div className="w-full bg-white border-2 border-[#F3D5E2] rounded-xl sm:rounded-2xl shadow-md overflow-hidden transition-all font-['Prompt']">
      {/* Quick Status / Assignment Tip */}
      {canAssign && (
        <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#FFF0F5] border-b border-[#F3D5E2] text-xs font-['Prompt'] text-[#E91E63]">
          <span className="flex items-center gap-1.5 font-bold animate-pulse">
            🎯 คลิก "กำหนดลงช่อง" เพื่อระบุนักแข่งในช่องดราฟ ({currentTurnSlot?.team.toUpperCase()} Pick {currentTurnSlot ? currentTurnSlot.index + 1 : ''})
          </span>
          <span className="text-[10.5px] text-slate-500 font-bold">
            ROSTER POOL ({filteredPlayers.length})
          </span>
        </div>
      )}

      {/* 2. Player Roster Cards */}
      <div className="p-2 sm:p-3 bg-[#FFF8FB] overflow-x-auto custom-scrollbar">
          {filteredPlayers.length === 0 ? (
            <div className="text-center py-4 text-slate-500 font-['Prompt'] text-xs">
              ไม่พบนักแข่งในหมวดหมู่นี้ คุณสามารถเพิ่มนักแข่งได้ที่หน้า "จัดการนักแข่ง (Players)"
            </div>
          ) : (
            <div className="flex items-stretch gap-2.5 min-w-max">
              {filteredPlayers.map((player) => {
                const isMale = (player.category || 'male') === 'male';
                const isFemale = player.category === 'female';

                const catBadgeClass = isFemale
                  ? 'bg-rose-50 text-rose-700 border-rose-300'
                  : isMale
                  ? 'bg-sky-50 text-sky-700 border-sky-300'
                  : 'bg-purple-50 text-purple-700 border-purple-300';

                const catEmoji = isFemale ? '👩 หญิง' : isMale ? '👨 ชาย' : '👥 ผสม';

                const roleColorClass =
                  player.position === 'DSL'
                    ? 'border-[#f97316] text-[#c2410c] bg-orange-50'
                    : player.position === 'Jungle'
                    ? 'border-[#10b981] text-[#047857] bg-emerald-50'
                    : player.position === 'Mid'
                    ? 'border-[#a855f7] text-[#7e22ce] bg-purple-50'
                    : player.position === 'Support'
                    ? 'border-[#0ea5e9] text-[#0369a1] bg-sky-50'
                    : 'border-[#eab308] text-[#a16207] bg-amber-50';

                const signatures = player.heroPool.filter((h) => h.tier === 'signature');
                const comforts = player.heroPool.filter((h) => h.tier !== 'signature');

                return (
                  <div
                    key={player.id}
                    className="w-[175px] sm:w-[225px] flex-shrink-0 flex flex-col justify-between p-2 sm:p-2.5 rounded-xl border border-[#F3D5E2] hover:border-[#E91E63] bg-white transition-all shadow-xs group"
                  >
                    {/* Top Row: Avatar & Details */}
                    <div>
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5">
                        <div className="relative">
                          {player.avatarUrl ? (
                            <img
                              src={player.avatarUrl}
                              alt={player.nickname}
                              className="w-8 h-8 sm:w-11 sm:h-11 rounded-full object-cover border sm:border-2 border-[#F3D5E2] shadow-2xs bg-slate-100"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full border sm:border-2 border-[#F3D5E2] shadow-2xs bg-[#FCE4EC] flex items-center justify-center text-[#E91E63] font-['Prompt'] font-bold text-[9px] sm:text-xs">
                              {player.nickname.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span
                            className={`absolute -bottom-1 -right-1 font-['Prompt'] font-bold text-[7.5px] sm:text-[8.5px] px-1 py-0.2 rounded border shadow-2xs ${roleColorClass}`}
                          >
                            {player.position}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-['Prompt'] font-bold text-xs sm:text-sm text-slate-800 truncate group-hover:text-[#E91E63] transition-colors">
                              {player.nickname}
                            </span>
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              {(player.categories && player.categories.length > 0
                                ? player.categories
                                : [player.category || 'male']
                              ).map((cat) => {
                                const badgeClass =
                                  cat === 'female'
                                    ? 'bg-rose-50 text-rose-700 border-rose-300'
                                    : cat === 'male'
                                    ? 'bg-sky-50 text-sky-700 border-sky-300'
                                    : 'bg-purple-50 text-purple-700 border-purple-300';
                                const emoji = cat === 'female' ? '👩 หญิง' : cat === 'male' ? '👨 ชาย' : '👥 ผสม';
                                return (
                                  <span
                                    key={cat}
                                    className={`text-[7.5px] sm:text-[8px] font-['Prompt'] font-bold px-1 py-0.2 rounded border ${badgeClass}`}
                                  >
                                    {emoji}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                          <div className="text-[10px] sm:text-[11px] font-['Prompt'] text-slate-500 truncate">
                            {player.name}
                          </div>
                        </div>
                      </div>

                      {/* Hero Pool Highlights */}
                      <div className="space-y-1.5 pt-1.5 border-t border-[#F3D5E2]">
                        {/* Signatures */}
                        <div>
                          <div className="text-[9px] sm:text-[9.5px] font-['Prompt'] font-bold text-[#B45309] flex items-center gap-1 mb-0.5">
                            <Star size={10} className="fill-[#F59E0B] text-[#F59E0B]" />
                            <span>SIGNATURE HEROES</span>
                          </div>
                          <div className="flex items-center gap-1 flex-wrap">
                            {signatures.length === 0 ? (
                              <span className="text-[9.5px] text-slate-400 font-['Prompt'] italic">—</span>
                            ) : (
                              signatures.map((s) => (
                                <button
                                  key={s.heroName}
                                  type="button"
                                  onClick={() => {
                                    if (onInspectHero) onInspectHero(s.heroName);
                                    if (canAssign && onSelectHeroDirectly) {
                                      const found = HEROES.find(
                                        (h) => h.name.toLowerCase() === s.heroName.toLowerCase()
                                      );
                                      if (found) onSelectHeroDirectly(found);
                                    }
                                  }}
                                  title={`${s.heroName} (⭐ Signature ของ ${player.nickname}) — คลิกดูสถิติ/ดราฟ`}
                                  className="flex items-center gap-0.5 sm:gap-1 px-1.5 py-0.5 rounded bg-[#FEF3C7] hover:bg-[#FDE68A] border border-[#F59E0B] text-[#B45309] text-[9.5px] sm:text-[10.5px] font-['Prompt'] font-bold cursor-pointer transition-all shadow-2xs"
                                >
                                  <img
                                    src={getHeroImageUrl(s.heroName)}
                                    alt={s.heroName}
                                    className="w-3.5 h-3.5 rounded-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = 'none';
                                    }}
                                  />
                                  <span>{s.heroName}</span>
                                </button>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Comforts */}
                        {comforts.length > 0 && (
                          <div>
                            <div className="text-[9px] sm:text-[9.5px] font-['Prompt'] font-bold text-slate-500 flex items-center gap-1 mb-0.5">
                              <span>★ COMFORT PICKS</span>
                            </div>
                            <div className="flex items-center gap-1 flex-wrap">
                              {comforts.slice(0, 3).map((c) => (
                                <button
                                  key={c.heroName}
                                  type="button"
                                  onClick={() => {
                                    if (onInspectHero) onInspectHero(c.heroName);
                                  }}
                                  title={`${c.heroName} (★ Comfort ของ ${player.nickname})`}
                                  className="flex items-center gap-0.5 sm:gap-1 px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-[9.5px] sm:text-[10.5px] font-['Prompt'] font-medium cursor-pointer transition-all"
                                >
                                  <img
                                    src={getHeroImageUrl(c.heroName)}
                                    alt={c.heroName}
                                    className="w-3 h-3 rounded-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = 'none';
                                    }}
                                  />
                                  <span>{c.heroName}</span>
                                </button>
                              ))}
                              {comforts.length > 3 && (
                                <span className="text-[9px] text-slate-500 font-bold self-center">
                                  +{comforts.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom: Assign Button */}
                    {onAssignPlayerToActiveSlot && (
                      <button
                        type="button"
                        onClick={() => onAssignPlayerToActiveSlot(player)}
                        disabled={!canAssign}
                        className={`mt-2 w-full py-1 px-2 rounded-lg border text-[10px] sm:text-[11.5px] font-['Prompt'] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          canAssign
                            ? 'bg-[#E91E63] hover:bg-[#D81B60] border-[#E91E63] text-white shadow-xs active:scale-95'
                            : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                        title={canAssign ? `กำหนด ${player.nickname} ให้ช่องที่กำลังเลือกอยู่` : 'เลือกช่อง Pick ก่อนเพื่อกำหนดนักแข่ง'}
                      >
                        <UserCheck size={12} />
                        <span>กำหนดลงช่อง</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
    </div>
  );
};
