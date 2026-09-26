import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Player, PlayerPosition, HeroPlayerBadge, PlayerHeroPoolItem } from '../types/player';
import {
  supabase,
  isSupabaseConfigured,
  subscribeSupabaseConfigChange,
} from '../services/supabase';

const STORAGE_KEY = 'mcu_rov_players_v1';
const TEAM_STORAGE_KEY = 'mcu_rov_team_id_v1';
const DEFAULT_TEAM_ID = 'main_team';
const PURGE_KEY = 'mcu_rov_players_purge_v3';

// Validate player structure, ensuring user players (regardless of nickname) are preserved
function sanitizePlayers(list: any[]): Player[] {
  if (!Array.isArray(list)) return [];
  return list.filter(
    (p) =>
      p &&
      typeof p === 'object' &&
      typeof p.nickname === 'string' &&
      p.nickname.trim().length > 0 &&
      p.id !== 'legacy_mock_seed_1'
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

  // 2. Players State (loaded from localStorage first for instant responsiveness)
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
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(() => isSupabaseConfigured);
  const [activeProvider, setActiveProvider] = useState<'supabase' | 'local'>(() =>
    isSupabaseConfigured ? 'supabase' : 'local'
  );
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Keep ref of latest players to avoid stale closure
  const playersRef = useRef<Player[]>(players);
  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  // Re-sync whenever teamId changes or Supabase credentials change
  const [supabaseActive, setSupabaseActive] = useState<boolean>(() => isSupabaseConfigured);

  useEffect(() => {
    return subscribeSupabaseConfigChange((configured) => {
      setSupabaseActive(configured);
    });
  }, []);

  // Supabase real-time sync with automatic LocalStorage fallback
  useEffect(() => {
    let isSubscribed = true;
    let cleanupFn: (() => void) | null = null;

    async function initSync() {
      if (supabaseActive && supabase) {
        setActiveProvider('supabase');
        try {
          // 1. Fetch current team roster from Supabase
          const { data, error } = await supabase
            .from('team_rosters')
            .select('*')
            .eq('id', teamId)
            .maybeSingle();

          if (!isSubscribed) return;

          if (error) {
            if (error.code === '42P01' || error.code === 'PGRST205') {
              setSyncError('ยังไม่พบตาราง team_rosters ใน Supabase กรุณารัน SQL เพื่อเริ่มซิงค์');
              setIsCloudConnected(false);
            }
          } else if (data && Array.isArray(data.players)) {
            const sanitized = sanitizePlayers(data.players);
            setPlayers(sanitized);
            playersRef.current = sanitized;
            setIsCloudConnected(true);
            setSyncError(null);
            setLastSyncedAt(data.updated_at || new Date().toISOString());

            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
            } catch {
              // ignore
            }
          } else if (!data) {
            // First time team record - initialize in Supabase
            const nowIso = new Date().toISOString();
            await supabase.from('team_rosters').insert({
              id: teamId,
              team_name: 'MCU Esports',
              players: playersRef.current,
              updated_at: nowIso,
            });

            if (isSubscribed) {
              setIsCloudConnected(true);
              setLastSyncedAt(nowIso);
            }
          }

          // 2. Realtime subscription channel on Supabase
          const channel = supabase
            .channel(`public:team_rosters:${teamId}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'team_rosters',
                filter: `id=eq.${teamId}`,
              },
              (payload) => {
                if (!isSubscribed) return;
                if (payload.new && Array.isArray((payload.new as any).players)) {
                  const incoming = sanitizePlayers((payload.new as any).players);
                  setPlayers(incoming);
                  playersRef.current = incoming;
                  setIsCloudConnected(true);
                  setSyncError(null);
                  setLastSyncedAt((payload.new as any).updated_at || new Date().toISOString());

                  try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(incoming));
                  } catch {
                    // ignore
                  }
                }
              }
            )
            .subscribe((status) => {
              if (isSubscribed) {
                if (status === 'SUBSCRIBED') {
                  setIsCloudConnected(true);
                  setSyncError(null);
                } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                  setIsCloudConnected(true);
                }
              }
            });

          cleanupFn = () => {
            supabase?.removeChannel(channel).catch(() => {});
          };
          return;
        } catch (err) {
          console.warn('Supabase sync init failed, operating in local mode:', err);
        }
      }

      // Supabase is not configured or offline - operate in local mode
      if (isSubscribed) {
        setActiveProvider('local');
        setIsCloudConnected(false);
      }
    }

    initSync();

    return () => {
      isSubscribed = false;
      if (cleanupFn) {
        cleanupFn();
      }
    };
  }, [teamId, supabaseActive]);

  // Persist players to LocalStorage AND Supabase (if configured)
  const persistPlayers = useCallback(
    async (newPlayers: Player[]) => {
      const sanitized = sanitizePlayers(newPlayers);

      // 1. Immediately update React state and local storage for 0ms lag
      setPlayers(sanitized);
      playersRef.current = sanitized;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
      } catch (e) {
        console.error('Failed to save players to localStorage', e);
      }

      setIsSyncing(true);
      setSyncError(null);
      const nowIso = new Date().toISOString();

      try {
        // 2. Persist to Supabase if configured
        if (supabaseActive && supabase) {
          try {
            const { error } = await supabase.from('team_rosters').upsert({
              id: teamId,
              team_name: 'MCU Esports',
              players: sanitized,
              updated_at: nowIso,
            });
            if (!error) {
              setIsCloudConnected(true);
              setLastSyncedAt(nowIso);
            } else {
              console.warn('Supabase upsert warning:', error.message);
            }
          } catch (err) {
            console.warn('Supabase upsert exception:', err);
          }
        }
      } catch (err: any) {
        console.error('Failed to persist players to cloud:', err);
        setSyncError(err?.message || 'บันทึกขึ้น Cloud ไม่สำเร็จ');
      } finally {
        setIsSyncing(false);
      }
    },
    [teamId, supabaseActive]
  );

  // Manual Force Sync to Cloud
  const forceSyncToCloud = useCallback(async (): Promise<boolean> => {
    setIsSyncing(true);
    setSyncError(null);
    const nowIso = new Date().toISOString();
    const sanitized = sanitizePlayers(playersRef.current);

    try {
      if (supabaseActive && supabase) {
        const { error } = await supabase.from('team_rosters').upsert({
          id: teamId,
          team_name: 'MCU Esports',
          players: sanitized,
          updated_at: nowIso,
        });
        if (!error) {
          setIsCloudConnected(true);
          setLastSyncedAt(nowIso);
          setSyncError(null);
          return true;
        }
      }

      // If Supabase not yet configured, save locally
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
      setLastSyncedAt(nowIso);
      return true;
    } catch (err: any) {
      console.error('Force sync failed:', err);
      setSyncError(err?.message || 'การเชื่อมต่อขัดข้อง');
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [teamId, supabaseActive]);

  // Manual Reload from Cloud
  const reloadFromCloud = useCallback(async (): Promise<boolean> => {
    setIsSyncing(true);
    try {
      if (supabaseActive && supabase) {
        const { data, error } = await supabase
          .from('team_rosters')
          .select('*')
          .eq('id', teamId)
          .maybeSingle();

        if (!error && data && Array.isArray(data.players)) {
          const sanitized = sanitizePlayers(data.players);
          setPlayers(sanitized);
          playersRef.current = sanitized;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
          setIsCloudConnected(true);
          setLastSyncedAt(data.updated_at || new Date().toISOString());
          setSyncError(null);
          return true;
        }
      }

      // Fallback to local storage
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const sanitized = sanitizePlayers(parsed);
          setPlayers(sanitized);
          playersRef.current = sanitized;
          return true;
        }
      }
      return false;
    } catch (err: any) {
      console.error('Reload from Cloud failed:', err);
      setSyncError(err?.message || 'โหลดข้อมูลจาก Cloud ไม่สำเร็จ');
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [teamId, supabaseActive]);

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
      avatarUrl?: string;
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
    activeProvider,
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
