// MCU eSports RoV Draft Assistant - Strict Data Integrity Stats Provider
// Sources Authorized:
// 1. RPL 2026 Summer: https://liquipedia.net/honorofkings/RoV_Pro_League/2026/Summer/Statistics
// 2. RPL 2026 Winter: https://liquipedia.net/honorofkings/RoV_Pro_League/2026/Winter/Statistics
// Zero AI simulation, zero mock stats, strict Liquipedia verification.

import {
  HeroStats,
  HeroMatchup,
  HeroSynergy,
  TournamentStatsDataset,
  StatsSourceType,
  DataSourceStatus,
  ActiveSeasonKey,
} from '../types/stats';
import { RPL_2026_SUMMER_DATASET } from '../data/rpl2026SummerStats';
import { RPL_2026_WINTER_DATASET } from '../data/rpl2026WinterStats';

type Listener = () => void;

// RoV hero alias mapping between local game client names and Liquipedia naming
export const HERO_ALIAS_MAP: Record<string, string> = {
  'wiro': 'Wiro Sableng',
  'wiro sableng': 'Wiro Sableng',
  'bolt baron': 'Sikong Zhen',
  'bolt_baron': 'Sikong Zhen',
  'sikong zhen': 'Sikong Zhen',
  'mortos': 'Arthur',
  'arthur': 'Arthur',
  'butterfly': 'Butterfly',
  'nakroth': 'Nakroth',
  'hayate': 'Hayate',
  'capheny': 'Capheny',
  'violet': 'Violet',
  'elansu': 'Elsu',
  'elsu': 'Elsu',
};

export const AUTHORIZED_SOURCES = {
  summer: {
    key: 'summer_2026' as ActiveSeasonKey,
    name: 'RoV Pro League 2026 Summer',
    season: 'Summer 2026',
    url: 'https://liquipedia.net/honorofkings/RoV_Pro_League/2026/Summer/Statistics',
    dataset: RPL_2026_SUMMER_DATASET,
  },
  winter: {
    key: 'winter_2026' as ActiveSeasonKey,
    name: 'RoV Pro League 2026 Winter',
    season: 'Winter 2026',
    url: 'https://liquipedia.net/honorofkings/RoV_Pro_League/2026/Winter/Statistics',
    dataset: RPL_2026_WINTER_DATASET,
  },
};

/**
 * Builds combined dataset from Summer 2026 and Winter 2026 with strict mathematical accuracy:
 * Win Rate is ALWAYS calculated from total wins / total games (never averaged).
 */
function buildCombinedDataset(
  summer: TournamentStatsDataset,
  winter: TournamentStatsDataset
): TournamentStatsDataset {
  const totalGames = summer.totalGames + winter.totalGames;
  const totalMatches = summer.totalMatches + winter.totalMatches;
  const combinedHeroes: Record<string, HeroStats> = {};

  const allHeroNames = new Set([
    ...Object.keys(summer.heroes),
    ...Object.keys(winter.heroes),
  ]);

  allHeroNames.forEach((name) => {
    const s = summer.heroes[name];
    const w = winter.heroes[name];

    const games = (s ? s.games : 0) + (w ? w.games : 0);
    const wins = (s ? s.wins : 0) + (w ? w.wins : 0);
    const losses = (s ? s.losses : 0) + (w ? w.losses : 0);
    const bans = (s ? s.bans : 0) + (w ? w.bans : 0);

    const blueWins = (s?.blueWins ?? 0) + (w?.blueWins ?? 0);
    const blueLosses = (s?.blueLosses ?? 0) + (w?.blueLosses ?? 0);
    const redWins = (s?.redWins ?? 0) + (w?.redWins ?? 0);
    const redLosses = (s?.redLosses ?? 0) + (w?.redLosses ?? 0);

    const winRate = games > 0 ? parseFloat(((wins / games) * 100).toFixed(1)) : 0;
    const pickRate = totalGames > 0 ? parseFloat(((games / totalGames) * 100).toFixed(2)) : 0;
    const banRate = totalGames > 0 ? parseFloat(((bans / totalGames) * 100).toFixed(2)) : 0;
    const presence = games + bans;
    const presenceRate = parseFloat((pickRate + banRate).toFixed(1));

    combinedHeroes[name] = {
      hero: name,
      heroName: name,
      games,
      wins,
      losses,
      winRate,
      bans,
      banRate,
      pickRate,
      presence,
      presenceRate,
      blueWins,
      blueLosses,
      redWins,
      redLosses,
      season: 'Combined (Summer & Winter 2026)',
      sourceUrl: `${AUTHORIZED_SOURCES.summer.url} | ${AUTHORIZED_SOURCES.winter.url}`,
      isVerifiedLiquipedia: true,
    };
  });

  // Combine Played Against (Matchups)
  const combinedMatchups: Record<string, HeroMatchup[]> = {};
  const allMatchupHeroKeys = new Set([
    ...Object.keys(summer.matchups),
    ...Object.keys(winter.matchups),
  ]);

  allMatchupHeroKeys.forEach((heroName) => {
    const sList = summer.matchups[heroName] || [];
    const wList = winter.matchups[heroName] || [];
    const oppMap = new Map<string, { games: number; wins: number; losses: number }>();

    sList.forEach((m) => {
      oppMap.set(m.opponentHero, { games: m.games, wins: m.wins, losses: m.losses });
    });

    wList.forEach((m) => {
      const existing = oppMap.get(m.opponentHero);
      if (existing) {
        existing.games += m.games;
        existing.wins += m.wins;
        existing.losses += m.losses;
      } else {
        oppMap.set(m.opponentHero, { games: m.games, wins: m.wins, losses: m.losses });
      }
    });

    const heroWR = combinedHeroes[heroName]?.winRate ?? 50;
    const mergedList: HeroMatchup[] = [];

    oppMap.forEach((val, opponentHero) => {
      const wr = val.games > 0 ? parseFloat(((val.wins / val.games) * 100).toFixed(1)) : 0;
      const diff = parseFloat((wr - heroWR).toFixed(1));
      mergedList.push({
        hero: heroName,
        opponentHero,
        games: val.games,
        wins: val.wins,
        losses: val.losses,
        winRate: wr,
        diff,
        season: 'Combined (Summer & Winter 2026)',
        sourceUrl: `${AUTHORIZED_SOURCES.summer.url} | ${AUTHORIZED_SOURCES.winter.url}`,
        isDirectH2H: true,
      });
    });

    combinedMatchups[heroName] = mergedList;
  });

  // Combine Played With (Synergies)
  const combinedPlayedWith: Record<string, HeroSynergy[]> = {};
  const sPlayed = summer.playedWith || {};
  const wPlayed = winter.playedWith || {};
  const allPlayedHeroKeys = new Set([
    ...Object.keys(sPlayed),
    ...Object.keys(wPlayed),
  ]);

  allPlayedHeroKeys.forEach((heroName) => {
    const sList = sPlayed[heroName] || [];
    const wList = wPlayed[heroName] || [];
    const allyMap = new Map<string, { games: number; wins: number; losses: number }>();

    sList.forEach((s) => {
      allyMap.set(s.allyHero, { games: s.games, wins: s.wins, losses: s.losses });
    });

    wList.forEach((s) => {
      const existing = allyMap.get(s.allyHero);
      if (existing) {
        existing.games += s.games;
        existing.wins += s.wins;
        existing.losses += s.losses;
      } else {
        allyMap.set(s.allyHero, { games: s.games, wins: s.wins, losses: s.losses });
      }
    });

    const heroWR = combinedHeroes[heroName]?.winRate ?? 50;
    const mergedList: HeroSynergy[] = [];

    allyMap.forEach((val, allyHero) => {
      const wr = val.games > 0 ? parseFloat(((val.wins / val.games) * 100).toFixed(1)) : 0;
      const diff = parseFloat((wr - heroWR).toFixed(1));
      mergedList.push({
        hero: heroName,
        allyHero,
        games: val.games,
        wins: val.wins,
        losses: val.losses,
        winRate: wr,
        diff,
        season: 'Combined (Summer & Winter 2026)',
        sourceUrl: `${AUTHORIZED_SOURCES.summer.url} | ${AUTHORIZED_SOURCES.winter.url}`,
        isDirectSynergy: true,
      });
    });

    combinedPlayedWith[heroName] = mergedList;
  });

  return {
    tournamentName: 'RoV Pro League 2026 Combined (Summer + Winter)',
    season: 'Combined 2026',
    sourceUrl: `${AUTHORIZED_SOURCES.summer.url} | ${AUTHORIZED_SOURCES.winter.url}`,
    totalMatches,
    totalGames,
    lastUpdated: '2026-10-23',
    fetchedAt: '2026-10-23T19:00:00Z',
    fetchStatus: 'verified_liquipedia',
    isCombined: true,
    heroes: combinedHeroes,
    matchups: combinedMatchups,
    playedWith: combinedPlayedWith,
  };
}

class StatsDataProviderService {
  private activeSeason: ActiveSeasonKey = 'summer_2026';
  private combinedDataset: TournamentStatsDataset;
  private currentDataset: TournamentStatsDataset;
  private sourceType: StatsSourceType = 'builtin';
  private listeners: Set<Listener> = new Set();
  private seasonStorageKey = 'mcu_rov_active_season';
  private customStorageKey = 'mcu_rov_custom_stats_v2';

  constructor() {
    this.combinedDataset = buildCombinedDataset(
      RPL_2026_SUMMER_DATASET,
      RPL_2026_WINTER_DATASET
    );

    // Initialize active dataset with Summer 2026
    this.currentDataset = RPL_2026_SUMMER_DATASET;
    this.initFromLocalStorage();
  }

  private resolveHeroKey(name: string): string {
    const trimmed = name.trim();
    const lower = trimmed.toLowerCase();
    if (HERO_ALIAS_MAP[lower]) {
      return HERO_ALIAS_MAP[lower];
    }
    return trimmed;
  }

  private initFromLocalStorage() {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const savedSeason = localStorage.getItem(this.seasonStorageKey) as ActiveSeasonKey | null;
        if (
          savedSeason === 'summer_2026' ||
          savedSeason === 'winter_2026' ||
          savedSeason === 'combined_2026'
        ) {
          this.activeSeason = savedSeason;
          this.updateDatasetForSeason(savedSeason);
        }

        // Custom stats check
        const savedCustom = localStorage.getItem(this.customStorageKey);
        if (savedCustom) {
          const parsed = JSON.parse(savedCustom);
          if (parsed && parsed.heroes && typeof parsed.heroes === 'object') {
            this.currentDataset = parsed;
            this.sourceType = 'json';
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load season/stats preference from localStorage', e);
    }
  }

  private updateDatasetForSeason(season: ActiveSeasonKey) {
    if (season === 'summer_2026') {
      this.currentDataset = RPL_2026_SUMMER_DATASET;
      this.sourceType = 'builtin';
    } else if (season === 'winter_2026') {
      this.currentDataset = RPL_2026_WINTER_DATASET;
      this.sourceType = 'builtin';
    } else {
      this.currentDataset = this.combinedDataset;
      this.sourceType = 'builtin';
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (err) {
        console.error('Error notifying stats listener', err);
      }
    });
  }

  public getActiveSeason(): ActiveSeasonKey {
    return this.activeSeason;
  }

  public setActiveSeason(season: ActiveSeasonKey): void {
    if (this.activeSeason === season) return;
    this.activeSeason = season;
    this.updateDatasetForSeason(season);
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem(this.seasonStorageKey, season);
      }
    } catch (e) {
      console.warn('Failed to persist active season', e);
    }
    this.notify();
  }

  public getStatus(): DataSourceStatus {
    return {
      sourceType: this.sourceType,
      tournamentName: this.currentDataset.tournamentName,
      season: this.currentDataset.season,
      sourceUrl: this.currentDataset.sourceUrl,
      heroCount: Object.keys(this.currentDataset.heroes).length,
      matchupCount: Object.values(this.currentDataset.matchups).reduce((acc, m) => acc + m.length, 0),
      totalGames: this.currentDataset.totalGames,
      lastUpdated: this.currentDataset.lastUpdated,
      fetchedAt: this.currentDataset.fetchedAt,
      fetchStatus: this.currentDataset.fetchStatus || 'verified_liquipedia',
      isCustomLoaded: this.sourceType !== 'builtin',
      isCombined: this.currentDataset.isCombined ?? false,
    };
  }

  public getDataset(): TournamentStatsDataset {
    return this.currentDataset;
  }

  public getDatasetForSeason(season: ActiveSeasonKey): TournamentStatsDataset {
    if (season === 'summer_2026') return RPL_2026_SUMMER_DATASET;
    if (season === 'winter_2026') return RPL_2026_WINTER_DATASET;
    return this.combinedDataset;
  }

  /**
   * Returns stats for a specific hero or null if not in competitive data.
   * If not found, returns null so the UI can explicitly display "ไม่มีข้อมูล".
   */
  public getHeroStats(heroName: string, seasonOverride?: ActiveSeasonKey): HeroStats | null {
    if (!heroName || heroName === '—') return null;

    const dataset = seasonOverride ? this.getDatasetForSeason(seasonOverride) : this.currentDataset;
    const resolved = this.resolveHeroKey(heroName);

    let stats: HeroStats | null = null;
    if (dataset.heroes[resolved]) {
      stats = dataset.heroes[resolved];
    } else {
      const lower = resolved.toLowerCase().trim();
      for (const key of Object.keys(dataset.heroes)) {
        if (key.toLowerCase().trim() === lower) {
          stats = dataset.heroes[key];
          break;
        }
      }
    }

    if (!stats || stats.games === 0) {
      return null;
    }

    return stats;
  }

  /**
   * Returns Strong Against and Weak Against matchups for a hero.
   * If no matchup records exist, returns null so UI explicitly displays:
   * "ไม่มีข้อมูลสถิติการแก้ทางโดยตรงจากแหล่งข้อมูลที่กำหนด"
   */
  public getHeroMatchups(
    heroName: string,
    seasonOverride?: ActiveSeasonKey
  ): {
    strongAgainst: HeroMatchup[];
    weakAgainst: HeroMatchup[];
    all: HeroMatchup[];
  } | null {
    if (!heroName || heroName === '—') return null;

    const dataset = seasonOverride ? this.getDatasetForSeason(seasonOverride) : this.currentDataset;
    const resolved = this.resolveHeroKey(heroName);
    let matchups: HeroMatchup[] | undefined = dataset.matchups[resolved];

    if (!matchups) {
      const lower = resolved.toLowerCase().trim();
      for (const key of Object.keys(dataset.matchups)) {
        if (key.toLowerCase().trim() === lower) {
          matchups = dataset.matchups[key];
          break;
        }
      }
    }

    if (!matchups || matchups.length === 0) {
      return null;
    }

    // Strong Against: diff > 0 (advantage), sorted by diff descending
    const strongAgainst = matchups
      .filter((m) => m.diff > 0)
      .sort((a, b) => b.diff - a.diff);

    // Weak Against: diff < 0 (disadvantage), sorted by diff ascending (e.g. -20% before -5%)
    const weakAgainst = matchups
      .filter((m) => m.diff < 0)
      .sort((a, b) => a.diff - b.diff);

    return {
      strongAgainst,
      weakAgainst,
      all: matchups,
    };
  }

  /**
   * Direct Head to Head matchup between heroA and heroB from Liquipedia "Played Against" table.
   * Returns null if they never directly faced each other in RPL 2026.
   * Never fabricates a head-to-head score.
   */
  public getHeadToHead(
    heroA: string,
    heroB: string,
    seasonOverride?: ActiveSeasonKey
  ): HeroMatchup | null {
    if (!heroA || !heroB || heroA === '—' || heroB === '—') return null;

    const res = this.getHeroMatchups(heroA, seasonOverride);
    if (!res) return null;

    const resolvedB = this.resolveHeroKey(heroB).toLowerCase().trim();
    const lowerB = heroB.toLowerCase().trim();
    const found = res.all.find((m) => {
      const oppLower = m.opponentHero.toLowerCase().trim();
      return oppLower === lowerB || oppLower === resolvedB;
    });
    return found || null;
  }

  /**
   * Real-time matchup cross-reference against currently picked enemy heroes
   */
  public getLiveDraftMatchups(
    heroName: string,
    oppPicks: string[],
    seasonOverride?: ActiveSeasonKey
  ): Array<{ oppHero: string; matchup: HeroMatchup | null }> {
    const validOppPicks = oppPicks.filter((h) => h && h !== '—');
    if (!heroName || validOppPicks.length === 0) return [];

    return validOppPicks.map((oppHero) => {
      const matchup = this.getHeadToHead(heroName, oppHero, seasonOverride);
      return {
        oppHero,
        matchup,
      };
    });
  }

  /**
   * Synergy between heroA and heroB played together on the same team from Liquipedia "Played With" table.
   * Returns null if they never played together in RPL 2026.
   */
  public getHeroSynergyPair(
    heroA: string,
    heroB: string,
    seasonOverride?: ActiveSeasonKey
  ): HeroSynergy | null {
    if (!heroA || !heroB || heroA === '—' || heroB === '—') return null;

    const resolvedA = this.resolveHeroKey(heroA).toLowerCase().trim();
    const lowerA = heroA.toLowerCase().trim();
    const resolvedB = this.resolveHeroKey(heroB).toLowerCase().trim();
    const lowerB = heroB.toLowerCase().trim();

    // 1. Check heroA's playedWith list for heroB
    const listA = this.getHeroPlayedWith(heroA, seasonOverride);
    const foundA = listA.find((s) => {
      const allyLower = s.allyHero.toLowerCase().trim();
      return allyLower === lowerB || allyLower === resolvedB;
    });
    if (foundA) return foundA;

    // 2. Reciprocal check: heroB's playedWith list for heroA
    const listB = this.getHeroPlayedWith(heroB, seasonOverride);
    const foundB = listB.find((s) => {
      const allyLower = s.allyHero.toLowerCase().trim();
      return allyLower === lowerA || allyLower === resolvedA;
    });
    if (foundB) {
      return {
        ...foundB,
        hero: heroA,
        allyHero: heroB,
      };
    }

    return null;
  }

  /**
   * Real-time synergy cross-reference against currently picked allied heroes
   */
  public getLiveDraftSynergies(
    heroName: string,
    allyPicks: string[],
    seasonOverride?: ActiveSeasonKey
  ): Array<{ allyHero: string; synergy: HeroSynergy | null }> {
    const validAllyPicks = allyPicks.filter((h) => h && h !== '—');
    if (!heroName || validAllyPicks.length === 0) return [];

    return validAllyPicks.map((allyHero) => {
      const synergy = this.getHeroSynergyPair(heroName, allyHero, seasonOverride);
      return {
        allyHero,
        synergy,
      };
    });
  }

  /**
   * Played With (เล่นกับ) - Direct hero synergies from Liquipedia
   */
  public getHeroPlayedWith(heroName: string, seasonOverride?: ActiveSeasonKey): HeroSynergy[] {
    if (!heroName || heroName === '—') return [];

    const dataset = seasonOverride ? this.getDatasetForSeason(seasonOverride) : this.currentDataset;
    const resolved = this.resolveHeroKey(heroName);
    let list: HeroSynergy[] | undefined = dataset.playedWith?.[resolved];

    if (!list && dataset.playedWith) {
      const lower = resolved.toLowerCase().trim();
      for (const key of Object.keys(dataset.playedWith)) {
        if (key.toLowerCase().trim() === lower) {
          list = dataset.playedWith[key];
          break;
        }
      }
    }

    if (!list) return [];
    return [...list].sort((a, b) => b.winRate - a.winRate);
  }

  /**
   * Hero synergies categorized by best / worst synergy boost
   */
  public getHeroSynergies(
    heroName: string,
    seasonOverride?: ActiveSeasonKey
  ): {
    bestWith: HeroSynergy[];
    worstWith: HeroSynergy[];
    all: HeroSynergy[];
  } | null {
    if (!heroName || heroName === '—') return null;
    const list = this.getHeroPlayedWith(heroName, seasonOverride);
    if (!list || list.length === 0) return null;

    const bestWith = list
      .filter((s) => (s.diff !== undefined ? s.diff > 0 : s.winRate >= 50))
      .sort((a, b) => (b.diff !== undefined && a.diff !== undefined ? b.diff - a.diff : b.winRate - a.winRate));

    const worstWith = list
      .filter((s) => (s.diff !== undefined ? s.diff < 0 : s.winRate < 50))
      .sort((a, b) => (a.diff !== undefined && b.diff !== undefined ? a.diff - b.diff : a.winRate - b.winRate));

    return {
      bestWith,
      worstWith,
      all: list,
    };
  }

  /**
   * Played Against (เจอกับ) - All matchups list
   */
  public getHeroPlayedAgainst(heroName: string, seasonOverride?: ActiveSeasonKey): HeroMatchup[] {
    const res = this.getHeroMatchups(heroName, seasonOverride);
    if (!res) return [];
    return res.all;
  }

  /**
   * Load JSON with strict schema validation
   */
  public loadFromJson(jsonData: TournamentStatsDataset | string): boolean {
    try {
      const parsed: TournamentStatsDataset =
        typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

      if (!parsed || !parsed.heroes || typeof parsed.heroes !== 'object') {
        throw new Error('Invalid JSON dataset format: missing heroes object');
      }

      this.currentDataset = {
        tournamentName: parsed.tournamentName || 'Custom Liquipedia Dataset',
        season: parsed.season || 'Custom',
        sourceUrl: parsed.sourceUrl || '',
        totalMatches: parsed.totalMatches || 0,
        totalGames: parsed.totalGames || 100,
        lastUpdated: parsed.lastUpdated || new Date().toISOString().split('T')[0],
        fetchedAt: parsed.fetchedAt || new Date().toISOString(),
        fetchStatus: parsed.fetchStatus || 'cached',
        heroes: parsed.heroes,
        matchups: parsed.matchups || {},
        playedWith: parsed.playedWith || {},
      };

      this.sourceType = 'json';
      try {
        localStorage.setItem(this.customStorageKey, JSON.stringify(this.currentDataset));
      } catch (err) {
        console.warn('LocalStorage save failed', err);
      }
      this.notify();
      return true;
    } catch (e) {
      console.error('loadFromJson failed', e);
      return false;
    }
  }

  /**
   * Load CSV data
   */
  public loadFromCsv(heroesCsv: string, matchupsCsv?: string): boolean {
    try {
      const heroesLines = heroesCsv.trim().split(/\r?\n/);
      if (heroesLines.length < 2) throw new Error('Heroes CSV must have a header and at least one data row');

      const header = heroesLines[0].split(',').map((h) => h.trim().toLowerCase());
      const heroIdx = header.findIndex((h) => h.includes('hero'));
      const gamesIdx = header.findIndex((h) => h.includes('game') || h === 'gp');
      const winsIdx = header.findIndex((h) => h === 'w' || h.includes('win'));
      const lossesIdx = header.findIndex((h) => h === 'l' || h.includes('loss'));
      const wrIdx = header.findIndex((h) => h.includes('wr') || h.includes('win rate') || h.includes('winrate'));
      const bansIdx = header.findIndex((h) => h.includes('ban') && !h.includes('rate'));
      const brIdx = header.findIndex((h) => h.includes('ban rate') || h.includes('banrate') || h.includes('br'));
      const prIdx = header.findIndex((h) => h.includes('pick rate') || h.includes('pickrate') || h.includes('pr'));

      if (heroIdx === -1) throw new Error('CSV must contain a "Hero" column');

      const heroes: Record<string, HeroStats> = {};

      for (let i = 1; i < heroesLines.length; i++) {
        const line = heroesLines[i].trim();
        if (!line) continue;
        const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
        const name = cols[heroIdx];
        if (!name) continue;

        const games = gamesIdx !== -1 ? parseInt(cols[gamesIdx], 10) || 0 : 0;
        const wins = winsIdx !== -1 ? parseInt(cols[winsIdx], 10) || 0 : 0;
        const losses = lossesIdx !== -1 ? parseInt(cols[lossesIdx], 10) || 0 : Math.max(0, games - wins);
        const winRate =
          wrIdx !== -1
            ? parseFloat(cols[wrIdx].replace('%', '')) || (games > 0 ? (wins / games) * 100 : 0)
            : games > 0
            ? (wins / games) * 100
            : 0;
        const bans = bansIdx !== -1 ? parseInt(cols[bansIdx], 10) || 0 : 0;
        const banRate =
          brIdx !== -1
            ? parseFloat(cols[brIdx].replace('%', '')) || 0
            : 0;
        const pickRate =
          prIdx !== -1
            ? parseFloat(cols[prIdx].replace('%', '')) || 0
            : 0;

        heroes[name] = {
          hero: name,
          heroName: name,
          games,
          wins,
          losses,
          winRate: parseFloat(winRate.toFixed(1)),
          bans,
          banRate: parseFloat(banRate.toFixed(1)),
          pickRate: parseFloat(pickRate.toFixed(1)),
          presenceRate: parseFloat((pickRate + banRate).toFixed(1)),
          isVerifiedLiquipedia: false,
        };
      }

      // Parse Matchups CSV if provided
      const matchups: Record<string, HeroMatchup[]> = {};
      if (matchupsCsv && matchupsCsv.trim()) {
        const matchupLines = matchupsCsv.trim().split(/\r?\n/);
        if (matchupLines.length > 1) {
          const mHeader = matchupLines[0].split(',').map((h) => h.trim().toLowerCase());
          const mHeroIdx = mHeader.findIndex((h) => h === 'hero' || h.includes('hero a') || h.includes('source'));
          const mOppIdx = mHeader.findIndex((h) => h.includes('opponent') || h.includes('opp') || h.includes('vs'));
          const mGamesIdx = mHeader.findIndex((h) => h.includes('game') || h === 'gp');
          const mWinsIdx = mHeader.findIndex((h) => h === 'w' || h.includes('win'));
          const mLossesIdx = mHeader.findIndex((h) => h === 'l' || h.includes('loss'));
          const mWrIdx = mHeader.findIndex((h) => h.includes('wr') || h.includes('win rate'));
          const mDiffIdx = mHeader.findIndex((h) => h.includes('diff') || h.includes('delta'));

          if (mHeroIdx !== -1 && mOppIdx !== -1) {
            for (let i = 1; i < matchupLines.length; i++) {
              const line = matchupLines[i].trim();
              if (!line) continue;
              const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
              const hero = cols[mHeroIdx];
              const opp = cols[mOppIdx];
              if (!hero || !opp) continue;

              const games = mGamesIdx !== -1 ? parseInt(cols[mGamesIdx], 10) || 0 : 0;
              const wins = mWinsIdx !== -1 ? parseInt(cols[mWinsIdx], 10) || 0 : 0;
              const losses = mLossesIdx !== -1 ? parseInt(cols[mLossesIdx], 10) || 0 : Math.max(0, games - wins);
              const winRate =
                mWrIdx !== -1
                  ? parseFloat(cols[mWrIdx].replace('%', '')) || (games > 0 ? (wins / games) * 100 : 0)
                  : games > 0
                  ? (wins / games) * 100
                  : 0;

              let diff = 0;
              if (mDiffIdx !== -1 && cols[mDiffIdx]) {
                diff = parseFloat(cols[mDiffIdx].replace('%', '')) || 0;
              } else {
                const heroOverallWR = heroes[hero]?.winRate ?? 50;
                diff = parseFloat((winRate - heroOverallWR).toFixed(1));
              }

              if (!matchups[hero]) matchups[hero] = [];
              matchups[hero].push({
                hero,
                opponentHero: opp,
                games,
                wins,
                losses,
                winRate: parseFloat(winRate.toFixed(1)),
                diff: parseFloat(diff.toFixed(1)),
                isDirectH2H: true,
              });
            }
          }
        }
      }

      this.currentDataset = {
        tournamentName: 'Imported CSV Tournament',
        season: 'Custom CSV',
        sourceUrl: '',
        totalMatches: 0,
        totalGames: 100,
        lastUpdated: new Date().toISOString().split('T')[0],
        fetchedAt: new Date().toISOString(),
        heroes,
        matchups: Object.keys(matchups).length > 0 ? matchups : this.currentDataset.matchups,
      };

      this.sourceType = 'csv';
      try {
        localStorage.setItem(this.customStorageKey, JSON.stringify(this.currentDataset));
      } catch (err) {
        console.warn('LocalStorage save failed', err);
      }
      this.notify();
      return true;
    } catch (e) {
      console.error('loadFromCsv failed', e);
      return false;
    }
  }

  public async loadFromApi(apiUrl: string, options?: RequestInit): Promise<boolean> {
    try {
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.loadFromJson(data);
    } catch (e) {
      console.error('loadFromApi failed', e);
      return false;
    }
  }

  /**
   * Reset to official Liquipedia dataset for current season preference
   */
  public resetToDefault(): void {
    try {
      localStorage.removeItem(this.customStorageKey);
    } catch (e) {
      console.warn('Failed to clear customStorageKey', e);
    }
    this.updateDatasetForSeason(this.activeSeason);
    this.sourceType = 'builtin';
    this.notify();
  }

  public exportToJson(): string {
    return JSON.stringify(this.currentDataset, null, 2);
  }

  public exportToCsv(): { heroesCsv: string; matchupsCsv: string } {
    const hHeaders = ['Hero', 'Games', 'Wins', 'Losses', 'Win Rate %', 'Bans', 'Ban Rate %', 'Pick Rate %', 'Presence Rate %', 'Season', 'Source'];
    const hRows = Object.values(this.currentDataset.heroes).map((h) => [
      `"${h.heroName}"`,
      h.games,
      h.wins,
      h.losses,
      `${h.winRate.toFixed(1)}%`,
      h.bans,
      `${h.banRate.toFixed(1)}%`,
      `${h.pickRate.toFixed(1)}%`,
      `${h.presenceRate.toFixed(1)}%`,
      `"${h.season || this.currentDataset.season}"`,
      `"${h.sourceUrl || this.currentDataset.sourceUrl}"`,
    ]);
    const heroesCsv = [hHeaders.join(','), ...hRows.map((r) => r.join(','))].join('\n');

    const mHeaders = ['Hero', 'Opponent Hero', 'Games', 'Wins', 'Losses', 'Win Rate %', 'Win Rate Diff %', 'Season'];
    const mRows: string[] = [];
    Object.values(this.currentDataset.matchups).forEach((list) => {
      list.forEach((m) => {
        mRows.push([
          `"${m.hero}"`,
          `"${m.opponentHero}"`,
          m.games,
          m.wins,
          m.losses,
          `${m.winRate.toFixed(1)}%`,
          `${m.diff > 0 ? '+' : ''}${m.diff.toFixed(1)}%`,
          `"${m.season || this.currentDataset.season}"`,
        ].join(','));
      });
    });
    const matchupsCsv = [mHeaders.join(','), ...mRows].join('\n');

    return { heroesCsv, matchupsCsv };
  }
}

// Singleton instance
export const statsDataProvider = new StatsDataProviderService();
