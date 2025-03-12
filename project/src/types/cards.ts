export enum CardRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

export type EffectType = 
  'damage' | 
  'aoe-damage' | 
  'healing' | 
  'aoe-healing' | 
  'life-steal' | 
  'challenge' | 
  'manaDrain' | 
  'manaBurn' | 
  'manaRefill' | 
  'potionBuff' | 
  'debuff' | 
  'roulette' | 
  'forceDrink' | 
  'reversed-curse-tech' | 
  'heal' |
  // New mana/drunk effects
  'manaOverload' |
  'manaShield' |
  'manaStealAny' |
  'manaSwapAny' |
  'soberingPotion' |
  'manaExplosion' |
  'aoeManaBurst' |
  'goldenLiver' |
  'divineSobriety' |
  'manaHurricane' |
  'partyMaster' |
  'manaIntakeMultiplier' |
  'manaIntakeReduction' |
  'resetIntake' |
  'increaseIntake' |
  // New effect types for updated cards
  'manaIntake' |
  'manaDouble' |
  'manaIntakeOthers' |
  'setAllToDrunk' |
  'resetManaIntake' |
  'maxManaAndMana' |
  'manaStealAll' |
  'divineIntervention' |
  'manaIntakeMultiply' |
  'drunkestPlayerDamage' |
  'manaTransfer' |
  'manaStealer' |
  'maxMana' |
  'mana' |
  'null'; // For effects that don't do anything

export interface Challenge {
  type: string;
  winnerEffect: CardEffect;
  loserEffect: CardEffect;
}

export interface CardEffect {
  type: EffectType;
  value: number;
  challenge?: Challenge;
  winnerEffect?: CardEffect;
  loserEffect?: CardEffect;
}

export interface CardBase {
  id: string;
  name: string;
  description: string;
  manaCost: number;
  rarity: CardRarity;
  type: string;
  effect: CardEffect;
  requiresTarget: boolean;
  isChallenge?: boolean;
  color?: string;
  isLegendary?: boolean;
  flavorText?: string;
}

export interface EnhancedCard extends CardBase {
  enhancedManaCost: number;
  enhancedEffect: CardEffect;
}

export interface CardStats {
  common: number;
  rare: number;
  epic: number;
  legendary: number;
  total: number;
}

export interface PlayerHand {
  cards: CardBase[];
  stats: CardStats;
}

export { CardRarity as default };