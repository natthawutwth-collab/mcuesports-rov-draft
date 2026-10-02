import React, { useState, useMemo } from 'react';
import { Hero, TeamSide } from '../types/draft';
import { getHeroImageUrl } from '../data/heroes';
import { DraftScoreResult } from '../data/metaData';
import {
  DraftPredictionService,
  DraftTacticalIntelligence,
  BanPredictionItem,
  PickSynergyPredictionItem,
  CounterPredictionItem,
} from '../services/draftPredictionService';
import { Sparkles, ChevronDown, ChevronUp, Eye, ShieldAlert, Zap, Ban, CheckCircle2 } from 'lucide-react';
import { ProCompsModal } from './ProCompsModal';
import { RPL_2026_PRO_COMPS } from '../data/proMetaComps';

interface DraftTacticalRadarProps {
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
}

type TabMode = 'all' | 'bans' | 'synergies' | 'counters';
type TeamFilter = 'all' | 'blue' | 'red';

export const DraftTacticalRadar: React.FC<DraftTacticalRadarProps> = ({
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
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabMode>('all');
  const [teamFilter, setTeamFilter] = useState<TeamFilter>('all');
  const [isProCompsOpen, setIsProCompsOpen] = useState<boolean>(false);

  // Compute Advantage Percentage
  const hasScore = (blueScore && blueScore.score > 0) || (redScore && redScore.score > 0);
  let bluePercent = 50;
  let redPercent = 50;

  if (blueScore && redScore && blueScore.score > 0 && redScore.score > 0) {
    const total = blueScore.score + redScore.score;
    bluePercent = Math.max(15, Math.min(85, Math.round((blueScore.score / total) * 100)));
    redPercent = 100 - bluePercent;
  } else if (blueScore && blueScore.score > 0 && (!redScore || redScore.score === 0)) {
    bluePercent = Math.max(52, Math.min(65, Math.round(50 + (blueScore.score - 50) * 0.4)));
    redPercent = 100 - bluePercent;
  } else if (redScore && redScore.score > 0 && (!blueScore || blueScore.score === 0)) {
    redPercent = Math.max(52, Math.min(65, Math.round(50 + (redScore.score - 50) * 0.4)));
    bluePercent = 100 - redPercent;
  }

  const percentDiff = bluePercent - redPercent;
  const advantageSide: 'blue' | 'red' | 'balanced' =
    Math.abs(percentDiff) < 2 ? 'balanced' : percentDiff > 0 ? 'blue' : 'red';

  // Compute live intelligence in real-time
  const intelligence: DraftTacticalIntelligence = useMemo(() => {
    return DraftPredictionService.generateRealtimePredictions(
      blueBans,
      redBans,
      bluePicks,
      redPicks,
      bannedHeroNames,
      pickedHeroNames
    );
  }, [blueBans, redBans, bluePicks, redPicks, bannedHeroNames, pickedHeroNames]);

  const hasAnyDraftActions = useMemo(() => {
    return (
      blueBans.some(Boolean) ||
      redBans.some(Boolean) ||
      bluePicks.some((p) => Boolean(p.hero)) ||
      redPicks.some((p) => Boolean(p.hero))
    );
  }, [blueBans, redBans, bluePicks, redPicks]);

  // Segmented bans
  const blueBanPredictions = useMemo(() => intelligence.banPredictions.filter((item) => item.team === 'blue'), [intelligence.banPredictions]);
  const redBanPredictions = useMemo(() => intelligence.banPredictions.filter((item) => item.team === 'red'), [intelligence.banPredictions]);

  // Segmented synergies
  const blueSynergies = useMemo(() => intelligence.pickSynergies.filter((item) => item.team === 'blue'), [intelligence.pickSynergies]);
  const redSynergies = useMemo(() => intelligence.pickSynergies.filter((item) => item.team === 'red'), [intelligence.pickSynergies]);

  // Segmented counters:
  // For Blue team: recommendations to counter enemy Red picks
  // For Red team: recommendations to counter enemy Blue picks
  const blueCounters = useMemo(() => intelligence.counterSuggestions.filter((item) => item.targetTeam === 'red'), [intelligence.counterSuggestions]);
  const redCounters = useMemo(() => intelligence.counterSuggestions.filter((item) => item.targetTeam === 'blue'), [intelligence.counterSuggestions]);

  // Filtered ban predictions for counts
  const filteredBans = useMemo(() => {
    if (teamFilter === 'all') return intelligence.banPredictions;
    return intelligence.banPredictions.filter((item) => item.team === teamFilter);
  }, [intelligence.banPredictions, teamFilter]);

  // Filtered synergy predictions for counts
  const filteredSynergies = useMemo(() => {
    if (teamFilter === 'all') return intelligence.pickSynergies;
    return intelligence.pickSynergies.filter((item) => item.team === teamFilter);
  }, [intelligence.pickSynergies, teamFilter]);

  // Filtered counters for counts
  const filteredCounters = useMemo(() => {
    if (teamFilter === 'all') return intelligence.counterSuggestions;
    if (teamFilter === 'blue') return blueCounters;
    return redCounters;
  }, [intelligence.counterSuggestions, teamFilter, blueCounters, redCounters]);

  const blueTotalCount = useMemo(() => {
    if (activeTab === 'all') return blueBanPredictions.length + blueSynergies.length + blueCounters.length;
    if (activeTab === 'bans') return blueBanPredictions.length;
    if (activeTab === 'synergies') return blueSynergies.length;
    return blueCounters.length;
  }, [activeTab, blueBanPredictions.length, blueSynergies.length, blueCounters.length]);

  const redTotalCount = useMemo(() => {
    if (activeTab === 'all') return redBanPredictions.length + redSynergies.length + redCounters.length;
    if (activeTab === 'bans') return redBanPredictions.length;
    if (activeTab === 'synergies') return redSynergies.length;
    return redCounters.length;
  }, [activeTab, redBanPredictions.length, redSynergies.length, redCounters.length]);

  const totalInsightsCount = filteredBans.length + filteredSynergies.length + filteredCounters.length;

  // Helper to render a ban prediction card
  const renderBanCard = (item: BanPredictionItem) => (
    <div
      key={item.id}
      className={`p-2.5 rounded-xl border-2 transition-all flex flex-col justify-between gap-2 shadow-2xs ${
        !item.isAvailable
          ? 'bg-slate-50 border-slate-200 opacity-60'
          : item.team === 'blue'
          ? 'bg-gradient-to-r from-sky-50/70 to-white border-sky-200 hover:border-sky-400'
          : 'bg-gradient-to-r from-rose-50/70 to-white border-rose-200 hover:border-rose-400'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-rose-300 flex-shrink-0 grayscale">
            <img
              src={getHeroImageUrl(item.bannedHero)}
              alt={item.bannedHero}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-red-950/40 flex items-center justify-center">
              <Ban size={14} className="text-red-300" />
            </div>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase">
              {item.team === 'blue' ? '🔵 น้ำเงินแบน' : '🔴 แดงแบน'}
            </span>
            <span className="text-[11.5px] font-bold text-slate-800 truncate">
              {item.bannedHero}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center flex-shrink-0 px-1">
          <span className="text-[9px] font-['Orbitron'] font-black text-[#E91E63]">
            {item.confidence}%
          </span>
          <span className="text-xs text-slate-400">➔</span>
        </div>

        <div className="flex items-center gap-1.5 min-w-0 justify-end flex-row-reverse">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-[#E91E63] shadow-xs flex-shrink-0">
            <img
              src={getHeroImageUrl(item.predictedHero)}
              alt={item.predictedHero}
              className="w-full h-full object-cover"
            />
            <span className="absolute top-0 right-0 bg-[#E91E63] text-white text-[7.5px] font-black px-1 rounded-bl">
              {item.predictedHeroPos}
            </span>
          </div>
          <div className="flex flex-col items-end min-w-0">
            <span className="text-[9px] font-bold text-[#E91E63] truncate">
              มีโอกาสหยิบ
            </span>
            <span className="text-[12px] font-black text-slate-900 truncate">
              {item.predictedHero}
            </span>
          </div>
        </div>
      </div>

      <div className="text-[10px] sm:text-[10.5px] text-slate-600 bg-white/90 p-1.5 rounded-lg border border-slate-200 leading-relaxed">
        💡 {item.reason}
      </div>

      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
        <div>
          {item.isAvailable ? (
            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>ว่างอยู่ในพูล</span>
            </span>
          ) : (
            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
              ถูกเลือก/แบนแล้ว
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onInspectHero(item.predictedHero)}
            className="px-2 py-0.5 rounded text-[10px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 cursor-pointer flex items-center gap-0.5 shadow-2xs"
          >
            <Eye size={10} />
            <span>สถิติ</span>
          </button>
          {item.isAvailable && isPickTurn && onPickHeroDirectly && (
            <button
              type="button"
              onClick={() => onPickHeroDirectly(item.predictedHero)}
              className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E91E63] hover:bg-[#D81B60] text-white cursor-pointer shadow-2xs"
            >
              ตัดหยิบก่อน
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Helper to render a synergy prediction card
  const renderSynergyCard = (item: PickSynergyPredictionItem) => (
    <div
      key={item.id}
      className={`p-2.5 rounded-xl border-2 transition-all flex flex-col justify-between gap-2 shadow-2xs ${
        !item.isAvailable
          ? 'bg-slate-50 border-slate-200 opacity-60'
          : item.team === 'blue'
          ? 'bg-gradient-to-r from-sky-50/80 to-white border-sky-300 hover:border-sky-500'
          : 'bg-gradient-to-r from-rose-50/80 to-white border-rose-300 hover:border-rose-500'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden border-2 border-emerald-500 shadow-xs flex-shrink-0">
            <img
              src={getHeroImageUrl(item.pickedHero)}
              alt={item.pickedHero}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 right-0 bg-emerald-600 text-white p-0.5 rounded-tl">
              <CheckCircle2 size={8} />
            </div>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase">
              {item.team === 'blue' ? '🔵 น้ำเงินเลือก' : '🔴 แดงเลือก'}
            </span>
            <span className="text-[11.5px] font-bold text-slate-800 truncate">
              {item.pickedHero}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center flex-shrink-0 px-1">
          <span className="text-[8px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300">
            {item.comboName || 'คู่หูคอมโบ'}
          </span>
          <span className="text-xs text-amber-500 font-bold">⚡ คู่กับ ⚡</span>
        </div>

        <div className="flex items-center gap-1.5 min-w-0 justify-end flex-row-reverse">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-amber-500 shadow-xs flex-shrink-0">
            <img
              src={getHeroImageUrl(item.suggestedHero)}
              alt={item.suggestedHero}
              className="w-full h-full object-cover"
            />
            <span className="absolute top-0 right-0 bg-amber-600 text-white text-[7.5px] font-black px-1 rounded-bl">
              {item.suggestedHeroPos}
            </span>
          </div>
          <div className="flex flex-col items-end min-w-0">
            <span className="text-[9.5px] font-bold text-amber-700 truncate">
              คู่หูยอดฮิต
            </span>
            <span className="text-[12px] font-black text-slate-900 truncate">
              {item.suggestedHero}
            </span>
          </div>
        </div>
      </div>

      <div className="text-[10px] sm:text-[10.5px] text-slate-600 bg-white/90 p-1.5 rounded-lg border border-slate-200 leading-relaxed">
        ⚡ {item.reason}
      </div>

      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
        <div>
          {item.isAvailable ? (
            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>ว่างอยู่ในพูล ({item.confidence}% โอกาส)</span>
            </span>
          ) : (
            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
              ถูกเลือก/แบนไปแล้ว
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onInspectHero(item.suggestedHero)}
            className="px-2 py-0.5 rounded text-[10px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 cursor-pointer flex items-center gap-0.5 shadow-2xs"
          >
            <Eye size={10} />
            <span>สถิติ</span>
          </button>
          {item.isAvailable && isPickTurn && onPickHeroDirectly && (
            <button
              type="button"
              onClick={() => onPickHeroDirectly(item.suggestedHero)}
              className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-2xs"
            >
              ชิงหยิบก่อน
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Helper to render a counter-pick card
  const renderCounterCard = (item: CounterPredictionItem) => (
    <div
      key={item.id}
      className={`p-2.5 rounded-xl border-2 transition-all flex flex-col justify-between gap-2 shadow-2xs ${
        !item.isAvailable
          ? 'bg-slate-50 border-slate-200 opacity-60'
          : 'bg-gradient-to-r from-sky-50/70 to-white border-sky-300 hover:border-sky-500'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-300 flex-shrink-0">
            <img
              src={getHeroImageUrl(item.targetHero)}
              alt={item.targetHero}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase">
              {item.targetTeam === 'blue' ? '🔵 ฝั่งน้ำเงินมี' : '🔴 ฝั่งแดงมี'}
            </span>
            <span className="text-[11.5px] font-bold text-slate-800 truncate">
              {item.targetHero}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center flex-shrink-0 px-1">
          <span className="text-[9px] font-bold text-sky-600 bg-sky-100 px-1.5 py-0.2 rounded border border-sky-300">
            แก้ทาง
          </span>
          <span className="text-xs text-sky-500 font-bold">⚔️ ฟันธง ⚔️</span>
        </div>

        <div className="flex items-center gap-1.5 min-w-0 justify-end flex-row-reverse">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-sky-600 shadow-xs flex-shrink-0">
            <img
              src={getHeroImageUrl(item.counterHero)}
              alt={item.counterHero}
              className="w-full h-full object-cover"
            />
            <span className="absolute top-0 right-0 bg-sky-700 text-white text-[7.5px] font-black px-1 rounded-bl">
              {item.counterHeroPos}
            </span>
          </div>
          <div className="flex flex-col items-end min-w-0">
            <span className="text-[9.5px] font-bold text-sky-700 truncate">
              ตัวแก้ทางเบอร์ 1
            </span>
            <span className="text-[12px] font-black text-slate-900 truncate">
              {item.counterHero}
            </span>
          </div>
        </div>
      </div>

      <div className="text-[10px] sm:text-[10.5px] text-slate-600 bg-white/90 p-1.5 rounded-lg border border-slate-200 leading-relaxed">
        🛡️ {item.reason}
      </div>

      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
        <div>
          {item.isAvailable ? (
            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>ว่างในพูล (แก้ทางได้ผล {item.confidence}%)</span>
            </span>
          ) : (
            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
              ถูกเลือก/แบนไปแล้ว
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onInspectHero(item.counterHero)}
            className="px-2 py-0.5 rounded text-[10px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 cursor-pointer flex items-center gap-0.5 shadow-2xs"
          >
            <Eye size={10} />
            <span>สถิติ</span>
          </button>
          {item.isAvailable && isPickTurn && onPickHeroDirectly && (
            <button
              type="button"
              onClick={() => onPickHeroDirectly(item.counterHero)}
              className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0284c7] hover:bg-sky-700 text-white cursor-pointer shadow-2xs"
            >
              เลือกแก้ทาง
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Helper to render an entire team's tactical column (Blue or Red)
  const renderTeamColumn = (team: 'blue' | 'red') => {
    const isBlue = team === 'blue';
    const teamName = isBlue ? blueTeamName || 'BLUE SIDE' : redTeamName || 'RED SIDE';
    const bans = isBlue ? blueBanPredictions : redBanPredictions;
    const synergies = isBlue ? blueSynergies : redSynergies;
    const counters = isBlue ? blueCounters : redCounters;

    const showBans = (activeTab === 'all' || activeTab === 'bans') && bans.length > 0;
    const showSynergies = (activeTab === 'all' || activeTab === 'synergies') && synergies.length > 0;
    const showCounters = (activeTab === 'all' || activeTab === 'counters') && counters.length > 0;

    const hasAnyForTab = showBans || showSynergies || showCounters;

    const count =
      activeTab === 'all'
        ? bans.length + synergies.length + counters.length
        : activeTab === 'bans'
        ? bans.length
        : activeTab === 'synergies'
        ? synergies.length
        : counters.length;

    return (
      <div className="flex flex-col gap-2.5">
        {/* Column Header */}
        <div
          className={`flex items-center justify-between p-2 sm:p-2.5 rounded-xl border shadow-2xs ${
            isBlue
              ? 'bg-gradient-to-r from-sky-100/90 to-sky-50 border-sky-300'
              : 'bg-gradient-to-r from-rose-100/90 to-rose-50 border-rose-300'
          }`}
        >
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="text-sm sm:text-base">{isBlue ? '🔵' : '🔴'}</span>
            <span
              className={`font-['Prompt'] font-bold text-xs sm:text-[13px] uppercase tracking-wide truncate ${
                isBlue ? 'text-[#0284C7]' : 'text-[#E11D48]'
              }`}
            >
              {teamName}
            </span>
            <span
              className={`text-[9px] sm:text-[9.5px] font-['Orbitron'] font-black px-1.5 py-0.2 rounded-md border shadow-2xs flex-shrink-0 ${
                isBlue
                  ? 'bg-white text-sky-800 border-sky-300'
                  : 'bg-white text-rose-800 border-rose-300'
              }`}
            >
              {count} {count === 1 ? 'ITEM' : 'ITEMS'}
            </span>
          </div>

          <span
            className={`text-[10px] font-bold hidden sm:inline ${
              isBlue ? 'text-sky-700' : 'text-rose-700'
            }`}
          >
            {isBlue ? 'วิเคราะห์แท็กติกฝั่งน้ำเงิน' : 'วิเคราะห์แท็กติกฝั่งแดง'}
          </span>
        </div>

        {/* Content */}
        {!hasAnyForTab ? (
          <div
            className={`py-8 px-4 rounded-xl border border-dashed text-center flex flex-col items-center justify-center ${
              isBlue
                ? 'bg-sky-50/40 border-sky-200 text-sky-800'
                : 'bg-rose-50/40 border-rose-200 text-rose-800'
            }`}
          >
            <span className="text-xl mb-1">{isBlue ? '🔵' : '🔴'}</span>
            <span className="font-bold text-xs">
              {activeTab === 'bans'
                ? `ยังไม่มีข้อมูลการแบนของ ${teamName}`
                : activeTab === 'synergies'
                ? `ยังไม่มีข้อมูลคอมโบของ ${teamName}`
                : activeTab === 'counters'
                ? `ยังไม่มีตัวเคาน์เตอร์ของ ${teamName}`
                : `ยังไม่มีข้อมูลแท็กติกของ ${teamName}`}
            </span>
            <span className="text-[10.5px] text-slate-500 mt-1">
              ข้อมูลจะอัปเดตอัตโนมัติเมื่อฝั่งนี้มีการแบนหรือเลือกฮีโร่
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Bans Section */}
            {showBans && (
              <div className="flex flex-col gap-1.5">
                <div
                  className={`flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                    isBlue
                      ? 'bg-sky-100/70 text-sky-900 border-sky-200'
                      : 'bg-rose-100/70 text-rose-900 border-rose-200'
                  }`}
                >
                  <Ban size={12} className={isBlue ? 'text-sky-600' : 'text-rose-600'} />
                  <span>เขาแบนตัวนี้ ➔ มีโอกาสจะหยิบตัวนี้ ({bans.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">
                  {bans.slice(0, activeTab === 'all' ? 4 : 12).map(renderBanCard)}
                </div>
              </div>
            )}

            {/* Synergies Section */}
            {showSynergies && (
              <div className="flex flex-col gap-1.5">
                <div
                  className={`flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                    isBlue
                      ? 'bg-amber-50 text-amber-900 border-amber-200'
                      : 'bg-amber-50 text-amber-900 border-amber-200'
                  }`}
                >
                  <Zap size={12} className="text-amber-600" />
                  <span>เขาเลือกตัวนี้ ➔ เล่นคู่กับตัวนี้ ({synergies.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">
                  {synergies.slice(0, activeTab === 'all' ? 4 : 12).map(renderSynergyCard)}
                </div>
              </div>
            )}

            {/* Counters Section */}
            {showCounters && (
              <div className="flex flex-col gap-1.5">
                <div
                  className={`flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                    isBlue
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  }`}
                >
                  <ShieldAlert size={12} className="text-emerald-600" />
                  <span>
                    {isBlue
                      ? `แนะนำให้ฝั่งน้ำเงินหยิบแก้ทางแดง (${counters.length})`
                      : `แนะนำให้ฝั่งแดงหยิบแก้ทางน้ำเงิน (${counters.length})`}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">
                  {counters.slice(0, activeTab === 'all' ? 4 : 12).map(renderCounterCard)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full mt-3 bg-white border-2 border-[#F3D5E2] rounded-2xl shadow-sm overflow-hidden font-['Prompt'] transition-all">
      {/* Top Banner Header */}
      <div className="px-2.5 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-[#FFF0F5] via-white to-[#F0F9FF] border-b-2 border-[#F3D5E2] flex items-center justify-between flex-wrap gap-1.5 sm:gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#E91E63] text-white flex items-center justify-center shadow-xs flex-shrink-0 animate-pulse">
            <Sparkles size={14} className="sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="font-['Orbitron'] font-black text-[11px] sm:text-[13px] text-[#E91E63] tracking-wider uppercase">
                REAL-TIME TACTICAL RADAR
              </span>
              <span className="text-[8.5px] sm:text-[9.5px] font-bold px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-2xs flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>วิเคราะห์ดราฟต์เรียลไทม์</span>
              </span>
            </div>
            <p className="text-[9.5px] sm:text-[11px] text-slate-500 font-medium truncate">
              เขาแบนตัวนี้ → มีโอกาสจะหยิบตัวนี้ | เขาเลือกตัวนี้ → มีโอกาสเอามาเล่นคู่กับตัวนี้
            </p>
          </div>
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-1 sm:gap-2 ml-auto flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsProCompsOpen(true)}
            title="เปิดดูดราฟต์และคอมพ์ 2-4 ตัวที่นักแข่งโปรชอบใช้ใน RoV Pro League"
            className="font-['Prompt'] text-[10px] sm:text-[11px] font-bold tracking-wider px-2 sm:px-2.5 py-1 rounded-lg border border-amber-400 bg-gradient-to-r from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 text-amber-900 transition-all flex items-center gap-1 cursor-pointer shadow-2xs whitespace-nowrap"
          >
            <span>🏆</span>
            <span className="hidden sm:inline">RPL PRO COMPS</span>
            <span className="sm:hidden">COMPS</span>
            <span className="text-[9px] bg-amber-500 text-white font-black px-1.5 py-0.2 rounded-full">
              {RPL_2026_PRO_COMPS.length}
            </span>
          </button>

          {hasAnyDraftActions && (
            <span className="text-[9.5px] sm:text-[10.5px] font-bold text-slate-600 bg-white border border-[#F3D5E2] px-2 sm:px-2.5 py-0.5 rounded-lg shadow-2xs whitespace-nowrap">
              {totalInsightsCount} ข้อเสนอแนะแท็กติก
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer transition-colors"
            title={isOpen ? 'ย่อแผงข้อมูล' : 'ขยายแผงข้อมูล'}
          >
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-2 sm:p-4 flex flex-col gap-2.5 sm:gap-3">
          {/* Live Draft Advantage Banner (% Display) */}
          {hasScore && (
            <div className="p-2.5 sm:p-3 bg-gradient-to-r from-sky-50/80 via-white to-rose-50/80 rounded-xl border border-[#F3D5E2] flex flex-col gap-1.5 shadow-2xs">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px]">📊</span>
                  <span className="font-['Orbitron'] font-black text-[10.5px] sm:text-[11.5px] text-slate-800 tracking-wider uppercase">
                    LIVE DRAFT ADVANTAGE
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-bold shadow-2xs ${
                      advantageSide === 'blue'
                        ? 'bg-sky-100 text-[#0284C7] border border-sky-300'
                        : advantageSide === 'red'
                        ? 'bg-rose-100 text-[#E11D48] border border-rose-300'
                        : 'bg-slate-100 text-slate-700 border border-slate-300'
                    }`}
                  >
                    {advantageSide === 'blue'
                      ? `🔵 ฝั่งน้ำเงินได้เปรียบ ${bluePercent}%`
                      : advantageSide === 'red'
                      ? `🔴 ฝั่งแดงได้เปรียบ ${redPercent}%`
                      : `≈ สูสีสมดุล 50% : 50%`}
                  </span>
                </div>

                <div className="text-[9.5px] sm:text-[10.5px] font-['Prompt'] font-bold text-slate-500">
                  {advantageSide === 'blue'
                    ? `🔵 ${blueTeamName} ได้เปรียบนำอยู่ +${percentDiff}%`
                    : advantageSide === 'red'
                    ? `🔴 ${redTeamName} ได้เปรียบนำอยู่ +${Math.abs(percentDiff)}%`
                    : 'อัตราความได้เปรียบของทั้งสองฝั่งสูสีกัน'}
                </div>
              </div>

              {/* Real-time Percentage Bar */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 min-w-[50px]">
                  <span className="text-[10px] font-bold text-[#0284C7] truncate max-w-[60px] hidden sm:inline">
                    {blueTeamName}
                  </span>
                  <span className="font-['Orbitron'] font-black text-xs sm:text-[13px] text-[#0284C7]">
                    {bluePercent}%
                  </span>
                </div>

                <div className="flex-1 h-3 bg-slate-200/80 border border-slate-300 rounded-full overflow-hidden flex shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-[#0284c7] to-[#38bdf8] transition-all duration-500"
                    style={{ width: `${bluePercent}%` }}
                    title={`Blue: ${bluePercent}%`}
                  />
                  <div
                    className="h-full bg-gradient-to-l from-[#e11d48] to-[#f43f5e] transition-all duration-500"
                    style={{ width: `${redPercent}%` }}
                    title={`Red: ${redPercent}%`}
                  />
                </div>

                <div className="flex items-center gap-1 min-w-[50px] justify-end flex-row-reverse">
                  <span className="text-[10px] font-bold text-[#E11D48] truncate max-w-[60px] hidden sm:inline">
                    {redTeamName}
                  </span>
                  <span className="font-['Orbitron'] font-black text-xs sm:text-[13px] text-[#E11D48] text-right">
                    {redPercent}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Controls Bar: Mode Switcher & Team Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 pb-2 border-b border-[#F3D5E2]">
            {/* Tab Filter Pills (All / Ban Intent / Combo / Counter) - single horizontal scrolling row on mobile */}
            <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar flex-nowrap py-0.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-2 sm:px-2.5 py-1 rounded-lg text-[9.5px] sm:text-[11px] font-bold tracking-wide transition-all cursor-pointer border flex items-center gap-1 whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'all'
                    ? 'bg-[#E91E63] border-[#E91E63] text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>🎯</span>
                <span>ทั้งหมด ({totalInsightsCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('bans')}
                className={`px-2 sm:px-2.5 py-1 rounded-lg text-[9.5px] sm:text-[11px] font-bold tracking-wide transition-all cursor-pointer border flex items-center gap-1 whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'bans'
                    ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-rose-700 hover:bg-rose-50'
                }`}
              >
                <span>🚫</span>
                <span className="sm:hidden">แบน ➔ หยิบ ({filteredBans.length})</span>
                <span className="hidden sm:inline">แบนตัวนี้ ➔ โอกาสหยิบ ({filteredBans.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('synergies')}
                className={`px-2 sm:px-2.5 py-1 rounded-lg text-[9.5px] sm:text-[11px] font-bold tracking-wide transition-all cursor-pointer border flex items-center gap-1 whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'synergies'
                    ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-amber-700 hover:bg-amber-50'
                }`}
              >
                <span>⚡</span>
                <span className="sm:hidden">คู่หูคอมโบ ({filteredSynergies.length})</span>
                <span className="hidden sm:inline">เลือกตัวนี้ ➔ เล่นคู่กัน ({filteredSynergies.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('counters')}
                className={`px-2 sm:px-2.5 py-1 rounded-lg text-[9.5px] sm:text-[11px] font-bold tracking-wide transition-all cursor-pointer border flex items-center gap-1 whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'counters'
                    ? 'bg-[#0284c7] border-[#0284c7] text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-[#0284c7] hover:bg-sky-50'
                }`}
              >
                <span>🛡️</span>
                <span className="sm:hidden">ตัวแก้ทาง ({filteredCounters.length})</span>
                <span className="hidden sm:inline">แก้ทาง / เคาน์เตอร์ ({filteredCounters.length})</span>
              </button>
            </div>

            {/* Team Filter Pills (All / Blue / Red) */}
            <div className="flex items-center gap-1 self-start sm:self-auto sm:ml-auto overflow-x-auto no-scrollbar flex-nowrap py-0.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase hidden sm:inline">ทีม:</span>
              <button
                type="button"
                onClick={() => setTeamFilter('all')}
                className={`px-2 py-0.5 rounded text-[9.5px] sm:text-[10.5px] font-bold cursor-pointer transition-all border whitespace-nowrap flex items-center gap-1 flex-shrink-0 ${
                  teamFilter === 'all'
                    ? 'bg-slate-800 border-slate-800 text-white shadow-xs ring-1 ring-slate-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
                title="แสดงทั้งสองฝั่ง แยกซ้าย (Blue) และขวา (Red)"
              >
                <span>👥 สองฝั่ง</span>
                <span className="hidden md:inline text-[9px] opacity-80">(ซ้าย Blue / ขวา Red)</span>
              </button>
              <button
                type="button"
                onClick={() => setTeamFilter('blue')}
                className={`px-2 py-0.5 rounded text-[9.5px] sm:text-[10.5px] font-bold cursor-pointer transition-all border whitespace-nowrap flex items-center gap-1 flex-shrink-0 ${
                  teamFilter === 'blue'
                    ? 'bg-[#0284c7] border-[#0284c7] text-white shadow-xs'
                    : 'bg-white border-sky-200 text-[#0284c7] hover:bg-sky-50'
                }`}
              >
                <span>🔵</span>
                <span className="sm:hidden">Blue</span>
                <span className="hidden sm:inline">{blueTeamName || 'Blue'}</span>
                <span className="text-[9px] opacity-90">({blueTotalCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setTeamFilter('red')}
                className={`px-2 py-0.5 rounded text-[9.5px] sm:text-[10.5px] font-bold cursor-pointer transition-all border whitespace-nowrap flex items-center gap-1 flex-shrink-0 ${
                  teamFilter === 'red'
                    ? 'bg-[#e11d48] border-[#e11d48] text-white shadow-xs'
                    : 'bg-white border-rose-200 text-[#e11d48] hover:bg-rose-50'
                }`}
              >
                <span>🔴</span>
                <span className="sm:hidden">Red</span>
                <span className="hidden sm:inline">{redTeamName || 'Red'}</span>
                <span className="text-[9px] opacity-90">({redTotalCount})</span>
              </button>
            </div>
          </div>

          {/* Empty state when no bans/picks yet */}
          {!hasAnyDraftActions && (
            <div className="py-6 px-4 bg-[#FFF8FB] rounded-xl border border-dashed border-[#F3D5E2] flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-full bg-[#FCE4EC] text-[#E91E63] flex items-center justify-center mb-2">
                <span>⚔️</span>
              </div>
              <h4 className="font-bold text-slate-800 text-[13px] mb-1">
                พร้อมเริ่มการวิเคราะห์ดราฟต์เชิงแท็กติก (Tactical Radar)
              </h4>
              <p className="text-[11px] text-slate-500 max-w-[500px]">
                เมื่อเริ่มดราฟต์และมีการแบนหรือเลือกฮีโร่ตัวแรก
                ระบบจะคำนวณทันทีว่าคู่แข่งแบนตัวนี้เพื่อเตรียมหยิบตัวไหน หรือเลือกตัวนี้เพื่อเตรียมคอมโบกับตัวใดในก้าวถัดไป!
              </p>
            </div>
          )}

          {/* Tactical Intelligence Items: Split Left (BLUE) / Right (RED) for 'all', or Single Team */}
          {hasAnyDraftActions && (
            <>
              {teamFilter === 'all' ? (
                /* Split View: Left = BLUE SIDE, Right = RED SIDE */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4 items-start pt-1">
                  {/* Left Column: BLUE SIDE */}
                  <div className="p-2 sm:p-2.5 rounded-2xl bg-sky-50/20 border border-sky-200/80 shadow-2xs">
                    {renderTeamColumn('blue')}
                  </div>

                  {/* Right Column: RED SIDE */}
                  <div className="p-2 sm:p-2.5 rounded-2xl bg-rose-50/20 border border-rose-200/80 shadow-2xs">
                    {renderTeamColumn('red')}
                  </div>
                </div>
              ) : (
                /* Single Team View: Full Width */
                <div className="pt-1">
                  {renderTeamColumn(teamFilter)}
                </div>
              )}
            </>
          )}

          {/* Section ต่อท้าย REAL-TIME TACTICAL RADAR: RPL Pro Meta Comps */}
          <div className="mt-2.5 pt-3 border-t-2 border-[#F3D5E2] bg-gradient-to-r from-amber-50/70 via-white to-amber-50/40 rounded-xl p-2.5 sm:p-3 flex items-center justify-between flex-wrap gap-2.5 shadow-2xs">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center text-base shadow-2xs flex-shrink-0">
                🏆
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-['Orbitron'] font-bold text-xs sm:text-[13px] text-amber-950 tracking-wide">
                    RPL PRO META COMPS
                  </span>
                  <span className="text-[9.5px] font-bold bg-amber-200/80 text-amber-900 border border-amber-300 px-2 py-0.2 rounded-full">
                    {RPL_2026_PRO_COMPS.length} คอมโบดราฟต์โปรลีก
                  </span>
                </div>
                <p className="text-[10.5px] sm:text-[11.5px] text-slate-600 font-medium">
                  ดราฟต์และคอมพ์ 2-4 ตัวที่นักแข่งโปรใช้จริง พร้อมลิสต์ตัวแก้ทางที่โปรต้องแบนในแต่ละแผน
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsProCompsOpen(true)}
              className="font-['Prompt'] text-[11px] sm:text-xs font-bold tracking-wider px-3 sm:px-3.5 py-1.5 rounded-xl border border-amber-400 bg-gradient-to-r from-amber-50 via-amber-100 to-amber-200 hover:from-amber-100 hover:to-amber-300 text-amber-950 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap ml-auto"
              title="เปิดดูดราฟต์และคอมพ์ยอดฮิตที่นักแข่งโปรใช้ใน RoV Pro League"
            >
              <span className="text-sm">🏆</span>
              <span>RPL PRO COMPS</span>
              <span className="text-[10px] bg-amber-500 text-white font-black px-1.5 py-0.2 rounded-full shadow-2xs">
                {RPL_2026_PRO_COMPS.length}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Pro Comps Modal */}
      <ProCompsModal
        isOpen={isProCompsOpen}
        onClose={() => setIsProCompsOpen(false)}
        bannedHeroNames={bannedHeroNames}
        pickedHeroNames={pickedHeroNames}
        bluePicks={bluePicks}
        redPicks={redPicks}
        activeTeam={activeTeam}
        onInspectHero={onInspectHero}
        onPickHeroDirectly={onPickHeroDirectly}
        onBanHeroDirectly={onBanHeroDirectly}
        isPickTurn={isPickTurn}
        isBanTurn={isBanTurn}
      />
    </div>
  );
};
