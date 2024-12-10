import { CardBase, CardRarity } from '../types/cards';
import { CARD_POOL, generateCardId } from '../config/cards';
import { RARITY_WEIGHTS } from '../config/cards/rarities';
import { GAME_CONFIG } from '../config/gameConfig';

/**
 * Helper function to determine a random rarity based on weights.
 */
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

/**
 * Filters the card pool to retrieve cards of a specific rarity.
 */
function getCardByRarity(rarity: CardRarity): CardBase[] {
  return CARD_POOL.filter(card => card.rarity === rarity);
}

/**
 * Generates the initial hand of cards for a player.
 */
export function generateInitialCards(): CardBase[] {
  const cards: CardBase[] = [];
  const stats = {
    common: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
    total: 0
  };

  while (cards.length < GAME_CONFIG.CARDS_PER_HAND) {
    const card = drawNewCard(); // Use the weighted draw logic
    cards.push(card);

    if (card.rarity) {
      stats[card.rarity.toLowerCase() as keyof typeof stats]++;
      stats.total++;
    }
  }

  console.log('Generated initial cards:', cards, 'Card Stats:', stats);
  return cards;
}

/**
 * Draws a new card based on weighted rarity.
 */
export function drawNewCard(): CardBase {
  const rarity = getRandomRarity(); // Determine card rarity based on weights
  const pool = getCardByRarity(rarity); // Get cards of that rarity

  if (pool.length === 0) {
    throw new Error(`No cards available for rarity: ${rarity}`);
  }

  const card = pool[Math.floor(Math.random() * pool.length)];
  return {
    ...card,
    id: generateCardId()
  };
}

/**
 * Draws a legendary card.
 */
export function drawLegendaryCard(): CardBase {
  const legendaryCards = getCardByRarity(CardRarity.LEGENDARY);
  if (legendaryCards.length === 0) {
    throw new Error('No legendary cards available');
  }

  const card = legendaryCards[Math.floor(Math.random() * legendaryCards.length)];
  return {
    ...card,
    id: generateCardId()
  };
}
