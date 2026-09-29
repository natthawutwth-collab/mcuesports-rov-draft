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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in select-none font-['Prompt']">
      <div className="w-full max-w-2xl bg-white border-2 border-[#F3D5E2] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-[#1F2937]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F3D5E2] bg-[#FFF0F5]">
          <div className="font-['Orbitron'] font-bold text-sm tracking-wider text-[#1F2937]">
            {title}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shadow-2xs"
          >
            <X size={16} />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-3 border-b border-[#F3D5E2] flex flex-col sm:flex-row gap-2 bg-white">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหา Hero (ชื่อไทย/อังกฤษ)..."
              className="w-full bg-[#FFF8FB] border border-[#F3D5E2] text-[#1F2937] placeholder-slate-400 pl-9 pr-3 py-1.5 rounded-lg text-sm outline-none focus:border-[#E91E63] focus:bg-white"
            />
          </div>
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {ROLES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRoleFilter(r.key)}
                className={`font-['Prompt'] font-bold text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                  roleFilter === r.key
                    ? 'bg-[#E91E63] border-[#E91E63] text-white shadow-xs'
                    : 'bg-white border-[#F3D5E2] text-slate-700 hover:border-[#E91E63] hover:text-[#E91E63]'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hero Grid */}
        <div className="p-4 overflow-y-auto custom-scrollbar flex-1 bg-[#FFF8FB]">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-2.5">
            {filtered.map((hero) => (
              <button
                key={hero.id}
                onClick={() => {
                  onSelect(hero);
                  onClose();
                }}
                className="group flex flex-col items-center p-1 rounded-xl border border-[#F3D5E2] hover:border-[#E91E63] bg-white hover:bg-[#FFF0F5] transition-all shadow-2xs hover:shadow-xs cursor-pointer"
              >
                <div className="w-full aspect-square rounded-lg overflow-hidden bg-slate-100 mb-1 border border-slate-200">
                  <img
                    src={hero.avatarUrl || getHeroImageUrl(hero.name)}
                    alt={hero.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getHeroImageUrl(hero.name);
                    }}
                  />
                </div>
                <div className="w-full truncate text-center font-['Prompt'] font-bold text-[11px] text-[#1F2937] group-hover:text-[#E91E63]">
                  {hero.name}
                </div>
                <div className="w-full truncate text-center font-['Prompt'] text-[9px] text-slate-400">
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
