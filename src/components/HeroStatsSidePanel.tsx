import React, { useState } from 'react';
import {
  X,
  Swords,
  TrendingUp,
  TrendingDown,
  Database,
  ExternalLink,
  Activity,
  Users,
  Shield,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { useHeroStats } from '../hooks/useHeroStats';
import { HEROES, getHeroImageUrl } from '../data/heroes';
import { ActiveSeasonKey } from '../types/stats';

interface HeroStatsSidePanelProps {
  heroName: string | null;
  isOpen: boolean;
  onClose: () => void;
  oppPicks?: string[];
  onSelectHeroToInspect?: (heroName: string) => void;
  onOpenDataModal?: () => void;
}

export const HeroStatsSidePanel: React.FC<HeroStatsSidePanelProps> = ({
  heroName,
  isOpen,
  onClose,
  oppPicks = [],
  onSelectHeroToInspect,
  onOpenDataModal,
}) => {
  const {
    heroStats,
    allSeasonsStats,
    heroMatchups,
    liveMatchups,
    playedWith,
    playedAgainst,
    status,
    activeSeason,
    setActiveSeason,
  } = useHeroStats(heroName, oppPicks);

  const [activeTab, setActiveTab] = useState<'matchups' | 'playedWith' | 'playedAgainst'>('matchups');

  if (!isOpen) return null;

  const currentHero = heroName
    ? HEROES.find((h) => h.name.toLowerCase() === heroName.toLowerCase())
    : null;

  const getSourceUrlForCurrentSeason = () => {
    if (activeSeason === 'winter_2026') {
      return 'https://liquipedia.net/honorofkings/RoV_Pro_League/2026/Winter/Statistics';
    }
    if (activeSeason === 'summer_2026') {
      return 'https://liquipedia.net/honorofkings/RoV_Pro_League/2026/Summer/Statistics';
    }
    return 'https://liquipedia.net/honorofkings/RoV_Pro_League/2026/Summer/Statistics';
  };

  return (
    <aside className="w-full h-full bg-white border-2 border-[#F3D5E2] rounded-2xl shadow-xl flex flex-col overflow-hidden transition-all text-[#1F2937] font-['Prompt'] select-none">
      {/* 1. Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b-2 border-[#F3D5E2] bg-[#FFF0F5] flex-shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <Activity size={15} className="text-[#E91E63] flex-shrink-0" />
          <span className="font-['Prompt'] font-bold text-xs tracking-wider text-[#1F2937] uppercase truncate">
            MATCHUP & HERO STATS
          </span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-0.5">
            <CheckCircle2 size={9} />
            <span>LIQUIPEDIA</span>
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <a
            href={getSourceUrlForCurrentSeason()}
            target="_blank"
            rel="noopener noreferrer"
            title="เปิดหน้าสถิติ Liquipedia RoV Pro League 2026"
            className="p-1 rounded-lg bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors border border-slate-300 shadow-2xs flex items-center gap-1 text-[10px] font-bold"
          >
            <ExternalLink size={12} />
            <span className="hidden sm:inline">Source</span>
          </a>
          {onOpenDataModal && (
            <button
              onClick={onOpenDataModal}
              title="จัดการ Data Layer (JSON / CSV / API)"
              className="p-1 rounded-lg bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors border border-slate-300 cursor-pointer shadow-2xs"
            >
              <Database size={13} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-400 text-slate-600 hover:text-rose-600 transition-colors cursor-pointer shadow-2xs"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* 2. Season Selector Tabs (Strict: Summer 2026 / Winter 2026 / Combined 2026) */}
      <div className="px-2.5 py-1.5 bg-[#FFF8FB] border-b border-[#F3D5E2] flex flex-col gap-1 flex-shrink-0">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
          <span className="flex items-center gap-1">
            <Calendar size={11} className="text-[#E91E63]" />
            <span>ฤดูกาลแข่งขัน (RPL 2026):</span>
          </span>
          <span className="text-[9.5px] text-slate-500 font-normal">
            รวม {status.totalGames} เกม
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1 p-0.5 bg-white rounded-lg border border-[#F3D5E2]">
          <button
            onClick={() => setActiveSeason('summer_2026')}
            className={`py-1 px-1 rounded text-[10px] font-bold transition-all cursor-pointer truncate ${
              activeSeason === 'summer_2026'
                ? 'bg-[#E91E63] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Summer 2026
          </button>
          <button
            onClick={() => setActiveSeason('winter_2026')}
            className={`py-1 px-1 rounded text-[10px] font-bold transition-all cursor-pointer truncate ${
              activeSeason === 'winter_2026'
                ? 'bg-[#E91E63] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Winter 2026
          </button>
          <button
            onClick={() => setActiveSeason('combined_2026')}
            className={`py-1 px-1 rounded text-[10px] font-bold transition-all cursor-pointer truncate ${
              activeSeason === 'combined_2026'
                ? 'bg-[#89114D] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            รวม 2 ฤดูกาล
          </button>
        </div>
      </div>

      {/* 3. Hero Profile Banner */}
      {heroName && currentHero ? (
        <div className="p-2.5 sm:p-3 bg-white border-b border-[#F3D5E2] flex items-center justify-between gap-2.5 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-[#E91E63] shadow-xs flex-shrink-0 bg-slate-100">
              <img
                src={getHeroImageUrl(heroName)}
                alt={heroName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = currentHero.avatarUrl || getHeroImageUrl(currentHero.name);
                }}
              />
              <div className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] font-['Prompt'] font-bold text-center text-white py-0.5 uppercase">
                {currentHero.primaryPos}
              </div>
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-['Prompt'] font-bold text-base text-[#1F2937] tracking-wide truncate">
                  {heroName.toUpperCase()}
                </span>
              </div>
              <span className="text-[11px] font-['Prompt'] text-slate-600 font-medium truncate">
                {currentHero.nameTh} • {currentHero.roles.join(', ')}
              </span>
              <span className="text-[9.5px] font-['Prompt'] font-bold text-[#B45309] mt-0.5 tracking-wider flex items-center gap-1 truncate">
                <span>🏆</span>
                <span className="truncate">{status.tournamentName}</span>
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 text-center text-slate-500 font-['Prompt'] text-xs border-b border-[#F3D5E2] flex-shrink-0">
          คลิกเลือกฮีโร่ในหน้าดราฟเพื่อดูข้อมูลสถิติและคู่ต่อสู้
        </div>
      )}

      {/* 4. Main Stats & Matchups Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2.5 sm:p-3 custom-scrollbar flex flex-col gap-3">
        {/* If no hero selected */}
        {!heroName && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
            <Swords size={32} className="mb-2 opacity-40 text-slate-400" />
            <span className="font-['Prompt'] text-xs font-bold text-slate-600">ยังไม่ได้เลือกฮีโร่</span>
            <span className="font-['Prompt'] text-[11px] text-slate-400 mt-1">
              คลิกการ์ดฮีโร่ในตารางดราฟ หรือเลือกช่อง Pick เพื่อดูสถิติ
            </span>
          </div>
        )}

        {/* HERO INFORMATION SECTION */}
        {heroName && (
          <div className="flex flex-col gap-2.5">
            {/* Header: Verified Liquipedia Badge & Source */}
            <div className="flex items-center justify-between">
              <span className="font-['Prompt'] font-bold text-[10.5px] tracking-wider text-[#1F2937] flex items-center gap-1">
                <span>📊 สถิติการแข่งขันจาก LIQUIPEDIA (RPL 2026)</span>
              </span>
              <span className="text-[9px] font-['Prompt'] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                100% REAL STATS
              </span>
            </div>

            {/* 3-WAY BREAKDOWN SECTION (1. ข้อมูลรวม 2. ข้อมูล Winter 2026 3. ข้อมูล Summer 2026) */}
            <div className="flex flex-col gap-1.5 bg-[#FFF8FB] p-2 rounded-xl border border-[#F3D5E2]">
              <div className="flex items-center justify-between">
                <span className="font-['Prompt'] font-bold text-[10px] text-slate-700 flex items-center gap-1">
                  <span>เปรียบเทียบสถิติ 3 ฤดูกาล:</span>
                </span>
                <span className="text-[9px] text-slate-500 font-medium">
                  {allSeasonsStats.hasAnyData ? 'มีบันทึกการแข่งขัน' : 'ไม่มีสถิติใน RPL 2026'}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                {/* 1. ข้อมูลรวม (Combined 2026) */}
                <div
                  onClick={() => setActiveSeason('combined_2026')}
                  className={`p-2 rounded-lg border transition-all cursor-pointer text-left ${
                    activeSeason === 'combined_2026'
                      ? 'bg-purple-50/90 border-[#89114D] shadow-xs ring-1 ring-[#89114D]/30'
                      : 'bg-white hover:bg-purple-50/40 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#89114D] flex items-center gap-1">
                      <span className="w-4 h-4 rounded-full bg-[#89114D] text-white text-[9px] flex items-center justify-center font-black">
                        1
                      </span>
                      <span>ข้อมูลรวม (Summer & Winter 2026)</span>
                    </span>
                    <span className="text-[8.5px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-900 border border-purple-200">
                      รวม 576 เกม
                    </span>
                  </div>

                  {allSeasonsStats.combined ? (
                    <div className="grid grid-cols-4 gap-1 mt-1.5 pt-1.5 border-t border-purple-100 text-center">
                      <div className="flex flex-col">
                        <span className="text-[8px] text-slate-500 font-medium">WIN RATE</span>
                        <span
                          className={`text-xs font-black ${
                            allSeasonsStats.combined.winRate >= 60
                              ? 'text-emerald-700'
                              : allSeasonsStats.combined.winRate >= 50
                              ? 'text-sky-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {allSeasonsStats.combined.winRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] text-slate-500 font-medium">GAMES</span>
                        <span className="text-xs font-bold text-slate-800">
                          {allSeasonsStats.combined.games} ({allSeasonsStats.combined.wins}W-
                          {allSeasonsStats.combined.losses}L)
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] text-slate-500 font-medium">PICK RATE</span>
                        <span className="text-xs font-bold text-slate-800">
                          {allSeasonsStats.combined.pickRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] text-slate-500 font-medium">BAN RATE</span>
                        <span className="text-xs font-bold text-[#E91E63]">
                          {allSeasonsStats.combined.banRate.toFixed(1)}% ({allSeasonsStats.combined.bans})
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[9.5px] text-slate-400 italic text-center py-1 mt-1 border-t border-purple-100">
                      ไม่มีข้อมูลการแข่งขันรวมใน 2 ฤดูกาลนี้ (0 Pick / 0 Ban)
                    </div>
                  )}
                </div>

                {/* 2. ข้อมูล Winter 2026 */}
                <div
                  onClick={() => setActiveSeason('winter_2026')}
                  className={`p-2 rounded-lg border transition-all cursor-pointer text-left ${
                    activeSeason === 'winter_2026'
                      ? 'bg-sky-50/90 border-[#0284C7] shadow-xs ring-1 ring-[#0284C7]/30'
                      : 'bg-white hover:bg-sky-50/40 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#0284C7] flex items-center gap-1">
                      <span className="w-4 h-4 rounded-full bg-[#0284C7] text-white text-[9px] flex items-center justify-center font-black">
                        2
                      </span>
                      <span>ข้อมูล Winter 2026</span>
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-[8.5px] font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-900 border border-sky-200">
                        285 เกม
                      </span>
                      <a
                        href="https://liquipedia.net/honorofkings/RoV_Pro_League/2026/Winter/Statistics"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-slate-400 hover:text-sky-600 transition-colors"
                        title="เปิดหน้าสถิติ Liquipedia Winter 2026"
                      >
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>

                  {allSeasonsStats.winter ? (
                    <div className="grid grid-cols-4 gap-1 mt-1.5 pt-1.5 border-t border-sky-100 text-center">
                      <div className="flex flex-col">
                        <span className="text-[8px] text-slate-500 font-medium">WIN RATE</span>
                        <span
                          className={`text-xs font-black ${
                            allSeasonsStats.winter.winRate >= 60
                              ? 'text-emerald-700'
                              : allSeasonsStats.winter.winRate >= 50
                              ? 'text-sky-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {allSeasonsStats.winter.games > 0
                            ? `${allSeasonsStats.winter.winRate.toFixed(1)}%`
                            : '0%'}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] text-slate-500 font-medium">GAMES</span>
                        <span className="text-xs font-bold text-slate-800">
                          {allSeasonsStats.winter.games} ({allSeasonsStats.winter.wins}W-
                          {allSeasonsStats.winter.losses}L)
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] text-slate-500 font-medium">PICK RATE</span>
                        <span className="text-xs font-bold text-slate-800">
                          {allSeasonsStats.winter.pickRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] text-slate-500 font-medium">BAN RATE</span>
                        <span className="text-xs font-bold text-[#E91E63]">
                          {allSeasonsStats.winter.banRate.toFixed(1)}% ({allSeasonsStats.winter.bans})
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[9.5px] text-slate-400 italic text-center py-1 mt-1 border-t border-sky-100">
                      ไม่มีข้อมูลในฤดูกาล Winter 2026 (0 Pick / 0 Ban)
                    </div>
                  )}
                </div>

                {/* 3. ข้อมูล Summer 2026 */}
                <div
                  onClick={() => setActiveSeason('summer_2026')}
                  className={`p-2 rounded-lg border transition-all cursor-pointer text-left ${
                    activeSeason === 'summer_2026'
                      ? 'bg-amber-50/90 border-[#D97706] shadow-xs ring-1 ring-[#D97706]/30'
                      : 'bg-white hover:bg-amber-50/40 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#D97706] flex items-center gap-1">
                      <span className="w-4 h-4 rounded-full bg-[#D97706] text-white text-[9px] flex items-center justify-center font-black">
                        3
                      </span>
                      <span>ข้อมูล Summer 2026</span>
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-[8.5px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-200">
                        291 เกม
                      </span>
                      <a
                        href="https://liquipedia.net/honorofkings/RoV_Pro_League/2026/Summer/Statistics"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-slate-400 hover:text-amber-600 transition-colors"
                        title="เปิดหน้าสถิติ Liquipedia Summer 2026"
                      >
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>

                  {allSeasonsStats.summer ? (
                    <div className="grid grid-cols-4 gap-1 mt-1.5 pt-1.5 border-t border-amber-100 text-center">
                      <div className="flex flex-col">
                        <span className="text-[8px] text-slate-500 font-medium">WIN RATE</span>
                        <span
                          className={`text-xs font-black ${
                            allSeasonsStats.summer.winRate >= 60
                              ? 'text-emerald-700'
                              : allSeasonsStats.summer.winRate >= 50
                              ? 'text-sky-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {allSeasonsStats.summer.games > 0
                            ? `${allSeasonsStats.summer.winRate.toFixed(1)}%`
                            : '0%'}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] text-slate-500 font-medium">GAMES</span>
                        <span className="text-xs font-bold text-slate-800">
                          {allSeasonsStats.summer.games} ({allSeasonsStats.summer.wins}W-
                          {allSeasonsStats.summer.losses}L)
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] text-slate-500 font-medium">PICK RATE</span>
                        <span className="text-xs font-bold text-slate-800">
                          {allSeasonsStats.summer.pickRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] text-slate-500 font-medium">BAN RATE</span>
                        <span className="text-xs font-bold text-[#E91E63]">
                          {allSeasonsStats.summer.banRate.toFixed(1)}% ({allSeasonsStats.summer.bans})
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[9.5px] text-slate-400 italic text-center py-1 mt-1 border-t border-amber-100">
                      ไม่มีข้อมูลในฤดูกาล Summer 2026 (0 Pick / 0 Ban)
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Check if Hero has tournament stats in currently active season */}
            {!heroStats || heroStats.games === 0 ? (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-center">
                <span className="px-2 py-0.5 rounded bg-white text-slate-700 font-['Prompt'] font-bold text-xs tracking-wider border border-slate-300 shadow-2xs">
                  ไม่มีข้อมูลการแข่งขันใน {status.tournamentName}
                </span>
                <span className="text-[10.5px] font-['Prompt'] text-slate-600 mt-1.5">
                  ไม่มีการบันทึกการ Pick ในฤดูกาลที่เลือก ({heroStats?.bans ? `โดนแบน ${heroStats.bans} ครั้ง` : '0 Pick / 0 Ban'})
                </span>
                <span className="text-[9.5px] font-['Prompt'] text-slate-400 mt-0.5">
                  (ระบบไม่สร้างสถิติจำลองตามหลัก Data Integrity)
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                  <span>รายละเอียดเชิงลึกมุมมองปัจจุบัน ({status.tournamentName}):</span>
                </div>

                {/* 3 Key Metric Cards */}
                <div className="grid grid-cols-3 gap-1.5">
                  {/* WIN RATE */}
                  <div className="p-2 rounded-xl bg-white border border-[#F3D5E2] flex flex-col items-center justify-center text-center shadow-xs min-w-0">
                    <span className="text-[8.5px] sm:text-[9px] font-['Prompt'] font-bold text-slate-500 tracking-wider uppercase truncate w-full">
                      WIN RATE
                    </span>
                    <span
                      className={`text-sm sm:text-base font-['Prompt'] font-extrabold mt-0.5 ${
                        heroStats.winRate >= 60
                          ? 'text-emerald-700'
                          : heroStats.winRate >= 52
                          ? 'text-sky-700'
                          : heroStats.winRate >= 48
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {heroStats.winRate.toFixed(1)}%
                    </span>
                    <span className="text-[8px] sm:text-[8.5px] font-['Prompt'] text-slate-500 mt-0.5 truncate w-full">
                      {heroStats.wins}W - {heroStats.losses}L
                    </span>
                  </div>

                  {/* PICK RATE */}
                  <div className="p-2 rounded-xl bg-white border border-[#F3D5E2] flex flex-col items-center justify-center text-center shadow-xs min-w-0">
                    <span className="text-[8.5px] sm:text-[9px] font-['Prompt'] font-bold text-slate-500 tracking-wider uppercase truncate w-full">
                      PICK RATE
                    </span>
                    <span className="text-sm sm:text-base font-['Prompt'] font-extrabold text-slate-800 mt-0.5">
                      {heroStats.pickRate.toFixed(1)}%
                    </span>
                    <span className="text-[8px] sm:text-[8.5px] font-['Prompt'] text-slate-500 mt-0.5 truncate w-full">
                      {heroStats.games} Games
                    </span>
                  </div>

                  {/* BAN RATE */}
                  <div className="p-2 rounded-xl bg-white border border-[#F3D5E2] flex flex-col items-center justify-center text-center shadow-xs min-w-0">
                    <span className="text-[8.5px] sm:text-[9px] font-['Prompt'] font-bold text-slate-500 tracking-wider uppercase truncate w-full">
                      BAN RATE
                    </span>
                    <span className="text-sm sm:text-base font-['Prompt'] font-extrabold text-[#E91E63] mt-0.5">
                      {heroStats.banRate.toFixed(1)}%
                    </span>
                    <span className="text-[8px] sm:text-[8.5px] font-['Prompt'] text-slate-500 mt-0.5 truncate w-full">
                      {heroStats.bans} Bans
                    </span>
                  </div>
                </div>

                {/* Additional Tournament Metrics */}
                <div className="px-2.5 py-1.5 rounded-lg bg-[#FFF8FB] border border-[#F3D5E2] flex flex-wrap items-center justify-between gap-1 text-[10px] sm:text-[10.5px] font-['Prompt'] text-slate-600">
                  <span className="whitespace-nowrap">
                    Presence (P+B): <strong className="text-slate-800 font-bold">{heroStats.presenceRate.toFixed(1)}%</strong>
                  </span>
                  {heroStats.blueWins !== undefined && heroStats.redWins !== undefined && (
                    <span className="whitespace-nowrap">
                      Blue: <strong className="text-sky-700 font-bold">{Math.round((heroStats.blueWins / ((heroStats.blueWins + (heroStats.blueLosses || 0)) || 1)) * 100)}%</strong> | Red: <strong className="text-rose-700 font-bold">{Math.round((heroStats.redWins / ((heroStats.redWins + (heroStats.redLosses || 0)) || 1)) * 100)}%</strong>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUB-NAVIGATION TABS: Matchups / Played With (เล่นกับ) / Played Against (เจอกับ) */}
        {heroName && (
          <div className="grid grid-cols-3 gap-1 p-0.5 bg-white rounded-xl border border-[#F3D5E2] text-[9.5px] sm:text-[10px] font-['Prompt'] font-bold shadow-2xs">
            <button
              onClick={() => setActiveTab('matchups')}
              className={`py-1.5 px-1 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer min-w-0 ${
                activeTab === 'matchups'
                  ? 'bg-[#E91E63] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Swords size={11} className="flex-shrink-0" />
              <span className="truncate">MATCHUPS</span>
            </button>
            <button
              onClick={() => setActiveTab('playedWith')}
              className={`py-1.5 px-1 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer min-w-0 ${
                activeTab === 'playedWith'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users size={11} className="flex-shrink-0" />
              <span className="truncate">PLAYED WITH</span>
            </button>
            <button
              onClick={() => setActiveTab('playedAgainst')}
              className={`py-1.5 px-1 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer min-w-0 ${
                activeTab === 'playedAgainst'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Shield size={11} className="flex-shrink-0" />
              <span className="truncate">AGAINST</span>
            </button>
          </div>
        )}

        {/* TAB 1: MATCHUPS OVERVIEW (Live Picks + Strong + Weak) */}
        {heroName && activeTab === 'matchups' && (
          <>
            {/* REAL-TIME MATCHUPS VS OPPONENT PICKS (DRAFT CONTEXT) */}
            {oppPicks.length > 0 && (
              <div className="flex flex-col gap-2 pt-2 border-t border-[#F3D5E2]">
                <div className="flex items-center justify-between">
                  <span className="font-['Prompt'] font-bold text-[11px] tracking-wider text-sky-700 flex items-center gap-1.5">
                    <Swords size={12} />
                    <span>VS OPPONENT PICKS (REAL-TIME H2H)</span>
                  </span>
                  <span className="text-[10px] font-['Prompt'] text-slate-500">
                    {oppPicks.length} ENEMY PICKS
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 bg-[#FFF8FB] p-2 rounded-xl border border-[#F3D5E2]">
                  {liveMatchups.map(({ oppHero, matchup }) => (
                    <div
                      key={oppHero}
                      className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg bg-white border border-[#F3D5E2] hover:border-[#E91E63] transition-all text-xs shadow-2xs gap-2 min-w-0"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <img
                          src={getHeroImageUrl(oppHero)}
                          alt={oppHero}
                          className="w-6 h-6 rounded object-cover border border-[#F3D5E2] flex-shrink-0"
                        />
                        <span className="font-['Prompt'] font-bold text-xs text-slate-800 truncate">
                          vs {oppHero}
                        </span>
                      </div>

                      {matchup ? (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[9.5px] font-['Prompt'] text-slate-500 whitespace-nowrap">
                            {matchup.winRate.toFixed(1)}% ({matchup.games}G)
                          </span>
                          <span
                            className={`font-['Prompt'] font-bold text-[10.5px] px-1.5 py-0.5 rounded border whitespace-nowrap ${
                              matchup.diff >= 0
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                : 'bg-rose-50 border-rose-300 text-rose-700'
                            }`}
                          >
                            {matchup.diff > 0 ? `+${matchup.diff.toFixed(1)}%` : `${matchup.diff.toFixed(1)}%`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[9.5px] font-['Prompt'] text-slate-400 italic flex-shrink-0">
                          ไม่มีข้อมูลสถิติการแก้ทางโดยตรงจากแหล่งข้อมูลที่กำหนด
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STRONG AGAINST SECTION */}
            <div className="flex flex-col gap-2 pt-2 border-t border-[#F3D5E2]">
              <div className="flex items-center justify-between">
                <span className="font-['Prompt'] font-bold text-[11px] tracking-wider text-emerald-700 flex items-center gap-1.5">
                  <TrendingUp size={13} />
                  <span>STRONG AGAINST (ได้เปรียบ H2H จริง)</span>
                </span>
                {heroMatchups && heroMatchups.strongAgainst.length > 0 && (
                  <span className="text-[10px] font-['Prompt'] text-emerald-700 font-bold">
                    {heroMatchups.strongAgainst.length} HEROES
                  </span>
                )}
              </div>

              {!heroMatchups || heroMatchups.strongAgainst.length === 0 ? (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10.5px] font-['Prompt'] text-slate-500 font-bold">
                    ไม่มีข้อมูลสถิติการแก้ทางโดยตรงจากแหล่งข้อมูลที่กำหนด
                  </span>
                  <p className="text-[10px] font-['Prompt'] text-slate-400 mt-0.5">
                    (ไม่มีบันทึกการพบกันจริงที่มีอัตราชนะได้เปรียบใน {status.tournamentName})
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {heroMatchups.strongAgainst.map((m) => (
                    <div
                      key={m.opponentHero}
                      onClick={() => onSelectHeroToInspect && onSelectHeroToInspect(m.opponentHero)}
                      className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg bg-emerald-50 border border-emerald-300 hover:border-emerald-500 transition-all cursor-pointer group shadow-2xs gap-2 min-w-0"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <img
                          src={getHeroImageUrl(m.opponentHero)}
                          alt={m.opponentHero}
                          className="w-7 h-7 rounded object-cover border border-emerald-300 group-hover:scale-105 transition-transform flex-shrink-0"
                        />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-['Prompt'] font-bold text-xs text-slate-800 group-hover:text-emerald-800 transition-colors truncate">
                            {m.opponentHero}
                          </span>
                          <span className="text-[9.5px] font-['Prompt'] text-slate-500 truncate">
                            {m.winRate.toFixed(1)}% WR ({m.games}G: {m.wins}W - {m.losses}L)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 font-['Prompt'] font-bold text-[11px] text-emerald-800 bg-white px-1.5 py-0.5 rounded border border-emerald-300 shadow-2xs flex-shrink-0 whitespace-nowrap">
                        <span>+{m.diff.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* WEAK AGAINST SECTION */}
            <div className="flex flex-col gap-2 pt-2 border-t border-[#F3D5E2]">
              <div className="flex items-center justify-between">
                <span className="font-['Prompt'] font-bold text-[11px] tracking-wider text-rose-700 flex items-center gap-1.5">
                  <TrendingDown size={13} />
                  <span>WEAK AGAINST (เสียเปรียบ H2H จริง)</span>
                </span>
                {heroMatchups && heroMatchups.weakAgainst.length > 0 && (
                  <span className="text-[10px] font-['Prompt'] text-rose-700 font-bold">
                    {heroMatchups.weakAgainst.length} HEROES
                  </span>
                )}
              </div>

              {!heroMatchups || heroMatchups.weakAgainst.length === 0 ? (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10.5px] font-['Prompt'] text-slate-500 font-bold">
                    ไม่มีข้อมูลสถิติการแก้ทางโดยตรงจากแหล่งข้อมูลที่กำหนด
                  </span>
                  <p className="text-[10px] font-['Prompt'] text-slate-400 mt-0.5">
                    (ไม่มีบันทึกการพบกันจริงที่มีอัตราชนะเสียเปรียบใน {status.tournamentName})
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {heroMatchups.weakAgainst.map((m) => (
                    <div
                      key={m.opponentHero}
                      onClick={() => onSelectHeroToInspect && onSelectHeroToInspect(m.opponentHero)}
                      className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg bg-rose-50 border border-rose-300 hover:border-rose-500 transition-all cursor-pointer group shadow-2xs gap-2 min-w-0"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <img
                          src={getHeroImageUrl(m.opponentHero)}
                          alt={m.opponentHero}
                          className="w-7 h-7 rounded object-cover border border-rose-300 group-hover:scale-105 transition-transform flex-shrink-0"
                        />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-['Prompt'] font-bold text-xs text-slate-800 group-hover:text-rose-800 transition-colors truncate">
                            {m.opponentHero}
                          </span>
                          <span className="text-[9.5px] font-['Prompt'] text-slate-500 truncate">
                            {m.winRate.toFixed(1)}% WR ({m.games}G: {m.wins}W - {m.losses}L)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 font-['Prompt'] font-bold text-[11px] text-rose-800 bg-white px-1.5 py-0.5 rounded border border-rose-300 shadow-2xs flex-shrink-0 whitespace-nowrap">
                        <span>{m.diff.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* TAB 2: PLAYED WITH (เล่นกับ - คอมโบเพื่อนร่วมทีม) */}
        {heroName && activeTab === 'playedWith' && (
          <div className="flex flex-col gap-2 pt-2 border-t border-[#F3D5E2]">
            <div className="flex items-center justify-between">
              <span className="font-['Prompt'] font-bold text-[11px] tracking-wider text-emerald-700 flex items-center gap-1.5">
                <Users size={13} />
                <span>PLAYED WITH (เล่นกับ - คอมโบทีม)</span>
              </span>
              <span className="text-[10px] font-['Prompt'] text-slate-500">
                {playedWith.length} COMBOS
              </span>
            </div>

            <p className="text-[10.5px] font-['Prompt'] text-slate-600 bg-emerald-50 p-2 rounded-lg border border-emerald-300">
              🤝 อัตราชนะเมื่อ <strong className="text-slate-900 font-bold">{heroName}</strong> ได้เล่นร่วมทีมเดียวกัน จาก Liquipedia {status.tournamentName}
            </p>

            {playedWith.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[11px] font-['Prompt'] text-slate-600 font-bold">
                  ไม่มีสถิติคู่หูโดยตรงจากแหล่งข้อมูลที่กำหนด
                </span>
                <p className="text-[10px] font-['Prompt'] text-slate-400 mt-1">
                  (ยังไม่มีบันทึกการเล่นร่วมทีมใน {status.tournamentName})
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {playedWith.map((combo) => (
                  <div
                    key={combo.allyHero}
                    onClick={() => onSelectHeroToInspect && onSelectHeroToInspect(combo.allyHero)}
                    className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg bg-emerald-50/60 border border-emerald-300 hover:border-emerald-500 transition-all cursor-pointer group shadow-2xs gap-2 min-w-0"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <img
                        src={getHeroImageUrl(combo.allyHero)}
                        alt={combo.allyHero}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover border border-emerald-300 group-hover:scale-105 transition-transform flex-shrink-0"
                      />
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="font-['Prompt'] font-bold text-xs text-slate-800 group-hover:text-emerald-800 transition-colors truncate">
                            {combo.allyHero}
                          </span>
                          <span className="text-[8.5px] font-['Prompt'] text-emerald-800 font-semibold px-1 py-0.2 rounded bg-emerald-100 flex-shrink-0">
                            Direct Synergy
                          </span>
                        </div>
                        <span className="text-[9.5px] font-['Prompt'] text-slate-500 truncate">
                          {combo.games} Games ({combo.wins}W - {combo.losses}L)
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end flex-shrink-0 text-right">
                      <span className="font-['Prompt'] font-bold text-xs text-emerald-800 whitespace-nowrap">
                        {combo.winRate.toFixed(1)}% WR
                      </span>
                      {combo.diff !== undefined && (
                        <span
                          className={`text-[9px] font-['Prompt'] font-bold whitespace-nowrap ${
                            combo.diff >= 0 ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {combo.diff > 0 ? `+${combo.diff.toFixed(1)}%` : `${combo.diff.toFixed(1)}%`}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PLAYED AGAINST (เจอกับ - คู่แข่งทั้งหมด) */}
        {heroName && activeTab === 'playedAgainst' && (
          <div className="flex flex-col gap-2 pt-2 border-t border-[#F3D5E2]">
            <div className="flex items-center justify-between">
              <span className="font-['Prompt'] font-bold text-[11px] tracking-wider text-sky-700 flex items-center gap-1.5">
                <Shield size={13} />
                <span>PLAYED AGAINST (เจอกับ - ฝั่งตรงข้าม)</span>
              </span>
              <span className="text-[10px] font-['Prompt'] text-slate-500">
                {playedAgainst.length} MATCHUPS
              </span>
            </div>

            <p className="text-[10.5px] font-['Prompt'] text-slate-600 bg-sky-50 p-2 rounded-lg border border-sky-300">
              ⚔️ อัตราชนะ Head-to-Head เมื่อ <strong className="text-slate-900 font-bold">{heroName}</strong> พบกับฮีโร่ฝั่งตรงข้ามใน {status.tournamentName}
            </p>

            {playedAgainst.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[11px] font-['Prompt'] text-slate-600 font-bold">
                  ไม่มีข้อมูลสถิติการแก้ทางโดยตรงจากแหล่งข้อมูลที่กำหนด
                </span>
                <p className="text-[10px] font-['Prompt'] text-slate-400 mt-1">
                  (ยังไม่มีบันทึกการพบกันจริงใน {status.tournamentName})
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {playedAgainst.map((m) => (
                  <div
                    key={m.opponentHero}
                    onClick={() => onSelectHeroToInspect && onSelectHeroToInspect(m.opponentHero)}
                    className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg bg-white border border-[#F3D5E2] hover:border-sky-400 transition-all cursor-pointer group shadow-2xs gap-2 min-w-0"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <img
                        src={getHeroImageUrl(m.opponentHero)}
                        alt={m.opponentHero}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover border border-[#F3D5E2] group-hover:scale-105 transition-transform flex-shrink-0"
                      />
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="font-['Prompt'] font-bold text-xs text-slate-800 group-hover:text-sky-700 transition-colors truncate">
                            vs {m.opponentHero}
                          </span>
                          <span
                            className={`text-[8.5px] font-['Prompt'] font-bold px-1 py-0.2 rounded border flex-shrink-0 ${
                              m.diff >= 0
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                : 'bg-rose-50 border-rose-300 text-rose-700'
                            }`}
                          >
                            {m.diff >= 0 ? 'ได้เปรียบ' : 'เสียเปรียบ'}
                          </span>
                        </div>
                        <span className="text-[9.5px] font-['Prompt'] text-slate-500 truncate">
                          {m.games} Games ({m.wins}W - {m.losses}L)
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end flex-shrink-0 text-right">
                      <span
                        className={`font-['Prompt'] font-bold text-xs whitespace-nowrap ${
                          m.winRate >= 50 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {m.winRate.toFixed(1)}% WR
                      </span>
                      <span
                        className={`text-[9px] font-['Prompt'] font-bold whitespace-nowrap ${
                          m.diff >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {m.diff > 0 ? `+${m.diff.toFixed(1)}%` : `${m.diff.toFixed(1)}%`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Footer info with verified sources notice */}
      <div className="p-2.5 sm:p-3 border-t border-[#F3D5E2] bg-[#FFF8FB] flex flex-col gap-1 text-[10px] font-['Prompt'] text-slate-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 truncate">
            <Database size={11} className="text-[#E91E63] flex-shrink-0" />
            <span className="truncate">Liquipedia RPL 2026 ({status.season})</span>
          </div>
          <span className="text-[9px] font-semibold text-emerald-700 flex-shrink-0">
            ✓ Strictly Verified
          </span>
        </div>
      </div>
    </aside>
  );
};
