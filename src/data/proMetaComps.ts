// Data: Pro Player Draft Compositions (คอมโบและดราฟต์ยอดฮิตที่โปรเพลเยอร์ใช้บ่อยใน RoV Pro League)
// อ้างอิงจากเมต้าการแข่งจริงของ RoV Pro League (เช่น Buriram United, FULL SENSE, Bacon Time)
// คัดสรรเฉพาะคู่หูและคอมโบ 2-4 ตัวที่มีการประสานงานจริงในสนามแข่ง

export interface ProCompBan {
  hero: string;
  phase: 'Phase 1 Ban' | 'Phase 2 Ban';
  priority: 'must_ban' | 'recommended';
  reason: string;
}

export interface ProMetaComp {
  id: string;
  name: string;
  nameTh: string;
  tier: 'S+' | 'S' | 'A+';
  coreCount: number; // 2, 3, or 4
  coreHeroes: string[];
  roles: Record<string, string>; // heroName -> lane/role
  stage: 'Group Stage' | 'Playoffs' | 'Both';
  popularTeams: string[];
  tacticalDescription: string;
  keyStrengths: string[];
  countersWhat: string[];
  weakAgainst: string[];
  recommendedPickOrder: string[];
  priorityBans: ProCompBan[]; // ตัวที่โปรต้องแบนเมื่อเล่นคอมพ์นี้ (Priority Ban List)
  fullLineup: {
    dsl: string;
    jg: string;
    mid: string;
    roam: string;
    adl: string;
  };
}

export const RPL_2026_PRO_COMPS: ProMetaComp[] = [
  {
    id: 'comp_hyper_gold',
    name: 'Hyper Gold Economy (TeeMee + Capheny)',
    nameTh: 'คอมพ์เร่งเงิน ไฮเปอร์แครี่ (TeeMee + Capheny)',
    tier: 'S+',
    coreCount: 3,
    coreHeroes: ['TeeMee', 'Capheny', 'Lorion'],
    roles: {
      'TeeMee': 'Support / Roam',
      'Capheny': 'Abyssal Dragon Lane',
      'Lorion': 'Mid Lane',
      'Skud': 'Dark Slayer Lane',
      'Enzo': 'Jungle',
    },
    stage: 'Both',
    popularTeams: ['FULL SENSE', 'Buriram United Esports', 'Bacon Time'],
    tacticalDescription:
      'คอมพ์คลาสสิกที่เห็นบ่อยที่สุดในโปรลีก TeeMee ใช้ Passive เพิ่มเงินให้ Capheny ออกไอเทมนำศัตรู 1-2 ชิ้นอย่างรวดเร็ว พร้อมสกิลอัลติชุบชีวิตประกันความปลอดภัยให้แครี่ และ Lorion กางลูกแก้วไฟฟ้ายกศัตรูเปิดทางให้ Capheny กราดยิงเลเซอร์',
    keyStrengths: [
      'อัตราการเงินแครี่นำคู่แข่ง 1,500 - 2,500 โกลด์',
      'มีชุบชีวิตฟรีจาก TeeMee ทำให้แครี่กล้าเล่นตำแหน่งดุดัน',
      'ดาเมจไฟต์ต่อเนื่องรอบทิศทาง',
    ],
    countersWhat: ['คอมพ์ที่ต้องรอเลทเกม', 'คอมพ์ไฟเตอร์ที่ไม่มีเบิร์สต์หนัก'],
    weakAgainst: ['คอมพ์แอสซาซินล้วงไวระดับสูง (Aoi, Keera)', 'ตัวทำลายการเงินอย่าง Hayate'],
    recommendedPickOrder: ['TeeMee (First Pick)', 'Capheny (Phase 1)', 'Lorion (Phase 1/2)'],
    priorityBans: [
      {
        hero: 'Aoi',
        phase: 'Phase 1 Ban',
        priority: 'must_ban',
        reason: 'โหนสลิงข้ามแนวหน้ามาล้วงฆ่า Capheny เร็วกว่าที่ TeeMee จะกดชุบชีวิตได้ทัน',
      },
      {
        hero: 'Hayate',
        phase: 'Phase 1 Ban',
        priority: 'must_ban',
        reason: 'ทรูดาเมจและไคท์ระยะยิงสู้ Capheny ได้ดี ละลายทีมที่มีบัฟเกราะของ TeeMee',
      },
      {
        hero: 'Keera',
        phase: 'Phase 2 Ban',
        priority: 'recommended',
        reason: 'มุดกำแพงพุ่งใส่ Capheny ด้วยดาเมจเวทล้วน ทะลุเกราะกายภาพของ TeeMee',
      },
    ],
    fullLineup: {
      dsl: 'Skud',
      jg: 'Enzo',
      mid: 'Lorion',
      roam: 'TeeMee',
      adl: 'Capheny',
    },
  },
  {
    id: 'comp_global_rouie',
    name: 'Global Recall & Instant Teamfight (Rouie + Eland\'orr / Yan)',
    nameTh: 'คอมพ์ประตูมิติสลับไฟต์ (Rouie + Eland\'orr / Yan)',
    tier: 'S+',
    coreCount: 3,
    coreHeroes: ['Rouie', 'Eland\'orr', 'Yan'],
    roles: {
      'Rouie': 'Support / Roam',
      'Eland\'orr': 'Abyssal Dragon Lane / Jungle',
      'Yan': 'Dark Slayer Lane / Jungle',
      'Marja': 'Mid Lane',
      'Aoi': 'Jungle',
    },
    stage: 'Both',
    popularTeams: ['FULL SENSE (แผนประจำทีม)', 'SOLYX', 'Bacon Time'],
    tacticalDescription:
      'คอมพ์แท็กติกระดับท็อปของการแข่งโปรลีก Rouie วางวงวาปกลับบ้านให้ Eland\'orr หรือ Yan กดสกิลทิ้งไว้ แลกเลือดจนใกล้หมดแล้ววาปกลับบ่อเติม HP 100% แล้วกดสกิลบินกลับมาไฟต์ต่อทันที ทำให้ทีมศัตรูเสียทั้งสกิลและทรัพยากรฟรี',
    keyStrengths: [
      'ความสามารถในการดันป้อม 2 เลนพร้อมกัน และวาปมารวมตัว 5 คนทันที',
      'การันตีการชิง Dark Slayer และ Abyssal Dragon จากการรวมพลที่เร็วกว่า',
      'Eland\'orr และ Yan เทรดเลือดฟรีได้ตลอดเวลา',
    ],
    countersWhat: ['ทีมไฟต์ช้า', 'ทีมที่ขาดสกิลขัดจังหวะวงวาป'],
    weakAgainst: ['ฮีโร่ดึง/ผลักออกจากวงวาป (Grakk, Zip, Mina, Thane)'],
    recommendedPickOrder: ['Rouie (Must Pick)', 'Eland\'orr (Phase 1)', 'Yan (Phase 1/2)'],
    priorityBans: [
      {
        hero: 'Zip',
        phase: 'Phase 1 Ban',
        priority: 'must_ban',
        reason: 'ดูดกลืนเพื่อนร่วมทีมหรือกลิ้งชนขัดจังหวะวงวาป Rouie และอมเพื่อนหนีไฟต์ตอน Rouie เรียกมารวมตัว',
      },
      {
        hero: 'Grakk',
        phase: 'Phase 1 Ban',
        priority: 'must_ban',
        reason: 'ตะขอเกี่ยวเพื่อนที่กำลังยืนรอดวงวาปหลุดออกจากวง Rouie และโดนรุมสังหารทันที',
      },
      {
        hero: 'Aleister',
        phase: 'Phase 2 Ban',
        priority: 'recommended',
        reason: 'ล็อคเป้าจับ Eland\'orr หรือ Yan คาที่ในวงวาป ขัดขวางไม่ให้กดสกิลกลับมาไฟต์ต่อ',
      },
    ],
    fullLineup: {
      dsl: 'Yan',
      jg: 'Aoi',
      mid: 'Marja',
      roam: 'Rouie',
      adl: 'Eland\'orr',
    },
  },
  {
    id: 'comp_long_range_snipers',
    name: 'Long-Range Hook & Sniping (Elsu + Grakk)',
    nameTh: 'คอมพ์ดักดึงสอยไกล (Elsu + Grakk)',
    tier: 'S',
    coreCount: 3,
    coreHeroes: ['Elsu', 'Grakk', 'Iggy'],
    roles: {
      'Elsu': 'Abyssal Dragon Lane',
      'Grakk': 'Support / Roam',
      'Iggy': 'Mid Lane',
      'Riktor': 'Dark Slayer Lane',
      'Aoi': 'Jungle',
    },
    stage: 'Both',
    popularTeams: ['Buriram United Esports', 'Tenacity', 'Bacon Time'],
    tacticalDescription:
      'คอมพ์คุมวิสัยทัศน์และพื้นที่ป่าระยะไกล Elsu วางเซ็นเซอร์ดักตาและส่องสไนเปอร์ระยะจอคู่กับระเบิดบอมบ์ของ Iggy บังคับให้ศัตรูต้องถอย และเมื่อศัตรูเดินหลบ Grakk จะตะขอฮุคดึงเข้ามารุมสังหารเพื่อชิงความได้เปรียบตัวผู้เล่นก่อนเปิดไฟต์',
    keyStrengths: [
      'วิสัยทัศน์ในแมพเหนือกว่าศัตรูด้วย Sensor Elsu และการดักพุ่มของ Riktor',
      'กดดันและทำลายป้อมโดยไม่ต้องเอาตัวเข้าไปเสี่ยง',
      'อัตราการคิลก่อนเริ่มไฟต์ (Pickoff) สูงมากจากฮุค Grakk',
    ],
    countersWhat: ['คอมพ์ยืนรวมกันเป็นกลุ่ม', 'ฮีโร่ระยะสั้นเดินติดกัน'],
    weakAgainst: ['คอมพ์แอสซาซินล้วงไวข้ามกำแพง (Aoi, Paine, Keera)'],
    recommendedPickOrder: ['Elsu (First Pick)', 'Iggy (Phase 1)', 'Grakk (Phase 2)'],
    priorityBans: [
      {
        hero: 'Aoi',
        phase: 'Phase 1 Ban',
        priority: 'must_ban',
        reason: 'ความคล่องตัวในการโหนสลิงสูงมาก สามารถหลบฮุค Grakk และพุ่งตรงเข้าล้วง Elsu และ Iggy ที่ยืนยิงไกล',
      },
      {
        hero: 'Paine',
        phase: 'Phase 1 Ban',
        priority: 'must_ban',
        reason: 'บินข้ามจอด้วยความเงียบและเข้าถึงตัวแนวหลังสไนเปอร์ได้ในพริบตาพร้อมใบ้ไม่ให้กดสกิล',
      },
      {
        hero: 'Toro',
        phase: 'Phase 2 Ban',
        priority: 'recommended',
        reason: 'แทงค์หนาที่มีภูมิคุ้มกัน CC เดินนำรับกระสุนสไนเปอร์และลูกไฟแทนเพื่อนร่วมทีมได้สบาย',
      },
    ],
    fullLineup: {
      dsl: 'Riktor',
      jg: 'Aoi',
      mid: 'Iggy',
      roam: 'Grakk',
      adl: 'Elsu',
    },
  },
  {
    id: 'comp_fast_invis_dive',
    name: 'Fast Invisibility Ambush (Krizzix + Raz)',
    nameTh: 'คอมพ์ล่องหนสายฟ้าแลบ (Krizzix + Raz)',
    tier: 'S',
    coreCount: 3,
    coreHeroes: ['Krizzix', 'Raz', 'Keera'],
    roles: {
      'Krizzix': 'Support / Roam',
      'Raz': 'Mid Lane',
      'Keera': 'Jungle',
      'Florentino': 'Dark Slayer Lane',
      'Stuart': 'Abyssal Dragon Lane',
    },
    stage: 'Both',
    popularTeams: ['Bacon Time', 'Buriram United Esports', 'FULL SENSE'],
    tacticalDescription:
      'คอมพ์เปิดไฟต์ความเร็วสูงที่โปรลีกนิยมใช้ Krizzix กดอัลติพาทีมล่องหนด้วยความเร็วสูงเข้าโอบล้อมแล้วใช้สกิล 2 ดูดรวบศัตรู Raz ต่อยผลักสตั๊นท์ยกรวม และ Keera มุดกำแพงสังหารแครี่ศัตรูให้ดับใน 1 วินาที',
    keyStrengths: [
      'ความเร็วในการเข้าถึงตัวเป้าหมายเร็วที่สุดในเกม',
      'พลังเบิร์สต์ดาเมจเวทและกายภาพผสมลบตัวหลักศัตรูได้ทันที',
      'ชิงความได้เปรียบในพุ่มไม้และไฟต์ในป่าแคบๆ ได้เด็ดขาด',
    ],
    countersWhat: ['แครี่ไร้สกิลหนี (Valhein, Tel\'Annas, Laville)', 'ซัพพอร์ตเดินช้า'],
    weakAgainst: ['ล้างสถานะวงกว้าง (Chaugnar)', 'การชุบชีวิตของ TeeMee'],
    recommendedPickOrder: ['Keera (First Pick)', 'Raz (Phase 1)', 'Krizzix (Phase 2)'],
    priorityBans: [
      {
        hero: 'Chaugnar',
        phase: 'Phase 1 Ban',
        priority: 'must_ban',
        reason: 'อัลติล้างสถานะ CC ทั้งทีม แก้ทางการดูดรวบของ Krizzix และสตั๊นท์ของ Raz ทำให้คอมพ์เบิร์สต์ล้มเหลวทันที',
      },
      {
        hero: 'TeeMee',
        phase: 'Phase 1 Ban',
        priority: 'must_ban',
        reason: 'สกิลอัลติชุบชีวิตเพื่อน ทำให้คอมพ์ที่ทุ่มสกิลเบิร์สต์จบใน 1 วินาทีหมดสกิลฟรีและโดนตลบหลัง',
      },
      {
        hero: 'Zip',
        phase: 'Phase 2 Ban',
        priority: 'recommended',
        reason: 'ดูดเพื่อนที่กำลังโดน Keera มุดล้วงหายเข้าไปในพุง ปลอดภัยจากการเบิร์สต์ 100%',
      },
    ],
    fullLineup: {
      dsl: 'Florentino',
      jg: 'Keera',
      mid: 'Raz',
      roam: 'Krizzix',
      adl: 'Stuart',
    },
  },
  {
    id: 'comp_cc_wombo_arena',
    name: 'Massive Crowd Control Arena (Y\'bneth + Lorion)',
    nameTh: 'คอมพ์โดมขังลอยฟ้า Wombo-Combo (Y\'bneth + Lorion)',
    tier: 'S+',
    coreCount: 3,
    coreHeroes: ['Y\'bneth', 'Lorion', 'Hayate'],
    roles: {
      'Y\'bneth': 'Support / Dark Slayer Lane',
      'Lorion': 'Mid Lane',
      'Hayate': 'Abyssal Dragon Lane',
      'Tachi': 'Dark Slayer Lane',
      'Nakroth': 'Jungle',
    },
    stage: 'Both',
    popularTeams: ['FULL SENSE', 'Buriram United Esports', 'SOLYX'],
    tacticalDescription:
      'Wombo-Combo ที่ทรงพลังที่สุดในไฟต์ 5v5 Y\'bneth เปิดอัลติต้นไม้ขว้างหินสโลว์ 70% บังคับให้ศัตรูติดหล่ม Lorion ขว้างลูกแก้วยกศัตรู 3-4 ตัวลอยฟ้า และ Hayate พุ่งเข้ากระหน่ำกระสุนอัลติ True Damage หมุนใส่ ล้างบางทั้งทีมคู่แข่ง',
    keyStrengths: [
      'พลังทีมไฟต์หน้าบารอนและมังกรที่ยากจะต้านทาน',
      'CC ต่อเนื่องยาวนานกว่า 4 วินาที',
      'ดาเมจปิดฉากแบบ True Damage กวาดล้างทั้งแทงค์และแครี่',
    ],
    countersWhat: ['ทีมไฟต์ประชิด', 'คอมพ์ยืนเกาะกลุ่มรอบแครี่'],
    weakAgainst: ['คอมพ์แยกดัน 1-3-1 (Split Push)', 'Chaugnar ล้างสถานะ'],
    recommendedPickOrder: ['Lorion (Phase 1)', 'Hayate (Phase 1)', 'Y\'bneth (Phase 2)'],
    priorityBans: [
      {
        hero: 'Chaugnar',
        phase: 'Phase 1 Ban',
        priority: 'must_ban',
        reason: 'ตัวเคาน์เตอร์คอมพ์นี้โดยตรง ล้าง CC โดม Lorion และสโลว์ของ Y\'bneth ทันที ทำให้ศัตรูเดินหนีวง Hayate สบาย',
      },
      {
        hero: 'Zip',
        phase: 'Phase 1 Ban',
        priority: 'must_ban',
        reason: 'ดูดเพื่อนทั้งทีมออกจากโดมขังของ Lorion และ Y\'bneth ทำให้คอมพ์เสียอัลติฟรี',
      },
      {
        hero: 'Yan',
        phase: 'Phase 2 Ban',
        priority: 'recommended',
        reason: 'สายแยกดันเลน (Split Push) ที่ไม่ยอมมาปะทะ 5v5 ทำให้คอมพ์ Wombo-Combo เสียเปรียบการคุมแมพ',
      },
    ],
    fullLineup: {
      dsl: 'Tachi',
      jg: 'Nakroth',
      mid: 'Lorion',
      roam: 'Y\'bneth',
      adl: 'Hayate',
    },
  },
  {
    id: 'comp_double_true_dmg',
    name: 'Double True-Damage Anti-Tank (Florentino + Hayate)',
    nameTh: 'คอมพ์ดับเบิลทรูดาเมจ ละลายแทงค์ (Florentino + Hayate)',
    tier: 'S+',
    coreCount: 3,
    coreHeroes: ['Florentino', 'Hayate', 'Toro'],
    roles: {
      'Florentino': 'Dark Slayer Lane',
      'Hayate': 'Abyssal Dragon Lane',
      'Toro': 'Support / Roam',
      'Liliana': 'Mid Lane',
      'Aoi': 'Jungle',
    },
    stage: 'Both',
    popularTeams: ['Buriram United Esports', 'FULL SENSE', 'Bacon Time'],
    tacticalDescription:
      'สูตรสำเร็จในการแก้ทางคอมพ์แทงค์และไฟเตอร์เลือดหนา Florentino เลนบนรำดาบ True Damage ตัดเลือดสูงสุด เลนล่างมี Hayate สไลด์ยิงละลายเกราะ และ Toro ยืนค้ำแนวรับ ทำให้ทีมคู่แข่งไม่สามารถจัดแทงค์มารับมือได้เลย',
    keyStrengths: [
      'ชนะเลนบน 1v1 เด็ดขาดจาก Florentino',
      'ไม่มีแทงค์ตัวใดในเกมสามารถต้านทาน True Damage สองทางได้',
      'Toro ให้การป้องกันแครี่อย่างอุ่นใจในทุกจังหวะไฟต์',
    ],
    countersWhat: ['Skud, Thane, Y\'bneth, Taara, Mina (แทงค์ทุกตัวในเกม)'],
    weakAgainst: ['คอมพ์สตั๊นล็อคเป้ากดหัว Florentino (Aleister, Arum)'],
    recommendedPickOrder: ['Toro (First Pick)', 'Hayate (Phase 1)', 'Florentino (Phase 2 Counter)'],
    priorityBans: [
      {
        hero: 'Aleister',
        phase: 'Phase 1 Ban',
        priority: 'must_ban',
        reason: 'ล็อคเป้ากดหัว Florentino ทันทีที่เข้ามารำดาบ หรือกดหัว Hayate ตอนหมุนอัลติ ปิดทางการเล่น 100%',
      },
      {
        hero: 'Arum',
        phase: 'Phase 1 Ban',
        priority: 'must_ban',
        reason: 'จับแลกเลือดกับ Florentino ไม่ว่า Florentino จะรำเก่งแค่ไหนก็ต้องตายตามทันที',
      },
      {
        hero: 'Elsu',
        phase: 'Phase 2 Ban',
        priority: 'recommended',
        reason: 'สไนเปอร์กดดัน Florentino ให้เลือดลดก่อนไฟต์ ทำให้ไม่กล้าเข้ามารำดาบในระยะประชิด',
      },
    ],
    fullLineup: {
      dsl: 'Florentino',
      jg: 'Aoi',
      mid: 'Liliana',
      roam: 'Toro',
      adl: 'Hayate',
    },
  },
  {
    id: 'comp_immortal_helen',
    name: 'Immortal Health Pool & Sustain (Helen + Skud / Taara)',
    nameTh: 'คอมพ์บ่อน้ำเดินได้ ฮีลไม่จำกัด (Helen + Skud / Taara)',
    tier: 'S',
    coreCount: 3,
    coreHeroes: ['Helen', 'Skud', 'Capheny'],
    roles: {
      'Helen': 'Support / Roam',
      'Skud': 'Dark Slayer Lane / Jungle',
      'Capheny': 'Abyssal Dragon Lane',
      'Iggy': 'Mid Lane',
      'Tachi': 'Dark Slayer Lane',
    },
    stage: 'Both',
    popularTeams: ['FULL SENSE', 'King of Gamers Club', 'Bacon Time'],
    tacticalDescription:
      'คอมพ์ดันป้อมและยื้อไฟต์ Helen ทำหน้าที่เป็นแท่นน้ำพุเคลื่อนที่เพิ่มเกราะและเลือดอย่างมหาศาลให้ Skud หรือ Taara ที่มี HP สูง เดินนำชนป้อมศัตรูและค้ำไฟต์ เปิดทางให้แครี่อย่าง Capheny ยิงทำลายป้อมจบเกมได้อย่างปลอดภัย',
    keyStrengths: [
      'ความสามารถในการดันป้อมและตบเสาบ้านอย่างรวดเร็ว',
      'ศัตรูไม่สามารถเจาะทะลุเกราะและการฮีลของ Helen ได้หากไม่มี True Damage',
      'แครี่เล่นง่าย มีความปลอดภัยสูงมาก',
    ],
    countersWhat: ['คอมพ์ดาเมจตอดเล็กตอดน้อย (Poke Comp)'],
    weakAgainst: ['คอมพ์ True Damage ไว (Florentino, Hayate)', 'ไอเทมตัดเลือด'],
    recommendedPickOrder: ['Capheny (Phase 1)', 'Helen (Phase 1/2)', 'Skud (Phase 2)'],
    priorityBans: [
      {
        hero: 'Hayate',
        phase: 'Phase 1 Ban',
        priority: 'must_ban',
        reason: 'ทรูดาเมจฉีก Skud เลือดหนาละลายในเสี้ยววินาที ข้ามการเพิ่มเกราะกายภาพและเวทของ Helen',
      },
      {
        hero: 'Florentino',
        phase: 'Phase 1 Ban',
        priority: 'must_ban',
        reason: 'แทง True Damage ตัดเลือดสูงสุด ทะลุเกราะและการฟื้นฟูของ Helen ได้อย่างเด็ดขาด',
      },
      {
        hero: 'Mganga',
        phase: 'Phase 2 Ban',
        priority: 'recommended',
        reason: 'แปะพิษตัดเลือดและเบิร์สต์เวทหมู่ต่อเนื่อง บดบังการฮีลของ Helen ในไฟต์ยืดเยื้อ',
      },
    ],
    fullLineup: {
      dsl: 'Tachi',
      jg: 'Skud',
      mid: 'Iggy',
      roam: 'Helen',
      adl: 'Capheny',
    },
  },
  {
    id: 'comp_aya_parasite',
    name: 'Aya Parasite Frontline (Aya + Taara / Skud)',
    nameTh: 'คอมพ์อาย่าขี่หัวแทงค์ ป่วนไฟต์อมตะ (Aya + Taara / Skud)',
    tier: 'S+',
    coreCount: 3,
    coreHeroes: ['Aya', 'Taara', 'Hayate'],
    roles: {
      'Aya': 'Support / Roam',
      'Taara': 'Dark Slayer Lane / Jungle',
      'Hayate': 'Abyssal Dragon Lane',
      'Liliana': 'Mid Lane',
      'Aoi': 'Jungle',
    },
    stage: 'Both',
    popularTeams: ['Buriram United Esports', 'FULL SENSE', 'Bacon Time'],
    tacticalDescription:
      'คอมพ์สุดป่วนที่มักถูกแย่งหรือแบนในการแข่งโปรลีก Aya ขี่บนหัว Taara หรือ Skud ให้เกราะหนา สโลว์ศัตรูรอบตัว และสาปให้ศัตรูกลายเป็นสัตว์ตัวเล็ก Taara สามารถวิ่งฝ่าป้อมและดงศัตรู 5 คนได้โดยไม่ตาย และเปิดพื้นที่ให้แครี่ทำดาเมจฟรี',
    keyStrengths: [
      'ตัวแทงค์กลายเป็นสัตว์ประหลาดที่ฆ่าแทบไม่ได้',
      'สกิลสาปหมูของ Aya พลิกจังหวะทีมไฟต์ได้ในทันที',
      'กดดันแนวหลังศัตรูได้อย่างต่อเนื่องโดยไม่ต้องกลัวตาย',
    ],
    countersWhat: ['ทีมที่ไม่มีทรูดาเมจ', 'คอมพ์แครี่ขาตาย'],
    weakAgainst: ['Hayate (ทรูดาเมจละลายแทงค์)', 'Florentino (รำดาบตัดเลือด)'],
    recommendedPickOrder: ['Aya (First Pick / Ban)', 'Taara (Phase 1/2)', 'Hayate (Phase 1)'],
    priorityBans: [
      {
        hero: 'Hayate',
        phase: 'Phase 1 Ban',
        priority: 'must_ban',
        reason: 'True Damage ละลาย Taara ที่ Aya ขี่หัวอยู่ได้อย่างรวดเร็ว ทำให้คอมพ์เสียตัวยืน',
      },
      {
        hero: 'Florentino',
        phase: 'Phase 1 Ban',
        priority: 'must_ban',
        reason: 'รำดาบฟันแทงค์ที่ Aya เกาะอยู่จนเลือดลดอย่างรวดเร็ว',
      },
      {
        hero: 'Diaochan',
        phase: 'Phase 2 Ban',
        priority: 'recommended',
        reason: 'แช่แข็ง Taara ขัดขวางการวิ่งไล่ป่วนของ Aya',
      },
    ],
    fullLineup: {
      dsl: 'Taara',
      jg: 'Aoi',
      mid: 'Liliana',
      roam: 'Aya',
      adl: 'Hayate',
    },
  },
  {
    id: 'comp_pro_speed_tempo',
    name: 'High-Skill Tempo & Bush Ambush (Aoi + Yena)',
    nameTh: 'คอมพ์ดักพุ่มสปีดเปิดไฟต์ (Aoi + Yena)',
    tier: 'S',
    coreCount: 3,
    coreHeroes: ['Aoi', 'Yena', 'Stuart'],
    roles: {
      'Aoi': 'Jungle',
      'Yena': 'Dark Slayer Lane',
      'Stuart': 'Abyssal Dragon Lane',
      'Thane': 'Support',
      'Raz': 'Mid Lane',
    },
    stage: 'Both',
    popularTeams: ['Buriram United Esports', 'Bacon Time'],
    tacticalDescription:
      'คอมพ์เน้นทักษะระดับสูงของโปรเพลเยอร์ Aoi โหนสลิงข้ามกำแพงล้วงฆ่าแครี่ Yena ดักพุ่มใบ้ด้วยดาบคู่แล้วฟันดาบใหญ่ผลัก และ Stuart กดยิงสโลว์พร้อมอัลติระเบิดปิดดาเมจจากระยะปลอดภัย คุมเกมตั้งแต่ต้นเกม',
    keyStrengths: [
      'การชิงความได้เปรียบต้นเกม (Early Game Tempo) สูงที่สุด',
      'ความคล่องตัวและการหนีเอาตัวรอดของแต่ละคนอยู่ในระดับสูงสุด',
      'สามารถเข้าไฟต์และถอยออกมารีเซ็ตได้ตามใจชอบ',
    ],
    countersWhat: ['คอมพ์ที่พึ่งพาเมจหรือแครี่ขาตาย', 'ทีมที่เซ็ตอัปเกมช้า'],
    weakAgainst: ['คอมพ์รวมกลุ่ม 5 คนตัวหนา (Toro, Thane, Skud)'],
    recommendedPickOrder: ['Aoi (First Pick)', 'Stuart (Phase 1)', 'Yena (Phase 2)'],
    priorityBans: [
      {
        hero: 'Toro',
        phase: 'Phase 1 Ban',
        priority: 'must_ban',
        reason: 'ตัวแทงค์ไม่ติดสถานะ CC เดินนำเช็คพุ่มไม้ ทำลายแผนการดักซุ่มของ Yena และขวางสลิงของ Aoi',
      },
      {
        hero: 'Zip',
        phase: 'Phase 1 Ban',
        priority: 'must_ban',
        reason: 'ดูดแครี่หรือเมจหนีจากการลอบสังหารของ Aoi และ Yena ทำให้คอมพ์เสียทรัพยากรฟรี',
      },
      {
        hero: 'Aleister',
        phase: 'Phase 2 Ban',
        priority: 'recommended',
        reason: 'ล็อคเป้าหยุดสลิงของ Aoi หรือจับหยุด Yena ทันทีที่เปลี่ยนโหมดดาบใหญ่',
      },
    ],
    fullLineup: {
      dsl: 'Yena',
      jg: 'Aoi',
      mid: 'Raz',
      roam: 'Thane',
      adl: 'Stuart',
    },
  },
  {
    id: 'comp_zip_dive',
    name: 'Zip Swallowing Tower Dive (Zip + Yan / Eland\'orr)',
    nameTh: 'คอมพ์ Zip อมทีมไดร์ฟป้อม (Zip + Yan / Eland\'orr)',
    tier: 'S+',
    coreCount: 3,
    coreHeroes: ['Zip', 'Yan', 'Stuart'],
    roles: {
      'Zip': 'Support / Roam',
      'Yan': 'Dark Slayer Lane / Jungle',
      'Stuart': 'Abyssal Dragon Lane',
      'Liliana': 'Mid Lane',
      'Keera': 'Jungle',
    },
    stage: 'Both',
    popularTeams: ['Buriram United Esports', 'FULL SENSE', 'Bacon Time'],
    tacticalDescription:
      'คอมพ์สุดอันตรายที่ Zip ใช้สกิลดูดกลืนเพื่อนร่วมทีมหรือครีปเข้าไปในท้อง แล้วกลิ้งพุ่งชนใต้ป้อมศัตรู ปล่อยเพื่อนออกมาไฟต์แบบไม่เสียเลือด และสามารถอมเพื่อนหนีออกจากสกิลอัลติของศัตรูได้ทุกจังหวะ',
    keyStrengths: [
      'การเซฟเพื่อนร่วมทีมจากการโดนรุมและเบิร์สต์ดาเมจได้ 100%',
      'การไดร์ฟใต้ป้อมที่กดดันศัตรูได้รุนแรงที่สุด',
      'สามารถกลืนครีปชะลอเวฟหรือเร่งเวฟจบเกมได้',
    ],
    countersWhat: ['คอมพ์ที่พึ่งพาสกิลเบิร์สต์เดี่ยว', 'คอมพ์จับตายตัวเดียว'],
    weakAgainst: ['Chaugnar (ล้างสโลว์และพุ่งหนี)', 'Grakk (ฮุคขัดจังหวะ)'],
    recommendedPickOrder: ['Zip (First Pick / Ban)', 'Yan (Phase 1)', 'Stuart (Phase 1/2)'],
    priorityBans: [
      {
        hero: 'Chaugnar',
        phase: 'Phase 1 Ban',
        priority: 'must_ban',
        reason: 'ล้างสถานะสโลว์และสตั๊นท์ตอน Zip กลิ้งเปิด ช่วยให้ทีมศัตรูหนีรอดได้ง่าย',
      },
      {
        hero: 'Grakk',
        phase: 'Phase 1 Ban',
        priority: 'must_ban',
        reason: 'ฮุคดึง Zip หรือเพื่อนก่อนที่ Zip จะได้กดสกิลดูดกลืน',
      },
      {
        hero: 'Aleister',
        phase: 'Phase 2 Ban',
        priority: 'recommended',
        reason: 'ล็อคเป้ากดหัว Zip ไม่ให้กดอมเพื่อนในจังหวะคับขัน',
      },
    ],
    fullLineup: {
      dsl: 'Yan',
      jg: 'Keera',
      mid: 'Liliana',
      roam: 'Zip',
      adl: 'Stuart',
    },
  },
];
