export enum CardRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

export type EffectType =
  'damage' |
  'aoe-damage' |
  'aoeDamage' | // Compatibility
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
  'energi_i_rummet' |
  'oskar' |
  'jesper' |
  'markus' |
  'sam' |
  'adam' |
  'said' |
  'fellan' |
  'infiniteVoid' |
  'titan' |
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
  'drunkTimer' |
  'drunkTimerShift' |
  'drunkestTimer' |
  'leastDrunkForceDrink' |
  'manaTransfer' |
  'manaStealer' |
  'maxMana' |
  'mana' |
  // Can Cup effect types
  'canCupSip' |
  'canCupAoESip' |
  'canCupWater' |
  'canCupDeflect' |
  'canCupBathroomBreak' |
  'canCupTopUp' |
  'canCupDoubleTrouble' |
  'canCupBottenUpp' |
  'canCupSwap' |
  'canCupReflect' |
  'canCupVampire' |
  'canCupRemoveDefense' |
  'canCupGiveEmptyCan' |
  'canCupTaxSober' |
  'canCupHolyAlliance' |
  'canCupRelaySip' |
  'canCupRockBottom' |
  'canCupRussianRoulette' |
  'canCupLegendaryHeist' |
  'canCupPenaltyDrink' |
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
  challengeEffects?: any; // Changed to any to fix lint
}

export interface CardBase {
  id: string;
  name: string;
  description: string;
  manaCost: number;
  sipCost?: number;
  rarity: CardRarity;
  type: string;
  effect: CardEffect;
  requiresTarget: boolean;
  isChallenge?: boolean;
  color?: string;
  isLegendary?: boolean;
  flavorText?: string;
  challengeParticipantMode?: 'manual' | 'owner-target';
  challengeOutcomeRule?: 'standard' | 'owner-safe';
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
