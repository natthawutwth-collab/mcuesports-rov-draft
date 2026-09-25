import {
  HeroStats,
  HeroMatchup,
  HeroSynergy,
  TournamentStatsDataset,
  StatsSourceType,
  DataSourceStatus,
} from '../types/stats';
import { RPL_2026_SUMMER_DATASET } from '../data/rpl2026SummerStats';

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
};

class StatsDataProviderService {
  private dataset: TournamentStatsDataset = RPL_2026_SUMMER_DATASET;
  private sourceType: StatsSourceType = 'builtin';
  private listeners: Set<Listener> = new Set();
  private storageKey = 'mcu_rov_custom_stats_v2';

  constructor() {
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
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.heroes && typeof parsed.heroes === 'object') {
          this.dataset = parsed;
          this.sourceType = 'json';
        }
      }
    } catch (e) {
      console.warn('Failed to load custom stats from localStorage, using default RPL 2026 dataset', e);
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

  public getStatus(): DataSourceStatus {
    return {
      sourceType: this.sourceType,
      tournamentName: this.dataset.tournamentName,
      heroCount: Object.keys(this.dataset.heroes).length,
      matchupCount: Object.values(this.dataset.matchups).reduce((acc, m) => acc + m.length, 0),
      totalGames: this.dataset.totalGames,
      isCustomLoaded: this.sourceType !== 'builtin',
    };
  }

  public getDataset(): TournamentStatsDataset {
    return this.dataset;
  }

  /**
   * Returns stats for a specific hero or null if not in competitive data.
   * If not found, returns null so the UI can explicitly display "No Data".
   */
  public getHeroStats(heroName: string): HeroStats | null {
    if (!heroName || heroName === '—') return null;

    const resolved = this.resolveHeroKey(heroName);

    // Direct match
    if (this.dataset.heroes[resolved]) {
      return this.dataset.heroes[resolved];
    }

    // Case-insensitive match
    const lower = resolved.toLowerCase().trim();
    for (const key of Object.keys(this.dataset.heroes)) {
      if (key.toLowerCase().trim() === lower) {
        return this.dataset.heroes[key];
      }
    }

    return null;
  }

  /**
   * Returns Strong Against and Weak Against matchups for a hero.
   * If no matchup records exist, returns null so UI displays "No Data".
   */
  public getHeroMatchups(heroName: string): {
    strongAgainst: HeroMatchup[];
    weakAgainst: HeroMatchup[];
    all: HeroMatchup[];
  } | null {
    if (!heroName || heroName === '—') return null;

    const resolved = this.resolveHeroKey(heroName);
    let matchups: HeroMatchup[] | undefined = this.dataset.matchups[resolved];

    if (!matchups) {
      const lower = resolved.toLowerCase().trim();
      for (const key of Object.keys(this.dataset.matchups)) {
        if (key.toLowerCase().trim() === lower) {
          matchups = this.dataset.matchups[key];
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
   * Head to head matchup between heroA and heroB
   */
  public getHeadToHead(heroA: string, heroB: string): HeroMatchup | null {
    if (!heroA || !heroB || heroA === '—' || heroB === '—') return null;

    const res = this.getHeroMatchups(heroA);
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
    oppPicks: string[]
  ): Array<{ oppHero: string; matchup: HeroMatchup | null }> {
    const validOppPicks = oppPicks.filter((h) => h && h !== '—');
    if (!heroName || validOppPicks.length === 0) return [];

    return validOppPicks.map((oppHero) => {
      const matchup = this.getHeadToHead(heroName, oppHero);
      return {
        oppHero,
        matchup,
      };
    });
  }

  /**
   * Synergy between heroA and heroB played together on the same team
   */
  public getHeroSynergyPair(heroA: string, heroB: string): HeroSynergy | null {
    if (!heroA || !heroB || heroA === '—' || heroB === '—') return null;

    const resolvedA = this.resolveHeroKey(heroA).toLowerCase().trim();
    const lowerA = heroA.toLowerCase().trim();
    const resolvedB = this.resolveHeroKey(heroB).toLowerCase().trim();
    const lowerB = heroB.toLowerCase().trim();

    // 1. Check heroA's playedWith list for heroB
    const listA = this.getHeroPlayedWith(heroA);
    const foundA = listA.find((s) => {
      const allyLower = s.allyHero.toLowerCase().trim();
      return allyLower === lowerB || allyLower === resolvedB;
    });
    if (foundA) return foundA;

    // 2. Reciprocal check: heroB's playedWith list for heroA
    const listB = this.getHeroPlayedWith(heroB);
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
    allyPicks: string[]
  ): Array<{ allyHero: string; synergy: HeroSynergy | null }> {
    const validAllyPicks = allyPicks.filter((h) => h && h !== '—');
    if (!heroName || validAllyPicks.length === 0) return [];

    return validAllyPicks.map((allyHero) => {
      const synergy = this.getHeroSynergyPair(heroName, allyHero);
      return {
        allyHero,
        synergy,
      };
    });
  }

  /**
   * Played With (เล่นกับ) - Hero Synergies
   */
  public getHeroPlayedWith(heroName: string): HeroSynergy[] {
    if (!heroName || heroName === '—') return [];

    const resolved = this.resolveHeroKey(heroName);
    let list: HeroSynergy[] | undefined = this.dataset.playedWith?.[resolved];

    if (!list && this.dataset.playedWith) {
      const lower = resolved.toLowerCase().trim();
      for (const key of Object.keys(this.dataset.playedWith)) {
        if (key.toLowerCase().trim() === lower) {
          list = this.dataset.playedWith[key];
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
  public getHeroSynergies(heroName: string): {
    bestWith: HeroSynergy[];
    worstWith: HeroSynergy[];
    all: HeroSynergy[];
  } | null {
    if (!heroName || heroName === '—') return null;
    const list = this.getHeroPlayedWith(heroName);
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
  public getHeroPlayedAgainst(heroName: string): HeroMatchup[] {
    const res = this.getHeroMatchups(heroName);
    if (!res) return [];
    return res.all;
  }

  /**
   * 1. LOAD FROM JSON
   */
  public loadFromJson(jsonData: TournamentStatsDataset | string): boolean {
    try {
      const parsed: TournamentStatsDataset =
        typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

      if (!parsed || !parsed.heroes || typeof parsed.heroes !== 'object') {
        throw new Error('Invalid JSON dataset format: missing heroes object');
      }

      this.dataset = {
        tournamentName: parsed.tournamentName || 'Custom Tournament',
        season: parsed.season || 'Custom',
        sourceUrl: parsed.sourceUrl || '',
        totalMatches: parsed.totalMatches || 0,
        totalGames: parsed.totalGames || 100,
        lastUpdated: parsed.lastUpdated || new Date().toISOString().split('T')[0],
        heroes: parsed.heroes,
        matchups: parsed.matchups || {},
        playedWith: parsed.playedWith || {},
      };

      this.sourceType = 'json';
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.dataset));
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
   * 2. LOAD FROM CSV
   * Supports Liquipedia-style CSV for Heroes and Matchups
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
            : 50.0;
        const bans = bansIdx !== -1 ? parseInt(cols[bansIdx], 10) || 0 : 0;
        const banRate =
          brIdx !== -1
            ? parseFloat(cols[brIdx].replace('%', '')) || 0
            : 0;
        const pickRate =
          prIdx !== -1
            ? parseFloat(cols[prIdx].replace('%', '')) || (games > 0 ? (games / 100) * 100 : 0)
            : 0;

        heroes[name] = {
          heroName: name,
          games,
          wins,
          losses,
          winRate: parseFloat(winRate.toFixed(1)),
          bans,
          banRate: parseFloat(banRate.toFixed(1)),
          pickRate: parseFloat(pickRate.toFixed(1)),
          presenceRate: parseFloat((pickRate + banRate).toFixed(1)),
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
                  ? parseFloat(cols[mWrIdx].replace('%', '')) || (games > 0 ? (wins / games) * 100 : 50)
                  : games > 0
                  ? (wins / games) * 100
                  : 50;

              let diff = 0;
              if (mDiffIdx !== -1 && cols[mDiffIdx]) {
                diff = parseFloat(cols[mDiffIdx].replace('%', '')) || 0;
              } else {
                // calculate diff vs overall WR or 50%
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
              });
            }
          }
        }
      }

      this.dataset = {
        tournamentName: 'Imported CSV Tournament',
        season: 'Custom CSV',
        sourceUrl: '',
        totalMatches: 0,
        totalGames: 100,
        lastUpdated: new Date().toISOString().split('T')[0],
        heroes,
        matchups: Object.keys(matchups).length > 0 ? matchups : this.dataset.matchups,
      };

      this.sourceType = 'csv';
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.dataset));
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

  /**
   * 3. LOAD FROM FUTURE API
   * Ready for REST / GraphQL esports statistics backend
   */
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
   * Reset to default official RoV Pro League 2026 Summer dataset
   */
  public resetToDefault(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (e) {
      console.warn('Failed to clear storageKey', e);
    }
    this.dataset = RPL_2026_SUMMER_DATASET;
    this.sourceType = 'builtin';
    this.notify();
  }

  /**
   * Export current dataset to JSON string
   */
  public exportToJson(): string {
    return JSON.stringify(this.dataset, null, 2);
  }

  /**
   * Export current dataset to CSV
   */
  public exportToCsv(): { heroesCsv: string; matchupsCsv: string } {
    // Heroes CSV
    const hHeaders = ['Hero', 'Games', 'Wins', 'Losses', 'Win Rate %', 'Bans', 'Ban Rate %', 'Pick Rate %', 'Presence Rate %'];
    const hRows = Object.values(this.dataset.heroes).map((h) => [
      `"${h.heroName}"`,
      h.games,
      h.wins,
      h.losses,
      `${h.winRate.toFixed(1)}%`,
      h.bans,
      `${h.banRate.toFixed(1)}%`,
      `${h.pickRate.toFixed(1)}%`,
      `${h.presenceRate.toFixed(1)}%`,
    ]);
    const heroesCsv = [hHeaders.join(','), ...hRows.map((r) => r.join(','))].join('\n');

    // Matchups CSV
    const mHeaders = ['Hero', 'Opponent Hero', 'Games', 'Wins', 'Losses', 'Win Rate %', 'Win Rate Diff %'];
    const mRows: string[] = [];
    Object.values(this.dataset.matchups).forEach((list) => {
      list.forEach((m) => {
        mRows.push([
          `"${m.hero}"`,
          `"${m.opponentHero}"`,
          m.games,
          m.wins,
          m.losses,
          `${m.winRate.toFixed(1)}%`,
          `${m.diff > 0 ? '+' : ''}${m.diff.toFixed(1)}%`,
        ].join(','));
      });
    });
    const matchupsCsv = [mHeaders.join(','), ...mRows].join('\n');

    return { heroesCsv, matchupsCsv };
  }
}

// Singleton instance
export const statsDataProvider = new StatsDataProviderService();
