import { CardBase, CardRarity } from '../../../../types/cards';
import { RARITY_COLORS } from '../../rarities';

export const ELECTRICAL_EPIC_CARDS: CardBase[] = [
  {
    id: 'circuit-design-challenge',
    name: 'Circuit Design Showdown',
    description: "Challenge person to your RIGHT: Design a basic amplifier circuit fastest! Winner gets +2 HP, loser loses -2 HP",
    manaCost: 2.0,
    rarity: CardRarity.EPIC,
    type: 'challenge',
    effect: {
      type: 'challenge',
      value: 0.0,
      challengeEffects: {
        winner: { type: 'heal', value: 2.0 },
        loser: { type: 'damage', value: 2.0 }
      }
    },
    isChallenge: true,
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.EPIC]
  },
  {
    id: 'power-calculation-duel',
    name: 'Power Calculation Duel',
    description: "Challenge person to your LEFT: Calculate P=VI fastest! Winner restores all Mana, loser loses -5 Mana",
    manaCost: 5.0,
    rarity: CardRarity.EPIC,
    type: 'challenge',
    effect: {
      type: 'challenge',
      value: 0.0,
      challengeEffects: {
        winner: { type: 'manaRefill', value: 10.0 },
        loser: { type: 'manaBurn', value: 5.0 }
      }
    },
    isChallenge: true,
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.EPIC]
  },
  {
    id: 'component-naming',
    name: 'Name Electronic Components',
    description: "Challenge person to your RIGHT: Name the most electronic components! Winner gets Mana cost back, loser loses -2 HP",
    manaCost: 2.0,
    rarity: CardRarity.EPIC,
    type: 'challenge',
    effect: {
      type: 'challenge',
      value: 0.0,
      challengeEffects: {
        winner: { type: 'manaRefill', value: 2.0 },
        loser: { type: 'damage', value: 2.0 }
      }
    },
    isChallenge: true,
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.EPIC]
  },
  {
    id: 'engineering-schools',
    name: 'Name Engineering Universities',
    description: "Challenge 2nd person to your LEFT: Name the most engineering schools! Winner gets Mana cost back, loser loses -2 HP",
    manaCost: 2.0,
    rarity: CardRarity.EPIC,
    type: 'challenge',
    effect: {
      type: 'challenge',
      value: 0.0,
      challengeEffects: {
        winner: { type: 'manaRefill', value: 2.0 },
        loser: { type: 'damage', value: 2.0 }
      }
    },
    isChallenge: true,
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.EPIC]
  },
  {
    id: 'microcontroller-brands',
    name: 'Name Microcontroller Brands',
    description: "Challenge 2nd person to your RIGHT: Name the most microcontroller brands! Winner gets Mana cost back, loser loses -2 HP",
    manaCost: 2.0,
    rarity: CardRarity.EPIC,
    type: 'challenge',
    effect: {
      type: 'challenge',
      value: 0.0,
      challengeEffects: {
        winner: { type: 'manaRefill', value: 2.0 },
        loser: { type: 'damage', value: 2.0 }
      }
    },
    isChallenge: true,
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.EPIC]
  },
  {
    id: 'oscilloscope-reading',
    name: 'Oscilloscope Signal Analysis',
    description: "Challenge the most technically skilled person: Analyze this waveform! Winner gets Mana cost back, loser loses -2 HP",
    manaCost: 2.0,
    rarity: CardRarity.EPIC,
    type: 'challenge',
    effect: {
      type: 'challenge',
      value: 0.0,
      challengeEffects: {
        winner: { type: 'manaRefill', value: 2.0 },
        loser: { type: 'damage', value: 2.0 }
      }
    },
    isChallenge: true,
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.EPIC]
  },
  {
    id: 'coding-challenge',
    name: 'Embedded Programming Challenge',
    description: "Challenge 3rd person to your right: Write Arduino code snippet! Winner gets Mana cost back, loser loses -2 HP",
    manaCost: 2.0,
    rarity: CardRarity.EPIC,
    type: 'challenge',
    effect: {
      type: 'challenge',
      value: 0.0,
      challengeEffects: {
        winner: { type: 'manaRefill', value: 2.0 },
        loser: { type: 'damage', value: 2.0 }
      }
    },
    isChallenge: true,
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.EPIC]
  },
  {
    id: 'pcb-design-race',
    name: 'PCB Layout Speed Contest',
    description: "Challenge ANYONE: Design PCB layout fastest! Winner gets Mana cost back, loser loses -2 HP",
    manaCost: 2.0,
    rarity: CardRarity.EPIC,
    type: 'challenge',
    effect: {
      type: 'challenge',
      value: 0.0,
      challengeEffects: {
        winner: { type: 'manaRefill', value: 2.0 },
        loser: { type: 'damage', value: 2.0 }
      }
    },
    isChallenge: true,
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.EPIC]
  },
  {
    id: 'signal-processing',
    name: 'Signal Processing Master',
    description: "Challenge ANYONE: Explain FFT in 30 seconds! Winner gets Mana cost back, loser loses -2 HP",
    manaCost: 2.0,
    rarity: CardRarity.EPIC,
    type: 'challenge',
    effect: {
      type: 'challenge',
      value: 0.0,
      challengeEffects: {
        winner: { type: 'manaRefill', value: 2.0 },
        loser: { type: 'damage', value: 2.0 }
      }
    },
    isChallenge: true,
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.EPIC]
  },
  {
    id: 'project-demo',
    name: 'PROJECT DEMO TIME!!!',
    description: "Pick two to demo their latest engineering project! Winner gets +5 Mana, loser explains their debugging fails",
    manaCost: 3.0,
    rarity: CardRarity.EPIC,
    type: 'challenge',
    effect: {
      type: 'challenge',
      value: 0.0,
      challengeEffects: {
        winner: { type: 'manaRefill', value: 5.0 },
        loser: { type: 'damage', value: 0.0 }
      }
    },
    isChallenge: true,
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.EPIC]
  },
  {
    id: 'lab-equipment-master',
    name: 'Lab Equipment Operation #ProEngineer',
    description: "Challenge the last person who won: Operate this multimeter correctly! Winner gets +3 Mana and +3 HP, loser takes 2 shots",
    manaCost: 4.0,
    rarity: CardRarity.EPIC,
    type: 'challenge',
    effect: {
      type: 'challenge',
      value: 0.0,
      challengeEffects: {
        winner: { type: 'heal', value: 3.0 },
        loser: { type: 'damage', value: 0.0 }
      }
    },
    isChallenge: true,
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.EPIC]
  },
  {
    id: 'engineering-charades',
    name: 'Engineering Charades!!!',
    description: "Act out engineering concepts! The person who guesses first gets +5 Mana, others take a shot",
    manaCost: 3.0,
    rarity: CardRarity.EPIC,
    type: 'challenge',
    effect: {
      type: 'challenge',
      value: 0.0,
      challengeEffects: {
        winner: { type: 'heal', value: 5.0 },
        loser: { type: 'damage', value: 0.0 }
      }
    },
    isChallenge: true,
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.EPIC]
  },
  {
    id: 'simulation-battle',
    name: 'SPICE Simulation Battle',
    description: "Your opponent will be chosen randomly. Winner gets to see opponent's hand, loser takes a shot",
    manaCost: 3.0,
    rarity: CardRarity.EPIC,
    type: 'challenge',
    effect: {
      type: 'challenge',
      value: 0.0,
      challengeEffects: {
        winner: { type: 'damage', value: 0 },
        loser: { type: 'damage', value: 0 }
      }
    },
    isChallenge: false,
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.EPIC]
  },
  {
    id: 'electromagnetic-warfare',
    name: 'EMP - Electromagnetic Pulse',
    description: "Nuclear-level EMP! Wipes ALL mana from EVERY player (including you) and deals +3 damage to all",
    manaCost: 8.0,
    rarity: CardRarity.EPIC,
    type: 'utility',
    effect: { type: 'electromagnetic_pulse', value: 3.0 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.EPIC]
  }
]; 