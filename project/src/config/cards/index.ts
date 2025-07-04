import { CardBase } from '../../types/cards';
import { ORIGINAL_CARD_POOL, ORIGINAL_NON_LEGENDARY_CARDS } from './pools/original';
import { ELECTRICAL_CARD_POOL, ELECTRICAL_NON_LEGENDARY_CARDS } from './pools/electrical';
import { CardTheme } from '../../types/game';

// Export both card pools for theme selection
export { ORIGINAL_CARD_POOL, ORIGINAL_NON_LEGENDARY_CARDS };
export { ELECTRICAL_CARD_POOL, ELECTRICAL_NON_LEGENDARY_CARDS };

// Default to electrical theme for backward compatibility
export const CARD_POOL: CardBase[] = ELECTRICAL_CARD_POOL;
export const NON_LEGENDARY_CARDS: CardBase[] = ELECTRICAL_NON_LEGENDARY_CARDS;

// Function to get card pool based on theme
export function getCardPoolByTheme(theme: CardTheme): CardBase[] {
  switch (theme) {
    case 'original':
      return ORIGINAL_CARD_POOL;
    case 'electrical':
      return ELECTRICAL_CARD_POOL;
    default:
      return ELECTRICAL_CARD_POOL;
  }
}

// Function to get non-legendary cards based on theme
export function getNonLegendaryCardsByTheme(theme: CardTheme): CardBase[] {
  switch (theme) {
    case 'original':
      return ORIGINAL_NON_LEGENDARY_CARDS;
    case 'electrical':
      return ELECTRICAL_NON_LEGENDARY_CARDS;
    default:
      return ELECTRICAL_NON_LEGENDARY_CARDS;
  }
}

// Card utility functions
export function generateCardId(): string {
  return `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}