import { Card, PlayerHand } from '../types/game';
import { CARD_POOL } from '../config/cards/index';
import { CardRarity } from '../types/cards';
import { RARITY_WEIGHTS } from '../config/cards/rarities';

function getRandomRarity(): CardRarity {
  const weights = Object.entries(RARITY_WEIGHTS);
  const totalWeight = weights.reduce((sum, [, weight]) => sum + weight, 0);
  const randomValue = Math.random() * totalWeight;

  let cumulativeWeight = 0;
  for (const [rarity, weight] of weights) {
    cumulativeWeight += weight;
    if (randomValue < cumulativeWeight) {
      return rarity as CardRarity;
    }
  }

  // Fallback (shouldn't reach here if weights are correct)
  return CardRarity.COMMON;
}

function getCardByRarity(rarity: CardRarity): Card[] {
  return CARD_POOL.filter(card => card.rarity === rarity);
}

export function drawNewCard(): Card {
  const rarity = getRandomRarity(); // Determine card rarity based on weights
  const pool = getCardByRarity(rarity); // Get cards of that rarity

  if (pool.length === 0) {
    throw new Error(`No cards available for rarity: ${rarity}`);
  }

  const card = pool[Math.floor(Math.random() * pool.length)];
  return {
    ...card,
    id: `${card.id}-${Math.random().toString(36).substr(2, 9)}`
  };
}

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
    const card = drawNewCard(); // Draw a card with weighted rarity
    hand.push(card);
    if (card.rarity) {
      stats[card.rarity.toLowerCase() as keyof typeof stats]++;
      stats.total++;
    }
  }

  return { cards: hand, stats };
}

export function drawLegendaryCard(): Card {
  const legendaryCards = getCardByRarity(CardRarity.LEGENDARY);
  const card = legendaryCards[Math.floor(Math.random() * legendaryCards.length)];
  return {
    ...card,
    id: `${card.id}-${Math.random().toString(36).substr(2, 9)}`
  };
}
