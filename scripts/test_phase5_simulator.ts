/**
 * MCU eSports RoV Draft Assistant
 * Phase 5: Draft Scenario Simulator Test Suite
 *
 * Requirements Covered:
 * 1. Independent scenario creation & live draft forking
 * 2. Multi-Plan (A/B/C) management with tactical goals & win conditions
 * 3. Tactical role profiling (First Pick, Counter Pick, Comfort Pick, Flex Pick)
 * 4. Ripple impact simulation (denied picks, unlocked synergies, threats)
 * 5. Composition analysis (Missing lanes, synergies, strengths, weaknesses, risks)
 * 6. Fallback contingency recommendations (primary & secondary backups with rationale)
 * 7. Real-time dynamic recalculation on state adjustments
 * 8. State isolation: Simulator operations do not mutate live draft state
 * 9. Strict hero availability filtering: No picked/banned heroes suggested
 * 10. Data limitation disclosure & Tactical Fit Score vs Win Probability prohibition
 */

import { HEROES } from '../src/data/heroes';
import {
  draftScenarioSimulatorService,
  SIMULATOR_DISCLAIMER,
  ROV_FIRST_PICK_TIER,
  ROV_COUNTER_MAP,
  ROV_FLEX_HEROES,
} from '../src/services/draftScenarioSimulatorService';
import { simulatorService } from '../src/services/simulatorService';
import { SimulatorScenario, ScenarioPlan } from '../src/types/simulator';
import { Hero, LaneSelectKey } from '../src/types/draft';
import { Player } from '../src/types/player';

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

const mockPlayers: Player[] = [
  { id: 'p1', name: 'Overfly', nickname: 'Overfly', position: 'DSL', heroPool: [{ heroName: 'Florentino', tier: 'signature' }, { heroName: 'Omen', tier: 'signature' }], createdAt: 1 },
  { id: 'p2', name: 'NBank', nickname: 'NBank', position: 'Jungle', heroPool: [{ heroName: 'Aoi', tier: 'signature' }, { heroName: 'Nakroth', tier: 'signature' }], createdAt: 1 },
  { id: 'p3', name: 'NuNu', nickname: 'NuNu', position: 'Mid', heroPool: [{ heroName: 'Liliana', tier: 'signature' }, { heroName: 'Iggy', tier: 'signature' }], createdAt: 1 },
  { id: 'p4', name: 'Erez', nickname: 'Erez', position: 'ADL', heroPool: [{ heroName: 'Capheny', tier: 'signature' }, { heroName: 'Elsu', tier: 'signature' }], createdAt: 1 },
  { id: 'p5', name: 'Tony', nickname: 'Tony', position: 'Support', heroPool: [{ heroName: 'TeeMee', tier: 'signature' }, { heroName: 'Toro', tier: 'signature' }], createdAt: 1 },
];

function getHero(name: string): Hero {
  const found = HEROES.find((h) => h.name.toLowerCase() === name.toLowerCase());
  if (!found) throw new Error(`Hero ${name} not found in HEROES database`);
  return found;
}

console.log('================================================================');
console.log('🧪 MCU eSports - Phase 5 Draft Scenario Simulator Test Suite');
console.log('================================================================');

// -----------------------------------------------------------------
// Suite 1: Scenario Creation & Live Draft State Isolation
// -----------------------------------------------------------------
console.log('\n📦 Suite 1: Scenario Creation & Live Draft Isolation (Req 1 & 8)');

const liveDraftState = {
  blueTeamName: 'MCU Esports',
  redTeamName: 'Bacon Time',
  blueBans: [getHero('Aoi'), getHero('Elsu')],
  redBans: [getHero('Helen'), getHero('Liliana')],
  bluePicks: [
    { hero: getHero('Capheny'), pos: 'ADL' as LaneSelectKey },
    { hero: getHero('TeeMee'), pos: 'ROAM' as LaneSelectKey },
  ],
  redPicks: [
    { hero: getHero('Violet'), pos: 'ADL' as LaneSelectKey },
    { hero: getHero('Thane'), pos: 'ROAM' as LaneSelectKey },
  ],
};

// Snapshot before simulator operations
const liveDraftSnapshotBefore = JSON.parse(JSON.stringify(liveDraftState));

// Create a scenario in simulator
const scenarioId = `sim_test_${Date.now()}`;
const newScenario = simulatorService.createNewScenario({
  id: scenarioId,
  name: 'Test Scenario BAC Match 1',
  blueTeamName: liveDraftState.blueTeamName,
  redTeamName: liveDraftState.redTeamName,
  blueBans: liveDraftState.blueBans.map((h) => ({ hero: h })),
  redBans: liveDraftState.redBans.map((h) => ({ hero: h })),
  bluePicks: liveDraftState.bluePicks.map((p) => ({ hero: p.hero, pos: p.pos })),
  redPicks: liveDraftState.redPicks.map((p) => ({ hero: p.hero, pos: p.pos })),
});

assert(newScenario.id === scenarioId, 'Simulator scenario created with unique ID');
assert(newScenario.bluePicks.length === 5, 'Default 5 pick slots initialized for Blue team');
assert(newScenario.redPicks.length === 5, 'Default 5 pick slots initialized for Red team');

// Modify simulator scenario
newScenario.bluePicks[2] = { hero: getHero('Florentino'), pos: 'DSL' };
newScenario.notes = 'Tested Florentino flank against Violet';
simulatorService.saveScenario(newScenario);

// Verify live draft state is completely untouched
const liveDraftSnapshotAfter = JSON.parse(JSON.stringify(liveDraftState));
assert(
  JSON.stringify(liveDraftSnapshotBefore) === JSON.stringify(liveDraftSnapshotAfter),
  'Requirement 8: Live draft state strictly preserved; zero mutation from simulator manipulations',
  'Live draft state was altered'
);

// -----------------------------------------------------------------
// Suite 2: Multi-Plan A/B/C Generation & Comparison
// -----------------------------------------------------------------
console.log('\n📦 Suite 2: Multi-Plan A/B/C Generation & Structure (Req 2)');

const defaultPlans = draftScenarioSimulatorService.createDefaultPlans(
  newScenario.bluePicks,
  newScenario.redPicks
);

assert(defaultPlans.length === 3, 'Requirement 2: Generates exactly 3 strategic plans (A, B, C)');
assert(defaultPlans[0].id === 'plan_a', 'Plan A ID is correctly labeled');
assert(defaultPlans[1].id === 'plan_b', 'Plan B ID is correctly labeled');
assert(defaultPlans[2].id === 'plan_c', 'Plan C ID is correctly labeled');
assert(defaultPlans[0].tacticalGoal.length > 0, 'Plan A has defined tactical goal');
assert(defaultPlans[0].keyWinCondition !== undefined, 'Plan A defines key win condition');
assert(defaultPlans[1].contingencyTrigger !== undefined, 'Plan B defines contingency trigger condition');

// -----------------------------------------------------------------
// Suite 3: Tactical Role Analysis (First Pick, Counter, Comfort, Flex)
// -----------------------------------------------------------------
console.log('\n📦 Suite 3: Tactical Role Analysis Badges (Req 3)');

const lilianaHero = getHero('Liliana');
const lilianaProfile = draftScenarioSimulatorService.analyzeHeroTacticalProfile(
  lilianaHero,
  'MID',
  'blue',
  [getHero('Violet')],
  mockPlayers
);

const isLilianaFirstPick = lilianaProfile.badges.some((b) => b.type === 'first_pick');
assert(isLilianaFirstPick, 'Liliana correctly categorized with First Pick badge in meta');
assert(
  (lilianaProfile.firstPickScore ?? 0) >= 90,
  `Liliana has high First Pick score (Score: ${lilianaProfile.firstPickScore})`
);

const omenHero = getHero('Omen');
const nakrothHero = getHero('Nakroth');
const omenProfileAgainstNakroth = draftScenarioSimulatorService.analyzeHeroTacticalProfile(
  omenHero,
  'DSL',
  'blue',
  [nakrothHero],
  mockPlayers
);

const isOmenCounter = omenProfileAgainstNakroth.badges.some((b) => b.type === 'counter_pick');
assert(isOmenCounter, 'Omen correctly detects Counter Pick advantage against Nakroth');

const overflyFlorentino = draftScenarioSimulatorService.analyzeHeroTacticalProfile(
  getHero('Florentino'),
  'DSL',
  'blue',
  [],
  mockPlayers
);
const isOverflyComfort = overflyFlorentino.badges.some((b) => b.type === 'comfort_pick');
assert(isOverflyComfort, 'Florentino recognized as MCU Overfly Signature Comfort Pick');

const richterHero = getHero('Riktor');
const richterProfile = draftScenarioSimulatorService.analyzeHeroTacticalProfile(
  richterHero,
  'DSL',
  'blue',
  [],
  mockPlayers
);
const isRichterFlex = richterProfile.badges.some((b) => b.type === 'flex_pick');
assert(isRichterFlex, 'Richter recognized as Flex Pick with multi-lane viability');
assert(
  richterProfile.flexRoles.includes('DSL') && richterProfile.flexRoles.includes('ROAM'),
  'Richter flex roles include both DSL and ROAM'
);

// -----------------------------------------------------------------
// Suite 4: Ripple Impact Simulation (Picks & Bans)
// -----------------------------------------------------------------
console.log('\n📦 Suite 4: Ripple Impact Simulation (Req 4)');

const caphenyPickImpact = draftScenarioSimulatorService.calculateRippleImpact(
  getHero('Capheny'),
  'pick',
  'blue',
  [getHero('TeeMee')],
  []
);

assert(
  caphenyPickImpact.action === 'pick',
  'Ripple impact captures action type correctly'
);
assert(
  caphenyPickImpact.unlockedTeamSynergies.length > 0,
  'Capheny pick unlocks synergistic combo synergy with TeeMee'
);
assert(
  caphenyPickImpact.tacticalImpactSummary.includes('Capheny'),
  'Tactical impact summary mentions hero name'
);

const banAoiImpact = draftScenarioSimulatorService.calculateRippleImpact(
  getHero('Aoi'),
  'ban',
  'blue',
  [],
  []
);
assert(
  banAoiImpact.deniedOpponentPicks.includes('Aoi'),
  'Banning Aoi denies high-mobility S-tier jungle option for opponent'
);

// -----------------------------------------------------------------
// Suite 5: Composition Analysis & Role Completeness
// -----------------------------------------------------------------
console.log('\n📦 Suite 5: Composition Completeness & Synergy Detection (Req 5)');

const incompleteComp = [
  { hero: getHero('Florentino'), pos: 'DSL' as LaneSelectKey },
  { hero: getHero('Aoi'), pos: 'JG' as LaneSelectKey },
  { hero: null, pos: 'MID' as LaneSelectKey },
  { hero: getHero('Capheny'), pos: 'ADL' as LaneSelectKey },
  { hero: null, pos: 'ROAM' as LaneSelectKey },
];

const compAnalysis = draftScenarioSimulatorService.analyzeComposition(incompleteComp, [
  { hero: getHero('Violet'), pos: 'ADL' },
  { hero: getHero('Thane'), pos: 'ROAM' },
]);

assert(
  compAnalysis.missingRoles.includes('MID') && compAnalysis.missingRoles.includes('ROAM'),
  'Requirement 5: Correctly detects missing MID and ROAM positions'
);
assert(
  compAnalysis.warnings.some((w) => w.includes('MID')),
  'Issues explicit tactical warning for missing MID lane'
);
assert(
  compAnalysis.strengths.length > 0,
  'Captures draft strengths from picked heroes'
);
assert(
  compAnalysis.tacticalRisks.length > 0,
  'Captures tactical vulnerabilities from missing positions'
);

// -----------------------------------------------------------------
// Suite 6: Fallback Contingency System (Primary & Secondary)
// -----------------------------------------------------------------
console.log('\n📦 Suite 6: Fallback Contingency Generation (Req 6)');

const caphenyFallback = draftScenarioSimulatorService.generateFallbacks(getHero('Capheny'), 'ADL');
assert(
  caphenyFallback.targetHero.name === 'Capheny',
  'Target hero in fallback is Capheny'
);
assert(
  caphenyFallback.primaryBackup !== null && caphenyFallback.primaryBackup.hero !== null,
  'Primary backup hero exists for Capheny'
);
assert(
  caphenyFallback.primaryBackup.reason.length > 0,
  'Primary backup provides tactical substitution rationale'
);
assert(
  caphenyFallback.secondaryBackup !== null && caphenyFallback.secondaryBackup.hero !== null,
  'Secondary backup hero exists for Capheny'
);
assert(
  caphenyFallback.primaryBackup.similarityScore >= caphenyFallback.secondaryBackup.similarityScore,
  'Primary backup has equal or higher tactical similarity than secondary backup'
);

// -----------------------------------------------------------------
// Suite 7: Dynamic Recalculation on State Adjustments
// -----------------------------------------------------------------
console.log('\n📦 Suite 7: Dynamic State Recalculation (Req 7)');

const slotStateBefore = [...incompleteComp];
const analysisBefore = draftScenarioSimulatorService.analyzeComposition(slotStateBefore, []);
assert(analysisBefore.missingRoles.length === 2, 'Before swap: 2 missing roles');

// Simulate coach selecting Liliana into MID slot
const slotStateAfter = slotStateBefore.map((s) =>
  s.pos === 'MID' ? { hero: getHero('Liliana'), pos: 'MID' as LaneSelectKey } : s
);
const analysisAfter = draftScenarioSimulatorService.analyzeComposition(slotStateAfter, []);
assert(analysisAfter.missingRoles.length === 1, 'After swap: MID resolved, only 1 missing role remains');
assert(!analysisAfter.missingRoles.includes('MID'), 'MID is no longer in missing roles');

// -----------------------------------------------------------------
// Suite 8: Strict Hero Availability Filtering
// -----------------------------------------------------------------
console.log('\n📦 Suite 8: Hero Availability Filtering (Req 9)');

const activeScenario: SimulatorScenario = {
  id: 'sim_active_filter',
  name: 'Filter Test',
  description: '',
  tags: [],
  createdAt: '',
  updatedAt: '',
  blueTeamName: 'Blue',
  redTeamName: 'Red',
  blueBans: [{ hero: getHero('Aoi') }],
  redBans: [{ hero: getHero('Helen') }],
  bluePicks: [
    { hero: getHero('Capheny'), pos: 'ADL' },
    { hero: getHero('TeeMee'), pos: 'ROAM' },
    { hero: null, pos: 'MID' },
    { hero: null, pos: 'DSL' },
    { hero: null, pos: 'JG' },
  ],
  redPicks: [
    { hero: getHero('Violet'), pos: 'ADL' },
    { hero: null, pos: 'ROAM' },
    { hero: null, pos: 'MID' },
    { hero: null, pos: 'DSL' },
    { hero: null, pos: 'JG' },
  ],
  turnIdx: 3,
  turnSel: 0,
  notes: '',
};

const unavailableHeroNames = draftScenarioSimulatorService.getUnavailableHeroNames(activeScenario);
assert(unavailableHeroNames.has('Aoi'), 'Banned hero Aoi marked unavailable');
assert(unavailableHeroNames.has('Helen'), 'Banned hero Helen marked unavailable');
assert(unavailableHeroNames.has('Capheny'), 'Picked hero Capheny marked unavailable');
assert(unavailableHeroNames.has('TeeMee'), 'Picked hero TeeMee marked unavailable');
assert(unavailableHeroNames.has('Violet'), 'Opponent picked hero Violet marked unavailable');
assert(!unavailableHeroNames.has('Liliana'), 'Unpicked/unbanned Liliana remains available');

// Get recommendations and assert NO unavailable hero appears
const recs = draftScenarioSimulatorService.getFilteredRecommendations(
  activeScenario,
  'blue',
  'MID',
  mockPlayers
);

const hasUnavailableInRecs = recs.some((r) => unavailableHeroNames.has(r.hero.name));
assert(
  !hasUnavailableInRecs,
  'Requirement 9: Recommendations strictly exclude all picked & banned heroes in scenario'
);

// -----------------------------------------------------------------
// Suite 9: Data Limitation Disclosure & Win Probability Prohibition
// -----------------------------------------------------------------
console.log('\n📦 Suite 9: Disclaimers & Tactical Fit Prohibition (Req 10)');

assert(
  SIMULATOR_DISCLAIMER.body.includes('Tactical Fit Score'),
  'Disclaimer explicitly names "Tactical Fit Score"'
);
assert(
  SIMULATOR_DISCLAIMER.body.includes('Win Probability'),
  'Disclaimer mentions Win Probability boundary'
);
assert(
  SIMULATOR_DISCLAIMER.shortNotice.includes('ไม่ใช่โอกาสชนะ'),
  'Short notice explicitly clarifies: ไม่ใช่โอกาสชนะ (Win Probability)'
);

// Check that draftScenarioSimulatorService never labels tactical score as win probability
const sampleRec = recs[0];
assert(
  sampleRec !== undefined && typeof sampleRec.tacticalFitScore === 'number',
  'Recommendation uses tacticalFitScore property'
);
assert(
  !('winProbability' in sampleRec),
  'Requirement 10: Recommendation object contains NO winProbability attribute'
);

// =================================================================
// Summary
// =================================================================
console.log('================================================================');
console.log(`🏁 Phase 5 Draft Simulator Test Summary: ${passCount} Passed, ${failCount} Failed`);
console.log('================================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 All Phase 5 Draft Scenario Simulator tests passed successfully!\n');
}
