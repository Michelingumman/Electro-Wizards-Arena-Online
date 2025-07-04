import { CardBase, CardRarity } from '../../../../types/cards';
import { GAME_CONFIG } from '../../../gameConfig';
import { RARITY_COLORS } from '../../rarities';

export const ORIGINAL_LEGENDARY_CARDS: CardBase[] = [
  {
    id: 'oskar',
    name: "EYY JAG KOMMER LACKA UR ASSÅ",
    description: 'Deal +4 Damage to all players and half all their Mana',
    manaCost: 10.0,
    rarity: CardRarity.LEGENDARY,
    type: 'legendary',
    effect: { type: 'oskar', value: 4.0 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.LEGENDARY],
    isChallenge: false,
    isLegendary: true,
    flavorText: "--- Oskar: OH JÄVLAR! **stumbles**"
  },
  {
    id: 'jesper',
    name: "AGH DET HÄNDER JU INTE!",
    description: '80% chance to fully restore stats and deal out 2 shots. Loose and you take 2 shots.',
    manaCost: 10.0,
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
  }
]; 