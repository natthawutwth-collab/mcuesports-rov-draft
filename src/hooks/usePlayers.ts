import { useState, useEffect, useMemo, useCallback } from 'react';
import { Player, PlayerPosition, HeroPlayerBadge, PlayerHeroPoolItem } from '../types/player';
import { INITIAL_PLAYERS } from '../data/initialPlayers';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, ensureAuth, getCurrentUser } from '../services/firebase';

const STORAGE_KEY = 'mcu_rov_players_v1';

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load players from localStorage', e);
    }
    return INITIAL_PLAYERS;
  });

  // Cloud Firestore Sync (Cross-device persistence)
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    async function initCloudSync() {
      try {
        const user = await ensureAuth();
        const uid = user.uid || getCurrentUser()?.uid;
        if (!uid) return;

        const docRef = doc(db, 'users', uid, 'settings', 'players_pool');
        
        // Listen to cloud updates
        unsubscribe = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data && Array.isArray(data.players) && data.players.length > 0) {
              setPlayers(data.players);
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data.players));
              } catch {
                // ignore
              }
            }
          } else {
            // First time: save default/current players to Cloud
            setDoc(docRef, { players, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
          }
        });
      } catch (err) {
        console.warn('Player cloud sync offline fallback:', err);
      }
    }

    initCloudSync();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Save to localStorage & Cloud
  const persistPlayers = useCallback(async (newPlayers: Player[]) => {
    setPlayers(newPlayers);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPlayers));
    } catch (e) {
      console.error('Failed to save players to localStorage', e);
    }

    try {
      const user = await ensureAuth();
      const uid = user.uid || getCurrentUser()?.uid;
      if (uid) {
        const docRef = doc(db, 'users', uid, 'settings', 'players_pool');
        await setDoc(docRef, { players: newPlayers, updatedAt: new Date().toISOString() }, { merge: true });
      }
    } catch (err) {
      console.warn('Failed to sync players to Cloud:', err);
    }
  }, []);

  // Add player
  const addPlayer = useCallback((newPlayerData: {
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
    persistPlayers([newPlayer, ...players]);
    return newPlayer;
  }, [players, persistPlayers]);

  // Update player
  const updatePlayer = useCallback((id: string, updates: Partial<Omit<Player, 'id' | 'createdAt'>>) => {
    const updated = players.map((p) => (p.id === id ? { ...p, ...updates } : p));
    persistPlayers(updated);
  }, [players, persistPlayers]);

  // Delete player
  const deletePlayer = useCallback((id: string) => {
    const remaining = players.filter((p) => p.id !== id);
    persistPlayers(remaining);
  }, [players, persistPlayers]);

  // Reset to default seed players
  const resetToDefaultPlayers = useCallback(() => {
    persistPlayers(INITIAL_PLAYERS);
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
    addPlayer,
    updatePlayer,
    deletePlayer,
    resetToDefaultPlayers,
    heroToPlayersMap,
  };
}
