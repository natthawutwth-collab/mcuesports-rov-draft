import { Hero } from "../types/draft";

export const HERO_IMG_MAP: Record<string, string> = {
  "Azzen'Ka": "AzzenKa",
  "D'Arcy": "Darcy",
  "Diaochan": "Diao_Chan",
  "Eland'orr": "Elandorr",
  "Kil'Groth": "Kil_Groth",
  "Tel'Annas": "Tel_Annas",
  "Wukong": "Wu_Kong",
  "The Flash": "The_Flash",
  "Jinnar": "Jinna",
  "Lu Bu": "Lu_Bu",
  "Wonder Woman": "Wonder_Woman",
  "Bolt Baron": "Bolt_Baron",
  "Sikong Zhen": "Bolt_Baron",
  "Wiro Sableng": "Wiro",
  "Arthur": "Mortos",
  "Y'bneth": "Y_bneth"
};

export const HERO_IMG_OVERRIDE: Record<string, string> = {
  "Flowborn": "https://res.cloudinary.com/dtzdhbllb/image/upload/v1775747198/Flowborn.png",
  "Flowborn Mid": "https://res.cloudinary.com/dtzdhbllb/image/upload/v1777620554/Flowborn_mid.jpg",
  "Iggy": "https://res.cloudinary.com/dtzdhbllb/image/upload/v1779828886/iggy.jpg",
  "Riktor": "https://res.cloudinary.com/dtzdhbllb/image/upload/v1779828977/riktor.jpg",
  "Sinestrea": "https://res.cloudinary.com/dtzdhbllb/image/upload/v1779829012/sinestrea.jpg",
  "Tamyn": "https://res.cloudinary.com/dtzdhbllb/image/upload/v1783002370/Tamyn.jpg"
};

export function getHeroImageUrl(name: string): string {
  if (!name || typeof name !== 'string' || !name.trim()) {
    return 'https://res.cloudinary.com/dtzdhbllb/image/upload/v1775747198/Flowborn.png';
  }
  const clean = name.trim();
  if (HERO_IMG_OVERRIDE[clean]) return HERO_IMG_OVERRIDE[clean];
  return `https://res.cloudinary.com/dtzdhbllb/image/upload/${HERO_IMG_MAP[clean] || clean}.jpg`;
}

export const HEROES: Hero[] = [
  {
    "id": "airi",
    "name": "Airi",
    "nameTh": "ไอริ",
    "r": "fighter",
    "roles": [
      "fighter"
    ],
    "pos": [
      "dsl",
      "jg"
    ],
    "primaryPos": "dsl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Airi.jpg",
    "tags": [
      "airi",
      "ไอริ",
      "dsl",
      "jg",
      "fighter"
    ]
  },
  {
    "id": "aleister",
    "name": "Aleister",
    "nameTh": "อเลสเตอร์",
    "r": "mage",
    "roles": [
      "mage"
    ],
    "pos": [
      "mid"
    ],
    "primaryPos": "mid",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Aleister.jpg",
    "tags": [
      "aleister",
      "อเลสเตอร์",
      "mid",
      "mage"
    ]
  },
  {
    "id": "alice",
    "name": "Alice",
    "nameTh": "อลิส",
    "r": "mage",
    "roles": [
      "mage",
      "support",
      "tank"
    ],
    "pos": [
      "roam"
    ],
    "primaryPos": "roam",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Alice.jpg",
    "tags": [
      "alice",
      "อลิส",
      "roam",
      "mage",
      "support",
      "tank"
    ]
  },
  {
    "id": "allain",
    "name": "Allain",
    "nameTh": "อัลเลน",
    "r": "fighter",
    "roles": [
      "fighter"
    ],
    "pos": [
      "dsl"
    ],
    "primaryPos": "dsl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Allain.jpg",
    "tags": [
      "allain",
      "อัลเลน",
      "dsl",
      "fighter"
    ]
  },
  {
    "id": "amily",
    "name": "Amily",
    "nameTh": "เอมิลี่",
    "r": "fighter",
    "roles": [
      "fighter"
    ],
    "pos": [
      "jg",
      "dsl"
    ],
    "primaryPos": "jg",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Amily.jpg",
    "tags": [
      "amily",
      "เอมิลี่",
      "jg",
      "dsl",
      "fighter"
    ]
  },
  {
    "id": "annette",
    "name": "Annette",
    "nameTh": "แอนเน็ตต์",
    "r": "mage",
    "roles": [
      "mage",
      "support",
      "tank"
    ],
    "pos": [
      "roam",
      "mid"
    ],
    "primaryPos": "roam",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Annette.jpg",
    "tags": [
      "annette",
      "แอนเน็ตต์",
      "roam",
      "mid",
      "mage",
      "support",
      "tank"
    ]
  },
  {
    "id": "aoi",
    "name": "Aoi",
    "nameTh": "อาโออิ (อ้อย)",
    "r": "assassin",
    "roles": [
      "assassin"
    ],
    "pos": [
      "jg"
    ],
    "primaryPos": "jg",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Aoi.jpg",
    "tags": [
      "aoi",
      "อาโออิ (อ้อย)",
      "jg",
      "assassin"
    ]
  },
  {
    "id": "arduin",
    "name": "Arduin",
    "nameTh": "อาร์ดอยน์",
    "r": "support",
    "roles": [
      "support",
      "tank"
    ],
    "pos": [
      "roam"
    ],
    "primaryPos": "roam",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Arduin.jpg",
    "tags": [
      "arduin",
      "อาร์ดอยน์",
      "roam",
      "support",
      "tank"
    ]
  },
  {
    "id": "arum",
    "name": "Arum",
    "nameTh": "อารัม",
    "r": "support",
    "roles": [
      "support",
      "tank"
    ],
    "pos": [
      "roam"
    ],
    "primaryPos": "roam",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Arum.jpg",
    "tags": [
      "arum",
      "อารัม",
      "roam",
      "support",
      "tank"
    ]
  },
  {
    "id": "astrid",
    "name": "Astrid",
    "nameTh": "แอสทริด",
    "r": "assassin",
    "roles": [
      "assassin"
    ],
    "pos": [
      "dsl",
      "jg"
    ],
    "primaryPos": "dsl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Astrid.jpg",
    "tags": [
      "astrid",
      "แอสทริด",
      "dsl",
      "jg",
      "assassin"
    ]
  },
  {
    "id": "ata",
    "name": "Ata",
    "nameTh": "อาต้า",
    "r": "fighter",
    "roles": [
      "fighter",
      "support",
      "tank"
    ],
    "pos": [
      "dsl"
    ],
    "primaryPos": "dsl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Ata.jpg",
    "tags": [
      "ata",
      "อาต้า",
      "dsl",
      "fighter",
      "support",
      "tank"
    ]
  },
  {
    "id": "aya",
    "name": "Aya",
    "nameTh": "อายะ",
    "r": "mage",
    "roles": [
      "mage",
      "support",
      "tank"
    ],
    "pos": [
      "mid",
      "roam"
    ],
    "primaryPos": "mid",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Aya.jpg",
    "tags": [
      "aya",
      "อายะ",
      "mid",
      "roam",
      "mage",
      "support",
      "tank"
    ]
  },
  {
    "id": "azzen_ka",
    "name": "Azzen'Ka",
    "nameTh": "แอซเซนก้า",
    "r": "mage",
    "roles": [
      "mage"
    ],
    "pos": [
      "mid"
    ],
    "primaryPos": "mid",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/AzzenKa.jpg",
    "tags": [
      "azzen'ka",
      "แอซเซนก้า",
      "mid",
      "mage"
    ]
  },
  {
    "id": "baldum",
    "name": "Baldum",
    "nameTh": "บัลดัม",
    "r": "support",
    "roles": [
      "support",
      "tank"
    ],
    "pos": [
      "roam"
    ],
    "primaryPos": "roam",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Baldum.jpg",
    "tags": [
      "baldum",
      "บัลดัม",
      "roam",
      "support",
      "tank"
    ]
  },
  {
    "id": "bijan",
    "name": "Bijan",
    "nameTh": "บีจาน",
    "r": "fighter",
    "roles": [
      "fighter"
    ],
    "pos": [
      "dsl"
    ],
    "primaryPos": "dsl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Bijan.jpg",
    "tags": [
      "bijan",
      "บีจาน",
      "dsl",
      "fighter"
    ]
  },
  {
    "id": "billow",
    "name": "Billow",
    "nameTh": "บิลโลว์",
    "r": "fighter",
    "roles": [
      "fighter",
      "assassin"
    ],
    "pos": [
      "jg",
      "dsl"
    ],
    "primaryPos": "jg",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Billow.jpg",
    "tags": [
      "billow",
      "บิลโลว์",
      "jg",
      "dsl",
      "fighter",
      "assassin"
    ]
  },
  {
    "id": "biron",
    "name": "Biron",
    "nameTh": "ไบรอน",
    "r": "fighter",
    "roles": [
      "fighter"
    ],
    "pos": [
      "dsl"
    ],
    "primaryPos": "dsl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Biron.jpg",
    "tags": [
      "biron",
      "ไบรอน",
      "dsl",
      "fighter"
    ]
  },
  {
    "id": "bolt_baron",
    "name": "Bolt Baron",
    "nameTh": "โบลต์บารอน",
    "r": "fighter",
    "roles": [
      "fighter",
      "assassin"
    ],
    "pos": [
      "jg",
      "dsl"
    ],
    "primaryPos": "jg",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Bolt_Baron.jpg",
    "tags": [
      "bolt baron",
      "โบลต์บารอน",
      "jg",
      "dsl",
      "fighter",
      "assassin"
    ]
  },
  {
    "id": "bonnie",
    "name": "Bonnie",
    "nameTh": "บอนนี่",
    "r": "mage",
    "roles": [
      "mage"
    ],
    "pos": [
      "mid"
    ],
    "primaryPos": "mid",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Bonnie.jpg",
    "tags": [
      "bonnie",
      "บอนนี่",
      "mid",
      "mage"
    ]
  },
  {
    "id": "bright",
    "name": "Bright",
    "nameTh": "ไบรท์",
    "r": "marksman",
    "roles": [
      "marksman"
    ],
    "pos": [
      "adl"
    ],
    "primaryPos": "adl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Bright.jpg",
    "tags": [
      "bright",
      "ไบรท์",
      "adl",
      "marksman"
    ]
  },
  {
    "id": "butterfly",
    "name": "Butterfly",
    "nameTh": "บัตเตอร์ฟลาย",
    "r": "assassin",
    "roles": [
      "assassin"
    ],
    "pos": [
      "jg"
    ],
    "primaryPos": "jg",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Butterfly.jpg",
    "tags": [
      "butterfly",
      "บัตเตอร์ฟลาย",
      "jg",
      "assassin"
    ]
  },
  {
    "id": "capheny",
    "name": "Capheny",
    "nameTh": "คาเฟนี่",
    "r": "marksman",
    "roles": [
      "marksman"
    ],
    "pos": [
      "adl"
    ],
    "primaryPos": "adl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Capheny.jpg",
    "tags": [
      "capheny",
      "คาเฟนี่",
      "adl",
      "marksman"
    ]
  },
  {
    "id": "celica",
    "name": "Celica",
    "nameTh": "เซลิก้า",
    "r": "marksman",
    "roles": [
      "marksman"
    ],
    "pos": [
      "adl"
    ],
    "primaryPos": "adl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Celica.jpg",
    "tags": [
      "celica",
      "เซลิก้า",
      "adl",
      "marksman"
    ]
  },
  {
    "id": "charlotte",
    "name": "Charlotte",
    "nameTh": "ชาร์ล็อตต์",
    "r": "fighter",
    "roles": [
      "fighter"
    ],
    "pos": [
      "dsl"
    ],
    "primaryPos": "dsl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Charlotte.jpg",
    "tags": [
      "charlotte",
      "ชาร์ล็อตต์",
      "dsl",
      "fighter"
    ]
  },
  {
    "id": "chaugnar",
    "name": "Chaugnar",
    "nameTh": "ชอว์กนาร์",
    "r": "support",
    "roles": [
      "support",
      "tank"
    ],
    "pos": [
      "roam"
    ],
    "primaryPos": "roam",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Chaugnar.jpg",
    "tags": [
      "chaugnar",
      "ชอว์กนาร์",
      "roam",
      "support",
      "tank"
    ]
  },
  {
    "id": "cresht",
    "name": "Cresht",
    "nameTh": "เครชต์",
    "r": "support",
    "roles": [
      "support",
      "tank"
    ],
    "pos": [
      "roam"
    ],
    "primaryPos": "roam",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Cresht.jpg",
    "tags": [
      "cresht",
      "เครชต์",
      "roam",
      "support",
      "tank"
    ]
  },
  {
    "id": "d_arcy",
    "name": "D'Arcy",
    "nameTh": "ดาร์ซี่",
    "r": "assassin",
    "roles": [
      "assassin",
      "mage"
    ],
    "pos": [
      "mid"
    ],
    "primaryPos": "mid",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Darcy.jpg",
    "tags": [
      "d'arcy",
      "ดาร์ซี่",
      "mid",
      "assassin",
      "mage"
    ]
  },
  {
    "id": "dextra",
    "name": "Dextra",
    "nameTh": "เด็กซ์ตร้า",
    "r": "support",
    "roles": [
      "support",
      "tank"
    ],
    "pos": [
      "roam",
      "dsl"
    ],
    "primaryPos": "roam",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Dextra.jpg",
    "tags": [
      "dextra",
      "เด็กซ์ตร้า",
      "roam",
      "dsl",
      "support",
      "tank"
    ]
  },
  {
    "id": "diaochan",
    "name": "Diaochan",
    "nameTh": "เตียวเสี้ยน",
    "r": "mage",
    "roles": [
      "mage"
    ],
    "pos": [
      "mid"
    ],
    "primaryPos": "mid",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Diao_Chan.jpg",
    "tags": [
      "diaochan",
      "เตียวเสี้ยน",
      "mid",
      "mage"
    ]
  },
  {
    "id": "dirak",
    "name": "Dirak",
    "nameTh": "ดิแรก",
    "r": "mage",
    "roles": [
      "mage"
    ],
    "pos": [
      "mid"
    ],
    "primaryPos": "mid",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Dirak.jpg",
    "tags": [
      "dirak",
      "ดิแรก",
      "mid",
      "mage"
    ]
  },
  {
    "id": "dolia",
    "name": "Dolia",
    "nameTh": "โดเลีย",
    "r": "support",
    "roles": [
      "support",
      "tank"
    ],
    "pos": [
      "roam"
    ],
    "primaryPos": "roam",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Dolia.jpg",
    "tags": [
      "dolia",
      "โดเลีย",
      "roam",
      "support",
      "tank"
    ]
  },
  {
    "id": "dyadia",
    "name": "Dyadia",
    "nameTh": "เดียเดีย",
    "r": "support",
    "roles": [
      "support",
      "tank"
    ],
    "pos": [
      "roam"
    ],
    "primaryPos": "roam",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Dyadia.jpg",
    "tags": [
      "dyadia",
      "เดียเดีย",
      "roam",
      "support",
      "tank"
    ]
  },
  {
    "id": "edras",
    "name": "Edras",
    "nameTh": "เอ็ดราส",
    "r": "fighter",
    "roles": [
      "fighter",
      "assassin"
    ],
    "pos": [
      "jg",
      "dsl"
    ],
    "primaryPos": "jg",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Edras.jpg",
    "tags": [
      "edras",
      "เอ็ดราส",
      "jg",
      "dsl",
      "fighter",
      "assassin"
    ]
  },
  {
    "id": "eland_orr",
    "name": "Eland'orr",
    "nameTh": "เอแลนดอร์",
    "r": "assassin",
    "roles": [
      "assassin",
      "marksman"
    ],
    "pos": [
      "adl",
      "jg"
    ],
    "primaryPos": "adl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Elandorr.jpg",
    "tags": [
      "eland'orr",
      "เอแลนดอร์",
      "adl",
      "jg",
      "assassin",
      "marksman"
    ]
  },
  {
    "id": "elsu",
    "name": "Elsu",
    "nameTh": "เอลสุ",
    "r": "marksman",
    "roles": [
      "marksman"
    ],
    "pos": [
      "adl"
    ],
    "primaryPos": "adl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Elsu.jpg",
    "tags": [
      "elsu",
      "เอลสุ",
      "adl",
      "marksman"
    ]
  },
  {
    "id": "enzo",
    "name": "Enzo",
    "nameTh": "เอนโซ่",
    "r": "assassin",
    "roles": [
      "assassin",
      "support",
      "tank"
    ],
    "pos": [
      "roam"
    ],
    "primaryPos": "roam",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Enzo.jpg",
    "tags": [
      "enzo",
      "เอนโซ่",
      "roam",
      "assassin",
      "support",
      "tank"
    ]
  },
  {
    "id": "erin",
    "name": "Erin",
    "nameTh": "เอริน",
    "r": "marksman",
    "roles": [
      "marksman"
    ],
    "pos": [
      "adl"
    ],
    "primaryPos": "adl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Erin.jpg",
    "tags": [
      "erin",
      "เอริน",
      "adl",
      "marksman"
    ]
  },
  {
    "id": "errol",
    "name": "Errol",
    "nameTh": "เออร์รอล",
    "r": "assassin",
    "roles": [
      "assassin"
    ],
    "pos": [
      "jg"
    ],
    "primaryPos": "jg",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Errol.jpg",
    "tags": [
      "errol",
      "เออร์รอล",
      "jg",
      "assassin"
    ]
  },
  {
    "id": "fennik",
    "name": "Fennik",
    "nameTh": "เฟนนิค",
    "r": "assassin",
    "roles": [
      "assassin",
      "marksman"
    ],
    "pos": [
      "adl",
      "jg"
    ],
    "primaryPos": "adl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Fennik.jpg",
    "tags": [
      "fennik",
      "เฟนนิค",
      "adl",
      "jg",
      "assassin",
      "marksman"
    ]
  },
  {
    "id": "florentino",
    "name": "Florentino",
    "nameTh": "ฟลอเรนติโน่",
    "r": "fighter",
    "roles": [
      "fighter"
    ],
    "pos": [
      "dsl"
    ],
    "primaryPos": "dsl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Florentino.jpg",
    "tags": [
      "florentino",
      "ฟลอเรนติโน่",
      "dsl",
      "fighter"
    ]
  },
  {
    "id": "flowborn",
    "name": "Flowborn",
    "nameTh": "โฟลว์บอร์น",
    "r": "marksman",
    "roles": [
      "marksman"
    ],
    "pos": [
      "adl"
    ],
    "primaryPos": "adl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/v1775747198/Flowborn.png",
    "tags": [
      "flowborn",
      "โฟลว์บอร์น",
      "adl",
      "marksman"
    ]
  },
  {
    "id": "flowborn_mid",
    "name": "Flowborn Mid",
    "nameTh": "โฟลว์บอร์น (มิด)",
    "r": "mage",
    "roles": [
      "mage"
    ],
    "pos": [
      "mid"
    ],
    "primaryPos": "mid",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/v1777620554/Flowborn_mid.jpg",
    "tags": [
      "flowborn mid",
      "โฟลว์บอร์น (มิด)",
      "mid",
      "mage"
    ]
  },
  {
    "id": "gildur",
    "name": "Gildur",
    "nameTh": "กิลเดอร์",
    "r": "mage",
    "roles": [
      "mage",
      "support",
      "tank"
    ],
    "pos": [
      "roam"
    ],
    "primaryPos": "roam",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Gildur.jpg",
    "tags": [
      "gildur",
      "กิลเดอร์",
      "roam",
      "mage",
      "support",
      "tank"
    ]
  },
  {
    "id": "goverra",
    "name": "Goverra",
    "nameTh": "โกเวอร์ร่า",
    "r": "mage",
    "roles": [
      "mage"
    ],
    "pos": [
      "mid"
    ],
    "primaryPos": "mid",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Goverra.jpg",
    "tags": [
      "goverra",
      "โกเวอร์ร่า",
      "mid",
      "mage"
    ]
  },
  {
    "id": "grakk",
    "name": "Grakk",
    "nameTh": "แกร๊ก",
    "r": "support",
    "roles": [
      "support",
      "tank"
    ],
    "pos": [
      "roam"
    ],
    "primaryPos": "roam",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Grakk.jpg",
    "tags": [
      "grakk",
      "แกร๊ก",
      "roam",
      "support",
      "tank"
    ]
  },
  {
    "id": "hayate",
    "name": "Hayate",
    "nameTh": "ฮายาเตะ",
    "r": "marksman",
    "roles": [
      "marksman"
    ],
    "pos": [
      "adl"
    ],
    "primaryPos": "adl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Hayate.jpg",
    "tags": [
      "hayate",
      "ฮายาเตะ",
      "adl",
      "marksman"
    ]
  },
  {
    "id": "heino",
    "name": "Heino",
    "nameTh": "เฮย์โน่",
    "r": "mage",
    "roles": [
      "mage"
    ],
    "pos": [
      "mid"
    ],
    "primaryPos": "mid",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Heino.jpg",
    "tags": [
      "heino",
      "เฮย์โน่",
      "mid",
      "mage"
    ]
  },
  {
    "id": "helen",
    "name": "Helen",
    "nameTh": "เฮเลน",
    "r": "support",
    "roles": [
      "support",
      "tank"
    ],
    "pos": [
      "roam"
    ],
    "primaryPos": "roam",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Helen.jpg",
    "tags": [
      "helen",
      "เฮเลน",
      "roam",
      "support",
      "tank"
    ]
  },
  {
    "id": "iggy",
    "name": "Iggy",
    "nameTh": "อิกกี้",
    "r": "mage",
    "roles": [
      "mage"
    ],
    "pos": [
      "mid"
    ],
    "primaryPos": "mid",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/v1779828886/iggy.jpg",
    "tags": [
      "iggy",
      "อิกกี้",
      "mid",
      "mage"
    ]
  },
  {
    "id": "ignis",
    "name": "Ignis",
    "nameTh": "อิกนิส",
    "r": "mage",
    "roles": [
      "mage"
    ],
    "pos": [
      "mid"
    ],
    "primaryPos": "mid",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Ignis.jpg",
    "tags": [
      "ignis",
      "อิกนิส",
      "mid",
      "mage"
    ]
  },
  {
    "id": "ilumia",
    "name": "Ilumia",
    "nameTh": "อิลูเมีย",
    "r": "mage",
    "roles": [
      "mage"
    ],
    "pos": [
      "mid"
    ],
    "primaryPos": "mid",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Ilumia.jpg",
    "tags": [
      "ilumia",
      "อิลูเมีย",
      "mid",
      "mage"
    ]
  },
  {
    "id": "ishar",
    "name": "Ishar",
    "nameTh": "อิชาร์",
    "r": "mage",
    "roles": [
      "mage"
    ],
    "pos": [
      "mid"
    ],
    "primaryPos": "mid",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Ishar.jpg",
    "tags": [
      "ishar",
      "อิชาร์",
      "mid",
      "mage"
    ]
  },
  {
    "id": "jinnar",
    "name": "Jinnar",
    "nameTh": "จินนา",
    "r": "mage",
    "roles": [
      "mage"
    ],
    "pos": [
      "mid"
    ],
    "primaryPos": "mid",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Jinna.jpg",
    "tags": [
      "jinnar",
      "จินนา",
      "mid",
      "mage"
    ]
  },
  {
    "id": "kahlii",
    "name": "Kahlii",
    "nameTh": "กาลี",
    "r": "mage",
    "roles": [
      "mage"
    ],
    "pos": [
      "mid"
    ],
    "primaryPos": "mid",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Kahlii.jpg",
    "tags": [
      "kahlii",
      "กาลี",
      "mid",
      "mage"
    ]
  },
  {
    "id": "kaine",
    "name": "Kaine",
    "nameTh": "เคน (แบทแมน)",
    "r": "assassin",
    "roles": [
      "assassin",
      "support",
      "tank"
    ],
    "pos": [
      "roam",
      "jg"
    ],
    "primaryPos": "roam",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Kaine.jpg",
    "tags": [
      "kaine",
      "เคน (แบทแมน)",
      "roam",
      "jg",
      "assassin",
      "support",
      "tank"
    ]
  },
  {
    "id": "keera",
    "name": "Keera",
    "nameTh": "คีร่า",
    "r": "assassin",
    "roles": [
      "assassin"
    ],
    "pos": [
      "jg"
    ],
    "primaryPos": "jg",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Keera.jpg",
    "tags": [
      "keera",
      "คีร่า",
      "jg",
      "assassin"
    ]
  },
  {
    "id": "kil_groth",
    "name": "Kil'Groth",
    "nameTh": "คิลกรอธ",
    "r": "fighter",
    "roles": [
      "fighter",
      "assassin"
    ],
    "pos": [
      "dsl",
      "jg"
    ],
    "primaryPos": "dsl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Kil_Groth.jpg",
    "tags": [
      "kil'groth",
      "คิลกรอธ",
      "dsl",
      "jg",
      "fighter",
      "assassin"
    ]
  },
  {
    "id": "kriknak",
    "name": "Kriknak",
    "nameTh": "คริกแน็ก",
    "r": "assassin",
    "roles": [
      "assassin"
    ],
    "pos": [
      "jg"
    ],
    "primaryPos": "jg",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Kriknak.jpg",
    "tags": [
      "kriknak",
      "คริกแน็ก",
      "jg",
      "assassin"
    ]
  },
  {
    "id": "krixi",
    "name": "Krixi",
    "nameTh": "คริกซี่",
    "r": "mage",
    "roles": [
      "mage"
    ],
    "pos": [
      "mid"
    ],
    "primaryPos": "mid",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Krixi.jpg",
    "tags": [
      "krixi",
      "คริกซี่",
      "mid",
      "mage"
    ]
  },
  {
    "id": "krizzix",
    "name": "Krizzix",
    "nameTh": "คริซซิก",
    "r": "support",
    "roles": [
      "support",
      "tank"
    ],
    "pos": [
      "roam"
    ],
    "primaryPos": "roam",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Krizzix.jpg",
    "tags": [
      "krizzix",
      "คริซซิก",
      "roam",
      "support",
      "tank"
    ]
  },
  {
    "id": "lauriel",
    "name": "Lauriel",
    "nameTh": "ลอเรียล",
    "r": "mage",
    "roles": [
      "mage"
    ],
    "pos": [
      "mid"
    ],
    "primaryPos": "mid",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Lauriel.jpg",
    "tags": [
      "lauriel",
      "ลอเรียล",
      "mid",
      "mage"
    ]
  },
  {
    "id": "laville",
    "name": "Laville",
    "nameTh": "ลาวิล",
    "r": "marksman",
    "roles": [
      "marksman"
    ],
    "pos": [
      "adl"
    ],
    "primaryPos": "adl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Laville.jpg",
    "tags": [
      "laville",
      "ลาวิล",
      "adl",
      "marksman"
    ]
  },
  {
    "id": "liliana",
    "name": "Liliana",
    "nameTh": "ลิเลียนา",
    "r": "mage",
    "roles": [
      "mage"
    ],
    "pos": [
      "mid"
    ],
    "primaryPos": "mid",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Liliana.jpg",
    "tags": [
      "liliana",
      "ลิเลียนา",
      "mid",
      "mage"
    ]
  },
  {
    "id": "lindis",
    "name": "Lindis",
    "nameTh": "ลินดิส",
    "r": "marksman",
    "roles": [
      "marksman"
    ],
    "pos": [
      "adl"
    ],
    "primaryPos": "adl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Lindis.jpg",
    "tags": [
      "lindis",
      "ลินดิส",
      "adl",
      "marksman"
    ]
  },
  {
    "id": "lorion",
    "name": "Lorion",
    "nameTh": "ลอเรียน",
    "r": "mage",
    "roles": [
      "mage"
    ],
    "pos": [
      "mid"
    ],
    "primaryPos": "mid",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Lorion.jpg",
    "tags": [
      "lorion",
      "ลอเรียน",
      "mid",
      "mage"
    ]
  },
  {
    "id": "lu_bu",
    "name": "Lu Bu",
    "nameTh": "ลิโป้",
    "r": "fighter",
    "roles": [
      "fighter",
      "assassin"
    ],
    "pos": [
      "dsl"
    ],
    "primaryPos": "dsl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Lu_Bu.jpg",
    "tags": [
      "lu bu",
      "ลิโป้",
      "dsl",
      "fighter",
      "assassin"
    ]
  },
  {
    "id": "lumburr",
    "name": "Lumburr",
    "nameTh": "ลัมเบอร์",
    "r": "support",
    "roles": [
      "support",
      "tank"
    ],
    "pos": [
      "roam"
    ],
    "primaryPos": "roam",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Lumburr.jpg",
    "tags": [
      "lumburr",
      "ลัมเบอร์",
      "roam",
      "support",
      "tank"
    ]
  },
  {
    "id": "maloch",
    "name": "Maloch",
    "nameTh": "มาลอค",
    "r": "fighter",
    "roles": [
      "fighter",
      "mage",
      "support",
      "tank"
    ],
    "pos": [
      "dsl",
      "roam"
    ],
    "primaryPos": "dsl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Maloch.jpg",
    "tags": [
      "maloch",
      "มาลอค",
      "dsl",
      "roam",
      "fighter",
      "mage",
      "support",
      "tank"
    ]
  },
  {
    "id": "marja",
    "name": "Marja",
    "nameTh": "มาร์จา",
    "r": "fighter",
    "roles": [
      "fighter",
      "assassin"
    ],
    "pos": [
      "jg",
      "mid"
    ],
    "primaryPos": "jg",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Marja.jpg",
    "tags": [
      "marja",
      "มาร์จา",
      "jg",
      "mid",
      "fighter",
      "assassin"
    ]
  },
  {
    "id": "max",
    "name": "Max",
    "nameTh": "แมกซ์",
    "r": "fighter",
    "roles": [
      "fighter"
    ],
    "pos": [
      "jg",
      "dsl"
    ],
    "primaryPos": "jg",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Max.jpg",
    "tags": [
      "max",
      "แมกซ์",
      "jg",
      "dsl",
      "fighter"
    ]
  },
  {
    "id": "mganga",
    "name": "Mganga",
    "nameTh": "มังกังก้า",
    "r": "mage",
    "roles": [
      "mage"
    ],
    "pos": [
      "mid"
    ],
    "primaryPos": "mid",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Mganga.jpg",
    "tags": [
      "mganga",
      "มังกังก้า",
      "mid",
      "mage"
    ]
  },
  {
    "id": "mina",
    "name": "Mina",
    "nameTh": "มิน่า",
    "r": "fighter",
    "roles": [
      "fighter",
      "support",
      "tank"
    ],
    "pos": [
      "roam",
      "dsl"
    ],
    "primaryPos": "roam",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Mina.jpg",
    "tags": [
      "mina",
      "มิน่า",
      "roam",
      "dsl",
      "fighter",
      "support",
      "tank"
    ]
  },
  {
    "id": "ming",
    "name": "Ming",
    "nameTh": "หมิง",
    "r": "support",
    "roles": [
      "support",
      "tank"
    ],
    "pos": [
      "roam"
    ],
    "primaryPos": "roam",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Ming.jpg",
    "tags": [
      "ming",
      "หมิง",
      "roam",
      "support",
      "tank"
    ]
  },
  {
    "id": "mortos",
    "name": "Mortos",
    "nameTh": "มอทอส",
    "r": "support",
    "roles": [
      "support",
      "tank"
    ],
    "pos": [
      "roam"
    ],
    "primaryPos": "roam",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Mortos.jpg",
    "tags": [
      "mortos",
      "มอทอส",
      "roam",
      "support",
      "tank"
    ]
  },
  {
    "id": "moren",
    "name": "Moren",
    "nameTh": "มอเรน",
    "r": "marksman",
    "roles": [
      "marksman"
    ],
    "pos": [
      "adl"
    ],
    "primaryPos": "adl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Moren.jpg",
    "tags": [
      "moren",
      "มอเรน",
      "adl",
      "marksman"
    ]
  },
  {
    "id": "murad",
    "name": "Murad",
    "nameTh": "มูราด",
    "r": "fighter",
    "roles": [
      "fighter",
      "assassin"
    ],
    "pos": [
      "jg"
    ],
    "primaryPos": "jg",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Murad.jpg",
    "tags": [
      "murad",
      "มูราด",
      "jg",
      "fighter",
      "assassin"
    ]
  },
  {
    "id": "nakroth",
    "name": "Nakroth",
    "nameTh": "นาครอส",
    "r": "assassin",
    "roles": [
      "assassin"
    ],
    "pos": [
      "jg"
    ],
    "primaryPos": "jg",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Nakroth.jpg",
    "tags": [
      "nakroth",
      "นาครอส",
      "jg",
      "assassin"
    ]
  },
  {
    "id": "natalya",
    "name": "Natalya",
    "nameTh": "นาทาเลีย",
    "r": "mage",
    "roles": [
      "mage"
    ],
    "pos": [
      "mid"
    ],
    "primaryPos": "mid",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Natalya.jpg",
    "tags": [
      "natalya",
      "นาทาเลีย",
      "mid",
      "mage"
    ]
  },
  {
    "id": "omega",
    "name": "Omega",
    "nameTh": "โอเมก้า",
    "r": "support",
    "roles": [
      "support",
      "tank"
    ],
    "pos": [
      "roam"
    ],
    "primaryPos": "roam",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Omega.jpg",
    "tags": [
      "omega",
      "โอเมก้า",
      "roam",
      "support",
      "tank"
    ]
  },
  {
    "id": "omen",
    "name": "Omen",
    "nameTh": "โอเมน",
    "r": "fighter",
    "roles": [
      "fighter",
      "mage"
    ],
    "pos": [
      "dsl"
    ],
    "primaryPos": "dsl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Omen.jpg",
    "tags": [
      "omen",
      "โอเมน",
      "dsl",
      "fighter",
      "mage"
    ]
  },
  {
    "id": "ormarr",
    "name": "Ormarr",
    "nameTh": "ออร์มาร์",
    "r": "support",
    "roles": [
      "support",
      "tank"
    ],
    "pos": [
      "roam"
    ],
    "primaryPos": "roam",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Ormarr.jpg",
    "tags": [
      "ormarr",
      "ออร์มาร์",
      "roam",
      "support",
      "tank"
    ]
  },
  {
    "id": "paine",
    "name": "Paine",
    "nameTh": "เพน",
    "r": "assassin",
    "roles": [
      "assassin"
    ],
    "pos": [
      "jg"
    ],
    "primaryPos": "jg",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Paine.jpg",
    "tags": [
      "paine",
      "เพน",
      "jg",
      "assassin"
    ]
  },
  {
    "id": "preyta",
    "name": "Preyta",
    "nameTh": "เพรย์ต้า",
    "r": "mage",
    "roles": [
      "mage"
    ],
    "pos": [
      "mid"
    ],
    "primaryPos": "mid",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Preyta.jpg",
    "tags": [
      "preyta",
      "เพรย์ต้า",
      "mid",
      "mage"
    ]
  },
  {
    "id": "qi",
    "name": "Qi",
    "nameTh": "ฉี",
    "r": "fighter",
    "roles": [
      "fighter"
    ],
    "pos": [
      "dsl"
    ],
    "primaryPos": "dsl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Qi.jpg",
    "tags": [
      "qi",
      "ฉี",
      "dsl",
      "fighter"
    ]
  },
  {
    "id": "quillen",
    "name": "Quillen",
    "nameTh": "ควิลเลน",
    "r": "assassin",
    "roles": [
      "assassin"
    ],
    "pos": [
      "jg"
    ],
    "primaryPos": "jg",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Quillen.jpg",
    "tags": [
      "quillen",
      "ควิลเลน",
      "jg",
      "assassin"
    ]
  },
  {
    "id": "raz",
    "name": "Raz",
    "nameTh": "แรซ",
    "r": "mage",
    "roles": [
      "mage"
    ],
    "pos": [
      "mid"
    ],
    "primaryPos": "mid",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Raz.jpg",
    "tags": [
      "raz",
      "แรซ",
      "mid",
      "mage"
    ]
  },
  {
    "id": "riktor",
    "name": "Riktor",
    "nameTh": "ริกเตอร์",
    "r": "fighter",
    "roles": [
      "fighter",
      "support",
      "tank"
    ],
    "pos": [
      "roam",
      "dsl"
    ],
    "primaryPos": "roam",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/v1779828977/riktor.jpg",
    "tags": [
      "riktor",
      "ริกเตอร์",
      "roam",
      "dsl",
      "fighter",
      "support",
      "tank"
    ]
  },
  {
    "id": "rouie",
    "name": "Rouie",
    "nameTh": "รูอี้",
    "r": "mage",
    "roles": [
      "mage",
      "support",
      "tank"
    ],
    "pos": [
      "roam",
      "mid"
    ],
    "primaryPos": "roam",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Rouie.jpg",
    "tags": [
      "rouie",
      "รูอี้",
      "roam",
      "mid",
      "mage",
      "support",
      "tank"
    ]
  },
  {
    "id": "rourke",
    "name": "Rourke",
    "nameTh": "รูร์ค",
    "r": "assassin",
    "roles": [
      "assassin"
    ],
    "pos": [
      "jg"
    ],
    "primaryPos": "jg",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Rourke.jpg",
    "tags": [
      "rourke",
      "รูร์ค",
      "jg",
      "assassin"
    ]
  },
  {
    "id": "roxie",
    "name": "Roxie",
    "nameTh": "ร็อกซี่",
    "r": "fighter",
    "roles": [
      "fighter",
      "support",
      "tank"
    ],
    "pos": [
      "roam",
      "dsl"
    ],
    "primaryPos": "roam",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Roxie.jpg",
    "tags": [
      "roxie",
      "ร็อกซี่",
      "roam",
      "dsl",
      "fighter",
      "support",
      "tank"
    ]
  },
  {
    "id": "ryoma",
    "name": "Ryoma",
    "nameTh": "เรียวมะ",
    "r": "fighter",
    "roles": [
      "fighter",
      "assassin"
    ],
    "pos": [
      "dsl"
    ],
    "primaryPos": "dsl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Ryoma.jpg",
    "tags": [
      "ryoma",
      "เรียวมะ",
      "dsl",
      "fighter",
      "assassin"
    ]
  },
  {
    "id": "sephera",
    "name": "Sephera",
    "nameTh": "เซฟีร่า",
    "r": "mage",
    "roles": [
      "mage"
    ],
    "pos": [
      "mid"
    ],
    "primaryPos": "mid",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Sephera.jpg",
    "tags": [
      "sephera",
      "เซฟีร่า",
      "mid",
      "mage"
    ]
  },
  {
    "id": "sinestrea",
    "name": "Sinestrea",
    "nameTh": "ซิเนสเทรีย",
    "r": "assassin",
    "roles": [
      "assassin"
    ],
    "pos": [
      "jg"
    ],
    "primaryPos": "jg",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/v1779829012/sinestrea.jpg",
    "tags": [
      "sinestrea",
      "ซิเนสเทรีย",
      "jg",
      "assassin"
    ]
  },
  {
    "id": "skud",
    "name": "Skud",
    "nameTh": "สกั๊ด",
    "r": "fighter",
    "roles": [
      "fighter"
    ],
    "pos": [
      "dsl"
    ],
    "primaryPos": "dsl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Skud.jpg",
    "tags": [
      "skud",
      "สกั๊ด",
      "dsl",
      "fighter"
    ]
  },
  {
    "id": "slimz",
    "name": "Slimz",
    "nameTh": "สลิมซ์",
    "r": "marksman",
    "roles": [
      "marksman"
    ],
    "pos": [
      "adl"
    ],
    "primaryPos": "adl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Slimz.jpg",
    "tags": [
      "slimz",
      "สลิมซ์",
      "adl",
      "marksman"
    ]
  },
  {
    "id": "stuart",
    "name": "Stuart",
    "nameTh": "สจ๊วต (โจ๊กเกอร์)",
    "r": "marksman",
    "roles": [
      "marksman"
    ],
    "pos": [
      "adl"
    ],
    "primaryPos": "adl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Stuart.jpg",
    "tags": [
      "stuart",
      "สจ๊วต (โจ๊กเกอร์)",
      "adl",
      "marksman"
    ]
  },
  {
    "id": "superman",
    "name": "Superman",
    "nameTh": "ซูเปอร์แมน",
    "r": "fighter",
    "roles": [
      "fighter",
      "support",
      "tank"
    ],
    "pos": [
      "dsl",
      "roam"
    ],
    "primaryPos": "dsl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Superman.jpg",
    "tags": [
      "superman",
      "ซูเปอร์แมน",
      "dsl",
      "roam",
      "fighter",
      "support",
      "tank"
    ]
  },
  {
    "id": "taara",
    "name": "Taara",
    "nameTh": "ทาร่า",
    "r": "fighter",
    "roles": [
      "fighter",
      "assassin",
      "support",
      "tank"
    ],
    "pos": [
      "roam",
      "dsl"
    ],
    "primaryPos": "roam",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Taara.jpg",
    "tags": [
      "taara",
      "ทาร่า",
      "roam",
      "dsl",
      "fighter",
      "assassin",
      "support",
      "tank"
    ]
  },
  {
    "id": "tachi",
    "name": "Tachi",
    "nameTh": "ทาชิ",
    "r": "assassin",
    "roles": [
      "assassin"
    ],
    "pos": [
      "jg"
    ],
    "primaryPos": "jg",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Tachi.jpg",
    "tags": [
      "tachi",
      "ทาชิ",
      "jg",
      "assassin"
    ]
  },
  {
    "id": "tamyn",
    "name": "Tamyn",
    "nameTh": "ทามิน",
    "r": "fighter",
    "roles": [
      "fighter",
      "assassin"
    ],
    "pos": [
      "dsl",
      "jg"
    ],
    "primaryPos": "dsl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/v1783002370/Tamyn.jpg",
    "tags": [
      "tamyn",
      "ทามิน",
      "dsl",
      "jg",
      "fighter",
      "assassin"
    ]
  },
  {
    "id": "teemee",
    "name": "TeeMee",
    "nameTh": "ทีมี",
    "r": "support",
    "roles": [
      "support",
      "tank"
    ],
    "pos": [
      "roam"
    ],
    "primaryPos": "roam",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/TeeMee.jpg",
    "tags": [
      "teemee",
      "ทีมี",
      "roam",
      "support",
      "tank"
    ]
  },
  {
    "id": "teeri",
    "name": "Teeri",
    "nameTh": "ทีรี",
    "r": "marksman",
    "roles": [
      "marksman"
    ],
    "pos": [
      "adl"
    ],
    "primaryPos": "adl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Teeri.jpg",
    "tags": [
      "teeri",
      "ทีรี",
      "adl",
      "marksman"
    ]
  },
  {
    "id": "tel_annas",
    "name": "Tel'Annas",
    "nameTh": "เทลอันนาส",
    "r": "marksman",
    "roles": [
      "marksman"
    ],
    "pos": [
      "adl"
    ],
    "primaryPos": "adl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Tel_Annas.jpg",
    "tags": [
      "tel'annas",
      "เทลอันนาส",
      "adl",
      "marksman"
    ]
  },
  {
    "id": "thane",
    "name": "Thane",
    "nameTh": "เธน",
    "r": "support",
    "roles": [
      "support",
      "tank"
    ],
    "pos": [
      "roam"
    ],
    "primaryPos": "roam",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Thane.jpg",
    "tags": [
      "thane",
      "เธน",
      "roam",
      "support",
      "tank"
    ]
  },
  {
    "id": "the_flash",
    "name": "The Flash",
    "nameTh": "เดอะแฟลช",
    "r": "mage",
    "roles": [
      "mage"
    ],
    "pos": [
      "mid"
    ],
    "primaryPos": "mid",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/The_Flash.jpg",
    "tags": [
      "the flash",
      "เดอะแฟลช",
      "mid",
      "mage"
    ]
  },
  {
    "id": "thorne",
    "name": "Thorne",
    "nameTh": "ธอร์น",
    "r": "marksman",
    "roles": [
      "marksman"
    ],
    "pos": [
      "adl"
    ],
    "primaryPos": "adl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Thorne.jpg",
    "tags": [
      "thorne",
      "ธอร์น",
      "adl",
      "marksman"
    ]
  },
  {
    "id": "toro",
    "name": "Toro",
    "nameTh": "โตโร่",
    "r": "support",
    "roles": [
      "support",
      "tank"
    ],
    "pos": [
      "roam"
    ],
    "primaryPos": "roam",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Toro.jpg",
    "tags": [
      "toro",
      "โตโร่",
      "roam",
      "support",
      "tank"
    ]
  },
  {
    "id": "tulen",
    "name": "Tulen",
    "nameTh": "ทูเลน",
    "r": "assassin",
    "roles": [
      "assassin",
      "mage"
    ],
    "pos": [
      "mid"
    ],
    "primaryPos": "mid",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Tulen.jpg",
    "tags": [
      "tulen",
      "ทูเลน",
      "mid",
      "assassin",
      "mage"
    ]
  },
  {
    "id": "valhein",
    "name": "Valhein",
    "nameTh": "แวนเฮลซิ่ง (แวน)",
    "r": "marksman",
    "roles": [
      "marksman"
    ],
    "pos": [
      "adl"
    ],
    "primaryPos": "adl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Valhein.jpg",
    "tags": [
      "valhein",
      "แวนเฮลซิ่ง (แวน)",
      "adl",
      "marksman"
    ]
  },
  {
    "id": "veera",
    "name": "Veera",
    "nameTh": "วีร่า",
    "r": "mage",
    "roles": [
      "mage"
    ],
    "pos": [
      "mid"
    ],
    "primaryPos": "mid",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Veera.jpg",
    "tags": [
      "veera",
      "วีร่า",
      "mid",
      "mage"
    ]
  },
  {
    "id": "veres",
    "name": "Veres",
    "nameTh": "เวเรส",
    "r": "fighter",
    "roles": [
      "fighter",
      "assassin"
    ],
    "pos": [
      "dsl",
      "jg"
    ],
    "primaryPos": "dsl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Veres.jpg",
    "tags": [
      "veres",
      "เวเรส",
      "dsl",
      "jg",
      "fighter",
      "assassin"
    ]
  },
  {
    "id": "violet",
    "name": "Violet",
    "nameTh": "ไวโอเลต",
    "r": "marksman",
    "roles": [
      "marksman"
    ],
    "pos": [
      "adl"
    ],
    "primaryPos": "adl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Violet.jpg",
    "tags": [
      "violet",
      "ไวโอเลต",
      "adl",
      "marksman"
    ]
  },
  {
    "id": "volkath",
    "name": "Volkath",
    "nameTh": "โวลคาท",
    "r": "assassin",
    "roles": [
      "assassin"
    ],
    "pos": [
      "dsl"
    ],
    "primaryPos": "dsl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Volkath.jpg",
    "tags": [
      "volkath",
      "โวลคาท",
      "dsl",
      "assassin"
    ]
  },
  {
    "id": "wiro",
    "name": "Wiro",
    "nameTh": "วิโร่",
    "r": "support",
    "roles": [
      "support",
      "tank"
    ],
    "pos": [
      "roam"
    ],
    "primaryPos": "roam",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Wiro.jpg",
    "tags": [
      "wiro",
      "วิโร่",
      "roam",
      "support",
      "tank"
    ]
  },
  {
    "id": "wisp",
    "name": "Wisp",
    "nameTh": "วิสป์",
    "r": "marksman",
    "roles": [
      "marksman"
    ],
    "pos": [
      "adl"
    ],
    "primaryPos": "adl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Wisp.jpg",
    "tags": [
      "wisp",
      "วิสป์",
      "adl",
      "marksman"
    ]
  },
  {
    "id": "wonder_woman",
    "name": "Wonder Woman",
    "nameTh": "วันเดอร์วูแมน",
    "r": "assassin",
    "roles": [
      "assassin"
    ],
    "pos": [
      "dsl",
      "jg"
    ],
    "primaryPos": "dsl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Wonder_Woman.jpg",
    "tags": [
      "wonder woman",
      "วันเดอร์วูแมน",
      "dsl",
      "jg",
      "assassin"
    ]
  },
  {
    "id": "wukong",
    "name": "Wukong",
    "nameTh": "ซุนหงอคง (ลิง)",
    "r": "fighter",
    "roles": [
      "fighter",
      "assassin"
    ],
    "pos": [
      "jg",
      "dsl"
    ],
    "primaryPos": "jg",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Wu_Kong.jpg",
    "tags": [
      "wukong",
      "ซุนหงอคง (ลิง)",
      "jg",
      "dsl",
      "fighter",
      "assassin"
    ]
  },
  {
    "id": "xeniel",
    "name": "Xeniel",
    "nameTh": "ซีเนียล",
    "r": "fighter",
    "roles": [
      "fighter",
      "support",
      "tank"
    ],
    "pos": [
      "roam"
    ],
    "primaryPos": "roam",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Xeniel.jpg",
    "tags": [
      "xeniel",
      "ซีเนียล",
      "roam",
      "fighter",
      "support",
      "tank"
    ]
  },
  {
    "id": "y_bneth",
    "name": "Y'bneth",
    "nameTh": "อิฟเนท",
    "r": "support",
    "roles": [
      "support",
      "tank"
    ],
    "pos": [
      "roam"
    ],
    "primaryPos": "roam",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Y_bneth.jpg",
    "tags": [
      "y'bneth",
      "อิฟเนท",
      "roam",
      "support",
      "tank"
    ]
  },
  {
    "id": "yan",
    "name": "Yan",
    "nameTh": "เหยียน",
    "r": "fighter",
    "roles": [
      "fighter",
      "assassin"
    ],
    "pos": [
      "jg",
      "dsl"
    ],
    "primaryPos": "jg",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Yan.jpg",
    "tags": [
      "yan",
      "เหยียน",
      "jg",
      "dsl",
      "fighter",
      "assassin"
    ]
  },
  {
    "id": "yena",
    "name": "Yena",
    "nameTh": "เยน่า",
    "r": "fighter",
    "roles": [
      "fighter"
    ],
    "pos": [
      "dsl"
    ],
    "primaryPos": "dsl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Yena.jpg",
    "tags": [
      "yena",
      "เยน่า",
      "dsl",
      "fighter"
    ]
  },
  {
    "id": "yorn",
    "name": "Yorn",
    "nameTh": "ยอร์น",
    "r": "marksman",
    "roles": [
      "marksman"
    ],
    "pos": [
      "adl"
    ],
    "primaryPos": "adl",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Yorn.jpg",
    "tags": [
      "yorn",
      "ยอร์น",
      "adl",
      "marksman"
    ]
  },
  {
    "id": "yue",
    "name": "Yue",
    "nameTh": "เย่ว",
    "r": "mage",
    "roles": [
      "mage"
    ],
    "pos": [
      "mid"
    ],
    "primaryPos": "mid",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Yue.jpg",
    "tags": [
      "yue",
      "เย่ว",
      "mid",
      "mage"
    ]
  },
  {
    "id": "zanis",
    "name": "Zanis",
    "nameTh": "จูล่ง (ซานิส)",
    "r": "assassin",
    "roles": [
      "assassin",
      "support",
      "tank"
    ],
    "pos": [
      "roam"
    ],
    "primaryPos": "roam",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Zanis.jpg",
    "tags": [
      "zanis",
      "จูล่ง (ซานิส)",
      "roam",
      "assassin",
      "support",
      "tank"
    ]
  },
  {
    "id": "zata",
    "name": "Zata",
    "nameTh": "ซาต้า",
    "r": "mage",
    "roles": [
      "mage"
    ],
    "pos": [
      "mid"
    ],
    "primaryPos": "mid",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Zata.jpg",
    "tags": [
      "zata",
      "ซาต้า",
      "mid",
      "mage"
    ]
  },
  {
    "id": "zephys",
    "name": "Zephys",
    "nameTh": "เซฟิส",
    "r": "assassin",
    "roles": [
      "assassin"
    ],
    "pos": [
      "jg"
    ],
    "primaryPos": "jg",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Zephys.jpg",
    "tags": [
      "zephys",
      "เซฟิส",
      "jg",
      "assassin"
    ]
  },
  {
    "id": "zill",
    "name": "Zill",
    "nameTh": "ซิล",
    "r": "assassin",
    "roles": [
      "assassin"
    ],
    "pos": [
      "jg"
    ],
    "primaryPos": "jg",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Zill.jpg",
    "tags": [
      "zill",
      "ซิล",
      "jg",
      "assassin"
    ]
  },
  {
    "id": "zip",
    "name": "Zip",
    "nameTh": "ซิป",
    "r": "support",
    "roles": [
      "support",
      "tank"
    ],
    "pos": [
      "roam"
    ],
    "primaryPos": "roam",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Zip.jpg",
    "tags": [
      "zip",
      "ซิป",
      "roam",
      "support",
      "tank"
    ]
  },
  {
    "id": "zuka",
    "name": "Zuka",
    "nameTh": "ซูก้า",
    "r": "assassin",
    "roles": [
      "assassin"
    ],
    "pos": [
      "jg"
    ],
    "primaryPos": "jg",
    "avatarUrl": "https://res.cloudinary.com/dtzdhbllb/image/upload/Zuka.jpg",
    "tags": [
      "zuka",
      "ซูก้า",
      "jg",
      "assassin"
    ]
  }
];
