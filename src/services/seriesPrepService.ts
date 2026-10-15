import {
  SeriesPlan,
  SeriesFormat,
  GamePlan,
  TournamentRuleConfig,
  PlannedRoleKey,
} from '../types/seriesPrep';

const SERIES_STORAGE_KEY = 'mcu_rov_series_plans_v2';

const DEFAULT_ROLES: PlannedRoleKey[] = ['DSL', 'JG', 'MID', 'ADL', 'SUP'];

export function createBlankGamePlan(gameNum: number): GamePlan {
  return {
    gameNumber: gameNum,
    side: gameNum % 2 === 1 ? 'blue' : 'red',
    targetBans: [],
    preferredPicks: DEFAULT_ROLES.map((r) => ({
      role: r,
      preferredHero: '',
      alternativeHeroes: [],
      reason: '',
    })),
    coachNotes: '',
    result: 'pending',
  };
}

export function createDefaultSeriesPlan(
  title: string = 'RPL 2026 Summer Match Preparation',
  opponent: string = 'Talon',
  ourTeam: string = 'MCU Esports',
  format: SeriesFormat = 'BO5'
): SeriesPlan {
  const numGames = format === 'BO3' ? 3 : format === 'BO5' ? 5 : 7;
  const games: GamePlan[] = [];
  for (let i = 1; i <= numGames; i++) {
    games.push(createBlankGamePlan(i));
  }

  const rules: TournamentRuleConfig = {
    format,
    globalBanRule: 'rpl_global', // Official RoV Pro League Global Ban/Pick rule
    phase1BansPerTeam: 2,
    phase2BansPerTeam: 2,
    resetOnGame7: true,
    tournamentName: 'RoV Pro League 2026',
    patch: '2026.01',
  };

  const now = new Date().toISOString();
  return {
    id: `series_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title,
    tournament: 'RoV Pro League 2026',
    opponentTeam: opponent,
    ourTeam,
    format,
    rules,
    games,
    overallNotes: 'เน้นยึดคอนเซ็ปต์ Global Ban/Pick โดยจัดสรรตัวคอมโบหลักให้อยู่ใน Game 1-3 และเก็บ Pocket Picks ไว้เซอร์ไพรส์ใน Game ท้าย',
    createdAt: now,
    updatedAt: now,
  };
}

export class SeriesPrepService {
  public getAllPlans(): SeriesPlan[] {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') return [];
      const raw = localStorage.getItem(SERIES_STORAGE_KEY);
      if (!raw) {
        // Initialize with one default sample template for MCU Esports
        const sample = createDefaultSeriesPlan('Match Prep vs Talon (BO5)', 'Talon', 'MCU Esports', 'BO5');
        localStorage.setItem(SERIES_STORAGE_KEY, JSON.stringify([sample]));
        return [sample];
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      const sample = createDefaultSeriesPlan('Match Prep vs Talon (BO5)', 'Talon', 'MCU Esports', 'BO5');
      localStorage.setItem(SERIES_STORAGE_KEY, JSON.stringify([sample]));
      return [sample];
    } catch (e) {
      console.error('Failed to load series plans from storage', e);
      return [];
    }
  }

  public savePlan(plan: SeriesPlan): void {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
      const raw = localStorage.getItem(SERIES_STORAGE_KEY);
      let all: SeriesPlan[] = [];
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            all = parsed;
          }
        } catch {
          all = [];
        }
      }
      all = all.filter((p) => p.id !== plan.id);
      plan.updatedAt = new Date().toISOString();
      all.unshift(plan);
      localStorage.setItem(SERIES_STORAGE_KEY, JSON.stringify(all));
    } catch (e) {
      console.error('Failed to save series plan', e);
    }
  }

  public deletePlan(id: string): void {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
      const raw = localStorage.getItem(SERIES_STORAGE_KEY);
      if (!raw) return;
      let all: SeriesPlan[] = [];
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) all = parsed;
      } catch {
        all = [];
      }
      all = all.filter((p) => p.id !== id);
      localStorage.setItem(SERIES_STORAGE_KEY, JSON.stringify(all));
    } catch (e) {
      console.error('Failed to delete series plan', e);
    }
  }

  /**
   * Calculates which heroes are globally consumed/locked under Global Ban/Pick rules
   * for a given game number.
   */
  public getGlobalConsumedHeroes(
    plan: SeriesPlan,
    currentGameNum: number
  ): {
    ourConsumed: Set<string>;
    opponentConsumed: Set<string>;
    isUltimateGame: boolean;
  } {
    const ourConsumed = new Set<string>();
    const opponentConsumed = new Set<string>();

    const isUltimateGame = plan.rules.resetOnGame7 && currentGameNum === 7;
    if (isUltimateGame || plan.rules.globalBanRule === 'none') {
      return { ourConsumed, opponentConsumed, isUltimateGame };
    }

    // In Global Ban/Pick: Heroes picked in games 1..(currentGameNum - 1) cannot be picked again
    for (let i = 1; i < currentGameNum; i++) {
      const g = plan.games.find((game) => game.gameNumber === i);
      if (!g) continue;

      // Picks from preferred picks
      g.preferredPicks.forEach((p) => {
        if (p.preferredHero?.trim()) {
          ourConsumed.add(p.preferredHero.trim());
        }
      });

      // If strict global ban, target bans or opponent picks are also consumed
      if (plan.rules.globalBanRule === 'strict_global') {
        g.targetBans.forEach((b) => {
          if (b?.trim()) opponentConsumed.add(b.trim());
        });
      }
    }

    return { ourConsumed, opponentConsumed, isUltimateGame };
  }
}

export const seriesPrepService = new SeriesPrepService();
