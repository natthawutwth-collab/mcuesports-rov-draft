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
      className="w-full h-full flex flex-col bg-white border-2 border-[#F3D5E2] rounded-2xl shadow-xl overflow-hidden transition-all text-[#1F2937] font-['Prompt'] select-none"
      style={{ minHeight: '680px' }}
      aria-label="Coach Analysis Panel"
    >
      {/* 1. Header & Team Perspective Switcher */}
      <div className="p-3.5 border-b-2 border-[#F3D5E2] bg-[#FFF0F5] flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FCE4EC] border border-[#E91E63] flex items-center justify-center text-base shadow-xs text-[#E91E63]">
              🎯
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-['Prompt'] text-[15px] font-bold tracking-wide uppercase text-[#1F2937] leading-none">
                  COACH ANALYSIS PANEL
                </h3>
                <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-[#E91E63] text-white shadow-2xs">
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight mt-0.5 font-medium">
                ระบบวิเคราะห์ดราฟ & ช่วยโค้ชตัดสินใจแบบเรียลไทม์
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            title="ปิดพาเนลโค้ช"
            className="w-7 h-7 rounded-lg bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-400 text-slate-600 hover:text-rose-600 flex items-center justify-center text-xs transition-colors cursor-pointer shadow-2xs"
          >
            ✕
          </button>
        </div>

        {/* Perspective Toggle: Blue Side vs Red Side */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-white rounded-xl border border-[#F3D5E2] shadow-2xs">
          <button
            onClick={() => setAnalyzedTeam('blue')}
            className={`py-1.5 px-2.5 rounded-lg font-['Prompt'] text-xs font-bold tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isBlue
                ? 'bg-[#0284c7] text-white shadow-xs border border-[#0284c7]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
            }`}
          >
            <span>🔵</span>
            <span>BLUE SIDE</span>
            {analysis.myTeamComp.missingRoles.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#E91E63] animate-pulse"></span>
            )}
          </button>

          <button
            onClick={() => setAnalyzedTeam('red')}
            className={`py-1.5 px-2.5 rounded-lg font-['Prompt'] text-xs font-bold tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer ${
              !isBlue
                ? 'bg-[#e11d48] text-white shadow-xs border border-[#e11d48]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
            }`}
          >
            <span>🔴</span>
            <span>RED SIDE</span>
            {analysis.oppTeamComp.missingRoles.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#E91E63] animate-pulse"></span>
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
              <span className="font-['Prompt'] text-[11px] font-bold tracking-wider uppercase text-[#B45309] flex items-center gap-1">
                <span>⚠️</span>
                <span>DRAFT WARNINGS ({analysis.warnings.length})</span>
              </span>
              <span className="text-[10px] text-slate-500 font-['Prompt']">ตรวจจับความเสี่ยงดราฟ</span>
            </div>

            <div className="space-y-1.5">
              {analysis.warnings.map((warn) => {
                const isErr = warn.severity === 'error';
                const isWarn = warn.severity === 'warning';
                const isSuccess = warn.severity === 'success';

                const borderStyle = isErr
                  ? 'border-rose-300 bg-rose-50 text-rose-800'
                  : isWarn
                  ? 'border-amber-300 bg-amber-50 text-amber-800'
                  : isSuccess
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-sky-300 bg-sky-50 text-sky-800';

                const icon = isErr ? '🚨' : isWarn ? '⚠️' : isSuccess ? '✅' : 'ℹ️';

                return (
                  <div
                    key={warn.id}
                    className={`p-2.5 rounded-xl border text-[11px] flex items-start gap-2 shadow-2xs transition-all ${borderStyle}`}
                  >
                    <span className="text-xs flex-shrink-0 mt-0.5">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold font-['Prompt'] tracking-wide">
                        {warn.title}
                      </div>
                      <div className="text-[10.5px] text-slate-700 leading-relaxed mt-0.5 font-['Prompt']">
                        {warn.description}
                      </div>
                      {warn.relatedHeroes && warn.relatedHeroes.length > 0 && (
                        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                          {warn.relatedHeroes.map((hn) => (
                            <button
                              key={hn}
                              type="button"
                              onClick={() => onSelectHeroToInspect(hn)}
                              className="px-2 py-0.5 rounded-md bg-white hover:bg-[#FCE4EC] border border-[#F3D5E2] hover:border-[#E91E63] text-[10px] font-['Prompt'] font-bold text-slate-700 hover:text-[#E91E63] transition-colors cursor-pointer shadow-2xs"
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
        <section className="bg-[#FFF8FB] border border-[#F3D5E2] rounded-xl p-3 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="font-['Prompt'] text-[11px] font-bold tracking-wider uppercase text-[#1F2937] flex items-center gap-1">
                <span>🛡️</span>
                <span>TEAM COMPOSITION ({analysis.myTeamComp.filledCount}/5)</span>
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-['Prompt']">
              {analysis.myTeamComp.missingRoles.length === 0 ? (
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-300">
                  ✓ ครบ 5 ตำแหน่ง
                </span>
              ) : (
                <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-300">
                  ขาด {analysis.myTeamComp.missingRoles.join(', ')}
                </span>
              )}
            </div>
          </div>

          {/* 5 Roles Grid */}
          <div className="grid grid-cols-5 gap-1.5">
            {COMP_ROLES.map((role) => {
              const entry = analysis.myTeamComp.roles[role.key];
              const isFilled = entry.filled && entry.heroes.length > 0;
              const hasMultiple = entry.heroes.length > 1;

              return (
                <div
                  key={role.key}
                  className={`flex flex-col items-center p-1.5 rounded-lg border text-center transition-all bg-white ${
                    hasMultiple
                      ? 'border-rose-400 bg-rose-50 shadow-2xs'
                      : isFilled
                      ? 'border-[#F3D5E2] shadow-2xs'
                      : 'border-slate-300 border-dashed bg-slate-50 opacity-80'
                  }`}
                  title={`${role.label}: ${isFilled ? entry.heroes.map((h) => h.hero.name).join(', ') : 'ยังขาด (ยังไม่ถูกเลือก)'}`}
                >
                  <span
                    className="font-['Prompt'] text-[9.5px] font-bold tracking-wider uppercase"
                    style={{ color: role.color }}
                  >
                    {role.short}
                  </span>

                  {isFilled ? (
                    <div className="mt-1 flex flex-col items-center">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#F3D5E2] shadow-2xs">
                        <img
                          src={entry.heroes[0].hero.avatarUrl || getHeroImageUrl(entry.heroes[0].hero.name)}
                          alt={entry.heroes[0].hero.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getHeroImageUrl(entry.heroes[0].hero.name);
                          }}
                        />
                        {hasMultiple && (
                          <div className="absolute inset-0 bg-rose-600/90 flex items-center justify-center text-[8px] font-bold text-white">
                            !2
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] font-semibold text-slate-800 truncate max-w-[54px] mt-0.5 font-['Prompt']">
                        {entry.heroes[0].hero.name}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-col items-center py-1">
                      <div className="w-8 h-8 rounded-full border border-slate-300 border-dashed flex items-center justify-center text-[10px] text-slate-400 bg-slate-100">
                        —
                      </div>
                      <span className="text-[9px] text-amber-700 font-bold mt-0.5 font-['Prompt']">
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
          <section className="bg-white border border-[#F3D5E2] rounded-xl p-3 space-y-3 shadow-xs font-['Prompt']">
            {/* Hero Quick Header */}
            <div className="flex items-center gap-2.5">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-[#E91E63] flex-shrink-0 shadow-xs">
                <img
                  src={inspectedHero.avatarUrl || getHeroImageUrl(inspectedHero.name)}
                  alt={inspectedHero.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getHeroImageUrl(inspectedHero.name);
                  }}
                />
                <div className="absolute top-0.5 left-0.5 px-1 rounded bg-black/80 font-['Prompt'] text-[8px] font-bold uppercase text-[#fbbf24]">
                  {inspectedHero.primaryPos}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-['Prompt'] text-base font-bold tracking-wide text-[#1F2937]">
                    {inspectedHero.name}
                  </span>
                  <span className="text-[11px] text-slate-500 font-['Prompt']">
                    ({inspectedHero.nameTh})
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 flex-wrap mt-0.5">
                  <span className="px-1.5 py-0.2 rounded bg-[#FFF0F5] border border-[#F3D5E2] text-slate-700 font-medium">
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
                  className="font-['Prompt'] text-xs font-bold tracking-wider px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer flex-shrink-0"
                >
                  ✓ PICK NOW
                </button>
              )}
            </div>

            {/* A. PLAYER FIT: Who can play this Hero */}
            <div className="space-y-1.5 border-t border-[#F3D5E2] pt-2.5">
              <div className="flex items-center justify-between">
                <span className="font-['Prompt'] text-[11px] font-bold tracking-wider uppercase text-slate-800 flex items-center gap-1">
                  <span>👤</span>
                  <span>PLAYER FIT (ใครสามารถเล่น HERO นี้ได้)</span>
                </span>
                <span className="text-[10px] text-slate-500">
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
                        className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                          isSig
                            ? 'bg-[#FEF3C7] border-[#F59E0B] shadow-2xs'
                            : 'bg-[#FFF8FB] border-[#F3D5E2]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {p.playerAvatar ? (
                            <img
                              src={p.playerAvatar}
                              alt={p.playerNickname}
                              className="w-7 h-7 rounded-full object-cover border border-[#F3D5E2] flex-shrink-0"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-[#FCE4EC] text-[#E91E63] text-[9.5px] font-bold flex items-center justify-center flex-shrink-0 border border-[#F48FB1]">
                              {p.playerNickname.slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-[12px] text-slate-800 truncate flex items-center gap-1">
                              <span>{p.playerNickname}</span>
                              <span className="text-[9.5px] text-slate-500 font-normal">
                                ({p.playerName})
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              ตำแหน่ง: <span className="text-slate-800 font-semibold">{p.position}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {isSig ? (
                            <span className="font-['Prompt'] text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F59E0B] text-white tracking-wider flex items-center gap-0.5 shadow-2xs">
                              <span>⭐</span>
                              <span>SIGNATURE</span>
                            </span>
                          ) : (
                            <span className="font-['Prompt'] text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-300 tracking-wider flex items-center gap-0.5">
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
                <div className="p-2.5 rounded-xl border border-dashed border-[#F3D5E2] bg-slate-50 text-center text-slate-500 text-[11px]">
                  ℹ️ ไม่อยู่ใน Hero Pool ของนักแข่งในไลน์อัป (Off-meta / Flex)
                </div>
              )}
            </div>

            {/* B. MATCHUP (Strong Against & Weak Against) */}
            <div className="space-y-2 border-t border-[#F3D5E2] pt-2.5">
              <div className="flex items-center justify-between">
                <span className="font-['Prompt'] text-[11px] font-bold tracking-wider uppercase text-slate-800 flex items-center gap-1">
                  <span>⚔️</span>
                  <span>MATCHUP วิเคราะห์แพ้ทาง / ชนะทาง</span>
                </span>
                <span className="text-[10px] text-slate-500">RPL 2026 Competitive</span>
              </div>

              {/* Real-time battle against enemy picks */}
              {analysis.inspectedMatchups.liveOpponents.length > 0 && (
                <div className="bg-[#FFF0F5] border border-[#F3D5E2] rounded-xl p-2.5 space-y-1.5">
                  <div className="text-[10.5px] font-bold text-[#E91E63] uppercase font-['Prompt'] tracking-wider">
                    VS ฝั่งตรงข้ามที่เลือกแล้ว ({analysis.inspectedMatchups.liveOpponents.length} ตัว)
                  </div>
                  <div className="space-y-1.5">
                    {analysis.inspectedMatchups.liveOpponents.map((live) => {
                      if (!live.matchup) {
                        return (
                          <div
                            key={live.oppHero}
                            className="flex items-center justify-between text-[10.5px] p-1.5 rounded-lg bg-white border border-[#F3D5E2] text-slate-600"
                          >
                            <span className="font-bold text-slate-800">{live.oppHero}</span>
                            <span className="text-slate-400 italic">No Data ในทัวร์</span>
                          </div>
                        );
                      }
                      const isAdv = live.matchup.diff > 0;
                      return (
                        <div
                          key={live.oppHero}
                          className={`flex items-center justify-between text-[11px] p-2 rounded-lg border ${
                            isAdv
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                              : 'border-rose-300 bg-rose-50 text-rose-800'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold">{live.oppHero}</span>
                            <span className="text-[9.5px] text-slate-600">
                              ({live.matchup.wins}W / {live.matchup.losses}L)
                            </span>
                          </div>
                          <div className="flex items-center gap-1 font-['Prompt'] font-bold">
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
                <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-2.5 space-y-1">
                  <div className="font-['Prompt'] text-[10.5px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                    <span>🛡️</span>
                    <span>STRONG AGAINST (ชนะทาง)</span>
                  </div>
                  {analysis.inspectedMatchups.strongAgainst.length > 0 ? (
                    <div className="space-y-1">
                      {analysis.inspectedMatchups.strongAgainst.slice(0, 3).map((m) => (
                        <div
                          key={m.opponentHero}
                          className="flex items-center justify-between text-[10.5px] text-slate-800"
                        >
                          <span className="truncate">{m.opponentHero}</span>
                          <span className="text-emerald-700 font-bold font-['Prompt'] flex-shrink-0">
                            +{m.diff.toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-400 italic">ไม่มีข้อมูลได้เปรียบเด่นชัด</div>
                  )}
                </div>

                {/* Weak Against */}
                <div className="bg-rose-50 border border-rose-300 rounded-xl p-2.5 space-y-1">
                  <div className="font-['Prompt'] text-[10.5px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1">
                    <span>⚠️</span>
                    <span>WEAK AGAINST (แพ้ทาง)</span>
                  </div>
                  {analysis.inspectedMatchups.weakAgainst.length > 0 ? (
                    <div className="space-y-1">
                      {analysis.inspectedMatchups.weakAgainst.slice(0, 3).map((m) => (
                        <div
                          key={m.opponentHero}
                          className="flex items-center justify-between text-[10.5px] text-slate-800"
                        >
                          <span className="truncate">{m.opponentHero}</span>
                          <span className="text-rose-700 font-bold font-['Prompt'] flex-shrink-0">
                            {m.diff.toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-400 italic">ไม่มีข้อมูลเสียเปรียบเด่นชัด</div>
                  )}
                </div>
              </div>

              {/* Live Synergies with Picked Allies */}
              {analysis.inspectedSynergies?.liveAllies && analysis.inspectedSynergies.liveAllies.length > 0 && (
                <div className="bg-sky-50 border border-sky-300 rounded-xl p-2.5 space-y-1.5">
                  <div className="font-['Prompt'] text-[10.5px] font-bold text-sky-800 uppercase tracking-wider flex items-center justify-between">
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
                          className="flex items-center justify-between text-[10.5px] bg-white rounded-lg px-2 py-1 border border-sky-200"
                        >
                          <span className="font-semibold text-slate-800">{live.allyHero}</span>
                          {synergy ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-500">{synergy.winRate.toFixed(1)}% WR ({synergy.games}G)</span>
                              <span
                                className={`font-['Prompt'] font-bold text-[11px] ${
                                  isPos ? 'text-emerald-700' : 'text-amber-700'
                                }`}
                              >
                                {diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">ไม่มีข้อมูลคู่หู</span>
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
          <div className="p-4 rounded-xl border border-dashed border-[#F3D5E2] bg-white text-center space-y-1 text-slate-600 shadow-2xs font-['Prompt']">
            <span className="text-xl">🔍</span>
            <div className="font-bold text-slate-800 text-xs">คลิกเลือกฮีโร่เพื่อดู Player Fit & Matchup</div>
            <div className="text-[10.5px] text-slate-500">
              คลิกฮีโร่ตัวใดก็ได้ในกระดานดราฟเพื่อวิเคราะห์ความถนัดของนักแข่งและคู่ต่อสู้
            </div>
          </div>
        )}

        {/* 5. SUGGESTED PICKS (Decision Aid for Coaches) */}
        <section className="space-y-2 border-t border-[#F3D5E2] pt-3 font-['Prompt']">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-['Prompt'] text-[13px] font-bold tracking-wider uppercase text-[#E91E63] flex items-center gap-1">
                  <span>💡</span>
                  <span>SUGGESTED PICKS (ควรพิจารณา)</span>
                </span>
                <span className="text-[9.5px] px-1.5 py-0.2 rounded-md bg-[#FFF0F5] border border-[#F3D5E2] text-[#E91E63] font-bold">
                  DECISION AID
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
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
                  className="p-2.5 rounded-xl bg-white hover:bg-[#FFF8FB] border border-[#F3D5E2] hover:border-[#E91E63] transition-all cursor-pointer shadow-xs group"
                >
                  <div className="flex items-start gap-2.5">
                    {/* Hero Avatar & Rank */}
                    <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-[#F3D5E2] flex-shrink-0 group-hover:border-[#E91E63] transition-colors shadow-2xs">
                      <img
                        src={sug.hero.avatarUrl || getHeroImageUrl(sug.hero.name)}
                        alt={sug.hero.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getHeroImageUrl(sug.hero.name);
                        }}
                      />
                      <div className="absolute top-0 left-0 bg-black/80 font-['Prompt'] text-[8.5px] font-bold px-1 text-[#fbbf24]">
                        #{idx + 1}
                      </div>
                      <div className="absolute bottom-0 right-0 bg-black/80 font-['Prompt'] text-[8px] font-bold px-1 uppercase text-white">
                        {sug.targetRole}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-['Prompt'] text-[13.5px] font-bold tracking-wide text-slate-800 group-hover:text-[#E91E63] transition-colors truncate">
                            {sug.hero.name}
                          </span>
                          <span className="text-[10.5px] text-slate-500 truncate">
                            ({sug.hero.nameTh})
                          </span>
                        </div>

                        {/* Fit Score Badge */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span
                            className={`font-['Prompt'] text-[9.5px] font-bold px-2 py-0.5 rounded-md tracking-wider ${
                              sug.confidence === 'high'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                                : 'bg-sky-50 text-sky-700 border border-sky-300'
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
                            className="text-[9.5px] px-1.5 py-0.2 rounded-md bg-[#FFF0F5] border border-[#F3D5E2] text-slate-700"
                          >
                            {r}
                          </span>
                        ))}
                        {sug.cautions.map((c, i) => (
                          <span
                            key={`c-${i}`}
                            className="text-[9.5px] px-1.5 py-0.2 rounded-md bg-rose-50 border border-rose-300 text-rose-700"
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
                            className="font-['Prompt'] text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
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
              <div className="p-3 text-center text-slate-400 text-xs italic">
                ไม่มีข้อมูลฮีโร่แนะนำสำหรับเงื่อนไขปัจจุบัน
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Footer Note */}
      <div className="p-2.5 border-t border-[#F3D5E2] bg-[#FFF8FB] text-[10px] text-slate-500 font-['Prompt'] flex items-center justify-between">
        <span className="flex items-center gap-1">
          <span>ℹ️</span>
          <span>ข้อมูลเพื่อการตัดสินใจของโค้ช (ไม่บังคับการเลือก)</span>
        </span>
        <button
          onClick={() => onSelectHeroToInspect('Nakroth')}
          className="text-[#E91E63] hover:underline font-bold"
        >
          รีเซ็ตการตรวจ
        </button>
      </div>
    </aside>
  );
};
