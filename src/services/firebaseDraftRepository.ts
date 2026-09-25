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
const DRAFT_PURGE_KEY = 'mcu_rov_draft_history_purge_v3';
const SAMPLE_DRAFT_IDS = new Set([
  'draft_rpl2026_bac_talon_g1',
  'draft_rpl2026_hydra_earena_g2',
]);

export class FirebaseDraftRepository implements DraftRepository {
  private listeners: Set<() => void> = new Set();
  private unsubscribeFirestore: (() => void) | null = null;
  private cachedRecords: DraftHistoryRecord[] = [];

  constructor() {
    try {
      if (!localStorage.getItem(DRAFT_PURGE_KEY)) {
        localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, '[]');
        localStorage.setItem(DRAFT_PURGE_KEY, 'done');
        this.cachedRecords = [];
        this.clearAll().catch(() => {});
      }
    } catch {
      // ignore
    }
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
            const id = data?.id || docSnap.id;
            // Purge the old mock/sample drafts if found in Firestore
            if (SAMPLE_DRAFT_IDS.has(id)) {
              deleteDoc(docSnap.ref).catch(() => {});
              return;
            }
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
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          this.cachedRecords = list.filter((r) => r && !SAMPLE_DRAFT_IDS.has(r.id));
          this.notifyListeners();
        }
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
      // 1. Delete all records from shared_drafts
      const sharedCol = collection(db, 'shared_drafts');
      const sharedSnap = await getDocs(sharedCol);
      for (const docSnap of sharedSnap.docs) {
        await deleteDoc(docSnap.ref).catch(() => {});
      }

      // 2. Also delete from users/${uid}/drafts
      const uid = await this.getUserId();
      const userCol = collection(db, 'users', uid, 'drafts');
      const userSnap = await getDocs(userCol);
      for (const docSnap of userSnap.docs) {
        await deleteDoc(docSnap.ref).catch(() => {});
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
    // No-op: Do not auto-seed sample drafts
  }
}
