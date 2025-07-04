import { CardBase, CardRarity } from '../../../../types/cards';
import { GAME_CONFIG } from '../../../gameConfig';
import { RARITY_COLORS } from '../../rarities';

export const ORIGINAL_COMMON_CARDS: CardBase[] = [
  {
    id: 'fireball',
    name: 'Fireball',
    description: 'A classic burst of magical flame that deals 2 damage',
    manaCost: 2.0,
    rarity: CardRarity.COMMON,
    type: 'damage',
    effect: { type: 'damage', value: 2.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.COMMON]
  },
  {
    id: 'lightning-bolt',
    name: 'Lightning Bolt',
    description: 'Quick magical strike that deals 1 damage',
    manaCost: 1.0,
    rarity: CardRarity.COMMON,
    type: 'damage',
    effect: { type: 'damage', value: 1.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.COMMON]
  },
  {
    id: 'meteor',
    name: 'Meteor Strike',
    description: 'Massive magical impact! Deals +2 damage to everyone (including you)',
    manaCost: 2.0,
    rarity: CardRarity.COMMON,
    type: 'damage',
    effect: { type: 'aoeDamage', value: 2.0 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.COMMON]
  },
  {
    id: 'wild-magic',
    name: 'Wild Magic',
    description: 'Unpredictable magical energy! +2 damage to target + random collateral damage',
    manaCost: 1.0,
    rarity: CardRarity.COMMON,
    type: 'damage',
    effect: { type: 'roulette', value: 2.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.COMMON]
  },
  {
    id: 'arcane-explosion',
    name: 'Arcane Explosion',
    description: 'Magical energy overload! +2 damage to all enemies',
    manaCost: 2.0,
    rarity: CardRarity.COMMON,
    type: 'damage',
    effect: { type: 'aoeDamage', value: 2.0 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.COMMON]
  },
  {
    id: 'magic-missile',
    name: 'Magic Missile',
    description: 'Powerful magical projectile! +4 damage to target',
    manaCost: 5.0,
    rarity: CardRarity.COMMON,
    type: 'damage',
    effect: { type: 'damage', value: 4.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.COMMON]
  },
  {
    id: 'chaos-burst',
    name: 'Chaos Magic',
    description: 'Chaotic magical feedback! You and target both take -3 HP',
    manaCost: 2.0,
    rarity: CardRarity.COMMON,
    type: 'damage',
    effect: { type: 'energi_i_rummet', value: 3 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.COMMON]
  },
  {
    id: 'basic-spell',
    name: 'Basic Spell',
    description: 'Simple magical principle: Cast for +3 damage',
    manaCost: 3.0,
    rarity: CardRarity.COMMON,
    type: 'damage',
    effect: { type: 'damage', value: 3.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.COMMON]
  },
  {
    id: 'double-cast',
    name: 'Double Cast',
    description: 'Cast spell twice dealing +1 damage each time',
    manaCost: 2.0,
    rarity: CardRarity.COMMON,
    type: 'damage',
    effect: { type: 'frequency_response', value: 1.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.COMMON]
  },
  {
    id: 'magic-shield',
    name: 'Magic Shield',
    description: 'Protective barrier reduces incoming damage by half but drains 1 Mana',
    manaCost: 1.0,
    rarity: CardRarity.COMMON,
    type: 'utility',
    effect: { type: 'impedance', value: 0.5 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.COMMON]
  }
]; 