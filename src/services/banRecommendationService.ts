// Smart Ban Recommendation Engine
// Grounded strictly in Liquipedia RoV Pro League 2026 Summer official tournament statistics
// Official Tournament Source: https://liquipedia.net/honorofkings/RoV_Pro_League/2026/Summer/Statistics

import { Hero, PositionKey } from '../types/draft';
import { HeroStats } from '../types/stats';
import { HEROES } from '../data/heroes';
import {
  RPL_2026_HEROES_DATA,
  RPL_2026_PLAYED_AGAINST_DATA,
  RPL_2026_PLAYED_WITH_DATA,
} from '../data/rpl2026SummerStats';
import { RPL_2026_PRO_COMPS } from '../data/proMetaComps';

export const LIQUIPEDIA_RPL_2026_URL =
  'https://liquipedia.net/honorofkings/RoV_Pro_League/2026/Summer/Statistics';

export type BanCategoryType =
  | 'target_missing_role' // ตัดตัวเก่งในตำแหน่งที่คู่แข่งยังขาด
  | 'protect_our_pick' // แบนปกป้องตัวที่เราเลือกไปแล้ว (กันแก้ทาง)
  | 'deny_opp_combo' // ตัดคอมโบโปรลีกที่คู่แข่งกำลังจะต่อยอด
  | 'side_advantage' // ตัดตัวเก่งของฝั่งคู่แข่ง (Side Win Rate สูง)
  | 'pro_meta_power'; // ตัวเมต้าแบนสูงสุดประจำทัวร์นาเมนต์

export interface CounterProtectDetail {
  ourHero: string;
  winRate: number;
  games: number;
}

export interface ComboDenialDetail {
  oppHero: string;
  duoWinRate: number;
  games: number;
}

export interface BanRecommendationItem {
  hero: Hero;
  stats: HeroStats;
  score: number; // 0 - 99 Ban Priority Score
  rank: number;
  categoryType: BanCategoryType;
  categoryLabel: string;
  reason: string;
  detailedAnalysis: string;
  isAvailable: boolean;
  threatLevel: 'critical' | 'high' | 'medium';
  targetRole?: string;
  countersFriendlyPick?: CounterProtectDetail;
  deniesOppCombo?: ComboDenialDetail;
  sideContext?: string;
  liquipediaUrl: string;
}

const ALL_ROLES: PositionKey[] = ['dsl', 'jg', 'mid', 'roam', 'adl'];

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  dsl: 'Dark Slayer (ออฟเลน)',
  jg: 'Jungle (ป่า)',
  mid: 'Mid (เลนกลาง)',
  roam: 'Support / Roam (โรมมิ่ง)',
  adl: 'Abyssal Dragon (แครี่)',
};

/**
 * Helper to get the primary role of a hero name
 */
function getHeroPrimaryRole(heroName: string): PositionKey {
  const h = HEROES.find((item) => item.name.toLowerCase() === heroName.toLowerCase());
  if (!h) return 'dsl';
  return h.primaryPos || (h.pos && h.pos[0]) || 'dsl';
}

/**
 * Determine which standard positions are already taken by a team's locked picks
 */
export function getTakenRoles(heroNames: (string | null | undefined)[]): Set<PositionKey> {
  const taken = new Set<PositionKey>();
  heroNames.filter(Boolean).forEach((name) => {
    const role = getHeroPrimaryRole(name as string);
    taken.add(role);
  });
  return taken;
}

/**
 * Determine which standard positions a team is STILL MISSING
 */
export function getMissingRoles(heroNames: (string | null | undefined)[]): PositionKey[] {
  const taken = getTakenRoles(heroNames);
  return ALL_ROLES.filter((role) => !taken.has(role));
}

/**
 * 1. ช่องที่ 1: ฮีโร่ที่แนะนำให้แบน (สถิติแบนสูงสุดประจำทัวร์นาเมนต์ RPL 2026 Summer)
 * วิเคราะห์จาก Liquipedia Ban Rate, Bans Count และ Presence Rate รวม 291 เกม
 */
export function getTopProLeagueBans(
  bannedHeroNames: Set<string>,
  pickedHeroNames: Set<string>,
  limit: number = 10
): BanRecommendationItem[] {
  const availableCandidates = HEROES.filter(
    (h) => !bannedHeroNames.has(h.name) && !pickedHeroNames.has(h.name)
  );

  const scored = availableCandidates
    .map((hero) => {
      const stats = RPL_2026_HEROES_DATA[hero.name];
      if (!stats) return null;
      if (stats.bans < 5 && stats.banRate < 5) return null;

      // Ban Rate primary weight (60%) + Presence Rate (25%) + Win Rate (15%)
      const banRateWeight = (stats.banRate / 75) * 60;
      const presenceWeight = (stats.presenceRate / 95) * 25;
      const wrWeight = Math.min(15, Math.max(0, (stats.winRate - 40) / 20) * 15);
      const score = Math.min(99, Math.max(25, Math.round(banRateWeight + presenceWeight + wrWeight)));

      let reason = `โปรลีกแบน ${stats.banRate}% (ถูกแบน ${stats.bans} เกม) • Presence ${stats.presenceRate}% (WR ${stats.winRate}%)`;
      if (stats.banRate >= 60) {
        reason = `ตัวอันตรายสูงสุดในโปรลีก Ban Rate ${stats.banRate}% (แบน ${stats.bans} เกม) Presence สูงถึง ${stats.presenceRate}%`;
      } else if (stats.banRate >= 40) {
        reason = `ตัวเมต้าลำดับต้นๆ ในโปรลีก Ban Rate ${stats.banRate}% (แบน ${stats.bans} ครั้ง) WR ${stats.winRate}%`;
      } else if (stats.bans >= 50) {
        reason = `ถูกแบนบ่อยในทัวร์นาเมนต์ถึง ${stats.bans} ครั้ง (Ban Rate ${stats.banRate}%)`;
      }

      return {
        hero,
        stats,
        score,
        rank: 0,
        categoryType: 'pro_meta_power' as BanCategoryType,
        categoryLabel: '🔥 เมต้าโปรลีกแบนสูงสุด',
        reason,
        detailedAnalysis: `สถิติทางการจาก Liquipedia RPL 2026 Summer: ถูกแบน ${stats.bans} เกม (Ban Rate ${stats.banRate}%), อัตราการมีส่วนร่วมในดราฟต์ ${stats.presenceRate}%, อัตราการชนะรวม ${stats.winRate}%`,
        isAvailable: true,
        threatLevel: (score >= 80 ? 'critical' : score >= 60 ? 'high' : 'medium') as
          | 'critical'
          | 'high'
          | 'medium',
        sideContext: `Ban Rate ${stats.banRate}% (${stats.bans} เกม)`,
        liquipediaUrl: LIQUIPEDIA_RPL_2026_URL,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  scored.sort((a, b) => b.stats.banRate - a.stats.banRate || b.stats.bans - a.stats.bans || b.score - a.score);

  return scored.slice(0, limit).map((item, index) => ({
    ...item,
    rank: index + 1,
    threatLevel: index === 0 ? 'critical' : item.threatLevel,
  }));
}

/**
 * 2. ช่องที่ 2: ฮีโร่ที่ควรแบนฝั่ง (BLUE)
 * วิเคราะห์ดราฟต์ของทั้งสองฝั่งอย่างละเอียด:
 * - วิเคราะห์ฮีโร่ที่ฝั่งตรงข้าม (Red) เลือกไปแล้ว:
 *   1) ตำแหน่งที่ Red ยังขาด (Missing Roles): บูสต์แบนตัวเก่งในตำแหน่งที่ Red ยังไม่ได้หยิบ
 *   2) ตัดคอมโบ (Combo Denial): ตัดคู่หูโปรลีกของตัวที่ Red เลือกไปแล้ว (เช่น Rouie, Aya, Hayate)
 * - วิเคราะห์ฮีโร่ที่ฝั่งเรา (Blue) เลือกไปแล้ว:
 *   3) ปกป้องตัวเรา (Protect Our Picks): แบนตัวที่ชนะทางฮีโร่ของ Blue ตามสถิติ H2H
 * - สถิติฝั่ง Red ในโปรลีก (Liquipedia Red Side WR):
 *   4) ตัดตัวที่ฝั่ง Red ชนะสูงผิดปกติในโปรลีก
 */
export function getBlueSideRecommendedBans(
  bannedHeroNames: Set<string>,
  pickedHeroNames: Set<string>,
  friendlyBluePicks: (string | null | undefined)[] = [],
  enemyRedPicks: (string | null | undefined)[] = [],
  limit: number = 10
): BanRecommendationItem[] {
  const availableCandidates = HEROES.filter(
    (h) => !bannedHeroNames.has(h.name) && !pickedHeroNames.has(h.name)
  );

  const validBluePicks = friendlyBluePicks.filter(Boolean) as string[];
  const validRedPicks = enemyRedPicks.filter(Boolean) as string[];

  // Analyze Red's draft roles (what Red has picked vs what Red still needs)
  const redTakenRoles = getTakenRoles(validRedPicks);
  const redMissingRoles = getMissingRoles(validRedPicks);
  const isPhase2 = validBluePicks.length >= 3 && validRedPicks.length >= 3;

  const scored = availableCandidates
    .map((hero) => {
      const stats = RPL_2026_HEROES_DATA[hero.name];
      if (!stats) return null;
      if (stats.presenceRate < 5 && stats.bans < 4 && stats.games < 5) return null;

      const heroRole = hero.primaryPos || (hero.pos && hero.pos[0]) || 'dsl';
      const redWins = stats.redWins ?? 0;
      const redLosses = stats.redLosses ?? 0;
      const redGames = redWins + redLosses;
      const redWR = redGames >= 5 ? (redWins / redGames) * 100 : stats.winRate;

      // Base weight from Liquipedia tournament presence and ban rate
      const baseBanWeight = (stats.banRate / 75) * 35;
      const baseRedWrWeight = (Math.max(30, redWR) / 70) * 20;
      const basePresenceWeight = (stats.presenceRate / 95) * 15;
      let score = baseBanWeight + baseRedWrWeight + basePresenceWeight;

      let categoryType: BanCategoryType = 'side_advantage';
      let categoryLabel = `🔴 ตัดตัวเก่ง Red (WR ${redWR.toFixed(0)}%)`;
      let reason = '';
      let detailedAnalysis = '';
      let targetRole: string | undefined = undefined;
      let counterDetail: CounterProtectDetail | undefined = undefined;
      let comboDetail: ComboDenialDetail | undefined = undefined;

      // -------------------------------------------------------------
      // DRAFT ANALYSIS FACTOR 1: ตัดตัวเก่งในตำแหน่งที่ Red ยังขาด (Target Missing Role)
      // -------------------------------------------------------------
      const isRedMissingThisRole = redMissingRoles.includes(heroRole);
      const hasRedFilledThisRole = redTakenRoles.has(heroRole);

      if (validRedPicks.length > 0 && isRedMissingThisRole) {
        // Red hasn't picked this role yet! High priority target ban!
        const roleBonus = isPhase2 ? 26 : 14;
        score += roleBonus;
        targetRole = ROLE_DISPLAY_NAMES[heroRole] || heroRole.toUpperCase();
        categoryType = 'target_missing_role';
        categoryLabel = `🎯 ตัดตำแหน่ง ${heroRole.toUpperCase()} ที่ Red ขาด`;
        reason = `คู่แข่ง (Red) ยังไม่ได้เลือก ${targetRole} • แบน ${hero.name} เพื่อตัดตัวเก่งในตำแหน่งที่ขาด`;
        detailedAnalysis = `วิเคราะห์ดราฟต์คู่แข่ง: ฝั่ง Red เลือกไปแล้ว ${validRedPicks.length} ตัว (${validRedPicks.join(', ')}) แต่ยังไม่มีตำแหน่ง ${heroRole.toUpperCase()} ซึ่ง ${hero.name} เป็นตัวเก่งในโปรลีก (P&B ${stats.presenceRate}%, WR ${stats.winRate}%) แบนตัดแผน Red`;
      } else if (validRedPicks.length >= 2 && hasRedFilledThisRole && !isRedMissingThisRole) {
        // Red already filled this position, unless it's a known flex, lower its ban urgency slightly
        score -= 10;
      }

      // -------------------------------------------------------------
      // DRAFT ANALYSIS FACTOR 2: ตัดคอมโบโปรลีกที่ Red กำลังจะสร้าง (Combo Denial)
      // -------------------------------------------------------------
      const candidateAllies = RPL_2026_PLAYED_WITH_DATA[hero.name] || [];
      for (const redHero of validRedPicks) {
        const duoMatch = candidateAllies.find((a) => a.allyHero === redHero);
        if (duoMatch && duoMatch.games >= 2 && duoMatch.winRate >= 54) {
          const comboBonus = isPhase2 ? 22 : 16;
          score += comboBonus;
          comboDetail = {
            oppHero: redHero,
            duoWinRate: duoMatch.winRate,
            games: duoMatch.games,
          };
          categoryType = 'deny_opp_combo';
          categoryLabel = `⚡ ตัดคอมโบ Red (${redHero} + ${hero.name})`;
          reason = `ตัดคอมโบโปรลีกของ Red: เล่นคู่กับ ${redHero} ชนะสูงถึง ${duoMatch.winRate}% (${duoMatch.games} เกม)`;
          detailedAnalysis = `วิเคราะห์ดราฟต์คู่แข่ง: ฝั่ง Red ได้เลือก ${redHero} ไปแล้ว ในสถิติ Liquipedia RPL 2026 Summer พบว่า ${hero.name} คอมโบกับ ${redHero} มีอัตราการชนะสูงถึง ${duoMatch.winRate}% แบนเพื่อไม่ให้ Red ได้คอมโบนี้`;
          break;
        }

        // Check Pro Comps synergy
        const relatedComp = RPL_2026_PRO_COMPS.find(
          (c) => c.coreHeroes.includes(redHero) && c.coreHeroes.includes(hero.name)
        );
        if (relatedComp && !comboDetail) {
          score += 14;
          categoryType = 'deny_opp_combo';
          categoryLabel = `⚡ ตัดคอมพ์โปร (${relatedComp.name})`;
          reason = `ตัดคอมพ์ ${relatedComp.name}: เล่นคู่กับ ${redHero} ของฝั่ง Red`;
          detailedAnalysis = `คู่แข่งเลือก ${redHero} ซึ่งเป็นหัวใจของคอมพ์ '${relatedComp.name}' (${relatedComp.popularTeams.join(', ')}) ที่มักใช้ ${hero.name} ร่วมด้วย`;
          break;
        }
      }

      // -------------------------------------------------------------
      // DRAFT ANALYSIS FACTOR 3: ปกป้องตัวที่ฝั่งเรา (Blue) เลือกไปแล้ว (Counter Protection)
      // -------------------------------------------------------------
      const candidateMatchups = RPL_2026_PLAYED_AGAINST_DATA[hero.name] || [];
      for (const blueHero of validBluePicks) {
        const h2hMatch = candidateMatchups.find((m) => m.opponentHero === blueHero);
        if (h2hMatch && h2hMatch.games >= 2 && h2hMatch.winRate >= 53) {
          const protectBonus = isPhase2 ? 24 : 18;
          score += protectBonus;
          counterDetail = {
            ourHero: blueHero,
            winRate: h2hMatch.winRate,
            games: h2hMatch.games,
          };
          categoryType = 'protect_our_pick';
          categoryLabel = `🛡️ ปกป้อง ${blueHero} ของเรา (กันแก้ทาง)`;
          reason = `แบนปกป้อง ${blueHero}: ${hero.name} สถิติชนะทาง ${blueHero} สูงถึง ${h2hMatch.winRate}% ในโปรลีก`;
          detailedAnalysis = `วิเคราะห์ดราฟต์ฝั่งเรา: ฝั่ง Blue ของเราเลือก ${blueHero} แล้ว สถิติ Head-to-Head ใน RPL 2026 Summer ระบุว่า ${hero.name} ชนะทาง ${blueHero} (${h2hMatch.winRate}% จาก ${h2hMatch.games} เกม) แบนเพื่อป้องกันไม่ให้ Red หยิบมาแก้ทางเรา`;
          break;
        }
      }

      // -------------------------------------------------------------
      // DRAFT ANALYSIS FACTOR 4: Fallback to Red Side Advantage / Meta Power
      // -------------------------------------------------------------
      if (!reason) {
        if (redGames >= 7 && redWR >= 58) {
          categoryType = 'side_advantage';
          categoryLabel = `🔴 Red Side ตัวเก่ง (WR ${redWR.toFixed(0)}%)`;
          reason = `ฝั่ง Red ชนะสูง ${redWR.toFixed(1)}% (${redWins}/${redGames} เกม) ในโปรลีก • แบนตัดตัวถนัดของ Red`;
          detailedAnalysis = `สถิติฝั่งสนาม: เมื่อเล่นฝั่ง Red ใน RPL 2026 Summer ฮีโร่ตัวนี้มีอัตราการชนะสูงถึง ${redWR.toFixed(1)}% แบนตัดความได้เปรียบของฝั่ง Red`;
        } else if (stats.banRate >= 50) {
          categoryType = 'pro_meta_power';
          categoryLabel = `🔥 เมต้าโปรลีก (Ban Rate ${stats.banRate}%)`;
          reason = `ตัวอันตรายระดับ Pro Meta (Ban Rate ${stats.banRate}%, P&B ${stats.presenceRate}%) Red หยิบแล้วได้เปรียบ`;
          detailedAnalysis = `สถิติโปรลีก: ถูกแบน ${stats.bans} ครั้ง (Ban Rate ${stats.banRate}%) มีส่วนร่วมในดราฟต์ ${stats.presenceRate}% ห้ามปล่อยให้ Red ได้เล่น`;
        } else {
          categoryType = 'pro_meta_power';
          categoryLabel = `📊 โปรลีกสถิติสูง`;
          reason = `แบน ${stats.bans} เกม • Red WR ${redWR.toFixed(1)}% • Presence ${stats.presenceRate}%`;
          detailedAnalysis = `สถิติทางการ RPL 2026 Summer: มีส่วนร่วมในดราฟต์ ${stats.presenceRate}%, ชนะฝั่ง Red ${redWins} เกม (WR ${redWR.toFixed(1)}%)`;
        }
      }

      const clampedScore = Math.min(99, Math.max(30, Math.round(score)));

      return {
        hero,
        stats,
        score: clampedScore,
        rank: 0,
        categoryType,
        categoryLabel,
        reason,
        detailedAnalysis,
        isAvailable: true,
        threatLevel: (clampedScore >= 82 ? 'critical' : clampedScore >= 64 ? 'high' : 'medium') as
          | 'critical'
          | 'high'
          | 'medium',
        targetRole,
        countersFriendlyPick: counterDetail,
        deniesOppCombo: comboDetail,
        sideContext: `Red WR: ${redWR.toFixed(1)}% (${redGames} เกม)`,
        liquipediaUrl: LIQUIPEDIA_RPL_2026_URL,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  // Sort descending by calculated tactical score
  scored.sort((a, b) => b.score - a.score || b.stats.banRate - a.stats.banRate);

  return scored.slice(0, limit).map((item, index) => ({
    ...item,
    rank: index + 1,
    threatLevel: index === 0 ? 'critical' : item.threatLevel,
  }));
}

/**
 * 3. ช่องที่ 3: ฮีโร่ที่ควรแบนฝั่ง (RED)
 * วิเคราะห์ดราฟต์ของทั้งสองฝั่งอย่างละเอียด:
 * - วิเคราะห์ฮีโร่ที่ฝั่งตรงข้าม (Blue) เลือกไปแล้ว:
 *   1) ตำแหน่งที่ Blue ยังขาด (Missing Roles): บูสต์แบนตัวเก่งในตำแหน่งที่ Blue ยังไม่ได้หยิบ
 *   2) ตัดคอมโบ (Combo Denial): ตัดคู่หูโปรลีกของตัวที่ Blue เลือกไปแล้ว
 * - วิเคราะห์ฮีโร่ที่ฝั่งเรา (Red) เลือกไปแล้ว:
 *   3) ปกป้องตัวเรา (Protect Our Picks): แบนตัวที่ชนะทางฮีโร่ของ Red ตามสถิติ H2H
 * - ป้องกัน First Pick ของ Blue ใน Phase 1:
 *   4) ตัดฮีโร่ Tier 0 / Blue Side WR สูง ที่ Blue สามารถ First Pick หยิบได้ทันทีใน Turn 5
 */
export function getRedSideRecommendedBans(
  bannedHeroNames: Set<string>,
  pickedHeroNames: Set<string>,
  friendlyRedPicks: (string | null | undefined)[] = [],
  enemyBluePicks: (string | null | undefined)[] = [],
  limit: number = 10
): BanRecommendationItem[] {
  const availableCandidates = HEROES.filter(
    (h) => !bannedHeroNames.has(h.name) && !pickedHeroNames.has(h.name)
  );

  const validRedPicks = friendlyRedPicks.filter(Boolean) as string[];
  const validBluePicks = enemyBluePicks.filter(Boolean) as string[];

  // Analyze Blue's draft roles (what Blue has picked vs what Blue still needs)
  const blueTakenRoles = getTakenRoles(validBluePicks);
  const blueMissingRoles = getMissingRoles(validBluePicks);
  const isPhase1 = validBluePicks.length === 0 && validRedPicks.length === 0;
  const isPhase2 = validBluePicks.length >= 3 && validRedPicks.length >= 3;

  const scored = availableCandidates
    .map((hero) => {
      const stats = RPL_2026_HEROES_DATA[hero.name];
      if (!stats) return null;
      if (stats.presenceRate < 5 && stats.bans < 4 && stats.games < 5) return null;

      const heroRole = hero.primaryPos || (hero.pos && hero.pos[0]) || 'dsl';
      const blueWins = stats.blueWins ?? 0;
      const blueLosses = stats.blueLosses ?? 0;
      const blueGames = blueWins + blueLosses;
      const blueWR = blueGames >= 5 ? (blueWins / blueGames) * 100 : stats.winRate;

      // Base weight from Liquipedia tournament presence and ban rate
      const baseBanWeight = (stats.banRate / 75) * 40;
      const baseBlueWrWeight = (Math.max(30, blueWR) / 70) * 20;
      const basePresenceWeight = (stats.presenceRate / 95) * 15;
      let score = baseBanWeight + baseBlueWrWeight + basePresenceWeight;

      let categoryType: BanCategoryType = 'side_advantage';
      let categoryLabel = `🔵 ตัดตัวเก่ง Blue (WR ${blueWR.toFixed(0)}%)`;
      let reason = '';
      let detailedAnalysis = '';
      let targetRole: string | undefined = undefined;
      let counterDetail: CounterProtectDetail | undefined = undefined;
      let comboDetail: ComboDenialDetail | undefined = undefined;

      // -------------------------------------------------------------
      // DRAFT ANALYSIS FACTOR 1 (Phase 1): ต้องตัด First Pick ของ Blue Side
      // -------------------------------------------------------------
      if (isPhase1 && (stats.presenceRate >= 80 || stats.banRate >= 55)) {
        score += 20;
        categoryType = 'side_advantage';
        categoryLabel = `⚡ ห้ามปล่อย First Pick ให้ Blue`;
        reason = `Blue มีสิทธิ์เลือกตัวแรก (First Pick) • ต้องแบน ${hero.name} (P&B ${stats.presenceRate}%) ห้ามปล่อยให้ Blue หยิบฟรี`;
        detailedAnalysis = `วิเคราะห์ลำดับดราฟต์: ฝั่ง Blue จะได้สิทธิ์หยิบตัวแรกในเทิร์น 5 หากไม่แบน ${hero.name} ฝั่ง Blue จะได้ตัว Tier 0 ของเมต้าโปรลีกไปทันที (Presence ${stats.presenceRate}%, Blue WR ${blueWR.toFixed(1)}%)`;
      }

      // -------------------------------------------------------------
      // DRAFT ANALYSIS FACTOR 2: ตัดตัวเก่งในตำแหน่งที่ Blue ยังขาด (Target Missing Role)
      // -------------------------------------------------------------
      const isBlueMissingThisRole = blueMissingRoles.includes(heroRole);
      const hasBlueFilledThisRole = blueTakenRoles.has(heroRole);

      if (validBluePicks.length > 0 && isBlueMissingThisRole) {
        // Blue hasn't picked this role yet! High priority target ban!
        const roleBonus = isPhase2 ? 26 : 14;
        score += roleBonus;
        targetRole = ROLE_DISPLAY_NAMES[heroRole] || heroRole.toUpperCase();
        categoryType = 'target_missing_role';
        categoryLabel = `🎯 ตัดตำแหน่ง ${heroRole.toUpperCase()} ที่ Blue ขาด`;
        reason = `คู่แข่ง (Blue) ยังไม่ได้เลือก ${targetRole} • แบน ${hero.name} เพื่อตัดตัวเก่งในตำแหน่งที่ขาด`;
        detailedAnalysis = `วิเคราะห์ดราฟต์คู่แข่ง: ฝั่ง Blue เลือกไปแล้ว ${validBluePicks.length} ตัว (${validBluePicks.join(', ')}) แต่ยังขาดตำแหน่ง ${heroRole.toUpperCase()} ซึ่ง ${hero.name} เป็นตัวเก่งในโปรลีก (P&B ${stats.presenceRate}%, WR ${stats.winRate}%) แบนตัดทางเลือกของ Blue`;
      } else if (validBluePicks.length >= 2 && hasBlueFilledThisRole && !isBlueMissingThisRole) {
        // Blue already filled this position
        score -= 10;
      }

      // -------------------------------------------------------------
      // DRAFT ANALYSIS FACTOR 3: ตัดคอมโบโปรลีกที่ Blue กำลังจะสร้าง (Combo Denial)
      // -------------------------------------------------------------
      const candidateAllies = RPL_2026_PLAYED_WITH_DATA[hero.name] || [];
      for (const blueHero of validBluePicks) {
        const duoMatch = candidateAllies.find((a) => a.allyHero === blueHero);
        if (duoMatch && duoMatch.games >= 2 && duoMatch.winRate >= 54) {
          const comboBonus = isPhase2 ? 22 : 16;
          score += comboBonus;
          comboDetail = {
            oppHero: blueHero,
            duoWinRate: duoMatch.winRate,
            games: duoMatch.games,
          };
          categoryType = 'deny_opp_combo';
          categoryLabel = `⚡ ตัดคอมโบ Blue (${blueHero} + ${hero.name})`;
          reason = `ตัดคอมโบโปรลีกของ Blue: เล่นคู่กับ ${blueHero} ชนะสูงถึง ${duoMatch.winRate}% (${duoMatch.games} เกม)`;
          detailedAnalysis = `วิเคราะห์ดราฟต์คู่แข่ง: ฝั่ง Blue ได้เลือก ${blueHero} ไปแล้ว ในสถิติ Liquipedia RPL 2026 Summer พบว่า ${hero.name} คอมโบกับ ${blueHero} มีอัตราการชนะสูงถึง ${duoMatch.winRate}% แบนเพื่อทำลายคอมโบหลัก`;
          break;
        }

        const relatedComp = RPL_2026_PRO_COMPS.find(
          (c) => c.coreHeroes.includes(blueHero) && c.coreHeroes.includes(hero.name)
        );
        if (relatedComp && !comboDetail) {
          score += 14;
          categoryType = 'deny_opp_combo';
          categoryLabel = `⚡ ตัดคอมพ์โปร (${relatedComp.name})`;
          reason = `ตัดคอมพ์ ${relatedComp.name}: เล่นคู่กับ ${blueHero} ของฝั่ง Blue`;
          detailedAnalysis = `คู่แข่งเลือก ${blueHero} ซึ่งเป็นหัวใจของคอมพ์ '${relatedComp.name}' (${relatedComp.popularTeams.join(', ')}) ที่มักใช้ ${hero.name} ร่วมด้วย`;
          break;
        }
      }

      // -------------------------------------------------------------
      // DRAFT ANALYSIS FACTOR 4: ปกป้องตัวที่ฝั่งเรา (Red) เลือกไปแล้ว (Counter Protection)
      // -------------------------------------------------------------
      const candidateMatchups = RPL_2026_PLAYED_AGAINST_DATA[hero.name] || [];
      for (const redHero of validRedPicks) {
        const h2hMatch = candidateMatchups.find((m) => m.opponentHero === redHero);
        if (h2hMatch && h2hMatch.games >= 2 && h2hMatch.winRate >= 53) {
          const protectBonus = isPhase2 ? 24 : 18;
          score += protectBonus;
          counterDetail = {
            ourHero: redHero,
            winRate: h2hMatch.winRate,
            games: h2hMatch.games,
          };
          categoryType = 'protect_our_pick';
          categoryLabel = `🛡️ ปกป้อง ${redHero} ของเรา (กันแก้ทาง)`;
          reason = `แบนปกป้อง ${redHero}: ${hero.name} สถิติชนะทาง ${redHero} สูงถึง ${h2hMatch.winRate}% ในโปรลีก`;
          detailedAnalysis = `วิเคราะห์ดราฟต์ฝั่งเรา: ฝั่ง Red ของเราเลือก ${redHero} แล้ว สถิติ Head-to-Head ใน RPL 2026 Summer ระบุว่า ${hero.name} ชนะทาง ${redHero} (${h2hMatch.winRate}% จาก ${h2hMatch.games} เกม) แบนเพื่อป้องกันไม่ให้ Blue หยิบมาแก้ทางเรา`;
          break;
        }
      }

      // -------------------------------------------------------------
      // DRAFT ANALYSIS FACTOR 5: Fallback to Blue Side Advantage / Meta Power
      // -------------------------------------------------------------
      if (!reason) {
        if (blueGames >= 7 && blueWR >= 56) {
          categoryType = 'side_advantage';
          categoryLabel = `🔵 Blue Side ตัวเก่ง (WR ${blueWR.toFixed(0)}%)`;
          reason = `ฝั่ง Blue ชนะสูง ${blueWR.toFixed(1)}% (${blueWins}/${blueGames} เกม) ในโปรลีก • ตัดตัวที่ Blue เล่นแล้วได้เปรียบ`;
          detailedAnalysis = `สถิติฝั่งสนาม: เมื่อเล่นฝั่ง Blue ใน RPL 2026 Summer ฮีโร่ตัวนี้มีอัตราการชนะสูงถึง ${blueWR.toFixed(1)}% แบนตัดความได้เปรียบของฝั่ง Blue`;
        } else if (stats.banRate >= 50) {
          categoryType = 'pro_meta_power';
          categoryLabel = `🔥 เมต้าโปรลีก (Ban Rate ${stats.banRate}%)`;
          reason = `ตัวอันตรายระดับ Pro Meta (Ban Rate ${stats.banRate}%, P&B ${stats.presenceRate}%) Blue หยิบแล้วได้เปรียบ`;
          detailedAnalysis = `สถิติโปรลีก: ถูกแบน ${stats.bans} ครั้ง (Ban Rate ${stats.banRate}%) มีส่วนร่วมในดราฟต์ ${stats.presenceRate}% ห้ามปล่อยให้ Blue ได้เล่น`;
        } else {
          categoryType = 'pro_meta_power';
          categoryLabel = `📊 โปรลีกสถิติสูง`;
          reason = `แบน ${stats.bans} เกม • Blue WR ${blueWR.toFixed(1)}% • Presence ${stats.presenceRate}%`;
          detailedAnalysis = `สถิติทางการ RPL 2026 Summer: มีส่วนร่วมในดราฟต์ ${stats.presenceRate}%, ชนะฝั่ง Blue ${blueWins} เกม (WR ${blueWR.toFixed(1)}%)`;
        }
      }

      const clampedScore = Math.min(99, Math.max(30, Math.round(score)));

      return {
        hero,
        stats,
        score: clampedScore,
        rank: 0,
        categoryType,
        categoryLabel,
        reason,
        detailedAnalysis,
        isAvailable: true,
        threatLevel: (clampedScore >= 82 ? 'critical' : clampedScore >= 64 ? 'high' : 'medium') as
          | 'critical'
          | 'high'
          | 'medium',
        targetRole,
        countersFriendlyPick: counterDetail,
        deniesOppCombo: comboDetail,
        sideContext: `Blue WR: ${blueWR.toFixed(1)}% (${blueGames} เกม)`,
        liquipediaUrl: LIQUIPEDIA_RPL_2026_URL,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  scored.sort((a, b) => b.score - a.score || b.stats.banRate - a.stats.banRate);

  return scored.slice(0, limit).map((item, index) => ({
    ...item,
    rank: index + 1,
    threatLevel: index === 0 ? 'critical' : item.threatLevel,
  }));
}

/**
 * Backwards compatibility helper for single-team context
 */
export function getRecommendedBans(
  bannedHeroNames: Set<string>,
  pickedHeroNames: Set<string>,
  currentTeam: 'blue' | 'red' = 'blue',
  friendlyPicks: (string | null | undefined)[] = [],
  enemyPicks: (string | null | undefined)[] = [],
  limit: number = 10
): BanRecommendationItem[] {
  if (currentTeam === 'blue') {
    return getBlueSideRecommendedBans(
      bannedHeroNames,
      pickedHeroNames,
      friendlyPicks,
      enemyPicks,
      limit
    );
  } else {
    return getRedSideRecommendedBans(
      bannedHeroNames,
      pickedHeroNames,
      friendlyPicks,
      enemyPicks,
      limit
    );
  }
}
