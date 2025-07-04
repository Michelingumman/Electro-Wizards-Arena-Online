import { CardBase, CardRarity } from '../../../../types/cards';
import { RARITY_COLORS } from '../../rarities';

export const ELECTRICAL_RARE_CARDS: CardBase[] = [
  {
    id: 'emergency-repair',
    name: 'Emergency Circuit Repair',
    description: 'Quick soldering job restores +1 HP',
    manaCost: 1.0,
    rarity: CardRarity.RARE,
    type: 'heal',
    effect: { type: 'heal', value: 1.0 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.RARE]
  },
  {
    id: 'biomedical-device',
    name: 'Biomedical Healing Device',
    description: 'Advanced medical equipment repairs biological systems for +4 HP',
    manaCost: 2.0,
    rarity: CardRarity.RARE,
    type: 'heal',
    effect: { type: 'heal', value: 4.0 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.RARE]
  },
  {
    id: 'power-drain',
    name: 'Power Siphon Circuit',
    description: 'Steal +4 Mana through inductive coupling',
    manaCost: 2.0,
    rarity: CardRarity.RARE,
    type: 'utility',
    effect: { type: 'manaDrain', value: 4.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.RARE]
  },
  {
    id: 'energy-transfer',
    name: 'Energy Transfer Protocol',
    description: 'Wireless power transfer - switch HP with opponent using electromagnetic fields',
    manaCost: 4.0,
    rarity: CardRarity.RARE,
    type: 'utility',
    effect: { type: 'life-steal', value: 0.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.RARE]
  },
  {
    id: 'shock-therapy',
    name: 'Electrical Shock Therapy',
    description: 'Apply therapeutic electrical stimulation (force 1 drink)',
    manaCost: 1.0,
    rarity: CardRarity.RARE,
    type: 'utility',
    effect: { type: 'forceDrink', value: 0.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.RARE]
  },
  {
    id: 'regenerative-circuit',
    name: 'Regenerative Feedback Circuit',
    description: 'Use regenerative braking principles to heal for half target\'s health',
    manaCost: 3.0,
    rarity: CardRarity.RARE,
    type: 'utility',
    effect: { type: 'reversed-curse-tech', value: 2.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.RARE]
  },
  {
    id: 'capacitor-bank',
    name: 'Capacitor Bank Charge',
    description: 'Store electrical energy for future use - gain +3 Mana next turn',
    manaCost: 2.0,
    rarity: CardRarity.RARE,
    type: 'utility',
    effect: { type: 'manaRefillNextTurn', value: 3.0 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.RARE]
  },
  {
    id: 'semiconductor-junction',
    name: 'PN Junction Diode',
    description: 'One-way current flow deals +2 damage and drains +2 Mana',
    manaCost: 3.0,
    rarity: CardRarity.RARE,
    type: 'utility',
    effect: { type: 'manaDrain', value: 2.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.RARE]
  },
  {
    id: 'transformer-coupling',
    name: 'Transformer Coupling',
    description: 'Galvanic isolation protects you from next attack (immune for 1 turn)',
    manaCost: 3.0,
    rarity: CardRarity.RARE,
    type: 'utility',
    effect: { type: 'transformer_isolation', value: 1.0 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.RARE]
  },
  {
    id: 'operational-amplifier',
    name: 'Op-Amp Signal Boost',
    description: 'Amplify next card effect by 150% (gain = 1.5)',
    manaCost: 2.0,
    rarity: CardRarity.RARE,
    type: 'utility',
    effect: { type: 'signal_amplify', value: 1.5 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.RARE]
  },
  {
    id: 'low-pass-filter',
    name: 'Low-Pass Filter',
    description: 'Filter out high-frequency noise - reduce all incoming damage by 50% for 2 turns',
    manaCost: 4.0,
    rarity: CardRarity.RARE,
    type: 'utility',
    effect: { type: 'noise_filter', value: 0.5 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.RARE]
  }
]; 