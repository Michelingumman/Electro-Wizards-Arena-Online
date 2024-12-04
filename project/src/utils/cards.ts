import { Card } from '../types/game';

const CARD_TYPES = {
  DAMAGE: 'damage',
  HEAL: 'heal',
  UTILITY: 'utility',
  CURSE: 'curse',
  BUFF: 'buff'
} as const;

export const generateInitialCards = (): Card[] => {
  return [
    // Damage Cards
    {
      id: 'fireball',
      name: 'Fireball',
      manaCost: 3,
      type: CARD_TYPES.DAMAGE,
      effect: { type: 'damage', value: 4 },
      requiresTarget: true,
      description: 'Launch a ball of fire at your target',
      color: 'from-red-950 to-orange-950'
    },
    {
      id: 'arcane-blast',
      name: 'Arcane Blast',
      manaCost: 1,
      type: CARD_TYPES.DAMAGE,
      effect: { type: 'damage', value: 2 },
      requiresTarget: true,
      description: 'A quick burst of arcane energy',
      color: 'from-purple-950 to-pink-950'
    },
    
    // Healing Cards
    {
      id: 'healing-light',
      name: 'Healing Light',
      manaCost: 2,
      type: CARD_TYPES.HEAL,
      effect: { type: 'heal', value: 3 },
      requiresTarget: false,
      description: 'Bathe yourself in healing light',
      color: 'from-green-950 to-emerald-950'
    },
    
    // Utility Cards
    {
      id: 'mana-drain',
      name: 'Mana Drain',
      manaCost: 2,
      type: CARD_TYPES.UTILITY,
      effect: { type: 'manaDrain', value: 3 },
      requiresTarget: true,
      description: 'Drain mana from your target',
      color: 'from-blue-950 to-cyan-950'
    },
    {
      id: 'forced-drink',
      name: 'Forced Drink',
      manaCost: 1,
      type: CARD_TYPES.CURSE,
      effect: { type: 'forceDrink', value: 0 },
      requiresTarget: true,
      description: 'Force target to drink a potion without gaining mana',
      color: 'from-violet-950 to-purple-950'
    },
    {
      id: 'mana-burn',
      name: 'Mana Burn',
      manaCost: 3,
      type: CARD_TYPES.DAMAGE,
      effect: { type: 'manaBurn', value: 0 },
      requiresTarget: true,
      description: "Deal damage equal to target's current mana",
      color: 'from-amber-950 to-red-950'
    }
  ];
};