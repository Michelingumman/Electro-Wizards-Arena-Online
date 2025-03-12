import { CardRarity } from '../../types/cards';

// testing legendary
// export const RARITY_WEIGHTS = {
//   [CardRarity.COMMON]: 0.0, //basic damage etc
//   [CardRarity.RARE]: 0.0,  //heal, mana drain grejor
//   [CardRarity.EPIC]: 0.0, //challenge kort, utmaningar etc
//   [CardRarity.LEGENDARY]: 1.0, //go craxy
// } as const;

// // Testing Challenge cards
// export const RARITY_WEIGHTS = {
//   [CardRarity.COMMON]: 0.0, //basic damage etc
//   [CardRarity.RARE]: 0.0,  //heal, mana drain grejor
//   [CardRarity.EPIC]: 1, //challenge kort, utmaningar etc
//   [CardRarity.LEGENDARY]: 0.0, //go craxy
// } as const;


// Most Balanced so far
export const RARITY_WEIGHTS = {
  [CardRarity.COMMON]: 0.325, //basic damage etc
  [CardRarity.RARE]: 0.325,  //heal, mana drain grejor
  [CardRarity.EPIC]: 0.25, //challenge kort, utmaningar etc
  [CardRarity.LEGENDARY]: 0.10, //go craxy
} as const;

export const RARITY_COLORS = {
  [CardRarity.COMMON]: 'from-gray-700 to-gray-800',
  [CardRarity.RARE]: 'from-teal-800 to-teal-900',
  [CardRarity.EPIC]: 'from-orange-800 to-orange-900',
  [CardRarity.LEGENDARY]: 'from-yellow-700 to-yellow-800 shadow-lg shadow-yellow-500/50',
} as const;