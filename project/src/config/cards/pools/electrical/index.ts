import { CardBase } from '../../../../types/cards';
import { ELECTRICAL_COMMON_CARDS } from './common';
import { ELECTRICAL_RARE_CARDS } from './rare';
import { ELECTRICAL_EPIC_CARDS } from './epic';
import { ELECTRICAL_LEGENDARY_CARDS } from './legendary';

export * from './common';
export * from './rare';
export * from './epic';
export * from './legendary';

// Combine all electrical cards into a single pool
export const ELECTRICAL_CARD_POOL: CardBase[] = [
  ...ELECTRICAL_COMMON_CARDS,
  ...ELECTRICAL_RARE_CARDS,
  ...ELECTRICAL_EPIC_CARDS,
  ...ELECTRICAL_LEGENDARY_CARDS
];

// Separate non-legendary cards for initial card generation
export const ELECTRICAL_NON_LEGENDARY_CARDS = ELECTRICAL_CARD_POOL.filter(card => !card.isLegendary); 