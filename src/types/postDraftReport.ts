import { Hero, LaneSelectKey } from './draft';

export interface TeamDamageDistribution {
  physicalPct: number;
  magicalPct: number;
  trueDamagePct: number;
  primaryDamageProfile: 'Burst Heavy' | 'Sustained DPS' | 'Poke & Siege' | 'Balanced Mixed';
}

export interface TacticalAspectRating {
  score: number; // 0 - 100
  rating: 'S' | 'A' | 'B' | 'C' | 'D';
  verdict: string;
  keyHeroes: string[];
}

export interface PostDraftReportData {
  generatedAt: string;
  isCompleted: boolean;
  blueTeamName: string;
  redTeamName: string;
  analyzedSide: 'blue' | 'red';
  
  // Team Composition Details
  lineup: Array<{
    heroName: string;
    position: LaneSelectKey | string;
    role: string;
    damageType: 'Physical' | 'Magical' | 'True' | 'Hybrid';
    avatarUrl: string;
  }>;
  damageDistribution: TeamDamageDistribution;

  // Strengths & Weaknesses
  strengths: Array<{ title: string; description: string; tag: string }>;
  weaknesses: Array<{ title: string; description: string; tag: string; severity: 'high' | 'medium' | 'low' }>;

  // Game Phases
  earlyGame: { rating: 'Strong' | 'Average' | 'Weak'; timing: string; details: string };
  midGame: { rating: 'Strong' | 'Average' | 'Weak'; timing: string; details: string };
  lateGame: { rating: 'Strong' | 'Average' | 'Weak'; timing: string; details: string };

  // Tactical Capabilities
  engageOptions: { primary: string[]; secondary: string[]; description: string };
  peelOptions: { frontliners: string[]; protectiveTools: string[]; description: string };
  objectiveControl: { slayerBurst: 'Very Fast' | 'Fast' | 'Moderate' | 'Slow'; zoneControl: string; details: string };

  // Tactical Win Conditions
  winConditions: Array<{
    step: number;
    title: string;
    description: string;
    conditionType: 'Macro' | 'Teamfight' | 'Split' | 'Pickoff';
  }>;

  // Disclaimer
  disclaimer: string;
}
