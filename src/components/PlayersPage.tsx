import React, { useState, useMemo } from 'react';
import { Player, PlayerPosition } from '../types/player';
import { PlayerModal } from './PlayerModal';
import { SupabaseConfigModal } from './SupabaseConfigModal';
import { HERO_IMG_MAP, HERO_IMG_OVERRIDE } from '../data/heroes';
import {
  Search,
  UserPlus,
  Edit2,
  Trash2,
  Star,
  RotateCcw,
  Cloud,
  RefreshCw,
  Key,
  Copy,
  Check,
  Share2,
  Database,
} from 'lucide-react';

interface PlayersPageProps {
  players: Player[];
  teamId?: string;
  isSyncing?: boolean;
  isCloudConnected?: boolean;
  activeProvider?: 'supabase' | 'local';
  lastSyncedAt?: string | null;
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
  teamId = 'main_team',
  isSyncing = false,
  isCloudConnected = true,
  activeProvider = 'supabase',
  lastSyncedAt = null,
  onAddPlayer,
  onUpdatePlayer,
  onDeletePlayer,
  onResetToDefault,
  onSwitchToDraft,
  onChangeTeamId,
  onForceSync,
  onReloadCloud,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [posFilter, setPosFilter] = useState<'ALL' | PlayerPosition>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // Backend / Supabase Config Modal
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Team ID Management Modal
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [teamInput, setTeamInput] = useState(teamId);
  const [copiedTeamId, setCopiedTeamId] = useState(false);
  const [manualSyncLoading, setManualSyncLoading] = useState(false);
  const [manualSyncMsg, setManualSyncMsg] = useState<string | null>(null);

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

  const handleManualForceSync = async () => {
    if (!onForceSync) return;
    setManualSyncLoading(true);
    setManualSyncMsg('กำลังบันทึกขึ้น Cloud...');
    try {
      const ok = await onForceSync();
      if (ok) {
        setManualSyncMsg('✅ บันทึกขึ้น Cloud สำเร็จ! ข้อมูลจะซิงค์ไปทุกเครื่องทันที');
      } else {
        setManualSyncMsg('❌ ไม่สามารถบันทึกขึ้น Cloud ได้');
      }
    } catch {
      setManualSyncMsg('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setManualSyncLoading(false);
      setTimeout(() => setManualSyncMsg(null), 4000);
    }
  };

  const handleManualReload = async () => {
    if (!onReloadCloud) return;
    setManualSyncLoading(true);
    setManualSyncMsg('กำลังดึงข้อมูลล่าสุดจาก Cloud...');
    try {
      const ok = await onReloadCloud();
      if (ok) {
        setManualSyncMsg('✅ อัปเดตข้อมูลนักแข่งล่าสุดจาก Cloud สำเร็จ!');
      } else {
        setManualSyncMsg('ℹ️ ข้อมูลตรงกับบน Cloud แล้ว');
      }
    } catch {
      setManualSyncMsg('❌ ไม่สามารถดึงข้อมูลจาก Cloud ได้');
    } finally {
      setManualSyncLoading(false);
      setTimeout(() => setManualSyncMsg(null), 4000);
    }
  };

  const handleCopyTeamId = () => {
    navigator.clipboard?.writeText(teamId);
    setCopiedTeamId(true);
    setTimeout(() => setCopiedTeamId(false), 2000);
  };

  const handleSaveTeamId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamInput.trim() || !onChangeTeamId) return;
    onChangeTeamId(teamInput.trim());
    setIsTeamModalOpen(false);
  };

  const formatLastSync = (iso: string | null) => {
    if (!iso) return 'เชื่อมต่อแล้ว';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'เมื่อสักครู่';
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

      {/* Cloud Cross-Device Persistence Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 px-4 py-2.5 bg-gradient-to-r from-sky-950/40 via-sky-900/20 to-black/40 border border-sky-500/30 rounded-xl text-xs font-['Kanit']">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-sky-300 font-medium">
            <Cloud size={15} className={isSyncing ? 'animate-bounce text-amber-400' : 'text-sky-400'} />
            <span className="font-['Orbitron'] font-bold text-[11px] tracking-wider uppercase text-white">
              CLOUD ROSTER:
            </span>
            <span className="font-mono bg-sky-900/60 px-1.5 py-0.5 rounded text-white font-bold text-[11px] border border-sky-400/30">
              {teamId}
            </span>
          </div>

          <span className="text-white/40">|</span>

          <div className="flex items-center gap-2 text-[11px] text-white/70 flex-wrap">
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                activeProvider === 'supabase'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
              }`}
            >
              {activeProvider === 'supabase' ? '⚡ Supabase' : '💾 Local Storage'}
            </span>

            {isSyncing ? (
              <span className="text-amber-300 flex items-center gap-1">
                <RefreshCw size={11} className="animate-spin" /> กำลังบันทึกข้อมูล...
              </span>
            ) : isCloudConnected ? (
              <span className="text-emerald-400 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                ออนไลน์ ซิงค์ Supabase สำเร็จ ({formatLastSync(lastSyncedAt)})
              </span>
            ) : (
              <span className="text-amber-300">โหมด Local Storage (กด "ตั้งค่า Supabase" เพื่อเชื่อมต่อ Cloud)</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
          {manualSyncMsg && (
            <span className="text-[11px] text-amber-200 animate-in fade-in font-medium px-2 py-0.5 rounded bg-black/50 border border-amber-400/40">
              {manualSyncMsg}
            </span>
          )}

          <button
            onClick={() => setIsConfigModalOpen(true)}
            title="ตั้งค่า Supabase URL และ Anon Key เพื่อเชื่อมต่อโปรเจกต์ของคุณ"
            className="px-2.5 py-1 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 font-['Barlow_Condensed'] font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
          >
            <Database size={11} />
            <span>ตั้งค่า Supabase</span>
          </button>

          <button
            onClick={handleManualForceSync}
            disabled={manualSyncLoading}
            title="บันทึกข้อมูลนักแข่งและฮีโร่พูลขึ้น Cloud ทันที เพื่อให้เครื่องอื่นเห็นได้เลย"
            className="px-2.5 py-1 rounded-md bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-500/40 font-['Barlow_Condensed'] font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1 disabled:opacity-50 cursor-pointer"
          >
            <Cloud size={12} />
            <span>บันทึกลง Cloud ทันที</span>
          </button>

          <button
            onClick={handleManualReload}
            disabled={manualSyncLoading}
            title="ดึงข้อมูลนักแข่งล่าสุดจาก Cloud"
            className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-white/80 border border-white/15 font-['Barlow_Condensed'] font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={11} className={manualSyncLoading ? 'animate-spin' : ''} />
            <span>โหลดจาก Cloud</span>
          </button>

          <button
            onClick={() => {
              setTeamInput(teamId);
              setIsTeamModalOpen(true);
            }}
            title="จัดการรหัสทีม / เปลี่ยนทีม เพื่อแชร์ไปยังเครื่องอื่น"
            className="px-2.5 py-1 rounded-md bg-[#d4a857]/20 hover:bg-[#d4a857]/30 text-[#d4a857] border border-[#d4a857]/40 font-['Barlow_Condensed'] font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
          >
            <Key size={11} />
            <span>รหัสทีม</span>
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
                        <img
                          src={player.avatarUrl}
                          alt={player.nickname}
                          className="w-13 h-13 rounded-full object-cover border-2 border-[#a82844] shadow-md bg-black/60"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80';
                          }}
                        />
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

      {/* Supabase / Backend Config Modal */}
      <SupabaseConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        activeProvider={activeProvider}
      />

      {/* Team ID / Workspace Modal */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#121217] border border-white/20 rounded-2xl shadow-2xl p-5 flex flex-col gap-4 font-['Kanit'] text-white">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Key size={18} className="text-[#d4a857]" />
                <h3 className="font-['Orbitron'] font-bold text-base tracking-wider text-white">
                  รหัสทีม & คลาวด์ซิงค์
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTeamModalOpen(false)}
                className="text-white/50 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              ทุกเครื่องที่เปิดแอปนี้ด้วย <strong>รหัสทีมเดียวกัน</strong> จะซิงค์ข้อมูลผู้เล่นและฮีโร่พูลตรงกันแบบเรียลไทม์
              คุณสามารถกรอกรหัสนี้ในมือถือ แท็บเล็ต หรือคอมพิวเตอร์เครื่องอื่นได้ทันที
            </p>

            <form onSubmit={handleSaveTeamId} className="space-y-3">
              <div>
                <label className="block text-xs font-['Barlow_Condensed'] font-bold uppercase tracking-wider text-white/80 mb-1">
                  รหัสทีมปัจจุบัน (Team ID)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={teamInput}
                    onChange={(e) => setTeamInput(e.target.value)}
                    placeholder="เช่น main_team หรือ BACON_2026"
                    className="flex-1 bg-black/60 border border-white/20 focus:border-[#d4a857] rounded-lg px-3 py-2 text-white font-mono font-bold text-sm tracking-wider outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyTeamId}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center gap-1 text-xs font-['Barlow_Condensed'] font-bold tracking-wider"
                    title="คัดลอกรหัสทีม"
                  >
                    {copiedTeamId ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedTeamId ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-sky-950/40 border border-sky-500/30 text-[11px] text-sky-200 space-y-1">
                <div className="font-bold flex items-center gap-1 text-sky-300">
                  <Share2 size={12} />
                  <span>วิธีเปิดใช้งานบนเครื่องอื่น:</span>
                </div>
                <p>1. เปิดแอปนี้บนเครื่องอื่นหรือเบราว์เซอร์อื่น</p>
                <p>2. เข้าแท็บ "PLAYERS" แล้วคลิก "รหัสทีม"</p>
                <p>3. กรอกรหัส <code className="bg-black/60 px-1 py-0.5 rounded font-mono text-white">{teamId}</code> แล้วกดบันทึก ข้อมูลจะซิงค์มาทันที!</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTeamModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 font-['Barlow_Condensed'] font-bold text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#d4a857] hover:bg-[#b88f44] text-black font-['Barlow_Condensed'] font-black text-xs uppercase tracking-wider"
                >
                  บันทึก & เปลี่ยนทีม
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
