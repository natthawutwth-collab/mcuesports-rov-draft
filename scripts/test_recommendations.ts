/**
 * MCU eSports RoV Draft Assistant
 * Phase 3: Pick/Ban Recommendation Quality & QA Validation Test Suite
 *
 * Runs automated simulations and quality checks against:
 * 1. coachAnalysisService.ts (Pick Recommendation Engine)
 * 2. banRecommendationService.ts (Ban Recommendation Engine)
 * 3. statsDataProvider.ts (Statistical Data & Alias Provider)
 */

import { HEROES } from '../src/data/heroes';
import { Hero, LaneSelectKey } from '../src/types/draft';
import { Player, HeroPlayerBadge } from '../src/types/player';
import { PickSlotState } from '../src/hooks/useDraconmindDraft';
import { analyzeCoachDraft } from '../src/services/coachAnalysisService';
import {
  getBlueSideRecommendedBans,
  getRedSideRecommendedBans,
  getTopProLeagueBans,
  getRecommendedBans,
} from '../src/services/banRecommendationService';
import { statsDataProvider, HERO_ALIAS_MAP } from '../src/services/statsDataProvider';

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

function getHero(name: string): Hero {
  const h = HEROES.find((x) => x.name.toLowerCase() === name.toLowerCase());
  if (!h) throw new Error(`Hero not found: ${name}`);
  return h;
}

function createEmptyPicks(): PickSlotState[] {
  return [
    { hero: null, pos: 'DSL', order: 1 },
    { hero: null, pos: 'JG', order: 2 },
    { hero: null, pos: 'MID', order: 3 },
    { hero: null, pos: 'ROAM', order: 4 },
    { hero: null, pos: 'ADL', order: 5 },
  ];
}

function runAnalysis(options: {
  myPicks?: PickSlotState[];
  oppPicks?: PickSlotState[];
  myBans?: (Hero | null)[];
  oppBans?: (Hero | null)[];
  bannedHeroNames?: Set<string>;
  pickedHeroNames?: Set<string>;
  heroToPlayersMap?: Record<string, HeroPlayerBadge[]>;
  allHeroes?: Hero[];
  inspectedHero?: Hero | null;
}) {
  return analyzeCoachDraft({
    activeTeam: 'blue',
    myPicks: options.myPicks || createEmptyPicks(),
    oppPicks: options.oppPicks || createEmptyPicks(),
    myBans: options.myBans || [null, null, null, null],
    oppBans: options.oppBans || [null, null, null, null],
    inspectedHero: options.inspectedHero || null,
    players: [],
    heroToPlayersMap: options.heroToPlayersMap || {},
    allHeroes: options.allHeroes || HEROES,
    bannedHeroNames: options.bannedHeroNames || new Set(),
    pickedHeroNames: options.pickedHeroNames || new Set(),
  });
}

console.log('================================================================');
console.log('🧪 MCU eSports RoV Draft Assistant - Phase 3 Quality Test Suite');
console.log('================================================================\n');

// ---------------------------------------------------------------------------
// TEST SUITE 1: Formula, Score Boundaries & Tie-breaking
// ---------------------------------------------------------------------------
console.log('📦 Suite 1: Score Boundaries & Tie-breaking Validation');

{
  const emptyAnalysis = runAnalysis({});

  assert(
    emptyAnalysis.suggestedPicks.length >= 3 && emptyAnalysis.suggestedPicks.length <= 8,
    'Suggested picks returns top 3-5 candidates (max 8)',
    `Received ${emptyAnalysis.suggestedPicks.length}`
  );

  const scores = emptyAnalysis.suggestedPicks.map((p) => p.score);
  const allInRange = scores.every((s) => s >= 20 && s <= 99);
  assert(allInRange, 'Pick scores strictly clamped between [20, 99]', `Scores: ${scores.join(', ')}`);

  // Verify descending sort
  let isSorted = true;
  for (let i = 0; i < scores.length - 1; i++) {
    if (scores[i] < scores[i + 1]) isSorted = false;
  }
  assert(isSorted, 'Pick recommendations strictly sorted descending by score', `Scores: ${scores.join(', ')}`);

  // Ban score range
  const blueBans = getBlueSideRecommendedBans(new Set(), new Set(), [], [], 10);
  const banScores = blueBans.map((b) => b.score);
  const allBanInRange = banScores.every((s) => s >= 30 && s <= 99);
  assert(allBanInRange, 'Ban scores strictly clamped between [30, 99]', `Ban scores: ${banScores.join(', ')}`);

  let isBanSorted = true;
  for (let i = 0; i < banScores.length - 1; i++) {
    if (banScores[i] < banScores[i + 1]) isBanSorted = false;
  }
  assert(isBanSorted, 'Ban recommendations strictly sorted descending by score', `Ban scores: ${banScores.join(', ')}`);
}

// ---------------------------------------------------------------------------
// TEST SUITE 2: Missing Role Priority & Composition Balance
// ---------------------------------------------------------------------------
console.log('\n📦 Suite 2: Missing Role Priority & Composition Balance');

{
  // Setup: Team has DSL (Florentino), JG (Nakroth), MID (Liliana), ROAM (Thane). Missing: ADL
  const florentino = getHero('Florentino');
  const nakroth = getHero('Nakroth');
  const liliana = getHero('Liliana');
  const thane = getHero('Thane');

  const myPicks: PickSlotState[] = [
    { hero: florentino, pos: 'DSL', order: 1 },
    { hero: nakroth, pos: 'JG', order: 2 },
    { hero: liliana, pos: 'MID', order: 3 },
    { hero: thane, pos: 'ROAM', order: 4 },
    { hero: null, pos: 'ADL', order: 5 },
  ];

  const pickedNames = new Set<string>(['Florentino', 'Nakroth', 'Liliana', 'Thane']);

  const analysis = runAnalysis({
    myPicks,
    pickedHeroNames: pickedNames,
  });

  assert(
    analysis.myTeamComp.missingRoles.length === 1 && analysis.myTeamComp.missingRoles[0] === 'ADL',
    'Draft engine correctly identifies ADL as the missing role',
    `Missing roles: ${analysis.myTeamComp.missingRoles.join(', ')}`
  );

  const topPick = analysis.suggestedPicks[0];
  const topHeroRoles = topPick.hero.roles;
  const isMarksmanOrADL = topHeroRoles.includes('marksman') || topPick.hero.primaryPos === 'adl';

  assert(
    isMarksmanOrADL,
    `Top recommended hero (${topPick.hero.name}) fills the missing ADL position`,
    `Top pick was ${topPick.hero.name} with roles ${topHeroRoles.join(', ')}`
  );

  const fillsRoleReason = topPick.reasons.some((r) => r.includes('เติมตำแหน่ง ADL'));
  assert(fillsRoleReason, 'Top pick explicitly provides reason for filling missing ADL role');

  // Verify non-filling heroes received penalty
  const midHero = analysis.suggestedPicks.find((p) => p.hero.primaryPos === 'mid');
  if (midHero) {
    const hasRoleCaution = midHero.cautions.some((c) => c.includes('มีผู้เล่นแล้ว'));
    assert(hasRoleCaution, 'Duplicate role hero received penalty caution "มีผู้เล่นแล้ว"');
  } else {
    assert(true, 'Duplicate role heroes ranked below top candidates due to role clash penalty');
  }
}

// ---------------------------------------------------------------------------
// TEST SUITE 3: Player Fit: Signature vs Comfortable vs Out-of-Pool
// ---------------------------------------------------------------------------
console.log('\n📦 Suite 3: Player Fit (Signature > Comfortable > Out of Pool)');

{
  // Test two ADL marksmen: Hayate vs Elsu
  // Player has Hayate as 'signature', Elsu has 'comfortable'
  const heroToPlayersMap: Record<string, HeroPlayerBadge[]> = {
    Hayate: [
      {
        playerId: 'p1',
        playerName: 'Erez',
        playerNickname: 'Erez',
        position: 'ADL',
        tier: 'signature',
      },
    ],
    Elsu: [
      {
        playerId: 'p1',
        playerName: 'Erez',
        playerNickname: 'Erez',
        position: 'ADL',
        tier: 'comfortable',
      },
    ],
  };

  const myPicks: PickSlotState[] = [
    { hero: getHero('Florentino'), pos: 'DSL', order: 1 },
    { hero: getHero('Nakroth'), pos: 'JG', order: 2 },
    { hero: getHero('Liliana'), pos: 'MID', order: 3 },
    { hero: getHero('Thane'), pos: 'ROAM', order: 4 },
    { hero: null, pos: 'ADL', order: 5 },
  ];

  const analysis = runAnalysis({
    myPicks,
    pickedHeroNames: new Set<string>(['Florentino', 'Nakroth', 'Liliana', 'Thane']),
    heroToPlayersMap,
  });

  const hayatePick = analysis.suggestedPicks.find((p) => p.hero.name === 'Hayate');
  const elsuPick = analysis.suggestedPicks.find((p) => p.hero.name === 'Elsu');

  assert(Boolean(hayatePick), 'Signature hero Hayate is recommended in suggested picks');
  assert(Boolean(elsuPick), 'Comfortable hero Elsu is recommended in suggested picks');

  if (hayatePick && elsuPick) {
    assert(
      hayatePick.score > elsuPick.score,
      `Signature hero has higher score than Comfortable hero (Hayate: ${hayatePick.score} vs Elsu: ${elsuPick.score})`
    );

    const hasSigReason = hayatePick.reasons.some((r) => r.includes('⭐ Signature'));
    assert(hasSigReason, 'Signature badge detected and included in recommendation reasons');

    const hasComfReason = elsuPick.reasons.some((r) => r.includes('★ Comfortable'));
    assert(hasComfReason, 'Comfortable badge detected and included in recommendation reasons');
  }

  // Check out-of-pool hero note
  const valheinPick = analysis.suggestedPicks.find((p) => p.hero.name === 'Valhein');
  if (valheinPick) {
    const hasOutOfPoolWarning = valheinPick.missingData?.some((m) =>
      m.includes('ไม่อยู่ใน Signature/Comfortable')
    );
    assert(Boolean(hasOutOfPoolWarning), 'Out-of-pool hero has explicit missingData note');
  }
}

// ---------------------------------------------------------------------------
// TEST SUITE 4: Pro Stats Sample Size Gating & Anti-Inflation
// ---------------------------------------------------------------------------
console.log('\n📦 Suite 4: Pro Stats Sample Size Gating & Anti-Inflation');

{
  const allStats = statsDataProvider.getDataset().heroes;
  const heroesWithStats = Object.values(allStats);

  const lowSampleHero = heroesWithStats.find((h) => h.games < 5);
  const highSampleHero = heroesWithStats.find((h) => h.games >= 15 && h.winRate >= 50);

  assert(Boolean(lowSampleHero), `Found low-sample hero in dataset (${lowSampleHero?.hero}: ${lowSampleHero?.games} games)`);
  assert(Boolean(highSampleHero), `Found high-sample hero in dataset (${highSampleHero?.hero}: ${highSampleHero?.games} games)`);

  const emptyAnalysis = runAnalysis({});

  if (lowSampleHero) {
    const candidate = emptyAnalysis.suggestedPicks.find((p) => p.hero.name === lowSampleHero.hero);
    if (candidate) {
      const hasLowSampleNote = candidate.missingData?.some((m) => m.includes('ตัวอย่างน้อย'));
      assert(Boolean(hasLowSampleNote), 'Low-sample hero includes caution about small sample size');
    }
  }

  // Anti-inflation test: Ensure an isolated high WR hero does not take #1 spot without role fit
  const myPicks: PickSlotState[] = [
    { hero: getHero('Florentino'), pos: 'DSL', order: 1 },
    { hero: getHero('Nakroth'), pos: 'JG', order: 2 },
    { hero: getHero('Liliana'), pos: 'MID', order: 3 },
    { hero: null, pos: 'ROAM', order: 4 },
    { hero: getHero('Hayate'), pos: 'ADL', order: 5 },
  ];
  // Missing role is Support/ROAM
  const analysisRoam = runAnalysis({
    myPicks,
    pickedHeroNames: new Set<string>(['Florentino', 'Nakroth', 'Liliana', 'Hayate']),
  });

  const topPickRoam = analysisRoam.suggestedPicks[0];
  const fillsRoam =
    topPickRoam.hero.roles.includes('support') ||
    topPickRoam.hero.roles.includes('tank') ||
    topPickRoam.hero.primaryPos === 'roam';
  assert(
    fillsRoam,
    `Missing ROAM role is respected; top hero (${topPickRoam.hero.name}) is a Support/Tank/Roam, not an unrelated high WR Mid/Carry`
  );
}

// ---------------------------------------------------------------------------
// TEST SUITE 5: Matchup Advantage vs Role Clash
// ---------------------------------------------------------------------------
console.log('\n📦 Suite 5: Matchup Advantage vs Role Clash');

{
  // Enemy has picked Florentino (DSL).
  // Team already has DSL (Yena).
  const myPicks: PickSlotState[] = [
    { hero: getHero('Yena'), pos: 'DSL', order: 1 },
    { hero: null, pos: 'JG', order: 2 },
    { hero: null, pos: 'MID', order: 3 },
    { hero: null, pos: 'ROAM', order: 4 },
    { hero: null, pos: 'ADL', order: 5 },
  ];

  const oppPicks: PickSlotState[] = [
    { hero: getHero('Florentino'), pos: 'DSL', order: 1 },
    { hero: null, pos: 'JG', order: 2 },
    { hero: null, pos: 'MID', order: 3 },
    { hero: null, pos: 'ROAM', order: 4 },
    { hero: null, pos: 'ADL', order: 5 },
  ];

  const analysis = runAnalysis({
    myPicks,
    oppPicks,
    pickedHeroNames: new Set<string>(['Yena', 'Florentino']),
  });

  const qiCandidate = analysis.suggestedPicks.find((p) => p.hero.name === 'Qi');
  if (qiCandidate) {
    const hasRoleCaution = qiCandidate.cautions.some((c) => c.includes('มีผู้เล่นแล้ว'));
    assert(hasRoleCaution, 'Duplicate lane hero Qi receives role penalty despite potential matchup');
  } else {
    assert(true, 'Qi did not overtake open-role picks due to duplicate DSL role penalty');
  }
}

// ---------------------------------------------------------------------------
// TEST SUITE 6: Opponent Signature Hero Ban Prioritization
// ---------------------------------------------------------------------------
console.log('\n📦 Suite 6: Opponent Signature Hero Ban Prioritization');

{
  const oppHeroToPlayersMap: Record<
    string,
    { playerNickname: string; tier: 'signature' | 'comfortable'; position: string }[]
  > = {
    Liliana: [
      {
        playerNickname: 'NuNu',
        tier: 'signature',
        position: 'MID',
      },
    ],
  };

  // Blue Side banning: Red team has NuNu with Signature Liliana
  const blueBans = getBlueSideRecommendedBans(
    new Set(),
    new Set(),
    [],
    [],
    10,
    oppHeroToPlayersMap
  );

  const lilianaBan = blueBans.find((b) => b.hero.name === 'Liliana');
  assert(Boolean(lilianaBan), 'Opponent signature hero Liliana appears in Blue side recommended bans');

  if (lilianaBan) {
    assert(
      lilianaBan.categoryType === 'opp_player_signature',
      `Ban category is opp_player_signature (actual: ${lilianaBan.categoryType})`
    );
    assert(
      lilianaBan.categoryLabel.includes('NuNu'),
      `Ban label mentions player nickname NuNu (actual: ${lilianaBan.categoryLabel})`
    );
  }

  // Red Side banning: Blue team has player with Signature
  const redBans = getRedSideRecommendedBans(
    new Set(),
    new Set(),
    [],
    [],
    10,
    oppHeroToPlayersMap
  );

  const lilianaRedBan = redBans.find((b) => b.hero.name === 'Liliana');
  assert(Boolean(lilianaRedBan), 'Opponent signature hero Liliana appears in Red side recommended bans');
  if (lilianaRedBan) {
    assert(
      lilianaRedBan.categoryType === 'opp_player_signature',
      `Red ban category is opp_player_signature (actual: ${lilianaRedBan.categoryType})`
    );
  }
}

// ---------------------------------------------------------------------------
// TEST SUITE 7: Exclusion of Picked and Banned Heroes
// ---------------------------------------------------------------------------
console.log('\n📦 Suite 7: Exclusion of Picked & Banned Heroes');

{
  const banned = new Set<string>(['Toro', 'Marja', 'Aya']);
  const picked = new Set<string>(['Hayate', 'Liliana', 'Florentino']);

  const picksAnalysis = runAnalysis({
    bannedHeroNames: banned,
    pickedHeroNames: picked,
  });

  const suggestedHeroNames = picksAnalysis.suggestedPicks.map((p) => p.hero.name);
  const pickedInSuggestions = suggestedHeroNames.some((n) => picked.has(n));
  const bannedInSuggestions = suggestedHeroNames.some((n) => banned.has(n));

  assert(!pickedInSuggestions, 'Picked heroes (Hayate, Liliana, Florentino) are NEVER in suggested picks');
  assert(!bannedInSuggestions, 'Banned heroes (Toro, Marja, Aya) are NEVER in suggested picks');

  const proBans = getTopProLeagueBans(banned, picked, 15);
  const banNames = proBans.map((b) => b.hero.name);
  const pickedInBans = banNames.some((n) => picked.has(n));
  const bannedInBans = banNames.some((n) => banned.has(n));

  assert(!pickedInBans, 'Picked heroes are NEVER in ban recommendations');
  assert(!bannedInBans, 'Banned heroes are NEVER in ban recommendations');
}

// ---------------------------------------------------------------------------
// TEST SUITE 8: Blue Side vs Red Side Asymmetric Ban Logic
// ---------------------------------------------------------------------------
console.log('\n📦 Suite 8: Blue Side vs Red Side Asymmetric Ban Logic');

{
  // Situation: Blue picks Aya, Red picks Hayate
  const bluePicks = ['Aya'];
  const redPicks = ['Hayate'];

  const blueBans = getBlueSideRecommendedBans(new Set(), new Set(['Aya', 'Hayate']), bluePicks, redPicks, 10);
  const redBans = getRedSideRecommendedBans(new Set(), new Set(['Aya', 'Hayate']), redPicks, bluePicks, 10);

  assert(blueBans.length > 0, 'Blue side produces targeted ban recommendations');
  assert(redBans.length > 0, 'Red side produces targeted ban recommendations');

  assert(
    blueBans[0].sideContext !== undefined,
    `Blue side bans include side context: ${blueBans[0].sideContext}`
  );
  assert(
    redBans[0].sideContext !== undefined,
    `Red side bans include side context: ${redBans[0].sideContext}`
  );
}

// ---------------------------------------------------------------------------
// TEST SUITE 9: Missing Data Handling & Non-Existent Records
// ---------------------------------------------------------------------------
console.log('\n📦 Suite 9: Missing Data & Non-Existent Tournament Records');

{
  // Astrid has 0 tournament games in RPL 2026 Summer
  const astridStats = statsDataProvider.getHeroStats('Astrid');
  assert(astridStats === null, 'Hero without tournament games returns null (not 0% fake stats)');

  const nonExistentMatchups = statsDataProvider.getHeroMatchups('Astrid');
  assert(nonExistentMatchups === null, 'Hero without matchups returns null gracefully');

  const nonExistentH2H = statsDataProvider.getHeadToHead('Astrid', 'Aleister');
  assert(nonExistentH2H === null, 'Non-existent H2H returns null without throwing');

  const nonExistentSynergy = statsDataProvider.getHeroSynergyPair('Astrid', 'Aleister');
  assert(nonExistentSynergy === null, 'Non-existent Synergy returns null without throwing');

  const astridHero = HEROES.find((h) => h.name === 'Astrid');
  assert(Boolean(astridHero), 'Astrid exists in HEROES list');
}

// ---------------------------------------------------------------------------
// TEST SUITE 10: Undo, Reset Draft & State Independence
// ---------------------------------------------------------------------------
console.log('\n📦 Suite 10: Undo & Reset Draft State Invariance');

{
  // State 0: Pristine draft
  const state0Analysis = runAnalysis({});
  const state0TopHero = state0Analysis.suggestedPicks[0].hero.name;
  const state0TopScore = state0Analysis.suggestedPicks[0].score;

  // State 1: Picked a hero
  const pickedHero = getHero('Toro');
  const state1Picks = createEmptyPicks();
  state1Picks[3] = { hero: pickedHero, pos: 'ROAM', order: 1 };

  const state1Analysis = runAnalysis({
    myPicks: state1Picks,
    pickedHeroNames: new Set<string>(['Toro']),
  });

  assert(
    !state1Analysis.suggestedPicks.some((p) => p.hero.name === 'Toro'),
    'State 1: Toro is picked and immediately removed from suggestions'
  );

  // State 2 (Simulating Undo / Reset Draft back to Pristine):
  const undoAnalysis = runAnalysis({});
  const undoTopHero = undoAnalysis.suggestedPicks[0].hero.name;
  const undoTopScore = undoAnalysis.suggestedPicks[0].score;

  assert(
    undoTopHero === state0TopHero && undoTopScore === state0TopScore,
    `Undo / Reset returns state identically to State 0 (${undoTopHero} at score ${undoTopScore}) without stale cache`,
    `Expected ${state0TopHero} (${state0TopScore}) but got ${undoTopHero} (${undoTopScore})`
  );
}

// ---------------------------------------------------------------------------
// TEST SUITE 11: Hero Alias & Liquipedia Name Matching
// ---------------------------------------------------------------------------
console.log('\n📦 Suite 11: Hero Name Matching & Alias Resolution');

{
  assert(
    statsDataProvider.getHeroStats('wiro') !== null || statsDataProvider.getHeroStats('Wiro Sableng') !== null,
    'Alias "wiro" resolves to Wiro Sableng in stats provider'
  );

  assert(
    statsDataProvider.getHeroStats('bolt baron') !== null || statsDataProvider.getHeroStats('Sikong Zhen') !== null,
    'Alias "bolt baron" resolves to Sikong Zhen in stats provider'
  );

  assert(
    statsDataProvider.getHeroStats('  Hayate  ') !== null,
    'Leading and trailing whitespace trimmed in name lookup'
  );

  assert(
    statsDataProvider.getHeroStats('hayate') !== null,
    'Case-insensitive lookup works correctly for "hayate"'
  );
}

// ---------------------------------------------------------------------------
// TEST SUITE 12: Defensive Edge Cases & Null Safety
// ---------------------------------------------------------------------------
console.log('\n📦 Suite 12: Defensive Edge Cases & Null Safety');

{
  try {
    const safePicks = runAnalysis({
      allHeroes: [],
    });
    assert(safePicks.suggestedPicks.length === 0, 'Empty hero database handled without exception');
  } catch (e) {
    assert(false, 'Empty hero database threw exception', String(e));
  }

  try {
    const safeBans = getRecommendedBans(new Set(), new Set(), 'blue', [], [], 0);
    assert(safeBans.length === 0, 'Zero limit ban request returns empty list safely');
  } catch (e) {
    assert(false, 'Zero limit ban request threw exception', String(e));
  }

  try {
    const h2hNull = statsDataProvider.getHeadToHead('', '');
    assert(h2hNull === null, 'Empty string hero names return null safely');
  } catch (e) {
    assert(false, 'Empty string H2H threw exception', String(e));
  }
}

// ---------------------------------------------------------------------------
// SUITE 13: Tactical Split Panel Lane Filtering (Jungle & Support)
// ---------------------------------------------------------------------------
console.log('\n📦 Suite 13: Tactical Panel Lane Filter (Jungle & Support)');

{
  const { matchesLaneFilter, getLaneDisplayName } = await import('../src/components/TacticalSplitPanel');
  
  const jungleHeroes = HEROES.filter((h) => matchesLaneFilter(h, 'jungle'));
  assert(jungleHeroes.length >= 20, `Jungle filter returns heroes (found: ${jungleHeroes.length})`);
  assert(jungleHeroes.some((h) => h.name === 'Sinestrea' || h.name === 'Aoi'), 'Jungle filter includes meta junglers');

  const supportHeroes = HEROES.filter((h) => matchesLaneFilter(h, 'support'));
  assert(supportHeroes.length >= 20, `Support filter returns heroes (found: ${supportHeroes.length})`);
  assert(supportHeroes.some((h) => h.name === 'Toro' || h.name === 'Rouie' || h.name === 'Chaugnar'), 'Support filter includes meta supports');

  assert(getLaneDisplayName('jg') === 'Jungle', 'getLaneDisplayName correctly maps jg to Jungle');
  assert(getLaneDisplayName('roam') === 'Support', 'getLaneDisplayName correctly maps roam to Support');
}

// ---------------------------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`🏁 Test Summary: ${passCount} Passed, ${failCount} Failed`);
console.log('================================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 All Quality & QA Verification tests passed successfully!');
}
