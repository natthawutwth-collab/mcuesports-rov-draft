import React, { useState, useMemo, useEffect } from 'react';
import {
  Trophy,
  Settings,
  Plus,
  Trash2,
  Save,
  Download,
  Upload,
  Layers,
  ShieldAlert,
  Sparkles,
  Lock,
  Unlock,
  CheckCircle,
  Play,
  RotateCcw,
  Swords,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  SeriesPlan,
  SeriesFormat,
  GamePlan,
  PlannedRoleKey,
  TournamentRuleConfig,
} from '../types/seriesPrep';
import {
  seriesPrepService,
  createDefaultSeriesPlan,
  createBlankGamePlan,
} from '../services/seriesPrepService';
import { HEROES, getHeroImageUrl } from '../data/heroes';
import { HeroPickerModal } from './HeroPickerModal';
import { Hero } from '../types/draft';

interface SeriesPrepViewProps {
  onLoadIntoLiveDraft?: (game: GamePlan) => void;
  onLoadIntoSimulator?: (game: GamePlan, seriesName: string) => void;
}

const ROLES: PlannedRoleKey[] = ['DSL', 'JG', 'MID', 'ADL', 'SUP'];

export const SeriesPrepView: React.FC<SeriesPrepViewProps> = ({
  onLoadIntoLiveDraft,
  onLoadIntoSimulator,
}) => {
  const [plans, setPlans] = useState<SeriesPlan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string>('');
  const [selectedGameNum, setSelectedGameNum] = useState<number>(1);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);

  // Hero Picker Modal state
  const [pickerTarget, setPickerTarget] = useState<{
    type: 'ban' | 'preferred' | 'alt';
    role?: PlannedRoleKey;
    altIndex?: number;
    banIndex?: number;
  } | null>(null);

  // Load plans from service
  useEffect(() => {
    const loaded = seriesPrepService.getAllPlans();
    setPlans(loaded);
    if (loaded.length > 0 && !activePlanId) {
      setActivePlanId(loaded[0].id);
    }
  }, []);

  const activePlan = useMemo(() => {
    return plans.find((p) => p.id === activePlanId) || plans[0] || null;
  }, [plans, activePlanId]);

  const activeGame = useMemo(() => {
    if (!activePlan) return null;
    return activePlan.games.find((g) => g.gameNumber === selectedGameNum) || activePlan.games[0];
  }, [activePlan, selectedGameNum]);

  // Global Ban Consumption
  const { ourConsumed, isUltimateGame } = useMemo(() => {
    if (!activePlan) return { ourConsumed: new Set<string>(), isUltimateGame: false };
    return seriesPrepService.getGlobalConsumedHeroes(activePlan, selectedGameNum);
  }, [activePlan, selectedGameNum]);

  // Handle plan updates
  const handleUpdatePlan = (updated: SeriesPlan) => {
    seriesPrepService.savePlan(updated);
    setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  // Create new plan
  const handleCreateNewPlan = (format: SeriesFormat = 'BO5') => {
    const title = `Series Plan #${plans.length + 1} (${format})`;
    const created = createDefaultSeriesPlan(title, 'Opponent Team', 'MCU Esports', format);
    seriesPrepService.savePlan(created);
    setPlans((prev) => [created, ...prev]);
    setActivePlanId(created.id);
    setSelectedGameNum(1);
  };

  // Delete plan
  const handleDeletePlan = (id: string) => {
    if (plans.length <= 1) return;
    if (window.confirm('คุณต้องการลบแผนซีรีส์นี้ใช่หรือไม่?')) {
      seriesPrepService.deletePlan(id);
      const remaining = plans.filter((p) => p.id !== id);
      setPlans(remaining);
      setActivePlanId(remaining[0]?.id || '');
      setSelectedGameNum(1);
    }
  };

  // Update active game field
  const handleUpdateActiveGame = (updater: (draftGame: GamePlan) => void) => {
    if (!activePlan || !activeGame) return;
    const newGames = activePlan.games.map((g) => {
      if (g.gameNumber === selectedGameNum) {
        const copy: GamePlan = JSON.parse(JSON.stringify(g));
        updater(copy);
        return copy;
      }
      return g;
    });
    const updatedPlan: SeriesPlan = {
      ...activePlan,
      games: newGames,
    };
    handleUpdatePlan(updatedPlan);
  };

  // Hero Selection Callback
  const handleSelectHeroFromPicker = (hero: Hero) => {
    if (!pickerTarget || !activeGame) return;

    handleUpdateActiveGame((g) => {
      if (pickerTarget.type === 'ban') {
        if (pickerTarget.banIndex !== undefined && pickerTarget.banIndex >= 0) {
          g.targetBans[pickerTarget.banIndex] = hero.name;
        } else {
          if (!g.targetBans.includes(hero.name)) {
            g.targetBans.push(hero.name);
          }
        }
      } else if (pickerTarget.type === 'preferred' && pickerTarget.role) {
        const pObj = g.preferredPicks.find((p) => p.role === pickerTarget.role);
        if (pObj) {
          pObj.preferredHero = hero.name;
        }
      } else if (pickerTarget.type === 'alt' && pickerTarget.role) {
        const pObj = g.preferredPicks.find((p) => p.role === pickerTarget.role);
        if (pObj) {
          if (!pObj.alternativeHeroes) pObj.alternativeHeroes = [];
          if (!pObj.alternativeHeroes.includes(hero.name)) {
            pObj.alternativeHeroes.push(hero.name);
          }
        }
      }
    });

    setPickerTarget(null);
  };

  // Format Switch
  const handleChangeFormat = (newFormat: SeriesFormat) => {
    if (!activePlan) return;
    const targetCount = newFormat === 'BO3' ? 3 : newFormat === 'BO5' ? 5 : 7;
    let newGames = [...activePlan.games];
    if (newGames.length < targetCount) {
      for (let i = newGames.length + 1; i <= targetCount; i++) {
        newGames.push(createBlankGamePlan(i));
      }
    } else if (newGames.length > targetCount) {
      newGames = newGames.slice(0, targetCount);
    }

    const updated: SeriesPlan = {
      ...activePlan,
      format: newFormat,
      rules: {
        ...activePlan.rules,
        format: newFormat,
      },
      games: newGames,
    };
    handleUpdatePlan(updated);
    if (selectedGameNum > targetCount) {
      setSelectedGameNum(1);
    }
  };

  // Export JSON
  const handleExportPlanJson = () => {
    if (!activePlan) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activePlan, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `series_plan_${activePlan.title.replace(/\s+/g, '_')}.json`;
    a.click();
  };

  if (!activePlan || !activeGame) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-[#F3D5E2]">
        <button
          onClick={() => handleCreateNewPlan('BO5')}
          className="px-4 py-2 bg-[#E91E63] text-white rounded-xl font-bold cursor-pointer"
        >
          สร้างแผนซีรีส์ใหม่ (BO5)
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-3 font-['Prompt'] text-slate-800">
      {/* 1. Series Header Toolbar */}
      <div className="w-full bg-white border border-[#F3D5E2] rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0284C7] to-[#0369A1] text-white flex items-center justify-center shadow-md shadow-sky-500/20 flex-shrink-0">
            <Trophy size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={activePlan.title}
                onChange={(e) => handleUpdatePlan({ ...activePlan, title: e.target.value })}
                className="text-base sm:text-lg font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-[#E91E63] outline-none px-1 py-0.5 rounded transition-colors"
                placeholder="ชื่อซีรีส์..."
              />
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                {activePlan.format}
              </span>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span>vs</span>
              <input
                type="text"
                value={activePlan.opponentTeam}
                onChange={(e) => handleUpdatePlan({ ...activePlan, opponentTeam: e.target.value })}
                className="font-bold text-slate-700 border-b border-dashed border-slate-300 outline-none px-1 hover:border-slate-500"
                placeholder="ชื่อทีมคู่แข่ง"
              />
              <span>•</span>
              <span>
                กฎ: {activePlan.rules.globalBanRule === 'rpl_global' ? 'Pro League Global Ban/Pick' : 'Standard'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Format Selector Pills */}
          <div className="flex items-center bg-[#FFF0F5] border border-[#F3D5E2] rounded-xl p-1 gap-1">
            {(['BO3', 'BO5', 'BO7'] as SeriesFormat[]).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => handleChangeFormat(fmt)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                  activePlan.format === fmt
                    ? 'bg-[#E91E63] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsRulesModalOpen(true)}
            title="ตั้งค่ากติกาทัวร์นาเมนต์ (Tournament Rules)"
            className="p-2 rounded-xl bg-white border border-[#CBD5E1] text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Settings size={15} />
          </button>

          <button
            type="button"
            onClick={handleExportPlanJson}
            title="ส่งออกแผนซีรีส์เป็น JSON"
            className="p-2 rounded-xl bg-white border border-[#CBD5E1] text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Download size={15} />
          </button>

          <button
            type="button"
            onClick={() => handleCreateNewPlan('BO5')}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-[#E91E63] text-white hover:bg-[#D81B60] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus size={13} />
            <span>สร้างซีรีส์</span>
          </button>
        </div>
      </div>

      {/* 2. Game Tabs (Game 1, Game 2, Game 3 ... G7) */}
      <div className="w-full flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {activePlan.games.map((g) => {
          const isSelected = g.gameNumber === selectedGameNum;
          return (
            <button
              key={g.gameNumber}
              type="button"
              onClick={() => setSelectedGameNum(g.gameNumber)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all shadow-2xs ${
                isSelected
                  ? 'bg-white border-[#E91E63] text-[#E91E63] shadow-xs ring-2 ring-[#FCE4EC]'
                  : 'bg-white/80 border-[#F3D5E2] text-slate-600 hover:bg-white hover:text-slate-900'
              }`}
            >
              <span>🎮 GAME {g.gameNumber}</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-black ${
                  g.side === 'blue'
                    ? 'bg-sky-100 text-[#0284C7]'
                    : 'bg-rose-100 text-[#E11D48]'
                }`}
              >
                {g.side.toUpperCase()}
              </span>
              {g.result !== 'pending' && (
                <span
                  className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                    g.result === 'won' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {g.result.toUpperCase()}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Global Ban/Pick Alert Banner (Rule: Heroes picked previously are locked!) */}
      {activePlan.rules.globalBanRule === 'rpl_global' && (
        <div className="w-full bg-[#FFF8FB] border border-[#F3D5E2] rounded-2xl p-3 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
              <Lock size={14} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>RoV Pro League Global Ban/Pick Status</span>
                {isUltimateGame && (
                  <span className="text-[10px] px-2 py-0.2 bg-amber-100 text-amber-800 font-black rounded-md">
                    👑 Game 7 Ultimate Game: พูลรีเซ็ตปลดล็อคทุกตัว!
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500">
                {isUltimateGame
                  ? 'ในเกมที่ 7 ตัวฮีโร่ทั้งหมดจะถูกปลดล็อค สามารถเลือกตัวซ้ำจากเกม 1-6 ได้ตามกติกาทางการ'
                  : `ฮีโร่ที่เลือกไปแล้วใน Game 1-${selectedGameNum - 1} จะถูกล็อคห้ามเลือกซ้ำในเกมนี้ (${ourConsumed.size} ตัวที่ใช้ไปแล้ว)`}
              </div>
            </div>
          </div>

          {/* Consumed Badges */}
          {ourConsumed.size > 0 && !isUltimateGame && (
            <div className="flex items-center gap-1 overflow-x-auto max-w-[40%] no-scrollbar">
              {Array.from(ourConsumed).map((name) => (
                <div
                  key={name}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-[10px] font-bold text-purple-800 flex-shrink-0"
                  title="ถูกล็อคตามกติกา Global Ban/Pick"
                >
                  <img
                    src={getHeroImageUrl(name)}
                    alt={name}
                    className="w-4 h-4 rounded-full object-cover grayscale"
                  />
                  <span>{name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. Active Game Plan Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left Column: Side Selection & Target Bans */}
        <div className="flex flex-col gap-3">
          {/* Side & Result Card */}
          <div className="bg-white border border-[#F3D5E2] rounded-2xl p-3.5 shadow-xs flex flex-col gap-2.5">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 pb-1.5 border-b border-[#F3D5E2] flex items-center justify-between">
              <span>การเลือกฝั่งและสถานะเกม</span>
              <span className="text-[10px] text-slate-400 font-semibold">Game {selectedGameNum}</span>
            </h3>

            {/* Side Picker */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">ฝั่งที่เล่น:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleUpdateActiveGame((g) => { g.side = 'blue'; })}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    activeGame.side === 'blue'
                      ? 'bg-sky-500 border-sky-600 text-white shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  🔵 BLUE SIDE
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateActiveGame((g) => { g.side = 'red'; })}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    activeGame.side === 'red'
                      ? 'bg-rose-500 border-rose-600 text-white shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  🔴 RED SIDE
                </button>
              </div>
            </div>

            {/* Result Selector */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs font-semibold text-slate-600">ผลการแข่ง:</span>
              <select
                value={activeGame.result}
                onChange={(e) => handleUpdateActiveGame((g) => { g.result = e.target.value as any; })}
                className="text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 outline-none cursor-pointer"
              >
                <option value="pending">⏳ รอดราฟต์ (Pending)</option>
                <option value="won">🏆 ชนะ (Won)</option>
                <option value="lost">❌ แพ้ (Lost)</option>
                <option value="draw">🤝 เสมอ (Draw)</option>
              </select>
            </div>
          </div>

          {/* Target Ban List */}
          <div className="bg-white border border-[#F3D5E2] rounded-2xl p-3.5 shadow-xs flex flex-col gap-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#F3D5E2]">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldAlert size={15} className="text-[#E11D48]" />
                <span>Target Ban List (แบนเป้าหมายเจาะจง)</span>
              </h3>
              <button
                type="button"
                onClick={() => setPickerTarget({ type: 'ban' })}
                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 flex items-center gap-1 cursor-pointer"
              >
                <Plus size={11} />
                <span>เพิ่มตัวแบน</span>
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              {activeGame.targetBans.length === 0 ? (
                <div className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  ยังไม่ได้กำหนดตัวแบนเป้าหมายสำหรับ Game {selectedGameNum}
                </div>
              ) : (
                activeGame.targetBans.map((banHero, bIdx) => (
                  <div
                    key={bIdx}
                    className="flex items-center justify-between p-2 rounded-xl bg-rose-50/50 border border-rose-100"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-rose-400 font-['Orbitron']">
                        BAN #{bIdx + 1}
                      </span>
                      <img
                        src={getHeroImageUrl(banHero)}
                        alt={banHero}
                        className="w-7 h-7 rounded-lg object-cover border border-rose-200 grayscale"
                      />
                      <span className="text-xs font-bold text-slate-800">{banHero}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateActiveGame((g) => {
                          g.targetBans.splice(bIdx, 1);
                        })
                      }
                      className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Center Column: Preferred Picks (Plan A) & Alternative Picks (Plan B) */}
        <div className="flex flex-col gap-3 lg:col-span-2">
          <div className="bg-white border border-[#F3D5E2] rounded-2xl p-3.5 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#F3D5E2]">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles size={15} className="text-[#E91E63]" />
                  <span>Lineup Plan: Preferred Picks & Alternative Options</span>
                </h3>
                <span className="text-[11px] text-slate-500">
                  กำหนดฮีโร่แผนหลัก (Plan A) และตัวเลือกสำรองแก้ทาง (Plan B) แยกตาม 5 เลน
                </span>
              </div>

              {/* Push to Draft / Simulator Buttons */}
              <div className="flex items-center gap-1.5">
                {onLoadIntoSimulator && (
                  <button
                    type="button"
                    onClick={() => onLoadIntoSimulator(activeGame, activePlan.title)}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Play size={11} />
                    <span>จำลองใน Simulator</span>
                  </button>
                )}
                {onLoadIntoLiveDraft && (
                  <button
                    type="button"
                    onClick={() => onLoadIntoLiveDraft(activeGame)}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#E91E63] text-white hover:bg-[#D81B60] flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Swords size={11} />
                    <span>ใช้ใน Live Draft</span>
                  </button>
                )}
              </div>
            </div>

            {/* 5 Lanes List */}
            <div className="flex flex-col gap-2">
              {ROLES.map((role) => {
                const planObj = activeGame.preferredPicks.find((p) => p.role === role) || {
                  role,
                  preferredHero: '',
                  alternativeHeroes: [],
                  reason: '',
                };
                const isConsumed = ourConsumed.has(planObj.preferredHero);

                return (
                  <div
                    key={role}
                    className="p-2.5 rounded-xl bg-[#FFF8FB] border border-[#F3D5E2] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
                  >
                    {/* Role Badge & Plan A */}
                    <div className="flex items-center gap-3">
                      <span className="w-11 text-center py-1 rounded-lg text-xs font-black bg-slate-800 text-white font-['Barlow_Condensed'] tracking-wider">
                        {role}
                      </span>

                      {/* Preferred Hero (Plan A) */}
                      <div className="flex items-center gap-2">
                        {planObj.preferredHero ? (
                          <div className="flex items-center gap-1.5 bg-white border border-[#F3D5E2] rounded-xl p-1 pr-2 shadow-2xs">
                            <img
                              src={getHeroImageUrl(planObj.preferredHero)}
                              alt={planObj.preferredHero}
                              className="w-8 h-8 rounded-lg object-cover border border-[#F3D5E2]"
                            />
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-900 leading-tight">
                                {planObj.preferredHero}
                              </span>
                              <span className="text-[9px] font-semibold text-emerald-600">
                                ⭐ Plan A
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setPickerTarget({ type: 'preferred', role })}
                              className="text-[10px] text-slate-400 hover:text-slate-700 ml-1 cursor-pointer"
                            >
                              เปลี่ยน
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPickerTarget({ type: 'preferred', role })}
                            className="px-3 py-1.5 rounded-xl border border-dashed border-[#F3D5E2] hover:border-[#E91E63] text-xs font-semibold text-slate-500 hover:text-[#E91E63] bg-white transition-colors cursor-pointer"
                          >
                            + เลือก Plan A
                          </button>
                        )}

                        {isConsumed && (
                          <span
                            className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-0.5"
                            title="ฮีโร่ตัวนี้ถูกเลือกไปแล้วในเกมก่อนหน้าตามกติกา Global Ban/Pick"
                          >
                            <Lock size={9} />
                            <span>ติด Global Lock</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Alternatives (Plan B) */}
                    <div className="flex items-center gap-1.5 flex-wrap sm:ml-auto">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">
                        Plan B:
                      </span>
                      {planObj.alternativeHeroes?.map((altHero, aIdx) => (
                        <div
                          key={aIdx}
                          className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-xs font-semibold text-slate-700 shadow-2xs"
                        >
                          <img
                            src={getHeroImageUrl(altHero)}
                            alt={altHero}
                            className="w-5 h-5 rounded-md object-cover"
                          />
                          <span>{altHero}</span>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateActiveGame((g) => {
                                const p = g.preferredPicks.find((item) => item.role === role);
                                if (p) p.alternativeHeroes.splice(aIdx, 1);
                              })
                            }
                            className="text-slate-400 hover:text-rose-500 ml-0.5 cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => setPickerTarget({ type: 'alt', role })}
                        className="px-2 py-0.5 text-[10.5px] rounded-lg border border-dashed border-slate-300 hover:border-slate-500 text-slate-500 hover:text-slate-800 bg-white cursor-pointer"
                      >
                        + เพิ่มตัวสำรอง
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Coach Notes for this Game */}
            <div className="mt-2 pt-2 border-t border-[#F3D5E2] flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <span>📝</span>
                <span>Coach Strategic Notes & Win Conditions (Game {selectedGameNum})</span>
              </label>
              <textarea
                value={activeGame.coachNotes || ''}
                onChange={(e) =>
                  handleUpdateActiveGame((g) => {
                    g.coachNotes = e.target.value;
                  })
                }
                placeholder="ระบุแผนการเดินเกม จังหวะอินเวด เงื่อนไขการชนะไฟต์ และตำแหน่งเลนที่ต้องโฟกัส..."
                rows={2}
                className="w-full text-xs p-2.5 rounded-xl border border-[#F3D5E2] focus:border-[#E91E63] outline-none bg-[#FFF8FB] text-slate-800 leading-relaxed font-['Prompt']"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Rules Config Modal */}
      {isRulesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border-2 border-[#F3D5E2] rounded-2xl max-w-md w-full p-4 shadow-2xl font-['Prompt']">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#F3D5E2]">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Settings size={16} className="text-[#E91E63]" />
                <span>Tournament Rules Configuration</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsRulesModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">กติกา Global Ban/Pick:</label>
                <select
                  value={activePlan.rules.globalBanRule}
                  onChange={(e) =>
                    handleUpdatePlan({
                      ...activePlan,
                      rules: {
                        ...activePlan.rules,
                        globalBanRule: e.target.value as any,
                      },
                    })
                  }
                  className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold"
                >
                  <option value="rpl_global">RoV Pro League Official (ฮีโร่ที่ทีมเราเลือกห้ามซ้ำ)</option>
                  <option value="strict_global">Strict Global (ฮีโร่ที่ถูกเลือกถูกล็อคทั้งสองทีม)</option>
                  <option value="none">Standard Tournament (ไม่มี Global Ban/Pick)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="resetG7"
                  checked={activePlan.rules.resetOnGame7}
                  onChange={(e) =>
                    handleUpdatePlan({
                      ...activePlan,
                      rules: {
                        ...activePlan.rules,
                        resetOnGame7: e.target.checked,
                      },
                    })
                  }
                  className="rounded text-[#E91E63]"
                />
                <label htmlFor="resetG7" className="font-semibold text-slate-700 cursor-pointer">
                  Ultimate Game: รีเซ็ตพูลฮีโร่ทั้งหมดใน Game 7 (กติกา RPL)
                </label>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ชื่อทัวร์นาเมนต์:</label>
                <input
                  type="text"
                  value={activePlan.rules.tournamentName}
                  onChange={(e) =>
                    handleUpdatePlan({
                      ...activePlan,
                      rules: {
                        ...activePlan.rules,
                        tournamentName: e.target.value,
                      },
                    })
                  }
                  className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsRulesModalOpen(false)}
                className="w-full py-2 bg-[#E91E63] text-white rounded-xl font-bold mt-2 cursor-pointer shadow-xs"
              >
                บันทึกการตั้งค่า
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Picker Modal */}
      {pickerTarget && (
        <HeroPickerModal
          isOpen={true}
          title={
            pickerTarget.type === 'ban'
              ? 'เลือกฮีโร่ Target Ban'
              : `เลือกฮีโร่สำหรับเลน ${pickerTarget.role} (${pickerTarget.type === 'preferred' ? 'Plan A' : 'Plan B'})`
          }
          onSelect={handleSelectHeroFromPicker}
          onClose={() => setPickerTarget(null)}
        />
      )}
    </div>
  );
};
