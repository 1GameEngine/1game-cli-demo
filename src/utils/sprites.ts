import img0 from '../assets/01bb4efc6c9fbd41d9574caafb3e84ca_734.png';
import img1 from '../assets/04a1e881e6f4d0203765c03bdd6a1e82_538.png';
import img2 from '../assets/0fcbb8c4d1c210aa5669a9ed6fff8268_534.png';
import img3 from '../assets/1a39d896c20dd20a0cd4e59078904ae2_674.png';
import img4 from '../assets/1d13563e5e6fab4dee425518bef7cf2a_5438.png';
import img5 from '../assets/34bc142f7761a1785ea4eccf7bed813b_594.png';
import img6 from '../assets/364ef628ae2f64593609a5f252124672_3750.jpg';
import img7 from '../assets/3ec00dc05b1dff1750e62d9b37b918c2_3761.jpg';
import img8 from '../assets/42785c8ea6b208006966d51bcfbc8a2f_576.jpg';
import img9 from '../assets/437ce9b8d3911cd95fbe4f711351ce0a_530.png';
import img10 from '../assets/4968aeb793767c7dfa4a52eb66168ac9_518.png';
import img11 from '../assets/502b6a06fc463c6fa7723779481d3b8b_410.jpg';
import img12 from '../assets/51c7fc490bc28a42ddbf07e54ff08106_434.jpg';
import img13 from '../assets/5837a3be0c2315a0e78bda1bffa884e2_638.png';
import img14 from '../assets/64c07732408aa0232b6dee0ca0713bc1_614.png';
import img15 from '../assets/72bb3546056fb5e5a9f22cc3d7c7bfbb_3657.jpg';
import img16 from '../assets/7cc3920179c73abf61d832ec20274e5b_8098.png';
import img17 from '../assets/7e621ffdf900c4b8040513f68816b8c2_2550.png';
import img18 from '../assets/8c969f721aed0448eea44ae5fc2b84ab_282.png';
import img19 from '../assets/90e77b947ca1c13b5abed5d11f7d2390_3270.jpg';
import img20 from '../assets/9e43f8494bb300cc5fd784f927b89cd5_534.png';
import img21 from '../assets/a307f00f0a315e91fc29246a80e0613f_443.jpg';
import img22 from '../assets/a7f45667be8c4718d826ef2f859cb1af_12982.png';
import img23 from '../assets/a83457ffec44582182a2153c3601a304_3425.jpg';
import img24 from '../assets/ae64ccf158b7139d096e5e6313c0b212_8830.png';
import img25 from '../assets/b80586cb15c4dda31927a047195d1d41_2610.jpg';
import img26 from '../assets/bac8c1ce4dcf46d3b55abb4e8d790419_417.jpg';
import img27 from '../assets/bf68866c2b0bd7250584a28d2de1f017_7738.png';
import img28 from '../assets/c40d9be9d5fcf983412ed0bb4739a2ec_414.jpg';
import img29 from '../assets/c4d51e60950ae41826d9ad6b0945468e_1794.jpg';
import img30 from '../assets/c662835462a3e7cab4cb09a4f47ac17e_504.jpg';
import img31 from '../assets/cc21eb67dc550ee15961096f2f3408a3_2306.png';
import img32 from '../assets/ccc761d5bb6476671517895945939956_440.jpg';
import img33 from '../assets/d39134932d7ea6e05414f62542645511_1266.png';
import img34 from '../assets/d545706cadd0978b3e8cc51498f52cdb_798.png';
import img35 from '../assets/d9262c8a8f31db72460cd52c43d43032_3256.jpg';
import img36 from '../assets/dfb61f7a734124f2193cae375fa10a0a_754.png';
import img37 from '../assets/e1628699ad79e8d648dcf35876415bf1_2447.jpg';
import img38 from '../assets/e674fcdaaa26b72b9fe409f9fd94bbf3_882.png';
import img39 from '../assets/e742990017a67abf2346bbbcc050fc2e_522.png';
import img40 from '../assets/f069c43c537d9d1a98c0b522946c846c_634.png';

export type SpriteRef = { source: unknown; cut: string | null };

export const PLAYER_SPRITE: SpriteRef = { source: img24, cut: "0,96,32,32" };

export const TILE_SPRITES: Record<string, SpriteRef> = {
  wall: { source: img27, cut: "64,0,32,32" },
  wallAlt: { source: img27, cut: "32,0,32,32" },
  wall1: { source: img27, cut: "0,0,32,32" },
  wall4: { source: img27, cut: "96,0,32,32" },
  yellowDoor: { source: img22, cut: "0,0,32,32" },
  blueDoor: { source: img22, cut: "0,32,32,32" },
  redDoor: { source: img22, cut: "0,64,32,32" },
  greenDoor: { source: img22, cut: "0,96,32,32" },
  stairUp: { source: img38, cut: "0,32,32,32" },
  stairDown: { source: img38, cut: "0,0,32,32" },
  lava: { source: img31, cut: "0,0,32,32" },
  water: { source: img31, cut: "0,64,32,32" },
  waterLight: { source: img31, cut: "0,32,32,32" },
  star: { source: img18, cut: "0,0,32,32" },
  ironFence: { source: img10, cut: "0,0,32,32" },
  storyDoor: { source: img33, cut: "0,0,32,32" },
};

export const NPC_SPRITES: Record<string, SpriteRef> = {
  fairy: { source: img4, cut: "0,0,32,32" },
  goldShopF3: { source: img16, cut: "0,0,96,32" },
  goldShopF11: { source: img16, cut: "0,0,96,32" },
  merchantF2: { source: img4, cut: "32,0,32,32" },
  elderF2: { source: img24, cut: "0,0,32,32" },
  thief: { source: img24, cut: "32,0,32,32" },
  princess: { source: img4, cut: "64,0,32,32" },
  keyShopF5: { source: img24, cut: "64,0,32,32" },
  keyShopF12: { source: img24, cut: "64,0,32,32" },
  expElderF5: { source: img24, cut: "0,0,32,32" },
  expElderF13: { source: img24, cut: "0,0,32,32" },
  elderF15: { source: img24, cut: "0,0,32,32" },
  merchantF15: { source: img24, cut: "32,0,32,32" },
};

export const MONSTER_SPRITES: Record<string, SpriteRef> = {
  finalBoss: { source: img25, cut: "0,96,32,32" },
  redMage: { source: img35, cut: "0,96,32,32" },
  yellowMage: { source: img35, cut: "0,64,32,32" },
  highMage: { source: img35, cut: "0,32,32,32" },
  mage: { source: img35, cut: "0,0,32,32" },
  spiritMage: { source: img15, cut: "0,64,32,32" },
  whiteWarrior: { source: img15, cut: "0,32,32,32" },
  bloodShadow: { source: img29, cut: "0,0,96,96" },
  dragon: { source: img37, cut: "0,0,96,96" },
  redBoss: { source: img15, cut: "0,0,32,32" },
  spiritWarrior: { source: img7, cut: "0,96,32,32" },
  goldCaptain: { source: img7, cut: "0,64,32,32" },
  goldGuard: { source: img7, cut: "0,32,32,32" },
  darkWarrior: { source: img7, cut: "0,0,32,32" },
  swordsman: { source: img6, cut: "0,96,32,32" },
  highGuard: { source: img6, cut: "0,64,32,32" },
  midGuard: { source: img6, cut: "0,32,32,32" },
  guard: { source: img6, cut: "0,0,32,32" },
  shadowWarrior: { source: img19, cut: "0,96,32,32" },
  stoneMan: { source: img19, cut: "0,64,32,32" },
  beastWarrior: { source: img19, cut: "0,32,32,32" },
  beast: { source: img19, cut: "0,0,32,32" },
  darkCaptain: { source: img23, cut: "0,96,32,32" },
  slimeKing: { source: img17, cut: "0,96,32,32" },
  skeletonCaptain: { source: img23, cut: "0,64,32,32" },
  redBat: { source: img25, cut: "0,64,32,32" },
  blackSlime: { source: img17, cut: "0,64,32,32" },
  skeletonSoldier: { source: img23, cut: "0,32,32,32" },
  bigBat: { source: img25, cut: "0,32,32,32" },
  redSlime: { source: img17, cut: "0,32,32,32" },
  skeleton: { source: img23, cut: "0,0,32,32" },
  bat: { source: img25, cut: "0,0,32,32" },
  greenSlime: { source: img17, cut: "0,0,32,32" },
};

export const ITEM_SPRITES: Record<string, SpriteRef> = {
  ironShield: { source: img14, cut: null },
  silverShield: { source: img36, cut: null },
  knightShield: { source: img3, cut: null },
  holyShield: { source: img0, cut: null },
  divineShield: { source: img34, cut: null },
  ironSword: { source: img39, cut: null },
  silverSword: { source: img1, cut: null },
  steelSword: { source: img5, cut: null },
  holySword: { source: img40, cut: null },
  starSword: { source: img13, cut: null },
  redPotion: { source: img32, cut: null },
  bluePotion: { source: img21, cut: null },
  redGem: { source: img28, cut: null },
  blueGem: { source: img26, cut: null },
  bigWing: { source: img8, cut: "0,0,32,32" },
  smallWing: { source: img11, cut: null },
  coinBag: { source: img12, cut: null },
  keyBox: { source: img30, cut: null },
  yellowKey: { source: img9, cut: null },
  blueKey: { source: img20, cut: null },
  redKey: { source: img2, cut: null },
};

export function spriteFor(type: string, id: string): SpriteRef | null {
  if (type === 'tile') return TILE_SPRITES[id] || null;
  if (type === 'monster') return MONSTER_SPRITES[id] || null;
  if (type === 'item') return ITEM_SPRITES[id] || null;
  if (type === 'npc') return NPC_SPRITES[id] || null;
  return null;
}
