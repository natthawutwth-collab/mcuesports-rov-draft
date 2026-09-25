import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db, ensureAuth, getCurrentUser } from './firebase';
import {
  DraftHistoryRecord,
  DraftRepository,
} from '../types/draftHistory';

const LOCAL_STORAGE_BACKUP_KEY = 'mcu_rov_draft_history_v1';

export class FirebaseDraftRepository implements DraftRepository {
  private listeners: Set<() => void> = new Set();
  private unsubscribeFirestore: (() => void) | null = null;
  private cachedRecords: DraftHistoryRecord[] = [];

  constructor() {
    this.initRealtimeSync();
  }

  private async getUserId(): Promise<string> {
    try {
      const user = await ensureAuth();
      return user.uid;
    } catch {
      const current = getCurrentUser();
      return current ? current.uid : 'anonymous_guest';
    }
  }

  private async initRealtimeSync() {
    try {
      const colRef = collection(db, 'shared_drafts');
      const q = query(colRef, orderBy('createdAt', 'desc'));

      this.unsubscribeFirestore = onSnapshot(
        q,
        (snapshot) => {
          const cloudRecords: DraftHistoryRecord[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            cloudRecords.push(data as DraftHistoryRecord);
          });

          this.cachedRecords = cloudRecords;
          // Keep local backup in sync
          try {
            localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(cloudRecords));
          } catch {
            // ignore quota error
          }
          this.notifyListeners();
        },
        (error) => {
          console.warn('Realtime sync fallback to local storage:', error);
          this.loadFromLocalBackup();
        }
      );
    } catch (e) {
      console.warn('Firebase initRealtimeSync fallback:', e);
      this.loadFromLocalBackup();
    }
  }

  private loadFromLocalBackup() {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY);
      if (raw) {
        this.cachedRecords = JSON.parse(raw);
        this.notifyListeners();
      }
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
    try {
      const colRef = collection(db, 'shared_drafts');
      const q = query(colRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const records: DraftHistoryRecord[] = [];
        snapshot.forEach((docSnap) => {
          records.push(docSnap.data() as DraftHistoryRecord);
        });
        this.cachedRecords = records;
        try {
          localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(records));
        } catch {
          // ignore
        }
        return records;
      }
    } catch (err) {
      console.warn('getAll from cloud failed, reading from local cache', err);
    }

    // Fallback to local cached records if cloud is offline or empty
    if (this.cachedRecords.length > 0) {
      return this.cachedRecords;
    }

    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.cachedRecords = parsed;
          return parsed;
        }
      }
    } catch {
      // ignore
    }

    return [];
  }

  async getById(id: string): Promise<DraftHistoryRecord | null> {
    try {
      const docRef = doc(db, 'shared_drafts', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as DraftHistoryRecord;
      }
    } catch (err) {
      console.warn('getById cloud failed, checking local cache', err);
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

    try {
      localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(this.cachedRecords));
    } catch {
      // ignore
    }
    this.notifyListeners();

    // 2. Persist to Firebase Firestore
    try {
      const uid = await this.getUserId();
      const docRef = doc(db, 'users', uid, 'drafts', id);
      await setDoc(docRef, record, { merge: true });

      // Also save to shared_drafts so it can be shared or opened via URL from any device
      const sharedRef = doc(db, 'shared_drafts', id);
      await setDoc(sharedRef, record, { merge: true });
    } catch (e) {
      console.warn('Failed to save draft to Firestore (will remain in local storage):', e);
    }

    return record;
  }

  async delete(id: string): Promise<boolean> {
    // 1. Remove from local cache
    this.cachedRecords = this.cachedRecords.filter((r) => r.id !== id);
    try {
      localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(this.cachedRecords));
    } catch {
      // ignore
    }
    this.notifyListeners();

    // 2. Delete from Cloud
    try {
      const uid = await this.getUserId();
      const docRef = doc(db, 'users', uid, 'drafts', id);
      await deleteDoc(docRef);

      const sharedRef = doc(db, 'shared_drafts', id);
      await deleteDoc(sharedRef);
      return true;
    } catch (e) {
      console.warn('Failed to delete draft from Firestore:', e);
      return true;
    }
  }

  async clearAll(): Promise<void> {
    const toDelete = [...this.cachedRecords];
    this.cachedRecords = [];
    try {
      localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, '[]');
    } catch {
      // ignore
    }
    this.notifyListeners();

    try {
      const uid = await this.getUserId();
      for (const item of toDelete) {
        const docRef = doc(db, 'users', uid, 'drafts', item.id);
        await deleteDoc(docRef);
      }
    } catch (e) {
      console.warn('Clear all cloud error:', e);
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

  seedSampleIfEmpty(): void {
    if (this.cachedRecords.length > 0) return;

    // Check localStorage
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) {
          this.cachedRecords = list;
          return;
        }
      }
    } catch {
      // ignore
    }

    const sample1: DraftHistoryRecord = {
      id: 'draft_rpl2026_bac_talon_g1',
      createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 3600 * 1000 * 24 * 2).toISOString(),
      tournament: 'RoV Pro League 2026 Summer',
      match: 'Bacon Time vs Talon Esports',
      gameNumber: 1,
      patch: 'Patch 1.56 (Summer 2026)',
      winner: 'blue',
      notes: 'Bacon Time เล่นแผน Front-to-Back คุม Dragon Lane ได้สมบูรณ์แบบ',
      blueTeam: {
        teamName: 'Bacon Time',
        side: 'blue',
        bans: ['Aoi', 'Billow', 'Stuart', 'Rouie'],
        picks: [
          { heroName: 'Toro', position: 'ROAM', pickOrder: 1 },
          { heroName: 'Marja', position: 'MID', pickOrder: 4 },
          { heroName: 'Hayate', position: 'ADL', pickOrder: 5 },
          { heroName: 'Tachi', position: 'DSL', pickOrder: 8 },
          { heroName: "Eland'orr", position: 'JG', pickOrder: 9 },
        ],
      },
      redTeam: {
        teamName: 'Talon Esports',
        side: 'red',
        bans: ['Florentino', 'Nakroth', 'Dolia', 'Fennik'],
        picks: [
          { heroName: 'Capheny', position: 'ADL', pickOrder: 2 },
          { heroName: 'Iggy', position: 'MID', pickOrder: 3 },
          { heroName: 'Maloch', position: 'DSL', pickOrder: 6 },
          { heroName: 'Keeva', position: 'JG', pickOrder: 7 },
          { heroName: 'Helen', position: 'ROAM', pickOrder: 10 },
        ],
      },
    };

    this.save(sample1);
  }
}
