import {
  DraftHistoryRecord,
  DraftRepository,
  DraftHistoryFilter,
} from '../types/draftHistory';

const STORAGE_KEY = 'mcu_rov_draft_history_v1';
const DRAFT_PURGE_KEY = 'mcu_rov_draft_history_purge_v3';

const SAMPLE_DRAFT_IDS = new Set([
  'draft_rpl2026_bac_talon_g1',
  'draft_rpl2026_hydra_earena_g2',
]);

export class LocalStorageDraftRepository implements DraftRepository {
  constructor() {
    try {
      if (!localStorage.getItem(DRAFT_PURGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, '[]');
        localStorage.setItem(DRAFT_PURGE_KEY, 'done');
      }
    } catch {
      // ignore
    }
  }

  private getRecordsFromStorage(): DraftHistoryRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((r) => r && !SAMPLE_DRAFT_IDS.has(r.id));
      }
      return [];
    } catch (e) {
      console.error('Failed to parse draft history from localStorage', e);
      return [];
    }
  }

  private saveRecordsToStorage(records: DraftHistoryRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to save draft history to localStorage', e);
    }
  }

  // Listener callbacks for reactive updates
  private listeners: Set<() => void> = new Set();

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error('Error in draft repository listener', err);
      }
    });
  }

  async getAll(): Promise<DraftHistoryRecord[]> {
    const records = this.getRecordsFromStorage();
    // Sort by createdAt descending
    return records.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getById(id: string): Promise<DraftHistoryRecord | null> {
    const records = this.getRecordsFromStorage();
    return records.find((r) => r.id === id) || null;
  }

  async save(
    input: Omit<DraftHistoryRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<DraftHistoryRecord> {
    const records = this.getRecordsFromStorage();
    const now = new Date().toISOString();

    if (input.id) {
      // Update existing record
      const index = records.findIndex((r) => r.id === input.id);
      if (index !== -1) {
        const updated: DraftHistoryRecord = {
          ...records[index],
          ...input,
          id: input.id,
          updatedAt: now,
        };
        records[index] = updated;
        this.saveRecordsToStorage(records);
        return updated;
      }
    }

    // Create new record
    const newRecord: DraftHistoryRecord = {
      ...input,
      id: input.id || `draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };

    records.unshift(newRecord);
    this.saveRecordsToStorage(records);
    return newRecord;
  }

  async delete(id: string): Promise<boolean> {
    const records = this.getRecordsFromStorage();
    const initialLen = records.length;
    const filtered = records.filter((r) => r.id !== id);
    if (filtered.length !== initialLen) {
      this.saveRecordsToStorage(filtered);
      return true;
    }
    return false;
  }

  async clearAll(): Promise<void> {
    this.saveRecordsToStorage([]);
  }

  async exportJson(): Promise<string> {
    const records = await this.getAll();
    return JSON.stringify(records, null, 2);
  }

  async importJson(jsonData: string): Promise<number> {
    try {
      const parsed = JSON.parse(jsonData);
      if (!Array.isArray(parsed)) {
        throw new Error('Invalid format: JSON must be an array of draft history records');
      }

      const existing = this.getRecordsFromStorage();
      const existingIds = new Set(existing.map((r) => r.id));
      let added = 0;

      for (const item of parsed) {
        if (item && item.tournament && item.blueTeam && item.redTeam) {
          if (!item.id || existingIds.has(item.id)) {
            item.id = `draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          }
          if (!item.createdAt) {
            item.createdAt = new Date().toISOString();
          }
          if (!item.updatedAt) {
            item.updatedAt = new Date().toISOString();
          }
          existing.unshift(item);
          existingIds.add(item.id);
          added++;
        }
      }

      this.saveRecordsToStorage(existing);
      return added;
    } catch (err: any) {
      console.error('Import failed', err);
      throw err;
    }
  }

  // Seed sample tournament drafts if empty for demonstration
  seedSampleIfEmpty(): void {
    // No-op: user requested removal of all sample drafts
  }
}

import { SupabaseDraftRepository } from './supabaseDraftRepository';

// Singleton repository instance: Powered by Supabase with automatic offline/localStorage fallback
export const draftRepository: DraftRepository = new SupabaseDraftRepository();

// Helper hook or query function for filtering
export function filterDraftHistory(
  records: DraftHistoryRecord[],
  filter: DraftHistoryFilter
): DraftHistoryRecord[] {
  return records.filter((rec) => {
    // Search query: tournament, match, notes, team names, or hero names
    if (filter.searchQuery && filter.searchQuery.trim() !== '') {
      const q = filter.searchQuery.toLowerCase().trim();
      const matchTournament = rec.tournament.toLowerCase().includes(q);
      const matchMatch = rec.match.toLowerCase().includes(q);
      const matchNotes = rec.notes.toLowerCase().includes(q);
      const matchBlue = rec.blueTeam.teamName.toLowerCase().includes(q);
      const matchRed = rec.redTeam.teamName.toLowerCase().includes(q);
      const matchBlueHeroes = [
        ...rec.blueTeam.bans,
        ...rec.blueTeam.picks.map((p) => p.heroName),
      ].some((h) => h.toLowerCase().includes(q));
      const matchRedHeroes = [
        ...rec.redTeam.bans,
        ...rec.redTeam.picks.map((p) => p.heroName),
      ].some((h) => h.toLowerCase().includes(q));

      if (
        !matchTournament &&
        !matchMatch &&
        !matchNotes &&
        !matchBlue &&
        !matchRed &&
        !matchBlueHeroes &&
        !matchRedHeroes
      ) {
        return false;
      }
    }

    if (filter.tournament && filter.tournament !== 'all') {
      if (rec.tournament !== filter.tournament) return false;
    }

    if (filter.winner && filter.winner !== 'undecided') {
      if (rec.winner !== filter.winner) return false;
    }

    if (filter.teamName && filter.teamName.trim() !== '') {
      const tq = filter.teamName.toLowerCase();
      const hasTeam =
        rec.blueTeam.teamName.toLowerCase().includes(tq) ||
        rec.redTeam.teamName.toLowerCase().includes(tq);
      if (!hasTeam) return false;
    }

    if (filter.heroName && filter.heroName.trim() !== '') {
      const hq = filter.heroName.toLowerCase();
      const allHeroes = [
        ...rec.blueTeam.bans,
        ...rec.blueTeam.picks.map((p) => p.heroName),
        ...rec.redTeam.bans,
        ...rec.redTeam.picks.map((p) => p.heroName),
      ];
      if (!allHeroes.some((h) => h.toLowerCase().includes(hq))) {
        return false;
      }
    }

    if (filter.patch && filter.patch !== 'all') {
      if (rec.patch !== filter.patch) return false;
    }

    return true;
  });
}
