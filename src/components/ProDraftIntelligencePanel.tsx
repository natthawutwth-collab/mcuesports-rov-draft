import React, { useState, useMemo } from 'react';
import { Hero, TeamSide } from '../types/draft';
import { Player, HeroPlayerBadge } from '../types/player';
import { PickSlotState } from '../hooks/useDraconmindDraft';
import { statsDataProvider } from '../services/statsDataProvider';
import { HeroMatchup, HeroSynergy, ActiveSeasonKey } from '../types/stats';
import { getHeroImageUrl } from '../data/heroes';
import { RPL_2026_PRO_COMPS, ProMetaComp } from '../data/proMetaComps';
import { SmartBanItem } from '../services/coachAnalysisService';
import {
  Swords,
  Users,
  Ban,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Info,
  Star,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export type IntelligenceTabKey = 'matchups' | 'synergy' | 'ban_assistant' | 'pro_comps';

export interface ProDraftIntelligencePanelProps {
  // Focus Hero (selected or previewed)
  focusHero: Hero | null;
  // Draft State
  isBanTurn: boolean;
  isPickTurn: boolean;
  activeTurnTeam: TeamSide;
  isDraftComplete: boolean;
  bannedHeroNames: Set<string>;
  pickedHeroNames: Set<string>;
  bluePicks: PickSlotState[];
  redPicks: PickSlotState[];
  blueBans: (Hero | null)[];
  redBans: (Hero | null)[];
  // Team Context
  blueTeamName: string;
  redTeamName: string;
  blueIsUs: boolean;
  // Recommendation inputs
  smartBans: SmartBanItem[];
  allHeroes: Hero[];
  players: Player[];
  heroToPlayersMap: Record<string, HeroPlayerBadge[]>;
  onSelectHeroToInspect: (heroName: string) => void;
  onPickHeroDirectly?: (hero: Hero) => void;
}

export const ProDraftIntelligencePanel: React.FC<ProDraftIntelligencePanelProps> = ({
  focusHero,
  isBanTurn,
  isPickTurn,
  activeTurnTeam,
  isDraftComplete,
  bannedHeroNames,
  pickedHeroNames,
  bluePicks,
  redPicks,
  blueBans,
  redBans,
  blueTeamName,
  redTeamName,
  blueIsUs,
  smartBans,
  allHeroes,
  players,
  heroToPlayersMap,
  onSelectHeroToInspect,
  onPickHeroDirectly,
}) => {
  // Active Tab: default to 'ban_assistant' if ban turn, otherwise 'matchups'
  const [activeTab, setActiveTab] = useState<IntelligenceTabKey>(() =>
    isBanTurn ? 'ban_assistant' : 'matchups'
  );

  // Stats Provider active season
  const activeSeason = statsDataProvider.getActiveSeason();
  const statsStatus = statsDataProvider.getStatus();

  // Active Team Picks & Enemy Picks
  const myPicks = activeTurnTeam === 'blue' ? bluePicks : redPicks;
  const oppPicks = activeTurnTeam === 'blue' ? redPicks : bluePicks;
  const myTeamName = activeTurnTeam === 'blue' ? blueTeamName : redTeamName;
  const oppTeamName = activeTurnTeam === 'blue' ? redTeamName : blueTeamName;

  const validOppHeroNames = useMemo(() => {
    return oppPicks.map((p) => p.hero?.name).filter((n): n is string => Boolean(n));
  }, [oppPicks]);

  // Season label in Thai
  const seasonLabel = useMemo(() => {
    if (activeSeason === 'summer_2026') return 'RPL 2026 Summer';
    if (activeSeason === 'winter_2026') return 'RPL 2026 Winter';
    return 'RPL 2026 Combined (Summer & Winter)';
  }, [activeSeason]);

  // =========================================================================
  // CATEGORY 1: ชนะทาง / แพ้ทาง (Matchups - Max 5 each for Advantage & Caution)
  // =========================================================================
  const matchupData = useMemo(() => {
    if (!focusHero) return null;

    const heroName = focusHero.name;
    const rawMatchups = statsDataProvider.getHeroMatchups(heroName);

    // Live enemy cross-reference
    const liveOppMatchups = statsDataProvider.getLiveDraftMatchups(heroName, validOppHeroNames);

    if (!rawMatchups) {
      return {
        hasData: false,
        strongAgainst: [],
        weakAgainst: [],
        liveOppMatchups,
      };
    }

    // Filter available or relevant heroes, sorted by reliability (games count >= 3 preferred)
    const strong = rawMatchups.strongAgainst
      .filter((m) => !bannedHeroNames.has(m.opponentHero) && !pickedHeroNames.has(m.opponentHero))
      .sort((a, b) => {
        // Sort by reliability score: games * diff weight
        const scoreA = a.games * Math.max(1, a.diff);
        const scoreB = b.games * Math.max(1, b.diff);
        return scoreB - scoreA;
      })
      .slice(0, 5);

    const weak = rawMatchups.weakAgainst
      .filter((m) => !bannedHeroNames.has(m.opponentHero) && !pickedHeroNames.has(m.opponentHero))
      .sort((a, b) => {
        // Sort by highest danger (most negative diff with solid games)
        const scoreA = a.games * Math.abs(a.diff);
        const scoreB = b.games * Math.abs(b.diff);
        return scoreB - scoreA;
      })
      .slice(0, 5);

    return {
      hasData: strong.length > 0 || weak.length > 0,
      strongAgainst: strong,
      weakAgainst: weak,
      liveOppMatchups,
    };
  }, [focusHero, validOppHeroNames, bannedHeroNames, pickedHeroNames]);

  // =========================================================================
  // CATEGORY 2: เล่นคู่กับตัวไหนแล้วดี (Synergies - Max 5)
  // =========================================================================
  const synergyData = useMemo(() => {
    if (!focusHero) return [];

    const heroName = focusHero.name;
    const list = statsDataProvider.getHeroPlayedWith(heroName);

    if (!list || list.length === 0) {
      // Fallback to Pro Meta Comps tactical partners if no pairwise stat in Liquipedia
      const matchingComps = RPL_2026_PRO_COMPS.filter((c) =>
        c.coreHeroes.some((h) => h.toLowerCase() === heroName.toLowerCase())
      );

      const tacticalPartners: Array<{
        allyHero: string;
        reason: string;
        isProVerified: boolean;
        games?: number;
        winRate?: number;
        playersWhoPlay: HeroPlayerBadge[];
      }> = [];

      matchingComps.forEach((comp) => {
        comp.coreHeroes.forEach((h) => {
          if (
            h.toLowerCase() !== heroName.toLowerCase() &&
            !bannedHeroNames.has(h) &&
            !pickedHeroNames.has(h) &&
            !tacticalPartners.some((p) => p.allyHero.toLowerCase() === h.toLowerCase())
          ) {
            tacticalPartners.push({
              allyHero: h,
              reason: `คอมโบแผน ${comp.nameTh} (${comp.tacticalDescription.slice(0, 60)}...)`,
              isProVerified: false,
              playersWhoPlay: heroToPlayersMap[h] || [],
            });
          }
        });
      });

      return tacticalPartners.slice(0, 5);
    }

    // Filter available partners & sort by games and win rate
    return list
      .filter((s) => !bannedHeroNames.has(s.allyHero) && !pickedHeroNames.has(s.allyHero))
      .sort((a, b) => {
        const scoreA = a.games * (a.winRate / 100);
        const scoreB = b.games * (b.winRate / 100);
        return scoreB - scoreA;
      })
      .slice(0, 5)
      .map((s) => {
        // Tactical explanation based on ally hero attributes
        let reason = 'ประสานจังหวะไฟต์และเดินเกมตามไทม์มิ่ง';
        if (s.winRate >= 60) {
          reason = `คอมโบคู่หูอัตราชนะสูง ${s.winRate.toFixed(1)}% เสริมจุดเด่นทีมไฟต์`;
        } else if ((s.diff ?? 0) > 0) {
          reason = `เพิ่มประสิทธิผลการเล่นร่วมกัน +${(s.diff ?? 0).toFixed(1)}% จากค่าเฉลี่ย`;
        }

        return {
          allyHero: s.allyHero,
          reason,
          isProVerified: true,
          games: s.games,
          winRate: s.winRate,
          diff: s.diff,
          playersWhoPlay: heroToPlayersMap[s.allyHero] || [],
        };
      });
  }, [focusHero, bannedHeroNames, pickedHeroNames, heroToPlayersMap]);

  // =========================================================================
  // CATEGORY 3: ควรแบนตัวไหน (Real-time Ban Assistant - Max 5)
  // =========================================================================
  const banRecommendations = useMemo(() => {
    // Strictly exclude already banned or picked heroes
    const availableBans = smartBans.filter(
      (b) => !bannedHeroNames.has(b.hero.name) && !pickedHeroNames.has(b.hero.name)
    );

    return availableBans.slice(0, 5).map((ban, idx, arr) => {
      const stats = statsDataProvider.getHeroStats(ban.hero.name);
      const nextAlternative = arr[idx + 1] ? arr[idx + 1].hero.name : null;

      // Priority mapping
      let priorityBadge = {
        label: 'สูง (Must Ban)',
        color: 'bg-rose-50 text-rose-700 border-rose-300',
        dot: '🔴',
      };
      if (ban.priority === 'high_priority') {
        priorityBadge = {
          label: 'กลาง (High Priority)',
          color: 'bg-amber-50 text-amber-700 border-amber-300',
          dot: '🟡',
        };
      } else if (ban.priority === 'situational') {
        priorityBadge = {
          label: 'ตามสถานการณ์',
          color: 'bg-slate-100 text-slate-700 border-slate-300',
          dot: '⚪',
        };
      }

      return {
        hero: ban.hero,
        priority: ban.priority,
        priorityBadge,
        reason: ban.reason,
        categoryLabel: ban.categoryLabel,
        stats: stats
          ? {
              games: stats.games,
              banRate: stats.banRate,
              pickRate: stats.pickRate,
              presenceRate: stats.presenceRate,
              winRate: stats.winRate,
            }
          : null,
        nextAlternative,
      };
    });
  }, [smartBans, bannedHeroNames, pickedHeroNames]);

  // =========================================================================
  // CATEGORY 4: Combo ยอดนิยม (Pro Meta Comps - Max 5)
  // =========================================================================
  const popularComps = useMemo(() => {
    // Sort pro meta comps by real viability and presence in draft
    return RPL_2026_PRO_COMPS.slice(0, 5).map((comp) => {
      // Check if pieces are banned or picked
      const bannedPieces = comp.coreHeroes.filter((h) => bannedHeroNames.has(h));
      const pickedByUsPieces = comp.coreHeroes.filter((h) =>
        myPicks.some((p) => p.hero?.name.toLowerCase() === h.toLowerCase())
      );
      const pickedByOppPieces = comp.coreHeroes.filter((h) =>
        oppPicks.some((p) => p.hero?.name.toLowerCase() === h.toLowerCase())
      );
      const isCompBroken = bannedPieces.length > 0 || pickedByOppPieces.length > 0;

      // Calculate paired stats from dataset if available
      let totalGamesCombined = 0;
      let totalWinsCombined = 0;
      let hasProStat = false;

      if (comp.coreHeroes.length >= 2) {
        const pairSynergy = statsDataProvider.getHeroSynergyPair(
          comp.coreHeroes[0],
          comp.coreHeroes[1]
        );
        if (pairSynergy && pairSynergy.games > 0) {
          totalGamesCombined = pairSynergy.games;
          totalWinsCombined = pairSynergy.wins;
          hasProStat = true;
        }
      }

      return {
        comp,
        isCompBroken,
        bannedPieces,
        pickedByUsPieces,
        pickedByOppPieces,
        hasProStat,
        totalGamesCombined,
        totalWinsCombined,
        winRate:
          totalGamesCombined > 0
            ? ((totalWinsCombined / totalGamesCombined) * 100).toFixed(1)
            : null,
      };
    });
  }, [bannedHeroNames, pickedHeroNames, myPicks, oppPicks]);

  // Current Active Focus Hero display
  const focusHeroStatus = useMemo(() => {
    if (!focusHero) return null;
    const name = focusHero.name;
    const isBanned = bannedHeroNames.has(name);
    const isPicked = pickedHeroNames.has(name);

    if (isBanned) return { label: 'ถูกแบนแล้ว (Unavailable)', color: 'text-rose-600 bg-rose-50 border-rose-200' };
    if (isPicked) return { label: 'ถูกเลือกแล้ว (Picked)', color: 'text-sky-600 bg-sky-50 border-sky-200' };
    return { label: 'พร้อมเลือก/แบน (Available)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  }, [focusHero, bannedHeroNames, pickedHeroNames]);

  return (
    <div className="w-full flex flex-col bg-white border border-[#F3D5E2] rounded-2xl shadow-xl overflow-hidden font-['Prompt'] text-slate-800 select-none">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. TOP HEADER & ACTIVE SEASON BADGE                           */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="p-3 bg-gradient-to-r from-white via-[#FFF0F5] to-white border-b border-[#F3D5E2] flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#E91E63] to-[#D81B60] text-white flex items-center justify-center shadow-xs flex-shrink-0">
            <Sparkles size={14} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-xs text-slate-900 leading-tight">
                Pro Draft Intelligence Panel
              </h3>
              <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-[#FCE4EC] text-[#E91E63] border border-[#F8BBD0]">
                4 หมวดวิเคราะห์
              </span>
            </div>
            <p className="text-[10px] text-slate-500 truncate flex items-center gap-1">
              <span>{seasonLabel}</span>
              <span>•</span>
              <span>อัปเดต: {statsStatus.lastUpdated || '2026-10-23'} ({statsStatus.totalGames} เกม)</span>
            </p>
          </div>
        </div>

        {/* Turn Status Pill */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <span
            className={`text-[9.5px] font-bold px-2 py-0.5 rounded-lg border ${
              isDraftComplete
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : isBanTurn
                ? 'bg-rose-50 text-rose-800 border-rose-300'
                : 'bg-sky-50 text-sky-800 border-sky-300'
            }`}
          >
            {isDraftComplete
              ? 'ดราฟต์เสร็จสิ้น'
              : isBanTurn
              ? `🔴 BAN เทิร์น (${activeTurnTeam.toUpperCase()})`
              : `🔵 PICK เทิร์น (${activeTurnTeam.toUpperCase()})`}
          </span>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. TOP ACTION CARD: คำแนะนำสำคัญตอนนี้ (Immediate Guidance)     */}
      {/* ───────────────────────────────────────────────────────────── */}
      {focusHero && (
        <div className="px-3 pt-2.5 pb-2 bg-[#FFF8FB] border-b border-[#F3D5E2] flex items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative flex-shrink-0">
              <img
                src={getHeroImageUrl(focusHero.name)}
                alt={focusHero.name}
                className="w-9 h-9 rounded-lg object-cover border border-[#E91E63] shadow-2xs"
              />
              <span className="absolute -bottom-1 -right-1 text-[8px] font-black px-1 rounded bg-white text-[#E91E63] border border-slate-200">
                {focusHero.primaryPos.toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-slate-900 truncate">{focusHero.name}</span>
                <span className="text-[10px] text-slate-500 truncate">({focusHero.nameTh})</span>
                {focusHeroStatus && (
                  <span className={`text-[8.5px] font-semibold px-1.5 py-0.2 rounded border ${focusHeroStatus.color}`}>
                    {focusHeroStatus.label}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-600 truncate">
                {isBanTurn ? (
                  <span className="text-rose-700 font-semibold">แนะนำพิจารณาแบนตัดกำลังคู่แข่ง</span>
                ) : (
                  <span className="text-emerald-700 font-semibold">แนะนำพิจารณาเลือกเข้าคอมพ์ทีม</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Pick / Inspect Action */}
          {isPickTurn && !bannedHeroNames.has(focusHero.name) && !pickedHeroNames.has(focusHero.name) && onPickHeroDirectly && (
            <button
              type="button"
              onClick={() => onPickHeroDirectly(focusHero)}
              className="px-2.5 py-1 bg-[#E91E63] hover:bg-[#D81B60] text-white text-[10.5px] font-bold rounded-lg shadow-2xs cursor-pointer flex items-center gap-1 transition-all flex-shrink-0"
            >
              <span>เลือกตัวนี้</span>
            </button>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. 4-CATEGORY SEGMENTED TABS                                   */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 p-1.5 bg-[#FFF0F5]/50 border-b border-[#F3D5E2] gap-1 flex-shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('matchups')}
          className={`py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-0.5 border ${
            activeTab === 'matchups'
              ? 'bg-[#E91E63] text-white border-[#C2185B] shadow-xs'
              : 'bg-white text-slate-700 hover:text-[#E91E63] hover:bg-white/80 border-[#F3D5E2]'
          }`}
          title="หมวด 1: ชนะทาง / แพ้ทาง (5 ตัว)"
        >
          <Swords size={12} />
          <span className="truncate leading-tight">1. ชนะ/แพ้ทาง</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('synergy')}
          className={`py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-0.5 border ${
            activeTab === 'synergy'
              ? 'bg-[#E91E63] text-white border-[#C2185B] shadow-xs'
              : 'bg-white text-slate-700 hover:text-[#E91E63] hover:bg-white/80 border-[#F3D5E2]'
          }`}
          title="หมวด 2: เล่นคู่กับตัวไหนแล้วดี (5 ตัว)"
        >
          <Users size={12} />
          <span className="truncate leading-tight">2. เล่นคู่กันดี</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ban_assistant')}
          className={`py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-0.5 border ${
            activeTab === 'ban_assistant'
              ? 'bg-[#E91E63] text-white border-[#C2185B] shadow-xs'
              : 'bg-white text-slate-700 hover:text-[#E91E63] hover:bg-white/80 border-[#F3D5E2]'
          }`}
          title="หมวด 3: ควรแบนตัวไหน (Real-time Ban Assistant)"
        >
          <Ban size={12} />
          <span className="truncate leading-tight">3. ควรแบนตัวไหน</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pro_comps')}
          className={`py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-0.5 border ${
            activeTab === 'pro_comps'
              ? 'bg-[#E91E63] text-white border-[#C2185B] shadow-xs'
              : 'bg-white text-slate-700 hover:text-[#E91E63] hover:bg-white/80 border-[#F3D5E2]'
          }`}
          title="หมวด 4: Combo ยอดนิยม (Pro Comps)"
        >
          <Flame size={12} />
          <span className="truncate leading-tight">4. Combo ยอดนิยม</span>
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. ACTIVE TAB CONTENT BODY                                    */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 space-y-3 text-xs bg-[#FFF8FB]/30">

        {/* ========================================================= */}
        {/* TAB 1: ชนะทาง / แพ้ทาง (Matchups)                          */}
        {/* ========================================================= */}
        {activeTab === 'matchups' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            {/* Live Cross-reference with enemy picked heroes */}
            {validOppHeroNames.length > 0 && focusHero && (
              <div className="p-2.5 rounded-xl bg-white border border-[#F3D5E2] shadow-2xs space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  ประจันหน้ากับฮีโร่คู่แข่งที่หยิบแล้ว ({validOppHeroNames.length} ตัว):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {validOppHeroNames.map((oppName, idx) => {
                    const h2h = statsDataProvider.getHeadToHead(focusHero.name, oppName);
                    return (
                      <div
                        key={idx}
                        className="p-1.5 rounded-lg bg-[#FFF8FB] border border-[#F3D5E2] flex items-center justify-between text-[11px]"
                      >
                        <div className="flex items-center gap-1.5">
                          <img
                            src={getHeroImageUrl(oppName)}
                            alt={oppName}
                            className="w-5 h-5 rounded object-cover border border-slate-200"
                          />
                          <span className="font-bold text-slate-800">{oppName}</span>
                        </div>
                        {h2h ? (
                          <span
                            className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                              h2h.diff > 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : h2h.diff < 0
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {h2h.diff > 0 ? `+${h2h.diff.toFixed(1)}%` : `${h2h.diff.toFixed(1)}%`} ({h2h.games} เกม)
                          </span>
                        ) : (
                          <span className="text-[9.5px] text-slate-400 italic">ยังไม่มีสถิติ H2H</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sub-section: 🟢 ชนะทาง (Advantage - Max 5) */}
            <div className="p-3 bg-white border border-emerald-200 rounded-xl shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span className="font-bold text-xs text-emerald-900">
                    🟢 ได้เปรียบ / ชนะทาง (Advantage Matchups)
                  </span>
                </div>
                <span className="text-[9.5px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  สูงสุด 5 ตัว
                </span>
              </div>

              {matchupData && matchupData.strongAgainst.length > 0 ? (
                <div className="space-y-1.5">
                  {matchupData.strongAgainst.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-emerald-50/40 border border-emerald-100 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-black text-emerald-700 text-[10px] w-3.5">{idx + 1}</span>
                        <img
                          src={getHeroImageUrl(item.opponentHero)}
                          alt={item.opponentHero}
                          className="w-6 h-6 rounded-md object-cover border border-emerald-300 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 text-xs block truncate">
                            {item.opponentHero}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            สถิติจริง: ชนะ {item.winRate.toFixed(1)}% ({item.games} เกม, ชนะ {item.wins}/แพ้ {item.losses})
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectHeroToInspect(item.opponentHero)}
                        className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 px-2 py-1 rounded bg-white border border-emerald-200 cursor-pointer flex-shrink-0"
                      >
                        พิจารณา
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center text-slate-500 text-[11px]">
                  ยังไม่มีสถิติการเจอกันโดยตรงที่มีความได้เปรียบเด่นชัดใน {seasonLabel}
                </div>
              )}
            </div>

            {/* Sub-section: 🔴 ต้องระวัง / เสียเปรียบ (Caution - Max 5) */}
            <div className="p-3 bg-white border border-rose-200 rounded-xl shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldAlert size={14} className="text-rose-600" />
                  <span className="font-bold text-xs text-rose-900">
                    🔴 ต้องระวัง / เสียเปรียบ (Threats & Disadvantage)
                  </span>
                </div>
                <span className="text-[9.5px] text-rose-700 font-semibold bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                  สูงสุด 5 ตัว
                </span>
              </div>

              {matchupData && matchupData.weakAgainst.length > 0 ? (
                <div className="space-y-1.5">
                  {matchupData.weakAgainst.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-rose-50/40 border border-rose-100 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-black text-rose-700 text-[10px] w-3.5">{idx + 1}</span>
                        <img
                          src={getHeroImageUrl(item.opponentHero)}
                          alt={item.opponentHero}
                          className="w-6 h-6 rounded-md object-cover border border-rose-300 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 text-xs block truncate">
                            {item.opponentHero}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            สถิติจริง: เสียเปรียบ {(item.diff).toFixed(1)}% (แพ้ทางใน {item.games} เกม)
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectHeroToInspect(item.opponentHero)}
                        className="text-[10px] font-bold text-rose-700 hover:text-rose-900 px-2 py-1 rounded bg-white border border-rose-200 cursor-pointer flex-shrink-0"
                      >
                        พิจารณา
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center text-slate-500 text-[11px]">
                  ยังไม่มีสถิติการเจอกันโดยตรงที่ระบุว่าเสียเปรียบใน {seasonLabel}
                </div>
              )}
            </div>

            {/* Data Integrity Footer Notice */}
            <div className="p-2 bg-[#FFF8FB] border border-[#F3D5E2] rounded-lg text-[9.5px] text-slate-500 leading-normal flex items-start gap-1.5">
              <Info size={12} className="text-[#E91E63] flex-shrink-0 mt-0.5" />
              <span>
                สถิติ Matchup ดึงจาก Liquipedia RPL 2026 จริงโดยตรง ไม่ประเมินชนะทางจาก Win Rate รวมของฮีโร่
              </span>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: เล่นคู่กับตัวไหนแล้วดี (Synergies)                   */}
        {/* ========================================================= */}
        {activeTab === 'synergy' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700">
                ฮีโร่คู่หูที่เสริมพลังให้ {focusHero ? focusHero.name : 'ทีม'} มากที่สุด (สูงสุด 5 ตัว)
              </span>
              <span className="text-[9.5px] font-semibold text-slate-400">RPL 2026 Synergies</span>
            </div>

            {synergyData.length > 0 ? (
              <div className="space-y-2">
                {synergyData.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-white border border-[#F3D5E2] shadow-2xs hover:border-[#E91E63] transition-all flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-black text-[#E91E63] text-xs w-4">{idx + 1}</span>
                        <img
                          src={getHeroImageUrl(item.allyHero)}
                          alt={item.allyHero}
                          className="w-7 h-7 rounded-lg object-cover border border-[#F48FB1] flex-shrink-0 shadow-2xs"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900 truncate">
                              {item.allyHero}
                            </span>
                            {item.isProVerified ? (
                              <span className="text-[8.5px] font-black px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                🏆 แข่งจริง ({item.games} เกม)
                              </span>
                            ) : (
                              <span className="text-[8.5px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                📋 คำแนะนำเชิงกลยุทธ์
                              </span>
                            )}
                          </div>
                          {item.winRate !== undefined && (
                            <span className="text-[10px] text-emerald-600 font-bold">
                              อัตราชนะคู่กัน {item.winRate.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectHeroToInspect(item.allyHero)}
                        className="text-[10px] font-bold text-[#E91E63] hover:underline flex items-center gap-0.5 cursor-pointer flex-shrink-0"
                      >
                        <span>พิจารณา</span>
                        <ArrowRight size={10} />
                      </button>
                    </div>

                    <p className="text-[10.5px] text-slate-600 leading-snug pl-6">
                      {item.reason}
                    </p>

                    {/* MCU Player Hero Pool Link */}
                    {item.playersWhoPlay && item.playersWhoPlay.length > 0 && (
                      <div className="pl-6 pt-1 border-t border-slate-100 flex items-center gap-1 text-[9.5px] text-slate-500 flex-wrap">
                        <span className="font-semibold text-slate-700">ผู้เล่น MCU ที่เล่นได้:</span>
                        {item.playersWhoPlay.map((badge, bIdx) => (
                          <span
                            key={bIdx}
                            className={`px-1.5 py-0.2 rounded font-bold border ${
                              badge.tier === 'signature'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            {badge.playerNickname} {badge.tier === 'signature' ? '⭐ดาวทอง' : '⭐ดาวเงิน'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-500 text-xs">
                ไม่มีสถิติการเล่นคู่กันโดยตรงในฐานข้อมูล RPL 2026
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: ควรแบนตัวไหน (Real-time Ban Assistant)              */}
        {/* ========================================================= */}
        {activeTab === 'ban_assistant' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            {/* Phase Guard: Only active during Ban Phase */}
            {!isBanTurn ? (
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-center space-y-2">
                <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                  <Ban size={18} />
                </div>
                <h4 className="font-bold text-xs text-amber-900">
                  ขณะนี้อยู่ในช่วง PICK (การเลือกฮีโร่)
                </h4>
                <p className="text-[11px] text-slate-600 max-w-sm mx-auto leading-relaxed">
                  ระบบ Real-time Ban Assistant จะคำนวณและแสดงคำแนะนำแบนโดยอัตโนมัติเมื่อถึงรอบการแบน (Phase 1 หรือ Phase 2 Ban)
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('matchups')}
                    className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold shadow-2xs cursor-pointer"
                  >
                    ดูหมวดชนะทาง/แพ้ทาง แทน
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                    <span>🚫</span>
                    <span>คำแนะนำ BAN แบบเรียลไทม์ (อัปเดตตามสถานะดราฟต์สด)</span>
                  </span>
                  <span className="text-[9.5px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    เทิร์น {activeTurnTeam.toUpperCase()}
                  </span>
                </div>

                {banRecommendations.length > 0 ? (
                  <div className="space-y-2">
                    {banRecommendations.map((ban, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-white border border-[#F3D5E2] shadow-2xs hover:border-rose-300 transition-all space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-black text-rose-700 text-xs w-4">{idx + 1}</span>
                            <img
                              src={getHeroImageUrl(ban.hero.name)}
                              alt={ban.hero.name}
                              className="w-8 h-8 rounded-lg object-cover border border-rose-200 shadow-2xs flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-slate-900 truncate">
                                  {ban.hero.name}
                                </span>
                                <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded border ${ban.priorityBadge.color}`}>
                                  {ban.priorityBadge.label}
                                </span>
                              </div>
                              <span className="text-[9.5px] text-slate-500">
                                {ban.categoryLabel}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => onSelectHeroToInspect(ban.hero.name)}
                            className="text-[10px] font-bold text-rose-700 hover:text-rose-900 px-2 py-1 rounded-lg bg-rose-50 border border-rose-200 cursor-pointer flex-shrink-0"
                          >
                            พิจารณาแบน
                          </button>
                        </div>

                        {/* Rationale */}
                        <p className="text-[10.5px] text-slate-700 leading-snug pl-6">
                          {ban.reason}
                        </p>

                        {/* Pro Ban Rate Stats from Liquipedia */}
                        {ban.stats && (
                          <div className="pl-6 pt-1 border-t border-slate-100 flex items-center justify-between text-[9.5px] text-slate-500">
                            <span>
                              สถิติ RPL: Ban Rate <strong className="text-rose-700">{ban.stats.banRate.toFixed(1)}%</strong> ({ban.stats.games} เกม)
                            </span>
                            {ban.nextAlternative && (
                              <span className="text-slate-400">
                                ทางเลือกถัดไป: <strong className="text-slate-700">{ban.nextAlternative}</strong>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-500 text-xs">
                    ไม่มีฮีโร่เป้าหมายแบนที่เข้าเงื่อนไข (ฮีโร่อันตรายถูกแบนหรือเลือกแล้ว)
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: Combo ยอดนิยม (Pro Meta Comps)                      */}
        {/* ========================================================= */}
        {activeTab === 'pro_comps' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                <span>🔥</span>
                <span>Combo ยอดนิยมที่มีสถิติการแข่งจริง (RPL Pro Comps)</span>
              </span>
              <span className="text-[9.5px] text-slate-400">เรียงตามความน่าเชื่อถือ</span>
            </div>

            {popularComps.length > 0 ? (
              <div className="space-y-2.5">
                {popularComps.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border transition-all space-y-2 ${
                      item.isCompBroken
                        ? 'bg-slate-50 border-slate-200 opacity-75'
                        : 'bg-white border-[#F3D5E2] shadow-2xs hover:border-[#E91E63]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-[#E91E63] text-xs">#{idx + 1}</span>
                          <h4 className="font-bold text-xs text-slate-900 truncate">
                            {item.comp.nameTh}
                          </h4>
                          <span className="text-[8.5px] font-black px-1.5 py-0.2 rounded bg-[#FEF3C7] text-[#B45309] border border-[#F59E0B]">
                            Tier {item.comp.tier}
                          </span>
                        </div>
                        {item.hasProStat && (
                          <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                            สถิติการแข่งจริง: Win Rate {item.winRate}% ({item.totalGamesCombined} เกม, ชนะ {item.totalWinsCombined})
                          </span>
                        )}
                      </div>

                      {item.isCompBroken && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200 flex-shrink-0">
                          คอมโบแตกแล้ว
                        </span>
                      )}
                    </div>

                    {/* Core Heroes Row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.comp.coreHeroes.map((heroName, hIdx) => {
                        const isBanned = bannedHeroNames.has(heroName);
                        const isPickedUs = myPicks.some((p) => p.hero?.name.toLowerCase() === heroName.toLowerCase());
                        const isPickedOpp = oppPicks.some((p) => p.hero?.name.toLowerCase() === heroName.toLowerCase());

                        return (
                          <div
                            key={hIdx}
                            onClick={() => onSelectHeroToInspect(heroName)}
                            className={`flex items-center gap-1 pl-1 pr-2 py-0.5 rounded-lg border text-[10.5px] cursor-pointer transition-all ${
                              isBanned
                                ? 'bg-rose-50 border-rose-200 text-rose-600 line-through opacity-70'
                                : isPickedOpp
                                ? 'bg-rose-100 border-rose-300 text-rose-800'
                                : isPickedUs
                                ? 'bg-sky-100 border-sky-300 text-sky-800 font-bold'
                                : 'bg-[#FFF8FB] border-[#F3D5E2] text-slate-800 hover:border-[#E91E63]'
                            }`}
                          >
                            <img
                              src={getHeroImageUrl(heroName)}
                              alt={heroName}
                              className="w-4 h-4 rounded object-cover"
                            />
                            <span>{heroName}</span>
                            {isPickedUs && <span className="text-[8px] text-sky-700 font-bold">✓ ทีมเรา</span>}
                            {isPickedOpp && <span className="text-[8px] text-rose-700 font-bold">✗ ศัตรู</span>}
                          </div>
                        );
                      })}
                    </div>

                    {/* Recommended Pick Order & Strategy */}
                    <div className="p-2 bg-[#FFF8FB] rounded-lg border border-[#F3D5E2] space-y-1 text-[10px]">
                      <div className="flex items-center gap-1 font-bold text-slate-800">
                        <span>🎯 ลำดับการหยิบที่แนะนำ:</span>
                        <span className="text-[#E91E63]">{item.comp.recommendedPickOrder.join(' → ')}</span>
                      </div>
                      <div className="text-slate-600 leading-snug">
                        {item.comp.tacticalDescription}
                      </div>
                    </div>

                    {/* Priority Bans to Protect Combo */}
                    {item.comp.priorityBans && item.comp.priorityBans.length > 0 && (
                      <div className="pt-1 border-t border-slate-100 flex items-center gap-1 text-[9.5px] text-slate-500 flex-wrap">
                        <span className="font-bold text-slate-700">ตัวที่ควรแบนเพื่อปกป้องคอมโบ:</span>
                        {item.comp.priorityBans.slice(0, 2).map((pb, bIdx) => (
                          <span
                            key={bIdx}
                            className="px-1.5 py-0.2 rounded bg-rose-50 text-rose-800 border border-rose-200 font-semibold"
                            title={pb.reason}
                          >
                            🚫 {pb.hero} ({pb.phase})
                          </span>
                        ))}
                        <span className="text-[8.5px] text-slate-400 italic">(คำแนะนำเชิงกลยุทธ์)</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-500 text-xs">
                ข้อมูลยังไม่เพียงพอสำหรับจัดอันดับ
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
