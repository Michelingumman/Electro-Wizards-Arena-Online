import { Card } from '../types/game';

export const generateInitialCards = (): Card[] => {
  return [
    {
      id: 'fireball',
      name: 'Fireball',
      manaCost: 3,
      effect: { type: 'damage', value: 4 }
    },
    {
      id: 'heal',
      name: 'Healing Light',
      manaCost: 2,
      effect: { type: 'heal', value: 3 }
    },
    {
      id: 'blast',
      name: 'Arcane Blast',
      manaCost: 1,
      effect: { type: 'damage', value: 2 }
    },
    {
      id: 'surge',
      name: 'Mana Surge',
      manaCost: 4,
      effect: { type: 'damage', value: 6 }
    }
  ];
};