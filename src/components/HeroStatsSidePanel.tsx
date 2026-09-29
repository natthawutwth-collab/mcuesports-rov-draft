import React, { useState } from 'react';
import { X, ShieldAlert, Swords, TrendingUp, TrendingDown, Database, ExternalLink, Activity, Users, Shield } from 'lucide-react';
import { useHeroStats } from '../hooks/useHeroStats';
import { HEROES, getHeroImageUrl } from '../data/heroes';

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
  const { heroStats, heroMatchups, liveMatchups, playedWith, playedAgainst, status } = useHeroStats(heroName, oppPicks);
  const [activeTab, setActiveTab] = useState<'matchups' | 'playedWith' | 'playedAgainst'>('matchups');

  if (!isOpen) return null;

  const currentHero = heroName ? HEROES.find((h) => h.name.toLowerCase() === heroName.toLowerCase()) : null;

  return (
    <aside className="w-full sm:w-80 md:w-96 bg-white border-l-2 border-[#F3D5E2] shadow-2xl flex flex-col z-40 fixed inset-y-0 right-0 sm:relative sm:inset-auto h-full max-h-screen transition-all duration-300 animate-in slide-in-from-right font-['Prompt'] text-[#1F2937]">
      {/* 1. Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b-2 border-[#F3D5E2] bg-[#FFF0F5]">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-[#E91E63]" />
          <span className="font-['Prompt'] font-bold text-xs tracking-wider text-[#1F2937] uppercase">
            MATCHUP & HERO STATS
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <a
            href="https://liquipedia.net/honorofkings/RoV_Pro_League/2026/Summer/Statistics"
            target="_blank"
            rel="noopener noreferrer"
            title="เปิดหน้าสถิติ Liquipedia RPL 2026 Summer"
            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors border border-slate-300 shadow-2xs"
          >
            <ExternalLink size={14} />
          </a>
          {onOpenDataModal && (
            <button
              onClick={onOpenDataModal}
              title="จัดการ Data Layer (JSON / CSV / API)"
              className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors border border-slate-300 cursor-pointer shadow-2xs"
            >
              <Database size={14} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-400 text-slate-600 hover:text-rose-600 transition-colors cursor-pointer shadow-2xs"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* 2. Hero Profile Banner */}
      {heroName && currentHero ? (
        <div className="p-4 bg-[#FFF8FB] border-b border-[#F3D5E2] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14 rounded-xl overflow-hidden border-2 border-[#E91E63] shadow-xs flex-shrink-0 bg-slate-100">
              <img
                src={getHeroImageUrl(heroName)}
                alt={heroName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = currentHero.avatarUrl || getHeroImageUrl(currentHero.name);
                }}
              />
              <div className="absolute bottom-0 inset-x-0 bg-black/80 text-[8.5px] font-['Prompt'] font-bold text-center text-white py-0.5 uppercase">
                {currentHero.primaryPos}
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-['Prompt'] font-bold text-lg text-[#1F2937] tracking-wide">
                  {heroName.toUpperCase()}
                </span>
              </div>
              <span className="text-xs font-['Prompt'] text-slate-600 font-medium">
                {currentHero.nameTh} • {currentHero.roles.join(', ')}
              </span>
              <span className="text-[10px] font-['Prompt'] font-bold text-[#B45309] mt-0.5 tracking-wider flex items-center gap-1">
                <span>🏆</span>
                <span>{status.tournamentName}</span>
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-slate-500 font-['Prompt'] text-xs border-b border-[#F3D5E2]">
          คลิกเลือกฮีโร่ในหน้าดราฟเพื่อดูข้อมูลสถิติและคู่ต่อสู้
        </div>
      )}

      {/* 3. Main Stats & Matchups Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-4">
        {/* If no hero selected */}
        {!heroName && (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
            <Swords size={36} className="mb-2 opacity-40 text-slate-400" />
            <span className="font-['Prompt'] text-xs font-bold text-slate-600">ยังไม่ได้เลือกฮีโร่</span>
            <span className="font-['Prompt'] text-[11px] text-slate-400 mt-1">
              คลิกการ์ดฮีโร่ในตารางดราฟ หรือเลือกช่อง Pick เพื่อดูสถิติ
            </span>
          </div>
        )}

        {/* HERO INFORMATION SECTION */}
        {heroName && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-['Prompt'] font-bold text-[11px] tracking-wider text-[#1F2937] flex items-center gap-1.5">
                <span>📊 HERO INFORMATION</span>
              </span>
              <span className="text-[10px] font-['Prompt'] text-slate-500">
                LIQUEPEDIA STATS
              </span>
            </div>

            {/* Check if Hero has tournament stats */}
            {!heroStats ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-center">
                <span className="px-2 py-0.5 rounded bg-white text-slate-700 font-['Prompt'] font-bold text-xs tracking-wider border border-slate-300 shadow-2xs">
                  NO DATA
                </span>
                <span className="text-[11px] font-['Prompt'] text-slate-600 mt-2">
                  ไม่มีข้อมูลสถิติในการแข่งขัน {status.tournamentName}
                </span>
                <span className="text-[10px] font-['Prompt'] text-slate-400 mt-0.5">
                  (ไม่มีการบันทึกการเล่นหรือแบนในทัวร์นาเมนต์นี้)
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {/* 3 Key Metric Cards */}
                <div className="grid grid-cols-3 gap-2">
                  {/* WIN RATE */}
                  <div className="p-2.5 rounded-xl bg-white border border-[#F3D5E2] flex flex-col items-center justify-center text-center shadow-xs">
                    <span className="text-[9.5px] font-['Prompt'] font-bold text-slate-500 tracking-wider uppercase">
                      WIN RATE
                    </span>
                    <span
                      className={`text-base font-['Prompt'] font-extrabold mt-0.5 ${
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
                    <span className="text-[9px] font-['Prompt'] text-slate-500 mt-0.5">
                      {heroStats.wins}W - {heroStats.losses}L
                    </span>
                  </div>

                  {/* PICK RATE */}
                  <div className="p-2.5 rounded-xl bg-white border border-[#F3D5E2] flex flex-col items-center justify-center text-center shadow-xs">
                    <span className="text-[9.5px] font-['Prompt'] font-bold text-slate-500 tracking-wider uppercase">
                      PICK RATE
                    </span>
                    <span className="text-base font-['Prompt'] font-extrabold text-slate-800 mt-0.5">
                      {heroStats.pickRate.toFixed(1)}%
                    </span>
                    <span className="text-[9px] font-['Prompt'] text-slate-500 mt-0.5">
                      {heroStats.games} Games
                    </span>
                  </div>

                  {/* BAN RATE */}
                  <div className="p-2.5 rounded-xl bg-white border border-[#F3D5E2] flex flex-col items-center justify-center text-center shadow-xs">
                    <span className="text-[9.5px] font-['Prompt'] font-bold text-slate-500 tracking-wider uppercase">
                      BAN RATE
                    </span>
                    <span className="text-base font-['Prompt'] font-extrabold text-[#E91E63] mt-0.5">
                      {heroStats.banRate.toFixed(1)}%
                    </span>
                    <span className="text-[9px] font-['Prompt'] text-slate-500 mt-0.5">
                      {heroStats.bans} Bans
                    </span>
                  </div>
                </div>

                {/* Additional Tournament Metrics */}
                <div className="px-3 py-2 rounded-lg bg-[#FFF8FB] border border-[#F3D5E2] flex items-center justify-between text-[11px] font-['Prompt'] text-slate-600">
                  <span>Presence (P+B): <strong className="text-slate-800 font-bold">{heroStats.presenceRate.toFixed(1)}%</strong></span>
                  {heroStats.blueWins !== undefined && heroStats.redWins !== undefined && (
                    <span>Blue WR: <strong className="text-sky-700 font-bold">{Math.round((heroStats.blueWins / ((heroStats.blueWins + (heroStats.blueLosses || 0)) || 1)) * 100)}%</strong> | Red: <strong className="text-rose-700 font-bold">{Math.round((heroStats.redWins / ((heroStats.redWins + (heroStats.redLosses || 0)) || 1)) * 100)}%</strong></span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUB-NAVIGATION TABS: Matchups / Played With (เล่นกับ) / Played Against (เจอกับ) */}
        {heroName && (
          <div className="grid grid-cols-3 gap-1 p-1 bg-white rounded-xl border border-[#F3D5E2] text-[10px] font-['Prompt'] font-bold shadow-2xs">
            <button
              onClick={() => setActiveTab('matchups')}
              className={`py-1.5 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'matchups'
                  ? 'bg-[#E91E63] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Swords size={11} />
              <span>MATCHUPS</span>
            </button>
            <button
              onClick={() => setActiveTab('playedWith')}
              className={`py-1.5 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'playedWith'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users size={11} />
              <span>PLAYED WITH</span>
            </button>
            <button
              onClick={() => setActiveTab('playedAgainst')}
              className={`py-1.5 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'playedAgainst'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Shield size={11} />
              <span>AGAINST</span>
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
                    <span>VS OPPONENT PICKS (REAL-TIME)</span>
                  </span>
                  <span className="text-[10px] font-['Prompt'] text-slate-500">
                    {oppPicks.length} ENEMY PICKS
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 bg-[#FFF8FB] p-2 rounded-xl border border-[#F3D5E2]">
                  {liveMatchups.map(({ oppHero, matchup }) => (
                    <div
                      key={oppHero}
                      className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#F3D5E2] hover:border-[#E91E63] transition-all text-xs shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={getHeroImageUrl(oppHero)}
                          alt={oppHero}
                          className="w-6 h-6 rounded object-cover border border-[#F3D5E2]"
                        />
                        <span className="font-['Prompt'] font-bold text-xs text-slate-800">
                          vs {oppHero}
                        </span>
                      </div>

                      {matchup ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-['Prompt'] text-slate-500">
                            {matchup.winRate.toFixed(1)}% WR ({matchup.games}G)
                          </span>
                          <span
                            className={`font-['Prompt'] font-bold text-[11px] px-2 py-0.5 rounded border ${
                              matchup.diff >= 0
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                : 'bg-rose-50 border-rose-300 text-rose-700'
                            }`}
                          >
                            {matchup.diff > 0 ? `+${matchup.diff.toFixed(1)}%` : `${matchup.diff.toFixed(1)}%`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-['Prompt'] text-slate-400 italic">
                          No Data
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
                  <span>STRONG AGAINST (ได้เปรียบ)</span>
                </span>
                {heroMatchups && heroMatchups.strongAgainst.length > 0 && (
                  <span className="text-[10px] font-['Prompt'] text-emerald-700 font-bold">
                    {heroMatchups.strongAgainst.length} HEROES
                  </span>
                )}
              </div>

              {!heroMatchups || heroMatchups.strongAgainst.length === 0 ? (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[11px] font-['Prompt'] text-slate-500 font-bold">
                    NO DATA
                  </span>
                  <p className="text-[10.5px] font-['Prompt'] text-slate-400 mt-0.5">
                    ไม่มีข้อมูลสถิติฮีโร่ที่ได้เปรียบในทัวร์นาเมนต์นี้
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {heroMatchups.strongAgainst.map((m) => (
                    <div
                      key={m.opponentHero}
                      onClick={() => onSelectHeroToInspect && onSelectHeroToInspect(m.opponentHero)}
                      className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-300 hover:border-emerald-500 transition-all cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={getHeroImageUrl(m.opponentHero)}
                          alt={m.opponentHero}
                          className="w-7 h-7 rounded object-cover border border-emerald-300 group-hover:scale-105 transition-transform"
                        />
                        <div className="flex flex-col">
                          <span className="font-['Prompt'] font-bold text-xs text-slate-800 group-hover:text-emerald-800 transition-colors">
                            {m.opponentHero}
                          </span>
                          <span className="text-[10px] font-['Prompt'] text-slate-500">
                            {m.winRate.toFixed(1)}% WR ({m.games} Games: {m.wins}W - {m.losses}L)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 font-['Prompt'] font-bold text-xs text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300 shadow-2xs">
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
                  <span>WEAK AGAINST (เสียเปรียบ)</span>
                </span>
                {heroMatchups && heroMatchups.weakAgainst.length > 0 && (
                  <span className="text-[10px] font-['Prompt'] text-rose-700 font-bold">
                    {heroMatchups.weakAgainst.length} HEROES
                  </span>
                )}
              </div>

              {!heroMatchups || heroMatchups.weakAgainst.length === 0 ? (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[11px] font-['Prompt'] text-slate-500 font-bold">
                    NO DATA
                  </span>
                  <p className="text-[10.5px] font-['Prompt'] text-slate-400 mt-0.5">
                    ไม่มีข้อมูลสถิติฮีโร่ที่เสียเปรียบในทัวร์นาเมนต์นี้
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {heroMatchups.weakAgainst.map((m) => (
                    <div
                      key={m.opponentHero}
                      onClick={() => onSelectHeroToInspect && onSelectHeroToInspect(m.opponentHero)}
                      className="flex items-center justify-between p-2 rounded-lg bg-rose-50 border border-rose-300 hover:border-rose-500 transition-all cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={getHeroImageUrl(m.opponentHero)}
                          alt={m.opponentHero}
                          className="w-7 h-7 rounded object-cover border border-rose-300 group-hover:scale-105 transition-transform"
                        />
                        <div className="flex flex-col">
                          <span className="font-['Prompt'] font-bold text-xs text-slate-800 group-hover:text-rose-800 transition-colors">
                            {m.opponentHero}
                          </span>
                          <span className="text-[10px] font-['Prompt'] text-slate-500">
                            {m.winRate.toFixed(1)}% WR ({m.games} Games: {m.wins}W - {m.losses}L)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 font-['Prompt'] font-bold text-xs text-rose-800 bg-white px-2 py-0.5 rounded border border-rose-300 shadow-2xs">
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

            <p className="text-[11px] font-['Prompt'] text-slate-600 bg-emerald-50 p-2.5 rounded-lg border border-emerald-300">
              🤝 อัตราชนะเมื่อ <strong className="text-slate-900 font-bold">{heroName}</strong> ได้เล่นร่วมทีมเดียวกับฮีโร่ตัวอื่น จากสถิติ RoV Pro League 2026 Summer
            </p>

            {playedWith.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[11px] font-['Prompt'] text-slate-500 font-bold">
                  NO PLAYED WITH DATA
                </span>
                <p className="text-[10.5px] font-['Prompt'] text-slate-400 mt-1">
                  ยังไม่มีข้อมูลคอมโบเพื่อนร่วมทีมสำหรับฮีโร่ตัวนี้
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {playedWith.map((combo) => (
                  <div
                    key={combo.allyHero}
                    onClick={() => onSelectHeroToInspect && onSelectHeroToInspect(combo.allyHero)}
                    className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/60 border border-emerald-300 hover:border-emerald-500 transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={getHeroImageUrl(combo.allyHero)}
                        alt={combo.allyHero}
                        className="w-8 h-8 rounded-lg object-cover border border-emerald-300 group-hover:scale-105 transition-transform"
                      />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-['Prompt'] font-bold text-xs text-slate-800 group-hover:text-emerald-800 transition-colors">
                            {combo.allyHero}
                          </span>
                          <span className="text-[9.5px] font-['Prompt'] text-emerald-800 font-semibold px-1 rounded bg-emerald-100">
                            เล่นด้วยกัน
                          </span>
                        </div>
                        <span className="text-[10px] font-['Prompt'] text-slate-500">
                          {combo.games} Games ({combo.wins}W - {combo.losses}L)
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="font-['Prompt'] font-bold text-xs text-emerald-800">
                        {combo.winRate.toFixed(1)}% WR
                      </span>
                      {combo.diff !== undefined && (
                        <span
                          className={`text-[9.5px] font-['Prompt'] font-bold ${
                            combo.diff >= 0 ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {combo.diff > 0 ? `+${combo.diff.toFixed(1)}% Synergy` : `${combo.diff.toFixed(1)}%`}
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

            <p className="text-[11px] font-['Prompt'] text-slate-600 bg-sky-50 p-2.5 rounded-lg border border-sky-300">
              ⚔️ อัตราชนะ Head-to-Head เมื่อ <strong className="text-slate-900 font-bold">{heroName}</strong> ต้องเจอกับฮีโร่ฝั่งตรงข้ามใน RoV Pro League 2026 Summer
            </p>

            {playedAgainst.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[11px] font-['Prompt'] text-slate-500 font-bold">
                  NO PLAYED AGAINST DATA
                </span>
                <p className="text-[10.5px] font-['Prompt'] text-slate-400 mt-1">
                  ยังไม่มีข้อมูลเจอกับฮีโร่ฝั่งตรงข้ามสำหรับฮีโร่ตัวนี้
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {playedAgainst.map((m) => (
                  <div
                    key={m.opponentHero}
                    onClick={() => onSelectHeroToInspect && onSelectHeroToInspect(m.opponentHero)}
                    className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#F3D5E2] hover:border-sky-400 transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={getHeroImageUrl(m.opponentHero)}
                        alt={m.opponentHero}
                        className="w-8 h-8 rounded-lg object-cover border border-[#F3D5E2] group-hover:scale-105 transition-transform"
                      />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-['Prompt'] font-bold text-xs text-slate-800 group-hover:text-sky-700 transition-colors">
                            vs {m.opponentHero}
                          </span>
                          <span
                            className={`text-[9.5px] font-['Prompt'] font-bold px-1.5 py-0.2 rounded border ${
                              m.diff >= 0 ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-rose-50 border-rose-300 text-rose-700'
                            }`}
                          >
                            {m.diff >= 0 ? 'ได้เปรียบ' : 'เสียเปรียบ'}
                          </span>
                        </div>
                        <span className="text-[10px] font-['Prompt'] text-slate-500">
                          {m.games} Games ({m.wins}W - {m.losses}L)
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span
                        className={`font-['Prompt'] font-bold text-xs ${
                          m.winRate >= 50 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {m.winRate.toFixed(1)}% WR
                      </span>
                      <span
                        className={`text-[9.5px] font-['Prompt'] font-bold ${
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

      {/* 4. Footer info */}
      <div className="p-3 border-t border-[#F3D5E2] bg-[#FFF8FB] flex items-center justify-between text-[10.5px] font-['Prompt'] text-slate-600">
        <div className="flex items-center gap-1">
          <Database size={12} className="text-slate-400" />
          <span>Liquipedia RoV Pro League 2026 Summer</span>
        </div>
        {onOpenDataModal && (
          <button
            onClick={onOpenDataModal}
            className="text-[#E91E63] hover:text-[#D81B60] font-['Prompt'] font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            Import Data →
          </button>
        )}
      </div>
    </aside>
  );
};
