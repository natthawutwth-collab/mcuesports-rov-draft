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
  if (!name || typeof name !== 'string' || !name.trim()) {
    return 'https://res.cloudinary.com/dtzdhbllb/image/upload/v1775747198/Flowborn.png';
  }
  const clean = name.trim();
  if (HERO_IMG_OVERRIDE[clean]) return HERO_IMG_OVERRIDE[clean];
  return `https://res.cloudinary.com/dtzdhbllb/image/upload/${HERO_IMG_MAP[clean] || clean}.jpg`;
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
  const [catFilter, setCatFilter] = useState<'ALL' | 'male' | 'female' | 'mixed'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // Filtered Players
  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      // Category filter
      if (catFilter !== 'ALL' && (p.category || 'male') !== catFilter) return false;

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
  }, [players, catFilter, posFilter, searchQuery]);

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white border border-[#F3D5E2] rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-['Orbitron'] font-extrabold text-lg tracking-[2px] text-[#1F2937]">
              👥 ROSTER & HERO POOL
            </span>
            <span className="font-['Orbitron'] text-xs font-bold px-2 py-0.5 rounded bg-[#FCE4EC] border border-[#F48FB1] text-[#E91E63]">
              {players.length} PLAYERS
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-['Prompt'] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Cross-Device Cloud Sync</span>
            </span>
          </div>
          <p className="text-xs font-['Prompt'] text-slate-500 mt-0.5">
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
              className="px-3 py-2 rounded-lg font-['Prompt'] font-bold text-xs tracking-wider bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Trash2 size={13} />
              <span className="hidden sm:inline">ลบนักแข่งทั้งหมด</span>
            </button>
          )}

          <button
            onClick={handleAddNew}
            className="flex-1 sm:flex-none px-4 py-2 rounded-lg font-['Prompt'] font-bold text-xs uppercase tracking-wider bg-[#E91E63] hover:bg-[#D81B60] text-white shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <UserPlus size={14} />
            <span>＋ เพิ่มนักแข่งใหม่</span>
          </button>
        </div>
      </div>

      {/* Supabase Connection Status Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-['Prompt']">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white text-emerald-800 border border-emerald-300 flex items-center gap-1.5 font-['Orbitron'] shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            ⚡ SUPABASE
          </span>
          <span className="text-emerald-700 font-medium text-xs">
            เชื่อมต่ออยู่
          </span>
        </div>
      </div>

      {/* Sync / Table notice banner */}
      {syncError && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-300 rounded-xl text-amber-800 text-xs animate-in fade-in font-['Prompt']">
          <AlertCircle size={15} className="text-amber-600 flex-shrink-0" />
          <span>{syncError}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-2.5 p-3 bg-white border border-[#F3D5E2] rounded-xl shadow-xs">
        {/* Row 1: Category Filter Tabs */}
        <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-[#F3D5E2]">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-['Prompt'] font-bold text-slate-500 uppercase tracking-wider">
              หมวดหมู่ทีม:
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCatFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-['Prompt'] font-bold transition-all ${
                  catFilter === 'ALL'
                    ? 'bg-[#E91E63] text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:border-[#E91E63] border border-[#F3D5E2]'
                }`}
              >
                🌐 ทั้งหมด ({players.length})
              </button>
              <button
                type="button"
                onClick={() => setCatFilter('male')}
                className={`px-2.5 py-1 rounded-lg text-xs font-['Prompt'] font-bold transition-all flex items-center gap-1 ${
                  catFilter === 'male'
                    ? 'bg-[#0284C7] text-white border border-[#0284C7] shadow-xs'
                    : 'bg-white text-slate-700 hover:border-[#0284C7] border border-[#F3D5E2]'
                }`}
              >
                <span>👨</span>
                <span>ทีมชาย ({players.filter((p) => (p.category || 'male') === 'male').length})</span>
              </button>
              <button
                type="button"
                onClick={() => setCatFilter('female')}
                className={`px-2.5 py-1 rounded-lg text-xs font-['Prompt'] font-bold transition-all flex items-center gap-1 ${
                  catFilter === 'female'
                    ? 'bg-[#E11D48] text-white border border-[#E11D48] shadow-xs'
                    : 'bg-white text-slate-700 hover:border-[#E11D48] border border-[#F3D5E2]'
                }`}
              >
                <span>👩</span>
                <span>ทีมหญิง ({players.filter((p) => p.category === 'female').length})</span>
              </button>
              <button
                type="button"
                onClick={() => setCatFilter('mixed')}
                className={`px-2.5 py-1 rounded-lg text-xs font-['Prompt'] font-bold transition-all flex items-center gap-1 ${
                  catFilter === 'mixed'
                    ? 'bg-[#9333EA] text-white border border-[#9333EA] shadow-xs'
                    : 'bg-white text-slate-700 hover:border-[#9333EA] border border-[#F3D5E2]'
                }`}
              >
                <span>👥</span>
                <span>ทีมผสม ({players.filter((p) => p.category === 'mixed').length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Search & Role Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อ, Nickname, หรือ Hero..."
              className="w-full bg-white border border-[#F3D5E2] text-[#1F2937] placeholder-slate-400 text-xs font-['Prompt'] pl-8 pr-3 py-1.5 rounded-lg outline-none focus:border-[#E91E63] shadow-xs"
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
                  className={`px-3 py-1 rounded-lg font-['Prompt'] font-bold text-xs tracking-wider transition-all whitespace-nowrap flex items-center gap-1 ${
                    isActive
                      ? 'bg-[#E91E63] text-white shadow-xs border border-[#E91E63]'
                      : 'bg-white border border-[#F3D5E2] text-slate-600 hover:border-[#E91E63] hover:text-[#E91E63]'
                  }`}
                >
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Players Grid */}
      {filteredPlayers.length === 0 ? (
        <div className="p-12 text-center bg-white border border-dashed border-[#F3D5E2] rounded-xl flex flex-col items-center justify-center gap-3 shadow-xs">
          <span className="text-3xl">👥</span>
          <div className="font-['Prompt'] font-bold text-base text-[#1F2937]">ไม่พบข้อมูลนักแข่ง</div>
          <p className="text-xs text-slate-500 font-['Prompt'] max-w-sm">
            {searchQuery
              ? `ไม่มีนักแข่งที่ตรงกับ "${searchQuery}" ในตำแหน่งที่เลือก`
              : 'ยังไม่มีนักแข่งในตำแหน่งนี้ คลิกปุ่มด้านบนเพื่อเพิ่มนักแข่งใหม่'}
          </p>
          <button
            onClick={handleAddNew}
            className="mt-2 px-4 py-2 rounded-lg bg-[#E91E63] hover:bg-[#D81B60] text-white font-['Prompt'] font-bold text-xs uppercase tracking-wider shadow-xs cursor-pointer"
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
                className="bg-white border border-[#F3D5E2] hover:border-[#E91E63] rounded-xl p-4 flex flex-col justify-between gap-3 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
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
                            className="w-13 h-13 rounded-full object-cover border-2 border-[#E91E63] shadow-xs bg-slate-100"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-13 h-13 rounded-full border-2 border-[#E91E63] shadow-xs bg-[#FCE4EC] flex items-center justify-center text-[#E91E63] font-['Orbitron'] font-black text-sm tracking-wider">
                            {player.nickname.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 font-['Orbitron'] text-[9px] font-black px-1.5 py-0.2 rounded bg-white border border-[#F3D5E2] text-[#E91E63] shadow-2xs">
                          {player.position}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-['Prompt'] font-bold text-base tracking-wide text-[#1F2937]">
                            {player.nickname}
                          </h4>
                          <span
                            className={`text-[9.5px] font-['Prompt'] font-bold px-1.5 py-0.2 rounded border ${
                              player.category === 'female'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : (player.category || 'male') === 'male'
                                ? 'bg-sky-50 text-sky-700 border-sky-200'
                                : 'bg-purple-50 text-purple-700 border-purple-200'
                            }`}
                          >
                            {player.category === 'female'
                              ? '👩 ทีมหญิง'
                              : (player.category || 'male') === 'male'
                              ? '👨 ทีมชาย'
                              : '👥 ทีมผสม'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-['Prompt']">{player.name}</p>
                        <span className="inline-block mt-0.5 text-[10px] font-['Prompt'] font-semibold text-slate-400 tracking-wider uppercase">
                          {player.position} LANER
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(player)}
                        title="แก้ไขข้อมูลนักแข่ง / Hero Pool"
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors border border-slate-300 cursor-pointer shadow-2xs"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(player.id, player.nickname)}
                        title="ลบนักแข่ง"
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 transition-colors border border-rose-200 cursor-pointer shadow-2xs"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Hero Pool Section */}
                <div className="space-y-2 pt-2 border-t border-[#F3D5E2]">
                  {/* Signature Heroes (⭐ สีทอง) */}
                  <div>
                    <div className="flex items-center justify-between text-[10.5px] font-['Prompt'] font-bold text-[#B45309] tracking-wider uppercase mb-1">
                      <span className="flex items-center gap-1">
                        <Star size={11} className="fill-[#F59E0B] text-[#F59E0B]" />
                        <span>SIGNATURE HEROES ({signatures.length})</span>
                      </span>
                    </div>

                    {signatures.length === 0 ? (
                      <span className="text-[11px] text-slate-400 font-['Prompt'] italic">ไม่มี Signature</span>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {signatures.map((h) => (
                          <div
                            key={h.heroName}
                            className="flex items-center gap-1 pl-1 pr-1.5 py-0.5 rounded bg-[#FEF3C7] border border-[#F59E0B] text-[#B45309] font-['Prompt'] font-bold text-xs shadow-2xs"
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
                    <div className="flex items-center justify-between text-[10.5px] font-['Prompt'] font-bold text-slate-600 tracking-wider uppercase mb-1">
                      <span className="flex items-center gap-1">
                        <Star size={11} className="fill-slate-400 text-slate-400" />
                        <span>COMFORTABLE HEROES ({comfortables.length})</span>
                      </span>
                    </div>

                    {comfortables.length === 0 ? (
                      <span className="text-[11px] text-slate-400 font-['Prompt'] italic">ไม่มี Comfortable</span>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {comfortables.map((h) => (
                          <div
                            key={h.heroName}
                            className="flex items-center gap-1 pl-1 pr-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-700 font-['Prompt'] font-bold text-xs shadow-2xs"
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
                <div className="pt-2 border-t border-[#F3D5E2] flex items-center justify-between text-[11px] text-slate-500 font-['Prompt']">
                  <span>เชื่อมกับหน้าดราฟแล้ว</span>
                  <button
                    onClick={onSwitchToDraft}
                    className="text-[#E91E63] hover:text-[#D81B60] font-['Prompt'] font-bold text-xs uppercase tracking-wider cursor-pointer"
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
