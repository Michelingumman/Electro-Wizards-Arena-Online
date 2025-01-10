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
    id: 'oskar',
    name: "EYY JAG KOMMER LACKA UR ASSÅ",
    description: 'Deal +4 Damage to all players and half all their Mana',
    manaCost: 5.0,
    rarity: CardRarity.LEGENDARY,
    type: 'legendary',
    effect: { type: 'oskar', value: 4.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.LEGENDARY],
    isChallenge: false,
    isLegendary: true,
    flavorText: "--- Oskar: OH JÄVLAR! **stumbles**"
  },
  {
    id: 'jesper',
    name: "AGH DET HÄNDER JU INTE!",
    description: '70% chance to fully restore stats and make all enemies take a shot. Lose, and you take one shot per player.',
    manaCost: 5.0,
    rarity: CardRarity.LEGENDARY,
    type: 'legendary',
    effect: { type: 'jesper', value: 10.0 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.LEGENDARY],
    isChallenge: false,
    isLegendary: true,
    flavorText: "--- Jesper: ahh tjena"
  },
  {
    id: 'fellan',
    name: "AH ELLER HUR",
    description: 'You set the pace for how quickly to chug a beer. If 2 enemies fail to beat your time + 1 second, all enemies lose all mana. If you win: get full health',
    manaCost: 5.0,
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
    description: 'Cheat and Draw 2 Legendary Cards, but it will cost you half of your life',
    manaCost: 5.0,
    rarity: CardRarity.LEGENDARY,
    type: 'legendary',
    effect: { type: 'markus', value: 3.0 },
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
    manaCost: 5.0,
    rarity: CardRarity.LEGENDARY,
    type: 'legendary',
    effect: { type: 'adam', value: 3.0 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.LEGENDARY],
    isChallenge: false,
    isLegendary: true,
    flavorText: ""
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