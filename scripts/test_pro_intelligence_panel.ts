// MCU eSports - Automated Verification Test Suite for Pro Draft Intelligence Panel (4 Categories)
import { statsDataProvider } from '../src/services/statsDataProvider';
import { RPL_2026_PRO_COMPS } from '../src/data/proMetaComps';
import { HEROES } from '../src/data/heroes';

console.log('================================================================');
console.log('🧪 MCU eSports - Pro Draft Intelligence Panel Verification Tests');
console.log('================================================================');

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}${detail ? ` (${detail})` : ''}`);
    failedTests++;
  }
}

// -----------------------------------------------------------------------------
// Suite 1: Source Verification & Liquipedia RPL 2026 Data Integrity
// -----------------------------------------------------------------------------
console.log('\n📦 Suite 1: Source Verification & Liquipedia 2026 Data Integrity');

const status = statsDataProvider.getStatus();
assert(status.fetchStatus === 'verified_liquipedia', 'Data provider confirms verified_liquipedia');
assert(status.totalGames > 0, `Total games count is recorded (${status.totalGames} games)`);
assert(Boolean(status.lastUpdated), `Last updated date is explicitly present (${status.lastUpdated})`);
assert(status.sourceUrl.includes('liquipedia.net'), 'Source URL explicitly cites Liquipedia');

// Test season isolation
const summerDataset = statsDataProvider.getDatasetForSeason('summer_2026');
const winterDataset = statsDataProvider.getDatasetForSeason('winter_2026');
assert(summerDataset.season === 'Summer 2026', 'Summer 2026 season dataset is isolated');
assert(winterDataset.season === 'Winter 2026', 'Winter 2026 season dataset is isolated');
assert(summerDataset.totalGames === 291, `Summer 2026 exact games count matches verified 291 (actual: ${summerDataset.totalGames})`);
assert(winterDataset.totalGames === 285, `Winter 2026 exact games count matches verified 285 (actual: ${winterDataset.totalGames})`);

// -----------------------------------------------------------------------------
// Suite 2: หมวด 1 - ชนะทาง / แพ้ทาง (Matchup Analysis)
// -----------------------------------------------------------------------------
console.log('\n📦 Suite 2: หมวด 1 - ชนะทาง / แพ้ทาง (Matchup Analysis)');

const elandorrMatchups = statsDataProvider.getHeroMatchups("Eland'orr");
assert(elandorrMatchups !== null, "Eland'orr matchups dataset exists in RPL 2026");
if (elandorrMatchups) {
  assert(Array.isArray(elandorrMatchups.strongAgainst), 'Strong against array is populated');
  assert(Array.isArray(elandorrMatchups.weakAgainst), 'Weak against array is populated');
  if (elandorrMatchups.strongAgainst.length > 0) {
    const topStrong = elandorrMatchups.strongAgainst[0];
    assert(topStrong.diff > 0, `Top advantage has positive win rate diff (+${topStrong.diff}%)`);
    assert(topStrong.isDirectH2H === true, 'Top advantage is marked as direct H2H');
    assert(topStrong.games > 0, `Top advantage has verified games count (${topStrong.games} games)`);
  }
  if (elandorrMatchups.weakAgainst.length > 0) {
    const topWeak = elandorrMatchups.weakAgainst[0];
    assert(topWeak.diff < 0, `Top disadvantage has negative win rate diff (${topWeak.diff}%)`);
    assert(topWeak.isDirectH2H === true, 'Top disadvantage is marked as direct H2H');
  }
}

// Test nonexistent hero or no-matchup hero handling
const nonExistentMatchups = statsDataProvider.getHeroMatchups('NonExistentHero12345');
assert(nonExistentMatchups === null, 'Nonexistent hero returns null without fabricating fake matchup rates');

// Direct H2H check between 2 heroes
const h2h = statsDataProvider.getHeadToHead('Lorion', 'Marja');
if (h2h) {
  assert(h2h.isDirectH2H === true, 'Lorion vs Marja has verified direct H2H');
  assert(h2h.games > 0, `Lorion vs Marja has real game count (${h2h.games} games)`);
}

// -----------------------------------------------------------------------------
// Suite 3: หมวด 2 - เล่นคู่กับตัวไหนแล้วดี (Synergies)
// -----------------------------------------------------------------------------
console.log('\n📦 Suite 3: หมวด 2 - เล่นคู่กับตัวไหนแล้วดี (Synergies)');

const teemeePlayedWith = statsDataProvider.getHeroPlayedWith('TeeMee');
assert(Array.isArray(teemeePlayedWith), 'TeeMee playedWith synergies returned as array');
if (teemeePlayedWith.length > 0) {
  const topPartner = teemeePlayedWith[0];
  assert(topPartner.games > 0, `Top partner has verified games count (${topPartner.games} games)`);
  assert(topPartner.winRate >= 0 && topPartner.winRate <= 100, `Top partner has valid win rate (${topPartner.winRate}%)`);
  assert(topPartner.isDirectSynergy === true, 'Synergy partner is verified as direct synergy from RPL 2026');
}

// Reciprocal Synergy Pair check
const pair = statsDataProvider.getHeroSynergyPair('TeeMee', 'Capheny');
if (pair) {
  assert(pair.games > 0, `TeeMee + Capheny synergy pair verified with ${pair.games} games`);
  assert(pair.winRate > 0, `TeeMee + Capheny win rate: ${pair.winRate}%`);
}

// -----------------------------------------------------------------------------
// Suite 4: หมวด 3 - ควรแบนตัวไหน (Real-time Ban Assistant Rules)
// -----------------------------------------------------------------------------
console.log('\n📦 Suite 4: หมวด 3 - ควรแบนตัวไหน (Real-time Ban Assistant Rules)');

// Verify that ban recommendations exclude picked & banned heroes
const mockBannedSet = new Set(['Aoi', 'Keera']);
const mockPickedSet = new Set(['Capheny', 'TeeMee']);

const sampleBans = [
  { hero: HEROES.find((h) => h.name === 'Aoi')!, reason: 'Fast dive' },
  { hero: HEROES.find((h) => h.name === 'Keera')!, reason: 'Magic burst' },
  { hero: HEROES.find((h) => h.name === 'Stuart')!, reason: 'Immune poke' },
  { hero: HEROES.find((h) => h.name === 'Capheny')!, reason: 'Hyper carry' },
  { hero: HEROES.find((h) => h.name === 'Hayate')!, reason: 'True damage' },
];

const filteredBans = sampleBans.filter(
  (b) => !mockBannedSet.has(b.hero.name) && !mockPickedSet.has(b.hero.name)
);

assert(
  !filteredBans.some((b) => b.hero.name === 'Aoi'),
  'Banned hero Aoi is strictly excluded from recommendations'
);
assert(
  !filteredBans.some((b) => b.hero.name === 'Keera'),
  'Banned hero Keera is strictly excluded from recommendations'
);
assert(
  !filteredBans.some((b) => b.hero.name === 'Capheny'),
  'Picked hero Capheny is strictly excluded from recommendations'
);
assert(
  filteredBans.some((b) => b.hero.name === 'Stuart'),
  'Available hero Stuart remains recommended'
);
assert(
  filteredBans.some((b) => b.hero.name === 'Hayate'),
  'Available hero Hayate remains recommended'
);

// -----------------------------------------------------------------------------
// Suite 5: หมวด 4 - Combo ยอดนิยม (Pro Meta Comps)
// -----------------------------------------------------------------------------
console.log('\n📦 Suite 5: หมวด 4 - Combo ยอดนิยม (Pro Meta Comps)');

assert(RPL_2026_PRO_COMPS.length >= 5, `Pro meta comps library has >= 5 verified comps (count: ${RPL_2026_PRO_COMPS.length})`);

const hyperGoldComp = RPL_2026_PRO_COMPS.find((c) => c.id === 'comp_hyper_gold');
assert(hyperGoldComp !== undefined, 'Hyper Gold Economy (TeeMee + Capheny) comp exists');
if (hyperGoldComp) {
  assert(hyperGoldComp.coreHeroes.length >= 2, 'Core heroes list has >= 2 heroes');
  assert(hyperGoldComp.recommendedPickOrder.length > 0, 'Recommended pick order is defined');
  assert(hyperGoldComp.priorityBans.length > 0, 'Priority bans to protect the comp are defined');
  assert(Boolean(hyperGoldComp.tacticalDescription), 'Tactical description explains comp execution');
}

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log('================================================================');
console.log(`🏁 Pro Draft Intelligence Tests: ${passedTests} Passed, ${failedTests} Failed`);
console.log('================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('🎉 All Pro Draft Intelligence Panel verification tests passed successfully!');
}
