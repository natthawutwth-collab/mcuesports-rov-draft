import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Player, PlayerPosition, HeroPlayerBadge, PlayerHeroPoolItem } from '../types/player';
import { supabase, isSupabaseConfigured } from '../services/supabase';

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
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(() => isSupabaseConfigured);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Keep ref of latest players to avoid stale closure during auto-initialization
  const playersRef = useRef<Player[]>(players);
  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  // Supabase Sync (Cross-device real-time sync via Postgres Realtime)
  useEffect(() => {
    let isSubscribed = true;
    let channel: any = null;

    async function initSupabaseSync() {
      if (!supabase || !isSupabaseConfigured) {
        if (isSubscribed) {
          setIsCloudConnected(false);
        }
        return;
      }

      try {
        // 1. Fetch initial cloud roster
        const { data, error } = await supabase
          .from('team_rosters')
          .select('*')
          .eq('id', teamId)
          .maybeSingle();

        if (!isSubscribed) return;

        if (!error && data && Array.isArray(data.players)) {
          const sanitized = sanitizePlayers(data.players);

          // If Supabase still contained sample players, clean them up
          if (sanitized.length !== data.players.length) {
            supabase
              .from('team_rosters')
              .update({
                players: sanitized,
                updated_at: new Date().toISOString(),
              })
              .eq('id', teamId)
              .then(() => {});
          }

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
        } else if (!error && !data) {
          // Initialize empty record for teamId
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
        } else if (error) {
          console.warn('Supabase fetch team_rosters warning:', error.message);
          if (isSubscribed) {
            setIsCloudConnected(false);
            setSyncError('กำลังใช้งานโหมดออฟไลน์ (เชื่อมต่อ Supabase ไม่สำเร็จ)');
          }
        }

        // 2. Realtime subscription for cross-device live updates
        channel = supabase
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
                const incomingPlayers = sanitizePlayers((payload.new as any).players);
                setPlayers(incomingPlayers);
                playersRef.current = incomingPlayers;
                setIsCloudConnected(true);
                setSyncError(null);
                setLastSyncedAt((payload.new as any).updated_at || new Date().toISOString());

                try {
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(incomingPlayers));
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
                setIsCloudConnected(false);
              }
            }
          });
      } catch (err) {
        console.warn('Failed to initialize Supabase sync:', err);
        if (isSubscribed) {
          setIsCloudConnected(false);
        }
      }
    }

    initSupabaseSync();

    return () => {
      isSubscribed = false;
      if (channel && supabase) {
        supabase.removeChannel(channel).catch(() => {});
      }
    };
  }, [teamId]);

  // Save to both localStorage & Supabase
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

      // 2. Persist to Supabase across all devices
      if (supabase && isSupabaseConfigured) {
        setIsSyncing(true);
        setSyncError(null);
        try {
          const nowIso = new Date().toISOString();
          const { error } = await supabase.from('team_rosters').upsert({
            id: teamId,
            team_name: 'MCU Esports',
            players: sanitized,
            updated_at: nowIso,
          });

          if (error) throw error;
          setIsCloudConnected(true);
          setLastSyncedAt(nowIso);
        } catch (err: any) {
          console.error('Failed to sync players to Supabase:', err);
          setSyncError(err?.message || 'บันทึกขึ้น Supabase ไม่สำเร็จ');
        } finally {
          setIsSyncing(false);
        }
      }
    },
    [teamId]
  );

  // Manual Force Sync to Supabase
  const forceSyncToCloud = useCallback(async (): Promise<boolean> => {
    if (!supabase || !isSupabaseConfigured) {
      setSyncError('Supabase ยังไม่ได้กำหนดค่า');
      return false;
    }

    setIsSyncing(true);
    try {
      const nowIso = new Date().toISOString();
      const sanitized = sanitizePlayers(playersRef.current);
      const { error } = await supabase.from('team_rosters').upsert({
        id: teamId,
        team_name: 'MCU Esports',
        players: sanitized,
        updated_at: nowIso,
      });

      if (error) throw error;

      setIsCloudConnected(true);
      setLastSyncedAt(nowIso);
      setSyncError(null);
      return true;
    } catch (err: any) {
      console.error('Force sync to Supabase failed:', err);
      setSyncError(err?.message || 'เชื่อมต่อ Supabase ล้มเหลว');
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [teamId]);

  // Manual Reload from Supabase
  const reloadFromCloud = useCallback(async (): Promise<boolean> => {
    if (!supabase || !isSupabaseConfigured) {
      setSyncError('Supabase ยังไม่ได้กำหนดค่า');
      return false;
    }

    setIsSyncing(true);
    try {
      const { data, error } = await supabase
        .from('team_rosters')
        .select('*')
        .eq('id', teamId)
        .maybeSingle();

      if (error) throw error;

      if (data && Array.isArray(data.players)) {
        const sanitized = sanitizePlayers(data.players);
        setPlayers(sanitized);
        playersRef.current = sanitized;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
        setIsCloudConnected(true);
        setLastSyncedAt(data.updated_at || new Date().toISOString());
        setSyncError(null);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Reload from Supabase failed:', err);
      setSyncError(err?.message || 'โหลดข้อมูลจาก Supabase ไม่สำเร็จ');
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
