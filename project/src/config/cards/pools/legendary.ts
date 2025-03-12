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
    name: 'EYY JAG KOMMER LACKA UR ASSÅ',
    description: 'INCREDIBLE POWER! Double your current mana and gain 15 mana intake',
    manaCost: 10,
    rarity: CardRarity.LEGENDARY,
    type: 'normal',
    effect: {
      type: 'manaDouble',
      value: 0
    },
    requiresTarget: false,
    color: 'rose'
  },
  {
    id: 'agh-det-hander-ju-inte',
    name: 'AGH DET HÄNDER JU INTE!',
    description: 'Force all other players to increase their mana intake by 8',
    manaCost: 8,
    rarity: CardRarity.LEGENDARY,
    type: 'aoe',
    effect: {
      type: 'manaIntakeOthers',
      value: 8
    },
    requiresTarget: false,
    color: 'orange'
  },
  {
    id: 'guld',
    name: 'GULD',
    description: 'Make all players drunk! Set everyone\'s mana intake to the drunk threshold',
    manaCost: 15,
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
    name: 'SHOT MASTER',
    description: 'Challenge target to a drinking contest. Winner\'s mana intake is set to 0, loser\'s is doubled',
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
    color: 'emerald'
  },
  {
    id: 'bar-tycoon',
    name: 'BAR TYCOON',
    description: 'Take control of the bar! Your max mana and current mana are increased by 10',
    manaCost: 12,
    rarity: CardRarity.LEGENDARY,
    type: 'normal',
    effect: {
      type: 'maxManaAndMana',
      value: 10
    },
    requiresTarget: false,
    color: 'indigo'
  },
  {
    id: 'mana-master',
    name: 'MANA MASTER',
    description: 'Steal 3 mana from each opponent and reduce their max mana by 2',
    manaCost: 10,
    rarity: CardRarity.LEGENDARY,
    type: 'aoe',
    effect: {
      type: 'manaStealAll',
      value: 3
    },
    requiresTarget: false,
    color: 'violet'
  },
  {
    id: 'divine-intervention',
    name: 'DIVINE INTERVENTION',
    description: 'Reset everyone\'s mana intake to 0. All players gain 5 mana',
    manaCost: 12,
    rarity: CardRarity.LEGENDARY,
    type: 'aoe',
    effect: {
      type: 'divineIntervention',
      value: 5
    },
    requiresTarget: false,
    color: 'blue'
  },
  {
    id: 'fellan',
    name: "AH ELLER HUR",
    description: 'You set the pace for how quickly to chug a beer. If 2 enemies fail to beat your time + 1 second, all enemies lose all mana. If you win: get full health',
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
    name: "VA FAN GÖRU MANNEN",
    description: 'Cheat, cuz u so fkn good and Draw 3 Legendary Cards, but it will cost you half of your life',
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
    name: "GULD",
    description: 'Remove all legendary cards from enemies hands and deal damage equal to the number of legendary cards in your hand',
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
    name: 'ULTIMATE DRINKING BINGE',
    description: 'Everyone except you drinks DOUBLE. All other players gain +5 Mana and +4 Mana Intake',
    manaCost: 6.0,
    rarity: CardRarity.LEGENDARY,
    type: 'aoe-damage',
    effect: { type: 'aoeManaBurst', value: 5.0 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.LEGENDARY]
  },
  {
    id: 'legendary-challenge',
    name: 'LEGENDARY DRINKING CHALLENGE',
    description: 'Challenge: Winner gets completely sober (mana intake reset to 0), Loser doubles their current mana intake',
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
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.LEGENDARY]
  },
  {
    id: 'gold-card',
    name: 'GOLDEN LIVER',
    description: 'Your liver becomes golden! Gain +10 Mana and your mana intake is reduced by 80% for 3 turns',
    manaCost: 8.0,
    rarity: CardRarity.LEGENDARY,
    type: 'utility',
    effect: { type: 'goldenLiver', value: 10.0 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.LEGENDARY]
  },
  {
    id: 'mana-hurricane',
    name: 'MANA HURRICANE',
    description: 'Chaos ensues! Randomly redistributes all mana and mana intake values between all players',
    manaCost: 7.0,
    rarity: CardRarity.LEGENDARY,
    type: 'utility',
    effect: { type: 'manaHurricane', value: 0.0 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.LEGENDARY]
  },
  {
    id: 'party-master',
    name: 'PARTY MASTER',
    description: 'Take control of the party! Choose any player and set their mana and mana intake to any value',
    manaCost: 10.0,
    rarity: CardRarity.LEGENDARY,
    type: 'utility',
    effect: { type: 'partyMaster', value: 0.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.LEGENDARY]
  },
  {
    id: 'divine-sobriety',
    name: 'DIVINE SOBRIETY',
    description: 'Instantly become sober! Reset your mana intake to 0 and gain +5 Mana',
    manaCost: 4.0,
    rarity: CardRarity.LEGENDARY,
    type: 'utility',
    effect: { type: 'divineSobriety', value: 5.0 },
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