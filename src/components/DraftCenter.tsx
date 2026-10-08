import React, { useState, useMemo, useEffect } from 'react';
import { Hero, PositionKey, TeamSide, SlotType } from '../types/draft';
import { HeroPlayerBadge, TeamCategory } from '../types/player';
import { DRAFT_TURNS } from '../data/draftSteps';
import { HEROES, getHeroImageUrl } from '../data/heroes';
import { DraftScoreResult } from '../data/metaData';
import { Search, Pause, Play, Ban, Check, Sparkles, BarChart2 } from 'lucide-react';

interface DraftCenterProps {
  draftActive: boolean;
  draftTurnIdx: number;
  draftTurnSel: number;
  isDraftComplete: boolean;
  currentTurnSlot: {
    team: TeamSide;
    phase: SlotType;
    index: number;
  } | null;
  blueTeamName: string;
  redTeamName: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  roleFilter: PositionKey;
  setRoleFilter: (role: PositionKey) => void;
  timerSec: number;
  timerMax: number;
  isTimerPaused: boolean;
  toggleTimerPause: () => void;
  bannedHeroNames: Set<string>;
  pickedHeroNames: Set<string>;
  onSelectHero: (hero: Hero) => void;
  blueScore: DraftScoreResult;
  redScore: DraftScoreResult;
  heroToPlayersMap?: Record<string, HeroPlayerBadge[]>;
  inspectedHeroName?: string | null;
  onInspectHero?: (heroName: string) => void;
  isStatsOpen?: boolean;
  onToggleStats?: () => void;
  onOpenCoachPanel?: () => void;
  selectedTeamCategory?: TeamCategory;
  onChangeTeamCategory?: (cat: TeamCategory) => void;
  bluePicks?: { hero: Hero | null }[];
  redPicks?: { hero: Hero | null }[];
  compact?: boolean;
  isTablet?: boolean;
}

export type PlayerPoolFilter = 'all' | 'player_all' | 'signature' | 'comfortable';

const ROLES: { key: PositionKey; label: string; colorClass: string; activeClass: string }[] = [
  { key: 'all', label: 'ALL', colorClass: 'text-slate-700 hover:text-[#E91E63] hover:border-[#E91E63]', activeClass: 'bg-[#E91E63] text-white font-bold border-[#E91E63] shadow-xs' },
  { key: 'dsl', label: 'DSL', colorClass: 'text-[#f97316] hover:bg-orange-50', activeClass: 'bg-[#f97316] text-white font-bold border-[#f97316] shadow-xs' },
  { key: 'jg', label: 'JG', colorClass: 'text-[#10b981] hover:bg-emerald-50', activeClass: 'bg-[#10b981] text-white font-bold border-[#10b981] shadow-xs' },
  { key: 'mid', label: 'MID', colorClass: 'text-[#a855f7] hover:bg-purple-50', activeClass: 'bg-[#a855f7] text-white font-bold border-[#a855f7] shadow-xs' },
  { key: 'adl', label: 'ADL', colorClass: 'text-[#eab308] hover:bg-amber-50', activeClass: 'bg-[#eab308] text-white font-bold border-[#eab308] shadow-xs' },
  { key: 'roam', label: 'SP', colorClass: 'text-[#0ea5e9] hover:bg-sky-50', activeClass: 'bg-[#0ea5e9] text-white font-bold border-[#0ea5e9] shadow-xs' },
];

export const DraftCenter: React.FC<DraftCenterProps> = ({
  draftActive,
  draftTurnIdx,
  draftTurnSel,
  isDraftComplete,
  currentTurnSlot,
  blueTeamName,
  redTeamName,
  searchQuery,
  setSearchQuery,
  roleFilter,
  setRoleFilter,
  timerSec,
  timerMax,
  isTimerPaused,
  toggleTimerPause,
  bannedHeroNames,
  pickedHeroNames,
  onSelectHero,
  blueScore,
  redScore,
  heroToPlayersMap = {},
  inspectedHeroName,
  onInspectHero,
  isStatsOpen,
  onToggleStats,
  onOpenCoachPanel,
  selectedTeamCategory = 'male',
  onChangeTeamCategory,
  bluePicks = [],
  redPicks = [],
  compact = false,
  isTablet,
}) => {
  const currentTurn = DRAFT_TURNS[draftTurnIdx];

  // Tablet screen detection (680px - 1180px, including iPad portrait & landscape, Galaxy tabs)
  const [internalIsTablet, setInternalIsTablet] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const w = window.innerWidth;
    const isTouch = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1;
    return (w >= 680 && w <= 1180) || (isTouch && w >= 680 && w <= 1200);
  });

  useEffect(() => {
    const checkTablet = () => {
      const w = window.innerWidth;
      const isTouch = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1;
      setInternalIsTablet((w >= 680 && w <= 1180) || (isTouch && w >= 680 && w <= 1200));
    };
    window.addEventListener('resize', checkTablet);
    return () => window.removeEventListener('resize', checkTablet);
  }, []);

  const isTabletMode = isTablet !== undefined ? isTablet : internalIsTablet;

  // Player Hero Pool Filter state (Signature / Comfortable / All in Pool / All RoV)
  const [playerPoolFilter, setPlayerPoolFilter] = useState<PlayerPoolFilter>('all');

  // Compute counts of heroes in our player pool
  const poolHeroCounts = useMemo(() => {
    let sigCount = 0;
    let comfCount = 0;
    let totalPoolCount = 0;

    HEROES.forEach((hero) => {
      const rawBadges = heroToPlayersMap[hero.name] || [];
      const badges = selectedTeamCategory && selectedTeamCategory !== 'all'
        ? rawBadges.filter((b) => (b.category || 'male') === selectedTeamCategory)
        : rawBadges;

      if (badges.length > 0) {
        totalPoolCount++;
        if (badges.some((b) => b.tier === 'signature')) sigCount++;
        if (badges.some((b) => b.tier === 'comfortable')) comfCount++;
      }
    });

    return { total: totalPoolCount, signature: sigCount, comfortable: comfCount };
  }, [heroToPlayersMap, selectedTeamCategory]);

  // Turn title & subtitle
  let turnBadgeText = 'BAN';
  let turnBadgeClass = 'bg-[#FCE4EC] border-[#F48FB1] text-[#E91E63] font-bold';
  let activeTeamTitle = '—';
  let phaseText = 'กดปุ่ม ▶ New Draft เพื่อเริ่มการดราฟ';

  if (isDraftComplete) {
    turnBadgeText = 'DONE';
    turnBadgeClass = 'bg-[#10b981] border-emerald-400 text-white font-bold shadow-xs';
    activeTeamTitle = 'DRAFT COMPLETE';
    phaseText = 'ดราฟเสร็จสิ้นเรียบร้อยแล้ว';
  } else if (draftActive && currentTurn) {
    const isBlue = currentTurn.team === 'blue';
    const isBan = currentTurn.phase === 'ban';
    turnBadgeText = isBan ? 'BAN PHASE' : 'PICK PHASE';
    turnBadgeClass = isBan
      ? 'bg-[#E11D48] border-[#E11D48] text-white font-bold shadow-xs'
      : 'bg-[#10b981] border-emerald-400 text-white font-bold shadow-xs';
    activeTeamTitle = isBlue ? blueTeamName || 'BLUE SIDE' : redTeamName || 'RED SIDE';
    phaseText = currentTurn.count > 1
      ? `${currentTurn.label} (เลือกตัวที่ ${draftTurnSel + 1}/${currentTurn.count})`
      : currentTurn.label;
  } else if (currentTurnSlot) {
    const isBlue = currentTurnSlot.team === 'blue';
    const isBan = currentTurnSlot.phase === 'ban';
    turnBadgeText = isBan ? 'MANUAL BAN' : 'MANUAL PICK';
    turnBadgeClass = 'bg-[#F59E0B] border-[#D97706] text-white font-bold shadow-xs';
    activeTeamTitle = isBlue ? blueTeamName || 'BLUE SIDE' : redTeamName || 'RED SIDE';
    phaseText = `Manual Slot ${currentTurnSlot.phase.toUpperCase()} #${currentTurnSlot.index + 1}`;
  }

  // Check if current turn is in Ban Phase
  const isBanPhase = !isDraftComplete && (
    (currentTurn?.phase === 'ban') ||
    (currentTurnSlot?.phase === 'ban')
  );
  const currentBanTeam: TeamSide = currentTurn?.team || currentTurnSlot?.team || 'blue';

  // Filtered Heroes
  const filteredHeroes = useMemo(() => {
    return HEROES.filter((hero) => {
      // 1. Role filter (DSL, JG, MAGE, SUPPORT, ADL)
      if (roleFilter !== 'all') {
        if (!hero.pos.includes(roleFilter)) return false;
      }

      // 2. Search Query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.trim().toLowerCase();
        const matchesName = hero.name.toLowerCase().includes(q);
        const matchesThai = hero.nameTh.toLowerCase().includes(q);
        const matchesTags = hero.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesThai && !matchesTags) return false;
      }

      // 3. Player Hero Pool Filter (Our Pool / Signature / Comfortable)
      if (playerPoolFilter !== 'all') {
        const rawBadges = heroToPlayersMap[hero.name] || [];
        const badges = selectedTeamCategory && selectedTeamCategory !== 'all'
          ? rawBadges.filter((b) => (b.category || 'male') === selectedTeamCategory)
          : rawBadges;

        if (badges.length === 0) return false;

        if (playerPoolFilter === 'signature') {
          if (!badges.some((b) => b.tier === 'signature')) return false;
        } else if (playerPoolFilter === 'comfortable') {
          if (!badges.some((b) => b.tier === 'comfortable')) return false;
        }
      }

      return true;
    });
  }, [roleFilter, searchQuery, playerPoolFilter, heroToPlayersMap, selectedTeamCategory]);

  // Score & Win Advantage Calculations
  const hasAnyPicks = blueScore.score > 0 || redScore.score > 0;
  const showScoreBar = draftActive || hasAnyPicks;

  let bluePercent = 50;
  let redPercent = 50;

  if (blueScore.score > 0 && redScore.score > 0) {
    const totalScore = blueScore.score + redScore.score;
    bluePercent = Math.max(15, Math.min(85, Math.round((blueScore.score / totalScore) * 100)));
    redPercent = 100 - bluePercent;
  } else if (blueScore.score > 0 && redScore.score === 0) {
    bluePercent = Math.max(52, Math.min(65, Math.round(50 + (blueScore.score - 50) * 0.4)));
    redPercent = 100 - bluePercent;
  } else if (redScore.score > 0 && blueScore.score === 0) {
    redPercent = Math.max(52, Math.min(65, Math.round(50 + (redScore.score - 50) * 0.4)));
    bluePercent = 100 - redPercent;
  }

  const percentDiff = bluePercent - redPercent;
  const advantageSide: 'blue' | 'red' | 'balanced' =
    Math.abs(percentDiff) < 2 ? 'balanced' : percentDiff > 0 ? 'blue' : 'red';

  // SVG Circular Arc
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const timerRatio = timerMax > 0 ? timerSec / timerMax : 0;
  const strokeDashoffset = circumference - timerRatio * circumference;

  const timerColor =
    timerSec <= 6
      ? '#ef4444' // red
      : timerSec <= 15
      ? '#d97706' // amber
      : '#0284c7'; // blue

  return (
    <div className="flex-1 min-w-0 w-full h-full min-h-0 flex flex-col bg-white border-2 border-[#F3D5E2] rounded-2xl shadow-md overflow-hidden ring-1 ring-[#F3D5E2]/60">
      {/* 1. TOP BAR: Search Hero & Timer */}
      <div className={`flex items-center justify-between gap-1 sm:gap-2 ${
        isTabletMode ? 'px-2 sm:px-2.5 py-1' : 'px-2.5 sm:px-3 py-1 sm:py-1.5'
      } bg-[#FFF0F5] border-b border-[#F3D5E2] flex-shrink-0`}>
        {/* Search Input */}
        <div className={`relative flex-1 ${
          isTabletMode ? 'min-w-[100px] max-w-[200px]' : 'min-w-[100px] max-w-[260px]'
        }`}>
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={isTabletMode ? 12 : 13} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหา Hero..."
            className={`w-full bg-white border border-[#F3D5E2] text-[#1F2937] placeholder-slate-400 ${
              isTabletMode ? 'text-[11px] pl-7 pr-2 py-0.5 sm:py-1' : 'text-[11px] sm:text-[11.5px] pl-7 pr-2 py-0.5 sm:py-1'
            } font-['Prompt'] rounded-lg outline-none focus:border-[#E91E63] focus:ring-1 focus:ring-[#E91E63]/30 transition-all shadow-2xs`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Turn Phase Badge */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <div className={`flex items-center gap-1.5 ${
            isTabletMode ? 'px-2 py-0.5 sm:py-1' : 'px-2.5 py-1'
          } rounded-lg bg-white border border-[#F3D5E2] shadow-2xs`}>
            <span className={`${
              isTabletMode ? 'text-[8.5px] px-1.5 py-0.2' : 'text-[9px] px-2 py-0.5'
            } font-['Orbitron'] font-black rounded ${turnBadgeClass}`}>
              {turnBadgeText}
            </span>
            <span className={`font-['Prompt'] font-bold ${
              isTabletMode ? 'text-[9.5px] max-w-[90px] sm:max-w-[120px]' : 'text-[10px] max-w-[100px] sm:max-w-[130px]'
            } text-slate-700 truncate`}>
              {activeTeamTitle}
            </span>
          </div>

          {/* Timer pill (active during draft) */}
          {draftActive && (
            <div className={`flex items-center gap-1.5 ${
              isTabletMode ? 'px-2 py-0.5 sm:py-1' : 'px-2.5 py-1'
            } bg-white rounded-lg border border-[#F3D5E2] shadow-2xs flex-shrink-0`}>
              <div className="flex flex-col items-end leading-none">
                <span className={`font-['Prompt'] ${
                  isTabletMode ? 'text-[7.5px]' : 'text-[8px]'
                } font-bold tracking-wider text-slate-400 uppercase`}>
                  {currentTurn?.phase === 'pick' ? 'PICK' : 'BAN'}
                </span>
                <span
                  className={`font-['Orbitron'] font-black ${
                    isTabletMode ? 'text-[11.5px]' : 'text-[12px] sm:text-[13px]'
                  } leading-tight`}
                  style={{ color: timerColor }}
                >
                  {timerSec}
                </span>
              </div>

              <div className={`relative ${
                isTabletMode ? 'w-[18px] h-[18px]' : 'w-[20px] h-[20px]'
              } flex items-center justify-center flex-shrink-0`}>
                <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
                  <circle
                    cx="24"
                    cy="24"
                    r={radius}
                    className="text-[#FCE4EC]"
                    strokeWidth="5"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r={radius}
                    stroke={timerColor}
                    strokeWidth="5"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-500 ease-linear"
                  />
                </svg>
                <button
                  onClick={toggleTimerPause}
                  title={isTimerPaused ? 'ดำเนินการจับเวลาต่อ' : 'หยุดเวลาชั่วคราว'}
                  className="absolute inset-0 flex items-center justify-center text-slate-700 hover:text-[#E91E63] transition-colors cursor-pointer"
                >
                  {isTimerPaused ? <Play size={isTabletMode ? 6 : 7} className="fill-current ml-0.5" /> : <Pause size={isTabletMode ? 6 : 7} />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. ROLE FILTER BUTTONS — Streamlined Segmented Control */}
      <div className={`flex items-center justify-between gap-1 ${
        isTabletMode ? 'px-2 py-1' : 'px-2 sm:px-2.5 py-1'
      } bg-[#FFF8FB] border-b border-[#F3D5E2] overflow-x-auto no-scrollbar flex-shrink-0`}>
        <div className="flex items-center gap-1 flex-nowrap flex-shrink-0">
          {ROLES.map((r) => {
            const isActive = roleFilter === r.key;
            return (
              <button
                key={r.key}
                onClick={() => setRoleFilter(r.key)}
                className={`font-['Prompt'] ${
                  isTabletMode ? 'text-[9.5px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 sm:py-1' : 'text-[9.5px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 sm:py-1'
                } font-bold tracking-wider rounded-md border transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                  isActive ? r.activeClass : `border-[#F3D5E2] bg-white ${r.colorClass}`
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 pl-1 flex-shrink-0 ml-auto">
          <span className={`${
            isTabletMode ? 'text-[8.5px] sm:text-[9px] px-1.5 py-0.5' : 'text-[8.5px] sm:text-[9.5px] px-1.5 py-0.5'
          } font-['Prompt'] font-bold text-slate-500 whitespace-nowrap rounded-md bg-white border border-[#F3D5E2] shadow-2xs flex-shrink-0`}>
            {filteredHeroes.length} HEROES
          </span>
        </div>
      </div>

      {/* 2.5 PLAYER HERO POOL FILTER BAR (Clean, Single Line, No-Wrap) */}
      <div className={`flex items-center justify-between gap-1 ${
        isTabletMode ? 'px-2 py-1' : 'px-2.5 py-1'
      } bg-[#FFF0F5]/80 border-b border-[#F3D5E2] overflow-x-auto no-scrollbar flex-shrink-0`}>
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar flex-nowrap py-0.5">
          <span className={`${
            isTabletMode ? 'text-[9px]' : 'text-[9.5px]'
          } font-['Prompt'] font-bold text-[#E91E63] uppercase whitespace-nowrap flex items-center gap-0.5 mr-0.5 flex-shrink-0`}>
            <span>👤</span>
            <span>พูล:</span>
          </span>

          {/* All RoV Heroes */}
          <button
            type="button"
            onClick={() => setPlayerPoolFilter('all')}
            className={`${
              isTabletMode ? 'px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[9.5px]' : 'px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[9.5px]'
            } rounded-md font-['Prompt'] font-bold tracking-wide transition-all cursor-pointer border whitespace-nowrap flex items-center gap-0.5 flex-shrink-0 shadow-2xs ${
              playerPoolFilter === 'all'
                ? 'bg-slate-800 border-slate-800 text-white shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>🌐 ทั้งหมด ({HEROES.length})</span>
          </button>

          {/* All Our Pool */}
          <button
            type="button"
            onClick={() => setPlayerPoolFilter('player_all')}
            className={`${
              isTabletMode ? 'px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[9.5px]' : 'px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[9.5px]'
            } rounded-md font-['Prompt'] font-bold tracking-wide transition-all cursor-pointer border whitespace-nowrap flex items-center gap-0.5 flex-shrink-0 shadow-2xs ${
              playerPoolFilter === 'player_all'
                ? 'bg-[#E91E63] border-[#E91E63] text-white shadow-xs ring-1 ring-[#E91E63]/40'
                : 'bg-white border-[#F3D5E2] text-slate-700 hover:border-[#E91E63] hover:text-[#E91E63]'
            }`}
            title="แสดงฮีโร่ทั้งหมดในพูลนักกีฬาเรา"
          >
            <span>👥 พูลเรา ({poolHeroCounts.total})</span>
          </button>

          {/* Signature Heroes (⭐) */}
          <button
            type="button"
            onClick={() => setPlayerPoolFilter('signature')}
            className={`${
              isTabletMode ? 'px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[9.5px]' : 'px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[9.5px]'
            } rounded-md font-['Prompt'] font-bold tracking-wide transition-all cursor-pointer border whitespace-nowrap flex items-center gap-0.5 flex-shrink-0 shadow-2xs ${
              playerPoolFilter === 'signature'
                ? 'bg-[#D97706] border-[#B45309] text-white shadow-xs ring-1 ring-amber-400'
                : 'bg-[#FFFBEB] border-[#FDE68A] text-[#B45309] hover:bg-[#FEF3C7]'
            }`}
            title="แสดงเฉพาะ SIGNATURE HEROES (⭐ ตัวถนัดพิเศษ 100%) ของนักกีฬาเรา"
          >
            <span>⭐ SIG ({poolHeroCounts.signature})</span>
          </button>

          {/* Comfortable Heroes (★) */}
          <button
            type="button"
            onClick={() => setPlayerPoolFilter('comfortable')}
            className={`${
              isTabletMode ? 'px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[9.5px]' : 'px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[9.5px]'
            } rounded-md font-['Prompt'] font-bold tracking-wide transition-all cursor-pointer border whitespace-nowrap flex items-center gap-0.5 flex-shrink-0 shadow-2xs ${
              playerPoolFilter === 'comfortable'
                ? 'bg-[#0284C7] border-[#0369A1] text-white shadow-xs ring-1 ring-sky-400'
                : 'bg-[#F0F9FF] border-[#BAE6FD] text-[#0369A1] hover:bg-[#E0F2FE]'
            }`}
            title="แสดงเฉพาะ COMFORTABLE HEROES (★ ตัวเล่นได้ดี) ของนักกีฬาเรา"
          >
            <span>★ COMF ({poolHeroCounts.comfortable})</span>
          </button>
        </div>

        {/* Clear Filter Button */}
        {playerPoolFilter !== 'all' && (
          <button
            type="button"
            onClick={() => setPlayerPoolFilter('all')}
            className={`font-['Prompt'] font-bold text-slate-500 hover:text-red-500 flex items-center gap-0.5 cursor-pointer ml-auto flex-shrink-0 whitespace-nowrap ${
              isTabletMode ? 'text-[9px]' : 'text-[9.5px]'
            }`}
          >
            <span>✕ ล้าง</span>
          </button>
        )}
      </div>

      {/* 4. DRAFT PROGRESS BAR (15 Segments with High Contrast) */}
      <div className={`flex gap-0.5 ${
        isTabletMode ? 'px-2 py-0.5' : 'px-2 sm:px-3 py-1'
      } bg-[#FFF8FB] border-b border-[#F3D5E2]`}>
        {DRAFT_TURNS.map((t, idx) => {
          const isDone = draftTurnIdx > idx;
          const isCur = draftTurnIdx === idx && draftActive;
          const isBan = t.phase === 'ban';
          const isBlueTeam = t.team === 'blue';

          return (
            <div
              key={`seg-${idx}`}
              title={`Turn ${idx + 1}: ${t.team === 'blue' ? 'BLUE' : 'RED'} — ${t.label}`}
              className={`${
                isTabletMode ? 'h-2' : 'h-2 sm:h-2.5'
              } rounded-xs flex-1 relative overflow-hidden transition-all duration-300 border ${
                isCur
                  ? 'bg-[#E91E63] border-[#D81B60] shadow-[0_0_10px_rgba(233,30,99,0.5)] ring-2 ring-[#E91E63]/40'
                  : isDone
                  ? isBan
                    ? 'bg-[#E11D48] border-[#E11D48]'
                    : isBlueTeam
                    ? 'bg-[#0284c7] border-[#0284c7]'
                    : 'bg-[#e11d48] border-[#e11d48]'
                  : 'bg-slate-200/90 border-slate-300'
              }`}
            >
              {isCur && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent anim-shimmer" />
              )}
            </div>
          );
        })}
      </div>

      {/* 5. HERO GRID — Strictly bounded within arena height, no overflow past Blue Pick 5 */}
      <div className={`flex-1 min-h-0 overflow-y-auto ${isTabletMode ? 'p-1.5' : 'p-2 sm:p-2.5'} custom-scrollbar bg-[#FFF8FB]/30`}>
        {filteredHeroes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 font-['Prompt'] text-sm px-4 text-center">
            <span>ไม่พบฮีโร่ที่ตรงกับเงื่อนไข</span>
            <span className="text-xs text-slate-400 mt-1 max-w-[420px]">
              {playerPoolFilter !== 'all'
                ? `ไม่พบฮีโร่ในหมวด ${
                    playerPoolFilter === 'signature'
                      ? '⭐ SIGNATURE HEROES'
                      : playerPoolFilter === 'comfortable'
                      ? '★ COMFORTABLE HEROES'
                      : 'พูลนักกีฬา'
                  } สำหรับตำแหน่งที่เลือก`
                : 'ลองเปลี่ยนคำค้นหาหรือตัวกรองตำแหน่ง'}
            </span>
            {playerPoolFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setPlayerPoolFilter('all')}
                className="mt-2.5 px-3 py-1 bg-white border border-[#E91E63] text-[#E91E63] rounded-lg text-xs font-bold hover:bg-[#FCE4EC] cursor-pointer shadow-xs transition-colors"
              >
                🌐 แสดงฮีโร่ทั้งหมดในเกม
              </button>
            )}
          </div>
        ) : (
          <div
            className={`grid ${
              isTabletMode
                ? compact
                  ? 'grid-cols-4 gap-1 sm:gap-1.5'
                  : 'grid-cols-6 gap-1 sm:gap-1.5'
                : compact
                ? 'grid-cols-[repeat(auto-fill,minmax(54px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(60px,1fr))] gap-1.5'
                : 'grid-cols-[repeat(auto-fill,minmax(56px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(64px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(68px,1fr))] gap-1.5 sm:gap-2'
            }`}
          >
            {filteredHeroes.map((hero) => {
              const isBanned = bannedHeroNames.has(hero.name);
              const isPicked = pickedHeroNames.has(hero.name);
              const isUnavailable = isBanned || isPicked;
              const isInspected = inspectedHeroName?.toLowerCase() === hero.name.toLowerCase();
              const rawBadges = heroToPlayersMap[hero.name] || [];
              const playerBadges =
                selectedTeamCategory && selectedTeamCategory !== 'all'
                  ? rawBadges.filter((b) => (b.category || 'male') === selectedTeamCategory)
                  : rawBadges;

              // Primary pos color
              const posColor =
                hero.primaryPos === 'dsl'
                  ? 'bg-[#f97316]'
                  : hero.primaryPos === 'jg'
                  ? 'bg-[#10b981]'
                  : hero.primaryPos === 'mid'
                  ? 'bg-[#a855f7]'
                  : hero.primaryPos === 'roam'
                  ? 'bg-[#0ea5e9]'
                  : 'bg-[#eab308]';

              return (
                <div
                  key={hero.id}
                  className="relative group/card flex flex-col min-w-0"
                >
                  <div
                    onClick={() => {
                      if (!isUnavailable) {
                        onSelectHero(hero);
                      }
                    }}
                    className={`w-full relative flex flex-col items-center rounded-lg sm:rounded-xl overflow-hidden border ${
                      isTabletMode ? 'p-1 border' : 'p-1.5 border-2'
                    } transition-all select-none text-left ${
                      isInspected
                        ? 'border-[#E91E63] ring-2 ring-[#E91E63] shadow-[0_0_14px_rgba(233,30,99,0.3)] bg-[#FCE4EC]/50 scale-102'
                        : isBanned
                        ? 'border-red-300 bg-red-50/50 opacity-40 cursor-not-allowed'
                        : isPicked
                        ? 'border-slate-300 bg-slate-100/60 opacity-35 cursor-not-allowed'
                        : 'border-[#E2E8F0] bg-white hover:border-[#E91E63] hover:shadow-md hover:scale-105 active:scale-95 shadow-xs cursor-pointer'
                    }`}
                  >
                    {/* Position Tag */}
                    <div className={`absolute top-0.5 left-0.5 z-10 ${
                      isTabletMode ? 'text-[8px] px-1 py-0.2' : 'text-[8.5px] px-1.5 py-0.2'
                    } font-['Barlow_Condensed'] font-black rounded bg-white/95 text-slate-800 tracking-wider border border-slate-300 uppercase shadow-2xs pointer-events-none`}>
                      {hero.primaryPos}
                    </div>

                    {/* Role Color Dot */}
                    <div className={`absolute ${
                      isTabletMode ? 'top-1 right-1 w-2 sm:w-2.5 h-2 sm:h-2.5' : 'top-2 right-2 w-2.5 h-2.5'
                    } z-10 rounded-full ${posColor} ring-1 ring-white shadow-2xs pointer-events-none`} />

                    {/* Hero Portrait */}
                    <div className={`relative w-full aspect-square rounded-md sm:rounded-lg overflow-hidden bg-slate-100 ${
                      isTabletMode ? 'mb-0.5' : 'mb-0.5 sm:mb-1'
                    } border border-slate-200`}>
                      <img
                        src={hero.avatarUrl || getHeroImageUrl(hero.name)}
                        alt={hero.name}
                        className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-300 pointer-events-none"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />

                      {/* Quick Inspect Button (Accessible size on tablets) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          if (onInspectHero) onInspectHero(hero.name);
                        }}
                        title={`ดูสถิติและคู่ต่อสู้ ${hero.name}`}
                        className={`absolute bottom-0.5 right-0.5 z-30 ${
                          isTabletMode ? 'w-3.5 h-3.5 sm:w-4 sm:h-4' : 'w-3.5 h-3.5 sm:w-4 sm:h-4'
                        } rounded bg-white/90 hover:bg-[#0284c7] text-[#0284c7] hover:text-white flex items-center justify-center border border-slate-300/80 transition-all shadow-2xs cursor-pointer active:scale-90`}
                      >
                        <BarChart2 size={isTabletMode ? 8.5 : 9} strokeWidth={2.5} />
                      </button>

                      {/* Banned Overlay */}
                      {isBanned && (
                        <div className="absolute inset-0 bg-rose-950/80 flex flex-col items-center justify-center text-white z-20 pointer-events-none">
                          <Ban size={isTabletMode ? 16 : 20} strokeWidth={2.5} className="text-rose-200" />
                          <span className={`${
                            isTabletMode ? 'text-[7.5px] sm:text-[8px]' : 'text-[7px] sm:text-[8px]'
                          } font-['Orbitron'] font-black mt-0.5 tracking-wider text-rose-100`}>BANNED</span>
                        </div>
                      )}

                      {/* Picked Overlay */}
                      {isPicked && (
                        <div className="absolute inset-0 bg-slate-900/75 flex flex-col items-center justify-center text-emerald-300 z-20 pointer-events-none">
                          <Check size={isTabletMode ? 16 : 20} strokeWidth={2.5} className="text-emerald-300" />
                          <span className={`${
                            isTabletMode ? 'text-[7.5px] sm:text-[8px]' : 'text-[7px] sm:text-[8px]'
                          } font-['Orbitron'] font-black mt-0.5 tracking-wider text-emerald-200`}>PICKED</span>
                        </div>
                      )}
                    </div>

                    {/* Hero Name */}
                    <div className={`w-full truncate text-center font-['Prompt'] font-bold ${
                      isTabletMode ? 'text-[10px] sm:text-[11px]' : 'text-[12px]'
                    } text-[#1F2937] group-hover/card:text-[#E91E63] transition-colors mt-0.5 leading-tight`}>
                      {hero.name}
                    </div>
                    <div className={`w-full truncate text-center ${
                      isTabletMode ? 'text-[8.5px] sm:text-[9px]' : 'text-[10px]'
                    } font-['Prompt'] text-slate-500 leading-tight`}>
                      {hero.nameTh}
                    </div>

                    {/* PLAYER HERO POOL BADGES (⭐ Gold / ★ Silver) */}
                    {playerBadges.length > 0 && (
                      <div className="w-full flex flex-col gap-0.5 mt-0.5 pt-0.5 border-t border-[#F3D5E2] min-w-0">
                        {playerBadges.slice(0, 2).map((b) => {
                          const isSig = b.tier === 'signature';
                          return (
                            <div
                              key={b.playerId}
                              className={`w-full flex items-center justify-between px-1 py-0.2 sm:py-0.5 rounded ${
                                isTabletMode ? 'text-[8px] sm:text-[8.5px]' : 'text-[9.5px]'
                              } font-['Prompt'] font-bold leading-tight truncate transition-colors min-w-0 ${
                                isSig
                                  ? 'bg-[#FEF3C7] border border-[#F59E0B] text-[#B45309] shadow-2xs'
                                  : 'bg-slate-100 border border-slate-300 text-slate-700'
                              }`}
                            >
                              <span className="truncate flex items-center gap-0.5 min-w-0">
                                <span className={isSig ? 'text-[#F59E0B]' : 'text-slate-400'}>
                                  {isSig ? '⭐' : '★'}
                                </span>
                                <span className="truncate">{b.playerNickname}</span>
                              </span>
                              <span className="text-[7px] sm:text-[7.5px] font-bold opacity-80 uppercase ml-0.5 flex-shrink-0">
                                {b.position}
                              </span>
                            </div>
                          );
                        })}
                        {playerBadges.length > 2 && (
                          <div className={`${
                            isTabletMode ? 'text-[7.5px] sm:text-[8px]' : 'text-[8.5px]'
                          } text-center text-slate-500 font-['Prompt'] font-bold leading-tight`}>
                            +{playerBadges.length - 2} คนในทีม
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* HOVER TOOLTIP: Shows Player Name and Proficiency Details */}
                  {playerBadges.length > 0 && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 rounded-xl bg-white/98 border border-[#F3D5E2] shadow-xl backdrop-blur-md opacity-0 pointer-events-none group-hover/card:opacity-100 transition-opacity duration-200 z-50 flex flex-col gap-1.5 text-slate-800">
                      <div className="text-[10px] font-['Prompt'] font-bold text-[#E91E63] tracking-wider pb-1 border-b border-[#F3D5E2]">
                        {hero.name} • HERO POOL
                      </div>

                      <div className="flex flex-col gap-1.5">
                        {playerBadges.map((b) => (
                          <div key={b.playerId} className="flex items-center gap-2">
                            {b.playerAvatar ? (
                              <img
                                src={b.playerAvatar}
                                alt={b.playerNickname}
                                className="w-6 h-6 rounded-full object-cover border border-slate-300 flex-shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-[#E91E63] text-[9px] font-bold text-white flex items-center justify-center flex-shrink-0">
                                {b.playerNickname.slice(0, 1).toUpperCase()}
                              </div>
                            )}
                            <div className="flex flex-col min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-['Prompt'] font-bold text-xs text-slate-800 truncate">
                                  {b.playerNickname}
                                </span>
                                <span
                                  className={`text-[9px] font-['Prompt'] font-bold px-1 rounded ${
                                    b.tier === 'signature'
                                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {b.tier === 'signature' ? '⭐ SIG' : '★ COM'}
                                </span>
                              </div>
                              <span className="text-[9.5px] font-['Prompt'] text-slate-500 truncate">
                                {b.playerName} ({b.position})
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Crisp bottom frame footer bar — clearly delimiting arena boundary level with Blue Pick 5 */}
      <div className={`${
        isTabletMode ? 'px-2.5 py-1 text-[9px] sm:text-[9.5px]' : 'px-3 py-1 text-[9.5px]'
      } bg-[#FFF0F5] border-t border-[#F3D5E2] flex items-center justify-between font-['Prompt'] text-slate-500 font-bold select-none flex-shrink-0`}>
        <span className="flex items-center gap-1 text-slate-600">
          <span>📜</span>
          <span>เลื่อนดูฮีโร่ทั้งหมด ({filteredHeroes.length} ตัว)</span>
        </span>
        <span className="text-[#E91E63] font-semibold flex items-center gap-1">
          <span>↕ เลื่อนขึ้น-ลง</span>
        </span>
      </div>
    </div>
  );
};

