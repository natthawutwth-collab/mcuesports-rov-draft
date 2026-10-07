import React, { useState, useMemo } from 'react';
import { Hero, TeamSide, PositionKey } from '../types/draft';
import { Player, HeroPlayerBadge } from '../types/player';
import { HEROES, getHeroImageUrl } from '../data/heroes';
import { DraftScoreResult } from '../data/metaData';
import {
  RPL_2026_HEROES_DATA,
  RPL_2026_PLAYED_AGAINST_DATA,
  RPL_2026_PLAYED_WITH_DATA,
  RPL_2026_SUMMER_DATASET,
} from '../data/rpl2026SummerStats';
import {
  DraftPredictionService,
  DraftTacticalIntelligence,
} from '../services/draftPredictionService';
import { ProCompsModal } from './ProCompsModal';
import { RPL_2026_PRO_COMPS } from '../data/proMetaComps';
import {
  getRecommendedBans,
  getTopProLeagueBans,
  getBlueSideRecommendedBans,
  getRedSideRecommendedBans,
  BanRecommendationItem,
} from '../services/banRecommendationService';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Zap,
  Ban,
  CheckCircle2,
  Swords,
  TrendingUp,
  BarChart3,
  Layers,
  Award,
  Info,
  Clock,
  Target,
  Shield,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Check,
  Search,
  ExternalLink,
} from 'lucide-react';

interface DraftTacticalRadarProps {
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
  className?: string;
  activeTab?: DashboardTab;
  onTabChange?: (tab: DashboardTab) => void;
}

type DashboardTab = 'overview' | 'recommendations' | 'synergy' | 'predictions';
type TeamFilter = 'all' | 'blue' | 'red';

export const DraftTacticalRadar: React.FC<DraftTacticalRadarProps> = ({
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
  className,
  activeTab,
  onTabChange,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [internalDashboardTab, setInternalDashboardTab] = useState<DashboardTab>('recommendations');
  const activeDashboardTab = activeTab || internalDashboardTab;
  const setActiveDashboardTab = (tab: DashboardTab) => {
    setInternalDashboardTab(tab);
    if (onTabChange) onTabChange(tab);
  };
  const [teamFilter, setTeamFilter] = useState<TeamFilter>('all');
  const [isProCompsOpen, setIsProCompsOpen] = useState<boolean>(false);
  const [recommendationLaneFilter, setRecommendationLaneFilter] = useState<string>('all');
  const [banCategoryTab, setBanCategoryTab] = useState<'pro_league' | 'blue' | 'red'>('pro_league');
  const [selectedHeroForAnalysis, setSelectedHeroForAnalysis] = useState<string>('Toro');
  const [heroSearchQuery, setHeroSearchQuery] = useState<string>('');
  const [recommendationMode, setRecommendationMode] = useState<'picks' | 'bans'>(() => (isBanTurn ? 'bans' : 'picks'));

  // Auto-switch recommendation mode to bans during Ban Phase, picks during Pick Phase
  React.useEffect(() => {
    if (isBanTurn) {
      setRecommendationMode('bans');
    } else if (isPickTurn) {
      setRecommendationMode('picks');
    }
  }, [isBanTurn, isPickTurn]);

  // Sync selected hero for analysis if prop changes
  React.useEffect(() => {
    if (inspectedHeroName) {
      setSelectedHeroForAnalysis(inspectedHeroName);
    }
  }, [inspectedHeroName]);

  // Valid picked hero names
  const bluePickNames = useMemo(
    () => bluePicks.map((p) => p.hero?.name).filter(Boolean) as string[],
    [bluePicks]
  );
  const redPickNames = useMemo(
    () => redPicks.map((p) => p.hero?.name).filter(Boolean) as string[],
    [redPicks]
  );

  // Compute Advantage Percentage
  const hasScore = (blueScore && blueScore.score > 0) || (redScore && redScore.score > 0);
  let bluePercent = 50;
  let redPercent = 50;

  if (blueScore && redScore && blueScore.score > 0 && redScore.score > 0) {
    const total = blueScore.score + redScore.score;
    bluePercent = Math.max(15, Math.min(85, Math.round((blueScore.score / total) * 100)));
    redPercent = 100 - bluePercent;
  } else if (blueScore && blueScore.score > 0 && (!redScore || redScore.score === 0)) {
    bluePercent = Math.max(52, Math.min(65, Math.round(50 + (blueScore.score - 50) * 0.4)));
    redPercent = 100 - bluePercent;
  } else if (redScore && redScore.score > 0 && (!blueScore || blueScore.score === 0)) {
    redPercent = Math.max(52, Math.min(65, Math.round(50 + (redScore.score - 50) * 0.4)));
    bluePercent = 100 - redPercent;
  }

  const percentDiff = bluePercent - redPercent;
  const advantageSide: 'blue' | 'red' | 'balanced' =
    Math.abs(percentDiff) < 2 ? 'balanced' : percentDiff > 0 ? 'blue' : 'red';

  // Compute real-time tactical predictions from service
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

  const hasAnyDraftActions = useMemo(() => {
    return (
      blueBans.some(Boolean) ||
      redBans.some(Boolean) ||
      bluePicks.some((p) => Boolean(p.hero)) ||
      redPicks.some((p) => Boolean(p.hero))
    );
  }, [blueBans, redBans, bluePicks, redPicks]);

  // ==========================================
  // 1. TACTICAL OVERVIEW: Counters & Combos Counts
  // ==========================================
  const tacticalOverviewMetrics = useMemo(() => {
    let blueCounterWins = 0; // Blue counters Red
    let redCounterWins = 0;  // Red counters Blue
    let blueDisadvantages = 0;
    let redDisadvantages = 0;

    // Check head-to-head records in RPL_2026_PLAYED_AGAINST_DATA
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

    // Count active combos
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

  // ==========================================
  // 2. SMART PICK RECOMMENDATION ENGINE
  // ==========================================
  const smartPickRecommendations = useMemo(() => {
    const friendlyPicks = activeTeam === 'blue' ? bluePickNames : redPickNames;
    const enemyPicks = activeTeam === 'blue' ? redPickNames : bluePickNames;

    // Check which positions friendly team still lacks
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
      const reasons: { text: string; type: 'counter' | 'synergy' | 'role' | 'signature' | 'meta' }[] = [];

      // 1. Role priority bonus
      const heroPrimaryPos = hero.primaryPos || (hero.pos && hero.pos[0]) || 'dsl';
      const isRoleNeeded = !friendlyRolesTaken.has(heroPrimaryPos);
      if (isRoleNeeded) {
        score += 15;
        reasons.push({ text: `เติมเต็มเลน ${heroPrimaryPos.toUpperCase()} ที่ทีมยังขาด`, type: 'role' });
      }

      // 2. Tournament statistics from official RPL 2026 Summer
      const tourneyStats = RPL_2026_HEROES_DATA[hero.name];
      if (tourneyStats && tourneyStats.games >= 10) {
        const wrBonus = (tourneyStats.winRate - 50) * 0.6;
        score += wrBonus;
        if (tourneyStats.winRate >= 55) {
          reasons.push({
            text: `RPL WR ${tourneyStats.winRate}% (${tourneyStats.games} เกม)`,
            type: 'meta',
          });
        }
      }

      // 3. Counter advantage against enemy locked picks
      const againstData = RPL_2026_PLAYED_AGAINST_DATA[hero.name] || [];
      enemyPicks.forEach((eHero) => {
        const foundMatchup = againstData.find((m) => m.opponentHero === eHero);
        if (foundMatchup && foundMatchup.games >= 3) {
          if (foundMatchup.winRate >= 55) {
            score += 12;
            reasons.push({
              text: `ชนะทาง ${eHero} (WR ${foundMatchup.winRate}%)`,
              type: 'counter',
            });
          } else if (foundMatchup.winRate <= 42) {
            score -= 10;
          }
        }
      });

      // 4. Synergy boost with friendly locked picks
      const allyData = RPL_2026_PLAYED_WITH_DATA[hero.name] || [];
      friendlyPicks.forEach((fHero) => {
        const foundAlly = allyData.find((a) => a.allyHero === fHero);
        if (foundAlly && foundAlly.games >= 3) {
          if (foundAlly.winRate >= 56 || (foundAlly.diff && foundAlly.diff > 2)) {
            score += 14;
            reasons.push({
              text: `คอมโบกับ ${fHero} (WR ${foundAlly.winRate}%)`,
              type: 'synergy',
            });
          }
        }
      });

      // 5. Player signature / comfortable mastery
      const badges = heroToPlayersMap[hero.name] || [];
      if (badges.length > 0) {
        const sig = badges.find((b) => b.tier === 'signature');
        if (sig) {
          score += 15;
          reasons.push({
            text: `ซิกเนเจอร์ของ ${sig.playerName} (${sig.position})`,
            type: 'signature',
          });
        } else {
          const comf = badges.find((b) => b.tier === 'comfortable');
          if (comf) {
            score += 8;
            reasons.push({
              text: `ตัวถนัดของ ${comf.playerName}`,
              type: 'signature',
            });
          }
        }
      }

      const finalScore = Math.max(10, Math.min(99, Math.round(score)));

      return {
        hero,
        score: finalScore,
        reasons,
        primaryPos: heroPrimaryPos,
        tourneyStats,
      };
    });

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    // Apply lane filter
    if (recommendationLaneFilter === 'all') return scored.slice(0, 12);
    return scored
      .filter((item) => item.hero.pos?.includes(recommendationLaneFilter as PositionKey))
      .slice(0, 12);
  }, [
    activeTeam,
    bluePickNames,
    redPickNames,
    bluePicks,
    redPicks,
    pickedHeroNames,
    bannedHeroNames,
    heroToPlayersMap,
    recommendationLaneFilter,
  ]);

  // Real-time Smart Ban Recommendations based strictly on RPL 2026 Summer official data
  const proLeagueBans = useMemo(() => {
    return getTopProLeagueBans(bannedHeroNames, pickedHeroNames, 10);
  }, [bannedHeroNames, pickedHeroNames]);

  const blueSideBans = useMemo(() => {
    return getBlueSideRecommendedBans(
      bannedHeroNames,
      pickedHeroNames,
      bluePickNames,
      redPickNames,
      10
    );
  }, [bannedHeroNames, pickedHeroNames, bluePickNames, redPickNames]);

  const redSideBans = useMemo(() => {
    return getRedSideRecommendedBans(
      bannedHeroNames,
      pickedHeroNames,
      redPickNames,
      bluePickNames,
      10
    );
  }, [bannedHeroNames, pickedHeroNames, redPickNames, bluePickNames]);

  const displayedBans = useMemo(() => {
    if (banCategoryTab === 'blue') return blueSideBans;
    if (banCategoryTab === 'red') return redSideBans;
    return proLeagueBans;
  }, [banCategoryTab, proLeagueBans, blueSideBans, redSideBans]);

  const smartBanRecommendations = displayedBans;

  // ==========================================
  // 3. HERO ANALYSIS DATA (Inspect Selected Hero)
  // ==========================================
  const heroAnalysisDetails = useMemo(() => {
    const heroName = selectedHeroForAnalysis;
    const heroObj = HEROES.find((h) => h.name.toLowerCase() === heroName.toLowerCase());
    const stats = RPL_2026_HEROES_DATA[heroName];
    const against = RPL_2026_PLAYED_AGAINST_DATA[heroName] || [];
    const withData = RPL_2026_PLAYED_WITH_DATA[heroName] || [];
    const playerBadges = heroToPlayersMap[heroName] || [];

    // Filter counters: best win rates against opponents
    const countersList = [...against]
      .filter((m) => m.games >= 2 && m.winRate >= 50)
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 5);

    // Filter countered by: worst win rates
    const counteredByList = [...against]
      .filter((m) => m.games >= 2 && m.winRate < 50)
      .sort((a, b) => a.winRate - b.winRate)
      .slice(0, 5);

    // Filter top synergies
    const topSynergies = [...withData]
      .filter((s) => s.games >= 2)
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 5);

    return {
      heroObj,
      stats,
      countersList,
      counteredByList,
      topSynergies,
      playerBadges,
      hasTournamentData: Boolean(stats),
    };
  }, [selectedHeroForAnalysis, heroToPlayersMap]);

  // Filtered heroes list for quick search in Hero Analysis
  const filteredAnalysisHeroList = useMemo(() => {
    if (!heroSearchQuery.trim()) {
      // Prioritize currently drafted heroes
      const currentDraftHeroes = [...bluePickNames, ...redPickNames];
      if (currentDraftHeroes.length > 0) {
        return HEROES.filter((h) => currentDraftHeroes.includes(h.name)).slice(0, 10);
      }
      return HEROES.slice(0, 10);
    }
    const q = heroSearchQuery.trim().toLowerCase();
    return HEROES.filter(
      (h) => h.name.toLowerCase().includes(q) || (h.nameTh && h.nameTh.toLowerCase().includes(q))
    ).slice(0, 12);
  }, [heroSearchQuery, bluePickNames, redPickNames]);

  // ==========================================
  // 4. DRAFT SYNERGY & TEAM BALANCE
  // ==========================================
  const draftSynergyAnalytics = useMemo(() => {
    const analyzeTeam = (picks: { hero: Hero | null; pos?: string }[]) => {
      const activeHeroes = picks.map((p) => p.hero).filter(Boolean) as Hero[];
      const count = activeHeroes.length;

      // Count attributes
      let frontlineCount = 0;
      let physicalCount = 0;
      let magicCount = 0;
      let ccCount = 0;
      let mobilityCount = 0;

      activeHeroes.forEach((h) => {
        const roles = h.roles || [];
        const isTank = roles.includes('tank');
        const isFighter = roles.includes('fighter');
        const isMage = roles.includes('mage');
        const isAssassin = roles.includes('assassin');
        const isMarksman = roles.includes('marksman');
        const isSupport = roles.includes('support');

        if (isTank || (isFighter && !isAssassin)) frontlineCount++;
        if (isMarksman || isAssassin || isFighter) physicalCount++;
        if (isMage || isSupport) magicCount++;
        if (isTank || isSupport || isMage) ccCount++;
        if (isAssassin || isMarksman || isFighter) mobilityCount++;
      });

      // Power Curve estimations
      let earlyPower = 'ปานกลาง';
      let midPower = 'แข็งแกร่ง';
      let latePower = 'ปานกลาง';

      if (mobilityCount >= 2 && frontlineCount >= 1) earlyPower = 'แข็งแกร่งมาก (High Tempo)';
      if (frontlineCount >= 2 && count >= 3) midPower = 'คุมไฟต์มังกรยอดเยี่ยม';
      if (physicalCount >= 2 && magicCount >= 1) latePower = 'สเกลเลทเกมสมดุล';

      // Warnings
      const warnings: string[] = [];
      if (count >= 3 && frontlineCount === 0) {
        warnings.push('⚠️ ขาดตัวค้ำแนวหน้า (No Frontline) - ระวังโดนไฟต์ประชิดถล่ม');
      }
      if (count >= 3 && magicCount === 0) {
        warnings.push('⚠️ ดาเมจกายภาพล้วน (All Physical) - ศัตรูออกเกราะกายภาพแก้ทางได้ง่าย');
      }
      if (count >= 3 && physicalCount === 0) {
        warnings.push('⚠️ ขาดดาเมจกายภาพหลัก - ดันป้อมและตบเสาบ้านช้า');
      }
      if (count >= 4 && ccCount <= 1) {
        warnings.push('⚠️ ขาดสกิลหยุด/ควบคุม (Low CC) - รับมือตัวล้วงคล่องตัวลำบาก');
      }

      return {
        activeCount: count,
        frontlineRating: Math.min(100, (frontlineCount / Math.max(1, count)) * 100),
        physicalPercent: Math.round((physicalCount / Math.max(1, physicalCount + magicCount)) * 100) || 50,
        magicPercent: Math.round((magicCount / Math.max(1, physicalCount + magicCount)) * 100) || 50,
        ccRating: Math.min(100, Math.round((ccCount / Math.max(1, count)) * 100)),
        earlyPower,
        midPower,
        latePower,
        warnings,
      };
    };

    return {
      blue: analyzeTeam(bluePicks),
      red: analyzeTeam(redPicks),
    };
  }, [bluePicks, redPicks]);

  return (
    <div className={`w-full bg-white border-2 border-[#F3D5E2] rounded-2xl shadow-sm overflow-hidden font-['Prompt'] transition-all flex flex-col ${className || 'mt-3'}`}>
      {/* ============================================================== */}
      {/* 1. TOP HEADER BANNER (White-Pink 60/30/10 Constitution)         */}
      {/* ============================================================== */}
      <div className="px-3 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-[#FFF0F5] via-white to-[#F0F9FF] border-b-2 border-[#F3D5E2] flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#E91E63] text-white flex items-center justify-center shadow-xs flex-shrink-0 animate-pulse">
            <Sparkles size={16} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-['Orbitron'] font-black text-xs sm:text-sm text-[#E91E63] tracking-wider uppercase">
                TACTICAL DRAFT DASHBOARD
              </span>
              <span className="text-[8.5px] sm:text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>REAL-TIME ENGINE</span>
              </span>
              <span className="text-[8.5px] sm:text-[9.5px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full hidden md:inline-flex items-center gap-1">
                <Clock size={10} className="text-slate-400" />
                <span>RPL 2026 Summer (291 Games)</span>
              </span>
            </div>
            <p className="text-[10px] sm:text-[11.5px] text-slate-600 font-medium truncate mt-0.5">
              ศูนย์วิเคราะห์ดราฟต์เชิงแท็กติกสำหรับโค้ชอีสปอร์ต: ชนะทาง • แพ้ทาง • คอมโบ • แนะนำตัวถัดไป
            </p>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto flex-shrink-0">
          {/* Quick RPL Pro Comps Button */}
          <button
            type="button"
            onClick={() => setIsProCompsOpen(true)}
            title="เปิดดูดราฟต์และคอมพ์ 2-4 ตัวที่นักแข่งโปรชอบใช้ใน RoV Pro League"
            className="font-['Prompt'] text-[10.5px] sm:text-xs font-bold tracking-wider px-2.5 sm:px-3 py-1.5 rounded-xl border border-amber-400 bg-gradient-to-r from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 text-amber-950 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap"
          >
            <span>🏆</span>
            <span className="hidden sm:inline">RPL PRO COMPS</span>
            <span className="sm:hidden">COMPS</span>
            <span className="text-[9.5px] bg-amber-500 text-white font-black px-1.5 py-0.2 rounded-full">
              {RPL_2026_PRO_COMPS.length}
            </span>
          </button>

          {/* Toggle Expand/Collapse */}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer transition-colors border border-slate-200 bg-white shadow-2xs"
            title={isOpen ? 'ย่อแผงแดชบอร์ด' : 'ขยายแผงแดชบอร์ด'}
          >
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-2.5 sm:p-3.5 flex flex-col gap-2.5 bg-[#FFF8FB]/30 max-h-[540px] overflow-y-auto custom-scrollbar flex-1 min-h-0">
          {/* ============================================================== */}
          {/* 2. TACTICAL OVERVIEW: Advantage Bar & Key Metrics Counters      */}
          {/* ============================================================== */}
          <div className="bg-white rounded-2xl border border-[#F3D5E2] p-3 shadow-xs flex flex-col gap-2.5">
            {/* Advantage Score Progress Bar */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-1.5 text-sky-800">
                  <span className="w-2 h-2 rounded-full bg-sky-600" />
                  <span className="font-['Orbitron']">{blueTeamName}</span>
                  <span className="text-[11px] bg-sky-100 text-sky-900 px-1.5 py-0.2 rounded border border-sky-300">
                    {bluePercent}%
                  </span>
                  {blueScore && blueScore.score > 0 && (
                    <span className="text-[10px] text-slate-400 font-normal">
                      (Score: {blueScore.score})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 hidden sm:inline">
                    {advantageSide === 'balanced'
                      ? '⚖️ ดราฟต์สูสี (Balanced Matchup)'
                      : advantageSide === 'blue'
                      ? `🔵 ${blueTeamName} ได้เปรียบเชิงโครงสร้าง (+${percentDiff}%)`
                      : `🔴 ${redTeamName} ได้เปรียบเชิงโครงสร้าง (+${Math.abs(percentDiff)}%)`}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-rose-800">
                  {redScore && redScore.score > 0 && (
                    <span className="text-[10px] text-slate-400 font-normal">
                      (Score: {redScore.score})
                    </span>
                  )}
                  <span className="text-[11px] bg-rose-100 text-rose-900 px-1.5 py-0.2 rounded border border-rose-300">
                    {redPercent}%
                  </span>
                  <span className="font-['Orbitron']">{redTeamName}</span>
                  <span className="w-2 h-2 rounded-full bg-rose-600" />
                </div>
              </div>

              {/* Dual Color Bar */}
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200 shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-sky-600 to-sky-400 transition-all duration-500 ease-out"
                  style={{ width: `${bluePercent}%` }}
                />
                <div
                  className="h-full bg-gradient-to-r from-rose-400 to-rose-600 transition-all duration-500 ease-out"
                  style={{ width: `${redPercent}%` }}
                />
              </div>
            </div>

            {/* Quick KPI Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100 text-xs">
              {/* Card 1: ชนะทาง */}
              <div className="p-2 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                    <TrendingUp size={11} className="text-emerald-600" />
                    <span>คู่ชนะทาง</span>
                  </span>
                  <span className="text-[10.5px] text-slate-500">
                    น้ำเงิน {tacticalOverviewMetrics.blueCounterWins} | แดง {tacticalOverviewMetrics.redCounterWins}
                  </span>
                </div>
                <span className="font-['Orbitron'] font-black text-sm text-emerald-700">
                  {tacticalOverviewMetrics.blueCounterWins + tacticalOverviewMetrics.redCounterWins}
                </span>
              </div>

              {/* Card 2: เสียเปรียบ */}
              <div className="p-2 rounded-xl bg-rose-50/60 border border-rose-200 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-rose-800 uppercase flex items-center gap-1">
                    <ShieldAlert size={11} className="text-rose-600" />
                    <span>คู่เสียเปรียบ</span>
                  </span>
                  <span className="text-[10.5px] text-slate-500">
                    น้ำเงิน {tacticalOverviewMetrics.blueDisadvantages} | แดง {tacticalOverviewMetrics.redDisadvantages}
                  </span>
                </div>
                <span className="font-['Orbitron'] font-black text-sm text-rose-700">
                  {tacticalOverviewMetrics.blueDisadvantages + tacticalOverviewMetrics.redDisadvantages}
                </span>
              </div>

              {/* Card 3: คอมโบที่ค้นพบ */}
              <div className="p-2 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-amber-900 uppercase flex items-center gap-1">
                    <Zap size={11} className="text-amber-600" />
                    <span>คอมโบที่ค้นพบ</span>
                  </span>
                  <span className="text-[10.5px] text-slate-500">
                    น้ำเงิน {tacticalOverviewMetrics.blueCombosCount} | แดง {tacticalOverviewMetrics.redCombosCount}
                  </span>
                </div>
                <span className="font-['Orbitron'] font-black text-sm text-amber-700">
                  {tacticalOverviewMetrics.totalCombosDiscovered}
                </span>
              </div>

              {/* Card 4: สถานะดราฟต์ */}
              <div className="p-2 rounded-xl bg-sky-50/60 border border-sky-200 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-sky-900 uppercase flex items-center gap-1">
                    <Target size={11} className="text-sky-600" />
                    <span>ฮีโร่ในกระดาน</span>
                  </span>
                  <span className="text-[10.5px] text-slate-500">
                    แบนแล้ว {blueBans.filter(Boolean).length + redBans.filter(Boolean).length} ตัว
                  </span>
                </div>
                <span className="font-['Orbitron'] font-black text-sm text-sky-800">
                  {bluePickNames.length + redPickNames.length}/10
                </span>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* TAB 1: TACTICAL OVERVIEW                                       */}
          {/* ============================================================== */}
          {activeDashboardTab === 'overview' && (
            <div className="flex flex-col gap-3">
              {/* Split Blue Side / Red Side Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* BLUE SIDE SUMMARY */}
                <div className="bg-white border-2 border-sky-200 rounded-xl p-3 shadow-2xs flex flex-col gap-2">
                  <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
                      <span className="font-['Orbitron'] font-bold text-xs text-sky-900">
                        {blueTeamName} (BLUE SIDE)
                      </span>
                    </div>
                    <span className="text-[10.5px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                      Pick {bluePickNames.length}/5 • Ban {blueBans.filter(Boolean).length}/4
                    </span>
                  </div>

                  {/* Picked Heroes Avatars Bar */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">ดราฟต์แล้ว:</span>
                    {bluePickNames.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">ยังไม่ได้เลือกฮีโร่</span>
                    ) : (
                      bluePickNames.map((hName) => (
                        <button
                          key={hName}
                          type="button"
                          onClick={() => onInspectHero(hName)}
                          className="flex items-center gap-1 p-1 pr-2 rounded-lg bg-sky-50 border border-sky-200 hover:border-sky-400 transition-all cursor-pointer shadow-2xs text-[11px]"
                          title="คลิกเพื่อวิเคราะห์สถิติฮีโร่ตัวนี้"
                        >
                          <img
                            src={getHeroImageUrl(hName)}
                            alt={hName}
                            className="w-5 h-5 rounded-md object-cover"
                          />
                          <span className="font-bold text-sky-900">{hName}</span>
                        </button>
                      ))
                    )}
                  </div>

                  {/* Active Synergies & Counters on Blue */}
                  <div className="grid grid-cols-2 gap-2 mt-1 text-[11px]">
                    <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-200">
                      <span className="font-bold text-emerald-800 block text-[10px] uppercase">
                        🎯 ชนะทางคู่แข่ง ({tacticalOverviewMetrics.blueCounterWins} คู่)
                      </span>
                      <p className="text-[10.5px] text-slate-600 mt-0.5">
                        {tacticalOverviewMetrics.blueCounterWins > 0
                          ? 'มีฮีโร่ที่ได้เปรียบสถิติเหนือคู่แข่ง'
                          : 'ยังไม่พบคู่ที่ได้เปรียบชัดเจน'}
                      </p>
                    </div>

                    <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-200">
                      <span className="font-bold text-amber-900 block text-[10px] uppercase">
                        ⚡ คอมโบในทีม ({tacticalOverviewMetrics.blueCombosCount} คอมโบ)
                      </span>
                      <p className="text-[10.5px] text-slate-600 mt-0.5">
                        {tacticalOverviewMetrics.blueCombosCount > 0
                          ? 'มีคู่หูที่ประสานงานได้ดีในโปรลีก'
                          : 'กำลังสร้างโครงสร้างคอมโบ'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* RED SIDE SUMMARY */}
                <div className="bg-white border-2 border-rose-200 rounded-xl p-3 shadow-2xs flex flex-col gap-2">
                  <div className="flex items-center justify-between border-b border-rose-100 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                      <span className="font-['Orbitron'] font-bold text-xs text-rose-900">
                        {redTeamName} (RED SIDE)
                      </span>
                    </div>
                    <span className="text-[10.5px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      Pick {redPickNames.length}/5 • Ban {redBans.filter(Boolean).length}/4
                    </span>
                  </div>

                  {/* Picked Heroes Avatars Bar */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">ดราฟต์แล้ว:</span>
                    {redPickNames.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">ยังไม่ได้เลือกฮีโร่</span>
                    ) : (
                      redPickNames.map((hName) => (
                        <button
                          key={hName}
                          type="button"
                          onClick={() => onInspectHero(hName)}
                          className="flex items-center gap-1 p-1 pr-2 rounded-lg bg-rose-50 border border-rose-200 hover:border-rose-400 transition-all cursor-pointer shadow-2xs text-[11px]"
                          title="คลิกเพื่อวิเคราะห์สถิติฮีโร่ตัวนี้"
                        >
                          <img
                            src={getHeroImageUrl(hName)}
                            alt={hName}
                            className="w-5 h-5 rounded-md object-cover"
                          />
                          <span className="font-bold text-rose-900">{hName}</span>
                        </button>
                      ))
                    )}
                  </div>

                  {/* Active Synergies & Counters on Red */}
                  <div className="grid grid-cols-2 gap-2 mt-1 text-[11px]">
                    <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-200">
                      <span className="font-bold text-emerald-800 block text-[10px] uppercase">
                        🎯 ชนะทางคู่แข่ง ({tacticalOverviewMetrics.redCounterWins} คู่)
                      </span>
                      <p className="text-[10.5px] text-slate-600 mt-0.5">
                        {tacticalOverviewMetrics.redCounterWins > 0
                          ? 'มีฮีโร่ที่ได้เปรียบสถิติเหนือคู่แข่ง'
                          : 'ยังไม่พบคู่ที่ได้เปรียบชัดเจน'}
                      </p>
                    </div>

                    <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-200">
                      <span className="font-bold text-amber-900 block text-[10px] uppercase">
                        ⚡ คอมโบในทีม ({tacticalOverviewMetrics.redCombosCount} คอมโบ)
                      </span>
                      <p className="text-[10.5px] text-slate-600 mt-0.5">
                        {tacticalOverviewMetrics.redCombosCount > 0
                          ? 'มีคู่หูที่ประสานงานได้ดีในโปรลีก'
                          : 'กำลังสร้างโครงสร้างคอมโบ'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div className="p-2.5 rounded-xl bg-white border border-[#F3D5E2] flex items-center justify-between flex-wrap gap-2 text-xs">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <Info size={14} className="text-[#E91E63]" />
                  <span>
                    คลิกแท็บ <strong>Smart Pick Recommendation</strong> เพื่อดูฮีโร่ที่แนะนำให้หยิบตัวถัดไป หรือคลิกฮีโร่เพื่อดูสถิติเชิงลึก
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveDashboardTab('recommendations')}
                  className="px-3 py-1 rounded-lg bg-[#E91E63] hover:bg-[#D81B60] text-white font-bold transition-colors cursor-pointer shadow-2xs flex items-center gap-1 text-[11px]"
                >
                  <span>ดูฮีโร่แนะนำตัวถัดไป</span>
                  <ArrowUpRight size={13} />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: SMART RECOMMENDATIONS (BANS & PICKS)                   */}
          {/* ============================================================== */}
          {activeDashboardTab === 'recommendations' && (
            <div className="flex flex-col gap-3 font-['Prompt']">
              {/* RECOMMENDED BANS VIEW */}
              {recommendationMode === 'bans' && (
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 p-0.5 bg-rose-50/80 rounded-xl border border-rose-200">
                      <button
                        type="button"
                        onClick={() => setBanCategoryTab('pro_league')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          banCategoryTab === 'pro_league'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'text-slate-600 hover:text-amber-800'
                        }`}
                      >
                        <span>🔥 1. โปรลีกแบนเยอะ</span>
                        <span className="text-[9px] bg-white/20 px-1 py-0.2 rounded-full font-black">
                          {proLeagueBans.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBanCategoryTab('blue')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          banCategoryTab === 'blue'
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-sky-800'
                        }`}
                      >
                        <span>🔵 2. แนะนำแบนฝั่ง BLUE</span>
                        <span className="text-[9px] bg-white/20 px-1 py-0.2 rounded-full font-black">
                          {blueSideBans.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBanCategoryTab('red')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          banCategoryTab === 'red'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-rose-800'
                        }`}
                      >
                        <span>🔴 3. แนะนำแบนฝั่ง RED</span>
                        <span className="text-[9px] bg-white/20 px-1 py-0.2 rounded-full font-black">
                          {redSideBans.length}
                        </span>
                      </button>
                    </div>

                    <span className="text-[10.5px] text-slate-500 font-medium">
                      สถิติจากการแข่งขันทางการ 291 เกม (RPL 2026 Summer)
                    </span>
                  </div>

                  {smartBanRecommendations.length === 0 ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                      <ShieldAlert size={16} className="text-amber-600 flex-shrink-0" />
                      <span>ไม่สามารถดึงข้อมูลสถิติ RPL 2026 Summer ได้ หรือฮีโร่แนะนำถูกแบนครบทั้งหมดแล้ว</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
                      {smartBanRecommendations.slice(0, 10).map((item) => {
                        const isTopRank = item.rank === 1;

                        return (
                          <div
                            key={item.hero.id}
                            className={`p-3 rounded-xl border flex flex-col justify-between gap-2 transition-all shadow-2xs ${
                              isTopRank
                                ? 'border-amber-400 ring-2 ring-amber-300/80 bg-gradient-to-b from-amber-50/70 via-white to-white'
                                : 'border-rose-200 bg-white hover:border-rose-400 hover:shadow-xs'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              {/* Portrait & Rank Badge */}
                              <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 shadow-2xs">
                                <img
                                  src={item.hero.avatarUrl || getHeroImageUrl(item.hero.name)}
                                  alt={item.hero.name}
                                  className="w-full h-full object-cover"
                                />
                                <span
                                  className={`absolute top-0 left-0 text-[9px] font-['Orbitron'] font-black px-1.5 rounded-br ${
                                    isTopRank
                                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
                                      : 'bg-slate-800 text-white'
                                  }`}
                                >
                                  #{item.rank}
                                </span>
                              </div>

                              {/* Hero Name & Ban Score */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <button
                                    type="button"
                                    onClick={() => onInspectHero(item.hero.name)}
                                    className="font-bold text-xs sm:text-sm text-slate-900 hover:text-[#E11D48] transition-colors truncate text-left cursor-pointer"
                                    title="คลิกเพื่อดูสถิติเชิงลึก"
                                  >
                                    {item.hero.name}
                                  </button>
                                  <span
                                    className={`text-[9.5px] font-['Orbitron'] font-black px-1.5 py-0.2 rounded border ${
                                      isTopRank
                                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                                        : 'bg-rose-50 text-rose-800 border-rose-200'
                                    }`}
                                  >
                                    {item.score}/100
                                  </span>
                                </div>

                                <div className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5 truncate">
                                  {item.hero.primaryPos || (item.hero.pos && item.hero.pos[0])}
                                  {item.hero.nameTh ? ` • ${item.hero.nameTh}` : ''}
                                </div>
                              </div>
                            </div>

                            {/* Official RPL Stats Line */}
                            <div className="p-2 rounded-lg bg-rose-50/60 border border-rose-100 flex flex-col gap-1 text-[10.5px] font-medium text-slate-600">
                              <div className="flex items-center justify-between">
                                <span className="text-rose-700 font-bold">🚫 Ban: {item.stats.banRate}%</span>
                                <span className="text-slate-400">({item.stats.bans} ครั้ง)</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-emerald-700 font-bold">🏆 WR: {item.stats.winRate}%</span>
                                <span className="text-purple-700 font-bold">⚡ P&B: {item.stats.presenceRate}%</span>
                              </div>
                              {item.sideContext && (
                                <div className="text-[9.5px] font-bold text-slate-700 pt-0.5 border-t border-slate-200/60 truncate">
                                  📊 {item.sideContext}
                                </div>
                              )}
                            </div>

                            {/* Tactical Reason */}
                            <p className="text-[10px] text-slate-600 line-clamp-2 leading-relaxed">
                              {item.reason}
                            </p>

                            {/* Action Ban Button */}
                            {(onBanHeroDirectly || onPickHeroDirectly) && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (onBanHeroDirectly) onBanHeroDirectly(item.hero.name);
                                  else if (onPickHeroDirectly) onPickHeroDirectly(item.hero.name);
                                }}
                                className="w-full py-1.5 rounded-lg bg-gradient-to-r from-[#E11D48] to-[#BE123C] hover:from-[#BE123C] hover:to-[#9F1239] text-white text-[11px] font-bold tracking-wide transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1 active:scale-95 mt-1"
                                title={`แบน ${item.hero.name}`}
                              >
                                <Ban size={12} />
                                <span>แบน {item.hero.name}</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* RECOMMENDED PICKS VIEW */}
              {recommendationMode === 'picks' && (
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2">
                    <span className="font-bold text-slate-700 text-xs">
                      🏆 แนะนำตัวเลือกสำหรับฝั่ง {activeTeam === 'blue' ? blueTeamName : redTeamName} ({smartPickRecommendations.length} ตัว)
                    </span>
                    <div className="flex items-center gap-1 text-[10.5px] flex-wrap">
                      {['all', 'dsl', 'jg', 'mid', 'roam', 'adl'].map((pos) => (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => setRecommendationLaneFilter(pos)}
                          className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer uppercase ${
                            recommendationLaneFilter === pos
                              ? 'bg-[#E91E63] text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {pos === 'all' ? 'ทุกลำดับ' : pos}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {smartPickRecommendations.map((item, index) => {
                    const rank = index + 1;
                    const isTopRank = rank === 1;

                    return (
                      <div
                        key={item.hero.id}
                        className={`p-3 rounded-xl border flex flex-col justify-between gap-2 transition-all bg-white shadow-2xs ${
                          isTopRank
                            ? 'border-amber-400 ring-1 ring-amber-300 bg-gradient-to-b from-amber-50/30 to-white'
                            : 'border-slate-200 hover:border-[#E91E63]'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {/* Portrait & Rank Badge */}
                          <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0">
                            <img
                              src={item.hero.avatarUrl || getHeroImageUrl(item.hero.name)}
                              alt={item.hero.name}
                              className="w-full h-full object-cover"
                            />
                            <span
                              className={`absolute top-0 left-0 text-[8.5px] font-['Orbitron'] font-black px-1 rounded-br ${
                                isTopRank ? 'bg-amber-500 text-white' : 'bg-slate-800 text-white'
                              }`}
                            >
                              #{rank}
                            </span>
                          </div>

                          {/* Hero Name & Position */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <button
                                type="button"
                                onClick={() => onInspectHero(item.hero.name)}
                                className="font-bold text-xs sm:text-sm text-slate-900 hover:text-[#E91E63] transition-colors truncate text-left cursor-pointer"
                              >
                                {item.hero.name}
                              </button>
                              <span
                                className={`text-[9.5px] font-['Orbitron'] font-black px-1.5 py-0.2 rounded border ${
                                  item.score >= 80
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                    : 'bg-amber-50 text-amber-800 border-amber-300'
                                }`}
                              >
                                {item.score}/100
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                              <span className="font-semibold text-slate-700 uppercase bg-slate-100 px-1 py-0.2 rounded">
                                {item.primaryPos}
                              </span>
                              {item.tourneyStats && (
                                <span className="text-emerald-700 font-bold">
                                  WR {item.tourneyStats.winRate}% ({item.tourneyStats.games}G)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Tactical Reasons Chips */}
                        <div className="flex flex-col gap-1 text-[10.5px]">
                          {item.reasons.length > 0 ? (
                            item.reasons.slice(0, 3).map((r, i) => (
                              <span
                                key={i}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 ${
                                  r.type === 'counter'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : r.type === 'synergy'
                                    ? 'bg-amber-50 text-amber-900 border border-amber-200'
                                    : r.type === 'signature'
                                    ? 'bg-purple-50 text-purple-900 border border-purple-200 font-bold'
                                    : 'bg-slate-50 text-slate-700 border border-slate-200'
                                }`}
                              >
                                <span>{r.type === 'counter' ? '🎯' : r.type === 'synergy' ? '⚡' : '🛡️'}</span>
                                <span className="truncate">{r.text}</span>
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">
                              ไม่มีข้อมูลความสัมพันธ์เด่นเป็นพิเศษ
                            </span>
                          )}
                        </div>

                        {/* Action Pick Button */}
                        {isPickTurn && onPickHeroDirectly && (
                          <button
                            type="button"
                            onClick={() => onPickHeroDirectly(item.hero.name)}
                            className="w-full py-1.5 rounded-lg bg-[#E91E63] hover:bg-[#D81B60] text-white text-[11px] font-bold transition-colors cursor-pointer shadow-2xs flex items-center justify-center gap-1 mt-1"
                          >
                            <Check size={12} />
                            <span>หยิบ {item.hero.name} ลงดราฟต์</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: DRAFT SYNERGY & TEAM BALANCE                            */}
          {/* ============================================================== */}
          {activeDashboardTab === 'synergy' && (
            <div className="flex flex-col gap-3 text-xs">
              {/* Synergy Header with Team Filter */}
              <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-[#F3D5E2]/60">
                <span className="font-['Prompt'] font-bold text-slate-700 text-xs flex items-center gap-1.5">
                  <Layers size={14} className="text-purple-600" />
                  <span>สมดุลโครงสร้างทีมและการประสานคอมโบ</span>
                </span>
                <div className="flex items-center gap-1 bg-white border border-[#F3D5E2] p-0.5 rounded-xl shadow-2xs text-[11px]">
                  <button
                    type="button"
                    onClick={() => setTeamFilter('all')}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-colors cursor-pointer ${
                      teamFilter === 'all' ? 'bg-[#E91E63] text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ทั้งสองทีม
                  </button>
                  <button
                    type="button"
                    onClick={() => setTeamFilter('blue')}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                      teamFilter === 'blue' ? 'bg-sky-600 text-white' : 'text-sky-700 hover:bg-sky-50'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                    <span>Blue</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTeamFilter('red')}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                      teamFilter === 'red' ? 'bg-rose-600 text-white' : 'text-rose-700 hover:bg-rose-50'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span>Red</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* BLUE TEAM BALANCE */}
                <div className="p-3 bg-white rounded-xl border-2 border-sky-200 shadow-2xs flex flex-col gap-2.5">
                  <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                    <span className="font-bold text-sky-900 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
                      <span>โครงสร้างทีม {blueTeamName}</span>
                    </span>
                    <span className="text-[10.5px] font-bold text-slate-500">
                      {draftSynergyAnalytics.blue.activeCount}/5 ฮีโร่
                    </span>
                  </div>

                  {/* Attributes Bars */}
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-0.5">
                        <span className="font-semibold text-slate-600">🛡️ ตัวค้ำแนวหน้า (Frontline)</span>
                        <span className="font-bold text-slate-800">
                          {Math.round(draftSynergyAnalytics.blue.frontlineRating)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-600 rounded-full transition-all"
                          style={{ width: `${draftSynergyAnalytics.blue.frontlineRating}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-0.5">
                        <span className="font-semibold text-slate-600">⚔️ สัดส่วนดาเมจ (กายภาพ vs เวท)</span>
                        <span className="font-bold text-slate-800">
                          {draftSynergyAnalytics.blue.physicalPercent}% Phys / {draftSynergyAnalytics.blue.magicPercent}% Magic
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-purple-100 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-orange-500 transition-all"
                          style={{ width: `${draftSynergyAnalytics.blue.physicalPercent}%` }}
                        />
                        <div
                          className="h-full bg-purple-600 transition-all"
                          style={{ width: `${draftSynergyAnalytics.blue.magicPercent}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-0.5">
                        <span className="font-semibold text-slate-600">💫 การควบคุมและสตั๊นท์ (Crowd Control)</span>
                        <span className="font-bold text-slate-800">{draftSynergyAnalytics.blue.ccRating}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${draftSynergyAnalytics.blue.ccRating}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Power Curve */}
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] flex flex-col gap-1">
                    <span className="font-bold text-slate-700">กราฟพลังตามช่วงเวลา (Power Curve):</span>
                    <div className="grid grid-cols-3 gap-1 text-[10px]">
                      <div className="p-1 rounded bg-white border border-slate-100 text-center">
                        <span className="text-slate-400 block">ต้นเกม (0-5m)</span>
                        <span className="font-bold text-slate-800">{draftSynergyAnalytics.blue.earlyPower}</span>
                      </div>
                      <div className="p-1 rounded bg-white border border-slate-100 text-center">
                        <span className="text-slate-400 block">กลางเกม (5-12m)</span>
                        <span className="font-bold text-slate-800">{draftSynergyAnalytics.blue.midPower}</span>
                      </div>
                      <div className="p-1 rounded bg-white border border-slate-100 text-center">
                        <span className="text-slate-400 block">เลทเกม (12m+)</span>
                        <span className="font-bold text-slate-800">{draftSynergyAnalytics.blue.latePower}</span>
                      </div>
                    </div>
                  </div>

                  {/* Warnings */}
                  {draftSynergyAnalytics.blue.warnings.length > 0 && (
                    <div className="space-y-1">
                      {draftSynergyAnalytics.blue.warnings.map((w, i) => (
                        <div key={i} className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-[10.5px] text-rose-800 font-medium">
                          {w}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* RED TEAM BALANCE */}
                <div className="p-3 bg-white rounded-xl border-2 border-rose-200 shadow-2xs flex flex-col gap-2.5">
                  <div className="flex items-center justify-between border-b border-rose-100 pb-2">
                    <span className="font-bold text-rose-900 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                      <span>โครงสร้างทีม {redTeamName}</span>
                    </span>
                    <span className="text-[10.5px] font-bold text-slate-500">
                      {draftSynergyAnalytics.red.activeCount}/5 ฮีโร่
                    </span>
                  </div>

                  {/* Attributes Bars */}
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-0.5">
                        <span className="font-semibold text-slate-600">🛡️ ตัวค้ำแนวหน้า (Frontline)</span>
                        <span className="font-bold text-slate-800">
                          {Math.round(draftSynergyAnalytics.red.frontlineRating)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-600 rounded-full transition-all"
                          style={{ width: `${draftSynergyAnalytics.red.frontlineRating}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-0.5">
                        <span className="font-semibold text-slate-600">⚔️ สัดส่วนดาเมจ (กายภาพ vs เวท)</span>
                        <span className="font-bold text-slate-800">
                          {draftSynergyAnalytics.red.physicalPercent}% Phys / {draftSynergyAnalytics.red.magicPercent}% Magic
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-purple-100 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-orange-500 transition-all"
                          style={{ width: `${draftSynergyAnalytics.red.physicalPercent}%` }}
                        />
                        <div
                          className="h-full bg-purple-600 transition-all"
                          style={{ width: `${draftSynergyAnalytics.red.magicPercent}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-0.5">
                        <span className="font-semibold text-slate-600">💫 การควบคุมและสตั๊นท์ (Crowd Control)</span>
                        <span className="font-bold text-slate-800">{draftSynergyAnalytics.red.ccRating}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${draftSynergyAnalytics.red.ccRating}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Power Curve */}
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] flex flex-col gap-1">
                    <span className="font-bold text-slate-700">กราฟพลังตามช่วงเวลา (Power Curve):</span>
                    <div className="grid grid-cols-3 gap-1 text-[10px]">
                      <div className="p-1 rounded bg-white border border-slate-100 text-center">
                        <span className="text-slate-400 block">ต้นเกม (0-5m)</span>
                        <span className="font-bold text-slate-800">{draftSynergyAnalytics.red.earlyPower}</span>
                      </div>
                      <div className="p-1 rounded bg-white border border-slate-100 text-center">
                        <span className="text-slate-400 block">กลางเกม (5-12m)</span>
                        <span className="font-bold text-slate-800">{draftSynergyAnalytics.red.midPower}</span>
                      </div>
                      <div className="p-1 rounded bg-white border border-slate-100 text-center">
                        <span className="text-slate-400 block">เลทเกม (12m+)</span>
                        <span className="font-bold text-slate-800">{draftSynergyAnalytics.red.latePower}</span>
                      </div>
                    </div>
                  </div>

                  {/* Warnings */}
                  {draftSynergyAnalytics.red.warnings.length > 0 && (
                    <div className="space-y-1">
                      {draftSynergyAnalytics.red.warnings.map((w, i) => (
                        <div key={i} className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-[10.5px] text-rose-800 font-medium">
                          {w}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 5: RADAR PREDICTIONS (Original Predictive Insights)       */}
          {/* ============================================================== */}
          {activeDashboardTab === 'predictions' && (
            <div className="flex flex-col gap-3">
              {!hasAnyDraftActions ? (
                <div className="py-8 px-4 text-center bg-white rounded-xl border border-dashed border-[#F3D5E2] flex flex-col items-center justify-center">
                  <Target size={24} className="text-[#E91E63] mb-1.5" />
                  <span className="font-bold text-slate-800 text-xs">
                    พร้อมเริ่มการวิเคราะห์ดราฟต์เชิงแท็กติก (Tactical Radar)
                  </span>
                  <span className="text-[11px] text-slate-400 max-w-[480px] mt-0.5">
                    เมื่อเริ่มดราฟต์และมีการแบนหรือเลือกฮีโร่ตัวแรก
                    ระบบจะคำนวณทันทีว่าคู่แข่งแบนตัวนี้เพื่อเตรียมหยิบตัวไหน หรือเลือกตัวนี้เพื่อเตรียมคอมโบกับตัวใด!
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* Left Column: BLUE TEAM PREDICTIONS */}
                  {(teamFilter === 'all' || teamFilter === 'blue') && (
                    <div className="p-2.5 rounded-xl bg-sky-50/30 border border-sky-200/80 shadow-2xs flex flex-col gap-2">
                      <div className="flex items-center justify-between pb-1.5 border-b border-sky-100">
                        <span className="font-bold text-xs text-sky-900 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-sky-600" />
                          <span>ข้อเสนอแนะแท็กติกสำหรับ {blueTeamName}</span>
                        </span>
                      </div>

                      {/* Synergies for Blue */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                          ⚡ คอมโบที่แนะนำให้หยิบเพิ่ม:
                        </span>
                        {intelligence.pickSynergies
                          .filter((p) => p.team === 'blue')
                          .slice(0, 3)
                          .map((syn) => (
                            <div
                              key={syn.id}
                              className="p-2 rounded-lg bg-white border border-slate-200 text-xs flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <img
                                  src={getHeroImageUrl(syn.suggestedHero)}
                                  alt={syn.suggestedHero}
                                  className="w-7 h-7 rounded-md object-cover border border-slate-200"
                                />
                                <div>
                                  <div className="font-bold text-slate-900 text-xs">
                                    {syn.suggestedHero} ({syn.comboName})
                                  </div>
                                  <div className="text-[10px] text-slate-500">{syn.reason}</div>
                                </div>
                              </div>
                              {isPickTurn && onPickHeroDirectly && syn.isAvailable && (
                                <button
                                  type="button"
                                  onClick={() => onPickHeroDirectly(syn.suggestedHero)}
                                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E91E63] text-white hover:bg-[#D81B60] cursor-pointer"
                                >
                                  หยิบ
                                </button>
                              )}
                            </div>
                          ))}
                      </div>

                      {/* Counters for Blue to deal with Red */}
                      <div className="space-y-1.5 mt-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                          🎯 ตัวแก้ทางที่แนะนำให้เลือกใส่ศัตรู:
                        </span>
                        {intelligence.counterSuggestions
                          .filter((c) => c.targetTeam === 'red')
                          .slice(0, 3)
                          .map((ctr) => (
                            <div
                              key={ctr.id}
                              className="p-2 rounded-lg bg-white border border-slate-200 text-xs flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <img
                                  src={getHeroImageUrl(ctr.counterHero)}
                                  alt={ctr.counterHero}
                                  className="w-7 h-7 rounded-md object-cover border border-slate-200"
                                />
                                <div>
                                  <div className="font-bold text-slate-900 text-xs">
                                    {ctr.counterHero} (แก้ทาง {ctr.targetHero})
                                  </div>
                                  <div className="text-[10px] text-slate-500">{ctr.reason}</div>
                                </div>
                              </div>
                              {isPickTurn && onPickHeroDirectly && ctr.isAvailable && (
                                <button
                                  type="button"
                                  onClick={() => onPickHeroDirectly(ctr.counterHero)}
                                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E91E63] text-white hover:bg-[#D81B60] cursor-pointer"
                                >
                                  หยิบ
                                </button>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Right Column: RED TEAM PREDICTIONS */}
                  {(teamFilter === 'all' || teamFilter === 'red') && (
                    <div className="p-2.5 rounded-xl bg-rose-50/30 border border-rose-200/80 shadow-2xs flex flex-col gap-2">
                      <div className="flex items-center justify-between pb-1.5 border-b border-rose-100">
                        <span className="font-bold text-xs text-rose-900 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-600" />
                          <span>ข้อเสนอแนะแท็กติกสำหรับ {redTeamName}</span>
                        </span>
                      </div>

                      {/* Synergies for Red */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                          ⚡ คอมโบที่แนะนำให้หยิบเพิ่ม:
                        </span>
                        {intelligence.pickSynergies
                          .filter((p) => p.team === 'red')
                          .slice(0, 3)
                          .map((syn) => (
                            <div
                              key={syn.id}
                              className="p-2 rounded-lg bg-white border border-slate-200 text-xs flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <img
                                  src={getHeroImageUrl(syn.suggestedHero)}
                                  alt={syn.suggestedHero}
                                  className="w-7 h-7 rounded-md object-cover border border-slate-200"
                                />
                                <div>
                                  <div className="font-bold text-slate-900 text-xs">
                                    {syn.suggestedHero} ({syn.comboName})
                                  </div>
                                  <div className="text-[10px] text-slate-500">{syn.reason}</div>
                                </div>
                              </div>
                              {isPickTurn && onPickHeroDirectly && syn.isAvailable && (
                                <button
                                  type="button"
                                  onClick={() => onPickHeroDirectly(syn.suggestedHero)}
                                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E91E63] text-white hover:bg-[#D81B60] cursor-pointer"
                                >
                                  หยิบ
                                </button>
                              )}
                            </div>
                          ))}
                      </div>

                      {/* Counters for Red to deal with Blue */}
                      <div className="space-y-1.5 mt-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                          🎯 ตัวแก้ทางที่แนะนำให้เลือกใส่ศัตรู:
                        </span>
                        {intelligence.counterSuggestions
                          .filter((c) => c.targetTeam === 'blue')
                          .slice(0, 3)
                          .map((ctr) => (
                            <div
                              key={ctr.id}
                              className="p-2 rounded-lg bg-white border border-slate-200 text-xs flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <img
                                  src={getHeroImageUrl(ctr.counterHero)}
                                  alt={ctr.counterHero}
                                  className="w-7 h-7 rounded-md object-cover border border-slate-200"
                                />
                                <div>
                                  <div className="font-bold text-slate-900 text-xs">
                                    {ctr.counterHero} (แก้ทาง {ctr.targetHero})
                                  </div>
                                  <div className="text-[10px] text-slate-500">{ctr.reason}</div>
                                </div>
                              </div>
                              {isPickTurn && onPickHeroDirectly && ctr.isAvailable && (
                                <button
                                  type="button"
                                  onClick={() => onPickHeroDirectly(ctr.counterHero)}
                                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E91E63] text-white hover:bg-[#D81B60] cursor-pointer"
                                >
                                  หยิบ
                                </button>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* 5. DATA CONTROL & SOURCE FOOTER BAR                            */}
          {/* ============================================================== */}
          <div className="pt-2 border-t border-[#F3D5E2] flex items-center justify-between flex-wrap gap-2 text-[10.5px] text-slate-500">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <BarChart3 size={12} className="text-[#E91E63]" />
                <span>แหล่งสถิติ: {RPL_2026_SUMMER_DATASET.tournamentName}</span>
              </span>
              <span>•</span>
              <span>ฐานข้อมูลคำนวณจาก {RPL_2026_SUMMER_DATASET.totalGames} เกม ({RPL_2026_SUMMER_DATASET.totalMatches} แมตช์)</span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold">อัปเดตเรียลไทม์ตามสถานะดราฟต์</span>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 6. RPL PRO COMPS SECTION (ต่อท้าย REAL-TIME TACTICAL RADAR)    */}
          {/* ============================================================== */}
          <div className="mt-1 pt-2.5 sm:pt-3 border-t-2 border-[#F3D5E2] bg-gradient-to-r from-amber-50/70 via-white to-amber-50/40 rounded-xl p-2.5 sm:p-3 flex items-center justify-between flex-wrap gap-2.5 shadow-2xs">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center text-base shadow-2xs flex-shrink-0">
                🏆
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-['Orbitron'] font-bold text-xs sm:text-[13px] text-amber-950 tracking-wide">
                    RPL PRO META COMPS
                  </span>
                  <span className="text-[9.5px] font-bold bg-amber-200/80 text-amber-900 border border-amber-300 px-2 py-0.2 rounded-full">
                    {RPL_2026_PRO_COMPS.length} คอมโบดราฟต์โปรลีก
                  </span>
                </div>
                <p className="text-[10.5px] sm:text-[11.5px] text-slate-600 font-medium">
                  ดราฟต์และคอมพ์ 2-4 ตัวที่นักแข่งโปรใช้จริง พร้อมลิสต์ตัวแก้ทางที่โปรต้องแบนในแต่ละแผน
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsProCompsOpen(true)}
              className="font-['Prompt'] text-[11px] sm:text-xs font-bold tracking-wider px-3 sm:px-3.5 py-1.5 rounded-xl border border-amber-400 bg-gradient-to-r from-amber-50 via-amber-100 to-amber-200 hover:from-amber-100 hover:to-amber-300 text-amber-950 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap ml-auto"
              title="เปิดดูดราฟต์และคอมพ์ยอดฮิตที่นักแข่งโปรใช้ใน RoV Pro League"
            >
              <span className="text-sm">🏆</span>
              <span>RPL PRO COMPS</span>
              <span className="text-[10px] bg-amber-500 text-white font-black px-1.5 py-0.2 rounded-full shadow-2xs">
                {RPL_2026_PRO_COMPS.length}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Pro Comps Modal */}
      <ProCompsModal
        isOpen={isProCompsOpen}
        onClose={() => setIsProCompsOpen(false)}
        bannedHeroNames={bannedHeroNames}
        pickedHeroNames={pickedHeroNames}
        bluePicks={bluePicks}
        redPicks={redPicks}
        activeTeam={activeTeam}
        onInspectHero={onInspectHero}
        onPickHeroDirectly={onPickHeroDirectly}
        onBanHeroDirectly={onBanHeroDirectly}
        isPickTurn={isPickTurn}
        isBanTurn={isBanTurn}
      />
    </div>
  );
};
