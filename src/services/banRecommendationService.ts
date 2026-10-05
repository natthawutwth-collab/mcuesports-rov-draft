// Smart Ban Recommendation Engine
// Grounded strictly in Liquipedia RoV Pro League 2026 Summer official statistics
// Source: https://liquipedia.net/honorofkings/RoV_Pro_League/2026/Summer/Statistics

import { Hero } from '../types/draft';
import { HeroStats } from '../types/stats';
import { HEROES } from '../data/heroes';
import {
  RPL_2026_HEROES_DATA,
  RPL_2026_PLAYED_AGAINST_DATA,
} from '../data/rpl2026SummerStats';

export interface BanRecommendationItem {
  hero: Hero;
  stats: HeroStats;
  score: number; // 0 - 100 Ban Priority Score
  rank: number;
  reason: string;
  isAvailable: boolean;
  threatLevel: 'critical' | 'high' | 'medium';
  countersFriendlyPick?: string;
  sideContext?: string;
}

/**
 * 1. ช่องที่ 1: ฮีโร่ที่แนะนำให้แบน (จากสถิติที่โปรลีกแบนเยอะ)
 * Grounded strictly in RPL 2026 Summer official ban rate & ban count.
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

      // Ban Rate primary weight (65%) + Presence Rate (25%) + Win Rate (10%)
      const banRateWeight = (stats.banRate / 75) * 65;
      const presenceWeight = (stats.presenceRate / 95) * 25;
      const wrWeight = Math.min(10, Math.max(0, (stats.winRate - 40) / 20) * 10);
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
        reason,
        isAvailable: true,
        threatLevel: (score >= 80 ? 'critical' : score >= 60 ? 'high' : 'medium') as 'critical' | 'high' | 'medium',
        sideContext: `Ban Rate ${stats.banRate}% (${stats.bans} เกม)`,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  // Sort descending by ban rate then bans
  scored.sort((a, b) => b.stats.banRate - a.stats.banRate || b.stats.bans - a.stats.bans || b.score - a.score);

  return scored.slice(0, limit).map((item, index) => ({
    ...item,
    rank: index + 1,
    threatLevel: index === 0 ? 'critical' : item.threatLevel,
  }));
}

/**
 * 2. ช่องที่ 2: ฮีโร่ที่ควรแบนฝั่ง (BLUE)
 * Focuses on countering Red side strengths:
 * - High win rate when played by Red Side (redWins / redGames)
 * - Power picks Red can take in double-pick turn (Red Pick 1 + Pick 2)
 * - Direct counters against Blue's locked-in picks
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

  const scored = availableCandidates
    .map((hero) => {
      const stats = RPL_2026_HEROES_DATA[hero.name];
      if (!stats) return null;
      if (stats.presenceRate < 8 && stats.bans < 5) return null;

      const redWins = stats.redWins ?? 0;
      const redLosses = stats.redLosses ?? 0;
      const redGames = redWins + redLosses;
      const redWR = redGames >= 6 ? (redWins / redGames) * 100 : stats.winRate;

      // Scoring tailored for Blue banning against Red
      const banWeight = (stats.banRate / 75) * 40;
      const redWrWeight = (Math.max(30, redWR) / 70) * 30;
      const presenceWeight = (stats.presenceRate / 95) * 20;
      let total = banWeight + redWrWeight + presenceWeight;

      // Counter bonus against locked Blue picks
      let counterNote: string | undefined = undefined;
      const matchups = RPL_2026_PLAYED_AGAINST_DATA[hero.name] || [];
      for (const blueHero of validBluePicks) {
        const match = matchups.find((m) => m.opponentHero === blueHero);
        if (match && match.games >= 3 && match.winRate >= 52) {
          total += 12;
          counterNote = `แก้ทาง ${blueHero} (WR ${match.winRate}%)`;
          break;
        }
      }

      const score = Math.min(99, Math.max(25, Math.round(total)));
      const redWRStr = redWR.toFixed(1);

      let reason = '';
      if (counterNote) {
        reason = `แบนตัดตัว${counterNote} ป้องกัน Red ชนะทางในเลน • Ban Rate ${stats.banRate}%`;
      } else if (redGames >= 8 && redWR >= 60) {
        reason = `ฝั่ง Red ชนะสูงผิดปกติถึง ${redWRStr}% (${stats.redWins}/${redGames} เกม) แบนตัดความได้เปรียบ Red`;
      } else if (stats.banRate >= 60) {
        reason = `ตัวอันตรายระดับ Pro Meta (Ban Rate ${stats.banRate}%) Red หยิบแล้ว WR ${redWRStr}%`;
      } else if (redGames >= 6 && redWR >= 52) {
        reason = `Red เล่นแล้วฟอร์มดี WR ${redWRStr}% แบนตัดแผนคู่แข่งในโปรลีก`;
      } else {
        reason = `สถิติโปรลีก: แบน ${stats.bans} ครั้ง • Red WR ${redWRStr}% • Presence ${stats.presenceRate}%`;
      }

      return {
        hero,
        stats,
        score,
        rank: 0,
        reason,
        isAvailable: true,
        threatLevel: (score >= 80 ? 'critical' : score >= 60 ? 'high' : 'medium') as 'critical' | 'high' | 'medium',
        countersFriendlyPick: counterNote,
        sideContext: `Red WR: ${redWRStr}% (${redGames} เกม)`,
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
 * 3. ช่องที่ 3: ฮีโร่ที่ควรแบนฝั่ง (RED)
 * Focuses on countering Blue side strengths:
 * - Must-ban tier 0/1 OP picks to deny Blue's First Pick advantage (Blue Pick #1)
 * - High win rate when played by Blue Side (blueWins / blueGames)
 * - Direct counters against Red's locked-in picks
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

  const scored = availableCandidates
    .map((hero) => {
      const stats = RPL_2026_HEROES_DATA[hero.name];
      if (!stats) return null;
      if (stats.presenceRate < 8 && stats.bans < 5) return null;

      const blueWins = stats.blueWins ?? 0;
      const blueLosses = stats.blueLosses ?? 0;
      const blueGames = blueWins + blueLosses;
      const blueWR = blueGames >= 6 ? (blueWins / blueGames) * 100 : stats.winRate;

      // Scoring tailored for Red banning against Blue (Heavily penalizes letting Blue first pick OP heroes)
      const banWeight = (stats.banRate / 75) * 45;
      const blueWrWeight = (Math.max(30, blueWR) / 70) * 25;
      const presenceWeight = (stats.presenceRate / 95) * 20;
      let total = banWeight + blueWrWeight + presenceWeight;

      // Extra priority if hero is top tier first pick candidate
      if (stats.presenceRate >= 75) {
        total += 5;
      }

      // Counter bonus against locked Red picks
      let counterNote: string | undefined = undefined;
      const matchups = RPL_2026_PLAYED_AGAINST_DATA[hero.name] || [];
      for (const redHero of validRedPicks) {
        const match = matchups.find((m) => m.opponentHero === redHero);
        if (match && match.games >= 3 && match.winRate >= 52) {
          total += 12;
          counterNote = `แก้ทาง ${redHero} (WR ${match.winRate}%)`;
          break;
        }
      }

      const score = Math.min(99, Math.max(25, Math.round(total)));
      const blueWRStr = blueWR.toFixed(1);

      let reason = '';
      if (counterNote) {
        reason = `แบนตัดตัว${counterNote} ป้องกัน Blue ชนะทาง • Ban Rate ${stats.banRate}%`;
      } else if (stats.banRate >= 60 || stats.presenceRate >= 85) {
        reason = `ต้องแบนตัด First Pick ของ Blue (Ban Rate ${stats.banRate}%, P&B ${stats.presenceRate}%) ห้ามปล่อยให้ Blue หยิบตัวแรก`;
      } else if (blueGames >= 8 && blueWR >= 55) {
        reason = `Blue เล่นแล้วชนะสูง ${blueWRStr}% (${stats.blueWins}/${blueGames} เกม) ตัดตัวถนัดของ Blue Side`;
      } else if (stats.banRate >= 40) {
        reason = `ตัวเมต้าหัวตาราง Ban Rate ${stats.banRate}% แบนบีบให้ Blue เลือกตัวรอง`;
      } else {
        reason = `สถิติโปรลีก: Blue WR ${blueWRStr}% • แบนรวม ${stats.bans} ครั้ง (Presence ${stats.presenceRate}%)`;
      }

      return {
        hero,
        stats,
        score,
        rank: 0,
        reason,
        isAvailable: true,
        threatLevel: (score >= 80 ? 'critical' : score >= 60 ? 'high' : 'medium') as 'critical' | 'high' | 'medium',
        countersFriendlyPick: counterNote,
        sideContext: `Blue WR: ${blueWRStr}% (${blueGames} เกม)`,
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
    return getBlueSideRecommendedBans(bannedHeroNames, pickedHeroNames, friendlyPicks, enemyPicks, limit);
  } else {
    return getRedSideRecommendedBans(bannedHeroNames, pickedHeroNames, friendlyPicks, enemyPicks, limit);
  }
}
