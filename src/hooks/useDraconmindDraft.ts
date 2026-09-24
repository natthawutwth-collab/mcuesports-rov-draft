import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Hero, PositionKey, LaneSelectKey, DraftAction, MatchNoteGame } from '../types/draft';
import { DRAFT_TURNS, BLUE_PICK_ORDER, RED_PICK_ORDER } from '../data/draftSteps';
import { HEROES } from '../data/heroes';
import { calcTeamScore, DraftScoreResult } from '../data/metaData';
import { draftAudio } from '../utils/soundEffects';

export interface PickSlotState {
  hero: Hero | null;
  pos: LaneSelectKey;
  order: number;
}

const DEFAULT_BLUE_POS: LaneSelectKey[] = ['DSL', 'JG', 'MID', 'ROAM', 'ADL'];
const DEFAULT_RED_POS: LaneSelectKey[] = ['DSL', 'JG', 'MID', 'ROAM', 'ADL'];

export function useDraconmindDraft() {
  // Team names & identity
  const [blueTeamName, setBlueTeamName] = useState('BLUE SIDE');
  const [redTeamName, setRedTeamName] = useState('RED SIDE');
  const [blueIsUs, setBlueIsUs] = useState(true); // true = US is Blue, false = US is Red

  // Draft sequence state
  const [draftActive, setDraftActive] = useState(false);
  const [draftTurnIdx, setDraftTurnIdx] = useState(0);
  const [draftTurnSel, setDraftTurnSel] = useState(0); // 0 or 1 for double picks
  const [draftActions, setDraftActions] = useState<DraftAction[]>([]);
  const [isDraftComplete, setIsDraftComplete] = useState(false);

  // Manual targeted slot (coaches can click any slot to directly fill/override)
  const [manualTarget, setManualTarget] = useState<{
    team: 'blue' | 'red';
    phase: 'ban' | 'pick';
    index: number;
  } | null>(null);

  // Bans (4 per team)
  const [blueBans, setBlueBans] = useState<(Hero | null)[]>([null, null, null, null]);
  const [redBans, setRedBans] = useState<(Hero | null)[]>([null, null, null, null]);

  // Picks (5 per team)
  const [bluePicks, setBluePicks] = useState<PickSlotState[]>([
    { hero: null, pos: 'DSL', order: BLUE_PICK_ORDER[0] },
    { hero: null, pos: 'JG', order: BLUE_PICK_ORDER[1] },
    { hero: null, pos: 'MID', order: BLUE_PICK_ORDER[2] },
    { hero: null, pos: 'ROAM', order: BLUE_PICK_ORDER[3] },
    { hero: null, pos: 'ADL', order: BLUE_PICK_ORDER[4] },
  ]);

  const [redPicks, setRedPicks] = useState<PickSlotState[]>([
    { hero: null, pos: 'DSL', order: RED_PICK_ORDER[0] },
    { hero: null, pos: 'JG', order: RED_PICK_ORDER[1] },
    { hero: null, pos: 'MID', order: RED_PICK_ORDER[2] },
    { hero: null, pos: 'ROAM', order: RED_PICK_ORDER[3] },
    { hero: null, pos: 'ADL', order: RED_PICK_ORDER[4] },
  ]);

  // Filter & Search
  const [roleFilter, setRoleFilter] = useState<PositionKey>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Timer
  const currentTurn = DRAFT_TURNS[draftTurnIdx] || null;
  const initialTime = currentTurn ? currentTurn.time : 40;
  const [timerSec, setTimerSec] = useState<number>(initialTime);
  const [timerMax, setTimerMax] = useState<number>(initialTime);
  const [isTimerPaused, setIsTimerPaused] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  }, []);

  // Match Notes (saved competitive series BO1..BO7)
  const [matchGames, setMatchGames] = useState<MatchNoteGame[]>(() => {
    try {
      const saved = localStorage.getItem('draconmind_gnote_games');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [blueSeriesNote, setBlueSeriesNote] = useState<string>(() => {
    return localStorage.getItem('draconmind_gnote_blue_note') || '';
  });

  const [redSeriesNote, setRedSeriesNote] = useState<string>(() => {
    return localStorage.getItem('draconmind_gnote_red_note') || '';
  });

  // Save series notes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('draconmind_gnote_games', JSON.stringify(matchGames));
    } catch {}
  }, [matchGames]);

  useEffect(() => {
    try {
      localStorage.setItem('draconmind_gnote_blue_note', blueSeriesNote);
    } catch {}
  }, [blueSeriesNote]);

  useEffect(() => {
    try {
      localStorage.setItem('draconmind_gnote_red_note', redSeriesNote);
    } catch {}
  }, [redSeriesNote]);

  // Sets of currently banned/picked heroes
  const bannedHeroNames = useMemo(() => {
    const s = new Set<string>();
    blueBans.forEach((h) => h && s.add(h.name));
    redBans.forEach((h) => h && s.add(h.name));
    return s;
  }, [blueBans, redBans]);

  const pickedHeroNames = useMemo(() => {
    const s = new Set<string>();
    bluePicks.forEach((p) => p.hero && s.add(p.hero.name));
    redPicks.forEach((p) => p.hero && s.add(p.hero.name));
    return s;
  }, [bluePicks, redPicks]);

  // Live Draft Score
  const draftScore: DraftScoreResult = useMemo(() => {
    const bluePickNames = bluePicks.map((p) => p.hero?.name || '');
    const redPickNames = redPicks.map((p) => p.hero?.name || '');
    return calcTeamScore(bluePickNames, redPickNames, true);
  }, [bluePicks, redPicks]);

  const redDraftScore: DraftScoreResult = useMemo(() => {
    const bluePickNames = bluePicks.map((p) => p.hero?.name || '');
    const redPickNames = redPicks.map((p) => p.hero?.name || '');
    return calcTeamScore(redPickNames, bluePickNames, false);
  }, [bluePicks, redPicks]);

  // Timer Tick
  useEffect(() => {
    if (!draftActive || isDraftComplete || isTimerPaused) return;

    const interval = setInterval(() => {
      setTimerSec((prev) => {
        if (prev <= 1) {
          draftAudio.playWarning();
          return 0;
        }
        if (prev <= 6 && prev > 1) {
          draftAudio.playCountdownTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [draftActive, isDraftComplete, isTimerPaused]);

  // Helper: Find current active slot in turn sequence
  const currentTurnSlot = useMemo(() => {
    if (manualTarget) return manualTarget;
    if (!draftActive || isDraftComplete) return null;

    const turn = DRAFT_TURNS[draftTurnIdx];
    if (!turn) return null;

    if (turn.phase === 'ban') {
      // Find first empty ban slot for this team
      const bans = turn.team === 'blue' ? blueBans : redBans;
      const emptyIdx = bans.findIndex((b) => b === null);
      return { team: turn.team, phase: 'ban' as const, index: emptyIdx !== -1 ? emptyIdx : 0 };
    } else {
      // Pick phase
      const picks = turn.team === 'blue' ? bluePicks : redPicks;
      // Depending on draftTurnSel (0 or 1), find empty slots
      const emptyIndices: number[] = [];
      picks.forEach((p, idx) => {
        if (!p.hero) emptyIndices.push(idx);
      });
      const targetIdx = emptyIndices[draftTurnSel] ?? emptyIndices[0] ?? 0;
      return { team: turn.team, phase: 'pick' as const, index: targetIdx };
    }
  }, [manualTarget, draftActive, isDraftComplete, draftTurnIdx, draftTurnSel, blueBans, redBans, bluePicks, redPicks]);

  // Start New Draft
  const startNewDraft = useCallback(() => {
    setDraftActive(true);
    setDraftTurnIdx(0);
    setDraftTurnSel(0);
    setDraftActions([]);
    setIsDraftComplete(false);
    setManualTarget(null);

    setBlueBans([null, null, null, null]);
    setRedBans([null, null, null, null]);
    setBluePicks([
      { hero: null, pos: 'DSL', order: BLUE_PICK_ORDER[0] },
      { hero: null, pos: 'JG', order: BLUE_PICK_ORDER[1] },
      { hero: null, pos: 'MID', order: BLUE_PICK_ORDER[2] },
      { hero: null, pos: 'ROAM', order: BLUE_PICK_ORDER[3] },
      { hero: null, pos: 'ADL', order: BLUE_PICK_ORDER[4] },
    ]);
    setRedPicks([
      { hero: null, pos: 'DSL', order: RED_PICK_ORDER[0] },
      { hero: null, pos: 'JG', order: RED_PICK_ORDER[1] },
      { hero: null, pos: 'MID', order: RED_PICK_ORDER[2] },
      { hero: null, pos: 'ROAM', order: RED_PICK_ORDER[3] },
      { hero: null, pos: 'ADL', order: RED_PICK_ORDER[4] },
    ]);

    const firstTime = DRAFT_TURNS[0].time;
    setTimerSec(firstTime);
    setTimerMax(firstTime);
    setIsTimerPaused(false);

    draftAudio.playPhaseStart();
    showToast('▶ เริ่มการดราฟใหม่ (Draft Active)');
  }, [showToast]);

  // Reset Draft
  const resetDraft = useCallback(() => {
    setDraftActive(false);
    setDraftTurnIdx(0);
    setDraftTurnSel(0);
    setDraftActions([]);
    setIsDraftComplete(false);
    setManualTarget(null);

    setBlueBans([null, null, null, null]);
    setRedBans([null, null, null, null]);
    setBluePicks([
      { hero: null, pos: 'DSL', order: BLUE_PICK_ORDER[0] },
      { hero: null, pos: 'JG', order: BLUE_PICK_ORDER[1] },
      { hero: null, pos: 'MID', order: BLUE_PICK_ORDER[2] },
      { hero: null, pos: 'ROAM', order: BLUE_PICK_ORDER[3] },
      { hero: null, pos: 'ADL', order: BLUE_PICK_ORDER[4] },
    ]);
    setRedPicks([
      { hero: null, pos: 'DSL', order: RED_PICK_ORDER[0] },
      { hero: null, pos: 'JG', order: RED_PICK_ORDER[1] },
      { hero: null, pos: 'MID', order: RED_PICK_ORDER[2] },
      { hero: null, pos: 'ROAM', order: RED_PICK_ORDER[3] },
      { hero: null, pos: 'ADL', order: RED_PICK_ORDER[4] },
    ]);

    setTimerSec(40);
    setTimerMax(40);
    setIsTimerPaused(false);
    showToast('🔄 รีเซ็ตการดราฟเรียบร้อย');
  }, [showToast]);

  // Swap Sides
  const swapSides = useCallback(() => {
    setBlueTeamName((b) => {
      const currentBlue = b;
      setRedTeamName(currentBlue);
      return redTeamName;
    });
    setBlueIsUs((prev) => !prev);
    showToast('⇄ สลับฝั่ง Blue ↔ Red');
  }, [redTeamName, showToast]);

  // Select Hero
  const selectHero = useCallback((hero: Hero): boolean => {
    // Check if hero already selected or banned
    if (bannedHeroNames.has(hero.name) || pickedHeroNames.has(hero.name)) {
      showToast(`ฮีโร่ "${hero.name}" ถูกเลือก/แบนไปแล้ว!`);
      return false;
    }

    // Determine target slot
    let target = manualTarget;
    if (!target) {
      if (!draftActive) {
        // Automatically start or fill next empty
        target = currentTurnSlot;
      } else {
        target = currentTurnSlot;
      }
    }

    if (!target) {
      showToast('กรุณากด ▶ New Draft หรือคลิกเลือกช่องที่ต้องการ');
      return false;
    }

    const { team, phase, index } = target;

    // Record action for undo
    setDraftActions((prev) => [
      ...prev,
      {
        turnIdx: draftTurnIdx,
        turnSel: draftTurnSel,
        hero,
        team,
        phase,
        slotIndex: index,
      },
    ]);

    // Apply hero to slot
    if (phase === 'ban') {
      draftAudio.playBan();
      if (team === 'blue') {
        setBlueBans((prev) => {
          const next = [...prev];
          next[index] = hero;
          return next;
        });
      } else {
        setRedBans((prev) => {
          const next = [...prev];
          next[index] = hero;
          return next;
        });
      }
    } else {
      draftAudio.playPick();
      if (team === 'blue') {
        setBluePicks((prev) => {
          const next = [...prev];
          next[index] = { ...next[index], hero };
          return next;
        });
      } else {
        setRedPicks((prev) => {
          const next = [...prev];
          next[index] = { ...next[index], hero };
          return next;
        });
      }
    }

    // If manual target, clear it
    if (manualTarget) {
      setManualTarget(null);
      return true;
    }

    // Otherwise advance in tournament turn sequence
    const turn = DRAFT_TURNS[draftTurnIdx];
    if (turn) {
      const nextTurnSel = draftTurnSel + 1;
      if (nextTurnSel >= turn.count) {
        // Move to next turn
        const nextTurnIdx = draftTurnIdx + 1;
        if (nextTurnIdx >= DRAFT_TURNS.length) {
          // Draft complete!
          setDraftActive(false);
          setIsDraftComplete(true);
          draftAudio.playVictorySound();
          showToast('✅ Draft เสร็จสิ้น (Complete)');
        } else {
          setDraftTurnIdx(nextTurnIdx);
          setDraftTurnSel(0);
          const nextTime = DRAFT_TURNS[nextTurnIdx].time;
          setTimerSec(nextTime);
          setTimerMax(nextTime);
        }
      } else {
        setDraftTurnSel(nextTurnSel);
      }
    }

    return true;
  }, [
    bannedHeroNames,
    pickedHeroNames,
    manualTarget,
    draftActive,
    currentTurnSlot,
    draftTurnIdx,
    draftTurnSel,
    showToast,
  ]);

  // Undo Last Action
  const undo = useCallback(() => {
    if (draftActions.length === 0) return;

    const lastAction = draftActions[draftActions.length - 1];
    setDraftActions((prev) => prev.slice(0, -1));

    const { team, phase, slotIndex, turnIdx, turnSel } = lastAction;

    if (phase === 'ban') {
      if (team === 'blue') {
        setBlueBans((prev) => {
          const next = [...prev];
          next[slotIndex] = null;
          return next;
        });
      } else {
        setRedBans((prev) => {
          const next = [...prev];
          next[slotIndex] = null;
          return next;
        });
      }
    } else {
      if (team === 'blue') {
        setBluePicks((prev) => {
          const next = [...prev];
          next[slotIndex] = { ...next[slotIndex], hero: null };
          return next;
        });
      } else {
        setRedPicks((prev) => {
          const next = [...prev];
          next[slotIndex] = { ...next[slotIndex], hero: null };
          return next;
        });
      }
    }

    setDraftTurnIdx(turnIdx);
    setDraftTurnSel(turnSel);
    if (isDraftComplete) {
      setIsDraftComplete(false);
      setDraftActive(true);
    }
    const turn = DRAFT_TURNS[turnIdx];
    if (turn) {
      setTimerSec(turn.time);
      setTimerMax(turn.time);
    }

    draftAudio.playButtonTap();
    showToast('↶ ย้อนกลับ 1 ขั้นตอน (Undo)');
  }, [draftActions, isDraftComplete, showToast]);

  // Clear specific slot
  const clearSlot = useCallback((team: 'blue' | 'red', phase: 'ban' | 'pick', index: number) => {
    if (phase === 'ban') {
      if (team === 'blue') {
        setBlueBans((prev) => {
          const next = [...prev];
          next[index] = null;
          return next;
        });
      } else {
        setRedBans((prev) => {
          const next = [...prev];
          next[index] = null;
          return next;
        });
      }
    } else {
      if (team === 'blue') {
        setBluePicks((prev) => {
          const next = [...prev];
          next[index] = { ...next[index], hero: null };
          return next;
        });
      } else {
        setRedPicks((prev) => {
          const next = [...prev];
          next[index] = { ...next[index], hero: null };
          return next;
        });
      }
    }
    showToast('ลบฮีโร่ออกจากช่องแล้ว');
  }, [showToast]);

  // Change lane position of a pick slot
  const changePickPos = useCallback((team: 'blue' | 'red', index: number, pos: LaneSelectKey) => {
    if (team === 'blue') {
      setBluePicks((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], pos };
        return next;
      });
    } else {
      setRedPicks((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], pos };
        return next;
      });
    }
  }, []);

  // Save current draft to Match Notes (up to 7 games)
  const saveToMatchNotes = useCallback(() => {
    if (matchGames.length >= 7) {
      showToast('Match Notes เต็มแล้ว (สูงสุด G7) — โปรดล้างก่อน');
      return;
    }

    const usSide = blueIsUs ? 'blue' : 'red';
    const oppSide = blueIsUs ? 'red' : 'blue';

    const usBansList = (blueIsUs ? blueBans : redBans).map((h) => h?.name || '');
    const oppBansList = (blueIsUs ? redBans : blueBans).map((h) => h?.name || '');

    const usPicksRaw = blueIsUs ? bluePicks : redPicks;
    const oppPicksRaw = blueIsUs ? redPicks : bluePicks;

    const mapPicksByPos = (picks: PickSlotState[]) => {
      const res: Record<string, string> = {};
      picks.forEach((p) => {
        if (!p.hero) return;
        const key = p.pos.toLowerCase() || 'dsl';
        res[key] = p.hero.name;
      });
      return res;
    };

    const newGame: MatchNoteGame = {
      id: 'game_' + Date.now(),
      gameNum: matchGames.length + 1,
      winner: null,
      usSide,
      oppSide,
      usBans: usBansList,
      oppBans: oppBansList,
      usPicks: mapPicksByPos(usPicksRaw),
      oppPicks: mapPicksByPos(oppPicksRaw),
      note: '',
    };

    setMatchGames((prev) => [...prev, newGame]);
    showToast(`💾 บันทึก Game ${newGame.gameNum} ลงใน Match Notes แล้ว`);
  }, [matchGames.length, blueIsUs, blueBans, redBans, bluePicks, redPicks, showToast]);

  // Match Notes management
  const addEmptyGame = useCallback(() => {
    if (matchGames.length >= 7) {
      showToast('Match Notes เต็มแล้ว (สูงสุด G7)');
      return;
    }
    const newGame: MatchNoteGame = {
      id: 'game_' + Date.now(),
      gameNum: matchGames.length + 1,
      winner: null,
      usSide: 'blue',
      oppSide: 'red',
      usBans: ['', '', '', ''],
      oppBans: ['', '', '', ''],
      usPicks: {},
      oppPicks: {},
      note: '',
    };
    setMatchGames((prev) => [...prev, newGame]);
  }, [matchGames.length, showToast]);

  const clearAllGames = useCallback(() => {
    setMatchGames([]);
    showToast('🗑 ล้างข้อมูล Match Notes ทั้งหมดแล้ว');
  }, [showToast]);

  const updateGameWinner = useCallback((gameId: string, winner: 'us' | 'opp' | null) => {
    setMatchGames((prev) =>
      prev.map((g) => (g.id === gameId ? { ...g, winner: g.winner === winner ? null : winner } : g))
    );
  }, []);

  const updateGameNote = useCallback((gameId: string, note: string) => {
    setMatchGames((prev) =>
      prev.map((g) => (g.id === gameId ? { ...g, note } : g))
    );
  }, []);

  const updateGameSlot = useCallback((
    gameId: string,
    team: 'us' | 'opp',
    slotType: 'ban' | 'pick',
    slotKey: string,
    heroName: string
  ) => {
    setMatchGames((prev) =>
      prev.map((g) => {
        if (g.id !== gameId) return g;
        if (slotType === 'ban') {
          const idx = parseInt(slotKey, 10);
          if (team === 'us') {
            const nextBans = [...g.usBans];
            nextBans[idx] = heroName;
            return { ...g, usBans: nextBans };
          } else {
            const nextBans = [...g.oppBans];
            nextBans[idx] = heroName;
            return { ...g, oppBans: nextBans };
          }
        } else {
          // Pick position
          if (team === 'us') {
            return { ...g, usPicks: { ...g.usPicks, [slotKey]: heroName } };
          } else {
            return { ...g, oppPicks: { ...g.oppPicks, [slotKey]: heroName } };
          }
        }
      })
    );
  }, []);

  const deleteGame = useCallback((gameId: string) => {
    setMatchGames((prev) => {
      const filtered = prev.filter((g) => g.id !== gameId);
      return filtered.map((g, idx) => ({ ...g, gameNum: idx + 1 }));
    });
    showToast('ลบเกมเรียบร้อย');
  }, [showToast]);

  // Toggle Timer Pause
  const toggleTimerPause = useCallback(() => {
    setIsTimerPaused((prev) => !prev);
    draftAudio.playButtonTap();
  }, []);

  return {
    // Team Info
    blueTeamName,
    setBlueTeamName,
    redTeamName,
    setRedTeamName,
    blueIsUs,
    setBlueIsUs,
    swapSides,

    // Turn & Sequence
    draftActive,
    draftTurnIdx,
    draftTurnSel,
    currentTurn,
    currentTurnSlot,
    manualTarget,
    setManualTarget,
    isDraftComplete,
    startNewDraft,
    resetDraft,
    selectHero,
    undo,
    canUndo: draftActions.length > 0,
    clearSlot,
    changePickPos,

    // Slot Arrays
    blueBans,
    redBans,
    bluePicks,
    redPicks,
    bannedHeroNames,
    pickedHeroNames,

    // Timer
    timerSec,
    timerMax,
    isTimerPaused,
    toggleTimerPause,

    // Scores
    draftScore,
    redDraftScore,

    // Filter & Search
    roleFilter,
    setRoleFilter,
    searchQuery,
    setSearchQuery,

    // Match Notes
    matchGames,
    blueSeriesNote,
    setBlueSeriesNote,
    redSeriesNote,
    setRedSeriesNote,
    saveToMatchNotes,
    addEmptyGame,
    clearAllGames,
    updateGameWinner,
    updateGameNote,
    updateGameSlot,
    deleteGame,

    // Toast
    toastMessage,
    showToast,
  };
}
