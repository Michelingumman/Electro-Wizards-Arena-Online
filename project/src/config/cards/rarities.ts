import { CardRarity } from '../../types/cards';

export const RARITY_WEIGHTS = {
  [CardRarity.COMMON]: 1.0,
  [CardRarity.RARE]: 0.0,
  [CardRarity.EPIC]: 0.0,
  [CardRarity.LEGENDARY]: 0.0,
} as const;

export const RARITY_COLORS = {
  [CardRarity.COMMON]: 'from-blue-800 to-blue-900',
  [CardRarity.RARE]: 'from-green-800 to-green-900',
  [CardRarity.EPIC]: 'from-purple-800 to-purple-900',
  [CardRarity.LEGENDARY]: 'from-yellow-700 to-yellow-800',
} as const;

export const CARDS_PER_HAND = 4;