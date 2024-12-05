import { Card } from '../types/game';

const CARD_TYPES = {
  DAMAGE: 'damage',
  HEAL: 'heal',
  UTILITY: 'utility',
  CURSE: 'curse',
  BUFF: 'buff',
  CHALLENGE: 'challenge'
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
  
  // New Utility Cards
  {
    id: 'simple-mushroom',
    name: 'Simple Mushroom',
    manaCost: 3.0,
    type: CARD_TYPES.BUFF,
    effect: { type: 'potionBuff', value: 2.5 },
    requiresTarget: false,
    description: 'Mana potions fill you up to 2.5x more for the next 3 turns',
    color: 'from-emerald-950 to-green-950'
  },
  {
    id: 'full-refill',
    name: 'Full Refill',
    manaCost: 0.0,
    type: CARD_TYPES.UTILITY,
    effect: { type: 'manaRefill', value: 0.0 },
    requiresTarget: false,
    description: 'Gain full mana instantly',
    color: 'from-blue-950 to-indigo-950'
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
  }
];

export const generateInitialCards = (): Card[] => {
  const cards: Card[] = [];
  const availableCards = [...CARD_POOL];

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

export const drawNewCard = (): Card => {
  const card = CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)];
  return {
    ...card,
    id: `${card.id}-${Math.random().toString(36).substr(2, 9)}`
  };
};