import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useDraconmindDraft } from './hooks/useDraconmindDraft';
import { usePlayers } from './hooks/usePlayers';
import { useDraftHistory } from './hooks/useDraftHistory';
import { BrandBar } from './components/BrandBar';
import { Breadcrumb } from './components/Breadcrumb';
import { DraftHeader } from './components/DraftHeader';
import { TeamColumn } from './components/TeamColumn';
import { DraftCenter } from './components/DraftCenter';
import { HeroStatsSidePanel } from './components/HeroStatsSidePanel';
import { CoachAnalysisPanel } from './components/CoachAnalysisPanel';
import { UnifiedDraftAssistant } from './components/UnifiedDraftAssistant';
import { StatsImportExportModal } from './components/StatsImportExportModal';
import { PlayersPage } from './components/PlayersPage';
import { DraftHistoryPage } from './components/DraftHistoryPage';
import { DashboardView } from './components/DashboardView';
import { AppView } from './components/BrandBar';
import { PreDraftModal } from './components/PreDraftModal';
import { SaveDraftModal } from './components/SaveDraftModal';
import { ProCompsModal } from './components/ProCompsModal';
import { ScoutingView } from './components/ScoutingView';
import { SeriesPrepView } from './components/SeriesPrepView';
import { DraftSimulatorView } from './components/DraftSimulatorView';
import { ScrimManagerView } from './components/scrim/ScrimManagerView';
import { DraftReviewCalibrationView } from './components/DraftReviewCalibrationView';
import { MatchPrepReportView } from './components/coachReport/MatchPrepReportView';
import { PostDraftReportModal } from './components/PostDraftReportModal';
import { GamePlan } from './types/seriesPrep';
import { SimulatorScenario } from './types/simulator';
import { RPL_2026_PRO_COMPS } from './data/proMetaComps';
import { Toast } from './components/Toast';
import { statsDataProvider } from './services/statsDataProvider';
import { Hero } from './types/draft';
import { DraftMatchMetadata, MatchWinner } from './types/draftHistory';
import { HEROES } from './data/heroes';
import { X } from 'lucide-react';

const CURRENT_VIEW_KEY = 'mcu_rov_current_view';
const SIDE_PANEL_OPEN_KEY = 'mcu_rov_side_panel_open';
const SIDE_PANEL_TAB_KEY = 'mcu_rov_side_panel_tab';

const VALID_VIEWS = new Set<AppView>([
  'dashboard', 'draft', 'scouting', 'series_prep', 'simulator', 'scrim', 'calibration', 'match_prep', 'players', 'history'
]);

const getInitialView = (): AppView => {
  if (typeof window !== 'undefined') {
    // 1. Check URL hash first (e.g. #dashboard, #players, #history, #draft, #scouting, #series_prep, #simulator)
    const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase() as AppView;
    if (VALID_VIEWS.has(hash)) {
      return hash;
    }
    // 2. Check query param (e.g. ?view=scouting)
    try {
      const params = new URLSearchParams(window.location.search);
      const queryView = (params.get('view') || params.get('tab')) as AppView;
      if (VALID_VIEWS.has(queryView)) {
        return queryView;
      }
    } catch {
      // ignore
    }
    // 3. Check localStorage for last active page
    try {
      const saved = localStorage.getItem(CURRENT_VIEW_KEY) as AppView;
      if (VALID_VIEWS.has(saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
  }
  return 'dashboard';
};

const getInitialSidePanelOpen = (): boolean => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(SIDE_PANEL_OPEN_KEY);
      if (saved !== null) {
        return saved === 'true';
      }
    } catch {
      // ignore
    }
  }
  // Default to FALSE so it NEVER automatically pops open over the screen on load
  return false;
};

const getInitialSidePanelTab = (): 'coach' | 'stats' => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(SIDE_PANEL_TAB_KEY);
      if (saved === 'stats' || saved === 'coach') {
        return saved;
      }
    } catch {
      // ignore
    }
  }
  return 'coach';
};

export default function App() {
  // Navigation view: Dashboard vs Draft Simulator vs Players Management vs Draft History (with persistence & URL hash)
  const [currentView, setCurrentView] = useState<AppView>(getInitialView);

  // Match metadata (Pre-Draft: Tournament, Match, Game #, Blue, Red, Patch)
  const [matchMetadata, setMatchMetadata] = useState<DraftMatchMetadata>({
    tournament: 'RoV Pro League 2026 Summer',
    match: 'Match 1 - Regular Season',
    gameNumber: 1,
    blueTeam: 'Blue Team',
    redTeam: 'Red Team',
    patch: 'Patch 1.56 (Summer 2026)',
  });

  // Modal open states for Pre-Draft Setup & Save Draft
  const [isPreDraftModalOpen, setIsPreDraftModalOpen] = useState<boolean>(false);
  const [isSaveDraftModalOpen, setIsSaveDraftModalOpen] = useState<boolean>(false);

  // Draft History repository hook
  const {
    records: historyRecords,
    saveDraft: saveDraftToHistory,
  } = useDraftHistory();

  // Hero Stats & Coach Analysis Side Panel State (with persistence)
  const [inspectedHeroName, setInspectedHeroName] = useState<string | null>('Nakroth');
  const [isSidePanelOpen, setIsSidePanelOpen] = useState<boolean>(getInitialSidePanelOpen);
  const [sidePanelTab, setSidePanelTab] = useState<'coach' | 'stats'>(getInitialSidePanelTab);
  const [isDataModalOpen, setIsDataModalOpen] = useState<boolean>(false);
  const [statsStatus, setStatsStatus] = useState(() => statsDataProvider.getStatus());

  const handleSelectView = (view: AppView) => {
    setCurrentView(view);
    try {
      localStorage.setItem(CURRENT_VIEW_KEY, view);
      if (window.location.hash.replace(/^#\/?/, '') !== view) {
        window.history.replaceState(null, '', `#${view}`);
      }
    } catch {
      // ignore
    }
  };

  const handleSetSidePanelOpen = (isOpen: boolean) => {
    setIsSidePanelOpen(isOpen);
    try {
      localStorage.setItem(SIDE_PANEL_OPEN_KEY, String(isOpen));
    } catch {
      // ignore
    }
  };

  const handleSetSidePanelTab = (tab: 'coach' | 'stats') => {
    setSidePanelTab(tab);
    try {
      localStorage.setItem(SIDE_PANEL_TAB_KEY, tab);
    } catch {
      // ignore
    }
  };

  // Sync with browser back/forward and hash changes
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase() as AppView;
      if (VALID_VIEWS.has(hash)) {
        setCurrentView(hash);
        try {
          localStorage.setItem(CURRENT_VIEW_KEY, hash);
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    return statsDataProvider.subscribe(() => {
      setStatsStatus(statsDataProvider.getStatus());
    });
  }, []);

  // Player Management & Hero Pool hook
  const {
    players,
    teamId,
    changeTeamId,
    isSyncing: isPlayersSyncing,
    isCloudConnected: isPlayersCloudConnected,
    activeProvider: playersActiveProvider,
    lastSyncedAt: playersLastSyncedAt,
    syncError: playersSyncError,
    forceSyncToCloud: forceSyncPlayersToCloud,
    reloadFromCloud: reloadPlayersFromCloud,
    addPlayer,
    updatePlayer,
    deletePlayer,
    resetToDefaultPlayers,
    heroToPlayersMap,
  } = usePlayers();

  // Draft Simulator hook (preserved completely intact)
  const {
    blueTeamName,
    setBlueTeamName,
    redTeamName,
    setRedTeamName,
    blueIsUs,
    setBlueIsUs,
    swapSides,
    selectedTeamCategory,
    changeTeamCategory,
    assignPlayerToPickSlot,
    draftActive,
    draftTurnIdx,
    draftTurnSel,
    currentTurn,
    currentTurnSlot,
    setManualTarget,
    isDraftComplete,
    startNewDraft,
    resetDraft,
    selectHero,
    undo,
    canUndo,
    clearSlot,
    changePickPos,
    blueBans,
    redBans,
    bluePicks,
    redPicks,
    bannedHeroNames,
    pickedHeroNames,
    timerSec,
    timerMax,
    isTimerPaused,
    toggleTimerPause,
    draftScore,
    redDraftScore,
    roleFilter,
    setRoleFilter,
    searchQuery,
    setSearchQuery,
    toastMessage,
    showToast,
  } = useDraconmindDraft();

  // Category player counts for DraftHeader
  const playerCounts = useMemo(() => ({
    all: players.length,
    male: players.filter((p) => (p.categories || [p.category || 'male']).includes('male')).length,
    female: players.filter((p) => (p.categories || [p.category || 'male']).includes('female')).length,
    mixed: players.filter((p) => (p.categories || [p.category || 'male']).includes('mixed')).length,
  }), [players]);

  // Screen width and mobile detection
  const [windowWidth, setWindowWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Small phone screen detection (< 680px). Tablets (>= 680px: iPads, Galaxy Tabs) get first-class responsive arena!
  const isPhoneScreen = windowWidth < 680;

  // Tablet screen detection (680px to 1280px, including iPad portrait & landscape, Galaxy tabs)
  const isTabletScreen =
    (windowWidth >= 680 && windowWidth <= 1280) ||
    (typeof navigator !== 'undefined' &&
      navigator.maxTouchPoints > 1 &&
      windowWidth <= 1366 &&
      windowWidth >= 680);

  // Scaled 3-column PC layout on mobile (Heroes in center, Blue left, Red right - scaled to fit screen)
  const arenaBaseWidth = 780;
  const scaledArenaContentRef = useRef<HTMLDivElement>(null);
  const [scaledContentHeight, setScaledContentHeight] = useState<number>(760);
  const [mobileZoomMode, setMobileZoomMode] = useState<'fit' | 'zoom'>('fit');

  // Measure Blue Side column height so that Center Draft Arena strictly matches it
  // and hero grid NEVER overflows past Blue Pick 5
  const [blueColumnHeight, setBlueColumnHeight] = useState<number>(685);
  const blueColumnObserverRef = useRef<ResizeObserver | null>(null);

  const setBlueColumnRef = useCallback((node: HTMLDivElement | null) => {
    if (blueColumnObserverRef.current) {
      blueColumnObserverRef.current.disconnect();
      blueColumnObserverRef.current = null;
    }
    if (node) {
      const updateHeight = () => {
        const h = node.offsetHeight;
        if (h > 150) {
          setBlueColumnHeight(h);
        }
      };
      updateHeight();
      const observer = new ResizeObserver(updateHeight);
      observer.observe(node);
      blueColumnObserverRef.current = observer;
    }
  }, []);

  const [isProCompsOpen, setIsProCompsOpen] = useState<boolean>(false);
  const [isLivePostDraftReportOpen, setIsLivePostDraftReportOpen] = useState<boolean>(false);
  const [simulatorInitialScenario, setSimulatorInitialScenario] = useState<SimulatorScenario | undefined>(undefined);

  // Handler to load a game plan from Series Prep into Live Draft
  const handleLoadGameFromSeriesPrepIntoLive = useCallback((game: GamePlan) => {
    setBlueIsUs(game.side === 'blue');
    showToast(`⚔️ โหลดแผน Game ${game.gameNumber} (${game.side.toUpperCase()}) เข้าสู่ห้องดราฟต์สดแล้ว`);
    handleSelectView('draft');
  }, [showToast, setBlueIsUs]);

  // Handler to load a game plan from Series Prep into Draft Simulator
  const handleLoadGameFromSeriesPrepIntoSimulator = useCallback((game: GamePlan, seriesName: string) => {
    const blueBans = game.side === 'blue'
      ? game.targetBans.map((name) => ({ hero: HEROES.find((h) => h.name.toLowerCase() === name.toLowerCase()) || null }))
      : [{ hero: null }, { hero: null }, { hero: null }, { hero: null }];
    const redBans = game.side === 'red'
      ? game.targetBans.map((name) => ({ hero: HEROES.find((h) => h.name.toLowerCase() === name.toLowerCase()) || null }))
      : [{ hero: null }, { hero: null }, { hero: null }, { hero: null }];

    const initialPicks = game.preferredPicks.map((p) => ({
      hero: HEROES.find((h) => h.name.toLowerCase() === p.preferredHero?.toLowerCase()) || null,
      pos: p.role as any,
    }));

    const sc: SimulatorScenario = {
      id: `sim_series_${Date.now()}`,
      name: `${seriesName} - Game ${game.gameNumber}`,
      description: `สร้างจากแผนซีรีส์ Game ${game.gameNumber}`,
      tags: ['series_prep'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      blueTeamName: game.side === 'blue' ? 'MCU Esports' : 'Opponent Team',
      redTeamName: game.side === 'red' ? 'MCU Esports' : 'Opponent Team',
      blueBans: blueBans.slice(0, 4),
      redBans: redBans.slice(0, 4),
      bluePicks: game.side === 'blue' ? initialPicks : [
        { hero: null, pos: 'DSL' }, { hero: null, pos: 'JG' }, { hero: null, pos: 'MID' }, { hero: null, pos: 'ROAM' }, { hero: null, pos: 'ADL' }
      ],
      redPicks: game.side === 'red' ? initialPicks : [
        { hero: null, pos: 'DSL' }, { hero: null, pos: 'JG' }, { hero: null, pos: 'MID' }, { hero: null, pos: 'ROAM' }, { hero: null, pos: 'ADL' }
      ],
      turnIdx: 0,
      turnSel: 0,
      notes: game.coachNotes || '',
    };

    setSimulatorInitialScenario(sc);
    showToast(`🧪 โหลด Game ${game.gameNumber} เข้าสู่ Draft Simulator แล้ว`);
    handleSelectView('simulator');
  }, [showToast]);

  // Handler to fork current live draft into simulator without mutating live draft
  const handleForkLiveDraftToSimulator = useCallback(() => {
    const sc: SimulatorScenario = {
      id: `sim_fork_${Date.now()}`,
      name: `จำลองจาก Live Draft - ${blueTeamName} vs ${redTeamName}`,
      description: 'โคลนสถานะจากห้องดราฟต์สดเพื่อทดลองต่อยอด',
      tags: ['live_fork'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      blueTeamName,
      redTeamName,
      blueBans: blueBans.map((b) => ({ hero: b })),
      redBans: redBans.map((b) => ({ hero: b })),
      bluePicks: bluePicks.map((p) => ({ hero: p.hero, pos: p.pos })),
      redPicks: redPicks.map((p) => ({ hero: p.hero, pos: p.pos })),
      turnIdx: draftTurnIdx,
      turnSel: draftTurnSel,
      notes: `จำลองต่อจาก Live Draft เทิร์นที่ ${draftTurnIdx + 1}`,
    };
    setSimulatorInitialScenario(sc);
    handleSelectView('simulator');
    showToast('⚔️ โคลนสถานะดราฟต์สดเข้าสู่ Draft Simulator เรียบร้อยแล้ว (ไม่กระทบเกมจริง)');
  }, [blueTeamName, redTeamName, blueBans, redBans, bluePicks, redPicks, draftTurnIdx, draftTurnSel, showToast, handleSelectView]);

  // Handler to apply scenario from Simulator into Live Draft
  const handleApplySimulatorToLiveDraft = useCallback((scenario: SimulatorScenario) => {
    setBlueTeamName(scenario.blueTeamName || 'Blue Team');
    setRedTeamName(scenario.redTeamName || 'Red Team');
    showToast(`⚔️ นำเข้าสถานะจำลอง "${scenario.name}" สู่ Live Draft สำเร็จ`);
    handleSelectView('draft');
  }, [showToast, setBlueTeamName, setRedTeamName]);

  // Container ref to measure exact available width
  const arenaContainerRef = useRef<HTMLDivElement>(null);
  const [arenaContainerWidth, setArenaContainerWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? Math.min(window.innerWidth - 16, 1600) : 1200
  );

  useEffect(() => {
    const updateWidth = () => {
      if (arenaContainerRef.current) {
        setArenaContainerWidth(arenaContainerRef.current.clientWidth);
      } else {
        setArenaContainerWidth(Math.min(window.innerWidth - 16, 1600));
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);

    let observer: ResizeObserver | null = null;
    if (arenaContainerRef.current) {
      observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect.width > 0) {
            setArenaContainerWidth(entry.contentRect.width);
          }
        }
      });
      observer.observe(arenaContainerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateWidth);
      if (observer) observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!scaledArenaContentRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.height > 0) {
          setScaledContentHeight(entry.contentRect.height);
        }
      }
    });
    observer.observe(scaledArenaContentRef.current);
    return () => observer.disconnect();
  }, [isPhoneScreen]);

  const mobileScale = useMemo(() => {
    const available = Math.max(100, arenaContainerWidth);
    const fitScale = Math.min(1, available / arenaBaseWidth);
    if (mobileZoomMode === 'zoom') {
      return Math.min(1.25, fitScale * 1.25);
    }
    return fitScale;
  }, [arenaContainerWidth, mobileZoomMode]);

  // Render Coaching Dock Content: Single Unified Draft Assistant Window
  const renderCoachDockBody = () => (
    <UnifiedDraftAssistant
      heroName={inspectedHeroName}
      onClose={() => handleSetSidePanelOpen(false)}
      activeTurnTeam={currentTurn?.team || currentTurnSlot?.team || 'blue'}
      bluePicks={bluePicks}
      redPicks={redPicks}
      blueBans={blueBans}
      redBans={redBans}
      bannedHeroNames={bannedHeroNames}
      pickedHeroNames={pickedHeroNames}
      allHeroes={HEROES}
      blueTeamName={blueTeamName}
      redTeamName={redTeamName}
      blueIsUs={blueIsUs}
      players={players}
      heroToPlayersMap={heroToPlayersMap}
      onSelectHeroToInspect={handleInspectHero}
      onPickHeroDirectly={handleSelectHero}
      isPickTurn={currentTurn?.phase === 'pick' || currentTurnSlot?.phase === 'pick'}
      isBanTurn={currentTurn?.phase === 'ban' || currentTurnSlot?.phase === 'ban'}
    />
  );

  // Status for BrandBar
  const brandStatus: 'ready' | 'drafting' | 'complete' = isDraftComplete
    ? 'complete'
    : draftActive
    ? 'drafting'
    : 'ready';

  const phaseLabelText = isDraftComplete
    ? 'DRAFT COMPLETE — ดราฟเสร็จสิ้น'
    : draftActive && currentTurn
    ? `${currentTurn.team.toUpperCase()} • ${currentTurn.label}`
    : 'กดปุ่ม ▶ New Draft เพื่อเริ่ม';

  const handleAddPlayer = (data: Parameters<typeof addPlayer>[0]) => {
    addPlayer(data);
    showToast(`✅ เพิ่มนักแข่ง "${data.nickname}" เข้าสู่ทีมแล้ว`);
  };

  const handleUpdatePlayer = (id: string, updates: Parameters<typeof updatePlayer>[1]) => {
    updatePlayer(id, updates);
    showToast('✏️ บันทึกการแก้ไขข้อมูลนักแข่งแล้ว');
  };

  const handleDeletePlayer = (id: string) => {
    deletePlayer(id);
    showToast('🗑 ลบนักแข่งออกจากทีมแล้ว');
  };

  const handleResetPlayers = () => {
    resetToDefaultPlayers();
    showToast('🔄 รีเซ็ตไลน์อัปนักแข่งเป็นค่าเริ่มต้นแล้ว');
  };

  // Side Panel Toggle handlers (saved in localStorage)
  const handleToggleCoachPanel = () => {
    handleSetSidePanelOpen(!isSidePanelOpen);
  };

  const handleToggleStatsPanel = () => {
    handleSetSidePanelOpen(!isSidePanelOpen);
  };

  // Hero Selection & Inspection
  const handleSelectHero = (hero: Hero) => {
    setInspectedHeroName(hero.name);
    selectHero(hero);
  };

  const handleInspectHero = (heroName: string) => {
    setInspectedHeroName(heroName);
    handleSetSidePanelTab('stats');
    handleSetSidePanelOpen(true);
  };

  // Pre-Draft Setup & Start
  const handleOpenPreDraft = () => {
    setIsPreDraftModalOpen(true);
  };

  const handleStartDraftWithMetadata = (meta: DraftMatchMetadata) => {
    setMatchMetadata(meta);
    setBlueTeamName(meta.blueTeam);
    setRedTeamName(meta.redTeam);
    if (meta.teamCategory) {
      changeTeamCategory(meta.teamCategory);
    }
    setIsPreDraftModalOpen(false);
    startNewDraft();
    showToast(`⚔️ เริ่มดราฟต์: ${meta.match} (Game ${meta.gameNumber})`);
  };

  // Save Draft to History
  const handleOpenSaveDraft = () => {
    setIsSaveDraftModalOpen(true);
  };

  const handleSaveDraftRecord = async (data: {
    tournament: string;
    match: string;
    gameNumber: number;
    patch: string;
    winner: MatchWinner;
    notes: string;
  }) => {
    try {
      const newRec = await saveDraftToHistory({
        tournament: data.tournament,
        match: data.match,
        gameNumber: data.gameNumber,
        patch: data.patch,
        winner: data.winner,
        notes: data.notes,
        teamCategory: selectedTeamCategory !== 'all' ? selectedTeamCategory : undefined,
        blueTeam: {
          teamName: blueTeamName,
          side: 'blue',
          bans: blueBans.filter((b): b is Hero => b !== null).map((b) => b.name),
          picks: bluePicks.map((p) => ({
            heroName: p.hero?.name || '-',
            position: p.pos,
            pickOrder: p.order,
            playerId: p.playerId,
            playerNickname: p.playerNickname,
          })),
        },
        redTeam: {
          teamName: redTeamName,
          side: 'red',
          bans: redBans.filter((b): b is Hero => b !== null).map((b) => b.name),
          picks: redPicks.map((p) => ({
            heroName: p.hero?.name || '-',
            position: p.pos,
            pickOrder: p.order,
            playerId: p.playerId,
            playerNickname: p.playerNickname,
          })),
        },
      });

      setIsSaveDraftModalOpen(false);
      showToast(`💾 บันทึกดราฟต์ "${newRec.match} Game ${newRec.gameNumber}" ลง History สำเร็จ!`);
    } catch (e) {
      console.error(e);
      showToast('❌ เกิดข้อผิดพลาดในการบันทึกดราฟต์');
    }
  };

  // Real-time opponent picks for live matchup cross-reference
  const currentOppPicks = useMemo(() => {
    const isBlueHero = bluePicks.some(
      (p) => p.hero?.name.toLowerCase() === inspectedHeroName?.toLowerCase()
    );
    if (isBlueHero) {
      return redPicks.map((p) => p.hero?.name || '').filter(Boolean);
    }
    const isRedHero = redPicks.some(
      (p) => p.hero?.name.toLowerCase() === inspectedHeroName?.toLowerCase()
    );
    if (isRedHero) {
      return bluePicks.map((p) => p.hero?.name || '').filter(Boolean);
    }

    if (currentTurn?.team === 'blue' || currentTurnSlot?.team === 'blue') {
      return redPicks.map((p) => p.hero?.name || '').filter(Boolean);
    }
    return bluePicks.map((p) => p.hero?.name || '').filter(Boolean);
  }, [inspectedHeroName, bluePicks, redPicks, currentTurn, currentTurnSlot]);

  return (
    <div className="relative min-h-screen text-[#ffffff] flex flex-col p-1.5 sm:p-2.5 md:p-3 lg:p-4 xl:p-5 pb-20 md:pb-6 max-w-[1600px] mx-auto gap-2 sm:gap-2.5 lg:gap-3 w-full overflow-x-hidden">
      {/* 1. Brand Bar with Draft / History / Players Tab Navigation */}
      <BrandBar
        status={brandStatus}
        currentView={currentView}
        onSelectView={handleSelectView}
        playersCount={players.length}
        draftsCount={historyRecords.length}
      />

      {/* 2. Breadcrumb Navigation */}
      {currentView === 'dashboard' ? (
        <div className="flex items-center gap-2 text-[11px] font-['Prompt'] font-semibold text-slate-500 px-1">
          <span className="text-slate-700">🏠 HOME</span>
          <span>›</span>
          <span className="text-[#E91E63] font-bold">COACH EXECUTIVE DASHBOARD</span>
        </div>
      ) : currentView === 'draft' ? (
        <div className="hidden sm:block">
          <Breadcrumb />
        </div>
      ) : currentView === 'history' ? (
        <div className="flex items-center gap-2 text-[11px] font-['Prompt'] font-semibold text-slate-500 px-1">
          <span
            onClick={() => handleSelectView('dashboard')}
            className="cursor-pointer hover:text-[#E91E63] transition-colors"
          >
            🏠 HOME
          </span>
          <span>›</span>
          <span className="text-amber-600 font-bold">DRAFT HISTORY & ARCHIVES</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-[11px] font-['Prompt'] font-semibold text-slate-500 px-1">
          <span
            onClick={() => handleSelectView('dashboard')}
            className="cursor-pointer hover:text-[#E91E63] transition-colors"
          >
            🏠 HOME
          </span>
          <span>›</span>
          <span className="text-[#E91E63] font-bold">ROSTER & HERO POOL</span>
        </div>
      )}

      {/* 3. View Switch: Coach Dashboard vs Players Management vs Draft History vs Draft Simulator */}
      {currentView === 'dashboard' ? (
        <DashboardView
          onSelectView={handleSelectView}
          onOpenNewDraftSetup={() => {
            setIsPreDraftModalOpen(true);
          }}
          players={players}
          historyRecords={historyRecords}
          onInspectHero={handleInspectHero}
          onStartNewDraftFromMatch={(rec) => {
            const nextGameNum = rec.gameNumber + 1;
            setMatchMetadata({
              tournament: rec.tournament,
              match: rec.match,
              gameNumber: nextGameNum,
              blueTeam: rec.redTeam.teamName,
              redTeam: rec.blueTeam.teamName,
              patch: rec.patch,
            });
            setBlueTeamName(rec.redTeam.teamName);
            setRedTeamName(rec.blueTeam.teamName);
            handleSelectView('draft');
            startNewDraft();
            showToast(`⚔️ เริ่ม Game ${nextGameNum}: ${rec.redTeam.teamName} (Blue) vs ${rec.blueTeam.teamName} (Red)`);
          }}
          isCloudConnected={isPlayersCloudConnected}
          teamId={teamId}
          draftActive={draftActive}
        />
      ) : currentView === 'players' ? (
        <PlayersPage
          players={players}
          teamId={teamId}
          isSyncing={isPlayersSyncing}
          isCloudConnected={isPlayersCloudConnected}
          activeProvider={playersActiveProvider}
          lastSyncedAt={playersLastSyncedAt}
          syncError={playersSyncError}
          onAddPlayer={handleAddPlayer}
          onUpdatePlayer={handleUpdatePlayer}
          onDeletePlayer={handleDeletePlayer}
          onResetToDefault={handleResetPlayers}
          onSwitchToDraft={() => handleSelectView('draft')}
          onChangeTeamId={(newId) => {
            changeTeamId(newId);
            showToast(`🔑 สลับไปใช้รหัสทีม "${newId}" เรียบร้อยแล้ว`);
          }}
          onForceSync={async () => {
            const ok = await forceSyncPlayersToCloud();
            if (ok) showToast('☁️ บันทึกรายชื่อนักแข่งขึ้น Cloud สำเร็จแล้ว ข้อมูลจะซิงค์ไปทุกเครื่อง');
            return ok;
          }}
          onReloadCloud={async () => {
            const ok = await reloadPlayersFromCloud();
            if (ok) showToast('🔄 ดึงข้อมูลนักแข่งล่าสุดจาก Cloud สำเร็จ');
            return ok;
          }}
        />
      ) : currentView === 'scouting' ? (
        <ScoutingView
          onOpenDataModal={() => setIsDataModalOpen(true)}
          onOpenNewDraft={() => {
            handleSelectView('draft');
            handleOpenPreDraft();
          }}
        />
      ) : currentView === 'series_prep' ? (
        <SeriesPrepView
          onLoadIntoLiveDraft={handleLoadGameFromSeriesPrepIntoLive}
          onLoadIntoSimulator={handleLoadGameFromSeriesPrepIntoSimulator}
        />
      ) : currentView === 'simulator' ? (
        <DraftSimulatorView
          initialScenario={simulatorInitialScenario}
          onApplyToLiveDraft={handleApplySimulatorToLiveDraft}
          players={players}
          liveDraftSnapshot={{
            blueTeamName,
            redTeamName,
            blueBans: blueBans.map((b) => ({ hero: b })),
            redBans: redBans.map((b) => ({ hero: b })),
            bluePicks: bluePicks.map((p) => ({ hero: p.hero, pos: p.pos })),
            redPicks: redPicks.map((p) => ({ hero: p.hero, pos: p.pos })),
            turnIdx: draftTurnIdx,
          }}
        />
      ) : currentView === 'scrim' ? (
        <ScrimManagerView
          players={players}
        />
      ) : currentView === 'calibration' ? (
        <DraftReviewCalibrationView
          onSelectView={handleSelectView}
          onOpenLiveDraft={() => handleSelectView('draft')}
        />
      ) : currentView === 'match_prep' ? (
        <MatchPrepReportView
          onSelectView={handleSelectView}
          onOpenDraftWithPlan={() => handleSelectView('draft')}
        />
      ) : currentView === 'history' ? (
        <DraftHistoryPage
          onInspectHero={handleInspectHero}
          onOpenNewDraftSetup={() => {
            handleSelectView('draft');
            setIsPreDraftModalOpen(true);
          }}
          onStartNewDraftFromMatch={(rec) => {
            // Swap sides for game N+1 or keep same sides
            const nextGameNum = rec.gameNumber + 1;
            setMatchMetadata({
              tournament: rec.tournament,
              match: rec.match,
              gameNumber: nextGameNum,
              blueTeam: rec.redTeam.teamName, // Standard RoV side swap for next game
              redTeam: rec.blueTeam.teamName,
              patch: rec.patch,
            });
            setBlueTeamName(rec.redTeam.teamName);
            setRedTeamName(rec.blueTeam.teamName);
            handleSelectView('draft');
            startNewDraft();
            showToast(`⚔️ เริ่ม Game ${nextGameNum}: ${rec.redTeam.teamName} (Blue) vs ${rec.blueTeam.teamName} (Red)`);
          }}
        />
      ) : (
        <>
          {/* Draft Header Controls */}
          <DraftHeader
            blueTeamName={blueTeamName}
            setBlueTeamName={setBlueTeamName}
            redTeamName={redTeamName}
            setRedTeamName={setRedTeamName}
            blueIsUs={blueIsUs}
            setBlueIsUs={setBlueIsUs}
            swapSides={swapSides}
            phaseLabel={phaseLabelText}
            onUndo={undo}
            canUndo={canUndo}
            onReset={resetDraft}
            onStartNewDraft={handleOpenPreDraft}
            onOpenSaveDraft={handleOpenSaveDraft}
            onOpenPostDraftReport={() => setIsLivePostDraftReportOpen(true)}
            onOpenSetupModal={handleOpenPreDraft}
            onForkToSimulator={handleForkLiveDraftToSimulator}
            isDraftComplete={isDraftComplete}
            matchMetadata={matchMetadata}
            draftActive={draftActive}
            isSidePanelOpen={isSidePanelOpen}
            sidePanelTab={sidePanelTab}
            onToggleCoachPanel={handleToggleCoachPanel}
            onToggleStatsPanel={handleToggleStatsPanel}
            onOpenDataModal={() => setIsDataModalOpen(true)}
            selectedTeamCategory={selectedTeamCategory}
            onChangeTeamCategory={changeTeamCategory}
            playerCounts={playerCounts}
            isBanTurn={currentTurn?.phase === 'ban' || currentTurnSlot?.phase === 'ban'}
          />

          {/* Main Draft Area - Zero horizontal scroll on any device */}
          <div
            ref={arenaContainerRef}
            className="w-full overflow-x-hidden pb-2 select-none"
          >
            {isPhoneScreen ? (
              /* Phone View (< 680px): Auto-scaled to 100% screen width */
              <div
                className={`w-full ${mobileZoomMode === 'zoom' ? 'overflow-x-auto custom-scrollbar' : 'overflow-hidden'} flex flex-col items-center`}
                style={{
                  height: `${Math.ceil(scaledContentHeight * mobileScale)}px`,
                }}
              >
                <div
                  ref={scaledArenaContentRef}
                  style={{
                    width: `${arenaBaseWidth}px`,
                    transform: `scale(${mobileScale})`,
                    transformOrigin: 'top center',
                  }}
                  className="transition-transform duration-150 flex-shrink-0"
                >
                  <main className="w-[780px] flex flex-row items-stretch gap-2 min-h-0">
                    {/* Left: Blue Side */}
                    <div
                      id="blue-team-column"
                      ref={setBlueColumnRef}
                      className="w-[175px] flex-shrink-0"
                    >
                      <TeamColumn
                        side="blue"
                        compact={true}
                        teamName={blueTeamName}
                        isUs={blueIsUs}
                        bans={blueBans}
                        picks={bluePicks}
                        currentTurnSlot={currentTurnSlot}
                        onSlotClick={(phase, index) => setManualTarget({ team: 'blue', phase, index })}
                        onClearSlot={(phase, index) => clearSlot('blue', phase, index)}
                        onChangePickPos={(index, pos) => changePickPos('blue', index, pos)}
                        onInspectHero={handleInspectHero}
                        inspectedHeroName={inspectedHeroName}
                        players={players}
                        onAssignPlayer={(slotIndex, player) => assignPlayerToPickSlot('blue', slotIndex, player)}
                        teamCategory={selectedTeamCategory}
                      />
                    </div>

                    {/* Center: Draft Center Arena (Heroes in center, bounded to Blue Pick 5) */}
                    <div
                      id="center-draft-arena"
                      className="flex-1 min-w-0 overflow-hidden flex flex-col"
                      style={{
                        height: `${blueColumnHeight}px`,
                        maxHeight: `${blueColumnHeight}px`,
                      }}
                    >
                      <DraftCenter
                        isTablet={isTabletScreen}
                        draftActive={draftActive}
                        draftTurnIdx={draftTurnIdx}
                        draftTurnSel={draftTurnSel}
                        isDraftComplete={isDraftComplete}
                        currentTurnSlot={currentTurnSlot}
                        blueTeamName={blueTeamName}
                        redTeamName={redTeamName}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        roleFilter={roleFilter}
                        setRoleFilter={setRoleFilter}
                        timerSec={timerSec}
                        timerMax={timerMax}
                        isTimerPaused={isTimerPaused}
                        toggleTimerPause={toggleTimerPause}
                        bannedHeroNames={bannedHeroNames}
                        pickedHeroNames={pickedHeroNames}
                        onSelectHero={handleSelectHero}
                        blueScore={draftScore}
                        redScore={redDraftScore}
                        heroToPlayersMap={heroToPlayersMap}
                        inspectedHeroName={inspectedHeroName}
                        onInspectHero={handleInspectHero}
                        isStatsOpen={isSidePanelOpen && sidePanelTab === 'stats'}
                        onToggleStats={handleToggleStatsPanel}
                        onOpenCoachPanel={handleToggleCoachPanel}
                        selectedTeamCategory={selectedTeamCategory}
                        onChangeTeamCategory={changeTeamCategory}
                        bluePicks={bluePicks}
                        redPicks={redPicks}
                      />
                    </div>

                    {/* Right: Red Side */}
                    <div
                      id="red-team-column"
                      className="w-[175px] flex-shrink-0"
                      style={{
                        height: `${blueColumnHeight}px`,
                        maxHeight: `${blueColumnHeight}px`,
                      }}
                    >
                      <TeamColumn
                        side="red"
                        compact={true}
                        teamName={redTeamName}
                        isUs={!blueIsUs}
                        bans={redBans}
                        picks={redPicks}
                        currentTurnSlot={currentTurnSlot}
                        onSlotClick={(phase, index) => setManualTarget({ team: 'red', phase, index })}
                        onClearSlot={(phase, index) => clearSlot('red', phase, index)}
                        onChangePickPos={(index, pos) => changePickPos('red', index, pos)}
                        onInspectHero={handleInspectHero}
                        inspectedHeroName={inspectedHeroName}
                        players={players}
                        onAssignPlayer={(slotIndex, player) => assignPlayerToPickSlot('red', slotIndex, player)}
                        teamCategory={selectedTeamCategory}
                      />
                    </div>
                  </main>
                </div>
              </div>
            ) : (
              /* PC / Tablet View: 100% Fluid 3-Column Arena */
              <main className={`w-full flex flex-row items-start ${
                isTabletScreen ? 'justify-center gap-2' : 'gap-2 lg:gap-3'
              } min-h-0 overflow-x-hidden`}>
                {/* Left: Blue Side (Full size, uncompressed) */}
                <div
                  id="blue-team-column"
                  ref={setBlueColumnRef}
                  className="w-[190px] sm:w-[205px] md:w-[220px] lg:w-[240px] xl:w-[260px] flex-shrink-0"
                >
                  <TeamColumn
                    side="blue"
                    className="w-full h-full"
                    teamName={blueTeamName}
                    isUs={blueIsUs}
                    bans={blueBans}
                    picks={bluePicks}
                    currentTurnSlot={currentTurnSlot}
                    onSlotClick={(phase, index) => setManualTarget({ team: 'blue', phase, index })}
                    onClearSlot={(phase, index) => clearSlot('blue', phase, index)}
                    onChangePickPos={(index, pos) => changePickPos('blue', index, pos)}
                    onInspectHero={handleInspectHero}
                    inspectedHeroName={inspectedHeroName}
                    players={players}
                    onAssignPlayer={(slotIndex, player) => assignPlayerToPickSlot('blue', slotIndex, player)}
                    teamCategory={selectedTeamCategory}
                  />
                </div>

                {/* Center: Draft Center Arena — Strictly bounded to Blue Column height (no overflow past Blue Pick 5) */}
                <div
                  id="center-draft-arena"
                  className={`flex-1 flex flex-col min-w-0 overflow-hidden ${
                    isTabletScreen ? 'max-w-[450px] md:max-w-[490px]' : ''
                  }`}
                  style={{
                    height: `${blueColumnHeight}px`,
                    maxHeight: `${blueColumnHeight}px`,
                  }}
                >
                  <DraftCenter
                    isTablet={isTabletScreen}
                    draftActive={draftActive}
                    draftTurnIdx={draftTurnIdx}
                    draftTurnSel={draftTurnSel}
                    isDraftComplete={isDraftComplete}
                    currentTurnSlot={currentTurnSlot}
                    blueTeamName={blueTeamName}
                    redTeamName={redTeamName}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    roleFilter={roleFilter}
                    setRoleFilter={setRoleFilter}
                    timerSec={timerSec}
                    timerMax={timerMax}
                    isTimerPaused={isTimerPaused}
                    toggleTimerPause={toggleTimerPause}
                    bannedHeroNames={bannedHeroNames}
                    pickedHeroNames={pickedHeroNames}
                    onSelectHero={handleSelectHero}
                    blueScore={draftScore}
                    redScore={redDraftScore}
                    heroToPlayersMap={heroToPlayersMap}
                    inspectedHeroName={inspectedHeroName}
                    onInspectHero={handleInspectHero}
                    isStatsOpen={isSidePanelOpen && sidePanelTab === 'stats'}
                    onToggleStats={handleToggleStatsPanel}
                    onOpenCoachPanel={handleToggleCoachPanel}
                    selectedTeamCategory={selectedTeamCategory}
                    onChangeTeamCategory={changeTeamCategory}
                    bluePicks={bluePicks}
                    redPicks={redPicks}
                  />
                </div>

                {/* Right: Red Side (Full size, uncompressed) */}
                <div
                  id="red-team-column"
                  className="w-[190px] sm:w-[205px] md:w-[220px] lg:w-[240px] xl:w-[260px] flex-shrink-0"
                  style={{
                    height: `${blueColumnHeight}px`,
                    maxHeight: `${blueColumnHeight}px`,
                  }}
                >
                  <TeamColumn
                    side="red"
                    className="w-full h-full"
                    teamName={redTeamName}
                    isUs={!blueIsUs}
                    bans={redBans}
                    picks={redPicks}
                    currentTurnSlot={currentTurnSlot}
                    onSlotClick={(phase, index) => setManualTarget({ team: 'red', phase, index })}
                    onClearSlot={(phase, index) => clearSlot('red', phase, index)}
                    onChangePickPos={(index, pos) => changePickPos('red', index, pos)}
                    onInspectHero={handleInspectHero}
                    inspectedHeroName={inspectedHeroName}
                    players={players}
                    onAssignPlayer={(slotIndex, player) => assignPlayerToPickSlot('red', slotIndex, player)}
                    teamCategory={selectedTeamCategory}
                  />
                </div>

                {/* 4th Column: Pro Coaching Dock (Visible on desktop xl >= 1280px) */}
                {isSidePanelOpen && (
                  <div
                    id="coach-dock-column"
                    className="hidden xl:flex w-[320px] 2xl:w-[360px] flex-shrink-0 flex-col transition-all min-h-0"
                  >
                    {renderCoachDockBody()}
                  </div>
                )}
              </main>
            )}
          </div>



          {/* Slide-out Coach Drawer overlay for screens < 1280px & mobile */}
          {isSidePanelOpen && (
            <div className="xl:hidden fixed inset-0 z-50 flex justify-end">
              <div
                className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
                onClick={() => handleSetSidePanelOpen(false)}
              />
              <div className="relative w-full sm:w-[380px] max-w-full h-full bg-white border-l-2 border-[#F3D5E2] shadow-2xl p-3 flex flex-col z-10 overflow-y-auto custom-scrollbar font-['Prompt']">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#F3D5E2]">
                  <span className="font-['Prompt'] font-bold text-xs text-[#E91E63] flex items-center gap-1.5 uppercase">
                    <span>🎯</span>
                    <span>COACHING DOCK</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSetSidePanelOpen(false)}
                    className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                    title="ปิดหน้าต่าง Coaching Dock"
                  >
                    <X size={16} />
                  </button>
                </div>
                {renderCoachDockBody()}
              </div>
            </div>
          )}


        </>
      )}

      {/* Toast Feedback */}
      <Toast message={toastMessage} />

      {/* Data Layer Manager Modal (JSON / CSV / API) */}
      <StatsImportExportModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        status={statsStatus}
      />

      {/* Pre-Draft Setup Modal (Tournament, Match, Game #, Blue, Red, Patch) */}
      <PreDraftModal
        isOpen={isPreDraftModalOpen}
        onClose={() => setIsPreDraftModalOpen(false)}
        onStart={handleStartDraftWithMetadata}
        initialMetadata={matchMetadata}
      />

      {/* Save Draft Modal (Ban, Pick, Team, Date, Winner, Notes) */}
      <SaveDraftModal
        isOpen={isSaveDraftModalOpen}
        onClose={() => setIsSaveDraftModalOpen(false)}
        tournament={matchMetadata.tournament}
        match={matchMetadata.match}
        gameNumber={matchMetadata.gameNumber}
        patch={matchMetadata.patch}
        blueTeamName={blueTeamName}
        redTeamName={redTeamName}
        blueBans={blueBans}
        redBans={redBans}
        bluePicks={bluePicks}
        redPicks={redPicks}
        onSave={handleSaveDraftRecord}
      />

      {/* RPL Pro Comps Modal */}
      <ProCompsModal
        isOpen={isProCompsOpen}
        onClose={() => setIsProCompsOpen(false)}
        bannedHeroNames={bannedHeroNames}
        pickedHeroNames={pickedHeroNames}
        bluePicks={bluePicks}
        redPicks={redPicks}
        activeTeam={currentTurn?.team || currentTurnSlot?.team || 'blue'}
        onInspectHero={handleInspectHero}
        onPickHeroDirectly={(heroName) => {
          const h = HEROES.find((item) => item.name.toLowerCase() === heroName.toLowerCase());
          if (h) handleSelectHero(h);
        }}
        onBanHeroDirectly={(heroName) => {
          const h = HEROES.find((item) => item.name.toLowerCase() === heroName.toLowerCase());
          if (h) handleSelectHero(h);
        }}
        isPickTurn={currentTurn?.phase === 'pick' || currentTurnSlot?.phase === 'pick'}
        isBanTurn={currentTurn?.phase === 'ban' || currentTurnSlot?.phase === 'ban'}
      />

      {/* Live Draft Post-Draft Strategic Report Modal */}
      <PostDraftReportModal
        isOpen={isLivePostDraftReportOpen}
        onClose={() => setIsLivePostDraftReportOpen(false)}
        blueTeamName={blueTeamName}
        redTeamName={redTeamName}
        bluePicks={bluePicks}
        redPicks={redPicks}
      />

      {/* 4. Mobile Floating Bottom Quick Action Dock (Compact, Ergonomic, Clean) */}
      {currentView === 'draft' && (
        <nav
          aria-label="Mobile Draft Quick Bar"
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#070912]/95 backdrop-blur-md border-t border-slate-700/80 px-1.5 py-1 flex items-center justify-around shadow-[0_-4px_16px_rgba(0,0,0,0.7)]"
        >
          <button
            type="button"
            onClick={handleToggleCoachPanel}
            className={`flex flex-col items-center justify-center gap-0.5 px-2 py-0.5 rounded-lg text-[9px] font-['Barlow_Condensed'] font-black tracking-wider transition-all cursor-pointer ${
              isSidePanelOpen && sidePanelTab === 'coach'
                ? 'text-black bg-[#fbbf24] shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                : 'text-[#fbbf24] hover:bg-white/5'
            }`}
          >
            <span className="text-sm leading-none">🎯</span>
            <span>COACH</span>
          </button>

          <button
            type="button"
            onClick={handleToggleStatsPanel}
            className={`flex flex-col items-center justify-center gap-0.5 px-2 py-0.5 rounded-lg text-[9px] font-['Barlow_Condensed'] font-black tracking-wider transition-all cursor-pointer ${
              isSidePanelOpen && sidePanelTab === 'stats'
                ? 'text-white bg-[#e11d48] shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                : 'text-rose-400 hover:bg-white/5'
            }`}
          >
            <span className="text-sm leading-none">📊</span>
            <span>STATS</span>
          </button>

          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            className="flex flex-col items-center justify-center gap-0.5 px-2 py-0.5 rounded-lg text-[9px] font-['Barlow_Condensed'] font-black tracking-wider text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:text-white transition-all cursor-pointer"
          >
            <span className="text-sm leading-none">↩️</span>
            <span>UNDO</span>
          </button>

          <button
            type="button"
            onClick={handleOpenSaveDraft}
            className={`flex flex-col items-center justify-center gap-0.5 px-2 py-0.5 rounded-lg text-[9px] font-['Barlow_Condensed'] font-black tracking-wider transition-all cursor-pointer ${
              isDraftComplete
                ? 'text-black bg-emerald-400 font-extrabold shadow-[0_0_8px_rgba(52,211,153,0.7)] animate-pulse'
                : 'text-emerald-400 hover:bg-white/5'
            }`}
          >
            <span className="text-sm leading-none">💾</span>
            <span>SAVE</span>
          </button>

          <button
            type="button"
            onClick={handleOpenPreDraft}
            className="flex flex-col items-center justify-center gap-0.5 px-2 py-0.5 rounded-lg text-[9px] font-['Barlow_Condensed'] font-black tracking-wider text-sky-400 hover:bg-white/5 transition-all cursor-pointer"
          >
            <span className="text-sm leading-none">⚔️</span>
            <span>{draftActive ? 'RESTART' : 'NEW'}</span>
          </button>
        </nav>
      )}
    </div>
  );
}
