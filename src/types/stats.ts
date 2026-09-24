export interface HeroStats {
  heroName: string;
  games: number;
  wins: number;
  losses: number;
  winRate: number; // e.g. 55.9 (%)
  bans: number;
  banRate: number; // e.g. 38.2 (%)
  pickRate: number; // e.g. 30.9 (%)
  presenceRate: number; // e.g. 69.1 (%)
  blueWins?: number;
  blueLosses?: number;
  redWins?: number;
  redLosses?: number;
}

export interface HeroMatchup {
  hero: string;
  opponentHero: string;
  games: number;
  wins: number;
  losses: number;
  winRate: number; // e.g. 66.7 (%)
  diff: number; // win rate difference, e.g. +12.0 or -15.0 (%)
}

export interface HeroSynergy {
  hero: string;
  allyHero: string;
  games: number;
  wins: number;
  losses: number;
  winRate: number; // e.g. 71.4 (%)
  diff: number; // win rate difference compared to baseline, e.g. +15.5 (%)
}

export interface TournamentStatsDataset {
  tournamentName: string;
  season: string;
  sourceUrl: string;
  totalMatches: number;
  totalGames: number;
  lastUpdated: string;
  heroes: Record<string, HeroStats>;
  matchups: Record<string, HeroMatchup[]>; // Played Against
  synergies?: Record<string, HeroSynergy[]>; // Played With
}

export type StatsSourceType = 'json' | 'csv' | 'api' | 'builtin';

export interface DataSourceStatus {
  sourceType: StatsSourceType;
  tournamentName: string;
  heroCount: number;
  matchupCount: number;
  totalGames: number;
  isCustomLoaded: boolean;
}
