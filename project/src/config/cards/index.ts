import { CardBase } from '../../types/cards';
import { COMMON_CARDS } from './pools/common';
import { RARE_CARDS } from './pools/rare';
import { EPIC_CARDS } from './pools/epic';
import { LEGENDARY_CARDS } from './pools/legendary';

export * from './pools/common';
export * from './pools/rare';
export * from './pools/epic';
export * from './pools/legendary';
export * from './rarities';

export const CARD_POOL: CardBase[] = [
  ...COMMON_CARDS,
  ...RARE_CARDS,
  ...EPIC_CARDS,
  ...LEGENDARY_CARDS
];

export const NON_LEGENDARY_CARDS = CARD_POOL.filter(card => !card.isLegendary);