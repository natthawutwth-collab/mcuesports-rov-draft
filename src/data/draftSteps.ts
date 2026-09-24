import { DraftTurn } from '../types/draft';

export const DRAFT_TURNS: DraftTurn[] = [
  { team: 'blue', phase: 'ban', count: 1, time: 40, label: 'PHASE 1 BAN' },
  { team: 'red',  phase: 'ban', count: 1, time: 40, label: 'PHASE 1 BAN' },
  { team: 'blue', phase: 'ban', count: 1, time: 40, label: 'PHASE 1 BAN' },
  { team: 'red',  phase: 'ban', count: 1, time: 40, label: 'PHASE 1 BAN' },
  { team: 'blue', phase: 'pick', count: 1, time: 60, label: 'PICK #1' },
  { team: 'red',  phase: 'pick', count: 2, time: 60, label: 'PICK #2-3 — R-R' },
  { team: 'blue', phase: 'pick', count: 2, time: 60, label: 'PICK #4-5 — B-B' },
  { team: 'red',  phase: 'pick', count: 1, time: 60, label: 'PICK #6' },
  { team: 'red',  phase: 'ban', count: 1, time: 40, label: 'PHASE 2 BAN' },
  { team: 'blue', phase: 'ban', count: 1, time: 40, label: 'PHASE 2 BAN' },
  { team: 'red',  phase: 'ban', count: 1, time: 40, label: 'PHASE 2 BAN' },
  { team: 'blue', phase: 'ban', count: 1, time: 40, label: 'PHASE 2 BAN' },
  { team: 'red',  phase: 'pick', count: 1, time: 60, label: 'PHASE 2 PICK' },
  { team: 'blue', phase: 'pick', count: 2, time: 60, label: 'PHASE 2 PICK — B-B' },
  { team: 'red',  phase: 'pick', count: 1, time: 60, label: 'PHASE 2 PICK' },
];

export const BLUE_PICK_ORDER = [1, 4, 5, 8, 9];
export const RED_PICK_ORDER = [2, 3, 6, 7, 10];
