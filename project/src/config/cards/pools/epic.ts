import { CardBase, CardRarity } from '../../../types/cards';
import { RARITY_COLORS } from '../rarities';

export const EPIC_CARDS: CardBase[] = [
  {
    id: 'ol-havf',
    name: 'Öl Hävf',
    description: 'Challenge another player to a chugging contest. Winner gains 5 mana, loser gains 10 mana intake',
    manaCost: 4,
    rarity: CardRarity.EPIC,
    type: 'challenge',
    effect: {
      type: 'challenge',
      value: 0,
      winnerEffect: {
        type: 'mana',
        value: 5
      },
      loserEffect: {
        type: 'manaIntake',
        value: 10
      }
    },
    requiresTarget: true,
    color: 'amber'
  },
  {
    id: 'got-big-muscles',
    name: 'Got Big Muscles?',
    description: 'Challenge another player to an arm wrestle. Winner gains 3 mana, loser loses 4 mana',
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
        value: -4
      }
    },
    requiresTarget: true,
    color: 'rose'
  },
  {
    id: 'name-the-most-car-brands',
    name: 'Name the most: CAR BRANDS',
    description: 'Challenge another player. Winner steals 5 mana from loser',
    manaCost: 6,
    rarity: CardRarity.EPIC,
    type: 'challenge',
    effect: {
      type: 'challenge',
      value: 0,
      winnerEffect: {
        type: 'manaStealer',
        value: 5
      }
    },
    requiresTarget: true,
    color: 'cyan'
  },
  {
    id: 'name-the-most-pokemon',
    name: 'Name the most: POKÉMON',
    description: 'Challenge another player. Winner steals 6 mana from loser',
    manaCost: 6,
    rarity: CardRarity.EPIC,
    type: 'challenge',
    effect: {
      type: 'challenge',
      value: 0,
      winnerEffect: {
        type: 'manaStealer',
        value: 6
      }
    },
    requiresTarget: true,
    color: 'yellow'
  },
  {
    id: 'name-the-most-countries',
    name: 'Name the most: COUNTRIES',
    description: 'Challenge another player. Winner steals 5 mana from loser',
    manaCost: 6,
    rarity: CardRarity.EPIC,
    type: 'challenge',
    effect: {
      type: 'challenge',
      value: 0,
      winnerEffect: {
        type: 'manaStealer',
        value: 5
      }
    },
    requiresTarget: true,
    color: 'blue'
  },
  {
    id: 'mana-explosion',
    name: 'Mana Explosion',
    description: 'All players drink! Everyone gains 5 mana intake',
    manaCost: 7,
    rarity: CardRarity.EPIC,
    type: 'aoe',
    effect: {
      type: 'manaIntake',
      value: 5
    },
    requiresTarget: false,
    color: 'orange'
  },
  {
    id: 'party-round',
    name: 'Party Round',
    description: 'Buy a round for everyone! All players gain 3 mana',
    manaCost: 8,
    rarity: CardRarity.EPIC,
    type: 'aoe',
    effect: {
      type: 'mana',
      value: 3
    },
    requiresTarget: false,
    color: 'green'
  },
  {
    id: 'breath-test',
    name: 'Breath Test',
    description: 'Force the drunkest player (highest mana intake) to lose 7 mana',
    manaCost: 5,
    rarity: CardRarity.EPIC,
    type: 'aoe',
    effect: {
      type: 'drunkestPlayerDamage',
      value: -7
    },
    requiresTarget: false,
    color: 'red'
  },
  {
    id: 'mana-roulette',
    name: 'Mana Roulette',
    description: 'Randomly select a player (including yourself) to gain 8 mana intake',
    manaCost: 4,
    rarity: CardRarity.EPIC,
    type: 'aoe',
    effect: {
      type: 'roulette',
      value: 8
    },
    requiresTarget: false,
    color: 'purple'
  },
  {
    id: 'potentiation',
    name: 'Potentiation',
    description: 'Double your current mana intake (more effective when already drunk)',
    manaCost: 3,
    rarity: CardRarity.EPIC,
    type: 'normal',
    effect: {
      type: 'manaIntakeMultiply',
      value: 2
    },
    requiresTarget: false,
    color: 'indigo'
  }
];