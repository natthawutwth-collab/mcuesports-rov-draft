import React, { useState } from 'react';
import {
  Swords,
  Save,
  Trash2,
  CheckCircle,
  AlertCircle,
  Star,
  Clock,
  Video,
  User,
  Plus,
} from 'lucide-react';
import { ScrimGame, ScrimPlayerAssignment, ScrimResult } from '../../types/scrim';
import { Player } from '../../types/player';
import { Hero, LaneSelectKey } from '../../types/draft';
import { HEROES, getHeroImageUrl } from '../../data/heroes';
import { HeroPickerModal } from '../HeroPickerModal';

interface ScrimGameEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: ScrimGame;
  players: Player[];
  onSave: (updatedGame: ScrimGame) => void;
}

const DEFAULT_LANES: LaneSelectKey[] = ['DSL', 'JG', 'MID', 'ROAM', 'ADL'];

export const ScrimGameEditorModal: React.FC<ScrimGameEditorModalProps> = ({
  isOpen,
  onClose,
  game,
  players,
  onSave,
}) => {
  const [formData, setFormData] = useState<ScrimGame>(() => {
    // Ensure 5 slots initialized for picks
    const bPicks: ScrimPlayerAssignment[] = [...(game.bluePicks || [])];
    const rPicks: ScrimPlayerAssignment[] = [...(game.redPicks || [])];

    DEFAULT_LANES.forEach((pos, idx) => {
      if (!bPicks[idx]) {
        bPicks[idx] = { slotIndex: idx, position: pos, heroName: '' };
      }
      if (!rPicks[idx]) {
        rPicks[idx] = { slotIndex: idx, position: pos, heroName: '' };
      }
    });

    return {
      ...game,
      bluePicks: bPicks,
      redPicks: rPicks,
      blueBans: game.blueBans || [],
      redBans: game.redBans || [],
    };
  });

  // Hero Picker state
  const [pickerTarget, setPickerTarget] = useState<{
    side: 'blue' | 'red';
    phase: 'ban' | 'pick';
    index: number;
  } | null>(null);

  if (!isOpen) return null;

  // Check completeness
  const bluePicksFilled = formData.bluePicks.filter((p) => p.heroName?.trim()).length;
  const redPicksFilled = formData.redPicks.filter((p) => p.heroName?.trim()).length;
  const isFullyCompleted = bluePicksFilled === 5 && redPicksFilled === 5 && formData.winner !== 'undecided';

  const handleHeroSelect = (hero: Hero) => {
    if (!pickerTarget) return;
    const { side, phase, index } = pickerTarget;

    setFormData((prev) => {
      const copy = { ...prev };
      if (phase === 'ban') {
        const bans = side === 'blue' ? [...copy.blueBans] : [...copy.redBans];
        bans[index] = hero.name;
        if (side === 'blue') copy.blueBans = bans;
        else copy.redBans = bans;
      } else {
        const picks = side === 'blue' ? [...copy.bluePicks] : [...copy.redPicks];
        picks[index] = { ...picks[index], heroName: hero.name };
        if (side === 'blue') copy.bluePicks = picks;
        else copy.redPicks = picks;
      }
      return copy;
    });

    setPickerTarget(null);
  };

  const handleClearSlot = (side: 'blue' | 'red', phase: 'ban' | 'pick', index: number) => {
    setFormData((prev) => {
      const copy = { ...prev };
      if (phase === 'ban') {
        const bans = side === 'blue' ? [...copy.blueBans] : [...copy.redBans];
        bans.splice(index, 1);
        if (side === 'blue') copy.blueBans = bans;
        else copy.redBans = bans;
      } else {
        const picks = side === 'blue' ? [...copy.bluePicks] : [...copy.redPicks];
        picks[index] = { ...picks[index], heroName: '', playerId: undefined, playerNickname: undefined };
        if (side === 'blue') copy.bluePicks = picks;
        else copy.redPicks = picks;
      }
      return copy;
    });
  };

  const handleSave = () => {
    const finalGame: ScrimGame = {
      ...formData,
      isComplete: isFullyCompleted,
      result: (formData.winner === 'us' ? 'won' : formData.winner === 'opp' ? 'lost' : 'in_progress') as ScrimResult,
      updatedAt: new Date().toISOString(),
    };
    onSave(finalGame);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs font-['Prompt']">
      <div className="bg-white border-2 border-[#F3D5E2] rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#FFF8FB] border-b border-[#F3D5E2] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E91E63] to-[#D81B60] text-white flex items-center justify-center shadow-md shadow-[#E91E63]/25 flex-shrink-0">
              <Swords size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  บันทึกข้อมูล Game #{formData.gameNumber}
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    isFullyCompleted
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isFullyCompleted ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                  <span>{isFullyCompleted ? 'ข้อมูลสมบูรณ์' : 'ข้อมูลบางส่วน (บันทึกต่อได้)'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {formData.blueTeamName} vs {formData.redTeamName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4 custom-scrollbar text-slate-800">
          {/* Game Outcome & Side Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#FFF8FB] border border-[#F3D5E2] p-3 rounded-2xl">
            {/* Our Side */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">ฝั่งทีมเรา (Our Side):</label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, ourSide: 'blue' }))}
                  className={`flex-1 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    formData.ourSide === 'blue'
                      ? 'bg-sky-500 text-white border-sky-600 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  🔵 BLUE
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, ourSide: 'red' }))}
                  className={`flex-1 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    formData.ourSide === 'red'
                      ? 'bg-rose-500 text-white border-rose-600 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  🔴 RED
                </button>
              </div>
            </div>

            {/* Winner */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">ผลการแข่งขัน:</label>
              <select
                value={formData.winner}
                onChange={(e) => setFormData((p) => ({ ...p, winner: e.target.value as any }))}
                className="w-full text-xs font-bold p-1.5 rounded-lg border border-slate-200 bg-white outline-none cursor-pointer"
              >
                <option value="undecided">⏳ กำลังแข่งขัน / ยังไม่สรุป</option>
                <option value="us">🏆 MCU ชนะ (Victory)</option>
                <option value="opp">❌ คู่แข่งชนะ (Defeat)</option>
                <option value="draw">🤝 เสมอ (Draw)</option>
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">เวลาแข่งขัน (นาที):</label>
              <div className="flex items-center gap-1">
                <Clock size={13} className="text-slate-400" />
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={formData.matchDurationMinutes || 15}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, matchDurationMinutes: Number(e.target.value) }))
                  }
                  className="w-full text-xs font-bold p-1.5 rounded-lg border border-slate-200 bg-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* Picks & Bans Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Blue Side Lineup */}
            <div className="bg-white border border-sky-200 rounded-2xl p-3 shadow-2xs flex flex-col gap-2.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-sky-100">
                <span className="text-xs font-bold text-sky-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                  <span>Blue Side Lineup</span>
                  {formData.ourSide === 'blue' && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-100 text-sky-700 font-black">
                      MCU (ทีมเรา)
                    </span>
                  )}
                </span>
                <span className="text-[10px] text-slate-400">{bluePicksFilled}/5 Picks</span>
              </div>

              {/* Blue Bans (up to 4) */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Bans:</span>
                {[0, 1, 2, 3].map((bIdx) => {
                  const bHero = formData.blueBans[bIdx];
                  return (
                    <div
                      key={bIdx}
                      onClick={() => setPickerTarget({ side: 'blue', phase: 'ban', index: bIdx })}
                      className="h-8 px-2 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 flex items-center gap-1 cursor-pointer"
                    >
                      {bHero ? (
                        <>
                          <img
                            src={getHeroImageUrl(bHero)}
                            alt={bHero}
                            className="w-5 h-5 rounded-md object-cover grayscale"
                          />
                          <span className="text-[10px] font-bold text-slate-700">{bHero}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClearSlot('blue', 'ban', bIdx);
                            }}
                            className="text-[10px] text-slate-400 hover:text-rose-600"
                          >
                            ×
                          </button>
                        </>
                      ) : (
                        <span className="text-[9.5px] text-rose-400">+ Ban {bIdx + 1}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Blue 5 Picks */}
              <div className="flex flex-col gap-1.5 mt-1">
                {formData.bluePicks.map((pick, pIdx) => (
                  <div
                    key={pIdx}
                    className="p-2 rounded-xl bg-sky-50/40 border border-sky-100 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-8 text-center text-[10px] font-black text-sky-700 py-0.5 rounded bg-sky-100">
                        {pick.position}
                      </span>
                      {pick.heroName ? (
                        <div
                          onClick={() => setPickerTarget({ side: 'blue', phase: 'pick', index: pIdx })}
                          className="flex items-center gap-1.5 cursor-pointer hover:opacity-80"
                        >
                          <img
                            src={getHeroImageUrl(pick.heroName)}
                            alt={pick.heroName}
                            className="w-7 h-7 rounded-lg object-cover border border-sky-300"
                          />
                          <span className="text-xs font-bold text-slate-900">{pick.heroName}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPickerTarget({ side: 'blue', phase: 'pick', index: pIdx })}
                          className="text-xs text-sky-600 hover:underline font-semibold cursor-pointer"
                        >
                          + เลือกฮีโร่
                        </button>
                      )}
                    </div>

                    {/* Player selector for our team */}
                    {formData.ourSide === 'blue' && (
                      <div className="flex items-center gap-1">
                        <User size={11} className="text-slate-400" />
                        <select
                          value={pick.playerId || ''}
                          onChange={(e) => {
                            const p = players.find((item) => item.id === e.target.value);
                            setFormData((prev) => {
                              const copy = { ...prev };
                              copy.bluePicks[pIdx] = {
                                ...copy.bluePicks[pIdx],
                                playerId: p?.id,
                                playerName: p?.name,
                                playerNickname: p?.nickname,
                              };
                              return copy;
                            });
                          }}
                          className="text-[10px] font-semibold p-1 rounded border border-slate-200 bg-white outline-none max-w-[100px]"
                        >
                          <option value="">-- นักแข่ง --</option>
                          {players.map((pl) => (
                            <option key={pl.id} value={pl.id}>
                              {pl.nickname} ({pl.position})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Red Side Lineup */}
            <div className="bg-white border border-rose-200 rounded-2xl p-3 shadow-2xs flex flex-col gap-2.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-rose-100">
                <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Red Side Lineup</span>
                  {formData.ourSide === 'red' && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 font-black">
                      MCU (ทีมเรา)
                    </span>
                  )}
                </span>
                <span className="text-[10px] text-slate-400">{redPicksFilled}/5 Picks</span>
              </div>

              {/* Red Bans (up to 4) */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Bans:</span>
                {[0, 1, 2, 3].map((bIdx) => {
                  const bHero = formData.redBans[bIdx];
                  return (
                    <div
                      key={bIdx}
                      onClick={() => setPickerTarget({ side: 'red', phase: 'ban', index: bIdx })}
                      className="h-8 px-2 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 flex items-center gap-1 cursor-pointer"
                    >
                      {bHero ? (
                        <>
                          <img
                            src={getHeroImageUrl(bHero)}
                            alt={bHero}
                            className="w-5 h-5 rounded-md object-cover grayscale"
                          />
                          <span className="text-[10px] font-bold text-slate-700">{bHero}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClearSlot('red', 'ban', bIdx);
                            }}
                            className="text-[10px] text-slate-400 hover:text-rose-600"
                          >
                            ×
                          </button>
                        </>
                      ) : (
                        <span className="text-[9.5px] text-rose-400">+ Ban {bIdx + 1}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Red 5 Picks */}
              <div className="flex flex-col gap-1.5 mt-1">
                {formData.redPicks.map((pick, pIdx) => (
                  <div
                    key={pIdx}
                    className="p-2 rounded-xl bg-rose-50/40 border border-rose-100 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-8 text-center text-[10px] font-black text-rose-700 py-0.5 rounded bg-rose-100">
                        {pick.position}
                      </span>
                      {pick.heroName ? (
                        <div
                          onClick={() => setPickerTarget({ side: 'red', phase: 'pick', index: pIdx })}
                          className="flex items-center gap-1.5 cursor-pointer hover:opacity-80"
                        >
                          <img
                            src={getHeroImageUrl(pick.heroName)}
                            alt={pick.heroName}
                            className="w-7 h-7 rounded-lg object-cover border border-rose-300"
                          />
                          <span className="text-xs font-bold text-slate-900">{pick.heroName}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPickerTarget({ side: 'red', phase: 'pick', index: pIdx })}
                          className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
                        >
                          + เลือกฮีโร่
                        </button>
                      )}
                    </div>

                    {/* Player selector for our team */}
                    {formData.ourSide === 'red' && (
                      <div className="flex items-center gap-1">
                        <User size={11} className="text-slate-400" />
                        <select
                          value={pick.playerId || ''}
                          onChange={(e) => {
                            const p = players.find((item) => item.id === e.target.value);
                            setFormData((prev) => {
                              const copy = { ...prev };
                              copy.redPicks[pIdx] = {
                                ...copy.redPicks[pIdx],
                                playerId: p?.id,
                                playerName: p?.name,
                                playerNickname: p?.nickname,
                              };
                              return copy;
                            });
                          }}
                          className="text-[10px] font-semibold p-1 rounded border border-slate-200 bg-white outline-none max-w-[100px]"
                        >
                          <option value="">-- นักแข่ง --</option>
                          {players.map((pl) => (
                            <option key={pl.id} value={pl.id}>
                              {pl.nickname} ({pl.position})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Coach Debrief & Lessons Section (4 Core Fields) */}
          <div className="bg-[#FFF8FB] border border-[#F3D5E2] p-4 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between pb-1 border-b border-[#F3D5E2]">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>📝</span>
                <span>Coach Debrief & Strategic Reflection (บันทึกบทเรียนของโค้ช)</span>
              </span>

              {/* Coach Rating */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-500 font-semibold mr-1">คะแนนการเล่น:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({
                        ...p,
                        coachNotes: { ...p.coachNotes, coachRating: star },
                      }))
                    }
                    className="cursor-pointer"
                  >
                    <Star
                      size={14}
                      className={
                        star <= (formData.coachNotes.coachRating || 3)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Field 1: Draft Objective */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">1. เป้าหมายของแผนดราฟต์ (Draft Objective):</label>
                <textarea
                  value={formData.coachNotes.draftObjective}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      coachNotes: { ...p.coachNotes, draftObjective: e.target.value },
                    }))
                  }
                  rows={2}
                  placeholder="เช่น เน้นไฟต์ชิงมังกรต้นเกม, คอมพ์ 1-4 สปลิตพุช..."
                  className="p-2 rounded-xl border border-slate-200 bg-white outline-none focus:border-[#E91E63]"
                />
              </div>

              {/* Field 2: What Went Well */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-emerald-800">2. สิ่งที่ทำได้ดี (What Went Well):</label>
                <textarea
                  value={formData.coachNotes.whatWentWell}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      coachNotes: { ...p.coachNotes, whatWentWell: e.target.value },
                    }))
                  }
                  rows={2}
                  placeholder="เช่น การเข้าไฟต์ 5v5 เป็นระเบียบ, เมจยืนตำแหน่งเซฟ..."
                  className="p-2 rounded-xl border border-emerald-100 bg-white outline-none focus:border-emerald-500"
                />
              </div>

              {/* Field 3: Issues Faced */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-rose-800">3. ปัญหาที่พบ (Issues & Mistakes):</label>
                <textarea
                  value={formData.coachNotes.issuesFaced}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      coachNotes: { ...p.coachNotes, issuesFaced: e.target.value },
                    }))
                  }
                  rows={2}
                  placeholder="เช่น เสีย First Blood จากการโดนอินเวด, สื่อสารไม่ทัน..."
                  className="p-2 rounded-xl border border-rose-100 bg-white outline-none focus:border-rose-500"
                />
              </div>

              {/* Field 4: Lessons Learned */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-purple-800">4. บทเรียนหลังเกม (Key Takeaways):</label>
                <textarea
                  value={formData.coachNotes.lessonsLearned}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      coachNotes: { ...p.coachNotes, lessonsLearned: e.target.value },
                    }))
                  }
                  rows={2}
                  placeholder="เช่น ครั้งหน้าต้องปัก Ward เช็คพุ่มล่วงหน้า 30 วินาทีก่อนมังกรเกิด..."
                  className="p-2 rounded-xl border border-purple-100 bg-white outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* VOD Link */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
              <Video size={13} className="text-slate-400" />
              <span className="text-[11px] font-semibold text-slate-600">ลิงก์ VOD / Replay:</span>
              <input
                type="text"
                value={formData.vodUrl || ''}
                onChange={(e) => setFormData((p) => ({ ...p, vodUrl: e.target.value }))}
                placeholder="https://youtube.com/watch?v=... หรือลิงก์ Replay"
                className="flex-1 p-1 text-xs rounded-lg border border-slate-200 bg-white outline-none"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-white border-t border-[#F3D5E2] flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-[#E91E63] text-white hover:bg-[#D81B60] shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Save size={13} />
            <span>บันทึกข้อมูลผลการซ้อม</span>
          </button>
        </div>
      </div>

      {/* Hero Picker Modal */}
      {pickerTarget && (
        <HeroPickerModal
          isOpen={true}
          title={`เลือกฮีโร่สำหรับ ${pickerTarget.side.toUpperCase()} (${pickerTarget.phase.toUpperCase()})`}
          onSelect={handleHeroSelect}
          onClose={() => setPickerTarget(null)}
        />
      )}
    </div>
  );
};
