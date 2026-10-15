import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  ShieldAlert,
  Trophy,
  History,
  TrendingUp,
  Layers,
  Database,
  ArrowRight,
  Filter,
  CheckCircle,
  FileQuestion,
  Sparkles,
} from 'lucide-react';
import { scoutingService, VERIFIED_PRO_TEAMS } from '../services/scoutingService';
import { LocalStorageDraftRepository } from '../services/draftHistoryService';
import { DraftHistoryRecord } from '../types/draftHistory';
import { getHeroImageUrl } from '../data/heroes';

const draftRepo = new LocalStorageDraftRepository();

interface ScoutingViewProps {
  onOpenDataModal?: () => void;
  onOpenNewDraft?: () => void;
}

export const ScoutingView: React.FC<ScoutingViewProps> = ({
  onOpenDataModal,
  onOpenNewDraft,
}) => {
  const [selectedTeam, setSelectedTeam] = useState<string>('Talon');
  const [selectedPatch, setSelectedPatch] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [records, setRecords] = useState<DraftHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load records from draft repository
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const data = await draftRepo.getAll();
      setRecords(data);
      setIsLoading(false);
    };
    load();
    const unsub = draftRepo.subscribe(() => {
      draftRepo.getAll().then(setRecords);
    });
    return unsub;
  }, []);

  // Distinct patches in records
  const availablePatches = useMemo(() => {
    const pSet = new Set<string>();
    records.forEach((r) => {
      if (r.patch) pSet.add(r.patch);
    });
    return Array.from(pSet);
  }, [records]);

  // Distinct teams from records + standard verified pro teams
  const allTeamsList = useMemo(() => {
    const tSet = new Set<string>(VERIFIED_PRO_TEAMS);
    records.forEach((r) => {
      if (r.blueTeam?.teamName?.trim()) tSet.add(r.blueTeam.teamName.trim());
      if (r.redTeam?.teamName?.trim()) tSet.add(r.redTeam.teamName.trim());
    });
    return Array.from(tSet);
  }, [records]);

  // Filtered teams for selector
  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) return allTeamsList;
    const q = searchQuery.toLowerCase();
    return allTeamsList.filter((t) => t.toLowerCase().includes(q));
  }, [allTeamsList, searchQuery]);

  // Run scouting analysis
  const scoutingData = useMemo(() => {
    return scoutingService.analyzeOpponent(selectedTeam, records, selectedPatch);
  }, [selectedTeam, records, selectedPatch]);

  return (
    <div className="w-full flex flex-col gap-3 font-['Prompt'] text-slate-800">
      {/* 1. Header Toolbar & Team Selector */}
      <div className="w-full bg-white border border-[#F3D5E2] rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E91E63] to-[#D81B60] text-white flex items-center justify-center shadow-md shadow-[#E91E63]/20 flex-shrink-0">
            <Search size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Opponent Scouting (วิเคราะห์ข้อมูลคู่แข่ง)
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF0F5] text-[#E91E63] border border-[#F3D5E2]">
                Verified Data Only
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-tight">
              เจาะลึกสถิติฮีโร่ คอมโบ และพฤติกรรมการดราฟต์ของคู่แข่งจากแมตช์จริง
            </p>
          </div>
        </div>

        {/* Team & Patch Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative min-w-[160px] sm:min-w-[190px]">
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-semibold bg-[#FFF0F5] border border-[#F3D5E2] rounded-xl text-slate-800 focus:outline-none focus:border-[#E91E63] cursor-pointer"
            >
              {filteredTeams.map((team) => (
                <option key={team} value={team}>
                  🚩 {team}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Filter size={12} className="text-slate-400" />
            <span className="text-[11px] font-medium">Patch:</span>
            <select
              value={selectedPatch}
              onChange={(e) => setSelectedPatch(e.target.value)}
              className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">ทุกแพตช์ (All)</option>
              {availablePatches.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {onOpenDataModal && (
            <button
              type="button"
              onClick={onOpenDataModal}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Database size={13} />
              <span>Data Layer</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Team Status Banner */}
      <div className="w-full bg-white border border-[#F3D5E2] rounded-2xl p-3 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm font-['Barlow_Condensed'] tracking-wider shadow-sm">
            {selectedTeam.substring(0, 3).toUpperCase()}
          </div>
          <div>
            <div className="text-base sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <span>{selectedTeam}</span>
              {scoutingData.hasData ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle size={10} />
                  <span>มีข้อมูลแมตช์จริง</span>
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                  <FileQuestion size={10} />
                  <span>No Data</span>
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span>แหล่งข้อมูล: {scoutingData.dataSource}</span>
              <span>•</span>
              <span className="font-semibold text-slate-700">
                ขนาดตัวอย่าง: {scoutingData.sampleSize} แมตช์ ({scoutingData.totalGames} เกม)
              </span>
            </div>
          </div>
        </div>

        {/* Quick Win Rate Badge if data exists */}
        {scoutingData.hasData && (
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center bg-[#FFF0F5] border border-[#F3D5E2] rounded-xl px-3 py-1.5 min-w-[80px]">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">Blue Win%</span>
              <span className="text-sm font-black text-[#0284C7] font-['Orbitron']">
                {scoutingData.blueSide.winRate}%
              </span>
              <span className="text-[9px] text-slate-400">
                ({scoutingData.blueSide.wins}/{scoutingData.blueSide.games})
              </span>
            </div>
            <div className="flex flex-col items-center bg-[#FFF0F5] border border-[#F3D5E2] rounded-xl px-3 py-1.5 min-w-[80px]">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">Red Win%</span>
              <span className="text-sm font-black text-[#E11D48] font-['Orbitron']">
                {scoutingData.redSide.winRate}%
              </span>
              <span className="text-[9px] text-slate-400">
                ({scoutingData.redSide.wins}/{scoutingData.redSide.games})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Conditional: If No Data -> Render strict No Data card */}
      {!scoutingData.hasData ? (
        <div className="w-full bg-white border border-[#F3D5E2] rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-200 mb-1">
            <ShieldAlert size={28} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            No Data — ไม่พบข้อมูลแมตช์ที่ตรวจสอบแล้วของทีม {selectedTeam}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg leading-relaxed">
            ระบบไม่มีการคาดเดาหรือสร้างสถิติการแข่งขันปลอมขึ้นเองตามข้อกำหนดด้านความถูกต้อง
            หากท่านมีข้อมูลแมตช์แข่งขันของทีมนี้ สามารถนำเข้าผ่านระบบ JSON/CSV Data Layer หรือบันทึกดราฟต์ลงประวัติได้ทันที
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
            {onOpenDataModal && (
              <button
                type="button"
                onClick={onOpenDataModal}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#E91E63] text-white hover:bg-[#D81B60] transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Database size={14} />
                <span>นำเข้าข้อมูลผ่าน Data Layer</span>
              </button>
            )}
            {onOpenNewDraft && (
              <button
                type="button"
                onClick={onOpenNewDraft}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>บันทึกดราฟต์แมตช์ใหม่</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* 4. Rich Scouting Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Column 1: Most Picked & First Pick Tendencies */}
          <div className="flex flex-col gap-3">
            {/* Most Picked */}
            <div className="bg-white border border-[#F3D5E2] rounded-2xl p-3.5 shadow-xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#F3D5E2]">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <TrendingUp size={15} className="text-[#E91E63]" />
                  <span>Most Picked Heroes (ฮีโร่ที่เลือกบ่อยสุด)</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-semibold">
                  {scoutingData.mostPicked.length} ตัว
                </span>
              </div>

              <div className="flex flex-col gap-1.5 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
                {scoutingData.mostPicked.slice(0, 8).map((hero, idx) => (
                  <div
                    key={hero.heroName}
                    className="flex items-center justify-between p-2 rounded-xl bg-[#FFF8FB] hover:bg-[#FFF0F5] border border-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-black text-slate-400 w-4 text-center font-['Orbitron']">
                        #{idx + 1}
                      </span>
                      <img
                        src={getHeroImageUrl(hero.heroName)}
                        alt={hero.heroName}
                        className="w-8 h-8 rounded-lg object-cover border border-[#F3D5E2]"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900 leading-tight">
                          {hero.heroName}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {hero.primaryRole} • เล่น {hero.games} เกม
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-xs font-black text-[#E91E63] font-['Orbitron']">
                        {hero.winRate}% WR
                      </span>
                      <span className="text-[9.5px] text-slate-400">
                        {hero.wins}W - {hero.losses}L
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* First Pick Tendencies */}
            <div className="bg-white border border-[#F3D5E2] rounded-2xl p-3.5 shadow-xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#F3D5E2]">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles size={15} className="text-amber-500" />
                  <span>First Pick Tendencies (ตัวเปิด B1/R1-2)</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-semibold">Priorities</span>
              </div>

              <div className="flex flex-col gap-1.5">
                {scoutingData.firstPickTendencies.length === 0 ? (
                  <div className="text-xs text-slate-400 py-3 text-center">
                    ไม่มีข้อมูลการเลือกเทิร์นแรก
                  </div>
                ) : (
                  scoutingData.firstPickTendencies.map((item) => (
                    <div
                      key={item.heroName}
                      className="flex items-center justify-between p-2 rounded-xl bg-amber-50/50 border border-amber-100"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={getHeroImageUrl(item.heroName)}
                          alt={item.heroName}
                          className="w-7 h-7 rounded-lg object-cover border border-amber-200"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-800 leading-tight">
                            {item.heroName}
                          </span>
                          <span className="text-[9.5px] text-slate-500">
                            {item.role || 'CORE'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-amber-700 font-['Orbitron']">
                          {item.count} ครั้ง ({item.percentage}%)
                        </span>
                        <div className="text-[9px] text-slate-400">
                          {item.winRate}% Win Rate
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Column 2: Most Banned & Combos */}
          <div className="flex flex-col gap-3">
            {/* Most Banned */}
            <div className="bg-white border border-[#F3D5E2] rounded-2xl p-3.5 shadow-xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#F3D5E2]">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldAlert size={15} className="text-[#E11D48]" />
                  <span>Most Banned (ฮีโร่ที่โดนแบนในแมตช์นี้)</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-semibold">Top Bans</span>
              </div>

              <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {scoutingData.mostBanned.slice(0, 6).map((ban, idx) => (
                  <div
                    key={ban.heroName}
                    className="flex items-center justify-between p-2 rounded-xl bg-rose-50/40 border border-rose-100"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-rose-400 w-4 text-center">
                        #{idx + 1}
                      </span>
                      <img
                        src={getHeroImageUrl(ban.heroName)}
                        alt={ban.heroName}
                        className="w-7 h-7 rounded-lg object-cover border border-rose-200 grayscale"
                      />
                      <span className="text-xs font-bold text-slate-800">
                        {ban.heroName}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-[#E11D48] font-['Orbitron']">
                        {ban.bans} ครั้ง
                      </span>
                      <div className="text-[9px] text-slate-400">
                        P1: {ban.phase1Bans} | P2: {ban.phase2Bans}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Frequently Used Combos */}
            <div className="bg-white border border-[#F3D5E2] rounded-2xl p-3.5 shadow-xs flex-1">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#F3D5E2]">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Layers size={15} className="text-[#0284C7]" />
                  <span>Frequently Used Combos (คอมโบที่ใช้ร่วมกัน)</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-semibold">Synergies</span>
              </div>

              <div className="flex flex-col gap-2">
                {scoutingData.frequentlyUsedCombos.length === 0 ? (
                  <div className="text-xs text-slate-400 py-4 text-center">
                    ยังไม่มีข้อมูลคู่คอมโบที่มีตัวอย่างเล่นคู่กันอย่างน้อย 2 แมตช์
                  </div>
                ) : (
                  scoutingData.frequentlyUsedCombos.slice(0, 5).map((combo, idx) => (
                    <div
                      key={combo.heroes.join('|')}
                      className="p-2.5 rounded-xl bg-[#FFF8FB] border border-[#F3D5E2] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2 overflow-hidden">
                          {combo.heroes.map((h) => (
                            <img
                              key={h}
                              src={getHeroImageUrl(h)}
                              alt={h}
                              className="inline-block w-8 h-8 rounded-full ring-2 ring-white object-cover"
                            />
                          ))}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-900 leading-tight">
                            {combo.heroes.join(' + ')}
                          </span>
                          <span className="text-[9.5px] text-slate-500">
                            เล่นด้วยกัน {combo.games} เกม
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-[#0284C7] font-['Orbitron']">
                          {combo.winRate}% WR
                        </span>
                        <div className="text-[9px] text-slate-400">
                          {combo.wins}W - {combo.losses}L
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Column 3: Blue/Red Side Patterns & Match History */}
          <div className="flex flex-col gap-3">
            {/* Side Draft Patterns */}
            <div className="bg-white border border-[#F3D5E2] rounded-2xl p-3.5 shadow-xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#F3D5E2]">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Trophy size={15} className="text-purple-600" />
                  <span>Blue vs Red Side Draft Patterns</span>
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Blue Side Box */}
                <div className="p-2.5 rounded-xl bg-sky-50/60 border border-sky-100 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-sky-700 uppercase">
                      Blue Side
                    </span>
                    <span className="text-xs font-black text-sky-800 font-['Orbitron']">
                      {scoutingData.blueSide.winRate}%
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    เล่น {scoutingData.blueSide.games} เกม ({scoutingData.blueSide.wins}W - {scoutingData.blueSide.losses}L)
                  </div>
                  {scoutingData.blueSide.priorityHeroes.length > 0 && (
                    <div className="mt-1">
                      <span className="text-[9px] text-slate-400 block mb-0.5">ตัวเลือกบ่อย:</span>
                      <div className="flex flex-wrap gap-1">
                        {scoutingData.blueSide.priorityHeroes.slice(0, 3).map((h) => (
                          <span
                            key={h}
                            className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-white text-sky-800 border border-sky-200"
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Red Side Box */}
                <div className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-100 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-rose-700 uppercase">
                      Red Side
                    </span>
                    <span className="text-xs font-black text-rose-800 font-['Orbitron']">
                      {scoutingData.redSide.winRate}%
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    เล่น {scoutingData.redSide.games} เกม ({scoutingData.redSide.wins}W - {scoutingData.redSide.losses}L)
                  </div>
                  {scoutingData.redSide.priorityHeroes.length > 0 && (
                    <div className="mt-1">
                      <span className="text-[9px] text-slate-400 block mb-0.5">ตัวเลือกบ่อย:</span>
                      <div className="flex flex-wrap gap-1">
                        {scoutingData.redSide.priorityHeroes.slice(0, 3).map((h) => (
                          <span
                            key={h}
                            className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-white text-rose-800 border border-rose-200"
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Match History list */}
            <div className="bg-white border border-[#F3D5E2] rounded-2xl p-3.5 shadow-xs flex-1">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#F3D5E2]">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <History size={15} className="text-slate-600" />
                  <span>Match History ({scoutingData.matchHistory.length} รายการ)</span>
                </h3>
              </div>

              <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
                {scoutingData.matchHistory.map((m) => (
                  <div
                    key={m.id}
                    className="p-2 rounded-xl bg-[#FFF8FB] border border-[#F3D5E2] flex flex-col gap-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">
                        {m.tournament || 'Match'} G{m.gameNumber}
                      </span>
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                          m.opponentWon
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {m.opponentWon ? 'WON' : 'LOST'} ({m.opponentSide.toUpperCase()})
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-500">
                      vs {m.opposingTeam} • Patch {m.patch} • {m.date}
                    </div>

                    {/* Pick Lineup */}
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
                      {m.opponentPicks.map((p, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col items-center flex-shrink-0"
                          title={p.heroName}
                        >
                          <img
                            src={getHeroImageUrl(p.heroName)}
                            alt={p.heroName}
                            className="w-6 h-6 rounded-md object-cover border border-slate-200"
                          />
                          <span className="text-[8px] text-slate-500 font-bold truncate max-w-[36px]">
                            {p.heroName}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
