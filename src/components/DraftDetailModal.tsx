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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none font-['Kanit']">
      <div className="relative w-full max-w-3xl bg-[#121217] border border-white/20 rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-black/80 via-[#a82844]/20 to-black/80 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-['Orbitron'] text-sm font-bold text-[#d4a857] tracking-wider uppercase">
                {record.tournament}
              </span>
              <span className="font-['Barlow_Condensed'] text-xs font-bold px-1.5 py-0.5 rounded bg-white/10 text-white">
                Game {record.gameNumber}
              </span>
              <span className="font-['Barlow_Condensed'] text-xs text-[#a0a0a8]">
                {record.patch}
              </span>
            </div>
            <h2 className="text-base font-bold text-white mt-0.5">{record.match}</h2>
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
                className="w-8 h-8 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="ลบดราฟต์นี้"
              >
                <Trash2 size={15} />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Winner Banner */}
          <div className="flex items-center justify-between p-3 bg-black/40 border border-white/10 rounded-xl">
            <div className="flex items-center gap-2">
              <Trophy
                size={18}
                className={
                  isBlueWin ? 'text-[#6b8fb8]' : isRedWin ? 'text-[#ff7b95]' : 'text-amber-400'
                }
              />
              <div>
                <span className="text-[10px] text-[#a0a0a8] font-bold uppercase block font-['Barlow_Condensed']">
                  MATCH RESULT
                </span>
                <span className="font-['Barlow_Condensed'] text-sm font-black tracking-wider uppercase">
                  {isBlueWin ? (
                    <span className="text-[#6b8fb8]">{record.blueTeam.teamName} (BLUE) WIN</span>
                  ) : isRedWin ? (
                    <span className="text-[#ff7b95]">{record.redTeam.teamName} (RED) WIN</span>
                  ) : (
                    <span className="text-white/70">ยังไม่บันทึกผลการแข่ง / ซ้อม</span>
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-[#a0a0a8]">
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
                  ? 'bg-[#6b8fb8]/15 border-[#6b8fb8]/50 shadow-[0_0_15px_rgba(107,143,184,0.2)]'
                  : 'bg-[#6b8fb8]/5 border-[#6b8fb8]/20'
              }`}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">🔵</span>
                  <div>
                    <h3 className="font-['Barlow_Condensed'] text-base font-black tracking-wider uppercase text-white">
                      {record.blueTeam.teamName}
                    </h3>
                    <span className="text-[10px] text-[#6b8fb8] font-bold">BLUE SIDE (FIRST PICK)</span>
                  </div>
                </div>
                {isBlueWin && (
                  <span className="font-['Barlow_Condensed'] text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    VICTORY
                  </span>
                )}
              </div>

              {/* Bans */}
              <div className="space-y-1.5">
                <span className="font-['Barlow_Condensed'] text-[10px] font-bold text-[#a0a0a8] uppercase">
                  BANS ({record.blueTeam.bans.length})
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {record.blueTeam.bans.map((heroName, idx) => (
                    <div
                      key={idx}
                      onClick={() => onInspectHero?.(heroName)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/50 border border-white/15 hover:border-[#d4a857] cursor-pointer transition-colors"
                      title="คลิกเพื่อดูสถิติฮีโร่"
                    >
                      <img
                        src={getHeroImageUrl(heroName)}
                        alt={heroName}
                        className="w-5 h-5 rounded-full object-cover grayscale"
                      />
                      <span className="font-bold text-white/90 text-[11px]">{heroName}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Picks */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <span className="font-['Barlow_Condensed'] text-[10px] font-bold text-[#a0a0a8] uppercase">
                  PICKS (5 HEROES COMPOSITION)
                </span>
                <div className="space-y-1.5">
                  {record.blueTeam.picks.map((pick, idx) => (
                    <div
                      key={idx}
                      onClick={() => onInspectHero?.(pick.heroName)}
                      className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/10 hover:border-[#6b8fb8] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-['Barlow_Condensed'] text-xs font-black text-[#6b8fb8] w-7">
                          {pick.position}
                        </span>
                        <img
                          src={getHeroImageUrl(pick.heroName)}
                          alt={pick.heroName}
                          className="w-8 h-8 rounded-lg object-cover border border-white/20"
                        />
                        <span className="font-bold text-[12px] text-white">{pick.heroName}</span>
                      </div>
                      {pick.pickOrder && (
                        <span className="text-[10px] font-['Barlow_Condensed'] text-white/50">
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
                  ? 'bg-[#a82844]/20 border-[#a82844]/50 shadow-[0_0_15px_rgba(168,40,68,0.2)]'
                  : 'bg-[#a82844]/5 border-[#a82844]/20'
              }`}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">🔴</span>
                  <div>
                    <h3 className="font-['Barlow_Condensed'] text-base font-black tracking-wider uppercase text-white">
                      {record.redTeam.teamName}
                    </h3>
                    <span className="text-[10px] text-[#ff7b95] font-bold">RED SIDE (COUNTER PICK)</span>
                  </div>
                </div>
                {isRedWin && (
                  <span className="font-['Barlow_Condensed'] text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    VICTORY
                  </span>
                )}
              </div>

              {/* Bans */}
              <div className="space-y-1.5">
                <span className="font-['Barlow_Condensed'] text-[10px] font-bold text-[#a0a0a8] uppercase">
                  BANS ({record.redTeam.bans.length})
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {record.redTeam.bans.map((heroName, idx) => (
                    <div
                      key={idx}
                      onClick={() => onInspectHero?.(heroName)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/50 border border-white/15 hover:border-[#d4a857] cursor-pointer transition-colors"
                      title="คลิกเพื่อดูสถิติฮีโร่"
                    >
                      <img
                        src={getHeroImageUrl(heroName)}
                        alt={heroName}
                        className="w-5 h-5 rounded-full object-cover grayscale"
                      />
                      <span className="font-bold text-white/90 text-[11px]">{heroName}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Picks */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <span className="font-['Barlow_Condensed'] text-[10px] font-bold text-[#a0a0a8] uppercase">
                  PICKS (5 HEROES COMPOSITION)
                </span>
                <div className="space-y-1.5">
                  {record.redTeam.picks.map((pick, idx) => (
                    <div
                      key={idx}
                      onClick={() => onInspectHero?.(pick.heroName)}
                      className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/10 hover:border-[#a82844] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-['Barlow_Condensed'] text-xs font-black text-[#ff7b95] w-7">
                          {pick.position}
                        </span>
                        <img
                          src={getHeroImageUrl(pick.heroName)}
                          alt={pick.heroName}
                          className="w-8 h-8 rounded-lg object-cover border border-white/20"
                        />
                        <span className="font-bold text-[12px] text-white">{pick.heroName}</span>
                      </div>
                      {pick.pickOrder && (
                        <span className="text-[10px] font-['Barlow_Condensed'] text-white/50">
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
            <div className="p-3.5 bg-black/40 border border-white/10 rounded-xl space-y-1.5">
              <div className="flex items-center gap-1.5 font-['Barlow_Condensed'] text-xs font-black tracking-wider uppercase text-[#d4a857]">
                <FileText size={14} />
                <span>COACH NOTES & TACTICAL ANALYSIS</span>
              </div>
              <p className="text-[11.5px] text-white/90 leading-relaxed whitespace-pre-wrap">
                {record.notes}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-white/10 bg-black/60 flex items-center justify-between text-xs flex-shrink-0">
          <span className="text-white/50 text-[11px]">Draft ID: {record.id}</span>
          <div className="flex items-center gap-2">
            {onStartRematch && (
              <button
                onClick={() => {
                  onStartRematch(record);
                  onClose();
                }}
                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#a82844] to-[#ff476e] hover:brightness-110 text-white font-['Orbitron'] font-bold text-[11px] tracking-wider flex items-center gap-1.5 shadow-[0_0_12px_rgba(168,40,68,0.4)] transition-all cursor-pointer"
                title="เริ่มดราฟต์เกมถัดไปโดยใช้ข้อมูลคู่แข่งนี้"
              >
                <span>⚔️</span>
                <span>START NEXT GAME (GAME {record.gameNumber + 1})</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-['Barlow_Condensed'] font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
