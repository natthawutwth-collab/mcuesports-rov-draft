import React from 'react';
import { DraftHistoryRecord } from '../types/draftHistory';
import { getHeroImageUrl } from '../data/heroes';
import { X, Calendar, Trophy, FileText, Shield, ExternalLink, Trash2 } from 'lucide-react';

interface DraftDetailModalProps {
  record: DraftHistoryRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onInspectHero?: (heroName: string) => void;
  onStartRematch?: (record: DraftHistoryRecord) => void;
}

export const DraftDetailModal: React.FC<DraftDetailModalProps> = ({
  record,
  isOpen,
  onClose,
  onDelete,
  onInspectHero,
  onStartRematch,
}) => {
  if (!isOpen || !record) return null;

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const isBlueWin = record.winner === 'blue';
  const isRedWin = record.winner === 'red';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn select-none font-['Prompt']">
      <div className="relative w-full max-w-3xl bg-white border-2 border-[#F3D5E2] rounded-2xl shadow-2xl overflow-hidden text-[#1F2937] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-[#FFF0F5] border-b border-[#F3D5E2] flex items-center justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-['Orbitron'] text-sm font-bold text-[#B45309] tracking-wider uppercase">
                {record.tournament}
              </span>
              <span className="font-['Prompt'] text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">
                Game {record.gameNumber}
              </span>
              <span className="font-['Prompt'] text-xs text-slate-500">
                {record.patch}
              </span>
            </div>
            <h2 className="text-base font-bold text-[#1F2937] mt-0.5">{record.match}</h2>
          </div>

          <div className="flex items-center gap-2">
            {onDelete && (
              <button
                onClick={() => {
                  if (confirm(`คุณต้องการลบประวัติดราฟต์นี้หรือไม่?\n(${record.match} - Game ${record.gameNumber})`)) {
                    onDelete(record.id);
                    onClose();
                  }
                }}
                className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-600 hover:text-rose-800 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                title="ลบดราฟต์นี้"
              >
                <Trash2 size={15} />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shadow-2xs"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Winner Banner */}
          <div className="flex items-center justify-between p-3 bg-[#FFF8FB] border border-[#F3D5E2] rounded-xl shadow-2xs">
            <div className="flex items-center gap-2">
              <Trophy
                size={18}
                className={
                  isBlueWin ? 'text-[#0284C7]' : isRedWin ? 'text-[#E11D48]' : 'text-amber-500'
                }
              />
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block font-['Prompt']">
                  MATCH RESULT
                </span>
                <span className="font-['Prompt'] text-sm font-bold tracking-wider uppercase">
                  {isBlueWin ? (
                    <span className="text-[#0284C7]">{record.blueTeam.teamName} (BLUE) WIN</span>
                  ) : isRedWin ? (
                    <span className="text-[#E11D48]">{record.redTeam.teamName} (RED) WIN</span>
                  ) : (
                    <span className="text-slate-600">ยังไม่บันทึกผลการแข่ง / ซ้อม</span>
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <Calendar size={13} />
              <span>{formatDate(record.createdAt)}</span>
            </div>
          </div>

          {/* 2-Column Draft Presentation (Blue vs Red) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Blue Side */}
            <div
              className={`p-3.5 rounded-xl border space-y-3 ${
                isBlueWin
                  ? 'bg-[#F0F9FF] border-[#7DD3FC] shadow-sm'
                  : 'bg-[#F0F9FF]/60 border-[#BAE6FD]'
              }`}
            >
              <div className="flex items-center justify-between border-b border-[#BAE6FD] pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">🔵</span>
                  <div>
                    <h3 className="font-['Prompt'] text-base font-bold tracking-wider uppercase text-[#0284C7]">
                      {record.blueTeam.teamName}
                    </h3>
                    <span className="text-[10px] text-[#0284C7] font-semibold">BLUE SIDE (FIRST PICK)</span>
                  </div>
                </div>
                {isBlueWin && (
                  <span className="font-['Prompt'] text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                    VICTORY
                  </span>
                )}
              </div>

              {/* Bans */}
              <div className="space-y-1.5">
                <span className="font-['Prompt'] text-[10px] font-bold text-slate-500 uppercase">
                  BANS ({record.blueTeam.bans.length})
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {record.blueTeam.bans.filter((b): b is string => Boolean(b && b.trim())).map((heroName, idx) => (
                    <div
                      key={idx}
                      onClick={() => onInspectHero?.(heroName)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white border border-red-300 hover:border-red-500 cursor-pointer transition-colors shadow-2xs"
                      title="คลิกเพื่อดูสถิติฮีโร่"
                    >
                      <img
                        src={getHeroImageUrl(heroName)}
                        alt={heroName}
                        className="w-5 h-5 rounded-full object-cover grayscale"
                      />
                      <span className="font-bold text-slate-800 text-[11px]">{heroName}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Picks */}
              <div className="space-y-2 pt-2 border-t border-[#BAE6FD]">
                <span className="font-['Prompt'] text-[10px] font-bold text-slate-500 uppercase">
                  PICKS (5 HEROES COMPOSITION)
                </span>
                <div className="space-y-1.5">
                  {record.blueTeam.picks.filter((p) => Boolean(p && p.heroName && p.heroName.trim())).map((pick, idx) => (
                    <div
                      key={idx}
                      onClick={() => onInspectHero?.(pick.heroName)}
                      className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#BAE6FD] hover:border-[#0284C7] transition-colors cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-['Prompt'] text-xs font-bold text-[#0284C7] w-7">
                          {pick.position}
                        </span>
                        <img
                          src={getHeroImageUrl(pick.heroName)}
                          alt={pick.heroName}
                          className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                        />
                        <span className="font-bold text-[12px] text-[#1F2937]">{pick.heroName}</span>
                      </div>
                      {pick.pickOrder && (
                        <span className="text-[10px] font-['Prompt'] text-slate-400">
                          Pick #{pick.pickOrder}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Red Side */}
            <div
              className={`p-3.5 rounded-xl border space-y-3 ${
                isRedWin
                  ? 'bg-[#FFF1F2] border-[#FDA4AF] shadow-sm'
                  : 'bg-[#FFF1F2]/60 border-[#FECDD3]'
              }`}
            >
              <div className="flex items-center justify-between border-b border-[#FECDD3] pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">🔴</span>
                  <div>
                    <h3 className="font-['Prompt'] text-base font-bold tracking-wider uppercase text-[#E11D48]">
                      {record.redTeam.teamName}
                    </h3>
                    <span className="text-[10px] text-[#E11D48] font-semibold">RED SIDE (COUNTER PICK)</span>
                  </div>
                </div>
                {isRedWin && (
                  <span className="font-['Prompt'] text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                    VICTORY
                  </span>
                )}
              </div>

              {/* Bans */}
              <div className="space-y-1.5">
                <span className="font-['Prompt'] text-[10px] font-bold text-slate-500 uppercase">
                  BANS ({record.redTeam.bans.length})
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {record.redTeam.bans.filter((b): b is string => Boolean(b && b.trim())).map((heroName, idx) => (
                    <div
                      key={idx}
                      onClick={() => onInspectHero?.(heroName)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white border border-red-300 hover:border-red-500 cursor-pointer transition-colors shadow-2xs"
                      title="คลิกเพื่อดูสถิติฮีโร่"
                    >
                      <img
                        src={getHeroImageUrl(heroName)}
                        alt={heroName}
                        className="w-5 h-5 rounded-full object-cover grayscale"
                      />
                      <span className="font-bold text-slate-800 text-[11px]">{heroName}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Picks */}
              <div className="space-y-2 pt-2 border-t border-[#FECDD3]">
                <span className="font-['Prompt'] text-[10px] font-bold text-slate-500 uppercase">
                  PICKS (5 HEROES COMPOSITION)
                </span>
                <div className="space-y-1.5">
                  {record.redTeam.picks.filter((p) => Boolean(p && p.heroName && p.heroName.trim())).map((pick, idx) => (
                    <div
                      key={idx}
                      onClick={() => onInspectHero?.(pick.heroName)}
                      className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#FECDD3] hover:border-[#E11D48] transition-colors cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-['Prompt'] text-xs font-bold text-[#E11D48] w-7">
                          {pick.position}
                        </span>
                        <img
                          src={getHeroImageUrl(pick.heroName)}
                          alt={pick.heroName}
                          className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                        />
                        <span className="font-bold text-[12px] text-[#1F2937]">{pick.heroName}</span>
                      </div>
                      {pick.pickOrder && (
                        <span className="text-[10px] font-['Prompt'] text-slate-400">
                          Pick #{pick.pickOrder}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Coach Notes */}
          {record.notes && (
            <div className="p-3.5 bg-[#FFF8FB] border border-[#F3D5E2] rounded-xl space-y-1.5">
              <div className="flex items-center gap-1.5 font-['Prompt'] text-xs font-bold tracking-wider uppercase text-[#E91E63]">
                <FileText size={14} />
                <span>COACH NOTES & TACTICAL ANALYSIS</span>
              </div>
              <p className="text-[11.5px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                {record.notes}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-[#F3D5E2] bg-white flex items-center justify-between text-xs flex-shrink-0">
          <span className="text-slate-400 text-[11px]">Draft ID: {record.id}</span>
          <div className="flex items-center gap-2">
            {onStartRematch && (
              <button
                onClick={() => {
                  onStartRematch(record);
                  onClose();
                }}
                className="px-3.5 py-1.5 rounded-lg bg-[#E91E63] hover:bg-[#D81B60] text-white font-['Prompt'] font-bold text-[11px] tracking-wider flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                title="เริ่มดราฟต์เกมถัดไปโดยใช้ข้อมูลคู่แข่งนี้"
              >
                <span>⚔️</span>
                <span>START NEXT GAME (GAME {record.gameNumber + 1})</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-['Prompt'] font-bold uppercase tracking-wider transition-colors cursor-pointer border border-slate-300"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
