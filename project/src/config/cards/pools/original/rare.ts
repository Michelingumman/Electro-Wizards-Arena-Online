import { CardBase, CardRarity } from '../../../../types/cards';
import { RARITY_COLORS } from '../../rarities';

export const ORIGINAL_RARE_CARDS: CardBase[] = [
  {
    id: 'healing-potion',
    name: 'Healing Potion',
    description: 'Quick magical remedy restores +1 HP',
    manaCost: 1.0,
    rarity: CardRarity.RARE,
    type: 'heal',
    effect: { type: 'heal', value: 1.0 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.RARE]
  },
  {
    id: 'greater-heal',
    name: 'Greater Heal',
    description: 'Powerful healing magic restores +4 HP',
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
    description: 'Siphon magical energy - steal +4 Mana from target',
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
    description: 'Dark magic - switch HP with opponent using soul transfer',
    manaCost: 4.0,
    rarity: CardRarity.RARE,
    type: 'utility',
    effect: { type: 'life-steal', value: 0.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.RARE]
  },
  {
    id: 'charm-spell',
    name: 'Charm Spell',
    description: 'Enchant target to take 1 drink',
    manaCost: 1.0,
    rarity: CardRarity.RARE,
    type: 'utility',
    effect: { type: 'forceDrink', value: 0.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.RARE]
  },
  {
    id: 'vampiric-touch',
    name: 'Vampiric Touch',
    description: 'Drain life force to heal for half target\'s health',
    manaCost: 3.0,
    rarity: CardRarity.RARE,
    type: 'utility',
    effect: { type: 'reversed-curse-tech', value: 2.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.RARE]
  },
  {
    id: 'mana-crystal',
    name: 'Mana Crystal',
    description: 'Store magical energy for future use - gain +3 Mana next turn',
    manaCost: 2.0,
    rarity: CardRarity.RARE,
    type: 'utility',
    effect: { type: 'manaRefillNextTurn', value: 3.0 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.RARE]
  },
  {
    id: 'mana-burn',
    name: 'Mana Burn',
    description: 'Destroy magical energy - deals +2 damage and drains +2 Mana',
    manaCost: 3.0,
    rarity: CardRarity.RARE,
    type: 'utility',
    effect: { type: 'manaDrain', value: 2.0 },
    requiresTarget: true,
    color: RARITY_COLORS[CardRarity.RARE]
  },
  {
    id: 'magic-barrier',
    name: 'Magic Barrier',
    description: 'Protective ward makes you immune to next attack (1 turn)',
    manaCost: 3.0,
    rarity: CardRarity.RARE,
    type: 'utility',
    effect: { type: 'transformer_isolation', value: 1.0 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.RARE]
  },
  {
    id: 'amplify-magic',
    name: 'Amplify Magic',
    description: 'Enhance next card effect by 150%',
    manaCost: 2.0,
    rarity: CardRarity.RARE,
    type: 'utility',
    effect: { type: 'signal_amplify', value: 1.5 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.RARE]
  },
  {
    id: 'spell-resistance',
    name: 'Spell Resistance',
    description: 'Reduce all incoming magical damage by 50% for 2 turns',
    manaCost: 4.0,
    rarity: CardRarity.RARE,
    type: 'utility',
    effect: { type: 'noise_filter', value: 0.5 },
    requiresTarget: false,
    color: RARITY_COLORS[CardRarity.RARE]
  }
]; 