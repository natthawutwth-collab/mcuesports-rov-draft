import { LaneSelectKey } from './draft';
import { ScrimGame, ScrimSession } from './scrim';

export interface ScrimAnalyticsFilter {
  dateFrom?: string;
  dateTo?: string;
  opponent?: string; // 'all' or team name
  player?: string; // 'all' or player name/nickname
  side?: 'all' | 'blue' | 'red';
  planSearch?: string; // Search within session title or draft objective
  minComboGames?: number; // Minimum games for combo display (e.g. 2)
}

export interface WinRateStat {
  wins: number;
  losses: number;
  draws: number;
  totalGames: number;
  decidedGames: number; // wins + losses (excludes in_progress/draw)
  winRate: number; // percentage rounded to 1 decimal place (e.g. 66.7)
  formulaDisplay: string; // e.g. "8 / 12 เกม (66.7%)"
}

export interface OverallPerformance extends WinRateStat {
  totalSessions: number;
  isLowSample: boolean; // true if decidedGames < 5
  lowSampleWarning?: string;
  missingDataCount: {
    incompleteGames: number;
    undecidedGames: number;
    unassignedPlayers: number;
    emptyNotes: number;
  };
}

export interface SidePerformance {
  blue: WinRateStat;
  red: WinRateStat;
  preferredSide: 'blue' | 'red' | 'balanced';
  sideDelta: number; // Blue WR - Red WR (percentage points)
}

export interface HeroPositionPerformance extends WinRateStat {
  heroName: string;
  position: LaneSelectKey;
  isLowSample: boolean; // true if decidedGames < 3
}

export interface PlayerHeroPerformance extends WinRateStat {
  playerName: string;
  playerNickname: string;
  heroName: string;
  position: LaneSelectKey;
  isLowSample: boolean; // true if decidedGames < 3
}

export interface PlayerOverallSummary extends WinRateStat {
  playerName: string;
  playerNickname: string;
  positionsPlayed: LaneSelectKey[];
  topHeroes: Array<{ heroName: string; games: number; winRate: number }>;
}

export interface HeroComboStat extends WinRateStat {
  comboKey: string;
  heroes: string[];
  size: 2 | 3;
  hasSufficientSample: boolean; // decidedGames >= minThreshold
}

export interface DraftVsOutcomeComparison {
  gameId: string;
  sessionId: string;
  sessionTitle: string;
  sessionDate: string;
  gameNumber: number;
  opponent: string;
  ourSide: 'blue' | 'red';
  ourPicks: string[];
  oppPicks: string[];
  actualResult: 'won' | 'lost' | 'in_progress';
  draftTheoreticalRating: 'Strong Advantage' | 'Slight Advantage' | 'Balanced' | 'Challenging Matchup';
  draftScoreEstimate: number; // 0 - 100 estimated composition rating
  alignment: 'win_with_advantage' | 'win_despite_challenge' | 'loss_despite_advantage' | 'loss_with_challenge' | 'in_progress';
  alignmentLabel: string;
  coachDebrief?: string;
}

export interface MissingDataAuditItem {
  sessionId: string;
  sessionTitle: string;
  gameNumber: number;
  issueType: 'missing_picks' | 'undecided_winner' | 'missing_player' | 'missing_coach_notes';
  description: string;
}

export interface ScrimAnalyticsReport {
  generatedAt: string;
  filterApplied: ScrimAnalyticsFilter;
  dataSource: {
    primary: 'MCU Scrim Manager Verified Data';
    proMetaBaseline: 'RPL 2026 Summer Pro Meta Stats (Reference Only)';
    coachNotesOrigin: 'Coach Qualitative Debrief (Subjective Input)';
  };
  correlationDisclaimer: string;
  overall: OverallPerformance;
  sideStats: SidePerformance;
  heroPositionStats: HeroPositionPerformance[];
  playerSummaries: PlayerOverallSummary[];
  playerHeroStats: PlayerHeroPerformance[];
  heroCombos: HeroComboStat[];
  draftVsOutcome: DraftVsOutcomeComparison[];
  missingDataAudit: MissingDataAuditItem[];
}
