import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Shield,
  Zap,
  TrendingUp,
  AlertTriangle,
  Clock,
  Swords,
  Layers,
  CheckCircle,
  Copy,
  Printer,
  Info,
  Users,
  Target,
  BookOpen,
  Save,
  Trophy,
  Star,
  Ban,
  CheckCircle2,
  X,
  Flame,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { Hero, LaneSelectKey } from '../types/draft';
import { Player, HeroPlayerBadge } from '../types/player';
import {
  generatePostDraftSummary,
  saveCoachDraftNotes,
  getCoachDraftNotes,
  saveScrimResult,
  getScrimResult,
  CoachPracticeNotes,
  ScrimResultRecord,
  PostDraftSummaryReport,
} from '../services/decisionSupportService';
import { getHeroImageUrl } from '../data/heroes';

export interface PostDraftReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  blueTeamName: string;
  redTeamName: string;
  bluePicks: Array<{
    hero: Hero | null;
    pos: LaneSelectKey;
    playerNickname?: string;
    playerName?: string;
  }>;
  redPicks: Array<{
    hero: Hero | null;
    pos: LaneSelectKey;
    playerNickname?: string;
    playerName?: string;
  }>;
  blueIsUs?: boolean;
  blueBans?: Array<Hero | null>;
  redBans?: Array<Hero | null>;
  isDraftComplete?: boolean;
  matchMetadata?: {
    tournament?: string;
    match?: string;
    gameNumber?: number;
    patch?: string;
  };
  players?: Player[];
  heroToPlayersMap?: Record<string, HeroPlayerBadge[]>;
  bannedHeroNames?: Set<string>;
  pickedHeroNames?: Set<string>;
}

type ReportTab = 'overview' | 'composition' | 'decision' | 'playbook' | 'notes' | 'scrim';

export const PostDraftReportModal: React.FC<PostDraftReportModalProps> = ({
  isOpen,
  onClose,
  blueTeamName,
  redTeamName,
  bluePicks,
  redPicks,
  blueIsUs = true,
  blueBans = [],
  redBans = [],
  isDraftComplete = false,
  matchMetadata,
  players = [],
  heroToPlayersMap = {},
  bannedHeroNames = new Set(),
  pickedHeroNames = new Set(),
}) => {
  // Perspective side switcher: default to our team side
  const [viewSide, setViewSide] = useState<'our' | 'opp'>('our');
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [copied, setCopied] = useState(false);
  const [notesSaveNotice, setNotesSaveNotice] = useState<string | null>(null);
  const [scrimSaveNotice, setScrimSaveNotice] = useState<string | null>(null);

  // Check if actually complete: either flag is true or both teams picked 5
  const bluePickedCount = bluePicks.filter((p) => p.hero !== null).length;
  const redPickedCount = redPicks.filter((p) => p.hero !== null).length;
  const effectiveIsComplete = isDraftComplete || (bluePickedCount === 5 && redPickedCount === 5);

  // Determine which side is "our" and "opp" based on blueIsUs
  const myPicks = blueIsUs ? bluePicks : redPicks;
  const oppPicks = blueIsUs ? redPicks : bluePicks;
  const myTeamName = blueIsUs ? blueTeamName || 'Blue Side' : redTeamName || 'Red Side';
  const oppTeamName = blueIsUs ? redTeamName || 'Red Side' : blueTeamName || 'Blue Side';
  const ourBans = blueIsUs ? blueBans : redBans;
  const oppBans = blueIsUs ? redBans : blueBans;

  // Active analysis perspective
  const isAnalyzingOurTeam = viewSide === 'our';
  const primaryPicks = isAnalyzingOurTeam ? myPicks : oppPicks;
  const secondaryPicks = isAnalyzingOurTeam ? oppPicks : myPicks;
  const primaryTeamName = isAnalyzingOurTeam ? myTeamName : oppTeamName;
  const secondaryTeamName = isAnalyzingOurTeam ? oppTeamName : myTeamName;
  const primaryBans = isAnalyzingOurTeam ? ourBans : oppBans;
  const secondaryBans = isAnalyzingOurTeam ? oppBans : ourBans;

  // Map picks to PickSlotState ensuring order is present
  const primaryPickSlots = useMemo(() => {
    return primaryPicks.map((p, idx) => ({
      hero: p.hero,
      pos: p.pos,
      order: idx + 1,
      playerNickname: p.playerNickname,
      playerName: p.playerName,
    }));
  }, [primaryPicks]);

  const secondaryPickSlots = useMemo(() => {
    return secondaryPicks.map((p, idx) => ({
      hero: p.hero,
      pos: p.pos,
      order: idx + 1,
      playerNickname: p.playerNickname,
      playerName: p.playerName,
    }));
  }, [secondaryPicks]);

  // Generate complete P3 summary report
  const report: PostDraftSummaryReport = useMemo(() => {
    return generatePostDraftSummary(
      primaryPickSlots,
      secondaryPickSlots,
      primaryTeamName,
      secondaryTeamName,
      {
        isDraftComplete: effectiveIsComplete,
        blueIsUs: isAnalyzingOurTeam ? blueIsUs : !blueIsUs,
        ourBans: primaryBans,
        oppBans: secondaryBans,
        matchMetadata: matchMetadata
          ? {
              tournament: matchMetadata.tournament || 'RoV RPL 2026',
              match: matchMetadata.match || 'Match',
              gameNumber: matchMetadata.gameNumber || 1,
              patch: matchMetadata.patch || 'Latest',
            }
          : undefined,
        players,
        heroToPlayersMap,
        bannedHeroNames,
        pickedHeroNames,
      }
    );
  }, [
    primaryPicks,
    secondaryPicks,
    primaryTeamName,
    secondaryTeamName,
    effectiveIsComplete,
    isAnalyzingOurTeam,
    blueIsUs,
    primaryBans,
    secondaryBans,
    matchMetadata,
    players,
    heroToPlayersMap,
    bannedHeroNames,
    pickedHeroNames,
  ]);

  // Coach Notes local state
  const [coachNotes, setCoachNotes] = useState<CoachPracticeNotes>({
    targetPlan: '',
    playerCommunication: '',
    scrimObjectives: '',
    additionalObservations: '',
  });

  // Scrim Result local state
  const [scrimData, setScrimData] = useState<ScrimResultRecord>({
    hasResult: false,
    result: 'unplayed',
    durationMinutes: undefined,
    notes: '',
  });

  // Sync saved notes on mount or sessionId change
  useEffect(() => {
    if (report.sessionId) {
      const savedNotes = getCoachDraftNotes(report.sessionId);
      setCoachNotes(savedNotes);
      const savedScrim = getScrimResult(report.sessionId);
      setScrimData(savedScrim);
    }
  }, [report.sessionId]);

  if (!isOpen) return null;

  // Handle Save Coach Practice Notes
  const handleSaveNotes = () => {
    if (!report.sessionId) return;
    saveCoachDraftNotes(report.sessionId, coachNotes);
    setNotesSaveNotice('💾 บันทึกโน้ตการซ้อมลงในเครื่องเรียบร้อยแล้ว');
    setTimeout(() => setNotesSaveNotice(null), 3000);
  };

  // Handle Save Scrim Result
  const handleSaveScrim = () => {
    if (!report.sessionId) return;
    saveScrimResult(report.sessionId, scrimData);
    setScrimSaveNotice('🏆 บันทึกผลการซ้อมเรียบร้อยแล้ว');
    setTimeout(() => setScrimSaveNotice(null), 3000);
  };

  // Format Debrief Text for Discord / LINE / Sheet
  const handleCopyTextReport = () => {
    const timestampStr = report.timestamp
      ? new Date(report.timestamp).toLocaleString('th-TH')
      : new Date().toLocaleString('th-TH');
    const scrimResultStr = scrimData.hasResult && scrimData.result
      ? `${scrimData.result.toUpperCase()} (${scrimData.durationMinutes || '-'} นาที)`
      : 'ยังไม่มีผลการแข่งขัน';

    const metaTitle = `=== MCU ESPORTS — POST-DRAFT STRATEGIC DEBRIEF ===
ทัวร์นาเมนต์: ${report.tournament || 'RoV Tournament'} | แมตช์: ${report.match || 'Regular Match'} (Game ${report.gameNumber || 1})
วันที่และเวลา: ${timestampStr}
ทีมวิเคราะห์: ${primaryTeamName} (${viewSide === 'our' ? 'ทีมเรา' : 'คู่แข่ง'}) vs ${secondaryTeamName}

[1. รายชื่อฮีโร่และผู้เล่น (Lineup & Player Fit)]
${report.ourLineup?.map((l) => `• ${l.position}: ${l.hero.name} — ${l.assignedPlayer ? `${l.assignedPlayer.nickname} [${l.assignedPlayer.starColor === 'gold' ? '⭐ Signature' : l.assignedPlayer.starColor === 'silver' ? '★ Comfort' : 'พูลทั่วไป'}]` : 'ไม่ระบุผู้เล่น'}`).join('\n') || 'ไม่มีข้อมูล'}

[2. แบนของทั้งสองทีม]
• ${primaryTeamName}: ${report.ourBans?.map((b) => b.name).join(', ') || 'ไม่มี'}
• ${secondaryTeamName}: ${report.oppBans?.map((b) => b.name).join(', ') || 'ไม่มี'}

[3. แผนการเล่นหลัก (7-Point Game Plan)]
1. แผนหลัก: ${report.gamePlan?.primaryPlan || report.ourStrategicOverview || '-'}
2. เงื่อนไขการลงมือ:
${report.gamePlan?.keyExecutionRequirements?.map((r) => `   - ${r}`).join('\n') || '   - รักษาจังหวะไฟต์'}
3. ภัยคุกคามที่ต้องระวัง:
${report.gamePlan?.oppThreatWatchouts?.map((w) => `   - ${w}`).join('\n') || '   - ระวังการโดนดักพุ่ม'}
4. ต้นเกม (0-4m): ${report.earlyGame.focus}
5. มิดเกม (4-10m): ${report.midGame.focus}
6. เลทเกม (10m+): ${report.lateGame.focus}
7. กฎไฟต์ 5v5:
   • เมื่อควรบวก: ${report.gamePlan?.teamfightRules?.whenToFight?.join(' | ') || '-'}
   • เมื่อควรเลี่ยง: ${report.gamePlan?.teamfightRules?.whenToAvoid?.join(' | ') || '-'}

[4. จุดแข็ง & ข้อพึงระวัง]
จุดแข็ง: ${report.compStrengths.join(' | ')}
จุดอ่อน: ${report.compWeaknesses.join(' | ')}

[5. บันทึกโค้ช]
• แผนที่ตั้งใจ: ${coachNotes.targetPlan || 'ไม่มี'}
• การสื่อสาร: ${coachNotes.playerCommunication || 'ไม่มี'}
• วัตถุประสงค์ซ้อม: ${coachNotes.scrimObjectives || 'ไม่มี'}

[ผลการซ้อม: ${scrimResultStr}]
${report.provenance}
`;

    navigator.clipboard.writeText(metaTitle);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs font-['Prompt'] select-none">
      <div className="bg-white border-2 border-[#F3D5E2] rounded-2xl max-w-5xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden print:max-w-full print:max-h-full print:border-none print:shadow-none">
        {/* ========================================================================= */}
        {/* MODAL TOP HEADER                                                          */}
        {/* ========================================================================= */}
        <div className="p-3 sm:p-4 bg-[#FFF8FB] border-b border-[#F3D5E2] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E91E63] to-[#D81B60] text-white flex items-center justify-center shadow-md shadow-[#E91E63]/25 flex-shrink-0">
              <FileText size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                  Post-Draft Summary & Review (สรุปผลและทบทวนดราฟต์)
                </h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#FCE4EC] text-[#E91E63] border border-[#F8BBD0]">
                  RPL Pro Intelligence
                </span>
                {effectiveIsComplete ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 size={11} />
                    <span>ดราฟต์เสร็จสมบูรณ์</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                    <AlertTriangle size={11} />
                    <span>กำลังดราฟต์ ({bluePickedCount + redPickedCount}/10)</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-tight truncate mt-0.5">
                {matchMetadata?.tournament ? `${matchMetadata.tournament} • ` : ''}
                {matchMetadata?.match ? `${matchMetadata.match} • Game ${matchMetadata.gameNumber || 1} • ` : ''}
                {primaryTeamName} vs {secondaryTeamName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Perspective Switcher */}
            {effectiveIsComplete && (
              <div className="hidden sm:flex items-center bg-white border border-[#F3D5E2] rounded-xl p-0.5 gap-1">
                <button
                  type="button"
                  onClick={() => setViewSide('our')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                    viewSide === 'our'
                      ? 'bg-[#E91E63] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🛡️ ทีมเรา ({myTeamName})
                </button>
                <button
                  type="button"
                  onClick={() => setViewSide('opp')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                    viewSide === 'opp'
                      ? 'bg-slate-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ⚔️ คู่แข่ง ({oppTeamName})
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer transition-colors"
              title="ปิดหน้าต่าง"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* INCOMPLETE DRAFT GUARD (Section 1.1)                                      */}
        {/* ========================================================================= */}
        {!effectiveIsComplete ? (
          <div className="p-6 sm:p-8 flex-1 flex flex-col items-center justify-center text-center gap-4 bg-slate-50">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-inner">
              <AlertTriangle size={32} />
            </div>
            <div className="max-w-md flex flex-col gap-1.5">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                ยังดราฟต์ไม่เสร็จสิ้น (Draft In Progress)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                ระบบ Post-Draft Strategic Review
                จะประมวลผลบทวิเคราะห์ฉบับเต็มได้เมื่อดราฟต์ครบทั้ง 10 ตัว (5 Picks และ Bans
                ของทั้งสองฝั่ง) เพื่อให้การวิเคราะห์ 4 มิติและเงื่อนไขการชนะสอดคล้องกับสถิติแมตช์จริง
              </p>
            </div>

            {/* Current progress indicator */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
              <div className="p-3 bg-white rounded-xl border border-sky-200 text-center shadow-2xs">
                <span className="text-[10px] font-bold text-sky-700 block">
                  🔵 {blueTeamName || 'Blue Side'}
                </span>
                <span className="text-sm font-black text-slate-800">
                  {bluePickedCount} / 5 Picks
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-rose-200 text-center shadow-2xs">
                <span className="text-[10px] font-bold text-rose-700 block">
                  🔴 {redTeamName || 'Red Side'}
                </span>
                <span className="text-sm font-black text-slate-800">
                  {redPickedCount} / 5 Picks
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-[#E91E63] hover:bg-[#D81B60] text-white font-bold text-xs rounded-xl shadow-md shadow-[#E91E63]/25 cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <span>← กลับไปหน้าดราฟต์เพื่อเลือกต่อ</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ========================================================================= */}
            {/* TAB NAVIGATION HEADER (Sections 2 to 6)                                   */}
            {/* ========================================================================= */}
            <div className="flex items-center gap-1 px-3 sm:px-4 pt-2.5 pb-2 bg-white border-b border-[#F3D5E2] overflow-x-auto custom-scrollbar flex-shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-[#FCE4EC] text-[#E91E63] border border-[#F8BBD0]'
                    : 'text-slate-600 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <Layers size={13} />
                <span>1. ภาพรวมดราฟต์</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('composition')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                  activeTab === 'composition'
                    ? 'bg-[#FCE4EC] text-[#E91E63] border border-[#F8BBD0]'
                    : 'text-slate-600 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <Shield size={13} />
                <span>2. วิเคราะห์คอมพ์</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('decision')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                  activeTab === 'decision'
                    ? 'bg-[#FCE4EC] text-[#E91E63] border border-[#F8BBD0]'
                    : 'text-slate-600 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <Swords size={13} />
                <span>3. ทบทวนการตัดสินใจ</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('playbook')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                  activeTab === 'playbook'
                    ? 'bg-[#FCE4EC] text-[#E91E63] border border-[#F8BBD0]'
                    : 'text-slate-600 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <Target size={13} />
                <span>4. แผนการเล่น 7 จุด</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('notes')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                  activeTab === 'notes'
                    ? 'bg-[#FCE4EC] text-[#E91E63] border border-[#F8BBD0]'
                    : 'text-slate-600 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <BookOpen size={13} />
                <span>5. บันทึกการซ้อม</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('scrim')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                  activeTab === 'scrim'
                    ? 'bg-[#FCE4EC] text-[#E91E63] border border-[#F8BBD0]'
                    : 'text-slate-600 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <Trophy size={13} />
                <span>6. ผลการแข่งขัน</span>
              </button>
            </div>

            {/* ========================================================================= */}
            {/* SCROLLABLE CONTENT BODY                                                   */}
            {/* ========================================================================= */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 flex flex-col gap-4 custom-scrollbar text-slate-800 bg-[#FCFCFD]">
              {/* TAB 1: DRAFT OVERVIEW (Section 2) */}
              {activeTab === 'overview' && (
                <div className="flex flex-col gap-3.5">
                  {/* Strategic Overview Banner */}
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-[#FFF8FB] to-white border border-[#F3D5E2] flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#E91E63] text-white flex items-center justify-center font-black text-sm flex-shrink-0">
                        🎯
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900">
                          {report.ourStrategicOverview || 'แผนการเล่นหลักของทีม'}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          คู่แข่ง: {report.oppStrategicOverview}
                        </span>
                      </div>
                    </div>
                    {report.realizedComps && report.realizedComps.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {report.realizedComps.map((c) => (
                          <span
                            key={c.compName}
                            className="px-2 py-0.5 rounded-lg bg-pink-50 border border-pink-200 text-[#E91E63] font-bold text-[10px]"
                          >
                            ⭐ {c.compNameTh} ({c.tier})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Side-by-side Picks & Assigned Players */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Primary Team Picks */}
                    <div className="p-3.5 bg-white border border-sky-200 rounded-2xl flex flex-col gap-2.5 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                        <span className="font-bold text-xs text-sky-900 flex items-center gap-1.5">
                          <span>🔵</span>
                          <span>{primaryTeamName} (Picks & Player Fit)</span>
                        </span>
                        <span className="text-[10px] text-sky-600 font-semibold">
                          Bans: {primaryBans.map((b) => b?.name).filter(Boolean).join(', ') || 'ไม่มี'}
                        </span>
                      </div>

                      <div className="grid grid-cols-5 gap-1.5">
                        {report.ourLineup?.map((item, idx) => {
                          const p = item.assignedPlayer;
                          return (
                            <div
                              key={idx}
                              className="p-1.5 rounded-xl bg-sky-50/50 border border-sky-100 flex flex-col items-center text-center shadow-2xs"
                            >
                              <span className="text-[8.5px] font-black text-sky-800 mb-0.5">
                                {item.position}
                              </span>
                              <img
                                src={getHeroImageUrl(item.hero.name)}
                                alt={item.hero.name}
                                className="w-10 h-10 rounded-lg object-cover border border-sky-200 shadow-2xs"
                              />
                              <span className="text-[11px] font-bold text-slate-900 mt-1 truncate max-w-full">
                                {item.hero.name}
                              </span>

                              {/* Player Fit Badge (P1) */}
                              {p ? (
                                <span
                                  className={`text-[8px] font-bold px-1 py-0.2 rounded mt-1 truncate max-w-full border ${
                                    p.starColor === 'gold'
                                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                                      : p.starColor === 'silver'
                                      ? 'bg-slate-100 text-slate-700 border-slate-300'
                                      : 'bg-white text-slate-600 border-slate-200'
                                  }`}
                                  title={`${p.playerName} (${p.roleFitDescription})`}
                                >
                                  {p.starColor === 'gold' ? '⭐ ' : p.starColor === 'silver' ? '★ ' : ''}
                                  {p.nickname}
                                </span>
                              ) : (
                                <span className="text-[8px] text-slate-400 mt-1 italic">
                                  ไม่ระบุผู้เล่น
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Secondary Team Picks */}
                    <div className="p-3.5 bg-white border border-rose-200 rounded-2xl flex flex-col gap-2.5 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-rose-100 pb-2">
                        <span className="font-bold text-xs text-rose-900 flex items-center gap-1.5">
                          <span>🔴</span>
                          <span>{secondaryTeamName} (Picks & Strategy)</span>
                        </span>
                        <span className="text-[10px] text-rose-600 font-semibold">
                          Bans: {secondaryBans.map((b) => b?.name).filter(Boolean).join(', ') || 'ไม่มี'}
                        </span>
                      </div>

                      <div className="grid grid-cols-5 gap-1.5">
                        {report.oppLineup?.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-1.5 rounded-xl bg-rose-50/50 border border-rose-100 flex flex-col items-center text-center shadow-2xs"
                          >
                            <span className="text-[8.5px] font-black text-rose-800 mb-0.5">
                              {item.position}
                            </span>
                            <img
                              src={getHeroImageUrl(item.hero.name)}
                              alt={item.hero.name}
                              className="w-10 h-10 rounded-lg object-cover border border-rose-200 shadow-2xs"
                            />
                            <span className="text-[11px] font-bold text-slate-900 mt-1 truncate max-w-full">
                              {item.hero.name}
                            </span>
                            <span className="text-[8px] font-semibold text-rose-700 bg-rose-50 px-1 py-0.2 rounded mt-1">
                              {item.hero.roles.join(', ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Strengths & Weaknesses Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Strengths */}
                    <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-2xl flex flex-col gap-2 shadow-2xs">
                      <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 uppercase">
                        <CheckCircle size={14} className="text-emerald-600" />
                        <span>จุดแข็งหลักของคอมพ์ ({primaryTeamName})</span>
                      </span>
                      <ul className="flex flex-col gap-1.5">
                        {report.compStrengths.map((str, i) => (
                          <li
                            key={i}
                            className="text-xs text-slate-700 leading-relaxed flex items-start gap-1.5 p-1.5 bg-white rounded-xl border border-emerald-100"
                          >
                            <span className="text-emerald-600 font-bold">•</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Risks */}
                    <div className="p-3.5 bg-rose-50/50 border border-rose-200 rounded-2xl flex flex-col gap-2 shadow-2xs">
                      <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5 uppercase">
                        <AlertTriangle size={14} className="text-rose-600" />
                        <span>จุดเสี่ยงและข้อควรระวัง ({primaryTeamName})</span>
                      </span>
                      <ul className="flex flex-col gap-1.5">
                        {report.compWeaknesses.map((w, i) => (
                          <li
                            key={i}
                            className="text-xs text-slate-700 leading-relaxed flex items-start gap-1.5 p-1.5 bg-white rounded-xl border border-rose-100"
                          >
                            <span className="text-rose-600 font-bold">•</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TEAM COMPOSITION REVIEW (Section 3) */}
              {activeTab === 'composition' && report.compositionReview && (
                <div className="flex flex-col gap-3.5">
                  {/* Fact vs Evaluation Notice */}
                  <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-indigo-950 text-xs flex items-start gap-2 shadow-2xs">
                    <Info size={16} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-[11.5px]">
                        หลักการวิเคราะห์: แยกข้อเท็จจริง (สถิติ) ออกจากการประเมินเชิงกลยุทธ์
                      </span>
                      <p className="text-[11px] text-indigo-800 leading-relaxed">
                        {report.compositionReview.factVsEvaluationNotes.join(' • ')}
                      </p>
                    </div>
                  </div>

                  {/* 4 Core Dimensions: Role, Frontline, Hard CC, Backline Dive */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {/* Dimension 1: Role Coverage */}
                    <div className="p-3 bg-white border border-[#F3D5E2] rounded-2xl flex flex-col gap-1.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          <Users size={13} className="text-[#E91E63]" />
                          <span>1. การกระจายตำแหน่ง</span>
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            report.compositionReview.ourComp.roleCoverage.missingRoles.length === 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {report.compositionReview.ourComp.roleCoverage.missingRoles.length === 0
                            ? 'ครบ 5 ตำแหน่ง'
                            : `ขาด ${report.compositionReview.ourComp.roleCoverage.missingRoles.join(', ')}`}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        ครอบคลุม: {report.compositionReview.ourComp.roleCoverage.rolesCovered.join(', ')}
                      </p>
                      {report.compositionReview.ourComp.roleCoverage.roleClashes.length > 0 && (
                        <span className="text-[9.5px] text-amber-700 bg-amber-50 p-1 rounded-lg">
                          ตำแหน่งซ้อน: {report.compositionReview.ourComp.roleCoverage.roleClashes.join(' | ')}
                        </span>
                      )}
                    </div>

                    {/* Dimension 2: Frontline & Alternative Style */}
                    <div className="p-3 bg-white border border-[#F3D5E2] rounded-2xl flex flex-col gap-1.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          <Shield size={13} className="text-sky-600" />
                          <span>2. แนวหน้ารับดาเมจ</span>
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            report.compositionReview.ourComp.frontline.hasFrontline
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {report.compositionReview.ourComp.frontline.hasFrontline
                            ? `${report.compositionReview.ourComp.frontline.count} ตัวชน`
                            : 'สไตล์ทางเลือก'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {report.compositionReview.ourComp.frontline.details}
                      </p>
                      {report.compositionReview.ourComp.frontline.alternativeStyle && (
                        <span className="text-[9.5px] text-purple-700 bg-purple-50 p-1 rounded-lg">
                          💡 {report.compositionReview.ourComp.frontline.alternativeStyle}
                        </span>
                      )}
                    </div>

                    {/* Dimension 3: Hard CC & Peel */}
                    <div className="p-3 bg-white border border-[#F3D5E2] rounded-2xl flex flex-col gap-1.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          <Zap size={13} className="text-amber-500" />
                          <span>3. สกิลควบคุม (Hard CC)</span>
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            report.compositionReview.ourComp.hardCc.hasHardCc
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {report.compositionReview.ourComp.hardCc.hasHardCc
                            ? `${report.compositionReview.ourComp.hardCc.count} สกิลหยุด`
                            : 'CC น้อย'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {report.compositionReview.ourComp.hardCc.details}
                      </p>
                    </div>

                    {/* Dimension 4: Backline Dive */}
                    <div className="p-3 bg-white border border-[#F3D5E2] rounded-2xl flex flex-col gap-1.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          <Swords size={13} className="text-rose-600" />
                          <span>4. การล้วงแนวหลัง</span>
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            report.compositionReview.ourComp.backlineDive.hasDive
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {report.compositionReview.ourComp.backlineDive.hasDive
                            ? 'มีตัวล้วง'
                            : 'เน้นชนหน้า'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {report.compositionReview.ourComp.backlineDive.details}
                      </p>
                    </div>
                  </div>

                  {/* Damage Distribution Bar Split */}
                  <div className="p-3.5 bg-white border border-[#F3D5E2] rounded-2xl flex flex-col gap-2 shadow-2xs">
                    <span className="text-xs font-bold text-slate-900 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Flame size={14} className="text-amber-500" />
                        <span>สัดส่วนดาเมจของทีม (Damage Balance Distribution)</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        เปรียบเทียบ {primaryTeamName} vs {secondaryTeamName}
                      </span>
                    </span>

                    {/* Our Team Damage Bar */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-slate-700">
                        🔵 {primaryTeamName}:
                      </span>
                      <div className="h-3.5 w-full rounded-full overflow-hidden flex bg-slate-100 border border-slate-200">
                        <div
                          style={{ width: `${report.compositionReview.ourComp.damageSplit.physical}%` }}
                          className="bg-[#0284C7] h-full"
                          title={`Physical: ${report.compositionReview.ourComp.damageSplit.physical}%`}
                        />
                        <div
                          style={{ width: `${report.compositionReview.ourComp.damageSplit.magic}%` }}
                          className="bg-[#A855F7] h-full"
                          title={`Magic: ${report.compositionReview.ourComp.damageSplit.magic}%`}
                        />
                        <div
                          style={{ width: `${report.compositionReview.ourComp.damageSplit.trueDmg}%` }}
                          className="bg-[#F59E0B] h-full"
                          title={`True Damage: ${report.compositionReview.ourComp.damageSplit.trueDmg}%`}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-bold pt-0.5">
                        <span className="text-[#0284C7]">
                          กายภาพ {report.compositionReview.ourComp.damageSplit.physical}%
                        </span>
                        <span className="text-[#A855F7]">
                          เวท {report.compositionReview.ourComp.damageSplit.magic}%
                        </span>
                        <span className="text-[#F59E0B]">
                          ทรูดาเมจ {report.compositionReview.ourComp.damageSplit.trueDmg}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Power Spike & Timing Timeline */}
                  <div className="p-3.5 bg-white border border-[#F3D5E2] rounded-2xl flex flex-col gap-2 shadow-2xs">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Clock size={14} className="text-purple-600" />
                      <span>จังหวะความเก่ง (Power Spike & Timing Viability)</span>
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                      <div className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-200 flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-purple-900 uppercase">
                          ⚡ พาวเวอร์สไปค์หลัก
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {report.compositionReview.ourComp.powerSpike}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-200 flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-amber-900 uppercase">
                          ⚠️ ช่วงเวลาเปราะบาง
                        </span>
                        <span className="text-[11px] text-slate-700 leading-tight">
                          {report.compositionReview.ourComp.timingVulnerability}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-200 flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-emerald-900 uppercase">
                          🛡️ ความพร้อมสู้เลทเกม
                        </span>
                        <span className="text-[11px] text-slate-700 leading-tight">
                          {report.compositionReview.ourComp.lateGameViability}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: DRAFT DECISION REVIEW (Section 4) */}
              {activeTab === 'decision' && report.decisionReview && (
                <div className="flex flex-col gap-3.5">
                  {/* Banned Combo Fallback Analysis */}
                  <div className="p-3.5 bg-white border border-[#F3D5E2] rounded-2xl flex flex-col gap-2.5 shadow-2xs">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Ban size={14} className="text-rose-600" />
                      <span>การปรับแผนเมื่อคอมโบถูกแบน (Banned Combo Fallback Review)</span>
                    </span>

                    {report.decisionReview.bannedCombosImpact.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {report.decisionReview.bannedCombosImpact.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-rose-50/40 border border-rose-200 flex flex-col gap-1 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-rose-900">
                                🚫 {item.bannedHero} โดนแบน (กระทบแผน {item.affectedComp})
                              </span>
                              {item.substituteUsed && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                  ตัวแทน: {item.substituteUsed}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                              ⚖️ ข้อแลกเปลี่ยน / ผลกระทบ: {item.tradeOffNote}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl text-center text-xs text-emerald-800">
                        ✅ การดราฟต์ดำเนินไปตามแผนหลัก ไม่มีตัวหลักในคอมโบสำคัญถูกแบนตัดแผน
                      </div>
                    )}
                  </div>

                  {/* Player Fit Alignment Review */}
                  <div className="p-3.5 bg-white border border-[#F3D5E2] rounded-2xl flex flex-col gap-2.5 shadow-2xs">
                    <span className="text-xs font-bold text-slate-900 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Star size={14} className="text-amber-500 fill-amber-500" />
                        <span>ความสอดคล้องกับพูลนักแข่ง (Player Fit Alignment)</span>
                      </span>
                      <span className="text-[10px] text-slate-500">
                        สถิติความมั่นใจของนักแข่ง
                      </span>
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
                      {report.decisionReview.playerFitReview.map((fit, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1 text-center"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-xs font-bold text-slate-900">
                              {fit.heroName}
                            </span>
                          </div>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded border mx-auto ${
                              fit.starColor === 'gold'
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : fit.starColor === 'silver'
                                ? 'bg-slate-100 text-slate-800 border-slate-300'
                                : 'bg-white text-slate-600 border-slate-200'
                            }`}
                          >
                            {fit.playerNickname} ({fit.tierLabel})
                          </span>
                          <p className="text-[9.5px] text-slate-500 leading-tight mt-0.5">
                            {fit.note}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Critical Warnings History */}
                  <div className="p-3.5 bg-white border border-[#F3D5E2] rounded-2xl flex flex-col gap-2 shadow-2xs">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <AlertTriangle size={14} className="text-amber-500" />
                      <span>คำเตือนสมดุลที่ตรวจพบระหว่างดราฟต์</span>
                    </span>

                    {report.decisionReview.criticalWarningsOccurred.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        {report.decisionReview.criticalWarningsOccurred.map((warn, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 flex items-start gap-2"
                          >
                            <span className="font-bold">•</span>
                            <span>{warn}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 italic">
                        ไม่มีคำเตือนระดับวิกฤติตลอดการดราฟต์
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: 7-POINT GAME PLAN PLAYBOOK (Section 5) */}
              {activeTab === 'playbook' && report.gamePlan && (
                <div className="flex flex-col gap-3.5">
                  {/* Point 1: Primary Plan */}
                  <div className="p-3.5 bg-gradient-to-r from-pink-50 to-white border border-pink-200 rounded-2xl flex flex-col gap-1 shadow-2xs">
                    <span className="text-[10px] font-black text-[#E91E63] uppercase tracking-wider flex items-center gap-1">
                      <span>🎯 1. แผนหลัก (Primary Win Plan)</span>
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      {report.gamePlan.primaryPlan}
                    </h3>
                  </div>

                  {/* Point 2: Execution Requirements */}
                  <div className="p-3.5 bg-white border border-[#F3D5E2] rounded-2xl flex flex-col gap-2 shadow-2xs">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      <span>2. เงื่อนไขการลงมือ (Execution Requirements)</span>
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {report.gamePlan.keyExecutionRequirements.map((req, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-start gap-2"
                        >
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="text-xs text-slate-700 leading-relaxed">{req}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Point 3: Opponent Threat Watchout */}
                  <div className="p-3.5 bg-white border border-[#F3D5E2] rounded-2xl flex flex-col gap-2 shadow-2xs">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <AlertTriangle size={14} className="text-rose-600" />
                      <span>3. ภัยคุกคามที่ต้องระวังจากคู่แข่ง (Enemy Threat Watchout)</span>
                    </span>
                    <div className="flex flex-col gap-1.5">
                      {report.gamePlan.oppThreatWatchouts.length > 0 ? (
                        report.gamePlan.oppThreatWatchouts.map((thr, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-rose-50/50 border border-rose-200 text-xs text-slate-800 flex items-start gap-2"
                          >
                            <span className="text-rose-600 font-bold">•</span>
                            <span className="leading-relaxed">{thr}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500 italic">
                          คู่แข่งไม่มีคอมโบเดี่ยวที่คุกคามแนวหลังรุนแรงเป็นพิเศษ
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Points 4, 5, 6: Game Phases Timeline */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Early */}
                    <div className="p-3 bg-white border border-sky-200 rounded-2xl flex flex-col gap-1.5 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-sky-100 pb-1.5">
                        <span className="font-bold text-xs text-sky-900">
                          4. ต้นเกม ({report.gamePlan.earlyGame.timing})
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-800 leading-relaxed">
                        🎯 {report.gamePlan.earlyGame.focus}
                      </p>
                      <div className="flex flex-col gap-1 mt-1">
                        {report.gamePlan.earlyGame.objectives.map((obj, i) => (
                          <span key={i} className="text-[10px] text-slate-600 flex items-start gap-1">
                            <span className="text-sky-500">•</span>
                            <span>{obj}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Mid */}
                    <div className="p-3 bg-white border border-indigo-200 rounded-2xl flex flex-col gap-1.5 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-indigo-100 pb-1.5">
                        <span className="font-bold text-xs text-indigo-900">
                          5. กลางเกม ({report.gamePlan.midGame.timing})
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-800 leading-relaxed">
                        🎯 {report.gamePlan.midGame.focus}
                      </p>
                      <div className="flex flex-col gap-1 mt-1">
                        {report.gamePlan.midGame.objectives.map((obj, i) => (
                          <span key={i} className="text-[10px] text-slate-600 flex items-start gap-1">
                            <span className="text-indigo-500">•</span>
                            <span>{obj}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Late */}
                    <div className="p-3 bg-white border border-purple-200 rounded-2xl flex flex-col gap-1.5 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-purple-100 pb-1.5">
                        <span className="font-bold text-xs text-purple-900">
                          6. เลทเกม ({report.gamePlan.lateGame.timing})
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-800 leading-relaxed">
                        🎯 {report.gamePlan.lateGame.focus}
                      </p>
                      <div className="flex flex-col gap-1 mt-1">
                        {report.gamePlan.lateGame.objectives.map((obj, i) => (
                          <span key={i} className="text-[10px] text-slate-600 flex items-start gap-1">
                            <span className="text-purple-500">•</span>
                            <span>{obj}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Point 7: Teamfight Rules (When to fight / When to avoid) */}
                  <div className="p-3.5 bg-white border border-[#F3D5E2] rounded-2xl flex flex-col gap-2.5 shadow-2xs">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Swords size={14} className="text-[#E91E63]" />
                      <span>7. กฎไฟต์ 5v5 (Teamfight Rules: เมื่อไหร่ควรบวก / เมื่อไหร่ต้องเลี่ยง)</span>
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* When to fight */}
                      <div className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-200 flex flex-col gap-1.5">
                        <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                          <CheckCircle2 size={13} className="text-emerald-600" />
                          <span>จังหวะที่ควรเปิดไฟต์ (When to fight):</span>
                        </span>
                        <ul className="flex flex-col gap-1 pl-1">
                          {report.gamePlan.teamfightRules.whenToFight.map((r, i) => (
                            <li key={i} className="text-[11px] text-slate-700 leading-relaxed flex items-start gap-1">
                              <span className="text-emerald-600 font-bold">•</span>
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* When to avoid */}
                      <div className="p-2.5 rounded-xl bg-rose-50/50 border border-rose-200 flex flex-col gap-1.5">
                        <span className="text-xs font-bold text-rose-900 flex items-center gap-1">
                          <AlertTriangle size={13} className="text-rose-600" />
                          <span>จังหวะที่ต้องเลี่ยงไฟต์ (When to avoid):</span>
                        </span>
                        <ul className="flex flex-col gap-1 pl-1">
                          {report.gamePlan.teamfightRules.whenToAvoid.map((r, i) => (
                            <li key={i} className="text-[11px] text-slate-700 leading-relaxed flex items-start gap-1">
                              <span className="text-rose-600 font-bold">•</span>
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: PLAYER & PRACTICE NOTES (Section 6) */}
              {activeTab === 'notes' && (
                <div className="p-4 bg-white border border-[#F3D5E2] rounded-2xl flex flex-col gap-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <BookOpen size={15} className="text-[#E91E63]" />
                      <span>Player & Practice Notes (บันทึกการซ้อมและการบรีฟของโค้ช)</span>
                    </span>
                    <span className="text-[10px] text-slate-500">
                      บันทึกผูกกับรหัสดราฟต์: {report.sessionId}
                    </span>
                  </div>

                  {notesSaveNotice && (
                    <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 size={14} />
                      <span>{notesSaveNotice}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Field 1: Target Plan */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-700">
                        1. แผนที่ตั้งใจเล่น (Target Plan)
                      </label>
                      <textarea
                        value={coachNotes.targetPlan}
                        onChange={(e) =>
                          setCoachNotes((prev) => ({ ...prev, targetPlan: e.target.value }))
                        }
                        placeholder="ระบุแผนการเล่นที่บรีฟนักแข่ง เช่น ชนหน้ายิงหลัง, สปีดดัน 3 เลน..."
                        rows={3}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-[#E91E63] outline-none bg-slate-50/50 text-slate-800"
                      />
                    </div>

                    {/* Field 2: Player Communication */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-700">
                        2. การสื่อสารของผู้เล่น / ข้อตกลงในทีม (Player Communication)
                      </label>
                      <textarea
                        value={coachNotes.playerCommunication}
                        onChange={(e) =>
                          setCoachNotes((prev) => ({
                            ...prev,
                            playerCommunication: e.target.value,
                          }))
                        }
                        placeholder="เช่น กำหนดให้โรมมิ่งเป็น Shotcaller หลัก, แครี่คอยขานตำแหน่งศัตรู..."
                        rows={3}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-[#E91E63] outline-none bg-slate-50/50 text-slate-800"
                      />
                    </div>

                    {/* Field 3: Scrim Objectives */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-700">
                        3. วัตถุประสงค์การซ้อมของเกมนี้ (Scrim Objectives)
                      </label>
                      <textarea
                        value={coachNotes.scrimObjectives}
                        onChange={(e) =>
                          setCoachNotes((prev) => ({
                            ...prev,
                            scrimObjectives: e.target.value,
                          }))
                        }
                        placeholder="เช่น ฝึกคุมแม่น้ำนาทีที่ 2, ทดสอบการเล่นรับมือตัวล้วง..."
                        rows={3}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-[#E91E63] outline-none bg-slate-50/50 text-slate-800"
                      />
                    </div>

                    {/* Field 4: Additional Observations */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-700">
                        4. ข้อสังเกตเพิ่มเติม / ปัญหาเฉพาะตัว (Additional Observations)
                      </label>
                      <textarea
                        value={coachNotes.additionalObservations}
                        onChange={(e) =>
                          setCoachNotes((prev) => ({
                            ...prev,
                            additionalObservations: e.target.value,
                          }))
                        }
                        placeholder="ข้อสังเกตหลังจบแมตช์ หรือจุดที่ต้องปรับปรุงรายบุคคล..."
                        rows={3}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-[#E91E63] outline-none bg-slate-50/50 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleSaveNotes}
                      className="px-4 py-2 bg-[#E91E63] hover:bg-[#D81B60] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
                    >
                      <Save size={13} />
                      <span>💾 บันทึกโน้ตการซ้อมลงในเครื่อง (Save Notes)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 6: SCRIM RESULT (Section 7) */}
              {activeTab === 'scrim' && (
                <div className="p-4 bg-white border border-[#F3D5E2] rounded-2xl flex flex-col gap-3.5 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Trophy size={15} className="text-amber-500" />
                      <span>Scrim Result Recording (บันทึกผลการแข่งขัน / ซ้อม)</span>
                    </span>
                    <span className="text-[10px] text-slate-500">
                      รองรับการติดตามผลในอนาคต
                    </span>
                  </div>

                  {/* Neutral Disclaimer */}
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                    <Info size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed text-[11px]">
                      ผลการแข่งขันเป็นอิสระจากการประเมินคุณภาพดราฟต์
                      (การชนะไม่ได้แปลว่าดราฟต์สมบูรณ์เสมอไป
                      และการแพ้อาจเกิดจากการคุมไฟต์หรือความผิดพลาดในเกม ไม่ใช่ดราฟต์แพ้ทาง)
                    </span>
                  </div>

                  {scrimSaveNotice && (
                    <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 size={14} />
                      <span>{scrimSaveNotice}</span>
                    </div>
                  )}

                  {/* Scrim Status Display */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">สถานะผลซ้อม:</span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                          scrimData.hasResult
                            ? scrimData.result === 'win'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {scrimData.hasResult
                          ? scrimData.result === 'win'
                            ? '🏆 ชนะ (WIN)'
                            : '❌ แพ้ (LOSS)'
                          : 'ยังไม่มีข้อมูลผลซ้อม (รองรับการบันทึกผลการแข่งขันและข้อสังเกตหลังจบเกม)'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setScrimData((prev) => ({
                          ...prev,
                          hasResult: !prev.hasResult,
                          result: prev.result === 'unplayed' ? 'win' : prev.result,
                        }))
                      }
                      className="px-3 py-1 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-all"
                    >
                      {scrimData.hasResult ? 'ยกเลิกผลบันทึก' : '+ บันทึกผลแมตช์นี้'}
                    </button>
                  </div>

                  {/* Editable Form */}
                  {scrimData.hasResult && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-700">ผลการแข่งขัน</label>
                        <select
                          value={scrimData.result}
                          onChange={(e) =>
                            setScrimData((prev) => ({
                              ...prev,
                              result: e.target.value as 'win' | 'loss',
                            }))
                          }
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white outline-none font-bold text-slate-800"
                        >
                          <option value="win">🏆 ชนะ (WIN)</option>
                          <option value="loss">❌ แพ้ (LOSS)</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-700">เวลาจบเกม (นาที)</label>
                        <input
                          type="number"
                          min={5}
                          max={45}
                          value={scrimData.durationMinutes || ''}
                          onChange={(e) =>
                            setScrimData((prev) => ({
                              ...prev,
                              durationMinutes: e.target.value ? parseInt(e.target.value, 10) : undefined,
                            }))
                          }
                          placeholder="เช่น 14"
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white outline-none text-slate-800"
                        />
                      </div>

                      <div className="flex flex-col gap-1 sm:col-span-3">
                        <label className="text-xs font-bold text-slate-700">
                          ข้อสังเกตหลังจบเกม (Post-Game Remarks)
                        </label>
                        <textarea
                          value={scrimData.notes || ''}
                          onChange={(e) =>
                            setScrimData((prev) => ({ ...prev, notes: e.target.value }))
                          }
                          placeholder="เช่น ไฟต์เลทเกมแพ้เพราะแครี่โดนจับแยก, แผนสไนป์ได้ผลดีตามคาด..."
                          rows={2}
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white outline-none text-slate-800"
                        />
                      </div>

                      <div className="sm:col-span-3 flex justify-end">
                        <button
                          type="button"
                          onClick={handleSaveScrim}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
                        >
                          <Save size={13} />
                          <span>บันทึกผลการแข่งขัน (Save Result)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* MODAL FOOTER ACTIONS                                                      */}
        {/* ========================================================================= */}
        <div className="p-3 bg-white border-t border-[#F3D5E2] flex items-center justify-between flex-shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            {effectiveIsComplete && (
              <>
                <button
                  type="button"
                  onClick={handleCopyTextReport}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="คัดลอกบทวิเคราะห์และแผนการเล่น 7 จุดสำหรับส่ง Discord หรือ LINE"
                >
                  <Copy size={13} />
                  <span>{copied ? 'คัดลอกสำเร็จแล้ว!' : 'คัดลอกสรุปข้อความ (Debrief)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="hidden sm:flex px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 items-center gap-1.5 cursor-pointer transition-colors"
                  title="พิมพ์หรือบันทึกเป็น PDF"
                >
                  <Printer size={13} />
                  <span>พิมพ์ / PDF</span>
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 text-xs font-bold rounded-xl bg-[#E91E63] text-white hover:bg-[#D81B60] shadow-xs cursor-pointer transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
