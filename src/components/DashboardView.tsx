import React from 'react';
import { Player } from '../types/player';
import { DraftHistoryRecord } from '../types/draftHistory';
import { getHeroImageUrl } from '../data/heroes';
import {
  Swords,
  Users,
  History,
  Trophy,
  Shield,
  Zap,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Calendar,
  Layers,
  ChevronRight,
  Gamepad2,
  ExternalLink,
  Plus,
} from 'lucide-react';

interface DashboardViewProps {
  onSelectView: (view: 'dashboard' | 'draft' | 'players' | 'history') => void;
  onOpenNewDraftSetup: () => void;
  players: Player[];
  historyRecords: DraftHistoryRecord[];
  onInspectHero: (heroName: string) => void;
  onStartNewDraftFromMatch?: (record: DraftHistoryRecord) => void;
  isCloudConnected?: boolean;
  teamId?: string;
  draftActive?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectView,
  onOpenNewDraftSetup,
  players,
  historyRecords,
  onInspectHero,
  onStartNewDraftFromMatch,
  isCloudConnected = true,
  teamId = 'mcu-default',
  draftActive = false,
}) => {
  // Player category breakdown
  const maleCount = players.filter((p) => (p.categories || [p.category || 'male']).includes('male')).length;
  const femaleCount = players.filter((p) => (p.categories || [p.category || 'male']).includes('female')).length;
  const mixedCount = players.filter((p) => (p.categories || [p.category || 'male']).includes('mixed')).length;

  // History stats breakdown
  const totalMatches = historyRecords.length;
  const blueWins = historyRecords.filter((r) => r.winner === 'blue').length;
  const redWins = historyRecords.filter((r) => r.winner === 'red').length;

  // Top banned heroes in RPL 2026 Summer official dataset
  const topBannedMeta = [
    { name: 'Sinestrea', pos: 'JG', banRate: '74.91%', bans: 218, wr: '56.6%' },
    { name: 'Rouie', pos: 'ROAM', banRate: '66.32%', bans: 193, wr: '48.44%' },
    { name: 'Marja', pos: 'JG', banRate: '40.21%', bans: 117, wr: '57.14%' },
    { name: 'Eland\'orr', pos: 'ADL', banRate: '50.17%', bans: 146, wr: '47.62%' },
    { name: 'Zata', pos: 'MID', banRate: '43.30%', bans: 126, wr: '51.43%' },
  ];

  const recentMatches = historyRecords.slice(0, 4);

  return (
    <div className="w-full flex flex-col gap-3.5 sm:gap-4 font-['Prompt'] text-slate-800 animate-in fade-in duration-200">
      {/* 1. Executive Coach Welcome & Quick Launch Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-white via-[#FFF5F8] to-[#FCE4EC]/50 border border-[#F3D5E2] p-4 sm:p-5 shadow-xs">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E91E63] via-[#D81B60] to-[#C2185B] text-white flex items-center justify-center shadow-md shadow-[#E91E63]/20 ring-4 ring-[#FCE4EC] flex-shrink-0">
              <Gamepad2 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-['Prompt'] font-bold text-lg sm:text-xl text-slate-900 leading-snug">
                  MCU eSports RoV Draft Assistant
                </h1>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#E91E63] text-white uppercase tracking-wider">
                  Pro Coach Mode
                </span>
                {draftActive && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>กำลังดราฟต์อยู่</span>
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-[13px] text-slate-500 mt-1 max-w-2xl leading-relaxed">
                ระบบจำลองดราฟต์ฮีโร่และวิเคราะห์กลยุทธ์ทีม RoV • คำนวณความได้เปรียบแบบเรียลไทม์ตามสถิติ RoV Pro League 2026 Summer
              </p>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
            <button
              onClick={() => onSelectView('draft')}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#E91E63] to-[#D81B60] hover:from-[#D81B60] hover:to-[#C2185B] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#E91E63]/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Swords size={16} />
              <span>เข้าสู่ห้องดราฟต์</span>
              <ArrowRight size={14} />
            </button>

            <button
              onClick={onOpenNewDraftSetup}
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#FFF0F5] text-[#E91E63] border border-[#F3D5E2] hover:border-[#F48FB1] text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Plus size={15} />
              <span>เริ่มดราฟต์ใหม่</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Summary (4 clean, uncluttered cards in 60/30/10 palette) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Card 1: Roster */}
        <div
          onClick={() => onSelectView('players')}
          className="p-3.5 rounded-2xl bg-white border border-[#F3D5E2] hover:border-[#F48FB1] hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Users size={14} className="text-[#E91E63]" />
              <span>นักกีฬาในสังกัด</span>
            </span>
            <ChevronRight size={14} className="text-slate-400 group-hover:text-[#E91E63] transition-colors" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-['Orbitron'] font-black text-2xl text-slate-900">
              {players.length}
            </span>
            <span className="text-xs text-slate-500">คน</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
            <span className="text-[#0284C7] font-semibold">👨 ชาย {maleCount}</span>
            <span>•</span>
            <span className="text-[#E11D48] font-semibold">👩 หญิง {femaleCount}</span>
            <span>•</span>
            <span className="text-purple-600 font-semibold">⚡ ผสม {mixedCount}</span>
          </div>
        </div>

        {/* Card 2: Draft Archives */}
        <div
          onClick={() => onSelectView('history')}
          className="p-3.5 rounded-2xl bg-white border border-[#F3D5E2] hover:border-[#F48FB1] hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <History size={14} className="text-amber-500" />
              <span>ประวัติดราฟต์</span>
            </span>
            <ChevronRight size={14} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-['Orbitron'] font-black text-2xl text-slate-900">
              {totalMatches}
            </span>
            <span className="text-xs text-slate-500">แมตช์ที่บันทึก</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
            <span className="text-[#0284C7] font-semibold">Blue Win {blueWins}</span>
            <span>•</span>
            <span className="text-[#E11D48] font-semibold">Red Win {redWins}</span>
          </div>
        </div>

        {/* Card 3: Pro League Stats */}
        <div className="p-3.5 rounded-2xl bg-white border border-[#F3D5E2] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Trophy size={14} className="text-emerald-500" />
              <span>สถิติ RPL 2026</span>
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-300">
              Verified
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-['Orbitron'] font-black text-2xl text-slate-900">
              291
            </span>
            <span className="text-xs text-slate-500">เกมในโปรลีก</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Liquipedia Summer 2026</span>
            <span className="text-emerald-600 font-semibold">พร้อมคำนวณ</span>
          </div>
        </div>

        {/* Card 4: Database & Sync Status */}
        <div className="p-3.5 rounded-2xl bg-white border border-[#F3D5E2] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Zap size={14} className="text-sky-500" />
              <span>สถานะคลาวด์</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-['Prompt'] font-bold text-base text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Supabase Cloud</span>
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Team ID: <code className="text-[#E91E63] font-bold">{teamId}</code></span>
            <span className="text-emerald-700 font-medium">Auto Sync</span>
          </div>
        </div>
      </div>

      {/* 3. Main Content Split: Recent Matches (Left) & Pro Meta Glance (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Left Column (2 Cols): Recent Draft Matches */}
        <div className="lg:col-span-2 flex flex-col gap-3 p-4 bg-white border border-[#F3D5E2] rounded-2xl shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <History size={16} className="text-[#E91E63]" />
              <h2 className="font-bold text-sm sm:text-base text-slate-900">
                ประวัติการดราฟต์ล่าสุด (Recent Matches)
              </h2>
            </div>
            {totalMatches > 0 && (
              <button
                onClick={() => onSelectView('history')}
                className="text-xs font-bold text-[#E91E63] hover:text-[#D81B60] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>ดูทั้งหมด ({totalMatches})</span>
                <ChevronRight size={13} />
              </button>
            )}
          </div>

          {recentMatches.length === 0 ? (
            <div className="py-10 flex flex-col items-center justify-center text-center gap-2.5">
              <div className="w-12 h-12 rounded-full bg-[#FFF0F5] text-[#E91E63] flex items-center justify-center">
                <Swords size={22} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">ยังไม่มีประวัติการดราฟต์ที่บันทึกไว้</p>
                <p className="text-xs text-slate-400 mt-0.5">เริ่มดราฟต์แมตช์แรกเพื่อบันทึกสถิติและกลยุทธ์ของทีม</p>
              </div>
              <button
                onClick={onOpenNewDraftSetup}
                className="mt-1 px-4 py-2 rounded-xl bg-[#E91E63] hover:bg-[#D81B60] text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
              >
                ＋ เริ่มดราฟต์ใหม่ตอนนี้
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {recentMatches.map((rec) => {
                const isBlueWin = rec.winner === 'blue';
                const isRedWin = rec.winner === 'red';

                return (
                  <div
                    key={rec.id}
                    className="p-3 rounded-xl border border-slate-200 hover:border-[#F48FB1] hover:bg-[#FFF8FB]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-['Orbitron'] font-bold text-xs text-slate-900">
                          Game #{rec.gameNumber}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500 truncate">
                          {rec.tournament} • {rec.match}
                        </span>
                        {rec.winner && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                              isBlueWin
                                ? 'bg-sky-50 text-sky-700 border-sky-300'
                                : isRedWin
                                ? 'bg-rose-50 text-rose-700 border-rose-300'
                                : 'bg-slate-100 text-slate-600 border-slate-300'
                            }`}
                          >
                            🏆 {isBlueWin ? `ชนะ: ${rec.blueTeam.teamName}` : isRedWin ? `ชนะ: ${rec.redTeam.teamName}` : 'เสมอ'}
                          </span>
                        )}
                      </div>

                      {/* Teams & Hero previews */}
                      <div className="flex items-center gap-3 text-xs text-slate-600 mt-0.5">
                        <span className="font-semibold text-[#0284C7] truncate max-w-[120px]">
                          🔵 {rec.blueTeam.teamName}
                        </span>
                        <span className="text-slate-300">vs</span>
                        <span className="font-semibold text-[#E11D48] truncate max-w-[120px]">
                          🔴 {rec.redTeam.teamName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0 self-end sm:self-center">
                      {onStartNewDraftFromMatch && (
                        <button
                          onClick={() => onStartNewDraftFromMatch(rec)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#FFF0F5] hover:bg-[#FCE4EC] text-[#E91E63] border border-[#F3D5E2] text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1"
                          title="ดราฟต์เกมถัดไปโดยสลับฝั่ง"
                        >
                          <Swords size={12} />
                          <span>เกมถัดไป</span>
                        </button>
                      )}
                      <button
                        onClick={() => onSelectView('history')}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        ดูรายละเอียด
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column (1 Col): RPL 2026 Summer Meta Overview */}
        <div className="flex flex-col gap-3 p-4 bg-white border border-[#F3D5E2] rounded-2xl shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-[#E11D48]" />
              <h2 className="font-bold text-sm sm:text-base text-slate-900">
                ฮีโร่ตัวแบนอันดับสูงสุดในโปรลีก
              </h2>
            </div>
            <span className="text-[10px] font-bold text-slate-400">RPL 2026 Summer</span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            สถิติตัวที่โค้ชระดับโปรลีกเลือกแบนมากที่สุด สามารถใช้เป็นแนวทางดราฟต์ในห้องแข่งขัน:
          </p>

          <div className="flex flex-col gap-2">
            {topBannedMeta.map((h, idx) => (
              <div
                key={h.name}
                onClick={() => onInspectHero(h.name)}
                className="p-2 rounded-xl border border-slate-100 hover:border-rose-300 hover:bg-rose-50/30 transition-all flex items-center justify-between gap-2 cursor-pointer group"
                title={`คลิกเพื่อดูสถิติเชิงลึกของ ${h.name}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                    <img
                      src={getHeroImageUrl(h.name)}
                      alt={h.name}
                      className="w-full h-full object-cover"
                    />
                    <span
                      className={`absolute top-0 left-0 text-[8px] font-black px-1 rounded-br ${
                        idx === 0 ? 'bg-amber-500 text-white' : 'bg-slate-700 text-white'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-xs text-slate-800 group-hover:text-[#E91E63] transition-colors truncate">
                      {h.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {h.pos} • แบน {h.bans} เกม
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end flex-shrink-0">
                  <span className="text-xs font-bold text-rose-600">
                    Ban {h.banRate}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    WR {h.wr}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>ฐานข้อมูลฮีโร่ทั้งหมด:</span>
            <span className="font-bold text-slate-800">120 ตัวละคร</span>
          </div>
        </div>
      </div>
    </div>
  );
};
