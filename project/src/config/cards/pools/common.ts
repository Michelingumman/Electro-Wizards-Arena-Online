import { CardBase, CardRarity } from '../../../types/cards';
import { GAME_CONFIG } from '../../gameConfig';
import { RARITY_COLORS } from '../rarities';

export const COMMON_CARDS: CardBase[] = [
  {
    id: 'fire-arrow',
    name: 'Mana Drain Arrow',
    description: 'A basic magic arrow that drains 1 mana from target',
    manaCost: 1.0,
    rarity: CardRarity.COMMON,
    type: 'damage',
    effect: { type: 'damage', value: 1.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.COMMON]
  },
  {
    id: 'ice-chard',
    name: 'Mana Freeze Shard',
    description: 'A sharp shard of ice that drains 2 mana from target',
    manaCost: 2.0,
    rarity: CardRarity.COMMON,
    type: 'damage',
    effect: { type: 'damage', value: 2.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.COMMON]
  },
  {
    id: 'lightning-chain',
    name: 'Mana Chain Lightning',
    description: 'Drains 1 mana from everyone (even the one playing the card)',
    manaCost: 2.0,
    rarity: CardRarity.COMMON,
    type: 'damage',
    effect: { type: 'aoeDamage', value: 1.0 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.COMMON]
  },
  {
    id: 'shotgun',
    name: 'Drunk Roulette',
    description: 'Increases mana intake by 2 for the target and one random player (could be you)',
    manaCost: 1.0,
    rarity: CardRarity.COMMON,
    type: 'damage',
    effect: { type: 'roulette', value: 2.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.COMMON]
  },
  {
    id: 'shockwave',
    name: 'Mana Shockwave',
    description: 'Drains 2 mana from all other players',
    manaCost: 2.0,
    rarity: CardRarity.COMMON,
    type: 'damage',
    effect: { type: 'aoeDamage', value: 2.0 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.COMMON]
  },
  {
    id: 'fireball',
    name: 'Mana Fireball',
    description: 'Cast a powerful Fireball that drains 4 Mana from an opponent',
    manaCost: 5.0,
    rarity: CardRarity.COMMON,
    type: 'damage',
    effect: { type: 'damage', value: 4.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.COMMON]
  },
  {
    id: 'energi_i_rummet',
    name: 'Match the Energy!',
    description: 'You and your target both get +3 to mana intake (getting closer to drunk state)',
    manaCost: 2.0,
    rarity: CardRarity.COMMON,
    type: 'damage',
    effect: { type: 'energi_i_rummet', value: 3 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.COMMON]
  },
  {
    id: 'hangover-cure',
    name: 'Hangover Cure',
    description: 'Reduces your mana intake by 4, helping you sober up',
    manaCost: 2.0,
    rarity: CardRarity.COMMON,
    type: 'utility',
    effect: { type: 'soberingPotion', value: 4.0 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.COMMON]
  },
  {
    id: 'bar-tab',
    name: 'Open Bar Tab',
    description: 'Gain 3 mana, but increase your mana intake by 1',
    manaCost: 0.0,
    rarity: CardRarity.COMMON,
    type: 'utility',
    effect: { type: 'manaRefill', value: 3.0 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.COMMON]
  }
];