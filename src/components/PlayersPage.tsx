import React, { useState, useMemo } from 'react';
import { Player, PlayerPosition } from '../types/player';
import { PlayerModal } from './PlayerModal';
import { HERO_IMG_MAP, HERO_IMG_OVERRIDE } from '../data/heroes';
import {
  Search,
  UserPlus,
  Edit2,
  Trash2,
  Star,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';

interface PlayersPageProps {
  players: Player[];
  teamId?: string;
  isSyncing?: boolean;
  isCloudConnected?: boolean;
  activeProvider?: 'supabase' | 'local';
  lastSyncedAt?: string | null;
  syncError?: string | null;
  onAddPlayer: (data: Parameters<typeof PlayerModal>[0]['onSave'] extends (data: infer T) => void ? T : never) => void;
  onUpdatePlayer: (id: string, updates: Partial<Player>) => void;
  onDeletePlayer: (id: string) => void;
  onResetToDefault: () => void;
  onSwitchToDraft: () => void;
  onChangeTeamId?: (newTeamId: string) => void;
  onForceSync?: () => Promise<boolean>;
  onReloadCloud?: () => Promise<boolean>;
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
  syncError = null,
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
            <span className="inline-flex items-center gap-1.5 text-[11px] font-['Barlow_Condensed'] font-semibold px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Cross-Device Cloud Sync</span>
            </span>
          </div>
          <p className="text-xs font-['Kanit'] text-[#a0a0a8] mt-0.5">
            จัดการรายชื่อผู้เล่น ตำแหน่ง และกำหนดระดับความชำนาญ Hero Pool (⭐ Signature / ★ Comfortable) เพื่อซิงค์ขึ้นหน้าดราฟ
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {players.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('คุณต้องการลบรายชื่อนักแข่งทั้งหมดในทีมใช่หรือไม่? ข้อมูลทั้งหมดรวมถึงบน Cloud จะถูกล้าง')) {
                  onResetToDefault();
                }
              }}
              title="ลบรายชื่อนักแข่งทั้งหมด"
              className="px-3 py-2 rounded-lg font-['Barlow_Condensed'] font-bold text-xs tracking-wider bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-red-100 border border-red-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 size={13} />
              <span className="hidden sm:inline">ลบนักแข่งทั้งหมด</span>
            </button>
          )}

          <button
            onClick={handleAddNew}
            className="flex-1 sm:flex-none px-4 py-2 rounded-lg font-['Barlow_Condensed'] font-black text-xs uppercase tracking-wider bg-[#a82844] hover:bg-[#c93958] text-white border border-[#a82844]/80 shadow-[0_0_15px_rgba(168,40,68,0.3)] transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <UserPlus size={14} />
            <span>＋ เพิ่มนักแข่งใหม่</span>
          </button>
        </div>
      </div>

      {/* Supabase Connection Status Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-xs font-['Kanit']">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 flex items-center gap-1.5 font-['Orbitron']">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ⚡ SUPABASE
          </span>
          <span className="text-emerald-400 font-medium text-xs">
            เชื่อมต่ออยู่
          </span>
        </div>
      </div>

      {/* Sync / Table notice banner */}
      {syncError && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-950/40 border border-amber-500/40 rounded-xl text-amber-200 text-xs animate-in fade-in">
          <AlertCircle size={15} className="text-amber-400 flex-shrink-0" />
          <span>{syncError}</span>
        </div>
      )}

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
                className={`px-3 py-1 rounded-lg font-['Barlow_Condensed'] font-bold text-xs tracking-wider transition-all whitespace-nowrap flex items-center gap-1 ${
                  isActive
                    ? 'bg-[#a82844] text-white shadow-[0_0_10px_rgba(168,40,68,0.4)]'
                    : `bg-white/5 border border-white/10 text-white/60 hover:text-white ${f.color}`
                }`}
              >
                <span>{f.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Players Grid */}
      {filteredPlayers.length === 0 ? (
        <div className="p-12 text-center bg-black/30 border border-dashed border-white/15 rounded-xl flex flex-col items-center justify-center gap-3">
          <span className="text-3xl">👥</span>
          <div className="font-['Orbitron'] font-bold text-base text-white">ไม่พบข้อมูลนักแข่ง</div>
          <p className="text-xs text-white/50 font-['Kanit'] max-w-sm">
            {searchQuery
              ? `ไม่มีนักแข่งที่ตรงกับ "${searchQuery}" ในตำแหน่งที่เลือก`
              : 'ยังไม่มีนักแข่งในตำแหน่งนี้ คลิกปุ่มด้านบนเพื่อเพิ่มนักแข่งใหม่'}
          </p>
          <button
            onClick={handleAddNew}
            className="mt-2 px-4 py-2 rounded-lg bg-[#a82844] text-white font-['Barlow_Condensed'] font-bold text-xs uppercase tracking-wider"
          >
            ＋ เพิ่มนักแข่งคนแรก
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlayers.map((player) => {
            const signatures = player.heroPool.filter((h) => h.tier === 'signature');
            const comfortables = player.heroPool.filter((h) => h.tier === 'comfortable');

            return (
              <div
                key={player.id}
                className="bg-[rgba(20,20,26,0.8)] border border-white/10 hover:border-white/20 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-lg hover:shadow-2xl transition-all group backdrop-blur-sm relative overflow-hidden"
              >
                {/* Top Profile Card */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {player.avatarUrl ? (
                          <img
                            src={player.avatarUrl}
                            alt={player.nickname}
                            className="w-12 h-12 rounded-full object-cover border-2 border-[#a82844] shadow-md bg-black/60"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                              const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-12 h-12 rounded-full border-2 border-[#a82844]/70 bg-gradient-to-br from-[#2a1318] via-[#1a1528] to-[#121217] shadow-md items-center justify-center font-['Orbitron'] font-black text-sm text-[#ff7b95] select-none ${
                            player.avatarUrl ? 'hidden' : 'flex'
                          }`}
                        >
                          {player.nickname ? player.nickname.slice(0, 2).toUpperCase() : 'ROV'}
                        </div>
                        <span className="absolute -bottom-1 -right-1 font-['Orbitron'] text-[9px] font-black px-1.5 py-0.2 rounded bg-black border border-white/20 text-[#d4a857]">
                          {player.position}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-['Orbitron'] font-extrabold text-base tracking-wider text-white">
                            {player.nickname}
                          </h4>
                        </div>
                        <p className="text-xs text-[#a0a0a8] font-['Kanit']">{player.name}</p>
                        <span className="inline-block mt-0.5 text-[10px] font-['Barlow_Condensed'] font-bold text-white/50 tracking-wider uppercase">
                          {player.position} LANER
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(player)}
                        title="แก้ไขข้อมูลนักแข่ง / Hero Pool"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(player.id, player.nickname)}
                        title="ลบนักแข่ง"
                        className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-200 transition-colors border border-red-500/20"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Hero Pool Section */}
                <div className="space-y-2 pt-2 border-t border-white/5">
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
                            className="flex items-center gap-1 pl-1 pr-1.5 py-0.5 rounded bg-[#d4a857]/15 border border-[#d4a857]/40 text-[#d4a857] font-['Barlow_Condensed'] font-bold text-xs shadow-sm"
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
              // Ensure newly added player is immediately visible
              setSearchQuery('');
              setPosFilter('ALL');
            }
          }}
        />
      )}
    </div>
  );
};
