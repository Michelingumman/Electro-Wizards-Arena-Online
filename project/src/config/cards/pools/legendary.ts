import { CardBase, CardRarity } from '../../../types/cards';
import { RARITY_COLORS } from '../rarities';

export const LEGENDARY_CARDS: CardBase[] = [
  {
    id: 'infinite-void',
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
  },
  {
    id: 'oskar-rage',
    name: "Oskar: EYY JAG KOMMER FCKA UR ASSÅ",
    description: 'Deal +4 Damage to all players and reduce all their Mana to 0',
    manaCost: 4.0,
    rarity: CardRarity.LEGENDARY,
    type: 'legendary',
    effect: { type: 'damage', value: 3.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.LEGENDARY],
    isChallenge: true,
    isLegendary: true,
    flavorText: "... testa mig inte"
  }
];