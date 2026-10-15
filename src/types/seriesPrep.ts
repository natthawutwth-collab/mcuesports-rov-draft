export type SeriesFormat = 'BO3' | 'BO5' | 'BO7';

export type GlobalBanRule = 'rpl_global' | 'strict_global' | 'none';

export interface TournamentRuleConfig {
  format: SeriesFormat;
  globalBanRule: GlobalBanRule;
  phase1BansPerTeam: number;
  phase2BansPerTeam: number;
  resetOnGame7: boolean;
  tournamentName: string;
  patch: string;
}

export type PlannedRoleKey = 'DSL' | 'JG' | 'MID' | 'ADL' | 'SUP';

export interface PlannedRolePick {
  role: PlannedRoleKey;
  preferredHero: string; // Plan A
  alternativeHeroes: string[]; // Plan B / Alternative picks
  reason?: string;
}

export interface GamePlan {
  gameNumber: number;
  side: 'blue' | 'red';
  targetBans: string[];
  preferredPicks: PlannedRolePick[];
  coachNotes: string;
  result: 'pending' | 'won' | 'lost' | 'draw';
  linkedDraftId?: string;
  actualBluePicks?: string[];
  actualRedPicks?: string[];
}

export interface SeriesPlan {
  id: string;
  title: string;
  tournament: string;
  opponentTeam: string;
  ourTeam: string;
  format: SeriesFormat;
  rules: TournamentRuleConfig;
  games: GamePlan[];
  overallNotes: string;
  createdAt: string;
  updatedAt: string;
}
