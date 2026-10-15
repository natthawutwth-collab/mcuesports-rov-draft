import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Swords,
  RotateCcw,
  Undo2,
  Redo2,
  Save,
  GitBranch,
  Layers,
  Download,
  AlertTriangle,
  FileText,
  Search,
  Trash2,
  Split,
  Plus,
  Shield,
  Zap,
  CheckCircle,
  HelpCircle,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Hero, TeamSide, SlotType, LaneSelectKey } from '../types/draft';
import {
  SimulatorScenario,
  ScenarioPlan,
  PlanPickSlot,
  HeroTacticalProfile,
  RippleImpactAnalysis,
  FallbackOption,
} from '../types/simulator';
import { simulatorService } from '../services/simulatorService';
import {
  draftScenarioSimulatorService,
  SIMULATOR_DISCLAIMER,
} from '../services/draftScenarioSimulatorService';
import { HEROES, getHeroImageUrl } from '../data/heroes';
import { HeroPickerModal } from './HeroPickerModal';
import { PostDraftReportModal } from './PostDraftReportModal';
import { Player } from '../types/player';

export interface LiveDraftSnapshot {
  blueTeamName: string;
  redTeamName: string;
  blueBans: Array<{ hero: Hero | null }>;
  redBans: Array<{ hero: Hero | null }>;
  bluePicks: Array<{ hero: Hero | null; pos: LaneSelectKey }>;
  redPicks: Array<{ hero: Hero | null; pos: LaneSelectKey }>;
  turnIdx?: number;
}

interface DraftSimulatorViewProps {
  onApplyToLiveDraft?: (scenario: SimulatorScenario) => void;
  initialScenario?: SimulatorScenario;
  liveDraftSnapshot?: LiveDraftSnapshot;
  players?: Player[];
}

const DEFAULT_POSITIONS: LaneSelectKey[] = ['DSL', 'JG', 'MID', 'ROAM', 'ADL'];

export const DraftSimulatorView: React.FC<DraftSimulatorViewProps> = ({
  onApplyToLiveDraft,
  initialScenario,
  liveDraftSnapshot,
  players = [],
}) => {
  // Scenario metadata state
  const [scenarioName, setScenarioName] = useState<string>(
    initialScenario?.name || 'Sandbox Simulation #1'
  );
  const [blueTeamName, setBlueTeamName] = useState<string>(
    initialScenario?.blueTeamName || 'MCU Esports (Blue)'
  );
  const [redTeamName, setRedTeamName] = useState<string>(
    initialScenario?.redTeamName || 'Opponent Team (Red)'
  );
  const [scenarioNotes, setScenarioNotes] = useState<string>(initialScenario?.notes || '');
  const [showDisclaimer, setShowDisclaimer] = useState<boolean>(true);

  // 4 bans per team (Shared across plans in current scenario)
  const [blueBans, setBlueBans] = useState<Array<{ hero: Hero | null }>>(() => {
    if (initialScenario?.blueBans?.length) return initialScenario.blueBans;
    return [{ hero: null }, { hero: null }, { hero: null }, { hero: null }];
  });
  const [redBans, setRedBans] = useState<Array<{ hero: Hero | null }>>(() => {
    if (initialScenario?.redBans?.length) return initialScenario.redBans;
    return [{ hero: null }, { hero: null }, { hero: null }, { hero: null }];
  });

  // Multi-Plan A/B/C state
  const [plans, setPlans] = useState<ScenarioPlan[]>(() => {
    if (initialScenario?.plans && initialScenario.plans.length > 0) {
      return initialScenario.plans;
    }
    const initBlue = initialScenario?.bluePicks || DEFAULT_POSITIONS.map((pos) => ({ hero: null, pos }));
    const initRed = initialScenario?.redPicks || DEFAULT_POSITIONS.map((pos) => ({ hero: null, pos }));
    return draftScenarioSimulatorService.createInitialPlans(initBlue, initRed, HEROES);
  });

  const [activePlanId, setActivePlanId] = useState<string>(() => {
    return initialScenario?.activePlanId || plans[0]?.id || 'plan_a';
  });

  // Active plan object
  const activePlan = useMemo(() => {
    const found = plans.find((p) => p.id === activePlanId);
    return found || plans[0];
  }, [plans, activePlanId]);

  // Current Picks from active plan
  const bluePicks = useMemo(() => activePlan.bluePicks, [activePlan]);
  const redPicks = useMemo(() => activePlan.redPicks, [activePlan]);

  // Ripple impact tracking
  const [lastRipple, setLastRipple] = useState<RippleImpactAnalysis | null>(null);

  // Undo / Redo history
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Modals & Panels
  const [pickerTarget, setPickerTarget] = useState<{
    team: 'blue' | 'red';
    phase: 'ban' | 'pick';
    index: number;
    pos?: LaneSelectKey;
  } | null>(null);

  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [isLoadDrawerOpen, setIsLoadDrawerOpen] = useState<boolean>(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);
  const [isPostDraftReportOpen, setIsPostDraftReportOpen] = useState<boolean>(false);
  const [isConfirmApplyLiveOpen, setIsConfirmApplyLiveOpen] = useState<boolean>(false);
  const [exportImageUrl, setExportImageUrl] = useState<string | null>(null);

  // Selected hero for inspector card in sandbox
  const [inspectedHero, setInspectedHero] = useState<Hero | null>(null);

  // Toast notification
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Push to history snapshot
  const pushHistorySnapshot = useCallback(() => {
    const snap = {
      blueTeamName,
      redTeamName,
      blueBans: JSON.parse(JSON.stringify(blueBans)),
      redBans: JSON.parse(JSON.stringify(redBans)),
      plans: JSON.parse(JSON.stringify(plans)),
      activePlanId,
    };
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), snap]);
    setHistoryIndex((prev) => prev + 1);
  }, [blueTeamName, redTeamName, blueBans, redBans, plans, activePlanId, historyIndex]);

  // Set of unavailable heroes (strictly excluding picked or banned heroes)
  const unavailableHeroNames = useMemo(() => {
    const set = new Set<string>();
    blueBans.forEach((b) => b.hero && set.add(b.hero.name.toLowerCase()));
    redBans.forEach((b) => b.hero && set.add(b.hero.name.toLowerCase()));
    bluePicks.forEach((p) => p.hero && set.add(p.hero.name.toLowerCase()));
    redPicks.forEach((p) => p.hero && set.add(p.hero.name.toLowerCase()));
    return set;
  }, [blueBans, redBans, bluePicks, redPicks]);

  // Update active plan helper
  const updateActivePlan = useCallback((updater: (prevPlan: ScenarioPlan) => ScenarioPlan) => {
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id === activePlanId) {
          return updater(p);
        }
        return p;
      })
    );
  }, [activePlanId]);

  // Handle Hero Selection into slot
  const handleSelectSlotHero = (hero: Hero) => {
    if (!pickerTarget) return;
    pushHistorySnapshot();

    const { team, phase, index } = pickerTarget;

    if (phase === 'ban') {
      if (team === 'blue') {
        setBlueBans((prev) => {
          const c = [...prev];
          c[index] = { hero };
          return c;
        });
      } else {
        setRedBans((prev) => {
          const c = [...prev];
          c[index] = { hero };
          return c;
        });
      }
      // Calculate ripple impact
      const ripple = draftScenarioSimulatorService.calculateRippleImpact(
        'ban',
        hero,
        team,
        bluePicks,
        redPicks
      );
      setLastRipple(ripple);
    } else {
      // Pick phase: update within active plan
      updateActivePlan((p) => {
        const nextPicks = team === 'blue' ? [...p.bluePicks] : [...p.redPicks];
        const targetPos = nextPicks[index]?.pos || DEFAULT_POSITIONS[index];
        const unavailable = new Set(unavailableHeroNames);
        unavailable.add(hero.name.toLowerCase());

        const fb = draftScenarioSimulatorService.generateFallback(
          hero,
          targetPos,
          HEROES,
          unavailable
        );

        nextPicks[index] = {
          hero,
          pos: targetPos,
          isTarget: true,
          backupHero1: fb.primaryBackup.hero,
          backupHero2: fb.secondaryBackup.hero,
          backupReason: fb.primaryBackup.reason,
        };

        if (team === 'blue') {
          return { ...p, bluePicks: nextPicks };
        } else {
          return { ...p, redPicks: nextPicks };
        }
      });

      // Calculate ripple impact
      const ripple = draftScenarioSimulatorService.calculateRippleImpact(
        'pick',
        hero,
        team,
        bluePicks,
        redPicks
      );
      setLastRipple(ripple);
    }

    setInspectedHero(hero);
    setPickerTarget(null);
  };

  // Clear Slot
  const handleClearSlot = (team: 'blue' | 'red', phase: 'ban' | 'pick', index: number) => {
    pushHistorySnapshot();
    if (phase === 'ban') {
      if (team === 'blue') {
        setBlueBans((prev) => {
          const c = [...prev];
          c[index] = { hero: null };
          return c;
        });
      } else {
        setRedBans((prev) => {
          const c = [...prev];
          c[index] = { hero: null };
          return c;
        });
      }
    } else {
      updateActivePlan((p) => {
        if (team === 'blue') {
          const c = [...p.bluePicks];
          c[index] = { ...c[index], hero: null, backupHero1: null, backupHero2: null };
          return { ...p, bluePicks: c };
        } else {
          const c = [...p.redPicks];
          c[index] = { ...c[index], hero: null, backupHero1: null, backupHero2: null };
          return { ...p, redPicks: c };
        }
      });
    }
  };

  // Simulate Hijack / Ban on Target Pick
  const handleSimulateHijack = (team: 'blue' | 'red', slotIndex: number) => {
    const picks = team === 'blue' ? bluePicks : redPicks;
    const targetSlot = picks[slotIndex];
    if (!targetSlot?.hero) return;

    const originalHero = targetSlot.hero;
    const backupHero = targetSlot.backupHero1 || targetSlot.backupHero2;

    if (!backupHero) {
      triggerToast(`ไม่มีฮีโร่สำรองสำหรับ ${originalHero.name}`);
      return;
    }

    pushHistorySnapshot();

    // Ban or take away original hero onto opposing ban/pick, and switch slot to backup
    if (team === 'blue') {
      // Put original hero into red ban slot if available
      setRedBans((prev) => {
        const c = [...prev];
        const emptyIdx = c.findIndex((b) => !b.hero);
        if (emptyIdx !== -1) c[emptyIdx] = { hero: originalHero };
        return c;
      });
    } else {
      setBlueBans((prev) => {
        const c = [...prev];
        const emptyIdx = c.findIndex((b) => !b.hero);
        if (emptyIdx !== -1) c[emptyIdx] = { hero: originalHero };
        return c;
      });
    }

    // Switch pick slot to backup hero
    updateActivePlan((p) => {
      const nextPicks = team === 'blue' ? [...p.bluePicks] : [...p.redPicks];
      const unavailable = new Set(unavailableHeroNames);
      unavailable.add(originalHero.name.toLowerCase());
      unavailable.add(backupHero.name.toLowerCase());

      const nextFb = draftScenarioSimulatorService.generateFallback(
        backupHero,
        targetSlot.pos,
        HEROES,
        unavailable
      );

      nextPicks[slotIndex] = {
        hero: backupHero,
        pos: targetSlot.pos,
        isTarget: false,
        backupHero1: nextFb.primaryBackup.hero,
        backupHero2: nextFb.secondaryBackup.hero,
        backupReason: `สลับใช้ตัวสำรองเนื่องจาก ${originalHero.name} โดนคู่แข่งแบน/ตัดตัว`,
      };

      return team === 'blue' ? { ...p, bluePicks: nextPicks } : { ...p, redPicks: nextPicks };
    });

    triggerToast(`⚡ จำลองสถานการณ์: ${originalHero.name} โดนตัด -> สลับใช้ ${backupHero.name} อัตโนมัติ`);
  };

  // Undo
  const handleUndo = () => {
    if (historyIndex <= 0) return;
    const prev = history[historyIndex - 1];
    setBlueBans(prev.blueBans);
    setRedBans(prev.redBans);
    setPlans(prev.plans);
    setActivePlanId(prev.activePlanId);
    setHistoryIndex((idx) => idx - 1);
  };

  // Redo
  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    const next = history[historyIndex + 1];
    setBlueBans(next.blueBans);
    setRedBans(next.redBans);
    setPlans(next.plans);
    setActivePlanId(next.activePlanId);
    setHistoryIndex((idx) => idx + 1);
  };

  // Reset Simulator
  const handleResetSimulator = () => {
    if (window.confirm('คุณต้องการรีเซ็ตการจำลองดราฟต์นี้ทั้งหมดใช่หรือไม่? (เกมจริงจะไม่ได้รับผลกระทบ)')) {
      pushHistorySnapshot();
      setBlueBans([{ hero: null }, { hero: null }, { hero: null }, { hero: null }]);
      setRedBans([{ hero: null }, { hero: null }, { hero: null }, { hero: null }]);
      setPlans(
        draftScenarioSimulatorService.createInitialPlans(
          DEFAULT_POSITIONS.map((pos) => ({ hero: null, pos })),
          DEFAULT_POSITIONS.map((pos) => ({ hero: null, pos })),
          HEROES
        )
      );
      setLastRipple(null);
      triggerToast('ล้างกระดานจำลองเรียบร้อยแล้ว');
    }
  };

  // Fork / Import State from Live Draft Snapshot
  const handleForkFromLiveDraft = () => {
    if (!liveDraftSnapshot) {
      triggerToast('ยังไม่มีข้อมูลการดราฟต์สดในระบบ');
      return;
    }
    pushHistorySnapshot();
    setBlueTeamName(liveDraftSnapshot.blueTeamName || 'MCU Esports (Blue)');
    setRedTeamName(liveDraftSnapshot.redTeamName || 'Opponent Team (Red)');
    setBlueBans(liveDraftSnapshot.blueBans);
    setRedBans(liveDraftSnapshot.redBans);
    setPlans(
      draftScenarioSimulatorService.createInitialPlans(
        liveDraftSnapshot.bluePicks,
        liveDraftSnapshot.redPicks,
        HEROES
      )
    );
    triggerToast('🔄 ดึงสถานะจาก Live Draft ปัจจุบันเข้ามาเป็นแผนจำลองสำเร็จ (แยกอิสระจากเกมจริง)');
  };

  // Add New Custom Plan
  const handleAddNewPlan = () => {
    const planName = prompt('ตั้งชื่อแผนดราฟต์ใหม่ (เช่น แผน D: Dive Poke Hybrid):', `แผน ${String.fromCharCode(65 + plans.length)}: Custom Comp`);
    if (!planName) return;
    pushHistorySnapshot();
    const newId = `plan_${Date.now()}`;
    const newPlan: ScenarioPlan = {
      id: newId,
      name: planName,
      description: 'แผนดราฟต์ทางเลือกสำหรับทดสอบ',
      tacticalGoal: 'ระบุเป้าหมายของแผนนี้...',
      bluePicks: JSON.parse(JSON.stringify(bluePicks)),
      redPicks: JSON.parse(JSON.stringify(redPicks)),
      notes: '',
      keyWinCondition: 'ระบุเงื่อนไขการชนะ...',
      contingencyTrigger: 'ระบุจุดเปลี่ยนเมื่อเกิดเหตุฉุกเฉิน...',
    };
    setPlans((prev) => [...prev, newPlan]);
    setActivePlanId(newId);
    triggerToast(`สร้าง ${planName} เรียบร้อยแล้ว`);
  };

  // Build Scenario Object for Save/Export
  const currentScenarioObj: SimulatorScenario = useMemo(() => {
    return {
      id: initialScenario?.id || `sim_${Date.now()}`,
      name: scenarioName,
      description: activePlan.description || 'Simulator Sandbox Draft',
      tags: ['simulator', activePlanId],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      blueTeamName,
      redTeamName,
      blueBans,
      redBans,
      bluePicks,
      redPicks,
      turnIdx: 20,
      turnSel: 0,
      notes: scenarioNotes,
      plans,
      activePlanId,
      disclaimerAccepted: true,
    };
  }, [
    scenarioName,
    activePlan,
    activePlanId,
    blueTeamName,
    redTeamName,
    blueBans,
    redBans,
    bluePicks,
    redPicks,
    scenarioNotes,
    plans,
    initialScenario,
  ]);

  // Save Scenario
  const handleSaveScenario = () => {
    simulatorService.saveScenario(currentScenarioObj);
    setIsSaveModalOpen(false);
    triggerToast('💾 บันทึก Scenario จำลองพร้อมทุกแผน (A/B/C) เรียบร้อยแล้ว');
  };

  // Branch Scenario
  const handleBranchScenario = () => {
    const branchName = prompt('ตั้งชื่อกิ่งดราฟต์ใหม่ (Branch Draft):', `${scenarioName} (Alt Branch)`);
    if (!branchName) return;
    const branched = simulatorService.branchScenario(currentScenarioObj, branchName);
    setScenarioName(branched.name);
    triggerToast(`🌿 สร้างกิ่งดราฟต์ใหม่: "${branchName}" สำเร็จ!`);
  };

  // Load Scenario
  const handleLoadScenario = (sc: SimulatorScenario) => {
    pushHistorySnapshot();
    setScenarioName(sc.name);
    setBlueTeamName(sc.blueTeamName || 'Blue Team');
    setRedTeamName(sc.redTeamName || 'Red Team');
    setBlueBans(sc.blueBans);
    setRedBans(sc.redBans);
    if (sc.plans && sc.plans.length > 0) {
      setPlans(sc.plans);
      setActivePlanId(sc.activePlanId || sc.plans[0].id);
    } else {
      setPlans(
        draftScenarioSimulatorService.createInitialPlans(sc.bluePicks, sc.redPicks, HEROES)
      );
      setActivePlanId('plan_a');
    }
    setScenarioNotes(sc.notes || '');
    setIsLoadDrawerOpen(false);
    triggerToast(`📂 โหลด "${sc.name}" ขึ้นกระดานจำลองแล้ว`);
  };

  // Export Draft Image
  const handleExportImage = async () => {
    try {
      const url = await simulatorService.exportDraftImage(
        `${scenarioName} - ${activePlan.name}`,
        blueTeamName,
        redTeamName,
        blueBans.map((b) => b.hero?.name || ''),
        redBans.map((b) => b.hero?.name || ''),
        bluePicks.map((p) => ({ name: p.hero?.name || '', pos: p.pos })),
        redPicks.map((p) => ({ name: p.hero?.name || '', pos: p.pos }))
      );
      setExportImageUrl(url);
    } catch (e) {
      console.error('Failed to export image', e);
      triggerToast('ไม่สามารถส่งออกรูปภาพได้');
    }
  };

  // Tactical Analysis calculations for Active Plan
  const blueTactics = useMemo(() => {
    return draftScenarioSimulatorService.analyzeScenarioTactics(bluePicks, redPicks);
  }, [bluePicks, redPicks]);

  const redTactics = useMemo(() => {
    return draftScenarioSimulatorService.analyzeScenarioTactics(redPicks, bluePicks);
  }, [redPicks, bluePicks]);

  // Tactical Profiles for picks
  const blueTacticalProfiles = useMemo(() => {
    return bluePicks.map((p) => {
      if (!p.hero) return null;
      return draftScenarioSimulatorService.analyzeHeroTacticalProfile(
        p.hero,
        redPicks,
        bluePicks,
        players
      );
    });
  }, [bluePicks, redPicks, players]);

  const redTacticalProfiles = useMemo(() => {
    return redPicks.map((p) => {
      if (!p.hero) return null;
      return draftScenarioSimulatorService.analyzeHeroTacticalProfile(
        p.hero,
        bluePicks,
        redPicks,
        players
      );
    });
  }, [redPicks, bluePicks, players]);

  // Recommended Heroes for current open slot / role
  const availableHeroes = useMemo(() => {
    return draftScenarioSimulatorService.getAvailableHeroes(
      HEROES,
      blueBans,
      redBans,
      bluePicks,
      redPicks
    );
  }, [blueBans, redBans, bluePicks, redPicks]);

  const isComplete = bluePicks.every((p) => p.hero !== null) && redPicks.every((p) => p.hero !== null);

  return (
    <div className="w-full flex flex-col gap-3 font-['Prompt'] text-slate-800">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. Header Toolbar */}
      <div className="w-full bg-white border border-[#F3D5E2] rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white flex items-center justify-center shadow-md shadow-purple-500/20 flex-shrink-0">
            <Swords size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                className="text-base sm:text-lg font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-[#E91E63] outline-none px-1 py-0.5 rounded transition-colors"
                placeholder="ชื่อ Scenario ดราฟต์จำลอง..."
              />
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                Phase 5: Scenario Simulator
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Draft State Isolated 🔒
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-tight">
              ทดลองและเปรียบเทียบแผน A/B/C วิเคราะห์ First Pick, Counter, Comfort & Flex โดยไม่กระทบห้องดราฟต์จริง
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Fork from Live Draft */}
          {liveDraftSnapshot && (
            <button
              type="button"
              onClick={handleForkFromLiveDraft}
              title="ดึงสถานะจาก Live Draft ปัจจุบันเข้ามาทดลองต่อ (ไม่กระทบเกมจริง)"
              className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <RefreshCw size={12} />
              <span>ดึงจาก Live Draft</span>
            </button>
          )}

          {/* Undo / Redo */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            title="ย้อนกลับการกระทำ (Undo)"
            className="p-2 rounded-xl bg-white border border-[#CBD5E1] text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
          >
            <Undo2 size={14} />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            title="ทำซ้ำ (Redo)"
            className="p-2 rounded-xl bg-white border border-[#CBD5E1] text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
          >
            <Redo2 size={14} />
          </button>

          {/* Branch Draft */}
          <button
            type="button"
            onClick={handleBranchScenario}
            title="สร้างกิ่งดราฟต์ใหม่จากสถานะปัจจุบัน (Branch Draft)"
            className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <GitBranch size={13} />
            <span>Branch</span>
          </button>

          {/* Compare Plans A/B/C */}
          <button
            type="button"
            onClick={() => setIsCompareModalOpen(true)}
            title="เปรียบเทียบแผน A vs B vs C (Plan Comparison Matrix)"
            className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Split size={13} />
            <span>เปรียบเทียบแผน A/B/C</span>
          </button>

          {/* Export Draft Graphic */}
          <button
            type="button"
            onClick={handleExportImage}
            title="ส่งออกเป็นการ์ดรูปภาพ Draft Graphic (PNG)"
            className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download size={13} />
            <span>Export Image</span>
          </button>

          {/* Save / Load */}
          <button
            type="button"
            onClick={() => setIsSaveModalOpen(true)}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-800 text-white hover:bg-slate-900 flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Save size={13} />
            <span>บันทึก</span>
          </button>

          <button
            type="button"
            onClick={() => setIsLoadDrawerOpen(true)}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
          >
            <Layers size={13} />
            <span>โหลด ({simulatorService.getAllScenarios().length})</span>
          </button>

          {/* Apply to Live Draft */}
          {onApplyToLiveDraft && (
            <button
              type="button"
              onClick={() => setIsConfirmApplyLiveOpen(true)}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-[#E91E63] text-white hover:bg-[#D81B60] flex items-center gap-1.5 shadow-xs cursor-pointer ml-1"
            >
              <span>⚔️ โอนไป Live Draft</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Statistical Disclaimer & Limitations Banner */}
      {showDisclaimer && (
        <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <span>{SIMULATOR_DISCLAIMER.title}</span>
                <span className="text-[10px] font-normal text-amber-700 px-1.5 py-0.2 rounded bg-amber-100">
                  Non-Winrate Metric
                </span>
              </span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                {SIMULATOR_DISCLAIMER.body}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowDisclaimer(false)}
            className="text-amber-500 hover:text-amber-800 text-xs font-bold p-1 cursor-pointer"
            title="ซ่อนข้อความเตือน"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3. Multi-Plan (แผน A / B / C) Navigation Tabs */}
      <div className="w-full bg-white border border-[#F3D5E2] rounded-2xl p-3 shadow-xs flex flex-col gap-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {plans.map((p, idx) => {
              const isSelected = p.id === activePlanId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActivePlanId(p.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50 hover:border-purple-300'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current opacity-80" />
                  <span>{p.name}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={handleAddNewPlan}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 text-slate-600 border border-dashed border-slate-300 hover:border-purple-400 hover:text-purple-700 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus size={13} />
              <span>เพิ่มแผนใหม่</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
            <span>สถานะ:</span>
            <span className="font-bold text-purple-700">{activePlan.name}</span>
          </div>
        </div>

        {/* Active Plan Strategy & Rationale Meta Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 text-xs">
          <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-purple-800 uppercase flex items-center gap-1">
              <Zap size={12} />
              <span>เป้าหมายกลยุทธ์ (Tactical Goal)</span>
            </span>
            <input
              type="text"
              value={activePlan.tacticalGoal || ''}
              onChange={(e) => {
                const val = e.target.value;
                updateActivePlan((p) => ({ ...p, tacticalGoal: val }));
              }}
              placeholder="ระบุเป้าหมาย เช่น Early Snowball, คุม Deep Jungle..."
              className="w-full text-xs bg-transparent border-b border-purple-200 focus:border-purple-600 outline-none font-semibold text-slate-800"
            />
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-emerald-800 uppercase flex items-center gap-1">
              <CheckCircle size={12} />
              <span>เงื่อนไขชัยชนะ (Win Condition)</span>
            </span>
            <input
              type="text"
              value={activePlan.keyWinCondition || ''}
              onChange={(e) => {
                const val = e.target.value;
                updateActivePlan((p) => ({ ...p, keyWinCondition: val }));
              }}
              placeholder="เช่น ยื้อเลทเกม 15 นาที, ดันป้อมนอกก่อนนาทีที่ 8..."
              className="w-full text-xs bg-transparent border-b border-emerald-200 focus:border-emerald-600 outline-none font-semibold text-slate-800"
            />
          </div>

          <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-amber-800 uppercase flex items-center gap-1">
              <AlertTriangle size={12} />
              <span>จุดสลับแผนสำรอง (Contingency Trigger)</span>
            </span>
            <input
              type="text"
              value={activePlan.contingencyTrigger || ''}
              onChange={(e) => {
                const val = e.target.value;
                updateActivePlan((p) => ({ ...p, contingencyTrigger: val }));
              }}
              placeholder="เช่น หากโดนแบน Capheny หรือ Aoi ให้สลับ..."
              className="w-full text-xs bg-transparent border-b border-amber-200 focus:border-amber-600 outline-none font-semibold text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* 4. Main Simulator Draft Arena (Blue Column, Tactical Intelligence Panel, Red Column) */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* Blue Side Column (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-[#F3D5E2] rounded-2xl p-3.5 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-sky-100">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-sky-500" />
              <input
                type="text"
                value={blueTeamName}
                onChange={(e) => setBlueTeamName(e.target.value)}
                className="font-bold text-sm text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-sky-500 outline-none px-1"
                placeholder="Blue Team"
              />
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-sky-50 text-sky-700">
              BLUE SIDE
            </span>
          </div>

          {/* Blue Bans (4 slots) */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Blue Bans (4 ตัว):</span>
            <div className="grid grid-cols-4 gap-1.5">
              {blueBans.map((slot, idx) => (
                <div
                  key={idx}
                  onClick={() => setPickerTarget({ team: 'blue', phase: 'ban', index: idx })}
                  className="h-14 rounded-xl border border-rose-200 bg-rose-50/40 hover:bg-rose-100/60 p-1 flex flex-col items-center justify-center cursor-pointer relative group transition-all"
                >
                  {slot.hero ? (
                    <>
                      <img
                        src={slot.hero.avatarUrl}
                        alt={slot.hero.name}
                        className="w-8 h-8 rounded-lg object-cover grayscale border border-rose-300"
                      />
                      <span className="text-[8.5px] font-bold text-slate-700 truncate max-w-full mt-0.5">
                        {slot.hero.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearSlot('blue', 'ban', idx);
                        }}
                        className="absolute top-0.5 right-0.5 text-[10px] text-slate-400 hover:text-rose-600 hidden group-hover:block"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <span className="text-[10px] text-rose-400 font-bold">+ Ban {idx + 1}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Blue Picks (5 slots with Tactical Roles & Fallback) */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              Blue Picks ({activePlan.name}):
            </span>
            {bluePicks.map((slot, idx) => {
              const profile = blueTacticalProfiles[idx];
              return (
                <div
                  key={idx}
                  onClick={() => setPickerTarget({ team: 'blue', phase: 'pick', index: idx, pos: slot.pos })}
                  className="p-2.5 rounded-xl border border-sky-100 bg-sky-50/30 hover:bg-sky-50/80 flex flex-col gap-1.5 cursor-pointer group transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-sky-700 w-9 text-center py-1 rounded bg-sky-100">
                        {slot.pos}
                      </span>
                      {slot.hero ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={slot.hero.avatarUrl}
                            alt={slot.hero.name}
                            className="w-8 h-8 rounded-lg object-cover border border-sky-300"
                          />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-900 leading-tight">
                              {slot.hero.name}
                            </span>
                            <span className="text-[9.5px] text-slate-500">
                              {slot.hero.primaryPos.toUpperCase()} • {slot.hero.r}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-semibold">
                          + คลิกเพื่อเลือกฮีโร่ {slot.pos} (Pick {idx + 1})
                        </span>
                      )}
                    </div>

                    {slot.hero && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSimulateHijack('blue', idx);
                          }}
                          title="ทดสอบสถานการณ์: โดนคู่แข่งแบนหรือแย่งตัวนี้ไป แล้วสลับใช้ตัวสำรองทันที"
                          className="px-2 py-0.5 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Zap size={10} />
                          <span>จำลองโดนตัด</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearSlot('blue', 'pick', idx);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Tactical Badges (First Pick, Counter, Comfort, Flex) */}
                  {profile && profile.badges.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap pl-11">
                      {profile.badges.map((b, bIdx) => (
                        <span
                          key={bIdx}
                          title={b.detail || b.description}
                          className={`text-[9px] font-black px-1.5 py-0.2 rounded-md border ${b.badgeClass}`}
                        >
                          {b.label}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Fallback Plan Preview */}
                  {slot.hero && slot.backupHero1 && (
                    <div className="pl-11 text-[9.5px] text-slate-500 flex items-center gap-1">
                      <span className="font-semibold text-slate-600">สำรอง:</span>
                      <span className="font-bold text-purple-700">{slot.backupHero1.name}</span>
                      {slot.backupHero2 && (
                        <>
                          <span className="text-slate-300">/</span>
                          <span className="text-slate-600">{slot.backupHero2.name}</span>
                        </>
                      )}
                      <span className="text-slate-400 truncate max-w-[120px]">({slot.backupReason})</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Tactical Sandbox Engine & Real-time Analysis (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          {/* Post Draft Report Quick Button */}
          <div className="bg-white border border-[#F3D5E2] rounded-2xl p-4 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#F3D5E2]">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles size={14} className="text-purple-600" />
                <span>Sandbox Tactical Engine</span>
              </span>
              <span
                className={`text-[9.5px] font-black px-2 py-0.5 rounded-full ${
                  isComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {isComplete ? 'ดราฟต์ครบ 10 ตัว' : 'กำลังทดลองดราฟต์'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsPostDraftReportOpen(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#E91E63] to-[#D81B60] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:opacity-95 cursor-pointer"
            >
              <FileText size={15} />
              <span>เปิดรายงานวิเคราะห์ดราฟต์เชิงกลยุทธ์ (Post-Draft Report)</span>
            </button>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleResetSimulator}
                className="py-1.5 px-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600 flex items-center justify-center gap-1 cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>ล้างกระดานจำลอง</span>
              </button>

              <button
                type="button"
                onClick={handleBranchScenario}
                className="py-1.5 px-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-xs font-semibold text-purple-700 flex items-center justify-center gap-1 cursor-pointer"
              >
                <GitBranch size={12} />
                <span>แตกกิ่ง Branch</span>
              </button>
            </div>
          </div>

          {/* Real-Time Tactical Health Checklist */}
          <div className="bg-white border border-[#F3D5E2] rounded-2xl p-4 shadow-xs flex flex-col gap-2.5">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <Shield size={14} className="text-sky-600" />
              <span>ความสมบูรณ์และจุดแข็ง-จุดอ่อนทีม ({activePlan.name})</span>
            </span>

            {/* Missing Roles Indicator */}
            <div className="flex items-center justify-between text-xs py-1">
              <span className="font-semibold text-slate-600">ตำแหน่งในเลน:</span>
              {blueTactics.missingLanes.length === 0 ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  ✓ ครบ 5 ตำแหน่งสมบูรณ์
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  ⚠️ ยังขาด: {blueTactics.missingLanes.join(', ')}
                </span>
              )}
            </div>

            {/* Active Synergies */}
            <div className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-slate-600">คอมโบประสานงาน (Synergies):</span>
              {blueTactics.synergies.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {blueTactics.synergies.map((syn, idx) => (
                    <span key={idx} className="text-[9.5px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                      {syn}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-[11px] text-slate-400 italic">เลือกฮีโร่เพิ่มเพื่อตรวจจับคอมโบ</span>
              )}
            </div>

            {/* Strengths & Weaknesses */}
            <div className="flex flex-col gap-1.5 text-xs pt-1 border-t border-slate-100">
              <span className="font-bold text-slate-700">จุดเด่นของแผน:</span>
              <ul className="list-disc list-inside text-[11px] text-slate-600 flex flex-col gap-0.5">
                {blueTactics.strengths.map((str, idx) => (
                  <li key={idx} className="leading-tight">{str}</li>
                ))}
              </ul>

              <span className="font-bold text-slate-700 mt-1">ข้อพึงระวังและความเสี่ยง:</span>
              <ul className="list-disc list-inside text-[11px] text-rose-700 flex flex-col gap-0.5">
                {blueTactics.weaknesses.map((weak, idx) => (
                  <li key={idx} className="leading-tight">{weak}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Ripple Impact of Last Action */}
          {lastRipple && (
            <div className="bg-slate-900 text-white rounded-2xl p-3.5 shadow-md flex flex-col gap-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-700">
                <span className="text-xs font-bold flex items-center gap-1 text-purple-300">
                  <Zap size={13} />
                  <span>ผลกระทบจากการเลือก ({lastRipple.action.toUpperCase()} {lastRipple.hero.name})</span>
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-900/60 text-purple-300 border border-purple-700">
                  Ripple Analysis
                </span>
              </div>
              <p className="text-[11px] text-slate-200 leading-relaxed">
                {lastRipple.tacticalImpactSummary}
              </p>
              {lastRipple.unlockedTeamSynergies.length > 0 && (
                <div className="text-[10px] text-emerald-300">
                  + ปลดล็อกคอมโบ: {lastRipple.unlockedTeamSynergies.join(', ')}
                </div>
              )}
            </div>
          )}

          {/* Coach Sandbox Notes */}
          <div className="bg-white border border-[#F3D5E2] rounded-2xl p-3 shadow-xs flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-700">บันทึกความคิดเห็นโค้ช (Sandbox Notes):</span>
            <textarea
              value={scenarioNotes}
              onChange={(e) => setScenarioNotes(e.target.value)}
              placeholder="บันทึกข้อสังเกตการจำลอง เช่น จุดเด่นของแผน B เมื่อเจอคอมพ์แก้ทาง..."
              rows={3}
              className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:border-[#E91E63] outline-none bg-slate-50/50 text-slate-800"
            />
          </div>
        </div>

        {/* Red Side Column (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-[#F3D5E2] rounded-2xl p-3.5 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-rose-100">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <input
                type="text"
                value={redTeamName}
                onChange={(e) => setRedTeamName(e.target.value)}
                className="font-bold text-sm text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-rose-500 outline-none px-1"
                placeholder="Red Team"
              />
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-rose-50 text-rose-700">
              RED SIDE
            </span>
          </div>

          {/* Red Bans (4 slots) */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Red Bans (4 ตัว):</span>
            <div className="grid grid-cols-4 gap-1.5">
              {redBans.map((slot, idx) => (
                <div
                  key={idx}
                  onClick={() => setPickerTarget({ team: 'red', phase: 'ban', index: idx })}
                  className="h-14 rounded-xl border border-rose-200 bg-rose-50/40 hover:bg-rose-100/60 p-1 flex flex-col items-center justify-center cursor-pointer relative group transition-all"
                >
                  {slot.hero ? (
                    <>
                      <img
                        src={slot.hero.avatarUrl}
                        alt={slot.hero.name}
                        className="w-8 h-8 rounded-lg object-cover grayscale border border-rose-300"
                      />
                      <span className="text-[8.5px] font-bold text-slate-700 truncate max-w-full mt-0.5">
                        {slot.hero.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearSlot('red', 'ban', idx);
                        }}
                        className="absolute top-0.5 right-0.5 text-[10px] text-slate-400 hover:text-rose-600 hidden group-hover:block"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <span className="text-[10px] text-rose-400 font-bold">+ Ban {idx + 1}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Red Picks (5 slots with Tactical Roles) */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              Red Picks ({activePlan.name}):
            </span>
            {redPicks.map((slot, idx) => {
              const profile = redTacticalProfiles[idx];
              return (
                <div
                  key={idx}
                  onClick={() => setPickerTarget({ team: 'red', phase: 'pick', index: idx, pos: slot.pos })}
                  className="p-2.5 rounded-xl border border-rose-100 bg-rose-50/30 hover:bg-rose-50/80 flex flex-col gap-1.5 cursor-pointer group transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-rose-700 w-9 text-center py-1 rounded bg-rose-100">
                        {slot.pos}
                      </span>
                      {slot.hero ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={slot.hero.avatarUrl}
                            alt={slot.hero.name}
                            className="w-8 h-8 rounded-lg object-cover border border-rose-300"
                          />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-900 leading-tight">
                              {slot.hero.name}
                            </span>
                            <span className="text-[9.5px] text-slate-500">
                              {slot.hero.primaryPos.toUpperCase()} • {slot.hero.r}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-semibold">
                          + คลิกเพื่อเลือกฮีโร่ {slot.pos} (Pick {idx + 1})
                        </span>
                      )}
                    </div>

                    {slot.hero && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSimulateHijack('red', idx);
                          }}
                          title="ทดสอบสถานการณ์: โดนคู่แข่งแบนหรือแย่งตัวนี้ไป แล้วสลับใช้ตัวสำรองทันที"
                          className="px-2 py-0.5 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Zap size={10} />
                          <span>จำลองโดนตัด</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearSlot('red', 'pick', idx);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Tactical Badges for Red Side */}
                  {profile && profile.badges.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap pl-11">
                      {profile.badges.map((b, bIdx) => (
                        <span
                          key={bIdx}
                          title={b.detail || b.description}
                          className={`text-[9px] font-black px-1.5 py-0.2 rounded-md border ${b.badgeClass}`}
                        >
                          {b.label}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Fallback Plan Preview */}
                  {slot.hero && slot.backupHero1 && (
                    <div className="pl-11 text-[9.5px] text-slate-500 flex items-center gap-1">
                      <span className="font-semibold text-slate-600">สำรอง:</span>
                      <span className="font-bold text-purple-700">{slot.backupHero1.name}</span>
                      {slot.backupHero2 && (
                        <>
                          <span className="text-slate-300">/</span>
                          <span className="text-slate-600">{slot.backupHero2.name}</span>
                        </>
                      )}
                      <span className="text-slate-400 truncate max-w-[120px]">({slot.backupReason})</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Plan A vs Plan B vs Plan C Comparison Matrix Modal */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border-2 border-[#F3D5E2] rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-5 shadow-2xl font-['Prompt'] flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F3D5E2]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Split size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    เปรียบเทียบแผนดราฟต์ทางเลือก (Plan A vs Plan B vs Plan C)
                  </h3>
                  <span className="text-xs text-slate-500">
                    วิเคราะห์ความแตกต่างของฮีโร่ เป้าหมาย และตัวสำรองในแต่ละแผน
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCompareModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {plans.map((p) => {
                const isActive = p.id === activePlanId;
                return (
                  <div
                    key={p.id}
                    className={`p-3.5 rounded-2xl border flex flex-col gap-2.5 transition-all ${
                      isActive
                        ? 'border-purple-500 bg-purple-50/30 shadow-md ring-2 ring-purple-500/20'
                        : 'border-slate-200 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{p.name}</span>
                      {isActive && (
                        <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-purple-600 text-white">
                          แผนปัจจุบัน
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-600">
                      <span className="font-bold text-purple-700">เป้าหมาย:</span> {p.tacticalGoal || '—'}
                    </div>

                    <div className="text-[11px] text-slate-600">
                      <span className="font-bold text-emerald-700">Win Condition:</span> {p.keyWinCondition || '—'}
                    </div>

                    {/* Blue Comps in this plan */}
                    <div className="flex flex-col gap-1 pt-1 border-t border-slate-200">
                      <span className="text-[10px] font-bold text-sky-800 uppercase">Blue Picks:</span>
                      <div className="flex items-center gap-1 flex-wrap">
                        {p.bluePicks.map((slot, sIdx) => (
                          <span
                            key={sIdx}
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                              slot.hero ? 'bg-sky-100 text-sky-900 border border-sky-200' : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {slot.pos}: {slot.hero?.name || '—'}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Red Comps in this plan */}
                    <div className="flex flex-col gap-1 pt-1 border-t border-slate-200">
                      <span className="text-[10px] font-bold text-rose-800 uppercase">Red Picks:</span>
                      <div className="flex items-center gap-1 flex-wrap">
                        {p.redPicks.map((slot, sIdx) => (
                          <span
                            key={sIdx}
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                              slot.hero ? 'bg-rose-100 text-rose-900 border border-rose-200' : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {slot.pos}: {slot.hero?.name || '—'}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setActivePlanId(p.id);
                        setIsCompareModalOpen(false);
                        triggerToast(`สลับไปใช้งาน ${p.name}`);
                      }}
                      className={`w-full py-1.5 rounded-xl text-xs font-bold mt-2 cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300'
                      }`}
                    >
                      {isActive ? 'ใช้งานอยู่' : 'เลือกแผนนี้'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Safety Confirmation Modal: Apply to Live Draft */}
      {isConfirmApplyLiveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border-2 border-amber-300 rounded-2xl max-w-md w-full p-4 shadow-2xl font-['Prompt']">
            <div className="flex items-center gap-3 pb-2 mb-2 border-b border-amber-100">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  ยืนยันการนำเข้าสู่ Live Draft
                </h3>
                <span className="text-[11px] text-slate-500">
                  ระบบรักษาความปลอดภัยของห้องดราฟต์สด (Draft State Isolation)
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed my-2">
              คุณกำลังจะนำสถานะการดราฟต์จำลองของแผน <span className="font-bold text-purple-700">"{activePlan.name}"</span>
              ไปแทนที่ข้อมูลใน <span className="font-bold text-[#E91E63]">Live Draft</span> ปัจจุบัน
              ข้อมูลและเทิร์นเดิมของการดราฟต์สดจะถูกอัปเดตตามสถานะจำลองนี้
            </p>

            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setIsConfirmApplyLiveOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmApplyLiveOpen(false);
                  onApplyToLiveDraft?.(currentScenarioObj);
                }}
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-[#E91E63] text-white hover:bg-[#D81B60] shadow-xs cursor-pointer"
              >
                ยืนยันการโอนย้าย
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Scenario Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border-2 border-[#F3D5E2] rounded-2xl max-w-md w-full p-4 shadow-2xl font-['Prompt']">
            <h3 className="text-sm font-bold text-slate-900 mb-2">บันทึก Scenario จำลองพร้อมแผน A/B/C</h3>
            <div className="flex flex-col gap-2.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">ชื่อ Scenario:</label>
                <input
                  type="text"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl outline-none font-bold"
                />
              </div>
              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-3 py-1.5 text-xs rounded-xl bg-slate-100 text-slate-700 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSaveScenario}
                  className="px-4 py-1.5 text-xs font-bold rounded-xl bg-slate-800 text-white cursor-pointer"
                >
                  บันทึก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Load Drawer */}
      {isLoadDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md h-full bg-white border-l-2 border-[#F3D5E2] p-4 flex flex-col font-['Prompt'] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#F3D5E2]">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Layers size={16} className="text-slate-600" />
                <span>คลัง Scenario จำลอง ({simulatorService.getAllScenarios().length})</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsLoadDrawerOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer text-base"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {simulatorService.getAllScenarios().length === 0 ? (
                <div className="text-xs text-slate-400 py-6 text-center">
                  ยังไม่มี Scenario ที่บันทึกไว้
                </div>
              ) : (
                simulatorService.getAllScenarios().map((sc) => (
                  <div
                    key={sc.id}
                    className="p-3 rounded-xl bg-[#FFF8FB] border border-[#F3D5E2] flex flex-col gap-2 hover:border-[#E91E63] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{sc.name}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(sc.updatedAt).toLocaleDateString('th-TH')}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600">
                      {sc.blueTeamName || 'Blue'} vs {sc.redTeamName || 'Red'}
                      {sc.plans && sc.plans.length > 0 && (
                        <span className="ml-1.5 text-purple-700 font-bold">
                          • {sc.plans.length} แผน
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          simulatorService.deleteScenario(sc.id);
                          triggerToast('ลบ Scenario เรียบร้อยแล้ว');
                        }}
                        className="text-[11px] text-rose-500 hover:underline mr-auto cursor-pointer"
                      >
                        ลบ
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLoadScenario(sc)}
                        className="px-3 py-1 bg-[#E91E63] text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        โหลดขึ้นกระดาน
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Export Image Preview Modal */}
      {exportImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border-2 border-[#F3D5E2] rounded-2xl max-w-2xl w-full p-4 shadow-2xl font-['Prompt'] flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#F3D5E2]">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Download size={16} className="text-emerald-600" />
                <span>Export Draft Graphic (1200x675 PNG)</span>
              </h3>
              <button
                type="button"
                onClick={() => setExportImageUrl(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <img
              src={exportImageUrl}
              alt="Draft Export"
              className="w-full rounded-xl border border-slate-200 shadow-md"
            />

            <div className="flex items-center justify-end gap-2">
              <a
                href={exportImageUrl}
                download={`MCU_Draft_${scenarioName.replace(/\s+/g, '_')}_${activePlan.name.replace(/\s+/g, '_')}.png`}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={14} />
                <span>ดาวน์โหลดรูปภาพ (PNG)</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Hero Picker Modal with Strict Availability Filter */}
      {pickerTarget && (
        <HeroPickerModal
          isOpen={true}
          title={`เลือกฮีโร่สำหรับ ${pickerTarget.team.toUpperCase()} (${pickerTarget.phase.toUpperCase()}${pickerTarget.pos ? ` - ${pickerTarget.pos}` : ''})`}
          excludeHeroNames={unavailableHeroNames}
          onSelect={handleSelectSlotHero}
          onClose={() => setPickerTarget(null)}
        />
      )}

      {/* Post-Draft Report Modal */}
      {isPostDraftReportOpen && (
        <PostDraftReportModal
          isOpen={true}
          onClose={() => setIsPostDraftReportOpen(false)}
          blueTeamName={blueTeamName}
          redTeamName={redTeamName}
          bluePicks={bluePicks}
          redPicks={redPicks}
        />
      )}
    </div>
  );
};
