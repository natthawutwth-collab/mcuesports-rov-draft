import React, { useState } from 'react';
import { useDraftHistory } from '../hooks/useDraftHistory';
import { DraftHistoryRecord } from '../types/draftHistory';
import { DraftDetailModal } from './DraftDetailModal';
import { getHeroImageUrl } from '../data/heroes';
import {
  Search,
  Calendar,
  Trophy,
  Trash2,
  Download,
  Upload,
  Eye,
  Plus,
  ArrowRight,
  Shield,
  FileText,
  Swords,
  ChevronRight,
} from 'lucide-react';

interface DraftHistoryPageProps {
  onStartNewDraftFromMatch?: (record: DraftHistoryRecord) => void;
  onInspectHero?: (heroName: string) => void;
  onOpenNewDraftSetup?: () => void;
}

export const DraftHistoryPage: React.FC<DraftHistoryPageProps> = ({
  onStartNewDraftFromMatch,
  onInspectHero,
  onOpenNewDraftSetup,
}) => {
  const {
    filteredRecords,
    records,
    isLoading,
    filter,
    setFilter,
    deleteDraft,
    clearAllDrafts,
    exportHistoryJson,
    importHistoryJson,
    tournaments,
  } = useDraftHistory();

  const [selectedRecord, setSelectedRecord] = useState<DraftHistoryRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleOpenDetail = (rec: DraftHistoryRecord) => {
    setSelectedRecord(rec);
    setIsDetailOpen(true);
  };

  const handleExport = async () => {
    try {
      const json = await exportHistoryJson();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mcu_rov_draft_history_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('เกิดข้อผิดพลาดในการส่งออกข้อมูล');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const count = await importHistoryJson(text);
        setImportStatus(`✅ นำเข้าข้อมูลสำเร็จ ${count} รายการ`);
        setTimeout(() => setImportStatus(null), 4000);
      } catch {
        alert('รูปแบบไฟล์ JSON ไม่ถูกต้อง');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('th-TH', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-3.5 sm:gap-4 font-['Prompt'] text-slate-800 select-none animate-in fade-in duration-200">
      {/* 1. Header & Management Actions */}
      <div className="p-4 bg-white border border-[#F3D5E2] rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-['Prompt'] font-bold text-lg sm:text-xl text-slate-900 leading-snug">
              คลังประวัติดราฟต์ (Draft Archives)
            </h1>
            <span className="font-['Orbitron'] text-xs font-bold px-2 py-0.5 rounded-full bg-[#FCE4EC] text-[#E91E63] border border-[#F48FB1]">
              {records.length} SAVED
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Cloud Synced</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            บันทึกการดราฟต์ ผลแพ้ชนะ และบทวิเคราะห์ย้อนหลังสำหรับทีมโค้ช
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenNewDraftSetup && (
            <button
              onClick={onOpenNewDraftSetup}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#E91E63] to-[#D81B60] hover:from-[#D81B60] hover:to-[#C2185B] text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
            >
              <Plus size={14} />
              <span>เริ่มดราฟต์ใหม่</span>
            </button>
          )}

          <button
            onClick={handleExport}
            className="px-3 py-2 rounded-xl bg-white hover:bg-[#FFF0F5] border border-[#F3D5E2] text-slate-700 hover:text-[#E91E63] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="ส่งออกประวัติดราฟต์ทั้งหมดเป็นไฟล์ JSON"
          >
            <Download size={13} />
            <span>EXPORT</span>
          </button>

          <label
            className="px-3 py-2 rounded-xl bg-white hover:bg-[#FFF0F5] border border-[#F3D5E2] text-slate-700 hover:text-[#E91E63] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="นำเข้าไฟล์ประวัติดราฟต์ JSON"
          >
            <Upload size={13} />
            <span>IMPORT</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>

          {records.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('คุณต้องการลบประวัติดราฟต์ทั้งหมดใช่หรือไม่? ข้อมูลทั้งหมดบนคลาวด์จะถูกลบอย่างถาวร')) {
                  clearAllDrafts();
                }
              }}
              className="px-2.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
              title="ลบประวัติดราฟต์ทั้งหมด"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {importStatus && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-bold flex items-center justify-between">
          <span>{importStatus}</span>
          <button onClick={() => setImportStatus(null)} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>
      )}

      {/* 2. Unified Search & Filter Bar */}
      <div className="p-3.5 bg-white border border-[#F3D5E2] rounded-2xl shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
          {/* Text Search Input */}
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={filter.searchQuery || ''}
              onChange={(e) => setFilter({ ...filter, searchQuery: e.target.value })}
              placeholder="ค้นหาชื่อทีม, ทัวร์นาเมนต์, แมตช์ หรือฮีโร่ในดราฟต์..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#FFF8FB] border border-[#F3D5E2] focus:border-[#E91E63] focus:bg-white rounded-xl text-slate-900 placeholder-slate-400 text-xs outline-none transition-all shadow-2xs"
            />
          </div>

          {/* Tournament Filter */}
          <div className="w-full md:w-56">
            <select
              value={filter.tournament || 'all'}
              onChange={(e) => setFilter({ ...filter, tournament: e.target.value })}
              className="w-full px-3 py-1.5 bg-[#FFF8FB] border border-[#F3D5E2] focus:border-[#E91E63] focus:bg-white rounded-xl text-slate-800 text-xs outline-none cursor-pointer shadow-2xs"
            >
              <option value="all">ทุกรายการแข่งขัน</option>
              {tournaments.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Winner Filter */}
          <div className="w-full md:w-44">
            <select
              value={filter.winner || 'all'}
              onChange={(e) =>
                setFilter({
                  ...filter,
                  winner: e.target.value === 'all' ? undefined : (e.target.value as any),
                })
              }
              className="w-full px-3 py-1.5 bg-[#FFF8FB] border border-[#F3D5E2] focus:border-[#E91E63] focus:bg-white rounded-xl text-slate-800 text-xs outline-none cursor-pointer shadow-2xs"
            >
              <option value="all">ผลแพ้/ชนะ ทั้งหมด</option>
              <option value="blue">🔵 Blue Team Win</option>
              <option value="red">🔴 Red Team Win</option>
              <option value="undecided">⏳ ซ้อม / ยังไม่แข่ง</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Draft History Cards List */}
      {isLoading ? (
        <div className="p-8 text-center text-slate-400 text-xs">กำลังโหลดประวัติดราฟต์...</div>
      ) : filteredRecords.length === 0 ? (
        <div className="p-10 bg-white border border-dashed border-[#F3D5E2] rounded-2xl text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#FFF0F5] border border-[#F3D5E2] flex items-center justify-center mx-auto text-xl text-[#E91E63]">
            📂
          </div>
          <div>
            <h3 className="text-slate-800 font-bold text-sm">ไม่พบประวัติดราฟต์ตามเงื่อนไขที่ค้นหา</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              คุณสามารถเริ่มดราฟต์และกดบันทึกผล (Save Draft) เพื่อเก็บข้อมูลสถิติของทีม
            </p>
          </div>
          {onOpenNewDraftSetup && (
            <button
              onClick={onOpenNewDraftSetup}
              className="px-4 py-2 rounded-xl bg-[#E91E63] hover:bg-[#D81B60] text-white font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
            >
              <Plus size={14} />
              <span>เริ่มดราฟต์ใหม่</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredRecords.map((rec) => {
            const isBlueWin = rec.winner === 'blue';
            const isRedWin = rec.winner === 'red';

            return (
              <div
                key={rec.id}
                className="p-4 bg-white border border-slate-200 hover:border-[#F48FB1] rounded-2xl shadow-2xs hover:shadow-xs transition-all flex flex-col gap-3 group"
              >
                {/* Top Info Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-['Orbitron'] text-xs font-bold tracking-wider text-slate-800">
                      {rec.tournament}
                    </span>
                    <span className="text-[11px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      Game #{rec.gameNumber}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {rec.patch}
                    </span>
                    <span className="text-[10.5px] text-slate-400 flex items-center gap-1">
                      <Calendar size={11} />
                      {formatDate(rec.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Winner Badge */}
                    {isBlueWin ? (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-sky-50 text-[#0284C7] border border-sky-300 flex items-center gap-1">
                        <Trophy size={11} />
                        <span>{rec.blueTeam.teamName} WIN</span>
                      </span>
                    ) : isRedWin ? (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-rose-50 text-[#E11D48] border border-rose-300 flex items-center gap-1">
                        <Trophy size={11} />
                        <span>{rec.redTeam.teamName} WIN</span>
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                        Undecided
                      </span>
                    )}

                    {/* Quick View Button */}
                    <button
                      onClick={() => handleOpenDetail(rec)}
                      className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-slate-200 shadow-2xs"
                    >
                      <Eye size={12} />
                      <span>ดูรายละเอียด</span>
                    </button>

                    {/* Next Game / Rematch Button */}
                    {onStartNewDraftFromMatch && (
                      <button
                        onClick={() => onStartNewDraftFromMatch(rec)}
                        className="px-2.5 py-1 rounded-lg bg-[#FFF0F5] hover:bg-[#FCE4EC] border border-[#F3D5E2] text-[#E91E63] text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="เริ่มดราฟต์เกมถัดไปโดยใช้ข้อมูลคู่แข่งนี้"
                      >
                        <Swords size={12} className="text-[#E91E63]" />
                        <span>Game {rec.gameNumber + 1}</span>
                      </button>
                    )}

                    {/* Delete Button */}
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `คุณต้องการลบประวัติดราฟต์นี้หรือไม่?\n(${rec.match} - Game ${rec.gameNumber})`
                          )
                        ) {
                          deleteDraft(rec.id);
                        }
                      }}
                      className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 hover:text-rose-800 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                      title="ลบดราฟต์"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Match Title */}
                <div className="font-bold text-slate-900 text-sm tracking-wide">{rec.match}</div>

                {/* Visual Draft Composition: Blue vs Red */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* Blue Side Preview */}
                  <div className="p-3 bg-sky-50/50 border border-sky-200/80 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#0284C7] flex items-center gap-1">
                        <span>🔵</span>
                        <span className="text-xs uppercase">
                          {rec.blueTeam.teamName}
                        </span>
                      </span>
                      {/* Bans */}
                      <div className="flex items-center gap-1">
                        <span className="text-[9.5px] text-slate-400 font-semibold">
                          Bans:
                        </span>
                        {rec.blueTeam.bans.slice(0, 4).filter((b): b is string => Boolean(b && b.trim())).map((b, i) => (
                          <img
                            key={i}
                            src={getHeroImageUrl(b)}
                            alt={b}
                            title={`Banned: ${b}`}
                            className="w-5 h-5 rounded-md object-cover border border-rose-200 grayscale opacity-75"
                          />
                        ))}
                      </div>
                    </div>

                    {/* 5 Picks Lineup */}
                    <div className="grid grid-cols-5 gap-1.5">
                      {rec.blueTeam.picks.filter((p) => Boolean(p && p.heroName && p.heroName.trim())).map((p, i) => (
                        <div
                          key={i}
                          onClick={() => onInspectHero?.(p.heroName)}
                          className="flex flex-col items-center p-1 rounded-lg bg-white border border-sky-200 hover:border-[#0284C7] transition-all cursor-pointer shadow-2xs group/pick"
                          title={`${p.heroName} (${p.position})`}
                        >
                          <img
                            src={getHeroImageUrl(p.heroName)}
                            alt={p.heroName}
                            className="w-9 h-9 rounded-md object-cover"
                          />
                          <span className="text-[9.5px] font-bold text-slate-800 truncate w-full text-center mt-1">
                            {p.heroName}
                          </span>
                          <span className="text-[8px] font-semibold text-[#0284C7] uppercase">
                            {p.position}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Red Side Preview */}
                  <div className="p-3 bg-rose-50/50 border border-rose-200/80 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#E11D48] flex items-center gap-1">
                        <span>🔴</span>
                        <span className="text-xs uppercase">
                          {rec.redTeam.teamName}
                        </span>
                      </span>
                      {/* Bans */}
                      <div className="flex items-center gap-1">
                        <span className="text-[9.5px] text-slate-400 font-semibold">
                          Bans:
                        </span>
                        {rec.redTeam.bans.slice(0, 4).filter((b): b is string => Boolean(b && b.trim())).map((b, i) => (
                          <img
                            key={i}
                            src={getHeroImageUrl(b)}
                            alt={b}
                            title={`Banned: ${b}`}
                            className="w-5 h-5 rounded-md object-cover border border-rose-200 grayscale opacity-75"
                          />
                        ))}
                      </div>
                    </div>

                    {/* 5 Picks Lineup */}
                    <div className="grid grid-cols-5 gap-1.5">
                      {rec.redTeam.picks.filter((p) => Boolean(p && p.heroName && p.heroName.trim())).map((p, i) => (
                        <div
                          key={i}
                          onClick={() => onInspectHero?.(p.heroName)}
                          className="flex flex-col items-center p-1 rounded-lg bg-white border border-rose-200 hover:border-[#E11D48] transition-all cursor-pointer shadow-2xs group/pick"
                          title={`${p.heroName} (${p.position})`}
                        >
                          <img
                            src={getHeroImageUrl(p.heroName)}
                            alt={p.heroName}
                            className="w-9 h-9 rounded-md object-cover"
                          />
                          <span className="text-[9.5px] font-bold text-slate-800 truncate w-full text-center mt-1">
                            {p.heroName}
                          </span>
                          <span className="text-[8px] font-semibold text-[#E11D48] uppercase">
                            {p.position}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Notes Preview if available */}
                {rec.notes && rec.notes.trim() && (
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-1.5 text-xs text-slate-600">
                    <FileText size={13} className="text-[#E91E63] flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-1 italic">{rec.notes}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {isDetailOpen && selectedRecord && (
        <DraftDetailModal
          isOpen={isDetailOpen}
          record={selectedRecord}
          onClose={() => setIsDetailOpen(false)}
          onInspectHero={onInspectHero}
        />
      )}
    </div>
  );
};
