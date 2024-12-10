import { CardBase, CardRarity } from '../../../types/cards';
import { RARITY_COLORS } from '../rarities';

export const EPIC_CARDS: CardBase[] = [
  {
    id: 'beer-havf',
    name: 'Öl Hävf',
    description: "Challenge the person to your RIGHT then swap seats: Chug the drink the fastest, gain 2 HP, Loser loses 2 HP",
    manaCost: 2.0,
    rarity: CardRarity.EPIC,
    type: 'challenge',
    effect: {
      type: 'challenge',
      value: 0.0,
      challengeEffects: {
        winner: { type: 'heal', value: 2.0 },
        loser: { type: 'damage', value: 2.0 }
      }
    },
    isChallenge: true,
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.EPIC]
  },
  {
    id: 'got-big-muscles',
    name: 'Got Big Muscles?',
    description: "Challenge the person to your LEFT then swap seats: Pushup constest to restore all Mana, Loser loses 5 Mana",
    manaCost: 5.0,
    rarity: CardRarity.EPIC,
    type: 'challenge',
    effect: {
      type: 'challenge',
      value: 0.0,
      challengeEffects: {
        winner: { type: 'manaRefill', value: 10.0 },
        loser: { type: 'manaBurn', value: 5.0 }
      }
    },
    isChallenge: true,
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.EPIC]
  },
  {
    id: 'car-brands',
    name: 'Name the most: CAR BRANDS',
    description: "Challenge the person to your RIGHT then swap seats: Winner gets the Mana cost back, looser lose 2 HP",
    manaCost: 2.0,
    rarity: CardRarity.EPIC,
    type: 'challenge',
    effect: {
      type: 'challenge',
      value: 0.0,
      challengeEffects: {
        winner: { type: 'manaRefill', value: 2.0 },
        loser: { type: 'damage', value: 2.0 }
      }
    },
    isChallenge: true,
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.EPIC]
  },
  {
    id: 'football-teams',
    name: 'Name the most: FOOTBALL TEAMS',
    description: "Challenge the second person to your LEFT then swap seats: Winner gets the Mana cost back, looser lose 2 HP",
    manaCost: 2.0,
    rarity: CardRarity.EPIC,
    type: 'challenge',
    effect: {
      type: 'challenge',
      value: 0.0,
      challengeEffects: {
        winner: { type: 'manaRefill', value: 2.0 },
        loser: { type: 'damage', value: 2.0 }
      }
    },
    isChallenge: true,
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.EPIC]
  },
  {
    id: 'beer-brands',
    name: 'Name the most: BEER BRANDS',
    description: "Challenge the second person to your RIGHT then swap seats: Winner gets the Mana cost back, looser lose 2 HP",
    manaCost: 2.0,
    rarity: CardRarity.EPIC,
    type: 'challenge',
    effect: {
      type: 'challenge',
      value: 0.0,
      challengeEffects: {
        winner: { type: 'manaRefill', value: 2.0 },
        loser: { type: 'damage', value: 2.0 }
      }
    },
    isChallenge: true,
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.EPIC]
  },
  {
    id: 'alko-brands',
    name: 'Name the most: LIQOUR BRANDS',
    description: "Challenge the MOST drunk person here, determined by last man standing in a single leg blindfold then swap seats: Winner gets the Mana cost back, looser lose 2 HP",
    manaCost: 2.0,
    rarity: CardRarity.EPIC,
    type: 'challenge',
    effect: {
      type: 'challenge',
      value: 0.0,
      challengeEffects: {
        winner: { type: 'manaRefill', value: 2.0 },
        loser: { type: 'damage', value: 2.0 }
      }
    },
    isChallenge: true,
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.EPIC]
  },
  {
    id: 'countries',
    name: 'Name the most: COUNTRIES',
    description: "Challenge the 3rd person to your right then swap seats: Winner gets the Mana cost back, looser lose 2 HP",
    manaCost: 2.0,
    rarity: CardRarity.EPIC,
    type: 'challenge',
    effect: {
      type: 'challenge',
      value: 0.0,
      challengeEffects: {
        winner: { type: 'manaRefill', value: 2.0 },
        loser: { type: 'damage', value: 2.0 }
      }
    },
    isChallenge: true,
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.EPIC]
  },
  {
    id: 'porn_types',
    name: 'Name the most: TYPES OF PORN',
    description: "Challenge ANYONE then swap seats: Winner gets the Mana cost back, looser lose 2 HP",
    manaCost: 2.0,
    rarity: CardRarity.EPIC,
    type: 'challenge',
    effect: {
      type: 'challenge',
      value: 0.0,
      challengeEffects: {
        winner: { type: 'manaRefill', value: 2.0 },
        loser: { type: 'damage', value: 2.0 }
      }
    },
    isChallenge: true,
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.EPIC]
  },
  {
    id: 'breath-challenge',
    name: 'Wim Hoff Wannabe',
    description: "Challenge ANYONE then swap seats: Winner gets the Mana cost back, looser lose 2 HP",
    manaCost: 2.0,
    rarity: CardRarity.EPIC,
    type: 'challenge',
    effect: {
      type: 'challenge',
      value: 0.0,
      challengeEffects: {
        winner: { type: 'manaRefill', value: 2.0 },
        loser: { type: 'damage', value: 2.0 }
      }
    },
    isChallenge: true,
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.EPIC]
  },
  {
    id: 'strip-tease',
    name: 'STRIP TEASE TIME!!!',
    description: "Pick two to perform a strip tease, then swap seats: Winner gets +5 Mana, looser has to drop one piece of clothing (socks dont count)",
    manaCost: 3.0,
    rarity: CardRarity.EPIC,
    type: 'challenge',
    effect: {
      type: 'challenge',
      value: 0.0,
      challengeEffects: {
        winner: { type: 'manaRefill', value: 5.0 },
        loser: { type: 'damage', value: 0.0 }
      }
    },
    isChallenge: true,
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.EPIC]
  },
  {
    id: 'armwrestling',
    name: 'King of the Table #KingsMove!Allowed',
    description: "Armwrestle the person won the previous challenge then swap seats: Winner gets +3 Mana and +3 HP, looser take 2 shots",
    manaCost: 4.0,
    rarity: CardRarity.EPIC,
    type: 'challenge',
    effect: {
      type: 'challenge',
      value: 0.0,
      challengeEffects: {
        winner: { type: 'heal', value: 3.0 },
        loser: { type: 'damage', value: 0.0 }
      }
    },
    isChallenge: true,
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.EPIC]
  }
];