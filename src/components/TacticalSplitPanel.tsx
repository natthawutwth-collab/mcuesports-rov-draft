import React, { useState, useMemo } from 'react';
import { Hero, TeamSide, PositionKey } from '../types/draft';
import { Player, HeroPlayerBadge } from '../types/player';
import { HEROES, getHeroImageUrl } from '../data/heroes';
import { DraftScoreResult } from '../data/metaData';
import {
  RPL_2026_HEROES_DATA,
  RPL_2026_PLAYED_AGAINST_DATA,
  RPL_2026_PLAYED_WITH_DATA,
} from '../data/rpl2026SummerStats';
import {
  DraftPredictionService,
  DraftTacticalIntelligence,
} from '../services/draftPredictionService';
import { RPL_2026_PRO_COMPS, ProMetaComp } from '../data/proMetaComps';
import {
  getTopProLeagueBans,
  getBlueSideRecommendedBans,
  getRedSideRecommendedBans,
  BanRecommendationItem,
} from '../services/banRecommendationService';
import {
  X,
  Sparkles,
  Award,
  Ban,
  Layers,
  Trophy,
  Target,
  ShieldAlert,
  Zap,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Search,
  Filter,
  CheckCircle2,
  Swords,
  Shield,
  Flame,
  Maximize2,
  Info,
} from 'lucide-react';

export type TacticalTab = 'recommendations' | 'synergy' | 'predictions' | 'pro_comps';

interface TacticalSplitPanelProps {
  activeTab: TacticalTab;
  onTabChange: (tab: TacticalTab) => void;
  onClose: () => void;
  onExpandModal?: () => void;
  blueBans: (Hero | null)[];
  redBans: (Hero | null)[];
  bluePicks: { hero: Hero | null; pos?: string }[];
  redPicks: { hero: Hero | null; pos?: string }[];
  bannedHeroNames: Set<string>;
  pickedHeroNames: Set<string>;
  onInspectHero: (heroName: string) => void;
  onPickHeroDirectly?: (heroName: string) => void;
  onBanHeroDirectly?: (heroName: string) => void;
  isPickTurn?: boolean;
  isBanTurn?: boolean;
  activeTeam?: 'blue' | 'red';
  blueTeamName?: string;
  redTeamName?: string;
  blueScore?: DraftScoreResult;
  redScore?: DraftScoreResult;
  players?: Player[];
  heroToPlayersMap?: Record<string, HeroPlayerBadge[]>;
  inspectedHeroName?: string | null;
  height?: number;
}

export const TacticalSplitPanel: React.FC<TacticalSplitPanelProps> = ({
  activeTab,
  onTabChange,
  onClose,
  onExpandModal,
  blueBans,
  redBans,
  bluePicks,
  redPicks,
  bannedHeroNames,
  pickedHeroNames,
  onInspectHero,
  onPickHeroDirectly,
  onBanHeroDirectly,
  isPickTurn = false,
  isBanTurn = false,
  activeTeam = 'blue',
  blueTeamName = 'Blue Team',
  redTeamName = 'Red Team',
  blueScore,
  redScore,
  players = [],
  heroToPlayersMap = {},
  inspectedHeroName = null,
  height,
}) => {
  // Recommendations internal states
  const [recommendationMode, setRecommendationMode] = useState<'picks' | 'bans'>(() =>
    isBanTurn ? 'bans' : 'picks'
  );
  const [banCategoryTab, setBanCategoryTab] = useState<'pro_league' | 'blue' | 'red'>('pro_league');
  const [laneFilter, setLaneFilter] = useState<string>('all');

  // Synergy internal states
  const [synergyTeamFilter, setSynergyTeamFilter] = useState<'all' | 'blue' | 'red'>('all');

  // Pro Comps internal states
  const [compSearchQuery, setCompSearchQuery] = useState('');
  const [compFilterTag, setCompFilterTag] = useState<'all' | 'buriram' | 'fs' | 'bacon' | 's_plus'>('all');

  // Auto switch recommendation mode if turn phase changes
  React.useEffect(() => {
    if (isBanTurn) {
      setRecommendationMode('bans');
    } else if (isPickTurn) {
      setRecommendationMode('picks');
    }
  }, [isBanTurn, isPickTurn]);

  // Picked hero names
  const bluePickNames = useMemo(
    () => bluePicks.map((p) => p.hero?.name).filter(Boolean) as string[],
    [bluePicks]
  );
  const redPickNames = useMemo(
    () => redPicks.map((p) => p.hero?.name).filter(Boolean) as string[],
    [redPicks]
  );

  // Compute Advantage Percentage
  let bluePercent = 50;
  let redPercent = 50;
  if (blueScore && redScore && blueScore.score > 0 && redScore.score > 0) {
    const total = blueScore.score + redScore.score;
    bluePercent = Math.max(15, Math.min(85, Math.round((blueScore.score / total) * 100)));
    redPercent = 100 - bluePercent;
  } else if (blueScore && blueScore.score > 0) {
    bluePercent = Math.max(52, Math.min(65, Math.round(50 + (blueScore.score - 50) * 0.4)));
    redPercent = 100 - bluePercent;
  } else if (redScore && redScore.score > 0) {
    redPercent = Math.max(52, Math.min(65, Math.round(50 + (redScore.score - 50) * 0.4)));
    bluePercent = 100 - redPercent;
  }

  // Real-time Tactical Predictions
  const intelligence: DraftTacticalIntelligence = useMemo(() => {
    return DraftPredictionService.generateRealtimePredictions(
      blueBans,
      redBans,
      bluePicks,
      redPicks,
      bannedHeroNames,
      pickedHeroNames
    );
  }, [blueBans, redBans, bluePicks, redPicks, bannedHeroNames, pickedHeroNames]);

  // Tactical Overview Counters & Combos
  const tacticalOverviewMetrics = useMemo(() => {
    let blueCounterWins = 0;
    let redCounterWins = 0;
    let blueDisadvantages = 0;
    let redDisadvantages = 0;

    bluePickNames.forEach((bHero) => {
      const matchData = RPL_2026_PLAYED_AGAINST_DATA[bHero] || [];
      redPickNames.forEach((rHero) => {
        const found = matchData.find((m) => m.opponentHero === rHero);
        if (found) {
          if (found.winRate > 52) {
            blueCounterWins++;
            redDisadvantages++;
          } else if (found.winRate < 48) {
            redCounterWins++;
            blueDisadvantages++;
          }
        }
      });
    });

    let blueCombosCount = 0;
    for (let i = 0; i < bluePickNames.length; i++) {
      const allyData = RPL_2026_PLAYED_WITH_DATA[bluePickNames[i]] || [];
      for (let j = i + 1; j < bluePickNames.length; j++) {
        const found = allyData.find((a) => a.allyHero === bluePickNames[j]);
        if (found && (found.winRate >= 52 || (found.diff && found.diff > 0))) {
          blueCombosCount++;
        }
      }
    }

    let redCombosCount = 0;
    for (let i = 0; i < redPickNames.length; i++) {
      const allyData = RPL_2026_PLAYED_WITH_DATA[redPickNames[i]] || [];
      for (let j = i + 1; j < redPickNames.length; j++) {
        const found = allyData.find((a) => a.allyHero === redPickNames[j]);
        if (found && (found.winRate >= 52 || (found.diff && found.diff > 0))) {
          redCombosCount++;
        }
      }
    }

    return {
      blueCounterWins,
      redCounterWins,
      blueDisadvantages,
      redDisadvantages,
      blueCombosCount,
      redCombosCount,
      totalCombosDiscovered: blueCombosCount + redCombosCount,
    };
  }, [bluePickNames, redPickNames]);

  // Smart Ban Recommendations
  const proLeagueBans = useMemo(() => {
    return getTopProLeagueBans(bannedHeroNames, pickedHeroNames, 10);
  }, [bannedHeroNames, pickedHeroNames]);

  const blueSideBans = useMemo(() => {
    return getBlueSideRecommendedBans(bannedHeroNames, pickedHeroNames, bluePickNames, redPickNames, 10);
  }, [bannedHeroNames, pickedHeroNames, bluePickNames, redPickNames]);

  const redSideBans = useMemo(() => {
    return getRedSideRecommendedBans(bannedHeroNames, pickedHeroNames, redPickNames, bluePickNames, 10);
  }, [bannedHeroNames, pickedHeroNames, redPickNames, bluePickNames]);

  const currentBanList = useMemo(() => {
    if (banCategoryTab === 'pro_league') return proLeagueBans;
    if (banCategoryTab === 'blue') return blueSideBans;
    return redSideBans;
  }, [banCategoryTab, proLeagueBans, blueSideBans, redSideBans]);

  // Smart Pick Recommendations
  const smartPickRecommendations = useMemo(() => {
    const friendlyPicks = activeTeam === 'blue' ? bluePickNames : redPickNames;
    const enemyPicks = activeTeam === 'blue' ? redPickNames : bluePickNames;

    const friendlyRolesTaken = new Set<string>();
    const friendlySlots = activeTeam === 'blue' ? bluePicks : redPicks;
    friendlySlots.forEach((slot) => {
      if (slot.hero) {
        slot.hero.pos?.forEach((p) => friendlyRolesTaken.add(p));
      }
    });

    const candidateList = HEROES.filter(
      (h) => !pickedHeroNames.has(h.name) && !bannedHeroNames.has(h.name)
    );

    const scored = candidateList.map((hero) => {
      let score = 50;
      const reasons: string[] = [];

      const heroPrimaryPos = hero.primaryPos || (hero.pos && hero.pos[0]) || 'dsl';
      const isRoleNeeded = !friendlyRolesTaken.has(heroPrimaryPos);
      if (isRoleNeeded) {
        score += 15;
        reasons.push(`เติมเต็มเลน ${heroPrimaryPos.toUpperCase()} ที่ทีมยังขาด`);
      }

      const tourneyStats = RPL_2026_HEROES_DATA[hero.name];
      if (tourneyStats && tourneyStats.games >= 5) {
        const wrBonus = (tourneyStats.winRate - 50) * 0.4;
        const presenceBonus = Math.min(10, tourneyStats.presenceRate * 0.12);
        score += wrBonus + presenceBonus;
        if (tourneyStats.winRate >= 55) {
          reasons.push(`WR โปรลีก ${tourneyStats.winRate}% (${tourneyStats.games} เกม)`);
        }
      }

      const matchData = RPL_2026_PLAYED_AGAINST_DATA[hero.name] || [];
      enemyPicks.forEach((opp) => {
        const found = matchData.find((m) => m.opponentHero === opp);
        if (found && found.winRate >= 53) {
          score += 10;
          reasons.push(`ชนะทาง ${opp} (WR ${found.winRate}%)`);
        }
      });

      const allyData = RPL_2026_PLAYED_WITH_DATA[hero.name] || [];
      friendlyPicks.forEach((ally) => {
        const found = allyData.find((a) => a.allyHero === ally);
        if (found && found.winRate >= 53) {
          score += 8;
          reasons.push(`คอมโบเข้าขา ${ally} (WR ${found.winRate}%)`);
        }
      });

      const clampedScore = Math.min(99, Math.max(30, Math.round(score)));
      return {
        hero,
        score: clampedScore,
        reasons,
        stats: tourneyStats,
      };
    });

    let filtered = scored;
    if (laneFilter !== 'all') {
      filtered = filtered.filter((item) => {
        const p = item.hero.primaryPos || (item.hero.pos && item.hero.pos[0]);
        return p?.toLowerCase() === laneFilter.toLowerCase();
      });
    }

    return filtered.sort((a, b) => b.score - a.score).slice(0, 15);
  }, [activeTeam, bluePickNames, redPickNames, bluePicks, redPicks, pickedHeroNames, bannedHeroNames, laneFilter]);

  // Filtered Pro Comps
  const filteredComps = useMemo(() => {
    return RPL_2026_PRO_COMPS.filter((comp) => {
      if (compFilterTag === 'buriram' && !comp.popularTeams.some((t) => t.includes('Buriram'))) return false;
      if (compFilterTag === 'fs' && !comp.popularTeams.some((t) => t.includes('FULL SENSE'))) return false;
      if (compFilterTag === 'bacon' && !comp.popularTeams.some((t) => t.includes('Bacon Time'))) return false;
      if (compFilterTag === 's_plus' && comp.tier !== 'S+') return false;

      if (compSearchQuery.trim().length > 0) {
        const q = compSearchQuery.trim().toLowerCase();
        const matchName = comp.name.toLowerCase().includes(q) || comp.nameTh.toLowerCase().includes(q);
        const matchHeroes = comp.coreHeroes.some((h) => h.toLowerCase().includes(q));
        const matchTeams = comp.popularTeams.some((t) => t.toLowerCase().includes(q));
        if (!matchName && !matchHeroes && !matchTeams) return false;
      }
      return true;
    });
  }, [compFilterTag, compSearchQuery]);

  // Tab titles & styles
  const tabConfig = {
    recommendations: {
      title: isBanTurn ? 'SMART BAN RECOMMENDATIONS' : 'SMART PICK RECOMMENDATIONS',
      icon: isBanTurn ? <Ban size={15} className="text-rose-600" /> : <Award size={15} className="text-amber-500" />,
      accent: 'border-[#E91E63]',
      badge: 'RPL 2026 Summer Grounded',
    },
    synergy: {
      title: 'DRAFT SYNERGY & BALANCE',
      icon: <Layers size={15} className="text-purple-600" />,
      accent: 'border-purple-500',
      badge: 'Head-to-Head Matrix',
    },
    predictions: {
      title: 'RADAR PREDICTIONS',
      icon: <Sparkles size={15} className="text-emerald-500" />,
      accent: 'border-emerald-500',
      badge: 'AI Tactical Analysis',
    },
    pro_comps: {
      title: 'RPL 2026 PRO COMPS',
      icon: <Trophy size={15} className="text-amber-500" />,
      accent: 'border-amber-500',
      badge: `${RPL_2026_PRO_COMPS.length} Tournament Comps`,
    },
  }[activeTab];

  return (
    <div
      className="w-full h-full min-h-0 flex flex-col bg-white border-2 border-[#F3D5E2] rounded-2xl shadow-md overflow-hidden font-['Prompt']"
      style={height ? { height: `${height}px`, maxHeight: `${height}px` } : undefined}
    >
      {/* 1. Header Bar: Title, Tab Switcher Pills & Close Button */}
      <div className="px-3 py-2 bg-gradient-to-r from-[#FFF0F5] via-white to-[#F0F9FF] border-b-2 border-[#F3D5E2] flex items-center justify-between gap-1.5 flex-shrink-0 select-none">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-white border border-[#F3D5E2] shadow-2xs flex items-center justify-center flex-shrink-0">
            {tabConfig.icon}
          </div>
          <div className="min-w-0">
            <h4 className="font-['Orbitron'] font-black text-[11px] sm:text-xs text-[#E91E63] tracking-wide truncate uppercase leading-tight">
              {tabConfig.title}
            </h4>
            <span className="text-[9px] text-slate-500 font-semibold block truncate">
              {tabConfig.badge}
            </span>
          </div>
        </div>

        {/* Quick Tab Switcher Pills + Close Button */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <div className="flex items-center gap-0.5 bg-white/90 p-0.5 rounded-lg border border-[#F3D5E2] shadow-2xs">
            <button
              type="button"
              onClick={() => onTabChange('recommendations')}
              title="Smart Pick/Ban Recommendation"
              className={`p-1 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                activeTab === 'recommendations' ? 'bg-[#E91E63] text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {isBanTurn ? <Ban size={12} /> : <Award size={12} />}
            </button>
            <button
              type="button"
              onClick={() => onTabChange('synergy')}
              title="Draft Synergy & Balance"
              className={`p-1 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                activeTab === 'synergy' ? 'bg-[#E91E63] text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Layers size={12} />
            </button>
            <button
              type="button"
              onClick={() => onTabChange('predictions')}
              title="Radar Predictions"
              className={`p-1 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                activeTab === 'predictions' ? 'bg-[#E91E63] text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Sparkles size={12} />
            </button>
            <button
              type="button"
              onClick={() => onTabChange('pro_comps')}
              title="RPL Pro Comps"
              className={`p-1 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                activeTab === 'pro_comps' ? 'bg-amber-500 text-white shadow-2xs' : 'text-amber-800 hover:text-amber-950'
              }`}
            >
              <Trophy size={12} />
            </button>
          </div>

          {/* Close Panel Button */}
          <button
            type="button"
            onClick={onClose}
            title="ปิดแผงข้อมูล (แสดงดราฟต์เต็มจอ)"
            className="w-6 h-6 rounded-lg bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-500 hover:text-rose-600 flex items-center justify-center cursor-pointer transition-colors shadow-2xs active:scale-95 ml-1"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* 2. Scrollable Body Content */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2.5 sm:p-3 flex flex-col gap-2.5 bg-[#FFF8FB]/30">
        {/* ========================================================= */}
        {/* TAB 1: RECOMMENDATIONS (Bans or Picks)                     */}
        {/* ========================================================= */}
        {activeTab === 'recommendations' && (
          <div className="flex flex-col gap-2.5">
            {/* Mode Switcher: Bans vs Picks */}
            <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-[#F3D5E2] shadow-2xs">
              <button
                type="button"
                onClick={() => setRecommendationMode('bans')}
                className={`flex-1 py-1 rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                  recommendationMode === 'bans'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Ban size={11} />
                <span>แบนฮีโร่ (Bans)</span>
              </button>
              <button
                type="button"
                onClick={() => setRecommendationMode('picks')}
                className={`flex-1 py-1 rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                  recommendationMode === 'picks'
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Award size={11} />
                <span>หยิบฮีโร่ (Picks)</span>
              </button>
            </div>

            {/* Sub-Filters */}
            {recommendationMode === 'bans' ? (
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
                <button
                  type="button"
                  onClick={() => setBanCategoryTab('pro_league')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap cursor-pointer transition-colors border ${
                    banCategoryTab === 'pro_league'
                      ? 'bg-amber-500 border-amber-500 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  🔥 โปรลีกแบนบ่อย ({proLeagueBans.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBanCategoryTab('blue')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap cursor-pointer transition-colors border ${
                    banCategoryTab === 'blue'
                      ? 'bg-sky-600 border-sky-600 text-white'
                      : 'bg-white border-slate-200 text-sky-800 hover:bg-sky-50'
                  }`}
                >
                  🔵 แบนฝั่ง Blue ({blueSideBans.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBanCategoryTab('red')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap cursor-pointer transition-colors border ${
                    banCategoryTab === 'red'
                      ? 'bg-rose-600 border-rose-600 text-white'
                      : 'bg-white border-slate-200 text-rose-800 hover:bg-rose-50'
                  }`}
                >
                  🔴 แบนฝั่ง Red ({redSideBans.length})
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
                {[
                  { id: 'all', label: 'ทั้งหมด' },
                  { id: 'dsl', label: 'Dark Slayer' },
                  { id: 'jungle', label: 'Jungle' },
                  { id: 'mid', label: 'Mid' },
                  { id: 'adl', label: 'Abyssal' },
                  { id: 'support', label: 'Support' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLaneFilter(item.id)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap cursor-pointer transition-colors border ${
                      laneFilter === item.id
                        ? 'bg-[#E91E63] border-[#E91E63] text-white shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            {/* List of Cards */}
            {recommendationMode === 'bans' ? (
              <div className="flex flex-col gap-2">
                {currentBanList.map((item) => (
                  <div
                    key={item.hero.id}
                    className="p-2 bg-white rounded-xl border border-rose-200 hover:border-rose-400 shadow-2xs flex flex-col gap-1.5 transition-all"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                          <img
                            src={item.hero.avatarUrl || getHeroImageUrl(item.hero.name)}
                            alt={item.hero.name}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-0 left-0 bg-slate-900/80 text-white text-[8px] font-['Orbitron'] font-black px-1 rounded-br">
                            #{item.rank}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => onInspectHero(item.hero.name)}
                            className="font-bold text-xs text-slate-900 hover:text-rose-600 truncate text-left cursor-pointer block leading-tight"
                          >
                            {item.hero.name}
                          </button>
                          <span className="text-[9.5px] text-slate-400 font-semibold uppercase">
                            {item.hero.primaryPos || (item.hero.pos && item.hero.pos[0])}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="font-['Orbitron'] font-black text-[10px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-800 border border-rose-200">
                          {item.score} pt
                        </span>
                        {(onBanHeroDirectly || onPickHeroDirectly) && (
                          <button
                            type="button"
                            onClick={() => {
                              if (onBanHeroDirectly) onBanHeroDirectly(item.hero.name);
                              else if (onPickHeroDirectly) onPickHeroDirectly(item.hero.name);
                            }}
                            className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold cursor-pointer transition-colors shadow-2xs"
                          >
                            แบน
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[9.5px] text-slate-500 bg-rose-50/50 px-2 py-0.5 rounded-md border border-rose-100">
                      <span>แบน {item.stats.banRate}% ({item.stats.bans} เกม)</span>
                      <span>WR {item.stats.winRate}%</span>
                      <span>P&B {item.stats.presenceRate}%</span>
                    </div>

                    <p className="text-[9.5px] text-slate-600 line-clamp-2 leading-relaxed">
                      {item.reason}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {smartPickRecommendations.map((item, idx) => (
                  <div
                    key={item.hero.id}
                    className="p-2 bg-white rounded-xl border border-amber-200 hover:border-amber-400 shadow-2xs flex flex-col gap-1.5 transition-all"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                          <img
                            src={item.hero.avatarUrl || getHeroImageUrl(item.hero.name)}
                            alt={item.hero.name}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-0 left-0 bg-amber-500 text-white text-[8px] font-['Orbitron'] font-black px-1 rounded-br">
                            #{idx + 1}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => onInspectHero(item.hero.name)}
                            className="font-bold text-xs text-slate-900 hover:text-amber-600 truncate text-left cursor-pointer block leading-tight"
                          >
                            {item.hero.name}
                          </button>
                          <span className="text-[9.5px] text-slate-400 font-semibold uppercase">
                            {item.hero.primaryPos || (item.hero.pos && item.hero.pos[0])}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="font-['Orbitron'] font-black text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-900 border border-amber-300">
                          {item.score} pt
                        </span>
                        {onPickHeroDirectly && (
                          <button
                            type="button"
                            onClick={() => onPickHeroDirectly(item.hero.name)}
                            className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold cursor-pointer transition-colors shadow-2xs"
                          >
                            เลือก
                          </button>
                        )}
                      </div>
                    </div>

                    {item.reasons.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.reasons.slice(0, 2).map((r, rIdx) => (
                          <span
                            key={rIdx}
                            className="text-[9px] bg-slate-50 border border-slate-200 text-slate-700 px-1.5 py-0.2 rounded"
                          >
                            ✓ {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: SYNERGY & BALANCE                                  */}
        {/* ========================================================= */}
        {activeTab === 'synergy' && (
          <div className="flex flex-col gap-2.5">
            {/* Advantage Bar */}
            <div className="p-2.5 bg-white rounded-xl border border-[#F3D5E2] shadow-2xs flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-sky-800">🔵 {blueTeamName}: {bluePercent}%</span>
                <span className="text-rose-800">🔴 {redTeamName}: {redPercent}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-sky-600 to-sky-400 transition-all duration-300"
                  style={{ width: `${bluePercent}%` }}
                />
                <div
                  className="h-full bg-gradient-to-r from-rose-400 to-rose-600 transition-all duration-300"
                  style={{ width: `${redPercent}%` }}
                />
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 gap-1.5">
              <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col">
                <span className="text-[9.5px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                  <TrendingUp size={11} />
                  <span>ชนะทาง (Counters)</span>
                </span>
                <span className="font-['Orbitron'] font-black text-sm text-emerald-700 mt-0.5">
                  {tacticalOverviewMetrics.blueCounterWins + tacticalOverviewMetrics.redCounterWins} คู่
                </span>
                <span className="text-[9px] text-slate-500">
                  Blue {tacticalOverviewMetrics.blueCounterWins} | Red {tacticalOverviewMetrics.redCounterWins}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-200 flex flex-col">
                <span className="text-[9.5px] font-bold text-amber-900 uppercase flex items-center gap-1">
                  <Zap size={11} />
                  <span>คอมโบในทีม</span>
                </span>
                <span className="font-['Orbitron'] font-black text-sm text-amber-700 mt-0.5">
                  {tacticalOverviewMetrics.totalCombosDiscovered} คู่
                </span>
                <span className="text-[9px] text-slate-500">
                  Blue {tacticalOverviewMetrics.blueCombosCount} | Red {tacticalOverviewMetrics.redCombosCount}
                </span>
              </div>
            </div>

            {/* Blue Side Active Heroes & Counters */}
            <div className="p-2.5 bg-white rounded-xl border border-sky-200 shadow-2xs flex flex-col gap-2">
              <span className="text-xs font-bold text-sky-900 flex items-center justify-between">
                <span>🔵 {blueTeamName} ({bluePickNames.length}/5)</span>
                <span className="text-[10px] font-semibold text-slate-400">BLUE SIDE</span>
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {bluePickNames.length === 0 ? (
                  <span className="text-[11px] text-slate-400 italic">ยังไม่ได้เลือกฮีโร่</span>
                ) : (
                  bluePickNames.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => onInspectHero(name)}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-sky-50 border border-sky-200 hover:border-sky-400 transition-colors cursor-pointer text-[10.5px] font-bold text-sky-900 shadow-2xs"
                    >
                      <img src={getHeroImageUrl(name)} alt={name} className="w-4 h-4 rounded object-cover" />
                      <span>{name}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Red Side Active Heroes & Counters */}
            <div className="p-2.5 bg-white rounded-xl border border-rose-200 shadow-2xs flex flex-col gap-2">
              <span className="text-xs font-bold text-rose-900 flex items-center justify-between">
                <span>🔴 {redTeamName} ({redPickNames.length}/5)</span>
                <span className="text-[10px] font-semibold text-slate-400">RED SIDE</span>
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {redPickNames.length === 0 ? (
                  <span className="text-[11px] text-slate-400 italic">ยังไม่ได้เลือกฮีโร่</span>
                ) : (
                  redPickNames.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => onInspectHero(name)}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-rose-50 border border-rose-200 hover:border-rose-400 transition-colors cursor-pointer text-[10.5px] font-bold text-rose-900 shadow-2xs"
                    >
                      <img src={getHeroImageUrl(name)} alt={name} className="w-4 h-4 rounded object-cover" />
                      <span>{name}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: RADAR PREDICTIONS                                  */}
        {/* ========================================================= */}
        {activeTab === 'predictions' && (
          <div className="flex flex-col gap-2.5">
            {/* Win Probability Header Card */}
            <div className="p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 shadow-2xs flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-['Orbitron'] font-black text-xs text-indigo-900 uppercase">
                  MATCH PREDICTION
                </span>
                <span className="text-[9.5px] bg-indigo-200/80 text-indigo-900 font-bold px-1.5 py-0.2 rounded">
                  Calculated from Draft
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-sky-900">{blueTeamName}</span>
                  <span className="font-['Orbitron'] font-black text-lg text-sky-700">{bluePercent}%</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">VS</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold text-rose-900">{redTeamName}</span>
                  <span className="font-['Orbitron'] font-black text-lg text-rose-700">{redPercent}%</span>
                </div>
              </div>
            </div>

            {/* Tactical AI Insights */}
            <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles size={13} className="text-[#E91E63]" />
                <span>วิเคราะห์แท็กติกและเงื่อนไขชัยชนะ</span>
              </span>

              <div className="p-2 rounded-lg bg-sky-50/70 border border-sky-100 flex flex-col gap-1 text-[10.5px]">
                <span className="font-bold text-sky-900">🔵 แผนการเล่นฝั่ง Blue:</span>
                <p className="text-slate-600 leading-relaxed">
                  {bluePickNames.length >= 3
                    ? 'โครงสร้างดราฟต์มีฮีโร่หลักชัดเจน ควรเน้นการคุมพื้นที่อ็อบเจกต์และเดินเกมร่วมกับ Jungle'
                    : 'ยังดราฟต์ไม่ครบ 3 ตัว รอประเมินแนวทางการเล่นหลัก'}
                </p>
              </div>

              <div className="p-2 rounded-lg bg-rose-50/70 border border-rose-100 flex flex-col gap-1 text-[10.5px]">
                <span className="font-bold text-rose-900">🔴 แผนการเล่นฝั่ง Red:</span>
                <p className="text-slate-600 leading-relaxed">
                  {redPickNames.length >= 3
                    ? 'โครงสร้างดราฟต์ฝั่งแดง ควรชิงจังหวะ Last Pick เพื่อแก้ทางตัวทำดาเมจหลักของคู่แข่ง'
                    : 'ยังดราฟต์ไม่ครบ 3 ตัว รอดูการตอบสนองต่อเฟสดราฟต์แรก'}
                </p>
              </div>
            </div>

            {/* Anticipated Picks / Intentions */}
            {intelligence.pickSynergies.length > 0 && (
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                  <Target size={12} className="text-amber-500" />
                  <span>คู่หูที่คาดว่าจะถูกนำมาเล่นด้วยกัน (Synergy)</span>
                </span>
                <div className="space-y-1.5">
                  {intelligence.pickSynergies.slice(0, 4).map((item, idx) => (
                    <div
                      key={idx}
                      className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-[10.5px]"
                    >
                      <span className="font-semibold text-slate-700">
                        {item.pickedHero} + <strong className="text-amber-800">{item.suggestedHero}</strong>
                      </span>
                      <span className="text-[9.5px] font-['Orbitron'] font-bold text-amber-700">
                        {item.confidence}% match
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: RPL PRO COMPS                                      */}
        {/* ========================================================= */}
        {activeTab === 'pro_comps' && (
          <div className="flex flex-col gap-2.5">
            {/* Search & Team Filter */}
            <div className="flex flex-col gap-1.5">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={compSearchQuery}
                  onChange={(e) => setCompSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อทีม, คอมพ์, หรือฮีโร่..."
                  className="w-full pl-8 pr-2.5 py-1 bg-white border border-[#F3D5E2] rounded-xl text-xs font-medium placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-2xs"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
                {[
                  { id: 'all', label: 'ทั้งหมด' },
                  { id: 'buriram', label: '🏆 Buriram' },
                  { id: 'fs', label: '🥈 FULL SENSE' },
                  { id: 'bacon', label: '🥓 Bacon' },
                  { id: 's_plus', label: '⭐ S+ Tier' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCompFilterTag(item.id as any)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap cursor-pointer transition-colors border ${
                      compFilterTag === item.id
                        ? 'bg-amber-500 border-amber-500 text-white shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Comps List */}
            <div className="flex flex-col gap-2">
              {filteredComps.map((comp) => (
                <div
                  key={comp.id}
                  className="p-2.5 bg-white rounded-xl border border-amber-200 hover:border-amber-400 shadow-2xs flex flex-col gap-2 transition-all"
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="min-w-0">
                      <span className="font-['Orbitron'] font-black text-xs text-amber-950 truncate block">
                        {comp.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold truncate block">
                        {comp.nameTh}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="font-['Orbitron'] font-black text-[9.5px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                        {comp.tier}
                      </span>
                      <span className="text-[9.5px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        {comp.popularTeams[0] || 'RPL PRO'}
                      </span>
                    </div>
                  </div>

                  {/* Core Heroes Row */}
                  <div className="flex items-center gap-1.5">
                    {comp.coreHeroes.map((heroName) => {
                      const isBanned = bannedHeroNames.has(heroName);
                      const isPicked = pickedHeroNames.has(heroName);
                      return (
                        <button
                          key={heroName}
                          type="button"
                          onClick={() => {
                            if (!isBanned && !isPicked && onPickHeroDirectly) {
                              onPickHeroDirectly(heroName);
                            } else {
                              onInspectHero(heroName);
                            }
                          }}
                          className={`relative w-8 h-8 rounded-lg overflow-hidden border transition-transform hover:scale-105 cursor-pointer shadow-2xs ${
                            isBanned
                              ? 'opacity-40 grayscale border-rose-500'
                              : isPicked
                              ? 'ring-2 ring-sky-500 border-sky-400'
                              : 'border-slate-200 hover:border-amber-400'
                          }`}
                          title={`${heroName} ${isBanned ? '(ถูกแบน)' : isPicked ? '(ถูกเลือกแล้ว)' : '(คลิกเพื่อเลือก)'}`}
                        >
                          <img
                            src={getHeroImageUrl(heroName)}
                            alt={heroName}
                            className="w-full h-full object-cover"
                          />
                          {isBanned && (
                            <span className="absolute inset-0 bg-rose-950/60 flex items-center justify-center text-white font-black text-[8px]">
                              BAN
                            </span>
                          )}
                          {isPicked && (
                            <span className="absolute inset-0 bg-sky-950/60 flex items-center justify-center text-white font-black text-[8px]">
                              PICK
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-[10px] text-slate-600 line-clamp-2 leading-relaxed">
                    {comp.tacticalDescription}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
