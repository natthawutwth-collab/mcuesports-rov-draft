import { PostDraftReportData, TeamDamageDistribution } from '../types/postDraftReport';
import { Hero, LaneSelectKey } from '../types/draft';
import { HEROES } from '../data/heroes';

// Known RoV True Damage specialists
const TRUE_DAMAGE_HEROES = new Set([
  'Hayate', 'Tachi', 'Florentino', 'Allain', 'Maloch', 'Lauriel', 'Omen', 'Airi', 'Richter'
]);

// Known Pure Magic Damage heroes
const MAGIC_HEROES = new Set([
  'Liliana', 'Raz', 'Lorion', 'Zata', 'Mganga', 'Marja', 'Aleister', 'Iggy', 'Veera',
  'Krixi', 'Tulen', 'Lauriel', 'Diaochan', 'Keera', 'Paine', 'Sephera', 'Ilumia',
  'Preyta', 'Jinnar', 'Azzen\'Ka', 'D\'Arcy', 'Dirak', 'Edras', 'Bonnie', 'Gildur'
]);

// Strong Initiators / Hard CC
const HARD_ENGAGE_HEROES = new Set([
  'Toro', 'Maloch', 'Lorion', 'Krizzix', 'Thane', 'Baldum', 'Ormarr', 'Lumburr',
  'Grok', 'Mina', 'Arum', 'Aleister', 'Riktor', 'Qi', 'Florentino', 'Zuka', 'Wonder Woman',
  'Cresht', 'Y\'bneth', 'Enzo', 'Wiro Sableng'
]);

// Strong Protective Peel / Disengage
const PEEL_HEROES = new Set([
  'TeeMee', 'Thane', 'Toro', 'Mina', 'Lumburr', 'Baldum', 'Chaugnar', 'Anette',
  'Rouie', 'Helen', 'Alice', 'Aya', 'Zip', 'Teeri', 'Taara', 'Roxie'
]);

// Fast Objective (Slayer/Dragon) takers
const FAST_OBJECTIVE_TAKERS = new Set([
  'Fennik', 'Keera', 'Capheny', 'Hayate', 'Eland\'orr', 'Nakroth', 'Aoi', 'Slimz',
  'Lindis', 'Kil\'Groth', 'Sinestrea', 'Wisp', 'Laville'
]);

// Early game bullies (Lv 1-4)
const EARLY_GAME_HEROES = new Set([
  'Qi', 'Riktor', 'Enzo', 'Mganga', 'Toro', 'Raz', 'Aoi', 'Ryoma', 'Valhein',
  'Billow', 'Skud', 'Florentino', 'Veres', 'Elsu'
]);

// Late game hyper-scalers (Lv 12+)
const LATE_GAME_HEROES = new Set([
  'Capheny', 'Hayate', 'Tel\'Annas', 'Wisp', 'Laville', 'Lauriel', 'Keera',
  'Airi', 'Allain', 'Sinestrea', 'TeeMee', 'Kil\'Groth', 'Slimz'
]);

export function generatePostDraftReport(
  analyzedSide: 'blue' | 'red',
  blueTeamName: string,
  redTeamName: string,
  ourPicks: Array<{ hero: Hero | null; pos: LaneSelectKey }>,
  oppPicks: Array<{ hero: Hero | null; pos: LaneSelectKey }>
): PostDraftReportData {
  const activePicks = ourPicks.filter((p) => p.hero !== null);
  const heroNames = activePicks.map((p) => p.hero!.name);

  // 1. Lineup mapping
  const lineup = activePicks.map((p) => {
    const h = p.hero!;
    let damageType: 'Physical' | 'Magical' | 'True' | 'Hybrid' = 'Physical';
    if (TRUE_DAMAGE_HEROES.has(h.name)) damageType = 'True';
    else if (MAGIC_HEROES.has(h.name)) damageType = 'Magical';
    else if (['Allain', 'Hayate', 'Valhein', 'Gildur'].includes(h.name)) damageType = 'Hybrid';

    return {
      heroName: h.name,
      position: p.pos || h.primaryPos.toUpperCase(),
      role: h.r || h.roles[0] || 'Unknown',
      damageType,
      avatarUrl: h.avatarUrl,
    };
  });

  // 2. Damage Distribution calculation
  let magicPoints = 0;
  let truePoints = 0;
  let physPoints = 0;

  lineup.forEach((item) => {
    if (item.damageType === 'Magical') magicPoints += 10;
    else if (item.damageType === 'True') truePoints += 8;
    else if (item.damageType === 'Hybrid') {
      magicPoints += 4;
      physPoints += 4;
      truePoints += 2;
    } else {
      physPoints += 10;
    }
  });

  const totalPoints = Math.max(1, magicPoints + truePoints + physPoints);
  const physicalPct = Math.round((physPoints / totalPoints) * 100);
  const magicalPct = Math.round((magicPoints / totalPoints) * 100);
  const trueDamagePct = 100 - physicalPct - magicalPct;

  let primaryDamageProfile: 'Burst Heavy' | 'Sustained DPS' | 'Poke & Siege' | 'Balanced Mixed' = 'Balanced Mixed';
  const hasMarksman = lineup.some((l) => l.role === 'marksman' || l.position === 'ADL');
  const hasBurstMage = heroNames.some((n) => ['Raz', 'Lorion', 'Zata', 'Veera', 'Liliana', 'Krixi', 'Keera'].includes(n));
  const hasPoke = heroNames.some((n) => ['Elsu', 'Iggy', 'Liliana', 'Stuart', 'Capheny'].includes(n));

  if (hasPoke && hasBurstMage) primaryDamageProfile = 'Poke & Siege';
  else if (hasBurstMage && !hasMarksman) primaryDamageProfile = 'Burst Heavy';
  else if (hasMarksman && trueDamagePct > 15) primaryDamageProfile = 'Sustained DPS';
  else primaryDamageProfile = 'Balanced Mixed';

  const damageDistribution: TeamDamageDistribution = {
    physicalPct,
    magicalPct,
    trueDamagePct: Math.max(0, trueDamagePct),
    primaryDamageProfile,
  };

  // 3. Strengths & Weaknesses
  const strengths: Array<{ title: string; description: string; tag: string }> = [];
  const weaknesses: Array<{ title: string; description: string; tag: string; severity: 'high' | 'medium' | 'low' }> = [];

  // Evaluate strengths
  if (heroNames.some((n) => HARD_ENGAGE_HEROES.has(n))) {
    const initiators = heroNames.filter((n) => HARD_ENGAGE_HEROES.has(n)).join(', ');
    strengths.push({
      title: 'ตัวเปิดไฟต์หนักแน่น (Hard Initiation)',
      description: `มีฮีโร่เปิดไฟต์ที่ทรงพลัง (${initiators}) สามารถชิงจังหวะเปิดทีมไฟต์และสร้างความได้เปรียบในพื้นที่แคบได้ทันที`,
      tag: 'CC & Engage',
    });
  }

  if (heroNames.some((n) => PEEL_HEROES.has(n))) {
    const peelers = heroNames.filter((n) => PEEL_HEROES.has(n)).join(', ');
    strengths.push({
      title: 'การปกป้องตัวดาเมจหลัก (Backline Protection)',
      description: `มีสกิลตัดจังหวะและเซฟแครี่ (${peelers}) รองรับการโดนล้วงจากแอสซาซินศัตรู`,
      tag: 'Peel',
    });
  }

  if (magicalPct >= 25 && physicalPct >= 40) {
    strengths.push({
      title: 'สมดุลดาเมจสองสาย (Damage Hybrid Balance)',
      description: 'มีการกระจายดาเมจทั้งกายภาพและเวทมนตร์อย่างเหมาะสม ทำให้ศัตรูออกไอเทมป้องกันแก้ทางได้ยาก',
      tag: 'Damage Balance',
    });
  }

  if (heroNames.some((n) => FAST_OBJECTIVE_TAKERS.has(n))) {
    strengths.push({
      title: 'ความเร็วในการเบิร์สต์ออบเจกต์ใหญ่ (Fast Objective DPS)',
      description: 'มีตัวทำดาเมจต่อเนื่องสูง สามารถเก็บ Abyssal Dragon และ Dark Slayer ได้อย่างรวดเร็วเมื่อศัตรูเสียตำแหน่ง',
      tag: 'Macro Objective',
    });
  }

  if (strengths.length === 0) {
    strengths.push({
      title: 'ความยืดหยุ่นในตำแหน่งเลน (Flexible Laning)',
      description: 'ฮีโร่สามารถสลับเลนและปรับเปลี่ยนแผนระหว่างแมตช์ได้ตามสถานการณ์การเดินเกม',
      tag: 'Flexibility',
    });
  }

  // Evaluate weaknesses
  if (magicalPct < 15) {
    weaknesses.push({
      title: 'ขาดดาเมจเวทมนตร์ (Low Magical Threat)',
      description: 'ทีมมีดาเมจเวทต่ำกว่า 15% ศัตรูสามารถขึ้นไอเทมเกราะกายภาพ (Shield of the Lost / Mail of Pain) ได้อย่างเต็มที่โดยไม่ต้องกังวลดาเมจเวท',
      tag: 'Damage Vulnerability',
      severity: 'high',
    });
  } else if (physicalPct < 30) {
    weaknesses.push({
      title: 'ขาดดาเมจกายภาพในการดันป้อม (Low Tower Siege DPS)',
      description: 'ดาเมจกายภาพน้อย อาจทำให้การตีป้อมและดันเลนในจังหวะได้เปรียบช้ากว่าที่ควร',
      tag: 'Siege Risk',
      severity: 'medium',
    });
  }

  const hardEngageCount = heroNames.filter((n) => HARD_ENGAGE_HEROES.has(n)).length;
  if (hardEngageCount === 0) {
    weaknesses.push({
      title: 'ขาดตัวเปิดไฟต์ระยะไกล (Lack of Reliable Engage)',
      description: 'ไม่มีฮีโร่เปิดไฟต์ที่แม่นยำ ต้องพึ่งพาการรอจังหวะศัตรูพลาด หรือโดนศัตรูเป็นฝ่ายคุมเชิงเปิดไฟต์ใส่ก่อน',
      tag: 'Initiation Gap',
      severity: 'high',
    });
  }

  const peelCount = heroNames.filter((n) => PEEL_HEROES.has(n)).length;
  if (peelCount === 0 && hasMarksman) {
    weaknesses.push({
      title: 'แนวหลังเสี่ยงโดนล้วง (Squishy Backline Vulnerability)',
      description: 'แครี่ขาดตัวโซนและคอยสตั๊นเซฟหน้า อาจตกเป็นเป้าหมายง่ายหากเจอคอมโบไดฟ์หรือแอสซาซินความคล่องตัวสูง',
      tag: 'Survival Risk',
      severity: 'high',
    });
  }

  if (weaknesses.length === 0) {
    weaknesses.push({
      title: 'ขึ้นอยู่กับความแม่นยำในการคูลดาวน์สกิล (Cooldown Reliant)',
      description: 'หากพลาดสกิลสำคัญในจังหวะปะทะแรก อาจเสียเปรียบในไฟต์ยืดเยื้อ',
      tag: 'Execution Risk',
      severity: 'low',
    });
  }

  // 4. Game Phases Timeline
  const earlyHeroes = heroNames.filter((n) => EARLY_GAME_HEROES.has(n));
  const lateHeroes = heroNames.filter((n) => LATE_GAME_HEROES.has(n));

  const earlyRating: 'Strong' | 'Average' | 'Weak' = earlyHeroes.length >= 2 ? 'Strong' : earlyHeroes.length === 1 ? 'Average' : 'Weak';
  const lateRating: 'Strong' | 'Average' | 'Weak' = lateHeroes.length >= 2 ? 'Strong' : lateHeroes.length === 1 ? 'Average' : 'Weak';
  const midRating: 'Strong' | 'Average' | 'Weak' = hardEngageCount >= 1 ? 'Strong' : 'Average';

  const earlyGame = {
    rating: earlyRating,
    timing: '00:00 - 05:00 นาที (ช่วงต้นเกม & เลเวล 4 แรก)',
    details: earlyRating === 'Strong'
      ? `มีตัวคุมเลนต้นเกมและแย่ง Creep กลางได้ดี (${earlyHeroes.join(', ')}) ควรกดดันอินเวดบัฟหรือชิง First Dragon`
      : 'ควรเล่นอย่างรัดกุม รอดักไฟต์ตามเลน ไม่แนะนำให้ฝืนอินเวดป่าลึกหากไม่มีวิสัยทัศน์ที่ชัดเจน',
  };

  const midGame = {
    rating: midRating,
    timing: '05:00 - 12:00 นาที (ช่วงไฟต์มิดเกมและเดินรวมกลุ่ม)',
    details: midRating === 'Strong'
      ? 'ช่วงพาวเวอร์สไปก์สำคัญของทีม ควรเดินกลุ่ม 4 คนคุมเลนแม่น้ำและดักพุ่มชิงความได้เปรียบเพื่อตีป้อมนอก'
      : 'ต้องระวังการโดนดักตัดผู้เล่นในจังหวะเดินข้ามเลน พยายามเช็คพุ่มด้วยสกิลก่อนเดินผ่าน',
  };

  const lateGame = {
    rating: lateRating,
    timing: '12:00+ นาที (ไฟต์ชิง Dark Slayer & จบเกม)',
    details: lateRating === 'Strong'
      ? `มีตัวแบกเลทเกมที่รุนแรง (${lateHeroes.join(', ')}) หากรักษาพื้นที่และจัดฟอร์เมชั่นหน้าไฟต์ได้ จะมีโอกาสชนะไฟต์สูงมาก`
      : 'ควรรีบปิดเกมและคุม Dark Slayer ให้เด็ดขาด อย่าปล่อยให้เกมยืดเยื้อจนแครี่ศัตรูมีไอเทมครบ 6 ชิ้น',
  };

  // 5. Tactical Capabilities
  const primaryEngagers = heroNames.filter((n) => HARD_ENGAGE_HEROES.has(n));
  const frontliners = heroNames.filter((n) => ['Toro', 'Thane', 'Mina', 'Skud', 'Maloch', 'Baldum', 'Taara', 'Lumburr'].includes(n));
  const protectiveTools = heroNames.filter((n) => PEEL_HEROES.has(n));

  const engageOptions = {
    primary: primaryEngagers.slice(0, 2),
    secondary: heroNames.filter((n) => ['Raz', 'Aoi', 'Zata', 'Allain', 'Qi'].includes(n)).slice(0, 2),
    description: primaryEngagers.length > 0
      ? `ใช้ ${primaryEngagers[0]} เป็นตัวเปิดหลัก รอจังหวะศัตรูรวมกลุ่มเพื่อสร้างจังหวะ CC ต่อเนื่อง`
      : 'ขาดตัวเปิดตรงๆ แนะนำให้รอศัตรูเดินหลุดเข้าพุ่ม หรือใช้สกิลสโลว์ดักตัดจากด้านข้าง (Flank)',
  };

  const peelOptions = {
    frontliners: frontliners.length > 0 ? frontliners : ['ไฟต์เตอร์แนวหน้า'],
    protectiveTools: protectiveTools.length > 0 ? protectiveTools : ['การรักษาระยะ Positioning'],
    description: protectiveTools.length > 0
      ? `มี ${protectiveTools.join(', ')} คอยยืนซ้อนหลังแนวหน้า 1 สเต็ปเพื่อสกัดตัวล้วง`
      : 'ต้องเน้นให้แครี่และเมจยืนชิดขอบไฟต์ หลีกเลี่ยงมุมอับที่อาจโดนอ้อมหลัง',
  };

  const objectiveControl = {
    slayerBurst: (heroNames.some((n) => FAST_OBJECTIVE_TAKERS.has(n)) ? 'Very Fast' : 'Moderate') as 'Very Fast' | 'Fast' | 'Moderate' | 'Slow',
    zoneControl: frontliners.length > 0 ? 'แข็งแกร่ง (โซนทางเข้าแม่น้ำได้ดี)' : 'ปานกลาง (ต้องระวังโดนสวน)',
    details: 'การคุม Dark Slayer ควรกางวิสัยทัศน์ในป่าฝั่งศัตรูก่อนเริ่มตี 20 วินาที เพื่อป้องกันการโดนแย่ง (Smite Steal)',
  };

  // 6. Tactical Win Conditions
  const winConditions = [
    {
      step: 1,
      title: 'คุมจังหวะเวฟเลนและสร้างความได้เปรียบเงิน (Economy & Wave Management)',
      description: 'ดันเวฟเลนคู่ขนานก่อนเคลื่อนตัวเข้าสู่ออบเจกต์ใหญ่ เพื่อบีบให้ศัตรูต้องส่งคนไปเคลียร์เวฟ',
      conditionType: 'Macro' as const,
    },
    {
      step: 2,
      title: 'บังคับทีมไฟต์ในมุมที่ได้เปรียบ (Favorable Front-to-Back Engagement)',
      description: `ให้แนวหน้า (${frontliners[0] || 'แทงค์'}) ยืนสกรีนรับดาเมจระลอกแรก และเปิดพื้นที่ให้ตัวดาเมจหลักปล่อยดาเมจเต็มประสิทธิภาพ`,
      conditionType: 'Teamfight' as const,
    },
    {
      step: 3,
      title: 'จบเกมด้วยบัฟ Dark Slayer (Infinite Slayer Siege)',
      description: 'ใช้มังกรและเวฟครีปหนุนดันเข้าป้อมในพร้อมกัน 2 เลน หลีกเลี่ยงการไดฟ์ใต้ป้อมโดยไม่มีครีป',
      conditionType: 'Macro' as const,
    },
  ];

  return {
    generatedAt: new Date().toISOString(),
    isCompleted: activePicks.length >= 5,
    blueTeamName: blueTeamName || 'Blue Side',
    redTeamName: redTeamName || 'Red Side',
    analyzedSide,
    lineup,
    damageDistribution,
    strengths,
    weaknesses,
    earlyGame,
    midGame,
    lateGame,
    engageOptions,
    peelOptions,
    objectiveControl,
    winConditions,
    disclaimer:
      'ข้อควรระวัง: คำแนะนำเชิงกลยุทธ์และการวิเคราะห์ทั้งหมดเป็นการประเมินทางทฤษฎีจากคุณสมบัติฮีโร่และเมต้าการแข่งขัน ไม่ใช่ข้อเท็จจริงทางสถิติหรือการการันตีผลการแข่งขันในสนามจริง ผลลัพธ์ขึ้นอยู่กับแผนการเล่นและการประสานงานจริงของทีม',
  };
}
