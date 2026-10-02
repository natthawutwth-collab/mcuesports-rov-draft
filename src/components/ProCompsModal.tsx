import React, { useState, useMemo } from 'react';
import { Hero } from '../types/draft';
import { ProMetaComp, RPL_2026_PRO_COMPS } from '../data/proMetaComps';
import { getHeroImageUrl } from '../data/heroes';
import { X, Search, Trophy, ExternalLink, Check, Ban, Sparkles, Shield, Zap, Flame, Eye } from 'lucide-react';

interface ProCompsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bannedHeroNames?: Set<string>;
  pickedHeroNames?: Set<string>;
  bluePicks?: { hero: Hero | null }[];
  redPicks?: { hero: Hero | null }[];
  activeTeam?: 'blue' | 'red';
  onInspectHero?: (heroName: string) => void;
  onPickHeroDirectly?: (heroName: string) => void;
  onBanHeroDirectly?: (heroName: string) => void;
  isPickTurn?: boolean;
  isBanTurn?: boolean;
}

export const ProCompsModal: React.FC<ProCompsModalProps> = ({
  isOpen,
  onClose,
  bannedHeroNames = new Set(),
  pickedHeroNames = new Set(),
  bluePicks = [],
  redPicks = [],
  activeTeam = 'blue',
  onInspectHero,
  onPickHeroDirectly,
  onBanHeroDirectly,
  isPickTurn = false,
  isBanTurn = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<'all' | 'champion' | 'fs' | 'bacon' | 's_plus' | 'group' | 'playoffs'>('all');

  // Currently picked hero names by blue and red
  const myPicksSet = useMemo(() => {
    const picks = activeTeam === 'blue' ? bluePicks : redPicks;
    return new Set(picks.map((p) => p.hero?.name).filter(Boolean) as string[]);
  }, [activeTeam, bluePicks, redPicks]);

  const oppPicksSet = useMemo(() => {
    const picks = activeTeam === 'blue' ? redPicks : bluePicks;
    return new Set(picks.map((p) => p.hero?.name).filter(Boolean) as string[]);
  }, [activeTeam, bluePicks, redPicks]);

  // Filtered Comps
  const filteredComps = useMemo(() => {
    return RPL_2026_PRO_COMPS.filter((comp) => {
      // Filter tag
      if (filterTag === 'champion' && !comp.popularTeams.some((t) => t.includes('Buriram'))) return false;
      if (filterTag === 'fs' && !comp.popularTeams.some((t) => t.includes('FULL SENSE'))) return false;
      if (filterTag === 'bacon' && !comp.popularTeams.some((t) => t.includes('Bacon Time'))) return false;
      if (filterTag === 's_plus' && comp.tier !== 'S+') return false;
      if (filterTag === 'group' && comp.stage !== 'Group Stage' && comp.stage !== 'Both') return false;
      if (filterTag === 'playoffs' && comp.stage !== 'Playoffs' && comp.stage !== 'Both') return false;

      // Search query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = comp.name.toLowerCase().includes(q) || comp.nameTh.toLowerCase().includes(q);
        const matchHeroes = comp.coreHeroes.some((h) => h.toLowerCase().includes(q));
        const matchTeams = comp.popularTeams.some((t) => t.toLowerCase().includes(q));
        const matchDesc = comp.tacticalDescription.toLowerCase().includes(q);
        if (!matchName && !matchHeroes && !matchTeams && !matchDesc) return false;
      }

      return true;
    });
  }, [filterTag, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-white border-2 border-[#F3D5E2] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] font-['Prompt']">
        {/* 1. Header Banner */}
        <div className="px-4 sm:px-6 py-3.5 bg-gradient-to-r from-[#FFF0F5] via-white to-[#F0F9FF] border-b-2 border-[#F3D5E2] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <Trophy size={18} className="animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-['Orbitron'] font-black text-sm sm:text-base text-slate-800 tracking-wide uppercase">
                  RPL 2026 SUMMER META COMPS
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                  🏆 แชมป์: Buriram United Esports
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                  🥈 รองแชมป์: FULL SENSE
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                ดราฟต์และคอมพ์ 3-5 ตัวที่นักแข่งโปรลีกใช้ซ้ำบ่อยที่สุดใน Group Stage และ Playoffs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <a
              href="https://liquipedia.net/honorofkings/RoV_Pro_League/2026/Summer/Group_Stage"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-[#E91E63] hover:text-[#D81B60] bg-white border border-[#F3D5E2] hover:border-[#E91E63] px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-2xs transition-colors"
              title="ดูข้อมูลตารางและผลการแข่งบน Liquipedia"
            >
              <span>Liquipedia Source</span>
              <ExternalLink size={12} />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors shadow-2xs cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* 2. Search & Tag Filter Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#FFF8FB] border-b border-[#F3D5E2] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อคอมพ์, ฮีโร่, ทีม เช่น Toro, Buriram..."
              className="w-full bg-white border border-[#F3D5E2] focus:border-[#E91E63] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none shadow-xs transition-colors"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 flex-nowrap">
            <button
              type="button"
              onClick={() => setFilterTag('all')}
              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer whitespace-nowrap border shadow-2xs ${
                filterTag === 'all'
                  ? 'bg-slate-800 border-slate-800 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              🌐 ทั้งหมด ({RPL_2026_PRO_COMPS.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTag('champion')}
              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer whitespace-nowrap border shadow-2xs ${
                filterTag === 'champion'
                  ? 'bg-amber-600 border-amber-600 text-white'
                  : 'bg-white border-amber-200 text-amber-800 hover:bg-amber-50'
              }`}
            >
              🏆 Buriram United
            </button>
            <button
              type="button"
              onClick={() => setFilterTag('fs')}
              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer whitespace-nowrap border shadow-2xs ${
                filterTag === 'fs'
                  ? 'bg-[#E11D48] border-[#E11D48] text-white'
                  : 'bg-white border-rose-200 text-rose-700 hover:bg-rose-50'
              }`}
            >
              🥈 FULL SENSE
            </button>
            <button
              type="button"
              onClick={() => setFilterTag('bacon')}
              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer whitespace-nowrap border shadow-2xs ${
                filterTag === 'bacon'
                  ? 'bg-orange-600 border-orange-600 text-white'
                  : 'bg-white border-orange-200 text-orange-800 hover:bg-orange-50'
              }`}
            >
              🥓 Bacon Time
            </button>
            <button
              type="button"
              onClick={() => setFilterTag('s_plus')}
              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer whitespace-nowrap border shadow-2xs ${
                filterTag === 's_plus'
                  ? 'bg-purple-600 border-purple-600 text-white'
                  : 'bg-white border-purple-200 text-purple-800 hover:bg-purple-50'
              }`}
            >
              ⭐ Tier S+ (WR 70%+)
            </button>
            <button
              type="button"
              onClick={() => setFilterTag('playoffs')}
              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer whitespace-nowrap border shadow-2xs ${
                filterTag === 'playoffs'
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-blue-200 text-blue-800 hover:bg-blue-50'
              }`}
            >
              ⚡ Playoffs & Final
            </button>
          </div>
        </div>

        {/* 3. Compositions List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 custom-scrollbar bg-[#FFF8FB]/40 space-y-3.5">
          {filteredComps.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              <span>ไม่พบคอมพ์ที่ตรงกับการค้นหา</span>
            </div>
          ) : (
            filteredComps.map((comp) => {
              // Calculate how many heroes from this comp are in my picks / opp picks / banned
              const myCount = comp.coreHeroes.filter((h) => myPicksSet.has(h)).length;
              const oppCount = comp.coreHeroes.filter((h) => oppPicksSet.has(h)).length;
              const hasDraftProgress = myCount > 0 || oppCount > 0;

              return (
                <div
                  key={comp.id}
                  className="bg-white border-2 border-[#F3D5E2] hover:border-[#E91E63]/60 rounded-2xl p-3.5 sm:p-4 shadow-xs transition-all flex flex-col gap-3"
                >
                  {/* Top Header of Comp */}
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[9.5px] font-['Orbitron'] font-black px-2 py-0.5 rounded border shadow-2xs ${
                            comp.tier === 'S+'
                              ? 'bg-purple-50 text-purple-700 border-purple-300'
                              : 'bg-sky-50 text-sky-700 border-sky-300'
                          }`}
                        >
                          TIER {comp.tier}
                        </span>
                        <h4 className="font-['Prompt'] font-bold text-sm sm:text-base text-slate-900">
                          {comp.nameTh}
                        </h4>
                        <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">
                          ({comp.name})
                        </span>
                      </div>

                      {/* Pro Teams & Stage Badges */}
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap text-[10.5px]">
                        <span className="font-semibold text-slate-500">ทีมที่นิยมใช้:</span>
                        {comp.popularTeams.map((team, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-100 text-slate-700 font-bold px-1.5 py-0.2 rounded border border-slate-200"
                          >
                            {team}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Pro League Synergy Badge */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[10px] font-['Orbitron'] font-black text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-2xs">
                        <span>🏆</span>
                        <span>PRO LEAGUE SYNERGY</span>
                      </span>
                    </div>
                  </div>

                  {/* Draft Alert if matched */}
                  {hasDraftProgress && (
                    <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 flex items-center justify-between gap-2">
                      <span className="font-bold flex items-center gap-1">
                        <span>⚠️ ตรวจพบในกระดานดราฟต์:</span>
                        {myCount > 0 && (
                          <span className="text-sky-700 font-black">ฝั่งคุณเลือก {myCount}/{comp.coreHeroes.length} ตัว</span>
                        )}
                        {oppCount > 0 && (
                          <span className="text-rose-700 font-black">คู่แข่งเลือก {oppCount}/{comp.coreHeroes.length} ตัว</span>
                        )}
                      </span>
                      <span className="text-[10.5px] text-amber-700 font-semibold">
                        {myCount >= 2 ? 'เข้าสู่คอมพ์ของโปรแล้ว!' : 'คู่แข่งอาจกำลังเตรียมหยิบคอมพ์นี้'}
                      </span>
                    </div>
                  )}

                  {/* Core 3-5 Heroes Cards */}
                  <div>
                    <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      ⭐ ฮีโร่แกนหลัก {comp.coreCount} ตัว (Core Heroes):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                      {comp.coreHeroes.map((heroName) => {
                        const isBanned = bannedHeroNames.has(heroName);
                        const isPickedByMe = myPicksSet.has(heroName);
                        const isPickedByOpp = oppPicksSet.has(heroName);
                        const isPicked = isPickedByMe || isPickedByOpp || pickedHeroNames.has(heroName);
                        const isAvailable = !isBanned && !isPicked;
                        const role = comp.roles[heroName] || '';

                        return (
                          <div
                            key={heroName}
                            className={`p-2 rounded-xl border flex items-center gap-2 transition-all relative overflow-hidden ${
                              isPickedByMe
                                ? 'bg-sky-50 border-[#0284C7] ring-1 ring-[#0284C7]'
                                : isPickedByOpp
                                ? 'bg-rose-50 border-[#E11D48] opacity-75'
                                : isBanned
                                ? 'bg-slate-100 border-slate-300 opacity-50 grayscale'
                                : 'bg-white border-[#F3D5E2] hover:border-[#E91E63]'
                            }`}
                          >
                            {/* Portrait */}
                            <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                              <img
                                src={getHeroImageUrl(heroName)}
                                alt={heroName}
                                className="w-full h-full object-cover"
                              />
                              {isBanned && (
                                <div className="absolute inset-0 bg-red-950/60 flex items-center justify-center">
                                  <Ban size={14} className="text-red-300" />
                                </div>
                              )}
                              {isPickedByMe && (
                                <div className="absolute bottom-0 right-0 bg-[#0284C7] text-white p-0.5 rounded-tl">
                                  <Check size={8} />
                                </div>
                              )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <div className="font-['Prompt'] font-bold text-xs text-slate-800 truncate">
                                {heroName}
                              </div>
                              <div className="text-[9.5px] font-semibold text-slate-400 truncate">
                                {role}
                              </div>
                              <div className="text-[8.5px] font-bold mt-0.5">
                                {isAvailable ? (
                                  <span className="text-emerald-600">● ว่างในพูล</span>
                                ) : isPickedByMe ? (
                                  <span className="text-[#0284C7]">✓ ฝั่งคุณเลือกแล้ว</span>
                                ) : isPickedByOpp ? (
                                  <span className="text-[#E11D48]">✕ คู่แข่งเลือกแล้ว</span>
                                ) : (
                                  <span className="text-slate-400">🚫 ถูกแบน</span>
                                )}
                              </div>
                            </div>

                            {/* Quick Action Button */}
                            {isAvailable && onPickHeroDirectly && isPickTurn && (
                              <button
                                type="button"
                                onClick={() => onPickHeroDirectly(heroName)}
                                className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#E91E63] hover:bg-[#D81B60] text-white shadow-2xs cursor-pointer flex-shrink-0"
                                title="หยิบฮีโร่ตัวนี้ลงในช่องดราฟต์ทันที"
                              >
                                หยิบ
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Priority Ban List for this Comp */}
                  {comp.priorityBans && comp.priorityBans.length > 0 && (
                    <div className="bg-[#FFF5F7] border border-rose-200 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-rose-600 font-black text-sm">🚫</span>
                          <span className="font-['Prompt'] font-bold text-xs sm:text-[13px] text-rose-950 uppercase tracking-wide">
                            ตัวที่นักแข่งต้องแบนเมื่อเล่นคอมพ์นี้ (Priority Ban List)
                          </span>
                        </div>
                        <span className="text-[10px] text-rose-700 font-semibold bg-rose-100/90 px-2 py-0.5 rounded-full border border-rose-200">
                          แบนเพื่อตัดตัวแก้ทาง / เปิดทางให้คอมพ์เล่นง่าย
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {comp.priorityBans.map((banItem) => {
                          const isAlreadyBanned = bannedHeroNames.has(banItem.hero);
                          const isPickedByOpp = oppPicksSet.has(banItem.hero);
                          const isPickedByMe = myPicksSet.has(banItem.hero);
                          const isAvailable = !isAlreadyBanned && !isPickedByOpp && !isPickedByMe;

                          return (
                            <div
                              key={banItem.hero}
                              className={`p-2 sm:p-2.5 rounded-xl border flex flex-col justify-between gap-1.5 transition-all bg-white ${
                                isPickedByOpp
                                  ? 'border-rose-400 bg-rose-50/70 shadow-2xs ring-1 ring-rose-400'
                                  : isAlreadyBanned
                                  ? 'border-slate-300 opacity-75 bg-slate-50'
                                  : 'border-rose-200 hover:border-rose-400 shadow-2xs'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                {/* Portrait with ban badge */}
                                <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                                  <img
                                    src={getHeroImageUrl(banItem.hero)}
                                    alt={banItem.hero}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-rose-950/25 flex items-center justify-center">
                                    <Ban size={12} className="text-white drop-shadow" />
                                  </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <button
                                      type="button"
                                      onClick={() => onInspectHero && onInspectHero(banItem.hero)}
                                      className="font-['Prompt'] font-bold text-xs text-slate-900 hover:text-rose-600 transition-colors truncate text-left cursor-pointer"
                                      title="คลิกเพื่อตรวจสถิติฮีโร่ตัวนี้"
                                    >
                                      {banItem.hero}
                                    </button>
                                    <span
                                      className={`text-[8.5px] font-black px-1.5 py-0.2 rounded border ${
                                        banItem.priority === 'must_ban'
                                          ? 'bg-rose-600 text-white border-rose-600'
                                          : 'bg-amber-100 text-amber-900 border-amber-300'
                                      }`}
                                    >
                                      {banItem.priority === 'must_ban' ? '🔥 MUST BAN' : '⚠️ แนะนำแบน'}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1 py-0.2 rounded">
                                      {banItem.phase}
                                    </span>
                                    {isAlreadyBanned ? (
                                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                                        ✓ แบนแล้ว
                                      </span>
                                    ) : isPickedByOpp ? (
                                      <span className="text-[9px] font-bold text-rose-700 bg-rose-100 px-1 py-0.2 rounded border border-rose-300 animate-pulse">
                                        🚨 ศัตรูหยิบแล้ว!
                                      </span>
                                    ) : isPickedByMe ? (
                                      <span className="text-[9px] font-bold text-sky-700 bg-sky-50 px-1 py-0.2 rounded border border-sky-200">
                                        🔵 ฝั่งเราเลือก
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                                        ⚠️ ยังไม่แบน
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Ban tactical reason */}
                              <p className="text-[10.5px] text-slate-600 leading-tight">
                                <span className="font-semibold text-slate-700">เหตุผลที่ต้องแบน: </span>
                                {banItem.reason}
                              </p>

                              {/* Quick Ban button if Ban Turn */}
                              {isAvailable && onBanHeroDirectly && isBanTurn && (
                                <button
                                  type="button"
                                  onClick={() => onBanHeroDirectly(banItem.hero)}
                                  className="w-full mt-0.5 py-1 px-2 rounded-lg text-[9.5px] font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs cursor-pointer flex items-center justify-center gap-1 transition-colors"
                                  title={`แบน ${banItem.hero} ตอนนี้`}
                                >
                                  <Ban size={10} />
                                  <span>แบน {banItem.hero} ในเทิร์นนี้</span>
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Full 5-Man Lineup Preview */}
                  <div className="p-2 sm:p-2.5 rounded-xl bg-[#FFF8FB] border border-[#F3D5E2] flex items-center justify-between flex-wrap gap-2 text-xs">
                    <span className="font-bold text-slate-600 flex items-center gap-1">
                      <span>🛡️ ไลน์อัปเต็ม 5 ตำแหน่ง (Full 5-Man Comp):</span>
                    </span>
                    <div className="flex items-center gap-2 flex-wrap font-bold text-[11px]">
                      <span className="text-orange-700 bg-orange-50 px-1.5 py-0.2 rounded border border-orange-200">
                        DSL: {comp.fullLineup.dsl}
                      </span>
                      <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        JG: {comp.fullLineup.jg}
                      </span>
                      <span className="text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                        MID: {comp.fullLineup.mid}
                      </span>
                      <span className="text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200">
                        SUP: {comp.fullLineup.roam}
                      </span>
                      <span className="text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        ADL: {comp.fullLineup.adl}
                      </span>
                    </div>
                  </div>

                  {/* Tactical Description & Strengths */}
                  <div className="text-xs text-slate-600 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-200">
                    <p className="font-medium mb-1.5">
                      <span className="font-bold text-slate-800">💡 การวิเคราะห์แท็กติกโปร: </span>
                      {comp.tacticalDescription}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 text-[11px]">
                      <div>
                        <span className="font-bold text-emerald-700 block mb-0.5">จุดเด่นสำคัญ:</span>
                        <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                          {comp.keyStrengths.map((str, i) => (
                            <li key={i}>{str}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="font-bold text-indigo-700 block mb-0.5">ลำดับการหยิบที่โปรแนะนำ:</span>
                        <div className="flex items-center gap-1 flex-wrap">
                          {comp.recommendedPickOrder.map((order, i) => (
                            <span
                              key={i}
                              className="bg-indigo-50 text-indigo-800 px-1.5 py-0.2 rounded font-semibold text-[10.5px] border border-indigo-200"
                            >
                              {i + 1}. {order}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 4. Footer Summary */}
        <div className="px-5 py-3 bg-[#FFF0F5] border-t border-[#F3D5E2] flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-800">
              แสดง {filteredComps.length} จาก {RPL_2026_PRO_COMPS.length} คอมโบดราฟต์โปร RPL
            </span>
            <span className="text-slate-400 hidden sm:inline">• รวบรวมจากคอมโบและดราฟต์ยอดนิยมที่โปรเพลเยอร์ใช้ในการแข่งขันจริง</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold cursor-pointer transition-colors shadow-xs"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
