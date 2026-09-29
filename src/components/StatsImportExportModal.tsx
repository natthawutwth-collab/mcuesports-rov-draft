import React, { useState } from 'react';
import { X, Upload, Download, Globe, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { statsDataProvider } from '../services/statsDataProvider';
import { DataSourceStatus } from '../types/stats';

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
  const [activeTab, setActiveTab] = useState<'json' | 'csv' | 'api'>('json');
  const [jsonText, setJsonText] = useState('');
  const [heroesCsv, setHeroesCsv] = useState('');
  const [matchupsCsv, setMatchupsCsv] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isLoadingApi, setIsLoadingApi] = useState(false);

  if (!isOpen) return null;

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
    setFeedback({ type: 'success', message: 'รีเซ็ตกลับเป็นข้อมูลทางการ RoV Pro League 2026 Summer เรียบร้อย' });
    setTimeout(() => onClose(), 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200 font-['Prompt']">
      <div className="w-full max-w-2xl bg-white border-2 border-[#F3D5E2] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#1F2937]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F3D5E2] bg-[#FFF0F5]">
          <div className="flex items-center gap-2">
            <span className="font-['Orbitron'] font-bold text-base tracking-wider text-[#1F2937]">
              📊 DATA LAYER & STATS MANAGER
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

        {/* Current Status Info */}
        <div className="p-4 bg-[#FFF8FB] border-b border-[#F3D5E2] flex items-center justify-between flex-wrap gap-2">
          <div className="flex flex-col">
            <div className="text-[11px] font-['Prompt'] font-semibold text-slate-500 uppercase tracking-wider">
              แหล่งข้อมูลปัจจุบัน (Active Dataset)
            </div>
            <div className="text-sm font-['Orbitron'] font-bold text-[#1F2937]">
              {status.tournamentName}
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-['Prompt']">
            <span className="px-2 py-1 rounded-lg bg-sky-50 border border-sky-300 text-[#0284C7] font-semibold">
              🎮 {status.heroCount} Heroes Tracked
            </span>
            <span className="px-2 py-1 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 font-semibold">
              ⚔ {status.matchupCount} Matchup Records
            </span>
            {status.isCustomLoaded && (
              <span className="px-2 py-1 rounded-lg bg-rose-50 border border-rose-300 text-rose-700 font-semibold">
                Custom Data
              </span>
            )}
          </div>
        </div>

        {/* Navigation Tabs (JSON / CSV / API) */}
        <div className="flex items-center border-b border-[#F3D5E2] bg-white px-4 pt-2 gap-2">
          <button
            type="button"
            onClick={() => { setActiveTab('json'); setFeedback(null); }}
            className={`px-3 py-2 text-xs font-['Prompt'] font-bold tracking-wider rounded-t-lg transition-colors border-b-2 cursor-pointer ${
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
            className={`px-3 py-2 text-xs font-['Prompt'] font-bold tracking-wider rounded-t-lg transition-colors border-b-2 cursor-pointer ${
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
            className={`px-3 py-2 text-xs font-['Prompt'] font-bold tracking-wider rounded-t-lg transition-colors border-b-2 cursor-pointer ${
              activeTab === 'api'
                ? 'border-[#E91E63] text-[#E91E63] bg-[#FFF0F5]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            API ENDPOINT
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar flex flex-col gap-4 bg-white">
          {/* Feedback message */}
          {feedback && (
            <div
              className={`p-3 rounded-lg flex items-center gap-2 text-xs font-['Prompt'] ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                  : 'bg-rose-50 border border-rose-300 text-rose-800'
              }`}
            >
              {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{feedback.message}</span>
            </div>
          )}

          {activeTab === 'json' && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-slate-500 font-['Prompt'] leading-relaxed">
                นำเข้าข้อมูลสถิติรูปแบบ JSON (โครงสร้าง HeroStats และ Matchups) รองรับการแชร์และอัปเดตชุดสถิติตามแพตช์ทัวร์นาเมนต์
              </p>
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder='วางข้อมูล JSON ที่นี่ เช่น: {"tournamentName": "RPL 2026 Summer", "heroes": { "Nakroth": { "games": 34, "winRate": 55.9, ... } }, "matchups": { ... } }'
                rows={7}
                className="w-full bg-[#FFF8FB] border border-[#F3D5E2] focus:border-[#E91E63] focus:bg-white rounded-lg p-3 text-xs text-[#1F2937] font-mono outline-none"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleImportJson}
                  className="px-4 py-2 rounded-lg font-['Prompt'] font-bold text-xs uppercase tracking-wider bg-[#E91E63] hover:bg-[#D81B60] text-white flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                >
                  <Upload size={13} />
                  <span>นำเข้า JSON</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="px-4 py-2 rounded-lg font-['Prompt'] font-bold text-xs uppercase tracking-wider bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Download size={13} />
                  <span>ดาวน์โหลด JSON ปัจจุบัน</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'csv' && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-slate-500 font-['Prompt'] leading-relaxed">
                นำเข้าข้อมูลสถิติรูปแบบ CSV (Liquipedia Statistics Format)
              </p>
              <div>
                <label className="block text-xs font-['Prompt'] font-bold text-slate-700 uppercase mb-1">
                  1. Hero Statistics CSV (Hero, Games, Wins, Losses, Win Rate%, Bans, Ban Rate%, Pick Rate%)
                </label>
                <textarea
                  value={heroesCsv}
                  onChange={(e) => setHeroesCsv(e.target.value)}
                  placeholder="Hero,Games,Wins,Losses,Win Rate %,Bans,Ban Rate %,Pick Rate %&#10;Nakroth,34,19,15,55.9%,42,38.2%,30.9%&#10;Aoi,42,26,16,61.9%,68,61.8%,38.2%"
                  rows={4}
                  className="w-full bg-[#FFF8FB] border border-[#F3D5E2] focus:border-[#E91E63] focus:bg-white rounded-lg p-2.5 text-xs text-[#1F2937] font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-['Prompt'] font-bold text-slate-700 uppercase mb-1">
                  2. Head-to-Head Matchups CSV (Hero, Opponent Hero, Games, Wins, Losses, Win Rate %, Win Rate Diff %)
                </label>
                <textarea
                  value={matchupsCsv}
                  onChange={(e) => setMatchupsCsv(e.target.value)}
                  placeholder="Hero,Opponent Hero,Games,Wins,Losses,Win Rate %,Win Rate Diff %&#10;Nakroth,Raz,12,8,4,66.7%,+12.0%&#10;Nakroth,Liliana,14,9,5,64.3%,+8.4%&#10;Nakroth,Keera,14,5,9,35.7%,-20.2%"
                  rows={4}
                  className="w-full bg-[#FFF8FB] border border-[#F3D5E2] focus:border-[#E91E63] focus:bg-white rounded-lg p-2.5 text-xs text-[#1F2937] font-mono outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleImportCsv}
                  className="px-4 py-2 rounded-lg font-['Prompt'] font-bold text-xs uppercase tracking-wider bg-[#E91E63] hover:bg-[#D81B60] text-white flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                >
                  <Upload size={13} />
                  <span>ประมวลผลและนำเข้า CSV</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="px-4 py-2 rounded-lg font-['Prompt'] font-bold text-xs uppercase tracking-wider bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Download size={13} />
                  <span>ดาวน์โหลด CSV ปัจจุบัน</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-slate-500 font-['Prompt'] leading-relaxed">
                เชื่อมต่อ Endpoint API เพื่อดึงข้อมูลสถิติการแข่งขันและ Matchup แบบไดนามิกในอนาคต (REST API / JSON Response)
              </p>
              <div>
                <label className="block text-xs font-['Prompt'] font-bold text-slate-700 uppercase mb-1">
                  API Endpoint URL
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="url"
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                      placeholder="https://api.esports-stats.com/v1/rov/rpl-2026-summer/statistics"
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
              <div className="p-3 bg-[#FFF8FB] border border-[#F3D5E2] rounded-lg text-[11px] text-slate-500 font-['Prompt']">
                * Data Layer ถูกออกแบบให้รองรับสตรีม API โดยตรง เมื่อ Backend ส่ง JSON สถิติที่มี Schema รองรับ ระบบจะ Sync ข้อมูลเข้าหน้าดราฟแบบ Real-time ทันที
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
            <span>รีเซ็ตกลับเป็นข้อมูล RPL 2026 Summer ค่าเริ่มต้น</span>
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
