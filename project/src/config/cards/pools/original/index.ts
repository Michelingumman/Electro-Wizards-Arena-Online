import { CardBase } from '../../../../types/cards';
import { ORIGINAL_COMMON_CARDS } from './common';
import { ORIGINAL_RARE_CARDS } from './rare';
import { ORIGINAL_EPIC_CARDS } from './epic';
import { ORIGINAL_LEGENDARY_CARDS } from './legendary';

export * from './common';
export * from './rare';
export * from './epic';
export * from './legendary';

// Combine all original cards into a single pool
export const ORIGINAL_CARD_POOL: CardBase[] = [
  ...ORIGINAL_COMMON_CARDS,
  ...ORIGINAL_RARE_CARDS,
  ...ORIGINAL_EPIC_CARDS,
  ...ORIGINAL_LEGENDARY_CARDS
];

// Separate non-legendary cards for initial card generation
export const ORIGINAL_NON_LEGENDARY_CARDS = ORIGINAL_CARD_POOL.filter(card => !card.isLegendary); 