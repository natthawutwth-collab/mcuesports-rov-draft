import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Player, PlayerPosition, HeroPlayerBadge, PlayerHeroPoolItem } from '../types/player';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, ensureAuth } from '../services/firebase';

const STORAGE_KEY = 'mcu_rov_players_v1';
const TEAM_STORAGE_KEY = 'mcu_rov_team_id_v1';
const DEFAULT_TEAM_ID = 'main_team';
const PURGE_KEY = 'mcu_rov_players_purge_v3';

// Sample mock nicknames to filter out if previously seeded
const SAMPLE_NICKNAMES = new Set(['MOON', 'ALEX', 'ZEPHYR', 'KAIROS', 'VORTEX']);

function sanitizePlayers(list: any[]): Player[] {
  if (!Array.isArray(list)) return [];
  return list.filter(
    (p) =>
      p &&
      !SAMPLE_NICKNAMES.has(p.nickname) &&
      p.id !== 'player_1' &&
      p.id !== 'player_2' &&
      p.id !== 'player_3' &&
      p.id !== 'player_4' &&
      p.id !== 'player_5'
  );
}

export function usePlayers() {
  // 1. Team ID (default to main_team for cross-device shared roster)
  const [teamId, setTeamIdState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(TEAM_STORAGE_KEY);
      return saved && saved.trim() ? saved.trim() : DEFAULT_TEAM_ID;
    } catch {
      return DEFAULT_TEAM_ID;
    }
  });

  // 2. Players State (starts empty, without seed players)
  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      if (!localStorage.getItem(PURGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        localStorage.setItem(PURGE_KEY, 'done');
        return [];
      }
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const sanitized = sanitizePlayers(parsed);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
          return sanitized;
        }
      }
    } catch (e) {
      console.error('Failed to load players from localStorage', e);
    }
    return [];
  });

  // Sync statuses
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Keep ref of latest players to avoid stale closure during auto-initialization
  const playersRef = useRef<Player[]>(players);
  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  // Cloud Firestore Sync (Cross-device real-time sync)
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let isSubscribed = true;

    // Trigger anonymous auth in background if needed
    ensureAuth().catch(() => {});

    async function initRealtimeCloudSync() {
      try {
        const docRef = doc(db, 'team_rosters', teamId);

        unsubscribe = onSnapshot(
          docRef,
          (docSnap) => {
            if (!isSubscribed) return;

            if (docSnap.exists()) {
              const data = docSnap.data();
              if (data && Array.isArray(data.players)) {
                const sanitized = sanitizePlayers(data.players);

                // If Firestore still contained sample players, update Firestore immediately to purge them
                if (sanitized.length !== data.players.length) {
                  setDoc(
                    docRef,
                    {
                      players: sanitized,
                      updatedAt: new Date().toISOString(),
                    },
                    { merge: true }
                  ).catch(() => {});
                }

                setPlayers(sanitized);
                playersRef.current = sanitized;
                setIsCloudConnected(true);
                setSyncError(null);
                setLastSyncedAt(data.updatedAt || new Date().toISOString());

                try {
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
                } catch {
                  // ignore
                }
              }
            } else {
              // Empty initial cloud roster
              setDoc(
                docRef,
                {
                  id: teamId,
                  teamName: 'MCU Esports',
                  players: playersRef.current,
                  updatedAt: new Date().toISOString(),
                },
                { merge: true }
              )
                .then(() => {
                  if (isSubscribed) {
                    setIsCloudConnected(true);
                    setLastSyncedAt(new Date().toISOString());
                  }
                })
                .catch((err) => {
                  console.warn('Initial cloud roster upload failed:', err);
                });
            }
          },
          (err) => {
            console.warn('Firestore onSnapshot error on team_rosters:', err);
            if (isSubscribed) {
              setIsCloudConnected(false);
              setSyncError('กำลังใช้งานโหมดออฟไลน์ (เชื่อมต่อ Cloud ไม่สำเร็จ)');
            }
          }
        );
      } catch (err) {
        console.warn('Failed to attach Firestore snapshot:', err);
        if (isSubscribed) {
          setIsCloudConnected(false);
        }
      }
    }

    initRealtimeCloudSync();

    return () => {
      isSubscribed = false;
      if (unsubscribe) unsubscribe();
    };
  }, [teamId]);

  // Save to both localStorage & Cloud Firestore
  const persistPlayers = useCallback(
    async (newPlayers: Player[]) => {
      const sanitized = sanitizePlayers(newPlayers);

      // 1. Immediately update React state and local storage
      setPlayers(sanitized);
      playersRef.current = sanitized;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
      } catch (e) {
        console.error('Failed to save players to localStorage', e);
      }

      // 2. Persist to Cloud Firestore across all devices
      setIsSyncing(true);
      setSyncError(null);
      try {
        const docRef = doc(db, 'team_rosters', teamId);
        const nowIso = new Date().toISOString();
        await setDoc(
          docRef,
          {
            id: teamId,
            teamName: 'MCU Esports',
            players: sanitized,
            updatedAt: nowIso,
          },
          { merge: true }
        );
        setIsCloudConnected(true);
        setLastSyncedAt(nowIso);
      } catch (err: any) {
        console.error('Failed to sync players to Cloud:', err);
        setSyncError(err?.message || 'บันทึกขึ้น Cloud ไม่สำเร็จ');
      } finally {
        setIsSyncing(false);
      }
    },
    [teamId]
  );

  // Manual Force Sync to Cloud
  const forceSyncToCloud = useCallback(async (): Promise<boolean> => {
    setIsSyncing(true);
    try {
      const docRef = doc(db, 'team_rosters', teamId);
      const nowIso = new Date().toISOString();
      const sanitized = sanitizePlayers(playersRef.current);
      await setDoc(
        docRef,
        {
          id: teamId,
          teamName: 'MCU Esports',
          players: sanitized,
          updatedAt: nowIso,
        },
        { merge: true }
      );
      setIsCloudConnected(true);
      setLastSyncedAt(nowIso);
      setSyncError(null);
      return true;
    } catch (err: any) {
      console.error('Force sync to cloud failed:', err);
      setSyncError(err?.message || 'เชื่อมต่อ Cloud ล้มเหลว');
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [teamId]);

  // Manual Reload from Cloud
  const reloadFromCloud = useCallback(async (): Promise<boolean> => {
    setIsSyncing(true);
    try {
      const docRef = doc(db, 'team_rosters', teamId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data && Array.isArray(data.players)) {
          const sanitized = sanitizePlayers(data.players);
          setPlayers(sanitized);
          playersRef.current = sanitized;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
          setIsCloudConnected(true);
          setLastSyncedAt(data.updatedAt || new Date().toISOString());
          setSyncError(null);
          return true;
        }
      }
      return false;
    } catch (err: any) {
      console.error('Reload from cloud failed:', err);
      setSyncError(err?.message || 'โหลดข้อมูลจาก Cloud ไม่สำเร็จ');
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [teamId]);

  // Change Team Workspace ID
  const changeTeamId = useCallback((newTeamId: string) => {
    const clean = newTeamId.trim();
    if (!clean) return;
    setTeamIdState(clean);
    try {
      localStorage.setItem(TEAM_STORAGE_KEY, clean);
    } catch {
      // ignore
    }
  }, []);

  // Add player
  const addPlayer = useCallback(
    (newPlayerData: {
      name: string;
      nickname: string;
      position: PlayerPosition;
      avatarUrl: string;
      heroPool: PlayerHeroPoolItem[];
    }) => {
      const newPlayer: Player = {
        ...newPlayerData,
        id: 'player_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        createdAt: Date.now(),
      };
      persistPlayers([newPlayer, ...playersRef.current]);
      return newPlayer;
    },
    [persistPlayers]
  );

  // Update player
  const updatePlayer = useCallback(
    (id: string, updates: Partial<Omit<Player, 'id' | 'createdAt'>>) => {
      const updated = playersRef.current.map((p) => (p.id === id ? { ...p, ...updates } : p));
      persistPlayers(updated);
    },
    [persistPlayers]
  );

  // Delete player
  const deletePlayer = useCallback(
    (id: string) => {
      const remaining = playersRef.current.filter((p) => p.id !== id);
      persistPlayers(remaining);
    },
    [persistPlayers]
  );

  // Reset / Clear all players
  const resetToDefaultPlayers = useCallback(() => {
    persistPlayers([]);
  }, [persistPlayers]);

  const clearAllPlayers = useCallback(() => {
    persistPlayers([]);
  }, [persistPlayers]);

  // Compute map of heroName -> HeroPlayerBadge[] for O(1) hero card badge lookup
  const heroToPlayersMap = useMemo(() => {
    const map: Record<string, HeroPlayerBadge[]> = {};

    players.forEach((player) => {
      player.heroPool.forEach((item) => {
        if (!map[item.heroName]) {
          map[item.heroName] = [];
        }
        map[item.heroName].push({
          playerId: player.id,
          playerName: player.name,
          playerNickname: player.nickname,
          position: player.position,
          tier: item.tier,
          playerAvatar: player.avatarUrl,
        });
      });
    });

    // Sort so signatures (⭐) come first
    Object.keys(map).forEach((heroName) => {
      map[heroName].sort((a, b) => {
        if (a.tier === 'signature' && b.tier !== 'signature') return -1;
        if (a.tier !== 'signature' && b.tier === 'signature') return 1;
        return a.playerNickname.localeCompare(b.playerNickname);
      });
    });

    return map;
  }, [players]);

  return {
    players,
    teamId,
    changeTeamId,
    isSyncing,
    isCloudConnected,
    lastSyncedAt,
    syncError,
    forceSyncToCloud,
    reloadFromCloud,
    addPlayer,
    updatePlayer,
    deletePlayer,
    resetToDefaultPlayers,
    clearAllPlayers,
    heroToPlayersMap,
  };
}
