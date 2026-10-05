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
  Users,
  Shield,
  Zap,
  ArrowRight,
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

const POS_FILTERS: { key: 'ALL' | PlayerPosition; label: string }[] = [
  { key: 'ALL', label: 'ทุกตำแหน่ง' },
  { key: 'DSL', label: 'DSL' },
  { key: 'Jungle', label: 'JUNGLE' },
  { key: 'Mid', label: 'MID' },
  { key: 'Support', label: 'SUPPORT' },
  { key: 'ADL', label: 'ADL' },
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
      if (catFilter !== 'ALL') {
        const cats = p.categories || [p.category || 'male'];
        if (!cats.includes(catFilter as any)) return false;
      }

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
    <div className="flex-1 flex flex-col gap-3.5 sm:gap-4 font-['Prompt'] text-slate-800 animate-in fade-in duration-200 select-none">
      {/* 1. Header & Management Actions */}
      <div className="p-4 bg-white border border-[#F3D5E2] rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-['Prompt'] font-bold text-lg sm:text-xl text-slate-900 leading-snug">
              จัดการรายชื่อนักแข่ง (Roster & Hero Pool)
            </h1>
            <span className="font-['Orbitron'] text-xs font-bold px-2 py-0.5 rounded-full bg-[#FCE4EC] border border-[#F48FB1] text-[#E91E63]">
              {players.length} PLAYERS
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Cloud Sync</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            กำหนดตำแหน่ง และพูลฮีโร่ (⭐ Signature / ★ Comfortable) เพื่อใช้แนะนำในการดราฟต์
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {players.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('คุณต้องการล้างรายชื่อนักแข่งทั้งหมดในทีมใช่หรือไม่?')) {
                  onResetToDefault();
                }
              }}
              title="ลบรายชื่อนักแข่งทั้งหมด"
              className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Trash2 size={13} />
              <span className="hidden sm:inline">ล้างทั้งหมด</span>
            </button>
          )}

          <button
            onClick={handleAddNew}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl font-bold text-xs sm:text-[13px] bg-gradient-to-r from-[#E91E63] to-[#D81B60] hover:from-[#D81B60] hover:to-[#C2185B] text-white shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
          >
            <UserPlus size={14} />
            <span>＋ เพิ่มนักแข่งใหม่</span>
          </button>
        </div>
      </div>

      {/* Sync Warning Banner if error */}
      {syncError && (
        <div className="flex items-center gap-2 px-3.5 py-2 bg-amber-50 border border-amber-300 rounded-xl text-amber-800 text-xs">
          <AlertCircle size={15} className="text-amber-600 flex-shrink-0" />
          <span>{syncError}</span>
        </div>
      )}

      {/* 2. Unified Search & Category / Position Filters */}
      <div className="p-3 sm:p-3.5 bg-white border border-[#F3D5E2] rounded-2xl shadow-xs flex flex-col gap-2.5">
        {/* Category Tabs */}
        <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              หมวดหมู่ทีม:
            </span>
            <div className="flex items-center gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => setCatFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  catFilter === 'ALL'
                    ? 'bg-[#E91E63] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                🌐 ทั้งหมด ({players.length})
              </button>
              <button
                type="button"
                onClick={() => setCatFilter('male')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  catFilter === 'male'
                    ? 'bg-[#0284C7] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:text-[#0284C7] border border-slate-200'
                }`}
              >
                <span>👨 ทีมชาย</span>
                <span className="text-[10px] opacity-80">
                  ({players.filter((p) => (p.categories || [p.category || 'male']).includes('male')).length})
                </span>
              </button>
              <button
                type="button"
                onClick={() => setCatFilter('female')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  catFilter === 'female'
                    ? 'bg-[#E11D48] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:text-[#E11D48] border border-slate-200'
                }`}
              >
                <span>👩 ทีมหญิง</span>
                <span className="text-[10px] opacity-80">
                  ({players.filter((p) => (p.categories || [p.category || 'male']).includes('female')).length})
                </span>
              </button>
              <button
                type="button"
                onClick={() => setCatFilter('mixed')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  catFilter === 'mixed'
                    ? 'bg-[#9333EA] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:text-[#9333EA] border border-slate-200'
                }`}
              >
                <span>👥 ทีมผสม</span>
                <span className="text-[10px] opacity-80">
                  ({players.filter((p) => (p.categories || [p.category || 'male']).includes('mixed')).length})
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Search & Position Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อนักแข่ง, Nickname, หรือฮีโร่..."
              className="w-full bg-[#FFF8FB] border border-[#F3D5E2] focus:border-[#E91E63] focus:bg-white text-slate-900 placeholder-slate-400 text-xs pl-8 pr-3 py-1.5 rounded-xl outline-none transition-all shadow-2xs"
            />
          </div>

          {/* Position Pills */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {POS_FILTERS.map((f) => {
              const isActive = posFilter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setPosFilter(f.key)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#E91E63] text-white shadow-2xs'
                      : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Players Cards Grid */}
      {filteredPlayers.length === 0 ? (
        <div className="p-12 text-center bg-white border border-dashed border-[#F3D5E2] rounded-2xl flex flex-col items-center justify-center gap-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#FFF0F5] text-[#E91E63] flex items-center justify-center text-xl">
            👥
          </div>
          <div>
            <div className="font-bold text-base text-slate-800">ไม่พบข้อมูลนักแข่ง</div>
            <p className="text-xs text-slate-400 mt-0.5 max-w-sm">
              {searchQuery
                ? `ไม่มีนักแข่งที่ตรงกับ "${searchQuery}" ในตัวกรองที่เลือก`
                : 'ยังไม่มีนักแข่งในหมวดนี้ คลิกปุ่มด้านบนเพื่อเพิ่มนักแข่งใหม่'}
            </p>
          </div>
          <button
            onClick={handleAddNew}
            className="mt-1 px-4 py-2 rounded-xl bg-[#E91E63] hover:bg-[#D81B60] text-white font-bold text-xs shadow-xs cursor-pointer transition-all"
          >
            ＋ เพิ่มนักแข่งคนแรก
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredPlayers.map((player) => {
            const signatures = player.heroPool.filter((h) => h.tier === 'signature');
            const comfortables = player.heroPool.filter((h) => h.tier === 'comfortable');

            return (
              <div
                key={player.id}
                className="bg-white border border-slate-200 hover:border-[#F48FB1] rounded-2xl p-3.5 flex flex-col justify-between gap-3 shadow-2xs hover:shadow-xs transition-all group"
              >
                {/* Profile Header */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative flex-shrink-0">
                        {player.avatarUrl ? (
                          <img
                            src={player.avatarUrl}
                            alt={player.nickname}
                            className="w-12 h-12 rounded-xl object-cover border-2 border-[#E91E63] shadow-xs bg-slate-100"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl border-2 border-[#E91E63] shadow-xs bg-[#FCE4EC] flex items-center justify-center text-[#E91E63] font-['Orbitron'] font-black text-sm">
                            {player.nickname.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 font-['Orbitron'] text-[8.5px] font-black px-1 rounded bg-white border border-slate-200 text-[#E91E63] shadow-2xs">
                          {player.position}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-base text-slate-900 truncate">
                            {player.nickname}
                          </h4>
                          {(player.categories && player.categories.length > 0
                            ? player.categories
                            : [player.category || 'male']
                          ).map((cat) => (
                            <span
                              key={cat}
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                cat === 'female'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : cat === 'male'
                                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                                  : 'bg-purple-50 text-purple-700 border-purple-200'
                              }`}
                            >
                              {cat === 'female' ? 'หญิง' : cat === 'male' ? 'ชาย' : 'ผสม'}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-slate-500 truncate">{player.name}</p>
                      </div>
                    </div>

                    {/* Action buttons: Edit & Delete */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(player)}
                        title="แก้ไขข้อมูลนักแข่ง"
                        className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(player.id, player.nickname)}
                        title="ลบนักแข่ง"
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 border border-rose-200 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Hero Pool: Signature & Comfortable */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  {/* Signature Heroes */}
                  <div>
                    <div className="flex items-center gap-1 text-[10.5px] font-bold text-[#B45309] uppercase tracking-wider mb-1">
                      <Star size={11} className="fill-[#F59E0B] text-[#F59E0B]" />
                      <span>Signature Heroes ({signatures.length})</span>
                    </div>

                    {signatures.length === 0 ? (
                      <span className="text-[11px] text-slate-400 italic">ไม่มี Signature</span>
                    ) : (
                      <div className="flex items-center gap-1 flex-wrap">
                        {signatures.map((h) => (
                          <div
                            key={h.heroName}
                            className="flex items-center gap-1 pl-1 pr-1.5 py-0.5 rounded-lg bg-[#FEF3C7] border border-[#F59E0B] text-[#B45309] font-bold text-xs shadow-2xs"
                            title={`Signature: ${h.heroName}`}
                          >
                            <img
                              src={getHeroImg(h.heroName)}
                              alt={h.heroName}
                              className="w-4 h-4 rounded object-cover"
                            />
                            <span>{h.heroName}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Comfortable Heroes */}
                  <div>
                    <div className="flex items-center gap-1 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      <Star size={11} className="fill-slate-400 text-slate-400" />
                      <span>Comfortable Heroes ({comfortables.length})</span>
                    </div>

                    {comfortables.length === 0 ? (
                      <span className="text-[11px] text-slate-400 italic">ไม่มี Comfortable</span>
                    ) : (
                      <div className="flex items-center gap-1 flex-wrap">
                        {comfortables.map((h) => (
                          <div
                            key={h.heroName}
                            className="flex items-center gap-1 pl-1 pr-1.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs shadow-2xs"
                            title={`Comfortable: ${h.heroName}`}
                          >
                            <img
                              src={getHeroImg(h.heroName)}
                              alt={h.heroName}
                              className="w-4 h-4 rounded object-cover"
                            />
                            <span>{h.heroName}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer link to draft */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span className="text-[11px]">พร้อมดราฟต์</span>
                  <button
                    onClick={onSwitchToDraft}
                    className="text-[#E91E63] hover:text-[#D81B60] font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>ไปที่ห้องดราฟต์</span>
                    <ArrowRight size={12} />
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
              setSearchQuery('');
              setPosFilter('ALL');
            }
          }}
        />
      )}
    </div>
  );
};
