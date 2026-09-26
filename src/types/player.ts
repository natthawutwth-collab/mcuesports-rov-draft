export type PlayerPosition = 'DSL' | 'Jungle' | 'Mid' | 'Support' | 'ADL';

export type HeroProficiency = 'signature' | 'comfortable';

export interface PlayerHeroPoolItem {
  heroName: string;
  tier: HeroProficiency;
}

export interface Player {
  id: string;
  name: string;
  nickname: string;
  position: PlayerPosition;
  avatarUrl?: string;
  heroPool: PlayerHeroPoolItem[];
  createdAt: number;
}

export interface HeroPlayerBadge {
  playerId: string;
  playerName: string;
  playerNickname: string;
  position: PlayerPosition;
  tier: HeroProficiency;
  playerAvatar?: string;
}
