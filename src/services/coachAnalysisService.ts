import { Hero, LaneSelectKey, PositionKey } from '../types/draft';
import { Player, HeroPlayerBadge, PlayerPosition } from '../types/player';
import { PickSlotState } from '../hooks/useDraconmindDraft';
import { statsDataProvider } from './statsDataProvider';
import { HeroMatchup, HeroSynergy } from '../types/stats';

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
}

export interface CoachAnalysisResult {
  // Inspected Hero Analysis
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

  // Team Comp
  myTeamComp: TeamCompAnalysis;
  oppTeamComp: TeamCompAnalysis;

  // Warnings
  warnings: DraftWarningItem[];

  // Suggested Picks
  suggestedPicks: SuggestedPickItem[];
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
  const liveSynergyRaw = statsDataProvider.getLiveDraftSynergies(targetHeroName, validAllyHeroNames);
  const liveAllies = liveSynergyRaw.map((item) => {
    const diff = item.synergy ? item.synergy.diff : 0;
    return {
      allyHero: item.allyHero,
      synergy: item.synergy,
      isPositive: diff >= 0,
      isNegative: diff < 0,
    };
  });

  const generalSynergies = targetHeroName ? statsDataProvider.getHeroPlayedWith(targetHeroName) : null;
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

  // 5. Suggested Picks Engine
  // Consider: Player Hero Pool, Matchup against enemy picks, Team Comp missing roles, Exclude already picked/banned
  const candidateScores: SuggestedPickItem[] = [];

  allHeroes.forEach((hero) => {
    // Exclude if already picked or banned
    if (bannedHeroNames.has(hero.name) || pickedHeroNames.has(hero.name)) {
      return;
    }

    let score = 50; // Base score
    const reasons: string[] = [];
    const cautions: string[] = [];
    const strongCounters: string[] = [];
    const weakCounters: string[] = [];

    const heroCompRoles = getHeroCompRoles(hero);
    const heroPrimaryComp = mapToCompRole(hero.primaryPos) || heroCompRoles[0];

    // Factor A: Team Composition (Fills missing role)
    const fillsMissing = heroCompRoles.find((r) => myTeamComp.missingRoles.includes(r));
    if (fillsMissing) {
      score += 45;
      reasons.push(`เติมตำแหน่ง ${fillsMissing} ที่ยังขาด`);
    } else if (myTeamComp.missingRoles.length > 0) {
      // Hero does not fill any missing role
      score -= 25;
      cautions.push(`ตำแหน่ง ${heroCompRoles.join('/')} มีผู้เล่นแล้ว`);
    }

    // Factor B: Player Hero Pool
    const playerBadges = heroToPlayersMap[hero.name] || [];
    const sigBadge = playerBadges.find((b) => b.tier === 'signature');
    const comfBadge = playerBadges.find((b) => b.tier === 'comfortable');

    if (sigBadge) {
      const isRoleMatched = mapToCompRole(sigBadge.position) === fillsMissing;
      score += isRoleMatched ? 45 : 30;
      reasons.push(`⭐ Signature ของ ${sigBadge.playerNickname} (${sigBadge.position})`);
    } else if (comfBadge) {
      const isRoleMatched = mapToCompRole(comfBadge.position) === fillsMissing;
      score += isRoleMatched ? 30 : 20;
      reasons.push(`★ Comfortable ของ ${comfBadge.playerNickname} (${comfBadge.position})`);
    } else {
      score -= 10;
    }

    // Factor C: Matchups vs Enemy Picks
    validOppHeroNames.forEach((oppName) => {
      const h2h = statsDataProvider.getHeadToHead(hero.name, oppName);
      if (h2h) {
        if (h2h.diff >= 4) {
          score += Math.min(30, Math.round(h2h.diff * 2));
          strongCounters.push(oppName);
          reasons.push(`⚔️ ชนะทาง ${oppName} (+${h2h.diff.toFixed(1)}%)`);
        } else if (h2h.diff <= -4) {
          score -= Math.min(35, Math.round(Math.abs(h2h.diff) * 2));
          weakCounters.push(oppName);
          cautions.push(`⚠️ เสียเปรียบ ${oppName} (${h2h.diff.toFixed(1)}%)`);
        }
      }
    });

    // Factor D: RPL Competitive Win Rate
    const heroStats = statsDataProvider.getHeroStats(hero.name);
    if (heroStats) {
      if (heroStats.winRate >= 58 && heroStats.games >= 15) {
        score += 15;
        reasons.push(`🔥 เมต้าเด่น RPL (Win Rate ${heroStats.winRate.toFixed(1)}%)`);
      } else if (heroStats.winRate <= 42 && heroStats.games >= 15) {
        score -= 12;
        cautions.push(`สถิติทัวร์ Win Rate ต่ำ (${heroStats.winRate.toFixed(1)}%)`);
      }
    }

    // Confidence tier
    let confidence: 'high' | 'medium' | 'situational' = 'situational';
    if (score >= 105) {
      confidence = 'high';
    } else if (score >= 75) {
      confidence = 'medium';
    }

    candidateScores.push({
      hero,
      score,
      targetRole: fillsMissing || heroPrimaryComp,
      confidence,
      playerFits: playerBadges,
      reasons,
      cautions,
      strongCounters,
      weakCounters,
    });
  });

  // Sort candidates by score descending
  candidateScores.sort((a, b) => b.score - a.score);

  // Take top 8 suggested picks
  const suggestedPicks = candidateScores.slice(0, 8);

  return {
    inspectedHero,
    playerFit,
    inspectedMatchups,
    myTeamComp,
    oppTeamComp,
    warnings,
    suggestedPicks,
  };
}
