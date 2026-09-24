export type MatchWinner = 'blue' | 'red' | 'draw' | 'undecided';

export interface DraftMatchMetadata {
  tournament: string;
  match: string;
  gameNumber: number;
  blueTeam: string;
  redTeam: string;
  patch: string;
}

export interface DraftTeamRecord {
  teamName: string;
  side: 'blue' | 'red';
  bans: string[]; // Hero names
  picks: Array<{
    heroName: string;
    position: string; // DSL, JG, MID, ROAM, ADL
    pickOrder?: number;
  }>;
}

export interface DraftHistoryRecord {
  id: string;
  createdAt: string; // ISO 8601 string
  updatedAt: string;
  tournament: string;
  match: string;
  gameNumber: number;
  patch: string;
  blueTeam: DraftTeamRecord;
  redTeam: DraftTeamRecord;
  winner: MatchWinner;
  notes: string;
  tags?: string[];
  durationSeconds?: number;
}

export interface DraftHistoryFilter {
  searchQuery?: string;
  tournament?: string;
  teamName?: string;
  heroName?: string;
  winner?: MatchWinner;
  patch?: string;
}

export interface DraftRepository {
  getAll(): Promise<DraftHistoryRecord[]>;
  getById(id: string): Promise<DraftHistoryRecord | null>;
  save(record: Omit<DraftHistoryRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<DraftHistoryRecord>;
  delete(id: string): Promise<boolean>;
  clearAll(): Promise<void>;
  exportJson(): Promise<string>;
  importJson(jsonData: string): Promise<number>;
}
