import React from 'react';
import { Player, TeamCategory } from '../types/player';
import { Hero, TeamSide } from '../types/draft';
import { HEROES, getHeroImageUrl } from '../data/heroes';
import { Users, ChevronDown, ChevronUp, Star, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';

interface DraftPlayerRosterBarProps {
  players: Player[];
  selectedCategory: TeamCategory;
  onChangeCategory: (cat: TeamCategory) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  onInspectHero?: (heroName: string) => void;
  onSelectHeroDirectly?: (hero: Hero) => void;
  onAssignPlayerToActiveSlot?: (player: Player) => void;
  currentTurnSlot?: {
    team: TeamSide;
    phase: 'ban' | 'pick';
    index: number;
  } | null;
}

const CATEGORIES: { key: TeamCategory; label: string; icon: string; activeClass: string }[] = [
  {
    key: 'male',
    label: 'ทีมชาย',
    icon: '👨',
    activeClass: 'bg-gradient-to-r from-sky-600 to-blue-600 text-white font-black border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.5)]',
  },
  {
    key: 'female',
    label: 'ทีมหญิง',
    icon: '👩',
    activeClass: 'bg-gradient-to-r from-pink-600 to-rose-600 text-white font-black border-pink-400 shadow-[0_0_12px_rgba(244,63,94,0.5)]',
  },
  {
    key: 'mixed',
    label: 'ทีมผสม',
    icon: '👥',
    activeClass: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.5)]',
  },
  {
    key: 'all',
    label: 'ทั้งหมด',
    icon: '🌐',
    activeClass: 'bg-white text-black font-black border-white shadow-md',
  },
];

const POS_ORDER = ['DSL', 'Jungle', 'Mid', 'Support', 'ADL'];

export const DraftPlayerRosterBar: React.FC<DraftPlayerRosterBarProps> = ({
  players,
  selectedCategory,
  onChangeCategory,
  isOpen,
  onToggleOpen,
  onInspectHero,
  onSelectHeroDirectly,
  onAssignPlayerToActiveSlot,
  currentTurnSlot,
}) => {
  // Filter players by category
  const filteredPlayers = React.useMemo(() => {
    let list = players;
    if (selectedCategory !== 'all') {
      list = players.filter((p) => (p.category || 'male') === selectedCategory);
    }
    // Sort by role order
    return [...list].sort((a, b) => {
      const idxA = POS_ORDER.indexOf(a.position);
      const idxB = POS_ORDER.indexOf(b.position);
      return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
    });
  }, [players, selectedCategory]);

  // Counts for each category
  const counts = React.useMemo(() => {
    return {
      all: players.length,
      male: players.filter((p) => (p.category || 'male') === 'male').length,
      female: players.filter((p) => p.category === 'female').length,
      mixed: players.filter((p) => p.category === 'mixed').length,
    };
  }, [players]);

  const canAssign = Boolean(currentTurnSlot && currentTurnSlot.phase === 'pick');

  return (
    <div className="w-full bg-[#080b12]/95 border-2 border-slate-700/80 rounded-xl sm:rounded-2xl shadow-xl backdrop-blur-md overflow-hidden transition-all">
      {/* 1. Header Bar with Category Switcher */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-3 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-[#05070d] border-b border-slate-700/80 flex-wrap">
        {/* Left: Title & Quick Status */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-[#fbbf24]/20 border border-[#fbbf24]/60 flex items-center justify-center text-[#fbbf24] shadow-sm flex-shrink-0">
            <Users size={12} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-['Orbitron'] text-[10px] sm:text-xs font-black tracking-wider text-white">
                ROSTER POOL
              </span>
              <span className="text-[8.5px] sm:text-[10px] font-['Barlow_Condensed'] font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {filteredPlayers.length}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Category Buttons */}
        <div className="flex items-center gap-0.5 sm:gap-1 bg-black/60 p-0.5 rounded-lg sm:rounded-xl border border-slate-700/80 shadow-inner overflow-x-auto max-w-full no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.key;
            const count = counts[cat.key];
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => onChangeCategory(cat.key)}
                className={`font-['Barlow_Condensed'] text-[9.5px] sm:text-[11px] font-black tracking-wider px-1.5 sm:px-2.5 py-0.5 rounded-md sm:rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                  isActive
                    ? cat.activeClass
                    : 'border-slate-800 bg-transparent text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span className={`text-[8.5px] sm:text-[9.5px] px-1 py-0.1 rounded font-normal ${isActive ? 'bg-black/30' : 'bg-slate-800 text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Collapse / Expand Button */}
        <div className="flex items-center gap-1.5 ml-auto">
          {canAssign && (
            <span className="hidden md:inline text-[10px] font-['Kanit'] text-[#fbbf24] bg-amber-950/40 border border-amber-600/40 px-2 py-0.5 rounded-lg animate-pulse">
              🎯 คลิก "กำหนดลงช่อง" เพื่อระบุนักแข่งในช่องดราฟ
            </span>
          )}
          <button
            type="button"
            onClick={onToggleOpen}
            title={isOpen ? 'ย่อแถบข้อมูลนักแข่ง' : 'ขยายแถบข้อมูลนักแข่ง'}
            className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-black/50 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-[9.5px] sm:text-[11px] font-['Barlow_Condensed'] font-bold cursor-pointer transition-all"
          >
            <span>{isOpen ? 'ซ่อน' : 'แสดงนักแข่ง'}</span>
            {isOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        </div>
      </div>

      {/* 2. Player Roster Cards (Collapsible Body) */}
      {isOpen && (
        <div className="p-2 sm:p-3 bg-[#070910] overflow-x-auto custom-scrollbar">
          {filteredPlayers.length === 0 ? (
            <div className="text-center py-4 text-slate-400 font-['Kanit'] text-xs">
              ไม่พบนักแข่งในหมวดหมู่นี้ คุณสามารถเพิ่มนักแข่งได้ที่หน้า "จัดการนักแข่ง (Players)"
            </div>
          ) : (
            <div className="flex items-stretch gap-2 min-w-max">
              {filteredPlayers.map((player) => {
                const isMale = (player.category || 'male') === 'male';
                const isFemale = player.category === 'female';

                const catBadgeClass = isFemale
                  ? 'bg-rose-950/80 text-rose-300 border-rose-600/60'
                  : isMale
                  ? 'bg-sky-950/80 text-sky-300 border-sky-600/60'
                  : 'bg-purple-950/80 text-purple-300 border-purple-600/60';

                const catEmoji = isFemale ? '👩 หญิง' : isMale ? '👨 ชาย' : '👥 ผสม';

                const roleColorClass =
                  player.position === 'DSL'
                    ? 'border-[#f97316] text-[#f97316]'
                    : player.position === 'Jungle'
                    ? 'border-[#10b981] text-[#10b981]'
                    : player.position === 'Mid'
                    ? 'border-[#a855f7] text-[#a855f7]'
                    : player.position === 'Support'
                    ? 'border-[#0ea5e9] text-[#0ea5e9]'
                    : 'border-[#eab308] text-[#eab308]';

                const signatures = player.heroPool.filter((h) => h.tier === 'signature');
                const comforts = player.heroPool.filter((h) => h.tier !== 'signature');

                return (
                  <div
                    key={player.id}
                    className="w-[170px] sm:w-[220px] flex-shrink-0 flex flex-col justify-between p-2 sm:p-2.5 rounded-lg sm:rounded-xl border border-slate-700/80 bg-[#0d101a] hover:border-slate-500 transition-all shadow-md group"
                  >
                    {/* Top Row: Avatar & Details */}
                    <div>
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5">
                        <div className="relative">
                          {player.avatarUrl ? (
                            <img
                              src={player.avatarUrl}
                              alt={player.nickname}
                              className="w-8 h-8 sm:w-11 sm:h-11 rounded-full object-cover border sm:border-2 border-slate-600 shadow-md bg-black/60"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full border sm:border-2 border-slate-600 shadow-md bg-gradient-to-br from-slate-800 to-black flex items-center justify-center text-white font-['Orbitron'] font-black text-[9px] sm:text-xs">
                              {player.nickname.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span
                            className={`absolute -bottom-1 -right-1 font-['Barlow_Condensed'] font-black text-[7.5px] sm:text-[8.5px] px-1 py-0.2 rounded bg-black border ${roleColorClass}`}
                          >
                            {player.position}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-['Orbitron'] font-black text-xs sm:text-sm text-white truncate group-hover:text-[#fbbf24] transition-colors">
                              {player.nickname}
                            </span>
                            <span
                              className={`text-[7.5px] sm:text-[8.5px] font-['Barlow_Condensed'] font-black px-1 sm:px-1.5 py-0.2 rounded border ${catBadgeClass}`}
                            >
                              {catEmoji}
                            </span>
                          </div>
                          <div className="text-[9.5px] sm:text-[10.5px] font-['Kanit'] text-slate-400 truncate">
                            {player.name}
                          </div>
                        </div>
                      </div>

                      {/* Hero Pool Highlights */}
                      <div className="space-y-1 pt-1 border-t border-slate-800">
                        {/* Signatures */}
                        <div>
                          <div className="text-[8.5px] sm:text-[9px] font-['Barlow_Condensed'] font-black text-[#fbbf24] flex items-center gap-1 mb-0.5">
                            <Star size={9} className="fill-amber-400 text-amber-400" />
                            <span>SIGNATURE HEROES</span>
                          </div>
                          <div className="flex items-center gap-1 flex-wrap">
                            {signatures.length === 0 ? (
                              <span className="text-[9px] text-slate-500 font-['Kanit']">—</span>
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
                                  className="flex items-center gap-0.5 sm:gap-1 px-1 sm:px-1.5 py-0.5 rounded bg-amber-950/60 hover:bg-amber-600/40 border border-amber-500/60 hover:border-amber-400 text-amber-200 text-[9px] sm:text-[10px] font-['Barlow_Condensed'] font-bold cursor-pointer transition-all shadow-sm"
                                >
                                  <img
                                    src={getHeroImageUrl(s.heroName)}
                                    alt={s.heroName}
                                    className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full object-cover"
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
                            <div className="text-[8.5px] sm:text-[9px] font-['Barlow_Condensed'] font-black text-slate-400 flex items-center gap-1 mb-0.5">
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
                                  className="flex items-center gap-0.5 sm:gap-1 px-1 sm:px-1.5 py-0.5 rounded bg-black/60 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[9px] sm:text-[10px] font-['Barlow_Condensed'] font-medium cursor-pointer transition-all"
                                >
                                  <img
                                    src={getHeroImageUrl(c.heroName)}
                                    alt={c.heroName}
                                    className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = 'none';
                                    }}
                                  />
                                  <span>{c.heroName}</span>
                                </button>
                              ))}
                              {comforts.length > 3 && (
                                <span className="text-[8.5px] text-slate-500 font-bold self-center">
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
                        className={`mt-1.5 w-full py-0.5 sm:py-1 px-1.5 sm:px-2 rounded-md sm:rounded-lg border text-[9.5px] sm:text-[11px] font-['Kanit'] font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          canAssign
                            ? 'bg-[#fbbf24]/20 hover:bg-[#fbbf24]/30 border-[#fbbf24] text-[#fbbf24] hover:text-[#fde047] shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                            : 'bg-black/40 border-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                        title={canAssign ? `กำหนด ${player.nickname} ให้ช่องที่กำลังเลือกอยู่` : 'เลือกช่อง Pick ก่อนเพื่อกำหนดนักแข่ง'}
                      >
                        <UserCheck size={11} />
                        <span>กำหนดลงช่อง</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
