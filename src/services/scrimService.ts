import {
  ScrimSession,
  ScrimGame,
  ScrimStatsSummary,
  ScrimFilter,
  ScrimSeriesFormat,
} from '../types/scrim';
import { INITIAL_SCRIM_SESSIONS } from '../data/seedScrimSessions';
import { supabase, isSupabaseConfigured } from './supabase';

const SCRIM_STORAGE_KEY = 'mcu_rov_scrim_sessions_v2';

export function createBlankScrimGame(sessionId: string, gameNum: number): ScrimGame {
  const now = new Date().toISOString();
  return {
    id: `game_${sessionId}_${gameNum}_${Math.random().toString(36).substring(2, 6)}`,
    sessionId,
    gameNumber: gameNum,
    ourSide: gameNum % 2 === 1 ? 'blue' : 'red',
    winner: 'undecided',
    result: 'in_progress',
    blueTeamName: 'MCU Esports',
    redTeamName: 'Opponent Team',
    blueBans: [],
    redBans: [],
    bluePicks: [],
    redPicks: [],
    isComplete: false,
    coachNotes: {
      draftObjective: '',
      whatWentWell: '',
      issuesFaced: '',
      lessonsLearned: '',
      coachRating: 3,
    },
    matchDurationMinutes: 15,
    vodUrl: '',
    createdAt: now,
    updatedAt: now,
  };
}

export function createBlankScrimSession(
  title: string = 'ซ้อมแผนทีมประจำสัปดาห์',
  opponent: string = 'Talon',
  format: ScrimSeriesFormat = 'BO5'
): ScrimSession {
  const id = `scrim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const dateStr = now.split('T')[0];

  const totalGames = format === 'BO1' ? 1 : format === 'BO3' ? 3 : format === 'BO5' ? 5 : 7;
  const initialGames: ScrimGame[] = [];
  for (let i = 1; i <= totalGames; i++) {
    initialGames.push(createBlankScrimGame(id, i));
  }

  return {
    id,
    teamId: 'main_team',
    sessionTitle: title,
    opponentTeam: opponent,
    sessionDate: dateStr,
    sessionTime: '19:00',
    format,
    patch: '2026.01',
    ourScore: 0,
    oppScore: 0,
    status: 'in_progress',
    games: initialGames,
    overallNotes: '',
    createdAt: now,
    updatedAt: now,
  };
}

export class ScrimService {
  private listeners: Set<() => void> = new Set();

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (err) {
        console.error(err);
      }
    });
  }

  public getAllSessions(): ScrimSession[] {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return INITIAL_SCRIM_SESSIONS;
      }
      const raw = localStorage.getItem(SCRIM_STORAGE_KEY);
      if (!raw) {
        // Initialize with verified default scrim sessions
        const initial = JSON.parse(JSON.stringify(INITIAL_SCRIM_SESSIONS));
        localStorage.setItem(SCRIM_STORAGE_KEY, JSON.stringify(initial));
        return initial;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      const fallback = JSON.parse(JSON.stringify(INITIAL_SCRIM_SESSIONS));
      localStorage.setItem(SCRIM_STORAGE_KEY, JSON.stringify(fallback));
      return fallback;
    } catch (e) {
      console.error('Failed to get scrim sessions', e);
      return [];
    }
  }

  public getSessionById(id: string): ScrimSession | null {
    const all = this.getAllSessions();
    return all.find((s) => s.id === id) || null;
  }

  public saveSession(session: ScrimSession): void {
    try {
      const all = this.getAllSessions().filter((s) => s.id !== session.id);
      session.updatedAt = new Date().toISOString();

      // Recalculate series scores
      let our = 0;
      let opp = 0;
      session.games.forEach((g) => {
        if (g.winner === 'us') our++;
        else if (g.winner === 'opp') opp++;
      });
      session.ourScore = our;
      session.oppScore = opp;

      // Update session status
      const winTarget = session.format === 'BO1' ? 1 : session.format === 'BO3' ? 2 : session.format === 'BO5' ? 3 : 4;
      if (our >= winTarget || opp >= winTarget) {
        session.status = 'completed';
      }

      all.unshift(session);
      localStorage.setItem(SCRIM_STORAGE_KEY, JSON.stringify(all));
      this.notify();

      // Optional background sync with Supabase if table exists
      this.syncSessionToSupabase(session).catch(() => {});
    } catch (e) {
      console.error('Failed to save scrim session', e);
    }
  }

  public deleteSession(id: string): void {
    try {
      const all = this.getAllSessions().filter((s) => s.id !== id);
      localStorage.setItem(SCRIM_STORAGE_KEY, JSON.stringify(all));
      this.notify();

      // Background delete on Supabase
      if (supabase && isSupabaseConfigured) {
        supabase.from('scrim_sessions').delete().eq('id', id).then(() => {});
      }
    } catch (e) {
      console.error('Failed to delete scrim session', e);
    }
  }

  /**
   * Checks whether a scrim game has full 5 picks on both sides
   */
  public isGameComplete(game: ScrimGame): boolean {
    const blueCount = game.bluePicks?.filter((p) => p.heroName?.trim()).length || 0;
    const redCount = game.redPicks?.filter((p) => p.heroName?.trim()).length || 0;
    return blueCount === 5 && redCount === 5 && (game.winner === 'us' || game.winner === 'opp');
  }

  /**
   * Calculates isolated MCU Scrim Statistics (Separate from Pro League Stats)
   */
  public getScrimStatsSummary(): ScrimStatsSummary {
    const sessions = this.getAllSessions();
    let totalGames = 0;
    let wins = 0;
    let losses = 0;
    let blueGames = 0;
    let blueWins = 0;
    let redGames = 0;
    let redWins = 0;

    const heroUsageMap: Record<string, { games: number; wins: number; losses: number }> = {};

    sessions.forEach((s) => {
      s.games.forEach((g) => {
        if (g.winner === 'us' || g.winner === 'opp') {
          totalGames++;
          const isUsWinner = g.winner === 'us';
          if (isUsWinner) wins++;
          else losses++;

          if (g.ourSide === 'blue') {
            blueGames++;
            if (isUsWinner) blueWins++;
          } else {
            redGames++;
            if (isUsWinner) redWins++;
          }

          // Count hero picks for our side
          const ourPicks = g.ourSide === 'blue' ? g.bluePicks : g.redPicks;
          ourPicks?.forEach((p) => {
            if (p.heroName?.trim()) {
              const name = p.heroName.trim();
              if (!heroUsageMap[name]) {
                heroUsageMap[name] = { games: 0, wins: 0, losses: 0 };
              }
              heroUsageMap[name].games++;
              if (isUsWinner) heroUsageMap[name].wins++;
              else heroUsageMap[name].losses++;
            }
          });
        }
      });
    });

    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 1000) / 10 : 0;
    const blueWinRate = blueGames > 0 ? Math.round((blueWins / blueGames) * 1000) / 10 : 0;
    const redWinRate = redGames > 0 ? Math.round((redWins / redGames) * 1000) / 10 : 0;

    const mostPickedHeroes = Object.entries(heroUsageMap)
      .map(([heroName, data]) => ({
        heroName,
        games: data.games,
        wins: data.wins,
        losses: data.losses,
        winRate: data.games > 0 ? Math.round((data.wins / data.games) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.games - a.games || b.winRate - a.winRate)
      .slice(0, 8);

    return {
      totalSessions: sessions.length,
      totalGames,
      wins,
      losses,
      winRate,
      blueGames,
      blueWins,
      blueWinRate,
      redGames,
      redWins,
      redWinRate,
      mostPickedHeroes,
    };
  }

  // Graceful Supabase persistence
  private async syncSessionToSupabase(session: ScrimSession) {
    if (!supabase || !isSupabaseConfigured) return;
    try {
      await supabase.from('scrim_sessions').upsert({
        id: session.id,
        team_id: session.teamId || 'main_team',
        session_title: session.sessionTitle,
        opponent_team: session.opponentTeam,
        session_date: session.sessionDate,
        session_time: session.sessionTime || null,
        format: session.format,
        patch: session.patch,
        our_score: session.ourScore,
        opp_score: session.oppScore,
        status: session.status,
        overall_notes: session.overallNotes || '',
        updated_at: new Date().toISOString(),
      });
    } catch {
      // Ignored if table not created yet on Supabase
    }
  }

  public resetToDefault(): void {
    try {
      const initial = JSON.parse(JSON.stringify(INITIAL_SCRIM_SESSIONS));
      localStorage.setItem(SCRIM_STORAGE_KEY, JSON.stringify(initial));
      this.notify();
    } catch (e) {
      console.error('Failed to reset scrim sessions', e);
    }
  }

  public exportJson(): string {
    const all = this.getAllSessions();
    return JSON.stringify(all, null, 2);
  }

  public importJson(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        localStorage.setItem(SCRIM_STORAGE_KEY, JSON.stringify(parsed));
        this.notify();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

export const scrimService = new ScrimService();
