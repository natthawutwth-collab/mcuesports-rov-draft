import React, { useState, useMemo, useCallback } from 'react';
import {
  MatchPrepReport,
  CoachAccessLevel,
} from '../../types/coachReport';
import { coachReportService } from '../../services/coachReportService';
import { seriesPrepService } from '../../services/seriesPrepService';
import { VERIFIED_PRO_TEAMS } from '../../services/scoutingService';
import { useDraftHistory } from '../../hooks/useDraftHistory';
import {
  FileText,
  Printer,
  Copy,
  Save,
  Shield,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  Swords,
  Users,
  Award,
  Zap,
  Target,
  Clock,
  Sparkles,
  ChevronRight,
  BookOpen,
  Lock,
  Unlock,
  RotateCcw,
  ExternalLink,
  ChevronDown,
  Trash2,
  FolderOpen,
  X,
} from 'lucide-react';

interface MatchPrepReportViewProps {
  onSelectView?: (view: any) => void;
  onOpenDraftWithPlan?: (plan: any) => void;
}

export const MatchPrepReportView: React.FC<MatchPrepReportViewProps> = ({
  onSelectView,
  onOpenDraftWithPlan,
}) => {
  const { records: draftHistoryRecords } = useDraftHistory();

  // Control inputs
  const [selectedOpponent, setSelectedOpponent] = useState<string>('Talon');
  const [customOpponentInput, setCustomOpponentInput] = useState<string>('');
  const [matchDate, setMatchDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedSide, setSelectedSide] = useState<'blue' | 'red' | 'both'>('blue');
  const [selectedGameNumber, setSelectedGameNumber] = useState<number>(1);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [accessLevel, setAccessLevel] = useState<CoachAccessLevel>('coach_verified');

  // PIN modal state for coach verification
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Saved reports history and drawer
  const [savedReports, setSavedReports] = useState<MatchPrepReport[]>(() =>
    coachReportService.getAllSavedReports()
  );
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState<boolean>(false);
  const [viewingSavedReport, setViewingSavedReport] = useState<MatchPrepReport | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);

  // Available series plans from seriesPrepService
  const availableSeriesPlans = useMemo(() => {
    return seriesPrepService.getAllPlans();
  }, []);

  // Active opponent name
  const effectiveOpponent = customOpponentInput.trim() || selectedOpponent;

  // Generate Report (or display saved snapshot if selected)
  const report: MatchPrepReport = useMemo(() => {
    if (viewingSavedReport) return viewingSavedReport;
    return coachReportService.generateMatchPrepReport({
      opponentTeam: effectiveOpponent,
      matchDate,
      selectedSide,
      selectedGameNumber,
      selectedPlanId: selectedPlanId || undefined,
      draftHistoryRecords,
      accessLevel,
    });
  }, [
    viewingSavedReport,
    effectiveOpponent,
    matchDate,
    selectedSide,
    selectedGameNumber,
    selectedPlanId,
    draftHistoryRecords,
    accessLevel,
  ]);

  // Handle Save Snapshot
  const handleSaveSnapshot = () => {
    coachReportService.saveReportSnapshot(report);
    setSavedReports(coachReportService.getAllSavedReports());
    setCopyToast('💾 บันทึก Snapshot รายงานเตรียมแข่งเรียบร้อยแล้ว');
    setTimeout(() => setCopyToast(null), 3500);
  };

  // Handle Delete Snapshot
  const handleDeleteSavedReport = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    coachReportService.deleteSavedReport(id);
    setSavedReports(coachReportService.getAllSavedReports());
    if (viewingSavedReport?.id === id) {
      setViewingSavedReport(null);
    }
    setCopyToast('🗑️ ลบ Snapshot รายงานที่เลือกเรียบร้อยแล้ว');
    setTimeout(() => setCopyToast(null), 3000);
  };

  // Apply Quick Test Scenarios (Testing Complete vs Incomplete data)
  const applyTestScenario = (scenario: 'complete' | 'moderate' | 'incomplete') => {
    setViewingSavedReport(null);
    if (scenario === 'complete') {
      setSelectedOpponent('Talon');
      setCustomOpponentInput('');
      setSelectedSide('blue');
      setSelectedGameNumber(1);
      setSelectedPlanId('');
      setCopyToast('🧪 โหลดชุดทดสอบ: ข้อมูลสมบูรณ์ครบถ้วน (Talon: Scrim 3+ เกม, Pro Stats 100%)');
    } else if (scenario === 'moderate') {
      setSelectedOpponent('Buriram United');
      setCustomOpponentInput('');
      setSelectedSide('red');
      setSelectedGameNumber(2);
      setSelectedPlanId('');
      setCopyToast('🧪 โหลดชุดทดสอบ: ข้อมูลปานกลาง (Buriram: Scrim 1 เกม, Pro League Stats)');
    } else {
      setSelectedOpponent('Hydra');
      setCustomOpponentInput('');
      setSelectedSide('blue');
      setSelectedGameNumber(1);
      setSelectedPlanId('');
      setCopyToast('🧪 โหลดชุดทดสอบ: ข้อมูลไม่ครบ / ทีมใหม่ (Hydra: ไม่มี Scrim ตรง, ข้อมูลสเกาต์น้อย, ตรวจพบ Data Gaps)');
    }
    setTimeout(() => setCopyToast(null), 3500);
  };

  // Handle Print / PDF Export
  const handlePrint = () => {
    window.print();
  };

  // Handle Copy Briefing
  const handleCopyBriefing = () => {
    const text = `📋 [MCU eSports Coach Briefing vs ${report.opponentTeam}]
วันที่แข่ง: ${report.matchDate} (Game ${report.selectedGameNumber} - ${report.selectedSide.toUpperCase()} SIDE)
แผนหลัก: ${report.draftPlans.primaryPlanA.planName}
วินคอนดิชัน: ${report.draftPlans.primaryPlanA.keyWinCondition}

🔴 จุดที่ต้องทำ (Must-Do):
${report.coachPreMatchBriefing.mustDoList.map((d, i) => `${i + 1}. ${d}`).join('\n')}

⚠️ สิ่งที่ห้ามทำ (Avoid):
${report.coachPreMatchBriefing.avoidList.map((a, i) => `${i + 1}. ${a}`).join('\n')}

🎯 เป้าหมายโฟกัส: ${report.coachPreMatchBriefing.targetFocus}
💬 รูปแบบการสื่อสาร: ${report.coachPreMatchBriefing.communicationAnchor}`;

    navigator.clipboard.writeText(text);
    setCopyToast('📋 คัดลอกสรุปข้อชี้แจงผู้เล่น (Briefing) ลง Clipboard แล้ว');
    setTimeout(() => setCopyToast(null), 3500);
  };

  // Handle PIN verification
  const handleUnlockPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (coachReportService.verifyCoachPin(pinInput)) {
      setAccessLevel('coach_verified');
      setIsPinModalOpen(false);
      setPinInput('');
      setPinError(null);
      setCopyToast('🔓 ปลดล็อกสิทธิ์ Coach Verified สำเร็จ');
      setTimeout(() => setCopyToast(null), 3500);
    } else {
      setPinError('PIN ไม่ถูกต้อง (ค่าเริ่มต้นคือ 2026)');
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 font-['Prompt'] text-slate-800 animate-fadeIn select-none">
      {/* 1. Header & Configuration Card (Non-printable controls) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-white via-[#FFF5F8] to-[#FCE4EC]/50 border border-[#F3D5E2] p-4 sm:p-5 shadow-xs print:hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#E91E63] via-[#D81B60] to-[#C2185B] text-white flex items-center justify-center shadow-md shadow-[#E91E63]/25 ring-4 ring-[#FCE4EC] flex-shrink-0">
              <FileText size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-['Prompt'] font-bold text-lg sm:text-xl text-slate-900 leading-snug">
                  Phase 7: Match Preparation & Coach Report
                </h1>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#E91E63] text-white uppercase tracking-wider">
                  Dossier Generator
                </span>
                {accessLevel === 'coach_verified' ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <Shield size={11} />
                    <span>Coach Verified (สิทธิ์สมบูรณ์)</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                    <Lock size={11} />
                    <span>Restricted Mode</span>
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-[13px] text-slate-500 mt-1 max-w-3xl leading-relaxed">
                สร้างเอกสารและรายงานเตรียมแข่งฉบับสมบูรณ์สำหรับ MCU eSports • สังเคราะห์ข้อมูล Hero Data, Pro Stats, Player Pool, Matchup, Scouting และ Scrim เข้าด้วยกันอย่างเป็นรูปธรรม
              </p>
            </div>
          </div>

          {/* Action Buttons: Print, Copy, Save */}
          <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
            {/* Snapshot History Button */}
            <button
              onClick={() => setIsSavedDrawerOpen(true)}
              className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
              title="ดูประวัติรายงานเตรียมแข่งที่บันทึกไว้"
            >
              <FolderOpen size={14} className="text-amber-600" />
              <span>ประวัติ Snapshot ({savedReports.length})</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              title="พิมพ์เอกสารเตรียมแข่งหรือบันทึกเป็น PDF"
            >
              <Printer size={14} />
              <span>พิมพ์รายงาน / PDF</span>
            </button>

            <button
              onClick={handleCopyBriefing}
              className="px-3 py-2 rounded-xl bg-white hover:bg-[#FFF0F5] text-slate-700 hover:text-[#E91E63] border border-[#F3D5E2] text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
              title="คัดลอกสรุปข้อชี้แจงผู้เล่น"
            >
              <Copy size={14} />
              <span>คัดลอก Briefing</span>
            </button>

            <button
              onClick={handleSaveSnapshot}
              className="px-3 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
            >
              <Save size={14} />
              <span>บันทึก Snapshot</span>
            </button>

            {accessLevel === 'coach_verified' ? (
              <button
                onClick={() => setAccessLevel('restricted')}
                className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                title="สลับสู่โหมดบุคคลทั่วไป"
              >
                <Lock size={13} />
                <span className="hidden sm:inline">ล็อกสิทธิ์</span>
              </button>
            ) : (
              <button
                onClick={() => setIsPinModalOpen(true)}
                className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Unlock size={14} />
                <span>ยืนยันสิทธิ์โค้ช</span>
              </button>
            )}
          </div>
        </div>

        {/* Viewing Snapshot Alert Banner */}
        {viewingSavedReport && (
          <div className="mt-3 p-3 rounded-xl bg-amber-500 text-white text-xs font-bold flex items-center justify-between shadow-xs animate-fadeIn">
            <div className="flex items-center gap-2">
              <FolderOpen size={16} />
              <span>
                กำลังเปิดดู Snapshot: {viewingSavedReport.opponentTeam} (Game {viewingSavedReport.selectedGameNumber} - {viewingSavedReport.selectedSide.toUpperCase()}) • บันทึกเมื่อ{' '}
                {new Date(viewingSavedReport.generatedAt).toLocaleString('th-TH')}
              </span>
            </div>
            <button
              onClick={() => setViewingSavedReport(null)}
              className="px-2.5 py-1 rounded-lg bg-black/20 hover:bg-black/30 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
            >
              <X size={13} />
              <span>กลับสู่รายงานสดปัจจุบัน</span>
            </button>
          </div>
        )}

        {/* Feedback Toast Banner */}
        {copyToast && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
            <span>{copyToast}</span>
          </div>
        )}

        {/* Configuration Filters Bar */}
        <div className="mt-4 pt-3 border-t border-[#F8BBD0]/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* 1. Opponent Select */}
          <div>
            <label className="block text-slate-600 font-bold mb-1 flex items-center gap-1">
              <span>ทีมคู่แข่ง (Opponent):</span>
            </label>
            <div className="flex gap-1.5">
              <select
                value={selectedOpponent}
                onChange={(e) => {
                  setViewingSavedReport(null);
                  setSelectedOpponent(e.target.value);
                  setCustomOpponentInput('');
                }}
                className="flex-1 p-2 rounded-xl bg-white border border-[#F3D5E2] font-semibold text-slate-800 focus:outline-none focus:border-[#E91E63]"
              >
                {VERIFIED_PRO_TEAMS.map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>
            </div>
            {/* Quick text input for new / unscouted team to test incomplete dataset */}
            <input
              type="text"
              placeholder="หรือพิมพ์ชื่อทีมใหม่..."
              value={customOpponentInput}
              onChange={(e) => {
                setViewingSavedReport(null);
                setCustomOpponentInput(e.target.value);
              }}
              className="w-full mt-1.5 p-1.5 text-[11px] rounded-lg border border-slate-200 focus:outline-none focus:border-[#E91E63]"
            />
          </div>

          {/* 2. Match Date */}
          <div>
            <label className="block text-slate-600 font-bold mb-1 flex items-center gap-1">
              <Calendar size={13} className="text-slate-400" />
              <span>วันที่แข่งขัน (Match Date):</span>
            </label>
            <input
              type="date"
              value={matchDate}
              onChange={(e) => {
                setViewingSavedReport(null);
                setMatchDate(e.target.value);
              }}
              className="w-full p-2 rounded-xl bg-white border border-[#F3D5E2] font-medium text-slate-800 focus:outline-none focus:border-[#E91E63]"
            />
          </div>

          {/* 3. Preferred Side */}
          <div>
            <label className="block text-slate-600 font-bold mb-1 flex items-center gap-1">
              <Shield size={13} className="text-slate-400" />
              <span>ฝั่งที่เลือก (Side):</span>
            </label>
            <div className="flex rounded-xl bg-slate-100 p-0.5 border border-slate-200">
              <button
                onClick={() => {
                  setViewingSavedReport(null);
                  setSelectedSide('blue');
                }}
                className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  selectedSide === 'blue'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-blue-600'
                }`}
              >
                Blue (1st)
              </button>
              <button
                onClick={() => {
                  setViewingSavedReport(null);
                  setSelectedSide('red');
                }}
                className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  selectedSide === 'red'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-rose-600'
                }`}
              >
                Red (2nd)
              </button>
            </div>
          </div>

          {/* 4. Game Plan Number */}
          <div>
            <label className="block text-slate-600 font-bold mb-1 flex items-center gap-1">
              <Layers size={13} className="text-slate-400" />
              <span>เกมในซีรีส์ (Game #):</span>
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((gNum) => (
                <button
                  key={gNum}
                  onClick={() => {
                    setViewingSavedReport(null);
                    setSelectedGameNumber(gNum);
                  }}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold font-['Orbitron'] border transition-all cursor-pointer ${
                    selectedGameNumber === gNum
                      ? 'bg-[#E91E63] text-white border-[#E91E63] shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-[#FFF0F5] border-[#F3D5E2]'
                  }`}
                >
                  G{gNum}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Series Plan Selection */}
          <div>
            <label className="block text-slate-600 font-bold mb-1 flex items-center gap-1">
              <BookOpen size={13} className="text-slate-400" />
              <span>แผนซีรีส์ (Series Plan):</span>
            </label>
            <select
              value={selectedPlanId}
              onChange={(e) => {
                setViewingSavedReport(null);
                setSelectedPlanId(e.target.value);
              }}
              className="w-full p-2 rounded-xl bg-white border border-[#F3D5E2] font-semibold text-slate-800 text-xs focus:outline-none focus:border-[#E91E63]"
            >
              <option value="">(อัตโนมัติตามคู่แข่ง)</option>
              {availableSeriesPlans.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.title} ({sp.opponentTeam})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Test Scenarios Banner (Testing Complete vs Incomplete Data) */}
        <div className="mt-3 pt-3 border-t border-[#F8BBD0]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-700 font-bold">
            <Sparkles size={14} className="text-[#E91E63]" />
            <span>ทดสอบการสร้างรายงาน (Test Completeness Scenarios):</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => applyTestScenario('complete')}
              className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 font-bold text-[11px] cursor-pointer flex items-center gap-1 transition-colors"
              title="ทดสอบข้อมูลสมบูรณ์: Talon Esports มีสถิติ Scrim 3+ เกม, Pro Stats 100%"
            >
              <CheckCircle2 size={12} className="text-emerald-700" />
              <span>1. ข้อมูลครบถ้วน (Talon)</span>
            </button>
            <button
              type="button"
              onClick={() => applyTestScenario('moderate')}
              className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold text-[11px] cursor-pointer flex items-center gap-1 transition-colors"
              title="ทดสอบข้อมูลปานกลาง: Buriram United มี Scrim 1 เกม + ข้อมูลโปรลีก"
            >
              <AlertTriangle size={12} className="text-amber-700" />
              <span>2. ข้อมูลปานกลาง (Buriram)</span>
            </button>
            <button
              type="button"
              onClick={() => applyTestScenario('incomplete')}
              className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 font-bold text-[11px] cursor-pointer flex items-center gap-1 transition-colors"
              title="ทดสอบข้อมูลไม่ครบ: Hydra ไม่มีประวัติ Scrim ตรง, ข้อมูลสเกาต์น้อย ตรวจพบ Data Gaps"
            >
              <ShieldAlert size={12} className="text-rose-700" />
              <span>3. ข้อมูลไม่ครบ / ทีมใหม่ (Hydra)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Data Completeness & Readiness Banner (Auditable status) */}
      <div
        className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-2xs print:border-slate-300 ${
          report.dataCompleteness.completenessTier === 'high'
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
            : report.dataCompleteness.completenessTier === 'moderate'
            ? 'bg-amber-50/80 border-amber-200 text-amber-950'
            : 'bg-rose-50/80 border-rose-200 text-rose-950'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
              report.dataCompleteness.completenessTier === 'high'
                ? 'bg-emerald-200 text-emerald-800'
                : report.dataCompleteness.completenessTier === 'moderate'
                ? 'bg-amber-200 text-amber-800'
                : 'bg-rose-200 text-rose-800'
            }`}
          >
            {report.dataCompleteness.completenessTier === 'high' ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertTriangle size={18} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-xs uppercase tracking-wider">
                ความสมบูรณ์ของฐานข้อมูล (Data Completeness Audit): {report.dataCompleteness.completenessScore}%
              </span>
              <span className="text-[10px] px-2 py-0.2 rounded-full font-black bg-white/80 border border-current">
                {report.dataCompleteness.completenessTier === 'high'
                  ? 'ข้อมูลครบถ้วน (High Completeness)'
                  : report.dataCompleteness.completenessTier === 'moderate'
                  ? 'ข้อมูลปานกลาง (Moderate Completeness)'
                  : 'ข้อมูลไม่ครบถ้วน / ทีมใหม่ (Data Gaps Detected)'}
              </span>
            </div>
            <p className="text-xs mt-1 font-medium leading-relaxed opacity-90">
              {report.dataCompleteness.missingDataNotice} • บันทึก Scrim พบ <strong>{report.dataCompleteness.scrimGamesFound}</strong> เกม | สถิติสเกาต์ <strong>{report.dataCompleteness.proGamesFound}</strong> เกม
            </p>
          </div>
        </div>

        {report.dataCompleteness.identifiedGaps.length > 0 && (
          <div className="text-right flex-shrink-0 text-[11px] font-semibold text-rose-700 bg-white/70 px-2.5 py-1 rounded-lg border border-rose-200">
            ตรวจพบ {report.dataCompleteness.identifiedGaps.length} จุดข้อจำกัดข้อมูล
          </div>
        )}
      </div>

      {/* =========================================================================
          PRINTABLE DOSSIER CONTENT (Formatted for both screen & official print)
          ========================================================================= */}
      <div className="flex flex-col gap-5 print:gap-4 print:text-black">
        {/* Dossier Header Banner (Official MCU eSports Match Preparation Report) */}
        <div className="p-5 rounded-2xl bg-white border border-[#F3D5E2] shadow-2xs print:border-black print:shadow-none">
          <div className="flex items-center justify-between border-b border-slate-100 print:border-black pb-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#E91E63] block">
                MCU eSports • Official Competitive Dossier
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                รายงานเตรียมการแข่งขัน: MCU eSports vs {report.opponentTeam}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <span>{report.tournamentName}</span>
                <span>•</span>
                <span>{report.patch}</span>
                <span>•</span>
                <span className="font-bold text-[#E91E63]">Game {report.selectedGameNumber} ({report.selectedSide.toUpperCase()} SIDE)</span>
              </div>
            </div>

            <div className="text-right text-xs">
              <span className="text-[10px] text-slate-400 block uppercase">Generated At</span>
              <span className="font-bold text-slate-800 font-['Orbitron']">
                {new Date(report.generatedAt).toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">
                {report.coachAuditor}
              </span>
            </div>
          </div>

          {/* Core Analytical Disclaimer (Strict Requirement) */}
          <div className="mt-3 p-3 rounded-xl bg-purple-50/60 border border-purple-200 text-purple-950 text-xs flex items-start gap-2.5">
            <Info size={16} className="text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-bold text-purple-900">ข้อควรระวังและหลักการวิเคราะห์:</strong>{' '}
              {report.dataLimitations.disclaimer}
            </div>
          </div>
        </div>

        {/* SECTION 1: ข้อมูลคู่แข่งและแหล่งที่มา (Opponent Profile & Source) */}
        <div className="p-5 rounded-2xl bg-white border border-[#F3D5E2] shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Users size={16} className="text-[#E91E63]" />
              <span>1. ข้อมูลคู่แข่งและแหล่งที่มา (Opponent Profile & Sources)</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
              แหล่งที่มา: {report.opponentProfile.sourceAttribution}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Scrim Record Card */}
            <div className="p-3.5 rounded-xl bg-[#FFF9FB] border border-[#F8BBD0]/50 flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-700">สถิติเจอกันในห้อง Scrim:</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 font-['Orbitron']">
                  {report.opponentProfile.scrimRecordVsMcu.games > 0
                    ? `${report.opponentProfile.scrimRecordVsMcu.winRate}%`
                    : 'N/A'}
                </span>
                <span className="text-xs text-slate-500">
                  (MCU ชนะ {report.opponentProfile.scrimRecordVsMcu.mcuWins} / {report.opponentProfile.scrimRecordVsMcu.games} เกม)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                {report.opponentProfile.playstyleSummary}
              </p>
            </div>

            {/* Top Threat Heroes */}
            <div className="p-3.5 rounded-xl bg-[#FFF9FB] border border-[#F8BBD0]/50 md:col-span-2">
              <span className="text-xs font-bold text-slate-700 block mb-2">
                ฮีโร่ตัวอันตรายของคู่แข่ง (Key Threat Heroes):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {report.opponentProfile.threatHeroes.map((th) => (
                  <div
                    key={th.heroName}
                    className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{th.heroName}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 font-semibold text-slate-600">
                          {th.role}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {th.primaryThreatReason}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        th.threatLevel === 'critical'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {th.threatLevel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: ฮีโร่ที่ควรพิจารณา Pick/Ban พร้อมเหตุผล */}
        <div className="p-5 rounded-2xl bg-white border border-[#F3D5E2] shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Target size={16} className="text-[#E91E63]" />
              <span>2. ฮีโร่ที่ควรพิจารณา Pick / Ban พร้อมเหตุผล (Pick & Ban Directives)</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">คำนวณจาก Pro Meta & Scrim Verification</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Must Ban List */}
            <div className="p-4 rounded-xl bg-rose-50/40 border border-rose-200 space-y-2">
              <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600" />
                <span>ฮีโร่เป้าหมายที่ควรแบน (Must-Ban Targets):</span>
              </span>
              <div className="space-y-2">
                {report.pickBanDirectives.mustBans.map((b) => (
                  <div key={b.heroName} className="p-2.5 rounded-lg bg-white border border-rose-100 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        {b.heroName} ({b.role})
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-rose-100 text-rose-800">
                        {b.priorityLevel}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{b.reason}</p>
                    <span className="text-[10px] text-slate-400 block mt-1">แหล่งที่มา: {b.source}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Target Pick List */}
            <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200 space-y-2">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>ฮีโร่เป้าหมายที่ MCU ควรชิงเลือก (Priority Picks):</span>
              </span>
              <div className="space-y-2">
                {report.pickBanDirectives.priorityPicks.map((p) => (
                  <div key={p.heroName} className="p-2.5 rounded-lg bg-white border border-emerald-100 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        {p.heroName} ({p.role})
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                        {p.priorityLevel}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{p.reason}</p>
                    {p.playerFit && (
                      <span className="text-[10px] font-semibold text-emerald-700 block mt-1">
                        ผู้เล่นที่รองรับ: {p.playerFit}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 block mt-0.5">แหล่งที่มา: {p.source}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: แผนดราฟหลักและแผนสำรอง (Primary Plan A & Contingency Plan B) */}
        <div className="p-5 rounded-2xl bg-white border border-[#F3D5E2] shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Layers size={16} className="text-[#E91E63]" />
              <span>3. แผนดราฟหลักและแผนสำรอง (Primary Game Plan A & Contingency Plan B)</span>
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#E91E63]">
                ฝั่ง {report.draftPlans.primaryPlanA.side.toUpperCase()}
              </span>
              {onSelectView && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenDraftWithPlan?.(report.draftPlans.primaryPlanA);
                    onSelectView('draft');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#E91E63] to-[#D81B60] hover:from-[#D81B60] hover:to-[#C2185B] text-white text-[11px] font-bold shadow-2xs flex items-center gap-1 cursor-pointer transition-all"
                  title="เปิดห้องดราฟต์สดด้วยแผนนี้"
                >
                  <Swords size={12} />
                  <span>เริ่มดราฟต์ด้วยแผนนี้</span>
                </button>
              )}
            </div>
          </div>

          {/* Primary Plan A */}
          <div className="p-4 rounded-xl bg-[#FFF9FB] border border-[#F8BBD0]/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#E91E63] text-white uppercase tracking-wider">
                  Plan A (แผนหลัก)
                </span>
                <h4 className="font-bold text-sm text-slate-900 mt-1">
                  {report.draftPlans.primaryPlanA.planName}
                </h4>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {report.draftPlans.primaryPlanA.tacticalTheme}
              </span>
            </div>

            {/* Lineup Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
              {report.draftPlans.primaryPlanA.lineup.map((slot) => (
                <div key={slot.role} className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">{slot.role}</span>
                    <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-pink-100 text-[#E91E63]">
                      {slot.tier}
                    </span>
                  </div>
                  <div className="font-black text-sm text-slate-900 mt-1">{slot.heroName}</div>
                  <div className="text-[11px] font-medium text-slate-600">ผู้เล่น: {slot.playerNickname}</div>
                  <div className="text-[10px] text-slate-400 mt-1 border-t border-slate-100 pt-1">
                    {slot.keyFunction}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
              <strong>เงื่อนไขชัยชนะหลัก (Win Condition):</strong> {report.draftPlans.primaryPlanA.keyWinCondition}
            </div>
          </div>

          {/* Contingency Plan B */}
          <div className="p-4 rounded-xl bg-amber-50/30 border border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-600 text-white uppercase tracking-wider">
                Plan B (แผนสำรองหากถูกแบนหรือแย่ง)
              </span>
              <span className="text-xs text-amber-800 font-medium">
                เงื่อนไขสลับแผน: {report.draftPlans.contingencyPlanB.triggerCondition}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
              {report.draftPlans.contingencyPlanB.lineup.map((slot) => (
                <div key={slot.role} className="p-2.5 rounded-lg bg-white border border-amber-100">
                  <div className="text-[10px] font-bold text-slate-400">{slot.role}</div>
                  <div className="font-bold text-xs text-slate-800 mt-0.5">
                    {slot.primaryHero} → <strong className="text-amber-700">{slot.backupHero}</strong>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 leading-snug">
                    {slot.substitutionRationale}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 4: ความเหมาะสมกับผู้เล่นและฮีโร่ที่ถนัด (MCU Player Pool Alignment) */}
        <div className="p-5 rounded-2xl bg-white border border-[#F3D5E2] shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Award size={16} className="text-[#E91E63]" />
              <span>4. ความเหมาะสมกับผู้เล่นและฮีโร่ที่ถนัด (MCU Player Hero Pool Alignment)</span>
            </h3>
            <span className="text-xs text-slate-400">อิงข้อมูลชมรม MCU eSports Roster</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 text-xs">
            {report.playerPoolAlignment.map((p) => (
              <div key={p.playerNickname} className="p-3 rounded-xl bg-[#FFF9FB] border border-[#F8BBD0]/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{p.playerNickname}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-slate-100 text-slate-700">
                      {p.position}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate">{p.playerName}</span>

                  <div className="mt-2 space-y-1">
                    <span className="text-[10px] font-bold text-[#E91E63] block">⭐ Signature Pool:</span>
                    <div className="flex flex-wrap gap-1">
                      {p.signatures.map((sig) => (
                        <span key={sig} className="px-1.5 py-0.2 rounded bg-pink-100 text-[#E91E63] text-[10px] font-bold">
                          {sig}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-2 space-y-1">
                    <span className="text-[10px] font-bold text-slate-600 block">★ Comfortable:</span>
                    <div className="flex flex-wrap gap-1">
                      {p.comfortables.slice(0, 3).map((cmf) => (
                        <span key={cmf} className="px-1.5 py-0.2 rounded bg-white border border-slate-200 text-slate-700 text-[10px]">
                          {cmf}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-pink-100 text-[10px] text-slate-500">
                  <strong>บทบาทในเกม:</strong> {p.tacticalAssignment}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 5: Matchup และ Synergy ที่เกี่ยวข้อง */}
        <div className="p-5 rounded-2xl bg-white border border-[#F3D5E2] shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Swords size={16} className="text-[#E91E63]" />
              <span>5. Matchup และ Synergy ที่เกี่ยวข้อง (Head-to-Head & Combo Synergies)</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">Liquipedia RPL 2026 Official Stats</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Lane Matchups */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 block">
                การประกบคู่ยืนเลน (Lane Head-to-Head Matchups):
              </span>
              {report.matchupsAndSynergies.laneMatchups.map((lm, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{lm.lane}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        lm.verdict === 'advantage'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {lm.diffPct > 0 ? `+${lm.diffPct}% Advantage` : `${lm.diffPct}% Even`}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-2">
                    <span className="text-[#E91E63]">{lm.mcuHero}</span>
                    <span className="text-slate-400">VS</span>
                    <span className="text-slate-700">{lm.oppHero}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-snug">{lm.detailedNote}</p>
                  <span className="text-[10px] text-slate-400 block mt-1">แหล่งข้อมูล: {lm.source}</span>
                </div>
              ))}
            </div>

            {/* Duo / Trio Synergies */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 block">
                คอมโบคู่หูที่เข้าขากันของ MCU (Key Synergies):
              </span>
              {report.matchupsAndSynergies.comboSynergies.map((cs, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-pink-50/40 border border-pink-200 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{cs.heroes.join(' + ')}</span>
                    <span className="text-xs font-black text-[#E91E63] font-['Orbitron']">
                      WR {cs.winRate}% ({cs.games} เกม)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-snug">{cs.synergyDescription}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>ช่วงเวลาทรงพลัง: {cs.tacticalTiming}</span>
                    <span>ที่มา: {cs.source}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 6: จุดแข็งและช่องโหว่ของทั้งสองทีม */}
        <div className="p-5 rounded-2xl bg-white border border-[#F3D5E2] shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <ShieldAlert size={16} className="text-amber-600" />
              <span>6. จุดแข็งและช่องโหว่ของทั้งสองทีม (Team Strengths & Structural Vulnerabilities)</span>
            </h3>
            <span className="text-xs text-slate-400">เปรียบเทียบจากสถิติและการวิเคราะห์เชิงแท็กติก</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* MCU Side */}
            <div className="p-3.5 rounded-xl bg-blue-50/40 border border-blue-200 space-y-2">
              <span className="font-bold text-blue-900 block">ฝั่ง MCU eSports:</span>
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-emerald-700">จุดแข็ง (Strengths):</span>
                {report.teamComparison.mcuStrengths.map((str, idx) => (
                  <div key={idx} className="text-[11px] text-slate-700 flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{str}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1 pt-2 border-t border-blue-100">
                <span className="text-[11px] font-bold text-rose-700">จุดที่ต้องระวัง (Vulnerabilities):</span>
                {accessLevel === 'restricted' ? (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Lock size={13} className="text-amber-600 flex-shrink-0" />
                      <span>จุดอ่อนภายใน MCU ถูกซ่อนไว้ในโหมดจำกัดสิทธิ์</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPinModalOpen(true)}
                      className="px-2 py-0.5 rounded bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold text-[10px] cursor-pointer"
                    >
                      ปลดล็อก PIN
                    </button>
                  </div>
                ) : (
                  report.teamComparison.mcuVulnerabilities.map((vul, idx) => (
                    <div key={idx} className="text-[11px] text-slate-700 flex items-start gap-1.5">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>{vul}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Opponent Side */}
            <div className="p-3.5 rounded-xl bg-rose-50/40 border border-rose-200 space-y-2">
              <span className="font-bold text-rose-900 block">ฝั่ง {report.opponentTeam}:</span>
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-emerald-700">จุดแข็งคู่แข่ง:</span>
                {report.teamComparison.oppStrengths.map((str, idx) => (
                  <div key={idx} className="text-[11px] text-slate-700 flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{str}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1 pt-2 border-t border-rose-100">
                <span className="text-[11px] font-bold text-rose-700">ช่องโหว่ที่ MCU สามารถโจมตีได้:</span>
                {report.teamComparison.oppVulnerabilities.map((vul, idx) => (
                  <div key={idx} className="text-[11px] text-slate-700 flex items-start gap-1.5">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>{vul}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 7: เงื่อนไขการเล่นช่วงต้นเกม กลางเกม เลทเกม */}
        <div className="p-5 rounded-2xl bg-white border border-[#F3D5E2] shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Clock size={16} className="text-[#E91E63]" />
              <span>7. เงื่อนไขการเล่นช่วงต้นเกม กลางเกม และเลทเกม (Game Phase Win Conditions & Macro)</span>
            </h3>
            <span className="text-xs text-slate-400">เชื่อมโยงกับ Timing Curve ของคอมป์</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {report.gamePhaseConditions.map((gp) => (
              <div key={gp.phase} className="p-3.5 rounded-xl bg-[#FFF9FB] border border-[#F8BBD0]/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{gp.title}</span>
                    <span className="text-[10px] font-bold font-['Orbitron'] text-[#E91E63]">
                      {gp.timingMinutes}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-700 mt-1 leading-snug">
                    {gp.strategicDirective}
                  </p>

                  <div className="mt-2.5 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">เป้าหมายหลัก (Objectives):</span>
                    {gp.macroObjectives.map((obj, i) => (
                      <div key={i} className="text-[11px] text-slate-600 flex items-start gap-1">
                        <span className="text-[#E91E63] font-bold">✓</span>
                        <span>{obj}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-pink-100 text-[10px] text-slate-400">
                  อ้างอิง: {gp.groundedSource}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 8: ประเด็นที่โค้ชควรแจ้งผู้เล่นก่อนแข่ง (Coach Pre-Match Briefing) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-white to-[#FFF5F8] border-2 border-[#F3D5E2] shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-pink-200 pb-2.5">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Zap size={16} className="text-[#E91E63]" />
              <span>8. ประเด็นที่โค้ชควรแจ้งผู้เล่นก่อนแข่ง (Coach Pre-Match Briefing Directives)</span>
            </h3>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              ข้อสั่งการห้องพักนักกีฬา (Locker Room Briefing)
            </span>
          </div>

          {accessLevel === 'restricted' ? (
            <div className="py-8 px-4 rounded-xl bg-slate-50 border border-slate-200 text-center flex flex-col items-center justify-center gap-2">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
                <Lock size={20} />
              </div>
              <h4 className="font-bold text-sm text-slate-900 mt-1">
                ข้อมูลคำสั่งการในห้องพักนักกีฬา (Locker Room Directives) ถูกจำกัดสิทธิ์
              </h4>
              <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                ข้อสั่งการที่ต้องทำ, ข้อห้ามเด็ดขาด, เป้าหมายโฟกัส และคอลการสื่อสารหลัก สงวนสิทธิ์สำหรับโค้ชที่ผ่านการยืนยัน PIN
              </p>
              <button
                type="button"
                onClick={() => setIsPinModalOpen(true)}
                className="mt-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#E91E63] to-[#D81B60] text-white text-xs font-bold shadow-xs hover:shadow-md cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Unlock size={14} />
                <span>ยืนยันสิทธิ์ผู้ฝึกสอนเพื่อดูข้อสั่งการ (PIN)</span>
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Must-Do Directives */}
                <div className="p-3.5 rounded-xl bg-white border border-emerald-200 space-y-2">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>ข้อที่ต้องปฏิบัติอย่างเคร่งครัด (Must-Do Directives):</span>
                  </span>
                  <div className="space-y-1.5">
                    {report.coachPreMatchBriefing.mustDoList.map((m, i) => (
                      <div key={i} className="text-[11px] text-slate-700 flex items-start gap-2">
                        <span className="font-bold text-emerald-600 font-['Orbitron']">{i + 1}.</span>
                        <span>{m}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Avoid Directives */}
                <div className="p-3.5 rounded-xl bg-white border border-rose-200 space-y-2">
                  <span className="font-bold text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-rose-600" />
                    <span>ข้อห้ามเด็ดขาด (Strict Avoid Directives):</span>
                  </span>
                  <div className="space-y-1.5">
                    {report.coachPreMatchBriefing.avoidList.map((a, i) => (
                      <div key={i} className="text-[11px] text-slate-700 flex items-start gap-2">
                        <span className="font-bold text-rose-600 font-['Orbitron']">{i + 1}.</span>
                        <span>{a}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Target Priority and Communication Protocol */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">เป้าหมายโฟกัสหลักในไฟต์</span>
                  <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                    {report.coachPreMatchBriefing.targetFocus}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">คอลการสื่อสารหลัก (Communication Anchor)</span>
                  <span className="font-bold text-[#E91E63] text-xs mt-0.5 block">
                    {report.coachPreMatchBriefing.communicationAnchor}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* SECTION 9: ข้อมูลที่ยังไม่มีและข้อจำกัดในการวิเคราะห์ (Data Limitations & Gaps) */}
        <div className="p-5 rounded-2xl bg-white border border-[#F3D5E2] shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Info size={16} className="text-slate-500" />
              <span>9. ข้อมูลที่ยังไม่มีและข้อจำกัดในการวิเคราะห์ (Data Limitations & Gaps)</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">ความโปร่งใสทางสถิติและการวิเคราะห์</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
            <div>
              <strong className="font-bold text-slate-900 block mb-1">จุดข้อมูลที่ยังไม่ครอบคลุมในรายงานนี้:</strong>
              {report.dataLimitations.unverifiedMatchups.length > 0 ? (
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600">
                  {report.dataLimitations.unverifiedMatchups.map((uv, idx) => (
                    <li key={idx}>{uv}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-[11px] text-emerald-700">ไม่พบจุดข้อมูลขาดหายที่สำคัญในชุดข้อมูลนี้</span>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200">
              <strong className="font-bold text-slate-900 block mb-1">คำเตือนกลุ่มตัวอย่างขนาดเล็ก (Small Sample Warnings):</strong>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600">
                {report.dataLimitations.smallSampleWarnings.map((ss, idx) => (
                  <li key={idx}>{ss}</li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-400 flex items-center justify-between">
              <span>ขอบเขตข้อมูล: {report.dataLimitations.analyticalBoundary}</span>
              <span>เวอร์ชันแพตช์: {report.dataLimitations.patchNotesLimitation}</span>
            </div>
          </div>
        </div>
      </div>

      {/* PIN Unlock Modal for Coach Access Gate */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-sm bg-white border-2 border-[#F3D5E2] rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <Lock size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900">
                  ยืนยันสิทธิ์ผู้ฝึกสอน (Coach Access)
                </h3>
                <p className="text-xs text-slate-500">กรุณากรอกรหัส PIN สำหรับทีมงาน MCU</p>
              </div>
            </div>

            <form onSubmit={handleUnlockPin} className="space-y-3">
              <div>
                <input
                  type="password"
                  placeholder="กรอก PIN (ค่าเริ่มต้น: 2026)"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-center text-base tracking-widest font-['Orbitron'] focus:outline-none focus:border-[#E91E63]"
                  autoFocus
                />
                {pinError && <p className="text-xs text-rose-600 mt-1 font-semibold">{pinError}</p>}
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#E91E63] to-[#D81B60] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  ปลดล็อกสิทธิ์
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Saved Reports Drawer / Modal */}
      {isSavedDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-white border-2 border-[#F3D5E2] rounded-2xl shadow-2xl p-5 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#FFF0F5] text-[#E91E63] flex items-center justify-center">
                  <FolderOpen size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    ประวัติบันทึก Snapshot รายงานเตรียมแข่ง
                  </h3>
                  <p className="text-xs text-slate-500">
                    มีรายงานที่บันทึกไว้ทั้งหมด {savedReports.length} รายการ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSavedDrawerOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {savedReports.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <FileText size={36} className="mx-auto text-slate-300" />
                <p className="text-sm font-semibold">ยังไม่มี Snapshot ที่บันทึกไว้</p>
                <p className="text-xs">คลิกปุ่ม "บันทึก Snapshot" ด้านบนเพื่อจัดเก็บรายงานเตรียมแข่ง</p>
              </div>
            ) : (
              <div className="overflow-y-auto space-y-2 flex-1 pr-1">
                {savedReports.map((saved) => (
                  <div
                    key={saved.id}
                    onClick={() => {
                      setViewingSavedReport(saved);
                      setIsSavedDrawerOpen(false);
                      setCopyToast(`📁 โหลด Snapshot: ${saved.opponentTeam} เรียบร้อยแล้ว`);
                      setTimeout(() => setCopyToast(null), 3500);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      viewingSavedReport?.id === saved.id
                        ? 'bg-[#FFF5F8] border-[#E91E63] shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-[#F48FB1]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">
                          {saved.opponentTeam}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-pink-100 text-[#E91E63] font-['Orbitron']">
                          Game {saved.selectedGameNumber} ({saved.selectedSide.toUpperCase()})
                        </span>
                        <span
                          className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded-full ${
                            saved.dataCompleteness.completenessTier === 'high'
                              ? 'bg-emerald-100 text-emerald-800'
                              : saved.dataCompleteness.completenessTier === 'moderate'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          ความสมบูรณ์ {saved.dataCompleteness.completenessScore}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                        <span>วันที่แข่ง: {saved.matchDate}</span>
                        <span>•</span>
                        <span>บันทึกเมื่อ: {new Date(saved.generatedAt).toLocaleString('th-TH')}</span>
                        {saved.selectedPlanTitle && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[160px] text-slate-600 font-medium">
                              {saved.selectedPlanTitle}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingSavedReport(saved);
                          setIsSavedDrawerOpen(false);
                          setTimeout(() => window.print(), 300);
                        }}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                        title="พิมพ์ Snapshot นี้"
                      >
                        <Printer size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSavedReport(saved.id, e)}
                        className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                        title="ลบ Snapshot นี้"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 flex-shrink-0">
              <span>จัดเก็บได้สูงสุด 25 รายการล่าสุดใน Local Storage</span>
              <button
                type="button"
                onClick={() => setIsSavedDrawerOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
