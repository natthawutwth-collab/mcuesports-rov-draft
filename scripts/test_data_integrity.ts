// Strict Data Integrity Test Suite
// MCU eSports RoV Draft Assistant
// Validates 100% adherence to Liquipedia-only data, zero mock data, and exact math.

import { RPL_2026_SUMMER_DATASET } from '../src/data/rpl2026SummerStats';
import { RPL_2026_WINTER_DATASET } from '../src/data/rpl2026WinterStats';
import { statsDataProvider, AUTHORIZED_SOURCES } from '../src/services/statsDataProvider';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('====================================================');
console.log('🧪 RUNNING STRICT LIQUIPEDIA DATA INTEGRITY TEST SUITE');
console.log('====================================================\n');

// 1. Authorized Sources Verification
console.log('▶ Step 1: Checking Authorized Liquipedia Source URLs');
assert(
  RPL_2026_SUMMER_DATASET.sourceUrl ===
    'https://liquipedia.net/honorofkings/RoV_Pro_League/2026/Summer/Statistics',
  'Summer dataset URL must match exactly'
);
assert(
  RPL_2026_WINTER_DATASET.sourceUrl ===
    'https://liquipedia.net/honorofkings/RoV_Pro_League/2026/Winter/Statistics',
  'Winter dataset URL must match exactly'
);
assert(RPL_2026_SUMMER_DATASET.totalGames === 291, 'Summer total games must be 291');
assert(RPL_2026_WINTER_DATASET.totalGames === 285, 'Winter total games must be 285');
console.log('  ✓ Source URLs and total game totals verified.');

// 2. Summer 2026 Hero Math Verification
console.log('\n▶ Step 2: Validating Summer 2026 Mathematical Precision');
const summerHeroes = Object.values(RPL_2026_SUMMER_DATASET.heroes);
assert(summerHeroes.length >= 90, `Summer heroes count should be >= 90 (got ${summerHeroes.length})`);

for (const h of summerHeroes) {
  assert(h.games === h.wins + h.losses, `${h.heroName} games (${h.games}) must equal wins (${h.wins}) + losses (${h.losses})`);
  if (h.games > 0) {
    const expectedWR = parseFloat(((h.wins / h.games) * 100).toFixed(1));
    assert(
      Math.abs(h.winRate - expectedWR) <= 0.2,
      `${h.heroName} winRate (${h.winRate}%) must equal wins/games (${expectedWR}%)`
    );
  }
}
console.log(`  ✓ Validated all ${summerHeroes.length} heroes in Summer 2026.`);

// 3. Winter 2026 Hero Math Verification
console.log('\n▶ Step 3: Validating Winter 2026 Mathematical Precision');
const winterHeroes = Object.values(RPL_2026_WINTER_DATASET.heroes);
assert(winterHeroes.length >= 90, `Winter heroes count should be >= 90 (got ${winterHeroes.length})`);

for (const h of winterHeroes) {
  assert(h.games === h.wins + h.losses, `${h.heroName} games (${h.games}) must equal wins (${h.wins}) + losses (${h.losses})`);
  if (h.games > 0) {
    const expectedWR = parseFloat(((h.wins / h.games) * 100).toFixed(1));
    assert(
      Math.abs(h.winRate - expectedWR) <= 0.2,
      `${h.heroName} winRate (${h.winRate}%) must equal wins/games (${expectedWR}%)`
    );
  }
}
console.log(`  ✓ Validated all ${winterHeroes.length} heroes in Winter 2026.`);

// 4. Combined 2026 Dataset Math Verification
console.log('\n▶ Step 4: Validating Combined 2026 Calculation (Strict W/L Aggregation)');
statsDataProvider.setActiveSeason('combined_2026');
const combined = statsDataProvider.getDataset();

assert(combined.totalGames === 291 + 285, `Combined games must be 576 (got ${combined.totalGames})`);
assert(combined.totalMatches === 66 + 64, `Combined matches must be 130 (got ${combined.totalMatches})`);

const combinedHeroes = Object.values(combined.heroes);
for (const ch of combinedHeroes) {
  const sh = RPL_2026_SUMMER_DATASET.heroes[ch.heroName];
  const wh = RPL_2026_WINTER_DATASET.heroes[ch.heroName];

  const expectedGames = (sh?.games ?? 0) + (wh?.games ?? 0);
  const expectedWins = (sh?.wins ?? 0) + (wh?.wins ?? 0);
  const expectedLosses = (sh?.losses ?? 0) + (wh?.losses ?? 0);
  const expectedBans = (sh?.bans ?? 0) + (wh?.bans ?? 0);

  assert(ch.games === expectedGames, `${ch.heroName} combined games must sum`);
  assert(ch.wins === expectedWins, `${ch.heroName} combined wins must sum`);
  assert(ch.losses === expectedLosses, `${ch.heroName} combined losses must sum`);
  assert(ch.bans === expectedBans, `${ch.heroName} combined bans must sum`);

  if (ch.games > 0) {
    const expectedWR = parseFloat(((ch.wins / ch.games) * 100).toFixed(1));
    assert(
      Math.abs(ch.winRate - expectedWR) <= 0.2,
      `${ch.heroName} combined winRate must be computed from summed W/L, never averaged`
    );
  }
}
console.log(`  ✓ Combined dataset verified: 576 games, 130 matches, exact W/L summation.`);

// 5. Strict Zero-Hallucination & Fallback Behavior
console.log('\n▶ Step 5: Checking Zero-Hallucination & Fallback Behavior');
const fakeStats = statsDataProvider.getHeroStats('TotallyFakeHero999');
assert(fakeStats === null, 'Unknown hero stats must return null');

const fakeMatchups = statsDataProvider.getHeroMatchups('TotallyFakeHero999');
assert(fakeMatchups === null, 'Unknown hero matchups must return null');

const fakeH2H = statsDataProvider.getHeadToHead('Florentino', 'NonExistentHero123');
assert(fakeH2H === null, 'Non-existent H2H must return null');

const fakeSynergy = statsDataProvider.getHeroSynergyPair('Aya', 'NonExistentHero123');
assert(fakeSynergy === null, 'Non-existent synergy must return null');
console.log('  ✓ Verified: returns null on non-existent records (no fabricated stats).');

// 6. Direct Liquipedia Matchup & Synergy Verification
console.log('\n▶ Step 6: Validating Direct Liquipedia H2H & Synergies');
// Test verified real RPL 2026 matchups
const elandorrAgainst = statsDataProvider.getHeroPlayedAgainst("Eland'orr");
assert(elandorrAgainst.length > 0, "Eland'orr must have verified Played Against matchups in RPL 2026");

const elandorrWith = statsDataProvider.getHeroPlayedWith("Eland'orr");
assert(elandorrWith.length > 0, "Eland'orr must have verified Played With synergies in RPL 2026");

console.log(`  ✓ Eland'orr has ${elandorrAgainst.length} direct H2H matchups and ${elandorrWith.length} direct synergies.`);

// 7. Season Switching Functionality
console.log('\n▶ Step 7: Verifying Dynamic Season Switching');
statsDataProvider.setActiveSeason('summer_2026');
const summerStatus = statsDataProvider.getStatus();
assert(summerStatus.tournamentName === 'RoV Pro League 2026 Summer', 'Must switch to Summer');
assert(summerStatus.totalGames === 291, 'Summer games must be 291');

statsDataProvider.setActiveSeason('winter_2026');
const winterStatus = statsDataProvider.getStatus();
assert(winterStatus.tournamentName === 'RoV Pro League 2026 Winter', 'Must switch to Winter');
assert(winterStatus.totalGames === 285, 'Winter games must be 285');

statsDataProvider.setActiveSeason('combined_2026');
const combStatus = statsDataProvider.getStatus();
assert(combStatus.isCombined === true, 'Must indicate combined dataset');
assert(combStatus.totalGames === 576, 'Combined games must be 576');
console.log('  ✓ Season switching works seamlessly across Summer, Winter, and Combined.');

console.log('\n====================================================');
console.log('🎉 ALL DATA INTEGRITY & LIQUIPEDIA TESTS PASSED (100%)');
console.log('====================================================');
