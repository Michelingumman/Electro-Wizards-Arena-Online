import { CardBase, CardRarity } from '../../../types/cards';
import { RARITY_COLORS } from '../rarities';

export const EPIC_CARDS: CardBase[] = [
  {
    id: 'fireball',
    name: 'Fireball',
    description: 'Launch a powerful ball of fire',
    manaCost: 2.0,
    rarity: CardRarity.EPIC,
    type: 'damage',
    effect: { type: 'damage', value: 4.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.EPIC]
  },
  {
    id: 'mana-burn',
    name: 'Mana Burn',
    description: "Deal damage equal to half target's mana",
    manaCost: 3.0,
    rarity: CardRarity.EPIC,
    type: 'damage',
    effect: { type: 'manaBurn', value: 0.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.EPIC]
  },
  {
    id: 'beer-havf',
    name: 'Öl Hävf',
    description: "Challenge: Winner gains 5 HP, Loser loses 5 HP",
    manaCost: 4.0,
    rarity: CardRarity.EPIC,
    type: 'challenge',
    effect: {
      type: 'challenge',
      value: 0.0,
      challengeEffects: {
        winner: { type: 'heal', value: 5.0 },
        loser: { type: 'damage', value: 5.0 }
      }
    },
    isChallenge: true,
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.EPIC]
  },
  {
    id: 'got-big-muscles',
    name: 'Got Big Muscles?',
    description: "Challenge: Winner gets full mana, Loser loses all mana",
    manaCost: 4.0,
    rarity: CardRarity.EPIC,
    type: 'challenge',
    effect: {
      type: 'challenge',
      value: 0.0,
      challengeEffects: {
        winner: { type: 'manaRefill', value: 0.0 },
        loser: { type: 'manaBurn', value: 0.0 }
      }
    },
    isChallenge: true,
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.EPIC]
  }
];