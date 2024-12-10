import { CardBase } from '../types/cards';
import { NON_LEGENDARY_CARDS, LEGENDARY_CARDS, CARD_POOL, generateCardId } from '../config/cards';
import { GAME_CONFIG } from '../config/gameConfig';

export function generateInitialCards(): CardBase[] {
  const cards: CardBase[] = [];
  const availableCards = [...NON_LEGENDARY_CARDS];

  for (let i = 0; i < GAME_CONFIG.CARDS_PER_HAND; i++) {
    const randomIndex = Math.floor(Math.random() * availableCards.length);
    const card = {
      ...availableCards[randomIndex],
      id: generateCardId()
    };
    cards.push(card);
    availableCards.splice(randomIndex, 1);
  }
  console.log('generated the initial cards: ',cards, 'CARDS PER HAND: ', GAME_CONFIG.CARDS_PER_HAND);
  return cards;
}

export function drawNewCard(): CardBase {
  const card = CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)];
  console.log('New card drawn: ',card);
  return {
    ...card,
    id: generateCardId()
  };
}

export function drawLegendaryCard(): CardBase {
  const card = LEGENDARY_CARDS[Math.floor(Math.random() * LEGENDARY_CARDS.length)];
  console.log('New Legendary card drawn: ',card);
  return {
    ...card,
    id: generateCardId()
  };
}