import { CardBase } from '../../types/cards';
import { COMMON_CARDS } from './pools/common';
import { RARE_CARDS } from './pools/rare';
import { EPIC_CARDS } from './pools/epic';
import { LEGENDARY_CARDS } from './pools/legendary';
import { CAN_CUP_CARDS } from './pools/canCup';

export * from './pools/common';
export * from './pools/rare';
export * from './pools/epic';
export * from './pools/legendary';
export * from './pools/canCup';
export * from './rarities';

// Combine all cards into a single pool
export const CARD_POOL: CardBase[] = [
  ...COMMON_CARDS,
  ...RARE_CARDS,
  ...EPIC_CARDS,
  ...LEGENDARY_CARDS
];

export const CAN_CUP_CARD_POOL: CardBase[] = [...CAN_CUP_CARDS];

// Card utility functions
export function generateCardId(): string {
  return `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
