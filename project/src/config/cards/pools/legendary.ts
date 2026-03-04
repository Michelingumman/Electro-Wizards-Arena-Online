import { CardBase, CardRarity } from '../../../types/cards';
import { GAME_CONFIG } from '../../gameConfig';
import { RARITY_COLORS } from '../rarities';

export const LEGENDARY_CARDS: CardBase[] = [
  // {
  //   id: 'infinite-void',
  //   name: "Gojo's: Infinite Void",
  //   description: "For the next turn, all opponents' mana costs are doubled, and their card effects are reduced by half.",
  //   manaCost: 5.0,
  //   rarity: CardRarity.LEGENDARY,
  //   type: 'legendary',
  //   effect: { type: 'infiniteVoid', value: 1.0 },
  //   requiresTarget: false,
  //   color: RARITY_COLORS[CardRarity.LEGENDARY],
  //   isLegendary: true,
  //   flavorText: 'Throughout Heaven and Earth, I alone am the honored one.'
  // },
  // {
  //   id: 'titan-form',
  //   name: "Eren Jaeger's: Titan",
  //   description: 'Transform into a Titan for 3 turns. Gain +10 HP, deal +3 damage with all cards, and become immune to single-target effects.',
  //   manaCost: 6.0,
  //   rarity: CardRarity.LEGENDARY,
  //   type: 'legendary',
  //   effect: { type: 'titan', value: 3.0 },
  //   requiresTarget: false,
  //   color: RARITY_COLORS[CardRarity.LEGENDARY],
  //   isLegendary: true,
  //   flavorText: "If you win, you live. If you lose, you die. If you don't fight, you can't win!"
  // },
  {
    id: 'eyy-jag-kommer-lacka-ur-assa',
    name: 'Liftkoen Kokar',
    description: 'Dubbla din mana men faa +10 drunkness',
    manaCost: 10,
    rarity: CardRarity.LEGENDARY,
    type: 'normal',
    effect: {
      type: 'manaDouble',
      value: 10
    },
    requiresTarget: false,
    color: 'rose'
  },
  {
    id: 'agh-det-hander-ju-inte',
    name: 'Det Haender Igen!',
    description: 'Alla andra spelare faar +6 drunkness',
    manaCost: 8,
    rarity: CardRarity.LEGENDARY,
    type: 'aoe',
    effect: {
      type: 'manaIntakeOthers',
      value: 6
    },
    requiresTarget: false,
    color: 'orange'
  },
  {
    id: 'guld',
    name: 'Alla Till Baren',
    description: 'Saett allas drunkness till graensen foer drunk-state',
    manaCost: 13,
    rarity: CardRarity.LEGENDARY,
    type: 'aoe',
    effect: {
      type: 'setAllToDrunk',
      value: 0
    },
    requiresTarget: false,
    color: 'yellow'
  },
  {
    id: 'shot-master',
    name: 'Afterski-Maestaren',
    description: 'Utmaning: vinnaren blir helt nykter, foerloraren faardubblar sin drunkness',
    manaCost: 8,
    rarity: CardRarity.LEGENDARY,
    type: 'challenge',
    effect: {
      type: 'challenge',
      value: 0,
      winnerEffect: {
        type: 'resetManaIntake',
        value: 0
      },
      loserEffect: {
        type: 'manaIntakeMultiply',
        value: 2
      }
    },
    requiresTarget: true,
    color: 'emerald',
    isChallenge: true,
  },
  {
    id: 'bar-tycoon',
    name: 'Fjaellstuge-Magnat',
    description: 'Faa +7 mana med hoegre tillfaelligt manatak',
    manaCost: 12,
    rarity: CardRarity.LEGENDARY,
    type: 'normal',
    effect: {
      type: 'maxManaAndMana',
      value: 7
    },
    requiresTarget: false,
    color: 'indigo'
  },
  {
    id: 'mana-master',
    name: 'Pistkontrollanten',
    description: 'Stjael 2 mana fraan varje motstaandare',
    manaCost: 9,
    rarity: CardRarity.LEGENDARY,
    type: 'aoe',
    effect: {
      type: 'manaStealAll',
      value: 2
    },
    requiresTarget: false,
    color: 'violet'
  },
  {
    id: 'divine-intervention',
    name: 'Skidgudens Timeout',
    description: 'Nollstaell allas drunkness och ge +4 mana till alla',
    manaCost: 12,
    rarity: CardRarity.LEGENDARY,
    type: 'aoe',
    effect: {
      type: 'divineIntervention',
      value: 4
    },
    requiresTarget: false,
    color: 'blue'
  },
  {
    id: 'fellan',
    name: "AH ELLER HUR",
    description: 'Saett tiden i en chug-duell. Klarar inte baada motstaandare tiden +1 sekund straffas de haardt.',
    manaCost: 10.0,
    rarity: CardRarity.LEGENDARY,
    type: 'challenge',
    effect: {
      type: 'fellan',
      value: 0.0,
      challengeEffects: {
        winner: { type: 'fellan_won', value: GAME_CONFIG.MAX_HEALTH },
        loser: { type: 'fellan_lost', value: 0.0 }
      }
    },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.LEGENDARY],
    isChallenge: true,
    isLegendary: true,
    flavorText: ""
  },
  {
    id: 'markus',
    name: "Markus Fuskfil",
    description: 'Dra 3 legendariska kort men betala dyrt i kontroll',
    manaCost: 10.0,
    rarity: CardRarity.LEGENDARY,
    type: 'legendary',
    effect: { type: 'markus', value: 0.0 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.LEGENDARY],
    isChallenge: false,
    isLegendary: true,
    flavorText: "--- Markus: Va fan göru mannen... "
  },
  // // {
  // //   id: 'sam',
  // //   name: "SORRY I'M LATE",
  // //   description: 'Leave the group temporarily. Opponents cant target you for 2 turns.',
  // //   manaCost: 5.0,
  // //   rarity: CardRarity.LEGENDARY,
  // //   type: 'legendary',
  // //   effect: { type: 'sam', value: 3.0 },
  // //   requiresTarget: false,
  // //   color: RARITY_COLORS[CardRarity.LEGENDARY],
  // //   isChallenge: false,
  // //   isLegendary: true,
  // //   flavorText: "--- Sam: Kan inte komma"
  // // },
  {
    id: 'adam',
    name: "Lagkaptenens Ultimatum",
    description: 'Rensa legendariska kort hos motstaandare och straffa deras mana',
    manaCost: 10.0,
    rarity: CardRarity.LEGENDARY,
    type: 'legendary',
    effect: { type: 'adam', value: 3.0 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.LEGENDARY],
    isChallenge: false,
    isLegendary: true,
    flavorText: ""
  },
  {
    id: 'ultimate-binge',
    name: 'Hela Stugan Skalar',
    description: 'Alla utom du faar +4 mana och +4 drunkness',
    manaCost: 6.0,
    rarity: CardRarity.LEGENDARY,
    type: 'aoe-damage',
    effect: { type: 'aoeManaBurst', value: 4.0 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.LEGENDARY]
  },
  {
    id: 'legendary-challenge',
    name: 'Legendarisk Stugduell',
    description: 'Utmaning: vinnaren blir nykter, foerloraren dubblar sin drunkness',
    manaCost: 5.0,
    rarity: CardRarity.LEGENDARY,
    type: 'challenge',
    effect: {
      type: 'challenge',
      value: 0.0,
      challenge: {
        type: 'legendary-challenge',
        winnerEffect: { type: 'resetIntake', value: 0.0 },
        loserEffect: { type: 'manaIntakeMultiplier', value: 2.0 }
      }
    },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.LEGENDARY],
    isChallenge: true,
  },
  {
    id: 'gold-card',
    name: 'Gyllene Lever',
    description: 'Faa +8 mana och minska din drunkness kraftigt',
    manaCost: 8.0,
    rarity: CardRarity.LEGENDARY,
    type: 'utility',
    effect: { type: 'goldenLiver', value: 8.0 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.LEGENDARY]
  },
  {
    id: 'mana-hurricane',
    name: 'Snostormskaos',
    description: 'Blanda om allas mana och drunkness slumpmaessigt',
    manaCost: 7.0,
    rarity: CardRarity.LEGENDARY,
    type: 'utility',
    effect: { type: 'manaHurricane', value: 0.0 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.LEGENDARY]
  },
  {
    id: 'party-master',
    name: 'Afterski-Chef',
    description: 'Ta kontroll och styr en spelares stats med precision',
    manaCost: 10.0,
    rarity: CardRarity.LEGENDARY,
    type: 'utility',
    effect: { type: 'partyMaster', value: 0.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.LEGENDARY]
  },
  {
    id: 'divine-sobriety',
    name: 'Nykter Reset',
    description: 'Bli direkt nykter och faa +4 mana',
    manaCost: 4.0,
    rarity: CardRarity.LEGENDARY,
    type: 'utility',
    effect: { type: 'divineSobriety', value: 4.0 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.LEGENDARY]
  }
  // ,
  // {
  //   id: 'said',
  //   name: "BORGMÄSTAREN",
  //   description: 'set all opponents helath and mana to 1',
  //   manaCost: 5.0,
  //   rarity: CardRarity.LEGENDARY,
  //   type: 'legendary',
  //   effect: { type: 'said', value: 3.0 },
  //   requiresTarget: false,
  //   color: RARITY_COLORS[CardRarity.LEGENDARY],
  //   isChallenge: false,
  //   isLegendary: true,
  //   flavorText: ""
  // }
];
