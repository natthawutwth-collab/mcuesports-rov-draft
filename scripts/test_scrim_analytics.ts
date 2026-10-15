/**
 * MCU eSports RoV Draft Assistant
 * Phase 3: MCU Team Performance Analytics Unit & QA Validation Test Suite
 *
 * Verifies:
 * 1. Win rate calculations with explicit denominators
 * 2. Blue/Red side performance separation
 * 3. Hero & position performance aggregation
 * 4. Player & hero performance tracking
 * 5. Combo threshold gating
 * 6. Draft vs match result comparison & correlation disclaimer
 * 7. Missing data audit & low sample warnings
 * 8. Filter functionality (Date, Opponent, Player, Side, Plan)
 * 9. Separation of MCU Scrim Data from RPL Pro Stats
 */

import {
  calculateWinRate,
  formatFormulaDisplay,
  buildWinRateStat,
  ScrimAnalyticsService,
} from '../src/services/scrimAnalyticsService';
import { INITIAL_SCRIM_SESSIONS } from '../src/data/seedScrimSessions';
import { ScrimSession } from '../src/types/scrim';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passCount++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    if (detail) console.error(`     Reason: ${detail}`);
    failCount++;
  }
}

console.log('================================================================');
console.log('🧪 MCU eSports - Phase 3 Team Performance Analytics Test Suite');
console.log('================================================================');

// -----------------------------------------------------------------
// Suite 1: Mathematical Formula & Explicit Denominator
// -----------------------------------------------------------------
console.log('\n📦 Suite 1: Mathematical Formula & Explicit Denominator Validation');

const wr1 = calculateWinRate(8, 12);
assert(wr1 === 66.7, 'Win rate 8/12 calculated correctly as 66.7%', `Got ${wr1}`);

const wr2 = calculateWinRate(0, 0);
assert(wr2 === 0, 'Zero decided games returns 0% without NaN', `Got ${wr2}`);

const wr3 = calculateWinRate(3, 4);
assert(wr3 === 75.0, 'Win rate 3/4 calculated correctly as 75.0%', `Got ${wr3}`);

const formula1 = formatFormulaDisplay(8, 12, 66.7);
assert(
  formula1 === '8 / 12 เกม (66.7%)',
  'Formula display explicitly shows numerator, denominator and percentage',
  `Got: "${formula1}"`
);

const formulaZero = formatFormulaDisplay(0, 0, 0);
assert(
  formulaZero === '0 / 0 เกม (0.0%)',
  'Formula display handles 0/0 gracefully',
  `Got: "${formulaZero}"`
);

const winRateStat = buildWinRateStat(5, 2, 0, 7);
assert(
  winRateStat.wins === 5 && winRateStat.decidedGames === 7 && winRateStat.winRate === 71.4,
  'WinRateStat structure built with correct decided games and win rate',
  `Got: ${JSON.stringify(winRateStat)}`
);

// -----------------------------------------------------------------
// Suite 2: Baseline Seed Data & Game Counting
// -----------------------------------------------------------------
console.log('\n📦 Suite 2: Baseline Scrim Dataset Validation');

const service = new ScrimAnalyticsService();
const fullReport = service.generateReport(INITIAL_SCRIM_SESSIONS);

// Let's count known deterministic numbers in INITIAL_SCRIM_SESSIONS:
// Talon: 4 games (MCU won G1, G2, G4; lost G3) -> 3W - 1L
// Bacon: 3 games (MCU won G1, G3; lost G2) -> 2W - 1L
// Buriram: 2 games (MCU won G1, G2) -> 2W - 0L
// Hydra: 2 games (MCU lost G1, G2 is in_progress/undecided) -> 0W - 1L, 1 in_progress
// TOTAL DECIDED: 3W+2W+2W+0W = 7 Wins, 1L+1L+0L+1L = 3 Losses -> Total Decided = 10 games!
// Total Games = 11 games (10 decided + 1 in_progress)
// Overall WR = 7 / 10 = 70.0%

assert(fullReport.overall.totalGames === 11, `Total games count is 11 (actual: ${fullReport.overall.totalGames})`);
assert(fullReport.overall.decidedGames === 10, `Total decided games is 10 (actual: ${fullReport.overall.decidedGames})`);
assert(fullReport.overall.wins === 7, `Total wins is 7 (actual: ${fullReport.overall.wins})`);
assert(fullReport.overall.losses === 3, `Total losses is 3 (actual: ${fullReport.overall.losses})`);
assert(fullReport.overall.winRate === 70.0, `Overall win rate is 70.0% (actual: ${fullReport.overall.winRate}%)`);
assert(
  fullReport.overall.formulaDisplay === '7 / 10 เกม (70.0%)',
  `Overall formula display matches "7 / 10 เกม (70.0%)" (actual: ${fullReport.overall.formulaDisplay})`
);

// -----------------------------------------------------------------
// Suite 3: Blue vs Red Side Performance
// -----------------------------------------------------------------
console.log('\n📦 Suite 3: Blue vs Red Side Performance');

// Blue Side games:
// Talon G1: Blue (Win)
// Talon G3: Blue (Loss)
// Bacon G1: Blue (Win)
// Bacon G3: Blue (Win)
// Buriram G1: Blue (Win)
// Hydra G2: Blue (In progress)
// Decided Blue: 4 Wins, 1 Loss = 5 decided -> 4/5 = 80.0% WR
assert(fullReport.sideStats.blue.decidedGames === 5, `Blue decided games = 5 (actual: ${fullReport.sideStats.blue.decidedGames})`);
assert(fullReport.sideStats.blue.wins === 4, `Blue wins = 4 (actual: ${fullReport.sideStats.blue.wins})`);
assert(fullReport.sideStats.blue.winRate === 80.0, `Blue win rate = 80.0% (actual: ${fullReport.sideStats.blue.winRate}%)`);

// Red Side games:
// Talon G2: Red (Win)
// Talon G4: Red (Win)
// Bacon G2: Red (Loss)
// Buriram G2: Red (Win)
// Hydra G1: Red (Loss)
// Decided Red: 3 Wins, 2 Losses = 5 decided -> 3/5 = 60.0% WR
assert(fullReport.sideStats.red.decidedGames === 5, `Red decided games = 5 (actual: ${fullReport.sideStats.red.decidedGames})`);
assert(fullReport.sideStats.red.wins === 3, `Red wins = 3 (actual: ${fullReport.sideStats.red.wins})`);
assert(fullReport.sideStats.red.winRate === 60.0, `Red win rate = 60.0% (actual: ${fullReport.sideStats.red.winRate}%)`);

assert(
  fullReport.sideStats.sideDelta === 20.0,
  `Side delta is +20.0% (Blue advantage) (actual: ${fullReport.sideStats.sideDelta}%)`
);
assert(
  fullReport.sideStats.preferredSide === 'blue',
  `Preferred side detected as 'blue' (actual: ${fullReport.sideStats.preferredSide})`
);

// -----------------------------------------------------------------
// Suite 4: Hero & Position Performance
// -----------------------------------------------------------------
console.log('\n📦 Suite 4: Hero & Position Performance');

const caphenyAdl = fullReport.heroPositionStats.find((h) => h.heroName === 'Capheny' && h.position === 'ADL');
assert(Boolean(caphenyAdl), 'Capheny found in ADL position stats');
if (caphenyAdl) {
  // Capheny played in Talon G1 (W), Bacon G3 (W), Buriram G1 (W) -> 3 games, 3 wins
  assert(caphenyAdl.decidedGames === 3, `Capheny ADL played 3 decided games (actual: ${caphenyAdl.decidedGames})`);
  assert(caphenyAdl.wins === 3, `Capheny ADL has 3 wins (actual: ${caphenyAdl.wins})`);
  assert(caphenyAdl.winRate === 100.0, `Capheny ADL win rate is 100.0% (actual: ${caphenyAdl.winRate}%)`);
  assert(caphenyAdl.isLowSample === false, 'Capheny ADL has >= 3 games, not marked as isLowSample');
}

const florentinoDsl = fullReport.heroPositionStats.find((h) => h.heroName === 'Florentino' && h.position === 'DSL');
assert(Boolean(florentinoDsl), 'Florentino found in DSL position stats');
if (florentinoDsl) {
  // Florentino played in Talon G1 (W), Bacon G3 (W), Buriram G1 (W) -> 3 games, 3 wins
  assert(florentinoDsl.decidedGames === 3, `Florentino DSL played 3 decided games (actual: ${florentinoDsl.decidedGames})`);
  assert(florentinoDsl.wins === 3, `Florentino DSL has 3 wins (actual: ${florentinoDsl.wins})`);
}

// Low sample hero test:
const ryomaDsl = fullReport.heroPositionStats.find((h) => h.heroName === 'Ryoma' && h.position === 'DSL');
assert(Boolean(ryomaDsl), 'Ryoma found in DSL position stats');
if (ryomaDsl) {
  assert(ryomaDsl.decidedGames === 1, 'Ryoma DSL played 1 game');
  assert(ryomaDsl.isLowSample === true, 'Ryoma DSL has < 3 games, correctly marked isLowSample: true');
}

// -----------------------------------------------------------------
// Suite 5: Player & Hero Tracking
// -----------------------------------------------------------------
console.log('\n📦 Suite 5: Player & Hero Tracking');

const overfly = fullReport.playerSummaries.find((p) => p.playerNickname === 'Overfly');
assert(Boolean(overfly), 'Overfly found in player summaries');
if (overfly) {
  // Overfly played 10 decided games + 1 in progress = 11 games total
  assert(overfly.decidedGames === 10, `Overfly decided games = 10 (actual: ${overfly.decidedGames})`);
  assert(overfly.wins === 7, `Overfly wins = 7 (actual: ${overfly.wins})`);
  assert(overfly.winRate === 70.0, `Overfly win rate = 70.0% (actual: ${overfly.winRate}%)`);
  assert(overfly.topHeroes.length > 0, 'Overfly has top heroes list populated');
}

const erezCapheny = fullReport.playerHeroStats.find((ph) => ph.playerNickname === 'Erez' && ph.heroName === 'Capheny');
assert(Boolean(erezCapheny), 'Erez Capheny record found in player hero stats');
if (erezCapheny) {
  assert(erezCapheny.wins === 3 && erezCapheny.totalGames === 3, 'Erez played Capheny 3 times with 3 wins');
}

// -----------------------------------------------------------------
// Suite 6: Combo Performance & Threshold Gating
// -----------------------------------------------------------------
console.log('\n📦 Suite 6: Combo Performance & Threshold Gating');

// Filter combos with threshold >= 2
assert(fullReport.heroCombos.length > 0, `Combos generated (count: ${fullReport.heroCombos.length})`);
fullReport.heroCombos.forEach((c) => {
  assert(
    c.decidedGames >= 2,
    `Combo ${c.comboKey} meets minimum threshold >= 2 (actual: ${c.decidedGames})`
  );
  assert(
    c.hasSufficientSample === true,
    `Combo ${c.comboKey} marked hasSufficientSample: true`
  );
});

// Check if Capheny + Florentino combo exists (played in 3 games)
const caphenyFlorentino = fullReport.heroCombos.find(
  (c) => c.heroes.includes('Capheny') && c.heroes.includes('Florentino')
);
assert(Boolean(caphenyFlorentino), 'Capheny + Florentino synergy combo identified in dataset');
if (caphenyFlorentino) {
  assert(caphenyFlorentino.wins === 3, `Capheny + Florentino has 3 wins (actual: ${caphenyFlorentino.wins})`);
}

// Check with threshold 1 to include Capheny + TeeMee (played 1 game)
const reportAllCombos = service.generateReport(INITIAL_SCRIM_SESSIONS, { minComboGames: 1 });
const caphenyTeemee = reportAllCombos.heroCombos.find(
  (c) => c.heroes.includes('Capheny') && c.heroes.includes('TeeMee')
);
assert(Boolean(caphenyTeemee), 'Capheny + TeeMee identified when minComboGames is set to 1');

// -----------------------------------------------------------------
// Suite 7: Missing Data Audit & Small Sample Warnings
// -----------------------------------------------------------------
console.log('\n📦 Suite 7: Missing Data Audit & Small Sample Warnings');

assert(fullReport.missingDataAudit.length > 0, 'Missing data audit detected incomplete entries in dataset');
const undecidedIssue = fullReport.missingDataAudit.find((m) => m.issueType === 'undecided_winner');
assert(Boolean(undecidedIssue), 'Undecided game in Hydra G2 correctly flagged as undecided_winner');

const incompletePicksIssue = fullReport.missingDataAudit.find((m) => m.issueType === 'missing_picks');
assert(Boolean(incompletePicksIssue), 'Partial draft in Hydra G2 correctly flagged as missing_picks');

// -----------------------------------------------------------------
// Suite 8: Filter Operations
// -----------------------------------------------------------------
console.log('\n📦 Suite 8: Filter Operations (Opponent, Side, Player, Search)');

// Filter by opponent 'Talon'
const talonReport = service.generateReport(INITIAL_SCRIM_SESSIONS, { opponent: 'Talon' });
assert(talonReport.overall.totalGames === 4, `Talon filter yields exactly 4 games (actual: ${talonReport.overall.totalGames})`);
assert(talonReport.overall.wins === 3, `Talon filter yields exactly 3 wins (actual: ${talonReport.overall.wins})`);
assert(talonReport.overall.winRate === 75.0, `Talon filter win rate = 75.0% (actual: ${talonReport.overall.winRate}%)`);

// Filter by Blue side only
const blueReport = service.generateReport(INITIAL_SCRIM_SESSIONS, { side: 'blue' });
assert(blueReport.overall.totalGames === 6, `Blue filter yields exactly 6 games (5 decided + 1 in progress)`);
assert(blueReport.overall.wins === 4, `Blue filter yields exactly 4 wins`);

// Filter by Player 'Erez'
const erezReport = service.generateReport(INITIAL_SCRIM_SESSIONS, { player: 'Erez' });
assert(erezReport.overall.totalGames === 10, `Erez filter yields 10 games played by Erez`);

// Filter by Plan query 'TeeMee'
const teemeeReport = service.generateReport(INITIAL_SCRIM_SESSIONS, { planSearch: 'TeeMee' });
assert(teemeeReport.overall.totalGames >= 2, `Plan query for 'TeeMee' matches relevant sessions`);

// -----------------------------------------------------------------
// Suite 9: Correlation vs Causation Disclaimer & Pro Meta Separation
// -----------------------------------------------------------------
console.log('\n📦 Suite 9: Correlation Disclaimer & Data Source Separation');

assert(
  fullReport.correlationDisclaimer.includes('Correlation') &&
    fullReport.correlationDisclaimer.includes('Causation'),
  'Correlation disclaimer explicitly differentiates correlation from causation'
);
assert(
  fullReport.correlationDisclaimer.includes('ไม่สามารถสรุปได้ว่าการหยิบฮีโร่เป็นสาเหตุโดยตรง') ||
    fullReport.correlationDisclaimer.includes('ไม่ได้หมายความว่าตัวฮีโร่หรือคะแนนการดราฟต์เป็นสาเหตุของชัยชนะโดยตรง'),
  'Disclaimer explicitly instructs coaches that pick is not direct cause of victory'
);

assert(
  fullReport.dataSource.primary === 'MCU Scrim Manager Verified Data',
  'Primary data source labeled as MCU Scrim Manager Verified Data'
);
assert(
  fullReport.dataSource.proMetaBaseline.includes('RPL 2026 Summer Pro Meta Stats'),
  'Pro Meta baseline clearly separated as RPL 2026 Summer Pro Meta Stats'
);

// -----------------------------------------------------------------
// Summary
// -----------------------------------------------------------------
console.log('\n================================================================');
console.log(`🏁 Test Summary: ${passCount} Passed, ${failCount} Failed`);
console.log('================================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 All Scrim Analytics Quality & Mathematical Tests Passed!\n');
}
