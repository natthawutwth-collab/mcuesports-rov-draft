import React, { useState, useMemo } from 'react';
import { Hero } from '../types/draft';
import { Player, HeroPlayerBadge } from '../types/player';
import { PickSlotState } from '../hooks/useDraconmindDraft';
import {
  analyzeCoachDraft,
  CoachAnalysisResult,
  getHeroCompRoles,
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
} from 'lucide-react';

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

// Known tactical substitutes mapping for key meta heroes if banned
const META_SUBSTITUTE_GUIDE: Record<string, Array<{ substitute: string; role: string; tradeOff: string }>> = {
  'Capheny': [
    { substitute: 'Hayate', role: 'ADL Carry', tradeOff: 'มีดาเมจจริงและเคลื่อนที่คล่องตัวสูงกว่า แต่เคลียร์เวฟและเบิร์สช่วงต้นเกมช้ากว่า Capheny' },
    { substitute: 'Violet', role: 'ADL Carry', tradeOff: 'เน้นยิงโป๊กเบิร์สระยะไกลได้ดี แต่การทำดาเมจ DPS ต่อเนื่องในไฟต์ยาวจะต่ำกว่า' },
    { substitute: 'Laville', role: 'ADL Carry', tradeOff: 'มีสตันเปิดแมพและยิงรัวกวาดไฟต์ได้ แต่ขาดความคล่องตัว ต้องอาศัยซัพพอร์ตคอยคุ้มกัน' },
  ],
  'TeeMee': [
    { substitute: 'Helen', role: 'Support / Roam', tradeOff: 'ฟื้นฟูเลือดและบัฟเกราะให้ทีมได้อย่างต่อเนื่อง แต่ไม่มี Passive เร่งเงินและไม่มีอัลติชุบชีวิต' },
    { substitute: 'Zip', role: 'Support / Roam', tradeOff: 'อมเพื่อนเซฟจังหวะโดนจับได้ดีมากและดูดมินเนียนได้ แต่ไม่สามารถเพิ่มอัตราการเงินให้แครี่ได้' },
    { substitute: 'Xeniel', role: 'Support / Roam', tradeOff: 'เปิดวาปร์ลงมาเติมไฟต์ได้ทุกที่และมีดาเมจเวท แต่การคุ้มกันแครี่ในเลนช่วงต้นเกมจำกัดกว่า' },
  ],
  'Rouie': [
    { substitute: 'Zip', role: 'Support / Roam', tradeOff: 'เซฟเพื่อนและย้ายตำแหน่งไฟต์ได้ดี แต่ไม่สามารถวาร์ปส่งทั้งทีมกลับบ่อเพื่อเติมเลือดเต็มได้' },
    { substitute: 'Xeniel', role: 'Support / Roam', tradeOff: 'มีจังหวะเติมไฟต์ระดับ Global แต่ไม่สามารถเปิดประตูเรียกเพื่อนมารุมเลนได้เหมือน Rouie' },
  ],
  'Eland\'orr': [
    { substitute: 'Nakroth', role: 'Jungle Assassin', tradeOff: 'ฟาร์มไว สปลิทพุชแยกดันยอดเยี่ยม แต่เป็นโจมตีระยะประชิด เสี่ยงโดน CC มากกว่าตัวยิงไกล' },
    { substitute: 'Aoi', role: 'Jungle Assassin', tradeOff: 'โหนสลิงล้วงตัวบางแนวหลังได้เด็ดขาด แต่การยืนยิงดึงจังหวะจากระยะปลอดภัยทำได้ยากกว่า' },
  ],
  'Aya': [
    { substitute: 'Helen', role: 'Support / Roam', tradeOff: 'ฮีลเพื่อนรอบตัวได้ดี แต่ไม่สามารถสิงร่างเพื่อเป็นอมตะได้ ตกเป็นเป้าหมายถูกจับตายได้' },
    { substitute: 'Alice', role: 'Support / Roam', tradeOff: 'กางวงสโลว์ใบ้ศัตรูและบัฟสปีดได้ดี แต่ไม่มีการสิงร่างเกาะติดไฟต์เลนหน้าแบบ Aya' },
  ],
  'Taara': [
    { substitute: 'Skud', role: 'Dark Slayer Lane', tradeOff: 'มีเลือดมหาศาลและหมัดเบิร์สหนักมาก แต่ไม่มีรีเจนเลือดต่อเนื่องแบบไร้มานาของ Taara' },
    { substitute: 'Maloch', role: 'Dark Slayer Lane', tradeOff: 'มีดาเมจจริงวงกว้างและเปิดอัลติลงกลางวงได้ดี แต่การสปลิทดันเลนและหนีเอาตัวรอดช้ากว่า' },
  ],
  'Liliana': [
    { substitute: 'Krixi', role: 'Mid Lane Mage', tradeOff: 'สตันยกและเบิร์สชุดเดียวแรงมาก แต่ไม่มีสกิลแดชพุ่งหนี 2 จังหวะแบบร่างจิ้งจอกของ Liliana' },
    { substitute: 'Yue', role: 'Mid Lane Mage', tradeOff: 'ระยะสกิลไกลและดาเมจรุนแรงมาก แต่ขาดความคล่องตัวอย่างสิ้นเชิงเมื่อโดนแอสซาสซินประชิดตัว' },
  ],
  'Keera': [
    { substitute: 'Paine', role: 'Jungle Assassin', tradeOff: 'เบิร์สเวทได้รวดเร็วและใบ้ศัตรูได้ดี แต่ไม่มีอัลติมุดกำแพงหนีเอาตัวรอดแบบ Keera' },
    { substitute: 'Kaine', role: 'Jungle Assassin', tradeOff: 'ล่องหนเปิดวิสัยทัศน์และสเต็ปล้วงเดี่ยวได้เร็ว แต่เป็นดาเมจกายภาพ แก้ทางแทงค์หนาได้ยากกว่า' },
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

  // Target hero object
  const currentHero = useMemo(() => {
    if (!heroName) return null;
    return allHeroes.find((h) => h.name.toLowerCase() === heroName.toLowerCase()) || null;
  }, [heroName, allHeroes]);

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

  // Determine hero status
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

  // 1. Synergies & Meta Comps
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
      substitutes: Array<{ substitute: string; role: string; tradeOff: string }>;
    }> = [];

    heroMetaComps.forEach((comp) => {
      comp.coreHeroes.forEach((partner) => {
        if (partner.toLowerCase() !== currentHero.name.toLowerCase()) {
          const isBanned = bannedHeroNames.has(partner);
          const isEnemyPicked = (activeTurnTeam === 'blue' ? redPicks : bluePicks).some(
            (p) => p.hero?.name.toLowerCase() === partner.toLowerCase()
          );

          if ((isBanned || isEnemyPicked) && META_SUBSTITUTE_GUIDE[partner]) {
            subs.push({
              bannedPartner: partner,
              compName: comp.nameTh,
              substitutes: META_SUBSTITUTE_GUIDE[partner],
            });
          }
        }
      });
    });

    return subs;
  }, [currentHero, heroMetaComps, bannedHeroNames, activeTurnTeam, redPicks, bluePicks]);

  // 2. Opponent Counters & Anticipated Responses
  const oppLockedHeroes = useMemo(() => {
    const oppPicks = activeTurnTeam === 'blue' ? redPicks : bluePicks;
    return oppPicks.map((p) => p.hero).filter((h): h is Hero => h !== null);
  }, [activeTurnTeam, bluePicks, redPicks]);

  // What opponent might respond with against current hero
  const anticipatedEnemyResponses = useMemo(() => {
    if (!currentHero) return [];
    const matchups = statsDataProvider.getHeroMatchups(currentHero.name);
    if (!matchups) return [];
    // Opponent would want to pick heroes that currentHero is weak against
    return [...matchups.weakAgainst]
      .filter((m) => !bannedHeroNames.has(m.opponentHero) && !pickedHeroNames.has(m.opponentHero))
      .sort((a, b) => a.diff - b.diff)
      .slice(0, 3);
  }, [currentHero, bannedHeroNames, pickedHeroNames]);

  // If opponent has picked heroes, how does current hero matchup against them?
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

  // 3. Player Comfort for this hero
  const mcuPlayersForHero = useMemo(() => {
    if (!currentHero) return [];
    const rawBadges = heroToPlayersMap[currentHero.name] || [];
    return rawBadges;
  }, [currentHero, heroToPlayersMap]);

  return (
    <aside
      className="w-full h-full flex flex-col bg-white border-2 border-[#F3D5E2] rounded-2xl shadow-xl overflow-hidden transition-all text-[#1F2937] font-['Prompt'] select-none min-h-0"
      aria-label="Unified Draft Assistant"
    >
      {/* 1. Assistant Top Header */}
      <div className="px-3 py-2.5 bg-gradient-to-r from-[#FFF0F5] to-white border-b-2 border-[#F3D5E2] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#E91E63] to-[#C2185B] text-white flex items-center justify-center shadow-xs flex-shrink-0">
            <Sparkles size={14} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-['Prompt'] font-bold text-xs text-[#1F2937] flex items-center gap-1.5 uppercase leading-tight">
              <span>DRAFT ASSISTANT</span>
              <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-[#E91E63] text-white">PRO</span>
            </span>
            <span className="text-[10px] text-slate-500 font-medium leading-tight truncate">
              {activeTurnTeam === 'blue' ? (blueTeamName || 'Blue Team') : (redTeamName || 'Red Team')} • {isBanTurn ? 'แบนฮีโร่' : 'เลือกฮีโร่'}
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

      {/* 2. Scrollable Body: Single Unified Content Stream */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2.5 sm:p-3 flex flex-col gap-2.5 bg-[#FFF8FB]/30">
        {/* CASE 1: No Hero Selected (Default Situation Overview) */}
        {!currentHero ? (
          <div className="flex flex-col gap-3 py-2">
            <div className="p-3 bg-white border border-[#F3D5E2] rounded-xl shadow-2xs text-center">
              <span className="text-2xl mb-1 block">🎯</span>
              <h4 className="font-bold text-xs text-slate-800">คลิกเลือกฮีโร่ในกระดานเพื่อวิเคราะห์ทันที</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                คลิกที่ฮีโร่ใดก็ได้เพื่อดูคอมโบหลัก, ตัวแก้ทางคู่แข่ง, ตัวทดแทนเมื่อโดนแบน, และความถนัดของนักแข่ง MCU ในหน้าต่างเดียวนี้
              </p>
            </div>

            {/* Quick Draft Status */}
            <div className="p-2.5 bg-white border border-[#F3D5E2] rounded-xl shadow-2xs flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <Target size={12} className="text-[#E91E63]" />
                  <span>ตำแหน่งที่ทีมยังขาด</span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {analysis.myTeamComp.missingRoles.length > 0 ? `${analysis.myTeamComp.missingRoles.length} ตำแหน่ง` : 'ครบ 5 ตำแหน่งแล้ว'}
                </span>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {analysis.myTeamComp.missingRoles.length > 0 ? (
                  analysis.myTeamComp.missingRoles.map((role) => (
                    <span
                      key={role}
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs uppercase"
                    >
                      {role}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    <span>ทีมมีฮีโร่ครบทั้ง 5 ตำแหน่งแล้ว</span>
                  </span>
                )}
              </div>
            </div>

            {/* Top Recommended Picks for current turn */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <Flame size={12} className="text-amber-500" />
                <span>ฮีโร่แนะนำเร่งด่วนสำหรับเทิร์นนี้</span>
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
                        className="w-9 h-9 rounded-lg object-cover border border-slate-200 group-hover:scale-105 transition-transform flex-shrink-0"
                      />
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-xs text-slate-900 truncate group-hover:text-[#E91E63]">
                            {item.hero.name}
                          </span>
                          <span className="text-[9px] font-bold px-1 rounded bg-slate-100 text-slate-600 uppercase">
                            {item.targetRole}
                          </span>
                        </div>
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
          /* CASE 2: Hero Inspected (Full 5-Part Intelligence) */
          <>
            {/* HERO PROFILE CARD (Inspected Hero) */}
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

                    {/* Status Badge */}
                    {heroStatus && (
                      <div className="mt-1">
                        <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border shadow-2xs ${heroStatus.color}`}>
                          {heroStatus.label}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Confirmed Selection Action Button (Pick/Ban for current turn) */}
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

            {/* SECTION 1: ผู้เล่นและความถนัด (MCU Player Comfort) */}
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
                      <span>ยังไม่มีนักแข่งในไลน์อัปตั้งค่า {currentHero.name} เป็นตัวถนัดหลัก</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SECTION 2: คอมโบและตัวเล่นคู่ (Synergies & Meta Comps + Substitutes) */}
            <div className="bg-white border border-[#F3D5E2] rounded-xl overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => toggleSection('combos')}
                className="w-full px-2.5 py-1.5 bg-[#FFF0F5] border-b border-[#F3D5E2] flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-[#E91E63]">
                  <Layers size={13} />
                  <span>คอมโบหลักและตัวเล่นคู่ (TOP 3)</span>
                </div>
                {openSections.combos ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
              </button>

              {openSections.combos && (
                <div className="p-2.5 flex flex-col gap-2.5">
                  {/* Meta Comps Context */}
                  {heroMetaComps.length > 0 && (
                    <div className="p-2 bg-gradient-to-r from-amber-50/80 to-pink-50/50 border border-amber-200 rounded-lg">
                      <span className="text-[10px] font-bold text-amber-900 uppercase flex items-center gap-1 mb-1">
                        <span>🏆</span>
                        <span>คอมโบการแข่งระดับโปร (RPL 2026 Meta Comp)</span>
                      </span>
                      <p className="font-bold text-xs text-slate-900">
                        {heroMetaComps[0].nameTh}
                      </p>
                      <p className="text-[10.5px] text-slate-600 mt-0.5 leading-relaxed">
                        {heroMetaComps[0].tacticalDescription}
                      </p>
                    </div>
                  )}

                  {/* Top 3 Synergy Partners */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10.5px] font-bold text-slate-600">
                      ฮีโร่ที่สถิติเล่นคู่กันแล้วได้เปรียบสูงสุด:
                    </span>
                    {topPartners.length > 0 ? (
                      <div className="grid grid-cols-1 gap-1.5">
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
                                    {item.hero || 'เข้าขากันในทีมไฟต์'}
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
                  </div>

                  {/* BANNED PARTNER SUBSTITUTES (เมื่อตัวคอมโบหลักโดนแบน) */}
                  {partnerSubstitutes.length > 0 && (
                    <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-lg flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 text-rose-900 font-bold text-[11px]">
                        <AlertTriangle size={13} className="text-rose-600 flex-shrink-0" />
                        <span>ตัวเล่นคู่หลักโดนแบน/เลือกตัดหน้า ➔ ตัวเลือกทดแทน</span>
                      </div>

                      {partnerSubstitutes.map((subItem) => (
                        <div key={subItem.bannedPartner} className="flex flex-col gap-1 mt-1">
                          <span className="text-[10px] font-bold text-rose-800">
                            เมื่อ {subItem.bannedPartner} ไม่ว่าง (จาก {subItem.compName}):
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

            {/* SECTION 3: วิเคราะห์คู่แข่ง (Counter Picks & Anticipated Enemy Responses) */}
            <div className="bg-white border border-[#F3D5E2] rounded-xl overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => toggleSection('opponent')}
                className="w-full px-2.5 py-1.5 bg-[#FFF0F5] border-b border-[#F3D5E2] flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-[#E91E63]">
                  <Swords size={13} />
                  <span>วิเคราะห์คู่แข่งและการตอบโต้</span>
                </div>
                {openSections.opponent ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
              </button>

              {openSections.opponent && (
                <div className="p-2.5 flex flex-col gap-2.5">
                  {/* Matchup with Enemy's locked heroes */}
                  {matchupAgainstOpponentPicks.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10.5px] font-bold text-slate-700">
                        เทียบกับฮีโร่ที่คู่แข่งเลือกไปแล้ว:
                      </span>
                      <div className="flex flex-col gap-1">
                        {matchupAgainstOpponentPicks.map((m) => (
                          <div
                            key={m.oppHero.name}
                            className={`p-1.5 rounded-lg border flex items-center justify-between gap-2 ${
                              m.isAdvantage
                                ? 'bg-emerald-50/60 border-emerald-200'
                                : m.isDisadvantage
                                ? 'bg-rose-50/60 border-rose-200'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <img
                                src={getHeroImageUrl(m.oppHero.name)}
                                alt={m.oppHero.name}
                                className="w-7 h-7 rounded-md object-cover border border-slate-200 flex-shrink-0"
                              />
                              <div className="flex flex-col">
                                <span className="font-bold text-xs text-slate-800">
                                  vs {m.oppHero.name}
                                </span>
                                <span className="text-[9.5px] text-slate-500">
                                  {m.isAdvantage ? 'ได้เปรียบ / ข่มเลน' : m.isDisadvantage ? 'เสียเปรียบ / ต้องระวัง' : 'สูสีตามรูปเกม'}
                                </span>
                              </div>
                            </div>

                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                m.isAdvantage
                                  ? 'text-emerald-700 bg-emerald-100'
                                  : m.isDisadvantage
                                  ? 'text-rose-700 bg-rose-100'
                                  : 'text-slate-600 bg-slate-100'
                              }`}
                            >
                              {m.matchup ? `${m.matchup.diff > 0 ? '+' : ''}${m.matchup.diff.toFixed(1)}%` : 'ประเมินเชิงสกิล'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Anticipated Enemy Response (ถ้าเราเลือกตัวนี้ คู่แข่งอาจหยิบอะไรต่อ) */}
                  <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-100">
                    <span className="text-[10.5px] font-bold text-slate-700 flex items-center gap-1">
                      <Target size={11} className="text-rose-500" />
                      <span>คู่แข่งอาจหยิบอะไรตอบโต้ {currentHero.name} (TOP 3):</span>
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

                            <span className="text-[9.5px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">
                              ระวังโดนตัดทาง
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10.5px] text-slate-500 bg-slate-50 p-2 rounded-lg border text-center">
                        ไม่มีสถิติเคาน์เตอร์รุนแรงในข้อมูลการแข่ง
                      </span>
                    )}

                    <span className="text-[9px] text-slate-400 mt-0.5 italic text-center">
                      * ประเมินเชิงยุทธวิธีและสถิติ RoV Pro League (ไม่ใช่การฟันธงล่วงหน้า)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 4: วิเคราะห์ Counter (Matchups ชนะทาง/แพ้ทาง เชิงสถิติ) */}
            <div className="bg-white border border-[#F3D5E2] rounded-xl overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => toggleSection('counters')}
                className="w-full px-2.5 py-1.5 bg-[#FFF0F5] border-b border-[#F3D5E2] flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-[#E91E63]">
                  <TrendingUp size={13} />
                  <span>สถิติ Matchup ชนะทาง / เสียเปรียบ</span>
                </div>
                {openSections.counters ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
              </button>

              {openSections.counters && (
                <div className="p-2.5 flex flex-col gap-2">
                  {/* Strong Against */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10.5px] font-bold text-emerald-700 flex items-center gap-1">
                      <TrendingUp size={11} />
                      <span>สถิติชนะทาง (Strong Against):</span>
                    </span>
                    {analysis.inspectedMatchups.strongAgainst.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {analysis.inspectedMatchups.strongAgainst.slice(0, 4).map((m) => (
                          <div
                            key={m.opponentHero}
                            onClick={() => onSelectHeroToInspect(m.opponentHero)}
                            className="px-2 py-1 rounded-md bg-emerald-50 border border-emerald-200 hover:border-emerald-400 text-emerald-900 cursor-pointer flex items-center gap-1.5 text-[10.5px]"
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
                        ยังไม่มีข้อมูลตัวอย่างเพียงพอในทัวร์นาเมนต์
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
                        {analysis.inspectedMatchups.weakAgainst.slice(0, 4).map((m) => (
                          <div
                            key={m.opponentHero}
                            onClick={() => onSelectHeroToInspect(m.opponentHero)}
                            className="px-2 py-1 rounded-md bg-rose-50 border border-rose-200 hover:border-rose-400 text-rose-900 cursor-pointer flex items-center gap-1.5 text-[10.5px]"
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
                        ยังไม่มีข้อมูลตัวอย่างเพียงพอในทัวร์นาเมนต์
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* 3. Footer Status Bar */}
      <div className="px-3 py-2 bg-[#FFF8FB] border-t border-[#F3D5E2] flex items-center justify-between text-[10px] text-slate-500 flex-shrink-0">
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
