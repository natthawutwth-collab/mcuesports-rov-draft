import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { StatsImportExportModal } from './components/StatsImportExportModal';
import { MatchNotesSection } from './components/MatchNotesSection';
import { PlayersPage } from './components/PlayersPage';
import { DraftHistoryPage } from './components/DraftHistoryPage';
import { PreDraftModal } from './components/PreDraftModal';
import { SaveDraftModal } from './components/SaveDraftModal';
import { DraftPlayerRosterBar } from './components/DraftPlayerRosterBar';
import { Toast } from './components/Toast';
import { statsDataProvider } from './services/statsDataProvider';
import { Hero } from './types/draft';
import { DraftMatchMetadata, MatchWinner } from './types/draftHistory';
import { HEROES } from './data/heroes';
import { X } from 'lucide-react';

const CURRENT_VIEW_KEY = 'mcu_rov_current_view';
const SIDE_PANEL_OPEN_KEY = 'mcu_rov_side_panel_open';
const SIDE_PANEL_TAB_KEY = 'mcu_rov_side_panel_tab';

const getInitialView = (): 'draft' | 'players' | 'history' => {
  if (typeof window !== 'undefined') {
    // 1. Check URL hash first (e.g. #players, #history, #draft)
    const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
    if (hash === 'players' || hash === 'history' || hash === 'draft') {
      return hash as 'draft' | 'players' | 'history';
    }
    // 2. Check query param (e.g. ?view=players or ?tab=players)
    try {
      const params = new URLSearchParams(window.location.search);
      const queryView = params.get('view') || params.get('tab');
      if (queryView === 'players' || queryView === 'history' || queryView === 'draft') {
        return queryView as 'draft' | 'players' | 'history';
      }
    } catch {
      // ignore
    }
    // 3. Check localStorage for last active page
    try {
      const saved = localStorage.getItem(CURRENT_VIEW_KEY);
      if (saved === 'players' || saved === 'history' || saved === 'draft') {
        return saved as 'draft' | 'players' | 'history';
      }
    } catch {
      // ignore
    }
  }
  return 'draft';
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
  // Navigation view: Draft Simulator vs Players Management vs Draft History (with persistence & URL hash)
  const [currentView, setCurrentView] = useState<'draft' | 'players' | 'history'>(getInitialView);

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

  const handleSelectView = (view: 'draft' | 'players' | 'history') => {
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
      const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
      if (hash === 'players' || hash === 'history' || hash === 'draft') {
        setCurrentView(hash as 'draft' | 'players' | 'history');
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
    matchGames,
    blueSeriesNote,
    setBlueSeriesNote,
    redSeriesNote,
    setRedSeriesNote,
    saveToMatchNotes,
    addEmptyGame,
    clearAllGames,
    updateGameWinner,
    updateGameNote,
    updateGameSlot,
    deleteGame,
    toastMessage,
    showToast,
  } = useDraconmindDraft();

  // Category player counts for DraftHeader
  const playerCounts = useMemo(() => ({
    all: players.length,
    male: players.filter((p) => (p.category || 'male') === 'male').length,
    female: players.filter((p) => p.category === 'female').length,
    mixed: players.filter((p) => p.category === 'mixed').length,
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

  const isMobileScreen = windowWidth < 840;

  // Scaled 3-column PC layout on mobile (Heroes in center, Blue left, Red right - scaled to fit screen)
  const arenaBaseWidth = 780;
  const scaledArenaContentRef = useRef<HTMLDivElement>(null);
  const [scaledContentHeight, setScaledContentHeight] = useState<number>(760);
  const [mobileZoomMode, setMobileZoomMode] = useState<'fit' | 'zoom'>('fit');

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
  }, [isMobileScreen]);

  const mobileScale = useMemo(() => {
    const available = Math.max(100, arenaContainerWidth);
    const fitScale = Math.min(1, available / arenaBaseWidth);
    if (mobileZoomMode === 'zoom') {
      return Math.min(1.25, fitScale * 1.25);
    }
    return fitScale;
  }, [arenaContainerWidth, mobileZoomMode]);

  // Render Coaching Dock Content (shared between desktop sidebar and mobile/laptop overlay drawer)
  const renderCoachDockBody = () => (
    <div className="flex flex-col h-full min-h-0 w-full overflow-hidden">
      {/* Dock Mode Switcher - High Contrast Segmented Buttons */}
      <div className="flex items-center gap-1.5 mb-2 p-1.5 bg-white rounded-xl border-2 border-[#F3D5E2] shadow-xs flex-shrink-0">
        <button
          type="button"
          onClick={() => handleSetSidePanelTab('coach')}
          className={`flex-1 py-1.5 px-2 rounded-lg font-['Prompt'] text-[11px] font-bold tracking-wide flex items-center justify-center gap-1 transition-all cursor-pointer border ${
            sidePanelTab === 'coach'
              ? 'bg-[#E91E63] border-[#E91E63] text-white shadow-xs'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>🎯</span>
          <span className="truncate">COACH ANALYSIS</span>
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse flex-shrink-0"></span>
        </button>

        <button
          type="button"
          onClick={() => handleSetSidePanelTab('stats')}
          className={`flex-1 py-1.5 px-2 rounded-lg font-['Prompt'] text-[11px] font-bold tracking-wide flex items-center justify-center gap-1 transition-all cursor-pointer border ${
            sidePanelTab === 'stats'
              ? 'bg-[#0284C7] border-[#0284C7] text-white shadow-xs'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>📊</span>
          <span className="truncate">RPL STATS</span>
        </button>
      </div>

      {/* Tab 1: Coach Analysis Panel */}
      {sidePanelTab === 'coach' ? (
        <CoachAnalysisPanel
          isOpen={true}
          onClose={() => handleSetSidePanelOpen(false)}
          activeTurnTeam={currentTurn?.team || currentTurnSlot?.team || 'blue'}
          bluePicks={bluePicks}
          redPicks={redPicks}
          blueBans={blueBans}
          redBans={redBans}
          bannedHeroNames={bannedHeroNames}
          pickedHeroNames={pickedHeroNames}
          allHeroes={HEROES}
          players={players}
          heroToPlayersMap={heroToPlayersMap}
          inspectedHeroName={inspectedHeroName}
          onSelectHeroToInspect={handleInspectHero}
          onPickHeroDirectly={handleSelectHero}
          isPickTurn={currentTurn?.phase === 'pick' || currentTurnSlot?.phase === 'pick'}
        />
      ) : (
        /* Tab 2: Tournament Stats & Matchups Panel */
        <HeroStatsSidePanel
          heroName={inspectedHeroName}
          isOpen={true}
          onClose={() => handleSetSidePanelOpen(false)}
          oppPicks={currentOppPicks}
          onSelectHeroToInspect={handleInspectHero}
          onOpenDataModal={() => setIsDataModalOpen(true)}
        />
      )}
    </div>
  );

  // Collapsible state for Draft Player Roster Bar on Draft screen (collapsed on mobile by default to keep draft front & center)
  const [isRosterBarOpen, setIsRosterBarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 840 : true
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
    if (isSidePanelOpen && sidePanelTab === 'coach') {
      handleSetSidePanelOpen(false);
    } else {
      handleSetSidePanelOpen(true);
      handleSetSidePanelTab('coach');
    }
  };

  const handleToggleStatsPanel = () => {
    if (isSidePanelOpen && sidePanelTab === 'stats') {
      handleSetSidePanelOpen(false);
    } else {
      handleSetSidePanelOpen(true);
      handleSetSidePanelTab('stats');
    }
  };

  // Hero Selection & Inspection
  const handleSelectHero = (hero: Hero) => {
    setInspectedHeroName(hero.name);
    selectHero(hero);
  };

  const handleInspectHero = (heroName: string) => {
    setInspectedHeroName(heroName);
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
    <div className="relative min-h-screen text-[#ffffff] flex flex-col p-2 sm:p-3.5 md:p-5 pb-20 md:pb-6 max-w-[1600px] mx-auto gap-2 sm:gap-3 w-full overflow-x-hidden">
      {/* 1. Brand Bar with Draft / History / Players Tab Navigation */}
      <BrandBar
        status={brandStatus}
        currentView={currentView}
        onSelectView={handleSelectView}
        playersCount={players.length}
        draftsCount={historyRecords.length}
      />

      {/* 2. Breadcrumb (hidden on mobile to save vertical space) */}
      {currentView === 'draft' ? (
        <div className="hidden sm:block">
          <Breadcrumb />
        </div>
      ) : currentView === 'history' ? (
        <div className="flex items-center gap-2 text-[11px] font-['Barlow_Condensed'] font-semibold tracking-wider text-[#a0a0a8] px-1">
          <span
            onClick={() => handleSelectView('draft')}
            className="cursor-pointer hover:text-white transition-colors"
          >
            🏠 HOME
          </span>
          <span>›</span>
          <span className="text-[#d4a857] font-bold">DRAFT HISTORY & ARCHIVES</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-[11px] font-['Barlow_Condensed'] font-semibold tracking-wider text-[#a0a0a8] px-1">
          <span
            onClick={() => handleSelectView('draft')}
            className="cursor-pointer hover:text-white transition-colors"
          >
            🏠 HOME
          </span>
          <span>›</span>
          <span className="text-[#a82844] font-bold">PLAYERS & HERO POOL</span>
        </div>
      )}

      {/* 3. View Switch: Players Management vs Draft History vs Draft Simulator */}
      {currentView === 'players' ? (
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
            onSaveMatchNote={saveToMatchNotes}
            onOpenSaveDraft={handleOpenSaveDraft}
            onOpenSetupModal={handleOpenPreDraft}
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
            isRosterBarOpen={isRosterBarOpen}
            onToggleRosterBar={() => setIsRosterBarOpen((prev) => !prev)}
          />

          {/* Draft Player Roster Bar (แยกทีมชาย ทีมหญิง ทีมผสม พร้อมข้อมูลนักแข่ง) */}
          <DraftPlayerRosterBar
            players={players}
            selectedCategory={selectedTeamCategory}
            onChangeCategory={changeTeamCategory}
            isOpen={isRosterBarOpen}
            onToggleOpen={() => setIsRosterBarOpen((prev) => !prev)}
            onInspectHero={handleInspectHero}
            onSelectHeroDirectly={handleSelectHero}
            onAssignPlayerToActiveSlot={(player) => {
              if (currentTurnSlot && currentTurnSlot.phase === 'pick') {
                assignPlayerToPickSlot(currentTurnSlot.team, currentTurnSlot.index, player);
                showToast(`👤 กำหนด "${player.nickname}" (${player.position}) ลงช่อง ${currentTurnSlot.team.toUpperCase()} Pick ${currentTurnSlot.index + 1}`);
              }
            }}
            currentTurnSlot={currentTurnSlot}
          />

          {/* Draft Arena View Mode & Toolbar */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white border border-[#F3D5E2] rounded-xl shadow-xs">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="font-['Orbitron'] font-black text-[11px] sm:text-xs text-[#E91E63] flex items-center gap-1 sm:gap-1.5 tracking-wider flex-shrink-0">
                <span>⚔️</span>
                <span>DRAFT ARENA</span>
              </span>
              {isMobileScreen ? (
                <span className="text-[9px] font-['Prompt'] text-emerald-700 bg-emerald-50 border border-emerald-300 px-1.5 py-0.2 rounded flex items-center gap-1 font-bold truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                  <span>3 คอลัมน์</span>
                </span>
              ) : (
                <span className="text-[11px] font-['Prompt'] text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>3 คอลัมน์พอดีจอคอมพิวเตอร์ (No Scroll)</span>
                </span>
              )}
            </div>

            {isMobileScreen ? (
              <div className="flex items-center gap-1 ml-auto flex-shrink-0">
                {/* Mobile Scale/Zoom Toggle */}
                <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-md border border-slate-300">
                  <button
                    type="button"
                    onClick={() => setMobileZoomMode('fit')}
                    className={`px-1.5 py-0.5 text-[9.5px] font-['Prompt'] font-bold tracking-wider rounded transition-all cursor-pointer flex items-center gap-0.5 ${
                      mobileZoomMode === 'fit'
                        ? 'bg-[#10b981] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="ย่อ 3 คอลัมน์ให้พอดีหน้าจอมือถือ 100% ไม่ต้องเลื่อนข้าง"
                  >
                    <span>📐</span>
                    <span>พอดีจอ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileZoomMode('zoom')}
                    className={`px-1.5 py-0.5 text-[9.5px] font-['Prompt'] font-bold tracking-wider rounded transition-all cursor-pointer flex items-center gap-0.5 ${
                      mobileZoomMode === 'zoom'
                        ? 'bg-[#0284c7] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="ขยายขนาด 1.25x ให้มองเห็นได้ใหญ่ขึ้น"
                  >
                    <span>🔍</span>
                    <span>1.25x</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[11px] font-['Prompt'] text-slate-500 ml-auto">
                <span className="px-2 py-0.5 rounded bg-sky-50 border border-sky-200 font-bold text-[#0284C7]">
                  🔵 BLUE
                </span>
                <span>+</span>
                <span className="px-2 py-0.5 rounded bg-[#FCE4EC] border border-[#F48FB1] font-bold text-[#E91E63]">
                  ⚔️ HERO POOL (ตรงกลาง)
                </span>
                <span>+</span>
                <span className="px-2 py-0.5 rounded bg-rose-50 border border-rose-200 font-bold text-[#E11D48]">
                  🔴 RED
                </span>
              </div>
            )}
          </div>

          {/* Main Draft Area - Zero horizontal scroll on any device */}
          <div
            ref={arenaContainerRef}
            className="w-full overflow-x-hidden pb-2 select-none"
          >
            {isMobileScreen ? (
              /* Mobile View: Exactly like PC (Blue Left | Heroes in Center | Red Right) auto-scaled to 100% screen width */
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
                    <div id="blue-team-column" className="w-[175px] flex-shrink-0">
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

                    {/* Center: Draft Center Arena (Heroes in center, just like PC!) */}
                    <div id="center-draft-arena" className="flex-1 min-w-0">
                      <DraftCenter
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
                      />
                    </div>

                    {/* Right: Red Side */}
                    <div id="red-team-column" className="w-[175px] flex-shrink-0">
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
              /* PC / Desktop View: 100% Fluid 3-Column Arena */
              <main className="w-full flex flex-row items-stretch gap-2.5 lg:gap-3 min-h-0 overflow-x-hidden">
                {/* Left: Blue Side */}
                <div id="blue-team-column" className="w-[195px] md:w-[215px] lg:w-[240px] xl:w-[260px] flex-shrink-0">
                  <TeamColumn
                    side="blue"
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

                {/* Center: Draft Center Arena */}
                <div id="center-draft-arena" className="flex-1 flex flex-col min-w-0">
                  <DraftCenter
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
                  />
                </div>

                {/* Right: Red Side */}
                <div id="red-team-column" className="w-[195px] md:w-[215px] lg:w-[240px] xl:w-[260px] flex-shrink-0">
                  <TeamColumn
                    side="red"
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

          {/* Match Notes Section (BO3..BO7 Series Notes) */}
          <MatchNotesSection
            games={matchGames}
            blueTeamName={blueTeamName}
            redTeamName={redTeamName}
            blueIsUs={blueIsUs}
            blueSeriesNote={blueSeriesNote}
            setBlueSeriesNote={setBlueSeriesNote}
            redSeriesNote={redSeriesNote}
            setRedSeriesNote={setRedSeriesNote}
            onAddEmptyGame={addEmptyGame}
            onClearAllGames={clearAllGames}
            onUpdateWinner={updateGameWinner}
            onUpdateNote={updateGameNote}
            onUpdateSlot={updateGameSlot}
            onDeleteGame={deleteGame}
          />
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
