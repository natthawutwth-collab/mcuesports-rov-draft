import React, { useState } from 'react';
import { X, Upload, Download, Globe, RefreshCw, CheckCircle2, AlertCircle, ExternalLink, Calendar } from 'lucide-react';
import { statsDataProvider, AUTHORIZED_SOURCES } from '../services/statsDataProvider';
import { DataSourceStatus, ActiveSeasonKey } from '../types/stats';

interface StatsImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: DataSourceStatus;
}

export const StatsImportExportModal: React.FC<StatsImportExportModalProps> = ({
  isOpen,
  onClose,
  status,
}) => {
  const [activeTab, setActiveTab] = useState<'seasons' | 'json' | 'csv' | 'api'>('seasons');
  const [jsonText, setJsonText] = useState('');
  const [heroesCsv, setHeroesCsv] = useState('');
  const [matchupsCsv, setMatchupsCsv] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isLoadingApi, setIsLoadingApi] = useState(false);

  if (!isOpen) return null;

  const handleSelectSeason = (seasonKey: ActiveSeasonKey) => {
    statsDataProvider.setActiveSeason(seasonKey);
    setFeedback({
      type: 'success',
      message: `เปลี่ยนชุดข้อมูลเป็นทางการ: ${
        seasonKey === 'summer_2026'
          ? 'RoV Pro League 2026 Summer'
          : seasonKey === 'winter_2026'
          ? 'RoV Pro League 2026 Winter'
          : 'RoV Pro League 2026 Combined (Summer + Winter)'
      } เรียบร้อย!`,
    });
  };

  const handleImportJson = () => {
    if (!jsonText.trim()) {
      setFeedback({ type: 'error', message: 'กรุณากรอก JSON ข้อมูลสถิติ' });
      return;
    }
    const ok = statsDataProvider.loadFromJson(jsonText.trim());
    if (ok) {
      setFeedback({ type: 'success', message: 'นำเข้าข้อมูล JSON สถิติสำเร็จเรียบร้อย!' });
      setTimeout(() => onClose(), 1200);
    } else {
      setFeedback({ type: 'error', message: 'รูปแบบ JSON ไม่ถูกต้อง กรุณาตรวจสอบ Schema' });
    }
  };

  const handleImportCsv = () => {
    if (!heroesCsv.trim()) {
      setFeedback({ type: 'error', message: 'กรุณากรอก CSV ข้อมูล Hero Statistics' });
      return;
    }
    const ok = statsDataProvider.loadFromCsv(heroesCsv.trim(), matchupsCsv.trim());
    if (ok) {
      setFeedback({ type: 'success', message: 'นำเข้าข้อมูล CSV สถิติสำเร็จเรียบร้อย!' });
      setTimeout(() => onClose(), 1200);
    } else {
      setFeedback({ type: 'error', message: 'รูปแบบ CSV ไม่ถูกต้อง กรุณาตรวจสอบคอลัมน์' });
    }
  };

  const handleFetchApi = async () => {
    if (!apiUrl.trim()) {
      setFeedback({ type: 'error', message: 'กรุณาระบุ URL ของ API' });
      return;
    }
    setIsLoadingApi(true);
    setFeedback(null);
    const ok = await statsDataProvider.loadFromApi(apiUrl.trim());
    setIsLoadingApi(false);
    if (ok) {
      setFeedback({ type: 'success', message: 'ดึงข้อมูลสถิติจาก API สำเร็จ!' });
      setTimeout(() => onClose(), 1200);
    } else {
      setFeedback({ type: 'error', message: 'ไม่สามารถเชื่อมต่อ API หรือรูปแบบข้อมูลไม่ถูกต้อง' });
    }
  };

  const handleExportJson = () => {
    const json = statsDataProvider.exportToJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rov_stats_${status.tournamentName.replace(/\s+/g, '_').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const { heroesCsv: hCsv, matchupsCsv: mCsv } = statsDataProvider.exportToCsv();
    const blob = new Blob([hCsv + '\n\n# MATCHUPS DATA\n' + mCsv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rov_stats_${status.tournamentName.replace(/\s+/g, '_').toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    statsDataProvider.resetToDefault();
    setFeedback({ type: 'success', message: 'รีเซ็ตกลับเป็นข้อมูลทางการ RoV Pro League 2026 เรียบร้อย' });
    setTimeout(() => onClose(), 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200 font-['Prompt']">
      <div className="w-full max-w-2xl bg-white border-2 border-[#F3D5E2] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#1F2937]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F3D5E2] bg-[#FFF0F5]">
          <div className="flex items-center gap-2">
            <span className="font-['Orbitron'] font-bold text-base tracking-wider text-[#1F2937]">
              📊 LIQUIPEDIA DATA & STATS MANAGER
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors shadow-2xs cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Data Integrity Notice Banner */}
        <div className="p-3 bg-amber-50 border-b border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
          <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="font-bold">กฎความถูกต้องของข้อมูล (Strict Data Integrity):</span>
            <span>
              ระบบอนุญาตให้ใช้สถิติการแข่งขันจาก Liquipedia RoV Pro League 2026 (Summer & Winter) เท่านั้น ห้ามสร้างข้อมูลจำลอง และหากไม่มีข้อมูลจะแสดงว่าไม่มีข้อมูลอย่างโปร่งใส
            </span>
          </div>
        </div>

        {/* Current Status Info */}
        <div className="p-4 bg-[#FFF8FB] border-b border-[#F3D5E2] flex items-center justify-between flex-wrap gap-2">
          <div className="flex flex-col">
            <div className="text-[11px] font-['Prompt'] font-semibold text-slate-500 uppercase tracking-wider">
              แหล่งข้อมูลปัจจุบัน (Active Dataset)
            </div>
            <div className="text-sm font-['Orbitron'] font-bold text-[#1F2937]">
              {status.tournamentName}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5">
              รวม {status.totalGames} เกมแข่งขัน
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-['Prompt'] flex-wrap">
            <span className="px-2 py-1 rounded-lg bg-sky-50 border border-sky-300 text-[#0284C7] font-semibold">
              🎮 {status.heroCount} Heroes Tracked
            </span>
            <span className="px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 font-semibold">
              ⚔ {status.matchupCount} H2H Records
            </span>
            {status.isCustomLoaded && (
              <span className="px-2 py-1 rounded-lg bg-rose-50 border border-rose-300 text-rose-700 font-semibold">
                Custom Data
              </span>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-[#F3D5E2] bg-white px-4 pt-2 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => { setActiveTab('seasons'); setFeedback(null); }}
            className={`px-3 py-2 text-xs font-['Prompt'] font-bold tracking-wider rounded-t-lg transition-colors border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'seasons'
                ? 'border-[#E91E63] text-[#E91E63] bg-[#FFF0F5]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            🏆 OFFICIAL SEASONS
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('json'); setFeedback(null); }}
            className={`px-3 py-2 text-xs font-['Prompt'] font-bold tracking-wider rounded-t-lg transition-colors border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'json'
                ? 'border-[#E91E63] text-[#E91E63] bg-[#FFF0F5]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            JSON DATA
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('csv'); setFeedback(null); }}
            className={`px-3 py-2 text-xs font-['Prompt'] font-bold tracking-wider rounded-t-lg transition-colors border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'csv'
                ? 'border-[#E91E63] text-[#E91E63] bg-[#FFF0F5]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            CSV SPREADSHEET
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('api'); setFeedback(null); }}
            className={`px-3 py-2 text-xs font-['Prompt'] font-bold tracking-wider rounded-t-lg transition-colors border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'api'
                ? 'border-[#E91E63] text-[#E91E63] bg-[#FFF0F5]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            REST API
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 font-['Prompt']">
          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`p-3 rounded-lg mb-4 text-xs font-semibold flex items-center gap-2 border ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-rose-50 text-rose-800 border-rose-300'
              }`}
            >
              {feedback.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* TAB: OFFICIAL SEASONS */}
          {activeTab === 'seasons' && (
            <div className="flex flex-col gap-4">
              <span className="text-xs font-bold text-slate-700">
                เลือกฤดูกาลแข่งขันอย่างเป็นทางการ (Official Liquipedia Datasets):
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Summer 2026 Card */}
                <div className="p-3.5 rounded-xl border-2 border-slate-200 hover:border-[#E91E63] bg-white transition-all flex flex-col justify-between gap-3 shadow-xs">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-extrabold text-slate-900">
                      RPL 2026 Summer
                    </span>
                    <span className="text-[11px] text-slate-500">
                      291 Games • 95 Heroes Tracked
                    </span>
                    <a
                      href={AUTHORIZED_SOURCES.summer.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-[#0284C7] hover:underline flex items-center gap-1 mt-1"
                    >
                      <span>ดู Liquipedia ต้นทาง</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                  <button
                    onClick={() => handleSelectSeason('summer_2026')}
                    className="w-full py-1.5 rounded-lg bg-[#E91E63] hover:bg-[#D81B60] text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    ใช้งานชุดข้อมูลนี้
                  </button>
                </div>

                {/* Winter 2026 Card */}
                <div className="p-3.5 rounded-xl border-2 border-slate-200 hover:border-[#E91E63] bg-white transition-all flex flex-col justify-between gap-3 shadow-xs">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-extrabold text-slate-900">
                      RPL 2026 Winter
                    </span>
                    <span className="text-[11px] text-slate-500">
                      285 Games • 92 Heroes Tracked
                    </span>
                    <a
                      href={AUTHORIZED_SOURCES.winter.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-[#0284C7] hover:underline flex items-center gap-1 mt-1"
                    >
                      <span>ดู Liquipedia ต้นทาง</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                  <button
                    onClick={() => handleSelectSeason('winter_2026')}
                    className="w-full py-1.5 rounded-lg bg-[#E91E63] hover:bg-[#D81B60] text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    ใช้งานชุดข้อมูลนี้
                  </button>
                </div>

                {/* Combined 2026 Card */}
                <div className="p-3.5 rounded-xl border-2 border-[#89114D] bg-[#FFF8FB] transition-all flex flex-col justify-between gap-3 shadow-xs">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-extrabold text-[#89114D]">
                      สถิติรวม 2 ฤดูกาล (แนะนำ)
                    </span>
                    <span className="text-[11px] text-slate-600">
                      576 Games • คำนวณผลรวม W/L จริง
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold mt-1">
                      ✓ รวมตัวเลขชนะแพ้ถูกต้อง 100%
                    </span>
                  </div>
                  <button
                    onClick={() => handleSelectSeason('combined_2026')}
                    className="w-full py-1.5 rounded-lg bg-[#89114D] hover:bg-[#720e40] text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    ใช้งานชุดข้อมูลรวม
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: JSON */}
          {activeTab === 'json' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">
                  โครงสร้าง Tournament Dataset JSON
                </span>
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="text-xs font-bold text-[#E91E63] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Download size={13} />
                  <span>ดาวน์โหลด JSON ปัจจุบัน</span>
                </button>
              </div>
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder='วาง JSON ที่นี่: {"tournamentName": "...", "heroes": { ... }}'
                rows={8}
                className="w-full bg-[#FFF8FB] border border-[#F3D5E2] focus:border-[#E91E63] focus:bg-white rounded-xl p-3 text-xs text-[#1F2937] font-mono outline-none resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleImportJson}
                  className="px-4 py-2 rounded-lg font-['Prompt'] font-bold text-xs uppercase tracking-wider bg-[#E91E63] hover:bg-[#D81B60] text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Upload size={13} />
                  <span>บันทึกและนำเข้า JSON</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CSV */}
          {activeTab === 'csv' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">
                  นำเข้าไฟล์ CSV (Liquipedia Heroes & Matchups)
                </span>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="text-xs font-bold text-[#E91E63] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Download size={13} />
                  <span>ดาวน์โหลด CSV ปัจจุบัน</span>
                </button>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-slate-500">1. Heroes CSV:</span>
                <textarea
                  value={heroesCsv}
                  onChange={(e) => setHeroesCsv(e.target.value)}
                  placeholder="Hero,Games,Wins,Losses,Win Rate %,Bans,Ban Rate %&#10;Florentino,45,28,17,62.2%,18,24.0%"
                  rows={4}
                  className="w-full bg-[#FFF8FB] border border-[#F3D5E2] focus:border-[#E91E63] focus:bg-white rounded-lg p-2.5 text-xs text-[#1F2937] font-mono outline-none resize-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-slate-500">2. Matchups CSV (ไม่บังคับ):</span>
                <textarea
                  value={matchupsCsv}
                  onChange={(e) => setMatchupsCsv(e.target.value)}
                  placeholder="Hero,Opponent,Games,Wins,Losses,Win Rate %,Diff %&#10;Florentino,Riktor,12,8,4,66.7%,+4.5%"
                  rows={3}
                  className="w-full bg-[#FFF8FB] border border-[#F3D5E2] focus:border-[#E91E63] focus:bg-white rounded-lg p-2.5 text-xs text-[#1F2937] font-mono outline-none resize-none"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleImportCsv}
                  className="px-4 py-2 rounded-lg font-['Prompt'] font-bold text-xs uppercase tracking-wider bg-[#E91E63] hover:bg-[#D81B60] text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Upload size={13} />
                  <span>บันทึกและนำเข้า CSV</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: API */}
          {activeTab === 'api' && (
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-slate-600">
                ดึงข้อมูลสถิติสดผ่าน API Endpoint
              </span>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Globe size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="url"
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                      placeholder="https://api.mcuesports.com/rpl2026/stats"
                      className="w-full bg-[#FFF8FB] border border-[#F3D5E2] focus:border-[#E91E63] focus:bg-white rounded-lg pl-8 pr-3 py-2 text-xs text-[#1F2937] font-mono outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleFetchApi}
                    disabled={isLoadingApi}
                    className="px-4 py-2 rounded-lg font-['Prompt'] font-bold text-xs uppercase tracking-wider bg-[#E91E63] hover:bg-[#D81B60] text-white flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    <RefreshCw size={13} className={isLoadingApi ? 'animate-spin' : ''} />
                    <span>ดึงข้อมูล API</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#F3D5E2] bg-white flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg font-['Prompt'] font-bold text-xs text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <RefreshCw size={12} />
            <span>รีเซ็ตกลับเป็นข้อมูลทางการ Liquipedia</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-['Prompt'] font-bold text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
