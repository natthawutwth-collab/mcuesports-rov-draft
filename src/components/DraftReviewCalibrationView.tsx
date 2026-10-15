import React, { useState, useMemo, useCallback } from 'react';
import {
  DraftReviewRecord,
  ScoringWeights,
  CalibrationSnapshot,
  BacktestReport,
  DivergenceReasonCategory,
  TurnRecommendationSnapshot,
} from '../types/calibration';
import {
  calibrationService,
  DIVERGENCE_REASON_LABELS,
} from '../services/calibrationService';
import { DEFAULT_PRODUCTION_SCORING_WEIGHTS } from '../data/seedDraftReviews';
import { HEROES, getHeroImageUrl } from '../data/heroes';
import {
  BarChart3,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  History,
  RotateCcw,
  Sparkles,
  TrendingUp,
  FileSpreadsheet,
  Layers,
  Shield,
  Zap,
  Info,
  ChevronRight,
  ExternalLink,
  Plus,
  Play,
  ArrowRight,
  Target,
  RefreshCw,
  Award,
  AlertOctagon,
  Scale,
  Swords,
  BookOpen,
} from 'lucide-react';

interface DraftReviewCalibrationViewProps {
  onSelectView?: (view: any) => void;
  onOpenLiveDraft?: () => void;
}

export type CalibrationTab = 'overview' | 'breakdowns' | 'flagged' | 'offline_sandbox' | 'reviews_log';

export const DraftReviewCalibrationView: React.FC<DraftReviewCalibrationViewProps> = ({
  onSelectView,
  onOpenLiveDraft,
}) => {
  const [activeTab, setActiveTab] = useState<CalibrationTab>('overview');
  const [reviews, setReviews] = useState<DraftReviewRecord[]>(() => calibrationService.getAllReviews());
  const [activeProductionWeights, setActiveProductionWeights] = useState<ScoringWeights>(() =>
    calibrationService.getActiveWeights()
  );
  const [rollbackSnapshots, setRollbackSnapshots] = useState<CalibrationSnapshot[]>(() =>
    calibrationService.getRollbackSnapshots()
  );

  // Offline Sandbox Candidate Weights
  const [candidateWeights, setCandidateWeights] = useState<ScoringWeights>(() => ({
    ...activeProductionWeights,
  }));
  const [backtestReport, setBacktestReport] = useState<BacktestReport | null>(null);
  const [isBacktesting, setIsBacktesting] = useState<boolean>(false);
  const [deploySuccessMsg, setDeploySuccessMsg] = useState<string | null>(null);

  // Deploy Confirmation Modal State
  const [isDeployModalOpen, setIsDeployModalOpen] = useState<boolean>(false);
  const [deployNote, setDeployNote] = useState<string>('');

  // Selected Review for Detail Inspector
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(() => reviews[0]?.id || null);

  // Refresh analysis report
  const report = useMemo(() => {
    return calibrationService.generateCalibrationReport();
  }, [reviews]);

  const selectedReview = useMemo(() => {
    return reviews.find((r) => r.id === selectedReviewId) || reviews[0] || null;
  }, [reviews, selectedReviewId]);

  // Handler to run offline backtest
  const handleRunBacktest = useCallback(() => {
    setIsBacktesting(true);
    setTimeout(() => {
      const res = calibrationService.runOfflineBacktest(candidateWeights, activeProductionWeights);
      setBacktestReport(res);
      setIsBacktesting(false);
    }, 250);
  }, [candidateWeights, activeProductionWeights]);

  // Preset weight configurations
  const applyPreset = (presetType: 'default' | 'player_pool' | 'counter_pick' | 'meta_priority') => {
    let target: ScoringWeights;
    if (presetType === 'default') {
      target = { ...DEFAULT_PRODUCTION_SCORING_WEIGHTS };
    } else if (presetType === 'player_pool') {
      target = {
        missingRoleWeight: 28,
        playerSignatureWeight: 30,
        playerComfortableWeight: 18,
        matchupAdvantageWeight: 12,
        matchupDisadvantagePenalty: 14,
        synergyWeight: 10,
        tournamentMetaWeight: 8,
        sideBiasWeight: 5,
      };
    } else if (presetType === 'counter_pick') {
      target = {
        missingRoleWeight: 26,
        playerSignatureWeight: 18,
        playerComfortableWeight: 10,
        matchupAdvantageWeight: 22,
        matchupDisadvantagePenalty: 24,
        synergyWeight: 12,
        tournamentMetaWeight: 10,
        sideBiasWeight: 6,
      };
    } else {
      // meta_priority
      target = {
        missingRoleWeight: 28,
        playerSignatureWeight: 16,
        playerComfortableWeight: 8,
        matchupAdvantageWeight: 14,
        matchupDisadvantagePenalty: 16,
        synergyWeight: 12,
        tournamentMetaWeight: 18,
        sideBiasWeight: 8,
      };
    }
    setCandidateWeights(target);
    setBacktestReport(null);
  };

  // Deploy candidate weights into production with rollback snapshot
  const handleConfirmDeploy = () => {
    const res = calibrationService.deployProductionWeights({
      candidateWeights,
      description: deployNote || 'ปรับจูนน้ำหนักสูตรคะแนนผ่าน Offline Calibration Sandbox',
      appliedBy: 'Head Coach MCU',
      backtestReport: backtestReport || undefined,
    });

    if (res.success) {
      setActiveProductionWeights(calibrationService.getActiveWeights());
      setRollbackSnapshots(calibrationService.getRollbackSnapshots());
      setIsDeployModalOpen(false);
      setDeployNote('');
      setDeploySuccessMsg('✅ บันทึกและปรับใช้น้ำหนักสูตรคะแนนสู่ Production เรียบร้อยแล้ว (สร้าง Snapshot สำหรับ Rollback อัตโนมัติ)');
      setTimeout(() => setDeploySuccessMsg(null), 5000);
    }
  };

  // Rollback to previous snapshot
  const handleRollback = (snapId: string) => {
    const ok = calibrationService.rollbackToSnapshot(snapId);
    if (ok) {
      setActiveProductionWeights(calibrationService.getActiveWeights());
      setRollbackSnapshots(calibrationService.getRollbackSnapshots());
      setCandidateWeights(calibrationService.getActiveWeights());
      setBacktestReport(null);
      setDeploySuccessMsg('⏪ ย้อนกลับสูตรคะแนนสู่เวอร์ชันก่อนหน้าสำเร็จ (Rollback Completed)');
      setTimeout(() => setDeploySuccessMsg(null), 5000);
    }
  };

  // Reset production weights to default
  const handleResetToDefault = () => {
    calibrationService.resetWeightsToDefault();
    setActiveProductionWeights(DEFAULT_PRODUCTION_SCORING_WEIGHTS);
    setCandidateWeights(DEFAULT_PRODUCTION_SCORING_WEIGHTS);
    setBacktestReport(null);
    setDeploySuccessMsg('🔄 รีเซ็ตน้ำหนักสูตรคะแนนกลับสู่ค่าเริ่มต้นอย่างเป็นทางการ (Official Defaults)');
    setTimeout(() => setDeploySuccessMsg(null), 5000);
  };

  return (
    <div className="w-full flex flex-col gap-4 font-['Prompt'] text-slate-800 animate-fadeIn select-none">
      {/* 1. Header & Navigation Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-white via-[#FFF5F8] to-[#FCE4EC]/50 border border-[#F3D5E2] p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#E91E63] via-[#D81B60] to-[#C2185B] text-white flex items-center justify-center shadow-md shadow-[#E91E63]/25 ring-4 ring-[#FCE4EC] flex-shrink-0">
              <Scale size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-['Prompt'] font-bold text-lg sm:text-xl text-slate-900 leading-snug">
                  Phase 6: Draft Review & Calibration
                </h1>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#E91E63] text-white uppercase tracking-wider">
                  Engine Calibration
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                  Decoupled from Match W/L
                </span>
              </div>
              <p className="text-xs sm:text-[13px] text-slate-500 mt-1 max-w-3xl leading-relaxed">
                ประเมินคุณภาพคำแนะนำของระบบจากการดราฟต์จริง • วิเคราะห์ความสอดคล้องและการตัดสินใจของโค้ช (Hit Rate & Divergence) • ทดลองปรับสูตร Offline ก่อนปรับใช้ใน Production
              </p>
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-white border border-[#F3D5E2] shadow-2xs flex items-center gap-2 text-xs">
              <span className="text-slate-400 text-[11px]">บันทึกแล้ว:</span>
              <span className="font-bold text-[#E91E63] font-['Orbitron']">{reviews.length} ดราฟต์</span>
              <span className="text-slate-300">|</span>
              <span className="font-bold text-slate-700 font-['Orbitron']">{report.hitRateMetrics.totalEvaluated} เทิร์น</span>
            </div>
          </div>
        </div>

        {/* Success toast inside view */}
        {deploySuccessMsg && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
            <span>{deploySuccessMsg}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mt-4 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-t border-[#F8BBD0]/60 pt-3">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              activeTab === 'overview'
                ? 'bg-[#E91E63] text-white border-[#E91E63] shadow-xs'
                : 'bg-white text-slate-600 hover:bg-[#FFF0F5] border-[#F3D5E2]'
            }`}
          >
            <BarChart3 size={14} />
            <span>ภาพรวมและตัวชี้วัด (Overview)</span>
          </button>

          <button
            onClick={() => setActiveTab('breakdowns')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              activeTab === 'breakdowns'
                ? 'bg-[#E91E63] text-white border-[#E91E63] shadow-xs'
                : 'bg-white text-slate-600 hover:bg-[#FFF0F5] border-[#F3D5E2]'
            }`}
          >
            <Layers size={14} />
            <span>วิเคราะห์แยกมิติ (Side / Stage / Role)</span>
          </button>

          <button
            onClick={() => setActiveTab('flagged')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              activeTab === 'flagged'
                ? 'bg-[#E91E63] text-white border-[#E91E63] shadow-xs'
                : 'bg-white text-slate-600 hover:bg-[#FFF0F5] border-[#F3D5E2]'
            }`}
          >
            <AlertTriangle size={14} />
            <span>เคสผิดพลาดและจุดบกพร่อง ({report.flaggedCases.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('offline_sandbox')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              activeTab === 'offline_sandbox'
                ? 'bg-[#E91E63] text-white border-[#E91E63] shadow-xs'
                : 'bg-white text-slate-600 hover:bg-[#FFF0F5] border-[#F3D5E2]'
            }`}
          >
            <Sliders size={14} />
            <span>ห้องทดลองปรับสูตร Offline (A/B Calibration)</span>
          </button>

          <button
            onClick={() => setActiveTab('reviews_log')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              activeTab === 'reviews_log'
                ? 'bg-[#E91E63] text-white border-[#E91E63] shadow-xs'
                : 'bg-white text-slate-600 hover:bg-[#FFF0F5] border-[#F3D5E2]'
            }`}
          >
            <BookOpen size={14} />
            <span>บันทึกรีวิวดราฟต์ ({reviews.length})</span>
          </button>
        </div>
      </div>

      {/* 2. TAB 1: OVERVIEW & HIT RATE METRICS */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-4">
          {/* Data Readiness & Sufficiency Banner */}
          <div
            className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-2xs ${
              report.dataReadiness.sufficiencyTier === 'robust'
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : report.dataReadiness.sufficiencyTier === 'emerging'
                ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                : 'bg-rose-50/80 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  report.dataReadiness.sufficiencyTier === 'robust'
                    ? 'bg-emerald-200/80 text-emerald-800'
                    : report.dataReadiness.sufficiencyTier === 'emerging'
                    ? 'bg-amber-200/80 text-amber-800'
                    : 'bg-rose-200/80 text-rose-800'
                }`}
              >
                {report.dataReadiness.sufficiencyTier === 'robust' ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <AlertOctagon size={18} />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs uppercase tracking-wider">
                    {report.dataReadiness.sufficiencyTier === 'robust'
                      ? 'ความพร้อมของข้อมูล: พร้อมทางสถิติ (Robust Dataset)'
                      : report.dataReadiness.sufficiencyTier === 'emerging'
                      ? 'ความพร้อมของข้อมูล: ระดับเริ่มต้น (Emerging Dataset)'
                      : 'ความพร้อมของข้อมูล: ตัวอย่างยังไม่เพียงพอ (Insufficient Dataset)'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-white/70 border border-current">
                    {report.dataReadiness.totalDrafts} / {report.dataReadiness.minRecommendedDrafts} ดราฟต์
                  </span>
                </div>
                <p className="text-xs mt-1 font-medium leading-relaxed opacity-90">
                  {report.dataReadiness.sufficiencyMessage}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                calibrationService.resetToDefaultReviews();
                setReviews(calibrationService.getAllReviews());
              }}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>โหลดรีวิวตัวอย่าง RPL Scrims</span>
            </button>
          </div>

          {/* Key Metric Cards: Agreement Rates & Coach Utility */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Top-1 Hit Rate */}
            <div className="p-4 rounded-2xl bg-white border border-[#F3D5E2] shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Top 1 Agreement</span>
                <span className="w-6 h-6 rounded-lg bg-pink-50 text-[#E91E63] flex items-center justify-center text-xs font-black">
                  #1
                </span>
              </div>
              <div className="mt-2">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 font-['Orbitron']">
                  {report.hitRateMetrics.top1Rate}%
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  ตรงอันดับ 1: <strong className="text-slate-800">{report.hitRateMetrics.top1Count}</strong> / {report.hitRateMetrics.totalEvaluated} เทิร์น
                </div>
              </div>
            </div>

            {/* Top-3 Hit Rate */}
            <div className="p-4 rounded-2xl bg-white border border-[#F3D5E2] shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Top 3 Agreement</span>
                <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-black">
                  #3
                </span>
              </div>
              <div className="mt-2">
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-['Orbitron']">
                  {report.hitRateMetrics.top3Rate}%
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  ติด Top 3: <strong className="text-slate-800">{report.hitRateMetrics.top3Count}</strong> / {report.hitRateMetrics.totalEvaluated} เทิร์น
                </div>
              </div>
            </div>

            {/* Top-5 Hit Rate */}
            <div className="p-4 rounded-2xl bg-white border border-[#F3D5E2] shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Top 5 Coverage</span>
                <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-black">
                  #5
                </span>
              </div>
              <div className="mt-2">
                <div className="text-2xl sm:text-3xl font-black text-blue-600 font-['Orbitron']">
                  {report.hitRateMetrics.top5Rate}%
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  ติด Top 5: <strong className="text-slate-800">{report.hitRateMetrics.top5Count}</strong> / {report.hitRateMetrics.totalEvaluated} เทิร์น
                </div>
              </div>
            </div>

            {/* Coach Utility Satisfaction */}
            <div className="p-4 rounded-2xl bg-white border border-[#F3D5E2] shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Coach Utility</span>
                <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center text-xs font-black">
                  ★
                </span>
              </div>
              <div className="mt-2">
                <div className="text-2xl sm:text-3xl font-black text-amber-600 font-['Orbitron'] flex items-baseline gap-1">
                  <span>{report.coachUtilitySummary.avgRating}</span>
                  <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  ความพึงพอใจของโค้ชต่อคำแนะนำ
                </div>
              </div>
            </div>

            {/* Decoupled Team Match Outcome */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/70 to-indigo-50/40 border border-purple-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-900 uppercase">Scrim Match Result</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-200/80 text-purple-800 font-bold">
                  Decoupled
                </span>
              </div>
              <div className="mt-2">
                <div className="text-2xl sm:text-3xl font-black text-purple-700 font-['Orbitron']">
                  {report.decoupledMatchOutcome.winRate}%
                </div>
                <div className="text-[11px] text-purple-800/80 mt-0.5">
                  ชนะ {report.decoupledMatchOutcome.winCount} • แพ้ {report.decoupledMatchOutcome.lossCount} เกม
                </div>
              </div>
            </div>
          </div>

          {/* Scientific Separation Notice */}
          <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200/80 text-purple-950 text-xs flex items-start gap-2.5 shadow-2xs">
            <Info size={16} className="text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-bold text-purple-900">หลักเกณฑ์การประเมินแยกขาด (Decoupling Principle):</strong>{' '}
              {report.decoupledMatchOutcome.disclaimer}
            </div>
          </div>

          {/* Divergence Analysis: Why Coaches Diverge from System #1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left 2 cols: Divergence Breakdown by Reason */}
            <div className="lg:col-span-2 p-4 sm:p-5 rounded-2xl bg-white border border-[#F3D5E2] shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                    <Target size={16} className="text-[#E91E63]" />
                    <span>วิเคราะห์เหตุผลที่โค้ชเลือกต่างจากคำแนะนำอันดับ 1 (Divergence Analysis)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    มีเหตุการณ์ที่โค้ชเลือกต่างจากอันดับ 1 ทั้งสิ้น <strong>{report.divergenceSummary.totalDiverged}</strong> ครั้ง (อัตรา Divergence {report.divergenceSummary.divergenceRate}%)
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">อันดับเฉลี่ยเมื่อต่าง</span>
                  <span className="font-black text-sm text-[#E91E63] font-['Orbitron']">
                    Rank #{report.divergenceSummary.avgRankWhenDiverged}
                  </span>
                </div>
              </div>

              {/* Progress bars for each reason */}
              <div className="space-y-3">
                {report.divergenceSummary.byReason.map((item) => (
                  <div key={item.reason} className="p-3 rounded-xl bg-[#FFF9FB] border border-[#F8BBD0]/50">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#E91E63]" />
                        <span>{item.label}</span>
                      </span>
                      <span className="font-bold text-[#E91E63] font-['Orbitron']">
                        {item.count} ครั้ง ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#E91E63] to-[#D81B60] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, item.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 1 col: Coach Feedback & Tags */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#F3D5E2] shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2 mb-1">
                  <Award size={16} className="text-amber-500" />
                  <span>การตอบรับและแท็กจากโค้ช</span>
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  สรุปมุมมองเชิงคุณภาพหลังการดราฟต์และแมตช์จริง
                </p>

                <div className="space-y-2 mb-4">
                  <div className="text-xs text-slate-600 font-semibold">แท็กที่โค้ชบันทึกบ่อย:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {report.coachUtilitySummary.commonTags.map((item) => (
                      <span
                        key={item.tag}
                        className="px-2.5 py-1 rounded-lg bg-pink-50 border border-pink-200 text-[#E91E63] text-xs font-semibold flex items-center gap-1.5"
                      >
                        <span>{item.tag}</span>
                        <span className="w-4 h-4 rounded-full bg-pink-200/80 text-[10px] flex items-center justify-center font-bold">
                          {item.count}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Rating Distribution */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="text-xs text-slate-600 font-semibold mb-1">การกระจายคะแนนดาว (1-5):</div>
                  {[5, 4, 3, 2, 1].map((star) => {
                    const cnt = report.coachUtilitySummary.distribution[star] || 0;
                    const pct = reviews.length > 0 ? (cnt / reviews.length) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2 text-[11px] text-slate-600">
                        <span className="w-12 font-bold flex items-center gap-0.5">
                          <span>{star}</span>
                          <span className="text-amber-500">★</span>
                        </span>
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-right font-medium text-slate-500">{cnt} เกม</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                อิงจากการบันทึกรีวิวดราฟต์หลังแข่งของโค้ช MCU
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB 2: BREAKDOWNS BY SIDE, STAGE, ROLE */}
      {activeTab === 'breakdowns' && (
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-2xl bg-white border border-[#F3D5E2] shadow-2xs">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-1 flex items-center gap-2">
              <Layers size={16} className="text-[#E91E63]" />
              <span>การวิเคราะห์ผลแยกตามมิติสถานการณ์ (Dimensional Breakdown)</span>
            </h3>
            <p className="text-xs text-slate-500">
              ช่วยตรวจสอบว่าคำแนะนำของระบบแม่นยำหรือมีช่องโหว่ในฝั่งใด ช่วงเฟสใด และตำแหน่งใดเป็นพิเศษ
            </p>
          </div>

          {/* Dimension 1: By Side (Blue vs Red) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#F3D5E2] shadow-2xs">
            <h4 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
              <Shield size={15} className="text-blue-500" />
              <span>1. จำแนกตามฝั่ง (Side Breakdown: Blue Side vs Red Side)</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Blue Side */}
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-blue-900 text-xs sm:text-sm flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <span>Blue Side (ฝั่งสีน้ำเงิน / First Pick)</span>
                  </span>
                  <span className="text-xs font-bold text-blue-700 font-['Orbitron']">
                    {report.breakdowns.bySide.blue.total} เทิร์น
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  <div className="p-2 rounded-lg bg-white border border-blue-100">
                    <span className="text-[10px] text-slate-500 block">Top 1 Hit Rate</span>
                    <span className="font-black text-sm text-blue-700 font-['Orbitron']">
                      {report.breakdowns.bySide.blue.top1Rate}%
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-blue-100">
                    <span className="text-[10px] text-slate-500 block">Top 3 Hit Rate</span>
                    <span className="font-black text-sm text-emerald-600 font-['Orbitron']">
                      {report.breakdowns.bySide.blue.top3Rate}%
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-blue-100">
                    <span className="text-[10px] text-slate-500 block">Divergence</span>
                    <span className="font-black text-sm text-amber-600 font-['Orbitron']">
                      {report.breakdowns.bySide.blue.divergenceRate}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Red Side */}
              <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-rose-900 text-xs sm:text-sm flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                    <span>Red Side (ฝั่งสีแดง / Second Pick & Last Pick)</span>
                  </span>
                  <span className="text-xs font-bold text-rose-700 font-['Orbitron']">
                    {report.breakdowns.bySide.red.total} เทิร์น
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  <div className="p-2 rounded-lg bg-white border border-rose-100">
                    <span className="text-[10px] text-slate-500 block">Top 1 Hit Rate</span>
                    <span className="font-black text-sm text-rose-700 font-['Orbitron']">
                      {report.breakdowns.bySide.red.top1Rate}%
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-rose-100">
                    <span className="text-[10px] text-slate-500 block">Top 3 Hit Rate</span>
                    <span className="font-black text-sm text-emerald-600 font-['Orbitron']">
                      {report.breakdowns.bySide.red.top3Rate}%
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-rose-100">
                    <span className="text-[10px] text-slate-500 block">Divergence</span>
                    <span className="font-black text-sm text-amber-600 font-['Orbitron']">
                      {report.breakdowns.bySide.red.divergenceRate}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dimension 2: By Draft Stage */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#F3D5E2] shadow-2xs">
            <h4 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
              <Zap size={15} className="text-amber-500" />
              <span>2. จำแนกตามช่วงการดราฟต์ (Draft Stage Breakdown)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { key: 'phase1_ban', label: 'Phase 1 Ban', desc: 'แบนรอบแรก (ตัวเมต้า)', data: report.breakdowns.byStage.phase1_ban },
                { key: 'phase1_pick', label: 'Phase 1 Pick', desc: 'พิกรอบแรก (แกนทีม)', data: report.breakdowns.byStage.phase1_pick },
                { key: 'phase2_ban', label: 'Phase 2 Ban', desc: 'แบนรอบสอง (ตัดตัวแก้)', data: report.breakdowns.byStage.phase2_ban },
                { key: 'phase2_pick', label: 'Phase 2 Pick', desc: 'พิกรอบสอง (เติมตำแหน่ง)', data: report.breakdowns.byStage.phase2_pick },
              ].map((stage) => (
                <div key={stage.key} className="p-3.5 rounded-xl bg-[#FFF9FB] border border-[#F8BBD0]/50 flex flex-col justify-between">
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">{stage.label}</span>
                    <span className="text-[10px] text-slate-500 block">{stage.desc}</span>
                  </div>
                  <div className="mt-3 pt-2 border-t border-pink-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">Top 1:</span>
                    <span className="font-black text-[#E91E63] font-['Orbitron']">
                      {stage.data.top1Rate}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-slate-500 text-[11px]">Top 3:</span>
                    <span className="font-bold text-emerald-600 font-['Orbitron']">
                      {stage.data.top3Rate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dimension 3: By Role */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#F3D5E2] shadow-2xs">
            <h4 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
              <Award size={15} className="text-purple-500" />
              <span>3. จำแนกตามบทบาทตำแหน่ง (Role Breakdown: DSL, JG, MID, SP, ADL)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { role: 'DSL', label: 'Dark Slayer (DSL)', color: 'text-purple-600', data: report.breakdowns.byRole.DSL },
                { role: 'Jungle', label: 'Jungle (ป่า)', color: 'text-blue-600', data: report.breakdowns.byRole.Jungle },
                { role: 'Mid', label: 'Mid Lane (กลาง)', color: 'text-pink-600', data: report.breakdowns.byRole.Mid },
                { role: 'Support', label: 'Support / Roam', color: 'text-amber-600', data: report.breakdowns.byRole.Support },
                { role: 'ADL', label: 'Abyssal Dragon (แครี่)', color: 'text-emerald-600', data: report.breakdowns.byRole.ADL },
              ].map((r) => (
                <div key={r.role} className="p-3.5 rounded-xl bg-white border border-[#F3D5E2] flex flex-col justify-between shadow-2xs">
                  <div>
                    <span className={`font-bold text-xs ${r.color} block`}>{r.label}</span>
                    <span className="text-[10px] text-slate-400 block">{r.data.total} เทิร์นวิเคราะห์</span>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">Top 1 Hit:</span>
                    <span className="font-black text-slate-800 font-['Orbitron']">
                      {r.data.top1Rate}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-slate-500 text-[11px]">Top 3 Hit:</span>
                    <span className="font-bold text-emerald-600 font-['Orbitron']">
                      {r.data.top3Rate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 3: FLAGGED CASES & DATA GAPS */}
      {activeTab === 'flagged' && (
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-2xl bg-white border border-[#F3D5E2] shadow-2xs">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-1 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              <span>เคสที่คำแนะนำผิดพลาดหรือข้อมูลไม่เพียงพอ (Flagged Cases & Data Gaps)</span>
            </h3>
            <p className="text-xs text-slate-500">
              ระบบตรวจสอบจุดบกพร่อง เช่น จำนวนสถิติตัวอย่างน้อยในโปรลีก (&lt; 5 เกม), โค้ชประเมินความพึงพอใจต่ำ (&lt;= 2 ดาว), หรือโค้ชเลือกตัวนอก Top 5
            </p>
          </div>

          <div className="space-y-3">
            {report.flaggedCases.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-slate-500 text-xs">
                ไม่พบเคสคำแนะนำผิดพลาดหรือมีข้อมูลไม่เพียงพอในบันทึกรีวิวขณะนี้
              </div>
            ) : (
              report.flaggedCases.map((fc, idx) => (
                <div
                  key={`${fc.turnId}_${idx}`}
                  className="p-4 rounded-2xl bg-white border border-[#F3D5E2] shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        fc.issueType === 'low_sample'
                          ? 'bg-amber-100 text-amber-800'
                          : fc.issueType === 'low_coach_rating'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {fc.issueType === 'low_sample' ? (
                        <AlertTriangle size={18} />
                      ) : (
                        <AlertOctagon size={18} />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-900">{fc.draftTitle}</span>
                        {fc.turnNumber > 0 && (
                          <span className="text-[10px] px-2 py-0.2 rounded-md bg-slate-100 text-slate-700 font-bold">
                            Turn #{fc.turnNumber}
                          </span>
                        )}
                        <span
                          className={`text-[10px] px-2 py-0.2 rounded-md font-bold uppercase ${
                            fc.issueType === 'low_sample'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : fc.issueType === 'low_coach_rating'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}
                        >
                          {fc.issueType === 'low_sample'
                            ? 'สถิติตัวอย่างน้อย'
                            : fc.issueType === 'low_coach_rating'
                            ? 'โค้ชประเมินว่าผิดพลาด'
                            : 'ตัวเลือกนอกลิสต์ Top 5'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 mt-1 font-medium">
                        {fc.details}
                      </div>

                      {fc.heroChosen && fc.recommendedHero && (
                        <div className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-2">
                          <span>ระบบแนะนำ: <strong className="text-slate-800">{fc.recommendedHero}</strong></span>
                          <span>•</span>
                          <span>โค้ชเลือกจริง: <strong className="text-[#E91E63]">{fc.heroChosen}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-[10px] text-slate-400 block">แนวทางแก้ไข</span>
                    <span className="text-xs font-semibold text-emerald-700">
                      {fc.issueType === 'low_sample'
                        ? 'เพิ่มข้อมูลการซ้อม H2H'
                        : fc.issueType === 'low_coach_rating'
                        ? 'ปรับสูตร Offline Sandbox'
                        : 'เพิ่มลงใน Comfort Pool'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 5. TAB 4: OFFLINE FORMULA CALIBRATION & BACKTEST SANDBOX */}
      {activeTab === 'offline_sandbox' && (
        <div className="flex flex-col gap-4">
          {/* Strict Safety Protocol Banner */}
          <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 text-xs shadow-2xs flex items-start gap-3">
            <Shield size={20} className="text-amber-700 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="font-bold text-sm text-amber-900 block">
                กฎความปลอดภัย: ห้ามเปลี่ยน Weight ใน Production โดยอัตโนมัติ
              </strong>
              <p className="leading-relaxed">
                การปรับสูตรต้องผ่านการจำลองย้อนหลังแบบ <strong>Offline Backtest</strong> ก่อนเสมอ เพื่อดูว่าสูตรใหม่พัฒนา Hit Rate ของโค้ชจริงหรือไม่ และเมื่อกดยืนยันบันทึก ระบบจะสร้าง <strong>Snapshot สำรองข้อมูลย้อนกลับ (Rollback Plan)</strong> ทันที
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left 5 cols: Formula Tuning Sliders & Presets */}
            <div className="lg:col-span-5 p-4 sm:p-5 rounded-2xl bg-white border border-[#F3D5E2] shadow-2xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                      <Sliders size={16} className="text-[#E91E63]" />
                      <span>ปรับจูนน้ำหนักสูตรคะแนน (Weight Tuning)</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      กำหนดค่าน้ำหนักแต่ละปัจจัยเพื่อนำไปทดลองรัน Backtest
                    </p>
                  </div>
                  <button
                    onClick={handleResetToDefault}
                    className="text-[11px] text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={12} />
                    <span>คืนค่าเดิม</span>
                  </button>
                </div>

                {/* Preset Buttons */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <button
                    onClick={() => applyPreset('default')}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                  >
                    สูตรมาตรฐาน (Official)
                  </button>
                  <button
                    onClick={() => applyPreset('player_pool')}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 cursor-pointer"
                  >
                    เน้นตัวถนัดผู้เล่น (Player Pool First)
                  </button>
                  <button
                    onClick={() => applyPreset('counter_pick')}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 cursor-pointer"
                  >
                    เน้นแก้ทางคู่แข่ง (Counter Pick)
                  </button>
                  <button
                    onClick={() => applyPreset('meta_priority')}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 cursor-pointer"
                  >
                    เน้นเมต้าโปรลีก (RPL Meta)
                  </button>
                </div>

                {/* Sliders */}
                <div className="space-y-3.5 text-xs">
                  {/* Missing Role Weight */}
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span className="text-slate-700">1. เติมตำแหน่งที่ขาด (Missing Role Fit)</span>
                      <span className="font-bold text-[#E91E63] font-['Orbitron']">
                        {candidateWeights.missingRoleWeight}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="50"
                      value={candidateWeights.missingRoleWeight}
                      onChange={(e) =>
                        setCandidateWeights((prev) => ({
                          ...prev,
                          missingRoleWeight: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-[#E91E63]"
                    />
                  </div>

                  {/* Player Signature Weight */}
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span className="text-slate-700">2. ฮีโร่ Signature ประจำตัว</span>
                      <span className="font-bold text-[#E91E63] font-['Orbitron']">
                        {candidateWeights.playerSignatureWeight}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="35"
                      value={candidateWeights.playerSignatureWeight}
                      onChange={(e) =>
                        setCandidateWeights((prev) => ({
                          ...prev,
                          playerSignatureWeight: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-[#E91E63]"
                    />
                  </div>

                  {/* Matchup Advantage Weight */}
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span className="text-slate-700">3. สถิติชนะทาง (H2H Advantage)</span>
                      <span className="font-bold text-[#E91E63] font-['Orbitron']">
                        {candidateWeights.matchupAdvantageWeight}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="30"
                      value={candidateWeights.matchupAdvantageWeight}
                      onChange={(e) =>
                        setCandidateWeights((prev) => ({
                          ...prev,
                          matchupAdvantageWeight: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-[#E91E63]"
                    />
                  </div>

                  {/* Team Synergy Weight */}
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span className="text-slate-700">4. คอมโบเข้าขาเพื่อนร่วมทีม (Synergy)</span>
                      <span className="font-bold text-[#E91E63] font-['Orbitron']">
                        {candidateWeights.synergyWeight}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="25"
                      value={candidateWeights.synergyWeight}
                      onChange={(e) =>
                        setCandidateWeights((prev) => ({
                          ...prev,
                          synergyWeight: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-[#E91E63]"
                    />
                  </div>

                  {/* Tournament Meta WR Weight */}
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span className="text-slate-700">5. เมต้า Win Rate ใน RPL 2026</span>
                      <span className="font-bold text-[#E91E63] font-['Orbitron']">
                        {candidateWeights.tournamentMetaWeight}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="25"
                      value={candidateWeights.tournamentMetaWeight}
                      onChange={(e) =>
                        setCandidateWeights((prev) => ({
                          ...prev,
                          tournamentMetaWeight: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-[#E91E63]"
                    />
                  </div>

                  {/* Side Bias Weight */}
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span className="text-slate-700">6. สถิติความได้เปรียบฝั่ง Blue/Red</span>
                      <span className="font-bold text-[#E91E63] font-['Orbitron']">
                        {candidateWeights.sideBiasWeight}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="15"
                      value={candidateWeights.sideBiasWeight}
                      onChange={(e) =>
                        setCandidateWeights((prev) => ({
                          ...prev,
                          sideBiasWeight: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-[#E91E63]"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={handleRunBacktest}
                  disabled={isBacktesting}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#E91E63] to-[#D81B60] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-[#E91E63]/20 hover:opacity-95 transition-opacity cursor-pointer disabled:opacity-50"
                >
                  <Play size={14} />
                  <span>{isBacktesting ? 'กำลังจำลอง Backtest...' : 'รัน Offline Backtest ย้อนหลัง'}</span>
                </button>
              </div>
            </div>

            {/* Right 7 cols: Backtest Results & Production Deployment Card */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {/* Backtest Report Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#F3D5E2] shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                    <TrendingUp size={16} className="text-emerald-600" />
                    <span>ผลการทดสอบเปรียบเทียบ (Offline A/B Comparison)</span>
                  </h3>
                  {backtestReport && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      จำลอง {backtestReport.totalEvaluatedTurns} เทิร์น
                    </span>
                  )}
                </div>

                {!backtestReport ? (
                  <div className="p-8 rounded-xl bg-[#FFF9FB] border border-[#F8BBD0]/50 text-center flex flex-col items-center justify-center gap-2">
                    <Sliders size={28} className="text-slate-300" />
                    <p className="text-xs text-slate-600 font-semibold">
                      ปรับแถบเลื่อนค่าน้ำหนักด้านซ้าย แล้วกดปุ่ม &quot;รัน Offline Backtest ย้อนหลัง&quot;
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-sm">
                      ระบบจะคำนวณคะแนนใหม่ในทุกเทิร์นของดราฟต์ที่บันทึกไว้ เพื่อดูว่าสูตรใหม่ทำให้ฮีโร่ที่โค้ชเลือกจริงไต่อันดับสูงขึ้นหรือไม่
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 animate-fadeIn">
                    {/* Comparison Table */}
                    <div className="grid grid-cols-3 gap-2.5 text-center">
                      {/* Top 1 Delta */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Top 1 Agreement</span>
                        <div className="text-lg font-black font-['Orbitron'] text-slate-800 mt-0.5">
                          {backtestReport.baseline.top1Rate}% → {backtestReport.candidate.top1Rate}%
                        </div>
                        <span
                          className={`text-xs font-bold font-['Orbitron'] block mt-0.5 ${
                            backtestReport.delta.top1RateDelta > 0
                              ? 'text-emerald-600'
                              : backtestReport.delta.top1RateDelta < 0
                              ? 'text-rose-600'
                              : 'text-slate-400'
                          }`}
                        >
                          {backtestReport.delta.top1RateDelta > 0 ? '+' : ''}
                          {backtestReport.delta.top1RateDelta}%
                        </span>
                      </div>

                      {/* Top 3 Delta */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Top 3 Agreement</span>
                        <div className="text-lg font-black font-['Orbitron'] text-slate-800 mt-0.5">
                          {backtestReport.baseline.top3Rate}% → {backtestReport.candidate.top3Rate}%
                        </div>
                        <span
                          className={`text-xs font-bold font-['Orbitron'] block mt-0.5 ${
                            backtestReport.delta.top3RateDelta > 0
                              ? 'text-emerald-600'
                              : backtestReport.delta.top3RateDelta < 0
                              ? 'text-rose-600'
                              : 'text-slate-400'
                          }`}
                        >
                          {backtestReport.delta.top3RateDelta > 0 ? '+' : ''}
                          {backtestReport.delta.top3RateDelta}%
                        </span>
                      </div>

                      {/* Avg Rank Delta */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Average Rank</span>
                        <div className="text-lg font-black font-['Orbitron'] text-slate-800 mt-0.5">
                          #{backtestReport.baseline.avgRank} → #{backtestReport.candidate.avgRank}
                        </div>
                        <span
                          className={`text-xs font-bold font-['Orbitron'] block mt-0.5 ${
                            backtestReport.delta.avgRankDelta < 0
                              ? 'text-emerald-600'
                              : backtestReport.delta.avgRankDelta > 0
                              ? 'text-rose-600'
                              : 'text-slate-400'
                          }`}
                        >
                          {backtestReport.delta.avgRankDelta < 0
                            ? `ดีขึ้น ${Math.abs(backtestReport.delta.avgRankDelta)} อันดับ`
                            : backtestReport.delta.avgRankDelta > 0
                            ? `แย่ลง ${backtestReport.delta.avgRankDelta} อันดับ`
                            : 'คงที่'}
                        </span>
                      </div>
                    </div>

                    {/* Turn Samples Diff List */}
                    <div>
                      <span className="text-xs font-bold text-slate-700 block mb-2">
                        ตัวอย่างการเปลี่ยนแปลงอันดับคำแนะนำในแต่ละเทิร์น:
                      </span>
                      <div className="space-y-1.5 max-h-44 overflow-y-auto no-scrollbar">
                        {backtestReport.sampleTurns.map((st, sidx) => (
                          <div
                            key={sidx}
                            className="p-2 rounded-lg bg-[#FFF9FB] border border-[#F8BBD0]/40 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">T#{st.turnNumber}</span>
                              <span className="text-slate-600">
                                โค้ชเลือก: <strong>{st.chosenHero}</strong>
                              </span>
                            </div>
                            <div className="flex items-center gap-2 font-['Orbitron'] text-[11px]">
                              <span className="text-slate-400">
                                อันดับเดิม #{st.baselineRank || '>5'}
                              </span>
                              <ArrowRight size={12} className="text-slate-300" />
                              <span
                                className={`font-bold ${
                                  st.improved
                                    ? 'text-emerald-600'
                                    : st.regressed
                                    ? 'text-rose-600'
                                    : 'text-slate-700'
                                }`}
                              >
                                อันดับใหม่ #{st.candidateRank || '>5'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Button to Trigger Deploy Confirmation Modal */}
                    <div className="pt-3 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => setIsDeployModalOpen(true)}
                        className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                      >
                        <Shield size={14} />
                        <span>เสนอปรับใช้ใน Production (Deploy with Rollback)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Rollback Snapshots History Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#F3D5E2] shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <History size={15} className="text-[#E91E63]" />
                    <span>ประวัติเวอร์ชันและแผนย้อนกลับ (Rollback Snapshots)</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">
                    {rollbackSnapshots.length} เวอร์ชันสำรอง
                  </span>
                </div>

                {rollbackSnapshots.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-500">
                    ยังไม่มีประวัติการปรับใช้สูตรใน Production (กำลังใช้สูตร Official เริ่มต้น)
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                    {rollbackSnapshots.map((snap) => (
                      <div
                        key={snap.id}
                        className="p-3 rounded-xl bg-[#FFF9FB] border border-[#F8BBD0]/50 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{snap.description}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(snap.appliedAt).toLocaleDateString('th-TH', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            โดย: {snap.appliedBy} • Top1 Δ: {snap.backtestDelta.top1Delta > 0 ? '+' : ''}
                            {snap.backtestDelta.top1Delta}%
                          </div>
                        </div>

                        <button
                          onClick={() => handleRollback(snap.id)}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer flex-shrink-0 shadow-2xs"
                        >
                          <RotateCcw size={12} />
                          <span>Rollback สู่เวอร์ชันนี้</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 5: DRAFT REVIEWS LOG & INSPECTOR */}
      {activeTab === 'reviews_log' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left 4 cols: List of Reviews */}
          <div className="lg:col-span-4 p-4 rounded-2xl bg-white border border-[#F3D5E2] shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <BookOpen size={15} className="text-[#E91E63]" />
                <span>รายการรีวิวดราฟต์</span>
              </h3>
              <span className="text-xs text-slate-400 font-bold font-['Orbitron']">
                {reviews.length} แมตช์
              </span>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto no-scrollbar">
              {reviews.map((rev) => (
                <button
                  key={rev.id}
                  onClick={() => setSelectedReviewId(rev.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedReviewId === rev.id
                      ? 'bg-[#FCE4EC] border-[#E91E63] shadow-xs'
                      : 'bg-[#FFF9FB] hover:bg-white border-[#F8BBD0]/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-900 truncate">{rev.title}</span>
                    <span className="text-amber-500 font-bold font-['Orbitron'] flex items-center gap-0.5">
                      {rev.coachUtilityRating}★
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">{rev.match}</div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                    <span>{rev.date}</span>
                    <span
                      className={`font-bold ${
                        rev.winner === rev.mcuSide ? 'text-emerald-600' : 'text-slate-500'
                      }`}
                    >
                      {rev.winner === rev.mcuSide ? 'MCU ชนะ' : 'MCU แพ้'} ({rev.matchDuration || '15m'})
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right 8 cols: Selected Review Turn-by-Turn Replay */}
          <div className="lg:col-span-8 p-4 sm:p-5 rounded-2xl bg-white border border-[#F3D5E2] shadow-2xs space-y-4">
            {selectedReview ? (
              <>
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{selectedReview.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedReview.tournament} • {selectedReview.match} (Game {selectedReview.gameNumber})
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-amber-500 font-bold text-sm flex items-center justify-end gap-1">
                      <span>{selectedReview.coachUtilityRating} ดาว</span>
                      <span className="text-xs font-normal text-slate-500">
                        ({selectedReview.coachUtilityVerdict})
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      ระยะเวลาเกม {selectedReview.matchDuration || '—'}
                    </span>
                  </div>
                </div>

                {/* Post-game notes */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                  <strong className="font-bold text-slate-900 block mb-1">บันทึกวิจารณ์ของโค้ชหลังเกม:</strong>
                  {selectedReview.postGameNotes}
                </div>

                {/* Turn-by-turn inspector table */}
                <div>
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-2">
                    Turn-by-Turn Decision & Recommendation Linkage:
                  </h4>
                  <div className="space-y-2">
                    {selectedReview.turns.map((t) => (
                      <div
                        key={t.turnIdx}
                        className={`p-3 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs ${
                          t.isDiverged
                            ? 'bg-amber-50/50 border-amber-200'
                            : 'bg-emerald-50/40 border-emerald-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center font-['Orbitron'] text-xs flex-shrink-0 ${
                              t.phase === 'ban'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            T{t.turnNumber}
                          </span>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">
                                โค้ชเลือก: <strong className="text-[#E91E63]">{t.chosenHeroName}</strong>
                              </span>
                              {t.chosenRole && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 font-bold text-slate-700">
                                  {t.chosenRole}
                                </span>
                              )}
                              <span
                                className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
                                  t.isDiverged
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {t.isDiverged
                                  ? `เลือกอันดับ #${t.chosenRank || '>5'} (Diverged)`
                                  : 'ตรงตามคำแนะนำอันดับ #1'}
                              </span>
                            </div>

                            {t.divergenceNotes && (
                              <div className="text-[11px] text-amber-900 mt-1 font-medium">
                                💡 เหตุผลที่เลือกต่าง: {t.divergenceNotes}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Top System Suggestions */}
                        <div className="text-right flex-shrink-0">
                          <span className="text-[10px] text-slate-400 block">ระบบแนะนำ:</span>
                          <span className="text-xs font-semibold text-slate-700">
                            {t.topSuggestions[0]?.heroName} ({t.topSuggestions[0]?.score} แต้ม)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                กรุณาเลือกดราฟต์จากรายการด้านซ้ายเพื่อดูรายละเอียด
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. DEPLOY CONFIRMATION MODAL */}
      {isDeployModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white border-2 border-[#F3D5E2] rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Shield size={18} />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  ยืนยันการปรับใช้น้ำหนักสูตรคะแนนสู่ Production
                </h3>
                <p className="text-xs text-slate-500">
                  ระบบจะบันทึก Snapshot สำรองเพื่อย้อนกลับได้ตลอดเวลา
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
              <div className="font-bold text-slate-900">ผลสรุปจาก Offline Backtest:</div>
              {backtestReport && (
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>Top 1 Agreement: <strong>{backtestReport.candidate.top1Rate}%</strong> ({backtestReport.delta.top1RateDelta > 0 ? '+' : ''}{backtestReport.delta.top1RateDelta}%)</div>
                  <div>Top 3 Agreement: <strong>{backtestReport.candidate.top3Rate}%</strong> ({backtestReport.delta.top3RateDelta > 0 ? '+' : ''}{backtestReport.delta.top3RateDelta}%)</div>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                หมายเหตุการปรับจูน (Changelog Notes):
              </label>
              <textarea
                value={deployNote}
                onChange={(e) => setDeployNote(e.target.value)}
                placeholder="ระบุเหตุผล เช่น เพิ่มค่าน้ำหนัก Player Signature และลด Side Bias ตามผลซ้อมสัปดาห์ที่ 2..."
                rows={3}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#E91E63]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsDeployModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmDeploy}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <CheckCircle2 size={14} />
                <span>ยืนยันปรับใช้ใน Production</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
