import { CardRarity } from '../../types/cards';

export const RARITY_WEIGHTS = {
  [CardRarity.COMMON]: 1,
  [CardRarity.RARE]: 0.0,
  [CardRarity.EPIC]: 0.0,
  [CardRarity.LEGENDARY]: 0.0,
} as const;

export const RARITY_COLORS = {
  [CardRarity.COMMON]: 'from-gray-700 to-gray-800',
  [CardRarity.RARE]: 'from-teal-800 to-teal-900',
  [CardRarity.EPIC]: 'from-orange-800 to-orange-900',
  [CardRarity.LEGENDARY]: 'from-yellow-700 to-yellow-800 shadow-lg shadow-yellow-500/50',
} as const;