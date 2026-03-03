import { CardBase, CardRarity } from '../types/cards';
import { CAN_CUP_CARD_POOL, CARD_POOL, generateCardId } from '../config/cards';
import { RARITY_WEIGHTS } from '../config/cards/rarities';
import { GAME_CONFIG } from '../config/gameConfig';
import { GameMode } from '../types/game';



const randomWords = [
  'katt',
  'hund',
  'fisk',
  'bil',
  'båt',
  'flygplan',
  'dator',
  'telefon',
  'bok',
  'penna',
  'bord',
  'stol',
  'hus',
  'skola',
  'lärare',
  'doktor',
  'polis',
  'fotboll',
  'cykel',
  'äpple',
  'banan',
  'boll',
  'sjuksköterska',
  'pilot',
  'brandman',
  'målare',
  'snickare',
  'kock',
  'mus',
  'fågel',
  'orm',
  'groda',
  'tiger',
  'elefant',
  'flodhäst',
  'nyckel',
  'sol',
  'måne',
  'stjärna',
  'träd',
  'blomma',
  'fönster',
  'dörr',
  'spegel',
  'sked',
  'gaffel',
  'tåg',
  'buss',
  'klocka',
  'cykelhjälm',
  'glass',
  'regn',
  'snö',
  'moln',
  'hatt',
  'skor',
  'strumpor',
  'jacka',
  'tröja',
  'tårta',
  'choklad',
  'glasspinne',
  'fotograf',
  'målning',
  'teater',
  'piano',
  'gitarr',
  'trumma',
  'fiol',
  'fiskespö',
  'strand',
  'hav',
  'båtresa',
  'berg',
  'skog',
  'väg',
  'bro',
  'park',
  'lekplats',
  'tält',
  'brasa',
  'grill',
  'tandborste',
  'schampo',
  'såpa',
  'kudde',
  'täcke',
  'kylskåp',
  'spis',
  'ugn',
  'diskmaskin',
  'tvättmaskin',
  'dammsugare',
  'leksak',
  'bollhav',
  'paraply',
  'hammare',
  'skruvmejsel',
  'borste',
  'lim',
  'sax',
  'tejp',
  'färg'
];



function getRandomWord() {
  return randomWords[Math.floor(Math.random() * randomWords.length)];
}
/**
 * Helper function to determine a random rarity based on weights.
 */
const CAN_CUP_RARITY_WEIGHTS: Record<CardRarity, number> = {
  [CardRarity.COMMON]: 0.5,
  [CardRarity.RARE]: 0.3,
  [CardRarity.EPIC]: 0.15,
  [CardRarity.LEGENDARY]: 0.05,
};

function getCardPoolForMode(gameMode: GameMode): CardBase[] {
  return gameMode === 'can-cup' ? CAN_CUP_CARD_POOL : CARD_POOL;
}

function getRandomRarity(weightsConfig: Record<CardRarity, number>): CardRarity {
  const weights = Object.entries(weightsConfig);
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
function getCardByRarity(rarity: CardRarity, gameMode: GameMode): CardBase[] {
  return getCardPoolForMode(gameMode).filter(card => card.rarity === rarity);
}

function getWeightsForMode(gameMode: GameMode): Record<CardRarity, number> {
  return gameMode === 'can-cup' ? CAN_CUP_RARITY_WEIGHTS : RARITY_WEIGHTS;
}

/**
 * Generates the initial hand of cards for a player.
 */
export function generateInitialCards(gameMode: GameMode = 'classic'): CardBase[] {
  const cards: CardBase[] = [];
  const stats = {
    common: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
    total: 0
  };

  while (cards.length < GAME_CONFIG.CARDS_PER_HAND) {
    const card = drawNewCard(gameMode); // Use the weighted draw logic
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
export function drawNewCard(gameMode: GameMode = 'classic'): CardBase {
  const weights = getWeightsForMode(gameMode);
  const rarity = getRandomRarity(weights); // Determine card rarity based on weights
  let pool = getCardByRarity(rarity, gameMode); // Get cards of that rarity

  if (pool.length === 0) {
    const fallbackRarity = (Object.keys(weights) as CardRarity[])
      .filter((entry) => weights[entry] > 0)
      .find((entry) => getCardByRarity(entry, gameMode).length > 0);

    if (!fallbackRarity) {
      throw new Error(`No cards available for mode: ${gameMode}`);
    }

    pool = getCardByRarity(fallbackRarity, gameMode);
  }

  const card = pool[Math.floor(Math.random() * pool.length)];


  // Check if the drawn card is the Charader!!! card and update its description
  if (card.name === 'Charader!!!') {
    const word = getRandomWord();
    return {
      ...card,
      description: `YOUR WORD: "${word}". Make everybody guess your word, the person who guesses it first gets +5 Mana, you get +3 HP, and the rest takes a shot.`,
      id: generateCardId()
    };
  }

  // Assign random category for the Kategori card on draw
  if (card.id === 'cc-category-random') {
    const { CAN_CUP_CATEGORIES } = require('../config/cards/pools/canCup');
    const category = CAN_CUP_CATEGORIES[Math.floor(Math.random() * CAN_CUP_CATEGORIES.length)];
    return {
      ...card,
      name: `Kategori: ${category}`,
      description: `Nämn saker inom "${category}". Den som missar tar 3 klunkar.`,
      id: generateCardId()
    };
  }

  return {
    ...card,
    id: generateCardId()
  };
}

/**
 * Draws a legendary card.
 */
export function drawLegendaryCard(): CardBase {
  const legendaryCards = getCardByRarity(CardRarity.LEGENDARY, 'classic');
  if (legendaryCards.length === 0) {
    throw new Error('No legendary cards available');
  }

  const card = legendaryCards[Math.floor(Math.random() * legendaryCards.length)];
  return {
    ...card,
    id: generateCardId()
  };
}
