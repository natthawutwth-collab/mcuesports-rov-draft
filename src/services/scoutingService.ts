import {
  OpponentScoutingData,
  HeroScoutingPick,
  HeroScoutingBan,
  ScoutingCombo,
  ScoutedMatch,
} from '../types/scouting';
import { DraftHistoryRecord } from '../types/draftHistory';
import { HEROES } from '../data/heroes';

// Default list of prominent RoV Pro League teams for the selector
export const VERIFIED_PRO_TEAMS = [
  'Talon',
  'Bacon Time',
  'Buriram United Esports',
  'FULL SENSE',
  'Hydra Esports',
  'eArena',
  'King of Gamers Club',
  'PSG Esports',
] as const;

export class ScoutingService {
  /**
   * Generates opponent scouting analysis purely from verified recorded draft records.
   * If records are empty or no games match the team, returns hasData: false (No Data).
   */
  public analyzeOpponent(
    teamName: string,
    allRecords: DraftHistoryRecord[],
    selectedPatch?: string
  ): OpponentScoutingData {
    const trimmedTarget = teamName.trim().toLowerCase();

    // Filter relevant matches where this team played (either as blue or red)
    let teamMatches = allRecords.filter((rec) => {
      const blueMatch = rec.blueTeam?.teamName?.trim().toLowerCase() === trimmedTarget;
      const redMatch = rec.redTeam?.teamName?.trim().toLowerCase() === trimmedTarget;
      return blueMatch || redMatch;
    });

    if (selectedPatch && selectedPatch !== 'all') {
      teamMatches = teamMatches.filter((rec) => rec.patch === selectedPatch);
    }

    // Strict No Data condition
    if (teamMatches.length === 0) {
      return {
        opponentTeam: teamName,
        patch: selectedPatch && selectedPatch !== 'all' ? selectedPatch : 'All Patches',
        sampleSize: 0,
        totalGames: 0,
        hasData: false,
        dataSource: 'Draft History Repository',
        mostPicked: [],
        mostBanned: [],
        firstPickTendencies: [],
        frequentlyUsedCombos: [],
        blueSide: { games: 0, wins: 0, losses: 0, winRate: 0, priorityHeroes: [] },
        redSide: { games: 0, wins: 0, losses: 0, winRate: 0, priorityHeroes: [] },
        matchHistory: [],
      };
    }

    // 1. Process match history
    const scoutedMatches: ScoutedMatch[] = [];
    const pickCountMap: Record<string, { games: number; wins: number; losses: number; firstPick: number; role?: string }> = {};
    const banCountMap: Record<string, { bans: number; phase1: number; phase2: number }> = {};
    const comboMap: Record<string, { heroes: string[]; games: number; wins: number; losses: number }> = {};
    const firstPickMap: Record<string, { count: number; wins: number }> = {};

    let blueGames = 0;
    let blueWins = 0;
    let redGames = 0;
    let redWins = 0;

    const bluePicksSet: Record<string, number> = {};
    const redPicksSet: Record<string, number> = {};

    teamMatches.forEach((rec) => {
      const isBlue = rec.blueTeam?.teamName?.trim().toLowerCase() === trimmedTarget;
      const oppTeam = isBlue ? rec.blueTeam : rec.redTeam;
      const opposingTeamRecord = isBlue ? rec.redTeam : rec.blueTeam;
      const opponentSide: 'blue' | 'red' = isBlue ? 'blue' : 'red';

      const won = (rec.winner === 'blue' && isBlue) || (rec.winner === 'red' && !isBlue);

      if (isBlue) {
        blueGames++;
        if (won) blueWins++;
      } else {
        redGames++;
        if (won) redWins++;
      }

      const oppHeroPicks = (oppTeam?.picks || [])
        .map((p) => p.heroName)
        .filter(Boolean);

      const oppHeroBans = (oppTeam?.bans || []).filter(Boolean);
      const opposingHeroBans = (opposingTeamRecord?.bans || []).filter(Boolean);

      // Record picks
      oppTeam?.picks?.forEach((p, idx) => {
        const hName = p.heroName?.trim();
        if (!hName) return;

        if (!pickCountMap[hName]) {
          pickCountMap[hName] = { games: 0, wins: 0, losses: 0, firstPick: 0, role: p.position };
        }
        pickCountMap[hName].games++;
        if (won) pickCountMap[hName].wins++;
        else pickCountMap[hName].losses++;

        // First pick detection: if Blue side and idx === 0 (B1) or Red side first rotation
        if ((isBlue && idx === 0) || (!isBlue && (idx === 0 || idx === 1))) {
          pickCountMap[hName].firstPick++;
          if (!firstPickMap[hName]) firstPickMap[hName] = { count: 0, wins: 0 };
          firstPickMap[hName].count++;
          if (won) firstPickMap[hName].wins++;
        }

        if (isBlue) {
          bluePicksSet[hName] = (bluePicksSet[hName] || 0) + 1;
        } else {
          redPicksSet[hName] = (redPicksSet[hName] || 0) + 1;
        }
      });

      // Bans against and by this team
      // Opponent bans (bans they placed) + Bans placed against them
      const allBansRelated = [...oppHeroBans, ...opposingHeroBans];
      allBansRelated.forEach((bName, bIdx) => {
        const clean = bName.trim();
        if (!clean) return;
        if (!banCountMap[clean]) {
          banCountMap[clean] = { bans: 0, phase1: 0, phase2: 0 };
        }
        banCountMap[clean].bans++;
        if (bIdx < 2) banCountMap[clean].phase1++;
        else banCountMap[clean].phase2++;
      });

      // Combos of 2 heroes
      for (let i = 0; i < oppHeroPicks.length; i++) {
        for (let j = i + 1; j < oppHeroPicks.length; j++) {
          const comboKey = [oppHeroPicks[i], oppHeroPicks[j]].sort().join('|');
          if (!comboMap[comboKey]) {
            comboMap[comboKey] = {
              heroes: [oppHeroPicks[i], oppHeroPicks[j]],
              games: 0,
              wins: 0,
              losses: 0,
            };
          }
          comboMap[comboKey].games++;
          if (won) comboMap[comboKey].wins++;
          else comboMap[comboKey].losses++;
        }
      }

      scoutedMatches.push({
        id: rec.id,
        tournament: rec.tournament,
        match: rec.match,
        gameNumber: rec.gameNumber,
        date: rec.createdAt ? rec.createdAt.split('T')[0] : 'N/A',
        patch: rec.patch,
        opponentTeam: teamName,
        opposingTeam: opposingTeamRecord?.teamName || (isBlue ? 'Red Side' : 'Blue Side'),
        opponentSide,
        winner: rec.winner,
        opponentWon: won,
        opponentPicks: oppTeam?.picks || [],
        opponentBans: oppHeroBans,
        opposingPicks: opposingTeamRecord?.picks || [],
        opposingBans: opposingHeroBans,
        notes: rec.notes,
      });
    });

    // 2. Format Most Picked
    const mostPicked: HeroScoutingPick[] = Object.entries(pickCountMap)
      .map(([name, data]) => {
        const hObj = HEROES.find((h) => h.name.toLowerCase() === name.toLowerCase());
        const role = data.role || (hObj ? hObj.primaryPos.toUpperCase() : 'DSL');
        const wr = data.games > 0 ? Math.round((data.wins / data.games) * 1000) / 10 : 0;
        return {
          heroName: name,
          games: data.games,
          wins: data.wins,
          losses: data.losses,
          winRate: wr,
          primaryRole: role,
          firstPickCount: data.firstPick,
        };
      })
      .sort((a, b) => b.games - a.games || b.winRate - a.winRate);

    // 3. Format Most Banned
    const totalBansCount = scoutedMatches.length;
    const mostBanned: HeroScoutingBan[] = Object.entries(banCountMap)
      .map(([name, data]) => {
        const banRate = totalBansCount > 0 ? Math.round((data.bans / totalBansCount) * 1000) / 10 : 0;
        return {
          heroName: name,
          bans: data.bans,
          banRate,
          phase1Bans: data.phase1,
          phase2Bans: data.phase2,
        };
      })
      .sort((a, b) => b.bans - a.bans)
      .slice(0, 10);

    // 4. First Pick Tendencies
    const firstPickTendencies = Object.entries(firstPickMap)
      .map(([name, data]) => {
        const pct = scoutedMatches.length > 0 ? Math.round((data.count / scoutedMatches.length) * 1000) / 10 : 0;
        const wr = data.count > 0 ? Math.round((data.wins / data.count) * 1000) / 10 : 0;
        const h = HEROES.find((item) => item.name.toLowerCase() === name.toLowerCase());
        return {
          heroName: name,
          count: data.count,
          percentage: pct,
          winRate: wr,
          role: h?.primaryPos?.toUpperCase(),
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // 5. Frequently Used Combos
    const frequentlyUsedCombos: ScoutingCombo[] = Object.values(comboMap)
      .filter((c) => c.games >= 2)
      .map((c) => {
        const wr = c.games > 0 ? Math.round((c.wins / c.games) * 1000) / 10 : 0;
        return {
          heroes: c.heroes,
          games: c.games,
          wins: c.wins,
          losses: c.losses,
          winRate: wr,
          sampleSize: c.games,
        };
      })
      .sort((a, b) => b.games - a.games || b.winRate - a.winRate)
      .slice(0, 8);

    // 6. Side patterns
    const blueTopHeroes = Object.entries(bluePicksSet)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([n]) => n);

    const redTopHeroes = Object.entries(redPicksSet)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([n]) => n);

    return {
      opponentTeam: teamName,
      patch: selectedPatch && selectedPatch !== 'all' ? selectedPatch : 'All Patches',
      sampleSize: scoutedMatches.length,
      totalGames: scoutedMatches.length,
      hasData: true,
      dataSource: 'Draft History Repository & Pro League Records',
      mostPicked,
      mostBanned,
      firstPickTendencies,
      frequentlyUsedCombos,
      blueSide: {
        games: blueGames,
        wins: blueWins,
        losses: blueGames - blueWins,
        winRate: blueGames > 0 ? Math.round((blueWins / blueGames) * 1000) / 10 : 0,
        priorityHeroes: blueTopHeroes,
      },
      redSide: {
        games: redGames,
        wins: redWins,
        losses: redGames - redWins,
        winRate: redGames > 0 ? Math.round((redWins / redGames) * 1000) / 10 : 0,
        priorityHeroes: redTopHeroes,
      },
      matchHistory: scoutedMatches.reverse(),
    };
  }
}

export const scoutingService = new ScoutingService();
