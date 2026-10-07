import React, { useState } from 'react';
import { Hero } from '../types/draft';
import { Player, HeroPlayerBadge } from '../types/player';
import { HEROES, getHeroImageUrl } from '../data/heroes';
import { DraftScoreResult } from '../data/metaData';
import { RPL_2026_PRO_COMPS } from '../data/proMetaComps';
import {
  Ban,
  Award,
  Layers,
  Sparkles,
  Trophy,
  X,
  Shield,
  Zap,
  TrendingUp,
  ShieldAlert,
  Clock,
  Check,
  ExternalLink,
  Flame,
} from 'lucide-react';
import {
  getRecommendedBans,
  getTopProLeagueBans,
  getBlueSideRecommendedBans,
  getRedSideRecommendedBans,
} from '../services/banRecommendationService';
import { DraftPredictionService } from '../services/draftPredictionService';

export type TacticalPanelTab = 'recommendations' | 'synergy' | 'predictions' | 'pro_comps';

interface TacticalInfoSidePanelProps {
  activeTab: TacticalPanelTab;
  onClose: () => void;
  onTabChange: (tab: TacticalPanelTab) => void;
  blueBans: (Hero | null)[];
  redBans: (Hero | null)[];
  bluePicks: { hero: Hero | null; pos?: string }[];
  redPicks: { hero: Hero | null; pos?: string }[];
  bannedHeroNames: Set<string>;
  pickedHeroNames: Set<string>;
  onInspectHero: (heroName: string) => void;
  onPickHeroDirectly?: (heroName: string) => void;
  onBanHeroDirectly?: (heroName: string) => void;
  isPickTurn?: boolean;
  isBanTurn?: boolean;
  activeTeam?: 'blue' | 'red';
  blueTeamName?: string;
  redTeamName?: string;
  blueScore?: DraftScoreResult;
  redScore?: DraftScoreResult;
  players?: Player[];
  heroToPlayersMap?: Record<string, HeroPlayerBadge[]>;
  height?: number;
}

export const TacticalInfoSidePanel: React.FC<TacticalInfoSidePanelProps> = ({
  activeTab,
  onClose,
  onTabChange,
  blueBans,
  redBans,
  bluePicks,
  redPicks,
  bannedHeroNames,
  pickedHeroNames,
  onInspectHero,
  onPickHeroDirectly,
  onBanHeroDirectly,
  isPickTurn = false,
  isBanTurn = false,
  activeTeam = 'blue',
  blueTeamName = 'Blue Team',
  redTeamName = 'Red Team',
  blueScore,
  redScore,
  height,
}) => {
  const [banCategory, setBanCategory] = useState<'pro' | 'blue' | 'red'>('pro');
  const [pickLaneFilter, setPickLaneFilter] = useState<string>('all');
  const [selectedCompCategory, setSelectedCompCategory] = useState<string>('all');

  const bluePickNames = bluePicks.map((p) => p.hero?.name || '').filter(Boolean);
  const redPickNames = redPicks.map((p) => p.hero?.name || '').filter(Boolean);

  // Recommendations
  const smartBanRecommendations = React.useMemo(() => {
    return getRecommendedBans(
      activeTeam,
      bluePickNames,
      redPickNames,
      bannedHeroNames,
      pickedHeroNames
    );
  }, [activeTeam, bluePickNames, redPickNames, bannedHeroNames, pickedHeroNames]);

  const proLeagueBans = React.useMemo(() => {
    return getTopProLeagueBans(bannedHeroNames, pickedHeroNames);
  }, [bannedHeroNames, pickedHeroNames]);

  const blueSideBans = React.useMemo(() => {
    return getBlueSideRecommendedBans(bannedHeroNames, pickedHeroNames);
  }, [bannedHeroNames, pickedHeroNames]);

  const redSideBans = React.useMemo(() => {
    return getRedSideRecommendedBans(bannedHeroNames, pickedHeroNames);
  }, [bannedHeroNames, pickedHeroNames]);

  const displayedBans =
    banCategory === 'pro' ? proLeagueBans : banCategory === 'blue' ? blueSideBans : redSideBans;

  // Synergy
  const draftSynergy = React.useMemo(() => {
    return DraftPredictionService.analyzeSynergyAndAttributes(bluePicks, redPicks);
  }, [bluePicks, redPicks]);

  // Predictions
  const intelligence = React.useMemo(() => {
    return DraftPredictionService.generateRealtimePredictions(
      blueBans,
      redBans,
      bluePicks,
      redPicks,
      bannedHeroNames,
      pickedHeroNames
    );
  }, [blueBans, redBans, bluePicks, redPicks, bannedHeroNames, pickedHeroNames]);

  // Win rate split
  let blueWinPercent = 50;
  let redWinPercent = 50;
  if (blueScore && redScore && (blueScore.score > 0 || redScore.score > 0)) {
    const total = blueScore.score + redScore.score;
    blueWinPercent = Math.max(20, Math.min(80, Math.round((blueScore.score / total) * 100)));
    redWinPercent = 100 - blueWinPercent;
  }

  // Pick recommendations (friendly pool)
  const smartPicks = React.useMemo(() => {
    const friendlyPicks = activeTeam === 'blue' ? bluePickNames : redPickNames;
    const enemyPicks = activeTeam === 'blue' ? redPickNames : bluePickNames;

    const available = HEROES.filter(
      (h) => !bannedHeroNames.has(h.name) && !pickedHeroNames.has(h.name)
    );

    return available
      .map((hero) => {
        let score = 50;
        let reasons: string[] = [];

        // Meta rating
        if (hero.tier === 'S+' || hero.tier === 'S') {
          score += 20;
          reasons.push('เมต้าฮิต RPL 2026');
        }

        // Synergy with allies
        friendlyPicks.forEach((ally) => {
          if (hero.goodWith?.includes(ally)) {
            score += 15;
            reasons.push(`คอมโบเข้าคู่กับ ${ally}`);
          }
        });

        // Counters enemy
        enemyPicks.forEach((enemy) => {
          if (hero.counters?.includes(enemy)) {
            score += 15;
            reasons.push(`ชนะทาง ${enemy}`);
          }
        });

        return {
          hero,
          score,
          reason: reasons.slice(0, 2).join(' • ') || 'ฮีโร่ตัวเลือกที่มีความยืดหยุ่นสูง',
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  }, [activeTeam, bluePickNames, redPickNames, bannedHeroNames, pickedHeroNames]);

  const filteredPicks = React.useMemo(() => {
    if (pickLaneFilter === 'all') return smartPicks;
    return smartPicks.filter(
      (p) =>
        p.hero.primaryPos?.toLowerCase() === pickLaneFilter.toLowerCase() ||
        p.hero.lane?.toLowerCase() === pickLaneFilter.toLowerCase()
    );
  }, [smartPicks, pickLaneFilter]);

  return (
    <div
      className="flex flex-col bg-white border-2 border-[#F3D5E2] rounded-2xl shadow-md overflow-hidden text-slate-800 select-none"
      style={height ? { height: `${height}px`, maxHeight: `${height}px` } : undefined}
    >
      {/* 1. Header Bar with Tabs & Close Button */}
      <div className="p-2 sm:p-2.5 bg-[#FFF0F5] border-b border-[#F3D5E2] flex items-center justify-between flex-shrink-0 gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {activeTab === 'recommendations' && (
            <>
              {isBanTurn ? (
                <Ban size={15} className="text-rose-500 flex-shrink-0" />
              ) : (
                <Award size={15} className="text-amber-500 flex-shrink-0" />
              )}
              <span className="font-['Prompt'] font-bold text-xs truncate text-slate-800">
                {isBanTurn ? 'Smart Ban Recommendations' : 'Smart Pick Recommendations'}
              </span>
            </>
          )}

          {activeTab === 'synergy' && (
            <>
              <Layers size={15} className="text-purple-600 flex-shrink-0" />
              <span className="font-['Prompt'] font-bold text-xs truncate text-slate-800">
                Draft Synergy & Balance
              </span>
            </>
          )}

          {activeTab === 'predictions' && (
            <>
              <Sparkles size={15} className="text-emerald-600 flex-shrink-0" />
              <span className="font-['Prompt'] font-bold text-xs truncate text-slate-800">
                Radar Win Rate Predictions
              </span>
            </>
          )}

          {activeTab === 'pro_comps' && (
            <>
              <Trophy size={15} className="text-amber-600 flex-shrink-0" />
              <span className="font-['Prompt'] font-bold text-xs truncate text-slate-800">
                RPL 2026 Pro Meta Compositions
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-[#F3D5E2] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            title="ปิดหน้าต่างข้อมูล (ขยายดราฟต์เต็มจอ)"
          >
            <X size={13} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* 2. Scrollable Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2.5 sm:p-3 custom-scrollbar flex flex-col gap-2.5 bg-[#FFF8FB]/30">
        {/* ========================================================= */}
        {/* VIEW 1: SMART RECOMMENDATIONS                             */}
        {/* ========================================================= */}
        {activeTab === 'recommendations' && (
          <div className="flex flex-col gap-2.5">
            {isBanTurn ? (
              <>
                {/* Ban Sub-tabs */}
                <div className="flex items-center gap-1 p-0.5 bg-white border border-[#F3D5E2] rounded-xl shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setBanCategory('pro')}
                    className={`flex-1 py-1 rounded-lg text-[10.5px] font-['Prompt'] font-bold transition-all cursor-pointer text-center ${
                      banCategory === 'pro'
                        ? 'bg-amber-500 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🔥 โปรลีกแบนเยอะ ({proLeagueBans.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBanCategory('blue')}
                    className={`flex-1 py-1 rounded-lg text-[10.5px] font-['Prompt'] font-bold transition-all cursor-pointer text-center ${
                      banCategory === 'blue'
                        ? 'bg-sky-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🔵 ฝั่ง Blue แบน ({blueSideBans.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBanCategory('red')}
                    className={`flex-1 py-1 rounded-lg text-[10.5px] font-['Prompt'] font-bold transition-all cursor-pointer text-center ${
                      banCategory === 'red'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🔴 ฝั่ง Red แบน ({redSideBans.length})
                  </button>
                </div>

                {/* Ban List */}
                <div className="space-y-1.5">
                  {displayedBans.slice(0, 10).map((item, idx) => (
                    <div
                      key={item.hero.id}
                      className="p-2 rounded-xl bg-white border border-[#F3D5E2] hover:border-rose-400 shadow-2xs flex items-center justify-between gap-2 transition-all"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                          <img
                            src={item.hero.avatarUrl || getHeroImageUrl(item.hero.name)}
                            alt={item.hero.name}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-0 left-0 bg-slate-900/90 text-white text-[8px] font-['Orbitron'] font-bold px-1 rounded-br">
                            #{idx + 1}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              onClick={() => onInspectHero(item.hero.name)}
                              className="font-['Prompt'] font-bold text-xs text-slate-800 hover:text-[#E91E63] cursor-pointer truncate"
                            >
                              {item.hero.name}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">
                              {item.hero.primaryPos}
                            </span>
                          </div>
                          <span className="text-[9.5px] text-slate-500 font-['Prompt'] line-clamp-1">
                            {item.reason}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-[9.5px] font-['Orbitron'] font-black text-rose-600 px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200">
                          {item.stats.banRate}%
                        </span>
                        {onBanHeroDirectly && (
                          <button
                            type="button"
                            onClick={() => onBanHeroDirectly(item.hero.name)}
                            className="px-2 py-1 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-lg text-[10px] font-['Prompt'] font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                          >
                            แบน
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* Pick Lane Filter */}
                <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar p-1 bg-white border border-[#F3D5E2] rounded-xl shadow-2xs">
                  {['all', 'dsl', 'jg', 'mid', 'roam', 'adl'].map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => setPickLaneFilter(pos)}
                      className={`flex-1 py-0.5 px-1.5 rounded-lg text-[10px] font-['Prompt'] font-bold uppercase transition-all cursor-pointer whitespace-nowrap text-center ${
                        pickLaneFilter === pos
                          ? 'bg-[#E91E63] text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {pos === 'all' ? 'ทั้งหมด' : pos}
                    </button>
                  ))}
                </div>

                {/* Pick List */}
                <div className="space-y-1.5">
                  {filteredPicks.map((item, idx) => (
                    <div
                      key={item.hero.id}
                      className="p-2 rounded-xl bg-white border border-[#F3D5E2] hover:border-amber-400 shadow-2xs flex items-center justify-between gap-2 transition-all"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                          <img
                            src={item.hero.avatarUrl || getHeroImageUrl(item.hero.name)}
                            alt={item.hero.name}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-0 left-0 bg-amber-500 text-white text-[8px] font-['Orbitron'] font-bold px-1 rounded-br">
                            #{idx + 1}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              onClick={() => onInspectHero(item.hero.name)}
                              className="font-['Prompt'] font-bold text-xs text-slate-800 hover:text-[#E91E63] cursor-pointer truncate"
                            >
                              {item.hero.name}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">
                              {item.hero.primaryPos}
                            </span>
                          </div>
                          <span className="text-[9.5px] text-slate-500 font-['Prompt'] line-clamp-1">
                            {item.reason}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-[9.5px] font-['Orbitron'] font-black text-amber-600 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200">
                          {item.score}/100
                        </span>
                        {onPickHeroDirectly && (
                          <button
                            type="button"
                            onClick={() => onPickHeroDirectly(item.hero.name)}
                            className="px-2 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg text-[10px] font-['Prompt'] font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                          >
                            เลือก
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: DRAFT SYNERGY & BALANCE                           */}
        {/* ========================================================= */}
        {activeTab === 'synergy' && (
          <div className="flex flex-col gap-3 font-['Prompt'] text-xs">
            {/* Blue Side Structure */}
            <div className="p-2.5 rounded-xl bg-white border border-sky-200 shadow-2xs flex flex-col gap-2">
              <div className="flex items-center justify-between pb-1 border-b border-sky-100">
                <span className="font-bold text-sky-900 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-sky-600" />
                  <span>{blueTeamName} (Blue)</span>
                </span>
                <span className="text-[10px] text-slate-500 font-bold">
                  {draftSynergy.blue.activeCount}/5 ตัว
                </span>
              </div>

              {/* Bars */}
              <div className="space-y-1.5 text-[10.5px]">
                <div>
                  <div className="flex justify-between text-slate-600 mb-0.5">
                    <span>🛡️ Frontline (ตัวค้ำ)</span>
                    <span className="font-bold text-slate-800">
                      {Math.round(draftSynergy.blue.frontlineRating)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full"
                      style={{ width: `${draftSynergy.blue.frontlineRating}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-600 mb-0.5">
                    <span>⚔️ Damage Split</span>
                    <span className="font-bold text-slate-800">
                      {draftSynergy.blue.physicalPercent}% Phys / {draftSynergy.blue.magicPercent}% Magic
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-purple-100 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-orange-500"
                      style={{ width: `${draftSynergy.blue.physicalPercent}%` }}
                    />
                    <div
                      className="h-full bg-purple-600"
                      style={{ width: `${draftSynergy.blue.magicPercent}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-600 mb-0.5">
                    <span>💫 CC Rating (สตั๊นท์)</span>
                    <span className="font-bold text-slate-800">
                      {draftSynergy.blue.ccRating}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${draftSynergy.blue.ccRating}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Red Side Structure */}
            <div className="p-2.5 rounded-xl bg-white border border-rose-200 shadow-2xs flex flex-col gap-2">
              <div className="flex items-center justify-between pb-1 border-b border-rose-100">
                <span className="font-bold text-rose-900 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-600" />
                  <span>{redTeamName} (Red)</span>
                </span>
                <span className="text-[10px] text-slate-500 font-bold">
                  {draftSynergy.red.activeCount}/5 ตัว
                </span>
              </div>

              {/* Bars */}
              <div className="space-y-1.5 text-[10.5px]">
                <div>
                  <div className="flex justify-between text-slate-600 mb-0.5">
                    <span>🛡️ Frontline (ตัวค้ำ)</span>
                    <span className="font-bold text-slate-800">
                      {Math.round(draftSynergy.red.frontlineRating)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full"
                      style={{ width: `${draftSynergy.red.frontlineRating}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-600 mb-0.5">
                    <span>⚔️ Damage Split</span>
                    <span className="font-bold text-slate-800">
                      {draftSynergy.red.physicalPercent}% Phys / {draftSynergy.red.magicPercent}% Magic
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-purple-100 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-orange-500"
                      style={{ width: `${draftSynergy.red.physicalPercent}%` }}
                    />
                    <div
                      className="h-full bg-purple-600"
                      style={{ width: `${draftSynergy.red.magicPercent}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-600 mb-0.5">
                    <span>💫 CC Rating (สตั๊นท์)</span>
                    <span className="font-bold text-slate-800">
                      {draftSynergy.red.ccRating}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${draftSynergy.red.ccRating}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: RADAR PREDICTIONS                                 */}
        {/* ========================================================= */}
        {activeTab === 'predictions' && (
          <div className="flex flex-col gap-2.5 font-['Prompt'] text-xs">
            {/* Win Rate Meter */}
            <div className="p-3 bg-white rounded-xl border border-[#F3D5E2] shadow-2xs flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-sky-700">🔵 {blueTeamName}: {blueWinPercent}%</span>
                <span className="text-rose-700">🔴 {redTeamName}: {redWinPercent}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full overflow-hidden bg-slate-100 flex shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-sky-600 transition-all duration-300"
                  style={{ width: `${blueWinPercent}%` }}
                />
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-rose-600 transition-all duration-300"
                  style={{ width: `${redWinPercent}%` }}
                />
              </div>
            </div>

            {/* Tactical Observations */}
            <div className="p-2.5 bg-white rounded-xl border border-[#F3D5E2] shadow-2xs flex flex-col gap-2">
              <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1 text-[#E91E63]">
                <Sparkles size={13} />
                <span>ข้อสรุปการได้เปรียบเชิงแท็กติก</span>
              </span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {intelligence.predictionSummary ||
                  'ระบบกำลังประเมินผลการแข่งขันจากสถิติ RoV Pro League 2026 เมื่อดราฟต์ฮีโร่เพิ่ม การประเมินจะแม่นยำขึ้น'}
              </p>
            </div>

            {/* Matchup Advantages */}
            {intelligence.advantages && intelligence.advantages.length > 0 && (
              <div className="space-y-1.5">
                <span className="font-bold text-slate-700 text-[11px] px-1">
                  ⭐ จุดเด่นและข้อได้เปรียบ:
                </span>
                {intelligence.advantages.slice(0, 4).map((adv, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-emerald-50/60 border border-emerald-200 text-emerald-900 text-[10.5px] font-medium leading-relaxed"
                  >
                    • {adv}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 4: RPL PRO COMPS                                     */}
        {/* ========================================================= */}
        {activeTab === 'pro_comps' && (
          <div className="flex flex-col gap-2 font-['Prompt']">
            <span className="text-[11px] font-bold text-slate-600 px-1">
              🏆 ดราฟต์คอมโบยอดนิยม RoV Pro League 2026:
            </span>

            <div className="space-y-2">
              {RPL_2026_PRO_COMPS.map((comp) => {
                // Check how many heroes already picked in the draft
                const matchedInDraft = comp.heroes.filter(
                  (h) => bluePickNames.includes(h) || redPickNames.includes(h)
                );

                return (
                  <div
                    key={comp.id}
                    className="p-2.5 rounded-xl bg-white border border-amber-200 shadow-2xs hover:border-amber-400 transition-all flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-amber-950 truncate">
                        {comp.name}
                      </span>
                      <span className="text-[10px] font-['Orbitron'] font-black text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        WR {comp.winRate}% ({comp.games}G)
                      </span>
                    </div>

                    {/* Heroes Avatars */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {comp.heroes.map((hName) => {
                        const isPicked = bluePickNames.includes(hName) || redPickNames.includes(hName);
                        const isBanned = bannedHeroNames.has(hName);

                        return (
                          <div
                            key={hName}
                            onClick={() => onInspectHero(hName)}
                            className={`flex items-center gap-1 p-1 rounded-lg border text-[10.5px] cursor-pointer transition-all ${
                              isPicked
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold ring-1 ring-emerald-300'
                                : isBanned
                                ? 'bg-rose-50 border-rose-200 text-rose-500 opacity-60'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-amber-400'
                            }`}
                            title={isPicked ? 'ดราฟต์ตัวนี้แล้ว' : isBanned ? 'ถูกแบน' : `คลิกดู ${hName}`}
                          >
                            <img
                              src={getHeroImageUrl(hName)}
                              alt={hName}
                              className="w-4 h-4 rounded-full object-cover"
                            />
                            <span>{hName}</span>
                          </div>
                        );
                      })}
                    </div>

                    <p className="text-[9.5px] text-slate-500 line-clamp-1">
                      {comp.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. Footer Status Bar */}
      <div className="px-3 py-1 bg-[#FFF0F5] border-t border-[#F3D5E2] flex items-center justify-between text-[9.5px] font-['Prompt'] text-slate-500 font-bold select-none flex-shrink-0">
        <span>🎮 REAL-TIME TACTICAL RADAR</span>
        <button
          type="button"
          onClick={onClose}
          className="text-[#E91E63] hover:underline cursor-pointer"
        >
          ซ่อนแผงข้อมูล ✕
        </button>
      </div>
    </div>
  );
};
