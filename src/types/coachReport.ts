export type CoachAccessLevel = 'coach_verified' | 'restricted';

export interface DataCompletenessAudit {
  isComplete: boolean;
  completenessScore: number; // 0 - 100%
  completenessTier: 'high' | 'moderate' | 'low';
  scrimGamesFound: number;
  proGamesFound: number;
  scoutingDataAvailable: boolean;
  missingDataNotice: string;
  identifiedGaps: string[];
}

export interface OpponentMatchHistoryBrief {
  matchTitle: string;
  gameNumber: number;
  date: string;
  ourSide: 'blue' | 'red';
  winner: 'us' | 'them' | 'undecided';
  mcuHeroes: string[];
  oppHeroes: string[];
  notes: string;
  source: string;
}

export interface OpponentThreatHero {
  heroName: string;
  role: string;
  games: number;
  winRate: number;
  threatLevel: 'critical' | 'high' | 'medium';
  primaryThreatReason: string;
  source: string;
}

export interface OpponentFrequentBan {
  heroName: string;
  banRate: string;
  source: string;
}

export interface OpponentSignatureCombo {
  heroes: string[];
  winRate: number;
  games: number;
  source: string;
  description: string;
}

export interface OpponentSectionData {
  name: string;
  sourceAttribution: string;
  scrimRecordVsMcu: {
    games: number;
    mcuWins: number;
    mcuLosses: number;
    winRate: number;
  };
  threatHeroes: OpponentThreatHero[];
  frequentBans: OpponentFrequentBan[];
  playstyleSummary: string;
  signatureCombos: OpponentSignatureCombo[];
  recentEncounters: OpponentMatchHistoryBrief[];
}

export interface PickBanDirective {
  heroName: string;
  role: string;
  category: 'must_ban' | 'priority_pick' | 'situational_counter' | 'bait_trap';
  priorityLevel: 'Priority 1' | 'Priority 2' | 'Core Pick' | 'First Pick';
  reason: string;
  playerFit?: string;
  source: string;
}

export interface LineupSlotPlan {
  role: string;
  heroName: string;
  playerNickname: string;
  tier: 'signature' | 'comfortable' | 'situational';
  keyFunction: string;
}

export interface ContingencyPlanSlot {
  role: string;
  primaryHero: string;
  backupHero: string;
  triggerEvent: string;
  substitutionRationale: string;
}

export interface StrategicDraftPlansSection {
  primaryPlanA: {
    planName: string;
    side: 'blue' | 'red';
    tacticalTheme: string;
    lineup: LineupSlotPlan[];
    keyWinCondition: string;
    contingencyNotice: string;
  };
  contingencyPlanB: {
    planName: string;
    triggerCondition: string;
    lineup: ContingencyPlanSlot[];
    tacticalShift: string;
  };
}

export interface PlayerPoolMatchFit {
  playerNickname: string;
  playerName: string;
  position: string;
  category: string;
  signatures: string[];
  comfortables: string[];
  tacticalAssignment: string;
  formStatus: 'optimal' | 'ready' | 'needs_warmup';
}

export interface KeyLaneMatchup {
  lane: string;
  mcuHero: string;
  oppHero: string;
  h2hGames: number;
  diffPct: number;
  verdict: 'advantage' | 'even' | 'disadvantage';
  detailedNote: string;
  source: string;
  hasLowSample: boolean;
}

export interface KeyComboSynergy {
  heroes: string[];
  games: number;
  winRate: number;
  source: string;
  synergyDescription: string;
  tacticalTiming: string;
}

export interface TeamComparisonSection {
  mcuStrengths: string[];
  mcuVulnerabilities: string[];
  oppStrengths: string[];
  oppVulnerabilities: string[];
}

export interface GamePhasePacing {
  phase: 'early' | 'mid' | 'late';
  title: string;
  timingMinutes: string;
  strategicDirective: string;
  macroObjectives: string[];
  cautionPoints: string[];
  groundedSource: string;
}

export interface CoachPreMatchBriefingDirectives {
  mustDoList: string[];
  avoidList: string[];
  targetFocus: string;
  invadeProtocol: string;
  visionDirective: string;
  communicationAnchor: string;
}

export interface DataLimitationsSection {
  disclaimer: string;
  unverifiedMatchups: string[];
  smallSampleWarnings: string[];
  patchNotesLimitation: string;
  analyticalBoundary: string;
}

export interface MatchPrepReport {
  id: string;
  generatedAt: string;
  matchDate: string;
  opponentTeam: string;
  tournamentName: string;
  patch: string;
  selectedSide: 'blue' | 'red' | 'both';
  selectedGameNumber: number;
  selectedPlanId?: string;
  selectedPlanTitle?: string;
  accessLevel: CoachAccessLevel;
  coachAuditor: string;
  
  // 9 Required Report Sections
  dataCompleteness: DataCompletenessAudit; // Completeness Audit
  opponentProfile: OpponentSectionData; // Section 1: ข้อมูลคู่แข่งและแหล่งที่มา
  pickBanDirectives: { // Section 2: ฮีโร่ที่ควรพิจารณา Pick/Ban พร้อมเหตุผล
    mustBans: PickBanDirective[];
    priorityPicks: PickBanDirective[];
    baitTraps: PickBanDirective[];
  };
  draftPlans: StrategicDraftPlansSection; // Section 3: แผนดราฟหลักและแผนสำรอง
  playerPoolAlignment: PlayerPoolMatchFit[]; // Section 4: ความเหมาะสมกับผู้เล่นและฮีโร่ที่ถนัด
  matchupsAndSynergies: { // Section 5: Matchup และ Synergy ที่เกี่ยวข้อง
    laneMatchups: KeyLaneMatchup[];
    comboSynergies: KeyComboSynergy[];
  };
  teamComparison: TeamComparisonSection; // Section 6: จุดแข็งและช่องโหว่ของทั้งสองทีม
  gamePhaseConditions: GamePhasePacing[]; // Section 7: เงื่อนไขการเล่นช่วงต้นเกม กลางเกม เลทเกม
  coachPreMatchBriefing: CoachPreMatchBriefingDirectives; // Section 8: ประเด็นที่โค้ชควรแจ้งผู้เล่นก่อนแข่ง
  dataLimitations: DataLimitationsSection; // Section 9: ข้อมูลที่ยังไม่มีและข้อจำกัดในการวิเคราะห์
}
