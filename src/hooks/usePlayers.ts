import { useState, useEffect, useMemo, useCallback } from 'react';
import { Player, PlayerPosition, HeroPlayerBadge, PlayerHeroPoolItem } from '../types/player';
import { INITIAL_PLAYERS } from '../data/initialPlayers';

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

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
    } catch (e) {
      console.error('Failed to save players to localStorage', e);
    }
  }, [players]);

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
    setPlayers((prev) => [newPlayer, ...prev]);
    return newPlayer;
  }, []);

  // Update player
  const updatePlayer = useCallback((id: string, updates: Partial<Omit<Player, 'id' | 'createdAt'>>) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  }, []);

  // Delete player
  const deletePlayer = useCallback((id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Reset to default seed players
  const resetToDefaultPlayers = useCallback(() => {
    setPlayers(INITIAL_PLAYERS);
  }, []);

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
