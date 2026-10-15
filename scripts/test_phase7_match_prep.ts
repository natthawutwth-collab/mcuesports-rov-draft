/**
 * Test Suite for Phase 7: Match Preparation & Coach Report
 * Verifies all 9 report sections, source auditing, data completeness detection,
 * decoupling disclaimers, and coach access control.
 */

import { coachReportService } from '../src/services/coachReportService';

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
console.log('🧪 MCU eSports - Phase 7: Match Preparation & Coach Report Tests');
console.log('================================================================');

// Suite 1: Report Generation with Complete Data (Opponent: Talon with Scrim Records)
console.log('\n📦 Suite 1: Complete Dataset Report Generation (Opponent: Talon)');
const completeReport = coachReportService.generateMatchPrepReport({
  opponentTeam: 'Talon',
  matchDate: '2026-02-20',
  selectedSide: 'blue',
  selectedGameNumber: 1,
});

assert(Boolean(completeReport.id), `Report generated with unique ID: ${completeReport.id}`);
assert(completeReport.opponentTeam === 'Talon', 'Target opponent matches input');
assert(completeReport.dataCompleteness.isComplete === true, 'Data completeness evaluated as true for scouted/scrimmed team');
assert(completeReport.dataCompleteness.completenessTier === 'high', `Completeness tier is 'high' (Score: ${completeReport.dataCompleteness.completenessScore}%)`);
assert(completeReport.dataCompleteness.scrimGamesFound >= 3, `Found recorded scrim games vs Talon (actual: ${completeReport.dataCompleteness.scrimGamesFound})`);

// Suite 2: Section 1 - Opponent Profile & Source Attribution
console.log('\n📦 Suite 2: Section 1 - Opponent Profile & Source Verification');
assert(completeReport.opponentProfile.threatHeroes.length > 0, 'Opponent threat heroes identified');
assert(completeReport.opponentProfile.scrimRecordVsMcu.games > 0, 'Head-to-head scrim record against opponent calculated');
assert(completeReport.opponentProfile.sourceAttribution.length > 10, `Source attribution present: "${completeReport.opponentProfile.sourceAttribution}"`);
assert(completeReport.opponentProfile.threatHeroes.every((th) => Boolean(th.source)), 'Every threat hero cites verifiable data source');

// Suite 3: Section 2 - Pick & Ban Directives
console.log('\n📦 Suite 3: Section 2 - Pick & Ban Directives with Tactical Rationale');
assert(completeReport.pickBanDirectives.mustBans.length >= 2, 'Must-ban targets identified');
assert(completeReport.pickBanDirectives.priorityPicks.length >= 3, 'Priority pick targets identified');
assert(completeReport.pickBanDirectives.mustBans.every((b) => b.reason.length > 10), 'Must-ban targets have detailed tactical rationale');
assert(completeReport.pickBanDirectives.priorityPicks.every((p) => Boolean(p.source)), 'Priority picks cite data sources');

// Suite 4: Section 3 - Primary Plan A & Contingency Plan B
console.log('\n📦 Suite 4: Section 3 - Primary Plan A & Contingency Plan B');
assert(completeReport.draftPlans.primaryPlanA.lineup.length === 5, 'Plan A has full 5-role lineup (DSL, JG, MID, ROAM, ADL)');
assert(Boolean(completeReport.draftPlans.primaryPlanA.keyWinCondition), 'Plan A defines explicit macro win condition');
assert(completeReport.draftPlans.contingencyPlanB.lineup.length === 5, 'Plan B has fallback substitutions for all 5 roles');
assert(completeReport.draftPlans.contingencyPlanB.lineup.every((c) => Boolean(c.backupHero) && Boolean(c.substitutionRationale)),
  'Plan B backups provide substitution rationale');

// Suite 5: Section 4 - MCU Player Hero Pool Alignment
console.log('\n📦 Suite 5: Section 4 - MCU Player Hero Pool Alignment');
assert(completeReport.playerPoolAlignment.length === 5, 'Player pool covers all 5 MCU starting roster members');
const overfly = completeReport.playerPoolAlignment.find((p) => p.playerNickname === 'Overfly');
assert(Boolean(overfly && overfly.signatures.includes('Florentino')), 'Overfly correctly mapped with Florentino signature');
const erez = completeReport.playerPoolAlignment.find((p) => p.playerNickname === 'Erez');
assert(Boolean(erez && erez.signatures.includes('Capheny')), 'Erez correctly mapped with Capheny signature');

// Suite 6: Section 5 - Matchups & Synergies with Source Auditing
console.log('\n📦 Suite 6: Section 5 - Matchups & Synergies with Source Auditing');
assert(completeReport.matchupsAndSynergies.laneMatchups.length >= 2, 'Lane head-to-head matchups evaluated');
assert(completeReport.matchupsAndSynergies.comboSynergies.length >= 2, 'Duo combo synergies evaluated');
assert(completeReport.matchupsAndSynergies.laneMatchups.every((lm) => Boolean(lm.source) && lm.h2hGames > 0),
  'Every lane matchup cites verified pro games and sources');
assert(completeReport.matchupsAndSynergies.comboSynergies.every((cs) => cs.winRate > 0 && cs.games > 0),
  'Synergy combos have verified win rates and game counts');

// Suite 7: Section 6 & 7 - Team Comparison & Game Phase Conditions
console.log('\n📦 Suite 7: Section 6 & 7 - Team Comparison & Game Phase Conditions');
assert(completeReport.teamComparison.mcuStrengths.length > 0, 'MCU tactical strengths populated');
assert(completeReport.teamComparison.mcuVulnerabilities.length > 0, 'MCU vulnerabilities populated');
assert(completeReport.teamComparison.oppVulnerabilities.length > 0, 'Opponent exploitable vulnerabilities populated');
assert(completeReport.gamePhaseConditions.length === 3, 'Game phase pacing covers Early, Mid, and Late game');
assert(completeReport.gamePhaseConditions.every((gp) => gp.macroObjectives.length > 0 && Boolean(gp.groundedSource)),
  'Game phase directives cite grounded tactical sources');

// Suite 8: Section 8 - Coach Pre-Match Briefing Directives
console.log('\n📦 Suite 8: Section 8 - Coach Pre-Match Briefing Directives');
assert(completeReport.coachPreMatchBriefing.mustDoList.length >= 3, 'Must-do locker room briefing points present');
assert(completeReport.coachPreMatchBriefing.avoidList.length >= 3, 'Avoid/caution briefing points present');
assert(Boolean(completeReport.coachPreMatchBriefing.targetFocus), 'Target priority directive specified');
assert(Boolean(completeReport.coachPreMatchBriefing.communicationAnchor), 'Communication anchor specified');

// Suite 9: Section 9 - Scientific Boundaries & Prohibition of Win Guarantees
console.log('\n📦 Suite 9: Section 9 - Scientific Disclaimers & No Win Guarantee Rule');
assert(completeReport.dataLimitations.disclaimer.length > 30, 'Scientific analytical disclaimer explicitly present');
assert(completeReport.dataLimitations.disclaimer.includes('มิได้รับรองหรือพยากรณ์ผลการแข่งขันเป็นเปอร์เซ็นต์ชนะ'),
  'Disclaimer explicitly prohibits guaranteeing match victory from draft analysis');
assert(completeReport.dataLimitations.smallSampleWarnings.length > 0, 'Small sample warnings included');

// Suite 10: Incomplete / Partial Dataset Handling (Unscouted Opponent)
console.log('\n📦 Suite 10: Incomplete / Unscouted Opponent Report Handling');
const incompleteReport = coachReportService.generateMatchPrepReport({
  opponentTeam: 'Unscouted Academy Team XYZ',
  selectedSide: 'red',
  selectedGameNumber: 2,
});

assert(incompleteReport.dataCompleteness.isComplete === false, 'Incomplete dataset correctly flagged as isComplete: false');
assert(incompleteReport.dataCompleteness.completenessTier === 'low', 'Completeness tier marked as low for unscouted opponent');
assert(incompleteReport.dataCompleteness.identifiedGaps.length >= 2, 'Explicit data gaps identified for unscouted opponent');
assert(incompleteReport.dataCompleteness.missingDataNotice.includes('Data Gaps Detected'), 'Missing data notice explicitly informs coach');

// Suite 11: Coach Access Gate & PIN Verification
console.log('\n📦 Suite 11: Coach Access Verification & Security Gate');
assert(coachReportService.verifyCoachPin('2026') === true, 'Default coach PIN 2026 successfully verified');
assert(coachReportService.verifyCoachPin('9999') === false, 'Incorrect PIN rejected');

// Suite 12: Report Snapshot Persistence
console.log('\n📦 Suite 12: Report Snapshot Persistence (Save & Delete)');
coachReportService.saveReportSnapshot(completeReport);
const savedList = coachReportService.getAllSavedReports();
assert(savedList.some((r) => r.id === completeReport.id), 'Report snapshot successfully saved');
coachReportService.deleteSavedReport(completeReport.id);
const savedListAfter = coachReportService.getAllSavedReports();
assert(!savedListAfter.some((r) => r.id === completeReport.id), 'Report snapshot successfully deleted');

console.log('\n================================================================');
console.log(`🏁 Phase 7 Match Prep Test Summary: ${testsPassed} Passed, ${testsFailed} Failed`);
console.log('================================================================');

if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log('🎉 All Phase 7 Match Preparation & Coach Report tests passed successfully!\n');
}
