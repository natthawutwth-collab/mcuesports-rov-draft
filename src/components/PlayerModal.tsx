import React, { useState, useMemo } from 'react';
import { Player, PlayerPosition, PlayerHeroPoolItem, HeroProficiency, PlayerCategory } from '../types/player';
import { HEROES, HERO_IMG_MAP, HERO_IMG_OVERRIDE } from '../data/heroes';
import { X, Search, Star, Trash2, UserPlus, Check } from 'lucide-react';

interface PlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    nickname: string;
    position: PlayerPosition;
    avatarUrl?: string;
    heroPool: PlayerHeroPoolItem[];
    category?: PlayerCategory;
    categories?: PlayerCategory[];
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

  // Categories state: array supporting up to 2 categories (Male+Mixed or Female+Mixed)
  const [categories, setCategories] = useState<PlayerCategory[]>(() => {
    if (initialPlayer?.categories && initialPlayer.categories.length > 0) {
      return initialPlayer.categories;
    }
    if (initialPlayer?.category) {
      return [initialPlayer.category];
    }
    return ['male'];
  });

  const handleToggleCategory = (cat: PlayerCategory) => {
    setCategories((prev) => {
      const isAlready = prev.includes(cat);

      if (isAlready) {
        // Keep at least 1 category selected
        if (prev.length > 1) {
          return prev.filter((c) => c !== cat);
        }
        return prev;
      }

      // If choosing 'male', remove 'female' because male & female cannot be selected together
      if (cat === 'male') {
        const withoutFemale = prev.filter((c) => c !== 'female');
        return [...withoutFemale, 'male'];
      }

      // If choosing 'female', remove 'male' because male & female cannot be selected together
      if (cat === 'female') {
        const withoutMale = prev.filter((c) => c !== 'male');
        return [...withoutMale, 'female'];
      }

      // If choosing 'mixed', it can combine with male OR female (up to 2 teams)
      if (cat === 'mixed') {
        return [...prev, 'mixed'];
      }

      return prev;
    });
  };

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
      category: categories[0] || 'male',
      categories,
      avatarUrl: initialPlayer?.avatarUrl || '',
      heroPool,
    });
    onClose();
  };

  const signatures = heroPool.filter((h) => h.tier === 'signature');
  const comfortables = heroPool.filter((h) => h.tier === 'comfortable');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white border-2 border-[#F3D5E2] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F3D5E2] bg-[#FFF0F5]">
          <div className="flex items-center gap-2 font-['Prompt'] font-bold text-base tracking-wider text-[#1F2937]">
            <UserPlus size={18} className="text-[#E91E63]" />
            <span>{initialPlayer ? 'แก้ไขข้อมูลนักแข่ง' : 'เพิ่มนักแข่งใหม่'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors shadow-2xs cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 custom-scrollbar flex flex-col gap-4 font-['Prompt']">
          {/* Row 1: Nickname & Full Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-['Prompt'] font-bold tracking-wider text-slate-700 uppercase mb-1">
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
                className={`w-full bg-[#FFF8FB] border rounded-lg px-3 py-2 text-[#1F2937] font-['Orbitron'] font-bold text-sm tracking-wider outline-none transition-colors ${
                  nicknameError ? 'border-red-500 ring-1 ring-red-500' : 'border-[#F3D5E2] focus:border-[#E91E63] focus:bg-white'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-['Prompt'] font-bold tracking-wider text-slate-700 uppercase mb-1">
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
                className="w-full bg-[#FFF8FB] border border-[#F3D5E2] focus:border-[#E91E63] focus:bg-white rounded-lg px-3 py-2 text-[#1F2937] text-sm font-['Prompt'] outline-none transition-colors"
              />
            </div>
          </div>

          {nicknameError && (
            <div className="px-3 py-2 rounded-lg bg-rose-50 border border-rose-300 text-rose-700 text-xs font-['Prompt'] flex items-center gap-1.5 animate-in fade-in">
              <span>⚠️</span>
              <span>{nicknameError}</span>
            </div>
          )}

          {/* Row 2: Team Division / Categories (Max 2: Male+Mixed or Female+Mixed) */}
          <div className="bg-[#FFF8FB] border border-[#F3D5E2] rounded-xl p-3">
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
              <label className="text-xs font-['Prompt'] font-bold tracking-wider text-slate-800 uppercase flex items-center gap-1.5">
                <span>🛡️</span>
                <span>หมวดหมู่ทีมที่สังกัด (Team Categories) *</span>
              </label>
              <span className="text-[10px] sm:text-[10.5px] font-['Prompt'] font-bold text-[#E91E63] bg-[#FCE4EC] px-2 py-0.5 rounded-full border border-[#F48FB1]">
                เลือกได้สูงสุด 2 ทีม: ชาย+ผสม หรือ หญิง+ผสม
              </span>
            </div>

            <p className="text-[11px] text-slate-500 mb-2 font-['Prompt']">
              นักกีฬา 1 คนสามารถสังกัดได้สูงสุด 2 ทีม เช่น เล่นได้ทั้งทีมชายและทีมผสม หรือทีมหญิงและทีมผสม
              <span className="text-rose-600 font-semibold ml-1">(ไม่อนุญาตให้เลือกทีมชายและทีมหญิงพร้อมกัน)</span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Male */}
              <button
                type="button"
                onClick={() => handleToggleCategory('male')}
                className={`py-2 px-3 rounded-lg border font-['Prompt'] font-bold text-xs tracking-wider transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                  categories.includes('male')
                    ? 'bg-sky-50 border-[#0284C7] text-[#0284C7] shadow-xs ring-1 ring-[#0284C7]'
                    : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">👨</span>
                  <span>ทีมชาย (Men)</span>
                </div>
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] font-bold ${
                    categories.includes('male')
                      ? 'bg-[#0284C7] border-[#0284C7] text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {categories.includes('male') && '✓'}
                </div>
              </button>

              {/* Female */}
              <button
                type="button"
                onClick={() => handleToggleCategory('female')}
                className={`py-2 px-3 rounded-lg border font-['Prompt'] font-bold text-xs tracking-wider transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                  categories.includes('female')
                    ? 'bg-rose-50 border-[#E11D48] text-[#E11D48] shadow-xs ring-1 ring-[#E11D48]'
                    : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">👩</span>
                  <span>ทีมหญิง (Women)</span>
                </div>
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] font-bold ${
                    categories.includes('female')
                      ? 'bg-[#E11D48] border-[#E11D48] text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {categories.includes('female') && '✓'}
                </div>
              </button>

              {/* Mixed */}
              <button
                type="button"
                onClick={() => handleToggleCategory('mixed')}
                className={`py-2 px-3 rounded-lg border font-['Prompt'] font-bold text-xs tracking-wider transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                  categories.includes('mixed')
                    ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-xs ring-1 ring-purple-500'
                    : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">👥</span>
                  <span>ทีมผสม (Mixed)</span>
                </div>
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] font-bold ${
                    categories.includes('mixed')
                      ? 'bg-purple-600 border-purple-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {categories.includes('mixed') && '✓'}
                </div>
              </button>
            </div>

            {/* Selection Status Summary */}
            <div className="mt-2 flex items-center justify-between text-[11px] font-['Prompt'] text-slate-600 pt-1.5 border-t border-[#F3D5E2]/80">
              <span className="font-semibold text-slate-500">สถานะสังกัดทีม:</span>
              <span className="font-bold text-[#E91E63]">
                {categories.includes('male') && categories.includes('mixed') && '✓ สังกัด 2 ทีม: ทีมชาย + ทีมผสม'}
                {categories.includes('female') && categories.includes('mixed') && '✓ สังกัด 2 ทีม: ทีมหญิง + ทีมผสม'}
                {categories.includes('male') && !categories.includes('mixed') && '✓ สังกัด 1 ทีม: ทีมชาย (แตะ "+ ทีมผสม" เพื่อเล่น 2 ทีมได้)'}
                {categories.includes('female') && !categories.includes('mixed') && '✓ สังกัด 1 ทีม: ทีมหญิง (แตะ "+ ทีมผสม" เพื่อเล่น 2 ทีมได้)'}
                {!categories.includes('male') && !categories.includes('female') && categories.includes('mixed') && '✓ สังกัด 1 ทีม: ทีมผสม (แตะ "+ ชาย" หรือ "+ หญิง" ได้)'}
              </span>
            </div>
          </div>

          {/* Row 3: Position */}
          <div>
            <label className="block text-xs font-['Prompt'] font-bold tracking-wider text-slate-700 uppercase mb-1.5">
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
                    className={`py-2 px-2.5 rounded-lg border font-['Prompt'] font-bold text-xs tracking-wider transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#FCE4EC] border-[#E91E63] text-[#E91E63] shadow-xs'
                        : 'border-[#F3D5E2] bg-white text-slate-600 hover:text-slate-900 hover:border-slate-400'
                    }`}
                  >
                    <span className="font-['Orbitron'] text-xs font-black">{pos.key}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hero Pool Configuration */}
          <div className="pt-3 border-t border-[#F3D5E2] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-['Orbitron'] font-bold text-xs tracking-wider text-[#1F2937]">
                  HERO POOL
                </span>
                <span className="text-[11px] font-['Prompt'] text-slate-500 ml-2">
                  (⭐ Signature: {signatures.length} | ★ Comfortable: {comfortables.length})
                </span>
              </div>
            </div>

            {/* Hero search & tier selection */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                <input
                  type="text"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  placeholder="พิมพ์ชื่อ Hero เพื่อเพิ่มเข้า Hero Pool..."
                  className="w-full bg-[#FFF8FB] border border-[#F3D5E2] focus:border-[#E91E63] focus:bg-white text-[#1F2937] pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none font-['Prompt']"
                />
              </div>

              {/* Tier selector for newly added hero */}
              <div className="flex items-center gap-1 bg-[#FFF0F5] p-1 rounded-lg border border-[#F3D5E2]">
                <button
                  type="button"
                  onClick={() => setSelectedTier('signature')}
                  className={`px-2.5 py-1 rounded text-xs font-['Prompt'] font-bold tracking-wider flex items-center gap-1 transition-colors cursor-pointer ${
                    selectedTier === 'signature'
                      ? 'bg-[#FEF3C7] border border-[#F59E0B] text-[#B45309]'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>⭐</span>
                  <span>Signature</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTier('comfortable')}
                  className={`px-2.5 py-1 rounded text-xs font-['Prompt'] font-bold tracking-wider flex items-center gap-1 transition-colors cursor-pointer ${
                    selectedTier === 'comfortable'
                      ? 'bg-slate-200 border border-slate-400 text-slate-800'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>★</span>
                  <span>Comfortable</span>
                </button>
              </div>
            </div>

            {/* Autocomplete dropdown options */}
            {availableHeroes.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 bg-[#FFF8FB] p-2 rounded-lg border border-[#F3D5E2]">
                {availableHeroes.map((hero) => (
                  <button
                    key={hero.id}
                    type="button"
                    onClick={() => handleAddHero(hero.name)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white hover:bg-[#FFF0F5] border border-slate-200 hover:border-[#E91E63] text-xs font-['Prompt'] font-bold text-slate-800 transition-colors flex-shrink-0 cursor-pointer shadow-2xs"
                  >
                    <img
                      src={hero.avatarUrl || getHeroImg(hero.name)}
                      alt={hero.name}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span>{hero.name}</span>
                    <span className="text-[10px] text-slate-400">({hero.nameTh})</span>
                    <span className="text-[#E91E63] ml-1">＋</span>
                  </button>
                ))}
              </div>
            )}

            {/* Assigned Hero Pool Chips */}
            <div className="flex flex-col gap-2.5 bg-[#FFF8FB] p-3 rounded-xl border border-[#F3D5E2]">
              {/* Signature section */}
              <div>
                <div className="flex items-center gap-1 text-[11px] font-['Prompt'] font-bold text-[#B45309] tracking-wider uppercase mb-1.5">
                  <Star size={12} className="fill-[#F59E0B] text-[#F59E0B]" />
                  <span>SIGNATURE HEROES (⭐ สีทอง)</span>
                </div>
                {signatures.length === 0 ? (
                  <span className="text-[11px] text-slate-400 font-['Prompt']">ยังไม่มีฮีโร่ระดับ Signature</span>
                ) : (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {signatures.map((item) => (
                      <div
                        key={item.heroName}
                        className="flex items-center gap-1.5 pl-1.5 pr-1 py-1 rounded-md bg-[#FEF3C7] border border-[#F59E0B] text-[#B45309] text-xs font-['Prompt'] font-bold shadow-2xs"
                      >
                        <img
                          src={getHeroImg(item.heroName)}
                          alt={item.heroName}
                          className="w-5 h-5 rounded object-cover"
                        />
                        <span>⭐ {item.heroName}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleTier(item.heroName)}
                          title="เปลี่ยนเป็น Comfortable (★)"
                          className="p-0.5 hover:bg-[#FDE68A] rounded text-[#B45309] cursor-pointer"
                        >
                          ⇄
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveHero(item.heroName)}
                          title="ลบออกจาก Hero Pool"
                          className="p-0.5 hover:bg-red-100 rounded text-red-600 cursor-pointer"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Comfortable section */}
              <div className="pt-2 border-t border-[#F3D5E2]">
                <div className="flex items-center gap-1 text-[11px] font-['Prompt'] font-bold text-slate-600 tracking-wider uppercase mb-1.5">
                  <Star size={12} className="fill-slate-400 text-slate-400" />
                  <span>COMFORTABLE HEROES (★ สีเงิน)</span>
                </div>
                {comfortables.length === 0 ? (
                  <span className="text-[11px] text-slate-400 font-['Prompt']">ยังไม่มีฮีโร่ระดับ Comfortable</span>
                ) : (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {comfortables.map((item) => (
                      <div
                        key={item.heroName}
                        className="flex items-center gap-1.5 pl-1.5 pr-1 py-1 rounded-md bg-white border border-slate-300 text-slate-700 text-xs font-['Prompt'] font-bold shadow-2xs"
                      >
                        <img
                          src={getHeroImg(item.heroName)}
                          alt={item.heroName}
                          className="w-5 h-5 rounded object-cover"
                        />
                        <span>★ {item.heroName}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleTier(item.heroName)}
                          title="เปลี่ยนเป็น Signature (⭐)"
                          className="p-0.5 hover:bg-slate-100 rounded text-slate-500 cursor-pointer"
                        >
                          ⇄
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveHero(item.heroName)}
                          title="ลบออกจาก Hero Pool"
                          className="p-0.5 hover:bg-red-100 rounded text-red-600 cursor-pointer"
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
          <div className="pt-3 border-t border-[#F3D5E2] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-['Prompt'] font-bold text-xs uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-300 cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg font-['Prompt'] font-bold text-xs uppercase tracking-wider bg-[#E91E63] hover:bg-[#D81B60] text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
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
