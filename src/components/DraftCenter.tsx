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
  { key: 'all', label: 'ALL', colorClass: 'hover:text-white', activeClass: 'bg-white text-black font-black border-white shadow-md' },
  { key: 'dsl', label: 'DSL', colorClass: 'text-[#f97316] hover:bg-[#f97316]/10', activeClass: 'bg-[#f97316] text-black font-black border-[#f97316] shadow-[0_0_12px_rgba(249,115,22,0.5)]' },
  { key: 'jg', label: 'JUNGLE', colorClass: 'text-[#10b981] hover:bg-[#10b981]/10', activeClass: 'bg-[#10b981] text-black font-black border-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.5)]' },
  { key: 'mid', label: 'MAGE', colorClass: 'text-[#a855f7] hover:bg-[#a855f7]/10', activeClass: 'bg-[#a855f7] text-white font-black border-[#a855f7] shadow-[0_0_12px_rgba(168,85,247,0.5)]' },
  { key: 'roam', label: 'SUPPORT', colorClass: 'text-[#0ea5e9] hover:bg-[#0ea5e9]/10', activeClass: 'bg-[#0ea5e9] text-black font-black border-[#0ea5e9] shadow-[0_0_12px_rgba(14,165,233,0.5)]' },
  { key: 'adl', label: 'ADL', colorClass: 'text-[#eab308] hover:bg-[#eab308]/10', activeClass: 'bg-[#eab308] text-black font-black border-[#eab308] shadow-[0_0_12px_rgba(234,179,8,0.5)]' },
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
    turnBadgeClass = 'bg-[#10b981] border-emerald-300 text-black font-black shadow-[0_0_14px_rgba(16,185,129,0.5)]';
    activeTeamTitle = 'DRAFT COMPLETE';
    phaseText = 'ดราฟเสร็จสิ้นเรียบร้อยแล้ว';
  } else if (draftActive && currentTurn) {
    const isBlue = currentTurn.team === 'blue';
    const isBan = currentTurn.phase === 'ban';
    turnBadgeText = isBan ? 'BAN PHASE' : 'PICK PHASE';
    turnBadgeClass = isBan
      ? 'bg-[#e11d48] border-[#f43f5e] text-white shadow-[0_0_14px_rgba(244,63,94,0.6)] font-black'
      : 'bg-[#10b981] border-emerald-400 text-white shadow-[0_0_14px_rgba(16,185,129,0.6)] font-black';
    activeTeamTitle = isBlue ? blueTeamName || 'BLUE SIDE' : redTeamName || 'RED SIDE';
    phaseText = currentTurn.label;
  } else if (currentTurnSlot) {
    const isBlue = currentTurnSlot.team === 'blue';
    const isBan = currentTurnSlot.phase === 'ban';
    turnBadgeText = isBan ? 'MANUAL BAN' : 'MANUAL PICK';
    turnBadgeClass = 'bg-[#fbbf24] border-[#fde047] text-black shadow-[0_0_14px_rgba(251,191,36,0.6)] font-black';
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
    <div className="flex-1 flex flex-col bg-[#0b0d14]/95 border-2 border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden min-w-0">
      {/* 1. TOP DRAFT STATUS BAR */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[#07090f] border-b-2 border-slate-700/80 flex-wrap">
        {/* Left: Turn Badge & Team Details */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`font-['Orbitron'] font-black text-[10.5px] tracking-[2px] px-3 py-1.5 rounded-lg border uppercase transition-all shadow-md ${turnBadgeClass}`}
          >
            {turnBadgeText}
          </div>
          <div className="flex flex-col min-w-0">
            <span
              className={`font-['Barlow_Condensed'] font-black text-[16px] tracking-wider truncate leading-tight ${
                currentTurn?.team === 'blue'
                  ? 'text-[#38bdf8] drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]'
                  : currentTurn?.team === 'red'
                  ? 'text-[#f43f5e] drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                  : 'text-white'
              }`}
            >
              {activeTeamTitle}
            </span>
            <span className="text-[11px] font-['Barlow_Condensed'] font-semibold text-slate-300 tracking-wider truncate">
              {phaseText}
            </span>
          </div>
        </div>

        {/* Center: Search input */}
        <div className="relative flex-1 max-w-[220px] min-w-[150px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 ค้นหา Hero…"
            className="w-full bg-black/60 border border-slate-600 text-white placeholder-slate-400 text-[12px] font-['Mitr'] pl-8 pr-2.5 py-1.5 rounded-lg outline-none focus:border-[#fbbf24] focus:ring-1 focus:ring-[#fbbf24]/50 transition-all shadow-inner"
          />
        </div>

        {/* Right: Timer ring */}
        <div className="flex items-center gap-2.5 bg-black/50 px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-inner">
          <div className="flex flex-col items-end mr-1">
            <span className="font-['Barlow_Condensed'] text-[9.5px] font-black tracking-[1.5px] text-slate-300 uppercase">
              {currentTurn?.phase === 'pick' ? 'PICK TIMER' : 'BAN TIMER'}
            </span>
            <span
              className="font-['Orbitron'] font-black text-[18px] leading-tight drop-shadow-sm"
              style={{ color: timerColor }}
            >
              {draftActive ? timerSec : '—'}
            </span>
          </div>

          <div className="relative w-[36px] h-[36px] flex items-center justify-center flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
              <circle
                cx="24"
                cy="24"
                r={radius}
                className="text-slate-800"
                strokeWidth="4"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="24"
                cy="24"
                r={radius}
                stroke={timerColor}
                strokeWidth="4"
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
              className="absolute inset-0 flex items-center justify-center text-white hover:text-[#fbbf24] disabled:opacity-40 transition-colors cursor-pointer"
            >
              {isTimerPaused ? <Play size={11} className="fill-current ml-0.5" /> : <Pause size={11} />}
            </button>
          </div>
        </div>
      </div>

      {/* 2. ROLE FILTER BUTTONS — Distinct segmented control */}
      <div className="flex items-center gap-1.5 px-4 py-2 bg-[#090b12] border-b border-slate-700/80 overflow-x-auto no-scrollbar">
        {ROLES.map((r) => {
          const isActive = roleFilter === r.key;
          return (
            <button
              key={r.key}
              onClick={() => setRoleFilter(r.key)}
              className={`font-['Barlow_Condensed'] text-[11.5px] font-black tracking-[1px] px-3 py-1 rounded-lg border transition-all cursor-pointer whitespace-nowrap shadow-sm ${
                isActive ? r.activeClass : `border-slate-800 bg-black/40 ${r.colorClass}`
              }`}
            >
              {r.label}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-2 pl-2">
          {onOpenCoachPanel && (
            <button
              onClick={onOpenCoachPanel}
              title="เปิด Coach Analysis Panel"
              className="font-['Barlow_Condensed'] text-[11px] font-black tracking-wider px-2.5 py-1 rounded-lg border border-[#fbbf24] bg-[#fbbf24]/15 hover:bg-[#fbbf24]/30 text-[#fbbf24] hover:text-[#fde047] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span>🎯</span>
              <span>COACH PANEL</span>
            </button>
          )}
          {onToggleStats && (
            <button
              onClick={onToggleStats}
              title="เปิด/ปิด Side Panel สถิติ Hero และ Matchup"
              className={`font-['Barlow_Condensed'] text-[11px] font-black tracking-wider px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 cursor-pointer shadow-sm ${
                isStatsOpen
                  ? 'bg-[#e11d48] border-[#f43f5e] text-white shadow-[0_0_12px_rgba(244,63,94,0.5)]'
                  : 'bg-black/60 border-slate-700 text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>📊</span>
              <span className="hidden sm:inline">RPL STATS</span>
              <span className="sm:hidden">STATS</span>
            </button>
          )}
          <span className="text-[11px] font-['Barlow_Condensed'] font-black text-slate-400 whitespace-nowrap px-2 py-0.5 rounded bg-black/40 border border-slate-800">
            {filteredHeroes.length} HEROES
          </span>
        </div>
      </div>

      {/* 3. DRAFT SCORE BAR (Live Synergy & Advantage with High Contrast) */}
      {showScoreBar && (
        <div className="px-4 py-2.5 bg-[#070910] border-b-2 border-slate-700/80 flex flex-col gap-2 transition-all">
          <div className="flex items-center justify-between gap-3 text-[12px]">
            {/* Blue Side */}
            <div className="flex items-center gap-2.5 flex-1">
              <span className="font-['Barlow_Condensed'] font-black text-[#38bdf8] tracking-wider text-[13px]">
                🔵 {blueTeamName || 'BLUE SIDE'}
              </span>
              <div className="flex-1 h-2.5 bg-black/80 border border-slate-700 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-[#0284c7] to-[#38bdf8] rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                  style={{ width: `${bluePercent}%` }}
                />
              </div>
              <span className="font-['Orbitron'] font-black text-[#38bdf8] text-xs min-w-[36px]">
                {blueScore.score.toFixed(1)}
              </span>
            </div>

            {/* Advantage center */}
            <div className="px-3 py-1 bg-black/80 rounded-lg border border-slate-700 text-center min-w-[95px] shadow-sm">
              <div className="text-[8.5px] font-['Orbitron'] font-black text-slate-400 tracking-widest">
                DRAFT SCORE
              </div>
              <div
                className={`font-['Barlow_Condensed'] font-black text-[13px] leading-tight ${
                  Math.abs(scoreDiff) < 2
                    ? 'text-slate-300'
                    : scoreDiff > 0
                    ? 'text-[#38bdf8]'
                    : 'text-[#f43f5e]'
                }`}
              >
                {Math.abs(scoreDiff) < 2
                  ? '≈ สมดุล (BALANCED)'
                  : scoreDiff > 0
                  ? `🔵 +${scoreDiff.toFixed(1)} ADV`
                  : `🔴 +${Math.abs(scoreDiff).toFixed(1)} ADV`}
              </div>
            </div>

            {/* Red Side */}
            <div className="flex items-center gap-2.5 flex-1 justify-end flex-row-reverse">
              <span className="font-['Barlow_Condensed'] font-black text-[#f43f5e] tracking-wider text-[13px]">
                🔴 {redTeamName || 'RED SIDE'}
              </span>
              <div className="flex-1 h-2.5 bg-black/80 border border-slate-700 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-l from-[#e11d48] to-[#f43f5e] rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                  style={{ width: `${redPercent}%` }}
                />
              </div>
              <span className="font-['Orbitron'] font-black text-[#f43f5e] text-xs min-w-[36px] text-right">
                {redScore.score.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Synergy & Counter Alerts */}
          {(blueScore.synPairs.length > 0 ||
            redScore.synPairs.length > 0 ||
            blueScore.ctrAlerts.length > 0 ||
            redScore.ctrAlerts.length > 0) && (
            <div className="flex items-center gap-2 text-[10.5px] font-['Barlow_Condensed'] font-bold text-slate-300 overflow-x-auto no-scrollbar">
              {[...blueScore.synPairs, ...redScore.synPairs].slice(0, 3).map((s, idx) => (
                <span
                  key={`syn-${idx}`}
                  className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 whitespace-nowrap shadow-sm"
                >
                  ⚡ Synergy: {s.pair} ({s.wr}% WR)
                </span>
              ))}
              {[...blueScore.ctrAlerts, ...redScore.ctrAlerts].slice(0, 3).map((c, idx) => (
                <span
                  key={`ctr-${idx}`}
                  className="px-2 py-0.5 rounded-md bg-rose-950/80 border border-rose-500/60 text-rose-300 whitespace-nowrap shadow-sm"
                >
                  ⚔ Counter: {c.attacker} → {c.victim} ({c.victimWr}%)
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. DRAFT PROGRESS BAR (15 Segments with High Contrast) */}
      <div className="flex gap-1.5 px-4 py-2 bg-[#090b12] border-b border-slate-700/80">
        {DRAFT_TURNS.map((t, idx) => {
          const isDone = draftTurnIdx > idx;
          const isCur = draftTurnIdx === idx && draftActive;
          const isBan = t.phase === 'ban';

          return (
            <div
              key={`seg-${idx}`}
              title={`${t.team.toUpperCase()} ${t.label}`}
              className={`h-2 rounded-sm flex-1 relative overflow-hidden transition-all duration-300 border ${
                isCur
                  ? 'bg-[#fbbf24] border-[#fde047] shadow-[0_0_12px_rgba(251,191,36,0.9)] ring-1 ring-[#fbbf24]'
                  : isDone
                  ? isBan
                    ? 'bg-[#e11d48] border-[#f43f5e]'
                    : 'bg-[#10b981] border-emerald-400'
                  : 'bg-black/60 border-slate-800'
              }`}
            >
              {isCur && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent anim-shimmer" />
              )}
            </div>
          );
        })}
      </div>

      {/* 5. HERO GRID */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar min-h-[320px] max-h-[580px]">
        {filteredHeroes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-[#a0a0a8] font-['Mitr'] text-sm">
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
                  className="relative group/card flex flex-col"
                >
                  <button
                    type="button"
                    disabled={isUnavailable}
                    onClick={() => {
                      if (onInspectHero) onInspectHero(hero.name);
                      onSelectHero(hero);
                    }}
                    className={`w-full relative flex flex-col items-center rounded-xl overflow-hidden border-2 p-1.5 transition-all cursor-pointer select-none text-left ${
                      isInspected
                        ? 'border-[#fbbf24] ring-2 ring-[#fbbf24] shadow-[0_0_18px_rgba(251,191,36,0.6)] bg-amber-950/30'
                        : isBanned
                        ? 'border-red-600/50 bg-red-950/30 opacity-40 cursor-not-allowed'
                        : isPicked
                        ? 'border-slate-800 bg-black/80 opacity-30 cursor-not-allowed'
                        : 'border-slate-800/90 bg-[#111422] hover:border-[#fbbf24] hover:bg-[#181d30] hover:scale-105 active:scale-95 shadow-md'
                    }`}
                  >
                    {/* Position Tag */}
                    <div className="absolute top-1.5 left-1.5 z-10 text-[8.5px] font-['Barlow_Condensed'] font-black px-1.5 py-0.2 rounded bg-black/90 text-white tracking-wider border border-slate-700 uppercase shadow-sm">
                      {hero.primaryPos}
                    </div>

                    {/* Role Color Dot */}
                    <div className={`absolute top-2 right-2 z-10 w-2.5 h-2.5 rounded-full ${posColor} ring-1 ring-black shadow-sm`} />

                    {/* Hero Portrait */}
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-black/80 mb-1 border border-white/5">
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
                        className="absolute bottom-1 right-1 z-30 w-6 h-6 rounded-md bg-black/90 hover:bg-[#0284c7] text-white flex items-center justify-center text-[11px] border border-white/30 transition-all opacity-0 group-hover/card:opacity-100 shadow-md cursor-pointer"
                      >
                        📊
                      </div>

                      {/* Banned Overlay */}
                      {isBanned && (
                        <div className="absolute inset-0 bg-red-950/85 flex flex-col items-center justify-center text-red-300 z-20">
                          <Ban size={20} strokeWidth={2.5} />
                          <span className="text-[8px] font-['Orbitron'] font-black mt-0.5 tracking-wider">BANNED</span>
                        </div>
                      )}

                      {/* Picked Overlay */}
                      {isPicked && (
                        <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-emerald-400 z-20">
                          <Check size={20} strokeWidth={2.5} />
                          <span className="text-[8px] font-['Orbitron'] font-black mt-0.5 tracking-wider">PICKED</span>
                        </div>
                      )}
                    </div>

                    {/* Hero Name */}
                    <div className="w-full truncate text-center font-['Barlow_Condensed'] font-black text-[12.5px] text-white group-hover/card:text-[#fbbf24] transition-colors">
                      {hero.name}
                    </div>
                    <div className="w-full truncate text-center text-[10px] font-['Mitr'] text-slate-300">
                      {hero.nameTh}
                    </div>

                    {/* PLAYER HERO POOL BADGES (⭐ Gold / ★ Silver) */}
                    {playerBadges.length > 0 && (
                      <div className="w-full flex flex-col gap-1 mt-1 pt-1 border-t border-slate-700/60">
                        {playerBadges.slice(0, 2).map((b) => {
                          const isSig = b.tier === 'signature';
                          return (
                            <div
                              key={b.playerId}
                              className={`w-full flex items-center justify-between px-1.5 py-0.5 rounded text-[9.5px] font-['Barlow_Condensed'] font-black leading-tight truncate transition-colors ${
                                isSig
                                  ? 'bg-[#fbbf24]/20 border border-[#fbbf24] text-[#fbbf24] shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                                  : 'bg-slate-800 border border-slate-500 text-slate-200'
                              }`}
                            >
                              <span className="truncate flex items-center gap-1">
                                <span className={isSig ? 'text-[#fbbf24]' : 'text-slate-300'}>
                                  {isSig ? '⭐' : '★'}
                                </span>
                                <span className="truncate">{b.playerNickname}</span>
                              </span>
                              <span className="text-[8px] font-black opacity-80 uppercase ml-0.5">
                                {b.position}
                              </span>
                            </div>
                          );
                        })}
                        {playerBadges.length > 2 && (
                          <div className="text-[8.5px] text-center text-[#fbbf24] font-['Mitr'] font-bold leading-tight">
                            +{playerBadges.length - 2} คนในทีม
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
                              <span className="text-[9.5px] font-['Mitr'] text-[#a0a0a8] truncate">
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
