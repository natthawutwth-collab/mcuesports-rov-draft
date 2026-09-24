export const META_HERO_WR: Record<string, number> = {
  // S-tier (60+)
  'Marja': 62, 'Keera': 61, 'TeeMee': 61, 'Mganga': 60, 'Enzo': 60, 'Hayate': 60,
  // A-tier (55-58)
  'Capheny': 58, 'Tachi': 57, 'Skud': 57, 'Billow': 57, 'Toro': 56, 'Wisp': 56,
  'Lorion': 56, 'Raz': 55, 'Goverra': 55, 'Qi': 55, 'Florentino': 55, 'Yena': 55,
  // B+ tier (52-54)
  'Ignis': 54, 'Lauriel': 53, 'Veera': 53, 'Liliana': 53, 'Mina': 54, 'Y\'bneth': 53,
  'Stuart': 54, 'Wonder Woman': 53, 'Allain': 52, 'Volkath': 52, 'Murad': 53,
  'Tulen': 52, 'Elsu': 52, 'Krizzix': 53, 'Rouie': 54, 'Aoi': 52,
  // B tier (50-51)
  'Tel\'Annas': 51, 'Valhein': 50, 'Nakroth': 51, 'Krixi': 50, 'Diaochan': 50,
  'Eland\'orr': 51, 'Fennik': 51, 'Zuka': 50, 'Lu Bu': 51, 'Riktor': 51,
  'Sinestrea': 50, 'Paine': 50, 'Errol': 50, 'Maloch': 51, 'Zephys': 50,
  'Heino': 52, 'Edras': 52, 'Roxie': 52, 'Taara': 52, 'Veres': 51, 'Kil\'Groth': 51,
};

export const META_SIDE_BIAS: Record<string, number> = {
  'Mganga': 3, 'Tachi': 2, 'Enzo': 2, 'TeeMee': 2, 'Toro': 2,
  'Lorion': 1, 'Raz': 1, 'Capheny': 1, 'Wisp': 1,
  'Keera': -2, 'Marja': -2, 'Hayate': -1, 'Billow': -1, 'Skud': -1, 'Qi': -1,
};

export const META_SYNERGY: Record<string, { games: number; wins: number; wr: number; src: string }> = {
  'Enzo|Mganga': { games: 12, wins: 11, wr: 91.7, src: 'RPL Win25' },
  'Marja|Mganga': { games: 10, wins: 10, wr: 100, src: 'RPL Win25' },
  'Marja|Enzo': { games: 20, wins: 16, wr: 80.0, src: 'RPL Win25' },
  'TeeMee|Raz': { games: 22, wins: 17, wr: 77.3, src: 'RPL Sum25' },
  'Marja|Tachi': { games: 8, wins: 8, wr: 100, src: 'RPL Win/Sum25' },
  'Billow|Keera': { games: 14, wins: 9, wr: 64.3, src: 'RPL Win25' },
  'Toro|Mganga': { games: 15, wins: 11, wr: 73.3, src: 'RPL Win25' },
  'TeeMee|Keera': { games: 18, wins: 12, wr: 66.7, src: 'RPL Sum25' },
  'Billow|Enzo': { games: 12, wins: 8, wr: 66.7, src: 'RPL Sum25' },
  'Rouie|Hayate': { games: 16, wins: 11, wr: 68.8, src: 'RPL Win25' },
  'Enzo|Capheny': { games: 8, wins: 6, wr: 75.0, src: 'RPL Sum25' },
  'Keera|Capheny': { games: 22, wins: 14, wr: 63.6, src: 'RPL Sum25' },
  'Billow|Toro': { games: 11, wins: 8, wr: 72.7, src: 'RPL Win25' },
  'Toro|Marja': { games: 19, wins: 12, wr: 63.2, src: 'AOG Win25' },
  'Toro|Keera': { games: 18, wins: 11, wr: 61.1, src: 'AOG Win25' },
  'Toro|Capheny': { games: 17, wins: 10, wr: 58.8, src: 'AOG Win25' },
  'Toro|Elsu': { games: 17, wins: 10, wr: 58.8, src: 'AOG Win25' },
  'Qi|Keera': { games: 20, wins: 12, wr: 60.0, src: 'AOG Win25' },
  'Qi|Tachi': { games: 16, wins: 13, wr: 81.3, src: 'AOG Win25' },
  'Qi|Enzo': { games: 15, wins: 11, wr: 73.3, src: 'AOG Win25' },
  'Lorion|Marja': { games: 15, wins: 10, wr: 66.7, src: 'AOG Win25' },
  'Lorion|Capheny': { games: 17, wins: 10, wr: 58.8, src: 'AOG Win25' },
  'Capheny|Tachi': { games: 17, wins: 10, wr: 58.8, src: 'AOG Win25' },
  'TeeMee|Wisp': { games: 22, wins: 12, wr: 54.5, src: 'AOG Win25' },
  'TeeMee|Lorion': { games: 16, wins: 11, wr: 68.8, src: 'AOG Win25' },
  'Keera|Goverra': { games: 17, wins: 11, wr: 64.7, src: 'AOG Win25' },
  'Marja|Rouie': { games: 15, wins: 8, wr: 53.3, src: 'AOG Win25' },
  'Raz|Enzo': { games: 29, wins: 16, wr: 55.2, src: 'AOG Spr25' },
  'Raz|Keera': { games: 22, wins: 12, wr: 54.5, src: 'AOG Spr25' },
  'Raz|TeeMee': { games: 22, wins: 12, wr: 54.5, src: 'AOG Spr25' },
  'Raz|Fennik': { games: 19, wins: 12, wr: 63.2, src: 'AOG Spr25' },
  'TeeMee|Violet': { games: 26, wins: 15, wr: 57.7, src: 'AOG Spr25' },
  'TeeMee|Hayate': { games: 22, wins: 11, wr: 50.0, src: 'AOG Spr25' },
  'TeeMee|Qi': { games: 19, wins: 13, wr: 68.4, src: 'AOG Spr25' },
  'TeeMee|Yena': { games: 19, wins: 12, wr: 63.2, src: 'AOG Spr25' },
  'Keera|Hayate': { games: 12, wins: 8, wr: 66.7, src: 'GCS Spr25' },
  'Keera|Yena': { games: 10, wins: 6, wr: 60.0, src: 'GCS Spr25' },
  'Aoi|Mganga': { games: 8, wins: 7, wr: 87.5, src: 'GCS Spr25' },
  'Stuart|Yena': { games: 9, wins: 7, wr: 77.8, src: 'GCS Spr25' },
  'Lorion|Keera': { games: 18, wins: 9, wr: 50.0, src: 'GCS Sum25' },
  'Capheny|Lorion': { games: 16, wins: 9, wr: 56.3, src: 'GCS Sum25' },
  'Elsu|Keera': { games: 14, wins: 8, wr: 57.1, src: 'GCS Sum25' },
  'Hayate|Billow': { games: 12, wins: 8, wr: 66.7, src: 'GCS Sum25' },
  'Billow|Ignis': { games: 7, wins: 6, wr: 85.7, src: 'AIC 2025' },
  'Billow|Y\'bneth': { games: 6, wins: 5, wr: 83.3, src: 'AIC 2025' },
  'Billow|Hayate': { games: 7, wins: 5, wr: 71.4, src: 'AIC 2025' },
  'Skud|Hayate': { games: 10, wins: 7, wr: 70.0, src: 'AIC 2025' },
  'Skud|Ignis': { games: 9, wins: 6, wr: 66.7, src: 'AIC 2025' },
  'Marja|Wisp': { games: 5, wins: 4, wr: 80.0, src: 'AIC KO' },
  'Hayate|Toro': { games: 8, wins: 5, wr: 62.5, src: 'AIC KO' },
  // Anti-synergies
  'Hayate|Enzo': { games: 18, wins: 6, wr: 33.3, src: 'RPL Sum25' },
  'Capheny|TeeMee': { games: 21, wins: 6, wr: 28.6, src: 'AOG Win25' },
};

export const META_COUNTERS: Record<string, { games: number; victimWr: number; note: string }> = {
  'Hayate|Marja': { games: 8, victimWr: 12.5, note: 'Hayate hard counters Marja' },
  'Mganga|Qi': { games: 7, victimWr: 14.3, note: 'Mganga dominates Qi' },
  'Billow|Valhein': { games: 10, victimWr: 29.0, note: 'Billow counters Valhein' },
  'Toro|Keera': { games: 12, victimWr: 33.3, note: 'Toro counters Keera engage' },
  'Enzo|Skud': { games: 9, victimWr: 33.3, note: 'Enzo poke vs Skud' },
  'Marja|Lorion': { games: 11, victimWr: 36.4, note: 'Marja burst vs Lorion' },
  'Skud|Keera': { games: 20, victimWr: 25.0, note: 'Skud 75% vs Keera' },
  'Hayate|Capheny': { games: 28, victimWr: 46.4, note: 'Hayate vs Capheny' },
  'Enzo|TeeMee': { games: 29, victimWr: 31.0, note: 'Enzo 69% vs TeeMee' },
  'Keera|Marja': { games: 19, victimWr: 21.1, note: 'Keera 79% vs Marja' },
  'Billow|Tachi': { games: 5, victimWr: 0.0, note: 'Tachi 0% vs Billow' },
  'Stuart|Billow': { games: 9, victimWr: 22.2, note: 'Stuart 78% vs Billow' },
};

export function getHeroWinRate(name: string): number {
  return META_HERO_WR[name] ?? 50;
}

export function getSideBonus(name: string, isBlue: boolean): number {
  const b = META_SIDE_BIAS[name] || 0;
  return isBlue ? b : -b;
}

export function getSynergyEntry(a: string, b: string) {
  return META_SYNERGY[`${a}|${b}`] || META_SYNERGY[`${b}|${a}`];
}

export interface DraftScoreResult {
  score: number;
  baseWR: number;
  side: number;
  syn: number;
  ctr: number;
  synPairs: { pair: string; wr: number; bad?: boolean }[];
  ctrAlerts: { attacker: string; victim: string; victimWr: number }[];
}

export function calcTeamScore(picks: string[], oppPicks: string[], isBlue = true): DraftScoreResult {
  const valid = picks.filter((h) => h && h !== '—');
  if (!valid.length) {
    return { score: 0, baseWR: 0, side: 0, syn: 0, ctr: 0, synPairs: [], ctrAlerts: [] };
  }

  const baseWR = valid.reduce((s, h) => s + getHeroWinRate(h), 0) / valid.length;
  const side = valid.reduce((s, h) => s + getSideBonus(h, isBlue), 0) / valid.length;

  let syn = 0;
  const synPairs: { pair: string; wr: number; bad?: boolean }[] = [];
  for (let i = 0; i < valid.length; i++) {
    for (let j = i + 1; j < valid.length; j++) {
      const e = getSynergyEntry(valid[i], valid[j]);
      if (e) {
        const delta = (e.wr - 50) * 0.22;
        syn += delta;
        if (e.wr >= 65) synPairs.push({ pair: `${valid[i]}+${valid[j]}`, wr: e.wr });
        else if (e.wr <= 35) synPairs.push({ pair: `${valid[i]}×${valid[j]}`, wr: e.wr, bad: true });
      }
    }
  }
  syn = Math.max(-12, Math.min(12, syn));

  let ctr = 0;
  const ctrAlerts: { attacker: string; victim: string; victimWr: number }[] = [];
  const oppValid = (oppPicks || []).filter((h) => h && h !== '—');
  oppValid.forEach((opp) => {
    valid.forEach((ours) => {
      const e = META_COUNTERS[`${opp}|${ours}`];
      if (e && e.victimWr < 45) {
        const delta = (45 - e.victimWr) * 0.18;
        ctr += delta;
        ctrAlerts.push({ attacker: opp, victim: ours, victimWr: e.victimWr });
      }
    });
  });
  ctr = Math.min(18, ctr);

  const raw = baseWR + side + syn - ctr;
  const score = Math.max(0, Math.min(100, raw));

  return {
    score,
    baseWR,
    side,
    syn,
    ctr,
    synPairs,
    ctrAlerts,
  };
}
