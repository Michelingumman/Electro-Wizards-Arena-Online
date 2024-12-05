import { Card } from '../types/game';

const CARD_TYPES = {
  DAMAGE: 'damage',
  HEAL: 'heal',
  UTILITY: 'utility',
  CURSE: 'curse',
  BUFF: 'buff',
  CHALLENGE: 'challenge',
  LEGENDARY: 'legendary'
} as const;

const CARD_POOL: Card[] = [
  // Basic Damage Cards
  {
    id: 'fire-arrow',
    name: 'Fire Arrow',
    manaCost: 1.0,
    type: CARD_TYPES.DAMAGE,
    effect: { type: 'damage', value: 1.0 },
    requiresTarget: true,
    description: 'A basic fire arrow that deals 1 damage',
    color: 'from-red-950 to-orange-950'
  },
  {
    id: 'ice-chard',
    name: 'Ice Chard',
    manaCost: 1.0,
    type: CARD_TYPES.DAMAGE,
    effect: { type: 'damage', value: 1.0 },
    requiresTarget: true,
    description: 'A sharp shard of ice that deals 1 damage',
    color: 'from-blue-950 to-cyan-950'
  },
  
  // Advanced Damage Cards
  {
    id: 'fireball',
    name: 'Fireball',
    manaCost: 3.0,
    type: CARD_TYPES.DAMAGE,
    effect: { type: 'damage', value: 4.0 },
    requiresTarget: true,
    description: 'Launch a ball of fire at your target',
    color: 'from-red-950 to-orange-950'
  },
  {
    id: 'arcane-blast',
    name: 'Arcane Blast',
    manaCost: 1.0,
    type: CARD_TYPES.DAMAGE,
    effect: { type: 'damage', value: 2.0 },
    requiresTarget: true,
    description: 'A quick burst of arcane energy',
    color: 'from-purple-950 to-pink-950'
  },
  {
    id: 'ice-shard',
    name: 'Ice Shard',
    manaCost: 2.0,
    type: CARD_TYPES.DAMAGE,
    effect: { type: 'damage', value: 3.0 },
    requiresTarget: true,
    description: 'Launch a freezing shard of ice',
    color: 'from-blue-950 to-cyan-950'
  },
  
  // Healing Cards
  {
    id: 'healing-light',
    name: 'Healing Light',
    manaCost: 2.0,
    type: CARD_TYPES.HEAL,
    effect: { type: 'heal', value: 3.0 },
    requiresTarget: false,
    description: 'Bathe yourself in healing light',
    color: 'from-green-950 to-emerald-950'
  },
  {
    id: 'rejuvenation',
    name: 'Rejuvenation',
    manaCost: 4.0,
    type: CARD_TYPES.HEAL,
    effect: { type: 'heal', value: 6.0 },
    requiresTarget: false,
    description: 'A powerful healing spell',
    color: 'from-green-950 to-teal-950'
  },
  
  // Utility Cards
  {
    id: 'mana-drain',
    name: 'Mana Drain',
    manaCost: 2.0,
    type: CARD_TYPES.UTILITY,
    effect: { type: 'manaDrain', value: 3.0 },
    requiresTarget: true,
    description: 'Drain mana from your target',
    color: 'from-blue-950 to-cyan-950'
  },
  {
    id: 'forced-drink',
    name: 'Forced Drink',
    manaCost: 1.0,
    type: CARD_TYPES.CURSE,
    effect: { type: 'forceDrink', value: 0.0 },
    requiresTarget: true,
    description: 'Force target to drink a potion',
    color: 'from-violet-950 to-purple-950'
  },
  {
    id: 'mana-burn',
    name: 'Mana Burn',
    manaCost: 3.0,
    type: CARD_TYPES.DAMAGE,
    effect: { type: 'manaBurn', value: 0.0 },
    requiresTarget: true,
    description: "Deal damage equal to half target's mana",
    color: 'from-amber-950 to-red-950'
  },
  
  // Challenge Cards
  {
    id: 'beer-havf',
    name: 'Beer Hävf',
    manaCost: 3.0,
    type: CARD_TYPES.CHALLENGE,
    effect: { type: 'challenge', value: 5.0 },
    requiresTarget: true,
    description: 'Challenge: Drink 1 beer the fastest. Loser loses 5 HP, winner gains 5 HP.',
    color: 'from-yellow-900 to-amber-900',
    isChallenge: true
  },
  {
    id: 'big-muscles',
    name: 'U Got Big Muscles?',
    manaCost: 2.0,
    type: CARD_TYPES.CHALLENGE,
    effect: { type: 'challenge', value: 0.0 },
    requiresTarget: true,
    description: 'Challenge: Push-up contest. Loser loses all mana, winner gets full mana.',
    color: 'from-yellow-900 to-amber-900',
    isChallenge: true
  },
  
  // Legendary Cards
  {
    id: 'infinite-void',
    name: "Gojo's: Infinite Void",
    manaCost: 5.0,
    type: CARD_TYPES.LEGENDARY,
    effect: { type: 'infiniteVoid', value: 1.0 },
    requiresTarget: false,
    description: "For the next turn, all opponents' mana costs are doubled, and their card effects are reduced by half.",
    color: 'from-indigo-950 to-violet-950',
    isLegendary: true,
    flavorText: 'Throughout Heaven and Earth, I alone am the honored one.'
  },
  {
    id: 'titan-form',
    name: "Eren Jaeger's: Titan",
    manaCost: 6.0,
    type: CARD_TYPES.LEGENDARY,
    effect: { type: 'titan', value: 3.0 },
    requiresTarget: false,
    description: 'Transform into a Titan for 3 turns. Gain +10 HP, deal +3 damage with all cards, and become immune to single-target effects.',
    color: 'from-amber-950 to-red-950',
    isLegendary: true,
    flavorText: "If you win, you live. If you lose, you die. If you don\\'t fight, you can\\'t win!"
  },
  {
    id: 'one-piece',
    name: 'One Piece',
    manaCost: 4.0,
    type: CARD_TYPES.LEGENDARY,
    effect: { type: 'onePiece', value: 3.0 },
    requiresTarget: false,
    description: "Choose: Gain 3 Mana immediately (Gold Rush) or gain a random Legendary card (Pirate's Treasure).",
    color: 'from-yellow-950 to-orange-950',
    isLegendary: true,
    flavorText: 'Wealth, fame, power... the one who had everything in this world.'
  },
  {
    id: 'time-travel',
    name: 'Time Travel',
    manaCost: 7.0,
    type: CARD_TYPES.LEGENDARY,
    effect: { type: 'timeTravel', value: 1.0 },
    requiresTarget: false,
    description: "Reset the game state to 1 turn ago. All players' health, mana, and cards return to their previous state.",
    color: 'from-cyan-950 to-blue-950',
    isLegendary: true,
    flavorText: 'The power to change fate itself.'
  }
];

const LEGENDARY_CARDS = CARD_POOL.filter(card => card.isLegendary);

export const generateInitialCards = (): Card[] => {
  const cards: Card[] = [];
  const availableCards = [...CARD_POOL].filter(card => !card.isLegendary);

  // Draw 4 random cards
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * availableCards.length);
    const card = {
      ...availableCards[randomIndex],
      id: `${availableCards[randomIndex].id}-${Math.random().toString(36).substr(2, 9)}`
    };
    cards.push(card);
    availableCards.splice(randomIndex, 1);
  }

  return cards;
};

export const drawNewCard = (includeLegendary: boolean = false): Card => {
  const availableCards = includeLegendary ? CARD_POOL : CARD_POOL.filter(card => !card.isLegendary);
  const card = availableCards[Math.floor(Math.random() * availableCards.length)];
  return {
    ...card,
    id: `${card.id}-${Math.random().toString(36).substr(2, 9)}`
  };
};

export const drawLegendaryCard = (): Card => {
  const card = LEGENDARY_CARDS[Math.floor(Math.random() * LEGENDARY_CARDS.length)];
  return {
    ...card,
    id: `${card.id}-${Math.random().toString(36).substr(2, 9)}`
  };
};