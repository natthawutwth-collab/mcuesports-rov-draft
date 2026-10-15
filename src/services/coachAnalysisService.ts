import { Hero, LaneSelectKey, PositionKey } from '../types/draft';
import { Player, HeroPlayerBadge, PlayerPosition } from '../types/player';
import { PickSlotState } from '../hooks/useDraconmindDraft';
import { statsDataProvider } from './statsDataProvider';
import { HeroMatchup, HeroSynergy } from '../types/stats';
import { calibrationService } from './calibrationService';

export type CompRoleKey = 'DSL' | 'Jungle' | 'Mid' | 'Support' | 'ADL';

export interface CompRoleInfo {
  key: CompRoleKey;
  label: string;
  short: string;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  desc: string;
}

export const COMP_ROLES: CompRoleInfo[] = [
  {
    key: 'DSL',
    label: 'Dark Slayer Lane',
    short: 'DSL',
    color: '#a855f7',
    bgClass: 'bg-purple-950/40',
    borderClass: 'border-purple-500/40',
    textClass: 'text-purple-400',
    desc: 'เลนบน / Dark Slayer (Fighter / Tank / Split-pusher)',
  },
  {
    key: 'Jungle',
    label: 'Jungle',
    short: 'JG',
    color: '#3b82f6',
    bgClass: 'bg-blue-950/40',
    borderClass: 'border-blue-500/40',
    textClass: 'text-blue-400',
    desc: 'ตำแหน่งฟาร์มป่า (Assassin / Carry / Objective Controller)',
  },
  {
    key: 'Mid',
    label: 'Mid Lane',
    short: 'MID',
    color: '#ec4899',
    bgClass: 'bg-pink-950/40',
    borderClass: 'border-pink-500/40',
    textClass: 'text-pink-400',
    desc: 'เลนกลาง (Mage / Wave Clear / Teamfight Burst)',
  },
  {
    key: 'Support',
    label: 'Support / Roaming',
    short: 'ROAM',
    color: '#eab308',
    bgClass: 'bg-amber-950/40',
    borderClass: 'border-amber-500/40',
    textClass: 'text-amber-400',
    desc: 'ซัพพอร์ต / โรมมิ่ง (Tank / Peeler / Engage / Vision)',
  },
  {
    key: 'ADL',
    label: 'Abyssal Dragon Lane',
    short: 'ADL',
    color: '#22c55e',
    bgClass: 'bg-emerald-950/40',
    borderClass: 'border-emerald-500/40',
    textClass: 'text-emerald-400',
    desc: 'เลนมังกร / แครี่ (Marksman / Late Game DPS)',
  },
];

export function mapToCompRole(input: string | PositionKey | LaneSelectKey | PlayerPosition): CompRoleKey | null {
  if (!input) return null;
  const norm = input.toLowerCase().trim();
  if (norm === 'dsl') return 'DSL';
  if (norm === 'jg' || norm === 'jungle') return 'Jungle';
  if (norm === 'mid') return 'Mid';
  if (norm === 'roam' || norm === 'support' || norm === 'sp') return 'Support';
  if (norm === 'adl' || norm === 'carry' || norm === 'abyssal') return 'ADL';
  return null;
}

export function getHeroCompRoles(hero: Hero): CompRoleKey[] {
  const roles: CompRoleKey[] = [];
  const primary = mapToCompRole(hero.primaryPos);
  if (primary) roles.push(primary);

  if (hero.pos) {
    hero.pos.forEach((p) => {
      const r = mapToCompRole(p);
      if (r && !roles.includes(r)) {
        roles.push(r);
      }
    });
  }
  return roles.length > 0 ? roles : ['DSL'];
}

export interface RoleAssignment {
  role: CompRoleKey;
  hero: Hero | null;
  pickIndex: number;
  isAssigned: boolean;
}

export interface TeamCompAnalysis {
  roles: Record<CompRoleKey, {
    filled: boolean;
    heroes: { hero: Hero; pickIndex: number; isManualPos: boolean }[];
  }>;
  filledCount: number;
  totalRoles: number;
  missingRoles: CompRoleKey[];
  duplicateRoles: { role: CompRoleKey; heroes: Hero[] }[];
}

export interface DraftWarningItem {
  id: string;
  severity: 'error' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  relatedHeroes?: string[];
}

export interface SuggestedPickItem {
  hero: Hero;
  score: number;
  targetRole: CompRoleKey;
  confidence: 'high' | 'medium' | 'situational';
  playerFits: HeroPlayerBadge[];
  reasons: string[];
  cautions: string[];
  strongCounters: string[];
  weakCounters: string[];
  missingData?: string[];
  riskPoints?: string[];
  statsSummary?: {
    games?: number;
    winRate?: number;
    hasProStats: boolean;
  };
}

export interface StrategyDimension {
  key: string;
  label: string;
  weight: number; // e.g. 20 for 20%
  score: number | null; // null if N/A
  grade: string; // 'A+' | 'A' | 'B+' | 'B' | 'C' | 'N/A'
  details: string;
  hasData: boolean;
}

export interface BalancedStrategyAssessment {
  dimensions: StrategyDimension[];
  overallScore: number | null; // null if N/A
  overallGrade: string; // 'A+' | 'A' | 'B+' | 'B' | 'C' | 'N/A'
  dataCoverage: number; // 0 to 100 percentage
  hasSufficientData: boolean;
  disclaimer: string;
}

export interface SmartBanItem {
  hero: Hero;
  reason: string;
  priority: 'must_ban' | 'high_priority' | 'situational';
  categoryLabel: string;
  phase: 'Phase 1 Ban' | 'Phase 2 Ban';
  targetRole?: string;
  isAvailable: boolean;
}

export interface CoachInsightItem {
  stage: 'Early Game' | 'Mid Game' | 'Late Game' | 'Key Win Condition';
  title: string;
  advice: string;
}

export interface DataSourceStatus {
  sourceName: string;
  totalGames: number;
  totalMatches: number;
  patch: string;
  coveragePercentage: number;
  hasVerifiedStats: boolean;
  note: string;
}

export interface LiveDraftOverviewInfo {
  activeTeam: 'blue' | 'red';
  myPickCount: number;
  oppPickCount: number;
  myBanCount: number;
  oppBanCount: number;
  currentPhaseLabel: string;
}

export interface CoachAnalysisResult {
  // 1. Live Draft Overview
  liveOverview: LiveDraftOverviewInfo;

  // 2. Inspected Hero Analysis
  inspectedHero: Hero | null;
  playerFit: {
    heroName: string;
    players: HeroPlayerBadge[];
    hasSignature: boolean;
    hasComfortable: boolean;
    hasAnyPlayer: boolean;
  };
  inspectedMatchups: {
    liveOpponents: Array<{
      oppHero: string;
      matchup: HeroMatchup | null;
      isAdvantage: boolean;
      isDisadvantage: boolean;
    }>;
    strongAgainst: HeroMatchup[];
    weakAgainst: HeroMatchup[];
  };
  inspectedSynergies: {
    liveAllies: Array<{
      allyHero: string;
      synergy: HeroSynergy | null;
      isPositive: boolean;
      isNegative: boolean;
    }>;
    bestWith: HeroSynergy[];
    worstWith: HeroSynergy[];
  };

  // 3. Team Composition Analyzer
  myTeamComp: TeamCompAnalysis;
  oppTeamComp: TeamCompAnalysis;

  // 4. Balanced Strategy Assessment (7 Dimensions)
  balancedStrategy: BalancedStrategyAssessment;

  // 5. Smart Ban Advisor
  smartBans: SmartBanItem[];

  // 6. Draft Risk Detection (Warnings)
  warnings: DraftWarningItem[];

  // 7. Smart Pick Recommendation (Top 3-5)
  suggestedPicks: SuggestedPickItem[];

  // 8. Coach Insight
  coachInsights: CoachInsightItem[];

  // 9. Data Source & Confidence Status
  dataSourceStatus: DataSourceStatus;
}

export function analyzeCoachDraft(params: {
  activeTeam: 'blue' | 'red';
  myPicks: PickSlotState[];
  oppPicks: PickSlotState[];
  myBans: (Hero | null)[];
  oppBans: (Hero | null)[];
  inspectedHero: Hero | null;
  players: Player[];
  heroToPlayersMap: Record<string, HeroPlayerBadge[]>;
  allHeroes: Hero[];
  bannedHeroNames: Set<string>;
  pickedHeroNames: Set<string>;
}): CoachAnalysisResult {
  const {
    activeTeam,
    myPicks,
    oppPicks,
    inspectedHero,
    heroToPlayersMap,
    allHeroes,
    bannedHeroNames,
    pickedHeroNames,
  } = params;

  // 1. Analyze Team Composition for My Team
  const analyzeComp = (picks: PickSlotState[]): TeamCompAnalysis => {
    const roles: TeamCompAnalysis['roles'] = {
      DSL: { filled: false, heroes: [] },
      Jungle: { filled: false, heroes: [] },
      Mid: { filled: false, heroes: [] },
      Support: { filled: false, heroes: [] },
      ADL: { filled: false, heroes: [] },
    };

    picks.forEach((p, idx) => {
      if (!p.hero) return;
      const compRole = mapToCompRole(p.pos) || mapToCompRole(p.hero.primaryPos);
      if (compRole && roles[compRole]) {
        roles[compRole].filled = true;
        roles[compRole].heroes.push({
          hero: p.hero,
          pickIndex: idx,
          isManualPos: Boolean(p.pos),
        });
      }
    });

    const missingRoles: CompRoleKey[] = [];
    const duplicateRoles: { role: CompRoleKey; heroes: Hero[] }[] = [];

    COMP_ROLES.forEach((cr) => {
      const entry = roles[cr.key];
      if (!entry.filled || entry.heroes.length === 0) {
        missingRoles.push(cr.key);
      } else if (entry.heroes.length > 1) {
        duplicateRoles.push({
          role: cr.key,
          heroes: entry.heroes.map((h) => h.hero),
        });
      }
    });

    const filledCount = COMP_ROLES.length - missingRoles.length;

    return {
      roles,
      filledCount,
      totalRoles: COMP_ROLES.length,
      missingRoles,
      duplicateRoles,
    };
  };

  const myTeamComp = analyzeComp(myPicks);
  const oppTeamComp = analyzeComp(oppPicks);

  // 2. Player Fit for Inspected Hero
  const targetHeroName = inspectedHero?.name || '';
  const badgesForHero = targetHeroName ? heroToPlayersMap[targetHeroName] || [] : [];
  const hasSignature = badgesForHero.some((b) => b.tier === 'signature');
  const hasComfortable = badgesForHero.some((b) => b.tier === 'comfortable');

  const playerFit = {
    heroName: targetHeroName,
    players: badgesForHero,
    hasSignature,
    hasComfortable,
    hasAnyPlayer: badgesForHero.length > 0,
  };

  // 3. Matchups for Inspected Hero
  const validOppHeroNames = oppPicks.map((p) => p.hero?.name || '').filter(Boolean);
  const liveMatchupRaw = statsDataProvider.getLiveDraftMatchups(targetHeroName, validOppHeroNames);
  const liveOpponents = liveMatchupRaw.map((item) => {
    const diff = item.matchup ? item.matchup.diff : 0;
    return {
      oppHero: item.oppHero,
      matchup: item.matchup,
      isAdvantage: diff > 0,
      isDisadvantage: diff < 0,
    };
  });

  const generalMatchups = targetHeroName ? statsDataProvider.getHeroMatchups(targetHeroName) : null;
  const inspectedMatchups = {
    liveOpponents,
    strongAgainst: generalMatchups?.strongAgainst || [],
    weakAgainst: generalMatchups?.weakAgainst || [],
  };

  // 3.5 Synergy (Played With) for Inspected Hero
  const validAllyHeroNames = myPicks
    .map((p) => p.hero?.name || '')
    .filter((name) => name && name.toLowerCase() !== targetHeroName.toLowerCase());
  const liveSynergyRaw =
    typeof statsDataProvider.getLiveDraftSynergies === 'function'
      ? statsDataProvider.getLiveDraftSynergies(targetHeroName, validAllyHeroNames)
      : [];
  const liveAllies = liveSynergyRaw.map((item) => {
    const diff = item.synergy ? (item.synergy.diff ?? 0) : 0;
    return {
      allyHero: item.allyHero,
      synergy: item.synergy,
      isPositive: diff >= 0,
      isNegative: diff < 0,
    };
  });

  const generalSynergies = targetHeroName
    ? typeof statsDataProvider.getHeroSynergies === 'function'
      ? statsDataProvider.getHeroSynergies(targetHeroName)
      : null
    : null;
  const inspectedSynergies = {
    liveAllies,
    bestWith: generalSynergies?.bestWith || [],
    worstWith: generalSynergies?.worstWith || [],
  };

  // 4. Draft Warnings
  const warnings: DraftWarningItem[] = [];

  // A. Duplicate Roles (Role Overlap)
  myTeamComp.duplicateRoles.forEach((dup) => {
    warnings.push({
      id: `dup-${dup.role}`,
      severity: 'error',
      title: `มี Hero ตำแหน่งเดียวกันหลายตัว (${dup.role})`,
      description: `ตรวจพบการเลือกฮีโร่ตำแหน่ง ${dup.role} ซ้ำกัน: ${dup.heroes
        .map((h) => h.name)
        .join(', ')} อาจทำให้คอมพ์เสียสมดุลการยืนเลน`,
      relatedHeroes: dup.heroes.map((h) => h.name),
    });
  });

  // B. Missing Roles
  const pickedCount = myPicks.filter((p) => p.hero !== null).length;
  if (pickedCount >= 3 && myTeamComp.missingRoles.length > 0) {
    const isLateDraft = pickedCount >= 4;
    myTeamComp.missingRoles.forEach((missing) => {
      warnings.push({
        id: `missing-${missing}`,
        severity: isLateDraft ? 'error' : 'warning',
        title: `ยังขาดตำแหน่ง ${missing}`,
        description: `คอมพ์ทีมยังไม่มีฮีโร่สำหรับตำแหน่ง ${missing} (${
          COMP_ROLES.find((r) => r.key === missing)?.desc || ''
        })`,
      });
    });
  }

  // C. Enemy Countering Our Drafted Heroes
  myPicks.forEach((myPick) => {
    if (!myPick.hero) return;
    validOppHeroNames.forEach((oppName) => {
      const h2h = statsDataProvider.getHeadToHead(myPick.hero!.name, oppName);
      if (h2h && h2h.diff <= -6) {
        warnings.push({
          id: `counter-${myPick.hero!.name}-${oppName}`,
          severity: 'warning',
          title: `${myPick.hero!.name} มี Counter จาก ${oppName} ของอีกฝ่าย`,
          description: `สถิติเจอกัน Win Rate เสียเปรียบ ${h2h.diff.toFixed(1)}% (${h2h.wins}W / ${h2h.losses}L)`,
          relatedHeroes: [myPick.hero!.name, oppName],
        });
      }
    });
  });

  // D. Inspected Hero Warnings
  if (inspectedHero) {
    // Check if inspected hero is directly countered by enemy picks
    liveOpponents.forEach((lo) => {
      if (lo.isDisadvantage && lo.matchup && lo.matchup.diff <= -4) {
        warnings.push({
          id: `inspect-counter-${lo.oppHero}`,
          severity: 'warning',
          title: `${inspectedHero.name} เสียเปรียบต่อ ${lo.oppHero}`,
          description: `อีกฝ่ายเลือก ${lo.oppHero} แล้ว สถิติพบว่า ${inspectedHero.name} มีอัตราแพ้ทาง (Diff ${lo.matchup.diff.toFixed(1)}%)`,
          relatedHeroes: [inspectedHero.name, lo.oppHero],
        });
      }
    });

    // Check if inspected hero would cause role overlap
    const heroRoles = getHeroCompRoles(inspectedHero);
    const wouldOverlap = heroRoles.some(
      (hr) => myTeamComp.roles[hr]?.filled && myTeamComp.roles[hr]?.heroes.length > 0
    );
    if (wouldOverlap && myTeamComp.missingRoles.length > 0) {
      warnings.push({
        id: `inspect-overlap-${inspectedHero.name}`,
        severity: 'info',
        title: `เลือก ${inspectedHero.name} อาจซ้ำตำแหน่งเดิม`,
        description: `ทีมมีฮีโร่ตำแหน่ง ${heroRoles.join('/')} อยู่แล้ว ในขณะที่ยังขาด ${myTeamComp.missingRoles.join(', ')}`,
        relatedHeroes: [inspectedHero.name],
      });
    }

    // Player Fit status for inspected hero
    if (playerFit.hasSignature) {
      const sigPlayers = badgesForHero.filter((b) => b.tier === 'signature');
      warnings.push({
        id: `inspect-sig-${inspectedHero.name}`,
        severity: 'success',
        title: `⭐ Signature Hero: ${inspectedHero.name}`,
        description: `นักแข่งชำนาญพิเศษ: ${sigPlayers.map((p) => `${p.playerNickname} (${p.position})`).join(', ')}`,
        relatedHeroes: [inspectedHero.name],
      });
    } else if (!playerFit.hasAnyPlayer) {
      warnings.push({
        id: `inspect-noplayer-${inspectedHero.name}`,
        severity: 'info',
        title: `ไม่อยู่ใน Hero Pool หลัก`,
        description: `ไม่มีนักแข่งในไลน์อัปที่ตั้งค่า ${inspectedHero.name} ไว้เป็นฮีโร่ถนัดหลัก ควรเช็กความมั่นใจก่อนหยิบ`,
        relatedHeroes: [inspectedHero.name],
      });
    }
  }

  // 5. Suggested Picks Engine (Professional RoV Esports Draft Analyst Grade)
  // Evaluates: Role fit, Player proficiency, Matchups, RPL stats & sample size, Allies synergy, Team balance (dmg/cc/peel/wave), Timing
  const candidateScores: SuggestedPickItem[] = [];

  // Current drafted allies for synergy & balance evaluation
  const draftedAllies = myPicks.map((p) => p.hero).filter((h): h is Hero => h !== null);
  const draftedAllyNames = draftedAllies.map((h) => h.name);

  // Analyze team balance before this pick
  const hasMagicAlly = draftedAllies.some(
    (h) => h.roles.includes('mage') || h.r === 'mage' || h.primaryPos === 'mid'
  );
  const hasPhysicalCarryAlly = draftedAllies.some(
    (h) => h.roles.includes('marksman') || h.primaryPos === 'adl'
  );
  const hasFrontlineAlly = draftedAllies.some(
    (h) => h.roles.includes('tank') || (h.roles.includes('support') && h.primaryPos === 'roam')
  );

  const activeWeights = calibrationService.getActiveWeights();

  allHeroes.forEach((hero) => {
    // Exclude if already picked or banned
    if (bannedHeroNames.has(hero.name) || pickedHeroNames.has(hero.name)) {
      return;
    }

    let score = 35; // Calibrated baseline score (avoids artificial ceiling saturation)
    const reasons: string[] = [];
    const cautions: string[] = [];
    const strongCounters: string[] = [];
    const weakCounters: string[] = [];
    const missingData: string[] = [];
    const riskPoints: string[] = [];

    const heroCompRoles = getHeroCompRoles(hero);
    const heroPrimaryComp = mapToCompRole(hero.primaryPos) || heroCompRoles[0];

    // Factor 1: Team Composition & Missing Role Fit (Weight: calibrated from activeWeights)
    const fillsMissing = heroCompRoles.find((r) => myTeamComp.missingRoles.includes(r));
    if (fillsMissing) {
      const rolePriorityBonus = pickedCount >= 4
        ? activeWeights.missingRoleWeight
        : pickedCount === 3
        ? Math.round(activeWeights.missingRoleWeight * 0.93)
        : Math.round(activeWeights.missingRoleWeight * 0.86);
      score += rolePriorityBonus;
      reasons.push(`เติมตำแหน่ง ${fillsMissing} ที่ยังขาด`);
    } else if (myTeamComp.missingRoles.length > 0) {
      // Escalating penalty in late draft (pickedCount >= 3) to strictly preserve essential lane integrity
      const roleClashPenalty = pickedCount >= 4 ? 36 : pickedCount === 3 ? 28 : 22;
      score -= roleClashPenalty;
      cautions.push(`ตำแหน่ง ${heroCompRoles.join('/')} มีผู้เล่นแล้ว`);
      riskPoints.push(`อาจทำให้ขาดตำแหน่ง ${myTeamComp.missingRoles.join(', ')}`);
    }

    // Factor 2: Player Hero Pool (Signature > Comfortable > Out of Pool) (Calibrated weight)
    const playerBadges = heroToPlayersMap[hero.name] || [];
    const sigBadge = playerBadges.find((b) => b.tier === 'signature');
    const comfBadge = playerBadges.find((b) => b.tier === 'comfortable');

    if (sigBadge) {
      const isRoleMatched = mapToCompRole(sigBadge.position) === fillsMissing;
      const sigBonus = isRoleMatched
        ? activeWeights.playerSignatureWeight
        : Math.round(activeWeights.playerSignatureWeight * 0.64);
      score += sigBonus;
      reasons.push(`⭐ Signature ของ ${sigBadge.playerNickname} (${sigBadge.position})`);
    } else if (comfBadge) {
      const isRoleMatched = mapToCompRole(comfBadge.position) === fillsMissing;
      const comfBonus = isRoleMatched
        ? activeWeights.playerComfortableWeight
        : Math.round(activeWeights.playerComfortableWeight * 0.58);
      score += comfBonus;
      reasons.push(`★ Comfortable ของ ${comfBadge.playerNickname} (${comfBadge.position})`);
    } else {
      score -= 6;
      missingData.push('ไม่อยู่ใน Signature/Comfortable ของผู้เล่น');
    }

    // Factor 3: Matchups vs Enemy Picks (Grounding with sample size >= 2 & Bayesian confidence damping)
    let matchupAdvantageCount = 0;
    let matchupDisadvantageCount = 0;

    validOppHeroNames.forEach((oppName) => {
      const h2h = statsDataProvider.getHeadToHead(hero.name, oppName);
      if (h2h && h2h.games >= 2) {
        // Sample size confidence damping:
        // >= 8 games: 1.0 (statistically solid sample)
        // 4-7 games: 0.8
        // 2-3 games: 0.55 (early sample, prevent 2-game 100% fluke from dominating)
        const sampleDamping = h2h.games >= 8 ? 1.0 : h2h.games >= 4 ? 0.8 : 0.55;
        // Off-role heroes receive dampened matchup credit because they will not lane against them
        const roleRelevance = fillsMissing ? 1.0 : 0.5;

        if (h2h.diff >= 4) {
          matchupAdvantageCount++;
          const bonus = Math.min(
            activeWeights.matchupAdvantageWeight,
            Math.round(h2h.diff * 1.1 * sampleDamping * roleRelevance)
          );
          score += bonus;
          strongCounters.push(oppName);
          const sampleNote = h2h.games < 4 ? ` (สถิติตัวอย่างน้อย: ${h2h.games} เกม)` : ` (${h2h.games} เกม)`;
          reasons.push(`⚔️ ชนะทาง ${oppName} (+${h2h.diff.toFixed(1)}% ใน${sampleNote})`);
        } else if (h2h.diff <= -4) {
          matchupDisadvantageCount++;
          const penalty = Math.min(
            activeWeights.matchupDisadvantagePenalty,
            Math.round(Math.abs(h2h.diff) * 1.3 * sampleDamping)
          );
          score -= penalty;
          weakCounters.push(oppName);
          const sampleNote = h2h.games < 4 ? ` (ตัวอย่างน้อย: ${h2h.games} เกม)` : ` (${h2h.games} เกม)`;
          cautions.push(`⚠️ เสียเปรียบ ${oppName} (${h2h.diff.toFixed(1)}% ใน${sampleNote})`);
          riskPoints.push(`ระวังโดน ${oppName} กดดันในเกม`);
        }
      }
    });

    if (validOppHeroNames.length > 0 && matchupAdvantageCount === 0 && matchupDisadvantageCount === 0) {
      missingData.push('ยังไม่มีสถิติ H2H ตรงกับคู่แข่งในโปรลีก');
    }

    // Factor 4: Synergy with Drafted Allies (Played With >= 2 games with sample damping)
    draftedAllyNames.forEach((allyName) => {
      const synergy = statsDataProvider.getHeroSynergyPair(hero.name, allyName);
      if (synergy && synergy.games >= 2) {
        const sampleDamping = synergy.games >= 8 ? 1.0 : synergy.games >= 4 ? 0.8 : 0.6;
        if (synergy.winRate >= 55 || (synergy.diff !== undefined && synergy.diff >= 3)) {
          score += Math.min(
            activeWeights.synergyWeight,
            Math.round((synergy.winRate - 50) * 0.6 * sampleDamping)
          );
          const sampleNote = synergy.games < 4 ? ` (ตัวอย่างน้อย ${synergy.games} เกม)` : '';
          reasons.push(`🤝 คอมโบเข้าขา ${allyName} (WR ${synergy.winRate.toFixed(1)}%${sampleNote})`);
        } else if (synergy.winRate <= 42 || (synergy.diff !== undefined && synergy.diff <= -5)) {
          score -= Math.round(8 * sampleDamping);
          cautions.push(`คอมโบกับ ${allyName} สถิติไม่เด่น (${synergy.winRate.toFixed(1)}%)`);
        }
      }
    });

    // Factor 5: RPL Competitive Win Rate & Games Played
    // Anti-slop rule: Win rate bonus only applies IF role fits or player fits. Never inflate isolated high WR!
    const heroStats = statsDataProvider.getHeroStats(hero.name);
    let hasProStats = false;
    let proGames: number | undefined = undefined;
    let proWr: number | undefined = undefined;

    if (heroStats) {
      hasProStats = true;
      proGames = heroStats.games;
      proWr = heroStats.winRate;

      if (heroStats.games >= 15) {
        if (heroStats.winRate >= 56) {
          // Gated bonus: only fully rewarded if player fits or role fits
          const synergyMultiplier = (fillsMissing || sigBadge || comfBadge) ? 1.0 : 0.4;
          const statBonus = Math.round(activeWeights.tournamentMetaWeight * synergyMultiplier);
          score += statBonus;
          reasons.push(`🔥 เมต้าเด่น RPL (WR ${heroStats.winRate.toFixed(1)}%, ${heroStats.games} เกม)`);
        } else if (heroStats.winRate <= 44) {
          score -= 8;
          cautions.push(`สถิติทัวร์ Win Rate ต่ำ (${heroStats.winRate.toFixed(1)}%)`);
          riskPoints.push('Win Rate ในโปรลีกต่ำกว่าเกณฑ์มาตรฐาน');
        }
      } else if (heroStats.games >= 5) {
        if (heroStats.winRate >= 58 && (fillsMissing || sigBadge)) {
          score += Math.max(3, Math.round(activeWeights.tournamentMetaWeight * 0.5));
          reasons.push(`สถิติดีในโปรลีก (${heroStats.winRate.toFixed(1)}% จาก ${heroStats.games} เกม)`);
        }
      } else {
        missingData.push(`สถิติโปรลีกตัวอย่างน้อย (${heroStats.games} เกม)`);
      }

      // Factor 5.5: Asymmetric Side Advantage (Blue vs Red in official RPL 2026 tournament statistics)
      const bWins = heroStats.blueWins || 0;
      const bLosses = heroStats.blueLosses || 0;
      const bTotal = bWins + bLosses;
      const rWins = heroStats.redWins || 0;
      const rLosses = heroStats.redLosses || 0;
      const rTotal = rWins + rLosses;

      if (activeTeam === 'blue' && bTotal >= 5) {
        const bWr = (bWins / bTotal) * 100;
        if (bWr >= 58) {
          const sideBonus = Math.min(
            activeWeights.sideBiasWeight,
            Math.round((bWr - 50) * 0.35)
          );
          score += sideBonus;
          reasons.push(`🔵 สถิติเด่นฝั่ง Blue (WR ${bWr.toFixed(1)}% ใน ${bTotal} เกม)`);
        } else if (bWr <= 40 && bTotal >= 8) {
          score -= 4;
          cautions.push(`สถิติเล่นฝั่ง Blue ในโปรลีกต่ำ (WR ${bWr.toFixed(1)}% จาก ${bTotal} เกม)`);
        }
      } else if (activeTeam === 'red' && rTotal >= 5) {
        const rWr = (rWins / rTotal) * 100;
        if (rWr >= 58) {
          const sideBonus = Math.min(
            activeWeights.sideBiasWeight,
            Math.round((rWr - 50) * 0.35)
          );
          score += sideBonus;
          reasons.push(`🔴 สถิติเด่นฝั่ง Red (WR ${rWr.toFixed(1)}% ใน ${rTotal} เกม)`);
        } else if (rWr <= 40 && rTotal >= 8) {
          score -= 4;
          cautions.push(`สถิติเล่นฝั่ง Red ในโปรลีกต่ำ (WR ${rWr.toFixed(1)}% จาก ${rTotal} เกม)`);
        }
      }
    } else {
      missingData.push('ไม่มีสถิติการเล่นใน RPL 2026 Summer');
    }

    // Factor 6: Team Balance (Physical/Magic, Frontline/Engage, Backline Protection, Wave Clear)
    const isMagicHero = hero.roles.includes('mage') || hero.r === 'mage';
    const isFrontlineHero = hero.roles.includes('tank') || (hero.roles.includes('support') && hero.pos.includes('roam'));
    const isWaveClearHero = hero.roles.includes('mage') || hero.pos.includes('mid') || hero.roles.includes('marksman');

    if (!hasMagicAlly && isMagicHero && fillsMissing) {
      score += 8;
      reasons.push('เติมดาเมจเวทให้ทีม (ป้องกันอีกฝ่ายออกเกราะกายภาพล้วน)');
    }
    if (!hasFrontlineAlly && isFrontlineHero && fillsMissing) {
      score += 9;
      reasons.push('เติมตัวเปิดไฟต์/รับดาเมจแนวหน้าให้ทีม');
    }
    if (!hasPhysicalCarryAlly && hero.roles.includes('marksman') && fillsMissing === 'ADL') {
      score += 10;
      reasons.push('เติมดาเมจทำลายป้อมหลักช่วงเลทเกม');
    }

    // Factor 7: Timing Curve (Early / Mid / Late Game evaluation grounded in hero kit)
    if (hero.tags.includes('early') || hero.primaryPos === 'mid') {
      if (draftedAllies.filter((a) => a.primaryPos === 'adl').length > 0 && isWaveClearHero) {
        score += 4;
      }
    }

    // Score Calibration: Soft diminishing returns curve above 85 to prevent flat 99 score clustering
    // Note: Score is a calibrated Draft Priority Ranking Index (0-100), NOT a Win Probability percentage!
    const compressedScore = score > 85 ? 85 + (score - 85) * 0.62 : score;
    const clampedScore = Math.min(99, Math.max(20, Math.round(compressedScore)));

    // Confidence tier
    let confidence: 'high' | 'medium' | 'situational' = 'situational';
    if (clampedScore >= 80 && (fillsMissing && (sigBadge || comfBadge || (proWr !== undefined && proWr >= 55)))) {
      confidence = 'high';
    } else if (clampedScore >= 60 && (fillsMissing || sigBadge || comfBadge)) {
      confidence = 'medium';
    }

    candidateScores.push({
      hero,
      score: clampedScore,
      targetRole: fillsMissing || heroPrimaryComp,
      confidence,
      playerFits: playerBadges,
      reasons,
      cautions,
      strongCounters,
      weakCounters,
      missingData: missingData.length > 0 ? missingData : undefined,
      riskPoints: riskPoints.length > 0 ? riskPoints : undefined,
      statsSummary: {
        games: proGames,
        winRate: proWr,
        hasProStats,
      },
    });
  });

  // Sort candidates by score descending with strict multi-level tie-breaking:
  // 1. Clamped score
  // 2. Player proficiency tier (signature > comfortable > none)
  // 3. Pro League Win Rate (if pro stats available)
  // 4. Pro League Games played
  candidateScores.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;

    const aPlayerTier = a.playerFits.some((f) => f.tier === 'signature')
      ? 2
      : a.playerFits.some((f) => f.tier === 'comfortable')
      ? 1
      : 0;
    const bPlayerTier = b.playerFits.some((f) => f.tier === 'signature')
      ? 2
      : b.playerFits.some((f) => f.tier === 'comfortable')
      ? 1
      : 0;
    if (bPlayerTier !== aPlayerTier) return bPlayerTier - aPlayerTier;

    const bWr = b.statsSummary?.winRate ?? 50;
    const aWr = a.statsSummary?.winRate ?? 50;
    if (bWr !== aWr) return bWr - aWr;

    const bGames = b.statsSummary?.games ?? 0;
    const aGames = a.statsSummary?.games ?? 0;
    return bGames - aGames;
  });

  // Take top 5 suggested picks (3-5 items as per spec)
  const suggestedPicks = candidateScores.slice(0, 5);

  // 6. Live Draft Overview
  const myPickCount = myPicks.filter((p) => p.hero !== null).length;
  const oppPickCount = oppPicks.filter((p) => p.hero !== null).length;
  const myBanCount = (params.myBans || []).filter(Boolean).length;
  const oppBanCount = (params.oppBans || []).filter(Boolean).length;
  const totalBans = myBanCount + oppBanCount;
  const totalPicks = myPickCount + oppPickCount;

  let currentPhaseLabel = 'Phase 1 Ban';
  if (totalPicks >= 10) {
    currentPhaseLabel = 'Completed';
  } else if (totalPicks >= 6 || totalBans >= 4) {
    currentPhaseLabel = totalPicks >= 6 && totalBans < 8 ? 'Phase 2 Ban' : 'Phase 2 Pick';
  } else if (totalBans >= 4) {
    currentPhaseLabel = 'Phase 1 Pick';
  }

  const liveOverview: LiveDraftOverviewInfo = {
    activeTeam,
    myPickCount,
    oppPickCount,
    myBanCount,
    oppBanCount,
    currentPhaseLabel,
  };

  // 7. 7-Dimension Balanced Strategy Engine
  const balancedStrategy = calculateBalancedStrategy(myPicks, oppPicks);

  // 8. Smart Ban Advisor
  const smartBans = generateSmartBans({
    activeTeam,
    myPicks,
    oppPicks,
    bannedHeroNames,
    pickedHeroNames,
    allHeroes,
  });

  // 9. Coach Insights
  const coachInsights = generateCoachInsights(myTeamComp, balancedStrategy);

  // 10. Data Source & Confidence Status
  const dataSourceStatus = getDataSourceStatus(balancedStrategy.dataCoverage);

  return {
    liveOverview,
    inspectedHero,
    playerFit,
    inspectedMatchups,
    inspectedSynergies,
    myTeamComp,
    oppTeamComp,
    balancedStrategy,
    smartBans,
    warnings,
    suggestedPicks,
    coachInsights,
    dataSourceStatus,
  };
}

/**
 * 7-Dimension Balanced Strategy Engine
 * Weights: Team Synergy 20%, Damage Balance 15%, Engage & CC 15%,
 * Peel & Survival 15%, Lane & Wave Control 10%, Objective Control 10%, Draft Flexibility 15%
 * Note: Weights are defined system parameters, not empirical statistics.
 */
export function calculateBalancedStrategy(
  myPicks: PickSlotState[],
  oppPicks: PickSlotState[]
): BalancedStrategyAssessment {
  const pickedHeroes = myPicks.map((p) => p.hero).filter((h): h is Hero => h !== null);
  const pickedCount = pickedHeroes.length;
  const dataCoverage = Math.round((pickedCount / 5) * 100);

  if (pickedCount === 0) {
    const defaultDimensions: StrategyDimension[] = [
      { key: 'synergy', label: 'Team Synergy', weight: 20, score: null, grade: 'N/A', details: 'ยังไม่มีการเลือกฮีโร่ในทีม', hasData: false },
      { key: 'damage', label: 'Damage Balance', weight: 15, score: null, grade: 'N/A', details: 'ยังไม่มีการเลือกฮีโร่ในทีม', hasData: false },
      { key: 'engage', label: 'Engage & CC', weight: 15, score: null, grade: 'N/A', details: 'ยังไม่มีการเลือกฮีโร่ในทีม', hasData: false },
      { key: 'peel', label: 'Peel & Survival', weight: 15, score: null, grade: 'N/A', details: 'ยังไม่มีการเลือกฮีโร่ในทีม', hasData: false },
      { key: 'wave', label: 'Lane & Wave Control', weight: 10, score: null, grade: 'N/A', details: 'ยังไม่มีการเลือกฮีโร่ในทีม', hasData: false },
      { key: 'objective', label: 'Objective Control', weight: 10, score: null, grade: 'N/A', details: 'ยังไม่มีการเลือกฮีโร่ในทีม', hasData: false },
      { key: 'flexibility', label: 'Draft Flexibility', weight: 15, score: null, grade: 'N/A', details: 'ยังไม่มีการเลือกฮีโร่ในทีม', hasData: false },
    ];
    return {
      dimensions: defaultDimensions,
      overallScore: null,
      overallGrade: 'N/A',
      dataCoverage: 0,
      hasSufficientData: false,
      disclaimer: 'น้ำหนักและคะแนนเหล่านี้เป็นค่ากำหนดเพื่อออกแบบระบบประเมินเชิงแท็กติก ไม่ใช่โอกาสชนะ (Win Probability)',
    };
  }

  // 1. Team Synergy (20%)
  let synergyScore: number | null = null;
  let synergyDetails = '';
  let synergyHasData = false;
  if (pickedCount < 2) {
    synergyScore = null;
    synergyDetails = 'ต้องมีฮีโร่อย่างน้อย 2 ตัวในการประเมิน Synergy';
  } else {
    synergyHasData = true;
    let synergyPairsFound = 0;
    let synergyScoreSum = 0;
    for (let i = 0; i < pickedHeroes.length; i++) {
      for (let j = i + 1; j < pickedHeroes.length; j++) {
        const pair = statsDataProvider.getHeroSynergyPair(pickedHeroes[i].name, pickedHeroes[j].name);
        if (pair && pair.games >= 2) {
          synergyPairsFound++;
          synergyScoreSum += Math.min(100, Math.max(30, Math.round(pair.winRate)));
        }
      }
    }
    const hasFrontline = pickedHeroes.some((h) => h.roles.includes('tank') || h.primaryPos === 'roam');
    const hasCarry = pickedHeroes.some((h) => h.roles.includes('marksman') || h.primaryPos === 'adl');
    const roleSynergyBonus = hasFrontline && hasCarry ? 15 : 5;

    if (synergyPairsFound > 0) {
      const avg = synergyScoreSum / synergyPairsFound;
      synergyScore = Math.min(95, Math.max(40, Math.round(avg * 0.8 + roleSynergyBonus)));
      synergyDetails = `พบคอมโบที่มีสถิติแข่งจริง ${synergyPairsFound} คู่ (เฉลี่ย ${Math.round(avg)}% WR)`;
    } else {
      synergyScore = Math.min(85, Math.max(50, 60 + roleSynergyBonus));
      synergyDetails = 'ประเมินจากความสอดคล้องของตำแหน่งและบทบาทพื้นฐาน';
    }
  }

  // 2. Damage Balance (15%)
  const magicHeroes = pickedHeroes.filter(
    (h) =>
      h.roles.includes('mage') ||
      h.r === 'mage' ||
      h.primaryPos === 'mid' ||
      ['marja', 'mganga', 'lorion', 'keera', 'zata', 'liliana', 'krixi', 'yue', 'iggy', 'diaochan', 'tulen', 'raz', 'aleister', 'flowborn'].includes(
        h.name.toLowerCase()
      )
  );
  const physicalHeroes = pickedHeroes.filter(
    (h) =>
      h.roles.includes('marksman') ||
      h.roles.includes('fighter') ||
      h.roles.includes('assassin') ||
      h.r === 'marksman' ||
      h.primaryPos === 'adl' ||
      h.primaryPos === 'dsl'
  );
  let damageScore = 70;
  let damageDetails = '';
  if (magicHeroes.length > 0 && physicalHeroes.length > 0) {
    damageScore = 90;
    damageDetails = `สมดุลดี: กายภาพ (${physicalHeroes.length}) / เวทมนตร์ (${magicHeroes.length}) ป้องกันการออกเกราะแก้ทาง`;
  } else if (physicalHeroes.length > 0 && magicHeroes.length === 0 && pickedCount >= 3) {
    damageScore = 40;
    damageDetails = '⚠️ ขาดดาเมจเวทมนตร์ (AP) เสี่ยงโดนศัตรูออกเกราะกายภาพล้วนแก้ทาง';
  } else if (magicHeroes.length > 0 && physicalHeroes.length === 0 && pickedCount >= 3) {
    damageScore = 45;
    damageDetails = '⚠️ ขาดดาเมจกายภาพหลัก อาจตีป้อมและออบเจกต์ช้า';
  } else {
    damageScore = 65;
    damageDetails = 'กำลังสร้างสมดุลความเสียหาย';
  }

  // 3. Engage & CC (15%)
  const ccHeroes = pickedHeroes.filter(
    (h) =>
      h.roles.includes('tank') ||
      ['toro', 'thane', 'baldum', 'mina', 'krizzix', 'maloch', 'gildur', 'ormarr', 'lumburr', 'arun', 'wiro', 'cresht', 'skud', 'ybneth', 'ata', 'teemee', 'lorion', 'aleister', 'diaochan'].includes(
        h.name.toLowerCase()
      )
  );
  let engageScore = 60;
  let engageDetails = '';
  if (ccHeroes.length >= 2) {
    engageScore = 92;
    engageDetails = `มีตัวเปิดไฟต์และ Hard CC แข็งแกร่ง (${ccHeroes.map((h) => h.name).join(', ')})`;
  } else if (ccHeroes.length === 1) {
    engageScore = 75;
    engageDetails = `มีตัวเปิดไฟต์หลัก 1 ตัว (${ccHeroes[0].name}) ควรระวังคูลดาวน์`;
  } else if (pickedCount >= 3) {
    engageScore = 38;
    engageDetails = '⚠️ ไม่มีตัว Hard CC/Engage ที่เชื่อถือได้ เสี่ยงโดนคุมจังหวะไฟต์';
  } else {
    engageScore = 60;
    engageDetails = 'รอตัวเปิดไฟต์/CC ในลำดับถัดไป';
  }

  // 4. Peel & Survival (15%)
  const peelHeroes = pickedHeroes.filter(
    (h) =>
      h.roles.includes('support') ||
      h.roles.includes('tank') ||
      ['helen', 'teemee', 'rouie', 'xeniel', 'toro', 'thane', 'chaugnar', 'annette', 'sephera', 'alice', 'marja', 'mganga', 'taara'].includes(
        h.name.toLowerCase()
      )
  );
  let peelScore = 60;
  let peelDetails = '';
  if (peelHeroes.length >= 2) {
    peelScore = 90;
    peelDetails = 'มีแนวหน้ารับดาเมจและระบบปกป้องแครี่แน่นหนา';
  } else if (peelHeroes.length === 1) {
    peelScore = 78;
    peelDetails = `มีแนวหน้า/ซัพพอร์ตคุ้มกัน (${peelHeroes[0].name})`;
  } else if (pickedCount >= 3) {
    peelScore = 35;
    peelDetails = '⚠️ คอมพ์บางมาก ขาดตัวรับดาเมจ เสี่ยงโดนไดฟ์ล้วงแนวหลัง';
  } else {
    peelScore = 60;
    peelDetails = 'รอการเติมแนวหน้า/ซัพพอร์ต';
  }

  // 5. Lane & Wave Control (10%)
  const waveHeroes = pickedHeroes.filter(
    (h) =>
      h.roles.includes('mage') ||
      h.primaryPos === 'mid' ||
      h.roles.includes('marksman') ||
      ['iggy', 'yue', 'natalya', 'dirak', 'capheny', 'hayate', 'violet', 'omen', 'florentino', 'marja', 'mganga'].includes(
        h.name.toLowerCase()
      )
  );
  let waveScore = 65;
  let waveDetails = '';
  if (waveHeroes.length >= 2) {
    waveScore = 88;
    waveDetails = 'เคลียร์เวฟรวดเร็ว คุมเลนและดักพุ่มได้เปรียบ';
  } else if (waveHeroes.length === 1) {
    waveScore = 72;
    waveDetails = `มีตัวเคลียร์เวฟหลัก (${waveHeroes[0].name})`;
  } else if (pickedCount >= 3) {
    waveScore = 48;
    waveDetails = '⚠️ เคลียร์เวฟช้า อาจเสียเปรียบเรื่องการดันเลนและการเดินเกม';
  } else {
    waveScore = 65;
    waveDetails = 'กำลังสร้างความสามารถในการคุมเลน';
  }

  // 6. Objective Control (10%)
  let objScore = 65;
  let objDetails = '';
  const hasJg = pickedHeroes.some((h) => h.primaryPos === 'jg' || h.pos?.includes('jg'));
  const hasAdl = pickedHeroes.some(
    (h) => h.primaryPos === 'adl' || h.pos?.includes('adl') || h.roles.includes('marksman')
  );
  if (hasJg && hasAdl) {
    objScore = 92;
    objDetails = 'พร้อมชิง Dark Slayer และ Abyssal Dragon ครบทั้ง DPS และ Smite';
  } else if (hasJg || hasAdl) {
    objScore = 76;
    objDetails = hasJg ? 'มี Jungler สไมต์ออบเจกต์' : 'มีแครี่ทำดาเมจใส่ออบเจกต์';
  } else if (pickedCount >= 3) {
    objScore = 42;
    objDetails = '⚠️ ยังขาดแกนหลักในการเก็บมังกรและดาร์กสเลเยอร์';
  } else {
    objScore = 65;
    objDetails = 'รอการเลือก Jungler / Carry';
  }

  // 7. Draft Flexibility (15%)
  const flexHeroes = pickedHeroes.filter(
    (h) =>
      (h.pos && h.pos.length >= 2) ||
      ['marja', 'keera', 'yan', 'wonder woman', 'skud', 'airi', 'florentino', 'lorion', 'veres', 'riktor', 'maloch', 'tachi', 'toro', 'xeniel', 'bolt baron', 'flowborn'].includes(
        h.name.toLowerCase()
      )
  );
  let flexScore = 65;
  let flexDetails = '';
  if (flexHeroes.length >= 2) {
    flexScore = 90;
    flexDetails = `ยืดหยุ่นสูง (${flexHeroes.map((h) => h.name).join(', ')}) สามารถสลับตำแหน่งหลอกดราฟต์ได้`;
  } else if (flexHeroes.length === 1) {
    flexScore = 75;
    flexDetails = `มีความยืดหยุ่นปานกลางจาก ${flexHeroes[0].name}`;
  } else {
    flexScore = 60;
    flexDetails = 'ไลน์อัปตำแหน่งชัดเจน คู่แข่งอ่านทางง่าย';
  }

  const toGrade = (s: number | null): string => {
    if (s === null) return 'N/A';
    if (s >= 88) return 'A+';
    if (s >= 78) return 'A';
    if (s >= 68) return 'B+';
    if (s >= 55) return 'B';
    return 'C';
  };

  const dimensions: StrategyDimension[] = [
    { key: 'synergy', label: 'Team Synergy', weight: 20, score: synergyScore, grade: toGrade(synergyScore), details: synergyDetails, hasData: synergyHasData },
    { key: 'damage', label: 'Damage Balance', weight: 15, score: damageScore, grade: toGrade(damageScore), details: damageDetails, hasData: true },
    { key: 'engage', label: 'Engage & CC', weight: 15, score: engageScore, grade: toGrade(engageScore), details: engageDetails, hasData: true },
    { key: 'peel', label: 'Peel & Survival', weight: 15, score: peelScore, grade: toGrade(peelScore), details: peelDetails, hasData: true },
    { key: 'wave', label: 'Lane & Wave Control', weight: 10, score: waveScore, grade: toGrade(waveScore), details: waveDetails, hasData: true },
    { key: 'objective', label: 'Objective Control', weight: 10, score: objScore, grade: toGrade(objScore), details: objDetails, hasData: true },
    { key: 'flexibility', label: 'Draft Flexibility', weight: 15, score: flexScore, grade: toGrade(flexScore), details: flexDetails, hasData: true },
  ];

  let weightedSum = 0;
  let weightTotal = 0;
  dimensions.forEach((d) => {
    if (d.score !== null) {
      weightedSum += d.score * (d.weight / 100);
      weightTotal += d.weight / 100;
    }
  });

  const overallScore = weightTotal > 0 ? Math.round(weightedSum / weightTotal) : null;
  const overallGrade = toGrade(overallScore);

  return {
    dimensions,
    overallScore,
    overallGrade,
    dataCoverage,
    hasSufficientData: pickedCount >= 1,
    disclaimer: 'น้ำหนักและคะแนนเหล่านี้เป็นค่ากำหนดเพื่อออกแบบระบบประเมินเชิงแท็กติก ไม่ใช่โอกาสชนะ (Win Probability)',
  };
}

export function generateSmartBans(params: {
  activeTeam: 'blue' | 'red';
  myPicks: PickSlotState[];
  oppPicks: PickSlotState[];
  bannedHeroNames: Set<string>;
  pickedHeroNames: Set<string>;
  allHeroes: Hero[];
}): SmartBanItem[] {
  const { oppPicks, bannedHeroNames, pickedHeroNames, allHeroes } = params;
  const oppPicksCount = oppPicks.filter((p) => p.hero !== null).length;
  const isPhase2 = oppPicksCount >= 3;
  const phaseLabel = isPhase2 ? 'Phase 2 Ban' : 'Phase 1 Ban';

  const takenRoles = new Set<string>();
  oppPicks.forEach((p) => {
    if (p.hero) {
      takenRoles.add(p.hero.primaryPos);
      p.hero.pos?.forEach((pos) => takenRoles.add(pos));
    }
  });

  const missingOppRoles = ['dsl', 'jg', 'mid', 'roam', 'adl'].filter((r) => !takenRoles.has(r));

  const priorityBanList = [
    { name: 'Marja', reason: 'ตัว Flex โซนไฟต์และดูดเลือดยอดนิยมใน RPL 2026', role: 'mid', priority: 'must_ban' as const },
    { name: 'Keera', reason: 'แอสซาสซินดาเมจเวทล้วงแนวหลังและแก้ทางแทงค์ได้เด็ดขาด', role: 'jg', priority: 'must_ban' as const },
    { name: 'Rouie', reason: 'ตัวคุมแมพ วาร์ปเติมไฟต์ และสร้างความได้เปรียบทั้งแผนที่', role: 'roam', priority: 'must_ban' as const },
    { name: 'TeeMee', reason: 'ชุบชีวิตเพื่อนร่วมทีมและเร่งการเงินแครี่ไวขึ้น 25%', role: 'roam', priority: 'high_priority' as const },
    { name: 'Billow', reason: 'ป่าเมต้าดาเมจเบิร์สต์สูงมาก เคลียร์ออบเจกต์ไว', role: 'jg', priority: 'high_priority' as const },
    { name: 'Aya', reason: 'ตัวเกาะสร้างโล่และ Slow ขัดจังหวะคอมโบศัตรู', role: 'roam', priority: 'high_priority' as const },
    { name: 'Hayate', reason: 'แครี่ดาเมจจริง (True Damage) เจาะแนวหน้าและละลายไฟต์', role: 'adl', priority: 'high_priority' as const },
    { name: 'Yan', reason: 'ไฟต์เตอร์เลทเกมอมตะ รำไฟต์เด็ดขาด', role: 'dsl', priority: 'situational' as const },
    { name: 'Aoi', reason: 'ป่าโหนสลิงล้วงตัวบางข้ามสิ่งกีดขวางได้อย่างรวดเร็ว', role: 'jg', priority: 'situational' as const },
    { name: 'Iggy', reason: 'เมจคุมเลน ยิงอัลติเมทตัดเลือดข้ามครึ่งแมพ', role: 'mid', priority: 'situational' as const },
  ];

  const results: SmartBanItem[] = [];

  for (const item of priorityBanList) {
    if (bannedHeroNames.has(item.name) || pickedHeroNames.has(item.name)) {
      continue;
    }
    const heroObj = allHeroes.find((h) => h.name.toLowerCase() === item.name.toLowerCase());
    if (!heroObj) continue;

    let categoryLabel = 'ตัวเมต้าแบนสูงสุดประจำทัวร์นาเมนต์';
    if (isPhase2 && missingOppRoles.includes(item.role)) {
      categoryLabel = `ตัดตัวเก่งในตำแหน่งที่คู่แข่งยังขาด (${item.role.toUpperCase()})`;
    }

    results.push({
      hero: heroObj,
      reason: item.reason,
      priority: item.priority,
      categoryLabel,
      phase: phaseLabel,
      targetRole: item.role.toUpperCase(),
      isAvailable: true,
    });

    if (results.length >= 4) break;
  }

  return results;
}

export function generateCoachInsights(
  myTeamComp: TeamCompAnalysis,
  balancedStrategy: BalancedStrategyAssessment
): CoachInsightItem[] {
  const insights: CoachInsightItem[] = [];

  insights.push({
    stage: 'Early Game',
    title: 'การคุมเลนและช่วงต้นเกม (0-4 นาที)',
    advice: myTeamComp.roles.Mid.filled
      ? 'ให้ Mid เดินประกบ Jungle / Roam เพื่อชิงครีปเลนกลางและดักซุ่มเลนมังกรก่อนนาทีที่ 2'
      : 'ยังขาด Mid เลนกลาง ควรระวังการถูกศัตรูกดดันและเสียพื้นที่ป่าต้นเกม',
  });

  const engageScore = balancedStrategy.dimensions.find((d) => d.key === 'engage')?.score ?? 0;
  insights.push({
    stage: 'Mid Game',
    title: 'การไฟต์แย่งพื้นที่ Abyssal Dragon (4-10 นาที)',
    advice:
      engageScore >= 75
        ? 'ทีมมีตัวเปิดไฟต์ที่ดี ให้ส่ง Roam โซนวิสัยทัศน์ในพุ่มรอบมังกรเพื่อเริ่มไฟต์ก่อน'
        : 'ทีมมีตัวเปิดไฟต์จำกัด ไม่ควรเริ่มไฟต์ในที่แคบ ให้ดึงเชิงและรอศัตรูเปิดก่อน',
  });

  const damageScore = balancedStrategy.dimensions.find((d) => d.key === 'damage')?.score ?? 0;
  insights.push({
    stage: 'Late Game',
    title: 'การชิง Dark Slayer และการดันปิดเกม (10+ นาที)',
    advice:
      damageScore >= 80
        ? 'สมดุลดาเมจดี ดันเลนคู่ขนาน (1-4 หรือ 1-3-1) บีบให้คู่แข่งต้องแยกรับมือ'
        : 'ดาเมจเอียงไปทางสายใดสายหนึ่ง ระวังศัตรูออกเกราะต้านทาน ควรไฟต์รวม 5 คน',
  });

  insights.push({
    stage: 'Key Win Condition',
    title: 'เงื่อนไขสำคัญสู่ชัยชนะของไลน์อัปนี้',
    advice:
      myTeamComp.missingRoles.length === 0
        ? 'โครงสร้างตำแหน่งครบถ้วน โฟกัสการคุ้มกันแครี่หลักและรักษาจังหวะเข้าทำตามคูลดาวน์สกิลสำคัญ'
        : `ยังขาดตำแหน่งสำคัญ (${myTeamComp.missingRoles.join(', ')}) ต้องเลือกฮีโร่มาเติมเต็มให้เร็วที่สุด`,
  });

  return insights;
}

export function getDataSourceStatus(dataCoverage: number): DataSourceStatus {
  return {
    sourceName: 'Official RoV Pro League 2026 Summer Tournament Dataset (Liquipedia)',
    totalGames: 291,
    totalMatches: 66,
    patch: '1.56',
    coveragePercentage: dataCoverage,
    hasVerifiedStats: true,
    note: 'สถิติการเล่น แบน ชนะ และคอมโบมาจากการแข่งขันทางการของ RPL 2026 Summer ตัวอย่างข้อมูลที่ไม่มีจะแสดง N/A โดยไม่มีการสร้างสถิติขึ้นเอง',
  };
}
