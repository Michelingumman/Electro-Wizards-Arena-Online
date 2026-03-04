import { CardBase, CardRarity } from '../../../types/cards';

export const EPIC_CARDS: CardBase[] = [
  {
    id: 'ol-havf',
    name: 'Stugboende Chug-Duell',
    description: 'Utmaning: vinnaren faar +4 mana, foerloraren faar +8 drunkness',
    manaCost: 5,
    rarity: CardRarity.EPIC,
    type: 'challenge',
    effect: {
      type: 'challenge',
      value: 0,
      winnerEffect: {
        type: 'mana',
        value: 4
      },
      loserEffect: {
        type: 'manaIntake',
        value: 8
      }
    },
    requiresTarget: true,
    color: 'amber',
    isChallenge: true,
  },
  {
    id: 'got-big-muscles',
    name: 'Armboej i Pisten',
    description: 'Utmaning: vinnaren faar +3 mana, foerloraren tappar 3 mana',
    manaCost: 5,
    rarity: CardRarity.EPIC,
    type: 'challenge',
    effect: {
      type: 'challenge',
      value: 0,
      winnerEffect: {
        type: 'mana',
        value: 3
      },
      loserEffect: {
        type: 'mana',
        value: -3
      }
    },
    requiresTarget: true,
    color: 'rose',
    isChallenge: true,
  },
  {
    id: 'name-the-most-car-brands',
    name: 'Namnkrig: BILMARKEN',
    description: 'Utmaning: vinnaren stjael 4 mana fraan foerloraren',
    manaCost: 6,
    rarity: CardRarity.EPIC,
    type: 'challenge',
    effect: {
      type: 'challenge',
      value: 0,
      winnerEffect: {
        type: 'manaStealer',
        value: 4
      },
      loserEffect: {
        type: 'manaBurn',
        value: 4
      },
    },
    requiresTarget: true,
    color: 'cyan',
    isChallenge: true,
  },
  {
    id: 'name-the-most-pokemon',
    name: 'Namnkrig: POKEMON',
    description: 'Utmaning: vinnaren stjael 5 mana fraan foerloraren',
    manaCost: 6,
    rarity: CardRarity.EPIC,
    type: 'challenge',
    effect: {
      type: 'challenge',
      value: 0,
      winnerEffect: {
        type: 'manaStealer',
        value: 5
      },
      loserEffect: {
        type: 'manaBurn',
        value: 5
      },
    },
    requiresTarget: true,
    color: 'yellow',
    isChallenge: true,
  },
  {
    id: 'name-the-most-countries',
    name: 'Namnkrig: LANDER',
    description: 'Utmaning: vinnaren stjael 4 mana fraan foerloraren',
    manaCost: 6,
    rarity: CardRarity.EPIC,
    type: 'challenge',
    effect: {
      type: 'challenge',
      value: 0,
      winnerEffect: {
        type: 'manaStealer',
        value: 4
      },
      loserEffect: {
        type: 'manaBurn',
        value: 4
      },
    },
    requiresTarget: true,
    color: 'blue',
    isChallenge: true,
  },
  {
    id: 'mana-explosion',
    name: 'Snabb Vaermestuga',
    description: 'Alla spelare faar +4 drunkness',
    manaCost: 6,
    rarity: CardRarity.EPIC,
    type: 'aoe',
    effect: {
      type: 'manaIntake',
      value: 4
    },
    requiresTarget: false,
    color: 'orange'
  },
  {
    id: 'party-round',
    name: 'Laget Bjuder',
    description: 'Alla spelare faar +2 mana',
    manaCost: 7,
    rarity: CardRarity.EPIC,
    type: 'aoe',
    effect: {
      type: 'mana',
      value: 2
    },
    requiresTarget: false,
    color: 'green'
  },
  {
    id: 'breath-test',
    name: 'Poliskontroll',
    description: 'Den med hoegst drunkness tappar 6 mana',
    manaCost: 5,
    rarity: CardRarity.EPIC,
    type: 'aoe',
    effect: {
      type: 'drunkestPlayerDamage',
      value: -6
    },
    requiresTarget: false,
    color: 'red'
  },
  {
    id: 'mana-roulette',
    name: 'Lodge-Roulette',
    description: 'En slumpad spelare faar +6 drunkness',
    manaCost: 4,
    rarity: CardRarity.EPIC,
    type: 'aoe',
    effect: {
      type: 'roulette',
      value: 6
    },
    requiresTarget: false,
    color: 'purple'
  },
  {
    id: 'potentiation',
    name: 'Dubbel-Tempo',
    description: 'Oeka din drunkness med 80% (x1.8)',
    manaCost: 4,
    rarity: CardRarity.EPIC,
    type: 'normal',
    effect: {
      type: 'manaIntakeMultiply',
      value: 1.8
    },
    requiresTarget: false,
    color: 'indigo'
  },
  {
    id: 'clockwork-chug',
    name: 'Tidtagar-Chug',
    description: 'Vaelj en spelare och laegg +3:00 drunk-tid',
    manaCost: 6,
    rarity: CardRarity.EPIC,
    type: 'targeted',
    effect: {
      type: 'drunkTimer',
      value: 180
    },
    requiresTarget: true,
    color: 'sky'
  }
];
