import { CardBase, CardRarity } from '../../../../types/cards';
import { GAME_CONFIG } from '../../../gameConfig';
import { RARITY_COLORS } from '../../rarities';

export const ELECTRICAL_COMMON_CARDS: CardBase[] = [
  {
    id: 'voltage-strike',
    name: 'Voltage Strike',
    description: 'A basic electrical discharge that deals 1 damage (V = IR)',
    manaCost: 1.0,
    rarity: CardRarity.COMMON,
    type: 'damage',
    effect: { type: 'damage', value: 1.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.COMMON]
  },
  {
    id: 'current-flow',
    name: 'Current Flow',
    description: 'Direct current surge that deals 2 damage (I = V/R)',
    manaCost: 2.0,
    rarity: CardRarity.COMMON,
    type: 'damage',
    effect: { type: 'damage', value: 2.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.COMMON]
  },
  {
    id: 'short-circuit',
    name: 'Short Circuit',
    description: 'Uncontrolled current path! Deals +1 damage to everyone (including you)',
    manaCost: 2.0,
    rarity: CardRarity.COMMON,
    type: 'damage',
    effect: { type: 'aoeDamage', value: 1.0 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.COMMON]
  },
  {
    id: 'static-discharge',
    name: 'Static Discharge',
    description: 'Random electrostatic buildup! +2 damage to target + random collateral damage',
    manaCost: 1.0,
    rarity: CardRarity.COMMON,
    type: 'damage',
    effect: { type: 'roulette', value: 2.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.COMMON]
  },
  {
    id: 'power-surge',
    name: 'Power Surge',
    description: 'Electrical system overload! +2 damage to all enemies',
    manaCost: 2.0,
    rarity: CardRarity.COMMON,
    type: 'damage',
    effect: { type: 'aoeDamage', value: 2.0 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.COMMON]
  },
  {
    id: 'high-voltage',
    name: 'High Voltage Blast',
    description: 'Dangerous electrical energy discharge! +4 damage to target',
    manaCost: 5.0,
    rarity: CardRarity.COMMON,
    type: 'damage',
    effect: { type: 'damage', value: 4.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.COMMON]
  },
  {
    id: 'ground-fault',
    name: 'Ground Fault Circuit',
    description: 'Improper grounding causes feedback! You and target both take -3 HP',
    manaCost: 2.0,
    rarity: CardRarity.COMMON,
    type: 'damage',
    effect: { type: 'energi_i_rummet', value: 3 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.COMMON]
  },
  {
    id: 'ohms-law',
    name: "Ohm's Law (V=IR)",
    description: 'Basic electrical principle: Calculate optimal current flow for +3 damage',
    manaCost: 3.0,
    rarity: CardRarity.COMMON,
    type: 'damage',
    effect: { type: 'damage', value: 3.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.COMMON]
  },
  {
    id: 'ac-waveform',
    name: 'AC Waveform',
    description: 'Alternating current deals +1 damage twice (60Hz frequency)',
    manaCost: 2.0,
    rarity: CardRarity.COMMON,
    type: 'damage',
    effect: { type: 'frequency_response', value: 1.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.COMMON]
  },
  {
    id: 'resistor-network',
    name: 'Resistor Voltage Divider',
    description: 'Divide incoming damage by half but also lose 1 Mana',
    manaCost: 1.0,
    rarity: CardRarity.COMMON,
    type: 'utility',
    effect: { type: 'impedance', value: 0.5 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.COMMON]
  }
]; 