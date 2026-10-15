import React, { useState, useMemo } from 'react';
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
  Download,
  Info,
} from 'lucide-react';
import { Hero, LaneSelectKey } from '../types/draft';
import { generatePostDraftReport } from '../services/postDraftReportService';
import { getHeroImageUrl } from '../data/heroes';

interface PostDraftReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  blueTeamName: string;
  redTeamName: string;
  bluePicks: Array<{ hero: Hero | null; pos: LaneSelectKey }>;
  redPicks: Array<{ hero: Hero | null; pos: LaneSelectKey }>;
}

export const PostDraftReportModal: React.FC<PostDraftReportModalProps> = ({
  isOpen,
  onClose,
  blueTeamName,
  redTeamName,
  bluePicks,
  redPicks,
}) => {
  const [selectedSide, setSelectedSide] = useState<'blue' | 'red'>('blue');
  const [coachCustomNotes, setCoachCustomNotes] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Generate Report data
  const report = useMemo(() => {
    return generatePostDraftReport(
      selectedSide,
      blueTeamName,
      redTeamName,
      selectedSide === 'blue' ? bluePicks : redPicks,
      selectedSide === 'blue' ? redPicks : bluePicks
    );
  }, [selectedSide, blueTeamName, redTeamName, bluePicks, redPicks]);

  if (!isOpen) return null;

  const handleCopyTextReport = () => {
    const text = `=== MCU ESPORTS: POST-DRAFT STRATEGIC REPORT ===
ทีมที่วิเคราะห์: ${selectedSide === 'blue' ? blueTeamName || 'Blue Side' : redTeamName || 'Red Side'} (${selectedSide.toUpperCase()})
ดาเมจ: กายภาพ ${report.damageDistribution.physicalPct}% | เวทมนตร์ ${report.damageDistribution.magicalPct}% | ทรูดาเมจ ${report.damageDistribution.trueDamagePct}% (${report.damageDistribution.primaryDamageProfile})

[จุดแข็งหลัก]
${report.strengths.map((s) => `• ${s.title}: ${s.description}`).join('\n')}

[จุดอ่อนและความเสี่ยง]
${report.weaknesses.map((w) => `• [${w.severity.toUpperCase()}] ${w.title}: ${w.description}`).join('\n')}

[จังหวะเกม]
• ต้นเกม: ${report.earlyGame.rating} (${report.earlyGame.details})
• มิดเกม: ${report.midGame.rating} (${report.midGame.details})
• เลทเกม: ${report.lateGame.rating} (${report.lateGame.details})

[เงื่อนไขการชนะไฟต์ (Win Conditions)]
${report.winConditions.map((c) => `${c.step}. ${c.title} — ${c.description}`).join('\n')}

${report.disclaimer}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs font-['Prompt']">
      <div className="bg-white border-2 border-[#F3D5E2] rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="p-3.5 sm:p-4 bg-[#FFF8FB] border-b border-[#F3D5E2] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E91E63] to-[#D81B60] text-white flex items-center justify-center shadow-md shadow-[#E91E63]/25 flex-shrink-0">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  Post-Draft Strategic Report (รายงานสรุปผลดราฟต์)
                </h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#FCE4EC] text-[#E91E63] border border-[#F8BBD0]">
                  Pro Analyst
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-tight">
                วิเคราะห์คอมโพซิชัน จุดแข็ง จุดอ่อน ไทม์ไลน์ และเงื่อนไขการชนะไฟต์
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Side Switcher */}
            <div className="flex items-center bg-white border border-[#F3D5E2] rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={() => setSelectedSide('blue')}
                className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                  selectedSide === 'blue'
                    ? 'bg-[#0284C7] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🔵 {blueTeamName || 'Blue Side'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedSide('red')}
                className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                  selectedSide === 'red'
                    ? 'bg-[#E11D48] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🔴 {redTeamName || 'Red Side'}
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Report Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4 custom-scrollbar text-slate-800">
          {/* Disclaimer Banner */}
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2 shadow-2xs">
            <Info size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed text-[11px] font-medium">
              {report.disclaimer}
            </span>
          </div>

          {/* 1. Lineup & Damage Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
            {/* Lineup (7 cols) */}
            <div className="md:col-span-7 bg-[#FFF8FB] border border-[#F3D5E2] rounded-2xl p-3.5 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                <Layers size={14} className="text-[#E91E63]" />
                <span>Team Composition Lineup (ฮีโร่และสายดาเมจ)</span>
              </span>

              <div className="grid grid-cols-5 gap-1.5 pt-1">
                {report.lineup.map((h, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-white border border-[#F3D5E2] flex flex-col items-center text-center shadow-2xs"
                  >
                    <span className="text-[9px] font-black text-slate-600 mb-1">
                      {h.position}
                    </span>
                    <img
                      src={h.avatarUrl}
                      alt={h.heroName}
                      className="w-10 h-10 rounded-lg object-cover border border-[#F3D5E2] shadow-2xs"
                    />
                    <span className="text-xs font-bold text-slate-900 mt-1 truncate max-w-full">
                      {h.heroName}
                    </span>
                    <span
                      className={`text-[8.5px] font-semibold px-1 py-0.2 rounded mt-0.5 ${
                        h.damageType === 'Magical'
                          ? 'bg-purple-100 text-purple-800'
                          : h.damageType === 'True'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {h.damageType}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Damage Distribution & Profile (5 cols) */}
            <div className="md:col-span-5 bg-[#FFF8FB] border border-[#F3D5E2] rounded-2xl p-3.5 flex flex-col justify-between gap-2">
              <span className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                <Zap size={14} className="text-amber-500" />
                <span>Damage Distribution & Style</span>
              </span>

              {/* Progress bar split */}
              <div className="flex flex-col gap-1.5">
                <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-200">
                  <div
                    style={{ width: `${report.damageDistribution.physicalPct}%` }}
                    className="bg-[#0284C7] h-full"
                    title={`Physical: ${report.damageDistribution.physicalPct}%`}
                  />
                  <div
                    style={{ width: `${report.damageDistribution.magicalPct}%` }}
                    className="bg-[#A855F7] h-full"
                    title={`Magical: ${report.damageDistribution.magicalPct}%`}
                  />
                  <div
                    style={{ width: `${report.damageDistribution.trueDamagePct}%` }}
                    className="bg-[#F59E0B] h-full"
                    title={`True Damage: ${report.damageDistribution.trueDamagePct}%`}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-[#0284C7]">
                    กายภาพ {report.damageDistribution.physicalPct}%
                  </span>
                  <span className="text-[#A855F7]">
                    เวท {report.damageDistribution.magicalPct}%
                  </span>
                  <span className="text-[#F59E0B]">
                    ทรูดาเมจ {report.damageDistribution.trueDamagePct}%
                  </span>
                </div>
              </div>

              {/* Profile Badge */}
              <div className="p-2 rounded-xl bg-white border border-[#F3D5E2] flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">สไตล์ดาเมจหลัก:</span>
                <span className="font-bold text-[#E91E63]">
                  {report.damageDistribution.primaryDamageProfile}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Strengths */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-200 flex flex-col gap-2">
              <span className="text-xs font-bold text-emerald-900 uppercase flex items-center gap-1.5">
                <CheckCircle size={15} className="text-emerald-600" />
                <span>จุดแข็งของคอมโพซิชัน (Team Strengths)</span>
              </span>

              <div className="flex flex-col gap-2">
                {report.strengths.map((s, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-white border border-emerald-100 flex flex-col gap-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{s.title}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                        {s.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{s.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Weaknesses */}
            <div className="p-3.5 rounded-2xl bg-rose-50/40 border border-rose-200 flex flex-col gap-2">
              <span className="text-xs font-bold text-rose-900 uppercase flex items-center gap-1.5">
                <AlertTriangle size={15} className="text-rose-600" />
                <span>จุดอ่อนและความเสี่ยง (Tactical Vulnerabilities)</span>
              </span>

              <div className="flex flex-col gap-2">
                {report.weaknesses.map((w, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-white border border-rose-100 flex flex-col gap-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{w.title}</span>
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                          w.severity === 'high'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {w.severity.toUpperCase()} RISK
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{w.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Early / Mid / Late Game Considerations */}
          <div className="bg-[#FFF8FB] border border-[#F3D5E2] rounded-2xl p-3.5 flex flex-col gap-2.5">
            <span className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
              <Clock size={14} className="text-purple-600" />
              <span>Early / Mid / Late Game Timeline (ไทม์ไลน์และพาวเวอร์สไปก์)</span>
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {/* Early */}
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">ต้นเกม (Early Game)</span>
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                      report.earlyGame.rating === 'Strong'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {report.earlyGame.rating}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">{report.earlyGame.timing}</span>
                <p className="text-[11px] text-slate-600 leading-relaxed mt-1">{report.earlyGame.details}</p>
              </div>

              {/* Mid */}
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">มิดเกม (Mid Game)</span>
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                      report.midGame.rating === 'Strong'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {report.midGame.rating}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">{report.midGame.timing}</span>
                <p className="text-[11px] text-slate-600 leading-relaxed mt-1">{report.midGame.details}</p>
              </div>

              {/* Late */}
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">เลทเกม (Late Game)</span>
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                      report.lateGame.rating === 'Strong'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {report.lateGame.rating}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">{report.lateGame.timing}</span>
                <p className="text-[11px] text-slate-600 leading-relaxed mt-1">{report.lateGame.details}</p>
              </div>
            </div>
          </div>

          {/* 4. Tactical Capabilities (Engage, Peel, Objective Control) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Engage Options */}
            <div className="p-3 rounded-2xl bg-white border border-[#F3D5E2] flex flex-col gap-1.5">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Swords size={13} className="text-[#E91E63]" />
                <span>Engage Options (การเปิดไฟต์)</span>
              </span>
              <div className="text-[11px] text-slate-500">
                ตัวเปิดหลัก: {report.engageOptions.primary.join(', ') || 'ไม่มีตัวเปิดตายตัว'}
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">{report.engageOptions.description}</p>
            </div>

            {/* Peel Options */}
            <div className="p-3 rounded-2xl bg-white border border-[#F3D5E2] flex flex-col gap-1.5">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Shield size={13} className="text-[#0284C7]" />
                <span>Peel Options (การปกป้องแครี่)</span>
              </span>
              <div className="text-[11px] text-slate-500">
                ตัวสกรีน: {report.peelOptions.frontliners.join(', ')}
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">{report.peelOptions.description}</p>
            </div>

            {/* Objective Control */}
            <div className="p-3 rounded-2xl bg-white border border-[#F3D5E2] flex flex-col gap-1.5">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <TrendingUp size={13} className="text-emerald-600" />
                <span>Objective Control (ความเร็วมังกร/คอง)</span>
              </span>
              <div className="text-[11px] text-slate-500">
                ความเร็วเก็บ Dark Slayer: <span className="font-bold text-slate-800">{report.objectiveControl.slayerBurst}</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">{report.objectiveControl.details}</p>
            </div>
          </div>

          {/* 5. Tactical Win Conditions */}
          <div className="bg-[#FFF8FB] border border-[#F3D5E2] rounded-2xl p-3.5 flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
              <span>🎯</span>
              <span>Tactical Win Conditions (เงื่อนไขและวิธีชนะตามแผน)</span>
            </span>

            <div className="flex flex-col gap-1.5">
              {report.winConditions.map((c) => (
                <div key={c.step} className="p-2.5 rounded-xl bg-white border border-[#F3D5E2] flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#E91E63] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {c.step}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900 leading-tight">{c.title}</span>
                    <span className="text-[11px] text-slate-600 leading-relaxed">{c.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 6. Coach Custom Notes */}
          <div className="bg-white border border-[#F3D5E2] rounded-2xl p-3.5 flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>✍️</span>
              <span>Coach Debrief Notes (บันทึกหลังดราฟต์ของโค้ช)</span>
            </label>
            <textarea
              value={coachCustomNotes}
              onChange={(e) => setCoachCustomNotes(e.target.value)}
              placeholder="บันทึกข้อสรุปที่จะบรีฟนักกีฬาก่อนเริ่มเกม..."
              rows={2}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-[#E91E63] outline-none bg-slate-50/50 text-slate-800"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-white border-t border-[#F3D5E2] flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={handleCopyTextReport}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <Copy size={13} />
            <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอกเป็นข้อความ'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold rounded-xl bg-[#E91E63] text-white hover:bg-[#D81B60] shadow-xs cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
