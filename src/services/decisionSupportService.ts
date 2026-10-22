import { Hero } from '../types/draft';
import { Player, HeroPlayerBadge, PlayerPosition } from '../types/player';
import { PickSlotState } from '../hooks/useDraconmindDraft';
import { statsDataProvider } from './statsDataProvider';
import { RPL_2026_PRO_COMPS, ProMetaComp } from '../data/proMetaComps';
import { mapToCompRole, CompRoleKey } from './coachAnalysisService';

// =========================================================================
// 1. DRAFT SAFETY CHECK (Phase P2 Comprehensive)
// =========================================================================
export interface DraftSafetyItem {
  id: string;
  type: 'role' | 'damage' | 'frontline' | 'cc' | 'engage' | 'backline' | 'timing' | 'player_comfort' | 'enemy_vulnerability';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  detail: string;
  suggestion: string;
}

export interface DraftSafetyReport {
  status: 'safe' | 'caution' | 'critical';
  summaryBadge: string;
  topWarnings: DraftSafetyItem[]; // Strictly max 3 top critical items
  allWarningsCount: number;
  // 4 Core Dimensions of Phase P2:
  roleCoverage: {
    rolesCovered: string[];
    missingRoles: string[];
    roleClashes: Array<{ role: string; heroes: string[] }>;
    playerRoleMatchIssues: string[];
  };
  teamComposition: {
    hasEngage: boolean;
    engageDetails: string;
    hasBacklineDive: boolean;
    backlineDiveDetails: string;
    hasHardCc: boolean;
    hardCcDetails: string;
    hasFrontline: boolean;
    frontlineDetails: string;
    damageBalance: {
      physical: number;
      magic: number;
      trueDmg: number;
      summary: string;
    };
    alternativeToolsNote?: string;
  };
  gameTiming: {
    powerSpike: 'Early Game (0-4m)' | 'Mid Game (4-10m)' | 'Late Game (10m+)' | 'Balanced Tempo';
    powerSpikeDetails: string;
    timingVulnerability: string;
    lateGameViability: string;
  };
  winCondition: {
    primaryType: 'Engage & 5v5 Teamfight' | 'Pick-off & Ambush' | 'Poke & Siege' | 'Protect Hyper-Carry' | 'Scaling & Split-Push' | 'Flexible Standard';
    headline: string;
    keySuccessConditions: string[];
  };
  disclaimer: string;
}

// =========================================================================
// 2. ENEMY THREAT ANALYSIS (Phase P2 Comprehensive)
// =========================================================================
export interface EnemyThreatItem {
  type: 'dive' | 'lockdown' | 'poke' | 'anti_tank' | 'split' | 'sustain';
  title: string;
  heroes: string[];
  dangerLevel: 'high' | 'medium';
  opponentStrength: string;
  impactOnOurTeam: string;
  endangeredAllies: string[];
  tacticalAdvice: string;
}

export interface ThreatActionableResponse {
  topResponseHero: {
    hero: Hero;
    reason: string;
    fitsRole: string;
  } | null;
  alternativeHeroes: Array<{
    hero: Hero;
    reason: string;
  }>;
  comboAndPlanImpact: string;
  bestFitPlayers: Array<{
    playerId: string;
    nickname: string;
    playerName: string;
    tier: 'signature' | 'comfortable';
    tierLabel: string;
    starColor: 'gold' | 'silver';
    playerRole: string;
  }>;
  residualRisks: string[];
}

export interface AnticipatedEnemyPick {
  role: string;
  likelyHeroes: string[];
  tacticalReason: string;
  sourceNote: string;
}

export interface EnemyThreatReport {
  oppTeamName: string;
  lockedOppCount: number;
  threats: EnemyThreatItem[];
  opponentPlanAssessment: {
    planType: string;
    confidence: 'high' | 'medium' | 'insufficient_data';
    description: string;
    note: string;
  };
  recommendedCounterStyle: string;
  actionableResponse: ThreatActionableResponse;
  anticipatedPicks: AnticipatedEnemyPick[];
  threatBans: Array<{
    heroName: string;
    reason: string;
    priority: 'must_ban' | 'high_priority';
  }>;
  dataSourceNote: string;
}

// =========================================================================
// 3. TEAM IDENTITY ANALYSIS
// =========================================================================
export type TeamIdentityType =
  | 'wombo_dive'
  | 'front_to_back'
  | 'poke_siege'
  | 'protect_carry'
  | 'pickoff_ambush'
  | 'split_macro'
  | 'balanced_flex';

export interface TeamIdentityReport {
  identityType: TeamIdentityType;
  title: string;
  description: string;
  keyStrengths: string[];
  powerSpike: string;
  verifiedSource: string;
  inspectedHeroAlignment?: {
    heroName: string;
    alignment: 'reinforces' | 'clashes' | 'neutral';
    headline: string;
    reason: string;
    tacticalNote: string;
  };
}

// =========================================================================
// 4. PLAYER FIT EVALUATION (Phase P1)
// =========================================================================
export interface PlayerFitEntry {
  playerId: string;
  playerName: string;
  nickname: string;
  playerRole: PlayerPosition;
  heroPosition: string;
  tier: 'signature' | 'comfortable';
  tierLabel: string;
  starColor: 'gold' | 'silver';
  roleFit: 'on_role' | 'flex_role';
  roleFitDescription: string;
}

export interface PlayerFitReport {
  heroName: string;
  hasComfortData: boolean;
  bestFitPlayer: {
    player: PlayerFitEntry;
    recommendationReason: string;
  } | null;
  otherPlayers: PlayerFitEntry[];
  allPlayersWithHero: PlayerFitEntry[];
  warningNotice?: string;
  provenance: string;
}

// =========================================================================
// 5. COMBO FALLBACK SYSTEM (Phase P1)
// =========================================================================
export interface TacticalSubstituteDefinition {
  substitute: string;
  role: string;
  effectiveness: string;
  tradeOff: string;
  isVerifiedSubstitute: boolean;
  planCompatibility: string;
}

export interface ComboFallbackSubstituteOption {
  substituteHero: string;
  role: string;
  effectiveness: string;
  tradeOff: string;
  isVerifiedSubstitute: boolean;
  planCompatibility: string;
  playersWhoPlay: Array<{
    playerId: string;
    nickname: string;
    playerName: string;
    tier: 'signature' | 'comfortable';
    tierLabel: string;
    starColor: 'gold' | 'silver';
    playerRole: string;
  }>;
}

export interface ComboFallbackReportItem {
  compId: string;
  compName: string;
  compNameTh: string;
  compTier: string;
  bannedOrUnavailableHero: string;
  status: 'banned' | 'picked_by_opp' | 'picked_by_us';
  impactDescription: string;
  intactHeroes: string[];
  substitutes: ComboFallbackSubstituteOption[];
}

export const META_SUBSTITUTE_GUIDE: Record<string, TacticalSubstituteDefinition[]> = {
  'Capheny': [
    {
      substitute: 'Hayate',
      role: 'ADL Carry',
      effectiveness: 'ทดแทนได้ ~88% (Heuristic Role Fit)',
      tradeOff: 'มีดาเมจจริงและคล่องตัวสูงกว่า แต่การเคลียร์เวฟและเบิร์สต้นเกมช้ากว่า',
      isVerifiedSubstitute: true,
      planCompatibility: 'คงแผนยิงต่อเนื่องในไฟต์ยาวได้ดีมาก แต่ต้องระวังจังหวะโดนกดดันเลนช่วง 3 นาทีแรก',
    },
    {
      substitute: 'Violet',
      role: 'ADL Carry',
      effectiveness: 'ทดแทนได้ ~82% (Heuristic Role Fit)',
      tradeOff: 'เน้นยิงโป๊กเบิร์สระยะไกลได้ดีมาก แต่การทำดาเมจ DPS ต่อเนื่องในไฟต์ยาวจะต่ำกว่า',
      isVerifiedSubstitute: true,
      planCompatibility: 'ปรับแผนเป็น Poke & Siege ได้อย่างสมบูรณ์แบบ',
    },
    {
      substitute: 'Laville',
      role: 'ADL Carry',
      effectiveness: 'ทดแทนได้ ~78% (Heuristic Role Fit)',
      tradeOff: 'มีสตันเปิดแมพและยิงรัวกวาดไฟต์ได้ แต่ขาดความคล่องตัว ต้องอาศัยซัพพอร์ตคอยคุ้มกัน',
      isVerifiedSubstitute: true,
      planCompatibility: 'ยังคงเน้นการไฟต์กลุ่ม 5v5 ได้ แต่ต้องให้แทงค์ยืนค้ำหน้าอย่างเข้มงวด',
    },
    {
      substitute: 'Slimz',
      role: 'ADL Carry',
      effectiveness: 'ทางเลือกที่ต้องพิจารณา',
      tradeOff: 'มีหอกสตันระยะไกลและดาเมจเปอร์เซ็นต์เลือด แต่ต้องใช้เวลาฟาร์มช้ากว่า Capheny',
      isVerifiedSubstitute: false,
      planCompatibility: 'ต้องยืดระยะเวลาเกมไปถึงนาทีที่ 12+ ถึงจะแสดงประสิทธิภาพสูงสุด',
    },
  ],
  'TeeMee': [
    {
      substitute: 'Helen',
      role: 'Support / Roam',
      effectiveness: 'ทดแทนได้ ~85% (Heuristic Role Fit)',
      tradeOff: 'ฟื้นฟูเลือดและบัฟเกราะให้ทีมได้อย่างต่อเนื่อง แต่ไม่มี Passive เร่งเงินและไม่มีอัลติชุบชีวิต',
      isVerifiedSubstitute: true,
      planCompatibility: 'สามารถดูแลแครี่ในเลนได้ดีมาก แต่ทีมจะไม่มียอดเงินนำเร็วเหมือนคอมโบ TeeMee',
    },
    {
      substitute: 'Zip',
      role: 'Support / Roam',
      effectiveness: 'ทดแทนได้ ~82% (Heuristic Role Fit)',
      tradeOff: 'อมเพื่อนเซฟจังหวะโดนจับได้ดีมากและดูดมินเนียนได้ แต่ไม่สามารถเร่งอัตราการเงินให้แครี่ได้',
      isVerifiedSubstitute: true,
      planCompatibility: 'เปลี่ยนจังหวะจากการเร่งเงิน เป็นการคุมจังหวะเวฟและการดักล้วง',
    },
    {
      substitute: 'Xeniel',
      role: 'Support / Roam',
      effectiveness: 'ทดแทนได้ ~75% (Heuristic Role Fit)',
      tradeOff: 'เปิดวาปร์ลงมาเติมไฟต์ได้ทุกที่และมีดาเมจเวท แต่การคุ้มกันแครี่ในเลนช่วงต้นเกมจำกัดกว่า',
      isVerifiedSubstitute: true,
      planCompatibility: 'เปลี่ยนเป็นแผน Global Presence เติมไฟต์ 2 เลนพร้อมกัน',
    },
  ],
  'Rouie': [
    {
      substitute: 'Zip',
      role: 'Support / Roam',
      effectiveness: 'ทดแทนได้ ~86% (Heuristic Role Fit)',
      tradeOff: 'เซฟเพื่อนและย้ายตำแหน่งไฟต์ได้ดี แต่ไม่สามารถวาร์ปส่งทั้งทีมกลับบ่อเพื่อเติมเลือดเต็มได้',
      isVerifiedSubstitute: true,
      planCompatibility: 'ยังคงรักษาการเคลื่อนที่เร็วและเซฟเพื่อนได้ แต่รีเซ็ตเลือดทั้งทีมไม่ได้',
    },
    {
      substitute: 'Xeniel',
      role: 'Support / Roam',
      effectiveness: 'ทดแทนได้ ~80% (Heuristic Role Fit)',
      tradeOff: 'มีจังหวะเติมไฟต์ระดับ Global แต่ไม่สามารถเปิดประตูเรียกเพื่อนมารุมเลนได้เหมือน Rouie',
      isVerifiedSubstitute: true,
      planCompatibility: 'เล่นแผนแยกดัน 1-4 แล้ววาร์ปอัลติลงมาเติมไฟต์',
    },
    {
      substitute: 'Teeri',
      role: 'Flex Roam',
      effectiveness: 'ทางเลือกที่ต้องพิจารณา',
      tradeOff: 'มีวิสัยทัศน์เปิดแมพ แต่ขาดมิติการเคลื่อนย้ายทีมไฟต์',
      isVerifiedSubstitute: false,
      planCompatibility: 'เน้นการเปิดแมพชะลอไฟต์แทนการวาร์ปข้ามเลน',
    },
  ],
  'Eland\'orr': [
    {
      substitute: 'Nakroth',
      role: 'Jungle Assassin',
      effectiveness: 'ทดแทนได้ ~84% (Heuristic Role Fit)',
      tradeOff: 'ฟาร์มไว สปลิทพุชแยกดันยอดเยี่ยม แต่เป็นโจมตีระยะประชิด เสี่ยงโดน CC มากกว่าตัวยิงไกล',
      isVerifiedSubstitute: true,
      planCompatibility: 'รักษาความเร็วในการฟาร์มและการกดดันเลนข้างได้ใกล้เคียง 90%',
    },
    {
      substitute: 'Aoi',
      role: 'Jungle Assassin',
      effectiveness: 'ทดแทนได้ ~82% (Heuristic Role Fit)',
      tradeOff: 'โหนสลิงล้วงตัวบางแนวหลังได้เด็ดขาด แต่การยืนยิงดึงจังหวะจากระยะปลอดภัยทำได้ยากกว่า',
      isVerifiedSubstitute: true,
      planCompatibility: 'เปลี่ยนจากยิงตอดระยะปลอดภัย เป็นการดักล้วงแนวหลังในจังหวะเดียว',
    },
    {
      substitute: 'Keera',
      role: 'Jungle Assassin',
      effectiveness: 'ทดแทนได้ ~78% (Heuristic Role Fit)',
      tradeOff: 'เบิร์สเวทแรงและมุดกำแพงได้ แต่ไม่สามารถสลับร่างหลอกทิศทางแบบ Eland\'orr',
      isVerifiedSubstitute: true,
      planCompatibility: 'เปลี่ยนเป็นดาเมจเวทล้วงเดี่ยว รักษาความสามารถในการหนีเอาตัวรอด',
    },
  ],
  'Aya': [
    {
      substitute: 'Helen',
      role: 'Support / Roam',
      effectiveness: 'ทดแทนได้ ~82% (Heuristic Role Fit)',
      tradeOff: 'ฮีลเพื่อนรอบตัวได้ดี แต่ไม่สามารถสิงร่างเพื่อเป็นอมตะได้ ตกเป็นเป้าหมายถูกจับตายได้',
      isVerifiedSubstitute: true,
      planCompatibility: 'คงแผนยื้อไฟต์และฟื้นฟูเลือดได้ แต่ตัวซัพพอร์ตต้องระวังตำแหน่งการยืน',
    },
    {
      substitute: 'Alice',
      role: 'Support / Roam',
      effectiveness: 'ทดแทนได้ ~76% (Heuristic Role Fit)',
      tradeOff: 'กางวงสโลว์ใบ้ศัตรูและบัฟสปีดได้ดี แต่ไม่มีการสิงร่างเกาะติดไฟต์เลนหน้าแบบ Aya',
      isVerifiedSubstitute: true,
      planCompatibility: 'เปลี่ยนเป็นสายคุมพื้นที่ระยะไกลและเร่งสปีดเดินเกม',
    },
  ],
  'Taara': [
    {
      substitute: 'Skud',
      role: 'Dark Slayer Lane',
      effectiveness: 'ทดแทนได้ ~88% (Heuristic Role Fit)',
      tradeOff: 'มีเลือดมหาศาลและหมัดเบิร์สหนักมาก แต่ไม่มีรีเจนเลือดต่อเนื่องแบบไร้มานาของ Taara',
      isVerifiedSubstitute: true,
      planCompatibility: 'รับหน้าที่เป็นตัวชนแนวหน้าได้เหมือนกัน 100% แถมมีเบิร์สดาเมจใส่ป้อม/ตัวบางสูงกว่า',
    },
    {
      substitute: 'Maloch',
      role: 'Dark Slayer Lane',
      effectiveness: 'ทดแทนได้ ~85% (Heuristic Role Fit)',
      tradeOff: 'มีดาเมจจริงวงกว้างและเปิดอัลติลงกลางวงได้ดี แต่การสปลิทดันเลนและหนีเอาตัวรอดช้ากว่า',
      isVerifiedSubstitute: true,
      planCompatibility: 'เน้นไฟต์ 5v5 แทนการแยกดันเลน',
    },
    {
      substitute: 'Arthur',
      role: 'Dark Slayer Lane',
      effectiveness: 'ทางเลือกที่ต้องพิจารณา',
      tradeOff: 'ไล่กวดศัตรูได้ดีและทนทาน แต่การฟื้นฟูเลือดในจังหวะวิกฤตสู้ Taara ไม่ได้',
      isVerifiedSubstitute: false,
      planCompatibility: 'เหมาะสำหรับเกมที่ต้องการตัววิ่งกวนแนวหลัง',
    },
  ],
  'Liliana': [
    {
      substitute: 'Krixi',
      role: 'Mid Lane Mage',
      effectiveness: 'ทดแทนได้ ~85% (Heuristic Role Fit)',
      tradeOff: 'สตันยกและเบิร์สชุดเดียวแรงมาก แต่ไม่มีสกิลแดชพุ่งหนี 2 จังหวะแบบร่างจิ้งจอกของ Liliana',
      isVerifiedSubstitute: true,
      planCompatibility: 'ตอบโจทย์การเคลียร์เวฟและเบิร์สไฟต์ได้ครบถ้วน แต่ต้องระวังการโดนดักพุ่ม',
    },
    {
      substitute: 'Yue',
      role: 'Mid Lane Mage',
      effectiveness: 'ทดแทนได้ ~82% (Heuristic Role Fit)',
      tradeOff: 'ระยะสกิลไกลและดาเมจรุนแรงมาก แต่ขาดความคล่องตัวอย่างสิ้นเชิงเมื่อโดนแอสซาสซินประชิดตัว',
      isVerifiedSubstitute: true,
      planCompatibility: 'เปลี่ยนเป็นสไตล์ตอดเลือดและกดดันป้อมจากระยะไกล',
    },
    {
      substitute: 'Iggy',
      role: 'Mid Lane Mage',
      effectiveness: 'ทดแทนได้ ~80% (Heuristic Role Fit)',
      tradeOff: 'ระเบิดอัลติกว้างเปิดแมพและกดดันได้ดี แต่จังหวะล้วงโซโล่เดี่ยวทำได้ยากกว่า',
      isVerifiedSubstitute: true,
      planCompatibility: 'ช่วยเปิดวิสัยทัศน์และสแปมดาเมจตัดเลือดในไฟต์ใหญ่',
    },
  ],
  'Keera': [
    {
      substitute: 'Paine',
      role: 'Jungle Assassin',
      effectiveness: 'ทดแทนได้ ~85% (Heuristic Role Fit)',
      tradeOff: 'เบิร์สเวทได้รวดเร็วและใบ้ศัตรูได้ดี แต่ไม่มีอัลติมุดกำแพงหนีเอาตัวรอดแบบ Keera',
      isVerifiedSubstitute: true,
      planCompatibility: 'เป็นดาเมจเวทล้วงเร็วเหมือนกัน แต่ต้องระวังการกระโดดเข้าผิดจังหวะ',
    },
    {
      substitute: 'Kaine',
      role: 'Jungle Assassin',
      effectiveness: 'ทดแทนได้ ~82% (Heuristic Role Fit)',
      tradeOff: 'ล่องหนเปิดวิสัยทัศน์และสเต็ปล้วงเดี่ยวได้เร็ว แต่เป็นดาเมจกายภาพ แก้ทางแทงค์หนาได้ยากกว่า',
      isVerifiedSubstitute: true,
      planCompatibility: 'เน้นลอบสังหารเป้าหมายเดี่ยว แต่ทีมต้องเติมดาเมจเวทจาก Mid เลน',
    },
    {
      substitute: 'Zill',
      role: 'Jungle Assassin',
      effectiveness: 'ทางเลือกที่ต้องพิจารณา',
      tradeOff: 'ดาเมจเวทชุดเดียวตายและไม่ตกเป็นเป้าหมาย แต่อ่อนแอกว่าในช่วงรอคูลดาวน์อัลติเมท',
      isVerifiedSubstitute: false,
      planCompatibility: 'ต้องรอจังหวะอัลติเมทพร้อมก่อนเข้าปะทะเท่านั้น',
    },
  ],
  'Florentino': [
    {
      substitute: 'Yena',
      role: 'Dark Slayer Lane',
      effectiveness: 'ทดแทนได้ ~86% (Heuristic Role Fit)',
      tradeOff: 'คอมโบใบ้และมีต้านทานสถานะช่วงฟันดาบใหญ่ได้ดี แต่จังหวะดวล 1v1 ในไฟต์ยืดเยื้อไม่รัวเท่ารำดอกไม้',
      isVerifiedSubstitute: true,
      planCompatibility: 'ดักพุ่มล้วงตัวบางและคุมเลนได้ดีมาก สามารถเข้าทดแทนบทบาท DSL ฝีมือสูงได้',
    },
    {
      substitute: 'Richter',
      role: 'Dark Slayer Lane',
      effectiveness: 'ทดแทนได้ ~82% (Heuristic Role Fit)',
      tradeOff: 'จังหวะดักพุ่มใบ้และเดินซ้อนไฟต์เลนอื่นไวกว่ามาก แต่การปะทะตรงๆ กับตัวชนหนาจะสู้โฟลเรนไม่ได้',
      isVerifiedSubstitute: true,
      planCompatibility: 'เปลี่ยนจากการดวลเลนเดี่ยว เป็นการเดินโรตชั่นซ้อนเพื่อนร่วมทีม',
    },
    {
      substitute: 'Airi',
      role: 'Dark Slayer Lane',
      effectiveness: 'ทางเลือกที่ต้องพิจารณา',
      tradeOff: 'ดาเมจจริงและพุ่ง 3 จังหวะยอดเยี่ยมในเลทเกม แต่ช่วงต้นเกมเลนจะเสียเปรียบและยืนยาก',
      isVerifiedSubstitute: false,
      planCompatibility: 'ต้องเล่นเซฟเลนช่วง 5 นาทีแรก แล้วเน้นล้วงแนวหลังช่วงเลทเกม',
    },
  ],
  'Elsu': [
    {
      substitute: 'Violet',
      role: 'ADL Carry',
      effectiveness: 'ทดแทนได้ ~82% (Heuristic Role Fit)',
      tradeOff: 'กลิ้งยิงโป๊กเบิร์สได้เร็วและเล่นง่ายกว่า แต่ไม่มีการวางกับดักเปิดวิสัยทัศน์คุมแมพแบบ Elsu',
      isVerifiedSubstitute: true,
      planCompatibility: 'คงสไตล์ Poke & Siege ดาเมจหนักได้ดี ซัพพอร์ตต้องช่วยเปิดพุ่มแทนกับดัก',
    },
    {
      substitute: 'Stuart',
      role: 'ADL Carry',
      effectiveness: 'ทดแทนได้ ~80% (Heuristic Role Fit)',
      tradeOff: 'มีสกิลกันดาเมจกายภาพและสโลว์เปิดจังหวะได้ดี แต่ระยะการสไนป์ไกลไม่เท่า Elsu',
      isVerifiedSubstitute: true,
      planCompatibility: 'ยืนสู้กับแอสซาสซินกายภาพได้ดีกว่า แต่ระยะโซนสั้นกว่า',
    },
  ],
  'Zip': [
    {
      substitute: 'TeeMee',
      role: 'Support / Roam',
      effectiveness: 'ทดแทนได้ ~88% (Heuristic Role Fit)',
      tradeOff: 'ชุบชีวิตเพื่อนได้และมีสตันหม้อระเบิดต่อเนื่อง แต่ไม่สามารถดูดมินเนียนหรืออมย้ายเพื่อนข้ามกำแพงได้',
      isVerifiedSubstitute: true,
      planCompatibility: 'เซฟเพื่อนและชุบชีวิตในไฟต์ได้ยอดเยี่ยม แถมเร่งการเงินให้ทีม',
    },
    {
      substitute: 'Helen',
      role: 'Support / Roam',
      effectiveness: 'ทดแทนได้ ~80% (Heuristic Role Fit)',
      tradeOff: 'เติมเลือดและบัฟป้องกันให้ทีมได้สม่ำเสมอ แต่ไม่มีจังหวะเซฟเพื่อนฉุกเฉินตอนติดสตันหมู่',
      isVerifiedSubstitute: true,
      planCompatibility: 'เปลี่ยนจากการย้ายตำแหน่ง เป็นการยืนฮีลยื้อไฟต์',
    },
  ],
};

// =========================================================================
// 6. POST-DRAFT SUMMARY
// =========================================================================
export interface GamePhaseInstruction {
  timing: string;
  focus: string;
  objectives: string[];
}

export interface PostDraftSummaryReport {
  teamName: string;
  oppTeamName: string;
  compStrengths: string[];
  compWeaknesses: string[];
  winConditions: string[];
  earlyGame: GamePhaseInstruction;
  midGame: GamePhaseInstruction;
  lateGame: GamePhaseInstruction;
  provenance: string;
}

// =========================================================================
// HERO CONSTANTS & TRAITS
// =========================================================================

const HERO_FRONTLINE_LIST = new Set([
  'thane', 'mina', 'toro', 'lumburr', 'arทุม', 'arum', 'baldum', 'cresht', 'ormarr',
  'maloch', 'skud', 'taara', 'arthur', 'veres', 'riktor', 'richter', 'roxie', 'xeniel',
  'wiro', 'ata', 'teeri', 'zip', 'chrest', 'yena', 'allain'
]);

const HERO_HARD_CC_LIST = new Set([
  'thane', 'mina', 'arum', 'aleister', 'baldum', 'toro', 'lumburr', 'ormarr', 'grakk',
  'cresht', 'annette', 'rouie', 'krixi', 'diaochan', 'veera', 'lorion', 'alice', 'dirak',
  'azzen\'ka', 'gildur', 'ilumia', 'omen', 'skud'
]);

const HERO_ENGAGE_LIST = new Set([
  'maloch', 'thane', 'lumburr', 'baldum', 'cresht', 'toro', 'ormarr', 'riktor', 'richter',
  'yena', 'allain', 'skud', 'omen', 'veres', 'krixi', 'lorion', 'rouie'
]);

const HERO_DIVE_LIST = new Set([
  'nakroth', 'aoi', 'keera', 'kaine', 'paine', 'murad', 'quillen', 'kriknak', 'butterfly',
  'zill', 'wukong', 'airi', 'florentino', 'yan'
]);

const HERO_POKE_LIST = new Set([
  'elsu', 'yue', 'liliana', 'iggy', 'kahlii', 'krixi', 'natalya', 'raz', 'brunhilda', 'celica'
]);

const HERO_ANTI_TANK_LIST = new Set([
  'florentino', 'hayate', 'maloch', 'lauriel', 'allain', 'yorn', 'thorne'
]);

const HERO_SPLIT_LIST = new Set([
  'omen', 'kil\'grooth', 'nakroth', 'yan', 'taara', 'airi', 'lubu', 'errol'
]);

const HERO_SUSTAIN_LIST = new Set([
  'helen', 'taara', 'veres', 'florentino', 'marja', 'kil\'grooth', 'dextra', 'lubu'
]);

const HERO_LATE_SCALING_LIST = new Set([
  'elsu', 'hayate', 'capheny', 'violet', 'laville', 'yorn', 'tel\'annas', 'slimz', 'allain', 'airi', 'lauriel', 'yan'
]);

const HERO_EARLY_TEMPO_LIST = new Set([
  'nakroth', 'aoi', 'kaine', 'kriknak', 'raz', 'riktor', 'richter', 'maloch', 'toro', 'thane', 'teemee', 'rouie'
]);

// =========================================================================
// 1. EVALUATE DRAFT SAFETY (Phase P2 Core)
// =========================================================================
export function evaluateDraftSafety(
  myPicks: PickSlotState[],
  oppPicks: PickSlotState[],
  heroToPlayersMap: Record<string, HeroPlayerBadge[]>
): DraftSafetyReport {
  const pickedHeroes = myPicks.map((p) => p.hero).filter((h): h is Hero => h !== null);
  const oppHeroes = oppPicks.map((p) => p.hero).filter((h): h is Hero => h !== null);
  const warnings: DraftSafetyItem[] = [];

  // -------------------------------------------------------------
  // A. Role Coverage & Role Clash
  // -------------------------------------------------------------
  const roleHeroMap: Record<CompRoleKey, Hero[]> = {
    DSL: [],
    Jungle: [],
    Mid: [],
    Support: [],
    ADL: [],
  };

  pickedHeroes.forEach((h) => {
    const r = mapToCompRole(h.primaryPos);
    if (r) roleHeroMap[r].push(h);
  });

  const allRoles: CompRoleKey[] = ['DSL', 'Jungle', 'Mid', 'Support', 'ADL'];
  const missingRoles: string[] = allRoles.filter((r) => roleHeroMap[r].length === 0);
  const rolesCovered: string[] = allRoles.filter((r) => roleHeroMap[r].length > 0);
  const roleClashes: Array<{ role: string; heroes: string[] }> = [];

  allRoles.forEach((r) => {
    if (roleHeroMap[r].length > 1) {
      roleClashes.push({
        role: r,
        heroes: roleHeroMap[r].map((h) => h.name),
      });
    }
  });

  // Role Clash Warning
  if (roleClashes.length > 0) {
    roleClashes.forEach((clash) => {
      warnings.push({
        id: `role-clash-${clash.role}`,
        type: 'role',
        severity: 'critical',
        title: `เลือกฮีโร่ตำแหน่ง ${clash.role} ซ้ำกัน (${clash.heroes.join(', ')})`,
        detail: `มีฮีโร่ตำแหน่ง ${clash.role} มากกว่า 1 ตัว อาจทำให้เกิดการแย่งทรัพยากรหรือเสียสมดุลการยืนเลน`,
        suggestion: `ตรวจสอบว่ามีผู้เล่นในทีมเล่นแบบ Flex เลนอื่นได้ หรือเปลี่ยนตัวเลือกในตำแหน่งที่ขาด`,
      });
    });
  }

  // Missing Roles Warning (only when >= 3 picks)
  if (pickedHeroes.length >= 3 && missingRoles.length > 0) {
    warnings.push({
      id: 'missing-roles',
      type: 'role',
      severity: pickedHeroes.length >= 4 ? 'critical' : 'warning',
      title: `ยังขาดตำแหน่งหลัก: ${missingRoles.join(', ')}`,
      detail: `ทีมเลือกไปแล้ว ${pickedHeroes.length}/5 ตัว แต่ยังไม่มีฮีโร่ในตำแหน่ง ${missingRoles.join(', ')}`,
      suggestion: `พิจารณาเลือกฮีโร่ในตำแหน่ง ${missingRoles[0]} ในเทิร์นถัดไปเพื่อรักษาความสมดุล`,
    });
  }

  // Player ability to play the role
  const playerRoleMatchIssues: string[] = [];
  pickedHeroes.forEach((h) => {
    const badges = heroToPlayersMap[h.name] || [];
    if (badges.length === 0) {
      playerRoleMatchIssues.push(`${h.name} (ไม่มีข้อมูลในพูล)`);
    }
  });

  if (playerRoleMatchIssues.length > 0) {
    warnings.push({
      id: 'player-comfort-risk',
      type: 'player_comfort',
      severity: 'info',
      title: `ฮีโร่ที่เลือกไม่มีบันทึกในพูลหลัก: ${playerRoleMatchIssues.join(', ')}`,
      detail: `นักแข่งในไลน์อัปปัจจุบันยังไม่มีข้อมูลความชำนาญสำหรับ ${playerRoleMatchIssues.join(', ')}`,
      suggestion: `โค้ชควรตรวจสอบความพร้อมและความมั่นใจของผู้เล่นก่อนเริ่มเกม`,
    });
  }

  // -------------------------------------------------------------
  // B. Team Composition & Alternative Playstyles
  // -------------------------------------------------------------
  let magicCount = 0;
  let physicalCount = 0;
  let trueDmgCount = 0;

  pickedHeroes.forEach((h) => {
    const lower = h.name.toLowerCase();
    if (HERO_ANTI_TANK_LIST.has(lower)) trueDmgCount++;
    if (h.roles.includes('mage') || h.r === 'mage' || h.primaryPos === 'mid') {
      magicCount++;
    } else {
      physicalCount++;
    }
  });

  const frontlineHeroes = pickedHeroes.filter((h) => HERO_FRONTLINE_LIST.has(h.name.toLowerCase()));
  const hardCcHeroes = pickedHeroes.filter((h) => HERO_HARD_CC_LIST.has(h.name.toLowerCase()));
  const engageHeroes = pickedHeroes.filter((h) => HERO_ENGAGE_LIST.has(h.name.toLowerCase()));
  const diveHeroes = pickedHeroes.filter((h) => HERO_DIVE_LIST.has(h.name.toLowerCase()));
  const pokeHeroes = pickedHeroes.filter((h) => HERO_POKE_LIST.has(h.name.toLowerCase()));

  const hasEngage = engageHeroes.length > 0;
  const hasBacklineDive = diveHeroes.length > 0;
  const hasHardCc = hardCcHeroes.length > 0;
  const hasFrontline = frontlineHeroes.length > 0;

  // Non-dogmatic balance checks (Accounts for Poke & Disengage alternatives)
  let alternativeToolsNote: string | undefined = undefined;

  if (pickedHeroes.length >= 3) {
    // Damage type checks
    if (magicCount === 0) {
      warnings.push({
        id: 'no-magic-damage',
        type: 'damage',
        severity: 'critical',
        title: 'ขาดดาเมจเวท (All Physical Damage)',
        detail: 'ทีมมีแต่ดาเมจกายภาพ คู่แข่งสามารถออกเกราะสะท้อน/เกราะกายภาพเพื่อรับมือได้ง่ายมาก',
        suggestion: 'ควรหยิบ Mage หรือฮีโร่ที่มีดาเมจเวทในช่องที่เหลือเพื่อกระจายประเภทดาเมจ',
      });
    } else if (magicCount >= 3 && physicalCount <= 1) {
      warnings.push({
        id: 'too-much-magic',
        type: 'damage',
        severity: 'warning',
        title: 'สัดส่วนดาเมจเวทสูงเกินไป (Heavy Magic)',
        detail: `ทีมมีตัวดาเมจเวท ${magicCount} ตัว หากคู่แข่งออก Medallion of Troy จะลดประสิทธิภาพดาเมจอย่างมาก`,
        suggestion: 'พิจารณาเพิ่มแครี่กายภาพหรือตัวทำดาเมจกายภาพต่อเนื่อง',
      });
    }

    // Frontline check (considering poke alternatives)
    if (!hasFrontline) {
      if (pokeHeroes.length >= 2) {
        alternativeToolsNote = 'ทีมเน้นการตอดเลือดระยะไกล (Poke & Siege) แทนการใช้แทงค์ชนตรง ๆ';
        warnings.push({
          id: 'poke-low-frontline',
          type: 'frontline',
          severity: 'info',
          title: 'ใช้แผน Poke & Siege แทนตัวชนหนา',
          detail: 'ทีมไม่มีแทงค์ตัวหนา แต่มีตัวตอดเลือดระยะไกล สามารถชิงพื้นที่และดันป้อมจากระยะปลอดภัยได้',
          suggestion: 'ต้องรักษาระยะห่างอย่างเคร่งครัดและวางวอร์ดเปิดพุ่มไม้ อย่าให้คู่แข่งประชิดตัว',
        });
      } else {
        warnings.push({
          id: 'no-frontline',
          type: 'frontline',
          severity: 'critical',
          title: 'ขาดตัวรับดาเมจแนวหน้า (Low Frontline)',
          detail: 'ในทีมยังไม่มี Tank หรือ Fighter ยืนรับดาเมจ ทำให้แถวหลังเสี่ยงถูกประชิดตัวและเปิดไฟต์ยาก',
          suggestion: 'เลือก Support สไตล์แทงค์หนา หรือ DSL ยืนชนได้เพื่อสร้างพื้นที่ให้แครี่/เมจ',
        });
      }
    }

    // Hard CC check (considering dive alternatives)
    if (!hasHardCc) {
      if (diveHeroes.length >= 2) {
        warnings.push({
          id: 'dive-low-cc',
          type: 'cc',
          severity: 'warning',
          title: 'ขาด Hard CC แต่ชดเชยด้วย Burst Dive',
          detail: 'ทีมไม่มีสกิลสตันหยุดต่อเนื่อง แต่มีตัวล้วงเบิร์สดาเมจเร็วสูง สามารถตัดตัวบางศัตรูได้ทันที',
          suggestion: 'ต้องเข้าไฟต์พร้อมกันอย่างเฉียบขาด ไม่ปล่อยให้ไฟต์ยืดเยื้อจนโดนสวนกลับ',
        });
      } else {
        warnings.push({
          id: 'no-hard-cc',
          type: 'cc',
          severity: 'warning',
          title: 'ขาดสกิลหยุด CC ควบคุมไฟต์ (No Hard CC)',
          detail: 'ทีมไม่มีสกิลสตันหยุดต่อเนื่อง อาจทำให้หยุดตัวล้วงหรือจัดตำแหน่งไฟต์ 5v5 ได้ยาก',
          suggestion: 'ควรมีฮีโร่อย่างน้อย 1 ตัวที่มี Hard CC หรือสกิลเปิดไฟต์ที่เชื่อถือได้',
        });
      }
    }

    // Engage check
    if (!hasEngage && !hasBacklineDive && pokeHeroes.length === 0) {
      warnings.push({
        id: 'no-engage',
        type: 'engage',
        severity: 'warning',
        title: 'ขาดเครื่องมือเปิดไฟต์ (Low Initiation)',
        detail: 'ทีมไม่มีตัวเปิดไฟต์ระยะไกลหรือสกิลพุ่งชาร์จ อาจเป็นฝ่ายถูกบีบให้ตั้งรับอย่างเดียว',
        suggestion: 'ควรมีตัวเปิดไฟต์หรือสกิลจับตัวหลักอย่างน้อย 1 ตัว',
      });
    }
  }

  // -------------------------------------------------------------
  // C. Game Timing Analysis
  // -------------------------------------------------------------
  const earlyCount = pickedHeroes.filter((h) => HERO_EARLY_TEMPO_LIST.has(h.name.toLowerCase())).length;
  const lateCount = pickedHeroes.filter((h) => HERO_LATE_SCALING_LIST.has(h.name.toLowerCase())).length;

  let powerSpike: DraftSafetyReport['gameTiming']['powerSpike'] = 'Balanced Tempo';
  let powerSpikeDetails = 'จังหวะทีมกระจายตัวสม่ำเสมอ สามารถเล่นได้ทั้งช่วงต้น กลาง และเลทเกม';
  let timingVulnerability = 'ต้องระวังจังหวะ Objective ใหญ่ (Dragon & Slayer) ไม่ควรเสียตัวคนเดียวก่อนไฟต์';
  let lateGameViability = 'มีความสามารถในการสู้เลทเกมในเกณฑ์มาตรฐาน';

  if (earlyCount >= 3 && lateCount <= 1) {
    powerSpike = 'Early Game (0-4m)';
    powerSpikeDetails = 'ทีมมีความได้เปรียบสูงมากในช่วงต้นเกมและเลเวล 4 สามารถบุกป่าและชิง Dragon ตัวแรกได้เร็ว';
    timingVulnerability = 'จุดเสี่ยงหลังนาทีที่ 12: หากปิดเกมไม่ได้และคู่แข่งมีไอเทมครบ ดาเมจและพลังไฟต์จะเริ่มถดถอย';
    lateGameViability = 'เลทเกมเสียเปรียบ ต้องเน้นการสปีดดันเวฟและชิง Infinite Dark Slayer เพื่อปิดเกมเร็ว';
  } else if (lateCount >= 2 && earlyCount <= 1) {
    powerSpike = 'Late Game (10m+)';
    powerSpikeDetails = 'ทีมมีดาเมจสเกลเลทเกมสูงมาก เมื่อแครี่และตัวดาเมจหลักมีไอเทม 3-4 ชิ้น';
    timingVulnerability = 'จุดเสี่ยงช่วง 1-5 นาทีแรก: ต้นเกมเลนจะเสียเปรียบ เสี่ยงโดนคู่แข่งอินเวดป่าและกดดันป้อมนอก';
    lateGameViability = 'มีความพร้อมสูงมากในการสู้ไฟต์ 5v5 เลทเกมเพื่อชิงบัฟ Infinite Dark Slayer';
  } else if (pickedHeroes.length >= 2) {
    powerSpike = 'Mid Game (4-10m)';
    powerSpikeDetails = 'พาวเวอร์สไปค์สูงสุดช่วงกลางเกม (นาทีที่ 5-10) ในจังหวะดันป้อมชั้นแรกและแย่ง Dark Slayer เล็ก';
    timingVulnerability = 'ต้องระวังการเสียเปรียบหากเสียป้อมเลนกลางก่อนนาทีที่ 8';
    lateGameViability = 'สามารถสู้เลทเกมได้หากรักษาการเงินของแครี่ไม่ให้ตามหลัง';
  }

  // -------------------------------------------------------------
  // D. Win Condition Determination
  // -------------------------------------------------------------
  let primaryType: DraftSafetyReport['winCondition']['primaryType'] = 'Flexible Standard';
  let headline = 'แผนสมดุลรอบด้าน (Flexible Standard)';
  let keySuccessConditions = [
    'รักษาการเงินและควบคุมเวฟทั้ง 3 เลนให้สม่ำเสมอ',
    'เข้าชิง Objective ตามไทม์มิ่ง (Dragon นาทีที่ 2:00, Dark Slayer นาทีที่ 8:00)',
    'จัดตำแหน่งชนหน้ายิงหลังในไฟต์ใหญ่ 5v5',
  ];

  if (diveHeroes.length >= 2) {
    primaryType = 'Pick-off & Ambush';
    headline = 'ลอบสังหารตัดตัวบางแนวหลัง (Dive / Pick-off)';
    keySuccessConditions = [
      'ดักพุ่มลอบสังหารแครี่หรือเมจของคู่แข่งก่อนเริ่มไฟต์ใหญ่',
      'ชิงความได้เปรียบด้านจำนวนคน 5v4 เพื่อดันป้อมและยึดป่า',
      'หลีกเลี่ยงการปะทะตรง ๆ กับตัวชนหน้าหนาของคู่แข่ง',
    ];
  } else if (pokeHeroes.length >= 2) {
    primaryType = 'Poke & Siege';
    headline = 'สไนป์ตอดเลือด & รุมป้อม (Poke & Siege)';
    keySuccessConditions = [
      'ใช้ระยะสกิลตอดเลือดคู่แข่งให้ถอยก่อนเข้าชิงหลุม Dark Slayer',
      'รักษาการวางวอร์ดเปิดวิสัยทัศน์รอบตัว ป้องกันการโดนลอบล้วง',
      'ดันป้อมจากระยะปลอดภัย ไม่เดินล้ำแนวหน้าเด็ดขาด',
    ];
  } else if (hasFrontline && lateCount >= 1) {
    primaryType = 'Engage & 5v5 Teamfight';
    headline = 'ชนหน้ายิงหลัง 5v5 ไฟต์ใหญ่ (Front-to-Back Teamfight)';
    keySuccessConditions = [
      'แทงค์ยืนค้ำหน้าโซนพื้นที่ ให้แครี่ยืนทำดาเมจฟรีจากแนวหลัง',
      'ปกป้องแครี่จากการโดนล้วง (Peel) ตลอดการปะทะ',
      'คุมหลุม Infinite Dark Slayer นาทีที่ 15 เพื่อดันปิดเกม',
    ];
  }

  // -------------------------------------------------------------
  // Sort and finalize Top 3 Warnings
  // -------------------------------------------------------------
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  warnings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  const topWarnings = warnings.slice(0, 3);

  let status: DraftSafetyReport['status'] = 'safe';
  let summaryBadge = '✅ สมดุลทีมอยู่ในเกณฑ์ดี';

  if (topWarnings.some((w) => w.severity === 'critical')) {
    status = 'critical';
    summaryBadge = '⚠️ มีจุดเสี่ยงสมดุลที่ควรพิจารณา';
  } else if (topWarnings.some((w) => w.severity === 'warning')) {
    status = 'caution';
    summaryBadge = '⚡ มีจุดที่ควรปรับจังหวะ';
  }

  return {
    status,
    summaryBadge,
    topWarnings,
    allWarningsCount: warnings.length,
    roleCoverage: {
      rolesCovered,
      missingRoles,
      roleClashes,
      playerRoleMatchIssues,
    },
    teamComposition: {
      hasEngage,
      engageDetails: hasEngage
        ? `มีตัวเปิดไฟต์ (${engageHeroes.map((h) => h.name).join(', ')})`
        : 'ขาดสกิลเปิดไฟต์ระยะไกล',
      hasBacklineDive,
      backlineDiveDetails: hasBacklineDive
        ? `มีความสามารถล้วงแนวหลัง (${diveHeroes.map((h) => h.name).join(', ')})`
        : 'ไม่มีตัวล้วงแนวหลังโดยตรง',
      hasHardCc,
      hardCcDetails: hasHardCc
        ? `มี Hard CC ควบคุม (${hardCcHeroes.map((h) => h.name).join(', ')})`
        : 'ขาดสกิล Hard CC หยุดไฟต์',
      hasFrontline,
      frontlineDetails: hasFrontline
        ? `มีแนวหน้ารับดาเมจ (${frontlineHeroes.map((h) => h.name).join(', ')})`
        : 'แนวหน้าบาง',
      damageBalance: {
        physical: physicalCount,
        magic: magicCount,
        trueDmg: trueDmgCount,
        summary: `${physicalCount} กายภาพ • ${magicCount} เวท • ${trueDmgCount} ดาเมจแท้`,
      },
      alternativeToolsNote,
    },
    gameTiming: {
      powerSpike,
      powerSpikeDetails,
      timingVulnerability,
      lateGameViability,
    },
    winCondition: {
      primaryType,
      headline,
      keySuccessConditions,
    },
    disclaimer: 'คำแนะนำเพื่อช่วยตัดสินใจ — โค้ชมีสิทธิ์และอิสระในการตัดสินใจเลือก ไม่บังคับเปลี่ยนตัว',
  };
}

// =========================================================================
// 2. ANALYZE ENEMY THREATS (Phase P2 Core)
// =========================================================================
export function analyzeEnemyThreats(
  oppPicks: PickSlotState[],
  myPicks: PickSlotState[],
  allHeroes: Hero[],
  bannedHeroNames: Set<string>,
  pickedHeroNames: Set<string>,
  oppTeamName: string,
  heroToPlayersMap: Record<string, HeroPlayerBadge[]> = {}
): EnemyThreatReport {
  const oppHeroes = oppPicks.map((p) => p.hero).filter((h): h is Hero => h !== null);
  const myHeroes = myPicks.map((p) => p.hero).filter((h): h is Hero => h !== null);
  const threats: EnemyThreatItem[] = [];

  // Group by threat types
  const diveHeroes = oppHeroes.filter((h) => HERO_DIVE_LIST.has(h.name.toLowerCase()));
  if (diveHeroes.length > 0) {
    const endangered = myHeroes
      .filter((h) => h.roles.includes('marksman') || h.roles.includes('mage') || h.primaryPos === 'adl' || h.primaryPos === 'mid')
      .map((h) => h.name);

    threats.push({
      type: 'dive',
      title: 'ภัยคุกคามลอบสังหารแนวหลัง (Backline Dive)',
      heroes: diveHeroes.map((h) => h.name),
      dangerLevel: 'high',
      opponentStrength: 'มีความคล่องตัวและดาเมจเบิร์สชุดเดียวตาย สามารถเข้าถึงตัวบางในเสี้ยววินาที',
      impactOnOurTeam: endangered.length > 0
        ? `${endangered.join(', ')} ของเราเสี่ยงถูกดักล้วงและเล่นพื้นที่ด้านหน้าได้ยาก`
        : 'แนวหลังของทีมเสี่ยงถูกประชิดตัวในจังหวะเข้าไฟต์',
      endangeredAllies: endangered,
      tacticalAdvice: 'พิจารณาตัวป้องกันแนวหลัง (Peel), ยืนตำแหน่งใกล้ซัพพอร์ต และออกไอเทมกันเบิร์ส (Arctic Orb / Death Sickle)',
    });
  }

  const ccHeroes = oppHeroes.filter((h) => HERO_HARD_CC_LIST.has(h.name.toLowerCase()));
  if (ccHeroes.length >= 2) {
    const endangered = myHeroes.filter((h) => !['florentino', 'kil\'grooth', 'toro', 'laville', 'chaugnar'].includes(h.name.toLowerCase())).map((h) => h.name);
    threats.push({
      type: 'lockdown',
      title: 'ภัยคุกคามการควบคุมไฟต์ต่อเนื่อง (CC Lockdown Chain)',
      heroes: ccHeroes.map((h) => h.name),
      dangerLevel: 'high',
      opponentStrength: 'มีสกิลสตันจับตายต่อเนื่องหลายจังหวะ สามารถขังเป้าหมายจนไม่สามารถกดสกิลหนีได้',
      impactOnOurTeam: 'ทีมเราอาจโดนหยุดจังหวะในไฟต์ 5v5 จนไม่สามารถทำดาเมจได้ตามแผน',
      endangeredAllies: endangered.slice(0, 3),
      tacticalAdvice: 'พิจารณาหยิบฮีโร่ที่มี Immune CC (ต้านสถานะ), ซัพพอร์ตล้างสถานะ (Cleanse / Chaugnar) หรือซัพพอร์ตออกไอเทมล้างสถานะ',
    });
  }

  const pokeHeroes = oppHeroes.filter((h) => HERO_POKE_LIST.has(h.name.toLowerCase()));
  if (pokeHeroes.length > 0) {
    const endangered = myHeroes.filter((h) => !HERO_FRONTLINE_LIST.has(h.name.toLowerCase())).map((h) => h.name);
    threats.push({
      type: 'poke',
      title: 'ภัยคุกคามตอดเลือดระยะไกล (Long-Range Poke)',
      heroes: pokeHeroes.map((h) => h.name),
      dangerLevel: 'medium',
      opponentStrength: 'สามารถสแปมสกิลดาเมจรุนแรงจากระยะปลอดภัย ริดรอนเลือดก่อนการปะทะ',
      impactOnOurTeam: 'ทีมเราอาจเสียเลือดจนต้องกลับบ่อ ทำให้เสียสิทธิ์ในการชิงหลุม Dark Slayer หรือป้อม',
      endangeredAllies: endangered.slice(0, 3),
      tacticalAdvice: 'พิจารณาหยิบฮีโร่เปิดไฟต์เร็ว (Hard Engage) ชาร์จเข้าถึงตัวโดยตรง ไม่เปิดโอกาสให้ตอดเลือด',
    });
  }

  const antiTankHeroes = oppHeroes.filter((h) => HERO_ANTI_TANK_LIST.has(h.name.toLowerCase()));
  if (antiTankHeroes.length > 0) {
    const endangered = myHeroes.filter((h) => HERO_FRONTLINE_LIST.has(h.name.toLowerCase())).map((h) => h.name);
    threats.push({
      type: 'anti_tank',
      title: 'ภัยคุกคามดาเมจแท้ทะลุเกราะ (True Damage / Anti-Tank)',
      heroes: antiTankHeroes.map((h) => h.name),
      dangerLevel: 'high',
      opponentStrength: 'มีดาเมจแท้และดาเมจเปอร์เซ็นต์เลือดที่ไม่สนค่าเกราะป้องกัน',
      impactOnOurTeam: endangered.length > 0
        ? `ตัวชนแนวหน้าของเรา (${endangered.join(', ')}) จะรับดาเมจได้สั้นลงมาก`
        : 'ตัวหนาของทีมจะละลายอย่างรวดเร็วในไฟต์ยืดเยื้อ',
      endangeredAllies: endangered,
      tacticalAdvice: 'อย่าหวังพึ่งไอเทมเกราะป้องกันเพียงอย่างเดียว ให้ใช้การเบิร์สดาเมจชุดเดียวตายหรือควบคุมระยะห่าง',
    });
  }

  const splitHeroes = oppHeroes.filter((h) => HERO_SPLIT_LIST.has(h.name.toLowerCase()));
  if (splitHeroes.length > 0) {
    threats.push({
      type: 'split',
      title: 'ภัยคุกคามแยกดันเลนข้าง (Split Push Pressure)',
      heroes: splitHeroes.map((h) => h.name),
      dangerLevel: 'medium',
      opponentStrength: 'ดวล 1v1 ชนะเกือบทุกตัว และมีความเร็วในการเคลียร์เวฟตีป้อมสูง',
      impactOnOurTeam: 'ทีมเราอาจถูกดึงตัวไปกันเลนข้าง ทำให้รวมตัวไฟต์ 5v5 หน้าหลุม Dark Slayer ได้ยาก',
      endangeredAllies: myHeroes.filter((h) => h.primaryPos === 'dsl').map((h) => h.name),
      tacticalAdvice: 'ต้องมีฮีโร่เลนข้างที่เคลียร์เวฟไว หรือจัดทีมไฟต์ 5v4 บุกป้อมกลางให้จบก่อนโดนดันข้าง',
    });
  }

  const sustainHeroes = oppHeroes.filter((h) => HERO_SUSTAIN_LIST.has(h.name.toLowerCase()));
  if (sustainHeroes.length > 0) {
    threats.push({
      type: 'sustain',
      title: 'ภัยคุกคามฟื้นฟูเลือดต่อเนื่อง (High Sustain / Healing)',
      heroes: sustainHeroes.map((h) => h.name),
      dangerLevel: 'medium',
      opponentStrength: 'ฟื้นฟูพลังชีวิตได้รวดเร็วระหว่างการปะทะยืดเยื้อ',
      impactOnOurTeam: 'หากทีมเราเบิร์สดาเมจไม่ตายในชุดเดียว ศัตรูจะรีเลือดเต็มและสวนกลับชนะไฟต์',
      endangeredAllies: myHeroes.map((h) => h.name).slice(0, 2),
      tacticalAdvice: 'ทั้ง Mage และ Carry ต้องรีบออกไอเทมตัดเลือด (Tome of the Reaper / Curse of Death) ในชิ้นที่ 2-3',
    });
  }

  // Opponent Plan Assessment (with uncertainty handling if <= 2 picks)
  const oppFrontlineCount = oppHeroes.filter((h) => HERO_FRONTLINE_LIST.has(h.name.toLowerCase())).length;

  let opponentPlanAssessment: EnemyThreatReport['opponentPlanAssessment'] = {
    planType: 'ยังไม่สามารถระบุได้แน่ชัด',
    confidence: 'insufficient_data',
    description: 'คู่แข่งเลือกฮีโร่เพียง 1-2 ตัว ยังไม่สามารถประเมินแผนโดยรวมได้อย่างมั่นใจ (กำลังสังเกตรูปแบบ)',
    note: 'ต้องรอดูการเลือกในตำแหน่งที่เหลือเพื่อยืนยันแผนการเล่นหลัก',
  };

  if (oppHeroes.length >= 3) {
    if (diveHeroes.length >= 2) {
      opponentPlanAssessment = {
        planType: 'Dive & Fast Assassination (แผนทะลวงแนวหลัง & ลอบสังหาร)',
        confidence: 'high',
        description: 'คู่แข่งเน้นการปิดเกมเร็วด้วยการล้วงแครี่และเมจของเราให้ตายก่อนเริ่มไฟต์ 5v5',
        note: 'สอดคล้องกับเมต้า RPL 2026 เมื่อเลือกตัวล้วง 2 ตัวขึ้นไป',
      };
    } else if (pokeHeroes.length >= 2) {
      opponentPlanAssessment = {
        planType: 'Poke & Siege (แผนตอดเลือด & รุมป้อม)',
        confidence: 'high',
        description: 'คู่แข่งเน้นการกดดันระยะไกลและคุมพื้นที่ Dark Slayer จากระยะปลอดภัย',
        note: 'สอดคล้องกับคอมพ์สไนเปอร์ระยะไกลของ RPL',
      };
    } else if (antiTankHeroes.length >= 2 || (ccHeroes.length >= 2 && oppFrontlineCount >= 1)) {
      opponentPlanAssessment = {
        planType: 'Front-to-Back Teamfight (แผนชนหน้ายิงหลัง 5v5)',
        confidence: 'medium',
        description: 'คู่แข่งเน้นการตั้งแนวหน้ารับดาเมจและให้ตัวทำดาเมจยิงสู้ในไฟต์ยาว',
        note: 'เตรียมรับมือด้วยการตัดดาเมจแนวหลังหรือใช้ดาเมจแท้ตอบโต้',
      };
    } else {
      opponentPlanAssessment = {
        planType: 'Standard Flex Composition (แผนมาตรฐานสมดุล)',
        confidence: 'medium',
        description: 'คู่แข่งกระจายบทบาทตามมาตรฐานเลน ไม่ได้เน้นจุดเด่นทางใดทางหนึ่งสุดโต่ง',
        note: 'เน้นการเล่นตามไทม์มิ่งและการคุม Objective ใหญ่',
      };
    }
  }

  // Recommended counter style
  let recommendedCounterStyle = 'รักษารูปขบวน 5v5 มาตรฐาน ชนหน้ายิงหลัง';
  if (diveHeroes.length > 0) {
    recommendedCounterStyle = 'เน้นการตั้งรับสวนกลับ (Counter-Engage) มีซัพพอร์ตคอยชะลอจังหวะล้วง (Peel)';
  } else if (pokeHeroes.length > 0) {
    recommendedCounterStyle = 'เน้นตัวเปิดไฟต์เร็ว (Hard Engage) บุกปิดเกมเร็ว ไม่เปิดโอกาสให้ตอดเลือด';
  }

  // -------------------------------------------------------------
  // Practical Actionable Response Recommendations (Phase P2 Section 4)
  // -------------------------------------------------------------
  let topResponseHeroObj: Hero | null = null;
  let topResponseReason = '';
  let topResponseRole = '';
  const altResponseHeroes: Array<{ hero: Hero; reason: string }> = [];

  // Filter candidate response heroes (must be unbanned and unpicked)
  const availableCandidates = allHeroes.filter(
    (h) => !bannedHeroNames.has(h.name) && !pickedHeroNames.has(h.name)
  );

  if (diveHeroes.length > 0) {
    // Need peel / anti-dive support or sturdy backline
    const peelCandidates = availableCandidates.filter((h) =>
      ['thane', 'teemee', 'helen', 'zip', 'baldum', 'mina', 'cresht'].includes(h.name.toLowerCase())
    );
    if (peelCandidates.length > 0) {
      topResponseHeroObj = peelCandidates[0];
      topResponseRole = peelCandidates[0].primaryPos.toUpperCase();
      topResponseReason = `เป็นตัวแก้ทางสำคัญต่อตัวล้วง ${diveHeroes.map((h) => h.name).join(', ')} ช่วยคุ้มกันแครี่ให้รอดชีวิต`;
      altResponseHeroes.push(...peelCandidates.slice(1, 3).map((h) => ({
        hero: h,
        reason: 'ช่วยเซฟเพื่อนและหยุดจังหวะล้วงได้ดี',
      })));
    }
  } else if (pokeHeroes.length > 0) {
    // Need hard engage
    const engageCandidates = availableCandidates.filter((h) =>
      ['maloch', 'krixi', 'lorion', 'richter', 'riktor', 'skud', 'toro'].includes(h.name.toLowerCase())
    );
    if (engageCandidates.length > 0) {
      topResponseHeroObj = engageCandidates[0];
      topResponseRole = engageCandidates[0].primaryPos.toUpperCase();
      topResponseReason = `มีสกิลเปิดไฟต์ระยะไกล (Hard Engage) ช่วยเข้าถึงตัวโป๊ก ${pokeHeroes.map((h) => h.name).join(', ')} ได้ทันที`;
      altResponseHeroes.push(...engageCandidates.slice(1, 3).map((h) => ({
        hero: h,
        reason: 'ช่วยเปิดจังหวะเข้าถึงแนวหลังศัตรู',
      })));
    }
  }

  // Fallback to top meta pick if no specific threat candidates
  if (!topResponseHeroObj && availableCandidates.length > 0) {
    topResponseHeroObj = availableCandidates[0];
    topResponseRole = availableCandidates[0].primaryPos.toUpperCase();
    topResponseReason = 'ฮีโร่เมต้ามาตรฐานที่ช่วยเติมเต็มสมดุลของทีม';
  }

  // Connect with Player Fit from P1: find MCU players who can play topResponseHeroObj
  const bestFitPlayers: ThreatActionableResponse['bestFitPlayers'] = [];
  if (topResponseHeroObj && heroToPlayersMap[topResponseHeroObj.name]) {
    const badges = heroToPlayersMap[topResponseHeroObj.name] || [];
    badges.forEach((b) => {
      bestFitPlayers.push({
        playerId: b.playerId,
        nickname: b.playerNickname,
        playerName: b.playerName,
        tier: b.tier,
        tierLabel: b.tier === 'signature' ? 'ถนัด' : 'พอเล่นได้',
        starColor: b.tier === 'signature' ? 'gold' : 'silver',
        playerRole: b.position,
      });
    });
  }

  const comboAndPlanImpact = topResponseHeroObj
    ? `การเลือก ${topResponseHeroObj.name} ช่วยลดความเสี่ยงต่อแนวหลัง แต่ต้องปรับตำแหน่งการยืนไม่ให้หลุดโซน`
    : 'รักษารูปแบบคอมโบเดิมตามที่ซ้อมไว้';

  const residualRisks = diveHeroes.length > 0
    ? ['แม้จะมีตัวแก้ทาง แต่แครี่ยังต้องรักษาระยะห่างและอย่าเดินเดี่ยวในพุ่มไม้', 'ต้องรอคูลดาวน์สกิลเซฟของซัพพอร์ตก่อนเข้าปะทะ']
    : ['ต้องระวังการโดนดักพุ่มในแม่น้ำช่วงนาทีที่ 8 ขึ้นไป'];

  const actionableResponse: ThreatActionableResponse = {
    topResponseHero: topResponseHeroObj
      ? {
          hero: topResponseHeroObj,
          reason: topResponseReason,
          fitsRole: topResponseRole,
        }
      : null,
    alternativeHeroes: altResponseHeroes,
    comboAndPlanImpact,
    bestFitPlayers,
    residualRisks,
  };

  // Threat-informed Priority Bans for BAN phase
  const threatBans: EnemyThreatReport['threatBans'] = [];
  if (diveHeroes.length > 0) {
    availableCandidates
      .filter((h) => HERO_DIVE_LIST.has(h.name.toLowerCase()))
      .slice(0, 2)
      .forEach((h) => {
        threatBans.push({
          heroName: h.name,
          reason: `ตัดตัวล้วงแนวหลังเพิ่มเติม เพื่อไม่ให้คู่แข่งเสริมคอมโบไดฟ์ 2 ตัว`,
          priority: 'must_ban',
        });
      });
  }

  // Anticipate Next Picks for Opponent
  const oppRolesFound = new Set<CompRoleKey>();
  oppHeroes.forEach((h) => {
    const r = mapToCompRole(h.primaryPos);
    if (r) oppRolesFound.add(r);
  });
  const allCompRoles: CompRoleKey[] = ['DSL', 'Jungle', 'Mid', 'Support', 'ADL'];
  const oppMissingRoles = allCompRoles.filter((r) => !oppRolesFound.has(r));

  const anticipatedPicks: AnticipatedEnemyPick[] = [];
  oppMissingRoles.slice(0, 2).forEach((missingRole) => {
    const posKey =
      missingRole === 'DSL'
        ? 'dsl'
        : missingRole === 'Jungle'
        ? 'jg'
        : missingRole === 'Mid'
        ? 'mid'
        : missingRole === 'Support'
        ? 'roam'
        : 'adl';
    const candidates = allHeroes
      .filter(
        (h) =>
          (h.primaryPos === posKey || h.pos?.includes(posKey)) &&
          !bannedHeroNames.has(h.name) &&
          !pickedHeroNames.has(h.name)
      )
      .slice(0, 3)
      .map((h) => h.name);

    if (candidates.length > 0) {
      anticipatedPicks.push({
        role: missingRole,
        likelyHeroes: candidates,
        tacticalReason: `คู่แข่งยังขาดตำแหน่ง ${missingRole} มีโอกาสสูงที่จะเติมตัวเมต้าในกลุ่มนี้`,
        sourceNote:
          'การประเมินเชิงกลยุทธ์ตามตำแหน่งที่ยังขาด (Heuristic Strategic Assessment - ไม่มีเปอร์เซ็นต์ปรุงแต่ง)',
      });
    }
  });

  return {
    oppTeamName: oppTeamName || 'คู่แข่ง (Opponent)',
    lockedOppCount: oppHeroes.length,
    threats,
    opponentPlanAssessment,
    recommendedCounterStyle,
    actionableResponse,
    anticipatedPicks,
    threatBans,
    dataSourceNote:
      'วิเคราะห์จากฮีโร่ที่คู่แข่งล็อคแล้วจริง โดยอิงคุณลักษณะสรีระฮีโร่และเมต้า Pro League RPL 2026',
  };
}

// =========================================================================
// 3. TEAM IDENTITY ANALYSIS
// =========================================================================
export function analyzeTeamIdentity(
  myPicks: PickSlotState[],
  inspectedHero: Hero | null
): TeamIdentityReport {
  const pickedHeroes = myPicks.map((p) => p.hero).filter((h): h is Hero => h !== null);

  let identityType: TeamIdentityType = 'balanced_flex';
  let title = 'คอมพ์มาตรฐานสมดุล (Standard Flex)';
  let description = 'กำลังวางโครงสร้างทีม สามารถยืดหยุ่นปรับตามสถานการณ์การดราฟต์ได้';
  let keyStrengths = ['ควบคุมเลนได้มาตรฐาน', 'ปรับแผนการเล่นได้ตามไอเทม'];
  let powerSpike = 'ขึ้นอยู่กับฮีโร่หลักของเทิร์นถัดไป';

  const diveScore = pickedHeroes.filter((h) => HERO_DIVE_LIST.has(h.name.toLowerCase())).length;
  const pokeScore = pickedHeroes.filter((h) => HERO_POKE_LIST.has(h.name.toLowerCase())).length;
  const frontlineScore = pickedHeroes.filter((h) => HERO_FRONTLINE_LIST.has(h.name.toLowerCase())).length;
  const marksmanCount = pickedHeroes.filter((h) => h.roles.includes('marksman') || h.primaryPos === 'adl').length;

  if (diveScore >= 2) {
    identityType = 'wombo_dive';
    title = 'ไดฟ์ล้วงแนวหลัง & เบิร์สเร็ว (Dive / Fast Burst)';
    description = 'เน้นการเข้าถึงตัวบางของศัตรูในเสี้ยววินาที จบไฟต์ให้เร็วที่สุด';
    keyStrengths = ['เบิร์สตัวหลักศัตรูตายทันที', 'สร้างแรงกดดันในเลนเดี่ยวและป่าสูง'];
    powerSpike = 'ช่วงเลเวล 4 และไอเทมชิ้นที่ 2 (นาทีที่ 3-7)';
  } else if (pokeScore >= 2) {
    identityType = 'poke_siege';
    title = 'สไนป์ตอดเลือด & รุมป้อม (Poke & Siege)';
    description = 'เน้นการกดดันจากระยะปลอดภัย ริดรอนเลือดศัตรูก่อนชิง Objective';
    keyStrengths = ['คุมระยะได้เปรียบ', 'ชิงพื้นที่ Dark Slayer และดันป้อมได้ปลอดภัย'];
    powerSpike = 'ช่วงกลางเกม (นาทีที่ 6-12) เมื่อมีไอเทมลดคูลดาวน์และดาเมจเจาะเกราะ';
  } else if (frontlineScore >= 2 && marksmanCount >= 1) {
    identityType = 'front_to_back';
    title = 'ชนหน้ายิงหลัง 5v5 (Front-to-Back Teamfight)';
    description = 'เน้นการตั้งแนวหน้าให้หนา เพื่อให้แนวหลังทำดาเมจฟรีในไฟต์ใหญ่ 5v5';
    keyStrengths = ['ทีมไฟต์ 5v5 เหนียวแน่นมาก', 'มีตัวรับดาเมจและกันโซนชัดเจน'];
    powerSpike = 'ช่วงเลทเกม (นาทีที่ 10 ขึ้นไป) เมื่อแครี่มีของครบ 3-4 ชิ้น';
  }

  // Inspected hero alignment
  let inspectedHeroAlignment: TeamIdentityReport['inspectedHeroAlignment'] = undefined;

  if (inspectedHero) {
    const lower = inspectedHero.name.toLowerCase();
    const isDive = HERO_DIVE_LIST.has(lower);
    const isFrontline = HERO_FRONTLINE_LIST.has(lower);
    const isPoke = HERO_POKE_LIST.has(lower);

    if (identityType === 'wombo_dive') {
      if (isDive) {
        inspectedHeroAlignment = {
          heroName: inspectedHero.name,
          alignment: 'reinforces',
          headline: '⚡ ส่งเสริมแผน Dive อย่างเด็ดขาด',
          reason: `${inspectedHero.name} มีความคล่องตัวและดาเมจเบิร์สสูง เสริมการทะลวงแนวหลังร่วมกับเพื่อนร่วมทีม`,
          tacticalNote: 'เข้าไฟต์พร้อมกันในจังหวะตัวเปิดชาร์จ อย่าแยกเข้าคนละเวลา',
        };
      } else if (isFrontline) {
        inspectedHeroAlignment = {
          heroName: inspectedHero.name,
          alignment: 'reinforces',
          headline: '🛡️ ช่วยเติมแนวหน้าและเปิดจังหวะให้ตัวไดฟ์',
          reason: `ช่วยทำหน้าที่เป็นตัวเปิด (Initiator) ดึงสกิลของศัตรู เพื่อเปิดทางให้ตัวล้วงเข้าปิดบัญชี`,
          tacticalNote: 'เปิดไฟต์จับศัตรูให้อยู่หมัดเพื่อให้เพื่อนเบิร์สดาเมจทัน',
        };
      } else {
        inspectedHeroAlignment = {
          heroName: inspectedHero.name,
          alignment: 'neutral',
          headline: '⚖️ เป็นตัวเลือกเสริมตามบทบาทเลน',
          reason: `${inspectedHero.name} ทำหน้าที่ตามตำแหน่ง แต่ไม่ได้เร่งสปีดจังหวะไดฟ์โดยตรง`,
          tacticalNote: 'รักษาระยะปลอดภัยระหว่างที่เพื่อนร่วมทีมไดฟ์แนวหลัง',
        };
      }
    } else if (identityType === 'front_to_back') {
      if (isFrontline) {
        inspectedHeroAlignment = {
          heroName: inspectedHero.name,
          alignment: 'reinforces',
          headline: '🛡️ เสริมกำแพงแนวหน้าให้แข็งแกร่งยิ่งขึ้น',
          reason: `ยืนโซนคุ้มกันพื้นที่แนวหลัง ทำให้แครี่และเมจของทีมยืนยิงได้อย่างปลอดภัย 100%`,
          tacticalNote: 'เน้นยืนคั่นกลางระหว่างตัวล้วงศัตรูกับแครี่ทีมเรา',
        };
      } else if (inspectedHero.roles.includes('marksman') || inspectedHero.primaryPos === 'adl') {
        inspectedHeroAlignment = {
          heroName: inspectedHero.name,
          alignment: 'reinforces',
          headline: '🎯 ตัวทำดาเมจหลักที่ทีมพร้อมคุ้มกัน',
          reason: `ทีมมีแนวหน้าพร้อมชน เหมาะอย่างยิ่งสำหรับ ${inspectedHero.name} ในการยืนทำดาเมจในไฟต์ยืดเยื้อ`,
          tacticalNote: 'อย่าเดินล้ำแนวหน้า รอให้แทงค์เปิดโซนก่อนเริ่มยิง',
        };
      } else {
        inspectedHeroAlignment = {
          heroName: inspectedHero.name,
          alignment: 'neutral',
          headline: '⚖️ ตัวเสริมความคล่องตัวในทีม',
          reason: `${inspectedHero.name} ช่วยเติมมิติการเล่นอื่นในคอมพ์ชนหน้ายิงหลัง`,
          tacticalNote: 'คอยช่วยเคลียร์เวฟและโซนป่ารอบจุดไฟต์',
        };
      }
    } else if (identityType === 'poke_siege') {
      if (isPoke) {
        inspectedHeroAlignment = {
          heroName: inspectedHero.name,
          alignment: 'reinforces',
          headline: '🏹 เสริมอำนาจการตอดเลือดระยะไกลให้รุนแรงขึ้น',
          reason: `ผสานระยะสกิลตอดเลือดร่วมกับทีม ทำให้ศัตรูไม่สามารถเดินเข้าใกล้ Objective ได้`,
          tacticalNote: 'รักษาการวางวอร์ดเปิดวิสัยทัศน์เพื่อป้องกันการโดนดักพุ่ม',
        };
      } else {
        inspectedHeroAlignment = {
          heroName: inspectedHero.name,
          alignment: 'neutral',
          headline: '⚖️ เติมเต็มบทบาทป้องกันและคุมเลน',
          reason: `${inspectedHero.name} ช่วยคอยระวังหลังและตรึงแนวเลนให้ตัวโป๊กทำงานได้`,
          tacticalNote: 'อย่าเปิดไฟต์ประชิดตัวจนหลุดระยะสกิลตอดของเพื่อน',
        };
      }
    } else {
      inspectedHeroAlignment = {
        heroName: inspectedHero.name,
        alignment: 'neutral',
        headline: '🌱 กำลังกำหนดรูปแบบทีม (Developing)',
        reason: `${inspectedHero.name} จะเป็นหนึ่งในตัวกำหนดจังหวะหลักของทีมในเกมนี้`,
        tacticalNote: 'พิจารณาตัวเลือกในเทิร์นถัดไปที่ช่วยซัพพอร์ตจุดเด่นของตัวนี้',
      };
    }
  }

  return {
    identityType,
    title,
    description,
    keyStrengths,
    powerSpike,
    verifiedSource: 'ประเมินจากบทบาทและรูปแบบคอมพ์ตามข้อมูล Pro League RPL 2026',
    inspectedHeroAlignment,
  };
}

// =========================================================================
// 4. EVALUATE PLAYER FIT WITH ROLES (Phase P1)
// =========================================================================
export function evaluatePlayerFitWithRoles(
  heroName: string,
  players: Player[],
  heroToPlayersMap: Record<string, HeroPlayerBadge[]>
): PlayerFitReport {
  const badges = heroToPlayersMap[heroName] || [];

  if (badges.length === 0) {
    return {
      heroName,
      hasComfortData: false,
      bestFitPlayer: null,
      otherPlayers: [],
      allPlayersWithHero: [],
      warningNotice: 'ไม่พบข้อมูลเพียงพอในพูลนักแข่งของทีม MCU สำหรับฮีโร่ตัวนี้ — โค้ชควรสอบถามความมั่นใจก่อนหยิบ (ห้ามสมมติว่าเล่นได้)',
      provenance: 'ตรวจสอบเทียบกับฐานข้อมูลไลน์อัปนักแข่ง MCU (Roster Hero Pool)',
    };
  }

  const entries: PlayerFitEntry[] = badges.map((b) => {
    const matchedPlayer = players.find(
      (p) => p.id === b.playerId || p.nickname.toLowerCase() === b.playerNickname.toLowerCase()
    );
    const playerRole = matchedPlayer?.position || b.position;

    const isOnRole =
      (playerRole === 'DSL' && b.position === 'DSL') ||
      (playerRole === 'Jungle' && b.position === 'Jungle') ||
      (playerRole === 'Mid' && b.position === 'Mid') ||
      (playerRole === 'Support' && b.position === 'Support') ||
      (playerRole === 'ADL' && b.position === 'ADL');

    const roleFitDescription = isOnRole
      ? `เล่นตรงตำแหน่งหลัก (${playerRole})`
      : `เล่นแบบ Flex ข้ามตำแหน่ง (ผู้เล่น: ${playerRole} vs ตำแหน่งฮีโร่: ${b.position})`;

    const isSig = b.tier === 'signature';

    return {
      playerId: b.playerId,
      playerName: b.playerName,
      nickname: b.playerNickname,
      playerRole,
      heroPosition: b.position,
      tier: b.tier,
      tierLabel: isSig ? 'ถนัด (Signature)' : 'พอเล่นได้ (Comfortable)',
      starColor: isSig ? 'gold' : 'silver',
      roleFit: isOnRole ? 'on_role' : 'flex_role',
      roleFitDescription,
    };
  });

  // Sort: Signature > Comfortable, On-Role > Flex
  entries.sort((a, b) => {
    if (a.tier === 'signature' && b.tier !== 'signature') return -1;
    if (a.tier !== 'signature' && b.tier === 'signature') return 1;
    if (a.roleFit === 'on_role' && b.roleFit !== 'on_role') return -1;
    if (a.roleFit !== 'on_role' && b.roleFit === 'on_role') return 1;
    return 0;
  });

  const best = entries[0];
  let recommendationReason = '';

  if (best.tier === 'signature' && best.roleFit === 'on_role') {
    recommendationReason = `แนะนำ ${best.nickname} เนื่องจากเป็น Signature Hero (ดาวทอง ⭐) ในตำแหน่ง ${best.playerRole} ซึ่งตรงกับตำแหน่งหลักของฮีโร่และแผนทีม`;
  } else if (best.tier === 'signature') {
    recommendationReason = `แนะนำ ${best.nickname} เป็น Signature Hero (ดาวทอง ⭐) แม้ตำแหน่งหลักจะเป็น ${best.playerRole} แต่มีความชำนาญสูงพร้อมเล่น Flex`;
  } else if (best.roleFit === 'on_role') {
    recommendationReason = `แนะนำ ${best.nickname} เนื่องจากเล่นในตำแหน่งหลัก ${best.playerRole} และมีความถนัดระดับพอเล่นได้ (ดาวเงิน ★)`;
  } else {
    recommendationReason = `แนะนำ ${best.nickname} พอเล่นได้ (ดาวเงิน ★) สามารถนำมาปรับสลับแผนได้ตามความจำเป็น`;
  }

  const otherPlayers = entries.slice(1);

  return {
    heroName,
    hasComfortData: true,
    bestFitPlayer: {
      player: best,
      recommendationReason,
    },
    otherPlayers,
    allPlayersWithHero: entries,
    provenance: 'ตรวจสอบเทียบกับฐานข้อมูลไลน์อัปนักแข่ง MCU (Roster Hero Pool)',
  };
}

// =========================================================================
// 5. EVALUATE COMBO FALLBACK AUDITS (Phase P1)
// =========================================================================
export function getComboFallbackAudits(
  bannedHeroNames: Set<string>,
  pickedHeroNames: Set<string>,
  heroToPlayersMap: Record<string, HeroPlayerBadge[]>
): ComboFallbackReportItem[] {
  const list: ComboFallbackReportItem[] = [];

  RPL_2026_PRO_COMPS.forEach((comp) => {
    const bannedInComp = comp.coreHeroes.filter((h) => bannedHeroNames.has(h));
    const pickedInComp = comp.coreHeroes.filter((h) => pickedHeroNames.has(h));

    const affectedHeroes = [...new Set([...bannedInComp, ...pickedInComp])];

    if (affectedHeroes.length > 0) {
      affectedHeroes.forEach((affHero) => {
        const isBanned = bannedHeroNames.has(affHero);
        const guideList = META_SUBSTITUTE_GUIDE[affHero] || [];

        const intactHeroes = comp.coreHeroes.filter(
          (h) => !bannedHeroNames.has(h) && !pickedHeroNames.has(h)
        );

        const validSubs: ComboFallbackSubstituteOption[] = [];

        guideList.forEach((guide) => {
          if (!bannedHeroNames.has(guide.substitute) && !pickedHeroNames.has(guide.substitute)) {
            const badges = heroToPlayersMap[guide.substitute] || [];
            const playersWhoPlay = badges.map((b) => ({
              playerId: b.playerId,
              nickname: b.playerNickname,
              playerName: b.playerName,
              tier: b.tier,
              tierLabel: b.tier === 'signature' ? 'ถนัด' : 'พอเล่นได้',
              starColor: b.tier === 'signature' ? ('gold' as const) : ('silver' as const),
              playerRole: b.position,
            }));

            validSubs.push({
              substituteHero: guide.substitute,
              role: guide.role,
              effectiveness: guide.effectiveness,
              tradeOff: guide.tradeOff,
              isVerifiedSubstitute: guide.isVerifiedSubstitute,
              planCompatibility: guide.planCompatibility,
              playersWhoPlay,
            });
          }
        });

        if (validSubs.length > 0 || isBanned) {
          list.push({
            compId: comp.id,
            compName: comp.name,
            compNameTh: comp.nameTh,
            compTier: comp.tier,
            bannedOrUnavailableHero: affHero,
            status: isBanned ? 'banned' : 'picked_by_opp',
            impactDescription: `เสีย ${affHero} ซึ่งเป็นแกนหลักในแผน ${comp.nameTh} (${comp.name})`,
            intactHeroes,
            substitutes: validSubs.slice(0, 3),
          });
        }
      });
    }
  });

  return list;
}

// =========================================================================
// 6. GENERATE POST-DRAFT SUMMARY
// =========================================================================
export function generatePostDraftSummary(
  myPicks: PickSlotState[],
  oppPicks: PickSlotState[],
  myTeamName: string,
  oppTeamName: string
): PostDraftSummaryReport {
  const myHeroes = myPicks.map((p) => p.hero).filter((h): h is Hero => h !== null);
  const oppHeroes = oppPicks.map((p) => p.hero).filter((h): h is Hero => h !== null);

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const winConditions: string[] = [];

  const hasFrontline = myHeroes.some((h) => HERO_FRONTLINE_LIST.has(h.name.toLowerCase()));
  const hasHardCc = myHeroes.some((h) => HERO_HARD_CC_LIST.has(h.name.toLowerCase()));
  const hasLateCarry = myHeroes.some((h) => h.roles.includes('marksman') || ['elsu', 'hayate', 'capheny', 'violet', 'laville', 'yorn', 'tel\'annas'].includes(h.name.toLowerCase()));
  const hasDive = myHeroes.some((h) => HERO_DIVE_LIST.has(h.name.toLowerCase()));

  if (hasFrontline) strengths.push('มีแนวหน้ารับดาเมจและยืนโซนพื้นที่ไฟต์ได้มั่นคง');
  if (hasHardCc) strengths.push('มีสกิล Hard CC ต่อเนื่องในการหยุดการเคลื่อนไหวของศัตรู');
  if (hasLateCarry) strengths.push('มีดาเมจเลทเกมต่อเนื่องจากแครี่หลักที่เชื่อถือได้');
  if (hasDive) strengths.push('มีความสามารถในการล้วงตัวบางแนวหลังของศัตรูได้อย่างรวดเร็ว');
  if (strengths.length < 3) strengths.push('การเดินเกมและสลับเลนทำได้รวดเร็วตามตำแหน่ง');

  if (!hasFrontline) weaknesses.push('แนวหน้าบาง เสี่ยงโดนไฟต์ประชิดตัวและตัวเบิร์สหนัก');
  if (!hasHardCc) weaknesses.push('ขาดสกิลหยุด CC เด็ดขาด อาจควบคุมเป้าหมายเดี่ยวได้ยาก');
  const oppHasDive = oppHeroes.some((h) => HERO_DIVE_LIST.has(h.name.toLowerCase()));
  if (oppHasDive) weaknesses.push('ศัตรูมีตัวล้วงแนวหลัง แครี่ต้องยืนตำแหน่งอย่างระมัดระวังตลอดเวลา');
  if (weaknesses.length < 2) weaknesses.push('ต้องระวังการเสียเปรียบไฟต์ยืดเยื้อหากไม่ได้ Objective ใหญ่');

  if (hasLateCarry) {
    winConditions.push('ยื้อเกมและคุ้มกันแครี่จนได้ไอเทมหลัก 3 ชิ้นเพื่อชิงไฟต์เลทเกม');
  }
  if (hasDive) {
    winConditions.push('สร้างความได้เปรียบด้วยการลอบสังหารตัวดาเมจหลักศัตรูก่อนเปิดไฟต์ใหญ่ 5v5');
  }
  winConditions.push('คุมวิสัยทัศน์รอบหลุม Dark Slayer นาทีที่ 15 เพื่อชิงบัฟ Infinite Dark Slayer ปิดเกม');

  const earlyGame: GamePhaseInstruction = {
    timing: '0 - 4 นาที (ต้นเกม)',
    focus: 'คุมบัฟป่า, ชิงสปีดเวฟ 3 เลน, และแย่งชิง Spirit Sentinel & Dragon ตัวแรก',
    objectives: [
      'โรมมิ่งช่วย Mid เคลียร์เวฟชุดแรกเพื่อชิงวิสัยทัศน์แม่น้ำ',
      'คุ้มกันบัฟป่าฝั่งเรา และสังเกตเส้นทางเดินป่าของฝั่งตรงข้าม',
      'เข้าชิง Abyssal Dragon ตัวแรกที่นาทีที่ 2:00 เพื่อเร่งเลเวลและเงิน',
    ],
  };

  const midGame: GamePhaseInstruction = {
    timing: '4 - 10 นาที (กลางเกม)',
    focus: 'กดดันป้อมนอก, รวมตัวโซนไฟต์เลนกลาง, และควบคุม Dark Slayer เล็ก',
    objectives: [
      'ดันป้อมชั้นแรกของเลนข้างเพื่อเปิดพื้นที่ป่าศัตรู',
      'จัดตั้งไฟต์ 5v5 เมื่อได้เปรียบจำนวนคนหรือศัตรูแยกเลน',
      'คุม Dark Slayer ที่นาทีที่ 8:00 เพื่อส่งมังกรดันเลนกลาง',
    ],
  };

  const lateGame: GamePhaseInstruction = {
    timing: '10 นาทีขึ้นไป (เลทเกม)',
    focus: 'การควบคุมพื้นที่ Infinite Dark Slayer, การไม่ถูกลอบสังหาร, และการเซ็ตเวฟ 3 เลนดันบ้าน',
    objectives: [
      'ห้ามเดินเดี่ยวในจุดอับสายตาโดยไม่มีการเช็คพุ่มไม้',
      'จัดขบวนชนหน้ายิงหลังอย่างเคร่งครัด แครี่ห้ามล้ำแนวหน้า',
      'เมื่อได้ Infinite Dark Slayer ให้ดันเวฟพร้อมกัน 3 ทางเพื่อปิดเกม',
    ],
  };

  return {
    teamName: myTeamName || 'ทีมเรา (Our Team)',
    oppTeamName: oppTeamName || 'คู่แข่ง (Opponent)',
    compStrengths: strengths.slice(0, 3),
    compWeaknesses: weaknesses.slice(0, 3),
    winConditions: winConditions.slice(0, 3),
    earlyGame,
    midGame,
    lateGame,
    provenance: 'วิเคราะห์เชิงกลยุทธ์จากองค์ประกอบฮีโร่ทั้ง 10 ตัวตามมาตรฐานแข่งขัน RoV RPL 2026',
  };
}
