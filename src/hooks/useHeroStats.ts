import { useState, useEffect, useCallback, useMemo } from 'react';
import { statsDataProvider } from '../services/statsDataProvider';
import { HeroStats, HeroMatchup, DataSourceStatus } from '../types/stats';

export function useHeroStats(selectedHeroName: string | null = null, oppPicks: string[] = []) {
  const [status, setStatus] = useState<DataSourceStatus>(() => statsDataProvider.getStatus());

  // Listen to dataset changes (e.g. when JSON/CSV/API is loaded or reset)
  useEffect(() => {
    const unsubscribe = statsDataProvider.subscribe(() => {
      setStatus(statsDataProvider.getStatus());
    });
    return unsubscribe;
  }, []);

  // Hero Stats (or null for "No Data")
  const heroStats: HeroStats | null = useMemo(() => {
    if (!selectedHeroName) return null;
    return statsDataProvider.getHeroStats(selectedHeroName);
  }, [selectedHeroName, status]);

  // Hero Matchups (Strong Against / Weak Against, or null for "No Data")
  const heroMatchups = useMemo(() => {
    if (!selectedHeroName) return null;
    return statsDataProvider.getHeroMatchups(selectedHeroName);
  }, [selectedHeroName, status]);

  // Real-time Matchups vs Current Opponent Picks
  const liveMatchups = useMemo(() => {
    if (!selectedHeroName || oppPicks.length === 0) return [];
    return statsDataProvider.getLiveDraftMatchups(selectedHeroName, oppPicks);
  }, [selectedHeroName, oppPicks, status]);

  const loadFromJson = useCallback((json: string) => {
    return statsDataProvider.loadFromJson(json);
  }, []);

  const loadFromCsv = useCallback((heroesCsv: string, matchupsCsv?: string) => {
    return statsDataProvider.loadFromCsv(heroesCsv, matchupsCsv);
  }, []);

  const loadFromApi = useCallback((url: string) => {
    return statsDataProvider.loadFromApi(url);
  }, []);

  const resetToDefault = useCallback(() => {
    statsDataProvider.resetToDefault();
  }, []);

  return {
    status,
    heroStats,
    heroMatchups,
    liveMatchups,
    loadFromJson,
    loadFromCsv,
    loadFromApi,
    resetToDefault,
    getHeadToHead: statsDataProvider.getHeadToHead.bind(statsDataProvider),
  };
}
