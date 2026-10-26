import React, { useState, useMemo } from 'react';
import { Hero } from '../types/draft';
import { Player, HeroPlayerBadge } from '../types/player';
import { PickSlotState } from '../hooks/useDraconmindDraft';
import {
  analyzeCoachDraft,
  CoachAnalysisResult,
  SmartBanItem,
} from '../services/coachAnalysisService';
import {
  evaluateDraftSafety,
  analyzeEnemyThreats,
  evaluatePlayerFitWithRoles,
  getComboFallbackAudits,
  generatePostDraftSummary,
  META_SUBSTITUTE_GUIDE,
  DraftSafetyReport,
  EnemyThreatReport,
  PlayerFitReport,
  PostDraftSummaryReport,
} from '../services/decisionSupportService';
import { getHeroImageUrl, HEROES } from '../data/heroes';
import { statsDataProvider } from '../services/statsDataProvider';
import { RPL_2026_PRO_COMPS } from '../data/proMetaComps';
import {
  X,
  Swords,
  Shield,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Ban,
  Check,
  Star,
  RefreshCw,
  Info,
  Layers,
  Crosshair,
  ExternalLink,
  Flame,
  FileText,
  AlertCircle
} from 'lucide-react';

interface UnifiedDraftAssistantProps {
  heroName: string | null;
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
  // Team Context
  blueTeamName: string;
  redTeamName: string;
  blueIsUs: boolean;
  // Players
  players: Player[];
  heroToPlayersMap: Record<string, HeroPlayerBadge[]>;
  // Interactions
  onSelectHeroToInspect: (heroName: string) => void;
  onPickHeroDirectly?: (hero: Hero) => void;
  isPickTurn?: boolean;
  isBanTurn?: boolean;
  isDraftComplete?: boolean;
  onOpenPostDraftModal?: () => void;
  matchMetadata?: {
    tournament?: string;
    match?: string;
    gameNumber?: number;
    patch?: string;
  };
}

export const UnifiedDraftAssistant: React.FC<UnifiedDraftAssistantProps> = ({
  heroName,
  onClose,
  activeTurnTeam,
  bluePicks,
  redPicks,
  blueBans,
  redBans,
  bannedHeroNames,
  pickedHeroNames,
  allHeroes,
  blueTeamName,
  redTeamName,
  blueIsUs,
  players,
  heroToPlayersMap,
  onSelectHeroToInspect,
  onPickHeroDirectly,
  isPickTurn = false,
  isBanTurn = false,
  isDraftComplete = false,
  onOpenPostDraftModal,
  matchMetadata,
}) => {
  // Collapsible state for Section 5 (Deep-Dive Stats & Synergies)
  const [isDetailsExpanded, setIsDetailsExpanded] = useState<boolean>(false);

  // 1. Team Context
  const myPicks = activeTurnTeam === 'blue' ? bluePicks : redPicks;
  const oppPicks = activeTurnTeam === 'blue' ? redPicks : bluePicks;
  const myBans = activeTurnTeam === 'blue' ? blueBans : redBans;
  const oppBans = activeTurnTeam === 'blue' ? redBans : blueBans;
  const myTeamName = activeTurnTeam === 'blue' ? blueTeamName : redTeamName;
  const oppTeamName = activeTurnTeam === 'blue' ? redTeamName : blueTeamName;

  // 2. Currently Previewed/Inspected Hero (Pure Preview - does NOT mutate draft)
  const previewHero = useMemo(() => {
    if (!heroName) return null;
    return allHeroes.find((h) => h.name.toLowerCase() === heroName.toLowerCase()) || null;
  }, [heroName, allHeroes]);

  // 3. Core Coach Analysis Engine (Preserved baseline recommendations)
  const analysis: CoachAnalysisResult = useMemo(() => {
    return analyzeCoachDraft({
      activeTeam: activeTurnTeam,
      myPicks,
      oppPicks,
      myBans,
      oppBans,
      inspectedHero: previewHero,
      players,
      heroToPlayersMap,
      allHeroes,
      bannedHeroNames,
      pickedHeroNames,
    });
  }, [
    activeTurnTeam,
    myPicks,
    oppPicks,
    myBans,
    oppBans,
    previewHero,
    players,
    heroToPlayersMap,
    allHeroes,
    bannedHeroNames,
    pickedHeroNames,
  ]);

  // 4. Decision Support: Draft Safety Check (P2)
  const draftSafetyReport: DraftSafetyReport = useMemo(() => {
    return evaluateDraftSafety(myPicks, oppPicks, heroToPlayersMap);
  }, [myPicks, oppPicks, heroToPlayersMap]);

  // 5. Decision Support: Enemy Threat Analysis (P2)
  const enemyThreatReport: EnemyThreatReport = useMemo(() => {
    return analyzeEnemyThreats(
      oppPicks,
      myPicks,
      allHeroes,
      bannedHeroNames,
      pickedHeroNames,
      oppTeamName,
      heroToPlayersMap
    );
  }, [oppPicks, myPicks, allHeroes, bannedHeroNames, pickedHeroNames, oppTeamName, heroToPlayersMap]);

  // 6. Main Recommendation Target Hero (Inspected hero if present, otherwise top calculated candidate)
  const activeFocusHero: Hero | null = useMemo(() => {
    if (previewHero) return previewHero;
    if (isBanTurn) {
      // Find top ban recommendation that is not yet banned
      const topBan = analysis.smartBans.find(
        (b) => !bannedHeroNames.has(b.hero.name) && !pickedHeroNames.has(b.hero.name)
      );
      return topBan ? topBan.hero : null;
    }
    // Pick turn: find top pick recommendation that is available
    const topPick = analysis.suggestedPicks.find(
      (p) => !bannedHeroNames.has(p.hero.name) && !pickedHeroNames.has(p.hero.name)
    );
    return topPick ? topPick.hero : null;
  }, [previewHero, isBanTurn, analysis.smartBans, analysis.suggestedPicks, bannedHeroNames, pickedHeroNames]);

  // Status of active hero (available, banned, or picked)
  const heroStatus = useMemo(() => {
    if (!activeFocusHero) return null;
    const name = activeFocusHero.name;
    const isBanned = bannedHeroNames.has(name);
    const isBluePick = bluePicks.some((p) => p.hero?.name.toLowerCase() === name.toLowerCase());
    const isRedPick = redPicks.some((p) => p.hero?.name.toLowerCase() === name.toLowerCase());

    if (isBanned) {
      return {
        label: 'ถูกแบนแล้ว (Unavailable)',
        color: 'bg-rose-50 text-rose-700 border-rose-200',
        isAvailable: false,
      };
    }
    if (isBluePick) {
      return {
        label: `เลือกแล้วโดย ${blueTeamName || 'Blue'}`,
        color: 'bg-sky-50 text-sky-700 border-sky-200',
        isAvailable: false,
      };
    }
    if (isRedPick) {
      return {
        label: `เลือกแล้วโดย ${redTeamName || 'Red'}`,
        color: 'bg-rose-50 text-rose-700 border-rose-200',
        isAvailable: false,
      };
    }
    return {
      label: 'พร้อมเลือกในดราฟต์',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      isAvailable: true,
    };
  }, [activeFocusHero, bannedHeroNames, bluePicks, redPicks, blueTeamName, redTeamName]);

  // 7. Player Fit for Active Hero (Phase P1)
  const playerFitReport: PlayerFitReport = useMemo(() => {
    if (!activeFocusHero) {
      return {
        heroName: '',
        hasComfortData: false,
        bestFitPlayer: null,
        otherPlayers: [],
        allPlayersWithHero: [],
        provenance: 'ฐานข้อมูลไลน์อัปนักแข่ง MCU',
      };
    }
    return evaluatePlayerFitWithRoles(activeFocusHero.name, players, heroToPlayersMap);
  }, [activeFocusHero, players, heroToPlayersMap]);

  // 8. Tactical Substitutes / Combo Fallback for Active Hero (Phase P1)
  const availableSubstitutes = useMemo(() => {
    if (!activeFocusHero) return [];
    const directGuides = META_SUBSTITUTE_GUIDE[activeFocusHero.name] || [];
    return directGuides
      .filter((g) => !bannedHeroNames.has(g.substitute) && !pickedHeroNames.has(g.substitute))
      .map((g) => {
        const badges = heroToPlayersMap[g.substitute] || [];
        const heroObj = allHeroes.find((h) => h.name.toLowerCase() === g.substitute.toLowerCase()) || null;
        return {
          ...g,
          heroObj,
          playersWhoPlay: badges.map((b) => ({
            nickname: b.playerNickname,
            position: b.position,
            tier: b.tier,
            starColor: b.tier === 'signature' ? ('gold' as const) : ('silver' as const),
          })),
        };
      })
      .slice(0, 3);
  }, [activeFocusHero, bannedHeroNames, pickedHeroNames, heroToPlayersMap, allHeroes]);

  // 9. Anticipated Opponent Counters from RPL 2026 Matchups
  const enemyCountersFromData = useMemo(() => {
    if (!activeFocusHero) return [];
    const matchups = statsDataProvider.getHeroMatchups(activeFocusHero.name);
    if (!matchups || !matchups.weakAgainst) return [];
    return matchups.weakAgainst
      .filter((m) => !bannedHeroNames.has(m.opponentHero) && !pickedHeroNames.has(m.opponentHero))
      .sort((a, b) => a.diff - b.diff)
      .slice(0, 3);
  }, [activeFocusHero, bannedHeroNames, pickedHeroNames]);

  // 10. Pro Stats Breakdown from Liquipedia RPL 2026 (Winter + Summer)
  const heroProStats = useMemo(() => {
    if (!activeFocusHero) return null;
    return statsDataProvider.getHeroAllSeasonsStats(activeFocusHero.name);
  }, [activeFocusHero]);

  // 11. Pro Synergies from RPL Meta Comps
  const proSynergies = useMemo(() => {
    if (!activeFocusHero) return [];
    return RPL_2026_PRO_COMPS.filter((c) =>
      c.coreHeroes.some((h) => h.toLowerCase() === activeFocusHero.name.toLowerCase())
    ).slice(0, 2);
  }, [activeFocusHero]);

  return (
    <div className="w-full h-full flex flex-col bg-white border border-[#F3D5E2] rounded-2xl shadow-xl overflow-hidden font-['Prompt'] text-slate-800 select-none">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* Assistant Header (Fixed Top)                                   */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="px-3.5 py-2.5 bg-gradient-to-r from-white via-[#FFF0F5] to-white border-b border-[#F3D5E2] flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#E91E63] text-white flex items-center justify-center shadow-xs flex-shrink-0">
            <Swords size={15} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="font-bold text-xs sm:text-[13px] text-slate-900 leading-tight">
                ผู้ช่วยดราฟต์สด
              </h2>
              <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded border ${
                isDraftComplete
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : isBanTurn
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-sky-50 text-sky-700 border-sky-200'
              }`}>
                {isDraftComplete
                  ? '🏁 สรุปดราฟต์'
                  : isBanTurn
                  ? `🔴 เทิร์น BAN (${activeTurnTeam.toUpperCase()})`
                  : `🔵 เทิร์น PICK (${activeTurnTeam.toUpperCase()})`}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 truncate">
              ตอบ 3 คำถามสำคัญ: ควรเลือก/แบนอะไร, ตัวแทนเมื่อโดนแบน, และวิธีแก้ทาง
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg bg-white hover:bg-rose-50 border border-slate-200 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer flex-shrink-0"
          title="ปิดผู้ช่วยดราฟต์"
        >
          <X size={15} />
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Scrollable Content Container (Clean, Dense, Non-bloated)        */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 space-y-3 bg-[#FFF8FB]/30 text-xs">
        {/* ========================================================= */}
        {/* SECTION 1: คำแนะนำหลัก (Main Recommendation - BAN or PICK)  */}
        {/* ========================================================= */}
        <div className="bg-white border border-[#F3D5E2] rounded-xl p-3 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[11px] text-slate-500 uppercase flex items-center gap-1.5">
              <span>{isBanTurn ? '🚫' : '🎯'}</span>
              <span>1. คำแนะนำหลัก ({isBanTurn ? 'จังหวะ BAN' : 'จังหวะ PICK'})</span>
            </span>

            {previewHero && (
              <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200" title="คลิกดูเพื่อพิจารณา ไม่เปลี่ยนสถานะดราฟต์">
                👁️ กำลังพิจารณา (Preview)
              </span>
            )}
          </div>

          {activeFocusHero ? (
            <div>
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative flex-shrink-0">
                    <img
                      src={getHeroImageUrl(activeFocusHero.name)}
                      alt={activeFocusHero.name}
                      className="w-12 h-12 rounded-xl object-cover border-2 border-[#E91E63] shadow-xs"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <span className="absolute -bottom-1 -right-1 text-[8.5px] font-black px-1 rounded bg-white border border-slate-200 text-[#E91E63] shadow-2xs">
                      {activeFocusHero.primaryPos.toUpperCase()}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-sm text-slate-900 truncate">
                        {activeFocusHero.name}
                      </h3>
                      <span className="text-[10px] text-slate-500">
                        ({activeFocusHero.nameTh})
                      </span>
                      {heroStatus && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${heroStatus.color}`}>
                          {heroStatus.label}
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                      {isBanTurn ? (
                        <span className="text-rose-700 font-medium">
                          แนะนำให้แบนเพื่อตัดกำลังคู่แข่งและลดความได้เปรียบในเลน
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-medium">
                          เข้ากับรูปแบบดราฟต์ของทีมและเสริมจุดเด่นแผนการเล่น
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Direct Pick Action if Available and Pick Turn */}
                {isPickTurn && heroStatus?.isAvailable && onPickHeroDirectly && (
                  <button
                    type="button"
                    onClick={() => onPickHeroDirectly(activeFocusHero)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#E91E63] hover:bg-[#D81B60] text-white font-bold text-[11px] shadow-xs transition-transform active:scale-95 flex items-center gap-1 cursor-pointer flex-shrink-0"
                    title={`ยืนยันเลือก ${activeFocusHero.name} เข้าช่องเทิร์นปัจจุบัน`}
                  >
                    <Check size={12} />
                    <span>เลือกตัวนี้</span>
                  </button>
                )}
              </div>

              {/* Notice that Preview mode doesn't alter draft state */}
              {previewHero && (
                <div className="mt-2 p-1.5 bg-[#FFF0F5] border border-[#F8BBD0] rounded-lg text-[10px] text-[#C2185B] flex items-center justify-between">
                  <span>💡 การคลิกดูเป็นการพิจารณาเท่านั้น ไม่ส่งผลต่อสถานะดราฟต์</span>
                  {heroName !== null && (
                    <button
                      type="button"
                      onClick={() => onSelectHeroToInspect('')}
                      className="text-[9.5px] font-bold underline hover:text-black cursor-pointer"
                    >
                      ยกเลิกพิจารณา
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 text-center text-slate-400 text-xs italic">
              ไม่มีฮีโร่แนะนำที่พร้อมใช้งาน (ฮีโร่ส่วนใหญ่ถูกแบนหรือเลือกแล้ว)
            </div>
          )}

          {/* Alternative Quick Recommendations Row */}
          {!previewHero && (
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {isBanTurn ? 'เป้าหมายแบนทางเลือก:' : 'ตัวเลือกอันดับรอง:'}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {(isBanTurn ? analysis.smartBans : analysis.suggestedPicks)
                  .filter(
                    (item) =>
                      !bannedHeroNames.has(item.hero.name) &&
                      !pickedHeroNames.has(item.hero.name) &&
                      item.hero.name !== activeFocusHero?.name
                  )
                  .slice(0, 3)
                  .map((item) => (
                    <button
                      key={item.hero.id}
                      type="button"
                      onClick={() => onSelectHeroToInspect(item.hero.name)}
                      className="flex items-center gap-1 pl-1 pr-2 py-0.5 rounded-lg bg-slate-50 hover:bg-[#FFF0F5] border border-slate-200 hover:border-[#E91E63] text-slate-700 font-bold text-[10.5px] cursor-pointer transition-colors shadow-2xs"
                    >
                      <img
                        src={getHeroImageUrl(item.hero.name)}
                        alt={item.hero.name}
                        className="w-3.5 h-3.5 rounded object-cover"
                      />
                      <span>{item.hero.name}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* SECTION 2: ผู้เล่นที่เหมาะสม (Player Fit)                   */}
        {/* ========================================================= */}
        <div className="bg-white border border-[#F3D5E2] rounded-xl p-3 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[11px] text-slate-500 uppercase flex items-center gap-1.5">
              <span>👤</span>
              <span>2. ผู้เล่นที่เหมาะสม (ใครเล่นได้ดีที่สุด?)</span>
            </span>
            <span className="text-[10px] text-slate-400">MCU Roster Pool</span>
          </div>

          {playerFitReport.bestFitPlayer ? (
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-[#FFF8FB] to-white border border-[#F48FB1] space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#E91E63] text-white flex items-center justify-center font-black text-xs shadow-2xs">
                    {playerFitReport.bestFitPlayer.player.nickname.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-xs text-slate-900">
                        {playerFitReport.bestFitPlayer.player.nickname}
                      </h4>
                      <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-white border border-slate-200 text-slate-700">
                        {playerFitReport.bestFitPlayer.player.playerRole}
                      </span>
                      <span
                        className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded border ${
                          playerFitReport.bestFitPlayer.player.tier === 'signature'
                            ? 'bg-[#FEF3C7] text-[#B45309] border-[#F59E0B]'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        {playerFitReport.bestFitPlayer.player.tier === 'signature'
                          ? '⭐ ถนัด (ดาวทอง)'
                          : '⭐ พอเล่นได้ (ดาวเงิน)'}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-500">
                      {playerFitReport.bestFitPlayer.player.playerName}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {playerFitReport.bestFitPlayer.player.roleFit === 'on_role'
                    ? 'ตรงตำแหน่ง'
                    : 'Flex Pick'}
                </span>
              </div>

              {/* Other players with this hero */}
              {playerFitReport.otherPlayers.length > 0 && (
                <div className="pt-1.5 border-t border-slate-100 flex items-center gap-1 text-[10px] text-slate-500 flex-wrap">
                  <span>ผู้เล่นคนอื่นที่เล่นได้:</span>
                  {playerFitReport.otherPlayers.map((op) => (
                    <span
                      key={op.playerId}
                      className="px-1.5 py-0.2 rounded bg-slate-50 border border-slate-200 text-slate-700 font-semibold"
                    >
                      {op.nickname} ({op.tier === 'signature' ? '⭐ ถนัด' : '⭐ พอเล่นได้'})
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-600 flex-shrink-0" />
              <span>
                ไม่มีผู้เล่นในทีม MCU ที่ระบุฮีโร่นี้ใน Hero Pool (อาจต้องใช้เป็นตัวดราฟต์แก้ทางเฉพาะหน้า)
              </span>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* SECTION 3: ตัวเลือกสำรอง (Substitutes / Combo Fallback)     */}
        {/* ========================================================= */}
        <div className="bg-white border border-[#F3D5E2] rounded-xl p-3 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[11px] text-slate-500 uppercase flex items-center gap-1.5">
              <span>🔄</span>
              <span>3. ตัวเลือกสำรอง (ถ้าตัวที่ต้องการโดนแบน?)</span>
            </span>
            <span className="text-[10px] text-slate-400">Combo Fallback</span>
          </div>

          {availableSubstitutes.length > 0 ? (
            <div className="space-y-1.5">
              {availableSubstitutes.map((sub, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-[#FFF0F5] border border-slate-200 hover:border-[#F48FB1] transition-all flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectHeroToInspect(sub.substitute)}
                      className="flex items-center gap-1.5 text-left cursor-pointer group"
                    >
                      <img
                        src={getHeroImageUrl(sub.substitute)}
                        alt={sub.substitute}
                        className="w-5 h-5 rounded object-cover shadow-2xs"
                      />
                      <span className="font-bold text-xs text-slate-900 group-hover:text-[#E91E63]">
                        {sub.substitute}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-200">
                        {sub.effectiveness}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectHeroToInspect(sub.substitute)}
                      className="text-[10px] font-bold text-[#E91E63] hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>พิจารณาตัวนี้</span>
                      <ArrowRight size={10} />
                    </button>
                  </div>

                  <p className="text-[10.5px] text-slate-500 leading-snug">
                    {sub.tradeOff}
                  </p>

                  {/* Players who play this substitute */}
                  {sub.playersWhoPlay.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <span>ผู้เล่น MCU:</span>
                      {sub.playersWhoPlay.map((pl, pIdx) => (
                        <span
                          key={pIdx}
                          className="px-1 rounded bg-white border border-slate-200 text-slate-700 font-semibold"
                        >
                          {pl.nickname} ({pl.tier === 'signature' ? '⭐ ถนัด' : '⭐ พอเล่นได้'})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-[11px] text-center">
              ไม่มีคู่มือตัวทดแทนโดยตรงสำหรับฮีโร่นี้ในฐานข้อมูล Heuristics
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* SECTION 4: จุดเสี่ยงและแนวทางรับมือ (Threats & Draft Safety)*/}
        {/* ========================================================= */}
        <div className="bg-white border border-[#F3D5E2] rounded-xl p-3 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[11px] text-slate-500 uppercase flex items-center gap-1.5">
              <span>⚠️</span>
              <span>4. จุดเสี่ยงและแนวทางรับมือ (คู่แข่งแก้ทางอย่างไร?)</span>
            </span>
            <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded border ${
              draftSafetyReport.status === 'critical'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : draftSafetyReport.status === 'caution'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              Safety: {draftSafetyReport.summaryBadge}
            </span>
          </div>

          {/* Anticipated Enemy Counters */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              ฮีโร่ที่คู่แข่งมักหยิบมาแก้ทาง (จากสถิติ RPL 2026):
            </span>
            {enemyCountersFromData.length > 0 ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                {enemyCountersFromData.map((counter, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1 pl-1 pr-1.5 py-0.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-bold text-[10.5px]"
                  >
                    <img
                      src={getHeroImageUrl(counter.opponentHero)}
                      alt={counter.opponentHero}
                      className="w-3.5 h-3.5 rounded object-cover"
                    />
                    <span>{counter.opponentHero}</span>
                    <span className="text-[9.5px] text-rose-600 font-normal">
                      (ชนะเรา {Math.abs(counter.diff).toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10.5px] text-slate-400 italic">
                ไม่มีข้อมูลประวัติการแก้ทางที่เป็นอันตรายโดยตรงในทัวร์นาเมนต์นี้
              </p>
            )}
          </div>

          {/* Draft Safety & Team Balance Check */}
          <div className="pt-2 border-t border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              สถานะความปลอดภัยของทีมเรา:
            </span>

            {draftSafetyReport.topWarnings.length > 0 ? (
              <div className="space-y-1">
                {draftSafetyReport.topWarnings.slice(0, 2).map((w) => (
                  <div
                    key={w.id}
                    className="p-1.5 rounded-lg bg-amber-50/70 border border-amber-200 text-[10.5px] text-amber-900"
                  >
                    <div className="font-bold flex items-center gap-1">
                      <span>⚠️</span>
                      <span>{w.title}</span>
                    </div>
                    <div className="text-slate-600 mt-0.5">{w.suggestion}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-1.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-[10.5px] text-emerald-800 flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={13} className="text-emerald-600" />
                <span>โครงสร้างดราฟต์มีความสมดุลทั้งดาเมจและการคอนโทรลเลน</span>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 5: รายละเอียดเพิ่มเติม (Expand / Collapse)          */}
        {/* ========================================================= */}
        <div className="bg-white border border-[#F3D5E2] rounded-xl overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
            className="w-full px-3 py-2 bg-gradient-to-r from-white via-[#FFF0F5] to-white hover:bg-[#FFF0F5] flex items-center justify-between text-left cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-1.5 font-bold text-[11px] text-slate-700">
              <FileText size={13} className="text-[#E91E63]" />
              <span>5. รายละเอียดเพิ่มเติม & สถิติจริงจาก Liquipedia 2026</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-[#E91E63] font-bold">
              <span>{isDetailsExpanded ? 'ย่อข้อมูล' : 'ขยายดูสถิติ'}</span>
              {isDetailsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>
          </button>

          {isDetailsExpanded && (
            <div className="p-3 border-t border-slate-100 space-y-3 bg-[#FFF8FB]/40 animate-in fade-in duration-150">
              {/* Liquipedia RPL 2026 Season Stats */}
              {heroProStats && heroProStats.hasAnyData ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-bold text-slate-600">
                      สถิติทางการ RoV Pro League 2026 (Winter + Summer):
                    </span>
                    <span className="text-[9.5px] text-slate-400">Liquipedia Verified</span>
                  </div>

                  {heroProStats.combined ? (
                    <div className="grid grid-cols-4 gap-1.5 text-center">
                      <div className="p-1.5 bg-white border border-slate-200 rounded-lg">
                        <div className="font-bold text-xs text-slate-800">
                          {heroProStats.combined.games}
                        </div>
                        <div className="text-[9.5px] text-slate-400">แมตช์ที่เล่น</div>
                      </div>
                      <div className="p-1.5 bg-white border border-slate-200 rounded-lg">
                        <div className="font-bold text-xs text-emerald-600">
                          {heroProStats.combined.winRate.toFixed(1)}%
                        </div>
                        <div className="text-[9.5px] text-slate-400">Win Rate</div>
                      </div>
                      <div className="p-1.5 bg-white border border-slate-200 rounded-lg">
                        <div className="font-bold text-xs text-[#0284C7]">
                          {heroProStats.combined.pickRate.toFixed(1)}%
                        </div>
                        <div className="text-[9.5px] text-slate-400">Pick Rate</div>
                      </div>
                      <div className="p-1.5 bg-white border border-slate-200 rounded-lg">
                        <div className="font-bold text-xs text-[#E91E63]">
                          {heroProStats.combined.banRate.toFixed(1)}%
                        </div>
                        <div className="text-[9.5px] text-slate-400">Ban Rate</div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 rounded bg-white border border-slate-200 text-slate-400 text-center text-[10.5px]">
                      ไม่มีข้อมูลรวมสถิติในฤดูกาล 2026
                    </div>
                  )}

                  {/* 2-Season Breakdown Table */}
                  <div className="bg-white border border-slate-200 rounded-lg p-2 text-[10.5px] space-y-1">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>• Winter 2026:</span>
                      <span className="font-bold text-slate-800">
                        {heroProStats.winter
                          ? `${heroProStats.winter.games} เกม (Win Rate ${heroProStats.winter.winRate.toFixed(1)}%)`
                          : 'ไม่มีข้อมูลใน Winter 2026'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>• Summer 2026:</span>
                      <span className="font-bold text-slate-800">
                        {heroProStats.summer
                          ? `${heroProStats.summer.games} เกม (Win Rate ${heroProStats.summer.winRate.toFixed(1)}%)`
                          : 'ไม่มีข้อมูลใน Summer 2026'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-2 rounded bg-white border border-slate-200 text-slate-400 text-center text-[10.5px]">
                  ไม่มีสถิติการเล่นฮีโร่นี้ในบันทึกทางการ RPL 2026
                </div>
              )}

              {/* Pro Synergies & Comps */}
              {proSynergies.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    คอมโบโปรลีกที่พบบ่อย (RPL Pro Comps):
                  </span>
                  {proSynergies.map((comp) => (
                    <div
                      key={comp.id}
                      className="p-2 bg-white border border-slate-200 rounded-lg text-[10.5px] space-y-0.5"
                    >
                      <div className="font-bold text-slate-900">{comp.nameTh}</div>
                      <div className="text-slate-500 line-clamp-2">{comp.tacticalDescription}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Data Integrity Notice */}
              <div className="text-[9.5px] text-slate-400 leading-normal border-t border-slate-100 pt-1.5 flex items-start gap-1">
                <Info size={11} className="text-slate-400 flex-shrink-0 mt-0.5" />
                <span>
                  สถิติตัวเลขดึงจาก Liquipedia RPL 2026 จริง โดยแยกออกจากข้อวิเคราะห์และคำแนะนำเชิงกลยุทธ์ของโค้ชอย่างเข้มงวด
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
