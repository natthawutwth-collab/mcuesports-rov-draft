import { useState, useEffect, useCallback } from 'react';
import {
  DraftHistoryRecord,
  DraftHistoryFilter,
} from '../types/draftHistory';
import {
  draftRepository,
  LocalStorageDraftRepository,
  filterDraftHistory,
} from '../services/draftHistoryService';

export function useDraftHistory() {
  const [records, setRecords] = useState<DraftHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<DraftHistoryFilter>({
    searchQuery: '',
    tournament: 'all',
    winner: undefined,
  });

  const loadRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      // Seed samples on first load if empty
      if (draftRepository instanceof LocalStorageDraftRepository) {
        draftRepository.seedSampleIfEmpty();
      }
      const data = await draftRepository.getAll();
      setRecords(data);
    } catch (e) {
      console.error('Failed to load draft history', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();

    // Subscribe to repository updates
    if (draftRepository instanceof LocalStorageDraftRepository) {
      return draftRepository.subscribe(() => {
        loadRecords();
      });
    }
  }, [loadRecords]);

  const saveDraft = useCallback(
    async (
      record: Omit<DraftHistoryRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
    ) => {
      const saved = await draftRepository.save(record);
      await loadRecords();
      return saved;
    },
    [loadRecords]
  );

  const deleteDraft = useCallback(
    async (id: string) => {
      const ok = await draftRepository.delete(id);
      if (ok) {
        await loadRecords();
      }
      return ok;
    },
    [loadRecords]
  );

  const clearAllDrafts = useCallback(async () => {
    await draftRepository.clearAll();
    await loadRecords();
  }, [loadRecords]);

  const exportHistoryJson = useCallback(async () => {
    return await draftRepository.exportJson();
  }, []);

  const importHistoryJson = useCallback(
    async (json: string) => {
      const count = await draftRepository.importJson(json);
      await loadRecords();
      return count;
    },
    [loadRecords]
  );

  // Filtered view
  const filteredRecords = filterDraftHistory(records, filter);

  // Available filters metadata
  const tournaments = Array.from(
    new Set(records.map((r) => r.tournament).filter(Boolean))
  );
  const patches = Array.from(
    new Set(records.map((r) => r.patch).filter(Boolean))
  );

  return {
    records,
    filteredRecords,
    isLoading,
    filter,
    setFilter,
    saveDraft,
    deleteDraft,
    clearAllDrafts,
    exportHistoryJson,
    importHistoryJson,
    refreshHistory: loadRecords,
    tournaments,
    patches,
  };
}
