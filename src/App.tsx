import React, { useState, useEffect, useMemo } from 'react';
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

  // Mobile view tab toggle for Draft 3 columns + coach panel
  const [mobileTab, setMobileTab] = useState<'blue' | 'center' | 'red' | 'coach'>('center');

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
        blueTeam: {
          teamName: blueTeamName,
          side: 'blue',
          bans: blueBans.filter((b): b is Hero => b !== null).map((b) => b.name),
          picks: bluePicks.map((p) => ({
            heroName: p.hero?.name || '-',
            position: p.pos,
            pickOrder: p.order,
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
          />

          {/* Mobile Tab Switcher */}
          <div className="flex lg:hidden items-center gap-1.5 p-1.5 bg-[#0a0c14]/95 border-2 border-slate-700/80 rounded-xl overflow-x-auto shadow-md">
            <button
              onClick={() => setMobileTab('blue')}
              className={`flex-1 min-w-[75px] py-2 font-['Barlow_Condensed'] font-black text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 border ${
                mobileTab === 'blue'
                  ? 'bg-[#0284c7] border-[#38bdf8] text-white shadow-[0_0_12px_rgba(56,189,248,0.5)]'
                  : 'border-transparent text-slate-300'
              }`}
            >
              <span>🔵</span>
              <span>BLUE</span>
            </button>
            <button
              onClick={() => setMobileTab('center')}
              className={`flex-1 min-w-[75px] py-2 font-['Barlow_Condensed'] font-black text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 border ${
                mobileTab === 'center'
                  ? 'bg-white text-black border-white shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                  : 'border-transparent text-slate-300'
              }`}
            >
              <span>⚔️</span>
              <span>DRAFT</span>
            </button>
            <button
              onClick={() => setMobileTab('red')}
              className={`flex-1 min-w-[75px] py-2 font-['Barlow_Condensed'] font-black text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 border ${
                mobileTab === 'red'
                  ? 'bg-[#e11d48] border-[#f43f5e] text-white shadow-[0_0_12px_rgba(244,63,94,0.5)]'
                  : 'border-transparent text-slate-300'
              }`}
            >
              <span>🔴</span>
              <span>RED</span>
            </button>
            <button
              onClick={() => {
                setMobileTab('coach');
                setIsSidePanelOpen(true);
              }}
              className={`flex-1 min-w-[75px] py-2 font-['Barlow_Condensed'] font-black text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 border ${
                mobileTab === 'coach'
                  ? 'bg-[#fbbf24] border-[#fde047] text-black shadow-[0_0_12px_rgba(251,191,36,0.5)]'
                  : 'border-transparent text-slate-300'
              }`}
            >
              <span>🎯</span>
              <span>COACH</span>
            </button>
          </div>

          {/* Main Draft Area (with Dockable Coach Analysis & Stats Side Panel) */}
          <main className="w-full flex flex-col lg:flex-row items-stretch gap-3 min-h-0">
            {/* Left: Blue Side */}
            <div className={`w-full lg:w-auto ${mobileTab === 'blue' ? 'block' : 'hidden lg:block'}`}>
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
              />
            </div>

            {/* Center: Draft Center Arena with Hero Pool Badges */}
            <div className={`flex-1 min-w-0 ${mobileTab === 'center' ? 'flex' : 'hidden lg:flex'}`}>
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
              />
            </div>

            {/* Right: Red Side */}
            <div className={`w-full lg:w-auto ${mobileTab === 'red' ? 'block' : 'hidden lg:block'}`}>
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
              />
            </div>

            {/* 4th Column: Pro Coaching Dock (Coach Analysis & Tournament Stats) */}
            {(isSidePanelOpen || mobileTab === 'coach') && (
              <div
                className={`w-full lg:w-[340px] xl:w-[380px] flex-shrink-0 flex flex-col transition-all min-h-0 ${
                  mobileTab === 'coach' ? 'block' : 'hidden lg:flex'
                }`}
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
