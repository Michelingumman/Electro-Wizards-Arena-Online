import { CardBase, CardRarity } from '../../../types/cards';
import { RARITY_COLORS } from '../rarities';

export const RARE_CARDS: CardBase[] = [
  {
    id: 'duct-tape',
    name: 'Alcoholic Tolerance',
    description: 'Reduce your mana intake by 4',
    manaCost: 5,
    rarity: CardRarity.RARE,
    type: 'normal',
    effect: {
      type: 'manaIntake',
      value: -4
    },
    requiresTarget: false,
    color: 'amber'
  },
  {
    id: 'bacta-spray',
    name: 'Double Shot',
    description: 'Increase your max mana by 3',
    manaCost: 6,
    rarity: CardRarity.RARE,
    type: 'normal',
    effect: {
      type: 'maxMana',
      value: 3
    },
    requiresTarget: false,
    color: 'lime'
  },
  {
    id: 'mana-drain',
    name: 'Mana Drain',
    description: 'Drain 7 mana from target, increasing your mana by 7',
    manaCost: 6,
    rarity: CardRarity.RARE,
    type: 'targeted',
    effect: {
      type: 'manaDrain',
      value: 7
    },
    requiresTarget: true,
    color: 'blue'
  },
  {
    id: 'mana-transfer',
    name: 'Mana Transfer',
    description: 'Transfer 5 mana from yourself to target player',
    manaCost: 3,
    rarity: CardRarity.RARE,
    type: 'targeted',
    effect: {
      type: 'manaTransfer',
      value: 5
    },
    requiresTarget: true,
    color: 'violet'
  },
  {
    id: 'sobering-potion',
    name: 'Sobering Potion',
    description: 'Reset your mana intake to 0',
    manaCost: 4,
    rarity: CardRarity.RARE,
    type: 'normal',
    effect: {
      type: 'soberingPotion',
      value: 0
    },
    requiresTarget: false,
    color: 'emerald'
  },
  {
    id: 'mana-shield',
    name: 'Mana Shield',
    description: 'Gain immunity to the next targeted mana drain effect',
    manaCost: 5,
    rarity: CardRarity.RARE,
    type: 'normal',
    effect: {
      type: 'manaShield',
      value: 1
    },
    requiresTarget: false,
    color: 'cyan'
  },
  {
    id: 'challice-of-focus',
    name: 'Chalice of Focus',
    description: 'Reduce all players mana intake by 2 (including yourself)',
    manaCost: 6,
    rarity: CardRarity.RARE,
    type: 'aoe',
    effect: {
      type: 'manaIntake',
      value: -2
    },
    requiresTarget: false,
    color: 'indigo'
  },
  {
    id: 'shot-contest',
    name: 'Shot Contest',
    description: 'Challenge another player. Winner gains 2 mana, loser gains 6 mana intake',
    manaCost: 3,
    rarity: CardRarity.RARE,
    type: 'challenge',
    effect: {
      type: 'challenge',
      value: 0,
      winnerEffect: {
        type: 'mana',
        value: 2
      },
      loserEffect: {
        type: 'manaIntake',
        value: 6
      }
    },
    requiresTarget: true,
    color: 'amber'
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

