import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Filter,
  Trophy,
  Users,
  Shield,
  Layers,
  Search,
  Plus,
  Trash2,
  Edit3,
  AlertTriangle,
  CheckCircle,
  FileText,
  RotateCcw,
  Download,
  Upload,
  Info,
  ChevronDown,
  ChevronRight,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Percent,
  SlidersHorizontal,
} from 'lucide-react';
import { ScrimSession, ScrimGame, ScrimSeriesFormat } from '../../types/scrim';
import { ScrimAnalyticsFilter, ScrimAnalyticsReport } from '../../types/scrimAnalytics';
import { scrimService, createBlankScrimSession } from '../../services/scrimService';
import { scrimAnalyticsService } from '../../services/scrimAnalyticsService';
import { Player } from '../../types/player';
import { getHeroImageUrl } from '../../data/heroes';
import { ScrimGameEditorModal } from './ScrimGameEditorModal';
import { VERIFIED_PRO_TEAMS } from '../../services/scoutingService';

interface ScrimManagerViewProps {
  players: Player[];
  onOpenDraftWithComp?: (picks: Array<{ heroName: string; position: string }>) => void;
}

export const ScrimManagerView: React.FC<ScrimManagerViewProps> = ({
  players,
}) => {
  const [sessions, setSessions] = useState<ScrimSession[]>([]);
  const [activeTab, setActiveTab] = useState<'analytics' | 'sessions'>('analytics');

  // Filter state
  const [filter, setFilter] = useState<ScrimAnalyticsFilter>({
    opponent: 'all',
    player: 'all',
    side: 'all',
    dateFrom: '',
    dateTo: '',
    planSearch: '',
    minComboGames: 2,
  });

  // Modal states
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState<boolean>(false);
  const [newSessionTitle, setNewSessionTitle] = useState<string>('ซ้อมแผนทีมประจำสัปดาห์');
  const [newSessionOpponent, setNewSessionOpponent] = useState<string>('Talon');
  const [newSessionFormat, setNewSessionFormat] = useState<ScrimSeriesFormat>('BO5');
  const [newSessionDate, setNewSessionDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );

  const [editingGame, setEditingGame] = useState<{
    session: ScrimSession;
    game: ScrimGame;
  } | null>(null);

  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [expandedSessionIds, setExpandedSessionIds] = useState<Set<string>>(new Set());
  const [isExportImportOpen, setIsExportImportOpen] = useState<boolean>(false);
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [importError, setImportError] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Subscribe to ScrimService updates
  useEffect(() => {
    const load = () => {
      const data = scrimService.getAllSessions();
      setSessions(data);
      if (data.length > 0 && expandedSessionIds.size === 0) {
        setExpandedSessionIds(new Set([data[0].id]));
      }
    };
    load();
    const unsub = scrimService.subscribe(load);
    return unsub;
  }, []);

  // Compute Analytics Report
  const report: ScrimAnalyticsReport = useMemo(() => {
    return scrimAnalyticsService.generateReport(sessions, filter);
  }, [sessions, filter]);

  // Unique opponents list from records
  const allOpponents = useMemo(() => {
    const set = new Set<string>(VERIFIED_PRO_TEAMS);
    sessions.forEach((s) => {
      if (s.opponentTeam?.trim()) set.add(s.opponentTeam.trim());
    });
    return Array.from(set);
  }, [sessions]);

  // Unique players list from records + roster
  const allPlayersList = useMemo(() => {
    const set = new Set<string>();
    players.forEach((p) => {
      if (p.nickname) set.add(p.nickname);
      else if (p.name) set.add(p.name);
    });
    sessions.forEach((s) => {
      s.games.forEach((g) => {
        const ourPicks = g.ourSide === 'blue' ? g.bluePicks : g.redPicks;
        ourPicks?.forEach((p) => {
          if (p.playerNickname?.trim()) set.add(p.playerNickname.trim());
          else if (p.playerName?.trim()) set.add(p.playerName.trim());
        });
      });
    });
    return Array.from(set);
  }, [players, sessions]);

  // Handle Create Session
  const handleCreateSession = () => {
    if (!newSessionTitle.trim() || !newSessionOpponent.trim()) return;
    const s = createBlankScrimSession(newSessionTitle.trim(), newSessionOpponent.trim(), newSessionFormat);
    s.sessionDate = newSessionDate;
    scrimService.saveSession(s);
    setIsNewSessionModalOpen(false);
    setExpandedSessionIds((prev) => new Set([...prev, s.id]));
    showToast(`✅ สร้างรายการซ้อม "${s.sessionTitle}" เรียบร้อยแล้ว`);
  };

  // Handle Save Game from Modal
  const handleSaveGame = (updatedGame: ScrimGame) => {
    if (!editingGame) return;
    const parent = sessions.find((s) => s.id === editingGame.session.id);
    if (!parent) return;

    const updatedGames = parent.games.map((g) => (g.id === updatedGame.id ? updatedGame : g));
    const updatedSession: ScrimSession = {
      ...parent,
      games: updatedGames,
    };
    scrimService.saveSession(updatedSession);
    setEditingGame(null);
    showToast(`💾 บันทึกผล Game #${updatedGame.gameNumber} เรียบร้อยแล้ว`);
  };

  // Handle Delete Session
  const handleConfirmDelete = () => {
    if (!deletingSessionId) return;
    scrimService.deleteSession(deletingSessionId);
    setDeletingSessionId(null);
    showToast('🗑️ ลบรายการแข่งขันซ้อมเรียบร้อยแล้ว');
  };

  // Handle Reset to Default
  const handleResetToDefault = () => {
    if (window.confirm('คุณต้องการรีเซ็ตข้อมูลซ้อมทั้งหมดกลับเป็นชุดเริ่มต้นของ MCU Esports ใช่หรือไม่?')) {
      scrimService.resetToDefault();
      showToast('🔄 คืนค่าตัวอย่างการซ้อมเริ่มต้นเรียบร้อยแล้ว');
    }
  };

  // Handle Import JSON
  const handleImportJson = () => {
    if (!importJsonText.trim()) return;
    const success = scrimService.importJson(importJsonText.trim());
    if (success) {
      setIsExportImportOpen(false);
      setImportJsonText('');
      setImportError('');
      showToast('📥 นำเข้าข้อมูลการซ้อมสำเร็จ');
    } else {
      setImportError('รูปแบบ JSON ไม่ถูกต้อง โปรดตรวจสอบโครงสร้างข้อมูล');
    }
  };

  const toggleSessionAccordion = (id: string) => {
    setExpandedSessionIds((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  };

  return (
    <div className="w-full flex flex-col gap-3 font-['Prompt'] text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 animate-fade-in flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Toolbar with Tab Navigation */}
      <div className="w-full bg-white border border-[#F3D5E2] rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E91E63] to-[#D81B60] text-white flex items-center justify-center shadow-md shadow-[#E91E63]/25 flex-shrink-0">
            <BarChart3 size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                MCU Team Performance Analytics & Scrim Manager
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF0F5] text-[#E91E63] border border-[#F3D5E2]">
                Phase 3 Verified
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-tight">
              วิเคราะห์ผลงานทีมและอัตราชนะจากข้อมูลเกมซ้อมจริง แยกขาดจาก RPL Pro Stats
            </p>
          </div>
        </div>

        {/* Action Buttons & Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Tab Switcher */}
          <div className="flex items-center bg-[#FFF8FB] border border-[#F3D5E2] rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${
                activeTab === 'analytics'
                  ? 'bg-[#E91E63] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp size={13} />
              <span>วิเคราะห์ผลงานทีม</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sessions')}
              className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${
                activeTab === 'sessions'
                  ? 'bg-[#E91E63] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText size={13} />
              <span>รายการเกมซ้อม ({sessions.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsNewSessionModalOpen(true)}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-[#E91E63] text-white hover:bg-[#D81B60] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus size={14} />
            <span>สร้างรายการซ้อม</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExportImportOpen(true)}
            title="นำเข้าหรือส่งออกข้อมูลซ้อม JSON"
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 border border-slate-200 cursor-pointer"
          >
            <Download size={15} />
          </button>

          <button
            type="button"
            onClick={handleResetToDefault}
            title="รีเซ็ตเป็นตัวอย่างเริ่มต้น"
            className="p-1.5 text-slate-500 hover:text-[#E91E63] rounded-lg hover:bg-rose-50 border border-slate-200 cursor-pointer"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      {/* 2. Top Filter Toolbar */}
      <div className="w-full bg-white border border-[#F3D5E2] rounded-2xl p-3 shadow-xs flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Filter size={14} className="text-[#E91E63]" />
            <span>ตัวกรองข้อมูลเชิงลึก (Analytics Filters):</span>
          </div>

          {(filter.opponent !== 'all' ||
            filter.player !== 'all' ||
            filter.side !== 'all' ||
            filter.planSearch ||
            filter.dateFrom ||
            filter.dateTo) && (
            <button
              type="button"
              onClick={() =>
                setFilter({
                  opponent: 'all',
                  player: 'all',
                  side: 'all',
                  dateFrom: '',
                  dateTo: '',
                  planSearch: '',
                  minComboGames: 2,
                })
              }
              className="text-[11px] text-[#E91E63] hover:underline font-semibold cursor-pointer"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {/* Opponent Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">คู่แข่ง (Opponent)</label>
            <select
              value={filter.opponent || 'all'}
              onChange={(e) => setFilter({ ...filter, opponent: e.target.value })}
              className="text-xs bg-[#FFF8FB] border border-[#F3D5E2] rounded-xl px-2.5 py-1.5 outline-none focus:border-[#E91E63] text-slate-800"
            >
              <option value="all">คู่แข่งทั้งหมด</option>
              {allOpponents.map((opp) => (
                <option key={opp} value={opp}>
                  {opp}
                </option>
              ))}
            </select>
          </div>

          {/* Player Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">ผู้เล่น (Player)</label>
            <select
              value={filter.player || 'all'}
              onChange={(e) => setFilter({ ...filter, player: e.target.value })}
              className="text-xs bg-[#FFF8FB] border border-[#F3D5E2] rounded-xl px-2.5 py-1.5 outline-none focus:border-[#E91E63] text-slate-800"
            >
              <option value="all">นักกีฬาทุกคน</option>
              {allPlayersList.map((pl) => (
                <option key={pl} value={pl}>
                  {pl}
                </option>
              ))}
            </select>
          </div>

          {/* Side Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">ฝั่งการเล่น (Side)</label>
            <select
              value={filter.side || 'all'}
              onChange={(e) => setFilter({ ...filter, side: e.target.value as any })}
              className="text-xs bg-[#FFF8FB] border border-[#F3D5E2] rounded-xl px-2.5 py-1.5 outline-none focus:border-[#E91E63] text-slate-800"
            >
              <option value="all">ทุกฝั่ง (Blue & Red)</option>
              <option value="blue">Blue Side เท่านั้น</option>
              <option value="red">Red Side เท่านั้น</option>
            </select>
          </div>

          {/* Date From */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">ตั้งแต่วันที่</label>
            <input
              type="date"
              value={filter.dateFrom || ''}
              onChange={(e) => setFilter({ ...filter, dateFrom: e.target.value })}
              className="text-xs bg-[#FFF8FB] border border-[#F3D5E2] rounded-xl px-2 py-1.5 outline-none focus:border-[#E91E63] text-slate-800"
            />
          </div>

          {/* Date To */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">ถึงวันที่</label>
            <input
              type="date"
              value={filter.dateTo || ''}
              onChange={(e) => setFilter({ ...filter, dateTo: e.target.value })}
              className="text-xs bg-[#FFF8FB] border border-[#F3D5E2] rounded-xl px-2 py-1.5 outline-none focus:border-[#E91E63] text-slate-800"
            />
          </div>

          {/* Plan/Objective Search */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">ชื่อแผน / คำค้น</label>
            <div className="relative">
              <input
                type="text"
                placeholder="เช่น Florentino, Poke..."
                value={filter.planSearch || ''}
                onChange={(e) => setFilter({ ...filter, planSearch: e.target.value })}
                className="w-full text-xs bg-[#FFF8FB] border border-[#F3D5E2] rounded-xl pl-2.5 pr-6 py-1.5 outline-none focus:border-[#E91E63] text-slate-800"
              />
              {filter.planSearch && (
                <button
                  type="button"
                  onClick={() => setFilter({ ...filter, planSearch: '' })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ANALYTICS VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'analytics' && (
        <div className="w-full flex flex-col gap-3">
          {/* Data Source Notice Badges */}
          <div className="flex items-center gap-2 flex-wrap text-[11px] p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Shield size={14} className="text-[#E91E63]" />
              <span>แหล่งที่มาข้อมูล (Data Source Origin):</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
              🛡️ {report.dataSource.primary}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
              🏆 {report.dataSource.proMetaBaseline}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
              ✍️ {report.dataSource.coachNotesOrigin}
            </span>
          </div>

          {/* Low Sample Warning Banner */}
          {report.overall.isLowSample && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 shadow-2xs">
              <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="font-bold">คำเตือนกลุ่มตัวอย่างมีจำนวนจำกัด (Low Sample Size Warning):</span>
                <span className="text-[11.5px] leading-relaxed text-amber-800">
                  {report.overall.lowSampleWarning} สถิติอัตราชนะในหน้านี้คำนวณจากเกมที่บันทึกจริงเท่านั้น
                  โปรดใช้วิเคราะห์ควบคู่กับการสังเกตรูปแบบการเล่นของทีม
                </span>
              </div>
            </div>
          )}

          {/* 1. TOP CARDS: Win Rate with Explicit Denominators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Card 1: Overall Win Rate */}
            <div className="bg-white border-2 border-[#F3D5E2] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-bold text-slate-500 uppercase">อัตราชนะรวม (Overall WR)</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {report.overall.wins} ชนะ / {report.overall.losses} แพ้
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl sm:text-3xl font-black font-['Orbitron'] text-[#E91E63]">
                    {report.overall.winRate}%
                  </span>
                  <span className="text-xs font-bold text-slate-600">
                    ({report.overall.wins}/{report.overall.decidedGames} เกม)
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>สูตรคำนวณ:</span>
                <span className="font-mono font-bold text-slate-800">{report.overall.formulaDisplay}</span>
              </div>
            </div>

            {/* Card 2: Blue Side Performance */}
            <div className="bg-white border-2 border-sky-100 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-bold text-sky-700 uppercase">Blue Side Performance</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                    {report.sideStats.blue.wins}W - {report.sideStats.blue.losses}L
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl sm:text-3xl font-black font-['Orbitron'] text-sky-600">
                    {report.sideStats.blue.winRate}%
                  </span>
                  <span className="text-xs font-bold text-slate-600">
                    ({report.sideStats.blue.wins}/{report.sideStats.blue.decidedGames} เกม)
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>ตัวหารชัดเจน:</span>
                <span className="font-mono font-bold text-sky-900">{report.sideStats.blue.formulaDisplay}</span>
              </div>
            </div>

            {/* Card 3: Red Side Performance */}
            <div className="bg-white border-2 border-rose-100 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-bold text-rose-700 uppercase">Red Side Performance</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    {report.sideStats.red.wins}W - {report.sideStats.red.losses}L
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl sm:text-3xl font-black font-['Orbitron'] text-rose-600">
                    {report.sideStats.red.winRate}%
                  </span>
                  <span className="text-xs font-bold text-slate-600">
                    ({report.sideStats.red.wins}/{report.sideStats.red.decidedGames} เกม)
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>ตัวหารชัดเจน:</span>
                <span className="font-mono font-bold text-rose-900">{report.sideStats.red.formulaDisplay}</span>
              </div>
            </div>

            {/* Card 4: Side Delta & Preference */}
            <div className="bg-white border-2 border-purple-100 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-bold text-purple-700 uppercase">Side Delta & Preference</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                    {report.sideStats.preferredSide === 'blue'
                      ? 'ได้เปรียบ Blue Side'
                      : report.sideStats.preferredSide === 'red'
                      ? 'ได้เปรียบ Red Side'
                      : 'สมดุลทั้งสองฝั่ง'}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl sm:text-3xl font-black font-['Orbitron'] text-purple-700">
                    {report.sideStats.sideDelta >= 0 ? `+${report.sideStats.sideDelta}%` : `${report.sideStats.sideDelta}%`}
                  </span>
                  <span className="text-[11px] text-slate-500">(ส่วนต่าง Blue - Red)</span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>เกมที่แข่งทั้งหมด:</span>
                <span className="font-bold text-slate-800">{report.overall.totalGames} เกม ({report.overall.totalSessions} ซีรีส์)</span>
              </div>
            </div>
          </div>

          {/* Missing Data Audit Alert if issues exist */}
          {report.missingDataAudit.length > 0 && (
            <div className="bg-white border border-amber-300 rounded-2xl p-3.5 shadow-xs flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle size={15} className="text-amber-600" />
                  <span>ตรวจสอบความสมบูรณ์ของข้อมูลซ้อม (Missing Data & Audit): พบ {report.missingDataAudit.length} รายการที่ต้องติดตาม</span>
                </span>
                <span className="text-[10px] text-slate-500">
                  Pick ไม่ครบ {report.overall.missingDataCount.incompleteGames} | ยังไม่สรุปผล {report.overall.missingDataCount.undecidedGames}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {report.missingDataAudit.slice(0, 4).map((issue, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-amber-50/60 border border-amber-200 text-xs flex items-center gap-2"
                  >
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
                      !
                    </span>
                    <span className="font-semibold text-amber-950">{issue.sessionTitle} (G{issue.gameNumber}):</span>
                    <span className="text-amber-800">{issue.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. SECTION: Hero & Position Performance (ผลงานตามฮีโร่และตำแหน่ง) */}
          <div className="bg-white border border-[#F3D5E2] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#F3D5E2]">
              <div className="flex items-center gap-2">
                <Trophy size={16} className="text-[#E91E63]" />
                <h3 className="text-sm font-bold text-slate-900">
                  Hero & Position Performance (ผลงานแยกตามฮีโร่และตำแหน่งที่เล่น)
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-semibold">
                บันทึกทั้งหมด {report.heroPositionStats.length} รายการ
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[10.5px] uppercase">
                    <th className="pb-2 pl-2">ฮีโร่ (Hero)</th>
                    <th className="pb-2">ตำแหน่ง (Position)</th>
                    <th className="pb-2 text-center">เกมที่เล่น</th>
                    <th className="pb-2 text-center">ผลลัพธ์ (W - L)</th>
                    <th className="pb-2 text-right">อัตราชนะ (Win Rate %)</th>
                    <th className="pb-2 text-right pr-2">ตัวหารชัดเจน & กลุ่มตัวอย่าง</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium">
                  {report.heroPositionStats.map((item) => (
                    <tr key={`${item.heroName}-${item.position}`} className="hover:bg-[#FFF8FB] transition-colors">
                      <td className="py-2 pl-2">
                        <div className="flex items-center gap-2">
                          <img
                            src={getHeroImageUrl(item.heroName)}
                            alt={item.heroName}
                            className="w-7 h-7 rounded-lg object-cover border border-[#F3D5E2]"
                          />
                          <span className="font-bold text-slate-900">{item.heroName}</span>
                        </div>
                      </td>
                      <td className="py-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#FFF0F5] text-[#E91E63] border border-[#F3D5E2]">
                          {item.position}
                        </span>
                      </td>
                      <td className="py-2 text-center font-bold text-slate-700">{item.totalGames}</td>
                      <td className="py-2 text-center">
                        <span className="text-emerald-700 font-bold">{item.wins}W</span>
                        <span className="text-slate-300 mx-1">-</span>
                        <span className="text-rose-600 font-bold">{item.losses}L</span>
                      </td>
                      <td className="py-2 text-right font-black font-['Orbitron'] text-[#E91E63] text-sm">
                        {item.winRate}%
                      </td>
                      <td className="py-2 text-right pr-2">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="font-mono text-xs text-slate-600 font-semibold">{item.formulaDisplay}</span>
                          {item.isLowSample && (
                            <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                              ⚠️ ตัวอย่างน้อย (N &lt; 3)
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. SECTION: Player Performance Breakdown (ผลงานตามผู้เล่นและฮีโร่ที่ใช้) */}
          <div className="bg-white border border-[#F3D5E2] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#F3D5E2]">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-[#E91E63]" />
                <h3 className="text-sm font-bold text-slate-900">
                  Player Performance & Hero Pool (ผลงานตามผู้เล่นและฮีโร่ที่ใช้จริง)
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-semibold">
                {report.playerSummaries.length} นักกีฬา
              </span>
            </div>

            {/* Player Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              {report.playerSummaries.map((ps) => (
                <div
                  key={ps.playerNickname}
                  className="p-3.5 rounded-2xl bg-[#FFF8FB] border border-[#F3D5E2] flex flex-col justify-between shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-rose-100">
                      <div>
                        <span className="text-sm font-bold text-slate-900 leading-tight">
                          {ps.playerNickname}
                        </span>
                        <span className="text-[10px] text-slate-400 block">{ps.playerName}</span>
                      </div>
                      <span className="text-base font-black font-['Orbitron'] text-[#E91E63]">
                        {ps.winRate}% WR
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex items-center justify-between mb-2">
                      <span>สถิติรวม:</span>
                      <span className="font-mono font-bold text-slate-800">{ps.formulaDisplay}</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">ฮีโร่ที่เล่นบ่อยสุด:</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {ps.topHeroes.map((th) => (
                          <div
                            key={th.heroName}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-[#F3D5E2] text-xs"
                          >
                            <img
                              src={getHeroImageUrl(th.heroName)}
                              alt={th.heroName}
                              className="w-4 h-4 rounded-full object-cover"
                            />
                            <span className="font-semibold text-slate-800">{th.heroName}</span>
                            <span className="text-[10px] text-[#E91E63] font-bold">({th.winRate}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. SECTION: Hero Combos & Synergies (ผลของคู่ฮีโร่และคอมโบ เมื่อมีตัวอย่างเพียงพอ) */}
          <div className="bg-white border border-[#F3D5E2] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#F3D5E2] flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-[#E91E63]" />
                <h3 className="text-sm font-bold text-slate-900">
                  Hero Combos & Synergies (ผลของคอมโบคู่ฮีโร่ เมื่อมีตัวอย่างเพียงพอ)
                </h3>
              </div>

              {/* Threshold Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">เกณฑ์ตัวอย่างขั้นต่ำ:</span>
                <div className="flex items-center bg-slate-100 rounded-xl p-0.5">
                  {[1, 2, 3].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFilter({ ...filter, minComboGames: val })}
                      className={`px-2.5 py-0.5 text-xs font-bold rounded-lg cursor-pointer ${
                        (filter.minComboGames ?? 2) === val
                          ? 'bg-white text-[#E91E63] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      N &ge; {val}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {report.heroCombos.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                ไม่มีคอมโบที่ผ่านเกณฑ์ตัวอย่างขั้นต่ำ (N &ge; {filter.minComboGames ?? 2} เกม)
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {report.heroCombos.slice(0, 12).map((combo) => (
                  <div
                    key={combo.comboKey}
                    className="p-3 rounded-2xl bg-white border border-[#F3D5E2] flex items-center justify-between shadow-2xs hover:border-[#E91E63] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex items-center -space-x-2">
                        {combo.heroes.map((hName) => (
                          <img
                            key={hName}
                            src={getHeroImageUrl(hName)}
                            alt={hName}
                            title={hName}
                            className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-xs"
                          />
                        ))}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900 leading-tight">
                          {combo.heroes.join(' + ')}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {combo.formulaDisplay}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-sm font-black font-['Orbitron'] text-[#E91E63]">
                        {combo.winRate}%
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          combo.decidedGames >= 3
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {combo.decidedGames >= 3 ? '📊 มีนัยสำคัญ' : '⚠️ ตัวอย่างน้อย'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. SECTION: Draft vs Actual Outcome Correlation Analysis */}
          <div className="bg-white border border-[#F3D5E2] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#F3D5E2]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-[#E91E63]" />
                <h3 className="text-sm font-bold text-slate-900">
                  Draft vs Actual Match Outcome Correlation (เปรียบเทียบผลการดราฟต์กับผลการแข่งขันจริง)
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-semibold">
                ประเมินจาก {report.draftVsOutcome.length} เกม
              </span>
            </div>

            {/* CRITICAL CORRELATION DISCLAIMER CALLOUT */}
            <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-purple-950 text-xs mb-3 flex items-start gap-2.5 shadow-2xs">
              <Info size={18} className="text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="font-bold text-purple-900">
                  ข้อพึงระวังระเบียบวิธีวิเคราะห์ (Methodological Disclaimer):
                </span>
                <span className="text-[11.5px] leading-relaxed text-purple-800">
                  {report.correlationDisclaimer}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[10.5px] uppercase">
                    <th className="pb-2 pl-2">เกม (Match & Game)</th>
                    <th className="pb-2">ฝั่ง (Side)</th>
                    <th className="pb-2">ฮีโร่ MCU ที่เลือก</th>
                    <th className="pb-2 text-center">ดราฟต์ตามทฤษฎี</th>
                    <th className="pb-2 text-center">ผลจริงในสนาม</th>
                    <th className="pb-2">ความสอดคล้อง (Alignment)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium">
                  {report.draftVsOutcome.map((row) => (
                    <tr key={row.gameId} className="hover:bg-[#FFF8FB] transition-colors">
                      <td className="py-2.5 pl-2">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{row.sessionTitle}</span>
                          <span className="text-[10px] text-slate-400">
                            vs {row.opponent} (G#{row.gameNumber}) • {row.sessionDate}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            row.ourSide === 'blue'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {row.ourSide.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-1 flex-wrap max-w-xs">
                          {row.ourPicks.map((hName) => (
                            <span
                              key={hName}
                              className="px-1.5 py-0.2 rounded bg-slate-100 text-[10px] text-slate-700 font-semibold"
                            >
                              {hName}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                            row.draftTheoreticalRating === 'Strong Advantage'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : row.draftTheoreticalRating === 'Slight Advantage'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {row.draftTheoreticalRating} ({row.draftScoreEstimate})
                        </span>
                      </td>
                      <td className="py-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10.5px] font-black ${
                            row.actualResult === 'won'
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : row.actualResult === 'lost'
                              ? 'bg-rose-600 text-white shadow-2xs'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {row.actualResult.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className="text-[11px] font-semibold text-slate-700">{row.alignmentLabel}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SCRIM SESSIONS & LOG VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'sessions' && (
        <div className="w-full flex flex-col gap-3">
          {sessions.length === 0 ? (
            <div className="p-12 text-center bg-white border border-[#F3D5E2] rounded-2xl flex flex-col items-center gap-3">
              <Trophy size={32} className="text-slate-300" />
              <span className="text-sm font-bold text-slate-700">ยังไม่มีรายการแข่งขันซ้อม</span>
              <p className="text-xs text-slate-400">
                กดปุ่ม "สร้างรายการซ้อม" ด้านบน หรือ "คืนค่าตัวอย่างเริ่มต้น" เพื่อเริ่มบันทึกข้อมูล
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sessions.map((sess) => {
                const isExpanded = expandedSessionIds.has(sess.id);
                return (
                  <div
                    key={sess.id}
                    className="bg-white border-2 border-[#F3D5E2] rounded-2xl p-4 shadow-xs flex flex-col gap-3 transition-all"
                  >
                    {/* Session Header */}
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#F3D5E2]">
                      <div
                        onClick={() => toggleSessionAccordion(sess.id)}
                        className="flex items-center gap-2.5 cursor-pointer select-none"
                      >
                        {isExpanded ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900">{sess.sessionTitle}</h3>
                            <span className="text-[10px] font-black px-2 py-0.2 rounded-full bg-[#FFF0F5] text-[#E91E63] border border-[#F3D5E2]">
                              {sess.format}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                                sess.status === 'completed'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {sess.status === 'completed' ? 'จบซีรีส์' : 'กำลังซ้อม'}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400">
                            vs <strong className="text-slate-700">{sess.opponentTeam}</strong> • {sess.sessionDate} • Patch {sess.patch}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-baseline gap-1 bg-[#FFF0F5] border border-[#F3D5E2] px-3 py-1 rounded-xl">
                          <span className="text-xs font-bold text-slate-500">ผลคะแนน:</span>
                          <span className="text-sm font-black font-['Orbitron'] text-[#E91E63]">
                            MCU {sess.ourScore} - {sess.oppScore} {sess.opponentTeam}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setDeletingSessionId(sess.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                          title="ลบรายการซ้อมนี้"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Games List (Expanded) */}
                    {isExpanded && (
                      <div className="flex flex-col gap-2 pt-1">
                        {sess.games.map((g) => (
                          <div
                            key={g.id}
                            className="p-3 rounded-xl bg-[#FFF8FB] border border-[#F3D5E2] flex items-center justify-between flex-wrap gap-2"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-xl bg-white border border-[#F3D5E2] text-xs font-black text-slate-800 flex items-center justify-center font-['Orbitron']">
                                G{g.gameNumber}
                              </span>

                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[9.5px] font-black ${
                                      g.ourSide === 'blue'
                                        ? 'bg-sky-100 text-sky-800'
                                        : 'bg-rose-100 text-rose-800'
                                    }`}
                                  >
                                    {g.ourSide.toUpperCase()} SIDE
                                  </span>

                                  <span
                                    className={`px-2 py-0.2 rounded text-[10px] font-black ${
                                      g.winner === 'us'
                                        ? 'bg-emerald-600 text-white'
                                        : g.winner === 'opp'
                                        ? 'bg-rose-600 text-white'
                                        : 'bg-slate-200 text-slate-700'
                                    }`}
                                  >
                                    {g.winner === 'us' ? 'ชนะ (WIN)' : g.winner === 'opp' ? 'แพ้ (LOSS)' : 'UNDECIDED'}
                                  </span>

                                  {g.matchDurationMinutes ? (
                                    <span className="text-[10px] text-slate-400">
                                      ⏱️ {g.matchDurationMinutes} นาที
                                    </span>
                                  ) : null}
                                </div>

                                {/* Picks summary */}
                                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                  <span className="text-[10px] font-bold text-slate-400">Picks:</span>
                                  {(g.ourSide === 'blue' ? g.bluePicks : g.redPicks)?.map((p, pIdx) => (
                                    <span
                                      key={pIdx}
                                      className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-white border border-[#F3D5E2] text-[10.5px] font-semibold text-slate-800"
                                    >
                                      {p.heroName && (
                                        <img
                                          src={getHeroImageUrl(p.heroName)}
                                          alt={p.heroName}
                                          className="w-3.5 h-3.5 rounded-full object-cover"
                                        />
                                      )}
                                      <span>{p.heroName || `Slot ${pIdx + 1}`}</span>
                                      {p.playerNickname && (
                                        <span className="text-[9px] text-[#E91E63]">({p.playerNickname})</span>
                                      )}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Action Button: Edit Game */}
                            <button
                              type="button"
                              onClick={() => setEditingGame({ session: sess, game: g })}
                              className="px-3 py-1.5 rounded-xl bg-white border border-[#F3D5E2] hover:border-[#E91E63] text-xs font-bold text-slate-700 hover:text-[#E91E63] flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                            >
                              <Edit3 size={13} />
                              <span>บันทึก/แก้ไข Game #{g.gameNumber}</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* 1. New Scrim Session Modal */}
      {isNewSessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs font-['Prompt']">
          <div className="bg-white border-2 border-[#F3D5E2] rounded-2xl max-w-md w-full p-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 pb-2 mb-3 border-b border-slate-100 flex items-center gap-2">
              <Plus size={18} className="text-[#E91E63]" />
              <span>สร้างรายการแข่งขันซ้อมใหม่ (New Scrim Session)</span>
            </h3>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">ชื่อการซ้อม / แผนการเล่น</label>
                <input
                  type="text"
                  value={newSessionTitle}
                  onChange={(e) => setNewSessionTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#E91E63]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">คู่แข่ง (Opponent Team)</label>
                <input
                  type="text"
                  value={newSessionOpponent}
                  onChange={(e) => setNewSessionOpponent(e.target.value)}
                  placeholder="เช่น Talon, Bacon Time..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#E91E63]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">รูปแบบซีรีส์</label>
                  <select
                    value={newSessionFormat}
                    onChange={(e) => setNewSessionFormat(e.target.value as ScrimSeriesFormat)}
                    className="w-full p-2 rounded-xl border border-slate-200 outline-none focus:border-[#E91E63]"
                  >
                    <option value="BO1">BO1 (1 เกม)</option>
                    <option value="BO3">BO3 (3 เกม)</option>
                    <option value="BO5">BO5 (5 เกม)</option>
                    <option value="BO7">BO7 (7 เกม)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">วันที่แข่งขัน</label>
                  <input
                    type="date"
                    value={newSessionDate}
                    onChange={(e) => setNewSessionDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 outline-none focus:border-[#E91E63]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsNewSessionModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleCreateSession}
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-[#E91E63] text-white hover:bg-[#D81B60] shadow-xs cursor-pointer"
              >
                ยืนยันการสร้าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Scrim Game Editor Modal */}
      {editingGame && (
        <ScrimGameEditorModal
          isOpen={Boolean(editingGame)}
          onClose={() => setEditingGame(null)}
          game={editingGame.game}
          players={players}
          onSave={handleSaveGame}
        />
      )}

      {/* 3. Delete Safety Confirmation Modal */}
      {deletingSessionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs font-['Prompt']">
          <div className="bg-white border-2 border-rose-300 rounded-2xl max-w-sm w-full p-4 shadow-2xl">
            <div className="flex items-center gap-2.5 pb-2 mb-2 border-b border-rose-100 text-rose-600">
              <AlertTriangle size={18} />
              <h3 className="text-sm font-bold text-slate-900">ยืนยันการลบรายการซ้อม</h3>
            </div>
            <p className="text-xs text-slate-600 my-2">
              คุณแน่ใจหรือไม่ว่าต้องการลบรายการซ้อมนี้? ข้อมูลเกมและผลการแข่งขันทั้งหมดในซีรีส์นี้จะถูกลบออกจากสถิติ
            </p>
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setDeletingSessionId(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 shadow-xs cursor-pointer"
              >
                ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Export / Import Scrims Modal */}
      {isExportImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs font-['Prompt']">
          <div className="bg-white border-2 border-[#F3D5E2] rounded-2xl max-w-lg w-full p-4 shadow-2xl flex flex-col gap-3">
            <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Download size={18} className="text-[#E91E63]" />
              <span>ส่งออก / นำเข้าข้อมูลการซ้อม (Scrim JSON)</span>
            </h3>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-700">ส่งออกข้อมูลปัจจุบัน (JSON Export):</label>
              <textarea
                readOnly
                value={scrimService.exportJson()}
                rows={5}
                className="w-full text-[11px] font-mono p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(scrimService.exportJson());
                  showToast('📋 คัดลอก JSON ไปยัง Clipboard เรียบร้อยแล้ว');
                }}
                className="self-start text-xs font-bold text-[#E91E63] hover:underline"
              >
                คัดลอกข้อความ JSON ทั้งหมด
              </button>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700">นำเข้าข้อมูลใหม่ (JSON Import):</label>
              <textarea
                placeholder="วางข้อมูล JSON ของการซ้อมที่นี่..."
                value={importJsonText}
                onChange={(e) => {
                  setImportJsonText(e.target.value);
                  setImportError('');
                }}
                rows={4}
                className="w-full text-[11px] font-mono p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-[#E91E63]"
              />
              {importError && <span className="text-xs text-rose-600 font-semibold">{importError}</span>}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsExportImportOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                ปิด
              </button>
              <button
                type="button"
                onClick={handleImportJson}
                disabled={!importJsonText.trim()}
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-[#E91E63] disabled:opacity-50 text-white hover:bg-[#D81B60] shadow-xs cursor-pointer"
              >
                นำเข้าข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
