import React, { useState, useMemo, useEffect } from 'react';
import { Hero } from '../types/draft';
import { Player, HeroPlayerBadge } from '../types/player';
import { PickSlotState } from '../hooks/useDraconmindDraft';
import {
  analyzeCoachDraft,
  CoachAnalysisResult,
  getHeroCompRoles,
  SmartBanItem,
} from '../services/coachAnalysisService';
import { getHeroImageUrl, HEROES } from '../data/heroes';
import { RPL_2026_PRO_COMPS, ProMetaComp } from '../data/proMetaComps';
import { statsDataProvider } from '../services/statsDataProvider';
import {
  X,
  Swords,
  Shield,
  Zap,
  Target,
  Users,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Info,
  Flame,
  Layers,
  Ban,
  Check,
  Star,
  RefreshCw,
  HelpCircle,
  Eye,
  Crosshair,
} from 'lucide-react';

export type AssistantSituationalMode = 'inspect' | 'counter_opp' | 'banned_combos' | 'smart_ban';

interface UnifiedDraftAssistantProps {
  heroName: string | null;
  onClose: () => void;
  // Draft State
  activeTurnTeam: 'blue' | 'red';
  bluePicks: PickSlotState[];
  redPicks: PickSlotState[];
  blueBans: (Hero | null)[];
  redBans: (Hero | null)[];
  bannedHeroNames: Set<string>;
  pickedHeroNames: Set<string>;
  allHeroes: Hero[];
  // Team Context
  blueTeamName: string;
  redTeamName: string;
  blueIsUs: boolean;
  // Players
  players: Player[];
  heroToPlayersMap: Record<string, HeroPlayerBadge[]>;
  // Interactions
  onSelectHeroToInspect: (heroName: string) => void;
  onPickHeroDirectly?: (hero: Hero) => void;
  isPickTurn?: boolean;
  isBanTurn?: boolean;
}

// Tactical substitutes mapping for key meta heroes if banned/taken
const META_SUBSTITUTE_GUIDE: Record<
  string,
  Array<{ substitute: string; role: string; tradeOff: string; effectiveness: string }>
> = {
  'Capheny': [
    { substitute: 'Hayate', role: 'ADL Carry', effectiveness: 'ทดแทนได้ 88%', tradeOff: 'มีดาเมจจริงและเคลื่อนที่คล่องตัวสูงกว่า แต่เคลียร์เวฟและเบิร์สช่วงต้นเกมช้ากว่า' },
    { substitute: 'Violet', role: 'ADL Carry', effectiveness: 'ทดแทนได้ 82%', tradeOff: 'เน้นยิงโป๊กเบิร์สระยะไกลได้ดีมาก แต่การทำดาเมจ DPS ต่อเนื่องในไฟต์ยาวจะต่ำกว่า' },
    { substitute: 'Laville', role: 'ADL Carry', effectiveness: 'ทดแทนได้ 78%', tradeOff: 'มีสตันเปิดแมพและยิงรัวกวาดไฟต์ได้ แต่ขาดความคล่องตัว ต้องอาศัยซัพพอร์ตคอยคุ้มกัน' },
  ],
  'TeeMee': [
    { substitute: 'Helen', role: 'Support / Roam', effectiveness: 'ทดแทนได้ 85%', tradeOff: 'ฟื้นฟูเลือดและบัฟเกราะให้ทีมได้อย่างต่อเนื่อง แต่ไม่มี Passive เร่งเงินและไม่มีอัลติชุบชีวิต' },
    { substitute: 'Zip', role: 'Support / Roam', effectiveness: 'ทดแทนได้ 82%', tradeOff: 'อมเพื่อนเซฟจังหวะโดนจับได้ดีมากและดูดมินเนียนได้ แต่ไม่สามารถเร่งอัตราการเงินให้แครี่ได้' },
    { substitute: 'Xeniel', role: 'Support / Roam', effectiveness: 'ทดแทนได้ 75%', tradeOff: 'เปิดวาปร์ลงมาเติมไฟต์ได้ทุกที่และมีดาเมจเวท แต่การคุ้มกันแครี่ในเลนช่วงต้นเกมจำกัดกว่า' },
  ],
  'Rouie': [
    { substitute: 'Zip', role: 'Support / Roam', effectiveness: 'ทดแทนได้ 86%', tradeOff: 'เซฟเพื่อนและย้ายตำแหน่งไฟต์ได้ดี แต่ไม่สามารถวาร์ปส่งทั้งทีมกลับบ่อเพื่อเติมเลือดเต็มได้' },
    { substitute: 'Xeniel', role: 'Support / Roam', effectiveness: 'ทดแทนได้ 80%', tradeOff: 'มีจังหวะเติมไฟต์ระดับ Global แต่ไม่สามารถเปิดประตูเรียกเพื่อนมารุมเลนได้เหมือน Rouie' },
    { substitute: 'Teeri', role: 'Flex Roam', effectiveness: 'ทดแทนได้ 65%', tradeOff: 'มีวิสัยทัศน์เปิดแมพ แต่ขาดมิติการเคลื่อนย้ายทีมไฟต์' },
  ],
  'Eland\'orr': [
    { substitute: 'Nakroth', role: 'Jungle Assassin', effectiveness: 'ทดแทนได้ 84%', tradeOff: 'ฟาร์มไว สปลิทพุชแยกดันยอดเยี่ยม แต่เป็นโจมตีระยะประชิด เสี่ยงโดน CC มากกว่าตัวยิงไกล' },
    { substitute: 'Aoi', role: 'Jungle Assassin', effectiveness: 'ทดแทนได้ 82%', tradeOff: 'โหนสลิงล้วงตัวบางแนวหลังได้เด็ดขาด แต่การยืนยิงดึงจังหวะจากระยะปลอดภัยทำได้ยากกว่า' },
    { substitute: 'Keera', role: 'Jungle Assassin', effectiveness: 'ทดแทนได้ 78%', tradeOff: 'เบิร์สเวทแรงและมุดกำแพงได้ แต่ไม่สามารถสลับร่างหลอกทิศทางแบบ Eland\'orr' },
  ],
  'Aya': [
    { substitute: 'Helen', role: 'Support / Roam', effectiveness: 'ทดแทนได้ 82%', tradeOff: 'ฮีลเพื่อนรอบตัวได้ดี แต่ไม่สามารถสิงร่างเพื่อเป็นอมตะได้ ตกเป็นเป้าหมายถูกจับตายได้' },
    { substitute: 'Alice', role: 'Support / Roam', effectiveness: 'ทดแทนได้ 76%', tradeOff: 'กางวงสโลว์ใบ้ศัตรูและบัฟสปีดได้ดี แต่ไม่มีการสิงร่างเกาะติดไฟต์เลนหน้าแบบ Aya' },
  ],
  'Taara': [
    { substitute: 'Skud', role: 'Dark Slayer Lane', effectiveness: 'ทดแทนได้ 88%', tradeOff: 'มีเลือดมหาศาลและหมัดเบิร์สหนักมาก แต่ไม่มีรีเจนเลือดต่อเนื่องแบบไร้มานาของ Taara' },
    { substitute: 'Maloch', role: 'Dark Slayer Lane', effectiveness: 'ทดแทนได้ 85%', tradeOff: 'มีดาเมจจริงวงกว้างและเปิดอัลติลงกลางวงได้ดี แต่การสปลิทดันเลนและหนีเอาตัวรอดช้ากว่า' },
    { substitute: 'Arthur', role: 'Dark Slayer Lane', effectiveness: 'ทดแทนได้ 75%', tradeOff: 'ไล่กวดศัตรูได้ดีและทนทาน แต่การฟื้นฟูเลือดในจังหวะวิกฤตสู้ Taara ไม่ได้' },
  ],
  'Liliana': [
    { substitute: 'Krixi', role: 'Mid Lane Mage', effectiveness: 'ทดแทนได้ 85%', tradeOff: 'สตันยกและเบิร์สชุดเดียวแรงมาก แต่ไม่มีสกิลแดชพุ่งหนี 2 จังหวะแบบร่างจิ้งจอกของ Liliana' },
    { substitute: 'Yue', role: 'Mid Lane Mage', effectiveness: 'ทดแทนได้ 82%', tradeOff: 'ระยะสกิลไกลและดาเมจรุนแรงมาก แต่ขาดความคล่องตัวอย่างสิ้นเชิงเมื่อโดนแอสซาสซินประชิดตัว' },
    { substitute: 'Iggy', role: 'Mid Lane Mage', effectiveness: 'ทดแทนได้ 80%', tradeOff: 'ระเบิดอัลติกว้างเปิดแมพและกดดันได้ดี แต่จังหวะล้วงโซโล่เดี่ยวทำได้ยากกว่า' },
  ],
  'Keera': [
    { substitute: 'Paine', role: 'Jungle Assassin', effectiveness: 'ทดแทนได้ 85%', tradeOff: 'เบิร์สเวทได้รวดเร็วและใบ้ศัตรูได้ดี แต่ไม่มีอัลติมุดกำแพงหนีเอาตัวรอดแบบ Keera' },
    { substitute: 'Kaine', role: 'Jungle Assassin', effectiveness: 'ทดแทนได้ 82%', tradeOff: 'ล่องหนเปิดวิสัยทัศน์และสเต็ปล้วงเดี่ยวได้เร็ว แต่เป็นดาเมจกายภาพ แก้ทางแทงค์หนาได้ยากกว่า' },
    { substitute: 'Zill', role: 'Jungle Assassin', effectiveness: 'ทดแทนได้ 75%', tradeOff: 'ดาเมจเวทชุดเดียวตายและไม่ตกเป็นเป้าหมาย แต่อ่อนแอกว่าในช่วงรอคูลดาวน์อัลติเมท' },
  ],
  'Florentino': [
    { substitute: 'Yena', role: 'Dark Slayer Lane', effectiveness: 'ทดแทนได้ 86%', tradeOff: 'คอมโบใบ้และมีต้านทานสถานะช่วงฟันดาบใหญ่ได้ดี แต่จังหวะดวล 1v1 ในไฟต์ยืดเยื้อไม่รัวเท่ารำดอกไม้' },
    { substitute: 'Richter', role: 'Dark Slayer Lane', effectiveness: 'ทดแทนได้ 82%', tradeOff: 'จังหวะดักพุ่มใบ้และเดินซ้อนไฟต์เลนอื่นไวกว่ามาก แต่การปะทะตรงๆ กับตัวชนหนาจะสู้โฟลเรนไม่ได้' },
    { substitute: 'Airi', role: 'Dark Slayer Lane', effectiveness: 'ทดแทนได้ 78%', tradeOff: 'ดาเมจจริงและพุ่ง 3 จังหวะยอดเยี่ยมในเลทเกม แต่ช่วงต้นเกมเลนจะเสียเปรียบและยืนยาก' },
  ],
  'Elsu': [
    { substitute: 'Violet', role: 'ADL Carry', effectiveness: 'ทดแทนได้ 82%', tradeOff: 'กลิ้งยิงโป๊กเบิร์สได้เร็วและเล่นง่ายกว่า แต่ไม่มีการวางกับดักเปิดวิสัยทัศน์คุมแมพแบบ Elsu' },
    { substitute: 'Stuart', role: 'ADL Carry', effectiveness: 'ทดแทนได้ 80%', tradeOff: 'มีสกิลกันดาเมจกายภาพและสโลว์เปิดจังหวะได้ดี แต่ระยะการสไนป์ไกลไม่เท่า Elsu' },
  ],
  'Zip': [
    { substitute: 'TeeMee', role: 'Support / Roam', effectiveness: 'ทดแทนได้ 88%', tradeOff: 'ชุบชีวิตเพื่อนได้และมีสตันหม้อระเบิดต่อเนื่อง แต่ไม่สามารถดูดมินเนียนหรืออมย้ายเพื่อนข้ามกำแพงได้' },
    { substitute: 'Helen', role: 'Support / Roam', effectiveness: 'ทดแทนได้ 80%', tradeOff: 'เติมเลือดและบัฟป้องกันให้ทีมได้สม่ำเสมอ แต่ไม่มีจังหวะเซฟเพื่อนฉุกเฉินตอนติดสตันหมู่' },
  ],
};

export const UnifiedDraftAssistant: React.FC<UnifiedDraftAssistantProps> = ({
  heroName,
  onClose,
  activeTurnTeam,
  bluePicks,
  redPicks,
  blueBans,
  redBans,
  bannedHeroNames,
  pickedHeroNames,
  allHeroes,
  blueTeamName,
  redTeamName,
  blueIsUs,
  players,
  heroToPlayersMap,
  onSelectHeroToInspect,
  onPickHeroDirectly,
  isPickTurn = false,
  isBanTurn = false,
}) => {
  // Target hero object being inspected/previewed
  const currentHero = useMemo(() => {
    if (!heroName) return null;
    return allHeroes.find((h) => h.name.toLowerCase() === heroName.toLowerCase()) || null;
  }, [heroName, allHeroes]);

  // Situational Tab Mode State:
  // inspect (กรณี A), counter_opp (กรณี B), banned_combos (กรณี C), smart_ban (กรณี D)
  const [situationalMode, setSituationalMode] = useState<AssistantSituationalMode>(() => {
    if (isBanTurn) return 'smart_ban';
    if (currentHero) return 'inspect';
    return 'counter_opp';
  });

  // Auto-switch mode based on situational events
  useEffect(() => {
    if (isBanTurn) {
      setSituationalMode('smart_ban');
    }
  }, [isBanTurn]);

  // When a hero is clicked to inspect, automatically activate 'inspect' mode
  useEffect(() => {
    if (heroName) {
      setSituationalMode('inspect');
    }
  }, [heroName]);

  // Collapsible accordion states
  const [openSections, setOpenSections] = useState<{
    combos: boolean;
    opponent: boolean;
    counters: boolean;
    players: boolean;
  }>({
    combos: true,
    opponent: true,
    counters: true,
    players: true,
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Run Coach Analysis Engine
  const analysis: CoachAnalysisResult = useMemo(() => {
    return analyzeCoachDraft({
      activeTeam: activeTurnTeam,
      myPicks: activeTurnTeam === 'blue' ? bluePicks : redPicks,
      oppPicks: activeTurnTeam === 'blue' ? redPicks : bluePicks,
      myBans: activeTurnTeam === 'blue' ? blueBans : redBans,
      oppBans: activeTurnTeam === 'blue' ? redBans : blueBans,
      inspectedHero: currentHero,
      players,
      heroToPlayersMap,
      allHeroes,
      bannedHeroNames,
      pickedHeroNames,
    });
  }, [
    activeTurnTeam,
    bluePicks,
    redPicks,
    blueBans,
    redBans,
    currentHero,
    players,
    heroToPlayersMap,
    allHeroes,
    bannedHeroNames,
    pickedHeroNames,
  ]);

  // Opponent locked picks list
  const oppLockedHeroes = useMemo(() => {
    const oppPicks = activeTurnTeam === 'blue' ? redPicks : bluePicks;
    return oppPicks.map((p) => p.hero).filter((h): h is Hero => h !== null);
  }, [activeTurnTeam, bluePicks, redPicks]);

  // Selected opponent hero to analyze counter responses (defaults to latest opponent pick)
  const [selectedOppHeroName, setSelectedOppHeroName] = useState<string | null>(null);

  const activeOppHero = useMemo(() => {
    if (selectedOppHeroName) {
      return oppLockedHeroes.find((h) => h.name.toLowerCase() === selectedOppHeroName.toLowerCase()) || oppLockedHeroes[oppLockedHeroes.length - 1] || null;
    }
    return oppLockedHeroes[oppLockedHeroes.length - 1] || null;
  }, [selectedOppHeroName, oppLockedHeroes]);

  // Status of the inspected hero (available, picked, banned)
  const heroStatus = useMemo(() => {
    if (!currentHero) return null;
    const name = currentHero.name;
    const isBanned = bannedHeroNames.has(name);
    const isBluePick = bluePicks.some((p) => p.hero?.name.toLowerCase() === name.toLowerCase());
    const isRedPick = redPicks.some((p) => p.hero?.name.toLowerCase() === name.toLowerCase());

    if (isBanned) return { label: 'ถูกแบนในเกมนี้', color: 'bg-rose-100 text-rose-800 border-rose-300', isAvailable: false, type: 'banned' };
    if (isBluePick) return { label: `Blue Pick (${blueTeamName || 'Blue'})`, color: 'bg-sky-100 text-sky-800 border-sky-300', isAvailable: false, type: 'blue' };
    if (isRedPick) return { label: `Red Pick (${redTeamName || 'Red'})`, color: 'bg-rose-100 text-rose-800 border-rose-300', isAvailable: false, type: 'red' };
    return { label: 'พร้อมเลือกในดราฟต์', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', isAvailable: true, type: 'available' };
  }, [currentHero, bannedHeroNames, bluePicks, redPicks, blueTeamName, redTeamName]);

  // 1. Synergies & Meta Comps for Inspected Hero
  const heroMetaComps = useMemo(() => {
    if (!currentHero) return [];
    return RPL_2026_PRO_COMPS.filter((c) =>
      c.coreHeroes.some((h) => h.toLowerCase() === currentHero.name.toLowerCase())
    );
  }, [currentHero]);

  // Top 3 Partners (synergies)
  const topPartners = useMemo(() => {
    if (!currentHero) return [];
    const synergies = statsDataProvider.getHeroPlayedWith(currentHero.name);
    const sorted = [...synergies]
      .filter((s) => s.allyHero.toLowerCase() !== currentHero.name.toLowerCase())
      .sort((a, b) => (b.diff ?? 0) - (a.diff ?? 0))
      .slice(0, 3);
    return sorted;
  }, [currentHero]);

  // Check banned key partners and get substitutes
  const partnerSubstitutes = useMemo(() => {
    if (!currentHero) return [];
    const subs: Array<{
      bannedPartner: string;
      compName: string;
      substitutes: Array<{ substitute: string; role: string; tradeOff: string; effectiveness: string }>;
    }> = [];

    heroMetaComps.forEach((comp) => {
      comp.coreHeroes.forEach((partner) => {
        if (partner.toLowerCase() !== currentHero.name.toLowerCase()) {
          const isBanned = bannedHeroNames.has(partner);
          const isEnemyPicked = (activeTurnTeam === 'blue' ? redPicks : bluePicks).some(
            (p) => p.hero?.name.toLowerCase() === partner.toLowerCase()
          );

          if ((isBanned || isEnemyPicked) && META_SUBSTITUTE_GUIDE[partner]) {
            const availableSubs = META_SUBSTITUTE_GUIDE[partner].filter(
              (s) => !bannedHeroNames.has(s.substitute) && !pickedHeroNames.has(s.substitute)
            );
            if (availableSubs.length > 0) {
              subs.push({
                bannedPartner: partner,
                compName: comp.nameTh,
                substitutes: availableSubs,
              });
            }
          }
        }
      });
    });

    return subs;
  }, [currentHero, heroMetaComps, bannedHeroNames, activeTurnTeam, redPicks, bluePicks, pickedHeroNames]);

  // Anticipated Enemy Responses (what enemy might pick against this hero)
  const anticipatedEnemyResponses = useMemo(() => {
    if (!currentHero) return [];
    const matchups = statsDataProvider.getHeroMatchups(currentHero.name);
    if (!matchups) return [];
    return [...matchups.weakAgainst]
      .filter((m) => !bannedHeroNames.has(m.opponentHero) && !pickedHeroNames.has(m.opponentHero))
      .sort((a, b) => a.diff - b.diff)
      .slice(0, 3);
  }, [currentHero, bannedHeroNames, pickedHeroNames]);

  // Matchup against opponent's locked picks
  const matchupAgainstOpponentPicks = useMemo(() => {
    if (!currentHero || oppLockedHeroes.length === 0) return [];
    const matchups = statsDataProvider.getHeroMatchups(currentHero.name);
    return oppLockedHeroes.map((opp) => {
      const match = matchups?.all.find(
        (m) => m.opponentHero.toLowerCase() === opp.name.toLowerCase()
      ) || null;
      return {
        oppHero: opp,
        matchup: match,
        isAdvantage: match ? match.diff > 2 : false,
        isDisadvantage: match ? match.diff < -2 : false,
      };
    });
  }, [currentHero, oppLockedHeroes]);

  // Player comfort for inspected hero
  const mcuPlayersForHero = useMemo(() => {
    if (!currentHero) return [];
    return heroToPlayersMap[currentHero.name] || [];
  }, [currentHero, heroToPlayersMap]);

  // -------------------------------------------------------------
  // CASE B: COUNTER OPPONENT PICKS (เมื่อคู่แข่งหยิบฮีโร่)
  // -------------------------------------------------------------
  const counterPicksForOpponent = useMemo(() => {
    if (!activeOppHero) return [];
    const matchups = statsDataProvider.getHeroMatchups(activeOppHero.name);
    if (!matchups) return [];

    // Heroes that activeOppHero is weak against (so they counter activeOppHero)
    const rawCounters = matchups.weakAgainst.filter(
      (m) => !bannedHeroNames.has(m.opponentHero) && !pickedHeroNames.has(m.opponentHero)
    );

    // Score and rank them by: diff advantage + player comfort + role fit
    const missingRoles = analysis.myTeamComp.missingRoles.map((r) => r.toLowerCase());

    const enriched = rawCounters.map((c) => {
      const heroObj = allHeroes.find((h) => h.name.toLowerCase() === c.opponentHero.toLowerCase()) || null;
      const badges = heroToPlayersMap[c.opponentHero] || [];
      const hasSig = badges.some((b) => b.tier === 'signature');
      const hasComf = badges.some((b) => b.tier === 'comfortable');

      const heroRoles = heroObj ? [heroObj.primaryPos, ...(heroObj.pos || [])].map((r) => r.toLowerCase()) : [];
      const fitsMissingRole = heroRoles.some((hr) => missingRoles.includes(hr));

      return {
        heroName: c.opponentHero,
        heroObj,
        diff: Math.abs(c.diff),
        games: c.games,
        winRate: c.winRate,
        badges,
        hasSig,
        hasComf,
        fitsMissingRole,
      };
    });

    return enriched.sort((a, b) => {
      if (a.hasSig && !b.hasSig) return -1;
      if (!a.hasSig && b.hasSig) return 1;
      if (a.fitsMissingRole && !b.fitsMissingRole) return -1;
      if (!a.fitsMissingRole && b.fitsMissingRole) return 1;
      return b.diff - a.diff;
    }).slice(0, 3);
  }, [activeOppHero, bannedHeroNames, pickedHeroNames, analysis.myTeamComp.missingRoles, allHeroes, heroToPlayersMap]);

  // -------------------------------------------------------------
  // CASE C: BANNED COMBO AUDIT (ฮีโร่คอมโบหลักถูก BAN)
  // -------------------------------------------------------------
  const allBannedCombos = useMemo(() => {
    const list: Array<{
      comp: ProMetaComp;
      bannedHeroes: string[];
      intactHeroes: string[];
      impactDescription: string;
      substitutes: Array<{
        targetHero: string;
        options: Array<{ substitute: string; role: string; tradeOff: string; effectiveness: string }>;
      }>;
    }> = [];

    RPL_2026_PRO_COMPS.forEach((comp) => {
      const bannedInThisComp = comp.coreHeroes.filter((h) => bannedHeroNames.has(h));
      const intact = comp.coreHeroes.filter((h) => !bannedHeroNames.has(h) && !pickedHeroNames.has(h));

      if (bannedInThisComp.length > 0) {
        const subs: Array<{
          targetHero: string;
          options: Array<{ substitute: string; role: string; tradeOff: string; effectiveness: string }>;
        }> = [];

        bannedInThisComp.forEach((bHero) => {
          if (META_SUBSTITUTE_GUIDE[bHero]) {
            const validOptions = META_SUBSTITUTE_GUIDE[bHero].filter(
              (s) => !bannedHeroNames.has(s.substitute) && !pickedHeroNames.has(s.substitute)
            );
            if (validOptions.length > 0) {
              subs.push({
                targetHero: bHero,
                options: validOptions.slice(0, 3),
              });
            }
          }
        });

        list.push({
          comp,
          bannedHeroes: bannedInThisComp,
          intactHeroes: intact,
          impactDescription: `เสีย ${bannedInThisComp.join(', ')} ส่งผลให้จังหวะ ${comp.nameTh} ขาดแกนหลักสำคัญ`,
          substitutes: subs,
        });
      }
    });

    return list;
  }, [bannedHeroNames, pickedHeroNames]);

  // -------------------------------------------------------------
  // CASE D: SMART BAN ADVISOR (อยู่ในช่วง BAN)
  // -------------------------------------------------------------
  const availableSmartBans = useMemo(() => {
    // Strictly filter out any heroes already picked or banned
    return analysis.smartBans
      .filter((b) => !bannedHeroNames.has(b.hero.name) && !pickedHeroNames.has(b.hero.name))
      .slice(0, 5);
  }, [analysis.smartBans, bannedHeroNames, pickedHeroNames]);

  return (
    <aside
      className="w-full h-full flex flex-col bg-white border-2 border-[#F3D5E2] rounded-2xl shadow-xl overflow-hidden transition-all text-[#1F2937] font-['Prompt'] select-none min-h-0"
      aria-label="Unified Draft Assistant"
    >
      {/* 1. Header with Mode Tabs */}
      <div className="bg-gradient-to-r from-[#FFF0F5] to-white border-b-2 border-[#F3D5E2] flex flex-col flex-shrink-0">
        <div className="px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#E91E63] to-[#C2185B] text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <Sparkles size={14} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-xs text-[#1F2937] flex items-center gap-1.5 uppercase leading-tight">
                <span>DRAFT ASSISTANT</span>
                <span className={`text-[8.5px] font-black px-1.5 py-0.2 rounded-full text-white shadow-2xs ${
                  isBanTurn ? 'bg-rose-600 animate-pulse' : 'bg-[#E91E63]'
                }`}>
                  {isBanTurn ? 'BAN ADVISOR' : 'LIVE COACH'}
                </span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium leading-tight truncate">
                {activeTurnTeam === 'blue' ? (blueTeamName || 'Blue Team') : (redTeamName || 'Red Team')} • {isBanTurn ? 'รอบแบนฮีโร่' : 'รอบเลือกฮีโร่'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer shadow-2xs"
            title="ปิดหน้าต่าง Draft Assistant"
          >
            <X size={14} />
          </button>
        </div>

        {/* 4 Situational Mode Switcher Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1.5 bg-[#FFF8FB] border-t border-[#F3D5E2]">
          <button
            type="button"
            onClick={() => setSituationalMode('inspect')}
            className={`py-1 px-1 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center gap-0.5 cursor-pointer border ${
              situationalMode === 'inspect'
                ? 'bg-[#E91E63] text-white border-[#C2185B] shadow-2xs'
                : 'bg-white text-slate-600 hover:text-[#E91E63] border-slate-200'
            }`}
            title="กรณี A: วิเคราะห์ฮีโร่ที่คลิกพิจารณา"
          >
            <Eye size={12} />
            <span className="truncate max-w-full">พิจารณา</span>
          </button>

          <button
            type="button"
            onClick={() => setSituationalMode('counter_opp')}
            className={`py-1 px-1 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center gap-0.5 cursor-pointer border relative ${
              situationalMode === 'counter_opp'
                ? 'bg-[#0284C7] text-white border-[#0369A1] shadow-2xs'
                : 'bg-white text-slate-600 hover:text-[#0284C7] border-slate-200'
            }`}
            title="กรณี B: ตอบโต้ฮีโร่ที่คู่แข่งหยิบ"
          >
            <Crosshair size={12} />
            <span className="truncate max-w-full">ตอบโต้</span>
            {oppLockedHeroes.length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute top-1 right-1" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setSituationalMode('banned_combos')}
            className={`py-1 px-1 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center gap-0.5 cursor-pointer border relative ${
              situationalMode === 'banned_combos'
                ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                : 'bg-white text-slate-600 hover:text-amber-700 border-slate-200'
            }`}
            title="กรณี C: คอมโบหลักถูกแบน & ตัวแทน"
          >
            <Layers size={12} />
            <span className="truncate max-w-full">คอมโบแบน</span>
            {allBannedCombos.length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute top-1 right-1 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setSituationalMode('smart_ban')}
            className={`py-1 px-1 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center gap-0.5 cursor-pointer border relative ${
              situationalMode === 'smart_ban'
                ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                : 'bg-white text-slate-600 hover:text-rose-700 border-slate-200'
            }`}
            title="กรณี D: คำแนะนำในการแบน (Smart Ban Advisor)"
          >
            <Ban size={12} />
            <span className="truncate max-w-full">แนะนำแบน</span>
            {isBanTurn && (
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-300 absolute top-1 right-1 animate-ping" />
            )}
          </button>
        </div>
      </div>

      {/* 2. Scrollable Body */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2.5 sm:p-3 flex flex-col gap-2.5 bg-[#FFF8FB]/30">
        {/* ========================================================= */}
        {/* SITUATION A: โค้ชคลิกฮีโร่เพื่อพิจารณา (Hero Preview)     */}
        {/* ========================================================= */}
        {situationalMode === 'inspect' && (
          <>
            {!currentHero ? (
              <div className="flex flex-col gap-3 py-3 text-center">
                <div className="p-4 bg-white border border-[#F3D5E2] rounded-xl shadow-2xs flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-[#FFF0F5] text-[#E91E63] flex items-center justify-center text-lg shadow-2xs">
                    🎯
                  </div>
                  <h4 className="font-bold text-xs text-slate-800">คลิกฮีโร่ในกระดานเพื่อพิจารณาหยิบ</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs">
                    คลิกฮีโร่ตัวใดก็ได้ในตารางกลางเพื่อดูคอมโบ, ตัวแทนเมื่อโดนแบน, ตัวที่เคาน์เตอร์ และความถนัดของนักแข่ง
                  </p>
                </div>

                {/* Quick Recommendations */}
                <div className="flex flex-col gap-1.5 text-left">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Flame size={12} className="text-amber-500" />
                    <span>ตัวเลือกน่าสนใจสำหรับเทิร์นนี้ (คลิกเพื่อพรีวิว):</span>
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {analysis.suggestedPicks.slice(0, 3).map((item) => (
                      <div
                        key={item.hero.name}
                        onClick={() => onSelectHeroToInspect(item.hero.name)}
                        className="p-2 bg-white hover:bg-[#FFF0F5] border border-[#F3D5E2] hover:border-[#E91E63] rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2 shadow-2xs group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={getHeroImageUrl(item.hero.name)}
                            alt={item.hero.name}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200 group-hover:scale-105 transition-transform flex-shrink-0"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-xs text-slate-900 truncate group-hover:text-[#E91E63]">
                              {item.hero.name} <span className="text-[9.5px] text-slate-500 font-normal">({item.targetRole})</span>
                            </span>
                            <span className="text-[10px] text-slate-500 truncate">
                              {item.reasons[0] || item.hero.nameTh}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-[#E91E63] flex items-center gap-0.5 flex-shrink-0">
                          <span>ดูข้อมูล</span>
                          <ArrowRight size={11} />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* 1. Hero Overview Header Card */}
                <div className="p-2.5 bg-white border border-[#F3D5E2] rounded-xl shadow-xs flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-[#E91E63] shadow-xs flex-shrink-0 bg-slate-100">
                        <img
                          src={getHeroImageUrl(currentHero.name)}
                          alt={currentHero.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 inset-x-0 bg-black/80 text-[7.5px] font-bold text-center text-white py-0.2 uppercase">
                          {currentHero.primaryPos}
                        </div>
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-sm text-slate-900 leading-tight">
                            {currentHero.name}
                          </h3>
                          <span className="text-[10px] text-slate-500 font-medium">
                            ({currentHero.nameTh})
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-0.5 truncate">
                          <span>ตำแหน่ง:</span>
                          <span className="font-bold text-slate-700 uppercase">
                            {[currentHero.primaryPos, ...(currentHero.pos || [])].filter((v, i, a) => a.indexOf(v) === i).join(', ')}
                          </span>
                        </div>

                        {heroStatus && (
                          <div className="mt-1">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shadow-2xs ${heroStatus.color}`}>
                              {heroStatus.label}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Confirmed Selection Action Button */}
                    {onPickHeroDirectly && heroStatus?.isAvailable && (
                      <button
                        type="button"
                        onClick={() => onPickHeroDirectly(currentHero)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0 active:scale-95 ${
                          isBanTurn
                            ? 'bg-rose-600 hover:bg-rose-700 border border-rose-500'
                            : 'bg-emerald-600 hover:bg-emerald-700 border border-emerald-500'
                        }`}
                        title={isBanTurn ? `ยืนยันการแบน ${currentHero.name}` : `ยืนยันการเลือก ${currentHero.name} ลงดราฟต์`}
                      >
                        {isBanTurn ? <Ban size={12} /> : <Check size={12} />}
                        <span>{isBanTurn ? 'แบนตัวนี้' : 'หยิบตัวนี้'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Player Comfort (⭐/★) */}
                <div className="bg-white border border-[#F3D5E2] rounded-xl overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    onClick={() => toggleSection('players')}
                    className="w-full px-2.5 py-1.5 bg-[#FFF0F5] border-b border-[#F3D5E2] flex items-center justify-between text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-[#E91E63]">
                      <Users size={13} />
                      <span>ความถนัดของนักแข่ง MCU</span>
                    </div>
                    {openSections.players ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                  </button>

                  {openSections.players && (
                    <div className="p-2.5 flex flex-col gap-1.5">
                      {mcuPlayersForHero.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                          {mcuPlayersForHero.map((badge) => {
                            const isSig = badge.tier === 'signature';
                            return (
                              <div
                                key={badge.playerId}
                                className={`p-2 rounded-lg border flex items-center justify-between gap-2 shadow-2xs ${
                                  isSig
                                    ? 'bg-amber-50/70 border-amber-300 text-amber-900'
                                    : 'bg-slate-50 border-slate-200 text-slate-800'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className={isSig ? 'text-amber-500 text-sm' : 'text-slate-400 text-sm'}>
                                    {isSig ? '⭐' : '★'}
                                  </span>
                                  <div className="flex flex-col">
                                    <span className="font-bold text-xs">
                                      {badge.playerNickname}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-medium">
                                      ตำแหน่งหลัก: {badge.position}
                                    </span>
                                  </div>
                                </div>

                                <span
                                  className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${
                                    isSig
                                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                                      : 'bg-white text-slate-600 border-slate-300'
                                  }`}
                                >
                                  {isSig ? '⭐ ถนัดพิเศษ (Signature)' : '★ พอเล่นได้ (Comfortable)'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-2 text-center text-slate-500 text-[11px] bg-slate-50 rounded-lg border border-slate-200">
                          <span>⚠️ ไม่มีนักแข่งในทีมตั้ง {currentHero.name} เป็นตัวถนัดหลัก ควรเช็กความมั่นใจก่อนหยิบ</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Synergies & Substitutes */}
                <div className="bg-white border border-[#F3D5E2] rounded-xl overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    onClick={() => toggleSection('combos')}
                    className="w-full px-2.5 py-1.5 bg-[#FFF0F5] border-b border-[#F3D5E2] flex items-center justify-between text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-[#E91E63]">
                      <Layers size={13} />
                      <span>คอมโบที่เหมาะสม TOP 3 & ตัวแทน</span>
                    </div>
                    {openSections.combos ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                  </button>

                  {openSections.combos && (
                    <div className="p-2.5 flex flex-col gap-2.5">
                      {topPartners.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                          {topPartners.map((item) => {
                            const isBanned = bannedHeroNames.has(item.allyHero);
                            const isPicked = pickedHeroNames.has(item.allyHero);
                            return (
                              <div
                                key={item.allyHero}
                                onClick={() => onSelectHeroToInspect(item.allyHero)}
                                className="p-1.5 bg-slate-50 hover:bg-[#FFF0F5] border border-slate-200 hover:border-[#E91E63] rounded-lg transition-all cursor-pointer flex items-center justify-between gap-2"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <img
                                    src={getHeroImageUrl(item.allyHero)}
                                    alt={item.allyHero}
                                    className="w-8 h-8 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                                  />
                                  <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-1">
                                      <span className="font-bold text-xs text-slate-900 truncate">
                                        {item.allyHero}
                                      </span>
                                      {isBanned && (
                                        <span className="text-[8px] font-bold px-1 rounded bg-rose-100 text-rose-700">แบนแล้ว</span>
                                      )}
                                      {isPicked && (
                                        <span className="text-[8px] font-bold px-1 rounded bg-slate-200 text-slate-700">เลือกแล้ว</span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-slate-500 truncate">
                                      {item.hero || 'เข้าขากันในจังหวะไฟต์'}
                                    </span>
                                  </div>
                                </div>

                                <div className="text-right flex-shrink-0">
                                  <span className="text-[10px] font-bold text-emerald-600 block">
                                    {(item.diff ?? 0) > 0 ? '+' : ''}{(item.diff ?? 0).toFixed(1)}% Synergy
                                  </span>
                                  <span className="text-[8.5px] text-slate-400">
                                    {item.games} เกม
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border text-center">
                          ยังไม่มีข้อมูลตัวอย่างคอมโบคู่ในฐานข้อมูลการแข่งขัน
                        </div>
                      )}

                      {/* Substitutes if Partner is Banned */}
                      {partnerSubstitutes.length > 0 && (
                        <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-lg flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5 text-rose-900 font-bold text-[11px]">
                            <AlertTriangle size={13} className="text-rose-600 flex-shrink-0" />
                            <span>ตัวเล่นคู่หลักโดนแบน ➔ ตัวเลือกทดแทนที่ยังว่าง</span>
                          </div>

                          {partnerSubstitutes.map((subItem) => (
                            <div key={subItem.bannedPartner} className="flex flex-col gap-1 mt-1">
                              <span className="text-[10px] font-bold text-rose-800">
                                เมื่อ {subItem.bannedPartner} ไม่ว่าง ({subItem.compName}):
                              </span>
                              <div className="flex flex-col gap-1">
                                {subItem.substitutes.map((s) => (
                                  <div
                                    key={s.substitute}
                                    onClick={() => onSelectHeroToInspect(s.substitute)}
                                    className="p-1.5 bg-white border border-rose-200 hover:border-[#E91E63] rounded-md cursor-pointer transition-all flex flex-col gap-0.5"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-xs text-slate-900 flex items-center gap-1">
                                        <span>➔ ใช้</span>
                                        <span className="text-[#E91E63] underline">{s.substitute}</span>
                                        <span className="text-[9.5px] font-normal text-slate-500">({s.role})</span>
                                      </span>
                                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-200">
                                        {s.effectiveness}
                                      </span>
                                    </div>
                                    <p className="text-[9.5px] text-slate-600 leading-snug">
                                      <span className="font-semibold text-slate-800">ข้อแลกเปลี่ยน:</span> {s.tradeOff}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 4. Matchups & Counter Risks */}
                <div className="bg-white border border-[#F3D5E2] rounded-xl overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    onClick={() => toggleSection('counters')}
                    className="w-full px-2.5 py-1.5 bg-[#FFF0F5] border-b border-[#F3D5E2] flex items-center justify-between text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-[#E91E63]">
                      <Swords size={13} />
                      <span>ชนะทาง / เสียเปรียบ & คู่แข่งอาจตอบโต้</span>
                    </div>
                    {openSections.counters ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                  </button>

                  {openSections.counters && (
                    <div className="p-2.5 flex flex-col gap-2.5">
                      {/* Strong Against */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[10.5px] font-bold text-emerald-700 flex items-center gap-1">
                          <TrendingUp size={11} />
                          <span>สถิติชนะทาง (Strong Against):</span>
                        </span>
                        {analysis.inspectedMatchups.strongAgainst.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {analysis.inspectedMatchups.strongAgainst.slice(0, 3).map((m) => (
                              <div
                                key={m.opponentHero}
                                onClick={() => onSelectHeroToInspect(m.opponentHero)}
                                className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 hover:border-emerald-400 text-emerald-900 cursor-pointer flex items-center gap-1.5 text-[10px]"
                              >
                                <span className="font-bold">{m.opponentHero}</span>
                                <span className="text-[9px] font-semibold text-emerald-600">
                                  +{m.diff.toFixed(1)}% ({m.games} นัด)
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded border text-center">
                            ยังไม่มีข้อมูลสถิติยืนยันในฐานข้อมูลการแข่งขัน
                          </span>
                        )}
                      </div>

                      {/* Weak Against */}
                      <div className="flex flex-col gap-1 pt-1 border-t border-slate-100">
                        <span className="text-[10.5px] font-bold text-rose-700 flex items-center gap-1">
                          <TrendingDown size={11} />
                          <span>สถิติเสียเปรียบ (Weak Against):</span>
                        </span>
                        {analysis.inspectedMatchups.weakAgainst.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {analysis.inspectedMatchups.weakAgainst.slice(0, 3).map((m) => (
                              <div
                                key={m.opponentHero}
                                onClick={() => onSelectHeroToInspect(m.opponentHero)}
                                className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 hover:border-rose-400 text-rose-900 cursor-pointer flex items-center gap-1.5 text-[10px]"
                              >
                                <span className="font-bold">{m.opponentHero}</span>
                                <span className="text-[9px] font-semibold text-rose-600">
                                  {m.diff.toFixed(1)}% ({m.games} นัด)
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded border text-center">
                            ยังไม่มีข้อมูลสถิติยืนยันในฐานข้อมูลการแข่งขัน
                          </span>
                        )}
                      </div>

                      {/* Anticipated Enemy Responses */}
                      <div className="flex flex-col gap-1 pt-1 border-t border-slate-100">
                        <span className="text-[10.5px] font-bold text-slate-700 flex items-center gap-1">
                          <Target size={11} className="text-rose-500" />
                          <span>คู่แข่งอาจหยิบมาตอบโต้เรา (Anticipated Response):</span>
                        </span>
                        {anticipatedEnemyResponses.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {anticipatedEnemyResponses.map((item) => (
                              <div
                                key={item.opponentHero}
                                onClick={() => onSelectHeroToInspect(item.opponentHero)}
                                className="p-1.5 bg-slate-50 hover:bg-rose-50/60 border border-slate-200 hover:border-rose-300 rounded-lg cursor-pointer transition-all flex items-center justify-between gap-2"
                              >
                                <div className="flex items-center gap-2">
                                  <img
                                    src={getHeroImageUrl(item.opponentHero)}
                                    alt={item.opponentHero}
                                    className="w-7 h-7 rounded-md object-cover border border-slate-200 flex-shrink-0"
                                  />
                                  <div className="flex flex-col">
                                    <span className="font-bold text-xs text-slate-900">
                                      {item.opponentHero}
                                    </span>
                                    <span className="text-[9.5px] text-slate-500">
                                      {item.hero || 'ตัวแก้ทางที่มีสถิติข่ม'}
                                    </span>
                                  </div>
                                </div>
                                <span className="text-[9px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">
                                  ระวังโดนตัดทาง
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded border text-center">
                            ไม่มีเคาน์เตอร์รุนแรงในข้อมูลการแข่ง
                          </span>
                        )}
                        <span className="text-[8.5px] text-slate-400 italic text-center">
                          * ประเมินเชิงยุทธวิธีจากสถิติ RPL 2026 (ไม่ใช่การฟันธงล่วงหน้า)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* ========================================================= */}
        {/* SITUATION B: คู่แข่ง PICK ฮีโร่ (Counter Opponent)         */}
        {/* ========================================================= */}
        {situationalMode === 'counter_opp' && (
          <div className="flex flex-col gap-2.5">
            {/* Header & Opponent Hero Selection Pill */}
            <div className="p-2.5 bg-sky-50/60 border border-sky-200 rounded-xl flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                  <Crosshair size={14} className="text-[#0284C7]" />
                  <span>แก้ทางฮีโร่คู่แข่ง</span>
                </span>
                <span className="text-[10px] text-sky-700 font-semibold">
                  คู่แข่งเลือกแล้ว {oppLockedHeroes.length} ตัว
                </span>
              </div>

              {oppLockedHeroes.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-500 bg-white rounded-lg border border-sky-100">
                  คู่แข่งยังไม่ได้ล็อกฮีโร่ในกระดาน
                </div>
              ) : (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase flex-shrink-0">
                    เลือกตัวเพื่อดูตัวแก้:
                  </span>
                  {oppLockedHeroes.map((opp) => {
                    const isSelected = activeOppHero?.name.toLowerCase() === opp.name.toLowerCase();
                    return (
                      <button
                        key={opp.name}
                        type="button"
                        onClick={() => setSelectedOppHeroName(opp.name)}
                        className={`px-2 py-1 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0 ${
                          isSelected
                            ? 'bg-[#0284C7] text-white border-[#0369A1] shadow-2xs font-bold'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-sky-300'
                        }`}
                      >
                        <img
                          src={getHeroImageUrl(opp.name)}
                          alt={opp.name}
                          className="w-4 h-4 rounded-full object-cover"
                        />
                        <span className="text-xs">{opp.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Target Opponent Analysis */}
            {activeOppHero && (
              <div className="flex flex-col gap-2">
                <div className="p-2 bg-white border border-[#F3D5E2] rounded-xl shadow-2xs flex items-center gap-2">
                  <img
                    src={getHeroImageUrl(activeOppHero.name)}
                    alt={activeOppHero.name}
                    className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-xs text-slate-900">
                      เป้าหมาย: {activeOppHero.name} ({activeOppHero.primaryPos.toUpperCase()})
                    </span>
                    <span className="text-[10px] text-slate-500">
                      แนะนำตัวเลือกที่ทีมเราอาจหยิบตอบโต้ TOP 3
                    </span>
                  </div>
                </div>

                {/* Counter Recommendations */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-emerald-600" />
                    <span>ตัวตอบโต้ที่เข้ากับคอมพ์ทีมเรา (TOP 3):</span>
                  </span>

                  {counterPicksForOpponent.length > 0 ? (
                    <div className="flex flex-col gap-1.5">
                      {counterPicksForOpponent.map((c) => (
                        <div
                          key={c.heroName}
                          onClick={() => onSelectHeroToInspect(c.heroName)}
                          className="p-2 bg-white hover:bg-sky-50/50 border border-slate-200 hover:border-sky-300 rounded-xl transition-all cursor-pointer flex flex-col gap-1 shadow-2xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <img
                                src={getHeroImageUrl(c.heroName)}
                                alt={c.heroName}
                                className="w-8 h-8 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                              />
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1">
                                  <span className="font-bold text-xs text-slate-900">
                                    {c.heroName}
                                  </span>
                                  {c.fitsMissingRole && (
                                    <span className="text-[8.5px] font-bold px-1 rounded bg-emerald-100 text-emerald-800">
                                      ตรงตำแหน่งที่ขาด
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-emerald-700 font-semibold">
                                  อัตราข่ม +{c.diff.toFixed(1)}% (จาก {c.games} นัด)
                                </span>
                              </div>
                            </div>

                            <span className="text-[9.5px] font-bold text-[#0284C7] flex items-center gap-0.5">
                              <span>ดูแผน</span>
                              <ArrowRight size={10} />
                            </span>
                          </div>

                          {/* Player who can play this */}
                          <div className="pt-1 border-t border-slate-100 flex items-center gap-1 flex-wrap">
                            <span className="text-[9.5px] text-slate-500">นักแข่ง MCU:</span>
                            {c.badges.length > 0 ? (
                              c.badges.map((b) => (
                                <span
                                  key={b.playerId}
                                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                    b.tier === 'signature'
                                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                                      : 'bg-slate-100 text-slate-700 border-slate-300'
                                  }`}
                                >
                                  {b.tier === 'signature' ? '⭐' : '★'} {b.playerNickname}
                                </span>
                              ))
                            ) : (
                              <span className="text-[9px] text-slate-400 italic">ไม่มีในพูลหลัก</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-500 bg-white rounded-lg border">
                      ไม่มีสถิติเคาน์เตอร์โดยตรงในฐานข้อมูลการแข่งขัน — ให้พิจารณาตามตำแหน่งหน้าที่
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* SITUATION C: ฮีโร่คอมโบหลักถูก BAN (Banned Combos)         */}
        {/* ========================================================= */}
        {situationalMode === 'banned_combos' && (
          <div className="flex flex-col gap-2.5">
            <div className="p-2.5 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center justify-between">
              <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-600" />
                <span>คอมโบที่ได้รับผลกระทบจากการแบน</span>
              </span>
              <span className="text-[10px] text-amber-800 font-bold">
                {allBannedCombos.length} คอมโบ
              </span>
            </div>

            {allBannedCombos.length === 0 ? (
              <div className="p-6 text-center bg-white border border-[#F3D5E2] rounded-xl flex flex-col items-center gap-2">
                <span className="text-2xl">🛡️</span>
                <span className="font-bold text-xs text-slate-800">ยังไม่มีคอมโบหลักถูกแบน</span>
                <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs">
                  เมต้าคอมโบยอดนิยมของโปรลีก (RPL 2026) ยังคงมีสมาชิกหลักครบถ้วน สามารถวางแผนดราฟต์ได้ตามปกติ
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {allBannedCombos.map((item) => (
                  <div
                    key={item.comp.id}
                    className="p-2.5 bg-white border border-amber-200 rounded-xl shadow-2xs flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9.5px] font-bold px-1.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                            {item.comp.tier} Tier
                          </span>
                          <h4 className="font-bold text-xs text-slate-900">
                            {item.comp.nameTh}
                          </h4>
                        </div>
                        <p className="text-[10px] text-rose-700 font-semibold mt-1">
                          ⚠️ {item.impactDescription}
                        </p>
                      </div>
                    </div>

                    {/* Substitutes */}
                    {item.substitutes.length > 0 && (
                      <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-700">
                          ตัวเลือกทดแทนที่ยังว่าง (TOP 3):
                        </span>
                        {item.substitutes.map((subGroup) => (
                          <div key={subGroup.targetHero} className="flex flex-col gap-1">
                            {subGroup.options.map((opt) => (
                              <div
                                key={opt.substitute}
                                onClick={() => onSelectHeroToInspect(opt.substitute)}
                                className="p-1.5 bg-slate-50 hover:bg-[#FFF0F5] border border-slate-200 hover:border-[#E91E63] rounded-lg transition-all cursor-pointer flex flex-col gap-0.5"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-xs text-slate-900 flex items-center gap-1">
                                    <span>➔ แทน {subGroup.targetHero} ด้วย</span>
                                    <span className="text-[#E91E63] underline">{opt.substitute}</span>
                                    <span className="text-[9.5px] font-normal text-slate-500">({opt.role})</span>
                                  </span>
                                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-200">
                                    {opt.effectiveness}
                                  </span>
                                </div>
                                <p className="text-[9.5px] text-slate-600 leading-snug">
                                  <span className="font-semibold text-slate-800">ข้อแลกเปลี่ยน:</span> {opt.tradeOff}
                                </p>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* SITUATION D: อยู่ในช่วง BAN (Smart Ban Advisor)             */}
        {/* ========================================================= */}
        {situationalMode === 'smart_ban' && (
          <div className="flex flex-col gap-2.5">
            <div className="p-2.5 bg-rose-50/60 border border-rose-200 rounded-xl flex items-center justify-between">
              <span className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                <Ban size={14} className="text-rose-600" />
                <span>คำแนะนำในการ BAN (Smart Ban Advisor)</span>
              </span>
              <span className="text-[10px] text-rose-800 font-bold">
                {availableSmartBans.length} ตัวเลือก
              </span>
            </div>

            <p className="text-[10.5px] text-slate-500 leading-relaxed px-0.5">
              คัดกรองฮีโร่อันตรายสูง ตัวถนัดของคู่แข่ง และตัวตัดคอมพ์ทีมเรา (ไม่ปะปนกับคำแนะนำ Pick):
            </p>

            <div className="flex flex-col gap-1.5">
              {availableSmartBans.map((banItem) => {
                const isMustBan = banItem.priority === 'must_ban';
                return (
                  <div
                    key={banItem.hero.name}
                    className={`p-2.5 rounded-xl border flex flex-col gap-1.5 transition-all shadow-2xs ${
                      isMustBan
                        ? 'bg-rose-50/40 border-rose-300'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div
                        onClick={() => onSelectHeroToInspect(banItem.hero.name)}
                        className="flex items-center gap-2 min-w-0 cursor-pointer group"
                      >
                        <img
                          src={getHeroImageUrl(banItem.hero.name)}
                          alt={banItem.hero.name}
                          className="w-9 h-9 rounded-lg object-cover border border-slate-200 flex-shrink-0 group-hover:scale-105 transition-transform"
                        />
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-xs text-slate-900 group-hover:text-rose-600">
                              {banItem.hero.name}
                            </span>
                            <span className="text-[9px] font-bold px-1 rounded bg-slate-100 text-slate-600 uppercase">
                              {banItem.targetRole || banItem.hero.primaryPos}
                            </span>
                          </div>
                          <span className="text-[9.5px] text-slate-500 truncate">
                            {banItem.categoryLabel}
                          </span>
                        </div>
                      </div>

                      {/* Confirm Ban Button */}
                      {onPickHeroDirectly && (
                        <button
                          type="button"
                          onClick={() => onPickHeroDirectly(banItem.hero)}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1 flex-shrink-0 active:scale-95"
                          title={`ยืนยันการแบน ${banItem.hero.name}`}
                        >
                          <Ban size={11} />
                          <span>แบนตัวนี้</span>
                        </button>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-700 bg-white/80 p-1.5 rounded-md border border-slate-200/60 leading-relaxed">
                      <span className="font-bold text-rose-700">เหตุผล:</span> {banItem.reason}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. Footer Bar */}
      <div className="px-3 py-1.5 bg-[#FFF8FB] border-t border-[#F3D5E2] flex items-center justify-between text-[10px] text-slate-500 flex-shrink-0">
        <span className="flex items-center gap-1 truncate">
          <Info size={11} className="text-[#E91E63]" />
          <span>ข้อมูล RoV Pro League 2026 & Scrim</span>
        </span>
        <span className="font-bold text-slate-700 flex-shrink-0">
          MCU ESPORTS
        </span>
      </div>
    </aside>
  );
};
