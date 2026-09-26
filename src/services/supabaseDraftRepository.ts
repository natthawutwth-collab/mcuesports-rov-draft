import {
  DraftHistoryRecord,
  DraftRepository,
} from '../types/draftHistory';
import { supabase, isSupabaseConfigured } from './supabase';

const LOCAL_STORAGE_BACKUP_KEY = 'mcu_rov_draft_history_v1';
const DRAFT_PURGE_KEY = 'mcu_rov_draft_history_purge_v3';
const SAMPLE_DRAFT_IDS = new Set([
  'draft_rpl2026_bac_talon_g1',
  'draft_rpl2026_hydra_earena_g2',
]);

function rowToRecord(row: any): DraftHistoryRecord {
  if (row.data && typeof row.data === 'object' && row.data.blueTeam) {
    return {
      ...row.data,
      id: row.id || row.data.id,
      createdAt: row.data.createdAt || row.created_at || new Date().toISOString(),
      updatedAt: row.data.updatedAt || row.updated_at || new Date().toISOString(),
    };
  }

  return {
    id: row.id,
    tournament: row.tournament || 'RoV Tournament',
    match: row.match || 'Match',
    gameNumber: Number(row.game_number ?? row.gameNumber ?? 1),
    patch: row.patch || 'Patch 1.56',
    blueTeam: row.blue_team || row.blueTeam || { teamName: 'Blue Team', side: 'blue', bans: [], picks: [] },
    redTeam: row.red_team || row.redTeam || { teamName: 'Red Team', side: 'red', bans: [], picks: [] },
    winner: row.winner || 'undecided',
    notes: row.notes || '',
    tags: row.tags || [],
    durationSeconds: row.duration_seconds ?? row.durationSeconds,
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
  };
}

export class SupabaseDraftRepository implements DraftRepository {
  private listeners: Set<() => void> = new Set();
  private cachedRecords: DraftHistoryRecord[] = [];
  private realtimeChannel: any = null;

  constructor() {
    try {
      if (!localStorage.getItem(DRAFT_PURGE_KEY)) {
        localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, '[]');
        localStorage.setItem(DRAFT_PURGE_KEY, 'done');
        this.cachedRecords = [];
        this.clearAll().catch(() => {});
      } else {
        this.loadFromLocalBackup();
      }
    } catch {
      // ignore
    }

    this.initRealtimeSync();
  }

  private initRealtimeSync() {
    if (!supabase || !isSupabaseConfigured) {
      this.loadFromLocalBackup();
      return;
    }

    try {
      this.realtimeChannel = supabase
        .channel('public:shared_drafts')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'shared_drafts' },
          (payload) => {
            if (payload.eventType === 'INSERT' && payload.new) {
              const rec = rowToRecord(payload.new);
              if (!SAMPLE_DRAFT_IDS.has(rec.id)) {
                const idx = this.cachedRecords.findIndex((r) => r.id === rec.id);
                if (idx === -1) {
                  this.cachedRecords.unshift(rec);
                } else {
                  this.cachedRecords[idx] = rec;
                }
                this.persistLocalCache();
                this.notifyListeners();
              }
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              const rec = rowToRecord(payload.new);
              const idx = this.cachedRecords.findIndex((r) => r.id === rec.id);
              if (idx !== -1) {
                this.cachedRecords[idx] = rec;
              } else {
                this.cachedRecords.unshift(rec);
              }
              this.persistLocalCache();
              this.notifyListeners();
            } else if (payload.eventType === 'DELETE' && payload.old) {
              const oldId = (payload.old as any).id;
              if (oldId) {
                this.cachedRecords = this.cachedRecords.filter((r) => r.id !== oldId);
                this.persistLocalCache();
                this.notifyListeners();
              }
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            this.getAll().catch(() => {});
          }
        });
    } catch (e) {
      console.warn('Supabase Realtime subscription error, using local fallback:', e);
      this.loadFromLocalBackup();
    }
  }

  private loadFromLocalBackup() {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          this.cachedRecords = list.filter((r) => r && !SAMPLE_DRAFT_IDS.has(r.id));
        }
      }
    } catch {
      // ignore
    }
  }

  private persistLocalCache() {
    try {
      localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(this.cachedRecords));
    } catch {
      // ignore
    }
  }

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
    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('shared_drafts')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          const records: DraftHistoryRecord[] = data
            .map(rowToRecord)
            .filter((r) => !SAMPLE_DRAFT_IDS.has(r.id));

          this.cachedRecords = records;
          this.persistLocalCache();
          return records;
        }
      } catch (err) {
        console.warn('getAll from Supabase failed, reading from local cache:', err);
      }
    }

    if (this.cachedRecords.length > 0) {
      return this.cachedRecords;
    }

    this.loadFromLocalBackup();
    return this.cachedRecords;
  }

  async getById(id: string): Promise<DraftHistoryRecord | null> {
    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('shared_drafts')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          return rowToRecord(data);
        }
      } catch (err) {
        console.warn('getById from Supabase failed, searching local cache:', err);
      }
    }

    return this.cachedRecords.find((r) => r.id === id) || null;
  }

  async save(
    input: Omit<DraftHistoryRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<DraftHistoryRecord> {
    const now = new Date().toISOString();
    const id = input.id || `draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const record: DraftHistoryRecord = {
      ...input,
      id,
      createdAt: input.id ? (this.cachedRecords.find((r) => r.id === id)?.createdAt || now) : now,
      updatedAt: now,
    };

    // 1. Immediately update local cache & broadcast
    const existingIndex = this.cachedRecords.findIndex((r) => r.id === id);
    if (existingIndex !== -1) {
      this.cachedRecords[existingIndex] = record;
    } else {
      this.cachedRecords.unshift(record);
    }

    this.persistLocalCache();
    this.notifyListeners();

    // 2. Persist to Supabase
    if (supabase && isSupabaseConfigured) {
      try {
        const payload = {
          id: record.id,
          tournament: record.tournament,
          match: record.match,
          game_number: record.gameNumber,
          patch: record.patch,
          blue_team: record.blueTeam,
          red_team: record.redTeam,
          winner: record.winner,
          notes: record.notes,
          tags: record.tags || [],
          duration_seconds: record.durationSeconds || 0,
          data: record,
          created_at: record.createdAt,
          updated_at: record.updatedAt,
        };

        const { error } = await supabase.from('shared_drafts').upsert(payload);
        if (error) {
          console.warn('Supabase save error (will stay saved in local storage):', error.message);
        }
      } catch (e) {
        console.warn('Failed to save draft to Supabase (will remain in local storage):', e);
      }
    }

    return record;
  }

  async delete(id: string): Promise<boolean> {
    // 1. Remove from local cache
    this.cachedRecords = this.cachedRecords.filter((r) => r.id !== id);
    this.persistLocalCache();
    this.notifyListeners();

    // 2. Delete from Supabase
    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.from('shared_drafts').delete().eq('id', id);
      } catch (e) {
        console.warn('Failed to delete draft from Supabase:', e);
      }
    }

    return true;
  }

  async clearAll(): Promise<void> {
    this.cachedRecords = [];
    try {
      localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, '[]');
    } catch {
      // ignore
    }
    this.notifyListeners();

    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.from('shared_drafts').delete().neq('id', '___never_match___');
      } catch (e) {
        console.warn('Supabase clearAll error:', e);
      }
    }
  }

  async exportJson(): Promise<string> {
    const records = await this.getAll();
    return JSON.stringify(records, null, 2);
  }

  async importJson(jsonData: string): Promise<number> {
    const parsed = JSON.parse(jsonData);
    if (!Array.isArray(parsed)) {
      throw new Error('Invalid JSON: expected array of draft records');
    }

    let count = 0;
    for (const item of parsed) {
      if (item && item.tournament && item.blueTeam && item.redTeam) {
        await this.save(item);
        count++;
      }
    }
    return count;
  }
}
