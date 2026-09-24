import React, { useState, useMemo } from 'react';
import { Player, PlayerPosition } from '../types/player';
import { PlayerModal } from './PlayerModal';
import { HERO_IMG_MAP, HERO_IMG_OVERRIDE } from '../data/heroes';
import { Search, UserPlus, Edit2, Trash2, Star, Shield, RotateCcw } from 'lucide-react';

interface PlayersPageProps {
  players: Player[];
  onAddPlayer: (data: Parameters<typeof PlayerModal>[0]['onSave'] extends (data: infer T) => void ? T : never) => void;
  onUpdatePlayer: (id: string, updates: Partial<Player>) => void;
  onDeletePlayer: (id: string) => void;
  onResetToDefault: () => void;
  onSwitchToDraft: () => void;
}

const POS_FILTERS: { key: 'ALL' | PlayerPosition; label: string; color: string }[] = [
  { key: 'ALL', label: 'ALL POSITIONS', color: 'hover:text-white' },
  { key: 'DSL', label: 'DSL', color: 'text-[#c47842]' },
  { key: 'Jungle', label: 'JUNGLE', color: 'text-[#5a8a6a]' },
  { key: 'Mid', label: 'MID', color: 'text-[#9b6da8]' },
  { key: 'Support', label: 'SUPPORT', color: 'text-[#6b8fb8]' },
  { key: 'ADL', label: 'ADL', color: 'text-[#d4a857]' },
];

function getHeroImg(name: string): string {
  if (HERO_IMG_OVERRIDE[name]) return HERO_IMG_OVERRIDE[name];
  return `https://res.cloudinary.com/dtzdhbllb/image/upload/${HERO_IMG_MAP[name] || name}.jpg`;
}

export const PlayersPage: React.FC<PlayersPageProps> = ({
  players,
  onAddPlayer,
  onUpdatePlayer,
  onDeletePlayer,
  onResetToDefault,
  onSwitchToDraft,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [posFilter, setPosFilter] = useState<'ALL' | PlayerPosition>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // Filtered Players
  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      // Pos filter
      if (posFilter !== 'ALL' && p.position !== posFilter) return false;

      // Search Query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.trim().toLowerCase();
        const matchNick = p.nickname.toLowerCase().includes(q);
        const matchName = p.name.toLowerCase().includes(q);
        const matchPos = p.position.toLowerCase().includes(q);
        const matchHeroes = p.heroPool.some((h) => h.heroName.toLowerCase().includes(q));
        if (!matchNick && !matchName && !matchPos && !matchHeroes) return false;
      }

      return true;
    });
  }, [players, posFilter, searchQuery]);

  const handleEdit = (player: Player) => {
    setEditingPlayer(player);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingPlayer(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, nickname: string) => {
    if (window.confirm(`ยืนยันการลบนักแข่ง "${nickname}" ออกจากทีม?`)) {
      onDeletePlayer(id);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-4 animate-in fade-in duration-200">
      {/* Top Banner & Action Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-[rgba(20,20,26,0.7)] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-lg backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-['Orbitron'] font-extrabold text-lg tracking-[2px] text-white">
              👥 ROSTER & HERO POOL
            </span>
            <span className="font-['Orbitron'] text-xs font-bold px-2 py-0.5 rounded bg-[#a82844]/20 border border-[#a82844]/60 text-red-200">
              {players.length} PLAYERS
            </span>
          </div>
          <p className="text-xs font-['Kanit'] text-[#a0a0a8] mt-0.5">
            จัดการรายชื่อผู้เล่น ตำแหน่ง และกำหนดระดับความชำนาญ Hero Pool (⭐ Signature / ★ Comfortable) เพื่อซิงค์ขึ้นหน้าดราฟ
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onResetToDefault}
            title="รีเซ็ตกลับเป็นไลน์อัปตัวอย่าง 5 ตำแหน่ง"
            className="px-3 py-2 rounded-lg font-['Barlow_Condensed'] font-bold text-xs tracking-wider bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">รีเซ็ตไลน์อัป</span>
          </button>

          <button
            onClick={handleAddNew}
            className="flex-1 sm:flex-none px-4 py-2 rounded-lg font-['Barlow_Condensed'] font-black text-xs uppercase tracking-wider bg-[#a82844] hover:bg-[#c93958] text-white border border-[#a82844]/80 shadow-[0_0_15px_rgba(168,40,68,0.3)] transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <UserPlus size={14} />
            <span>＋ เพิ่มนักแข่งใหม่</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-black/40 border border-white/10 rounded-xl backdrop-blur-sm">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={13} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อ, Nickname, หรือ Hero..."
            className="w-full bg-[rgba(20,20,26,0.8)] border border-white/10 text-white text-xs font-['Kanit'] pl-8 pr-3 py-1.5 rounded-lg outline-none focus:border-[#a82844]"
          />
        </div>

        {/* Position Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full sm:w-auto">
          {POS_FILTERS.map((f) => {
            const isActive = posFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setPosFilter(f.key)}
                className={`font-['Barlow_Condensed'] text-xs font-bold px-3 py-1 rounded-md border transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#a82844] border-[#a82844] text-white shadow-sm'
                    : `bg-white/[0.03] border-white/10 ${f.color}`
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Players Grid */}
      {filteredPlayers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-black/30 border border-white/10 rounded-xl text-center">
          <Shield size={36} className="text-white/20 mb-2" />
          <div className="font-['Kanit'] text-sm text-white/70 font-medium">ไม่พบข้อมูลนักแข่ง</div>
          <div className="text-xs text-white/40 font-['Kanit'] mt-1">ลองเปลี่ยนคำค้นหา หรือกดปุ่ม "เพิ่มนักแข่งใหม่"</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {filteredPlayers.map((player) => {
            const signatures = player.heroPool.filter((h) => h.tier === 'signature');
            const comfortables = player.heroPool.filter((h) => h.tier === 'comfortable');

            const posColorClass =
              player.position === 'DSL'
                ? 'bg-[#c47842]/20 border-[#c47842] text-[#f49862]'
                : player.position === 'Jungle'
                ? 'bg-[#5a8a6a]/20 border-[#5a8a6a] text-[#8ac49a]'
                : player.position === 'Mid'
                ? 'bg-[#9b6da8]/20 border-[#9b6da8] text-[#cb9dd8]'
                : player.position === 'Support'
                ? 'bg-[#6b8fb8]/20 border-[#6b8fb8] text-[#9bbfe8]'
                : 'bg-[#d4a857]/20 border-[#d4a857] text-[#f6ca77]';

            return (
              <div
                key={player.id}
                className="group relative flex flex-col justify-between p-4 rounded-xl border border-white/10 bg-[rgba(20,20,26,0.65)] hover:border-white/25 hover:bg-[rgba(25,25,32,0.85)] transition-all shadow-md backdrop-blur-sm"
              >
                {/* Top Player Info */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 group-hover:border-[#a82844] shadow-md bg-black/60 flex-shrink-0 transition-colors">
                      <img
                        src={player.avatarUrl}
                        alt={player.nickname}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80';
                        }}
                      />
                    </div>

                    {/* Names */}
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-['Orbitron'] font-black text-base tracking-wider text-white">
                          {player.nickname}
                        </span>
                        <span
                          className={`font-['Barlow_Condensed'] font-black text-[10.5px] px-2 py-0.5 rounded border uppercase tracking-wider ${posColorClass}`}
                        >
                          {player.position}
                        </span>
                      </div>
                      <span className="text-xs font-['Kanit'] text-[#a0a0a8] truncate max-w-[180px]">
                        {player.name}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(player)}
                      title="แก้ไขข้อมูล"
                      className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(player.id, player.nickname)}
                      title="ลบนักแข่ง"
                      className="p-1.5 rounded-md bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-300 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Hero Pool Display */}
                <div className="py-3 flex flex-col gap-2.5 flex-1">
                  {/* Signature Heroes (⭐ สีทอง) */}
                  <div>
                    <div className="flex items-center justify-between text-[10.5px] font-['Barlow_Condensed'] font-extrabold text-[#d4a857] tracking-wider uppercase mb-1">
                      <span className="flex items-center gap-1">
                        <Star size={11} className="fill-[#d4a857] text-[#d4a857]" />
                        <span>SIGNATURE HEROES ({signatures.length})</span>
                      </span>
                    </div>

                    {signatures.length === 0 ? (
                      <span className="text-[11px] text-white/30 font-['Kanit'] italic">ไม่มี Signature</span>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {signatures.map((h) => (
                          <div
                            key={h.heroName}
                            className="flex items-center gap-1 pl-1 pr-1.5 py-0.5 rounded bg-[#d4a857]/15 border border-[#d4a857]/40 text-[#ffd67a] font-['Barlow_Condensed'] font-bold text-xs shadow-sm"
                            title={`Signature Hero: ${h.heroName}`}
                          >
                            <img
                              src={getHeroImg(h.heroName)}
                              alt={h.heroName}
                              className="w-4 h-4 rounded object-cover"
                            />
                            <span>⭐ {h.heroName}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Comfortable Heroes (★ สีเงิน) */}
                  <div>
                    <div className="flex items-center justify-between text-[10.5px] font-['Barlow_Condensed'] font-extrabold text-slate-300 tracking-wider uppercase mb-1">
                      <span className="flex items-center gap-1">
                        <Star size={11} className="fill-slate-300 text-slate-300" />
                        <span>COMFORTABLE HEROES ({comfortables.length})</span>
                      </span>
                    </div>

                    {comfortables.length === 0 ? (
                      <span className="text-[11px] text-white/30 font-['Kanit'] italic">ไม่มี Comfortable</span>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {comfortables.map((h) => (
                          <div
                            key={h.heroName}
                            className="flex items-center gap-1 pl-1 pr-1.5 py-0.5 rounded bg-white/10 border border-slate-400/40 text-slate-200 font-['Barlow_Condensed'] font-bold text-xs shadow-sm"
                            title={`Comfortable Hero: ${h.heroName}`}
                          >
                            <img
                              src={getHeroImg(h.heroName)}
                              alt={h.heroName}
                              className="w-4 h-4 rounded object-cover"
                            />
                            <span>★ {h.heroName}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer status link */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-[#a0a0a8] font-['Kanit']">
                  <span>เชื่อมกับหน้าดราฟแล้ว</span>
                  <button
                    onClick={onSwitchToDraft}
                    className="text-[#a82844] hover:text-[#c93958] font-['Barlow_Condensed'] font-bold text-xs uppercase tracking-wider"
                  >
                    ดูบนหน้าดราฟ →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Player Modal */}
      {isModalOpen && (
        <PlayerModal
          isOpen={true}
          onClose={() => setIsModalOpen(false)}
          initialPlayer={editingPlayer}
          onSave={(data) => {
            if (editingPlayer) {
              onUpdatePlayer(editingPlayer.id, data);
            } else {
              onAddPlayer(data);
            }
          }}
        />
      )}
    </div>
  );
};
