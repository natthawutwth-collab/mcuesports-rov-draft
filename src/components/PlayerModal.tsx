import React, { useState, useMemo } from 'react';
import { Player, PlayerPosition, PlayerHeroPoolItem, HeroProficiency } from '../types/player';
import { HEROES, HERO_IMG_MAP, HERO_IMG_OVERRIDE } from '../data/heroes';
import { X, Search, Star, Trash2, UserPlus, Check } from 'lucide-react';

interface PlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    nickname: string;
    position: PlayerPosition;
    avatarUrl: string;
    heroPool: PlayerHeroPoolItem[];
  }) => void;
  initialPlayer?: Player | null;
}

const POSITIONS: { key: PlayerPosition; label: string; color: string }[] = [
  { key: 'DSL', label: 'Dark Slayer Lane (DSL)', color: 'text-[#c47842] border-[#c47842]' },
  { key: 'Jungle', label: 'Jungle (JG)', color: 'text-[#5a8a6a] border-[#5a8a6a]' },
  { key: 'Mid', label: 'Mid Lane (Mage)', color: 'text-[#9b6da8] border-[#9b6da8]' },
  { key: 'Support', label: 'Support / Roam (SUP)', color: 'text-[#6b8fb8] border-[#6b8fb8]' },
  { key: 'ADL', label: 'Abyssal Dragon Lane (ADL)', color: 'text-[#d4a857] border-[#d4a857]' },
];

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
];

function getHeroImg(name: string): string {
  if (!name || typeof name !== 'string' || !name.trim()) {
    return 'https://res.cloudinary.com/dtzdhbllb/image/upload/v1775747198/Flowborn.png';
  }
  const clean = name.trim();
  if (HERO_IMG_OVERRIDE[clean]) return HERO_IMG_OVERRIDE[clean];
  return `https://res.cloudinary.com/dtzdhbllb/image/upload/${HERO_IMG_MAP[clean] || clean}.jpg`;
}

export const PlayerModal: React.FC<PlayerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialPlayer,
}) => {
  const [name, setName] = useState(initialPlayer?.name || '');
  const [nickname, setNickname] = useState(initialPlayer?.nickname || '');
  const [position, setPosition] = useState<PlayerPosition>(initialPlayer?.position || 'DSL');
  const [avatarUrl, setAvatarUrl] = useState(
    initialPlayer?.avatarUrl || PRESET_AVATARS[0]
  );
  const [heroPool, setHeroPool] = useState<PlayerHeroPoolItem[]>(
    initialPlayer?.heroPool || []
  );

  // Search hero to add
  const [heroSearch, setHeroSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState<HeroProficiency>('signature');

  // Filtered heroes to add
  const poolHeroNames = useMemo(() => new Set(heroPool.map((h) => h.heroName)), [heroPool]);

  const availableHeroes = useMemo(() => {
    if (!heroSearch.trim()) return [];
    const q = heroSearch.trim().toLowerCase();
    return HEROES.filter(
      (h) =>
        !poolHeroNames.has(h.name) &&
        (h.name.toLowerCase().includes(q) ||
          h.nameTh.toLowerCase().includes(q) ||
          h.tags.some((t) => t.toLowerCase().includes(q)))
    ).slice(0, 10);
  }, [heroSearch, poolHeroNames]);

  if (!isOpen) return null;

  const handleAddHero = (heroName: string) => {
    setHeroPool((prev) => [...prev, { heroName, tier: selectedTier }]);
    setHeroSearch('');
  };

  const handleRemoveHero = (heroName: string) => {
    setHeroPool((prev) => prev.filter((h) => h.heroName !== heroName));
  };

  const handleToggleTier = (heroName: string) => {
    setHeroPool((prev) =>
      prev.map((h) =>
        h.heroName === heroName
          ? { ...h, tier: h.tier === 'signature' ? 'comfortable' : 'signature' }
          : h
      )
    );
  };

  const [nicknameError, setNicknameError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNick = nickname.trim();
    const cleanName = name.trim();
    const effectiveNick = cleanNick || cleanName.split(' ')[0] || '';

    if (!effectiveNick) {
      setNicknameError('กรุณากรอก In-game Nickname หรือชื่อนักแข่งอย่างน้อย 1 อย่าง');
      return;
    }

    setNicknameError(null);
    onSave({
      name: cleanName || effectiveNick,
      nickname: effectiveNick.toUpperCase(),
      position,
      avatarUrl: avatarUrl.trim() || PRESET_AVATARS[0],
      heroPool,
    });
    onClose();
  };

  const signatures = heroPool.filter((h) => h.tier === 'signature');
  const comfortables = heroPool.filter((h) => h.tier === 'comfortable');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0e0e14] border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-2 font-['Orbitron'] font-bold text-base tracking-wider text-white">
            <UserPlus size={18} className="text-[#a82844]" />
            <span>{initialPlayer ? 'แก้ไขข้อมูลนักแข่ง' : 'เพิ่มนักแข่งใหม่'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 custom-scrollbar flex flex-col gap-4">
          {/* Row 1: Nickname & Full Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-['Barlow_Condensed'] font-bold tracking-wider text-white/80 uppercase mb-1">
                In-game Nickname *
              </label>
              <input
                type="text"
                autoFocus
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  if (nicknameError) setNicknameError(null);
                }}
                placeholder="เช่น MOON, ALEX, 007x"
                className={`w-full bg-[rgba(20,20,26,0.8)] border rounded-lg px-3 py-2 text-white font-['Orbitron'] font-bold text-sm tracking-wider outline-none transition-colors ${
                  nicknameError ? 'border-red-500 ring-1 ring-red-500' : 'border-white/15 focus:border-[#a82844]'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-['Barlow_Condensed'] font-bold tracking-wider text-white/80 uppercase mb-1">
                ชื่อ-นามสกุลจริง
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nicknameError) setNicknameError(null);
                }}
                placeholder="เช่น ธนากรณ์ ใจดี"
                className="w-full bg-[rgba(20,20,26,0.8)] border border-white/15 focus:border-[#a82844] rounded-lg px-3 py-2 text-white text-sm font-['Kanit'] outline-none transition-colors"
              />
            </div>
          </div>

          {nicknameError && (
            <div className="px-3 py-2 rounded-lg bg-red-950/60 border border-red-500/50 text-red-200 text-xs font-['Kanit'] flex items-center gap-1.5 animate-in fade-in">
              <span>⚠️</span>
              <span>{nicknameError}</span>
            </div>
          )}

          {/* Row 2: Position */}
          <div>
            <label className="block text-xs font-['Barlow_Condensed'] font-bold tracking-wider text-white/80 uppercase mb-1.5">
              ตำแหน่งหลัก (Position) *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {POSITIONS.map((pos) => {
                const isSelected = position === pos.key;
                return (
                  <button
                    key={pos.key}
                    type="button"
                    onClick={() => setPosition(pos.key)}
                    className={`py-2 px-2.5 rounded-lg border font-['Barlow_Condensed'] font-bold text-xs tracking-wider transition-all flex flex-col items-center justify-center gap-0.5 ${
                      isSelected
                        ? `bg-white/15 ${pos.color} shadow-[0_0_12px_rgba(255,255,255,0.15)] ring-1 ring-white/30`
                        : 'border-white/10 bg-white/[0.03] text-white/60 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <span className="font-['Orbitron'] text-xs font-black">{pos.key}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 3: Profile Avatar URL & Presets */}
          <div>
            <label className="block text-xs font-['Barlow_Condensed'] font-bold tracking-wider text-white/80 uppercase mb-1.5">
              รูปโปรไฟล์ (Profile Avatar)
            </label>
            <div className="flex items-center gap-3 mb-2">
              <img
                src={avatarUrl.trim() || PRESET_AVATARS[0]}
                alt="Avatar Preview"
                className="w-12 h-12 rounded-full object-cover border-2 border-[#a82844] shadow-md flex-shrink-0 bg-black/60"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = PRESET_AVATARS[0];
                }}
              />
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="ระบุ URL รูปโปรไฟล์ หรือเลือกจากรายการด้านล่าง..."
                className="flex-1 bg-[rgba(20,20,26,0.8)] border border-white/15 focus:border-[#a82844] rounded-lg px-3 py-2 text-white text-xs outline-none transition-colors"
              />
            </div>
            {/* Presets */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <span className="text-[10px] text-white/40 font-['Kanit'] whitespace-nowrap">รูปสำเร็จรูป:</span>
              {PRESET_AVATARS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatarUrl(p)}
                  className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-transform flex-shrink-0 ${
                    avatarUrl === p ? 'border-[#d4a857] scale-110 shadow-[0_0_8px_rgba(212,168,87,0.5)]' : 'border-transparent hover:border-white/40'
                  }`}
                >
                  <img src={p} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Row 4: Hero Pool Configuration */}
          <div className="pt-3 border-t border-white/10 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-['Orbitron'] font-bold text-xs tracking-wider text-white">
                  HERO POOL
                </span>
                <span className="text-[11px] font-['Kanit'] text-[#a0a0a8] ml-2">
                  (⭐ Signature: {signatures.length} | ★ Comfortable: {comfortables.length})
                </span>
              </div>
            </div>

            {/* Hero search & tier selection */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={13} />
                <input
                  type="text"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  placeholder="พิมพ์ชื่อ Hero เพื่อเพิ่มเข้า Hero Pool..."
                  className="w-full bg-[rgba(20,20,26,0.8)] border border-white/15 focus:border-[#a82844] text-white pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none font-['Kanit']"
                />
              </div>

              {/* Tier selector for newly added hero */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/10">
                <button
                  type="button"
                  onClick={() => setSelectedTier('signature')}
                  className={`px-2.5 py-1 rounded text-xs font-['Barlow_Condensed'] font-bold tracking-wider flex items-center gap-1 transition-colors ${
                    selectedTier === 'signature'
                      ? 'bg-[#d4a857]/20 border border-[#d4a857] text-[#ffd67a]'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  <span>⭐</span>
                  <span>Signature</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTier('comfortable')}
                  className={`px-2.5 py-1 rounded text-xs font-['Barlow_Condensed'] font-bold tracking-wider flex items-center gap-1 transition-colors ${
                    selectedTier === 'comfortable'
                      ? 'bg-slate-400/20 border border-slate-300 text-slate-200'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  <span>★</span>
                  <span>Comfortable</span>
                </button>
              </div>
            </div>

            {/* Autocomplete dropdown options */}
            {availableHeroes.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 bg-black/50 p-2 rounded-lg border border-white/10">
                {availableHeroes.map((hero) => (
                  <button
                    key={hero.id}
                    type="button"
                    onClick={() => handleAddHero(hero.name)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 hover:bg-[#a82844]/40 border border-white/10 hover:border-[#a82844] text-xs font-['Barlow_Condensed'] font-bold text-white transition-colors flex-shrink-0"
                  >
                    <img
                      src={hero.avatarUrl || getHeroImg(hero.name)}
                      alt={hero.name}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span>{hero.name}</span>
                    <span className="text-[10px] text-white/50">({hero.nameTh})</span>
                    <span className="text-[#a82844] ml-1">＋</span>
                  </button>
                ))}
              </div>
            )}

            {/* Assigned Hero Pool Chips */}
            <div className="flex flex-col gap-2.5 bg-black/30 p-3 rounded-xl border border-white/5">
              {/* Signature section */}
              <div>
                <div className="flex items-center gap-1 text-[11px] font-['Barlow_Condensed'] font-extrabold text-[#d4a857] tracking-wider uppercase mb-1.5">
                  <Star size={12} className="fill-[#d4a857] text-[#d4a857]" />
                  <span>SIGNATURE HEROES (⭐ สีทอง)</span>
                </div>
                {signatures.length === 0 ? (
                  <span className="text-[11px] text-white/30 font-['Kanit']">ยังไม่มีฮีโร่ระดับ Signature</span>
                ) : (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {signatures.map((item) => (
                      <div
                        key={item.heroName}
                        className="flex items-center gap-1.5 pl-1.5 pr-1 py-1 rounded-md bg-[#d4a857]/15 border border-[#d4a857]/50 text-white text-xs font-['Barlow_Condensed'] font-bold shadow-sm"
                      >
                        <img
                          src={getHeroImg(item.heroName)}
                          alt={item.heroName}
                          className="w-5 h-5 rounded object-cover"
                        />
                        <span className="text-[#ffd67a]">⭐ {item.heroName}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleTier(item.heroName)}
                          title="เปลี่ยนเป็น Comfortable (★)"
                          className="p-0.5 hover:bg-white/10 rounded text-white/50 hover:text-white"
                        >
                          ⇄
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveHero(item.heroName)}
                          title="ลบออกจาก Hero Pool"
                          className="p-0.5 hover:bg-red-500/20 rounded text-white/50 hover:text-red-300"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Comfortable section */}
              <div className="pt-2 border-t border-white/5">
                <div className="flex items-center gap-1 text-[11px] font-['Barlow_Condensed'] font-extrabold text-slate-300 tracking-wider uppercase mb-1.5">
                  <Star size={12} className="fill-slate-300 text-slate-300" />
                  <span>COMFORTABLE HEROES (★ สีเงิน)</span>
                </div>
                {comfortables.length === 0 ? (
                  <span className="text-[11px] text-white/30 font-['Kanit']">ยังไม่มีฮีโร่ระดับ Comfortable</span>
                ) : (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {comfortables.map((item) => (
                      <div
                        key={item.heroName}
                        className="flex items-center gap-1.5 pl-1.5 pr-1 py-1 rounded-md bg-white/10 border border-slate-400/50 text-white text-xs font-['Barlow_Condensed'] font-bold shadow-sm"
                      >
                        <img
                          src={getHeroImg(item.heroName)}
                          alt={item.heroName}
                          className="w-5 h-5 rounded object-cover"
                        />
                        <span className="text-slate-200">★ {item.heroName}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleTier(item.heroName)}
                          title="เปลี่ยนเป็น Signature (⭐)"
                          className="p-0.5 hover:bg-white/10 rounded text-white/50 hover:text-white"
                        >
                          ⇄
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveHero(item.heroName)}
                          title="ลบออกจาก Hero Pool"
                          className="p-0.5 hover:bg-red-500/20 rounded text-white/50 hover:text-red-300"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-['Barlow_Condensed'] font-bold text-xs uppercase tracking-wider bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg font-['Barlow_Condensed'] font-black text-xs uppercase tracking-wider bg-[#a82844] hover:bg-[#c93958] text-white shadow-lg transition-all flex items-center gap-1.5"
            >
              <Check size={14} />
              <span>{initialPlayer ? 'บันทึกการแก้ไข' : 'เพิ่มนักแข่ง'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
