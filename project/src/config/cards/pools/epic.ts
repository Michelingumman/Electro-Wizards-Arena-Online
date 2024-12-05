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
    description: "Challenge ",
    manaCost: 4.0,
    rarity: CardRarity.EPIC,
    type: 'damage',
    effect: { type: 'challenge', value: 0.0 },
    isChallenge: true,
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.EPIC]
  },
  {
    id: 'big-muscles',
    name: 'Got big muscles?',
    description: "Challenge: ",
    manaCost: 4.0,
    rarity: CardRarity.EPIC,
    type: 'damage',
    effect: { type: 'challenge', value: 0.0 },
    isChallenge: true,
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.EPIC]
  }

];