import React, { useMemo } from 'react';
import { Hero, PositionKey, TeamSide, SlotType } from '../types/draft';
import { HeroPlayerBadge } from '../types/player';
import { DRAFT_TURNS } from '../data/draftSteps';
import { HEROES } from '../data/heroes';
import { DraftScoreResult } from '../data/metaData';
import { Search, Pause, Play, Ban, Check } from 'lucide-react';

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
}

const ROLES: { key: PositionKey; label: string; colorClass: string; activeClass: string }[] = [
  { key: 'all', label: 'ALL', colorClass: 'hover:text-white', activeClass: 'bg-white/20 text-white border-white/40' },
  { key: 'dsl', label: 'DSL', colorClass: 'text-[#c47842]', activeClass: 'bg-[#c47842]/25 text-[#f49862] border-[#c47842]' },
  { key: 'jg', label: 'JUNGLE', colorClass: 'text-[#5a8a6a]', activeClass: 'bg-[#5a8a6a]/25 text-[#8ac49a] border-[#5a8a6a]' },
  { key: 'mid', label: 'MAGE', colorClass: 'text-[#9b6da8]', activeClass: 'bg-[#9b6da8]/25 text-[#cb9dd8] border-[#9b6da8]' },
  { key: 'roam', label: 'SUPPORT', colorClass: 'text-[#6b8fb8]', activeClass: 'bg-[#6b8fb8]/25 text-[#9bbfe8] border-[#6b8fb8]' },
  { key: 'adl', label: 'ADL', colorClass: 'text-[#d4a857]', activeClass: 'bg-[#d4a857]/25 text-[#f6ca77] border-[#d4a857]' },
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
}) => {
  const currentTurn = DRAFT_TURNS[draftTurnIdx];

  // Turn title & subtitle
  let turnBadgeText = 'BAN';
  let turnBadgeClass = 'bg-[#a82844]/20 border-[#a82844] text-red-300';
  let activeTeamTitle = '—';
  let phaseText = 'กดปุ่ม ▶ New Draft เพื่อเริ่มการดราฟ';

  if (isDraftComplete) {
    turnBadgeText = 'DONE';
    turnBadgeClass = 'bg-emerald-500/20 border-emerald-500 text-emerald-300';
    activeTeamTitle = 'DRAFT COMPLETE';
    phaseText = 'ดราฟเสร็จสิ้นเรียบร้อย';
  } else if (draftActive && currentTurn) {
    const isBlue = currentTurn.team === 'blue';
    const isBan = currentTurn.phase === 'ban';
    turnBadgeText = isBan ? 'BAN' : 'PICK';
    turnBadgeClass = isBan
      ? 'bg-[#a82844]/25 border-[#a82844] text-[#ff7b95] shadow-[0_0_10px_rgba(168,40,68,0.3)]'
      : 'bg-emerald-500/25 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]';
    activeTeamTitle = isBlue ? blueTeamName || 'BLUE SIDE' : redTeamName || 'RED SIDE';
    phaseText = currentTurn.label;
  } else if (currentTurnSlot) {
    const isBlue = currentTurnSlot.team === 'blue';
    const isBan = currentTurnSlot.phase === 'ban';
    turnBadgeText = isBan ? 'MANUAL BAN' : 'MANUAL PICK';
    turnBadgeClass = 'bg-amber-500/25 border-amber-500 text-amber-300';
    activeTeamTitle = isBlue ? blueTeamName || 'BLUE SIDE' : redTeamName || 'RED SIDE';
    phaseText = `Manual Slot ${currentTurnSlot.phase.toUpperCase()} #${currentTurnSlot.index + 1}`;
  }

  // Filtered Heroes
  const filteredHeroes = useMemo(() => {
    return HEROES.filter((hero) => {
      // Role filter
      if (roleFilter !== 'all') {
        if (!hero.pos.includes(roleFilter)) return false;
      }

      // Search Query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.trim().toLowerCase();
        const matchesName = hero.name.toLowerCase().includes(q);
        const matchesThai = hero.nameTh.toLowerCase().includes(q);
        const matchesTags = hero.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesThai && !matchesTags) return false;
      }

      return true;
    });
  }, [roleFilter, searchQuery]);

  // Score Calculations
  const showScoreBar = blueScore.score > 0 || redScore.score > 0;
  const totalScore = (blueScore.score + redScore.score) || 100;
  const bluePercent = Math.max(10, Math.min(90, Math.round((blueScore.score / totalScore) * 100)));
  const redPercent = 100 - bluePercent;
  const scoreDiff = blueScore.score - redScore.score;

  // SVG Circular Arc
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const timerRatio = timerMax > 0 ? timerSec / timerMax : 0;
  const strokeDashoffset = circumference - timerRatio * circumference;

  const timerColor =
    timerSec <= 6
      ? '#ef4444' // red
      : timerSec <= 15
      ? '#d4a857' // gold
      : '#38bdf8'; // sky

  return (
    <div className="flex-1 flex flex-col bg-[rgba(20,20,26,0.7)] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-lg backdrop-blur-md overflow-hidden min-w-0">
      {/* 1. TOP DRAFT STATUS BAR */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-black/40 border-b border-white/10 flex-wrap">
        {/* Left: Turn Badge & Team Details */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`font-['Orbitron'] font-black text-[10px] tracking-[2px] px-2.5 py-1 rounded border uppercase transition-all ${turnBadgeClass}`}
          >
            {turnBadgeText}
          </div>
          <div className="flex flex-col min-w-0">
            <span
              className={`font-['Barlow_Condensed'] font-extrabold text-[15px] tracking-wider truncate leading-tight ${
                currentTurn?.team === 'blue'
                  ? 'text-sky-400'
                  : currentTurn?.team === 'red'
                  ? 'text-red-400'
                  : 'text-white'
              }`}
            >
              {activeTeamTitle}
            </span>
            <span className="text-[10.5px] font-['Barlow_Condensed'] text-[#a0a0a8] tracking-wider truncate">
              {phaseText}
            </span>
          </div>
        </div>

        {/* Center: Search input */}
        <div className="relative flex-1 max-w-[200px] min-w-[140px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" size={13} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 ค้นหา Hero…"
            className="w-full bg-[rgba(20,20,26,0.8)] border border-white/10 text-white placeholder-white/40 text-[12px] font-['Kanit'] pl-8 pr-2.5 py-1 rounded-md outline-none focus:border-[#a82844] focus:ring-1 focus:ring-[#a82844]/40 transition-all"
          />
        </div>

        {/* Right: Timer ring */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end mr-1">
            <span className="font-['Barlow_Condensed'] text-[9px] font-bold tracking-[1.5px] text-[#a0a0a8] uppercase">
              {currentTurn?.phase === 'pick' ? 'PICK TIMER' : 'BAN TIMER'}
            </span>
            <span
              className="font-['Orbitron'] font-extrabold text-[17px] leading-tight"
              style={{ color: timerColor }}
            >
              {draftActive ? timerSec : '—'}
            </span>
          </div>

          <div className="relative w-[34px] h-[34px] flex items-center justify-center flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
              <circle
                cx="24"
                cy="24"
                r={radius}
                className="text-white/10"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="24"
                cy="24"
                r={radius}
                stroke={timerColor}
                strokeWidth="3.5"
                strokeDasharray={circumference}
                strokeDashoffset={draftActive ? strokeDashoffset : 0}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-500 ease-linear"
              />
            </svg>
            <button
              onClick={toggleTimerPause}
              disabled={!draftActive}
              title={isTimerPaused ? 'ดำเนินการจับเวลาต่อ' : 'หยุดเวลาชั่วคราว'}
              className="absolute inset-0 flex items-center justify-center text-white/60 hover:text-white disabled:opacity-40"
            >
              {isTimerPaused ? <Play size={10} className="fill-current ml-0.5" /> : <Pause size={10} />}
            </button>
          </div>
        </div>
      </div>

      {/* 2. ROLE FILTER BUTTONS */}
      <div className="flex items-center gap-1 px-3 py-1.5 bg-black/25 border-b border-white/5 overflow-x-auto no-scrollbar">
        {ROLES.map((r) => {
          const isActive = roleFilter === r.key;
          return (
            <button
              key={r.key}
              onClick={() => setRoleFilter(r.key)}
              className={`font-['Barlow_Condensed'] text-[11px] font-extrabold tracking-[1px] px-2.5 py-0.5 rounded border transition-all cursor-pointer whitespace-nowrap ${
                isActive ? r.activeClass : `border-white/10 bg-white/[0.03] ${r.colorClass}`
              }`}
            >
              {r.label}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-1.5 pl-2">
          {onOpenCoachPanel && (
            <button
              onClick={onOpenCoachPanel}
              title="เปิด Coach Analysis Panel (Player Fit, Matchup, Team Comp, Warnings, Suggested Picks)"
              className="font-['Barlow_Condensed'] text-[10.5px] font-black tracking-wider px-2 py-0.5 rounded border border-[#d4a857]/50 bg-[#d4a857]/15 hover:bg-[#d4a857]/30 text-[#d4a857] hover:text-[#ffdd80] transition-all flex items-center gap-1 cursor-pointer shadow-sm"
            >
              <span>🎯</span>
              <span>COACH PANEL</span>
            </button>
          )}
          {onToggleStats && (
            <button
              onClick={onToggleStats}
              title="เปิด/ปิด Side Panel สถิติ Hero และ Matchup"
              className={`font-['Barlow_Condensed'] text-[10.5px] font-bold tracking-wider px-2 py-0.5 rounded border transition-all flex items-center gap-1 cursor-pointer ${
                isStatsOpen
                  ? 'bg-[#a82844] border-[#ff7b95] text-white shadow-[0_0_10px_rgba(168,40,68,0.5)]'
                  : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>📊</span>
              <span className="hidden sm:inline">RPL STATS</span>
              <span className="sm:hidden">STATS</span>
            </button>
          )}
          <span className="text-[10px] font-['Barlow_Condensed'] font-semibold text-[#6a6a72] whitespace-nowrap">
            {filteredHeroes.length} HEROES
          </span>
        </div>
      </div>

      {/* 3. DRAFT SCORE BAR (Live Synergy & Advantage) */}
      {showScoreBar && (
        <div className="px-3.5 py-2 bg-black/50 border-b border-white/10 flex flex-col gap-1.5 transition-all">
          <div className="flex items-center justify-between gap-2 text-[11px]">
            {/* Blue Side */}
            <div className="flex items-center gap-2 flex-1">
              <span className="font-['Barlow_Condensed'] font-bold text-sky-300 tracking-wider">
                🔵 {blueTeamName || 'BLUE'}
              </span>
              <div className="flex-1 h-2 bg-white/5 border border-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-600 to-[#6b8fb8] rounded-full transition-all duration-500"
                  style={{ width: `${bluePercent}%` }}
                />
              </div>
              <span className="font-['Orbitron'] font-bold text-sky-400 text-xs min-w-[36px]">
                {blueScore.score.toFixed(1)}
              </span>
            </div>

            {/* Advantage center */}
            <div className="px-2 py-0.5 bg-white/5 rounded border border-white/10 text-center min-w-[85px]">
              <div className="text-[8px] font-['Orbitron'] font-bold text-[#a0a0a8] tracking-widest">
                DRAFT SCORE
              </div>
              <div
                className={`font-['Barlow_Condensed'] font-bold text-[12px] leading-tight ${
                  Math.abs(scoreDiff) < 2
                    ? 'text-white/60'
                    : scoreDiff > 0
                    ? 'text-sky-400'
                    : 'text-red-400'
                }`}
              >
                {Math.abs(scoreDiff) < 2
                  ? '≈ สมดุล'
                  : scoreDiff > 0
                  ? `🔵 +${scoreDiff.toFixed(1)}`
                  : `🔴 +${Math.abs(scoreDiff).toFixed(1)}`}
              </div>
            </div>

            {/* Red Side */}
            <div className="flex items-center gap-2 flex-1 justify-end flex-row-reverse">
              <span className="font-['Barlow_Condensed'] font-bold text-red-300 tracking-wider">
                🔴 {redTeamName || 'RED'}
              </span>
              <div className="flex-1 h-2 bg-white/5 border border-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-l from-red-600 to-[#a82844] rounded-full transition-all duration-500"
                  style={{ width: `${redPercent}%` }}
                />
              </div>
              <span className="font-['Orbitron'] font-bold text-red-400 text-xs min-w-[36px] text-right">
                {redScore.score.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Synergy & Counter Alerts */}
          {(blueScore.synPairs.length > 0 ||
            redScore.synPairs.length > 0 ||
            blueScore.ctrAlerts.length > 0 ||
            redScore.ctrAlerts.length > 0) && (
            <div className="flex items-center gap-2 text-[10px] font-['Barlow_Condensed'] font-semibold text-[#a0a0a8] overflow-x-auto no-scrollbar">
              {[...blueScore.synPairs, ...redScore.synPairs].slice(0, 2).map((s, idx) => (
                <span
                  key={`syn-${idx}`}
                  className="px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 whitespace-nowrap"
                >
                  ⚡ {s.pair} {s.wr}%
                </span>
              ))}
              {[...blueScore.ctrAlerts, ...redScore.ctrAlerts].slice(0, 2).map((c, idx) => (
                <span
                  key={`ctr-${idx}`}
                  className="px-1.5 py-0.5 rounded bg-red-950/60 border border-red-500/40 text-red-300 whitespace-nowrap"
                >
                  ⚔ {c.attacker} → {c.victim} ({c.victimWr}%)
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. DRAFT PROGRESS BAR (15 Segments) */}
      <div className="flex gap-1 px-3.5 py-1.5 bg-black/40 border-b border-white/10">
        {DRAFT_TURNS.map((t, idx) => {
          const isDone = draftTurnIdx > idx;
          const isCur = draftTurnIdx === idx && draftActive;
          const isBan = t.phase === 'ban';

          return (
            <div
              key={`seg-${idx}`}
              title={`${t.team.toUpperCase()} ${t.label}`}
              className={`h-1.5 rounded-sm flex-1 relative overflow-hidden transition-all duration-300 ${
                isCur
                  ? 'bg-[#d4a857] shadow-[0_0_8px_rgba(212,168,87,0.8)]'
                  : isDone
                  ? isBan
                    ? 'bg-red-500/50'
                    : 'bg-emerald-400/50'
                  : 'bg-white/10'
              }`}
            >
              {isCur && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent anim-shimmer" />
              )}
            </div>
          );
        })}
      </div>

      {/* 5. HERO GRID */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar min-h-[320px] max-h-[580px]">
        {filteredHeroes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-[#a0a0a8] font-['Kanit'] text-sm">
            <span>ไม่พบฮีโร่ที่ค้นหา</span>
            <span className="text-xs text-[#6a6a72] mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรองตำแหน่ง</span>
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2">
            {filteredHeroes.map((hero) => {
              const isBanned = bannedHeroNames.has(hero.name);
              const isPicked = pickedHeroNames.has(hero.name);
              const isUnavailable = isBanned || isPicked;
              const isInspected = inspectedHeroName?.toLowerCase() === hero.name.toLowerCase();
              const playerBadges = heroToPlayersMap[hero.name] || [];

              // Primary pos color
              const posColor =
                hero.primaryPos === 'dsl'
                  ? 'bg-[#c47842]'
                  : hero.primaryPos === 'jg'
                  ? 'bg-[#5a8a6a]'
                  : hero.primaryPos === 'mid'
                  ? 'bg-[#9b6da8]'
                  : hero.primaryPos === 'roam'
                  ? 'bg-[#6b8fb8]'
                  : 'bg-[#d4a857]';

              return (
                <div
                  key={hero.id}
                  className="relative group/card flex flex-col"
                >
                  <button
                    type="button"
                    disabled={isUnavailable}
                    onClick={() => {
                      if (onInspectHero) onInspectHero(hero.name);
                      onSelectHero(hero);
                    }}
                    className={`w-full relative flex flex-col items-center rounded-lg overflow-hidden border p-1 transition-all cursor-pointer select-none text-left ${
                      isInspected
                        ? 'border-[#ff7b95] ring-2 ring-[#a82844] shadow-[0_0_14px_rgba(168,40,68,0.7)] bg-[#a82844]/15'
                        : isBanned
                        ? 'border-red-500/40 bg-red-950/20 opacity-40 cursor-not-allowed'
                        : isPicked
                        ? 'border-white/10 bg-black/60 opacity-30 cursor-not-allowed'
                        : 'border-white/10 bg-white/[0.03] hover:border-[#a82844] hover:bg-white/[0.08] hover:scale-105 active:scale-95 shadow-sm'
                    }`}
                  >
                    {/* Position Tag */}
                    <div className="absolute top-1 left-1 z-10 text-[8px] font-['Barlow_Condensed'] font-black px-1 rounded bg-black/80 text-white tracking-wider border border-white/10 uppercase">
                      {hero.primaryPos}
                    </div>

                    {/* Role Color Dot */}
                    <div className={`absolute top-1.5 right-1.5 z-10 w-2 h-2 rounded-full ${posColor}`} />

                    {/* Hero Portrait */}
                    <div className="relative w-full aspect-square rounded-md overflow-hidden bg-black/50 mb-1">
                      <img
                        src={hero.avatarUrl}
                        alt={hero.name}
                        className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />

                      {/* Quick Inspect Button (Accessible even when banned/picked) */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onInspectHero) onInspectHero(hero.name);
                        }}
                        title={`ดูสถิติและคู่ต่อสู้ ${hero.name}`}
                        className="absolute bottom-1 right-1 z-30 w-5 h-5 rounded bg-black/85 hover:bg-[#a82844] text-white/80 hover:text-white flex items-center justify-center text-[10px] border border-white/20 transition-all opacity-0 group-hover/card:opacity-100 shadow-md cursor-pointer"
                      >
                        📊
                      </div>

                      {/* Banned Overlay */}
                      {isBanned && (
                        <div className="absolute inset-0 bg-red-950/80 flex flex-col items-center justify-center text-red-400 z-20">
                          <Ban size={18} strokeWidth={2.5} />
                          <span className="text-[7.5px] font-['Orbitron'] font-bold mt-0.5">BANNED</span>
                        </div>
                      )}

                      {/* Picked Overlay */}
                      {isPicked && (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-emerald-400 z-20">
                          <Check size={18} strokeWidth={2.5} />
                          <span className="text-[7.5px] font-['Orbitron'] font-bold mt-0.5">PICKED</span>
                        </div>
                      )}
                    </div>

                    {/* Hero Name */}
                    <div className="w-full truncate text-center font-['Barlow_Condensed'] font-bold text-[11.5px] text-white/90 group-hover/card:text-white">
                      {hero.name}
                    </div>
                    <div className="w-full truncate text-center text-[9px] font-['Kanit'] text-[#a0a0a8]">
                      {hero.nameTh}
                    </div>

                    {/* PLAYER HERO POOL BADGES (⭐ Gold / ★ Silver) */}
                    {playerBadges.length > 0 && (
                      <div className="w-full flex flex-col gap-0.5 mt-1 pt-1 border-t border-white/5">
                        {playerBadges.slice(0, 2).map((b) => {
                          const isSig = b.tier === 'signature';
                          return (
                            <div
                              key={b.playerId}
                              className={`w-full flex items-center justify-between px-1 py-0.5 rounded text-[9px] font-['Barlow_Condensed'] font-black leading-tight truncate transition-colors ${
                                isSig
                                  ? 'bg-[#d4a857]/20 border border-[#d4a857]/60 text-[#ffd67a] shadow-[0_0_6px_rgba(212,168,87,0.25)]'
                                  : 'bg-white/10 border border-slate-400/40 text-slate-200'
                              }`}
                            >
                              <span className="truncate flex items-center gap-0.5">
                                <span className={isSig ? 'text-[#ffd67a]' : 'text-slate-300'}>
                                  {isSig ? '⭐' : '★'}
                                </span>
                                <span className="truncate">{b.playerNickname}</span>
                              </span>
                              <span className="text-[7.5px] font-bold opacity-75 uppercase ml-0.5">
                                {b.position}
                              </span>
                            </div>
                          );
                        })}
                        {playerBadges.length > 2 && (
                          <div className="text-[8px] text-center text-[#d4a857] font-['Kanit'] leading-tight">
                            +{playerBadges.length - 2} คน
                          </div>
                        )}
                      </div>
                    )}
                  </button>

                  {/* HOVER TOOLTIP: Shows Player Name and Proficiency Details */}
                  {playerBadges.length > 0 && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 rounded-xl bg-[#0e0e14]/95 border border-[#a82844]/60 shadow-[0_8px_30px_rgba(0,0,0,0.9)] backdrop-blur-md opacity-0 pointer-events-none group-hover/card:opacity-100 transition-opacity duration-200 z-50 flex flex-col gap-1.5">
                      <div className="text-[10px] font-['Orbitron'] font-bold text-white/60 tracking-wider pb-1 border-b border-white/10">
                        {hero.name} • HERO POOL
                      </div>

                      <div className="flex flex-col gap-1.5">
                        {playerBadges.map((b) => (
                          <div key={b.playerId} className="flex items-center gap-2">
                            <img
                              src={b.playerAvatar}
                              alt={b.playerNickname}
                              className="w-6 h-6 rounded-full object-cover border border-white/20 flex-shrink-0"
                            />
                            <div className="flex flex-col min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-['Orbitron'] font-bold text-xs text-white truncate">
                                  {b.playerNickname}
                                </span>
                                <span
                                  className={`text-[9px] font-['Barlow_Condensed'] font-black px-1 rounded ${
                                    b.tier === 'signature'
                                      ? 'bg-[#d4a857]/20 text-[#ffd67a]'
                                      : 'bg-white/10 text-slate-200'
                                  }`}
                                >
                                  {b.tier === 'signature' ? '⭐ SIGNATURE' : '★ COMFORT'}
                                </span>
                              </div>
                              <span className="text-[9.5px] font-['Kanit'] text-[#a0a0a8] truncate">
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
    </div>
  );
};
