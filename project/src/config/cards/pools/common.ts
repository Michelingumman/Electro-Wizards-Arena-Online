import { CardBase, CardRarity } from '../../../types/cards';
import { RARITY_COLORS } from '../rarities';

export const COMMON_CARDS: CardBase[] = [
  {
    id: 'fire-arrow',
    name: 'Puckad Snoeboll',
    description: 'Kasta en iskall snoeboll och draenerar 1 mana fraan valfri kompis',
    manaCost: 1.0,
    rarity: CardRarity.COMMON,
    type: 'damage',
    effect: { type: 'damage', value: 1.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.COMMON]
  },
  {
    id: 'ice-chard',
    name: 'Isig Stavstoet',
    description: 'En snabb stavstoe tvingar maalet att tappa 2 mana',
    manaCost: 2.0,
    rarity: CardRarity.COMMON,
    type: 'damage',
    effect: { type: 'damage', value: 2.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.COMMON]
  },
  {
    id: 'lightning-chain',
    name: 'Lift-Kortslutning',
    description: 'Alla spelare tappar 1 mana naer liften laegger av',
    manaCost: 2.0,
    rarity: CardRarity.COMMON,
    type: 'damage',
    effect: { type: 'aoeDamage', value: 1.0 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.COMMON]
  },
  {
    id: 'shotgun',
    name: 'Afterski-Roulette',
    description: 'Maalet och en slumpad spelare faar +2 i drunkness',
    manaCost: 1.0,
    rarity: CardRarity.COMMON,
    type: 'damage',
    effect: { type: 'roulette', value: 2.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.COMMON]
  },
  {
    id: 'shockwave',
    name: 'Pist-Skovel',
    description: 'Alla andra spelare tappar 2 mana',
    manaCost: 3.0,
    rarity: CardRarity.COMMON,
    type: 'damage',
    effect: { type: 'aoeDamage', value: 2.0 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.COMMON]
  },
  {
    id: 'fireball',
    name: 'Vaermestuge-Kast',
    description: 'En tung traeff som draenerar 4 mana fraan en motstaandare',
    manaCost: 5.0,
    rarity: CardRarity.COMMON,
    type: 'damage',
    effect: { type: 'damage', value: 4.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.COMMON]
  },
  {
    id: 'energi_i_rummet',
    name: 'Hoej Staemningen',
    description: 'Du och maalet faar +3 drunkness naer tempoet gaar upp',
    manaCost: 2.0,
    rarity: CardRarity.COMMON,
    type: 'damage',
    effect: { type: 'energi_i_rummet', value: 3 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.COMMON]
  },
  {
    id: 'hangover-cure',
    name: 'Vattenpaus',
    description: 'Du lugnar ner laeget och minskar din drunkness med 4',
    manaCost: 2.0,
    rarity: CardRarity.COMMON,
    type: 'utility',
    effect: { type: 'soberingPotion', value: 4.0 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.COMMON]
  },
  {
    id: 'bar-tab',
    name: 'Notan Paa Laget',
    description: 'Faa +3 mana men ocksaa +1 drunkness',
    manaCost: 0.0,
    rarity: CardRarity.COMMON,
    type: 'utility',
    effect: { type: 'manaRefill', value: 3.0 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.COMMON]
  },
  {
    id: 'tipsy-tax',
    name: 'Mest Lullig Faar Straffet',
    description: 'Laegg +1:30 drunk-tid paa den som redan aeer mest dragen',
    manaCost: 2.0,
    rarity: CardRarity.COMMON,
    type: 'aoe',
    effect: { type: 'drunkestTimer', value: 90 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.COMMON]
  },
  {
    id: 'pick-on-the-sober-one',
    name: 'Nykterhetskontroll',
    description: 'Den minst fulla i gruppen tvingas ta en drink',
    manaCost: 2.0,
    rarity: CardRarity.COMMON,
    type: 'aoe',
    effect: { type: 'leastDrunkForceDrink', value: 1 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.COMMON]
  }
];
