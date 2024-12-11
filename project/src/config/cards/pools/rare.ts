import { CardBase, CardRarity } from '../../../types/cards';
import { RARITY_COLORS } from '../rarities';

export const RARE_CARDS: CardBase[] = [
  {
    id: 'duct-tape',
    name: 'Duct Tape',
    description: 'Trashy bandage... +1 HP',
    manaCost: 1.0,
    rarity: CardRarity.RARE,
    type: 'heal',
    effect: { type: 'heal', value: 1.0 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.RARE]
  },
  {
    id: 'bacta-spray',
    name: 'Bacta Spray',
    description: 'An advanced healing mist that rapidly restores 4 HP to yourself',
    manaCost: 2.0,
    rarity: CardRarity.RARE,
    type: 'heal',
    effect: { type: 'heal', value: 4.0 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.RARE]
  },
  {
    id: 'mana-drain',
    name: 'Mana Drain',
    description: 'Steal Mana from your opponent',
    manaCost: 2.0,
    rarity: CardRarity.RARE,
    type: 'utility',
    effect: { type: 'manaDrain', value: 4.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.RARE]
  },
  {
    id: 'life-steal',
    name: 'Life Steal',
    description: 'Switch HP with an opponent',
    manaCost: 4.0,
    rarity: CardRarity.RARE,
    type: 'utility',
    effect: { type: 'life-steal', value: 0.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.RARE]
  },
  {
    id: 'force-drink',
    name: 'You Look Dehydrated',
    description: 'Deal out 1 drink',
    manaCost: 1.0,
    rarity: CardRarity.RARE,
    type: 'utility',
    effect: { type: 'heal', value: 0.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.RARE]
  },
  {
    id: 'reversed-curse-tech',
    name: 'Reversed Curse Technique',
    description: 'Heal half of the opponents health',
    manaCost: 3.0,
    rarity: CardRarity.RARE,
    type: 'utility',
    effect: { type: 'reversed-curse-tech', value: 2.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.RARE]
  }
  // {
  //   id: 'guardian',
  //   name: 'Guardian Angel',
  //   description: 'Heal yourself for 3 HP and shield for 1 turn',
  //   manaCost: 2.0,
  //   rarity: CardRarity.RARE,
  //   type: 'utility',
  //   effect: { type: 'heal', value: 0.0 },
  //   requiresTarget: true,
  //   color: RARITY_COLORS[CardRarity.RARE]
  // }
];

