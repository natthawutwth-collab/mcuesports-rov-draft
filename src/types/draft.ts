export type PositionKey = 'all' | 'dsl' | 'jg' | 'mid' | 'roam' | 'adl';

export type LaneSelectKey = 'DSL' | 'JG' | 'MID' | 'ROAM' | 'ADL' | '';

export interface Hero {
  id: string;
  name: string;
  nameTh: string;
  r: string;
  roles: string[];
  pos: PositionKey[];
  primaryPos: PositionKey;
  avatarUrl: string;
  tags: string[];
}

export type TeamSide = 'blue' | 'red';
export type SlotType = 'ban' | 'pick';

export interface DraftTurn {
  team: TeamSide;
  phase: SlotType;
  count: number;
  time: number;
  label: string;
}

export interface DraftSlot {
  id: string;
  slotIndex: number;
  slotAbbr: string;
  type: SlotType;
  team: TeamSide;
  hero: Hero | null;
  pos: LaneSelectKey;
  pickOrder?: number;
}

export interface DraftAction {
  turnIdx: number;
  turnSel: number;
  hero: Hero;
  team: TeamSide;
  phase: SlotType;
  slotIndex: number;
}

export interface MatchNoteGame {
  id: string;
  gameNum: number;
  winner: 'us' | 'opp' | null;
  usSide: TeamSide;
  oppSide: TeamSide;
  usBans: string[];
  oppBans: string[];
  usPicks: {
    dsl?: string;
    jg?: string;
    mid?: string;
    roam?: string;
    adl?: string;
  };
  oppPicks: {
    dsl?: string;
    jg?: string;
    mid?: string;
    roam?: string;
    adl?: string;
  };
  note: string;
}
