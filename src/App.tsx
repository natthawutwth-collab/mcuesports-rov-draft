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

export default function App() {
  // Navigation view: Draft Simulator vs Players Management vs Draft History
  const [currentView, setCurrentView] = useState<'draft' | 'players' | 'history'>('draft');

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

  // Hero Stats & Coach Analysis Side Panel State
  const [inspectedHeroName, setInspectedHeroName] = useState<string | null>('Nakroth');
  const [isSidePanelOpen, setIsSidePanelOpen] = useState<boolean>(true);
  const [sidePanelTab, setSidePanelTab] = useState<'coach' | 'stats'>('coach');
  const [isDataModalOpen, setIsDataModalOpen] = useState<boolean>(false);
  const [statsStatus, setStatsStatus] = useState(() => statsDataProvider.getStatus());

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

  // Horizontal draft board ref for smooth navigation on mobile & smaller screens
  const draftBoardRef = useRef<HTMLDivElement>(null);

  // Screen fit mode for mobile: auto-scale entire arena to fit mobile viewport
  const [fitScreenMode, setFitScreenMode] = useState<boolean>(false);
  const [windowWidth, setWindowWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Standard PC arena target width is around 1060px (or 1420px with coach dock open)
  const targetArenaWidth = isSidePanelOpen ? 1420 : 1060;
  const calculatedScale = useMemo(() => {
    if (!fitScreenMode) return 1;
    const availableWidth = Math.max(320, windowWidth - 20);
    const scale = availableWidth / targetArenaWidth;
    return Math.min(1, Math.max(0.35, scale));
  }, [fitScreenMode, windowWidth, targetArenaWidth]);

  // Quick glider scroll to column on mobile / small screens
  const scrollToDraftSection = (section: 'blue' | 'center' | 'red' | 'coach') => {
    if (!draftBoardRef.current) return;
    const container = draftBoardRef.current;
    if (section === 'blue') {
      container.scrollTo({ left: 0, behavior: 'smooth' });
    } else if (section === 'center') {
      container.scrollTo({ left: 240, behavior: 'smooth' });
    } else if (section === 'red') {
      container.scrollTo({ left: 760, behavior: 'smooth' });
    } else if (section === 'coach') {
      setIsSidePanelOpen(true);
      setTimeout(() => {
        container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
      }, 80);
    }
  };

  // Collapsible state for Draft Player Roster Bar on Draft screen
  const [isRosterBarOpen, setIsRosterBarOpen] = useState(true);

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

  // Side Panel Toggle handlers
  const handleToggleCoachPanel = () => {
    if (isSidePanelOpen && sidePanelTab === 'coach') {
      setIsSidePanelOpen(false);
    } else {
      setIsSidePanelOpen(true);
      setSidePanelTab('coach');
    }
  };

  const handleToggleStatsPanel = () => {
    if (isSidePanelOpen && sidePanelTab === 'stats') {
      setIsSidePanelOpen(false);
    } else {
      setIsSidePanelOpen(true);
      setSidePanelTab('stats');
    }
  };

  // Hero Selection & Inspection (opens Side Panel real-time)
  const handleSelectHero = (hero: Hero) => {
    setInspectedHeroName(hero.name);
    setIsSidePanelOpen(true);
    selectHero(hero);
  };

  const handleInspectHero = (heroName: string) => {
    setInspectedHeroName(heroName);
    setIsSidePanelOpen(true);
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
    <div className="relative min-h-screen text-[#ffffff] flex flex-col p-2.5 sm:p-4 md:p-5 max-w-[1600px] mx-auto gap-3">
      {/* 1. Brand Bar with Draft / History / Players Tab Navigation */}
      <BrandBar
        status={brandStatus}
        currentView={currentView}
        onSelectView={setCurrentView}
        playersCount={players.length}
        draftsCount={historyRecords.length}
      />

      {/* 2. Breadcrumb */}
      {currentView === 'draft' ? (
        <Breadcrumb />
      ) : currentView === 'history' ? (
        <div className="flex items-center gap-2 text-[11px] font-['Barlow_Condensed'] font-semibold tracking-wider text-[#a0a0a8] px-1">
          <span
            onClick={() => setCurrentView('draft')}
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
            onClick={() => setCurrentView('draft')}
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
          onSwitchToDraft={() => setCurrentView('draft')}
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
            setCurrentView('draft');
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
            setCurrentView('draft');
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

          {/* Mobile & PC Arena Quick Glider Toolbar */}
          <div className="flex items-center justify-between gap-2 px-3 py-2 bg-[#0a0c14]/95 border-2 border-slate-700/80 rounded-xl shadow-lg flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-['Orbitron'] font-black text-xs text-[#fbbf24] flex items-center gap-1.5 tracking-wider">
                <span>🖥️</span>
                <span>PC ARENA VIEW</span>
              </span>
              <span className="hidden sm:inline text-[11px] font-['Kanit'] text-slate-300">
                (แสดงฝั่ง Blue, กลางสนาม, และ Red พร้อมกันเหมือนคอมพิวเตอร์)
              </span>
            </div>

            {/* Quick Glider Buttons — Jump smoothly to any column */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <button
                type="button"
                onClick={() => scrollToDraftSection('blue')}
                className="px-2.5 py-1 text-[11px] font-['Barlow_Condensed'] font-black tracking-wider rounded-lg bg-[#0284c7]/20 border border-[#38bdf8]/60 text-[#38bdf8] hover:bg-[#0284c7]/40 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                title="เลื่อนหน้าจอไปดูฝั่ง BLUE"
              >
                <span>🔵</span>
                <span>BLUE</span>
              </button>
              <button
                type="button"
                onClick={() => scrollToDraftSection('center')}
                className="px-2.5 py-1 text-[11px] font-['Barlow_Condensed'] font-black tracking-wider rounded-lg bg-white/10 border border-white/40 text-white hover:bg-white/20 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                title="เลื่อนหน้าจอไปดูกลางสนามฮีโร่"
              >
                <span>⚔️</span>
                <span>DRAFT</span>
              </button>
              <button
                type="button"
                onClick={() => scrollToDraftSection('red')}
                className="px-2.5 py-1 text-[11px] font-['Barlow_Condensed'] font-black tracking-wider rounded-lg bg-[#e11d48]/20 border border-[#f43f5e]/60 text-[#f43f5e] hover:bg-[#e11d48]/40 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                title="เลื่อนหน้าจอไปดูฝั่ง RED"
              >
                <span>🔴</span>
                <span>RED</span>
              </button>
              <button
                type="button"
                onClick={() => scrollToDraftSection('coach')}
                className={`px-2.5 py-1 text-[11px] font-['Barlow_Condensed'] font-black tracking-wider rounded-lg border transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                  isSidePanelOpen
                    ? 'bg-[#fbbf24] border-[#fde047] text-black shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                    : 'bg-[#fbbf24]/20 border-[#fbbf24]/60 text-[#fbbf24] hover:bg-[#fbbf24]/30'
                }`}
                title="เปิด/เลื่อนไปดู Coach Analysis"
              >
                <span>🎯</span>
                <span>COACH</span>
              </button>
            </div>

            {/* Fit Screen Scale Mode for Mobile Screens */}
            <div className="flex items-center gap-1 ml-auto">
              <button
                type="button"
                onClick={() => {
                  setFitScreenMode((prev) => !prev);
                  if (!fitScreenMode && draftBoardRef.current) {
                    draftBoardRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                  }
                }}
                className={`px-2.5 py-1 text-[11px] font-['Barlow_Condensed'] font-bold tracking-wider rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                  fitScreenMode
                    ? 'bg-[#10b981] border-[#34d399] text-black shadow-[0_0_12px_rgba(16,185,129,0.5)] font-black'
                    : 'bg-black/60 border-slate-700 text-slate-300 hover:text-white'
                }`}
                title={fitScreenMode ? 'สลับกลับเป็นขนาดปกติ 100%' : 'ย่อทั้งสนามให้พอดีหน้าจอมือถือโดยไม่ต้องเลื่อน'}
              >
                <span>{fitScreenMode ? '🔍 ขนาด 100%' : '📱 ย่อพอดีจอ'}</span>
              </button>
            </div>
          </div>

          {/* Main Draft Area (Side-by-side esports layout, identical to PC on all devices) */}
          <div
            ref={draftBoardRef}
            className="w-full overflow-x-auto custom-scrollbar pb-3 pt-1 select-none"
          >
            <div
              style={
                fitScreenMode
                  ? {
                      transform: `scale(${calculatedScale})`,
                      transformOrigin: 'top left',
                      width: `${100 / calculatedScale}%`,
                      marginBottom: `-${(1 - calculatedScale) * 100}%`,
                    }
                  : undefined
              }
              className="transition-transform duration-200"
            >
              <main className="min-w-fit flex flex-row items-stretch gap-3 min-h-0">
                {/* Left: Blue Side (Always visible side-by-side) */}
                <div id="blue-team-column" className="flex-shrink-0">
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

                {/* Center: Draft Center Arena with Hero Pool Badges (Always visible between Blue & Red) */}
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

                {/* Right: Red Side (Always visible side-by-side) */}
                <div id="red-team-column" className="flex-shrink-0">
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

                {/* 4th Column: Pro Coaching Dock (Coach Analysis & Tournament Stats) */}
                {isSidePanelOpen && (
                  <div
                    id="coach-dock-column"
                    className="w-[320px] sm:w-[340px] xl:w-[380px] flex-shrink-0 flex flex-col transition-all min-h-0"
                  >
                    {/* Dock Mode Switcher - High Contrast Segmented Buttons */}
                    <div className="flex items-center gap-1.5 mb-2.5 p-1.5 bg-[#0a0c14]/95 rounded-xl border-2 border-slate-700/80 shadow-lg">
                      <button
                        type="button"
                        onClick={() => setSidePanelTab('coach')}
                        className={`flex-1 py-2 px-2.5 rounded-lg font-['Barlow_Condensed'] text-[11.5px] font-black tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                          sidePanelTab === 'coach'
                            ? 'bg-[#fbbf24] border-[#fde047] text-black shadow-[0_0_14px_rgba(251,191,36,0.6)]'
                            : 'border-transparent text-slate-300 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span>🎯</span>
                        <span>COACH ANALYSIS</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSidePanelTab('stats')}
                        className={`flex-1 py-2 px-2.5 rounded-lg font-['Barlow_Condensed'] text-[11.5px] font-black tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                          sidePanelTab === 'stats'
                            ? 'bg-[#e11d48] border-[#f43f5e] text-white shadow-[0_0_14px_rgba(244,63,94,0.6)]'
                            : 'border-transparent text-slate-300 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span>📊</span>
                        <span>RPL STATS</span>
                      </button>
                    </div>

                    {/* Tab 1: Coach Analysis Panel */}
                    {sidePanelTab === 'coach' ? (
                      <CoachAnalysisPanel
                        isOpen={true}
                        onClose={() => setIsSidePanelOpen(false)}
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
                        onClose={() => setIsSidePanelOpen(false)}
                        oppPicks={currentOppPicks}
                        onSelectHeroToInspect={handleInspectHero}
                        onOpenDataModal={() => setIsDataModalOpen(true)}
                      />
                    )}
                  </div>
                )}
              </main>
            </div>
          </div>

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
    </div>
  );
}
