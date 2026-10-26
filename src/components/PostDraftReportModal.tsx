import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Shield,
  Zap,
  AlertTriangle,
  Clock,
  Swords,
  Copy,
  Printer,
  Users,
  Target,
  Save,
  Trophy,
  Star,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Info,
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

const LANE_NAMES_TH: Record<string, string> = {
  DSL: 'Dark Slayer (ออฟเลน)',
  JUG: 'Jungle (ป่า)',
  MID: 'Mid Lane (กลาง)',
  ADL: 'Abyssal Dragon (แครี่)',
  SUP: 'Support / Roam (โรม)',
};

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
  const [copied, setCopied] = useState(false);
  const [notesSaveNotice, setNotesSaveNotice] = useState<string | null>(null);
  const [scrimSaveNotice, setScrimSaveNotice] = useState<string | null>(null);

  // Accordion Expand/Collapse States
  const [isPlaybookExpanded, setIsPlaybookExpanded] = useState(true);
  const [isBalanceExpanded, setIsBalanceExpanded] = useState(false);
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);

  // Check picked count
  const bluePickedCount = bluePicks.filter((p) => p.hero !== null).length;
  const redPickedCount = redPicks.filter((p) => p.hero !== null).length;
  const effectiveIsComplete = isDraftComplete || (bluePickedCount === 5 && redPickedCount === 5);

  // Determine sides
  const myPicks = blueIsUs ? bluePicks : redPicks;
  const oppPicks = blueIsUs ? redPicks : bluePicks;
  const myTeamName = blueIsUs ? blueTeamName || 'MCU eSports (Blue)' : redTeamName || 'MCU eSports (Red)';
  const oppTeamName = blueIsUs ? redTeamName || 'Opponent (Red)' : blueTeamName || 'Opponent (Blue)';
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

  // Generate complete post-draft summary report
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
    primaryPickSlots,
    secondaryPickSlots,
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

  // Coach Notes local state (isolated per sessionId)
  const [coachNotes, setCoachNotes] = useState<CoachPracticeNotes>({
    targetPlan: '',
    playerCommunication: '',
    scrimObjectives: '',
    additionalObservations: '',
  });

  // Scrim Result local state (isolated per sessionId)
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
    setNotesSaveNotice('บันทึกโน้ตการซ้อมลงในเครื่องเรียบร้อยแล้ว');
    setTimeout(() => setNotesSaveNotice(null), 3000);
  };

  // Handle Save Scrim Result
  const handleSaveScrim = () => {
    if (!report.sessionId) return;
    saveScrimResult(report.sessionId, scrimData);
    setScrimSaveNotice('บันทึกผลการแข่งขันเรียบร้อยแล้ว');
    setTimeout(() => setScrimSaveNotice(null), 3000);
  };

  // Format Debrief Text for Discord / LINE / Google Docs
  const handleCopyTextReport = () => {
    const timestampStr = report.timestamp
      ? new Date(report.timestamp).toLocaleString('th-TH')
      : new Date().toLocaleString('th-TH');

    const debriefText = `=== MCU ESPORTS — สรุปผลดราฟต์และแผนการเล่น (POST-DRAFT SUMMARY) ===
ทัวร์นาเมนต์: ${report.tournament || 'RoV RPL 2026'} | แมตช์: ${report.match || 'Match'} (Game ${report.gameNumber || 1})
วันที่และเวลา: ${timestampStr}
ทีมวิเคราะห์: ${primaryTeamName} (${viewSide === 'our' ? 'ทีมเรา' : 'คู่แข่ง'}) vs ${secondaryTeamName}
สถานะดราฟต์: ${effectiveIsComplete ? 'ดราฟต์ครบสมบูรณ์ (10/10)' : `กำลังดราฟต์ (${bluePickedCount + redPickedCount}/10)`}

[1. ฮีโร่ที่เลือก & ผู้เล่นที่ได้รับมอบหมาย]
• ทีมเรา (${primaryTeamName}):
${report.ourLineup?.map((l) => `  - ${l.position}: ${l.hero.name} ${l.assignedPlayer ? `(${l.assignedPlayer.nickname}${l.assignedPlayer.starColor === 'gold' ? ' ⭐ดาวทอง' : l.assignedPlayer.starColor === 'silver' ? ' ⭐ดาวเงิน' : ''})` : '(ยังไม่ระบุผู้เล่น)'}`).join('\n') || '  - ไม่มีข้อมูล'}

• คู่แข่ง (${secondaryTeamName}):
${report.oppLineup?.map((l) => `  - ${l.position}: ${l.hero.name}`).join('\n') || '  - ไม่มีข้อมูล'}

[2. ประวัติการแบน (BAN History)]
• ทีมเราแบน: ${report.ourBans && report.ourBans.length > 0 ? report.ourBans.map((b) => b.name).join(', ') : 'ไม่มีข้อมูลการแบน'}
• คู่แข่งแบน: ${report.oppBans && report.oppBans.length > 0 ? report.oppBans.map((b) => b.name).join(', ') : 'ไม่มีข้อมูลการแบน'}

[3. จุดแข็งของทีมเรา]
${report.compStrengths.length > 0 ? report.compStrengths.map((s) => `• ${s}`).join('\n') : '• ไม่มีข้อมูล'}

[4. จุดเสี่ยงสำคัญ (Draft Safety Check)]
${report.compWeaknesses.length > 0 ? report.compWeaknesses.map((w) => `• ${w}`).join('\n') : '• สมดุลทีมอยู่ในเกณฑ์ดี'}

[5. แผนการเล่นที่แนะนำ]
• แผนหลัก: ${report.gamePlan?.primaryPlan || report.ourStrategicOverview || 'คุมจังหวะไฟต์ตามพาวเวอร์สไปค์'}
• ต้นเกม (0-4m): ${report.earlyGame.focus}
• กลางเกม (4-10m): ${report.midGame.focus}
• เลทเกม (10m+): ${report.lateGame.focus}

[6. สิ่งที่ต้องระวังจากคู่แข่ง]
${report.gamePlan?.oppThreatWatchouts && report.gamePlan.oppThreatWatchouts.length > 0 ? report.gamePlan.oppThreatWatchouts.map((t) => `• ${t}`).join('\n') : '• ระวังการประสานงานคอมโบของคู่แข่ง'}

[7. บันทึกสำหรับการซ้อม]
• แผนที่ตั้งใจ: ${coachNotes.targetPlan || 'ไม่มีบันทึก'}
• การสื่อสารในทีม: ${coachNotes.playerCommunication || 'ไม่มีบันทึก'}
• วัตถุประสงค์ซ้อม: ${coachNotes.scrimObjectives || 'ไม่มีบันทึก'}

* หมายเหตุ: ประเมินความเหมาะสมของดราฟต์จาก Draft Fit และ Player Fit ตามข้อมูลจริง RPL 2026
`;

    navigator.clipboard.writeText(debriefText);
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
        {/* TOP HEADER                                                                */}
        {/* ========================================================================= */}
        <div className="p-3 sm:p-4 bg-[#FFF8FB] border-b border-[#F3D5E2] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E91E63] to-[#D81B60] text-white flex items-center justify-center shadow-md shadow-[#E91E63]/25 flex-shrink-0">
              <FileText size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                  สรุปดราฟต์และการวางแผน (Post-Draft Summary)
                </h2>
                {effectiveIsComplete ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 size={11} />
                    <span>ดราฟต์ครบสมบูรณ์</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                    <AlertTriangle size={11} />
                    <span>กำลังดราฟต์ ({bluePickedCount + redPickedCount}/10)</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-tight truncate mt-0.5">
                {matchMetadata?.tournament ? `${matchMetadata.tournament} • ` : 'RoV RPL 2026 • '}
                {matchMetadata?.match ? `${matchMetadata.match} • Game ${matchMetadata.gameNumber || 1} • ` : 'Game 1 • '}
                {primaryTeamName} vs {secondaryTeamName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Perspective Switcher */}
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
                🛡️ ทีมเรา
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
                ⚔️ คู่แข่ง
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-[#FFF0F5] hover:bg-[#FCE4EC] border border-[#F3D5E2] text-[#E91E63] font-bold text-xs cursor-pointer flex items-center gap-1 transition-colors"
              title="กลับไปหน้าดราฟต์"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">กลับหน้าดราฟ</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer transition-colors"
              title="ปิด"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MAIN SCROLLABLE CONTENT                                                   */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 text-xs custom-scrollbar">

          {/* ----------------------------------------------------------------------- */}
          {/* 1. HEROES CHOSEN (ฮีโร่ที่เลือก) + ASSIGNED PLAYERS (ผู้เล่นที่ได้รับมอบหมาย) */}
          {/*    & BAN HISTORY (BAN/PICK History จากข้อมูลจริง)                        */}
          {/* ----------------------------------------------------------------------- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Blue Team Card */}
            <div className={`p-3.5 rounded-2xl border ${
              blueIsUs ? 'bg-[#F0F9FF]/80 border-[#BAE6FD]' : 'bg-[#FFF8FB] border-[#F3D5E2]'
            } shadow-xs`}>
              <div className="flex items-center justify-between border-b border-sky-100 pb-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">🔵</span>
                  <div>
                    <h3 className="font-bold text-sm text-[#0284C7] leading-tight">
                      {blueTeamName || 'Blue Side'}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {blueIsUs ? '🛡️ ทีมเรา (MCU eSports)' : '⚔️ ทีมคู่แข่ง'} • First Pick
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                  {bluePickedCount}/5 ตัว
                </span>
              </div>

              {/* Bans Section (Real Bans Only) */}
              <div className="mb-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  BAN HISTORY (แบนจริง):
                </span>
                {blueBans && blueBans.filter((b): b is Hero => b !== null).length > 0 ? (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {blueBans
                      .filter((b): b is Hero => b !== null)
                      .map((hero, idx) => (
                        <div
                          key={`blue-ban-${hero.id || idx}`}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-rose-200 shadow-2xs"
                        >
                          <img
                            src={getHeroImageUrl(hero.name)}
                            alt={hero.name}
                            className="w-4 h-4 rounded-full object-cover grayscale"
                          />
                          <span className="text-[11px] font-bold text-rose-800">{hero.name}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">ไม่มีข้อมูลการแบน</span>
                )}
              </div>

              {/* Picks with Assigned Players */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  PICKS & ASSIGNED PLAYERS:
                </span>
                {bluePicks.map((pick, idx) => {
                  const assignedP = blueIsUs && report.ourLineup ? report.ourLineup[idx]?.assignedPlayer : undefined;
                  const isGoldStar = assignedP?.starColor === 'gold';
                  const isSilverStar = assignedP?.starColor === 'silver';

                  return (
                    <div
                      key={`blue-pick-${idx}`}
                      className="p-2 rounded-xl bg-white border border-[#E0F2FE] flex items-center justify-between shadow-2xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-bold text-sky-700 w-7 flex-shrink-0">
                          {pick.pos}
                        </span>
                        {pick.hero ? (
                          <img
                            src={getHeroImageUrl(pick.hero.name)}
                            alt={pick.hero.name}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-[10px] flex-shrink-0">
                            ?
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-xs truncate">
                            {pick.hero ? pick.hero.name : <span className="text-slate-400 font-normal">ยังไม่เลือก</span>}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {LANE_NAMES_TH[pick.pos] || pick.pos}
                          </div>
                        </div>
                      </div>

                      {/* Assigned Player Badge (Items 2) */}
                      <div className="text-right flex-shrink-0 ml-2">
                        {pick.playerNickname ? (
                          <div className="flex items-center gap-1 justify-end">
                            <span className="font-bold text-xs text-slate-800">{pick.playerNickname}</span>
                            {isGoldStar && (
                              <span className="text-amber-500 flex items-center text-[11px]" title="ฮีโร่ถนัด (Signature - ดาวทอง)">
                                ⭐
                              </span>
                            )}
                            {isSilverStar && (
                              <span className="text-slate-400 flex items-center text-[11px]" title="ฮีโร่พอเล่นได้ (Comfort - ดาวเงิน)">
                                ⭐
                              </span>
                            )}
                          </div>
                        ) : assignedP ? (
                          <div className="flex items-center gap-1 justify-end">
                            <span className="font-bold text-xs text-slate-800">{assignedP.nickname}</span>
                            {isGoldStar && <span className="text-amber-500 text-[11px]" title="ดาวทอง">⭐</span>}
                            {isSilverStar && <span className="text-slate-400 text-[11px]" title="ดาวเงิน">⭐</span>}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">ยังไม่ระบุผู้เล่น</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Red Team Card */}
            <div className={`p-3.5 rounded-2xl border ${
              !blueIsUs ? 'bg-[#F0F9FF]/80 border-[#BAE6FD]' : 'bg-[#FFF1F2]/80 border-[#FECDD3]'
            } shadow-xs`}>
              <div className="flex items-center justify-between border-b border-rose-100 pb-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">🔴</span>
                  <div>
                    <h3 className="font-bold text-sm text-[#E11D48] leading-tight">
                      {redTeamName || 'Red Side'}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {!blueIsUs ? '🛡️ ทีมเรา (MCU eSports)' : '⚔️ ทีมคู่แข่ง'} • Counter Pick
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  {redPickedCount}/5 ตัว
                </span>
              </div>

              {/* Bans Section (Real Bans Only) */}
              <div className="mb-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  BAN HISTORY (แบนจริง):
                </span>
                {redBans && redBans.filter((b): b is Hero => b !== null).length > 0 ? (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {redBans
                      .filter((b): b is Hero => b !== null)
                      .map((hero, idx) => (
                        <div
                          key={`red-ban-${hero.id || idx}`}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-rose-200 shadow-2xs"
                        >
                          <img
                            src={getHeroImageUrl(hero.name)}
                            alt={hero.name}
                            className="w-4 h-4 rounded-full object-cover grayscale"
                          />
                          <span className="text-[11px] font-bold text-rose-800">{hero.name}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">ไม่มีข้อมูลการแบน</span>
                )}
              </div>

              {/* Picks with Assigned Players */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  PICKS & ASSIGNED PLAYERS:
                </span>
                {redPicks.map((pick, idx) => {
                  const assignedP = !blueIsUs && report.ourLineup ? report.ourLineup[idx]?.assignedPlayer : undefined;
                  const isGoldStar = assignedP?.starColor === 'gold';
                  const isSilverStar = assignedP?.starColor === 'silver';

                  return (
                    <div
                      key={`red-pick-${idx}`}
                      className="p-2 rounded-xl bg-white border border-[#FFE4E6] flex items-center justify-between shadow-2xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-bold text-rose-700 w-7 flex-shrink-0">
                          {pick.pos}
                        </span>
                        {pick.hero ? (
                          <img
                            src={getHeroImageUrl(pick.hero.name)}
                            alt={pick.hero.name}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-[10px] flex-shrink-0">
                            ?
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-xs truncate">
                            {pick.hero ? pick.hero.name : <span className="text-slate-400 font-normal">ยังไม่เลือก</span>}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {LANE_NAMES_TH[pick.pos] || pick.pos}
                          </div>
                        </div>
                      </div>

                      {/* Assigned Player Badge */}
                      <div className="text-right flex-shrink-0 ml-2">
                        {pick.playerNickname ? (
                          <div className="flex items-center gap-1 justify-end">
                            <span className="font-bold text-xs text-slate-800">{pick.playerNickname}</span>
                            {isGoldStar && <span className="text-amber-500 text-[11px]" title="ดาวทอง">⭐</span>}
                            {isSilverStar && <span className="text-slate-400 text-[11px]" title="ดาวเงิน">⭐</span>}
                          </div>
                        ) : assignedP ? (
                          <div className="flex items-center gap-1 justify-end">
                            <span className="font-bold text-xs text-slate-800">{assignedP.nickname}</span>
                            {isGoldStar && <span className="text-amber-500 text-[11px]" title="ดาวทอง">⭐</span>}
                            {isSilverStar && <span className="text-slate-400 text-[11px]" title="ดาวเงิน">⭐</span>}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">ยังไม่ระบุผู้เล่น</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* 2. CORE EXECUTIVE HIGHLIGHT CARDS (Items 4, 5, 6, 7)                     */}
          {/*    - จุดแข็งของทีมเรา                                                    */}
          {/*    - จุดเสี่ยงสำคัญ (Safety Check)                                       */}
          {/*    - แผนการเล่นที่แนะนำ (Win Condition & Plan)                           */}
          {/*    - สิ่งที่ต้องระวังจากคู่แข่ง (Enemy Threats)                           */}
          {/* ----------------------------------------------------------------------- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* 4. จุดแข็งของทีมเรา */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/60 to-white border border-emerald-200 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  🟢
                </div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                  จุดแข็งของทีมเรา (Tactical Strengths)
                </h4>
              </div>
              {report.compStrengths.length > 0 ? (
                <ul className="space-y-1.5 pl-1">
                  {report.compStrengths.map((str, idx) => (
                    <li key={`str-${idx}`} className="text-slate-700 text-xs flex items-start gap-1.5 leading-relaxed">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400 text-xs italic">ไม่มีข้อมูลจุดแข็งที่ระบุ</p>
              )}
            </div>

            {/* 5. จุดเสี่ยงสำคัญ */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-50/60 to-white border border-rose-200 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  🔴
                </div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                  จุดเสี่ยงสำคัญ (Key Risks & Safety)
                </h4>
              </div>
              {report.compWeaknesses.length > 0 ? (
                <ul className="space-y-1.5 pl-1">
                  {report.compWeaknesses.map((weak, idx) => (
                    <li key={`weak-${idx}`} className="text-slate-700 text-xs flex items-start gap-1.5 leading-relaxed">
                      <span className="text-rose-500 mt-0.5">•</span>
                      <span>{weak}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-emerald-700 text-xs flex items-center gap-1.5 font-medium">
                  <CheckCircle2 size={13} className="text-emerald-500" />
                  <span>สมดุลทีมอยู่ในเกณฑ์ดี ไม่มีจุดเสี่ยงวิกฤต</span>
                </p>
              )}
            </div>

            {/* 6. แผนการเล่นที่แนะนำ */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/60 to-white border border-indigo-200 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  🎯
                </div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                  แผนการเล่นที่แนะนำ (Macro Win Condition)
                </h4>
              </div>
              <div className="space-y-2">
                <div className="p-2 rounded-xl bg-indigo-50/70 border border-indigo-100">
                  <span className="text-[10px] font-bold text-indigo-800 uppercase block">เงื่อนไขการชนะหลัก:</span>
                  <p className="font-bold text-slate-900 text-xs mt-0.5 leading-relaxed">
                    {report.gamePlan?.primaryPlan || report.ourStrategicOverview || 'คุมจังหวะไฟต์ตามพาวเวอร์สไปค์'}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="p-1.5 rounded-lg bg-white border border-indigo-100">
                    <span className="text-[9px] font-bold text-indigo-600 block">ต้นเกม (0-4m)</span>
                    <span className="text-[10px] text-slate-700 line-clamp-2 mt-0.5">{report.earlyGame.focus}</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white border border-indigo-100">
                    <span className="text-[9px] font-bold text-indigo-600 block">กลางเกม (4-10m)</span>
                    <span className="text-[10px] text-slate-700 line-clamp-2 mt-0.5">{report.midGame.focus}</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white border border-indigo-100">
                    <span className="text-[9px] font-bold text-indigo-600 block">เลทเกม (10m+)</span>
                    <span className="text-[10px] text-slate-700 line-clamp-2 mt-0.5">{report.lateGame.focus}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 7. สิ่งที่ต้องระวังจากคู่แข่ง */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50/60 to-white border border-amber-200 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  ⚔️
                </div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                  สิ่งที่ต้องระวังจากคู่แข่ง (Enemy Watchouts)
                </h4>
              </div>
              {report.gamePlan?.oppThreatWatchouts && report.gamePlan.oppThreatWatchouts.length > 0 ? (
                <ul className="space-y-1.5 pl-1">
                  {report.gamePlan.oppThreatWatchouts.map((threat, idx) => (
                    <li key={`threat-${idx}`} className="text-slate-700 text-xs flex items-start gap-1.5 leading-relaxed">
                      <span className="text-amber-500 mt-0.5">⚠️</span>
                      <span>{threat}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 text-xs leading-relaxed">
                  ระวังจังหวะเข้าทำและ CC เชนของคู่แข่ง รักษาระยะห่างของแครี่แนวหลังในไฟต์ใหญ่
                </p>
              )}
            </div>
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* 3. EXPANDABLE DEEP-DIVE ACCORDIONS                                      */}
          {/* ----------------------------------------------------------------------- */}

          {/* ACCORDION 1: แผนการเล่น 3 ช่วงเวลา & กฎการเข้าไฟต์แบบละเอียด */}
          <div className="border border-[#F3D5E2] rounded-2xl bg-white overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => setIsPlaybookExpanded(!isPlaybookExpanded)}
              className="w-full p-3.5 bg-[#FFF8FB] hover:bg-[#FFF0F5] flex items-center justify-between text-left cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-[#E91E63]" />
                <span className="font-bold text-slate-900 text-xs sm:text-sm">
                  1. แผนการเล่น 3 ช่วงเวลาแบบละเอียด & กฎการเข้าไฟต์ (Phase Playbook)
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <span className="text-[11px] font-medium hidden sm:inline">
                  {isPlaybookExpanded ? 'ย่อรายละเอียด' : 'ดูรายละเอียด'}
                </span>
                {isPlaybookExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>

            {isPlaybookExpanded && (
              <div className="p-4 space-y-4 border-t border-[#F3D5E2] animate-in fade-in duration-150">
                {/* 3 Phases Detailed */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Early Game */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">🕒 ต้นเกม (0-4 นาที)</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800">Lane Setup</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{report.earlyGame.focus}</p>
                    {report.earlyGame.objectives && report.earlyGame.objectives.length > 0 && (
                      <div className="pt-1.5 border-t border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 block mb-1">เป้าหมายหลัก:</span>
                        <ul className="space-y-1">
                          {report.earlyGame.objectives.map((obj, i) => (
                            <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1">
                              <span className="text-sky-500">•</span>
                              <span>{obj}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Mid Game */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">🕒 กลางเกม (4-10 นาที)</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">Macro & Siege</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{report.midGame.focus}</p>
                    {report.midGame.objectives && report.midGame.objectives.length > 0 && (
                      <div className="pt-1.5 border-t border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 block mb-1">เป้าหมายหลัก:</span>
                        <ul className="space-y-1">
                          {report.midGame.objectives.map((obj, i) => (
                            <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1">
                              <span className="text-indigo-500">•</span>
                              <span>{obj}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Late Game */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">🕒 เลทเกม (10+ นาที)</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">Slayer & End</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{report.lateGame.focus}</p>
                    {report.lateGame.objectives && report.lateGame.objectives.length > 0 && (
                      <div className="pt-1.5 border-t border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 block mb-1">เป้าหมายหลัก:</span>
                        <ul className="space-y-1">
                          {report.lateGame.objectives.map((obj, i) => (
                            <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1">
                              <span className="text-purple-500">•</span>
                              <span>{obj}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Teamfight Rules */}
                {report.gamePlan?.teamfightRules && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                        <CheckCircle2 size={13} />
                        <span>เงื่อนไขที่ควรเปิดไฟต์ (When to Fight):</span>
                      </div>
                      <ul className="space-y-1">
                        {report.gamePlan.teamfightRules.whenToFight.map((rule, idx) => (
                          <li key={idx} className="text-slate-700 text-[11px] flex items-start gap-1">
                            <span className="text-emerald-600">•</span>
                            <span>{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs">
                        <AlertTriangle size={13} />
                        <span>เงื่อนไขที่ควรเลี่ยงไฟต์ (When to Avoid):</span>
                      </div>
                      <ul className="space-y-1">
                        {report.gamePlan.teamfightRules.whenToAvoid.map((rule, idx) => (
                          <li key={idx} className="text-slate-700 text-[11px] flex items-start gap-1">
                            <span className="text-rose-600">•</span>
                            <span>{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ACCORDION 2: สมดุลทีมและสถิติจริง RPL 2026 */}
          <div className="border border-[#F3D5E2] rounded-2xl bg-white overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => setIsBalanceExpanded(!isBalanceExpanded)}
              className="w-full p-3.5 bg-[#FFF8FB] hover:bg-[#FFF0F5] flex items-center justify-between text-left cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-[#E91E63]" />
                <span className="font-bold text-slate-900 text-xs sm:text-sm">
                  2. สมดุลองค์ประกอบทีมและสถิติจริง RPL 2026 (Team Balance & Pro Stats)
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <span className="text-[11px] font-medium hidden sm:inline">
                  {isBalanceExpanded ? 'ย่อรายละเอียด' : 'ดูรายละเอียด'}
                </span>
                {isBalanceExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>

            {isBalanceExpanded && (
              <div className="p-4 space-y-4 border-t border-[#F3D5E2] animate-in fade-in duration-150">
                {/* Balance Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Frontline */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      ตัวชนแนวหน้า (Frontline)
                    </span>
                    <div className="font-bold text-slate-800 text-xs">
                      {report.compositionReview?.ourComp.frontline.details || 'มีตัวรับดาเมจตามตำแหน่ง'}
                    </div>
                  </div>

                  {/* Hard CC */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      การควบคุม/สตัน (Hard CC)
                    </span>
                    <div className="font-bold text-slate-800 text-xs">
                      {report.compositionReview?.ourComp.hardCc.details || 'มีสกิลหยุดจังหวะในทีมไฟต์'}
                    </div>
                  </div>

                  {/* Damage Split */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      สัดส่วนดาเมจ (Damage Split)
                    </span>
                    <div className="font-bold text-slate-800 text-xs">
                      กายภาพ {report.compositionReview?.ourComp.damageSplit.physical ?? 55}% / เวท {report.compositionReview?.ourComp.damageSplit.magic ?? 45}%
                    </div>
                  </div>
                </div>

                {/* Liquipedia RPL 2026 Citation & Integrity Note */}
                <div className="p-3 rounded-xl bg-[#FFF8FB] border border-[#F3D5E2] flex items-start gap-2.5">
                  <Info size={16} className="text-[#E91E63] flex-shrink-0 mt-0.5" />
                  <div className="text-[11px] text-slate-600 leading-relaxed">
                    <span className="font-bold text-slate-800 block mb-0.5">
                      หลักการประเมินสถิติและการจัดดราฟต์:
                    </span>
                    ระบบให้ความสำคัญกับ <span className="font-bold text-[#E91E63]">Draft Fit (ความเข้ากันของคอมโบ)</span> และ <span className="font-bold text-[#E91E63]">Player Fit (ความถนัดของนักแข่ง)</span> มากกว่าตัวเลข Win Rate รวมเพียงอย่างเดียว ข้อมูลอ้างอิงเฉพาะฮีโร่ที่มีสถิติจริงจาก Liquipedia RPL 2026 Summer และ Winter เท่านั้น (หากไม่มีสถิติจะแสดง 'ไม่มีข้อมูล' โดยไม่แต่งเติม)
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ACCORDION 3: บันทึกสำหรับการซ้อม (Practice & Scrim Notes) (Item 8) */}
          <div className="border border-[#F3D5E2] rounded-2xl bg-white overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => setIsNotesExpanded(!isNotesExpanded)}
              className="w-full p-3.5 bg-[#FFF8FB] hover:bg-[#FFF0F5] flex items-center justify-between text-left cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <Target size={16} className="text-[#E91E63]" />
                <span className="font-bold text-slate-900 text-xs sm:text-sm">
                  3. บันทึกสำหรับการซ้อมและข้อตกลงในทีม (Coach Practice Notes)
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  ไม่บังคับกรอก
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <span className="text-[11px] font-medium hidden sm:inline">
                  {isNotesExpanded ? 'ย่อบันทึก' : 'เปิดบันทึก'}
                </span>
                {isNotesExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>

            {isNotesExpanded && (
              <div className="p-4 space-y-3.5 border-t border-[#F3D5E2] animate-in fade-in duration-150">
                <p className="text-[11px] text-slate-500">
                  บันทึกสำหรับโค้ชและนักแข่งเพื่อใช้ทบทวนระหว่างหรือหลังการซ้อม (Scrim) ระบบแยกเซสชันตามแมตช์และเกมอัตโนมัติ
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      แผนการเล่นที่ตั้งใจซ้อม (Target Plan)
                    </label>
                    <input
                      type="text"
                      value={coachNotes.targetPlan || ''}
                      onChange={(e) => setCoachNotes({ ...coachNotes, targetPlan: e.target.value })}
                      placeholder="เช่น เน้นบุกอินเวดป่าบนช่วง 2 นาทีแรก..."
                      className="p-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-[#E91E63]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      ข้อตกลงการสื่อสาร (Player Communication)
                    </label>
                    <input
                      type="text"
                      value={coachNotes.playerCommunication || ''}
                      onChange={(e) => setCoachNotes({ ...coachNotes, playerCommunication: e.target.value })}
                      placeholder="เช่น ให้โรมคอลเป้าหมายหลักคนเดียว..."
                      className="p-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-[#E91E63]"
                    />
                  </div>

                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-700">
                      วัตถุประสงค์การซ้อมเฉพาะเกมนี้ (Scrim Objectives)
                    </label>
                    <input
                      type="text"
                      value={coachNotes.scrimObjectives || ''}
                      onChange={(e) => setCoachNotes({ ...coachNotes, scrimObjectives: e.target.value })}
                      placeholder="เช่น ทดสอบคอมโบดึงจังหวะของแครี่ตัวใหม่..."
                      className="p-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-[#E91E63]"
                    />
                  </div>

                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-700">
                      ข้อสังเกตเพิ่มเติม (Additional Observations)
                    </label>
                    <textarea
                      value={coachNotes.additionalObservations || ''}
                      onChange={(e) => setCoachNotes({ ...coachNotes, additionalObservations: e.target.value })}
                      placeholder="เช่น ไฟต์ดรากอนตัวแรกคุมตำแหน่งได้ดีมาก..."
                      rows={2}
                      className="p-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-[#E91E63]"
                    />
                  </div>
                </div>

                {/* Save Button & Feedback Notice */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-bold text-emerald-700">
                    {notesSaveNotice && `✅ ${notesSaveNotice}`}
                  </span>
                  <button
                    type="button"
                    onClick={handleSaveNotes}
                    className="px-4 py-2 bg-[#E91E63] hover:bg-[#D81B60] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
                  >
                    <Save size={13} />
                    <span>บันทึกโน้ตการซ้อม</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ========================================================================= */}
        {/* FOOTER ACTIONS                                                            */}
        {/* ========================================================================= */}
        <div className="p-3 bg-white border-t border-[#F3D5E2] flex items-center justify-between flex-shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyTextReport}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              title="คัดลอกสรุปข้อความสำหรับส่งให้ทีมใน Discord หรือ LINE"
            >
              <Copy size={13} />
              <span>{copied ? 'คัดลอกสำเร็จแล้ว!' : 'คัดลอกสรุป (Copy Text)'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:flex px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              title="พิมพ์รายงานหรือบันทึกเป็น PDF"
            >
              <Printer size={13} />
              <span>พิมพ์ / PDF</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#E91E63] to-[#D81B60] hover:from-[#D81B60] hover:to-[#C2185B] text-white shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            <span>กลับไปหน้าดราฟ</span>
          </button>
        </div>

      </div>
    </div>
  );
};
