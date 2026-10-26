import React, { useState, useMemo } from 'react';
import { 
  Player, 
  PlayerPosition, 
  CoachTeamCombo, 
  CoachTeamBalance 
} from '../types/player';
import { PlayerModal } from './PlayerModal';
import { CoachComboModal } from './CoachComboModal';
import { useCoachTeamData } from '../hooks/useCoachTeamData';
import { HEROES, HERO_IMG_MAP, HERO_IMG_OVERRIDE } from '../data/heroes';
import {
  Search,
  UserPlus,
  Edit2,
  Trash2,
  Star,
  Users,
  Shield,
  Zap,
  ArrowRight,
  Plus,
  Swords,
  Scale,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Layers,
  ChevronRight,
  RefreshCw,
  X
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

type TabType = 'players' | 'pool' | 'combos' | 'balance';

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
  teamId = 'main_team',
  isCloudConnected = true,
  syncError = null,
  onAddPlayer,
  onUpdatePlayer,
  onDeletePlayer,
  onResetToDefault,
  onSwitchToDraft,
}) => {
  // Active Tab
  const [activeTab, setActiveTab] = useState<TabType>('players');

  // Filter States for Players
  const [searchQuery, setSearchQuery] = useState('');
  const [posFilter, setPosFilter] = useState<'ALL' | PlayerPosition>('ALL');
  const [catFilter, setCatFilter] = useState<'ALL' | 'male' | 'female' | 'mixed'>('ALL');

  // Filter State for Hero Pool Tab
  const [poolSearch, setPoolSearch] = useState('');
  const [poolPosFilter, setPoolPosFilter] = useState<'ALL' | PlayerPosition>('ALL');

  // Coach Team Combos & Balance Hook
  const {
    combos,
    addCombo,
    updateCombo,
    deleteCombo,
    teamBalance,
    updateTeamBalance,
  } = useCoachTeamData(teamId);

  // Modals
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const [isComboModalOpen, setIsComboModalOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<CoachTeamCombo | null>(null);

  // Balance Edit State
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [balanceForm, setBalanceForm] = useState<CoachTeamBalance>(teamBalance);

  // Confirmation Modal
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Success Feedback Toast / Banner
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage(null);
    }, 3500);
  };

  // Filtered Players
  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      if (catFilter !== 'ALL') {
        const cats = p.categories || [p.category || 'male'];
        if (!cats.includes(catFilter as any)) return false;
      }

      if (posFilter !== 'ALL' && p.position !== posFilter) return false;

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

  // Aggregate Roster-Wide Hero Pool
  const rosterHeroPool = useMemo(() => {
    // Map: heroName -> { heroName, positions: Set, players: Array<{ player, tier }> }
    const map = new Map<
      string,
      {
        heroName: string;
        positions: Set<PlayerPosition>;
        players: Array<{
          id: string;
          nickname: string;
          position: PlayerPosition;
          tier: 'signature' | 'comfortable';
        }>;
      }
    >();

    players.forEach((p) => {
      p.heroPool.forEach((item) => {
        if (!map.has(item.heroName)) {
          map.set(item.heroName, {
            heroName: item.heroName,
            positions: new Set(),
            players: [],
          });
        }
        const entry = map.get(item.heroName)!;
        entry.positions.add(p.position);
        entry.players.push({
          id: p.id,
          nickname: p.nickname,
          position: p.position,
          tier: item.tier,
        });
      });
    });

    let list = Array.from(map.values());

    // Search filter
    if (poolSearch.trim()) {
      const q = poolSearch.trim().toLowerCase();
      list = list.filter(
        (item) =>
          item.heroName.toLowerCase().includes(q) ||
          item.players.some((pl) => pl.nickname.toLowerCase().includes(q))
      );
    }

    // Position filter
    if (poolPosFilter !== 'ALL') {
      list = list.filter((item) => item.positions.has(poolPosFilter));
    }

    // Sort: most players, then signatures first
    list.sort((a, b) => {
      const aSig = a.players.filter((p) => p.tier === 'signature').length;
      const bSig = b.players.filter((p) => p.tier === 'signature').length;
      if (bSig !== aSig) return bSig - aSig;
      return b.players.length - a.players.length;
    });

    return list;
  }, [players, poolSearch, poolPosFilter]);

  // Player CRUD
  const handleAddNewPlayer = () => {
    setEditingPlayer(null);
    setIsPlayerModalOpen(true);
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setIsPlayerModalOpen(true);
  };

  const handleDeletePlayer = (id: string, nickname: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'ยืนยันการลบนักแข่ง',
      message: `คุณต้องการลบนักแข่ง "${nickname}" ออกจากทีมใช่หรือไม่? ข้อมูลใน Hero Pool จะถูกปรับปรุงทันที`,
      onConfirm: () => {
        onDeletePlayer(id);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        showStatus(`🗑️ ลบนักแข่ง "${nickname}" ออกจากทีมเรียบร้อย`);
      },
    });
  };

  // Toggle tier on player card directly (Quick Action)
  const handleTogglePlayerHeroTier = (player: Player, heroName: string) => {
    const updatedPool = player.heroPool.map((h) =>
      h.heroName === heroName
        ? { ...h, tier: (h.tier === 'signature' ? 'comfortable' : 'signature') as any }
        : h
    );
    onUpdatePlayer(player.id, { heroPool: updatedPool });
    const toggledItem = updatedPool.find((h) => h.heroName === heroName);
    const tierLabel = toggledItem?.tier === 'signature' ? '⭐ ถนัด (ดาวทอง)' : '⭐ พอเล่นได้ (ดาวเงิน)';
    showStatus(`✨ ปรับระดับ ${heroName} ของ ${player.nickname} เป็น ${tierLabel}`);
  };

  // Combo CRUD
  const handleAddNewCombo = () => {
    setEditingCombo(null);
    setIsComboModalOpen(true);
  };

  const handleEditCombo = (combo: CoachTeamCombo) => {
    setEditingCombo(combo);
    setIsComboModalOpen(true);
  };

  const handleDeleteCombo = (combo: CoachTeamCombo) => {
    setConfirmDialog({
      isOpen: true,
      title: 'ยืนยันการลบคอมโบทีม',
      message: `คุณต้องการลบคอมโบ "${combo.name}" ใช่หรือไม่?`,
      onConfirm: () => {
        deleteCombo(combo.id);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        showStatus(`🗑️ ลบคอมโบ "${combo.name}" เรียบร้อยแล้ว`);
      },
    });
  };

  // Team Balance Save
  const handleSaveBalance = (e: React.FormEvent) => {
    e.preventDefault();
    updateTeamBalance(balanceForm);
    setIsEditingBalance(false);
    showStatus('✅ บันทึกการประเมิน Team Balance เรียบร้อยแล้ว');
  };

  return (
    <div className="flex-1 flex flex-col gap-3.5 sm:gap-4 font-['Prompt'] text-slate-800 animate-in fade-in duration-200 select-none pb-12">
      {/* 1. Header Banner */}
      <div className="p-4 bg-white border border-[#F3D5E2] rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#E91E63] text-white flex items-center justify-center shadow-md shadow-[#E91E63]/20 flex-shrink-0">
            <Users size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-['Prompt'] font-bold text-base sm:text-lg text-slate-900 leading-tight">
                จัดการทีม MCU Esports
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FCE4EC] text-[#E91E63] border border-[#F8BBD0]">
                {players.length} นักแข่ง
              </span>
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isCloudConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isCloudConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span>{isCloudConnected ? 'Cloud Synced' : 'Offline'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              ศูนย์รวมข้อมูลนักแข่ง, Hero Pool, คอมโบประสานงาน และสมดุลทีมสำหรับโค้ช
            </p>
          </div>
        </div>

        <button
          onClick={onSwitchToDraft}
          className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#FFF0F5] border border-[#F3D5E2] text-[#E91E63] text-xs font-bold transition-all shadow-2xs hover:shadow-xs flex items-center gap-1.5 cursor-pointer self-stretch sm:self-auto justify-center"
        >
          <Swords size={14} />
          <span>ไปที่ห้องดราฟต์</span>
        </button>
      </div>

      {/* Status Feedback Banner */}
      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-2xs animate-in fade-in duration-150">
          <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Sync Error Banner */}
      {syncError && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-800 text-xs flex items-center gap-2 shadow-2xs">
          <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
          <span>{syncError}</span>
        </div>
      )}

      {/* 2. Four Unified Section Tabs */}
      <div className="flex items-center gap-1 bg-white border border-[#F3D5E2] p-1.5 rounded-2xl shadow-xs overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('players')}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl font-bold text-xs sm:text-[12.5px] transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'players'
              ? 'bg-[#E91E63] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-[#FFF0F5]'
          }`}
        >
          <Users size={15} />
          <span>1. นักแข่ง ({players.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pool')}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl font-bold text-xs sm:text-[12.5px] transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'pool'
              ? 'bg-[#E91E63] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-[#FFF0F5]'
          }`}
        >
          <Shield size={15} />
          <span>2. Hero Pool ({rosterHeroPool.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('combos')}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl font-bold text-xs sm:text-[12.5px] transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'combos'
              ? 'bg-[#E91E63] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-[#FFF0F5]'
          }`}
        >
          <Swords size={15} />
          <span>3. คอมโบทีม ({combos.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('balance')}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl font-bold text-xs sm:text-[12.5px] transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'balance'
              ? 'bg-[#E91E63] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-[#FFF0F5]'
          }`}
        >
          <Scale size={15} />
          <span>4. Team Balance</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: นักแข่ง (PLAYERS)                                                    */}
      {/* ========================================================================= */}
      {activeTab === 'players' && (
        <div className="space-y-3.5">
          {/* Controls: Search, Filters & Add Button */}
          <div className="p-3 sm:p-3.5 bg-white border border-[#F3D5E2] rounded-2xl shadow-xs flex flex-col gap-2.5">
            {/* Top row: Category filter + Add Button */}
            <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-500 uppercase">
                  ทีม:
                </span>
                <button
                  type="button"
                  onClick={() => setCatFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    catFilter === 'ALL'
                      ? 'bg-[#E91E63] text-white shadow-2xs'
                      : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  ทั้งหมด ({players.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCatFilter('male')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    catFilter === 'male'
                      ? 'bg-[#0284C7] text-white shadow-2xs'
                      : 'bg-slate-50 text-slate-600 hover:text-[#0284C7] border border-slate-200'
                  }`}
                >
                  ทีมชาย ({players.filter((p) => (p.categories || [p.category || 'male']).includes('male')).length})
                </button>
                <button
                  type="button"
                  onClick={() => setCatFilter('female')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    catFilter === 'female'
                      ? 'bg-[#E11D48] text-white shadow-2xs'
                      : 'bg-slate-50 text-slate-600 hover:text-[#E11D48] border border-slate-200'
                  }`}
                >
                  ทีมหญิง ({players.filter((p) => (p.categories || [p.category || 'male']).includes('female')).length})
                </button>
                <button
                  type="button"
                  onClick={() => setCatFilter('mixed')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    catFilter === 'mixed'
                      ? 'bg-[#9333EA] text-white shadow-2xs'
                      : 'bg-slate-50 text-slate-600 hover:text-[#9333EA] border border-slate-200'
                  }`}
                >
                  ทีมผสม ({players.filter((p) => (p.categories || [p.category || 'male']).includes('mixed')).length})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddNewPlayer}
                  className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-[#E91E63] hover:bg-[#D81B60] text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <UserPlus size={14} />
                  <span>＋ เพิ่มนักแข่งใหม่</span>
                </button>
              </div>
            </div>

            {/* Bottom row: Search Box & Position Pills */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
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

              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                {POS_FILTERS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setPosFilter(f.key)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                      posFilter === f.key
                        ? 'bg-[#E91E63] text-white shadow-2xs'
                        : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Player Cards Grid */}
          {filteredPlayers.length === 0 ? (
            <div className="p-10 text-center bg-white border border-dashed border-[#F3D5E2] rounded-2xl flex flex-col items-center justify-center gap-2.5 shadow-xs">
              <div className="w-10 h-10 rounded-full bg-[#FFF0F5] text-[#E91E63] flex items-center justify-center text-lg">
                👥
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800">ไม่พบข้อมูลนักแข่ง</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {searchQuery ? `ไม่มีนักแข่งตรงกับ "${searchQuery}"` : 'ยังไม่มีนักแข่งในหมวดนี้'}
                </p>
              </div>
              <button
                onClick={handleAddNewPlayer}
                className="mt-1 px-3.5 py-1.5 rounded-xl bg-[#E91E63] hover:bg-[#D81B60] text-white font-bold text-xs shadow-xs cursor-pointer"
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
                    className="bg-white border border-slate-200 hover:border-[#F48FB1] rounded-2xl p-3.5 flex flex-col justify-between gap-3 shadow-2xs hover:shadow-xs transition-all"
                  >
                    {/* Top: Avatar, Name, Position, Actions */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative flex-shrink-0">
                            {player.avatarUrl ? (
                              <img
                                src={player.avatarUrl}
                                alt={player.nickname}
                                className="w-11 h-11 rounded-xl object-cover border-2 border-[#E91E63] shadow-xs bg-slate-100"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-xl border-2 border-[#E91E63] shadow-xs bg-[#FCE4EC] flex items-center justify-center text-[#E91E63] font-black text-sm">
                                {player.nickname.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <span className="absolute -bottom-1 -right-1 text-[8.5px] font-black px-1 rounded bg-white border border-slate-200 text-[#E91E63] shadow-2xs">
                              {player.position}
                            </span>
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="font-bold text-sm text-slate-900 truncate">
                                {player.nickname}
                              </h3>
                              {(player.categories && player.categories.length > 0
                                ? player.categories
                                : [player.category || 'male']
                              ).map((cat) => (
                                <span
                                  key={cat}
                                  className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded border ${
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

                        {/* Edit & Delete */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleEditPlayer(player)}
                            title="แก้ไขข้อมูลนักแข่ง"
                            className="p-1.5 rounded-lg bg-slate-50 hover:bg-[#FFF0F5] text-slate-600 hover:text-[#E91E63] border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeletePlayer(player.id, player.nickname)}
                            title="ลบนักแข่ง"
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 border border-rose-200 transition-colors cursor-pointer shadow-2xs"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Hero Pool with Gold & Silver Stars */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                      {/* Row 1: Signature (Gold Star) */}
                      <div>
                        <div className="flex items-center justify-between text-[10.5px] font-bold text-[#B45309] mb-1">
                          <div className="flex items-center gap-1">
                            <Star size={11} className="fill-[#F59E0B] text-[#F59E0B]" />
                            <span>ถนัด = ดาวทอง ({signatures.length})</span>
                          </div>
                          <span className="text-[9.5px] text-slate-400 font-normal">คลิกดาวเพื่อสลับระดับ</span>
                        </div>

                        {signatures.length === 0 ? (
                          <span className="text-[11px] text-slate-400 italic">ไม่มีฮีโร่ดาวทอง</span>
                        ) : (
                          <div className="flex items-center gap-1 flex-wrap">
                            {signatures.map((h) => (
                              <button
                                key={h.heroName}
                                type="button"
                                onClick={() => handleTogglePlayerHeroTier(player, h.heroName)}
                                className="flex items-center gap-1 pl-1 pr-1.5 py-0.5 rounded-lg bg-[#FEF3C7] hover:bg-[#FDE68A] border border-[#F59E0B] text-[#B45309] font-bold text-[11px] shadow-2xs cursor-pointer transition-colors"
                                title="คลิกเพื่อสลับเป็น ดาวเงิน (พอเล่นได้)"
                              >
                                <img
                                  src={getHeroImg(h.heroName)}
                                  alt={h.heroName}
                                  className="w-3.5 h-3.5 rounded object-cover"
                                />
                                <span>⭐ {h.heroName}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Row 2: Comfortable (Silver Star) */}
                      <div>
                        <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-600 mb-1">
                          <div className="flex items-center gap-1">
                            <Star size={11} className="fill-slate-400 text-slate-400" />
                            <span>พอเล่นได้ = ดาวเงิน ({comfortables.length})</span>
                          </div>
                        </div>

                        {comfortables.length === 0 ? (
                          <span className="text-[11px] text-slate-400 italic">ไม่มีฮีโร่ดาวเงิน</span>
                        ) : (
                          <div className="flex items-center gap-1 flex-wrap">
                            {comfortables.map((h) => (
                              <button
                                key={h.heroName}
                                type="button"
                                onClick={() => handleTogglePlayerHeroTier(player, h.heroName)}
                                className="flex items-center gap-1 pl-1 pr-1.5 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-[11px] shadow-2xs cursor-pointer transition-colors"
                                title="คลิกเพื่อสลับเป็น ดาวทอง (ถนัด)"
                              >
                                <img
                                  src={getHeroImg(h.heroName)}
                                  alt={h.heroName}
                                  className="w-3.5 h-3.5 rounded object-cover"
                                />
                                <span>⭐ {h.heroName}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: HERO POOL (ROSTER-WIDE MATRIX)                                     */}
      {/* ========================================================================= */}
      {activeTab === 'pool' && (
        <div className="space-y-3.5">
          {/* Search & Position Filters */}
          <div className="p-3 bg-white border border-[#F3D5E2] rounded-2xl shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                value={poolSearch}
                onChange={(e) => setPoolSearch(e.target.value)}
                placeholder="ค้นหา Hero ในพูลทีม หรือค้นหาชื่อนักแข่ง..."
                className="w-full bg-[#FFF8FB] border border-[#F3D5E2] focus:border-[#E91E63] focus:bg-white text-slate-900 placeholder-slate-400 text-xs pl-8 pr-3 py-1.5 rounded-xl outline-none transition-all shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              {POS_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setPoolPosFilter(f.key)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                    poolPosFilter === f.key
                      ? 'bg-[#E91E63] text-white shadow-2xs'
                      : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hero Pool Matrix Cards */}
          {rosterHeroPool.length === 0 ? (
            <div className="p-10 text-center bg-white border border-dashed border-[#F3D5E2] rounded-2xl shadow-xs">
              <p className="text-xs text-slate-400">
                {poolSearch ? `ไม่พบฮีโร่ตรงกับ "${poolSearch}"` : 'ยังไม่มีข้อมูลฮีโร่ในพูลของทีม'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {rosterHeroPool.map((item) => {
                const signatures = item.players.filter((p) => p.tier === 'signature');
                const comfortables = item.players.filter((p) => p.tier === 'comfortable');

                return (
                  <div
                    key={item.heroName}
                    className="p-3 bg-white border border-slate-200 hover:border-[#F48FB1] rounded-xl shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={getHeroImg(item.heroName)}
                        alt={item.heroName}
                        className="w-9 h-9 rounded-lg object-cover border border-[#F3D5E2] shadow-2xs flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-slate-900 truncate">{item.heroName}</h4>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                          <span>{item.players.length} นักแข่ง</span>
                          <span>•</span>
                          <span className="text-[#E91E63] font-semibold">
                            {Array.from(item.positions).join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Players who play this hero */}
                    <div className="pt-2 border-t border-slate-100 flex flex-col gap-1 text-[11px]">
                      {signatures.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-[10px] font-bold text-[#B45309]">⭐ ถนัด:</span>
                          {signatures.map((p) => (
                            <span
                              key={p.id}
                              className="px-1.5 py-0.2 rounded bg-[#FEF3C7] border border-[#F59E0B] text-[#B45309] font-bold text-[10.5px]"
                            >
                              {p.nickname} ({p.position})
                            </span>
                          ))}
                        </div>
                      )}

                      {comfortables.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-[10px] font-semibold text-slate-500">⭐ พอเล่นได้:</span>
                          {comfortables.map((p) => (
                            <span
                              key={p.id}
                              className="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[10.5px]"
                            >
                              {p.nickname} ({p.position})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: คอมโบทีม (TEAM COMBOS - COACH RECORDED ONLY)                       */}
      {/* ========================================================================= */}
      {activeTab === 'combos' && (
        <div className="space-y-3.5">
          {/* Header Action */}
          <div className="p-3.5 bg-white border border-[#F3D5E2] rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <span>⚔️ คอมโบทีมที่โค้ชบันทึก (Coach Team Combos)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FCE4EC] text-[#E91E63]">
                  {combos.length} คอมโบ
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                บันทึกคู่หูฮีโร่ที่ประสานงานได้ดี และกำหนดตัวทดแทน (Substitutes) เมื่อตัวหลักโดนแบน
              </p>
            </div>

            <button
              onClick={handleAddNewCombo}
              className="px-3.5 py-1.5 rounded-xl bg-[#E91E63] hover:bg-[#D81B60] text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer self-stretch sm:self-auto justify-center"
            >
              <Plus size={14} />
              <span>＋ เพิ่มคอมโบทีมใหม่</span>
            </button>
          </div>

          {/* Combos List */}
          {combos.length === 0 ? (
            <div className="p-10 text-center bg-white border border-dashed border-[#F3D5E2] rounded-2xl shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#FFF0F5] text-[#E91E63] flex items-center justify-center text-xl mx-auto">
                ⚔️
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800">ยังไม่มีคอมโบที่โค้ชบันทึกไว้</h3>
                <p className="text-xs text-slate-400 mt-0.5 max-w-md mx-auto">
                  ระบบจะไม่สร้างคอมโบสมมุติขึ้นมาเอง กรุณากดปุ่มด้านล่างเพื่อบันทึกคอมโบและแผนการเล่นจริงของทีม MCU
                </p>
              </div>
              <button
                onClick={handleAddNewCombo}
                className="px-4 py-2 rounded-xl bg-[#E91E63] hover:bg-[#D81B60] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                ＋ บันทึกคอมโบแรกของทีม
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {combos.map((combo) => (
                <div
                  key={combo.id}
                  className="bg-white border border-[#F3D5E2] rounded-2xl p-4 shadow-xs flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-slate-900">{combo.name}</h3>
                          <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${
                            combo.timing === 'early'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : combo.timing === 'mid'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : combo.timing === 'late'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>
                            {combo.timing === 'early'
                              ? 'ต้นเกม'
                              : combo.timing === 'mid'
                              ? 'กลางเกม'
                              : combo.timing === 'late'
                              ? 'เลทเกม'
                              : 'ทุกช่วงเวลา'}
                          </span>
                        </div>
                        {combo.notes && (
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {combo.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleEditCombo(combo)}
                          className="p-1.5 rounded-lg bg-slate-50 hover:bg-[#FFF0F5] text-slate-600 hover:text-[#E91E63] border border-slate-200 cursor-pointer"
                          title="แก้ไขคอมโบ"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteCombo(combo)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 cursor-pointer"
                          title="ลบคอมโบ"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Core Heroes */}
                    <div className="my-2.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        ฮีโร่หลักในคอมโบ:
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {combo.coreHeroes.map((heroName) => (
                          <div
                            key={heroName}
                            className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-lg bg-[#FFF0F5] border border-[#F48FB1] text-slate-800 text-xs font-bold shadow-2xs"
                          >
                            <img
                              src={getHeroImg(heroName)}
                              alt={heroName}
                              className="w-4 h-4 rounded object-cover"
                            />
                            <span>{heroName}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Substitutes */}
                    {combo.substitutes && combo.substitutes.length > 0 && (
                      <div className="pt-2.5 border-t border-slate-100 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          ตัวทดแทนเมื่อตัวหลักโดนแบน (Substitutes):
                        </span>
                        <div className="space-y-1 text-xs">
                          {combo.substitutes.map((sub, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200"
                            >
                              <div className="flex items-center gap-1 font-bold text-slate-700">
                                <img src={getHeroImg(sub.originalHero)} alt="" className="w-3.5 h-3.5 rounded" />
                                <span>{sub.originalHero}</span>
                              </div>
                              <ArrowRight size={11} className="text-[#E91E63] flex-shrink-0" />
                              <div className="flex items-center gap-1 font-bold text-emerald-700">
                                <img src={getHeroImg(sub.substituteHero)} alt="" className="w-3.5 h-3.5 rounded" />
                                <span>{sub.substituteHero}</span>
                              </div>
                              <span className="text-[10.5px] text-slate-500 truncate ml-1">
                                — {sub.reason}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span>บันทึกโดยโค้ช MCU</span>
                    <span>อัปเดต: {new Date(combo.updatedAt).toLocaleDateString('th-TH')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: TEAM BALANCE (EARLY / MID / LATE GAME - COACH RECORDED)            */}
      {/* ========================================================================= */}
      {activeTab === 'balance' && (
        <div className="space-y-3.5">
          <div className="p-4 bg-white border border-[#F3D5E2] rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <span>⚖️ การประเมินสมดุลทีม (Team Balance Evaluation)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ข้อมูลจริงโดยโค้ช
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ประเมินความพร้อมและแผนการเล่น 3 ช่วงเวลา: ต้นเกม, กลางเกม และเลทเกม
              </p>
            </div>

            {!isEditingBalance && (
              <button
                onClick={() => {
                  setBalanceForm(teamBalance);
                  setIsEditingBalance(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#E91E63] hover:bg-[#D81B60] text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer self-stretch sm:self-auto justify-center"
              >
                <Edit2 size={13} />
                <span>✏️ แก้ไขการประเมิน</span>
              </button>
            )}
          </div>

          {/* Balance Cards Display or Edit Form */}
          {isEditingBalance ? (
            <form onSubmit={handleSaveBalance} className="bg-white border border-[#F3D5E2] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-sm text-slate-800">
                  แก้ไขข้อมูลสมดุลทีม (ต้นเกม / กลางเกม / เลทเกม)
                </span>
                <span className="text-[10.5px] text-slate-400">กรอกข้อมูลตามแผนการเล่นจริง</span>
              </div>

              {/* 1. Early Game */}
              <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-800 text-xs">🟢 1. ต้นเกม (Early Game: 0 - 4 นาที)</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-slate-500 mr-1">ระดับความพร้อม:</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          setBalanceForm({
                            ...balanceForm,
                            earlyGame: { ...balanceForm.earlyGame, score: star },
                          })
                        }
                        className="cursor-pointer"
                      >
                        <Star
                          size={15}
                          className={
                            star <= balanceForm.earlyGame.score
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 font-semibold mb-0.5">
                    แผนการเล่นหลักต้นเกม:
                  </label>
                  <input
                    type="text"
                    value={balanceForm.earlyGame.plan}
                    onChange={(e) =>
                      setBalanceForm({
                        ...balanceForm,
                        earlyGame: { ...balanceForm.earlyGame, plan: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg outline-none text-xs"
                    placeholder="เช่น เคลียร์เวฟกลางให้ไว แล้ว Roam เดินช่วยเลนข้าง..."
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 font-semibold mb-0.5">
                    เป้าหมายสำคัญ (Key Objectives):
                  </label>
                  <input
                    type="text"
                    value={balanceForm.earlyGame.keyObjectives}
                    onChange={(e) =>
                      setBalanceForm({
                        ...balanceForm,
                        earlyGame: { ...balanceForm.earlyGame, keyObjectives: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg outline-none text-xs"
                    placeholder="เช่น ชิงมังกรแรก, ป้องกัน Creep ป่า..."
                  />
                </div>
              </div>

              {/* 2. Mid Game */}
              <div className="p-3.5 rounded-xl bg-sky-50/50 border border-sky-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sky-800 text-xs">🟡 2. กลางเกม (Mid Game: 4 - 10 นาที)</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-slate-500 mr-1">ระดับความพร้อม:</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          setBalanceForm({
                            ...balanceForm,
                            midGame: { ...balanceForm.midGame, score: star },
                          })
                        }
                        className="cursor-pointer"
                      >
                        <Star
                          size={15}
                          className={
                            star <= balanceForm.midGame.score
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 font-semibold mb-0.5">
                    แผนการเล่นหลักกลางเกม:
                  </label>
                  <input
                    type="text"
                    value={balanceForm.midGame.plan}
                    onChange={(e) =>
                      setBalanceForm({
                        ...balanceForm,
                        midGame: { ...balanceForm.midGame, plan: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-sky-300 rounded-lg outline-none text-xs"
                    placeholder="เช่น รวมตัว 4 คนกดดันป้อมนอก ตัดบัฟศัตรู..."
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 font-semibold mb-0.5">
                    เป้าหมายสำคัญ (Key Objectives):
                  </label>
                  <input
                    type="text"
                    value={balanceForm.midGame.keyObjectives}
                    onChange={(e) =>
                      setBalanceForm({
                        ...balanceForm,
                        midGame: { ...balanceForm.midGame, keyObjectives: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-sky-300 rounded-lg outline-none text-xs"
                    placeholder="เช่น ทำลายป้อมเลนกลาง, คุมพื้นที่ป่า..."
                  />
                </div>
              </div>

              {/* 3. Late Game */}
              <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-800 text-xs">🔴 3. เลทเกม (Late Game: 10+ นาที)</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-slate-500 mr-1">ระดับความพร้อม:</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          setBalanceForm({
                            ...balanceForm,
                            lateGame: { ...balanceForm.lateGame, score: star },
                          })
                        }
                        className="cursor-pointer"
                      >
                        <Star
                          size={15}
                          className={
                            star <= balanceForm.lateGame.score
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 font-semibold mb-0.5">
                    แผนการเล่นหลักเลทเกม:
                  </label>
                  <input
                    type="text"
                    value={balanceForm.lateGame.plan}
                    onChange={(e) =>
                      setBalanceForm({
                        ...balanceForm,
                        lateGame: { ...balanceForm.lateGame, plan: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-purple-300 rounded-lg outline-none text-xs"
                    placeholder="เช่น โฟกัสไฟต์ 5v5 รอบ Dark Slayer ไม่ให้แครี่ตายก่อน..."
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 font-semibold mb-0.5">
                    เป้าหมายสำคัญ (Key Objectives):
                  </label>
                  <input
                    type="text"
                    value={balanceForm.lateGame.keyObjectives}
                    onChange={(e) =>
                      setBalanceForm({
                        ...balanceForm,
                        lateGame: { ...balanceForm.lateGame, keyObjectives: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-purple-300 rounded-lg outline-none text-xs"
                    placeholder="เช่น ชิงบัฟ Dark Slayer, ดัน 3 ทางเพื่อปิดเกม..."
                  />
                </div>
              </div>

              {/* Overall Notes */}
              <div>
                <label className="block text-[11px] text-slate-700 font-bold mb-1">
                  สรุปภาพรวมคำแนะนำจากโค้ช:
                </label>
                <textarea
                  rows={2}
                  value={balanceForm.overallNotes}
                  onChange={(e) =>
                    setBalanceForm({ ...balanceForm, overallNotes: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#FFF8FB] border border-[#F3D5E2] focus:border-[#E91E63] rounded-xl outline-none text-xs resize-none"
                  placeholder="เช่น ทีมเล่นได้แข็งแกร่งทุกช่วงเวลา แต่ควรระวังจังหวะเดินเกมช่วงนาทีที่ 3-5..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingBalance(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#E91E63] hover:bg-[#D81B60] text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 size={13} />
                  <span>บันทึกการประเมิน</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Early Game Card */}
              <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      <span>🟢</span>
                      <span>ต้นเกม (0 - 4 นาที)</span>
                    </span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={13}
                          className={
                            s <= teamBalance.earlyGame.score
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-200'
                          }
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        แผนการเล่น:
                      </span>
                      <p className="text-slate-700 leading-relaxed mt-0.5 font-medium">
                        {teamBalance.earlyGame.plan}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        คีย์เป้าหมาย:
                      </span>
                      <p className="text-emerald-700 leading-relaxed mt-0.5 font-semibold">
                        {teamBalance.earlyGame.keyObjectives}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                  จังหวะเปิดเกม & คุมมังกร
                </div>
              </div>

              {/* Mid Game Card */}
              <div className="bg-white border border-sky-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-sky-800 flex items-center gap-1.5">
                      <span>🟡</span>
                      <span>กลางเกม (4 - 10 นาที)</span>
                    </span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={13}
                          className={
                            s <= teamBalance.midGame.score
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-200'
                          }
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        แผนการเล่น:
                      </span>
                      <p className="text-slate-700 leading-relaxed mt-0.5 font-medium">
                        {teamBalance.midGame.plan}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        คีย์เป้าหมาย:
                      </span>
                      <p className="text-sky-700 leading-relaxed mt-0.5 font-semibold">
                        {teamBalance.midGame.keyObjectives}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                  การดันป้อม & คุมป่าศัตรู
                </div>
              </div>

              {/* Late Game Card */}
              <div className="bg-white border border-purple-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-purple-800 flex items-center gap-1.5">
                      <span>🔴</span>
                      <span>เลทเกม (10+ นาที)</span>
                    </span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={13}
                          className={
                            s <= teamBalance.lateGame.score
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-200'
                          }
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        แผนการเล่น:
                      </span>
                      <p className="text-slate-700 leading-relaxed mt-0.5 font-medium">
                        {teamBalance.lateGame.plan}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        คีย์เป้าหมาย:
                      </span>
                      <p className="text-purple-700 leading-relaxed mt-0.5 font-semibold">
                        {teamBalance.lateGame.keyObjectives}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                  ไฟต์ Dark Slayer & ปิดเกม
                </div>
              </div>
            </div>
          )}

          {/* Overall Notes Card */}
          {!isEditingBalance && teamBalance.overallNotes && (
            <div className="p-3.5 bg-gradient-to-r from-[#FFF8FB] to-white border border-[#F3D5E2] rounded-2xl shadow-xs">
              <span className="text-[10.5px] font-bold text-[#E91E63] uppercase tracking-wider block mb-1">
                📌 โน้ตสรุปกลยุทธ์จากโค้ช:
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {teamBalance.overallNotes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS & CONFIRM DIALOGS (SINGLE INSTANCE, NO NESTING)                    */}
      {/* ========================================================================= */}
      {/* 1. Player Modal */}
      {isPlayerModalOpen && (
        <PlayerModal
          isOpen={true}
          onClose={() => setIsPlayerModalOpen(false)}
          initialPlayer={editingPlayer}
          onSave={(data) => {
            if (editingPlayer) {
              onUpdatePlayer(editingPlayer.id, data);
              showStatus(`✅ แก้ไขข้อมูลของ "${data.nickname}" สำเร็จ`);
            } else {
              onAddPlayer(data);
              showStatus(`✅ เพิ่มนักแข่งใหม่ "${data.nickname}" สำเร็จ`);
            }
          }}
        />
      )}

      {/* 2. Coach Combo Modal */}
      {isComboModalOpen && (
        <CoachComboModal
          isOpen={true}
          onClose={() => setIsComboModalOpen(false)}
          initialCombo={editingCombo}
          onSave={(data) => {
            if (editingCombo) {
              updateCombo(editingCombo.id, data);
              showStatus(`✅ แก้ไขคอมโบ "${data.name}" สำเร็จ`);
            } else {
              addCombo(data);
              showStatus(`✅ เพิ่มคอมโบใหม่ "${data.name}" สำเร็จ`);
            }
          }}
        />
      )}

      {/* 3. Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white border border-[#F3D5E2] rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
              <AlertCircle size={18} />
              <span>{confirmDialog.title}</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold cursor-pointer transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
