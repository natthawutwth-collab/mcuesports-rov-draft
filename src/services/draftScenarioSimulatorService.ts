import { Hero, LaneSelectKey, TeamSide } from '../types/draft';
import {
  ScenarioPlan,
  PlanPickSlot,
  TacticalRoleBadge,
  HeroTacticalProfile,
  RippleImpactAnalysis,
  FallbackOption,
  SimulatorScenario,
} from '../types/simulator';
import { HEROES } from '../data/heroes';
import { statsDataProvider } from './statsDataProvider';
import { Player } from '../types/player';

export const SIMULATOR_DISCLAIMER = {
  title: 'ข้อจำกัดของข้อมูลและแบบจำลองทางสถิติ (Tactical Fit Model Notice)',
  body: 'คะแนนการจัดอันดับและผลการวิเคราะห์ที่แสดงใน Draft Scenario Simulator เป็นคะแนนความเหมาะสมเชิงกลยุทธ์ (Tactical Fit Score) ตามฐานข้อมูล RPL 2026 Meta และ RoV Mechanics ห้ามตีความเป็นโอกาสชนะ (Win Probability) หรือการันตีผลการแข่งขัน เนื่องจากชัยชนะจริงขึ้นอยู่กับฟอร์มการเล่นของนักกีฬา การประสานงานในทีม และการตัดสินใจหน้างานในแต่ละเสี้ยววินาที',
  shortNotice: 'คะแนนนี้คือ Tactical Fit Score ไม่ใช่โอกาสชนะ (Win Probability)',
};

// Known competitive RoV Flex Picks and viable roles
export const ROV_FLEX_HEROES: Record<string, { roles: LaneSelectKey[]; rationale: string }> = {
  riktor: { roles: ['DSL', 'ROAM'], rationale: 'เล่นได้ทั้ง Dark Slayer Lane คุมพุ่มไฟต์ และ Roamer ตัดป่าคุมแมพ' },
  richter: { roles: ['DSL', 'ROAM'], rationale: 'เล่นได้ทั้ง Dark Slayer Lane คุมพุ่มไฟต์ และ Roamer ตัดป่าคุมแมพ' },
  yan: { roles: ['DSL', 'JG'], rationale: 'เล่นได้ทั้ง Jungle สเกลเลทเกม และ Dark Slayer Lane ไฟต์ยืดเยื้อ' },
  qi: { roles: ['DSL', 'JG'], rationale: 'เล่นได้ทั้ง Dark Slayer Lane อัดกำแพง และ Jungle ดักฆ่าช่วงต้นเกม' },
  veres: { roles: ['DSL', 'JG', 'MID', 'ROAM'], rationale: 'ฮีโร่สารพัดประโยชน์ เล่นได้ถึง 4 ตำแหน่ง หลอกดราฟต์ได้สูงมาก' },
  mina: { roles: ['ROAM', 'DSL'], rationale: 'สลับลง Roamer ดึงศัตรู หรือ Dark Slayer Lane ยืนชนไฟต์' },
  maloch: { roles: ['DSL', 'MID', 'ROAM'], rationale: 'กระโดดเปิดไฟต์สร้างทรูดาเมจ เล่นได้ทั้งเลนข้าง เลนกลาง และซัพพอร์ต' },
  iggy: { roles: ['MID', 'ROAM'], rationale: 'สร้างโซนเคลียร์เวฟระยะไกล สลับเล่นเป็นโป้กเกอร์ซัพพอร์ตได้' },
  ryoma: { roles: ['DSL', 'JG'], rationale: 'ระยะแทงไกล คุมระยะได้ดีทั้งในเลนและตำแหน่งฟาร์มป่า' },
  skud: { roles: ['DSL', 'JG'], rationale: 'หมัดหนัก เลือดหนา เล่นได้ทั้งป่าเน้นเจาะป้อมและเลนข้าง' },
  tulen: { roles: ['MID', 'JG'], rationale: 'สายเบิร์สต์สโนว์บอล สลับเล่นมิดเลนและจังเกิ้ลตามแผน' },
  valhein: { roles: ['ADL', 'MID'], rationale: 'สตั๊นเร็ว ดันเวฟไว โยกเล่นได้ทั้งเลนมังกรและเลนกลาง' },
  wonder_woman: { roles: ['DSL', 'JG', 'ROAM'], rationale: 'รวบสตั๊นและมีเกราะหนา สลับเล่นได้หลายตำแหน่ง' },
  zill: { roles: ['JG', 'MID'], rationale: 'เวทเบิร์สต์ล้วงหลัง เล่นได้ทั้งป่าและเลนกลาง' },
};

// Known S-Tier First Picks in Competitive Meta
export const ROV_FIRST_PICK_TIER: Record<string, { score: number; reason: string }> = {
  liliana: { score: 95, reason: 'มิดเลนอันดับ 1 มีทั้งโป้กเกอร์ระยะไกลและร่างจิ้งจอกเบิร์สต์ ไม่มีจุดอ่อนชัดเจน' },
  elsu: { score: 94, reason: 'ยิงส่องไกล คุมวิชั่นด้วยเซนเซอร์ เป็น First Pick ที่ปลอดภัยและกดดันสูงมาก' },
  aoi: { score: 96, reason: 'ป่าที่คล่องตัวที่สุดในเมต้า โหนสลิงล้วงแนวหลังและเอาตัวรอดได้อย่างยอดเยี่ยม' },
  charlotte: { score: 92, reason: 'ไฟต์เตอร์เลนข้างตัวท็อป มีลดความเร็วโจมตีและดาเมจสวนกลับต่อเนื่อง' },
  yan: { score: 91, reason: 'เลทเกมเก่งมาก รำต่อเนื่องในไฟต์และแก้ทางตัวล้วงได้ดี' },
  helen: { score: 93, reason: 'ซัพพอร์ตฮีลแรง เสริมความอึดให้ทั้งทีม ยืนไฟต์ยืดเยื้อได้นาน' },
  teemee: { score: 92, reason: 'เร่งเงินในเลนและมีสกิลชุบชีวิต คุ้มค่าแก่การแย่งเป็นตัวแรก' },
  florentino: { score: 90, reason: 'หากนักกีฬาเชี่ยวชาญ เป็นตัวคุมเลนข้างที่สร้างความได้เปรียบสูง' },
  capheny: { score: 91, reason: 'แครี่ยิงเดินได้ สเกลดาเมจไฟต์หนักและเล่นคู่กับซัพพอร์ตได้หลากหลาย' },
  violet: { score: 89, reason: 'กลิ้งยิงโป้กระยะปลอดภัย เล่นง่ายและสม่ำเสมอในทุกดราฟต์' },
};

// Known Counter Matchup Matrix for Tactical Validation
export const ROV_COUNTER_MAP: Record<string, Array<{ target: string; advantage: number; note: string }>> = {
  omen: [
    { target: 'nakroth', advantage: 28, note: 'อัลติเมทดักจับขัง Nakroth ไม่ให้กระโดดหนี' },
    { target: 'aoi', advantage: 25, note: 'ล็อคตัว Aoi หยุดการโหนสลิงในทีมไฟต์' },
    { target: 'murad', advantage: 24, note: 'จับ Murad ในจังหวะพุ่งเข้ามา' },
    { target: 'keera', advantage: 22, note: 'ขัง Keera ไม่ให้มุดกำแพงหนี' },
  ],
  aleister: [
    { target: 'aoi', advantage: 30, note: 'บีบล็อคชะงัก (Suppression) ไม่ให้กดสกิลหรือโหนสลิง' },
    { target: 'nakroth', advantage: 28, note: 'ขังตัวล้วงที่พุ่งเข้ามา' },
    { target: 'florentino', advantage: 26, note: 'จับล็อก Florentino ระหว่างรำดอกไม้' },
    { target: 'murad', advantage: 27, note: 'จับล็อก Murad ก่อนกดสกิลกลับร่างเดิม' },
  ],
  arum: [
    { target: 'aoi', advantage: 32, note: 'อัลติเมทผูกวิญญาณแลกเลือด หยุดตัวล้วงทันที' },
    { target: 'nakroth', advantage: 30, note: 'ผูกวิญญาณจับตาย' },
    { target: 'florentino', advantage: 28, note: 'จับแลกเลือดทะลุป้องกัน' },
  ],
  chaugnar: [
    { target: 'lorion', advantage: 30, note: 'ล้างสถานะยกขึ้นฟ้าของ Lorion ทั้งทีม' },
    { target: 'gildur', advantage: 32, note: 'ล้างสตั๊นต่อเนื่องของ Gildur' },
    { target: 'alice', advantage: 28, note: 'ล้างใบ้และสโลว์ในวงกว้าง' },
    { target: 'toro', advantage: 22, note: 'ล้างจังหวะกระแทกยกพื้น' },
  ],
  hayate: [
    { target: 'thane', advantage: 25, note: 'ดาเมจจริง (True Damage) เจาะแทงค์เลือดหนา' },
    { target: 'toro', advantage: 26, note: 'เจาะเกราะทะลวง Toro ได้อย่างรวดเร็ว' },
    { target: 'maloch', advantage: 20, note: 'วิ่งยิงรักษาระยะไม่โดนดาบฟัน' },
  ],
  joker: [
    { target: 'kriknak', advantage: 28, note: 'สกิล 2 กันดาเมจกายภาพ 100% สวนกลับเบิร์สต์ตาย' },
    { target: 'quillen', advantage: 25, note: 'อมตะกายภาพสวนกลับตัวล่องหน' },
    { target: 'nakroth', advantage: 24, note: 'กันคอมโบชุดแรกแล้วยิงสวน' },
  ],
  teemee: [
    { target: 'kriknak', advantage: 24, note: 'ชุบชีวิตเพื่อนที่โดนเบิร์สต์ในพริบตา' },
    { target: 'keera', advantage: 22, note: 'แก้จังหวะไดฟ์ฆ่าแครี่' },
  ],
};

// MCU Comfort Roster Definitions
export const MCU_COMFORT_MAP: Record<string, Array<{ heroName: string; confidence: 'high' | 'medium' }>> = {
  overfly: [
    { heroName: 'Florentino', confidence: 'high' },
    { heroName: 'Yena', confidence: 'high' },
    { heroName: 'Omen', confidence: 'high' },
    { heroName: 'Riktor', confidence: 'high' },
    { heroName: 'Richter', confidence: 'high' },
    { heroName: 'Ryoma', confidence: 'medium' },
  ],
  erez: [
    { heroName: 'Capheny', confidence: 'high' },
    { heroName: 'Elsu', confidence: 'high' },
    { heroName: 'Hayate', confidence: 'high' },
    { heroName: 'Violet', confidence: 'high' },
    { heroName: 'Joker', confidence: 'medium' },
  ],
  tony: [
    { heroName: 'TeeMee', confidence: 'high' },
    { heroName: 'Toro', confidence: 'high' },
    { heroName: 'Helen', confidence: 'high' },
    { heroName: 'Lumburr', confidence: 'high' },
    { heroName: 'Thane', confidence: 'medium' },
  ],
  nunu: [
    { heroName: 'Liliana', confidence: 'high' },
    { heroName: 'Iggy', confidence: 'high' },
    { heroName: 'Raz', confidence: 'high' },
    { heroName: 'Krixi', confidence: 'medium' },
    { heroName: 'Tulen', confidence: 'medium' },
  ],
  jungle: [
    { heroName: 'Aoi', confidence: 'high' },
    { heroName: 'Nakroth', confidence: 'high' },
    { heroName: 'Yan', confidence: 'high' },
    { heroName: 'Keera', confidence: 'high' },
    { heroName: 'Kriknak', confidence: 'medium' },
  ],
};

// Fallback alternatives mapping by role
export const HERO_FALLBACK_TABLE: Record<string, { alt1: string; alt2: string; reason: string }> = {
  capheny: { alt1: 'Violet', alt2: 'Hayate', reason: 'คงศักยภาพการทำดาเมจต่อเนื่องและความคล่องตัวในไฟต์' },
  elsu: { alt1: 'Violet', alt2: 'Joker', reason: 'คงระยะการยิงที่ปลอดภัยและการส่องทำลายศัตรูก่อนปะทะ' },
  hayate: { alt1: 'Slimz', alt2: 'Capheny', reason: 'รักษาความสามารถในการเจาะแทงค์เลือดหนาและไคท์ศัตรู' },
  aoi: { alt1: 'Keera', alt2: 'Nakroth', reason: 'รักษาความสามารถในการล้วงตัวบางและคล่องตัวสูงในป่า' },
  nakroth: { alt1: 'Aoi', alt2: 'Murad', reason: 'เน้นความคล่องตัว การดันเลนแยก และการคุมจังหวะเกมเร็ว' },
  keera: { alt1: 'Paine', alt2: 'Zill', reason: 'รักษาดาเมจเวทล้วงหลังแบบรวดเร็วเฉียบพลัน' },
  liliana: { alt1: 'Iggy', alt2: 'Raz', reason: 'คงพลังการเคลียร์เวฟและทำดาเมจโป้กระยะปลอดภัย' },
  iggy: { alt1: 'Liliana', alt2: 'Krixi', reason: 'เน้นการโป้กระยะไกลและการตัดเลือดศัตรูจากแนวหลัง' },
  raz: { alt1: 'Lorion', alt2: 'Tulen', reason: 'รักษาจังหวะการทำซีซีสตั๊นและเบิร์สต์ดาเมจชุดเดียว' },
  florentino: { alt1: 'Yena', alt2: 'Charlotte', reason: 'รักษาความแข็งแกร่งในการดวล 1v1 เลนข้างและแยกดัน' },
  yena: { alt1: 'Florentino', alt2: 'Omen', reason: 'เน้นไฟต์เตอร์ที่มีซีซีและดาเมจตัดแครี่ได้ดี' },
  omen: { alt1: 'Roxie', alt2: 'Mina', reason: 'คงบทบาทการล็อคเป้าเดี่ยวและการแยกดันเลนข้างอย่างปลอดภัย' },
  riktor: { alt1: 'Yena', alt2: 'Ryoma', reason: 'รักษาการตัดไฟต์จากพุ่มและการคุมพื้นที่เลนข้าง' },
  richter: { alt1: 'Yena', alt2: 'Ryoma', reason: 'รักษาการตัดไฟต์จากพุ่มและการคุมพื้นที่เลนข้าง' },
  teemee: { alt1: 'Helen', alt2: 'Toro', reason: 'เน้นการปกป้องแครี่และช่วยให้ทีมรอดชีวิตในจังหวะไฟต์' },
  helen: { alt1: 'TeeMee', alt2: 'Lumburr', reason: 'คงการรักษาความต่อเนื่องของเลือดในทีมไฟต์' },
  toro: { alt1: 'Thane', alt2: 'Lumburr', reason: 'รักษาการเปิดไฟต์แนวหน้าและเกราะต้านทานซีซี' },
  lumburr: { alt1: 'Thane', alt2: 'Toro', reason: 'คงการยกกระแทกเปิดไฟต์และบัฟเกราะให้เพื่อนร่วมทีม' },
};

export class DraftScenarioSimulatorService {
  /**
   * Returns list of heroes strictly not yet picked or banned in the scenario
   */
  public getAvailableHeroes(
    allHeroes: Hero[],
    blueBans: Array<{ hero: Hero | null }>,
    redBans: Array<{ hero: Hero | null }>,
    bluePicks: Array<{ hero: Hero | null; pos: LaneSelectKey }>,
    redPicks: Array<{ hero: Hero | null; pos: LaneSelectKey }>
  ): Hero[] {
    const unavailable = new Set<string>();

    blueBans.forEach((b) => b.hero && unavailable.add(b.hero.name.toLowerCase()));
    redBans.forEach((b) => b.hero && unavailable.add(b.hero.name.toLowerCase()));
    bluePicks.forEach((p) => p.hero && unavailable.add(p.hero.name.toLowerCase()));
    redPicks.forEach((p) => p.hero && unavailable.add(p.hero.name.toLowerCase()));

    return allHeroes.filter((h) => !unavailable.has(h.name.toLowerCase()));
  }

  /**
   * Retrieves Set of hero names currently unavailable (picked or banned) in the scenario
   */
  public getUnavailableHeroNames(scenario: SimulatorScenario): Set<string> {
    const unavailable = new Set<string>();
    scenario.blueBans?.forEach((b) => b.hero && unavailable.add(b.hero.name));
    scenario.redBans?.forEach((b) => b.hero && unavailable.add(b.hero.name));
    scenario.bluePicks?.forEach((p) => p.hero && unavailable.add(p.hero.name));
    scenario.redPicks?.forEach((p) => p.hero && unavailable.add(p.hero.name));
    return unavailable;
  }

  /**
   * Generates recommendations strictly excluding unavailable heroes with Tactical Fit Score
   */
  public getFilteredRecommendations(
    scenario: SimulatorScenario,
    team: TeamSide = 'blue',
    roleFilter: LaneSelectKey | 'all' = 'all',
    players: Player[] = []
  ): Array<{
    hero: Hero;
    tacticalFitScore: number;
    tacticalReason: string;
    profile: HeroTacticalProfile;
  }> {
    const unavailable = this.getUnavailableHeroNames(scenario);
    const oppPicks = team === 'blue' ? scenario.redPicks || [] : scenario.bluePicks || [];
    const myPicks = team === 'blue' ? scenario.bluePicks || [] : scenario.redPicks || [];

    const availableHeroes = HEROES.filter((h) => !unavailable.has(h.name));
    const roleFiltered = roleFilter === 'all'
      ? availableHeroes
      : availableHeroes.filter((h) => h.primaryPos.toLowerCase() === roleFilter.toLowerCase() || ROV_FLEX_HEROES[h.name.toLowerCase()]?.roles.includes(roleFilter));

    return roleFiltered.map((hero) => {
      const profile = this.analyzeHeroTacticalProfile(hero, oppPicks, myPicks, players);
      let tacticalFitScore = profile.firstPickScore || 70;
      if (profile.counterAgainst.length > 0) {
        tacticalFitScore += 8;
      }
      if (profile.comfortInfo) {
        tacticalFitScore += 6;
      }
      return {
        hero,
        tacticalFitScore: Math.min(98, tacticalFitScore),
        tacticalReason: profile.badges[0]?.description || 'ตัวเลือกตามเมต้าและโครงสร้างดราฟต์',
        profile,
      };
    }).sort((a, b) => b.tacticalFitScore - a.tacticalFitScore);
  }

  /**
   * Analyzes tactical roles for a hero: First Pick, Counter Pick, Comfort Pick, Flex Pick
   */
  public analyzeHeroTacticalProfile(
    hero: Hero,
    arg2?: any,
    arg3?: any,
    arg4?: any,
    arg5?: any
  ): HeroTacticalProfile {
    let rawOppPicks: any[] = [];
    let rawMyPicks: any[] = [];
    let players: Player[] = [];

    if (Array.isArray(arg2)) {
      rawOppPicks = arg2;
      rawMyPicks = Array.isArray(arg3) ? arg3 : [];
      players = Array.isArray(arg4) ? arg4 : [];
    } else {
      // (hero, pos, team, oppPicks, players)
      rawOppPicks = Array.isArray(arg4) ? arg4 : [];
      players = Array.isArray(arg5) ? arg5 : [];
    }

    const oppPicks: Array<{ hero: Hero | null }> = rawOppPicks.map((item: any) =>
      item && 'name' in item ? { hero: item } : (item || { hero: null })
    );
    const myPicks: Array<{ hero: Hero | null }> = rawMyPicks.map((item: any) =>
      item && 'name' in item ? { hero: item } : (item || { hero: null })
    );

    const badges: TacticalRoleBadge[] = [];
    const heroKey = hero.name.toLowerCase();

    // 1. First Pick Viability
    let firstPickScore = 70;
    const fpData = ROV_FIRST_PICK_TIER[heroKey];
    if (fpData) {
      firstPickScore = fpData.score;
      badges.push({
        type: 'first_pick',
        label: 'First Pick Tier',
        description: fpData.reason,
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300',
        detail: `ความมั่นคงในการหยิบตัวแรก: ${fpData.score}/100`,
      });
    }

    // 2. Counter Pick Analysis
    const counterAgainst: Array<{ oppHero: string; advantage: number; note: string }> = [];
    const directCounters = ROV_COUNTER_MAP[heroKey] || [];
    oppPicks.forEach((op) => {
      if (!op.hero) return;
      const opKey = op.hero.name.toLowerCase();

      // Check direct counter map
      const foundDirect = directCounters.find((dc) => dc.target.toLowerCase() === opKey);
      if (foundDirect) {
        counterAgainst.push({
          oppHero: op.hero.name,
          advantage: foundDirect.advantage,
          note: foundDirect.note,
        });
      } else {
        // Fallback to stats data provider matchup
        const adv = statsDataProvider.getHeadToHead(hero.name, op.hero.name);
        if (adv && adv.diff >= 5) {
          counterAgainst.push({
            oppHero: op.hero.name,
            advantage: Math.round(adv.diff),
            note: `ได้เปรียบทางสถิติการดวลเลนและไฟต์ +${adv.diff.toFixed(1)}%`,
          });
        }
      }
    });

    if (counterAgainst.length > 0) {
      badges.push({
        type: 'counter_pick',
        label: `Counter Pick (${counterAgainst.length})`,
        description: `แก้ทาง ${counterAgainst.map((c) => c.oppHero).join(', ')} ได้โดยตรง`,
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-300',
        detail: counterAgainst.map((c) => `${c.oppHero}: ${c.note}`).join(' • '),
      });
    }

    // 3. Comfort Pick Analysis
    let comfortInfo: { playerName: string; role: string; confidence: 'high' | 'medium' } | undefined = undefined;
    for (const [pKey, pool] of Object.entries(MCU_COMFORT_MAP)) {
      const match = pool.find((entry) => entry.heroName.toLowerCase() === heroKey);
      if (match) {
        // Map player key to display name
        const displayName = pKey.charAt(0).toUpperCase() + pKey.slice(1);
        comfortInfo = {
          playerName: displayName,
          role: hero.primaryPos.toUpperCase(),
          confidence: match.confidence,
        };
        badges.push({
          type: 'comfort_pick',
          label: `Comfort Pick (${displayName})`,
          description: `ฮีโร่ถนัดสูงของ ${displayName} มีชั่วโมงฝึกซ้อมและผลงานการันตี`,
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-300',
          detail: `ความมั่นใจระดับ: ${match.confidence === 'high' ? 'สูงมาก (Tier S)' : 'ปานกลาง (Tier A)'}`,
        });
        break;
      }
    }

    // 4. Flex Pick Analysis
    const flexData = ROV_FLEX_HEROES[heroKey];
    const flexRoles = flexData ? flexData.roles : [hero.primaryPos as LaneSelectKey];
    if (flexData && flexData.roles.length > 1) {
      badges.push({
        type: 'flex_pick',
        label: `Flex Pick (${flexData.roles.join('/')})`,
        description: flexData.rationale,
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-300',
        detail: `โยกเล่นได้หลายเลน: ${flexData.roles.join(', ')}`,
      });
    }

    return {
      hero,
      badges,
      firstPickScore,
      counterAgainst,
      comfortInfo,
      flexRoles,
    };
  }

  /**
   * Simulates ripple impact when a hero is picked or banned
   */
  public calculateRippleImpact(
    arg1: any,
    arg2: any,
    team: TeamSide = 'blue',
    currentBlue: any = [],
    currentRed: any = []
  ): RippleImpactAnalysis {
    let action: 'pick' | 'ban' = 'pick';
    let hero: Hero;

    if (typeof arg1 === 'string' && (arg1 === 'pick' || arg1 === 'ban')) {
      action = arg1;
      hero = arg2;
    } else {
      hero = arg1;
      action = arg2 === 'ban' ? 'ban' : 'pick';
    }

    const normBlue: Array<{ hero: Hero | null }> = Array.isArray(currentBlue)
      ? currentBlue.map((item: any) => (item && 'name' in item ? { hero: item } : (item || { hero: null })))
      : [];
    const normRed: Array<{ hero: Hero | null }> = Array.isArray(currentRed)
      ? currentRed.map((item: any) => (item && 'name' in item ? { hero: item } : (item || { hero: null })))
      : [];

    const heroKey = hero.name.toLowerCase();
    const deniedOpponentPicks: string[] = [];
    const unlockedTeamSynergies: string[] = [];
    let threatLevel: 'high' | 'medium' | 'low' = 'medium';
    let tacticalImpactSummary = '';

    if (action === 'ban') {
      threatLevel = 'high';
      tacticalImpactSummary = `ตัดตัวเลือกสำคัญของ ${team === 'blue' ? 'Red' : 'Blue'} Side ออกจากการแข่งขัน ป้องกันไม่ให้คู่แข่งใช้คอมโบหลัก`;
      deniedOpponentPicks.push(hero.name);

      if (heroKey === 'elsu') {
        tacticalImpactSummary = 'ตัดวิชั่นสอดแนมและพลังโป้กระยะไกล บังคับให้คู่แข่งต้องเล่นแครี่ระยะสั้น';
      } else if (heroKey === 'teemee') {
        tacticalImpactSummary = 'ตัดระบบเร่งการเงินและชุบชีวิต ลดโอกาสที่คู่แข่งจะสโนว์บอลแบบไร้ความเสี่ยง';
      } else if (heroKey === 'aoi') {
        tacticalImpactSummary = 'ตัดป่าความคล่องตัวสูงพิเศษ ช่วยให้เลนแครี่และมิดเลนเล่นได้อย่างปลอดภัยขึ้น';
      }
    } else {
      // Action === 'pick'
      tacticalImpactSummary = `เพิ่มตัวเลือกตำแหน่ง ${hero.primaryPos.toUpperCase()} ให้กับทีม (${hero.name}) พร้อมสร้างแรงกดดันในแผนที่`;

      // Check synergies with existing team picks
      const teamPicks = team === 'blue' ? normBlue : normRed;
      teamPicks.forEach((tp) => {
        if (!tp.hero) return;
        const syn = statsDataProvider.getHeroSynergyPair(hero.name, tp.hero.name);
        const lowerH = hero.name.toLowerCase();
        const lowerT = tp.hero.name.toLowerCase();
        const isKnownTacticalSynergy =
          (lowerH === 'capheny' && lowerT === 'teemee') ||
          (lowerH === 'teemee' && lowerT === 'capheny') ||
          (lowerH === 'elsu' && lowerT === 'gildur') ||
          (lowerH === 'hayate' && lowerT === 'rouie');

        if ((syn && syn.winRate >= 55) || isKnownTacticalSynergy) {
          const detail = syn ? `Win Rate ${syn.winRate.toFixed(1)}%` : 'Tactical Gold & Hypercarry Synergy';
          unlockedTeamSynergies.push(`${hero.name} + ${tp.hero.name} (${detail})`);
        }
      });

      // Denies this hero for opponent
      deniedOpponentPicks.push(`${hero.name} (คู่แข่งไม่สามารถหยิบได้แล้ว)`);

      if (ROV_FIRST_PICK_TIER[heroKey]) {
        threatLevel = 'high';
        tacticalImpactSummary += ` • ยึดฮีโร่ระดับ S-Tier ประจำเมต้าได้สำเร็จ`;
      }
    }

    return {
      action,
      hero,
      team,
      deniedOpponentPicks,
      unlockedTeamSynergies,
      tacticalImpactSummary,
      threatLevel,
    };
  }

  /**
   * Generates fallback contingency options for a target hero if banned or hijacked
   */
  public generateFallback(
    targetHero: Hero,
    role: LaneSelectKey,
    allHeroes: Hero[] = HEROES,
    unavailableHeroNames: Set<string> = new Set<string>()
  ): FallbackOption {
    const heroKey = targetHero.name.toLowerCase();
    const mapped = HERO_FALLBACK_TABLE[heroKey];

    const findAvailable = (name?: string): Hero | null => {
      if (!name) return null;
      if (unavailableHeroNames.has(name.toLowerCase())) return null;
      return allHeroes.find((h) => h.name.toLowerCase() === name.toLowerCase()) || null;
    };

    // Try finding alt1 and alt2 from table
    let pHero = mapped ? findAvailable(mapped.alt1) : null;
    let sHero = mapped ? findAvailable(mapped.alt2) : null;

    // Fallback search by role if needed
    if (!pHero) {
      pHero = allHeroes.find((h) =>
        h.primaryPos.toLowerCase() === role.toLowerCase() &&
        !unavailableHeroNames.has(h.name.toLowerCase()) &&
        h.name.toLowerCase() !== heroKey
      ) || null;
    }

    if (!sHero) {
      sHero = allHeroes.find((h) =>
        h.primaryPos.toLowerCase() === role.toLowerCase() &&
        !unavailableHeroNames.has(h.name.toLowerCase()) &&
        h.name.toLowerCase() !== heroKey &&
        pHero && h.name.toLowerCase() !== pHero.name.toLowerCase()
      ) || null;
    }

    const fallbackPrimary: Hero = pHero || targetHero;
    const fallbackSecondary: Hero = sHero || targetHero;

    return {
      targetHero,
      role,
      primaryBackup: {
        hero: fallbackPrimary,
        reason: mapped?.reason || `คงบทบาทตำแหน่ง ${role} และความสมดุลในเลน`,
        similarityScore: 88,
      },
      secondaryBackup: {
        hero: fallbackSecondary,
        reason: `ตัวเลือกฉุกเฉินตำแหน่ง ${role} ป้องกันการถูกแบนซ้อน`,
        similarityScore: 80,
      },
    };
  }

  /**
   * Analyzes missing roles, active synergies, strengths, weaknesses, and tactical risks
   */
  public analyzeScenarioTactics(
    picks: Array<{ hero: Hero | null; pos: LaneSelectKey }>,
    oppPicks: Array<{ hero: Hero | null; pos: LaneSelectKey }>
  ): {
    missingLanes: LaneSelectKey[];
    filledLanes: LaneSelectKey[];
    synergies: string[];
    strengths: string[];
    weaknesses: string[];
    risks: string[];
  } {
    const allLanes: LaneSelectKey[] = ['DSL', 'JG', 'MID', 'ADL', 'ROAM'];
    const filledLanes: LaneSelectKey[] = [];
    const pickedHeroes: Hero[] = [];

    picks.forEach((p) => {
      if (p.hero) {
        filledLanes.push(p.pos);
        pickedHeroes.push(p.hero);
      }
    });

    const missingLanes = allLanes.filter((lane) => !filledLanes.includes(lane));

    // Synergies detection
    const synergies: string[] = [];
    for (let i = 0; i < pickedHeroes.length; i++) {
      for (let j = i + 1; j < pickedHeroes.length; j++) {
        const h1 = pickedHeroes[i];
        const h2 = pickedHeroes[j];
        const syn = statsDataProvider.getHeroSynergyPair(h1.name, h2.name);
        if (syn && syn.winRate >= 55) {
          synergies.push(`${h1.name} + ${h2.name} (${syn.winRate.toFixed(1)}% WR)`);
        }
      }
    }

    // Strengths, Weaknesses, and Risks computation
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const risks: string[] = [];

    const hasMage = pickedHeroes.some(
      (h) => h.r?.toLowerCase() === 'mage' || h.roles?.some((r) => r.toLowerCase() === 'mage') || h.primaryPos === 'mid'
    );
    const hasTank = pickedHeroes.some(
      (h) => h.r?.toLowerCase() === 'tank' || h.roles?.some((r) => r.toLowerCase() === 'tank') || h.primaryPos === 'roam' || h.name.toLowerCase() === 'toro'
    );
    const hasMarksman = pickedHeroes.some(
      (h) => h.r?.toLowerCase() === 'marksman' || h.roles?.some((r) => r.toLowerCase() === 'marksman') || h.primaryPos === 'adl'
    );
    const hasAssassin = pickedHeroes.some(
      (h) => h.r?.toLowerCase() === 'assassin' || h.roles?.some((r) => r.toLowerCase() === 'assassin') || h.primaryPos === 'jg'
    );

    if (hasMarksman && hasTank) strengths.push('มีแกนหน้า-หลังที่สมดุล (Front-to-Back Teamfight)');
    if (hasAssassin && hasMage) strengths.push('มีพลังสังหารเป้าหมายเดี่ยวรวดเร็ว (High Burst Potential)');
    if (pickedHeroes.some((h) => ['elsu', 'liliana', 'iggy', 'violet'].includes(h.name.toLowerCase()))) {
      strengths.push('มีความสามารถในการโป้กเจาะเลือดและคุมโซนระยะไกล');
    }

    if (!hasMage && pickedHeroes.length >= 3) {
      weaknesses.push('ขาดดาเมจเวท (Low AP) ศัตรูสามารถออกเกราะกายภาพต้านได้ง่าย');
      risks.push('เสี่ยงถูกคู่แข่งดันเกราะกายภาพหนาแล้วบุกทะลวง');
    }
    if (!hasTank && pickedHeroes.length >= 3) {
      weaknesses.push('ขาดตัวเปิดไฟต์หลักและตัวรับดาเมจแถวหน้า (Squishy Comp)');
      risks.push('เสี่ยงถูกฝ่ายตรงข้ามดักเบิร์สต์ตายก่อนได้ทำดาเมจ');
    }
    if (missingLanes.length > 0 && pickedHeroes.length >= 4) {
      weaknesses.push(`ยังขาดผู้เล่นในตำแหน่ง: ${missingLanes.join(', ')}`);
    }

    return {
      missingLanes,
      filledLanes,
      synergies,
      strengths: strengths.length > 0 ? strengths : ['คอมโพซิชันกำลังอยู่ในระหว่างการพัฒนา'],
      weaknesses: weaknesses.length > 0 ? weaknesses : ['ไม่พบจุดอ่อนรุนแรงในภาพรวม'],
      risks: risks.length > 0 ? risks : ['ความเสี่ยงอยู่ในระดับควบคุมได้'],
    };
  }

  public generateFallbacks(
    targetHero: Hero,
    role: LaneSelectKey,
    allHeroes: Hero[] = HEROES,
    unavailableHeroNames: Set<string> = new Set<string>()
  ): FallbackOption {
    return this.generateFallback(targetHero, role, allHeroes, unavailableHeroNames);
  }

  /**
   * Comprehensive composition analysis with missing roles, synergies, strengths, weaknesses, and risks
   */
  public analyzeComposition(
    picks: Array<{ hero: Hero | null; pos: LaneSelectKey }>,
    oppPicks: Array<{ hero: Hero | null; pos: LaneSelectKey }>
  ): {
    missingRoles: LaneSelectKey[];
    missingLanes: LaneSelectKey[];
    filledRoles: LaneSelectKey[];
    filledLanes: LaneSelectKey[];
    synergies: string[];
    strengths: string[];
    weaknesses: string[];
    tacticalRisks: string[];
    risks: string[];
    warnings: string[];
  } {
    const tactics = this.analyzeScenarioTactics(picks, oppPicks);
    const warnings: string[] = [];
    if (tactics.missingLanes.length > 0) {
      warnings.push(`ขาดตำแหน่งจำเป็นในทีมไฟต์: ${tactics.missingLanes.join(', ')}`);
    }
    return {
      missingRoles: tactics.missingLanes,
      missingLanes: tactics.missingLanes,
      filledRoles: tactics.filledLanes,
      filledLanes: tactics.filledLanes,
      synergies: tactics.synergies,
      strengths: tactics.strengths,
      weaknesses: tactics.weaknesses,
      tacticalRisks: tactics.risks,
      risks: tactics.risks,
      warnings,
    };
  }

  /**
   * Creates initial Plan A, Plan B, and Plan C templates from an existing scenario or blank state
   */
  public createInitialPlans(
    bluePicks: Array<{ hero: Hero | null; pos: LaneSelectKey }>,
    redPicks: Array<{ hero: Hero | null; pos: LaneSelectKey }>,
    allHeroes: Hero[] = HEROES
  ): ScenarioPlan[] {
    const toPlanSlots = (
      slots: Array<{ hero: Hero | null; pos: LaneSelectKey }>
    ): PlanPickSlot[] => {
      const unavailable = new Set<string>();
      slots.forEach((s) => s.hero && unavailable.add(s.hero.name.toLowerCase()));

      return slots.map((s) => {
        if (!s.hero) return { hero: null, pos: s.pos };
        const fb = this.generateFallback(s.hero, s.pos, allHeroes, unavailable);
        return {
          hero: s.hero,
          pos: s.pos,
          isTarget: true,
          backupHero1: fb.primaryBackup.hero,
          backupHero2: fb.secondaryBackup.hero,
          backupReason: fb.primaryBackup.reason,
        };
      });
    };

    const planA: ScenarioPlan = {
      id: 'plan_a',
      name: 'แผน A: Primary Win-Condition (แผนหลัก)',
      description: 'เน้นคอมโบหลักที่ทีมซ้อมมาดีที่สุด อาศัยพลังการสโนว์บอลและการคุมจังหวะไฟต์',
      tacticalGoal: 'ชิงความได้เปรียบเลนกลางและอ็อบเจกต์แรก ปิดเกมภายใน 15 นาที',
      bluePicks: toPlanSlots(bluePicks),
      redPicks: toPlanSlots(redPicks),
      notes: 'หากได้ฮีโร่เป้าหมายครบ แผนนี้จะมีความคล่องตัวและการเบิร์สต์ดาเมจสูงสุด',
      keyWinCondition: 'คุมมังกรตัวแรกและดันป้อมนอกให้หมดก่อนนาทีที่ 8',
      contingencyTrigger: 'หากฮีโร่แครี่หรือป่าถูกแบน ให้สลับไปใช้แผน B ทันที',
    };

    const planB: ScenarioPlan = {
      id: 'plan_b',
      name: 'แผน B: Counter & Pivot (แผนแก้ทาง)',
      description: 'ปรับดราฟต์เพื่อดักแก้ทางตัวแก้ของคู่แข่ง เน้นการสวนกลับและเล่นตามความผิดพลาด',
      tacticalGoal: 'ดักซุ่มสวนไฟต์และตัดจังหวะตัวล้วงของคู่แข่งด้วย Hard CC',
      bluePicks: toPlanSlots(bluePicks),
      redPicks: toPlanSlots(redPicks),
      notes: 'เตรียมไว้รับมือเมื่อคู่แข่งแย่ง First Pick หรือตัดแครี่หลักของทีม',
      keyWinCondition: 'ยืนโซนรับแน่นหนา รอคู่แข่งเปิดก่อนแล้วสวนกลับด้วยอัลติเมทหมู่',
      contingencyTrigger: 'หากคู่แข่งเลือกคอมพ์ถึกหนา ให้ปรับเพิ่มดาเมจจริง (True Damage)',
    };

    const planC: ScenarioPlan = {
      id: 'plan_c',
      name: 'แผน C: Late-Game Scaling (แผนยื้อเลทเกม)',
      description: 'เน้นคอมพ์สเกลเลทเกม แครี่สองตัวหรือไฟต์เตอร์ตัวแบกที่แข็งแกร่งหลังนาทีที่ 15',
      tacticalGoal: 'ยื้อเกมอย่างปลอดภัย คุมฐาน และพลิกไฟต์ในการต่อสู้หน้า Dark Slayer',
      bluePicks: toPlanSlots(bluePicks),
      redPicks: toPlanSlots(redPicks),
      notes: 'เหมาะสำหรับเกมที่เจอทีมเล่นเกมช้า หรือสถานการณ์ที่ต้องการความแน่นอน',
      keyWinCondition: 'ปกป้องแครี่หลักจนไอเทมครบ 6 ชิ้นแล้วรวมกลุ่มจบเกม',
      contingencyTrigger: 'หากเสียป้อมไว ให้รวมกลุ่ม 5 คนกันฐาน ห้ามแยกดันเดี่ยว',
    };

    return [planA, planB, planC];
  }

  public createDefaultPlans(
    bluePicks: Array<{ hero: Hero | null; pos: LaneSelectKey }>,
    redPicks: Array<{ hero: Hero | null; pos: LaneSelectKey }>,
    allHeroes: Hero[] = HEROES
  ): ScenarioPlan[] {
    return this.createInitialPlans(bluePicks, redPicks, allHeroes);
  }
}

export const draftScenarioSimulatorService = new DraftScenarioSimulatorService();
