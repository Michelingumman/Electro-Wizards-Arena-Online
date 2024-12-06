import { CardBase, CardRarity } from '../types/cards';
import { RARITY_COLORS } from '../config/cards/rarities';

export const CARD_POOL: CardBase[] = [
  // Common Cards
  {
    id: 'fire-arrow',
    name: '1',
    description: 'A basic fire arrow that deals 1 damage',
    manaCost: 1.0,
    rarity: CardRarity.COMMON,
    type: 'damage',
    effect: { type: 'damage', value: 1.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.COMMON]
  },
  {
    id: 'ice-chard',
    name: '2',
    description: 'A sharp shard of ice that deals 1 damage',
    manaCost: 1.0,
    rarity: CardRarity.COMMON,
    type: 'damage',
    effect: { type: 'damage', value: 1.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.COMMON]
  },
  
  // Rare Cards
  {
    id: 'healing-light',
    name: '3',
    description: 'Bathe yourself in healing light',
    manaCost: 2.0,
    rarity: CardRarity.RARE,
    type: 'heal',
    effect: { type: 'heal', value: 3.0 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.RARE]
  },
  {
    id: 'mana-drain',
    name: '4',
    description: 'Drain mana from your target',
    manaCost: 2.0,
    rarity: CardRarity.RARE,
    type: 'utility',
    effect: { type: 'manaDrain', value: 3.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.RARE]
  },
  
  // Epic Cards
  {
    id: 'fireball',
    name: '5',
    description: 'Launch a powerful ball of fire',
    manaCost: 3.0,
    rarity: CardRarity.EPIC,
    type: 'damage',
    effect: { type: 'damage', value: 1.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.EPIC]
  },
  {
    id: 'mana-burn',
    name: '6',
    description: "Deal damage equal to half target's mana",
    manaCost: 3.0,
    rarity: CardRarity.EPIC,
    type: 'damage',
    effect: { type: 'manaBurn', value: 0.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.EPIC]
  },
  
  // Legendary Cards
  {
    id: '7',
    name: "Gojo's: Infinite Void",
    description: "For the next turn, all opponents' mana costs are doubled, and their card effects are reduced by half.",
    manaCost: 5.0,
    rarity: CardRarity.LEGENDARY,
    type: 'legendary',
    effect: { type: 'infiniteVoid', value: 1.0 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.LEGENDARY],
    isLegendary: true,
    flavorText: 'Throughout Heaven and Earth, I alone am the honored one.'
  },
  {
    id: 'titan-form',
    name: "Eren Jaeger's: Titan",
    description: 'Transform into a Titan for 3 turns. Gain +10 HP, deal +3 damage with all cards, and become immune to single-target effects.',
    manaCost: 6.0,
    rarity: CardRarity.LEGENDARY,
    type: 'legendary',
    effect: { type: 'titan', value: 3.0 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.LEGENDARY],
    isLegendary: true,
    flavorText: "If you win, you live. If you lose, you die. If you don't fight, you can't win!"
  }
]