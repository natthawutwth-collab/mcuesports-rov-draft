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

interface DraftTacticalRadarProps {
  blueBans: (Hero | null)[];
  redBans: (Hero | null)[];
  bluePicks: { hero: Hero | null; pos?: string }[];
  redPicks: { hero: Hero | null; pos?: string }[];
  bannedHeroNames: Set<string>;
  pickedHeroNames: Set<string>;
  onInspectHero: (heroName: string) => void;
  onPickHeroDirectly?: (heroName: string) => void;
  isPickTurn?: boolean;
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
  isPickTurn = false,
  blueTeamName = 'Blue Team',
  redTeamName = 'Red Team',
  blueScore,
  redScore,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabMode>('all');
  const [teamFilter, setTeamFilter] = useState<TeamFilter>('all');

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

  // Filtered ban predictions
  const filteredBans = useMemo(() => {
    if (teamFilter === 'all') return intelligence.banPredictions;
    return intelligence.banPredictions.filter((item) => item.team === teamFilter);
  }, [intelligence.banPredictions, teamFilter]);

  // Filtered synergy predictions
  const filteredSynergies = useMemo(() => {
    if (teamFilter === 'all') return intelligence.pickSynergies;
    return intelligence.pickSynergies.filter((item) => item.team === teamFilter);
  }, [intelligence.pickSynergies, teamFilter]);

  // Filtered counters
  const filteredCounters = useMemo(() => {
    if (teamFilter === 'all') return intelligence.counterSuggestions;
    if (teamFilter === 'blue') return intelligence.counterSuggestions.filter((item) => item.targetTeam === 'red'); // Counters against red
    return intelligence.counterSuggestions.filter((item) => item.targetTeam === 'blue'); // Counters against blue
  }, [intelligence.counterSuggestions, teamFilter]);

  const totalInsightsCount = filteredBans.length + filteredSynergies.length + filteredCounters.length;

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
                className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold cursor-pointer transition-all border whitespace-nowrap flex-shrink-0 ${
                  teamFilter === 'all'
                    ? 'bg-slate-800 border-slate-800 text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                สองฝั่ง
              </button>
              <button
                type="button"
                onClick={() => setTeamFilter('blue')}
                className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold cursor-pointer transition-all border whitespace-nowrap flex-shrink-0 ${
                  teamFilter === 'blue'
                    ? 'bg-[#0284c7] border-[#0284c7] text-white'
                    : 'bg-white border-sky-200 text-[#0284c7] hover:bg-sky-50'
                }`}
              >
                🔵 <span className="sm:hidden">Blue</span><span className="hidden sm:inline">{blueTeamName || 'Blue'}</span>
              </button>
              <button
                type="button"
                onClick={() => setTeamFilter('red')}
                className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold cursor-pointer transition-all border whitespace-nowrap flex-shrink-0 ${
                  teamFilter === 'red'
                    ? 'bg-[#e11d48] border-[#e11d48] text-white'
                    : 'bg-white border-rose-200 text-[#e11d48] hover:bg-rose-50'
                }`}
              >
                🔴 <span className="sm:hidden">Red</span><span className="hidden sm:inline">{redTeamName || 'Red'}</span>
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

          {/* Section 1: Ban-to-Pick Predictions ("เขาแบนตัวนี้ -> มีโอกาสจะหยิบตัวนี้") */}
          {(activeTab === 'all' || activeTab === 'bans') && filteredBans.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                <Ban size={14} className="text-rose-600" />
                <span>เจาะแท็กติกการแบน: เขาแบนตัวนี้ → มีโอกาสจะหยิบตัวนี้ ({filteredBans.length})</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {filteredBans.slice(0, activeTab === 'all' ? 6 : 18).map((item) => (
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
                    {/* Top: Trigger & Arrow & Predicted Target */}
                    <div className="flex items-center justify-between gap-2">
                      {/* Banned Hero (Left) */}
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

                      {/* Transition Arrow with Probability */}
                      <div className="flex flex-col items-center flex-shrink-0 px-1">
                        <span className="text-[9px] font-['Orbitron'] font-black text-[#E91E63]">
                          {item.confidence}%
                        </span>
                        <span className="text-xs text-slate-400">➔</span>
                      </div>

                      {/* Predicted Target Hero (Right) */}
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
                          <span className="text-[9.5px] font-bold text-[#E91E63] truncate">
                            มีโอกาสหยิบ
                          </span>
                          <span className="text-[12px] font-black text-slate-900 truncate">
                            {item.predictedHero}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Reasoning Note */}
                    <div className="text-[10.5px] text-slate-600 bg-white/90 p-1.5 rounded-lg border border-slate-200 leading-relaxed">
                      💡 {item.reason}
                    </div>

                    {/* Bottom: Action Buttons */}
                    <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
                      <div>
                        {item.isAvailable ? (
                          <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>ว่างอยู่ในพูล</span>
                          </span>
                        ) : (
                          <span className="text-[9.5px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
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
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Pick-to-Combo Synergy ("เขาเลือกตัวนี้ -> มีโอกาสเอามาเล่นคู่กับตัวนี้") */}
          {(activeTab === 'all' || activeTab === 'synergies') && filteredSynergies.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                <Zap size={14} className="text-amber-600" />
                <span>วิเคราะห์คอมโบคู่หู: เขาเลือกตัวนี้ → มีโอกาสเอามาเล่นคู่กับตัวนี้ ({filteredSynergies.length})</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {filteredSynergies.slice(0, activeTab === 'all' ? 6 : 18).map((item) => (
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
                    {/* Top: Selected Hero & Predicted Synergy Partner */}
                    <div className="flex items-center justify-between gap-2">
                      {/* Picked Hero (Left) */}
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

                      {/* Combo Link Badge */}
                      <div className="flex flex-col items-center flex-shrink-0 px-1">
                        <span className="text-[8.5px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300">
                          {item.comboName || 'คู่หูคอมโบ'}
                        </span>
                        <span className="text-xs text-amber-500 font-bold">⚡ คู่กับ ⚡</span>
                      </div>

                      {/* Predicted Synergy Partner (Right) */}
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

                    {/* Middle: Tactical Reason */}
                    <div className="text-[10.5px] text-slate-600 bg-white/90 p-1.5 rounded-lg border border-slate-200 leading-relaxed">
                      ⚡ {item.reason}
                    </div>

                    {/* Bottom: Action Buttons */}
                    <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
                      <div>
                        {item.isAvailable ? (
                          <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>ว่างอยู่ในพูล ({item.confidence}% โอกาส)</span>
                          </span>
                        ) : (
                          <span className="text-[9.5px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
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
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Counter-Pick Recommendations */}
          {(activeTab === 'all' || activeTab === 'counters') && filteredCounters.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                <ShieldAlert size={14} className="text-sky-600" />
                <span>คำแนะนำการแก้ทาง: อีกฝั่งมีตัวนี้ → แนะนำหยิบตัวนี้มาเคาน์เตอร์ ({filteredCounters.length})</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {filteredCounters.slice(0, activeTab === 'all' ? 6 : 18).map((item) => (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-xl border-2 transition-all flex flex-col justify-between gap-2 shadow-2xs ${
                      !item.isAvailable
                        ? 'bg-slate-50 border-slate-200 opacity-60'
                        : 'bg-gradient-to-r from-sky-50/70 to-white border-sky-300 hover:border-sky-500'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      {/* Target Enemy Hero */}
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

                      {/* Counter Arrow */}
                      <div className="flex flex-col items-center flex-shrink-0 px-1">
                        <span className="text-[9px] font-bold text-sky-600 bg-sky-100 px-1.5 py-0.2 rounded border border-sky-300">
                          แก้ทาง
                        </span>
                        <span className="text-xs text-sky-500 font-bold">⚔️ ฟันธง ⚔️</span>
                      </div>

                      {/* Recommended Counter Hero */}
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

                    <div className="text-[10.5px] text-slate-600 bg-white/90 p-1.5 rounded-lg border border-slate-200 leading-relaxed">
                      🛡️ {item.reason}
                    </div>

                    <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
                      <div>
                        {item.isAvailable ? (
                          <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>ว่างในพูล (แก้ทางได้ผล {item.confidence}%)</span>
                          </span>
                        ) : (
                          <span className="text-[9.5px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
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
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
