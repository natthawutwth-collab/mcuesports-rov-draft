export type PlayerPosition = 'DSL' | 'Jungle' | 'Mid' | 'Support' | 'ADL';

export type HeroProficiency = 'signature' | 'comfortable';

export type TeamCategory = 'all' | 'male' | 'female' | 'mixed';
export type PlayerCategory = 'male' | 'female' | 'mixed';

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
  category?: PlayerCategory; // backward compat: 'male' | 'female' | 'mixed'
  categories?: PlayerCategory[]; // Up to 2 teams: ['male', 'mixed'] or ['female', 'mixed']
  createdAt: number;
}

export interface HeroPlayerBadge {
  playerId: string;
  playerName: string;
  playerNickname: string;
  position: PlayerPosition;
  tier: HeroProficiency;
  playerAvatar?: string;
  category?: PlayerCategory;
  categories?: PlayerCategory[];
}
