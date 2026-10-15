export interface HeroScoutingPick {
  heroName: string;
  games: number;
  wins: number;
  losses: number;
  winRate: number;
  primaryRole: string;
  firstPickCount: number;
}

export interface HeroScoutingBan {
  heroName: string;
  bans: number;
  banRate: number;
  phase1Bans: number;
  phase2Bans: number;
}

export interface ScoutingCombo {
  heroes: string[];
  games: number;
  wins: number;
  losses: number;
  winRate: number;
  sampleSize: number;
}

export interface SidePattern {
  games: number;
  wins: number;
  losses: number;
  winRate: number;
  priorityHeroes: string[];
}

export interface ScoutedMatch {
  id: string;
  tournament: string;
  match: string;
  gameNumber: number;
  date: string;
  patch: string;
  opponentTeam: string;
  opposingTeam: string;
  opponentSide: 'blue' | 'red';
  winner: 'blue' | 'red' | 'draw' | 'undecided';
  opponentWon: boolean;
  opponentPicks: Array<{ heroName: string; position?: string }>;
  opponentBans: string[];
  opposingPicks: Array<{ heroName: string; position?: string }>;
  opposingBans: string[];
  sourceUrl?: string;
  notes?: string;
}

export interface OpponentScoutingData {
  opponentTeam: string;
  patch: string;
  sampleSize: number;
  totalGames: number;
  hasData: boolean;
  dataSource: string;
  mostPicked: HeroScoutingPick[];
  mostBanned: HeroScoutingBan[];
  firstPickTendencies: Array<{
    heroName: string;
    count: number;
    winRate: number;
    percentage: number;
    role?: string;
  }>;
  frequentlyUsedCombos: ScoutingCombo[];
  blueSide: SidePattern;
  redSide: SidePattern;
  matchHistory: ScoutedMatch[];
}
