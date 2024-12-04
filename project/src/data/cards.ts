import { Card } from '../types/game';

export const cards: Card[] = [
  {
    id: '1',
    name: 'Fireball',
    manaCost: 4,
    description: 'Deal 3 damage to opponent',
    effect: { type: 'damage', value: 3, target: 'opponent' },
    imageUrl: 'https://images.unsplash.com/photo-1519810755548-39cd217da494?w=400&q=80',
  },
  {
    id: '2',
    name: 'Healing Potion',
    manaCost: 3,
    description: 'Restore 2 health',
    effect: { type: 'heal', value: 2, target: 'self' },
    imageUrl: 'https://images.unsplash.com/photo-1610705267928-1b9f2fa7f1c5?w=400&q=80',
  },
  {
    id: '3',
    name: 'Mana Surge',
    manaCost: 2,
    description: 'Gain 5 mana',
    effect: { type: 'buff', value: 5, target: 'self' },
    imageUrl: 'https://images.unsplash.com/photo-1518133835878-5a93cc3f89e5?w=400&q=80',
  },
];