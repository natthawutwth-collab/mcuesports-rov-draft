import { LaneSelectKey } from './draft';

export type ScrimResult = 'won' | 'lost' | 'draw' | 'in_progress';
export type ScrimSeriesFormat = 'BO1' | 'BO3' | 'BO5' | 'BO7';

export interface ScrimPlayerAssignment {
  slotIndex: number;
  position: LaneSelectKey;
  heroName: string;
  playerId?: string;
  playerName?: string;
  playerNickname?: string;
}

export interface ScrimCoachNotes {
  draftObjective: string; // เป้าหมายของแผนดราฟต์
  whatWentWell: string; // สิ่งที่ทำได้ดี
  issuesFaced: string; // ปัญหาที่พบ
  lessonsLearned: string; // บทเรียนหลังเกม
  coachRating?: number; // 1 - 5 ดาว
}

export interface ScrimGame {
  id: string;
  sessionId: string;
  gameNumber: number;
  ourSide: 'blue' | 'red';
  winner: 'us' | 'opp' | 'draw' | 'undecided';
  result: ScrimResult;
  blueTeamName: string;
  redTeamName: string;
  blueBans: string[];
  redBans: string[];
  bluePicks: ScrimPlayerAssignment[];
  redPicks: ScrimPlayerAssignment[];
  isComplete: boolean; // ตรวจสอบว่า Pick ครบ 5 ตัวทั้งสองฝั่งหรือไม่
  coachNotes: ScrimCoachNotes;
  matchDurationMinutes?: number;
  vodUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScrimSession {
  id: string;
  teamId: string;
  sessionTitle: string; // ชื่อการซ้อม เช่น ซ้อมอุ่นเครื่องก่อนเปิดฤดูกาล
  opponentTeam: string; // ชื่อคู่แข่ง
  sessionDate: string; // YYYY-MM-DD
  sessionTime?: string;
  format: ScrimSeriesFormat;
  patch: string;
  ourScore: number;
  oppScore: number;
  status: 'completed' | 'in_progress' | 'scheduled';
  games: ScrimGame[];
  overallNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScrimFilter {
  searchQuery?: string;
  opponent?: string;
  side?: 'all' | 'blue' | 'red';
  result?: 'all' | 'won' | 'lost' | 'in_progress';
  dateFrom?: string;
  dateTo?: string;
}

export interface ScrimStatsSummary {
  totalSessions: number;
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  blueGames: number;
  blueWins: number;
  blueWinRate: number;
  redGames: number;
  redWins: number;
  redWinRate: number;
  mostPickedHeroes: Array<{
    heroName: string;
    games: number;
    wins: number;
    losses: number;
    winRate: number;
  }>;
}
