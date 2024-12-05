import { Card, CardRarity, PlayerHand } from '../types/game';
import { CARD_POOL } from './cards';

const NON_LEGENDARY_CARDS = CARD_POOL.filter(card => !card.isLegendary);
const LEGENDARY_CARDS = CARD_POOL.filter(card => card.isLegendary);

export function generateInitialHand(): PlayerHand {
  const hand: Card[] = [];
  const stats = {
    common: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
    total: 0
  };

  while (hand.length < 4) {
    const card = drawCard(false);
    hand.push(card);
    if (card.rarity) {
      stats[card.rarity.toLowerCase() as keyof typeof stats]++;
      stats.total++;
    }
  }

  return { cards: hand, stats };
}

export function drawCard(includeLegendary: boolean = false): Card {
  const pool = includeLegendary ? CARD_POOL : NON_LEGENDARY_CARDS;
  const card = pool[Math.floor(Math.random() * pool.length)];
  
  return {
    ...card,
    id: `${card.id}-${Math.random().toString(36).substr(2, 9)}`
  };
}

export function drawLegendaryCard(): Card {
  const card = LEGENDARY_CARDS[Math.floor(Math.random() * LEGENDARY_CARDS.length)];
  return {
    ...card,
    id: `${card.id}-${Math.random().toString(36).substr(2, 9)}`
  };
}