import React, { useState, useMemo } from 'react';
import { Hero, PositionKey } from '../types/draft';
import { HEROES, getHeroImageUrl } from '../data/heroes';
import { Search, X } from 'lucide-react';

interface HeroPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (hero: Hero) => void;
  title?: string;
}

const ROLES: { key: PositionKey; label: string }[] = [
  { key: 'all', label: 'ALL' },
  { key: 'dsl', label: 'DSL' },
  { key: 'jg', label: 'JG' },
  { key: 'mid', label: 'MID' },
  { key: 'roam', label: 'SUP' },
  { key: 'adl', label: 'ADL' },
];

export const HeroPickerModal: React.FC<HeroPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  title = 'เลือก Hero สำหรับ Match Note',
}) => {
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<PositionKey>('all');

  const filtered = useMemo(() => {
    return HEROES.filter((h) => {
      if (roleFilter !== 'all' && !h.pos.includes(roleFilter)) return false;
      if (query.trim().length > 0) {
        const q = query.trim().toLowerCase();
        if (
          !h.name.toLowerCase().includes(q) &&
          !h.nameTh.toLowerCase().includes(q) &&
          !h.tags.some((t) => t.toLowerCase().includes(q))
        ) {
          return false;
        }
      }
      return true;
    });
  }, [roleFilter, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl bg-[#0e0e14] border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-black/40">
          <div className="font-['Orbitron'] font-bold text-sm tracking-wider text-white">
            {title}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-3 border-b border-white/10 flex flex-col sm:flex-row gap-2 bg-black/20">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={14} />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหา Hero (ชื่อไทย/อังกฤษ)..."
              className="w-full bg-[rgba(20,20,26,0.8)] border border-white/15 text-white pl-9 pr-3 py-1.5 rounded-lg text-sm outline-none focus:border-[#a82844]"
            />
          </div>
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {ROLES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRoleFilter(r.key)}
                className={`font-['Barlow_Condensed'] font-bold text-xs px-3 py-1.5 rounded border transition-colors ${
                  roleFilter === r.key
                    ? 'bg-[#a82844] border-[#a82844] text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hero Grid */}
        <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-2.5">
            {filtered.map((hero) => (
              <button
                key={hero.id}
                onClick={() => {
                  onSelect(hero);
                  onClose();
                }}
                className="group flex flex-col items-center p-1 rounded-lg border border-white/10 hover:border-[#a82844] bg-white/[0.02] hover:bg-white/[0.08] transition-all"
              >
                <div className="w-full aspect-square rounded-md overflow-hidden bg-black/40 mb-1">
                  <img
                    src={hero.avatarUrl || getHeroImageUrl(hero.name)}
                    alt={hero.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getHeroImageUrl(hero.name);
                    }}
                  />
                </div>
                <div className="w-full truncate text-center font-['Barlow_Condensed'] font-bold text-[11px] text-white">
                  {hero.name}
                </div>
                <div className="w-full truncate text-center font-['Kanit'] text-[9px] text-[#a0a0a8]">
                  {hero.nameTh}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
