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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0e0e14] border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-2">
            <span className="font-['Orbitron'] font-bold text-base tracking-wider text-white">
              📊 DATA LAYER & STATS MANAGER
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Current Status Info */}
        <div className="p-4 bg-black/30 border-b border-white/10 flex items-center justify-between flex-wrap gap-2">
          <div className="flex flex-col">
            <div className="text-[11px] font-['Barlow_Condensed'] font-semibold text-[#a0a0a8] uppercase tracking-wider">
              แหล่งข้อมูลปัจจุบัน (Active Dataset)
            </div>
            <div className="text-sm font-['Orbitron'] font-bold text-[#e6f1ff]">
              {status.tournamentName}
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-['Barlow_Condensed']">
            <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-sky-300">
              🎮 {status.heroCount} Heroes Tracked
            </span>
            <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-amber-300">
              ⚔ {status.matchupCount} Matchup Records
            </span>
            {status.isCustomLoaded && (
              <span className="px-2 py-1 rounded bg-[#a82844]/20 border border-[#a82844] text-red-300">
                Custom Data
              </span>
            )}
          </div>
        </div>

        {/* Navigation Tabs (JSON / CSV / API) */}
        <div className="flex items-center border-b border-white/10 bg-black/20 px-4 pt-2 gap-2">
          <button
            type="button"
            onClick={() => { setActiveTab('json'); setFeedback(null); }}
            className={`px-3 py-2 text-xs font-['Barlow_Condensed'] font-bold tracking-wider rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'json'
                ? 'border-[#a82844] text-white bg-white/5'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            JSON DATA
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('csv'); setFeedback(null); }}
            className={`px-3 py-2 text-xs font-['Barlow_Condensed'] font-bold tracking-wider rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'csv'
                ? 'border-[#a82844] text-white bg-white/5'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            CSV SPREADSHEET
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('api'); setFeedback(null); }}
            className={`px-3 py-2 text-xs font-['Barlow_Condensed'] font-bold tracking-wider rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'api'
                ? 'border-[#a82844] text-white bg-white/5'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            API ENDPOINT (FUTURE)
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar flex flex-col gap-4">
          {/* Feedback message */}
          {feedback && (
            <div
              className={`p-3 rounded-lg flex items-center gap-2 text-xs font-['Kanit'] ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/70 border border-emerald-500 text-emerald-200'
                  : 'bg-red-950/70 border border-red-500 text-red-200'
              }`}
            >
              {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{feedback.message}</span>
            </div>
          )}

          {activeTab === 'json' && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-[#a0a0a8] font-['Kanit'] leading-relaxed">
                นำเข้าข้อมูลสถิติรูปแบบ JSON (โครงสร้าง HeroStats และ Matchups) รองรับการแชร์และอัปเดตชุดสถิติตามแพตช์ทัวร์นาเมนต์
              </p>
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder='วางข้อมูล JSON ที่นี่ เช่น: {"tournamentName": "RPL 2026 Summer", "heroes": { "Nakroth": { "games": 34, "winRate": 55.9, ... } }, "matchups": { ... } }'
                rows={7}
                className="w-full bg-[rgba(20,20,26,0.8)] border border-white/15 focus:border-[#a82844] rounded-lg p-3 text-xs text-white font-mono outline-none"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleImportJson}
                  className="px-4 py-2 rounded-lg font-['Barlow_Condensed'] font-bold text-xs uppercase tracking-wider bg-[#a82844] hover:bg-[#c93958] text-white flex items-center gap-1.5"
                >
                  <Upload size={13} />
                  <span>นำเข้า JSON</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="px-4 py-2 rounded-lg font-['Barlow_Condensed'] font-bold text-xs uppercase tracking-wider bg-white/5 hover:bg-white/10 text-white/80 flex items-center gap-1.5"
                >
                  <Download size={13} />
                  <span>ดาวน์โหลด JSON ปัจจุบัน</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'csv' && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-[#a0a0a8] font-['Kanit'] leading-relaxed">
                นำเข้าข้อมูลสถิติรูปแบบ CSV (Liquipedia Statistics Format)
              </p>
              <div>
                <label className="block text-xs font-['Barlow_Condensed'] font-bold text-white/80 uppercase mb-1">
                  1. Hero Statistics CSV (Hero, Games, Wins, Losses, Win Rate%, Bans, Ban Rate%, Pick Rate%)
                </label>
                <textarea
                  value={heroesCsv}
                  onChange={(e) => setHeroesCsv(e.target.value)}
                  placeholder="Hero,Games,Wins,Losses,Win Rate %,Bans,Ban Rate %,Pick Rate %&#10;Nakroth,34,19,15,55.9%,42,38.2%,30.9%&#10;Aoi,42,26,16,61.9%,68,61.8%,38.2%"
                  rows={4}
                  className="w-full bg-[rgba(20,20,26,0.8)] border border-white/15 focus:border-[#a82844] rounded-lg p-2.5 text-xs text-white font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-['Barlow_Condensed'] font-bold text-white/80 uppercase mb-1">
                  2. Head-to-Head Matchups CSV (Hero, Opponent Hero, Games, Wins, Losses, Win Rate %, Win Rate Diff %)
                </label>
                <textarea
                  value={matchupsCsv}
                  onChange={(e) => setMatchupsCsv(e.target.value)}
                  placeholder="Hero,Opponent Hero,Games,Wins,Losses,Win Rate %,Win Rate Diff %&#10;Nakroth,Raz,12,8,4,66.7%,+12.0%&#10;Nakroth,Liliana,14,9,5,64.3%,+8.4%&#10;Nakroth,Keera,14,5,9,35.7%,-20.2%"
                  rows={4}
                  className="w-full bg-[rgba(20,20,26,0.8)] border border-white/15 focus:border-[#a82844] rounded-lg p-2.5 text-xs text-white font-mono outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleImportCsv}
                  className="px-4 py-2 rounded-lg font-['Barlow_Condensed'] font-bold text-xs uppercase tracking-wider bg-[#a82844] hover:bg-[#c93958] text-white flex items-center gap-1.5"
                >
                  <Upload size={13} />
                  <span>นำเข้า CSV</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="px-4 py-2 rounded-lg font-['Barlow_Condensed'] font-bold text-xs uppercase tracking-wider bg-white/5 hover:bg-white/10 text-white/80 flex items-center gap-1.5"
                >
                  <Download size={13} />
                  <span>ดาวน์โหลด CSV ปัจจุบัน</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-[#a0a0a8] font-['Kanit'] leading-relaxed">
                เชื่อมต่อ Endpoint API เพื่อดึงข้อมูลสถิติการแข่งขันและ Matchup แบบไดนามิกในอนาคต (REST API / JSON Response)
              </p>
              <div>
                <label className="block text-xs font-['Barlow_Condensed'] font-bold text-white/80 uppercase mb-1">
                  API Endpoint URL
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      type="url"
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                      placeholder="https://api.esports-stats.com/v1/rov/rpl-2026-summer/statistics"
                      className="w-full bg-[rgba(20,20,26,0.8)] border border-white/15 focus:border-[#a82844] rounded-lg pl-8 pr-3 py-2 text-xs text-white font-mono outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleFetchApi}
                    disabled={isLoadingApi}
                    className="px-4 py-2 rounded-lg font-['Barlow_Condensed'] font-bold text-xs uppercase tracking-wider bg-[#a82844] hover:bg-[#c93958] text-white flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={isLoadingApi ? 'animate-spin' : ''} />
                    <span>ดึงข้อมูล API</span>
                  </button>
                </div>
              </div>
              <div className="p-3 bg-black/40 border border-white/5 rounded-lg text-[11px] text-[#a0a0a8] font-['Kanit']">
                * Data Layer ถูกออกแบบให้รองรับสตรีม API โดยตรง เมื่อ Backend ส่ง JSON สถิติที่มี Schema รองรับ ระบบจะ Sync ข้อมูลเข้าหน้าดราฟแบบ Real-time ทันที
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/40 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg font-['Barlow_Condensed'] font-bold text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw size={12} />
            <span>รีเซ็ตกลับเป็นข้อมูล RPL 2026 Summer ค่าเริ่มต้น</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-['Barlow_Condensed'] font-bold text-xs text-white/80 hover:text-white bg-white/10 hover:bg-white/15 transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
