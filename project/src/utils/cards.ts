import { CardBase } from '../types/cards';
import { CARD_POOL, NON_LEGENDARY_CARDS, LEGENDARY_CARDS } from '../config/cards';
import { CARDS_PER_HAND } from '../config/cards/rarities';

export function generateInitialCards(): CardBase[] {
  const cards: CardBase[] = [];
  const availableCards = [...NON_LEGENDARY_CARDS];

  for (let i = 0; i < CARDS_PER_HAND; i++) {
    const randomIndex = Math.floor(Math.random() * availableCards.length);
    const card = {
      ...availableCards[randomIndex],
      id: `${availableCards[randomIndex].id}-${Math.random().toString(36).substr(2, 9)}`
    };
    cards.push(card);
    availableCards.splice(randomIndex, 1);
  }

  return cards;
}

export function drawNewCard(): CardBase {
  const card = CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)];
  return {
    ...card,
    id: `${card.id}-${Math.random().toString(36).substr(2, 9)}`
  };
}

export function drawLegendaryCard(): CardBase {
  const card = LEGENDARY_CARDS[Math.floor(Math.random() * LEGENDARY_CARDS.length)];
  return {
    ...card,
    id: `${card.id}-${Math.random().toString(36).substr(2, 9)}`
  };
}