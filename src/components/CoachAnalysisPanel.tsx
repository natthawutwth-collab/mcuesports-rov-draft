import React, { useState, useMemo } from 'react';
import { Hero } from '../types/draft';
import { Player, HeroPlayerBadge } from '../types/player';
import { PickSlotState } from '../hooks/useDraconmindDraft';
import {
  COMP_ROLES,
  CompRoleKey,
  CoachAnalysisResult,
  analyzeCoachDraft,
  SuggestedPickItem,
} from '../services/coachAnalysisService';
import { getHeroImageUrl } from '../data/heroes';

interface CoachAnalysisPanelProps {
  isOpen: boolean;
  onClose: () => void;
  // Draft State
  activeTurnTeam: 'blue' | 'red';
  bluePicks: PickSlotState[];
  redPicks: PickSlotState[];
  blueBans: (Hero | null)[];
  redBans: (Hero | null)[];
  bannedHeroNames: Set<string>;
  pickedHeroNames: Set<string>;
  allHeroes: Hero[];
  // Player Pool
  players: Player[];
  heroToPlayersMap: Record<string, HeroPlayerBadge[]>;
  // Inspected Hero
  inspectedHeroName: string | null;
  onSelectHeroToInspect: (heroName: string) => void;
  onPickHeroDirectly?: (hero: Hero) => void;
  isPickTurn?: boolean;
}

export const CoachAnalysisPanel: React.FC<CoachAnalysisPanelProps> = ({
  isOpen,
  onClose,
  activeTurnTeam,
  bluePicks,
  redPicks,
  blueBans,
  redBans,
  bannedHeroNames,
  pickedHeroNames,
  allHeroes,
  players,
  heroToPlayersMap,
  inspectedHeroName,
  onSelectHeroToInspect,
  onPickHeroDirectly,
  isPickTurn = false,
}) => {
  // Perspective Team: defaults to current turn team, but coach can toggle
  const [analyzedTeam, setAnalyzedTeam] = useState<'blue' | 'red'>(activeTurnTeam);

  // Sync with turn team when turn changes if user hasn't explicitly locked
  React.useEffect(() => {
    setAnalyzedTeam(activeTurnTeam);
  }, [activeTurnTeam]);

  // Find inspected hero object
  const inspectedHero = useMemo(() => {
    if (!inspectedHeroName) return null;
    return (
      allHeroes.find(
        (h) => h.name.toLowerCase() === inspectedHeroName.toLowerCase()
      ) || null
    );
  }, [inspectedHeroName, allHeroes]);

  // Run Coach Analysis Engine
  const analysis: CoachAnalysisResult = useMemo(() => {
    const isBlue = analyzedTeam === 'blue';
    const myPicks = isBlue ? bluePicks : redPicks;
    const oppPicks = isBlue ? redPicks : bluePicks;
    const myBans = isBlue ? blueBans : redBans;
    const oppBans = isBlue ? redBans : blueBans;

    return analyzeCoachDraft({
      activeTeam: analyzedTeam,
      myPicks,
      oppPicks,
      myBans,
      oppBans,
      inspectedHero,
      players,
      heroToPlayersMap,
      allHeroes,
      bannedHeroNames,
      pickedHeroNames,
    });
  }, [
    analyzedTeam,
    bluePicks,
    redPicks,
    blueBans,
    redBans,
    inspectedHero,
    players,
    heroToPlayersMap,
    allHeroes,
    bannedHeroNames,
    pickedHeroNames,
  ]);

  if (!isOpen) return null;

  const isBlue = analyzedTeam === 'blue';
  const teamColor = isBlue ? '#6b8fb8' : '#a82844';
  const teamBg = isBlue ? 'bg-[#6b8fb8]/10' : 'bg-[#a82844]/10';
  const teamBorder = isBlue ? 'border-[#6b8fb8]/40' : 'border-[#a82844]/40';

  return (
    <aside
      className="w-full h-full flex flex-col bg-[#0a0c14]/95 border-2 border-[#fbbf24]/50 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden transition-all text-white font-['Kanit'] select-none"
      style={{ minHeight: '680px' }}
      aria-label="Coach Analysis Panel"
    >
      {/* 1. Header & Team Perspective Switcher */}
      <div className="p-3.5 border-b-2 border-slate-700/80 bg-[#07090f] flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#fbbf24]/20 border border-[#fbbf24] flex items-center justify-center text-base shadow-[0_0_12px_rgba(251,191,36,0.3)]">
              🎯
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-['Barlow_Condensed'] text-[16px] font-black tracking-wider uppercase text-white leading-none">
                  COACH ANALYSIS PANEL
                </h3>
                <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-[#fbbf24] text-black shadow-sm">
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-tight mt-0.5 font-medium">
                ระบบวิเคราะห์ดราฟ & ช่วยโค้ชตัดสินใจแบบเรียลไทม์
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            title="ปิดพาเนลโค้ช"
            className="w-7 h-7 rounded-lg bg-black/60 hover:bg-rose-900/60 border border-slate-700 hover:border-rose-500 text-slate-300 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Perspective Toggle: Blue Side vs Red Side */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-black/70 rounded-xl border border-slate-700/80 shadow-inner">
          <button
            onClick={() => setAnalyzedTeam('blue')}
            className={`py-1.5 px-2.5 rounded-lg font-['Barlow_Condensed'] text-xs font-black tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isBlue
                ? 'bg-[#0284c7] text-white shadow-[0_0_14px_rgba(56,189,248,0.5)] border border-[#38bdf8]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>🔵</span>
            <span>BLUE SIDE</span>
            {analysis.myTeamComp.missingRoles.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#fbbf24] animate-pulse"></span>
            )}
          </button>

          <button
            onClick={() => setAnalyzedTeam('red')}
            className={`py-1.5 px-2.5 rounded-lg font-['Barlow_Condensed'] text-xs font-black tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              !isBlue
                ? 'bg-[#e11d48] text-white shadow-[0_0_14px_rgba(244,63,94,0.5)] border border-[#f43f5e]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>🔴</span>
            <span>RED SIDE</span>
            {analysis.oppTeamComp.missingRoles.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#fbbf24] animate-pulse"></span>
            )}
          </button>
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5 custom-scrollbar text-xs">
        {/* 2. DRAFT WARNINGS & ALERTS (Real-time) */}
        {analysis.warnings.length > 0 && (
          <section className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-['Barlow_Condensed'] text-[11px] font-black tracking-wider uppercase text-[#d4a857] flex items-center gap-1">
                <span>⚠️</span>
                <span>DRAFT WARNINGS ({analysis.warnings.length})</span>
              </span>
              <span className="text-[10px] text-[#a0a0a8]">ตรวจจับความเสี่ยงดราฟ</span>
            </div>

            <div className="space-y-1.5">
              {analysis.warnings.map((warn) => {
                const isErr = warn.severity === 'error';
                const isWarn = warn.severity === 'warning';
                const isSuccess = warn.severity === 'success';

                const borderStyle = isErr
                  ? 'border-red-500/50 bg-red-950/30 text-red-200'
                  : isWarn
                  ? 'border-amber-500/50 bg-amber-950/25 text-amber-200'
                  : isSuccess
                  ? 'border-emerald-500/50 bg-emerald-950/25 text-emerald-200'
                  : 'border-blue-500/40 bg-blue-950/25 text-blue-200';

                const icon = isErr ? '🚨' : isWarn ? '⚠️' : isSuccess ? '✅' : 'ℹ️';

                return (
                  <div
                    key={warn.id}
                    className={`p-2 rounded-lg border text-[11px] flex items-start gap-2 shadow-sm transition-all ${borderStyle}`}
                  >
                    <span className="text-xs flex-shrink-0 mt-0.5">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold font-['Kanit'] tracking-wide">
                        {warn.title}
                      </div>
                      <div className="text-[10px] text-white/80 leading-relaxed mt-0.5">
                        {warn.description}
                      </div>
                      {warn.relatedHeroes && warn.relatedHeroes.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {warn.relatedHeroes.map((hn) => (
                            <button
                              key={hn}
                              type="button"
                              onClick={() => onSelectHeroToInspect(hn)}
                              className="px-1.5 py-0.5 rounded bg-black/40 hover:bg-white/20 border border-white/20 text-[9.5px] font-['Barlow_Condensed'] font-bold text-white transition-colors cursor-pointer"
                            >
                              🔍 {hn}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 3. TEAM COMPOSITION (5 ROLES: DSL, Jungle, Mid, Support, ADL) */}
        <section className="bg-black/30 border border-white/10 rounded-lg p-2.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="font-['Barlow_Condensed'] text-[11px] font-black tracking-wider uppercase text-white flex items-center gap-1">
                <span>🛡️</span>
                <span>TEAM COMPOSITION ({analysis.myTeamComp.filledCount}/5)</span>
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px]">
              {analysis.myTeamComp.missingRoles.length === 0 ? (
                <span className="text-emerald-400 font-bold bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  ✓ ครบ 5 ตำแหน่ง
                </span>
              ) : (
                <span className="text-amber-300 font-bold bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-500/30">
                  ขาด {analysis.myTeamComp.missingRoles.join(', ')}
                </span>
              )}
            </div>
          </div>

          {/* 5 Roles Grid */}
          <div className="grid grid-cols-5 gap-1">
            {COMP_ROLES.map((role) => {
              const entry = analysis.myTeamComp.roles[role.key];
              const isFilled = entry.filled && entry.heroes.length > 0;
              const hasMultiple = entry.heroes.length > 1;

              return (
                <div
                  key={role.key}
                  className={`flex flex-col items-center p-1 rounded-md border text-center transition-all ${
                    hasMultiple
                      ? 'border-red-500 bg-red-950/30'
                      : isFilled
                      ? `${role.borderClass} ${role.bgClass}`
                      : 'border-white/10 border-dashed bg-black/40 opacity-70'
                  }`}
                  title={`${role.label}: ${isFilled ? entry.heroes.map((h) => h.hero.name).join(', ') : 'ยังขาด (ยังไม่ถูกเลือก)'}`}
                >
                  <span
                    className="font-['Barlow_Condensed'] text-[9px] font-black tracking-wider uppercase"
                    style={{ color: role.color }}
                  >
                    {role.short}
                  </span>

                  {isFilled ? (
                    <div className="mt-1 flex flex-col items-center">
                      <div className="relative w-7 h-7 rounded-full overflow-hidden border border-white/30 shadow">
                        <img
                          src={entry.heroes[0].hero.avatarUrl || getHeroImageUrl(entry.heroes[0].hero.name)}
                          alt={entry.heroes[0].hero.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getHeroImageUrl(entry.heroes[0].hero.name);
                          }}
                        />
                        {hasMultiple && (
                          <div className="absolute inset-0 bg-red-900/80 flex items-center justify-center text-[8px] font-bold text-white">
                            !2
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] font-semibold text-white truncate max-w-[52px] mt-0.5">
                        {entry.heroes[0].hero.name}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-col items-center py-1">
                      <div className="w-7 h-7 rounded-full border border-white/15 border-dashed flex items-center justify-center text-[10px] text-white/30">
                        —
                      </div>
                      <span className="text-[8.5px] text-amber-400/80 font-bold mt-0.5">
                        ยังขาด
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. CURRENT HERO INSPECTION (Player Fit & Matchup) */}
        {inspectedHero ? (
          <section className="bg-gradient-to-b from-white/[0.04] to-black/30 border border-white/15 rounded-xl p-3 space-y-3 shadow-md">
            {/* Hero Quick Header */}
            <div className="flex items-center gap-2.5">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/30 flex-shrink-0 shadow-lg">
                <img
                  src={inspectedHero.avatarUrl || getHeroImageUrl(inspectedHero.name)}
                  alt={inspectedHero.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getHeroImageUrl(inspectedHero.name);
                  }}
                />
                <div className="absolute top-0.5 left-0.5 px-1 rounded bg-black/80 font-['Barlow_Condensed'] text-[8px] font-bold uppercase text-[#d4a857]">
                  {inspectedHero.primaryPos}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-['Barlow_Condensed'] text-base font-black tracking-wider text-white">
                    {inspectedHero.name}
                  </span>
                  <span className="text-[11px] text-[#a0a0a8]">
                    ({inspectedHero.nameTh})
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[9.5px] text-white/70 flex-wrap mt-0.5">
                  <span className="px-1.5 py-0.2 rounded bg-white/10">
                    {inspectedHero.roles.join(', ')}
                  </span>
                  <span>•</span>
                  <span>เลน: {inspectedHero.pos.join(', ').toUpperCase()}</span>
                </div>
              </div>

              {/* Direct Pick Button if it's our turn */}
              {isPickTurn && onPickHeroDirectly && (
                <button
                  type="button"
                  onClick={() => onPickHeroDirectly(inspectedHero)}
                  className="font-['Barlow_Condensed'] text-xs font-black tracking-wider px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)] transition-all cursor-pointer flex-shrink-0"
                >
                  ✓ PICK NOW
                </button>
              )}
            </div>

            {/* A. PLAYER FIT: Who can play this Hero */}
            <div className="space-y-1.5 border-t border-white/10 pt-2.5">
              <div className="flex items-center justify-between">
                <span className="font-['Barlow_Condensed'] text-[11px] font-black tracking-wider uppercase text-white flex items-center gap-1">
                  <span>👤</span>
                  <span>PLAYER FIT (ใครสามารถเล่น HERO นี้ได้)</span>
                </span>
                <span className="text-[9.5px] text-[#a0a0a8]">
                  {analysis.playerFit.players.length} นักแข่งในทีม
                </span>
              </div>

              {analysis.playerFit.players.length > 0 ? (
                <div className="grid grid-cols-1 gap-1.5">
                  {analysis.playerFit.players.map((p) => {
                    const isSig = p.tier === 'signature';
                    return (
                      <div
                        key={p.playerId}
                        className={`flex items-center justify-between p-1.5 rounded-lg border transition-all ${
                          isSig
                            ? 'bg-[#d4a857]/15 border-[#d4a857]/40 shadow-[0_0_8px_rgba(212,168,87,0.2)]'
                            : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={p.playerAvatar}
                            alt={p.playerNickname}
                            className="w-6 h-6 rounded-full object-cover border border-white/20 flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://res.cloudinary.com/dtzdhbllb/image/upload/v1775747198/Flowborn.png';
                            }}
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-[11.5px] text-white truncate flex items-center gap-1">
                              <span>{p.playerNickname}</span>
                              <span className="text-[9px] text-[#a0a0a8] font-normal">
                                ({p.playerName})
                              </span>
                            </div>
                            <div className="text-[9.5px] text-[#a0a0a8]">
                              ตำแหน่ง: <span className="text-white/90">{p.position}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {isSig ? (
                            <span className="font-['Barlow_Condensed'] text-[10px] font-black px-1.5 py-0.5 rounded bg-[#d4a857] text-black tracking-wider flex items-center gap-0.5 shadow">
                              <span>⭐</span>
                              <span>SIGNATURE</span>
                            </span>
                          ) : (
                            <span className="font-['Barlow_Condensed'] text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 tracking-wider flex items-center gap-0.5">
                              <span>★</span>
                              <span>COMFORTABLE</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-2 rounded-lg border border-dashed border-white/15 bg-black/20 text-center text-white/50 text-[10.5px]">
                  ℹ️ ไม่อยู่ใน Hero Pool ของนักแข่งในไลน์อัป (Off-meta / Flex)
                </div>
              )}
            </div>

            {/* B. MATCHUP (Strong Against & Weak Against) */}
            <div className="space-y-2 border-t border-white/10 pt-2.5">
              <div className="flex items-center justify-between">
                <span className="font-['Barlow_Condensed'] text-[11px] font-black tracking-wider uppercase text-white flex items-center gap-1">
                  <span>⚔️</span>
                  <span>MATCHUP วิเคราะห์แพ้ทาง / ชนะทาง</span>
                </span>
                <span className="text-[9.5px] text-[#a0a0a8]">RPL 2026 Competitive</span>
              </div>

              {/* Real-time battle against enemy picks */}
              {analysis.inspectedMatchups.liveOpponents.length > 0 && (
                <div className="bg-black/40 border border-white/10 rounded-lg p-2 space-y-1.5">
                  <div className="text-[10px] font-bold text-[#d4a857] uppercase font-['Barlow_Condensed'] tracking-wider">
                    VS ฝั่งตรงข้ามที่เลือกแล้ว ({analysis.inspectedMatchups.liveOpponents.length} ตัว)
                  </div>
                  <div className="space-y-1">
                    {analysis.inspectedMatchups.liveOpponents.map((live) => {
                      if (!live.matchup) {
                        return (
                          <div
                            key={live.oppHero}
                            className="flex items-center justify-between text-[10px] p-1 rounded bg-white/5 text-white/60"
                          >
                            <span className="font-bold text-white/80">{live.oppHero}</span>
                            <span className="text-white/40 italic">No Data ในทัวร์</span>
                          </div>
                        );
                      }
                      const isAdv = live.matchup.diff > 0;
                      return (
                        <div
                          key={live.oppHero}
                          className={`flex items-center justify-between text-[10.5px] p-1.5 rounded border ${
                            isAdv
                              ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                              : 'border-red-500/40 bg-red-950/20 text-red-300'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold">{live.oppHero}</span>
                            <span className="text-[9px] text-white/60">
                              ({live.matchup.wins}W / {live.matchup.losses}L)
                            </span>
                          </div>
                          <div className="flex items-center gap-1 font-['Barlow_Condensed'] font-black">
                            <span>{isAdv ? 'ได้เปรียบ' : 'เสียเปรียบ'}</span>
                            <span className="text-xs">
                              {live.matchup.diff > 0 ? `+${live.matchup.diff.toFixed(1)}%` : `${live.matchup.diff.toFixed(1)}%`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tournament Strong Against & Weak Against */}
              <div className="grid grid-cols-2 gap-2">
                {/* Strong Against */}
                <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-lg p-2 space-y-1">
                  <div className="font-['Barlow_Condensed'] text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <span>🛡️</span>
                    <span>STRONG AGAINST (ชนะทาง)</span>
                  </div>
                  {analysis.inspectedMatchups.strongAgainst.length > 0 ? (
                    <div className="space-y-1">
                      {analysis.inspectedMatchups.strongAgainst.slice(0, 3).map((m) => (
                        <div
                          key={m.opponentHero}
                          className="flex items-center justify-between text-[10px] text-white/90"
                        >
                          <span className="truncate">{m.opponentHero}</span>
                          <span className="text-emerald-400 font-bold font-['Barlow_Condensed'] flex-shrink-0">
                            +{m.diff.toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[9.5px] text-white/40 italic">ไม่มีข้อมูลได้เปรียบเด่นชัด</div>
                  )}
                </div>

                {/* Weak Against */}
                <div className="bg-red-950/20 border border-red-500/30 rounded-lg p-2 space-y-1">
                  <div className="font-['Barlow_Condensed'] text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                    <span>⚠️</span>
                    <span>WEAK AGAINST (แพ้ทาง)</span>
                  </div>
                  {analysis.inspectedMatchups.weakAgainst.length > 0 ? (
                    <div className="space-y-1">
                      {analysis.inspectedMatchups.weakAgainst.slice(0, 3).map((m) => (
                        <div
                          key={m.opponentHero}
                          className="flex items-center justify-between text-[10px] text-white/90"
                        >
                          <span className="truncate">{m.opponentHero}</span>
                          <span className="text-red-400 font-bold font-['Barlow_Condensed'] flex-shrink-0">
                            {m.diff.toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[9.5px] text-white/40 italic">ไม่มีข้อมูลเสียเปรียบเด่นชัด</div>
                  )}
                </div>
              </div>

              {/* Live Synergies with Picked Allies */}
              {analysis.inspectedSynergies?.liveAllies && analysis.inspectedSynergies.liveAllies.length > 0 && (
                <div className="bg-sky-950/20 border border-sky-500/30 rounded-lg p-2 space-y-1.5">
                  <div className="font-['Barlow_Condensed'] text-[10px] font-bold text-sky-400 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <span>🤝</span>
                      <span>SYNERGY กับเพื่อนร่วมทีม ({analysis.inspectedSynergies.liveAllies.length} ตัว)</span>
                    </span>
                  </div>
                  <div className="space-y-1">
                    {analysis.inspectedSynergies.liveAllies.map((live) => {
                      const synergy = live.synergy;
                      const diff = synergy?.diff ?? 0;
                      const isPos = diff >= 0;
                      return (
                        <div
                          key={live.allyHero}
                          className="flex items-center justify-between text-[10.5px] bg-black/40 rounded px-1.5 py-0.5 border border-white/5"
                        >
                          <span className="font-medium text-white">{live.allyHero}</span>
                          {synergy ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-white/50">{synergy.winRate.toFixed(1)}% WR ({synergy.games}G)</span>
                              <span
                                className={`font-['Barlow_Condensed'] font-bold text-[11px] ${
                                  isPos ? 'text-emerald-400' : 'text-amber-400'
                                }`}
                              >
                                {diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[9.5px] text-white/40 italic">ไม่มีข้อมูลคู่หู</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>
        ) : (
          <div className="p-4 rounded-xl border border-dashed border-white/20 bg-black/30 text-center space-y-1 text-white/60">
            <span className="text-xl">🔍</span>
            <div className="font-bold text-white text-xs">คลิกเลือกฮีโร่เพื่อดู Player Fit & Matchup</div>
            <div className="text-[10px] text-white/50">
              คลิกฮีโร่ตัวใดก็ได้ในกระดานดราฟเพื่อวิเคราะห์ความถนัดของนักแข่งและคู่ต่อสู้
            </div>
          </div>
        )}

        {/* 5. SUGGESTED PICKS (Decision Aid for Coaches) */}
        <section className="space-y-2 border-t border-white/10 pt-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-['Barlow_Condensed'] text-[13px] font-black tracking-wider uppercase text-[#d4a857] flex items-center gap-1">
                  <span>💡</span>
                  <span>SUGGESTED PICKS (ควรพิจารณา)</span>
                </span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-white/10 text-white/80">
                  DECISION AID
                </span>
              </div>
              <p className="text-[9.5px] text-[#a0a0a8]">
                คำนวณจาก Player Pool + Matchup + ขาดตำแหน่ง + หักตัวแบน/เลือกแล้ว
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {analysis.suggestedPicks.length > 0 ? (
              analysis.suggestedPicks.map((sug, idx) => (
                <div
                  key={sug.hero.id}
                  onClick={() => onSelectHeroToInspect(sug.hero.name)}
                  className="p-2 rounded-xl bg-gradient-to-r from-black/60 to-white/[0.03] hover:to-white/[0.08] border border-white/10 hover:border-[#d4a857]/60 transition-all cursor-pointer shadow-sm group"
                >
                  <div className="flex items-start gap-2.5">
                    {/* Hero Avatar & Rank */}
                    <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-white/20 flex-shrink-0 group-hover:border-[#d4a857] transition-colors">
                      <img
                        src={sug.hero.avatarUrl || getHeroImageUrl(sug.hero.name)}
                        alt={sug.hero.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getHeroImageUrl(sug.hero.name);
                        }}
                      />
                      <div className="absolute top-0 left-0 bg-black/80 font-['Barlow_Condensed'] text-[8.5px] font-black px-1 text-[#d4a857]">
                        #{idx + 1}
                      </div>
                      <div className="absolute bottom-0 right-0 bg-black/80 font-['Barlow_Condensed'] text-[8px] font-bold px-1 uppercase text-white/80">
                        {sug.targetRole}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-['Barlow_Condensed'] text-[13.5px] font-black tracking-wide text-white group-hover:text-[#d4a857] transition-colors truncate">
                            {sug.hero.name}
                          </span>
                          <span className="text-[10px] text-[#a0a0a8] truncate">
                            ({sug.hero.nameTh})
                          </span>
                        </div>

                        {/* Fit Score Badge */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span
                            className={`font-['Barlow_Condensed'] text-[9.5px] font-black px-1.5 py-0.5 rounded tracking-wider ${
                              sug.confidence === 'high'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                            }`}
                          >
                            SCORE {sug.score}
                          </span>
                        </div>
                      </div>

                      {/* Reasons & Badges */}
                      <div className="flex items-center gap-1 flex-wrap mt-1">
                        {sug.reasons.map((r, i) => (
                          <span
                            key={i}
                            className="text-[9.5px] px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-white/90"
                          >
                            {r}
                          </span>
                        ))}
                        {sug.cautions.map((c, i) => (
                          <span
                            key={`c-${i}`}
                            className="text-[9.5px] px-1.5 py-0.2 rounded bg-red-950/40 border border-red-500/30 text-red-300"
                          >
                            {c}
                          </span>
                        ))}
                      </div>

                      {/* Quick Pick Action */}
                      {isPickTurn && onPickHeroDirectly && (
                        <div className="mt-1.5 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPickHeroDirectly(sug.hero);
                            }}
                            className="font-['Barlow_Condensed'] text-[10px] font-black tracking-wider px-2 py-0.5 rounded bg-emerald-600/80 hover:bg-emerald-500 text-white transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <span>✓</span>
                            <span>SELECT FOR {analyzedTeam.toUpperCase()}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-white/40 text-xs italic">
                ไม่มีข้อมูลฮีโร่แนะนำสำหรับเงื่อนไขปัจจุบัน
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Footer Note */}
      <div className="p-2 border-t border-white/10 bg-black/40 text-[9.5px] text-[#a0a0a8] flex items-center justify-between">
        <span className="flex items-center gap-1">
          <span>ℹ️</span>
          <span>ข้อมูลเพื่อการตัดสินใจของโค้ช (ไม่บังคับการเลือก)</span>
        </span>
        <button
          onClick={() => onSelectHeroToInspect('Nakroth')}
          className="text-[#d4a857] hover:underline font-bold"
        >
          รีเซ็ตการตรวจ
        </button>
      </div>
    </aside>
  );
};
