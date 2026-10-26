import React, { useState, useMemo, useEffect } from 'react';
import { Hero } from '../types/draft';
import { Player, HeroPlayerBadge } from '../types/player';
import { PickSlotState } from '../hooks/useDraconmindDraft';
import {
  analyzeCoachDraft,
  CoachAnalysisResult,
  SmartBanItem,
} from '../services/coachAnalysisService';
import {
  evaluateDraftSafety,
  analyzeEnemyThreats,
  analyzeTeamIdentity,
  evaluatePlayerFitWithRoles,
  getComboFallbackAudits,
  generatePostDraftSummary,
  META_SUBSTITUTE_GUIDE,
  DraftSafetyReport,
  EnemyThreatReport,
  TeamIdentityReport,
  PlayerFitReport,
  PostDraftSummaryReport,
  ComboFallbackReportItem,
} from '../services/decisionSupportService';
import { getHeroImageUrl, HEROES } from '../data/heroes';
import { RPL_2026_PRO_COMPS, ProMetaComp } from '../data/proMetaComps';
import { statsDataProvider } from '../services/statsDataProvider';
import {
  X,
  Swords,
  Shield,
  Zap,
  Target,
  Users,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Info,
  Flame,
  Layers,
  Ban,
  Check,
  Star,
  RefreshCw,
  HelpCircle,
  Eye,
  Crosshair,
  FileText,
  Clock,
  Compass,
  BookOpen,
  ExternalLink,
} from 'lucide-react';

export type AssistantSituationalMode = 'inspect' | 'counter_opp' | 'banned_combos' | 'smart_ban' | 'summary';

interface UnifiedDraftAssistantProps {
  heroName: string | null;
  onClose: () => void;
  // Draft State
  activeTurnTeam: 'blue' | 'red';
  bluePicks: PickSlotState[];
  redPicks: PickSlotState[];
  blueBans: (Hero | null)[];
  redBans: (Hero | null)[];
  bannedHeroNames: Set<string>;
  pickedHeroNames: Set<string>;
  allHeroes: Hero[];
  // Team Context
  blueTeamName: string;
  redTeamName: string;
  blueIsUs: boolean;
  // Players
  players: Player[];
  heroToPlayersMap: Record<string, HeroPlayerBadge[]>;
  // Interactions
  onSelectHeroToInspect: (heroName: string) => void;
  onPickHeroDirectly?: (hero: Hero) => void;
  isPickTurn?: boolean;
  isBanTurn?: boolean;
  isDraftComplete?: boolean;
  onOpenPostDraftModal?: () => void;
  matchMetadata?: {
    tournament?: string;
    match?: string;
    gameNumber?: number;
    patch?: string;
  };
}

export const UnifiedDraftAssistant: React.FC<UnifiedDraftAssistantProps> = ({
  heroName,
  onClose,
  activeTurnTeam,
  bluePicks,
  redPicks,
  blueBans,
  redBans,
  bannedHeroNames,
  pickedHeroNames,
  allHeroes,
  blueTeamName,
  redTeamName,
  blueIsUs,
  players,
  heroToPlayersMap,
  onSelectHeroToInspect,
  onPickHeroDirectly,
  isPickTurn = false,
  isBanTurn = false,
  isDraftComplete = false,
  onOpenPostDraftModal,
  matchMetadata,
}) => {
  // Target hero object being inspected/previewed
  const currentHero = useMemo(() => {
    if (!heroName) return null;
    return allHeroes.find((h) => h.name.toLowerCase() === heroName.toLowerCase()) || null;
  }, [heroName, allHeroes]);

  // 3-Seasons Statistics Breakdown for Inspected Hero (1. ข้อมูลรวม 2. Winter 2026 3. Summer 2026)
  const inspectedHeroAllStats = useMemo(() => {
    if (!currentHero) return null;
    return statsDataProvider.getHeroAllSeasonsStats(currentHero.name);
  }, [currentHero]);

  // Situational Tab Mode State:
  const [situationalMode, setSituationalMode] = useState<AssistantSituationalMode>(() => {
    if (isDraftComplete) return 'summary';
    if (isBanTurn) return 'smart_ban';
    if (currentHero) return 'inspect';
    return 'counter_opp';
  });

  // Auto-switch mode based on situational events
  useEffect(() => {
    if (isDraftComplete) {
      setSituationalMode('summary');
    } else if (isBanTurn) {
      setSituationalMode('smart_ban');
    }
  }, [isDraftComplete, isBanTurn]);

  // When a hero is clicked to inspect, automatically activate 'inspect' mode
  useEffect(() => {
    if (heroName && !isDraftComplete) {
      setSituationalMode('inspect');
    }
  }, [heroName, isDraftComplete]);

  // Collapsible accordion states
  const [openSections, setOpenSections] = useState<{
    safetyBanner: boolean;
    identity: boolean;
    playerFit: boolean;
    fallbackSubs: boolean;
    combos: boolean;
    opponent: boolean;
    counters: boolean;
  }>({
    safetyBanner: false,
    identity: true,
    playerFit: true,
    fallbackSubs: true,
    combos: true,
    opponent: true,
    counters: true,
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Tactical Sub-Tab for Hero Consideration Mode (All vs Player vs Fallback vs Combos vs Threats)
  const [inspectSubTab, setInspectSubTab] = useState<'all' | 'playerFit' | 'fallbackSubs' | 'combos' | 'opponent'>('all');

  // 1. My Picks vs Opponent Picks
  const myPicks = activeTurnTeam === 'blue' ? bluePicks : redPicks;
  const oppPicks = activeTurnTeam === 'blue' ? redPicks : bluePicks;
  const myTeamName = activeTurnTeam === 'blue' ? blueTeamName : redTeamName;
  const oppTeamName = activeTurnTeam === 'blue' ? redTeamName : blueTeamName;

  // 2. DECISION SUPPORT 1: Draft Safety Check
  const draftSafetyReport: DraftSafetyReport = useMemo(() => {
    return evaluateDraftSafety(myPicks, oppPicks, heroToPlayersMap);
  }, [myPicks, oppPicks, heroToPlayersMap]);

  // 3. DECISION SUPPORT 2: Enemy Threat Analysis
  const enemyThreatReport: EnemyThreatReport = useMemo(() => {
    return analyzeEnemyThreats(
      oppPicks,
      myPicks,
      allHeroes,
      bannedHeroNames,
      pickedHeroNames,
      oppTeamName,
      heroToPlayersMap
    );
  }, [oppPicks, myPicks, allHeroes, bannedHeroNames, pickedHeroNames, oppTeamName, heroToPlayersMap]);

  // 4. DECISION SUPPORT 3: Team Identity Analysis
  const teamIdentityReport: TeamIdentityReport = useMemo(() => {
    return analyzeTeamIdentity(myPicks, currentHero);
  }, [myPicks, currentHero]);

  // 5. DECISION SUPPORT 4: Player Fit with Role Suitability (Phase P1)
  const playerFitReport: PlayerFitReport = useMemo(() => {
    if (!currentHero) {
      return {
        heroName: '',
        hasComfortData: false,
        bestFitPlayer: null,
        otherPlayers: [],
        allPlayersWithHero: [],
        provenance: 'ฐานข้อมูลไลน์อัปนักแข่ง MCU',
      };
    }
    return evaluatePlayerFitWithRoles(currentHero.name, players, heroToPlayersMap);
  }, [currentHero, players, heroToPlayersMap]);

  // 6. DECISION SUPPORT 5: Post-Draft Summary (Phase P3)
  const postDraftSummary: PostDraftSummaryReport = useMemo(() => {
    return generatePostDraftSummary(myPicks, oppPicks, myTeamName, oppTeamName, {
      isDraftComplete,
      blueIsUs,
      ourBans: blueIsUs ? blueBans : redBans,
      oppBans: blueIsUs ? redBans : blueBans,
      matchMetadata: matchMetadata
        ? {
            tournament: matchMetadata.tournament || 'RoV RPL 2026',
            match: matchMetadata.match || 'Match',
            gameNumber: matchMetadata.gameNumber || 1,
            patch: matchMetadata.patch || 'Latest',
          }
        : undefined,
      players,
      heroToPlayersMap,
      bannedHeroNames,
      pickedHeroNames,
    });
  }, [
    myPicks,
    oppPicks,
    myTeamName,
    oppTeamName,
    isDraftComplete,
    blueIsUs,
    blueBans,
    redBans,
    matchMetadata,
    players,
    heroToPlayersMap,
    bannedHeroNames,
    pickedHeroNames,
  ]);

  // 7. DECISION SUPPORT 6: Combo Fallback Audits (Phase P1)
  const comboFallbackAudits: ComboFallbackReportItem[] = useMemo(() => {
    return getComboFallbackAudits(bannedHeroNames, pickedHeroNames, heroToPlayersMap);
  }, [bannedHeroNames, pickedHeroNames, heroToPlayersMap]);

  // Run Coach Analysis Engine (Preserved for baseline recommendations)
  const analysis: CoachAnalysisResult = useMemo(() => {
    return analyzeCoachDraft({
      activeTeam: activeTurnTeam,
      myPicks,
      oppPicks,
      myBans: activeTurnTeam === 'blue' ? blueBans : redBans,
      oppBans: activeTurnTeam === 'blue' ? redBans : blueBans,
      inspectedHero: currentHero,
      players,
      heroToPlayersMap,
      allHeroes,
      bannedHeroNames,
      pickedHeroNames,
    });
  }, [
    activeTurnTeam,
    myPicks,
    oppPicks,
    blueBans,
    redBans,
    currentHero,
    players,
    heroToPlayersMap,
    allHeroes,
    bannedHeroNames,
    pickedHeroNames,
  ]);

  // Top recommendation pick for current pick turn (Section 7.1)
  const topRecommendedPick = useMemo(() => {
    return analysis.suggestedPicks.find(
      (p) => !bannedHeroNames.has(p.hero.name) && !pickedHeroNames.has(p.hero.name)
    ) || analysis.suggestedPicks[0] || null;
  }, [analysis.suggestedPicks, bannedHeroNames, pickedHeroNames]);

  // Player fit for the top recommended pick when no hero is clicked
  const topPickPlayerFit = useMemo(() => {
    if (!topRecommendedPick) return null;
    return evaluatePlayerFitWithRoles(topRecommendedPick.hero.name, players, heroToPlayersMap);
  }, [topRecommendedPick, players, heroToPlayersMap]);

  // Opponent locked picks list
  const oppLockedHeroes = useMemo(() => {
    return oppPicks.map((p) => p.hero).filter((h): h is Hero => h !== null);
  }, [oppPicks]);

  // Selected opponent hero to analyze counter responses
  const [selectedOppHeroName, setSelectedOppHeroName] = useState<string | null>(null);

  const activeOppHero = useMemo(() => {
    if (selectedOppHeroName) {
      return (
        oppLockedHeroes.find((h) => h.name.toLowerCase() === selectedOppHeroName.toLowerCase()) ||
        oppLockedHeroes[oppLockedHeroes.length - 1] ||
        null
      );
    }
    return oppLockedHeroes[oppLockedHeroes.length - 1] || null;
  }, [selectedOppHeroName, oppLockedHeroes]);

  // Status of the inspected hero (available, picked, banned)
  const heroStatus = useMemo(() => {
    if (!currentHero) return null;
    const name = currentHero.name;
    const isBanned = bannedHeroNames.has(name);
    const isBluePick = bluePicks.some((p) => p.hero?.name.toLowerCase() === name.toLowerCase());
    const isRedPick = redPicks.some((p) => p.hero?.name.toLowerCase() === name.toLowerCase());

    if (isBanned)
      return {
        label: 'ถูกแบนในเกมนี้',
        color: 'bg-rose-100 text-rose-800 border-rose-300',
        isAvailable: false,
        type: 'banned',
      };
    if (isBluePick)
      return {
        label: `Blue Pick (${blueTeamName || 'Blue'})`,
        color: 'bg-sky-100 text-sky-800 border-sky-300',
        isAvailable: false,
        type: 'blue',
      };
    if (isRedPick)
      return {
        label: `Red Pick (${redTeamName || 'Red'})`,
        color: 'bg-rose-100 text-rose-800 border-rose-300',
        isAvailable: false,
        type: 'red',
      };
    return {
      label: 'พร้อมเลือกในดราฟต์',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      isAvailable: true,
      type: 'available',
    };
  }, [currentHero, bannedHeroNames, bluePicks, redPicks, blueTeamName, redTeamName]);

  // Synergies & Meta Comps for Inspected Hero
  const heroMetaComps = useMemo(() => {
    if (!currentHero) return [];
    return RPL_2026_PRO_COMPS.filter((c) =>
      c.coreHeroes.some((h) => h.toLowerCase() === currentHero.name.toLowerCase())
    );
  }, [currentHero]);

  // Top 3 Partners (synergies)
  const topPartners = useMemo(() => {
    if (!currentHero) return [];
    const synergies = statsDataProvider.getHeroPlayedWith(currentHero.name);
    const sorted = [...synergies]
      .filter((s) => s.allyHero.toLowerCase() !== currentHero.name.toLowerCase())
      .sort((a, b) => (b.diff ?? 0) - (a.diff ?? 0))
      .slice(0, 3);
    return sorted;
  }, [currentHero]);

  // Direct substitutes for Inspected Hero (if inspected hero or key partners are banned/taken)
  const inspectedHeroSubstitutes = useMemo(() => {
    if (!currentHero) return [];
    const guides = META_SUBSTITUTE_GUIDE[currentHero.name] || [];
    return guides
      .filter((g) => !bannedHeroNames.has(g.substitute) && !pickedHeroNames.has(g.substitute))
      .map((g) => {
        const badges = heroToPlayersMap[g.substitute] || [];
        const playersWhoPlay = badges.map((b) => ({
          nickname: b.playerNickname,
          tier: b.tier,
          tierLabel: b.tier === 'signature' ? 'ถนัด' : 'พอเล่นได้',
          starColor: b.tier === 'signature' ? ('gold' as const) : ('silver' as const),
          playerRole: b.position,
        }));
        return {
          ...g,
          playersWhoPlay,
        };
      });
  }, [currentHero, bannedHeroNames, pickedHeroNames, heroToPlayersMap]);

  // Check banned key partners and get substitutes
  const partnerSubstitutes = useMemo(() => {
    if (!currentHero) return [];
    const subs: Array<{
      bannedPartner: string;
      compName: string;
      substitutes: Array<{
        substitute: string;
        role: string;
        tradeOff: string;
        effectiveness: string;
        isVerifiedSubstitute: boolean;
        planCompatibility: string;
        playersWhoPlay: Array<{
          nickname: string;
          tier: 'signature' | 'comfortable';
          starColor: 'gold' | 'silver';
          playerRole: string;
        }>;
      }>;
    }> = [];

    heroMetaComps.forEach((comp) => {
      comp.coreHeroes.forEach((partner) => {
        if (partner.toLowerCase() !== currentHero.name.toLowerCase()) {
          const isBanned = bannedHeroNames.has(partner);
          const isEnemyPicked = oppPicks.some(
            (p) => p.hero?.name.toLowerCase() === partner.toLowerCase()
          );

          if ((isBanned || isEnemyPicked) && META_SUBSTITUTE_GUIDE[partner]) {
            const availableSubs = META_SUBSTITUTE_GUIDE[partner]
              .filter(
                (s) => !bannedHeroNames.has(s.substitute) && !pickedHeroNames.has(s.substitute)
              )
              .map((s) => {
                const badges = heroToPlayersMap[s.substitute] || [];
                const playersWhoPlay = badges.map((b) => ({
                  nickname: b.playerNickname,
                  tier: b.tier,
                  starColor: b.tier === 'signature' ? ('gold' as const) : ('silver' as const),
                  playerRole: b.position,
                }));
                return {
                  ...s,
                  playersWhoPlay,
                };
              });

            if (availableSubs.length > 0) {
              subs.push({
                bannedPartner: partner,
                compName: comp.nameTh,
                substitutes: availableSubs,
              });
            }
          }
        }
      });
    });

    return subs;
  }, [currentHero, heroMetaComps, bannedHeroNames, oppPicks, pickedHeroNames, heroToPlayersMap]);

  // Anticipated Enemy Responses against Inspected Hero
  const anticipatedEnemyResponses = useMemo(() => {
    if (!currentHero) return [];
    const matchups = statsDataProvider.getHeroMatchups(currentHero.name);
    if (!matchups) return [];
    return [...matchups.weakAgainst]
      .filter((m) => !bannedHeroNames.has(m.opponentHero) && !pickedHeroNames.has(m.opponentHero))
      .sort((a, b) => a.diff - b.diff)
      .slice(0, 3);
  }, [currentHero, bannedHeroNames, pickedHeroNames]);

  // Matchup against opponent's locked picks
  const matchupAgainstOpponentPicks = useMemo(() => {
    if (!currentHero || oppLockedHeroes.length === 0) return [];
    const matchups = statsDataProvider.getHeroMatchups(currentHero.name);
    return oppLockedHeroes.map((opp) => {
      const match =
        matchups?.all.find((m) => m.opponentHero.toLowerCase() === opp.name.toLowerCase()) || null;
      return {
        oppHero: opp,
        matchup: match,
        isAdvantage: match ? match.diff > 2 : false,
        isDisadvantage: match ? match.diff < -2 : false,
      };
    });
  }, [currentHero, oppLockedHeroes]);

  // Counter Picks for Selected Opponent Hero
  const counterPicksForOpponent = useMemo(() => {
    if (!activeOppHero) return [];
    const matchups = statsDataProvider.getHeroMatchups(activeOppHero.name);
    if (!matchups) return [];

    const rawCounters = matchups.weakAgainst.filter(
      (m) => !bannedHeroNames.has(m.opponentHero) && !pickedHeroNames.has(m.opponentHero)
    );

    const missingRoles = analysis.myTeamComp.missingRoles.map((r) => r.toLowerCase());

    const enriched = rawCounters.map((c) => {
      const heroObj =
        allHeroes.find((h) => h.name.toLowerCase() === c.opponentHero.toLowerCase()) || null;
      const badges = heroToPlayersMap[c.opponentHero] || [];
      const hasSig = badges.some((b) => b.tier === 'signature');
      const hasComf = badges.some((b) => b.tier === 'comfortable');

      const heroRoles = heroObj
        ? [heroObj.primaryPos, ...(heroObj.pos || [])].map((r) => r.toLowerCase())
        : [];
      const fitsMissingRole = heroRoles.some((hr) => missingRoles.includes(hr));

      return {
        heroName: c.opponentHero,
        heroObj,
        diff: Math.abs(c.diff),
        games: c.games,
        winRate: c.winRate,
        badges,
        hasSig,
        hasComf,
        fitsMissingRole,
      };
    });

    return enriched
      .sort((a, b) => {
        if (a.hasSig && !b.hasSig) return -1;
        if (!a.hasSig && b.hasSig) return 1;
        if (a.fitsMissingRole && !b.fitsMissingRole) return -1;
        if (!a.fitsMissingRole && b.fitsMissingRole) return 1;
        return b.diff - a.diff;
      })
      .slice(0, 3);
  }, [
    activeOppHero,
    bannedHeroNames,
    pickedHeroNames,
    analysis.myTeamComp.missingRoles,
    allHeroes,
    heroToPlayersMap,
  ]);

  // Smart Ban Advisor List (Strictly unbanned & unpicked)
  const availableSmartBans = useMemo(() => {
    return analysis.smartBans
      .filter((b) => !bannedHeroNames.has(b.hero.name) && !pickedHeroNames.has(b.hero.name))
      .slice(0, 5);
  }, [analysis.smartBans, bannedHeroNames, pickedHeroNames]);

  return (
    <aside
      className="w-full h-full flex flex-col bg-white border-2 border-[#F3D5E2] rounded-2xl shadow-xl overflow-hidden transition-all text-[#1F2937] font-['Prompt'] select-none min-h-0"
      aria-label="Unified Draft Assistant"
    >
      {/* 1. Header with Mode Tabs */}
      <div className="bg-gradient-to-r from-[#FFF0F5] to-white border-b-2 border-[#F3D5E2] flex flex-col flex-shrink-0">
        <div className="px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#E91E63] to-[#C2185B] text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <Sparkles size={14} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-xs text-[#1F2937] flex items-center gap-1.5 uppercase leading-tight">
                <span>DRAFT ASSISTANT</span>
                <span
                  className={`text-[8.5px] font-black px-1.5 py-0.2 rounded-full text-white shadow-2xs ${
                    isDraftComplete
                      ? 'bg-emerald-600'
                      : isBanTurn
                      ? 'bg-rose-600 animate-pulse'
                      : 'bg-[#E91E63]'
                  }`}
                >
                  {isDraftComplete
                    ? 'POST-DRAFT'
                    : isBanTurn
                    ? 'BAN ADVISOR'
                    : 'P1: FALLBACK + PLAYER FIT'}
                </span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium leading-tight truncate">
                {myTeamName || 'MCU Team'} •{' '}
                {isDraftComplete
                  ? 'ดราฟต์เสร็จสมบูรณ์'
                  : isBanTurn
                  ? 'รอบแบนฮีโร่'
                  : 'รอบเลือกฮีโร่'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer shadow-2xs"
            title="ปิดหน้าต่าง Draft Assistant"
          >
            <X size={14} />
          </button>
        </div>

        {/* 5 Situational Mode Switcher Tabs */}
        <div
          className={`grid ${
            isDraftComplete ? 'grid-cols-5' : 'grid-cols-4'
          } gap-1 p-1.5 bg-[#FFF8FB] border-t border-[#F3D5E2]`}
        >
          <button
            type="button"
            onClick={() => setSituationalMode('inspect')}
            className={`py-1 px-1 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center gap-0.5 cursor-pointer border ${
              situationalMode === 'inspect'
                ? 'bg-[#E91E63] text-white border-[#C2185B] shadow-2xs'
                : 'bg-white text-slate-600 hover:text-[#E91E63] border-slate-200'
            }`}
            title="คำแนะนำหลัก & Player Fit & วิเคราะห์ฮีโร่"
          >
            <Eye size={12} />
            <span className="truncate max-w-full">พิจารณา</span>
          </button>

          <button
            type="button"
            onClick={() => setSituationalMode('counter_opp')}
            className={`py-1 px-1 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center gap-0.5 cursor-pointer border relative ${
              situationalMode === 'counter_opp'
                ? 'bg-[#0284C7] text-white border-[#0369A1] shadow-2xs'
                : 'bg-white text-slate-600 hover:text-[#0284C7] border-slate-200'
            }`}
            title="ตอบโต้ & วิเคราะห์ภัยคุกคามคู่แข่ง"
          >
            <Crosshair size={12} />
            <span className="truncate max-w-full">ตอบโต้</span>
            {oppLockedHeroes.length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute top-1 right-1" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setSituationalMode('banned_combos')}
            className={`py-1 px-1 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center gap-0.5 cursor-pointer border relative ${
              situationalMode === 'banned_combos'
                ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                : 'bg-white text-slate-600 hover:text-amber-700 border-slate-200'
            }`}
            title="Combo Fallback แผนสำรองคอมโบเมื่อโดนแบน"
          >
            <Layers size={12} />
            <span className="truncate max-w-full">คอมโบแบน</span>
            {comboFallbackAudits.length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute top-1 right-1 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setSituationalMode('smart_ban')}
            className={`py-1 px-1 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center gap-0.5 cursor-pointer border relative ${
              situationalMode === 'smart_ban'
                ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                : 'bg-white text-slate-600 hover:text-rose-700 border-slate-200'
            }`}
            title="คำแนะนำในการแบน (Smart Ban Advisor)"
          >
            <Ban size={12} />
            <span className="truncate max-w-full">แนะนำแบน</span>
            {isBanTurn && (
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-300 absolute top-1 right-1 animate-ping" />
            )}
          </button>

          {isDraftComplete && (
            <button
              type="button"
              onClick={() => setSituationalMode('summary')}
              className={`py-1 px-1 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center gap-0.5 cursor-pointer border relative ${
                situationalMode === 'summary'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                  : 'bg-white text-slate-600 hover:text-emerald-700 border-slate-200'
              }`}
              title="สรุปผลหลังดราฟต์และแผนการเล่น 3 ช่วง"
            >
              <FileText size={12} />
              <span className="truncate max-w-full">สรุปดราฟต์</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute top-1 right-1 animate-pulse" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Scrollable Body */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2.5 sm:p-3 pb-8 flex flex-col gap-3 bg-[#FFF8FB]/30">
        {/* ========================================================= */}
        {/* DRAFT SAFETY CHECK (Pinned Top Banner - Phase P2)         */}
        {/* ========================================================= */}
        {!isDraftComplete && (
          <div className="flex-shrink-0 isolate w-full bg-white border border-[#F3D5E2] rounded-xl overflow-hidden shadow-2xs mb-0.5">
            <div
              onClick={() => toggleSection('safetyBanner')}
              className={`px-2.5 py-1.5 flex items-center justify-between cursor-pointer transition-colors ${
                draftSafetyReport.status === 'critical'
                  ? 'bg-rose-50/90 text-rose-900 border-b border-rose-200'
                  : draftSafetyReport.status === 'caution'
                  ? 'bg-amber-50/90 text-amber-900 border-b border-amber-200'
                  : 'bg-emerald-50/80 text-emerald-900 border-b border-emerald-200'
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Shield
                  size={13}
                  className={
                    draftSafetyReport.status === 'critical'
                      ? 'text-rose-600'
                      : draftSafetyReport.status === 'caution'
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                  }
                />
                <span className="font-bold text-[11px] truncate">
                  Draft Safety: {draftSafetyReport.summaryBadge}
                </span>
                {draftSafetyReport.topWarnings.length > 0 && (
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                      draftSafetyReport.status === 'critical'
                        ? 'bg-rose-600 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {draftSafetyReport.topWarnings.length} เตือน
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <span>{openSections.safetyBanner ? 'ย่อ' : 'วิเคราะห์ 4 มิติ'}</span>
                {openSections.safetyBanner ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </div>
            </div>

            {/* Expanded 4-Dimension Safety Analysis */}
            {openSections.safetyBanner && (
              <div className="p-2.5 flex flex-col gap-2.5 bg-slate-50/50">
                {/* 1. Top Prioritized Warnings (Max 3) */}
                {draftSafetyReport.topWarnings.length > 0 ? (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-slate-700 uppercase flex items-center gap-1">
                      <AlertTriangle size={11} className="text-amber-600" />
                      <span>คำเตือนความเสี่ยงสำคัญ (สูงสุด 3 รายการ):</span>
                    </span>
                    {draftSafetyReport.topWarnings.map((w) => (
                      <div
                        key={w.id}
                        className={`p-2 rounded-lg border flex flex-col gap-1 text-left shadow-2xs ${
                          w.severity === 'critical'
                            ? 'bg-rose-50 border-rose-200 text-rose-950'
                            : w.severity === 'warning'
                            ? 'bg-amber-50 border-amber-200 text-amber-950'
                            : 'bg-blue-50 border-blue-200 text-blue-950'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-xs">
                            {w.severity === 'critical' ? (
                              <AlertTriangle size={13} className="text-rose-600 flex-shrink-0" />
                            ) : (
                              <Info size={13} className="text-amber-600 flex-shrink-0" />
                            )}
                            <span>{w.title}</span>
                          </div>
                          <span
                            className={`text-[8.5px] font-black px-1.5 py-0.2 rounded uppercase ${
                              w.severity === 'critical'
                                ? 'bg-rose-600 text-white'
                                : 'bg-amber-500 text-white'
                            }`}
                          >
                            {w.severity === 'critical' ? 'CRITICAL' : 'WARNING'}
                          </span>
                        </div>
                        <p className="text-[10.5px] leading-relaxed opacity-90">{w.detail}</p>
                        <div className="text-[10px] font-bold text-slate-700 bg-white/90 p-1.5 rounded border border-slate-200/80 mt-0.5">
                          💡 ทางเลือกแก้ไข: {w.suggestion}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-2 text-center text-slate-700 text-[11px] bg-white rounded-lg border border-emerald-200">
                    <span>
                      ✅ องค์ประกอบทีมสมดุลดี: มีแนวหน้าหรือเครื่องมือทดแทน, มี CC คุมไฟต์ และดาเมจกระจายตัวเหมาะสม
                    </span>
                  </div>
                )}

                {/* 2. Four Safety Dimensions Breakdown */}
                <div className="flex flex-col gap-2 pt-1 border-t border-slate-200">
                  <span className="text-[10px] font-bold text-slate-600 uppercase">
                    การประเมิน 4 มิติเชิงลึก (4 Safety Dimensions):
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Dimension 1: Role Coverage */}
                    <div className="p-2 bg-white rounded-lg border border-slate-200 flex flex-col gap-1 text-left shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[10.5px] text-slate-800 flex items-center gap-1">
                          <Users size={11} className="text-[#E91E63]" />
                          <span>1. Role Coverage</span>
                        </span>
                        <span
                          className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded ${
                            draftSafetyReport.roleCoverage.missingRoles.length === 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {draftSafetyReport.roleCoverage.missingRoles.length === 0
                            ? 'ครบตำแหน่ง'
                            : `ขาด ${draftSafetyReport.roleCoverage.missingRoles.length} ตำแหน่ง`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap mt-0.5">
                        {draftSafetyReport.roleCoverage.rolesCovered.map((role) => (
                          <span
                            key={role}
                            className="text-[8.5px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200"
                          >
                            ✓ {role}
                          </span>
                        ))}
                        {draftSafetyReport.roleCoverage.missingRoles.map((role) => (
                          <span
                            key={role}
                            className="text-[8.5px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200"
                          >
                            ✕ {role}
                          </span>
                        ))}
                      </div>
                      {draftSafetyReport.roleCoverage.roleClashes.length > 0 && (
                        <div className="text-[9px] text-rose-600 font-medium mt-0.5">
                          ⚠️ ทับตำแหน่ง {draftSafetyReport.roleCoverage.roleClashes[0].role}:{' '}
                          {draftSafetyReport.roleCoverage.roleClashes[0].heroes.join(' และ ')}
                        </div>
                      )}
                    </div>

                    {/* Dimension 2: Team Composition & Tools */}
                    <div className="p-2 bg-white rounded-lg border border-slate-200 flex flex-col gap-1 text-left shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[10.5px] text-slate-800 flex items-center gap-1">
                          <Shield size={11} className="text-sky-600" />
                          <span>2. Team Composition</span>
                        </span>
                        <span className="text-[8.5px] font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-800">
                          {draftSafetyReport.teamComposition.hasFrontline ? 'มีแนวหน้า' : 'แผนทางเลือก'}
                        </span>
                      </div>
                      <div className="text-[9.5px] text-slate-600 leading-tight">
                        แนวหน้า: {draftSafetyReport.teamComposition.frontlineDetails} • CC:{' '}
                        {draftSafetyReport.teamComposition.hardCcDetails} • เปิดไฟต์:{' '}
                        {draftSafetyReport.teamComposition.hasEngage ? 'มี' : 'ไม่มี'}
                      </div>
                      <div className="text-[9px] text-slate-500 font-medium flex items-center gap-1">
                        <span>ดาเมจ:</span>
                        <span className="text-amber-700 font-bold">
                          กายภาพ {draftSafetyReport.teamComposition.damageBalance.physical}%
                        </span>
                        <span>•</span>
                        <span className="text-purple-700 font-bold">
                          เวท {draftSafetyReport.teamComposition.damageBalance.magic}%
                        </span>
                      </div>
                      {draftSafetyReport.teamComposition.alternativeToolsNote && (
                        <div className="text-[9px] text-indigo-700 font-medium">
                          💡 สไตล์: {draftSafetyReport.teamComposition.alternativeToolsNote}
                        </div>
                      )}
                    </div>

                    {/* Dimension 3: Game Timing */}
                    <div className="p-2 bg-white rounded-lg border border-slate-200 flex flex-col gap-1 text-left shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[10.5px] text-slate-800 flex items-center gap-1">
                          <Clock size={11} className="text-amber-600" />
                          <span>3. Game Timing</span>
                        </span>
                        <span className="text-[8.5px] font-black px-1.5 py-0.2 rounded uppercase bg-amber-100 text-amber-900">
                          Spike: {draftSafetyReport.gameTiming.powerSpike}
                        </span>
                      </div>
                      <div className="text-[9.5px] text-slate-600 leading-tight">
                        {draftSafetyReport.gameTiming.lateGameViability}
                      </div>
                      {draftSafetyReport.gameTiming.timingVulnerability && (
                        <div className="text-[9px] text-rose-600 font-medium">
                          ⚠️ {draftSafetyReport.gameTiming.timingVulnerability}
                        </div>
                      )}
                    </div>

                    {/* Dimension 4: Win Condition */}
                    <div className="p-2 bg-white rounded-lg border border-slate-200 flex flex-col gap-1 text-left shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[10.5px] text-slate-800 flex items-center gap-1">
                          <Target size={11} className="text-emerald-600" />
                          <span>4. Win Condition</span>
                        </span>
                        <span className="text-[8.5px] font-black px-1.5 py-0.2 rounded uppercase bg-emerald-100 text-emerald-900">
                          {draftSafetyReport.winCondition.primaryType}
                        </span>
                      </div>
                      <div className="text-[9.5px] text-slate-700 font-medium leading-tight">
                        {draftSafetyReport.winCondition.headline}
                      </div>
                      {draftSafetyReport.winCondition.keySuccessConditions.length > 0 && (
                        <div className="text-[9px] text-slate-500 leading-tight">
                          🎯 กุญแจสำคัญ: {draftSafetyReport.winCondition.keySuccessConditions[0]}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Non-Coercive Disclaimer */}
                <div className="text-[9.5px] text-slate-400 text-center italic mt-0.5">
                  {draftSafetyReport.disclaimer}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SITUATION A: SECTION 7 HIERARCHY — INSPECT / DECISION MODE                */}
        {/* ========================================================================= */}
        {situationalMode === 'inspect' && (
          <>
            {/* If NO hero is inspected, show Item 1 & 2 for Top Recommended Pick */}
            {!currentHero ? (
              <div className="flex flex-col gap-3 py-1">
                {/* 1. คำแนะนำหลัก: ควรเลือกตัวไหนในเทิร์นนี้ */}
                {topRecommendedPick ? (
                  <div className="p-3 bg-white border-2 border-[#E91E63]/40 rounded-xl shadow-xs flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#E91E63] flex items-center gap-1.5 uppercase">
                        <Flame size={13} className="text-[#E91E63]" />
                        <span>1. คำแนะนำหลัก: ควรเลือกตัวไหนในเทิร์นนี้</span>
                      </span>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#FFF0F5] text-[#E91E63] border border-[#F3D5E2]">
                        SCORE {topRecommendedPick.score}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-[#E91E63] shadow-xs flex-shrink-0 bg-slate-100">
                          <img
                            src={getHeroImageUrl(topRecommendedPick.hero.name)}
                            alt={topRecommendedPick.hero.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-0 inset-x-0 bg-black/80 text-[7.5px] font-bold text-center text-white py-0.2 uppercase">
                            {topRecommendedPick.targetRole}
                          </div>
                        </div>

                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-slate-900 leading-tight">
                              {topRecommendedPick.hero.name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              ({topRecommendedPick.hero.nameTh})
                            </span>
                          </div>
                          <span className="text-[10.5px] text-slate-600 mt-0.5 leading-snug">
                            {topRecommendedPick.reasons[0] ||
                              `เหมาะสำหรับเติมเต็มตำแหน่ง ${topRecommendedPick.targetRole}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 items-end flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => onSelectHeroToInspect(topRecommendedPick.hero.name)}
                          className="px-2.5 py-1 rounded-lg bg-[#FFF0F5] hover:bg-[#FCE4EC] border border-[#F3D5E2] text-[#E91E63] text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                        >
                          <span>พิจารณา</span>
                          <ArrowRight size={11} />
                        </button>
                        {onPickHeroDirectly && (
                          <button
                            type="button"
                            onClick={() => onPickHeroDirectly(topRecommendedPick.hero)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1 active:scale-95"
                          >
                            <Check size={11} />
                            <span>หยิบตัวนี้</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 2. ผู้เล่นที่เหมาะสมที่สุดสำหรับคำแนะนำหลัก */}
                    {topPickPlayerFit && topPickPlayerFit.bestFitPlayer && (
                      <div className="mt-1 p-2 bg-amber-50/70 border border-amber-200 rounded-lg flex flex-col gap-1 text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-amber-900 flex items-center gap-1">
                            <Users size={12} className="text-amber-600" />
                            <span>2. ผู้เล่นที่เหมาะสมที่สุด:</span>
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              topPickPlayerFit.bestFitPlayer.player.starColor === 'gold'
                                ? 'bg-amber-200 text-amber-950 font-black'
                                : 'bg-slate-200 text-slate-800'
                            }`}
                          >
                            {topPickPlayerFit.bestFitPlayer.player.starColor === 'gold'
                              ? '⭐ ดาวสีทอง (ถนัด)'
                              : '★ ดาวสีเงิน (พอเล่นได้)'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">
                            {topPickPlayerFit.bestFitPlayer.player.nickname}
                          </span>
                          <span className="text-[10px] text-slate-600">
                            ({topPickPlayerFit.bestFitPlayer.player.playerName}) • ตำแหน่ง:{' '}
                            <span className="font-bold">
                              {topPickPlayerFit.bestFitPlayer.player.playerRole}
                            </span>
                          </span>
                        </div>

                        <p className="text-[10px] text-amber-900 leading-tight">
                          💡 {topPickPlayerFit.bestFitPlayer.recommendationReason}
                        </p>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Alternative Picks list */}
                <div className="flex flex-col gap-1.5 text-left">
                  <span className="text-[10.5px] font-bold text-slate-600 flex items-center gap-1">
                    <span>ตัวเลือกสำรองอื่นที่น่าสนใจในเทิร์นนี้:</span>
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {analysis.suggestedPicks.slice(1, 4).map((item) => (
                      <div
                        key={item.hero.name}
                        onClick={() => onSelectHeroToInspect(item.hero.name)}
                        className="p-2 bg-white hover:bg-[#FFF0F5] border border-[#F3D5E2] hover:border-[#E91E63] rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2 shadow-2xs group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={getHeroImageUrl(item.hero.name)}
                            alt={item.hero.name}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200 group-hover:scale-105 transition-transform flex-shrink-0"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-xs text-slate-900 truncate group-hover:text-[#E91E63]">
                              {item.hero.name}{' '}
                              <span className="text-[9.5px] text-slate-500 font-normal">
                                ({item.targetRole})
                              </span>
                            </span>
                            <span className="text-[10px] text-slate-500 truncate">
                              {item.reasons[0] || item.hero.nameTh}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-[#E91E63] flex items-center gap-0.5 flex-shrink-0">
                          <span>คลิกพิจารณา</span>
                          <ArrowRight size={11} />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 w-full">
                {/* ================================================================= */}
                {/* 1. คำแนะนำหลัก / ฮีโร่ที่กำลังพิจารณา (Hero Under Consideration) */}
                {/* ================================================================= */}
                <div className="flex-shrink-0 isolate w-full p-2.5 bg-white border border-[#F3D5E2] rounded-xl shadow-xs flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#E91E63] uppercase tracking-wider flex items-center gap-1">
                      <Target size={12} />
                      <span>1. ฮีโร่ที่กำลังพิจารณา (Hero Consideration)</span>
                    </span>
                    <span className="text-[9px] text-slate-400 italic">
                      *คลิกดูข้อมูลไม่ทำให้เกิดการ PICK จริง
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-2 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-[#E91E63] shadow-xs flex-shrink-0 bg-slate-100">
                        <img
                          src={getHeroImageUrl(currentHero.name)}
                          alt={currentHero.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 inset-x-0 bg-black/80 text-[7.5px] font-bold text-center text-white py-0.2 uppercase">
                          {currentHero.primaryPos}
                        </div>
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-sm text-slate-900 leading-tight">
                            {currentHero.name}
                          </h3>
                          <span className="text-[10px] text-slate-500 font-medium">
                            ({currentHero.nameTh})
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-0.5 truncate">
                          <span>ตำแหน่ง:</span>
                          <span className="font-bold text-slate-700 uppercase">
                            {[currentHero.primaryPos, ...(currentHero.pos || [])]
                              .filter((v, i, a) => a.indexOf(v) === i)
                              .join(', ')}
                          </span>
                        </div>

                        {heroStatus && (
                          <div className="mt-1">
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shadow-2xs ${heroStatus.color}`}
                            >
                              {heroStatus.label}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Confirmed Selection Action Button */}
                    {onPickHeroDirectly && heroStatus?.isAvailable && (
                      <button
                        type="button"
                        onClick={() => onPickHeroDirectly(currentHero)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0 active:scale-95 ${
                          isBanTurn
                            ? 'bg-rose-600 hover:bg-rose-700 border border-rose-500'
                            : 'bg-emerald-600 hover:bg-emerald-700 border border-emerald-500'
                        }`}
                        title={
                          isBanTurn
                            ? `ยืนยันการแบน ${currentHero.name}`
                            : `ยืนยันการเลือก ${currentHero.name} ลงดราฟต์`
                        }
                      >
                        {isBanTurn ? <Ban size={12} /> : <Check size={12} />}
                        <span>{isBanTurn ? 'แบนตัวนี้' : 'หยิบตัวนี้'}</span>
                      </button>
                    )}
                  </div>

                  {/* 3-Season RPL 2026 Breakdown (1. ข้อมูลรวม 2. Winter 2026 3. Summer 2026) */}
                  {inspectedHeroAllStats && (
                    <div className="mt-2 pt-2 border-t border-[#F3D5E2] flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                          <span>📊 สถิติ RPL 2026 (100% Liquipedia Verified):</span>
                        </span>
                        <a
                          href="https://liquipedia.net/honorofkings/RoV_Pro_League/2026/Winter/Statistics"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[9px] font-bold text-sky-700 hover:text-sky-900 flex items-center gap-0.5"
                          title="เปิดหน้าสถิติ Liquipedia Winter 2026"
                        >
                          <ExternalLink size={10} />
                          <span>Liquipedia</span>
                        </a>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                        {/* 1. ข้อมูลรวม */}
                        <div className="p-1.5 rounded-lg bg-purple-50/70 border border-purple-200 flex flex-col gap-0.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[9.5px] font-bold text-[#89114D] flex items-center gap-0.5">
                              <span>1. ข้อมูลรวม</span>
                            </span>
                            <span className="text-[8px] font-bold px-1 py-0.1 rounded bg-purple-200/80 text-purple-900">
                              576 เกม
                            </span>
                          </div>
                          {inspectedHeroAllStats.combined ? (
                            <div className="flex flex-col text-[9.5px]">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500 text-[8.5px]">WR:</span>
                                <span
                                  className={`font-black ${
                                    inspectedHeroAllStats.combined.winRate >= 60
                                      ? 'text-emerald-700'
                                      : inspectedHeroAllStats.combined.winRate >= 50
                                      ? 'text-sky-700'
                                      : 'text-rose-700'
                                  }`}
                                >
                                  {inspectedHeroAllStats.combined.winRate.toFixed(1)}%
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500 text-[8.5px]">Pick:</span>
                                <span className="font-medium text-slate-700">
                                  {inspectedHeroAllStats.combined.games} เกม ({inspectedHeroAllStats.combined.pickRate.toFixed(1)}%)
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500 text-[8.5px]">Ban:</span>
                                <span className="font-medium text-[#E91E63]">
                                  {inspectedHeroAllStats.combined.bans} แบน ({inspectedHeroAllStats.combined.banRate.toFixed(1)}%)
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[8.5px] text-slate-400 italic py-1 text-center">
                              ไม่มีข้อมูลรวม (0 Pick / 0 Ban)
                            </span>
                          )}
                        </div>

                        {/* 2. ข้อมูล Winter 2026 */}
                        <div className="p-1.5 rounded-lg bg-sky-50/70 border border-sky-200 flex flex-col gap-0.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[9.5px] font-bold text-[#0284C7] flex items-center gap-0.5">
                              <span>2. Winter 2026</span>
                            </span>
                            <span className="text-[8px] font-bold px-1 py-0.1 rounded bg-sky-200/80 text-sky-900">
                              285 เกม
                            </span>
                          </div>
                          {inspectedHeroAllStats.winter ? (
                            <div className="flex flex-col text-[9.5px]">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500 text-[8.5px]">WR:</span>
                                <span
                                  className={`font-black ${
                                    inspectedHeroAllStats.winter.winRate >= 60
                                      ? 'text-emerald-700'
                                      : inspectedHeroAllStats.winter.winRate >= 50
                                      ? 'text-sky-700'
                                      : 'text-rose-700'
                                  }`}
                                >
                                  {inspectedHeroAllStats.winter.games > 0
                                    ? `${inspectedHeroAllStats.winter.winRate.toFixed(1)}%`
                                    : '0%'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500 text-[8.5px]">Pick:</span>
                                <span className="font-medium text-slate-700">
                                  {inspectedHeroAllStats.winter.games} เกม ({inspectedHeroAllStats.winter.pickRate.toFixed(1)}%)
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500 text-[8.5px]">Ban:</span>
                                <span className="font-medium text-[#E91E63]">
                                  {inspectedHeroAllStats.winter.bans} แบน ({inspectedHeroAllStats.winter.banRate.toFixed(1)}%)
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[8.5px] text-slate-400 italic py-1 text-center">
                              ไม่มีข้อมูลใน Winter (0 Pick / 0 Ban)
                            </span>
                          )}
                        </div>

                        {/* 3. ข้อมูล Summer 2026 */}
                        <div className="p-1.5 rounded-lg bg-amber-50/70 border border-amber-200 flex flex-col gap-0.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[9.5px] font-bold text-[#D97706] flex items-center gap-0.5">
                              <span>3. Summer 2026</span>
                            </span>
                            <span className="text-[8px] font-bold px-1 py-0.1 rounded bg-amber-200/80 text-amber-900">
                              291 เกม
                            </span>
                          </div>
                          {inspectedHeroAllStats.summer ? (
                            <div className="flex flex-col text-[9.5px]">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500 text-[8.5px]">WR:</span>
                                <span
                                  className={`font-black ${
                                    inspectedHeroAllStats.summer.winRate >= 60
                                      ? 'text-emerald-700'
                                      : inspectedHeroAllStats.summer.winRate >= 50
                                      ? 'text-sky-700'
                                      : 'text-rose-700'
                                  }`}
                                >
                                  {inspectedHeroAllStats.summer.games > 0
                                    ? `${inspectedHeroAllStats.summer.winRate.toFixed(1)}%`
                                    : '0%'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500 text-[8.5px]">Pick:</span>
                                <span className="font-medium text-slate-700">
                                  {inspectedHeroAllStats.summer.games} เกม ({inspectedHeroAllStats.summer.pickRate.toFixed(1)}%)
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500 text-[8.5px]">Ban:</span>
                                <span className="font-medium text-[#E91E63]">
                                  {inspectedHeroAllStats.summer.bans} แบน ({inspectedHeroAllStats.summer.banRate.toFixed(1)}%)
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[8.5px] text-slate-400 italic py-1 text-center">
                              ไม่มีข้อมูลใน Summer (0 Pick / 0 Ban)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tactical Inspector Sub-Navigation Filter Bar */}
                <div className="flex-shrink-0 isolate w-full bg-white p-1 rounded-xl border border-[#F3D5E2] shadow-2xs flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setInspectSubTab('all')}
                    className={`flex-1 py-1 px-1 rounded-lg text-[9.5px] font-bold transition-all text-center cursor-pointer ${
                      inspectSubTab === 'all'
                        ? 'bg-[#E91E63] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-[#E91E63] hover:bg-[#FFF0F5]'
                    }`}
                  >
                    ดูทั้งหมด
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInspectSubTab('playerFit');
                      setOpenSections((prev) => ({ ...prev, playerFit: true }));
                    }}
                    className={`flex-1 py-1 px-1 rounded-lg text-[9.5px] font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1 ${
                      inspectSubTab === 'playerFit'
                        ? 'bg-amber-500 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50'
                    }`}
                  >
                    <Users size={11} />
                    <span>ผู้เล่น</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInspectSubTab('fallbackSubs');
                      setOpenSections((prev) => ({ ...prev, fallbackSubs: true }));
                    }}
                    className={`flex-1 py-1 px-1 rounded-lg text-[9.5px] font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1 ${
                      inspectSubTab === 'fallbackSubs'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
                    }`}
                  >
                    <RefreshCw size={11} />
                    <span>ตัวสำรอง</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInspectSubTab('combos');
                      setOpenSections((prev) => ({ ...prev, combos: true }));
                    }}
                    className={`flex-1 py-1 px-1 rounded-lg text-[9.5px] font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1 ${
                      inspectSubTab === 'combos'
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50'
                    }`}
                  >
                    <Layers size={11} />
                    <span>คอมโบ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInspectSubTab('opponent');
                      setOpenSections((prev) => ({ ...prev, opponent: true }));
                    }}
                    className={`flex-1 py-1 px-1 rounded-lg text-[9.5px] font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1 ${
                      inspectSubTab === 'opponent'
                        ? 'bg-sky-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-sky-700 hover:bg-sky-50'
                    }`}
                  >
                    <Swords size={11} />
                    <span>แก้ทาง</span>
                  </button>
                </div>

                {/* ================================================================= */}
                {/* 2. ผู้เล่นที่เหมาะสมที่สุด (Best-fit Player & Player Fit)         */}
                {/* ================================================================= */}
                {(inspectSubTab === 'all' || inspectSubTab === 'playerFit') && (
                  <div className="flex-shrink-0 isolate w-full bg-white border border-[#F3D5E2] rounded-xl overflow-hidden shadow-2xs">
                    <button
                      type="button"
                      onClick={() => toggleSection('playerFit')}
                      className="w-full px-2.5 py-1.5 bg-[#FFF0F5] border-b border-[#F3D5E2] flex items-center justify-between text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs text-[#E91E63]">
                        <Users size={13} />
                        <span>2. ผู้เล่นที่เหมาะสมที่สุด (Player Fit)</span>
                      </div>
                      {openSections.playerFit ? (
                        <ChevronUp size={14} className="text-slate-400" />
                      ) : (
                        <ChevronDown size={14} className="text-slate-400" />
                      )}
                    </button>

                    {openSections.playerFit && (
                      <div className="p-2.5 flex flex-col gap-2">
                        {playerFitReport.hasComfortData && playerFitReport.bestFitPlayer ? (
                          <>
                            {/* Best Fit Player Card */}
                            <div className="p-2 bg-gradient-to-r from-amber-50 to-white border border-amber-300 rounded-lg flex flex-col gap-1.5 shadow-2xs">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`text-sm ${
                                      playerFitReport.bestFitPlayer.player.starColor === 'gold'
                                        ? 'text-amber-500'
                                        : 'text-slate-400'
                                    }`}
                                  >
                                    {playerFitReport.bestFitPlayer.player.starColor === 'gold'
                                      ? '⭐'
                                      : '★'}
                                  </span>
                                  <span className="font-bold text-xs text-slate-900">
                                    {playerFitReport.bestFitPlayer.player.nickname}
                                  </span>
                                  <span className="text-[10px] text-slate-500">
                                    ({playerFitReport.bestFitPlayer.player.playerName})
                                  </span>
                                </div>

                                <span
                                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                    playerFitReport.bestFitPlayer.player.starColor === 'gold'
                                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                                      : 'bg-slate-100 text-slate-700 border-slate-300'
                                  }`}
                                >
                                  {playerFitReport.bestFitPlayer.player.starColor === 'gold'
                                    ? '⭐ ดาวสีทอง (ถนัด)'
                                    : '★ ดาวสีเงิน (พอเล่นได้)'}
                                </span>
                              </div>

                              {/* Position & Role suitability */}
                              <div className="flex items-center justify-between text-[10px] bg-white/90 p-1.5 rounded border border-amber-200">
                                <span className="text-slate-600 font-medium">
                                  ตำแหน่งผู้เล่น:{' '}
                                  <span className="font-bold text-slate-800">
                                    {playerFitReport.bestFitPlayer.player.playerRole}
                                  </span>
                                </span>
                                <span
                                  className={`font-bold ${
                                    playerFitReport.bestFitPlayer.player.roleFit === 'on_role'
                                      ? 'text-emerald-700'
                                      : 'text-amber-700'
                                  }`}
                                >
                                  {playerFitReport.bestFitPlayer.player.roleFitDescription}
                                </span>
                              </div>

                              {/* Brief concrete reason */}
                              <p className="text-[10.5px] text-amber-950 leading-snug">
                                💡 {playerFitReport.bestFitPlayer.recommendationReason}
                              </p>
                            </div>

                            {/* Other players who can play this hero */}
                            {playerFitReport.otherPlayers.length > 0 && (
                              <div className="flex flex-col gap-1 pt-1 border-t border-slate-100">
                                <span className="text-[10px] font-bold text-slate-600">
                                  ผู้เล่นคนอื่นในทีมที่เล่นฮีโร่นี้ได้:
                                </span>
                                <div className="flex flex-col gap-1">
                                  {playerFitReport.otherPlayers.map((other) => (
                                    <div
                                      key={other.playerId}
                                      className="p-1.5 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between text-[10px] flex-shrink-0"
                                    >
                                      <div className="flex items-center gap-1.5">
                                        <span
                                          className={
                                            other.starColor === 'gold'
                                              ? 'text-amber-500'
                                              : 'text-slate-400'
                                          }
                                        >
                                          {other.starColor === 'gold' ? '⭐' : '★'}
                                        </span>
                                        <span className="font-bold text-slate-800">
                                          {other.nickname}
                                        </span>
                                        <span className="text-slate-500">({other.playerRole})</span>
                                      </div>
                                      <span
                                        className={`px-1.5 py-0.2 rounded font-bold text-[9px] border ${
                                          other.starColor === 'gold'
                                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                                            : 'bg-white text-slate-600 border-slate-300'
                                        }`}
                                      >
                                        {other.tierLabel}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="p-2.5 text-center text-slate-600 text-[11px] bg-slate-50 rounded-lg border border-slate-200 leading-relaxed">
                            <span>
                              {playerFitReport.warningNotice ||
                                'ไม่พบข้อมูลเพียงพอในพูลนักแข่งของทีม MCU สำหรับฮีโร่ตัวนี้ — โค้ชควรสอบถามความมั่นใจก่อนหยิบ (ห้ามสมมติว่าเล่นได้)'}
                            </span>
                          </div>
                        )}

                        <div className="text-[9px] text-slate-400 italic mt-0.5">
                          ที่มา: {playerFitReport.provenance}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ================================================================= */}
                {/* 3. ตัวเลือกสำรอง / COMBO FALLBACK                                 */}
                {/* ================================================================= */}
                {(inspectSubTab === 'all' || inspectSubTab === 'fallbackSubs') && (
                  <div className="flex-shrink-0 isolate w-full bg-white border border-[#F3D5E2] rounded-xl overflow-hidden shadow-2xs">
                    <button
                      type="button"
                      onClick={() => toggleSection('fallbackSubs')}
                      className="w-full px-2.5 py-1.5 bg-[#FFF0F5] border-b border-[#F3D5E2] flex items-center justify-between text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs text-[#E91E63]">
                        <RefreshCw size={13} />
                        <span>3. ตัวเลือกสำรอง / Combo Fallback</span>
                      </div>
                      {openSections.fallbackSubs ? (
                        <ChevronUp size={14} className="text-slate-400" />
                      ) : (
                        <ChevronDown size={14} className="text-slate-400" />
                      )}
                    </button>

                    {openSections.fallbackSubs && (
                      <div className="p-2.5 flex flex-col gap-2">
                        {/* Substitutes for current hero if banned or taken */}
                        {inspectedHeroSubstitutes.length > 0 ? (
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold text-slate-600">
                              ตัวเลือกทดแทนหาก {currentHero.name} โดนแบน / ถูกแย่ง (เรียงตามความเหมาะสม):
                            </span>
                            <div className="flex flex-col gap-1.5">
                              {inspectedHeroSubstitutes.map((sub) => (
                                <div
                                  key={sub.substitute}
                                  onClick={() => onSelectHeroToInspect(sub.substitute)}
                                  className="flex-shrink-0 p-2 bg-amber-50/50 hover:bg-amber-50 border border-amber-200 hover:border-[#E91E63] rounded-lg flex flex-col gap-1 cursor-pointer transition-all shadow-2xs group"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <img
                                        src={getHeroImageUrl(sub.substitute)}
                                        alt={sub.substitute}
                                        className="w-6 h-6 rounded object-cover border border-slate-200"
                                      />
                                      <span className="font-bold text-xs text-slate-900 group-hover:text-[#E91E63]">
                                        {sub.substitute}
                                      </span>
                                      <span className="text-[9.5px] text-slate-500">
                                        ({sub.role})
                                      </span>
                                    </div>
                                    <span
                                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                        sub.isVerifiedSubstitute
                                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                          : 'bg-slate-100 text-slate-700 border-slate-300'
                                      }`}
                                    >
                                      {sub.isVerifiedSubstitute
                                        ? sub.effectiveness
                                        : 'ทางเลือกที่ต้องพิจารณา'}
                                    </span>
                                  </div>

                                  <p className="text-[9.5px] text-slate-700 leading-tight">
                                    📋 แผนเดิม: {sub.planCompatibility}
                                  </p>
                                  <p className="text-[9.5px] text-slate-600 leading-tight">
                                    ⚖️ ข้อแลกเปลี่ยน: {sub.tradeOff}
                                  </p>

                                  {/* Players who play this substitute */}
                                  {sub.playersWhoPlay.length > 0 && (
                                    <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-amber-100">
                                      <span className="text-[9px] text-slate-500 font-medium">
                                        นักแข่งที่เล่นได้:
                                      </span>
                                      {sub.playersWhoPlay.map((p) => (
                                        <span
                                          key={p.nickname}
                                          className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded border ${
                                            p.starColor === 'gold'
                                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                                              : 'bg-white text-slate-700 border-slate-300'
                                          }`}
                                        >
                                          {p.starColor === 'gold' ? '⭐' : '★'} {p.nickname} (
                                          {p.playerRole})
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="p-2.5 text-center text-slate-600 text-[11px] bg-slate-50 rounded-lg border border-slate-200 leading-relaxed">
                            <span>
                              {heroStatus?.isAvailable
                                ? `${currentHero.name} พร้อมเลือกในดราฟต์ ยังไม่มีความจำเป็นต้องใช้ตัวสำรอง`
                                : 'ยังไม่มีบันทึกตัวแทนเฉพาะสำหรับฮีโร่ตัวนี้ในระบบ'}
                            </span>
                          </div>
                        )}

                        {/* Fallback if Key Partner is Banned */}
                        {partnerSubstitutes.length > 0 && (
                          <div className="flex flex-col gap-1.5 pt-2 border-t border-[#F3D5E2]">
                            <span className="text-[10.5px] font-bold text-amber-700 flex items-center gap-1">
                              <AlertTriangle size={12} className="text-amber-600" />
                              <span>ฮีโร่คู่หูของแผนติดแบน/ถูกแย่ง — แผนสำรอง:</span>
                            </span>

                            {partnerSubstitutes.map((ps) => (
                              <div
                                key={ps.bannedPartner}
                                className="p-2 bg-amber-50/60 border border-amber-200 rounded-lg flex flex-col gap-1 flex-shrink-0"
                              >
                                <span className="text-[11px] font-bold text-amber-900">
                                  ขาด{' '}
                                  <span className="underline decoration-rose-500 font-black">
                                    {ps.bannedPartner}
                                  </span>{' '}
                                  ในแผน {ps.compName}:
                                </span>
                                <div className="flex flex-col gap-1">
                                  {ps.substitutes.map((sub) => (
                                    <div
                                      key={sub.substitute}
                                      onClick={() => onSelectHeroToInspect(sub.substitute)}
                                      className="p-1.5 bg-white border border-amber-200 hover:border-[#E91E63] rounded-md flex flex-col gap-0.5 cursor-pointer shadow-2xs group flex-shrink-0"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                          <img
                                            src={getHeroImageUrl(sub.substitute)}
                                            alt={sub.substitute}
                                            className="w-5 h-5 rounded object-cover border border-slate-200"
                                          />
                                          <span className="font-bold text-xs text-slate-900 group-hover:text-[#E91E63]">
                                            {sub.substitute}
                                          </span>
                                          <span className="text-[9.5px] text-slate-500">
                                            ({sub.role})
                                          </span>
                                        </div>
                                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                          {sub.effectiveness}
                                        </span>
                                      </div>
                                      <span className="text-[9.5px] text-slate-600 leading-tight">
                                        ⚖️ ข้อแลกเปลี่ยน: {sub.tradeOff}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ================================================================= */}
                {/* 4. คอมโบที่เกี่ยวข้อง & TEAM IDENTITY                             */}
                {/* ================================================================= */}
                {(inspectSubTab === 'all' || inspectSubTab === 'combos') && (
                  <div className="flex-shrink-0 isolate w-full bg-white border border-[#F3D5E2] rounded-xl overflow-hidden shadow-2xs">
                    <button
                      type="button"
                      onClick={() => toggleSection('combos')}
                      className="w-full px-2.5 py-1.5 bg-[#FFF0F5] border-b border-[#F3D5E2] flex items-center justify-between text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs text-[#E91E63]">
                        <Layers size={13} />
                        <span>4. คอมโบที่เกี่ยวข้อง & แผนทีม (Team Identity)</span>
                      </div>
                      {openSections.combos ? (
                        <ChevronUp size={14} className="text-slate-400" />
                      ) : (
                        <ChevronDown size={14} className="text-slate-400" />
                      )}
                    </button>

                    {openSections.combos && (
                      <div className="p-2.5 flex flex-col gap-2">
                        {/* Team Identity Alignment */}
                        {teamIdentityReport.inspectedHeroAlignment && (
                          <div
                            className={`p-2 rounded-lg border flex flex-col gap-1 flex-shrink-0 ${
                              teamIdentityReport.inspectedHeroAlignment.alignment === 'reinforces'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                                : teamIdentityReport.inspectedHeroAlignment.alignment === 'clashes'
                                ? 'bg-rose-50 border-rose-200 text-rose-950'
                                : 'bg-slate-50 border-slate-200 text-slate-900'
                            }`}
                          >
                            <span className="font-bold text-xs">
                              {teamIdentityReport.inspectedHeroAlignment.headline}
                            </span>
                            <p className="text-[10px] leading-relaxed opacity-90">
                              {teamIdentityReport.inspectedHeroAlignment.reason}
                            </p>
                            <div className="text-[9.5px] font-bold text-slate-700 bg-white/70 p-1.5 rounded border border-slate-200/50">
                              🎯 แท็กติก: {teamIdentityReport.inspectedHeroAlignment.tacticalNote}
                            </div>
                          </div>
                        )}

                        {/* Top 3 Synergy Partners (from empirical Pro League RPL dataset) */}
                        {topPartners.length > 0 && (
                          <div className="flex flex-col gap-1.5 pt-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                              คู่หูคอมโบใน Pro League (RPL n=142):
                            </span>
                            {topPartners.map((item) => {
                              const isBanned = bannedHeroNames.has(item.allyHero);
                              const isPicked = pickedHeroNames.has(item.allyHero);

                              return (
                                <div
                                  key={item.allyHero}
                                  className={`p-1.5 rounded-lg border flex items-center justify-between gap-2 shadow-2xs flex-shrink-0 ${
                                    isBanned
                                      ? 'bg-rose-50/70 border-rose-200 opacity-60'
                                      : isPicked
                                      ? 'bg-slate-100 border-slate-200'
                                      : 'bg-white border-slate-200 hover:border-[#E91E63]'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <img
                                      src={getHeroImageUrl(item.allyHero)}
                                      alt={item.allyHero}
                                      className="w-7 h-7 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                                    />
                                    <div className="flex flex-col min-w-0">
                                      <div className="flex items-center gap-1">
                                        <span className="font-bold text-xs text-slate-900 truncate">
                                          {item.allyHero}
                                        </span>
                                        {isBanned && (
                                          <span className="text-[7.5px] font-bold px-1 rounded bg-rose-600 text-white">
                                            BANNED
                                          </span>
                                        )}
                                        {isPicked && (
                                          <span className="text-[7.5px] font-bold px-1 rounded bg-slate-600 text-white">
                                            PICKED
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[9.5px] text-slate-500">
                                        สถิติแข่ง: {item.games} แมตช์ • Win Rate{' '}
                                        {(item.winRate || 50).toFixed(1)}%
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex flex-col items-end flex-shrink-0">
                                    <span
                                      className={`text-[9.5px] font-black ${
                                        (item.diff ?? 0) >= 0
                                          ? 'text-emerald-600'
                                          : 'text-rose-600'
                                      }`}
                                    >
                                      {(item.diff ?? 0) >= 0
                                        ? `+${(item.diff ?? 0).toFixed(1)}%`
                                        : `${(item.diff ?? 0).toFixed(1)}%`}
                                    </span>
                                    <span className="text-[7.5px] text-slate-400">Synergy Diff</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ================================================================= */}
                {/* 5. จุดเสี่ยงและตัวแก้ทางจากคู่แข่ง (Threats & Counters)            */}
                {/* ================================================================= */}
                {(inspectSubTab === 'all' || inspectSubTab === 'opponent') && (
                  <div className="flex-shrink-0 isolate w-full bg-white border border-[#F3D5E2] rounded-xl overflow-hidden shadow-2xs">
                    <button
                      type="button"
                      onClick={() => toggleSection('opponent')}
                      className="w-full px-2.5 py-1.5 bg-[#FFF0F5] border-b border-[#F3D5E2] flex items-center justify-between text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs text-[#E91E63]">
                        <Swords size={13} />
                        <span>5. จุดเสี่ยงและตัวแก้ทางจากคู่แข่ง</span>
                      </div>
                      {openSections.opponent ? (
                        <ChevronUp size={14} className="text-slate-400" />
                      ) : (
                        <ChevronDown size={14} className="text-slate-400" />
                      )}
                    </button>

                    {openSections.opponent && (
                      <div className="p-2.5 flex flex-col gap-2">
                        {/* Matchup against locked opponent picks */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">
                            ความได้เปรียบเทียบกับตัวที่คู่แข่งล็อคแล้ว:
                          </span>
                          {matchupAgainstOpponentPicks.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {matchupAgainstOpponentPicks.map((item) => (
                                <div
                                  key={item.oppHero.name}
                                  className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs flex-shrink-0"
                                >
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={getHeroImageUrl(item.oppHero.name)}
                                      alt={item.oppHero.name}
                                      className="w-6 h-6 rounded object-cover border border-slate-200"
                                    />
                                    <span className="font-bold text-slate-800">
                                      vs {item.oppHero.name}
                                    </span>
                                  </div>

                                  {item.matchup ? (
                                    <span
                                      className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded ${
                                        item.matchup.diff > 1
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : item.matchup.diff < -1
                                          ? 'bg-rose-100 text-rose-800'
                                          : 'bg-slate-200 text-slate-700'
                                      }`}
                                    >
                                      {item.matchup.diff > 1
                                        ? 'ได้เปรียบ'
                                        : item.matchup.diff < -1
                                        ? 'เสียเปรียบ'
                                        : 'สูสี'}{' '}
                                      (
                                      {item.matchup.diff > 0
                                        ? `+${item.matchup.diff.toFixed(1)}%`
                                        : `${item.matchup.diff.toFixed(1)}%`}
                                      )
                                    </span>
                                  ) : (
                                    <span className="text-[9px] text-slate-400 italic">
                                      ไม่มีข้อมูลสถิติการแก้ทางโดยตรงจากแหล่งข้อมูลที่กำหนด
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">
                              คู่แข่งยังไม่ได้ล็อคฮีโร่
                            </span>
                          )}
                        </div>

                        {/* Anticipated Enemy Responses */}
                        {anticipatedEnemyResponses.length > 0 && (
                          <div className="flex flex-col gap-1 pt-1.5 border-t border-[#F3D5E2]">
                            <span className="text-[10px] font-bold text-rose-700 flex items-center gap-1">
                              <AlertTriangle size={11} />
                              <span>
                                ตัวที่คู่แข่งมีโอกาสหยิบมาแก้ทาง {currentHero.name} (Weak Against):
                              </span>
                            </span>
                            <div className="flex flex-col gap-1">
                              {anticipatedEnemyResponses.map((item) => (
                                <div
                                  key={item.opponentHero}
                                  onClick={() => onSelectHeroToInspect(item.opponentHero)}
                                  className="p-1.5 bg-rose-50/50 border border-rose-200 hover:border-rose-400 rounded-lg flex items-center justify-between text-xs cursor-pointer group flex-shrink-0"
                                >
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={getHeroImageUrl(item.opponentHero)}
                                      alt={item.opponentHero}
                                      className="w-6 h-6 rounded object-cover border border-slate-200"
                                    />
                                    <div className="flex flex-col">
                                      <span className="font-bold text-slate-900 group-hover:text-rose-700">
                                        {item.opponentHero}
                                      </span>
                                      <span className="text-[9px] text-slate-500">
                                        สถิติ Pro League {item.games} แมตช์
                                      </span>
                                    </div>
                                  </div>
                                  <span className="text-[9.5px] font-black text-rose-600 bg-white px-1.5 py-0.5 rounded border border-rose-200">
                                    {item.diff.toFixed(1)}% Diff
                                  </span>
                                </div>
                              ))}
                            </div>
                            <span className="text-[8.5px] text-slate-400 italic">
                              * การประเมินเชิงสถิติ RPL: โค้ชควรพิจารณาแบนล่วงหน้าหรือเตรียมตัวแก้ทาง
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ========================================================================= */}
        {/* SITUATION B: COUNTER OPPONENT PICKS & THREAT PROFILE                      */}
        {/* ========================================================================= */}
        {situationalMode === 'counter_opp' && (
          <div className="flex flex-col gap-2.5">
            {/* Opponent Threat Profile Card (Phase P2) */}
            <div className="p-2.5 bg-white border border-[#F3D5E2] rounded-xl shadow-2xs flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs text-sky-800">
                  <Crosshair size={14} className="text-sky-600" />
                  <span>วิเคราะห์ภัยคุกคามของ {enemyThreatReport.oppTeamName}</span>
                </div>
                <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full border border-sky-300">
                  ล็อคแล้ว {enemyThreatReport.lockedOppCount}/5 ตัว
                </span>
              </div>

              {/* 1. Opponent Plan Assessment with Confidence Level */}
              {enemyThreatReport.opponentPlanAssessment.confidence === 'insufficient_data' ? (
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2 text-left">
                  <Info size={14} className="text-slate-400 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-bold text-[10.5px] text-slate-700">
                      การประเมินแผนคู่แข่ง (ข้อมูลยังไม่เพียงพอ)
                    </span>
                    <span className="text-[9.5px] text-slate-500 leading-tight">
                      คู่แข่งเพิ่งเลือก {enemyThreatReport.lockedOppCount} ตัว ยังเร็วเกินไปที่จะสรุปแผนแน่นอน ระบบไม่ด่วนสรุป รอคู่แข่งล็อคตัวเพิ่ม
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-2 bg-gradient-to-r from-sky-50 to-white border border-sky-200 rounded-lg flex flex-col gap-1 text-left">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[10.5px] text-sky-900 flex items-center gap-1">
                      <Compass size={12} className="text-sky-600" />
                      <span>แผนการเล่นที่คาดการณ์ (Opponent Plan):</span>
                    </span>
                    <span
                      className={`text-[8px] font-black px-1.5 py-0.2 rounded uppercase ${
                        enemyThreatReport.opponentPlanAssessment.confidence === 'high'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {enemyThreatReport.opponentPlanAssessment.confidence === 'high'
                        ? 'ความมั่นใจสูง'
                        : 'ความมั่นใจปานกลาง'}
                    </span>
                  </div>
                  <span className="font-bold text-xs text-sky-950">
                    {enemyThreatReport.opponentPlanAssessment.planType}
                  </span>
                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    {enemyThreatReport.opponentPlanAssessment.description}
                  </p>
                  <div className="text-[9.5px] font-bold text-sky-800 bg-sky-100/70 p-1.5 rounded mt-0.5">
                    🎯 กลยุทธ์รับมือ: {enemyThreatReport.opponentPlanAssessment.note}
                  </div>
                </div>
              )}

              {/* 2. Detected Threat Profile with Endangered Allies */}
              {enemyThreatReport.threats.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-slate-700 uppercase flex items-center gap-1 text-left">
                    <Zap size={11} className="text-amber-500" />
                    <span>ภัยคุกคามที่ตรวจพบ & ฮีโร่ฝั่งเราที่ตกอยู่ในอันตราย:</span>
                  </span>

                  {enemyThreatReport.threats.map((threat) => (
                    <div
                      key={threat.type}
                      className="p-2 bg-sky-50/60 border border-sky-200 rounded-lg flex flex-col gap-1 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-sky-950 flex items-center gap-1">
                          <AlertTriangle
                            size={12}
                            className={
                              threat.dangerLevel === 'high'
                                ? 'text-rose-600'
                                : 'text-amber-500'
                            }
                          />
                          <span>{threat.title}</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <span
                            className={`text-[8px] font-black px-1.5 py-0.2 rounded uppercase ${
                              threat.dangerLevel === 'high'
                                ? 'bg-rose-600 text-white'
                                : 'bg-amber-500 text-white'
                            }`}
                          >
                            {threat.dangerLevel.toUpperCase()}
                          </span>
                          <span className="text-[9px] font-bold text-slate-500">
                            ({threat.heroes.join(', ')})
                          </span>
                        </div>
                      </div>

                      {/* Opponent Strength & Impact */}
                      <div className="text-[9.5px] text-slate-600 leading-tight">
                        <span className="font-bold text-slate-700">จุดเด่นคู่แข่ง:</span>{' '}
                        {threat.opponentStrength}
                      </div>
                      <div className="text-[9.5px] text-slate-600 leading-tight">
                        <span className="font-bold text-slate-700">ผลกระทบต่อเรา:</span>{' '}
                        {threat.impactOnOurTeam}
                      </div>

                      {/* Endangered Allies Highlight Box */}
                      {threat.endangeredAllies.length > 0 && (
                        <div className="p-1.5 bg-rose-50 border border-rose-200 rounded-md flex flex-col gap-1 mt-0.5">
                          <span className="text-[9.5px] font-bold text-rose-900 flex items-center gap-1">
                            <AlertTriangle size={10} className="text-rose-600 flex-shrink-0" />
                            <span>⚠️ ฮีโร่ฝั่งเราที่ตกอยู่ในอันตราย (Endangered Allies):</span>
                          </span>
                          <div className="flex items-center gap-1 flex-wrap">
                            {threat.endangeredAllies.map((allyName) => (
                              <button
                                key={allyName}
                                type="button"
                                onClick={() => onSelectHeroToInspect(allyName)}
                                className="px-1.5 py-0.5 rounded-full bg-white hover:bg-rose-100 border border-rose-300 text-rose-800 text-[9px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                                title={`คลิกเพื่อพิจารณา ${allyName}`}
                              >
                                <img
                                  src={getHeroImageUrl(allyName)}
                                  alt={allyName}
                                  className="w-3.5 h-3.5 rounded-full object-cover"
                                />
                                <span>{allyName}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <p className="text-[10px] text-slate-700 leading-relaxed bg-white/80 p-1.5 rounded border border-slate-200/60 mt-0.5">
                        💡 {threat.tacticalAdvice}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2.5 text-center text-slate-500 text-[11px] bg-slate-50 rounded-lg border border-slate-200">
                  <span>
                    ยังไม่มีข้อมูลฮีโร่ที่คู่แข่งล็อค หรือคู่แข่งยังไม่แสดงภัยคุกคามเฉพาะทาง
                  </span>
                </div>
              )}

              {/* 3. Actionable Response Recommendation (Connected with P1 Player Fit) */}
              {enemyThreatReport.actionableResponse &&
                enemyThreatReport.actionableResponse.topResponseHero && (
                  <div className="p-2.5 bg-gradient-to-br from-white to-[#FFF0F5] border-2 border-[#0284C7] rounded-xl shadow-xs flex flex-col gap-2 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#0284C7] flex items-center gap-1.5 uppercase">
                        <Shield size={13} className="text-[#0284C7]" />
                        <span>Actionable Response: แผนตอบโต้ที่แนะนำ</span>
                      </span>
                      <span className="text-[8px] font-black px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 border border-sky-300">
                        COUNTER STRATEGY
                      </span>
                    </div>

                    {/* Step 1: Top Counter Hero */}
                    <div className="flex items-start justify-between gap-2 pt-1 border-t border-sky-100">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-[#0284C7] shadow-xs flex-shrink-0 bg-slate-100">
                          <img
                            src={getHeroImageUrl(
                              enemyThreatReport.actionableResponse.topResponseHero.hero.name
                            )}
                            alt={enemyThreatReport.actionableResponse.topResponseHero.hero.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-xs text-slate-900 leading-tight">
                            {enemyThreatReport.actionableResponse.topResponseHero.hero.name}
                          </span>
                          <span className="text-[9.5px] text-slate-600 mt-0.5 leading-snug">
                            {enemyThreatReport.actionableResponse.topResponseHero.reason}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 items-end flex-shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            onSelectHeroToInspect(
                              enemyThreatReport.actionableResponse.topResponseHero!.hero.name
                            )
                          }
                          className="px-2 py-0.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[#0284C7] text-[10px] font-bold transition-all cursor-pointer shadow-2xs"
                        >
                          พิจารณา
                        </button>
                        {onPickHeroDirectly && (
                          <button
                            type="button"
                            onClick={() =>
                              onPickHeroDirectly(
                                enemyThreatReport.actionableResponse.topResponseHero!.hero
                              )
                            }
                            className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
                          >
                            หยิบตัวนี้
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Step 2: Alternative Counters */}
                    {enemyThreatReport.actionableResponse.alternativeHeroes.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[9.5px] text-slate-600">
                        <span className="font-bold text-slate-700">ตัวเลือกสำรอง:</span>
                        <div className="flex items-center gap-1 flex-wrap">
                          {enemyThreatReport.actionableResponse.alternativeHeroes.map(
                            (alt) => (
                              <button
                                key={alt.hero.name}
                                type="button"
                                onClick={() => onSelectHeroToInspect(alt.hero.name)}
                                className="px-1.5 py-0.2 rounded bg-white hover:bg-sky-50 border border-slate-200 text-slate-800 font-bold hover:text-[#0284C7] cursor-pointer"
                              >
                                {alt.hero.name}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Step 3: Combo Impact */}
                    <div className="text-[9.5px] text-slate-700 bg-sky-50/70 p-1.5 rounded border border-sky-200/60 leading-tight">
                      🧩 <b>ผลต่อคอมโบเดิม:</b>{' '}
                      {enemyThreatReport.actionableResponse.comboAndPlanImpact}
                    </div>

                    {/* Step 4: MCU Players who can play this counter (P1 Player Fit) */}
                    {enemyThreatReport.actionableResponse.bestFitPlayers.length > 0 && (
                      <div className="p-2 bg-amber-50/70 border border-amber-200 rounded-lg flex flex-col gap-1">
                        <span className="text-[9.5px] font-bold text-amber-900 flex items-center gap-1">
                          <Users size={11} className="text-amber-600" />
                          <span>ผู้เล่น MCU ที่เล่นตัวแก้ทางนี้ได้ (Player Fit):</span>
                        </span>
                        <div className="flex items-center gap-1 flex-wrap">
                          {enemyThreatReport.actionableResponse.bestFitPlayers.map((p) => (
                            <span
                              key={p.nickname}
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded border flex items-center gap-1 ${
                                p.starColor === 'gold'
                                  ? 'bg-amber-100 text-amber-950 border-amber-300 font-black'
                                  : 'bg-white text-slate-700 border-slate-300'
                              }`}
                            >
                              <span>{p.starColor === 'gold' ? '⭐' : '★'}</span>
                              <span>
                                {p.nickname} ({p.playerRole})
                              </span>
                              <span className="text-[8px] opacity-75">[{p.tierLabel}]</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Step 5: Residual Risks */}
                    {enemyThreatReport.actionableResponse.residualRisks.length > 0 && (
                      <div className="flex flex-col gap-0.5 pt-1 border-t border-sky-100">
                        <span className="text-[9px] font-bold text-rose-700 flex items-center gap-1">
                          <AlertTriangle size={10} />
                          <span>ความเสี่ยงที่ยังหลงเหลือ (Residual Risks):</span>
                        </span>
                        <ul className="flex flex-col gap-0.5 pl-1">
                          {enemyThreatReport.actionableResponse.residualRisks.map((risk, idx) => (
                            <li
                              key={idx}
                              className="text-[9px] text-slate-600 flex items-start gap-1"
                            >
                              <span className="text-rose-500 font-bold">•</span>
                              <span>{risk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

              {/* Recommended Counter Style */}
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex flex-col gap-0.5 text-left">
                <span className="text-[10px] font-bold text-slate-700">
                  🛡️ แนวทางการตอบโต้ที่แนะนำ:
                </span>
                <span className="text-[10px] font-medium text-slate-800">
                  {enemyThreatReport.recommendedCounterStyle}
                </span>
              </div>

              {/* Anticipated Next Picks */}
              {enemyThreatReport.anticipatedPicks.length > 0 && (
                <div className="flex flex-col gap-1.5 pt-1.5 border-t border-slate-200">
                  <span className="text-[10px] font-bold text-slate-600 uppercase text-left">
                    การคาดการณ์การเลือกถัดไปของคู่แข่ง (ตามตำแหน่งที่ยังขาด):
                  </span>
                  {enemyThreatReport.anticipatedPicks.map((ap) => (
                    <div
                      key={ap.role}
                      className="p-1.5 bg-slate-100 rounded border border-slate-200 flex flex-col gap-0.5 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">
                          ตำแหน่ง {ap.role}:{' '}
                          <span className="text-[#E91E63]">{ap.likelyHeroes.join(', ')}</span>
                        </span>
                      </div>
                      <span className="text-[9.5px] text-slate-500">{ap.tacticalReason}</span>
                    </div>
                  ))}
                  <span className="text-[8.5px] text-slate-400 italic">
                    * {enemyThreatReport.anticipatedPicks[0]?.sourceNote}
                  </span>
                </div>
              )}
            </div>

            {/* Target Opponent Selector Tabs for Counter-Picks */}
            {oppLockedHeroes.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slate-600 uppercase">
                  เลือกฮีโร่คู่แข่งเพื่อดูตัวเคาน์เตอร์ของ MCU (TOP 3):
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                  {oppLockedHeroes.map((opp) => {
                    const isSelected = activeOppHero?.name.toLowerCase() === opp.name.toLowerCase();
                    return (
                      <button
                        key={opp.name}
                        type="button"
                        onClick={() => setSelectedOppHeroName(opp.name)}
                        className={`px-2 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5 flex-shrink-0 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#0284C7] text-white border-[#0369A1] shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <img
                          src={getHeroImageUrl(opp.name)}
                          alt={opp.name}
                          className="w-5 h-5 rounded object-cover"
                        />
                        <span>{opp.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Counter-Picks Card */}
                {activeOppHero && (
                  <div className="p-2.5 bg-white border border-[#F3D5E2] rounded-xl shadow-2xs flex flex-col gap-2">
                    <span className="text-[11px] font-bold text-slate-800">
                      ฮีโร่แก้ทาง{' '}
                      <span className="text-[#0284C7] font-black">{activeOppHero.name}</span>{' '}
                      สำหรับ MCU:
                    </span>

                    {counterPicksForOpponent.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {counterPicksForOpponent.map((cp) => (
                          <div
                            key={cp.heroName}
                            onClick={() => onSelectHeroToInspect(cp.heroName)}
                            className="p-2 bg-sky-50/50 hover:bg-sky-50 border border-sky-200 hover:border-sky-400 rounded-xl transition-all cursor-pointer flex flex-col gap-1.5 shadow-2xs group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <img
                                  src={getHeroImageUrl(cp.heroName)}
                                  alt={cp.heroName}
                                  className="w-9 h-9 rounded-lg object-cover border border-slate-200 group-hover:scale-105 transition-transform"
                                />
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-xs text-slate-900 group-hover:text-[#0284C7]">
                                      {cp.heroName}
                                    </span>
                                    {cp.hasSig && (
                                      <span className="text-[8.5px] font-black px-1.5 py-0.2 rounded bg-amber-500 text-white shadow-2xs">
                                        ⭐ SIGNATURE
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-500">
                                    {cp.heroObj?.primaryPos.toUpperCase()} • สถิติ Pro League{' '}
                                    {cp.games} แมตช์
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-col items-end">
                                <span className="text-[11px] font-black text-emerald-600 bg-white px-2 py-0.5 rounded border border-emerald-200">
                                  +{cp.diff.toFixed(1)}% Adv
                                </span>
                              </div>
                            </div>

                            {/* Player Comfort Badges with Gold/Silver stars */}
                            {cp.badges.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-sky-100">
                                <span className="text-[9.5px] text-slate-500 font-medium">
                                  คนในทีมที่เล่นได้:
                                </span>
                                {cp.badges.map((b) => (
                                  <span
                                    key={b.playerId}
                                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                      b.tier === 'signature'
                                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                                        : 'bg-white text-slate-600 border-slate-300'
                                    }`}
                                  >
                                    {b.tier === 'signature' ? '⭐' : '★'} {b.playerNickname}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2 text-center text-slate-500 text-[11px] bg-slate-50 rounded-lg border border-slate-200">
                        <span>
                          ไม่มีข้อมูลสถิติการแก้ทางโดยตรงจากแหล่งข้อมูลที่กำหนด สำหรับ {activeOppHero.name}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SITUATION C: COMBO FALLBACK AUDITS (Section 4)                            */}
        {/* ========================================================================= */}
        {situationalMode === 'banned_combos' && (
          <div className="flex flex-col gap-2.5">
            <div className="p-2.5 bg-white border border-[#F3D5E2] rounded-xl shadow-2xs flex flex-col gap-1.5">
              <span className="font-bold text-xs text-amber-800 flex items-center gap-1.5">
                <Layers size={14} className="text-amber-600" />
                <span>Combo Fallback — ระบบหาตัวทดแทนคอมโบเมื่อโดนแบน / ถูกแย่ง</span>
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                ระบบตรวจสอบแผนที่ได้รับผลกระทบ เสนอตัวทดแทนพร้อมแสดงผู้เล่นที่เล่นได้ (ดาวทอง ⭐ /
                ดาวเงิน ★) และข้อแลกเปลี่ยนแท็กติกจริง
              </p>
            </div>

            {comboFallbackAudits.length > 0 ? (
              <div className="flex flex-col gap-2">
                {comboFallbackAudits.map((item) => (
                  <div
                    key={`${item.compId}-${item.bannedOrUnavailableHero}`}
                    className="p-2.5 bg-white border border-amber-200 rounded-xl flex flex-col gap-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between border-b border-amber-100 pb-1.5">
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-slate-900">
                          {item.compNameTh} ({item.compName})
                        </span>
                        <span className="text-[10px] text-slate-500">
                          ระดับเมต้า: Tier {item.compTier} • ผลกระทบ: {item.impactDescription}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        {item.status === 'banned' ? 'BANNED' : 'UNAVAILABLE'}
                      </span>
                    </div>

                    {/* Substitutes with Attached MCU Players */}
                    {item.substitutes.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold text-amber-800 uppercase">
                          ตัวเลือกทดแทนที่ระบบแนะนำ (เรียงตามความเหมาะสม):
                        </span>

                        {item.substitutes.map((sub) => (
                          <div
                            key={sub.substituteHero}
                            onClick={() => onSelectHeroToInspect(sub.substituteHero)}
                            className="p-2 bg-amber-50/50 hover:bg-amber-50 border border-amber-200 hover:border-[#E91E63] rounded-lg flex flex-col gap-1 cursor-pointer transition-all shadow-2xs group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <img
                                  src={getHeroImageUrl(sub.substituteHero)}
                                  alt={sub.substituteHero}
                                  className="w-6 h-6 rounded object-cover border border-slate-200"
                                />
                                <span className="font-bold text-xs text-slate-900 group-hover:text-[#E91E63]">
                                  {sub.substituteHero}
                                </span>
                                <span className="text-[9.5px] text-slate-500">({sub.role})</span>
                              </div>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                  sub.isVerifiedSubstitute
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-slate-100 text-slate-700 border-slate-300'
                                }`}
                              >
                                {sub.isVerifiedSubstitute
                                  ? sub.effectiveness
                                  : 'ทางเลือกที่ต้องพิจารณา'}
                              </span>
                            </div>

                            <p className="text-[9.5px] text-slate-700 leading-tight">
                              📋 แผนเดิม: {sub.planCompatibility}
                            </p>
                            <p className="text-[9.5px] text-slate-600 leading-tight">
                              ⚖️ ข้อแลกเปลี่ยน: {sub.tradeOff}
                            </p>

                            {/* Players who play this substitute */}
                            {sub.playersWhoPlay.length > 0 ? (
                              <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-amber-200">
                                <span className="text-[9px] text-slate-500 font-medium">
                                  ผู้เล่นที่เล่นได้:
                                </span>
                                {sub.playersWhoPlay.map((p) => (
                                  <span
                                    key={p.nickname}
                                    className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded border ${
                                      p.starColor === 'gold'
                                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                                        : 'bg-white text-slate-700 border-slate-300'
                                    }`}
                                  >
                                    {p.starColor === 'gold' ? '⭐' : '★'} {p.nickname} (
                                    {p.playerRole})
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[9px] text-slate-400 italic pt-0.5">
                                ไม่มีผู้เล่นที่มีข้อมูลในพูลสำหรับตัวแทนนี้
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">
                        ไม่พบตัวแทนที่ว่างอยู่ในขณะนี้
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-white border border-[#F3D5E2] rounded-xl text-center text-slate-500 text-xs">
                <span>
                  ยังไม่มีฮีโร่ในคอมโบหลักถูกแบนหรือถูกแย่งในขณะนี้
                  แผนการเล่นหลักของทุกคอมโบยังใช้งานได้สมบูรณ์
                </span>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SITUATION D: SMART BAN ADVISOR (Section 5)                                */}
        {/* ========================================================================= */}
        {situationalMode === 'smart_ban' && (
          <div className="flex flex-col gap-2.5">
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <Ban size={16} className="text-rose-600 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-rose-950">
                    Smart Ban Advisor (คำแนะนำการแบน)
                  </span>
                  <span className="text-[10px] text-rose-700">
                    กรองเฉพาะตัวที่ยังไม่ถูกแบนและยังไม่ถูกเลือกเท่านั้น (ไม่แสดงคำแนะนำ PICK ปะปน)
                  </span>
                </div>
              </div>
            </div>

            {/* Threat-Informed Ban Suggestions (Phase P2) */}
            {enemyThreatReport.threatBans.length > 0 && (
              <div className="p-2.5 bg-rose-50/60 border border-rose-300 rounded-xl flex flex-col gap-1.5 text-left shadow-2xs">
                <span className="text-[10px] font-bold text-rose-900 uppercase flex items-center gap-1">
                  <Shield size={11} className="text-rose-600" />
                  <span>คำแนะนำแบนตัดภัยคุกคามคู่แข่ง (Threat-informed Ban):</span>
                </span>
                <div className="flex flex-col gap-1.5">
                  {enemyThreatReport.threatBans.map((tb) => {
                    const heroObj = allHeroes.find(
                      (h) => h.name.toLowerCase() === tb.heroName.toLowerCase()
                    );
                    return (
                      <div
                        key={tb.heroName}
                        className="p-1.5 bg-white border border-rose-200 rounded-lg flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={getHeroImageUrl(tb.heroName)}
                            alt={tb.heroName}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                          />
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-slate-900">{tb.heroName}</span>
                              <span
                                className={`text-[8px] font-black px-1.5 py-0.2 rounded uppercase ${
                                  tb.priority === 'must_ban'
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-amber-500 text-white'
                                }`}
                              >
                                {tb.priority === 'must_ban' ? 'MUST BAN' : 'HIGH PRIORITY'}
                              </span>
                            </div>
                            <span className="text-[9.5px] text-slate-600 line-clamp-1">
                              {tb.reason}
                            </span>
                          </div>
                        </div>

                        {onPickHeroDirectly && heroObj && (
                          <button
                            type="button"
                            onClick={() => onPickHeroDirectly(heroObj)}
                            className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold transition-all shadow-2xs cursor-pointer flex-shrink-0 active:scale-95 flex items-center gap-1"
                            title={`แบน ${tb.heroName}`}
                          >
                            <Ban size={10} />
                            <span>แบน</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {availableSmartBans.map((banItem, idx) => (
                <div
                  key={banItem.hero.name}
                  className="p-2.5 bg-white border border-rose-200 hover:border-rose-400 rounded-xl shadow-2xs flex items-center justify-between gap-2 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <img
                      src={getHeroImageUrl(banItem.hero.name)}
                      alt={banItem.hero.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-slate-900">
                          {banItem.hero.name}
                        </span>
                        <span
                          className={`text-[8px] font-black px-1.5 py-0.2 rounded uppercase ${
                            banItem.priority === 'must_ban'
                              ? 'bg-rose-600 text-white'
                              : 'bg-amber-500 text-white'
                          }`}
                        >
                          {banItem.priority === 'must_ban' ? 'MUST BAN' : 'PRIORITY'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-600 mt-0.5 line-clamp-2">
                        {banItem.reason}
                      </span>
                    </div>
                  </div>

                  {onPickHeroDirectly && (
                    <button
                      type="button"
                      onClick={() => onPickHeroDirectly(banItem.hero)}
                      className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex-shrink-0 active:scale-95 flex items-center gap-1"
                      title={`แบน ${banItem.hero.name}`}
                    >
                      <Ban size={11} />
                      <span>แบน</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* POST-DRAFT SUMMARY (ดราฟต์เสร็จสมบูรณ์)                                   */}
        {/* ========================================================================= */}
        {/* ========================================================================= */}
        {/* POST-DRAFT SUMMARY (ดราฟต์เสร็จสมบูรณ์ - Phase P3)                        */}
        {/* ========================================================================= */}
        {situationalMode === 'summary' && (
          <div className="flex flex-col gap-2.5">
            {!postDraftSummary.isDraftComplete ? (
              <div className="p-3.5 bg-amber-50/80 border border-amber-300 rounded-xl flex flex-col gap-2 text-center shadow-2xs">
                <div className="flex items-center justify-center gap-1.5 text-amber-900 font-bold text-xs">
                  <AlertTriangle size={15} className="text-amber-600" />
                  <span>ยังดราฟต์ไม่เสร็จสิ้น (Draft In Progress)</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  {postDraftSummary.incompleteReason ||
                    'ระบบจะสร้างบทวิเคราะห์ฉบับเต็มและแผนการเล่น 7 จุดเมื่อดราฟต์ครบ 10 ตัว'}
                </p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSituationalMode(isBanTurn ? 'smart_ban' : currentHero ? 'inspect' : 'counter_opp')}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-all shadow-2xs"
                  >
                    ← กลับไปดูคำแนะนำ BAN/PICK
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Header Card with Pro Analytics & Full Modal Trigger */}
                <div className="p-3 bg-gradient-to-r from-emerald-50 to-white border border-emerald-200 rounded-xl shadow-2xs flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                      <CheckCircle2 size={15} className="text-emerald-600" />
                      <span>สรุปผลวิเคราะห์คอมพ์หลังจบดราฟต์ (Post-Draft Review)</span>
                    </div>
                    {onOpenPostDraftModal && (
                      <button
                        type="button"
                        onClick={onOpenPostDraftModal}
                        className="px-2.5 py-1 bg-[#E91E63] hover:bg-[#D81B60] text-white text-[10px] font-bold rounded-lg cursor-pointer transition-all shadow-2xs flex items-center gap-1"
                        title="เปิดรายงานฉบับเต็มพร้อมบันทึกการซ้อมและพิมพ์สรุป"
                      >
                        <FileText size={11} />
                        <span>เปิดรายงานฉบับเต็ม</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {postDraftSummary.ourStrategicOverview ||
                      'การวิเคราะห์เชิงกลยุทธ์จากองค์ประกอบฮีโร่ทั้ง 10 ตัว พร้อมเงื่อนไขการชนะและแผนการเล่น 7 จุด'}
                  </p>

                  {/* Realized RPL Comps Badges */}
                  {postDraftSummary.realizedComps && postDraftSummary.realizedComps.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap pt-0.5 border-t border-emerald-100">
                      <span className="text-[9.5px] font-bold text-emerald-900">คอมโบ Pro Meta:</span>
                      {postDraftSummary.realizedComps.map((c) => (
                        <span
                          key={c.compName}
                          className="px-1.5 py-0.2 rounded bg-pink-100 text-[#E91E63] border border-pink-200 text-[9px] font-bold"
                        >
                          ⭐ {c.compNameTh} ({c.tier})
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Strengths */}
                  <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                      <TrendingUp size={13} className="text-emerald-600" />
                      <span>จุดแข็งของคอมพ์ทีมเรา:</span>
                    </span>
                    <ul className="flex flex-col gap-1 pl-1">
                      {postDraftSummary.compStrengths.map((s, idx) => (
                        <li
                          key={idx}
                          className="text-[10px] text-slate-700 leading-tight flex items-start gap-1"
                        >
                          <span className="text-emerald-600 font-bold">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-xl flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold text-rose-900 flex items-center gap-1">
                      <TrendingDown size={13} className="text-rose-600" />
                      <span>จุดอ่อน / ข้อพึงระวัง:</span>
                    </span>
                    <ul className="flex flex-col gap-1 pl-1">
                      {postDraftSummary.compWeaknesses.map((w, idx) => (
                        <li
                          key={idx}
                          className="text-[10px] text-slate-700 leading-tight flex items-start gap-1"
                        >
                          <span className="text-rose-600 font-bold">•</span>
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Win Conditions */}
                <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                    <Target size={13} className="text-amber-600" />
                    <span>เงื่อนไขการชนะ (Win Conditions):</span>
                  </span>
                  <ul className="flex flex-col gap-1 pl-1">
                    {postDraftSummary.winConditions.map((wc, idx) => (
                      <li
                        key={idx}
                        className="text-[10.5px] text-slate-800 leading-tight flex items-start gap-1"
                      >
                        <span className="text-amber-600 font-black">🏆</span>
                        <span>{wc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Phase Playbook */}
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1">
                    <Clock size={13} className="text-slate-500" />
                    <span>แนวทางการเล่นตามช่วงเวลา (Game Phase Playbook):</span>
                  </span>

                  {/* Early Game */}
                  <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex flex-col gap-1 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                      <span className="font-bold text-xs text-sky-800">
                        {postDraftSummary.earlyGame.timing}
                      </span>
                      <span className="text-[9px] font-bold bg-sky-50 text-sky-700 px-1.5 py-0.2 rounded border border-sky-200">
                        คุมจังหวะต้นเกม
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-600">
                      🎯 เป้าหมายหลัก: {postDraftSummary.earlyGame.focus}
                    </p>
                    <div className="flex flex-col gap-0.5 pl-1 mt-0.5">
                      {postDraftSummary.earlyGame.objectives.map((obj, i) => (
                        <span key={i} className="text-[9.5px] text-slate-500">
                          - {obj}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Mid Game */}
                  <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex flex-col gap-1 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                      <span className="font-bold text-xs text-indigo-800">
                        {postDraftSummary.midGame.timing}
                      </span>
                      <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded border border-indigo-200">
                        ดันป้อม & คุม Slayer
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-600">
                      🎯 เป้าหมายหลัก: {postDraftSummary.midGame.focus}
                    </p>
                    <div className="flex flex-col gap-0.5 pl-1 mt-0.5">
                      {postDraftSummary.midGame.objectives.map((obj, i) => (
                        <span key={i} className="text-[9.5px] text-slate-500">
                          - {obj}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Late Game */}
                  <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex flex-col gap-1 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                      <span className="font-bold text-xs text-purple-800">
                        {postDraftSummary.lateGame.timing}
                      </span>
                      <span className="text-[9px] font-bold bg-purple-50 text-purple-700 px-1.5 py-0.2 rounded border border-purple-200">
                        ไฟต์ 5v5 ปิดเกม
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-600">
                      🎯 เป้าหมายหลัก: {postDraftSummary.lateGame.focus}
                    </p>
                    <div className="flex flex-col gap-0.5 pl-1 mt-0.5">
                      {postDraftSummary.lateGame.objectives.map((obj, i) => (
                        <span key={i} className="text-[9.5px] text-slate-500">
                          - {obj}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Teamfight Rules Highlight (Phase P3) */}
                {postDraftSummary.gamePlan?.teamfightRules && (
                  <div className="p-2.5 bg-white border border-[#F3D5E2] rounded-xl flex flex-col gap-1.5 shadow-2xs">
                    <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                      <Swords size={12} className="text-[#E91E63]" />
                      <span>กฎไฟต์ 5v5 (Teamfight Rules):</span>
                    </span>
                    <div className="flex flex-col gap-1 text-[10px]">
                      <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-900 border border-emerald-100">
                        <span className="font-bold">✅ ควรบวก: </span>
                        <span>{postDraftSummary.gamePlan.teamfightRules.whenToFight[0]}</span>
                      </div>
                      <div className="p-1.5 bg-rose-50 rounded-lg text-rose-900 border border-rose-100">
                        <span className="font-bold">❌ ควรเลี่ยง: </span>
                        <span>{postDraftSummary.gamePlan.teamfightRules.whenToAvoid[0]}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Full Report Modal CTA Banner */}
                {onOpenPostDraftModal && (
                  <button
                    type="button"
                    onClick={onOpenPostDraftModal}
                    className="w-full py-2 bg-gradient-to-r from-[#E91E63] to-[#D81B60] hover:brightness-105 text-white font-bold text-xs rounded-xl shadow-md shadow-[#E91E63]/20 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <BookOpen size={13} />
                    <span>📑 เปิดรายงานกลยุทธ์ฉบับเต็ม & บันทึกการซ้อม</span>
                  </button>
                )}

                <div className="text-[9px] text-slate-400 text-center italic mt-0.5">
                  ที่มา: {postDraftSummary.provenance}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
