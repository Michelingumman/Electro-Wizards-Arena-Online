import { CardRarity } from '../../types/cards';

export const RARITY_WEIGHTS = {
  [CardRarity.COMMON]: 0.25,
  [CardRarity.RARE]: 0.25,
  [CardRarity.EPIC]: 0.25,
  [CardRarity.LEGENDARY]: 0.25,
} as const;

export const RARITY_COLORS = {
  [CardRarity.COMMON]: 'from-gray-800 to-gray-900',
  [CardRarity.RARE]: 'from-blue-800 to-blue-900',
  [CardRarity.EPIC]: 'from-purple-800 to-purple-900',
  [CardRarity.LEGENDARY]: 'from-yellow-700 to-yellow-800',
} as const;

export const CARDS_PER_HAND = 4;