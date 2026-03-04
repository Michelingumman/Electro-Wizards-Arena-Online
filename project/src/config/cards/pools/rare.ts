import { CardBase, CardRarity } from '../../../types/cards';

export const RARE_CARDS: CardBase[] = [
  {
    id: 'duct-tape',
    name: 'Balans i Bena',
    description: 'Minska din drunkness med 3',
    manaCost: 4,
    rarity: CardRarity.RARE,
    type: 'normal',
    effect: {
      type: 'manaIntake',
      value: -3
    },
    requiresTarget: false,
    color: 'amber'
  },
  {
    id: 'bacta-spray',
    name: 'Extra Liftkort',
    description: 'Faa +2 mana och tillfaelligt hoegre manatak',
    manaCost: 5,
    rarity: CardRarity.RARE,
    type: 'normal',
    effect: {
      type: 'maxMana',
      value: 2
    },
    requiresTarget: false,
    color: 'lime'
  },
  {
    id: 'mana-drain',
    name: 'Skidpass-Stoeld',
    description: 'Stjael 5 mana fraan maalet',
    manaCost: 5,
    rarity: CardRarity.RARE,
    type: 'targeted',
    effect: {
      type: 'manaDrain',
      value: 5
    },
    requiresTarget: true,
    color: 'blue'
  },
  {
    id: 'mana-transfer',
    name: 'Lagspel i Liften',
    description: 'Ge 4 mana fraan dig sjaelv till valfri spelare',
    manaCost: 3,
    rarity: CardRarity.RARE,
    type: 'targeted',
    effect: {
      type: 'manaTransfer',
      value: 4
    },
    requiresTarget: true,
    color: 'violet'
  },
  {
    id: 'sobering-potion',
    name: 'Kall Duscha',
    description: 'Nollstaell din drunkness',
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
    name: 'Hjaelm och Ryggskydd',
    description: 'Blockera naesta riktade mana-drain',
    manaCost: 4,
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
    name: 'Gemensam Vattenrunda',
    description: 'Alla spelare minskar sin drunkness med 2',
    manaCost: 5,
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
    id: 'five-minute-breather',
    name: 'Fem Minuters Frizon',
    description: 'Minska din drunk-tid med 5:00',
    manaCost: 5,
    rarity: CardRarity.RARE,
    type: 'normal',
    effect: {
      type: 'drunkTimer',
      value: -300
    },
    requiresTarget: false,
    color: 'teal'
  },
  {
    id: 'blame-shift',
    name: 'Skyll Paa Naagon Annan',
    description: 'Maalet faar +5:00 drunk-tid, en slumpad annan faar -5:00',
    manaCost: 5,
    rarity: CardRarity.RARE,
    type: 'targeted',
    effect: {
      type: 'drunkTimerShift',
      value: 300
    },
    requiresTarget: true,
    color: 'fuchsia'
  },
  {
    id: 'shot-contest',
    name: 'Shotduell i Stugan',
    description: 'Utmaning: vinnaren faar +2 mana, foerloraren faar +5 drunkness',
    manaCost: 4,
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
        value: 5
      }
    },
    requiresTarget: true,
    color: 'amber',
    isChallenge: true,
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


