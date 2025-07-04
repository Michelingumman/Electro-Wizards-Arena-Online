import { CardBase, CardRarity } from '../types/cards';
import { CARD_POOL, generateCardId, getCardPoolByTheme, getNonLegendaryCardsByTheme } from '../config/cards';
import { RARITY_WEIGHTS } from '../config/cards/rarities';
import { GAME_CONFIG } from '../config/gameConfig';
import { CardTheme } from '../types/game';



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
function getCardByRarity(rarity: CardRarity, theme: CardTheme = 'electrical'): CardBase[] {
  const cardPool = getCardPoolByTheme(theme);
  return cardPool.filter(card => card.rarity === rarity);
}

/**
 * Generates the initial hand of cards for a player.
 */
export function generateInitialCards(theme: CardTheme = 'electrical'): CardBase[] {
  const cards: CardBase[] = [];
  const stats = {
    common: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
    total: 0
  };

  while (cards.length < GAME_CONFIG.CARDS_PER_HAND) {
    const card = drawNewCard(theme); // Use the weighted draw logic
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
export function drawNewCard(theme: CardTheme = 'electrical'): CardBase {
  const rarity = getRandomRarity(); // Determine card rarity based on weights
  const pool = getCardByRarity(rarity, theme); // Get cards of that rarity

  if (pool.length === 0) {
    throw new Error(`No cards available for rarity: ${rarity}`);
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

  return {
    ...card,
    id: generateCardId()
  };
}

/**
 * Draws a legendary card.
 */
export function drawLegendaryCard(theme: CardTheme = 'electrical'): CardBase {
  const legendaryCards = getCardByRarity(CardRarity.LEGENDARY, theme);
  if (legendaryCards.length === 0) {
    throw new Error('No legendary cards available');
  }

  const card = legendaryCards[Math.floor(Math.random() * legendaryCards.length)];
  return {
    ...card,
    id: generateCardId()
  };
}
