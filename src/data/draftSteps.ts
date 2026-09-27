import { DraftTurn } from '../types/draft';

export const DRAFT_TURNS: DraftTurn[] = [
  { team: 'blue', phase: 'ban', count: 1, time: 40, label: 'PHASE 1 BAN #1 (BLUE)' },
  { team: 'red',  phase: 'ban', count: 1, time: 40, label: 'PHASE 1 BAN #1 (RED)' },
  { team: 'blue', phase: 'ban', count: 1, time: 40, label: 'PHASE 1 BAN #2 (BLUE)' },
  { team: 'red',  phase: 'ban', count: 1, time: 40, label: 'PHASE 1 BAN #2 (RED)' },
  { team: 'blue', phase: 'pick', count: 1, time: 60, label: 'PICK #1 (BLUE)' },
  { team: 'red',  phase: 'pick', count: 2, time: 60, label: 'PICK #2-3 (RED — 2 PICKS)' },
  { team: 'blue', phase: 'pick', count: 2, time: 60, label: 'PICK #4-5 (BLUE — 2 PICKS)' },
  { team: 'red',  phase: 'pick', count: 1, time: 60, label: 'PICK #6 (RED)' },
  { team: 'red',  phase: 'ban', count: 1, time: 40, label: 'PHASE 2 BAN #3 (RED)' },
  { team: 'blue', phase: 'ban', count: 1, time: 40, label: 'PHASE 2 BAN #3 (BLUE)' },
  { team: 'red',  phase: 'ban', count: 1, time: 40, label: 'PHASE 2 BAN #4 (RED)' },
  { team: 'blue', phase: 'ban', count: 1, time: 40, label: 'PHASE 2 BAN #4 (BLUE)' },
  { team: 'red',  phase: 'pick', count: 1, time: 60, label: 'PHASE 2 PICK #7 (RED)' },
  { team: 'blue', phase: 'pick', count: 2, time: 60, label: 'PHASE 2 PICK #8-9 (BLUE — 2 PICKS)' },
  { team: 'red',  phase: 'pick', count: 1, time: 60, label: 'PHASE 2 PICK #10 (RED — LAST PICK)' },
];

export const BLUE_PICK_ORDER = [1, 4, 5, 8, 9];
export const RED_PICK_ORDER = [2, 3, 6, 7, 10];
