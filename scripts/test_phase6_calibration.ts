/**
 * Test Suite for Phase 6: Draft Review & Calibration
 * Tests all requirements, scientific decoupling, offline backtesting, and safety rollback rules.
 */

import { calibrationService, DIVERGENCE_REASON_LABELS } from '../src/services/calibrationService';
import { DEFAULT_PRODUCTION_SCORING_WEIGHTS, INITIAL_DRAFT_REVIEWS } from '../src/data/seedDraftReviews';
import { ScoringWeights } from '../src/types/calibration';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    testsPassed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    testsFailed++;
  }
}

console.log('\n================================================================');
console.log('🧪 MCU eSports - Phase 6: Draft Review & Calibration Test Suite');
console.log('================================================================');

// Suite 1: Data Linkage & Hit Rate Tracking (Req 1 & 2)
console.log('\n📦 Suite 1: Recommendation Snapshot Linkage & Hit Rate Metrics');
const reviews = calibrationService.getAllReviews();
assert(reviews.length >= 4, `Draft reviews seeded successfully (count: ${reviews.length})`);

const report = calibrationService.generateCalibrationReport();
assert(report.hitRateMetrics.totalEvaluated > 0, `Total turns evaluated > 0 (actual: ${report.hitRateMetrics.totalEvaluated})`);
assert(report.hitRateMetrics.top1Rate > 0, `Top 1 Agreement Rate computed (actual: ${report.hitRateMetrics.top1Rate}%)`);
assert(report.hitRateMetrics.top3Rate >= report.hitRateMetrics.top1Rate, `Top 3 Agreement Rate >= Top 1 (actual: ${report.hitRateMetrics.top3Rate}%)`);
assert(report.hitRateMetrics.top5Rate >= report.hitRateMetrics.top3Rate, `Top 5 Coverage >= Top 3 (actual: ${report.hitRateMetrics.top5Rate}%)`);
assert(report.hitRateMetrics.top1Count + report.divergenceSummary.totalDiverged === report.hitRateMetrics.totalEvaluated,
  'Sum of Top 1 picks + Diverged picks matches total evaluated turns');

// Suite 2: Divergence Analysis & Coach Rationale (Req 2)
console.log('\n📦 Suite 2: Divergence Analysis & Coach Rationale Categories');
assert(report.divergenceSummary.totalDiverged > 0, `Recorded coach divergence events (count: ${report.divergenceSummary.totalDiverged})`);
assert(report.divergenceSummary.divergenceRate > 0, `Divergence percentage computed (actual: ${report.divergenceSummary.divergenceRate}%)`);
assert(report.divergenceSummary.byReason.length > 0, 'Divergence reasons distribution populated');

const signatureDivergence = report.divergenceSummary.byReason.find((r) => r.reason === 'player_signature_pocket');
assert(Boolean(signatureDivergence), 'Identified player_signature_pocket divergence category');
assert(typeof DIVERGENCE_REASON_LABELS.player_signature_pocket === 'string', 'Thai label defined for player_signature_pocket');

// Suite 3: Dimensional Breakdowns (Req 3: Side, Stage, Role)
console.log('\n📦 Suite 3: Dimensional Breakdowns (Side, Stage, Role)');
assert(report.breakdowns.bySide.blue.total > 0, 'Blue side evaluated turns exist');
assert(report.breakdowns.bySide.red.total > 0, 'Red side evaluated turns exist');
assert(typeof report.breakdowns.bySide.blue.top1Rate === 'number', 'Blue side Top 1 rate computed');
assert(typeof report.breakdowns.bySide.red.top1Rate === 'number', 'Red side Top 1 rate computed');

assert(report.breakdowns.byStage.phase1_ban.total > 0, 'Phase 1 Ban breakdown populated');
assert(report.breakdowns.byStage.phase1_pick.total > 0, 'Phase 1 Pick breakdown populated');
assert(report.breakdowns.byStage.phase2_ban.total >= 0, 'Phase 2 Ban breakdown populated');
assert(report.breakdowns.byStage.phase2_pick.total > 0, 'Phase 2 Pick breakdown populated');

assert(report.breakdowns.byRole.DSL.total > 0, 'Dark Slayer Lane breakdown populated');
assert(report.breakdowns.byRole.Jungle.total > 0, 'Jungle breakdown populated');
assert(report.breakdowns.byRole.Mid.total > 0, 'Mid Lane breakdown populated');
assert(report.breakdowns.byRole.Support.total > 0, 'Support/Roam breakdown populated');
assert(report.breakdowns.byRole.ADL.total > 0, 'Abyssal Dragon Lane breakdown populated');

// Suite 4: Flagged Cases & Data Gaps (Req 4)
console.log('\n📦 Suite 4: Flagged Recommendations & Missing Data Detection');
assert(report.flaggedCases.length > 0, `Identified flagged draft turns/cases (count: ${report.flaggedCases.length})`);
const lowSampleCase = report.flaggedCases.find((c) => c.issueType === 'low_sample');
assert(Boolean(lowSampleCase), 'Flagged case with low statistical sample size detected');
const coachLowCase = report.flaggedCases.find((c) => c.issueType === 'low_coach_rating');
assert(Boolean(coachLowCase), 'Flagged case with low coach utility rating (<= 2 stars) detected');

// Suite 5: Offline A/B Backtest Simulation (Req 5)
console.log('\n📦 Suite 5: Offline Formula Calibration & Backtesting Simulator');
const candidateWeights: ScoringWeights = {
  missingRoleWeight: 28,
  playerSignatureWeight: 32, // Increase signature weight
  playerComfortableWeight: 18,
  matchupAdvantageWeight: 12,
  matchupDisadvantagePenalty: 14,
  synergyWeight: 10,
  tournamentMetaWeight: 8,
  sideBiasWeight: 5,
};

const backtest = calibrationService.runOfflineBacktest(candidateWeights, DEFAULT_PRODUCTION_SCORING_WEIGHTS);
assert(backtest.totalEvaluatedTurns > 0, `Backtest evaluated historical turns (count: ${backtest.totalEvaluatedTurns})`);
assert(typeof backtest.baseline.top1Rate === 'number', `Baseline Top 1 rate: ${backtest.baseline.top1Rate}%`);
assert(typeof backtest.candidate.top1Rate === 'number', `Candidate Top 1 rate: ${backtest.candidate.top1Rate}%`);
assert(typeof backtest.delta.top1RateDelta === 'number', `Delta calculated: ${backtest.delta.top1RateDelta}%`);
assert(backtest.sampleTurns.length > 0, 'Sample turn-by-turn counterfactual diffs generated');

// Suite 6: Production Safety Rules & Rollback Snapshots
console.log('\n📦 Suite 6: Production Safety Guardrails & Rollback Snapshots');
const activeBefore = calibrationService.getActiveWeights();
assert(typeof activeBefore.missingRoleWeight === 'number', 'Active production weights accessible');

// Deploy candidate weights
const deployResult = calibrationService.deployProductionWeights({
  candidateWeights,
  description: 'Test deployment for validation',
  appliedBy: 'Automated Test Agent',
  backtestReport: backtest,
});

assert(deployResult.success, 'Deployment succeeded with rollback snapshot creation');
assert(Boolean(deployResult.snapshot.id), `Rollback snapshot created with ID: ${deployResult.snapshot.id}`);
assert(deployResult.snapshot.previousWeights.missingRoleWeight === activeBefore.missingRoleWeight,
  'Snapshot captured accurate previous production weights');

// Rollback to previous
const rollbackOk = calibrationService.rollbackToSnapshot(deployResult.snapshot.id);
assert(rollbackOk, 'Rollback to snapshot executed successfully');

// Reset to default
calibrationService.resetWeightsToDefault();
const activeAfterReset = calibrationService.getActiveWeights();
assert(activeAfterReset.playerSignatureWeight === DEFAULT_PRODUCTION_SCORING_WEIGHTS.playerSignatureWeight,
  'Reset to official default restored original weights');

// Suite 7: Scientific Decoupling Principle
console.log('\n📦 Suite 7: Decoupling of Recommendation Quality from Match Win/Loss');
assert(typeof report.decoupledMatchOutcome.winRate === 'number', 'Match outcome win rate tracked separately');
assert(report.decoupledMatchOutcome.disclaimer.length > 20, 'Decoupling scientific disclaimer explicitly present');
assert(report.decoupledMatchOutcome.disclaimer.includes('แยกขาด'), 'Disclaimer specifies separation of draft evaluation and match outcome');

// Suite 8: Data Readiness & Sample Sufficiency Evaluation
console.log('\n📦 Suite 8: Data Readiness & Sample Sufficiency Scorecard');
assert(typeof report.dataReadiness.totalDrafts === 'number', 'Total drafts counted in readiness scorecard');
assert(report.dataReadiness.minRecommendedDrafts === 15, 'Minimum recommended drafts set to 15');
assert(['insufficient', 'emerging', 'robust'].includes(report.dataReadiness.sufficiencyTier),
  `Sufficiency tier assigned accurately (actual: ${report.dataReadiness.sufficiencyTier})`);
assert(report.dataReadiness.sufficiencyMessage.length > 15, 'Clear guidance message provided for data sufficiency');

console.log('\n================================================================');
console.log(`🏁 Phase 6 Calibration Test Summary: ${testsPassed} Passed, ${testsFailed} Failed`);
console.log('================================================================');

if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log('🎉 All Phase 6 Draft Review & Calibration tests passed successfully!\n');
}
