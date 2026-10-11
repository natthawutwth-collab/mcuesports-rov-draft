/**
 * MCU eSports RoV Draft Assistant
 * Phase 4: Strategic Draft Validation Suite
 *
 * Verifies strategic draft intelligence, real RPL 2026 data alignment,
 * asymmetric side drafting (First Pick vs Counter Pick),
 * flex picks, pro team comps denial, and uncertainty disclosures.
 */

import { HEROES } from '../src/data/heroes';
import { Hero } from '../src/types/draft';
import { HeroPlayerBadge } from '../src/types/player';
import { statsDataProvider } from '../src/services/statsDataProvider';
import { analyzeCoachDraft } from '../src/services/coachAnalysisService';
import {
  getBlueSideRecommendedBans,
  getRedSideRecommendedBans,
} from '../src/services/banRecommendationService';
import { PickSlotState } from '../src/hooks/useDraconmindDraft';

function createSlots(): PickSlotState[] {
  return [
    { pos: 'DSL', order: 1, hero: null },
    { pos: 'JG', order: 2, hero: null },
    { pos: 'MID', order: 3, hero: null },
    { pos: 'ADL', order: 4, hero: null },
    { pos: 'ROAM', order: 5, hero: null },
  ];
}

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passCount++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    failCount++;
    console.error(`  ❌ [FAIL] ${testName}`);
    if (detail) console.error(`     Detail: ${detail}`);
  }
}

console.log('================================================================');
console.log('⚔️  MCU eSports RoV Draft Assistant - Phase 4 Strategic Validation');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// Scenario 1: Pro Data Source & Structural Grounding
// -----------------------------------------------------------------------------
console.log('📦 Scenario 1: Pro Data Grounding & Structure Verification');
const dataset = statsDataProvider.getDataset();
assert(dataset.totalMatches === 66, 'Matches count matches RPL 2026 Summer verified total (66 matches)');
assert(dataset.totalGames === 291, 'Games count matches RPL 2026 Summer verified total (291 games)');
assert(dataset.heroes['Sinestrea']?.presenceRate > 90, 'Sinestrea presence > 90% in RPL 2026 Summer (actual: ' + dataset.heroes['Sinestrea']?.presenceRate + '%)');
assert(dataset.heroes['Rouie']?.presenceRate > 80, 'Rouie presence > 80% in RPL 2026 Summer (actual: ' + dataset.heroes['Rouie']?.presenceRate + '%)');
assert(dataset.matchups['Marja'] !== undefined && dataset.matchups['Marja'].length > 0, 'Marja has recorded tournament matchups');
assert(Boolean(dataset.playedWith?.['Sinestrea'] && dataset.playedWith['Sinestrea'].length > 0), 'Sinestrea has recorded tournament synergies');

// -----------------------------------------------------------------------------
// Scenario 2: Blue vs Red Asymmetric First-Ban Phase
// -----------------------------------------------------------------------------
console.log('\n📦 Scenario 2: Phase 1 Ban Strategy (Blue vs Red Asymmetry)');
const emptyBans = new Set<string>();
const emptyPicks = new Set<string>();

const redPhase1Bans = getRedSideRecommendedBans(emptyBans, emptyPicks, [], [], 5);
const bluePhase1Bans = getBlueSideRecommendedBans(emptyBans, emptyPicks, [], [], 5);

// Red MUST ban Blue's First Pick monsters (Sinestrea / Rouie)
const redTopHeroNames = redPhase1Bans.map(b => b.hero.name);
assert(
  redTopHeroNames.includes('Sinestrea') && redTopHeroNames.includes('Rouie'),
  'Red Side Phase 1 bans prioritize denying Blue First Pick monsters (Sinestrea & Rouie)',
  `Red bans: ${redTopHeroNames.join(', ')}`
);
assert(
  redPhase1Bans[0].score >= 82 && redPhase1Bans[0].threatLevel === 'critical',
  'Red Side top ban has critical threat rating and score >= 82 (actual: ' + redPhase1Bans[0].score + ')'
);

// Blue bans prioritize shutting down high Red-side win rate threats
const blueTopHeroNames = bluePhase1Bans.map(b => b.hero.name);
assert(
  blueTopHeroNames.includes('Sinestrea'),
  'Blue Side also bans high-threat Red heroes (Sinestrea Red WR 68.8%)'
);
assert(
  bluePhase1Bans.some(b => b.sideContext?.includes('Red WR')),
  'Blue Side bans contain explicit Red Side tournament context'
);

// -----------------------------------------------------------------------------
// Scenario 3: First Pick vs Counter Pick & Dynamic Adjustment
// -----------------------------------------------------------------------------
console.log('\n📦 Scenario 3: First Pick & Counter Pick Dynamics');
const myPicks = createSlots();
const oppPicks = createSlots();

// Turn 0: Blue First Pick (Sinestrea and Rouie banned)
const bannedTurn0 = new Set<string>(['Sinestrea', 'Rouie']);
const firstPickAnalysis = analyzeCoachDraft({
  activeTeam: 'blue',
  myPicks,
  oppPicks,
  myBans: [],
  oppBans: [],
  allHeroes: HEROES,
  bannedHeroNames: bannedTurn0,
  pickedHeroNames: new Set<string>(),
  heroToPlayersMap: {},
  players: [],
  inspectedHero: null,
});

assert(firstPickAnalysis.suggestedPicks.length === 8, 'First pick returns 8 viable candidates');
const firstPickTop = firstPickAnalysis.suggestedPicks[0];
assert(firstPickTop.score >= 80, 'Top first-pick candidate has high rating >= 80 (Score: ' + firstPickTop.score + ')');

// Opponent locks Toro (Tank) and Qi (Fighter) in Red Pick 1 & 2
oppPicks[0].hero = HEROES.find(h => h.name === 'Toro')!;
oppPicks[1].hero = HEROES.find(h => h.name === 'Qi')!;
const pickedAfterRed = new Set<string>(['Toro', 'Qi']);

const counterPickAnalysis = analyzeCoachDraft({
  activeTeam: 'blue',
  myPicks,
  oppPicks,
  myBans: [],
  oppBans: [],
  allHeroes: HEROES,
  bannedHeroNames: bannedTurn0,
  pickedHeroNames: pickedAfterRed,
  heroToPlayersMap: {},
  players: [],
  inspectedHero: null,
});

// Candidate that counters Toro and Qi should appear with strongCounters tags
const topCounter = counterPickAnalysis.suggestedPicks[0];
assert(
  topCounter.strongCounters.length > 0,
  'Top counter pick dynamically identifies enemy targets (targets: ' + topCounter.strongCounters.join(', ') + ')'
);
assert(
  topCounter.reasons.some(r => r.includes('ชนะทาง')),
  'Top counter pick includes explicit H2H win rate evidence in reasons'
);

// -----------------------------------------------------------------------------
// Scenario 4: Missing Role Fulfillment & Flex Picks
// -----------------------------------------------------------------------------
console.log('\n📦 Scenario 4: Missing Role Fulfillment & Flex Pick Roles');
const myPicksRoles = createSlots();
myPicksRoles[0].hero = HEROES.find(h => h.name === 'Florentino')!; // DSL
myPicksRoles[1].hero = HEROES.find(h => h.name === 'Nakroth')!;    // JG
myPicksRoles[2].hero = HEROES.find(h => h.name === 'Liliana')!;    // Mid
myPicksRoles[3].hero = HEROES.find(h => h.name === 'Violet')!;     // ADL
// Missing: Support only

const flexAnalysis = analyzeCoachDraft({
  activeTeam: 'blue',
  myPicks: myPicksRoles,
  oppPicks,
  myBans: [],
  oppBans: [],
  allHeroes: HEROES,
  bannedHeroNames: bannedTurn0,
  pickedHeroNames: new Set<string>(['Florentino', 'Nakroth', 'Liliana', 'Violet', 'Toro', 'Qi']),
  heroToPlayersMap: {},
  players: [],
  inspectedHero: null,
});

assert(
  flexAnalysis.myTeamComp.missingRoles.length === 1 && flexAnalysis.myTeamComp.missingRoles[0] === 'Support',
  'Draft engine detects Support as the sole missing role'
);
assert(
  flexAnalysis.suggestedPicks.every(p => p.targetRole === 'Support'),
  'All suggested picks automatically target the missing Support role'
);

// Test Flex Pick: Annette can play both Support and Mid
// When Support is filled and Mid is missing, Annette flexes to Mid
const myPicksMidMissing = createSlots();
myPicksMidMissing[0].hero = HEROES.find(h => h.name === 'Florentino')!; // DSL
myPicksMidMissing[1].hero = HEROES.find(h => h.name === 'Nakroth')!;    // JG
myPicksMidMissing[3].hero = HEROES.find(h => h.name === 'Violet')!;     // ADL
myPicksMidMissing[4].hero = HEROES.find(h => h.name === 'Toro')!;       // Support (filled)

const flexMidAnalysis = analyzeCoachDraft({
  activeTeam: 'blue',
  myPicks: myPicksMidMissing,
  oppPicks,
  myBans: [],
  oppBans: [],
  allHeroes: HEROES,
  bannedHeroNames: bannedTurn0,
  pickedHeroNames: new Set<string>(['Florentino', 'Nakroth', 'Violet', 'Toro']),
  heroToPlayersMap: {},
  players: [],
  inspectedHero: null,
});

const annetteRec = flexMidAnalysis.suggestedPicks.find(p => p.hero.name === 'Annette');
assert(
  annetteRec !== undefined && annetteRec.targetRole === 'Mid',
  'Annette flexes cleanly to Mid when Support is already filled (targetRole: ' + annetteRec?.targetRole + ')'
);

// -----------------------------------------------------------------------------
// Scenario 5: Player Signature Priority & Denial
// -----------------------------------------------------------------------------
console.log('\n📦 Scenario 5: Player Signature Priority & Ban Denial');
const playerMapCoach: Record<string, HeroPlayerBadge[]> = {
  'Elsu': [{ playerId: 'p1', playerName: 'Erez', playerNickname: 'Erez', tier: 'signature', position: 'ADL' }],
  'Hayate': [{ playerId: 'p1', playerName: 'Erez', playerNickname: 'Erez', tier: 'comfortable', position: 'ADL' }]
};

const sigAnalysis = analyzeCoachDraft({
  activeTeam: 'blue',
  myPicks,
  oppPicks,
  myBans: [],
  oppBans: [],
  allHeroes: HEROES,
  bannedHeroNames: bannedTurn0,
  pickedHeroNames: pickedAfterRed,
  heroToPlayersMap: playerMapCoach,
  players: [],
  inspectedHero: null,
});

const elsuPick = sigAnalysis.suggestedPicks.find(p => p.hero.name === 'Elsu');
const hayatePick = sigAnalysis.suggestedPicks.find(p => p.hero.name === 'Hayate');
assert(elsuPick !== undefined && elsuPick.playerFits.some(f => f.tier === 'signature'), 'Signature hero Elsu detected with signature badge');
assert(hayatePick !== undefined && hayatePick.playerFits.some(f => f.tier === 'comfortable'), 'Comfortable hero Hayate detected with comfortable badge');
assert(
  (elsuPick?.score ?? 0) > (hayatePick?.score ?? 0),
  `Signature hero score strictly outranks Comfortable hero score (Elsu: ${elsuPick?.score} vs Hayate: ${hayatePick?.score})`
);

// Opponent signature ban check
const oppMap = {
  'Florentino': [{ playerNickname: 'Overfly', tier: 'signature' as const, position: 'DSL' }]
};
const blueBansOppSig = getBlueSideRecommendedBans(new Set(), new Set(), [], [], 5, oppMap);
const florBan = blueBansOppSig.find(b => b.hero.name === 'Florentino');
assert(florBan !== undefined, 'Opponent signature hero Florentino appears in top bans');
assert(florBan?.categoryType === 'opp_player_signature', 'Ban category classified as opp_player_signature');
assert(Boolean(florBan?.reason.includes('Overfly')), 'Ban reason explicitly credits player nickname Overfly');

// -----------------------------------------------------------------------------
// Scenario 6: Pro Combo Denial in Phase 2 Bans
// -----------------------------------------------------------------------------
console.log('\n📦 Scenario 6: Pro Meta Combo Denial in Phase 2 Bans');
// Enemy (Red) drafted TeeMee and Capheny (Core of Hyper Gold Economy)
const enemyRedPicks = ['TeeMee', 'Capheny'];
const friendlyBluePicks = ['Hayate', 'Toro', 'Qi'];
const currentBans = new Set<string>(['Sinestrea', 'Rouie']);
const currentPicks = new Set<string>(['TeeMee', 'Capheny', 'Hayate', 'Toro', 'Qi']);

const phase2Bans = getBlueSideRecommendedBans(currentBans, currentPicks, friendlyBluePicks, enemyRedPicks, 8);
const comboBan = phase2Bans.find(b => b.deniesOppCombo !== undefined);
assert(comboBan !== undefined, 'Phase 2 ban detects opponent pro combo synergy (deniesOppCombo found)');
assert(
  phase2Bans.some(b => b.hero.name === 'Lorion' || b.hero.name === 'Billow'),
  'High threat synergy piece against TeeMee / Capheny recommended in Phase 2 bans'
);

// -----------------------------------------------------------------------------
// Scenario 7: Transparent Disclosure of Sample Size & Missing Data
// -----------------------------------------------------------------------------
console.log('\n📦 Scenario 7: Missing Data & Low Sample Size Disclosures');
// Inspect a hero with low game count in RPL 2026 (e.g. Roxie: 6 games)
const roxieStats = statsDataProvider.getHeroStats('Roxie');
assert(roxieStats !== null && roxieStats.games < 10, 'Roxie confirmed as low sample hero in dataset (games: ' + roxieStats?.games + ')');

// Non-existent tournament hero (e.g. Astrid)
const astridStats = statsDataProvider.getHeroStats('Astrid');
assert(astridStats === null, 'Hero without RPL games returns null without fabricating 0% win rate');

console.log('\n================================================================');
console.log(`🏁 Phase 4 Strategic Validation Summary: ${passCount} Passed, ${failCount} Failed`);
console.log('================================================================\n');

if (failCount > 0) {
  process.exit(1);
}
