import { Hero, TeamSide, SlotType, LaneSelectKey } from './draft';

export interface SimulatorSlot {
  id: string;
  slotIndex: number;
  type: SlotType;
  team: TeamSide;
  hero: Hero | null;
  pos: LaneSelectKey;
  pickOrder?: number;
}

export interface SimulatorAction {
  turnIdx: number;
  turnSel: number;
  hero: Hero;
  team: TeamSide;
  phase: SlotType;
  slotIndex: number;
  pos?: LaneSelectKey;
}

export interface PlanPickSlot {
  hero: Hero | null;
  pos: LaneSelectKey;
  isTarget?: boolean;
  backupHero1?: Hero | null;
  backupHero2?: Hero | null;
  backupReason?: string;
}

export interface ScenarioPlan {
  id: 'plan_a' | 'plan_b' | 'plan_c' | string;
  name: string; // e.g. "แผน A: Triple Dive & Early Aggression"
  description: string;
  tacticalGoal: string; // e.g. "คุม Deep Jungle และปิดเกมเร็วด้วย Aoi + Capheny"
  bluePicks: PlanPickSlot[];
  redPicks: PlanPickSlot[];
  notes: string;
  keyWinCondition?: string;
  contingencyTrigger?: string; // e.g. "หากโดนแบน Capheny หรือ Aoi"
}

export interface TacticalRoleBadge {
  type: 'first_pick' | 'counter_pick' | 'comfort_pick' | 'flex_pick';
  label: string;
  description: string;
  badgeClass: string;
  detail?: string;
}

export interface HeroTacticalProfile {
  hero: Hero;
  badges: TacticalRoleBadge[];
  firstPickScore?: number;
  counterAgainst: Array<{ oppHero: string; advantage: number; note: string }>;
  comfortInfo?: { playerName: string; role: string; confidence: 'high' | 'medium' };
  flexRoles: LaneSelectKey[];
}

export interface RippleImpactAnalysis {
  action: 'pick' | 'ban';
  hero: Hero;
  team: TeamSide;
  deniedOpponentPicks: string[];
  unlockedTeamSynergies: string[];
  tacticalImpactSummary: string;
  threatLevel: 'high' | 'medium' | 'low';
}

export interface FallbackOption {
  targetHero: Hero;
  role: LaneSelectKey;
  primaryBackup: {
    hero: Hero;
    reason: string;
    similarityScore: number;
  };
  secondaryBackup: {
    hero: Hero;
    reason: string;
    similarityScore: number;
  };
}

export interface SimulatorScenario {
  id: string;
  name: string;
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  blueTeamName: string;
  redTeamName: string;
  blueBans: Array<{ hero: Hero | null }>;
  redBans: Array<{ hero: Hero | null }>;
  bluePicks: Array<{ hero: Hero | null; pos: LaneSelectKey }>;
  redPicks: Array<{ hero: Hero | null; pos: LaneSelectKey }>;
  turnIdx: number;
  turnSel: number;
  notes: string;
  branchParentId?: string;
  branchName?: string;
  // Phase 5 additions
  plans?: ScenarioPlan[];
  activePlanId?: string;
  disclaimerAccepted?: boolean;
}

export interface ScenarioComparison {
  scenarioA: SimulatorScenario;
  scenarioB: SimulatorScenario;
}
