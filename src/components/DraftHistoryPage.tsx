import React, { useState } from 'react';
import { useDraftHistory } from '../hooks/useDraftHistory';
import { DraftHistoryRecord } from '../types/draftHistory';
import { DraftDetailModal } from './DraftDetailModal';
import { getHeroImageUrl } from '../data/heroes';
import {
  Search,
  Calendar,
  Trophy,
  Filter,
  Trash2,
  Download,
  Upload,
  Eye,
  Plus,
  ArrowRight,
  Shield,
  FileText,
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
    } catch (e) {
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
      } catch (err) {
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
    <div className="w-full max-w-7xl mx-auto space-y-4 font-['Kanit'] select-none">
      {/* 1. Header & Quick Actions */}
      <div className="p-4 bg-[rgba(20,20,26,0.7)] border border-white/10 rounded-2xl shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-['Orbitron'] text-xl font-bold tracking-wider text-white">
              DRAFT HISTORY
            </span>
            <span className="font-['Barlow_Condensed'] text-xs font-bold px-2 py-0.5 rounded-full bg-[#a82844]/30 text-[#ff7b95] border border-[#a82844]/50">
              {records.length} DRAFTS SAVED
            </span>
          </div>
          <p className="text-xs text-[#a0a0a8] mt-1">
            คลังประวัติดราฟต์ RoV Pro League & Scrim พร้อมผลการแข่งขัน Ban/Pick และบทวิเคราะห์
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenNewDraftSetup && (
            <button
              onClick={onOpenNewDraftSetup}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#a82844] to-[#ff476e] hover:brightness-110 text-white font-['Orbitron'] font-bold text-xs tracking-wider flex items-center gap-1.5 shadow-[0_0_12px_rgba(168,40,68,0.4)] transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>NEW DRAFT SETUP</span>
            </button>
          )}

          <button
            onClick={handleExport}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white font-['Barlow_Condensed'] text-xs font-bold tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
            title="ส่งออกประวัติดราฟต์ทั้งหมดเป็นไฟล์ JSON"
          >
            <Download size={13} />
            <span>EXPORT JSON</span>
          </button>

          <label
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white font-['Barlow_Condensed'] text-xs font-bold tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
            title="นำเข้าไฟล์ประวัติดราฟต์ JSON"
          >
            <Upload size={13} />
            <span>IMPORT JSON</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      {importStatus && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-bold flex items-center justify-between">
          <span>{importStatus}</span>
          <button onClick={() => setImportStatus(null)} className="text-white/60 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* 2. Search & Filter Bar */}
      <div className="p-3.5 bg-black/40 border border-white/10 rounded-xl space-y-2.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
          {/* Text Search Input */}
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              type="text"
              value={filter.searchQuery || ''}
              onChange={(e) => setFilter({ ...filter, searchQuery: e.target.value })}
              placeholder="ค้นหาชื่อทีม, รายการแข่งขัน, แมตช์, หรือฮีโร่ในดราฟต์..."
              className="w-full pl-9 pr-3 py-2 bg-black/60 border border-white/15 focus:border-[#d4a857] rounded-lg text-white text-xs outline-none transition-colors"
            />
          </div>

          {/* Tournament Filter */}
          <div className="w-full md:w-56">
            <select
              value={filter.tournament || 'all'}
              onChange={(e) => setFilter({ ...filter, tournament: e.target.value })}
              className="w-full px-3 py-2 bg-black/60 border border-white/15 focus:border-[#d4a857] rounded-lg text-white text-xs outline-none cursor-pointer"
            >
              <option value="all">ทุกรายการแข่งขัน (All Tournaments)</option>
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
              className="w-full px-3 py-2 bg-black/60 border border-white/15 focus:border-[#d4a857] rounded-lg text-white text-xs outline-none cursor-pointer"
            >
              <option value="all">ผลแพ้/ชนะ ทั้งหมด</option>
              <option value="blue">🔵 Blue Team Win</option>
              <option value="red">🔴 Red Team Win</option>
              <option value="undecided">⏳ ยังไม่แข่ง / ซ้อม</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Draft History Cards List */}
      {isLoading ? (
        <div className="p-8 text-center text-white/50 text-xs">กำลังโหลดประวัติดราฟต์...</div>
      ) : filteredRecords.length === 0 ? (
        <div className="p-10 bg-black/30 border border-dashed border-white/15 rounded-2xl text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-xl text-white/40">
            📂
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">ไม่พบประวัติดราฟต์ตามเงื่อนไขที่ค้นหา</h3>
            <p className="text-xs text-[#a0a0a8] mt-0.5">
              คุณสามารถเริ่มดราฟต์และกด Save Draft หลังเสร็จสิ้น เพื่อบันทึกประวัติการแข่งขันลงในระบบ
            </p>
          </div>
          {onOpenNewDraftSetup && (
            <button
              onClick={onOpenNewDraftSetup}
              className="px-4 py-2 rounded-lg bg-[#a82844] hover:bg-[#a82844]/80 text-white font-['Barlow_Condensed'] font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer inline-flex items-center gap-1.5"
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
                className="p-4 bg-gradient-to-r from-black/60 via-white/[0.02] to-black/60 hover:to-white/[0.05] border border-white/10 hover:border-white/20 rounded-2xl shadow-lg transition-all flex flex-col gap-3 group"
              >
                {/* Top Info Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-['Orbitron'] text-xs font-black tracking-wider text-[#d4a857]">
                      {rec.tournament}
                    </span>
                    <span className="font-['Barlow_Condensed'] text-[11px] font-bold px-1.5 py-0.2 rounded bg-white/10 text-white">
                      Game {rec.gameNumber}
                    </span>
                    <span className="font-['Barlow_Condensed'] text-[11px] text-[#a0a0a8]">
                      {rec.patch}
                    </span>
                    <span className="text-[10.5px] text-white/40 flex items-center gap-1">
                      <Calendar size={11} />
                      {formatDate(rec.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Winner Badge */}
                    {isBlueWin ? (
                      <span className="font-['Barlow_Condensed'] text-xs font-black px-2 py-0.5 rounded bg-[#6b8fb8]/20 text-[#6b8fb8] border border-[#6b8fb8]/40 flex items-center gap-1">
                        <Trophy size={11} />
                        <span>{rec.blueTeam.teamName} WIN</span>
                      </span>
                    ) : isRedWin ? (
                      <span className="font-['Barlow_Condensed'] text-xs font-black px-2 py-0.5 rounded bg-[#a82844]/20 text-[#ff7b95] border border-[#a82844]/40 flex items-center gap-1">
                        <Trophy size={11} />
                        <span>{rec.redTeam.teamName} WIN</span>
                      </span>
                    ) : (
                      <span className="font-['Barlow_Condensed'] text-xs font-bold px-2 py-0.5 rounded bg-white/5 text-white/50 border border-white/10">
                        Undecided
                      </span>
                    )}

                    {/* Quick View Button */}
                    <button
                      onClick={() => handleOpenDetail(rec)}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-['Barlow_Condensed'] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Eye size={12} />
                      <span>ดูรายละเอียด</span>
                    </button>

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
                      className="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-950/60 border border-white/10 hover:border-red-500/50 text-white/50 hover:text-red-300 flex items-center justify-center transition-colors cursor-pointer"
                      title="ลบดราฟต์"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Match Title */}
                <div className="font-bold text-white text-sm tracking-wide">{rec.match}</div>

                {/* Visual Draft Composition: Blue vs Red */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* Blue Side Preview */}
                  <div className="p-2.5 bg-[#6b8fb8]/5 border border-[#6b8fb8]/20 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white flex items-center gap-1">
                        <span>🔵</span>
                        <span className="font-['Barlow_Condensed'] text-sm uppercase">
                          {rec.blueTeam.teamName}
                        </span>
                      </span>
                      {/* Bans */}
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-[#a0a0a8] uppercase font-['Barlow_Condensed']">
                          Bans:
                        </span>
                        {rec.blueTeam.bans.slice(0, 4).map((b, i) => (
                          <img
                            key={i}
                            src={getHeroImageUrl(b)}
                            alt={b}
                            title={`Banned: ${b}`}
                            className="w-5 h-5 rounded-full object-cover border border-white/20 grayscale opacity-80"
                          />
                        ))}
                      </div>
                    </div>

                    {/* 5 Picks Lineup */}
                    <div className="grid grid-cols-5 gap-1.5">
                      {rec.blueTeam.picks.map((p, i) => (
                        <div
                          key={i}
                          onClick={() => onInspectHero?.(p.heroName)}
                          className="flex flex-col items-center p-1 rounded-lg bg-black/40 border border-white/10 hover:border-[#6b8fb8] transition-colors cursor-pointer"
                          title={`${p.position}: ${p.heroName}`}
                        >
                          <span className="text-[8.5px] font-['Barlow_Condensed'] font-bold text-[#6b8fb8]">
                            {p.position}
                          </span>
                          <img
                            src={getHeroImageUrl(p.heroName)}
                            alt={p.heroName}
                            className="w-7 h-7 rounded-full object-cover mt-0.5 border border-white/20"
                          />
                          <span className="text-[9px] text-white font-medium truncate max-w-[48px] mt-0.5">
                            {p.heroName}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Red Side Preview */}
                  <div className="p-2.5 bg-[#a82844]/5 border border-[#a82844]/20 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white flex items-center gap-1">
                        <span>🔴</span>
                        <span className="font-['Barlow_Condensed'] text-sm uppercase">
                          {rec.redTeam.teamName}
                        </span>
                      </span>
                      {/* Bans */}
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-[#a0a0a8] uppercase font-['Barlow_Condensed']">
                          Bans:
                        </span>
                        {rec.redTeam.bans.slice(0, 4).map((b, i) => (
                          <img
                            key={i}
                            src={getHeroImageUrl(b)}
                            alt={b}
                            title={`Banned: ${b}`}
                            className="w-5 h-5 rounded-full object-cover border border-white/20 grayscale opacity-80"
                          />
                        ))}
                      </div>
                    </div>

                    {/* 5 Picks Lineup */}
                    <div className="grid grid-cols-5 gap-1.5">
                      {rec.redTeam.picks.map((p, i) => (
                        <div
                          key={i}
                          onClick={() => onInspectHero?.(p.heroName)}
                          className="flex flex-col items-center p-1 rounded-lg bg-black/40 border border-white/10 hover:border-[#a82844] transition-colors cursor-pointer"
                          title={`${p.position}: ${p.heroName}`}
                        >
                          <span className="text-[8.5px] font-['Barlow_Condensed'] font-bold text-[#ff7b95]">
                            {p.position}
                          </span>
                          <img
                            src={getHeroImageUrl(p.heroName)}
                            alt={p.heroName}
                            className="w-7 h-7 rounded-full object-cover mt-0.5 border border-white/20"
                          />
                          <span className="text-[9px] text-white font-medium truncate max-w-[48px] mt-0.5">
                            {p.heroName}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Notes Preview if exists */}
                {rec.notes && (
                  <div className="text-[11px] text-white/70 bg-black/30 p-2 rounded-lg border border-white/5 line-clamp-2 italic">
                    💬 "{rec.notes}"
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Modal */}
      <DraftDetailModal
        record={selectedRecord}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedRecord(null);
        }}
        onDelete={deleteDraft}
        onInspectHero={onInspectHero}
      />
    </div>
  );
};
