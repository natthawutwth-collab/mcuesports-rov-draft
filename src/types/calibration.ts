import { CompRoleKey } from '../services/coachAnalysisService';
import { MatchWinner } from './draftHistory';

export type DivergenceReasonCategory =
  | 'player_signature_pocket' // ผู้เล่นมั่นใจเป็นพิเศษ / Pocket Pick ประจำตัว
  | 'strategic_flex' // วางแผนสลับตำแหน่ง (Flex Pick) หลอกคู่แข่ง
  | 'bait_trap_strategy' // หลอกล่อให้คู่แข่งหยิบตัวที่เข้าทางแก้ของเรา
  | 'scrim_proven_secret' // สูตรลับที่ซ้อมได้ผลดีเด่นจากห้อง Scrim
  | 'enemy_predictive_deny' // อ่านใจตัดฮีโร่ที่คู่แข่งน่าจะหยิบในรอบถัดไป
  | 'tactical_synergy_priority' // ให้ความสำคัญกับคอมโบไฟต์ทีมเป็นหลัก
  | 'target_lane_counter' // มั่นใจการยืนเลนชนะคู่แข่งเฉพาะเจาะจง
  | 'coach_intuition' // เซนส์และวิจารณญาณโค้ชหน้างานสด
  | 'other'; // เหตุผลอื่นๆ

export interface TurnSuggestionSnapshot {
  heroName: string;
  score: number;
  role?: string;
  rank: number;
  reasons: string[];
  confidence?: 'high' | 'medium' | 'situational';
  hasLowSample?: boolean;
}

export type DraftTurnStage =
  | 'phase1_ban'
  | 'phase1_pick'
  | 'phase2_ban'
  | 'phase2_pick';

export interface TurnRecommendationSnapshot {
  turnIdx: number;
  turnNumber: number; // 1 - 20
  team: 'blue' | 'red';
  phase: 'ban' | 'pick';
  stage: DraftTurnStage;
  targetRole?: CompRoleKey | string;
  topSuggestions: TurnSuggestionSnapshot[];
  chosenHeroName: string;
  chosenRole?: string;
  wasInTop1: boolean;
  wasInTop3: boolean;
  wasInTop5: boolean;
  chosenRank: number | null; // null if not in top recommendations
  isDiverged: boolean; // chosen !== rank 1
  divergenceReasonCategory?: DivergenceReasonCategory;
  divergenceNotes?: string;
  flags?: string[]; // 'low_sample', 'unranked_choice', 'coach_flagged_misleading', 'missing_h2h'
}

export type CoachUtilityVerdict =
  | 'critical' // มีประโยชน์มาก ช่วยเปลี่ยนเกมและทิศทางดราฟต์
  | 'very_helpful' // ช่วยแนะนำตัวเลือกที่ดี ตรงตามสถานการณ์
  | 'acceptable' // ยอมรับได้ มีประโยชน์ปานกลาง
  | 'marginal' // ประโยชน์น้อย หรือคำแนะนำไม่ตรงแผน
  | 'misleading'; // คำแนะนำชี้นำผิดพลาด ข้อมูลไม่สะท้อนสถานการณ์จริง

export interface DraftReviewRecord {
  id: string;
  title: string;
  tournament: string;
  match: string;
  gameNumber: number;
  date: string;
  blueTeamName: string;
  redTeamName: string;
  mcuSide: 'blue' | 'red';
  winner: MatchWinner;
  matchDuration?: string;
  postGameNotes: string;
  coachUtilityRating: number; // 1 to 5 stars
  coachUtilityVerdict: CoachUtilityVerdict;
  coachFeedbackTags: string[];
  turns: TurnRecommendationSnapshot[];
  draftHistoryId?: string;
  scrimSessionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScoringWeights {
  missingRoleWeight: number; // default: 30
  playerSignatureWeight: number; // default: 22
  playerComfortableWeight: number; // default: 12
  matchupAdvantageWeight: number; // default: 14
  matchupDisadvantagePenalty: number; // default: 18
  synergyWeight: number; // default: 10
  tournamentMetaWeight: number; // default: 10
  sideBiasWeight: number; // default: 6
}

export interface CalibrationSnapshot {
  id: string;
  appliedAt: string;
  description: string;
  weights: ScoringWeights;
  previousWeights: ScoringWeights;
  backtestDelta: {
    top1Delta: number;
    top3Delta: number;
    top5Delta: number;
    avgRankImprovement: number;
  };
  appliedBy: string;
}

export interface BacktestTurnResult {
  turnNumber: number;
  chosenHero: string;
  stage: DraftTurnStage;
  baselineRank: number | null;
  candidateRank: number | null;
  improved: boolean;
  regressed: boolean;
  baselineTop1Hero: string;
  candidateTop1Hero: string;
}

export interface BacktestReport {
  totalEvaluatedTurns: number;
  baseline: {
    top1Rate: number;
    top3Rate: number;
    top5Rate: number;
    avgRank: number;
  };
  candidate: {
    top1Rate: number;
    top3Rate: number;
    top5Rate: number;
    avgRank: number;
  };
  delta: {
    top1RateDelta: number;
    top3RateDelta: number;
    top5RateDelta: number;
    avgRankDelta: number; // negative means rank number is smaller (better)
  };
  sampleTurns: BacktestTurnResult[];
}

export interface CalibrationAnalysisReport {
  dataReadiness: {
    totalDrafts: number;
    totalTurns: number;
    sufficiencyTier: 'insufficient' | 'emerging' | 'robust';
    sufficiencyMessage: string;
    minRecommendedDrafts: number;
  };
  hitRateMetrics: {
    top1Rate: number;
    top3Rate: number;
    top5Rate: number;
    totalEvaluated: number;
    top1Count: number;
    top3Count: number;
    top5Count: number;
    unrankedCount: number;
  };
  divergenceSummary: {
    divergenceRate: number;
    totalDiverged: number;
    byReason: Array<{
      reason: DivergenceReasonCategory;
      label: string;
      count: number;
      percentage: number;
    }>;
    avgRankWhenDiverged: number;
  };
  breakdowns: {
    bySide: Record<
      'blue' | 'red',
      { total: number; top1Rate: number; top3Rate: number; divergenceRate: number }
    >;
    byStage: Record<
      DraftTurnStage,
      { total: number; top1Rate: number; top3Rate: number; divergenceRate: number }
    >;
    byRole: Record<
      CompRoleKey,
      { total: number; top1Rate: number; top3Rate: number; divergenceRate: number }
    >;
  };
  flaggedCases: Array<{
    turnId: string;
    draftTitle: string;
    turnNumber: number;
    heroChosen: string;
    recommendedHero: string;
    divergenceReason?: string;
    issueType: 'low_sample' | 'unranked_choice' | 'low_coach_rating' | 'high_h2h_conflict';
    details: string;
  }>;
  coachUtilitySummary: {
    avgRating: number;
    distribution: Record<number, number>; // 1 -> count, 2 -> count...
    commonTags: Array<{ tag: string; count: number }>;
  };
  decoupledMatchOutcome: {
    totalMatches: number;
    winCount: number;
    lossCount: number;
    winRate: number;
    disclaimer: string;
  };
}
