// Real-time Tactical Intelligence & Draft Prediction Service
// Analyzes:
// 1. "เขาแบนตัวนี้ -> มีโอกาสจะหยิบตัวนี้" (Ban-to-Pick Intended Intentions)
// 2. "เขาเลือกตัวนี้ -> มีโอกาสเอามาเล่นกับตัวนี้" (Pick-to-Combo Synergy Predictions)
// 3. "แก้ทางตัวนี้ -> มีโอกาสหยิบมาเคาน์เตอร์" (Counter-pick Anticipation)

import { HEROES } from '../data/heroes';
import { RPL_2026_PLAYED_WITH_DATA, RPL_2026_PLAYED_AGAINST_DATA, RPL_2026_HEROES_DATA } from '../data/rpl2026SummerStats';
import { META_SYNERGY, META_COUNTERS } from '../data/metaData';
import { TeamSide, Hero } from '../types/draft';

export interface BanPredictionItem {
  id: string;
  team: TeamSide;
  bannedHero: string;
  predictedHero: string;
  predictedHeroTh?: string;
  predictedHeroPos?: string;
  confidence: number; // 0 - 100%
  category: 'counter_clear' | 'role_priority' | 'pocket_pick';
  reason: string;
  isAvailable: boolean;
}

export interface PickSynergyPredictionItem {
  id: string;
  team: TeamSide;
  pickedHero: string;
  suggestedHero: string;
  suggestedHeroTh?: string;
  suggestedHeroPos?: string;
  confidence: number; // 0 - 100%
  synergyWr?: number;
  comboName: string;
  reason: string;
  isAvailable: boolean;
}

export interface CounterPredictionItem {
  id: string;
  targetHero: string;
  targetTeam: TeamSide;
  counterHero: string;
  counterHeroTh?: string;
  counterHeroPos?: string;
  confidence: number;
  victimWr?: number;
  reason: string;
  isAvailable: boolean;
}

export interface DraftTacticalIntelligence {
  banPredictions: BanPredictionItem[];
  pickSynergies: PickSynergyPredictionItem[];
  counterSuggestions: CounterPredictionItem[];
  blueOverview: {
    lastBan?: string;
    lastPick?: string;
    predictedCompStyle: string;
  };
  redOverview: {
    lastBan?: string;
    lastPick?: string;
    predictedCompStyle: string;
  };
}

// Curated Pro League Strategic Ban-to-Pick Archetype Mapping
// When Team X bans Hero A, what Hero B are they preparing to play (clearing threats / role choke)?
const BAN_TO_PICK_INTENT_MAP: Record<string, { targetHero: string; confidence: number; reason: string }[]> = {
  // Banning Anti-Tank / True Damage -> Planning Tank / Heavy Bruisers
  'Hayate': [
    { targetHero: 'Taara', confidence: 92, reason: 'แบนตัวทำ True Damage ละลายแทงค์ เพื่อเปิดทางให้ Taara เดินนำหน้าไร้ตัวแก้ทาง' },
    { targetHero: 'Toro', confidence: 88, reason: 'ตัดตัวยิงเปอร์เซ็นต์เลือด เปิดทางให้ Toro ยืนค้ำไฟต์ได้ 100%' },
    { targetHero: 'Maloch', confidence: 82, reason: 'แบนแครี่ที่หลบเก่ง เพื่อหยิบ Maloch โดดฟันกลางวงได้เต็มที่' },
    { targetHero: 'Capheny', confidence: 78, reason: 'แบน Hayate เพื่อเลือก Capheny มาคุมเกมต้นเกมถึงกลางเกม' },
  ],
  'Lauriel': [
    { targetHero: 'Taara', confidence: 85, reason: 'ตัดเมจดาเมจจริงต่อเนื่อง เปิดทางให้ไลน์อัปเลือดหนาเล่นง่ายขึ้น' },
    { targetHero: 'Skud', confidence: 80, reason: 'เปิดทางให้ Skud อัดเลือดเต็มสูบโดยไม่กลัวโดนระเบิดเวท' },
    { targetHero: 'Toro', confidence: 76, reason: 'ตัดตัวโซนวงกลมที่ชนะทางแทงค์ช้า' },
  ],
  // Banning Top Assassins / Dive -> Planning Immobile High-Impact Carries / Poke Mages
  'Keera': [
    { targetHero: 'Capheny', confidence: 90, reason: 'แบนมือสังหารทะลุกำแพง เพื่อหยิบ Capheny หรือแครี่ขาตายมายิงฟรี' },
    { targetHero: 'Yue', confidence: 86, reason: 'ตัดตัวล้วงหลัง เพื่อให้ Yue ยืนสไนเปอร์ระยะปลอดภัยเต็มที่' },
    { targetHero: 'Tel\'Annas', confidence: 82, reason: 'ปลอดภัยจากเวทล้วงชุดเดียวตาย เปิดทางให้แครี่สายยืนยิง' },
    { targetHero: 'Nakroth', confidence: 84, reason: 'แบนจังเกิ้ลเวท Tier S เพื่อแย่งชิงความเร็วในป่าด้วย Nakroth' },
  ],
  'Aoi': [
    { targetHero: 'Elsu', confidence: 88, reason: 'ตัดตัวโหนสลิงล้วงระยะไกล เปิดทางให้ Elsu ส่องเลนและยิงฟรี' },
    { targetHero: 'Iggy', confidence: 85, reason: 'ลดความเสี่ยงโดนล้วงระเบิด เพื่อให้ Iggy ยิงสกิลอัลติคุมพื้นที่' },
    { targetHero: 'Nakroth', confidence: 82, reason: 'แบนนักโหน เพื่อเล่นจังเกิ้ลสายฟาร์มไวคุมออบเจกต์' },
  ],
  'Nakroth': [
    { targetHero: 'Kriknak', confidence: 86, reason: 'แบนความคล่องตัวสูง แล้วเตรียมหยิบจังเกิ้ลเบิร์สต์ไวอย่าง Kriknak' },
    { targetHero: 'Yan', confidence: 84, reason: 'เตรียมหยิบ Yan สู้ไฟต์ยาวเมื่อไม่มี Nakroth มาแยกดัน' },
    { targetHero: 'Keera', confidence: 85, reason: 'ตัดตัวแยกดัน แล้วหยิบ Keera มาล้วงแครี่' },
  ],
  // Banning Support Taxi / Disruption -> Planning Fast Pushes or Dive
  'Rouie': [
    { targetHero: 'Eland\'orr', confidence: 88, reason: 'ตัด Rouie Taxi แล้วดึง Eland\'orr มาเล่นสไตล์โซโล่พลิ้ว' },
    { targetHero: 'TeeMee', confidence: 85, reason: 'ตัดแผนวาปกลับบ้าน แล้วหันมาเล่นสไตล์เร่งเงินฟาร์มไว' },
    { targetHero: 'Helen', confidence: 82, reason: 'เมื่อไม่มี Rouie เกมจะช้าลง จึงหันไปหยิบบอลฮีล Helen' },
  ],
  'Helen': [
    { targetHero: 'Teeri', confidence: 84, reason: 'ตัดบอลฮีลฝั่งตรงข้าม แล้วหยิบ Teeri มาเน้นเบิร์สต์ดาเมจแฉลบ' },
    { targetHero: 'Florentino', confidence: 86, reason: 'ตัดตัวยื้อไฟต์ เพื่อให้ไฟเตอร์สายคอมโบไล่ฟันทีละตัวจนจบ' },
    { targetHero: 'TeeMee', confidence: 88, reason: 'ตัดตัวฮีล แล้วเปลี่ยนมาเน้นชุดชุบชีวิตเร่งเงิน' },
  ],
  'Zip': [
    { targetHero: 'Krizzix', confidence: 84, reason: 'ตัดตัวอมหนี แล้วหยิบ Krizzix มาเปิดจังหวะลากดูดแทน' },
    { targetHero: 'Grakk', confidence: 80, reason: 'ไม่มี Zip คอยอมช่วยเพื่อน ทำให้การดึงของ Grakk ได้ผลลัพธ์ 100%' },
  ],
  'Aya': [
    { targetHero: 'Taara', confidence: 85, reason: 'ตัดคอมโบ Aya+Taara ของคู่แข่ง แล้วนำ Taara มาเล่นเดี่ยวแก้เกม' },
    { targetHero: 'TeeMee', confidence: 82, reason: 'เปลี่ยนจากแผนนั่งหัวเป็นแผนชุบชีวิตคุมแครี่' },
  ],
  // Banning Dominant Duelists on DSL
  'Florentino': [
    { targetHero: 'Skud', confidence: 90, reason: 'แบนมหาเทพดวลเลน เพื่อให้ Skud หรือแทงค์ออฟเลนยืนเลนสบาย ไม่โดนรำฟรี' },
    { targetHero: 'Qi', confidence: 85, reason: 'เปิดทางให้ Qi เข้าปะทะไฟต์กลุ่มและดันเลนไร้คู่แข่งรำใส่' },
    { targetHero: 'Yena', confidence: 84, reason: 'แย่งชิงความได้เปรียบเลน Dark Slayer ด้วย Yena' },
    { targetHero: 'Riktor', confidence: 82, reason: 'เดินแก๊งพงหญ้าได้อิสระ ไม่ต้องกังวล Florentino ยื้อเลน' },
  ],
  'Yena': [
    { targetHero: 'Florentino', confidence: 88, reason: 'แบนตัวดักพุ่มใบ้ เพื่อให้ Florentino เล่นง่ายขึ้น' },
    { targetHero: 'Qi', confidence: 84, reason: 'เปิดทางให้ไฟเตอร์สายสตันดวลเลนได้เต็มที่' },
  ],
  'Riktor': [
    { targetHero: 'Florentino', confidence: 85, reason: 'ตัดตัวใบ้และงัดพุ่ม เพื่อเปิดทางให้ไฟเตอร์สายรำ' },
    { targetHero: 'Skud', confidence: 80, reason: 'ลดการโดนดักแก๊งต้นเกม ให้ Skud สเกลกลางเกม' },
  ],
  // Banning Snipers / Vision
  'Elsu': [
    { targetHero: 'Stuart', confidence: 88, reason: 'ตัดตัวยิงแม่นระยะไกล เพื่อให้ Stuart คุมระยะยิงและกดอัลติใส่' },
    { targetHero: 'Violet', confidence: 85, reason: 'ตัดวิสัยทัศน์ส่องพุ่ม เพื่อให้ Violet กลิ้งยิงฟรี' },
    { targetHero: 'Capheny', confidence: 82, reason: 'ไม่ต้องกลัวโดนสไนเปอร์สวน หยิบ Capheny มาปล่อยเลเซอร์รัว' },
  ],
  'Stuart': [
    { targetHero: 'Elsu', confidence: 85, reason: 'ตัดตัวกดดันเลน เพื่อให้ Elsu ส่องสไนเปอร์สบาย' },
    { targetHero: 'Hayate', confidence: 82, reason: 'ลดแรงปะทะแครี่เบิร์สต์ เพื่อให้ Hayate สเกลเลทเกม' },
  ],
  // Banning High Tier Mages
  'Liliana': [
    { targetHero: 'Krixi', confidence: 86, reason: 'ตัดความคล่องตัวสูง แล้วหยิบ Krixi มาเน้น CC หมู่และเบิร์สต์ง่าย' },
    { targetHero: 'Iggy', confidence: 84, reason: 'เปิดทางให้ Iggy สาดสกิลระยะไกลโดยไม่โดนร่างจิ้งจอกล้วง' },
    { targetHero: 'Lorion', confidence: 82, reason: 'หยิบ Lorion วางบอลดึงไฟต์ใหญ่' },
  ],
  'Tulen': [
    { targetHero: 'Liliana', confidence: 85, reason: 'ตัดตัวสโนว์บอลไว แล้วหยิบ Liliana มาคุมระยะ' },
    { targetHero: 'Yue', confidence: 83, reason: 'เน้นยิงระยะนอกวงอัลติของ Tulen' },
  ],
  'Marja': [
    { targetHero: 'Mganga', confidence: 88, reason: 'แบนเมจยืนแลกเบอร์ 1 แล้วหยิบ Mganga มาสแต็กพิษยืนคุมพื้นที่แทน' },
    { targetHero: 'Raz', confidence: 80, reason: 'เปลี่ยนมาเน้นสายเตะไฟต์เดี่ยวตัดตัว' },
  ],
};

// Curated Pro League Pick-to-Combo Synergy Mapping
// When Team X picks Hero A, what Hero B are they overwhelmingly likely to pair with?
const PICK_TO_COMBO_MAP: Record<string, { partnerHero: string; comboName: string; confidence: number; reason: string }[]> = {
  'Aya': [
    { partnerHero: 'Taara', comboName: 'Aya + Taara (อมตะรถถัง)', confidence: 95, reason: 'Taara วิ่งกดอัลติฮีลเลือด ผสมโล่และใบ้ของ Aya กลายเป็นสัตว์ประหลาดอมตะกลางไฟต์' },
    { partnerHero: 'Arthur', comboName: 'Aya + Arthur (ลุยทะลวง)', confidence: 88, reason: 'Arthur วิ่งไวหมุนดาบติดสโลว์ Aya เกาะหัวสแปมใบ้ ศัตรูหนีไม่ออก' },
    { partnerHero: 'Florentino', comboName: 'Aya + Florentino (รำทะลุเกราะ)', confidence: 86, reason: 'Florentino รำดอกไม้ไม่โดนขัด เพราะ Aya คอยมอบโล่และบัฟความเร็วให้' },
    { partnerHero: 'Nakroth', comboName: 'Aya + Nakroth (นักบินสังหาร)', confidence: 82, reason: 'Nakroth พุ่งเข้าล้วงหลังพร้อมการสตันของ Aya ล้วงตายในเสี้ยววินาที' },
  ],
  'Rouie': [
    { partnerHero: 'Eland\'orr', comboName: 'Rouie + Eland\'orr (แท็กซี่ผีเสื้อ)', confidence: 94, reason: 'Eland\'orr วางผีเสื้อไว้ แล้วลงหลุม Rouie วาปกลับบ่อเลือดเต็มพุ่งกลับมาทันที' },
    { partnerHero: 'Hayate', comboName: 'Rouie + Hayate (วาปเติมพลัง)', confidence: 87, reason: 'Hayate โดดเปิดอัลติเสร็จ วาปกลับบ่อเติมเลือดแล้วลงเสา Rouie มาซ้ำไฟต์' },
    { partnerHero: 'Laville', comboName: 'Rouie + Laville (ป้อมปืนเคลื่อนที่)', confidence: 82, reason: 'Laville ยิงเปิดแมพแล้วอาศัยเสา Rouie รุมทีมไฟต์ข้ามเลน' },
  ],
  'Helen': [
    { partnerHero: 'Teeri', comboName: 'Helen + Teeri (คู่หูบวกแหลก)', confidence: 92, reason: 'Teeri ยืนแลกยิงกระสุนแฉลบ โดยมี Helen ฮีลฟื้นฟูเลือดและเร่งเกราะตลอดเวลา' },
    { partnerHero: 'Capheny', comboName: 'Helen + Capheny (ปืนกลไม่ลดเลือด)', confidence: 89, reason: 'Capheny เดินยิงปืนกลฟรี Helen คอยประคองเลือดไม่ให้ตก' },
    { partnerHero: 'Hayate', comboName: 'Helen + Hayate (ลากไฟต์ยื้อ)', confidence: 84, reason: 'Hayate ไคท์ศัตรูสบายใจ มี Helen คอยเติมเลือดจังหวะโดนสวน' },
  ],
  'TeeMee': [
    { partnerHero: 'Violet', comboName: 'TeeMee + Violet (เร่งเงินปืนโต)', confidence: 93, reason: 'พาสซีฟเงิน TeeMee ทำให้ Violet ออกของชิ้นแรกไวกว่าปกติ 2 นาที ยิงนัดเดียวยับ' },
    { partnerHero: 'Wisp', comboName: 'TeeMee + Wisp (จรวดระเบิดชุบ)', confidence: 88, reason: 'Wisp กดยิงอัลติพื้นที่กว้าง หากโดนล้วง TeeMee กดชุบชีวิตขึ้นมายิงต่อทันที' },
    { partnerHero: 'Elsu', comboName: 'TeeMee + Elsu (สไนเปอร์รวย)', confidence: 83, reason: 'เร่งเงินให้ Elsu ออก Muramasa / Fenrir เร็วขึ้น ยิงทะลวงแทงค์' },
    { partnerHero: 'Raz', comboName: 'TeeMee + Raz (ต่อยระเบิดเงิน)', confidence: 85, reason: 'TeeMee สตันเปิดทางให้ Raz ต่อยคอมโบชุดเดียวตาย' },
  ],
  'Maloch': [
    { partnerHero: 'Krixi', comboName: 'Maloch + Krixi (หลุมอุกกาบาต)', confidence: 90, reason: 'Maloch โดดเปิดอัลติสโลว์วงกว้าง Krixi ต่อด้วยพายุเคาะลอยและสาดดาวตก' },
    { partnerHero: 'Hayate', comboName: 'Maloch + Hayate (ดับเบิ้ล True Damage)', confidence: 88, reason: 'ดาเมจจริงคู่ Maloch กวาดเปิดเลือด Hayate โดดหมุนพายุเก็บฉาก' },
    { partnerHero: 'Lorion', comboName: 'Maloch + Lorion (มหาคลื่นแม่เหล็ก)', confidence: 86, reason: 'Lorion ยกบอลลอย แล้ว Maloch โดดลงมาฟันดาเมจจริงกวาด 5 ตัว' },
  ],
  'Elsu': [
    { partnerHero: 'Grakk', comboName: 'Elsu + Grakk (ดึงมาสอย)', confidence: 91, reason: 'Elsu วางดวงตาส่องพุ่ม Grakk เล็งดึงได้ 100% แล้ว Elsu ซ้ำสไนเปอร์ระยะประชิด' },
    { partnerHero: 'Riktor', comboName: 'Elsu + Riktor (ซุ่มยิงสอยดับ)', confidence: 86, reason: 'Riktor ดักฟันจากพุ่มไม้ตามการเปิดมุมมองของ Elsu' },
    { partnerHero: 'Yue', comboName: 'Elsu + Yue (ดับเบิ้ลสไนเปอร์)', confidence: 84, reason: 'ชุดยิงไกล Poke ระยะหน้าจอ ศัตรูเลือดลดครึ่งหลอดก่อนเริ่มไฟต์' },
  ],
  'Toro': [
    { partnerHero: 'Mganga', comboName: 'Toro + Mganga (กำแพงพิษ)', confidence: 89, reason: 'Toro ยืนชนรับดาเมจหน้าสุด ให้ Mganga ยืนสแต็กพิษ 5 ชั้นและกดระเบิด' },
    { partnerHero: 'Marja', comboName: 'Toro + Marja (ยืนค้ำไฟต์เวท)', confidence: 86, reason: 'Toro ล็อคเป้าให้ Marja สาดสกิลใส่แบบไม่ต้องกลัวโดนตัด' },
    { partnerHero: 'Capheny', comboName: 'Toro + Capheny (รถถังคุ้มกัน)', confidence: 85, reason: 'Toro ทุบพื้นสร้างพื้นที่ให้ Capheny เดินยิงสบาย' },
  ],
  'Mganga': [
    { partnerHero: 'Enzo', comboName: 'Mganga + Enzo (พิษเกี่ยวสโลว์)', confidence: 92, reason: 'Enzo เกี่ยวศัตรูเข้ามาในดงพิษ Mganga ทำให้เป้าหมายติดสโลว์จนหนีไม่รอด' },
    { partnerHero: 'Marja', comboName: 'Mganga + Marja (ดูดเลือดหมู่อมตะ)', confidence: 90, reason: 'สไตล์ยื้อไฟต์ ยืนแลกเลือดหน้าด้านๆ ยิ่งสู้ยาวยิ่งชนะ' },
  ],
  'Enzo': [
    { partnerHero: 'Capheny', comboName: 'Enzo + Capheny (ดึงมายิง)', confidence: 86, reason: 'Enzo เกี่ยวเหวี่ยงศัตรูกลับมาให้ Capheny รัวกระสุนใส่' },
    { partnerHero: 'Tachi', comboName: 'Enzo + Tachi (สองพลังต่อสู้)', confidence: 84, reason: 'คอมโบไฟเตอร์สายยืนสู้ต่อเนื่อง ดาเมจผสมทั้งกายภาพและจริง' },
  ],
  'Grakk': [
    { partnerHero: 'Diaochan', comboName: 'Grakk + Diaochan (ดึงมาแช่)', confidence: 88, reason: 'Grakk ดึงเข้ามา Diaochan แช่แข็งต่อทันที ศัตรูทำอะไรไม่ได้ 3 วินาที' },
    { partnerHero: 'Elsu', comboName: 'Grakk + Elsu (ดึงสอยร่วง)', confidence: 90, reason: 'ดึงติดปุ๊บ Elsu นั่งสอยปั๊บ ตายแน่นอน' },
  ],
  'Krizzix': [
    { partnerHero: 'Yena', comboName: 'Krizzix + Yena (ล่องหนดูดสับ)', confidence: 89, reason: 'Krizzix เปิดสกิลล่องหนพาทั้งทีมเข้าประชิด แล้วดูดรวมให้ Yena สับคอมโบ' },
    { partnerHero: 'Florentino', comboName: 'Krizzix + Florentino (รวมหมู่รำ)', confidence: 87, reason: 'ดูดศัตรูมากระจุกเดียว ให้ Florentino ปาดอกไม้โดนหลายตัวพร้อมกัน' },
  ],
};

// Counter Pick Knowledge
const HERO_COUNTERS_KNOWLEDGE: Record<string, { counterHero: string; confidence: number; reason: string }[]> = {
  'Taara': [
    { counterHero: 'Hayate', confidence: 95, reason: 'True Damage จากกระสุนชูริเคน ละลายเลือดและเกราะ Taara ในพริบตา' },
    { counterHero: 'Mganga', confidence: 88, reason: 'พิษลดการฟื้นฟูเลือดและดาเมจสะสมต่อเนื่องตัดการฮีลของ Taara' },
    { counterHero: 'Allain', confidence: 85, reason: 'ดาเมจผสม 3 รูปแบบพร้อม True Damage ฟันทะลุเกราะ' },
  ],
  'Hayate': [
    { counterHero: 'Keera', confidence: 90, reason: 'Keera มีดาเมจเวทระเบิดชุดเดียวตายและสกิลล่องหนหลบกระสุน Hayate' },
    { counterHero: 'Stuart', confidence: 86, reason: 'Stuart กดสกิล 2 อมตะกายภาพและอัลติกดหัว Hayate ได้ชะงัก' },
    { counterHero: 'Paine', confidence: 85, reason: 'Paine ใบ้เวทและพุ่งตัดหลัง Hayate ก่อนได้เปิดอัลติ' },
  ],
  'Nakroth': [
    { counterHero: 'Aleister', confidence: 92, reason: 'อัลติล็อคจับตาย หยุดความพริ้วของ Nakroth 100% ขยับไม่ได้' },
    { counterHero: 'Arum', confidence: 90, reason: 'สิงล็อคเลือดต่อเลือด Nakroth ตัวบางจะตายเองก่อน' },
    { counterHero: 'Thane', confidence: 84, reason: 'ผลักและกระแทกลอย ขัดจังหวะการคอมโบสกิลของ Nakroth' },
  ],
  'Capheny': [
    { counterHero: 'Keera', confidence: 92, reason: 'Capheny ขาตายโดน Keera มุดกำแพงมาตบชุดเดียวร่วง' },
    { counterHero: 'Aoi', confidence: 88, reason: 'โหนสลิงมาเปิดอัลติล้วง Capheny จากนอกระยะยิง' },
    { counterHero: 'Kriknak', confidence: 86, reason: 'กระโดดทับระเบิดดาเมจกายภาพช็อตเดียวตาย' },
  ],
  'Elsu': [
    { counterHero: 'Keera', confidence: 88, reason: 'มุดดินตามรอยส่อง Elsu เข้าประชิดตัวง่ายดาย' },
    { counterHero: 'Nakroth', confidence: 85, reason: 'พุ่ง 3 จังหวะเข้าถึงตัว Elsu ที่กำลังเล็งยิง' },
  ],
  'Florentino': [
    { counterHero: 'Aleister', confidence: 90, reason: 'จับขึงขยับไม่ได้ แก้ทางตัวรำที่ต้องการเคลื่อนที่ต่อเนื่อง' },
    { counterHero: 'Arum', confidence: 88, reason: 'สิงล็อกขณะกำลังรำ เสียจังหวะเก็บดอกไม้ทันที' },
    { counterHero: 'Valhein', confidence: 82, reason: 'สตันรัวๆ ระยะไกล รักษาระยะไม่ให้ Florentino ปาดอกไม้ถึง' },
  ],
  'Helen': [
    { counterHero: 'Diaochan', confidence: 87, reason: 'ทีมบอลฮีลชอบยืนเกาะกลุ่ม โดน Diaochan แช่แข็งทีเดียวยกทีม' },
    { counterHero: 'Maloch', confidence: 88, reason: 'ศัตรูยืนรวมกันในวงฮีล โดน Maloch โดดสับดาเมจจริงยกแผง' },
  ],
  'Toro': [
    { counterHero: 'Hayate', confidence: 93, reason: 'ยิงดาเมจจริงเปอร์เซ็นต์เลือด ทะลวง Toro ที่มีแต่เลือดหนา' },
    { counterHero: 'Lauriel', confidence: 86, reason: 'รำเวทดาเมจจริงระเบิดใส่ Toro ที่ตัวใหญ่หลบสกิลยาก' },
  ],
};

export class DraftPredictionService {
  /**
   * Generates real-time predictions based on current bans, picks, and remaining pool.
   */
  public static generateRealtimePredictions(
    blueBans: (Hero | null)[],
    redBans: (Hero | null)[],
    bluePicks: { hero: Hero | null; pos?: string }[],
    redPicks: { hero: Hero | null; pos?: string }[],
    bannedHeroNames: Set<string>,
    pickedHeroNames: Set<string>
  ): DraftTacticalIntelligence {
    const isHeroAvailable = (heroName: string) => {
      const lower = heroName.toLowerCase();
      return !Array.from(bannedHeroNames).some((n) => n.toLowerCase() === lower) &&
             !Array.from(pickedHeroNames).some((n) => n.toLowerCase() === lower);
    };

    const getHeroDetails = (name: string): { heroTh: string; pos: string } => {
      const h = HEROES.find((item) => item.name.toLowerCase() === name.toLowerCase());
      return {
        heroTh: h?.nameTh || name,
        pos: h?.primaryPos?.toUpperCase() || 'FLEX',
      };
    };

    // 1. BAN PREDICTIONS: "เขาแบนตัวนี้ -> มีโอกาสจะหยิบตัวนี้"
    const banPredictions: BanPredictionItem[] = [];

    // Analyze Blue Bans (What Blue plans to pick, or what Blue is blocking)
    blueBans.forEach((b, idx) => {
      if (!b) return;
      const intents = BAN_TO_PICK_INTENT_MAP[b.name] || [];
      intents.forEach((intent) => {
        const available = isHeroAvailable(intent.targetHero);
        const { heroTh, pos } = getHeroDetails(intent.targetHero);
        banPredictions.push({
          id: `blue-ban-${idx}-${b.name}-${intent.targetHero}`,
          team: 'blue',
          bannedHero: b.name,
          predictedHero: intent.targetHero,
          predictedHeroTh: heroTh,
          predictedHeroPos: pos,
          confidence: intent.confidence,
          category: 'counter_clear',
          reason: `🔵 BLUE แบน "${b.name}" → ${intent.reason}`,
          isAvailable: available,
        });
      });
    });

    // Analyze Red Bans
    redBans.forEach((b, idx) => {
      if (!b) return;
      const intents = BAN_TO_PICK_INTENT_MAP[b.name] || [];
      intents.forEach((intent) => {
        const available = isHeroAvailable(intent.targetHero);
        const { heroTh, pos } = getHeroDetails(intent.targetHero);
        banPredictions.push({
          id: `red-ban-${idx}-${b.name}-${intent.targetHero}`,
          team: 'red',
          bannedHero: b.name,
          predictedHero: intent.targetHero,
          predictedHeroTh: heroTh,
          predictedHeroPos: pos,
          confidence: intent.confidence,
          category: 'counter_clear',
          reason: `🔴 RED แบน "${b.name}" → ${intent.reason}`,
          isAvailable: available,
        });
      });
    });

    // 2. PICK SYNERGY PREDICTIONS: "เขาเลือกตัวนี้ -> มีโอกาสเอามาเล่นกับตัวนี้"
    const pickSynergies: PickSynergyPredictionItem[] = [];

    // Check Blue Team Picks
    bluePicks.forEach((p, idx) => {
      if (!p.hero) return;
      const heroName = p.hero.name;

      // Check Curated Pro Combos
      const proCombos = PICK_TO_COMBO_MAP[heroName] || [];
      proCombos.forEach((combo) => {
        const available = isHeroAvailable(combo.partnerHero);
        const { heroTh, pos } = getHeroDetails(combo.partnerHero);
        pickSynergies.push({
          id: `blue-syn-${idx}-${heroName}-${combo.partnerHero}`,
          team: 'blue',
          pickedHero: heroName,
          suggestedHero: combo.partnerHero,
          suggestedHeroTh: heroTh,
          suggestedHeroPos: pos,
          confidence: combo.confidence,
          comboName: combo.comboName,
          reason: `🔵 BLUE เลือก "${heroName}" → มีโอกาสเอา "${combo.partnerHero}" มาคู่กัน (${combo.reason})`,
          isAvailable: available,
        });
      });

      // Check Real RPL Played With Synergies
      const rplSynergies = RPL_2026_PLAYED_WITH_DATA[heroName] || [];
      rplSynergies.slice(0, 3).forEach((syn) => {
        const partnerName = syn.allyHero || syn.hero;
        if (!partnerName) return;
        if (syn.games >= 5 && syn.winRate >= 55) {
          const available = isHeroAvailable(partnerName);
          const { heroTh, pos } = getHeroDetails(partnerName);
          // Avoid duplicate
          if (!pickSynergies.some((item) => item.team === 'blue' && item.suggestedHero === partnerName)) {
            pickSynergies.push({
              id: `blue-rpl-syn-${idx}-${heroName}-${partnerName}`,
              team: 'blue',
              pickedHero: heroName,
              suggestedHero: partnerName,
              suggestedHeroTh: heroTh,
              suggestedHeroPos: pos,
              confidence: Math.min(95, Math.round(syn.winRate)),
              synergyWr: syn.winRate,
              comboName: `สถิติ RPL (${syn.winRate}% WR)`,
              reason: `🔵 สถิติโปรลีก: เล่นคู่กับ ${partnerName} ชนะ ${syn.winRate}% (${syn.wins}/${syn.games} เกม)`,
              isAvailable: available,
            });
          }
        }
      });
    });

    // Check Red Team Picks
    redPicks.forEach((p, idx) => {
      if (!p.hero) return;
      const heroName = p.hero.name;

      // Check Curated Pro Combos
      const proCombos = PICK_TO_COMBO_MAP[heroName] || [];
      proCombos.forEach((combo) => {
        const available = isHeroAvailable(combo.partnerHero);
        const { heroTh, pos } = getHeroDetails(combo.partnerHero);
        pickSynergies.push({
          id: `red-syn-${idx}-${heroName}-${combo.partnerHero}`,
          team: 'red',
          pickedHero: heroName,
          suggestedHero: combo.partnerHero,
          suggestedHeroTh: heroTh,
          suggestedHeroPos: pos,
          confidence: combo.confidence,
          comboName: combo.comboName,
          reason: `🔴 RED เลือก "${heroName}" → มีโอกาสเอา "${combo.partnerHero}" มาคู่กัน (${combo.reason})`,
          isAvailable: available,
        });
      });

      // Check Real RPL Played With Synergies
      const rplSynergies = RPL_2026_PLAYED_WITH_DATA[heroName] || [];
      rplSynergies.slice(0, 3).forEach((syn) => {
        const partnerName = syn.allyHero || syn.hero;
        if (!partnerName) return;
        if (syn.games >= 5 && syn.winRate >= 55) {
          const available = isHeroAvailable(partnerName);
          const { heroTh, pos } = getHeroDetails(partnerName);
          if (!pickSynergies.some((item) => item.team === 'red' && item.suggestedHero === partnerName)) {
            pickSynergies.push({
              id: `red-rpl-syn-${idx}-${heroName}-${partnerName}`,
              team: 'red',
              pickedHero: heroName,
              suggestedHero: partnerName,
              suggestedHeroTh: heroTh,
              suggestedHeroPos: pos,
              confidence: Math.min(95, Math.round(syn.winRate)),
              synergyWr: syn.winRate,
              comboName: `สถิติ RPL (${syn.winRate}% WR)`,
              reason: `🔴 สถิติโปรลีก: เล่นคู่กับ ${partnerName} ชนะ ${syn.winRate}% (${syn.wins}/${syn.games} เกม)`,
              isAvailable: available,
            });
          }
        }
      });
    });

    // 3. COUNTER SUGGESTIONS: "อีกฝั่งเลือกตัวนี้ -> ควรระวัง/หยิบตัวนี้มาแก้ทาง"
    const counterSuggestions: CounterPredictionItem[] = [];

    // If Blue picked, Red can counter (or Red should watch out)
    bluePicks.forEach((p) => {
      if (!p.hero) return;
      const counters = HERO_COUNTERS_KNOWLEDGE[p.hero.name] || [];
      counters.forEach((c) => {
        const available = isHeroAvailable(c.counterHero);
        const { heroTh, pos } = getHeroDetails(c.counterHero);
        counterSuggestions.push({
          id: `ctr-blue-${p.hero!.name}-${c.counterHero}`,
          targetHero: p.hero!.name,
          targetTeam: 'blue',
          counterHero: c.counterHero,
          counterHeroTh: heroTh,
          counterHeroPos: pos,
          confidence: c.confidence,
          reason: `น้ำเงินมี "${p.hero!.name}" → หยิบ "${c.counterHero}" มาแก้ทางได้ผลชะงัด (${c.reason})`,
          isAvailable: available,
        });
      });
    });

    // If Red picked, Blue can counter
    redPicks.forEach((p) => {
      if (!p.hero) return;
      const counters = HERO_COUNTERS_KNOWLEDGE[p.hero.name] || [];
      counters.forEach((c) => {
        const available = isHeroAvailable(c.counterHero);
        const { heroTh, pos } = getHeroDetails(c.counterHero);
        counterSuggestions.push({
          id: `ctr-red-${p.hero!.name}-${c.counterHero}`,
          targetHero: p.hero!.name,
          targetTeam: 'red',
          counterHero: c.counterHero,
          counterHeroTh: heroTh,
          counterHeroPos: pos,
          confidence: c.confidence,
          reason: `แดงมี "${p.hero!.name}" → หยิบ "${c.counterHero}" มาแก้ทางได้ผลชะงัด (${c.reason})`,
          isAvailable: available,
        });
      });
    });

    // Sort predictions: Available first, then by confidence descending
    banPredictions.sort((a, b) => {
      if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
      return b.confidence - a.confidence;
    });

    pickSynergies.sort((a, b) => {
      if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
      return b.confidence - a.confidence;
    });

    counterSuggestions.sort((a, b) => {
      if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
      return b.confidence - a.confidence;
    });

    // Determine style overview
    const lastBlueBan = [...blueBans].reverse().find(Boolean)?.name;
    const lastRedBan = [...redBans].reverse().find(Boolean)?.name;
    const lastBluePick = [...bluePicks].reverse().find((p) => p.hero)?.hero?.name;
    const lastRedPick = [...redPicks].reverse().find((p) => p.hero)?.hero?.name;

    return {
      banPredictions,
      pickSynergies,
      counterSuggestions,
      blueOverview: {
        lastBan: lastBlueBan,
        lastPick: lastBluePick,
        predictedCompStyle: lastBluePick ? 'เน้นไฟต์กลุ่ม & คอมโบผสาน' : 'กำลังวางแผนแบนเปิดทาง',
      },
      redOverview: {
        lastBan: lastRedBan,
        lastPick: lastRedPick,
        predictedCompStyle: lastRedPick ? 'เน้นตัดจังหวะ & เคาน์เตอร์' : 'กำลังวางแผนแบนเปิดทาง',
      },
    };
  }
}
