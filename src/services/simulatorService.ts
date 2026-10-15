import { SimulatorScenario, SimulatorSlot } from '../types/simulator';
import { Hero, TeamSide, LaneSelectKey, SlotType } from '../types/draft';
import { HEROES } from '../data/heroes';

const SIMULATOR_STORAGE_KEY = 'mcu_rov_simulator_scenarios_v1';

export class SimulatorService {
  public getAllScenarios(): SimulatorScenario[] {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') return [];
      const raw = localStorage.getItem(SIMULATOR_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to get simulator scenarios', e);
      return [];
    }
  }

  public createNewScenario(params?: Partial<SimulatorScenario>): SimulatorScenario {
    const id = params?.id || `scenario_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const defaultPos: LaneSelectKey[] = ['DSL', 'JG', 'MID', 'ROAM', 'ADL'];
    const scenario: SimulatorScenario = {
      id,
      name: params?.name || 'Sandbox Draft Simulation',
      description: params?.description || 'สถานการณ์จำลองเพื่อทดลองดราฟต์',
      tags: params?.tags || ['sandbox'],
      createdAt: params?.createdAt || new Date().toISOString(),
      updatedAt: params?.updatedAt || new Date().toISOString(),
      blueTeamName: params?.blueTeamName || 'MCU Esports (Blue)',
      redTeamName: params?.redTeamName || 'Opponent (Red)',
      blueBans: params?.blueBans || [{ hero: null }, { hero: null }, { hero: null }, { hero: null }],
      redBans: params?.redBans || [{ hero: null }, { hero: null }, { hero: null }, { hero: null }],
      bluePicks: params?.bluePicks && params.bluePicks.length === 5
        ? params.bluePicks
        : defaultPos.map((pos) => ({ hero: null, pos })),
      redPicks: params?.redPicks && params.redPicks.length === 5
        ? params.redPicks
        : defaultPos.map((pos) => ({ hero: null, pos })),
      turnIdx: params?.turnIdx ?? 0,
      turnSel: params?.turnSel ?? 0,
      notes: params?.notes || '',
      plans: params?.plans,
      activePlanId: params?.activePlanId,
      disclaimerAccepted: params?.disclaimerAccepted,
    };
    return scenario;
  }

  public saveScenario(scenario: SimulatorScenario): void {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
      const all = this.getAllScenarios().filter((s) => s.id !== scenario.id);
      scenario.updatedAt = new Date().toISOString();
      all.unshift(scenario);
      localStorage.setItem(SIMULATOR_STORAGE_KEY, JSON.stringify(all));
    } catch (e) {
      console.error('Failed to save simulator scenario', e);
    }
  }

  public deleteScenario(id: string): void {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
      const all = this.getAllScenarios().filter((s) => s.id !== id);
      localStorage.setItem(SIMULATOR_STORAGE_KEY, JSON.stringify(all));
    } catch (e) {
      console.error('Failed to delete simulator scenario', e);
    }
  }

  public branchScenario(parent: SimulatorScenario, branchName: string): SimulatorScenario {
    const newId = `scenario_branch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const cloned: SimulatorScenario = {
      ...parent,
      id: newId,
      name: branchName || `${parent.name} (Branch)`,
      description: `สร้างกิ่งดราฟต์แยกจาก: ${parent.name}`,
      tags: [...(parent.tags || []), 'branch'],
      branchParentId: parent.id,
      branchName: branchName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      blueBans: parent.blueBans.map((b) => ({ ...b })),
      redBans: parent.redBans.map((b) => ({ ...b })),
      bluePicks: parent.bluePicks.map((p) => ({ ...p })),
      redPicks: parent.redPicks.map((p) => ({ ...p })),
      plans: parent.plans ? JSON.parse(JSON.stringify(parent.plans)) : undefined,
      activePlanId: parent.activePlanId,
      disclaimerAccepted: parent.disclaimerAccepted,
    };
    this.saveScenario(cloned);
    return cloned;
  }

  /**
   * Generates a high-resolution 1200x675 PNG draft graphic card using HTML5 Canvas.
   * Works client-side without external dependencies.
   */
  public async exportDraftImage(
    title: string,
    blueTeam: string,
    redTeam: string,
    blueBans: string[],
    redBans: string[],
    bluePicks: Array<{ name: string; pos?: string }>,
    redPicks: Array<{ name: string; pos?: string }>
  ): Promise<string> {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 675;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Background: High quality dark esports arena theme with pink/blue glow
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, 1200, 675);

    // Subtle gradient mesh
    const grad = ctx.createLinearGradient(0, 0, 1200, 675);
    grad.addColorStop(0, 'rgba(233, 30, 99, 0.15)'); // MCU Pink
    grad.addColorStop(0.5, 'rgba(15, 23, 42, 0.95)');
    grad.addColorStop(1, 'rgba(2, 132, 199, 0.15)'); // Blue Side
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 675);

    // Header banner
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(40, 30, 1120, 75);
    ctx.strokeStyle = '#E91E63';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 30, 1120, 75);

    // Header text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Prompt, sans-serif';
    ctx.fillText('MCU ESPORTS — ROV DRAFT ASSISTANT', 65, 75);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '14px Prompt, sans-serif';
    ctx.fillText(`${title || 'Draft Scenario'} • ${new Date().toLocaleDateString('th-TH')}`, 65, 95);

    // Blue Team Column
    ctx.fillStyle = 'rgba(2, 132, 199, 0.12)';
    ctx.fillRect(40, 125, 545, 500);
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(40, 125, 545, 500);

    ctx.fillStyle = '#38BDF8';
    ctx.font = 'bold 20px Prompt, sans-serif';
    ctx.fillText(`BLUE SIDE — ${blueTeam || 'Blue Team'}`, 60, 160);

    // Blue Bans
    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 12px Prompt, sans-serif';
    ctx.fillText('BANS:', 60, 190);
    blueBans.forEach((b, idx) => {
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(110 + idx * 95, 175, 85, 24);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px Prompt, sans-serif';
      ctx.fillText(b || '—', 115 + idx * 95, 191);
    });

    // Blue Picks (5 slots)
    bluePicks.forEach((p, idx) => {
      const y = 220 + idx * 75;
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(60, y, 505, 65);
      ctx.strokeStyle = '#0284C7';
      ctx.lineWidth = 1;
      ctx.strokeRect(60, y, 505, 65);

      // Pos badge
      ctx.fillStyle = '#0284C7';
      ctx.fillRect(70, y + 15, 45, 35);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px Prompt, sans-serif';
      ctx.fillText(p.pos || `P${idx + 1}`, 77, y + 38);

      // Hero name
      ctx.fillStyle = '#F8FAFC';
      ctx.font = 'bold 18px Prompt, sans-serif';
      ctx.fillText(p.name || `Pick ${idx + 1} (Empty)`, 130, y + 40);
    });

    // Red Team Column
    ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
    ctx.fillRect(615, 125, 545, 500);
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(615, 125, 545, 500);

    ctx.fillStyle = '#F87171';
    ctx.font = 'bold 20px Prompt, sans-serif';
    ctx.fillText(`RED SIDE — ${redTeam || 'Red Team'}`, 635, 160);

    // Red Bans
    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 12px Prompt, sans-serif';
    ctx.fillText('BANS:', 635, 190);
    redBans.forEach((b, idx) => {
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(685 + idx * 95, 175, 85, 24);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px Prompt, sans-serif';
      ctx.fillText(b || '—', 690 + idx * 95, 191);
    });

    // Red Picks (5 slots)
    redPicks.forEach((p, idx) => {
      const y = 220 + idx * 75;
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(635, y, 505, 65);
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 1;
      ctx.strokeRect(635, y, 505, 65);

      // Pos badge
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(645, y + 15, 45, 35);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px Prompt, sans-serif';
      ctx.fillText(p.pos || `P${idx + 1}`, 652, y + 38);

      // Hero name
      ctx.fillStyle = '#F8FAFC';
      ctx.font = 'bold 18px Prompt, sans-serif';
      ctx.fillText(p.name || `Pick ${idx + 1} (Empty)`, 705, y + 40);
    });

    // Watermark
    ctx.fillStyle = '#64748B';
    ctx.font = '11px Prompt, sans-serif';
    ctx.fillText('MCU Esports RoV Draft Assistant • Professional Coaching Tool', 420, 655);

    return canvas.toDataURL('image/png');
  }
}

export const simulatorService = new SimulatorService();
