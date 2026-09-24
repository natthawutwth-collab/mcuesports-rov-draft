import React from 'react';
import { X, ShieldAlert, Swords, TrendingUp, TrendingDown, Database, ExternalLink, Activity } from 'lucide-react';
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
  const { heroStats, heroMatchups, liveMatchups, status } = useHeroStats(heroName, oppPicks);

  if (!isOpen) return null;

  const currentHero = heroName ? HEROES.find((h) => h.name.toLowerCase() === heroName.toLowerCase()) : null;

  return (
    <aside className="w-full sm:w-80 md:w-96 bg-[#0c0c12]/95 border-l border-white/10 shadow-2xl backdrop-blur-xl flex flex-col z-40 fixed inset-y-0 right-0 sm:relative sm:inset-auto h-full max-h-screen transition-all duration-300 animate-in slide-in-from-right">
      {/* 1. Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 bg-black/40">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-[#a82844]" />
          <span className="font-['Orbitron'] font-bold text-xs tracking-[2px] text-white uppercase">
            MATCHUP & HERO STATS
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onOpenDataModal && (
            <button
              onClick={onOpenDataModal}
              title="จัดการ Data Layer (JSON / CSV / API)"
              className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <Database size={14} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* 2. Hero Profile Banner */}
      {heroName && currentHero ? (
        <div className="p-4 bg-gradient-to-b from-black/60 to-transparent border-b border-white/5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14 rounded-xl overflow-hidden border-2 border-[#a82844] shadow-lg flex-shrink-0 bg-black/50">
              <img
                src={getHeroImageUrl(heroName)}
                alt={heroName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = currentHero.avatarUrl;
                }}
              />
              <div className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] font-['Orbitron'] font-bold text-center text-white py-0.5 uppercase">
                {currentHero.primaryPos}
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-['Orbitron'] font-black text-lg text-white tracking-wider">
                  {heroName.toUpperCase()}
                </span>
              </div>
              <span className="text-xs font-['Kanit'] text-[#a0a0a8]">
                {currentHero.nameTh} • {currentHero.roles.join(', ')}
              </span>
              <span className="text-[9.5px] font-['Barlow_Condensed'] text-[#d4a857] mt-0.5 tracking-wider">
                🏆 {status.tournamentName}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-[#a0a0a8] font-['Kanit'] text-xs border-b border-white/5">
          คลิกเลือกฮีโร่ในหน้าดราฟเพื่อดูข้อมูลสถิติและคู่ต่อสู้
        </div>
      )}

      {/* 3. Main Stats & Matchups Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-4">
        {/* If no hero selected */}
        {!heroName && (
          <div className="flex flex-col items-center justify-center py-16 text-center text-white/40">
            <Swords size={36} className="mb-2 opacity-40" />
            <span className="font-['Kanit'] text-xs">ยังไม่ได้เลือกฮีโร่</span>
            <span className="font-['Kanit'] text-[11px] text-white/30 mt-1">
              คลิกการ์ดฮีโร่ในตารางดราฟ หรือเลือกช่อง Pick เพื่อดูสถิติ
            </span>
          </div>
        )}

        {/* HERO INFORMATION SECTION */}
        {heroName && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-['Orbitron'] font-bold text-[11px] tracking-wider text-white flex items-center gap-1.5">
                <span>📊 HERO INFORMATION</span>
              </span>
              <span className="text-[9.5px] font-['Barlow_Condensed'] text-[#a0a0a8]">
                LIQUEPEDIA STATS
              </span>
            </div>

            {/* Check if Hero has tournament stats */}
            {!heroStats ? (
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex flex-col items-center justify-center text-center">
                <span className="px-2 py-0.5 rounded bg-white/10 text-white/80 font-['Orbitron'] font-black text-xs tracking-wider border border-white/15">
                  NO DATA
                </span>
                <span className="text-[11px] font-['Kanit'] text-white/50 mt-2">
                  ไม่มีข้อมูลสถิติในการแข่งขัน {status.tournamentName}
                </span>
                <span className="text-[10px] font-['Kanit'] text-white/30 mt-0.5">
                  (ไม่มีการบันทึกการเล่นหรือแบนในทัวร์นาเมนต์นี้)
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {/* 3 Key Metric Cards */}
                <div className="grid grid-cols-3 gap-2">
                  {/* WIN RATE */}
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center text-center">
                    <span className="text-[9px] font-['Orbitron'] font-bold text-[#a0a0a8] tracking-wider uppercase">
                      WIN RATE
                    </span>
                    <span
                      className={`text-base font-['Orbitron'] font-black mt-0.5 ${
                        heroStats.winRate >= 60
                          ? 'text-emerald-400'
                          : heroStats.winRate >= 52
                          ? 'text-sky-400'
                          : heroStats.winRate >= 48
                          ? 'text-amber-400'
                          : 'text-red-400'
                      }`}
                    >
                      {heroStats.winRate.toFixed(1)}%
                    </span>
                    <span className="text-[8.5px] font-['Barlow_Condensed'] text-white/40 mt-0.5">
                      {heroStats.wins}W - {heroStats.losses}L
                    </span>
                  </div>

                  {/* PICK RATE */}
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center text-center">
                    <span className="text-[9px] font-['Orbitron'] font-bold text-[#a0a0a8] tracking-wider uppercase">
                      PICK RATE
                    </span>
                    <span className="text-base font-['Orbitron'] font-black text-white mt-0.5">
                      {heroStats.pickRate.toFixed(1)}%
                    </span>
                    <span className="text-[8.5px] font-['Barlow_Condensed'] text-white/40 mt-0.5">
                      {heroStats.games} Games
                    </span>
                  </div>

                  {/* BAN RATE */}
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center text-center">
                    <span className="text-[9px] font-['Orbitron'] font-bold text-[#a0a0a8] tracking-wider uppercase">
                      BAN RATE
                    </span>
                    <span className="text-base font-['Orbitron'] font-black text-[#ff7b95] mt-0.5">
                      {heroStats.banRate.toFixed(1)}%
                    </span>
                    <span className="text-[8.5px] font-['Barlow_Condensed'] text-white/40 mt-0.5">
                      {heroStats.bans} Bans
                    </span>
                  </div>
                </div>

                {/* Additional Tournament Metrics */}
                <div className="px-3 py-2 rounded-lg bg-black/30 border border-white/5 flex items-center justify-between text-[11px] font-['Barlow_Condensed'] text-[#a0a0a8]">
                  <span>Presence (P+B): <strong className="text-white">{heroStats.presenceRate.toFixed(1)}%</strong></span>
                  {heroStats.blueWins !== undefined && heroStats.redWins !== undefined && (
                    <span>Blue WR: <strong className="text-sky-300">{Math.round((heroStats.blueWins / ((heroStats.blueWins + (heroStats.blueLosses || 0)) || 1)) * 100)}%</strong> | Red: <strong className="text-red-300">{Math.round((heroStats.redWins / ((heroStats.redWins + (heroStats.redLosses || 0)) || 1)) * 100)}%</strong></span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* REAL-TIME MATCHUPS VS OPPONENT PICKS (DRAFT CONTEXT) */}
        {heroName && oppPicks.length > 0 && (
          <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="font-['Orbitron'] font-bold text-[11px] tracking-wider text-sky-300 flex items-center gap-1.5">
                <Swords size={12} />
                <span>VS OPPONENT PICKS (REAL-TIME)</span>
              </span>
              <span className="text-[9px] font-['Barlow_Condensed'] text-white/40">
                {oppPicks.length} ENEMY PICKS
              </span>
            </div>

            <div className="flex flex-col gap-1.5 bg-black/40 p-2 rounded-xl border border-white/5">
              {liveMatchups.map(({ oppHero, matchup }) => (
                <div
                  key={oppHero}
                  className="flex items-center justify-between p-1.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/20 transition-all text-xs"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={getHeroImageUrl(oppHero)}
                      alt={oppHero}
                      className="w-6 h-6 rounded object-cover border border-white/10"
                    />
                    <span className="font-['Orbitron'] font-bold text-xs text-white">
                      vs {oppHero}
                    </span>
                  </div>

                  {matchup ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-['Barlow_Condensed'] text-white/50">
                        {matchup.winRate.toFixed(1)}% WR ({matchup.games}G)
                      </span>
                      <span
                        className={`font-['Orbitron'] font-bold text-[11px] px-1.5 py-0.5 rounded border ${
                          matchup.diff >= 0
                            ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                            : 'bg-red-950/60 border-red-500/50 text-red-300'
                        }`}
                      >
                        {matchup.diff > 0 ? `+${matchup.diff.toFixed(1)}%` : `${matchup.diff.toFixed(1)}%`}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-['Orbitron'] text-white/30 italic">
                      No Data
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STRONG AGAINST SECTION */}
        {heroName && (
          <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="font-['Orbitron'] font-bold text-[11px] tracking-wider text-emerald-400 flex items-center gap-1.5">
                <TrendingUp size={13} />
                <span>STRONG AGAINST (ได้เปรียบ)</span>
              </span>
              {heroMatchups && heroMatchups.strongAgainst.length > 0 && (
                <span className="text-[9.5px] font-['Barlow_Condensed'] text-emerald-400/80 font-bold">
                  {heroMatchups.strongAgainst.length} HEROES
                </span>
              )}
            </div>

            {!heroMatchups || heroMatchups.strongAgainst.length === 0 ? (
              <div className="p-3 rounded-lg bg-black/20 border border-white/5 text-center">
                <span className="text-[11px] font-['Orbitron'] text-white/40 font-bold">
                  NO DATA
                </span>
                <p className="text-[10.5px] font-['Kanit'] text-white/30 mt-0.5">
                  ไม่มีข้อมูลสถิติฮีโร่ที่ได้เปรียบในทัวร์นาเมนต์นี้
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {heroMatchups.strongAgainst.map((m) => (
                  <div
                    key={m.opponentHero}
                    onClick={() => onSelectHeroToInspect && onSelectHeroToInspect(m.opponentHero)}
                    className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-950/40 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={getHeroImageUrl(m.opponentHero)}
                        alt={m.opponentHero}
                        className="w-7 h-7 rounded object-cover border border-emerald-500/30 group-hover:scale-105 transition-transform"
                      />
                      <div className="flex flex-col">
                        <span className="font-['Orbitron'] font-bold text-xs text-white group-hover:text-emerald-300 transition-colors">
                          {m.opponentHero}
                        </span>
                        <span className="text-[9.5px] font-['Barlow_Condensed'] text-white/50">
                          {m.winRate.toFixed(1)}% WR ({m.games} Games: {m.wins}W - {m.losses}L)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 font-['Orbitron'] font-black text-xs text-emerald-300 bg-emerald-950/60 px-2 py-1 rounded border border-emerald-500/40 shadow-sm">
                      <span>+{m.diff.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* WEAK AGAINST SECTION */}
        {heroName && (
          <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="font-['Orbitron'] font-bold text-[11px] tracking-wider text-red-400 flex items-center gap-1.5">
                <TrendingDown size={13} />
                <span>WEAK AGAINST (เสียเปรียบ)</span>
              </span>
              {heroMatchups && heroMatchups.weakAgainst.length > 0 && (
                <span className="text-[9.5px] font-['Barlow_Condensed'] text-red-400/80 font-bold">
                  {heroMatchups.weakAgainst.length} HEROES
                </span>
              )}
            </div>

            {!heroMatchups || heroMatchups.weakAgainst.length === 0 ? (
              <div className="p-3 rounded-lg bg-black/20 border border-white/5 text-center">
                <span className="text-[11px] font-['Orbitron'] text-white/40 font-bold">
                  NO DATA
                </span>
                <p className="text-[10.5px] font-['Kanit'] text-white/30 mt-0.5">
                  ไม่มีข้อมูลสถิติฮีโร่ที่เสียเปรียบในทัวร์นาเมนต์นี้
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {heroMatchups.weakAgainst.map((m) => (
                  <div
                    key={m.opponentHero}
                    onClick={() => onSelectHeroToInspect && onSelectHeroToInspect(m.opponentHero)}
                    className="flex items-center justify-between p-2 rounded-lg bg-red-950/20 border border-red-500/30 hover:border-red-400 hover:bg-red-950/40 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={getHeroImageUrl(m.opponentHero)}
                        alt={m.opponentHero}
                        className="w-7 h-7 rounded object-cover border border-red-500/30 group-hover:scale-105 transition-transform"
                      />
                      <div className="flex flex-col">
                        <span className="font-['Orbitron'] font-bold text-xs text-white group-hover:text-red-300 transition-colors">
                          {m.opponentHero}
                        </span>
                        <span className="text-[9.5px] font-['Barlow_Condensed'] text-white/50">
                          {m.winRate.toFixed(1)}% WR ({m.games} Games: {m.wins}W - {m.losses}L)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 font-['Orbitron'] font-black text-xs text-red-300 bg-red-950/60 px-2 py-1 rounded border border-red-500/40 shadow-sm">
                      <span>{m.diff.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Footer info */}
      <div className="p-3 border-t border-white/10 bg-black/50 flex items-center justify-between text-[10px] font-['Kanit'] text-[#a0a0a8]">
        <div className="flex items-center gap-1">
          <Database size={12} className="text-white/40" />
          <span>Liquipedia RoV Pro League 2026 Summer</span>
        </div>
        {onOpenDataModal && (
          <button
            onClick={onOpenDataModal}
            className="text-[#a82844] hover:text-[#ff7b95] font-['Barlow_Condensed'] font-bold text-xs uppercase tracking-wider"
          >
            Import Data →
          </button>
        )}
      </div>
    </aside>
  );
};
