import { ScrimSession, ScrimGame } from '../types/scrim';
import {
  ScrimAnalyticsFilter,
  WinRateStat,
  OverallPerformance,
  SidePerformance,
  HeroPositionPerformance,
  PlayerHeroPerformance,
  PlayerOverallSummary,
  HeroComboStat,
  DraftVsOutcomeComparison,
  MissingDataAuditItem,
  ScrimAnalyticsReport,
} from '../types/scrimAnalytics';
import { LaneSelectKey } from '../types/draft';

/**
 * Calculates win rate percentage safely clamped and rounded to 1 decimal place
 */
export function calculateWinRate(wins: number, decidedGames: number): number {
  if (decidedGames <= 0) return 0;
  return Math.round((wins / decidedGames) * 1000) / 10;
}

/**
 * Formats a clean, readable mathematical formula displaying the explicit denominator
 * Example: "8 / 12 เกม (66.7%)"
 */
export function formatFormulaDisplay(wins: number, decidedGames: number, winRate: number): string {
  if (decidedGames <= 0) return '0 / 0 เกม (0.0%)';
  return `${wins} / ${decidedGames} เกม (${winRate.toFixed(1)}%)`;
}

/**
 * Pure helper to build a WinRateStat object
 */
export function buildWinRateStat(wins: number, losses: number, draws: number, totalGames: number): WinRateStat {
  const decidedGames = wins + losses;
  const winRate = calculateWinRate(wins, decidedGames);
  const formulaDisplay = formatFormulaDisplay(wins, decidedGames, winRate);
  return {
    wins,
    losses,
    draws,
    totalGames,
    decidedGames,
    winRate,
    formulaDisplay,
  };
}

export class ScrimAnalyticsService {
  /**
   * Filters scrim sessions and individual games by user-specified criteria
   */
  public filterSessions(
    sessions: ScrimSession[],
    filter: ScrimAnalyticsFilter
  ): { filteredSessions: ScrimSession[]; filteredGames: ScrimGame[] } {
    const opponentLower = filter.opponent && filter.opponent !== 'all' ? filter.opponent.trim().toLowerCase() : null;
    const playerLower = filter.player && filter.player !== 'all' ? filter.player.trim().toLowerCase() : null;
    const sideFilter = filter.side && filter.side !== 'all' ? filter.side : null;
    const planQuery = filter.planSearch ? filter.planSearch.trim().toLowerCase() : null;

    const filteredSessions: ScrimSession[] = [];
    const filteredGames: ScrimGame[] = [];

    sessions.forEach((s) => {
      // 1. Date Range Check
      if (filter.dateFrom && s.sessionDate < filter.dateFrom) return;
      if (filter.dateTo && s.sessionDate > filter.dateTo) return;

      // 2. Opponent Check
      if (opponentLower && s.opponentTeam.trim().toLowerCase() !== opponentLower) {
        return;
      }

      // Filter games within this session
      const matchedGames = s.games.filter((g) => {
        // Side filter
        if (sideFilter && g.ourSide !== sideFilter) {
          return false;
        }

        // Plan query (check sessionTitle, coachNotes objective or lessons)
        if (planQuery) {
          const inSessionTitle = s.sessionTitle.toLowerCase().includes(planQuery);
          const inObjective = g.coachNotes?.draftObjective?.toLowerCase().includes(planQuery);
          const inLessons = g.coachNotes?.lessonsLearned?.toLowerCase().includes(planQuery);
          const inWhatWentWell = g.coachNotes?.whatWentWell?.toLowerCase().includes(planQuery);
          if (!inSessionTitle && !inObjective && !inLessons && !inWhatWentWell) {
            return false;
          }
        }

        // Player filter
        if (playerLower) {
          const ourPicks = g.ourSide === 'blue' ? g.bluePicks : g.redPicks;
          const hasPlayer = ourPicks?.some((p) => {
            const nick = p.playerNickname?.toLowerCase() || '';
            const name = p.playerName?.toLowerCase() || '';
            const id = p.playerId?.toLowerCase() || '';
            return nick.includes(playerLower) || name.includes(playerLower) || id.includes(playerLower);
          });
          if (!hasPlayer) return false;
        }

        return true;
      });

      if (matchedGames.length > 0) {
        filteredSessions.push({
          ...s,
          games: matchedGames,
        });
        matchedGames.forEach((mg) => filteredGames.push(mg));
      }
    });

    return { filteredSessions, filteredGames };
  }

  /**
   * Generates comprehensive Team Performance Analytics report
   */
  public generateReport(
    sessions: ScrimSession[],
    filter: ScrimAnalyticsFilter = {}
  ): ScrimAnalyticsReport {
    const { filteredSessions, filteredGames } = this.filterSessions(sessions, filter);

    // 1. Overall Performance with Explicit Denominator
    let totalWins = 0;
    let totalLosses = 0;
    let totalDraws = 0;

    filteredGames.forEach((g) => {
      if (g.winner === 'us') totalWins++;
      else if (g.winner === 'opp') totalLosses++;
      else if (g.winner === 'draw') totalDraws++;
    });

    const totalDecided = totalWins + totalLosses;
    const overallWinRate = calculateWinRate(totalWins, totalDecided);
    const overallFormula = formatFormulaDisplay(totalWins, totalDecided, overallWinRate);

    // Missing data audit
    const missingAudit = this.auditMissingData(sessions);

    const overall: OverallPerformance = {
      wins: totalWins,
      losses: totalLosses,
      draws: totalDraws,
      totalGames: filteredGames.length,
      decidedGames: totalDecided,
      winRate: overallWinRate,
      formulaDisplay: overallFormula,
      totalSessions: filteredSessions.length,
      isLowSample: totalDecided < 5,
      lowSampleWarning:
        totalDecided < 5
          ? `คำเตือนขนาดกลุ่มตัวอย่าง: จำนวนเกมที่ตัดสินแล้วมีเพียง ${totalDecided} เกม (N < 5) สถิติอาจมีความผันผวนสูงและยังไม่สะท้อนนัยสำคัญทางสถิติ`
          : undefined,
      missingDataCount: {
        incompleteGames: missingAudit.filter((m) => m.issueType === 'missing_picks').length,
        undecidedGames: missingAudit.filter((m) => m.issueType === 'undecided_winner').length,
        unassignedPlayers: missingAudit.filter((m) => m.issueType === 'missing_player').length,
        emptyNotes: missingAudit.filter((m) => m.issueType === 'missing_coach_notes').length,
      },
    };

    // 2. Blue vs Red Side Performance
    let blueWins = 0;
    let blueLosses = 0;
    let blueDraws = 0;
    let blueTotal = 0;

    let redWins = 0;
    let redLosses = 0;
    let redDraws = 0;
    let redTotal = 0;

    filteredGames.forEach((g) => {
      if (g.ourSide === 'blue') {
        blueTotal++;
        if (g.winner === 'us') blueWins++;
        else if (g.winner === 'opp') blueLosses++;
        else if (g.winner === 'draw') blueDraws++;
      } else {
        redTotal++;
        if (g.winner === 'us') redWins++;
        else if (g.winner === 'opp') redLosses++;
        else if (g.winner === 'draw') redDraws++;
      }
    });

    const blueDecided = blueWins + blueLosses;
    const blueWR = calculateWinRate(blueWins, blueDecided);
    const redDecided = redWins + redLosses;
    const redWR = calculateWinRate(redWins, redDecided);

    const sideDelta = Math.round((blueWR - redWR) * 10) / 10;
    const preferredSide: 'blue' | 'red' | 'balanced' =
      sideDelta >= 5 ? 'blue' : sideDelta <= -5 ? 'red' : 'balanced';

    const sideStats: SidePerformance = {
      blue: {
        wins: blueWins,
        losses: blueLosses,
        draws: blueDraws,
        totalGames: blueTotal,
        decidedGames: blueDecided,
        winRate: blueWR,
        formulaDisplay: formatFormulaDisplay(blueWins, blueDecided, blueWR),
      },
      red: {
        wins: redWins,
        losses: redLosses,
        draws: redDraws,
        totalGames: redTotal,
        decidedGames: redDecided,
        winRate: redWR,
        formulaDisplay: formatFormulaDisplay(redWins, redDecided, redWR),
      },
      preferredSide,
      sideDelta,
    };

    // 3. Hero & Position Performance
    const heroPosMap: Record<
      string,
      { heroName: string; position: LaneSelectKey; wins: number; losses: number; draws: number; total: number }
    > = {};

    filteredGames.forEach((g) => {
      const isWin = g.winner === 'us';
      const isLoss = g.winner === 'opp';
      const isDraw = g.winner === 'draw';
      const ourPicks = g.ourSide === 'blue' ? g.bluePicks : g.redPicks;

      ourPicks?.forEach((p) => {
        if (!p.heroName?.trim()) return;
        const key = `${p.heroName.trim()}|${p.position}`;
        if (!heroPosMap[key]) {
          heroPosMap[key] = {
            heroName: p.heroName.trim(),
            position: p.position,
            wins: 0,
            losses: 0,
            draws: 0,
            total: 0,
          };
        }
        heroPosMap[key].total++;
        if (isWin) heroPosMap[key].wins++;
        else if (isLoss) heroPosMap[key].losses++;
        else if (isDraw) heroPosMap[key].draws++;
      });
    });

    const heroPositionStats: HeroPositionPerformance[] = Object.values(heroPosMap)
      .map((item) => {
        const decided = item.wins + item.losses;
        const wr = calculateWinRate(item.wins, decided);
        return {
          heroName: item.heroName,
          position: item.position,
          wins: item.wins,
          losses: item.losses,
          draws: item.draws,
          totalGames: item.total,
          decidedGames: decided,
          winRate: wr,
          formulaDisplay: formatFormulaDisplay(item.wins, decided, wr),
          isLowSample: decided < 3,
        };
      })
      .sort((a, b) => b.totalGames - a.totalGames || b.winRate - a.winRate);

    // 4. Player Performance & Player Hero Stats
    const playerSummaryMap: Record<
      string,
      {
        playerName: string;
        playerNickname: string;
        wins: number;
        losses: number;
        draws: number;
        total: number;
        positions: Set<LaneSelectKey>;
        heroes: Record<string, { wins: number; games: number }>;
      }
    > = {};

    const playerHeroMap: Record<
      string,
      {
        playerName: string;
        playerNickname: string;
        heroName: string;
        position: LaneSelectKey;
        wins: number;
        losses: number;
        draws: number;
        total: number;
      }
    > = {};

    filteredGames.forEach((g) => {
      const isWin = g.winner === 'us';
      const isLoss = g.winner === 'opp';
      const isDraw = g.winner === 'draw';
      const ourPicks = g.ourSide === 'blue' ? g.bluePicks : g.redPicks;

      ourPicks?.forEach((p) => {
        if (!p.heroName?.trim()) return;
        const nick = p.playerNickname?.trim() || p.playerName?.trim() || 'MCU Player';
        const name = p.playerName?.trim() || nick;

        // Player summary
        if (!playerSummaryMap[nick]) {
          playerSummaryMap[nick] = {
            playerName: name,
            playerNickname: nick,
            wins: 0,
            losses: 0,
            draws: 0,
            total: 0,
            positions: new Set(),
            heroes: {},
          };
        }
        playerSummaryMap[nick].total++;
        playerSummaryMap[nick].positions.add(p.position);
        if (isWin) playerSummaryMap[nick].wins++;
        else if (isLoss) playerSummaryMap[nick].losses++;
        else if (isDraw) playerSummaryMap[nick].draws++;

        if (!playerSummaryMap[nick].heroes[p.heroName]) {
          playerSummaryMap[nick].heroes[p.heroName] = { wins: 0, games: 0 };
        }
        playerSummaryMap[nick].heroes[p.heroName].games++;
        if (isWin) playerSummaryMap[nick].heroes[p.heroName].wins++;

        // Player hero detail
        const phKey = `${nick}|${p.heroName}|${p.position}`;
        if (!playerHeroMap[phKey]) {
          playerHeroMap[phKey] = {
            playerName: name,
            playerNickname: nick,
            heroName: p.heroName,
            position: p.position,
            wins: 0,
            losses: 0,
            draws: 0,
            total: 0,
          };
        }
        playerHeroMap[phKey].total++;
        if (isWin) playerHeroMap[phKey].wins++;
        else if (isLoss) playerHeroMap[phKey].losses++;
        else if (isDraw) playerHeroMap[phKey].draws++;
      });
    });

    const playerSummaries: PlayerOverallSummary[] = Object.values(playerSummaryMap)
      .map((ps) => {
        const decided = ps.wins + ps.losses;
        const wr = calculateWinRate(ps.wins, decided);
        const topHeroes = Object.entries(ps.heroes)
          .map(([hName, val]) => ({
            heroName: hName,
            games: val.games,
            winRate: calculateWinRate(val.wins, val.games),
          }))
          .sort((a, b) => b.games - a.games || b.winRate - a.winRate)
          .slice(0, 3);

        return {
          playerName: ps.playerName,
          playerNickname: ps.playerNickname,
          positionsPlayed: Array.from(ps.positions),
          wins: ps.wins,
          losses: ps.losses,
          draws: ps.draws,
          totalGames: ps.total,
          decidedGames: decided,
          winRate: wr,
          formulaDisplay: formatFormulaDisplay(ps.wins, decided, wr),
          topHeroes,
        };
      })
      .sort((a, b) => b.totalGames - a.totalGames || b.winRate - a.winRate);

    const playerHeroStats: PlayerHeroPerformance[] = Object.values(playerHeroMap)
      .map((ph) => {
        const decided = ph.wins + ph.losses;
        const wr = calculateWinRate(ph.wins, decided);
        return {
          playerName: ph.playerName,
          playerNickname: ph.playerNickname,
          heroName: ph.heroName,
          position: ph.position,
          wins: ph.wins,
          losses: ph.losses,
          draws: ph.draws,
          totalGames: ph.total,
          decidedGames: decided,
          winRate: wr,
          formulaDisplay: formatFormulaDisplay(ph.wins, decided, wr),
          isLowSample: decided < 3,
        };
      })
      .sort((a, b) => b.totalGames - a.totalGames || b.winRate - a.winRate);

    // 5. Hero Combinations (Combos of 2 and 3 heroes) with Sample Size Threshold Gating
    const minThreshold = filter.minComboGames !== undefined ? filter.minComboGames : 2;
    const comboMap: Record<
      string,
      { comboKey: string; heroes: string[]; size: 2 | 3; wins: number; losses: number; draws: number; total: number }
    > = {};

    filteredGames.forEach((g) => {
      const isWin = g.winner === 'us';
      const isLoss = g.winner === 'opp';
      const isDraw = g.winner === 'draw';
      const ourPicks = g.ourSide === 'blue' ? g.bluePicks : g.redPicks;
      const heroNames = (ourPicks || [])
        .map((p) => p.heroName?.trim())
        .filter((name): name is string => Boolean(name));

      // Pairs (2 heroes)
      for (let i = 0; i < heroNames.length; i++) {
        for (let j = i + 1; j < heroNames.length; j++) {
          const pair = [heroNames[i], heroNames[j]].sort();
          const key = `2:${pair.join('+')}`;
          if (!comboMap[key]) {
            comboMap[key] = {
              comboKey: key,
              heroes: pair,
              size: 2,
              wins: 0,
              losses: 0,
              draws: 0,
              total: 0,
            };
          }
          comboMap[key].total++;
          if (isWin) comboMap[key].wins++;
          else if (isLoss) comboMap[key].losses++;
          else if (isDraw) comboMap[key].draws++;
        }
      }

      // Trios (3 heroes)
      for (let i = 0; i < heroNames.length; i++) {
        for (let j = i + 1; j < heroNames.length; j++) {
          for (let k = j + 1; k < heroNames.length; k++) {
            const trio = [heroNames[i], heroNames[j], heroNames[k]].sort();
            const key = `3:${trio.join('+')}`;
            if (!comboMap[key]) {
              comboMap[key] = {
                comboKey: key,
                heroes: trio,
                size: 3,
                wins: 0,
                losses: 0,
                draws: 0,
                total: 0,
              };
            }
            comboMap[key].total++;
            if (isWin) comboMap[key].wins++;
            else if (isLoss) comboMap[key].losses++;
            else if (isDraw) comboMap[key].draws++;
          }
        }
      }
    });

    const heroCombos: HeroComboStat[] = Object.values(comboMap)
      .map((item) => {
        const decided = item.wins + item.losses;
        const wr = calculateWinRate(item.wins, decided);
        return {
          comboKey: item.comboKey,
          heroes: item.heroes,
          size: item.size,
          wins: item.wins,
          losses: item.losses,
          draws: item.draws,
          totalGames: item.total,
          decidedGames: decided,
          winRate: wr,
          formulaDisplay: formatFormulaDisplay(item.wins, decided, wr),
          hasSufficientSample: decided >= minThreshold,
        };
      })
      .filter((c) => c.decidedGames >= minThreshold)
      .sort((a, b) => b.totalGames - a.totalGames || b.winRate - a.winRate);

    // 6. Draft vs Outcome Correlation Comparison
    const draftVsOutcome: DraftVsOutcomeComparison[] = [];
    filteredGames.forEach((g) => {
      const parentSession = sessions.find((s) => s.id === g.sessionId);
      const ourPicks = (g.ourSide === 'blue' ? g.bluePicks : g.redPicks)?.map((p) => p.heroName).filter(Boolean) || [];
      const oppPicks = (g.ourSide === 'blue' ? g.redPicks : g.bluePicks)?.map((p) => p.heroName).filter(Boolean) || [];

      // Calculate simple theoretical draft composition score
      const score = this.estimateDraftCompositionScore(ourPicks, oppPicks);
      let theoreticalRating: 'Strong Advantage' | 'Slight Advantage' | 'Balanced' | 'Challenging Matchup' = 'Balanced';
      if (score >= 60) theoreticalRating = 'Strong Advantage';
      else if (score >= 53) theoreticalRating = 'Slight Advantage';
      else if (score <= 44) theoreticalRating = 'Challenging Matchup';

      // Alignment classification
      let alignment: DraftVsOutcomeComparison['alignment'] = 'in_progress';
      let alignmentLabel = 'รอผลการแข่งขัน';

      if (g.winner === 'us') {
        if (score >= 53) {
          alignment = 'win_with_advantage';
          alignmentLabel = '✅ ชนะตามความได้เปรียบของดราฟต์';
        } else {
          alignment = 'win_despite_challenge';
          alignmentLabel = '⚡ ชนะด้วย Execution เหนือดราฟต์ที่ท้าทาย';
        }
      } else if (g.winner === 'opp') {
        if (score >= 53) {
          alignment = 'loss_despite_advantage';
          alignmentLabel = '⚠️ ดราฟต์ได้เปรียบแต่แพ้จากจังหวะในเกม';
        } else {
          alignment = 'loss_with_challenge';
          alignmentLabel = '❌ แพ้ตามความเสียเปรียบของดราฟต์';
        }
      }

      draftVsOutcome.push({
        gameId: g.id,
        sessionId: g.sessionId,
        sessionTitle: parentSession?.sessionTitle || 'Scrim Match',
        sessionDate: parentSession?.sessionDate || g.createdAt.split('T')[0],
        gameNumber: g.gameNumber,
        opponent: parentSession?.opponentTeam || 'Opponent',
        ourSide: g.ourSide,
        ourPicks,
        oppPicks,
        actualResult: g.winner === 'us' ? 'won' : g.winner === 'opp' ? 'lost' : 'in_progress',
        draftTheoreticalRating: theoreticalRating,
        draftScoreEstimate: score,
        alignment,
        alignmentLabel,
        coachDebrief: g.coachNotes?.lessonsLearned || g.coachNotes?.whatWentWell,
      });
    });

    return {
      generatedAt: new Date().toISOString(),
      filterApplied: filter,
      dataSource: {
        primary: 'MCU Scrim Manager Verified Data',
        proMetaBaseline: 'RPL 2026 Summer Pro Meta Stats (Reference Only)',
        coachNotesOrigin: 'Coach Qualitative Debrief (Subjective Input)',
      },
      correlationDisclaimer:
        'ข้อควรระวังสำคัญ: การวิเคราะห์เปรียบเทียบผลการดราฟต์และผลการแข่งขันแสดงเฉพาะความสัมพันธ์ (Correlation) ของข้อมูลตามแผนเท่านั้น ไม่ได้หมายความว่าตัวฮีโร่หรือคะแนนการดราฟต์เป็นสาเหตุของชัยชนะโดยตรง (Causation) ปัจจัยในสนาม เช่น Macro Play, การคุม Wave, จังหวะไฟต์, การสื่อสารในทีม และความผิดพลาดเฉพาะจุด มีผลอย่างยิ่งต่อชัยชนะจริง',
      overall,
      sideStats,
      heroPositionStats,
      playerSummaries,
      playerHeroStats,
      heroCombos,
      draftVsOutcome,
      missingDataAudit: missingAudit,
    };
  }

  /**
   * Audits scrim records for missing or incomplete data
   */
  public auditMissingData(sessions: ScrimSession[]): MissingDataAuditItem[] {
    const issues: MissingDataAuditItem[] = [];

    sessions.forEach((s) => {
      s.games.forEach((g) => {
        // Check complete picks (must be 5 picks on both sides)
        const blueFilled = g.bluePicks?.filter((p) => p.heroName?.trim()).length || 0;
        const redFilled = g.redPicks?.filter((p) => p.heroName?.trim()).length || 0;
        if (blueFilled < 5 || redFilled < 5) {
          issues.push({
            sessionId: s.id,
            sessionTitle: s.sessionTitle,
            gameNumber: g.gameNumber,
            issueType: 'missing_picks',
            description: `ฮีโร่ไม่ครบ 5 ตัว (Blue: ${blueFilled}/5, Red: ${redFilled}/5)`,
          });
        }

        // Check undecided winner
        if (g.winner === 'undecided') {
          issues.push({
            sessionId: s.id,
            sessionTitle: s.sessionTitle,
            gameNumber: g.gameNumber,
            issueType: 'undecided_winner',
            description: 'ยังไม่ได้ระบุผลแพ้ชนะของเกม (Undecided)',
          });
        }

        // Check missing player assignments
        const ourPicks = g.ourSide === 'blue' ? g.bluePicks : g.redPicks;
        const unassigned = (ourPicks || []).filter(
          (p) => p.heroName?.trim() && !p.playerName?.trim() && !p.playerNickname?.trim()
        ).length;
        if (unassigned > 0) {
          issues.push({
            sessionId: s.id,
            sessionTitle: s.sessionTitle,
            gameNumber: g.gameNumber,
            issueType: 'missing_player',
            description: `ยังไม่ได้ระบุนักกีฬาที่เล่นฮีโร่ ${unassigned} ตำแหน่ง`,
          });
        }

        // Check missing coach notes
        if (
          !g.coachNotes?.whatWentWell?.trim() &&
          !g.coachNotes?.issuesFaced?.trim() &&
          !g.coachNotes?.lessonsLearned?.trim()
        ) {
          issues.push({
            sessionId: s.id,
            sessionTitle: s.sessionTitle,
            gameNumber: g.gameNumber,
            issueType: 'missing_coach_notes',
            description: 'ยังไม่มีบันทึกข้อคิดเห็นหรือบทเรียนของโค้ชหลังเกม',
          });
        }
      });
    });

    return issues;
  }

  /**
   * Helper to estimate draft composition score (purely heuristic 40-70 baseline)
   */
  private estimateDraftCompositionScore(ourHeroes: string[], oppHeroes: string[]): number {
    let score = 50;
    if (ourHeroes.length < 5) return 50;

    // Presence of known pro meta picks
    const highMetaPicks = ['Capheny', 'TeeMee', 'Florentino', 'Liliana', 'Aoi', 'Nakroth', 'Yena'];
    ourHeroes.forEach((h) => {
      if (highMetaPicks.includes(h)) score += 3;
    });
    oppHeroes.forEach((h) => {
      if (highMetaPicks.includes(h)) score -= 2;
    });

    return Math.max(30, Math.min(75, score));
  }
}

export const scrimAnalyticsService = new ScrimAnalyticsService();
