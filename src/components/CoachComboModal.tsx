import React, { useState } from 'react';
import { CoachTeamCombo, CoachComboSubstitute } from '../types/player';
import { HEROES, HERO_IMG_MAP, HERO_IMG_OVERRIDE } from '../data/heroes';
import { X, Plus, Trash2, Search, Check, Sparkles, Swords, ArrowRight } from 'lucide-react';

interface CoachComboModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<CoachTeamCombo, 'id' | 'updatedAt'>) => void;
  initialCombo?: CoachTeamCombo | null;
}

function getHeroImg(name: string): string {
  if (!name || typeof name !== 'string' || !name.trim()) {
    return 'https://res.cloudinary.com/dtzdhbllb/image/upload/v1775747198/Flowborn.png';
  }
  const clean = name.trim();
  if (HERO_IMG_OVERRIDE[clean]) return HERO_IMG_OVERRIDE[clean];
  return `https://res.cloudinary.com/dtzdhbllb/image/upload/${HERO_IMG_MAP[clean] || clean}.jpg`;
}

export const CoachComboModal: React.FC<CoachComboModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCombo,
}) => {
  const [name, setName] = useState(initialCombo?.name || '');
  const [timing, setTiming] = useState<'early' | 'mid' | 'late' | 'all'>(initialCombo?.timing || 'all');
  const [notes, setNotes] = useState(initialCombo?.notes || '');
  const [coreHeroes, setCoreHeroes] = useState<string[]>(initialCombo?.coreHeroes || []);
  const [substitutes, setSubstitutes] = useState<CoachComboSubstitute[]>(initialCombo?.substitutes || []);

  // Hero search for core heroes
  const [coreHeroSearch, setCoreHeroSearch] = useState('');
  
  // Substitute input state
  const [subOriginal, setSubOriginal] = useState('');
  const [subReplacement, setSubReplacement] = useState('');
  const [subReason, setSubReason] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredHeroesForCore = coreHeroSearch.trim()
    ? HEROES.filter(
        (h) =>
          !coreHeroes.includes(h.name) &&
          (h.name.toLowerCase().includes(coreHeroSearch.toLowerCase()) ||
            h.nameTh.toLowerCase().includes(coreHeroSearch.toLowerCase()))
      ).slice(0, 8)
    : [];

  const handleAddCoreHero = (heroName: string) => {
    if (coreHeroes.length >= 5) {
      setErrorMsg('คอมโบทีมกำหนดฮีโร่หลักได้สูงสุด 5 ตัว');
      return;
    }
    setCoreHeroes([...coreHeroes, heroName]);
    setCoreHeroSearch('');
    setErrorMsg(null);
  };

  const handleRemoveCoreHero = (heroName: string) => {
    setCoreHeroes(coreHeroes.filter((h) => h !== heroName));
    // Also remove any substitute referencing this hero
    setSubstitutes(substitutes.filter((s) => s.originalHero !== heroName));
  };

  const handleAddSubstitute = () => {
    if (!subOriginal || !subReplacement) {
      setErrorMsg('กรุณาเลือกทั้งตัวหลักและตัวทดแทน');
      return;
    }
    if (subOriginal === subReplacement) {
      setErrorMsg('ตัวทดแทนต้องไม่ใช่ตัวเดียวกับตัวหลัก');
      return;
    }
    setSubstitutes([
      ...substitutes,
      {
        originalHero: subOriginal,
        substituteHero: subReplacement,
        reason: subReason.trim() || 'ตัวทดแทนตำแหน่งที่มีสกิลใกล้เคียงกัน',
      },
    ]);
    setSubReplacement('');
    setSubReason('');
    setErrorMsg(null);
  };

  const handleRemoveSubstitute = (index: number) => {
    setSubstitutes(substitutes.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('กรุณาระบุชื่อคอมโบทีม');
      return;
    }
    if (coreHeroes.length < 2) {
      setErrorMsg('คอมโบต้องประกอบด้วยฮีโร่หลักอย่างน้อย 2 ตัว');
      return;
    }
    onSave({
      name: name.trim(),
      coreHeroes,
      substitutes,
      timing,
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150 font-['Prompt']">
      <div className="w-full max-w-xl bg-white border border-[#F3D5E2] rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F3D5E2] bg-gradient-to-r from-white via-[#FFF0F5] to-white">
          <div className="flex items-center gap-2">
            <Swords size={18} className="text-[#E91E63]" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              {initialCombo ? 'แก้ไขคอมโบทีม' : 'บันทึกคอมโบทีมใหม่'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar text-xs">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Row 1: Combo Name & Timing */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                ชื่อคอมโบ (Combo Name) *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น Capheny + TeeMee เร่งเงิน"
                className="w-full px-3 py-2 bg-[#FFF8FB] border border-[#F3D5E2] focus:border-[#E91E63] focus:bg-white rounded-xl outline-none font-bold text-slate-800 text-xs transition-all shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                ช่วงเวลาเด่น
              </label>
              <select
                value={timing}
                onChange={(e) => setTiming(e.target.value as any)}
                className="w-full px-2.5 py-2 bg-[#FFF8FB] border border-[#F3D5E2] focus:border-[#E91E63] focus:bg-white rounded-xl outline-none text-slate-800 text-xs font-semibold"
              >
                <option value="early">ต้นเกม (0-4 น.)</option>
                <option value="mid">กลางเกม (4-10 น.)</option>
                <option value="late">เลทเกม (10+ น.)</option>
                <option value="all">ทุกช่วงเวลา (สมดุล)</option>
              </select>
            </div>
          </div>

          {/* Core Heroes Selector */}
          <div className="bg-[#FFF8FB] border border-[#F3D5E2] rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 text-[11px] uppercase">
                ฮีโร่หลักในคอมโบ (Core Heroes: 2-5 ตัว) *
              </label>
              <span className="text-[10.5px] font-bold text-[#E91E63]">
                เลือกแล้ว {coreHeroes.length}/5 ตัว
              </span>
            </div>

            {/* Selected Heroes Chips */}
            <div className="flex items-center gap-1.5 flex-wrap min-h-[32px]">
              {coreHeroes.length === 0 ? (
                <span className="text-[11px] text-slate-400 italic">ยังไม่ได้เลือกฮีโร่หลัก</span>
              ) : (
                coreHeroes.map((heroName) => (
                  <div
                    key={heroName}
                    className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 bg-white border border-[#F48FB1] rounded-lg text-slate-800 font-bold shadow-2xs"
                  >
                    <img
                      src={getHeroImg(heroName)}
                      alt={heroName}
                      className="w-4 h-4 rounded object-cover"
                    />
                    <span>{heroName}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCoreHero(heroName)}
                      className="text-rose-500 hover:text-rose-700 ml-0.5 cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Search hero to add */}
            {coreHeroes.length < 5 && (
              <div className="space-y-1.5 pt-1">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={coreHeroSearch}
                    onChange={(e) => setCoreHeroSearch(e.target.value)}
                    placeholder="พิมพ์ชื่อฮีโร่เพื่อเพิ่มเข้าคอมโบ..."
                    className="w-full pl-7 pr-3 py-1 bg-white border border-[#F3D5E2] focus:border-[#E91E63] rounded-lg outline-none text-xs"
                  />
                </div>

                {filteredHeroesForCore.length > 0 && (
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
                    {filteredHeroesForCore.map((hero) => (
                      <button
                        key={hero.id}
                        type="button"
                        onClick={() => handleAddCoreHero(hero.name)}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-white hover:bg-[#FFF0F5] border border-slate-200 hover:border-[#E91E63] text-slate-700 text-[11px] font-bold flex-shrink-0 cursor-pointer shadow-2xs"
                      >
                        <img
                          src={hero.avatarUrl || getHeroImg(hero.name)}
                          alt={hero.name}
                          className="w-3.5 h-3.5 rounded-full object-cover"
                        />
                        <span>{hero.name}</span>
                        <span className="text-[#E91E63]">＋</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Substitutes / ตัวทดแทนเมื่อตัวหลักโดนแบน */}
          <div className="bg-[#FFF8FB] border border-[#F3D5E2] rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 text-[11px] uppercase">
                ตัวทดแทนเมื่อตัวหลักโดนแบน (Substitutes)
              </label>
              <span className="text-[10px] text-slate-500">บันทึกความสัมพันธ์จริง</span>
            </div>

            {/* Current Substitutes List */}
            {substitutes.length > 0 ? (
              <div className="space-y-1.5">
                {substitutes.map((sub, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 p-2 bg-white border border-slate-200 rounded-lg shadow-2xs"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="flex items-center gap-1 font-bold text-slate-700">
                        <img src={getHeroImg(sub.originalHero)} alt="" className="w-4 h-4 rounded" />
                        <span>{sub.originalHero}</span>
                      </div>
                      <ArrowRight size={11} className="text-[#E91E63] flex-shrink-0" />
                      <div className="flex items-center gap-1 font-bold text-emerald-700">
                        <img src={getHeroImg(sub.substituteHero)} alt="" className="w-4 h-4 rounded" />
                        <span>{sub.substituteHero}</span>
                      </div>
                      <span className="text-[10.5px] text-slate-500 truncate ml-1">
                        ({sub.reason})
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveSubstitute(idx)}
                      className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic">
                ยังไม่มีการระบุตัวทดแทน สามารถระบุด้านล่างได้
              </p>
            )}

            {/* Add Substitute Row */}
            {coreHeroes.length > 0 && (
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                      หากตัวหลักนี้โดนแบน:
                    </span>
                    <select
                      value={subOriginal}
                      onChange={(e) => setSubOriginal(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                    >
                      <option value="">-- เลือกตัวหลัก --</option>
                      {coreHeroes.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                      ให้เปลี่ยนไปใช้ตัวนี้แทน:
                    </span>
                    <select
                      value={subReplacement}
                      onChange={(e) => setSubReplacement(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                    >
                      <option value="">-- เลือกตัวทดแทน --</option>
                      {HEROES.filter((h) => !coreHeroes.includes(h.name)).map((h) => (
                        <option key={h.id} value={h.name}>
                          {h.name} ({h.nameTh})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={subReason}
                    onChange={(e) => setSubReason(e.target.value)}
                    placeholder="เหตุผลหรือจุดเด่นที่ใช้แทนกันได้ (เช่น มีดาเมจจริง คล่องตัวเหมือนกัน)..."
                    className="flex-1 px-2.5 py-1 bg-white border border-slate-200 focus:border-[#E91E63] rounded-lg outline-none text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubstitute}
                    className="px-2.5 py-1 bg-[#E91E63] hover:bg-[#D81B60] text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer flex-shrink-0"
                  >
                    <Plus size={12} />
                    <span>เพิ่มตัวแทน</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notes & Tactical Instruction */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              คำแนะนำและแผนการเล่น (Tactical Plan)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เช่น เน้นรวมตัวไฟต์ 3 คนโซนบน, ดักพุ่มไม้บริเวณบัฟแดง, ให้แครี่ฟาร์มจนถึงนาทีที่ 8..."
              className="w-full px-3 py-2 bg-[#FFF8FB] border border-[#F3D5E2] focus:border-[#E91E63] focus:bg-white rounded-xl outline-none text-slate-800 text-xs transition-all shadow-2xs resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs cursor-pointer transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-[#E91E63] hover:bg-[#D81B60] text-white font-bold text-xs shadow-xs cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <Check size={13} />
              <span>{initialCombo ? 'บันทึกการแก้ไข' : 'บันทึกคอมโบทีม'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
