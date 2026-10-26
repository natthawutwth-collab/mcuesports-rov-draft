import { useState, useEffect, useCallback, useRef } from 'react';
import { CoachTeamCombo, CoachTeamBalance } from '../types/player';

const DEFAULT_BALANCE: CoachTeamBalance = {
  earlyGame: {
    score: 4,
    plan: 'คุมมิดเลนและจังเกิ้ล เน้นเคลียร์เวฟไวเพื่อรวมตัวชิงมังกรตัวแรก (Abyssal Dragon)',
    keyObjectives: 'คุมแม่น้ำ, ชิงนกเลนข้าง, ป้องกันบัฟฟ้า/แดง',
  },
  midGame: {
    score: 4,
    plan: 'ดันป้อม Tier 1 ของคู่แข่งให้หมด โฟกัสการเดินเกมคู่ Roam + Mid เพื่อดักซุ่มไฟต์',
    keyObjectives: 'คุมพื้นที่ป่าศัตรู, ตัดบัฟ, ตีป้อมกลาง',
  },
  lateGame: {
    score: 4,
    plan: 'เล่นไฟต์ 5v5 รอบ Dark Slayer ให้แครี่และเมจยืนโซนหลังแทงค์ ไม่ดันเดี่ยว',
    keyObjectives: 'เก็บบัฟ Dark Slayer, ดันเวฟครีป 3 ทางพร้อมกัน, ตีบ้าน',
  },
  overallNotes: 'ทีมมีความสมดุลทุกช่วงเวลา โดยมีจุดเด่นในการประสานงานไฟต์กลุ่มและการชิง Objective ใหญ่',
  updatedAt: Date.now(),
};

export function useCoachTeamData(teamId: string = 'main_team') {
  const comboStorageKey = `mcu_rov_combos_${teamId}`;
  const balanceStorageKey = `mcu_rov_balance_${teamId}`;

  // 1. Combos State
  const [combos, setCombos] = useState<CoachTeamCombo[]>(() => {
    try {
      const saved = localStorage.getItem(comboStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  // 2. Team Balance State
  const [teamBalance, setTeamBalance] = useState<CoachTeamBalance>(() => {
    try {
      const saved = localStorage.getItem(balanceStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.earlyGame && parsed.midGame && parsed.lateGame) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_BALANCE;
  });

  // Re-load when teamId changes
  useEffect(() => {
    try {
      const savedCombos = localStorage.getItem(comboStorageKey);
      if (savedCombos) {
        const parsed = JSON.parse(savedCombos);
        if (Array.isArray(parsed)) setCombos(parsed);
      } else {
        setCombos([]);
      }

      const savedBalance = localStorage.getItem(balanceStorageKey);
      if (savedBalance) {
        const parsed = JSON.parse(savedBalance);
        if (parsed && parsed.earlyGame && parsed.midGame && parsed.lateGame) {
          setTeamBalance(parsed);
        }
      } else {
        setTeamBalance(DEFAULT_BALANCE);
      }
    } catch {
      // ignore
    }
  }, [teamId, comboStorageKey, balanceStorageKey]);

  // Save Combos
  const persistCombos = useCallback(
    (newCombos: CoachTeamCombo[]) => {
      setCombos(newCombos);
      try {
        localStorage.setItem(comboStorageKey, JSON.stringify(newCombos));
      } catch (e) {
        console.error('Failed to save combos to localStorage', e);
      }
    },
    [comboStorageKey]
  );

  const addCombo = useCallback(
    (data: Omit<CoachTeamCombo, 'id' | 'updatedAt'>) => {
      const newCombo: CoachTeamCombo = {
        ...data,
        id: 'combo_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        updatedAt: Date.now(),
      };
      persistCombos([newCombo, ...combos]);
      return newCombo;
    },
    [combos, persistCombos]
  );

  const updateCombo = useCallback(
    (id: string, updates: Partial<Omit<CoachTeamCombo, 'id'>>) => {
      const updated = combos.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c
      );
      persistCombos(updated);
    },
    [combos, persistCombos]
  );

  const deleteCombo = useCallback(
    (id: string) => {
      const remaining = combos.filter((c) => c.id !== id);
      persistCombos(remaining);
    },
    [combos, persistCombos]
  );

  // Save Team Balance
  const updateTeamBalance = useCallback(
    (newBalance: Partial<CoachTeamBalance>) => {
      setTeamBalance((prev) => {
        const updated: CoachTeamBalance = {
          ...prev,
          ...newBalance,
          updatedAt: Date.now(),
        };
        try {
          localStorage.setItem(balanceStorageKey, JSON.stringify(updated));
        } catch (e) {
          console.error('Failed to save balance to localStorage', e);
        }
        return updated;
      });
    },
    [balanceStorageKey]
  );

  return {
    combos,
    addCombo,
    updateCombo,
    deleteCombo,
    teamBalance,
    updateTeamBalance,
  };
}
