import { CardBase, CardRarity } from '../../../types/cards';
import { RARITY_COLORS } from '../rarities';

export const RARE_CARDS: CardBase[] = [
  {
    id: 'healing-light',
    name: 'Healing Light',
    description: 'Bathe yourself in healing light',
    manaCost: 2.0,
    rarity: CardRarity.RARE,
    type: 'heal',
    effect: { type: 'heal', value: 3.0 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.RARE]
  },
  {
    id: 'mana-drain',
    name: 'Mana Drain',
    description: 'Drain mana from your target',
    manaCost: 2.0,
    rarity: CardRarity.RARE,
    type: 'utility',
    effect: { type: 'manaDrain', value: 3.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.RARE]
  }
];