export enum CardRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

export type EffectType = 
  | 'damage' 
  | 'heal' 
  | 'manaDrain' 
  | 'forceDrink' 
  | 'life-steal' 
  | 'manaBurn' 
  | 'potionBuff' 
  | 'manaRefill'
  | 'aoeDamage'
  | 'roulette'
  | 'reversed-curse-tech'
  | 'poison'
  | 'energi_i_rummet'
  // Legendary
  | 'oskar' 
  | 'jesper' 
  | 'fellan' 
  | 'fellan_won'  //used for the challenge logic in challengeEffects 
  | 'fellan_lost' //      ----- | | ----- 
  | 'markus' 
  | 'sam' 
  | 'adam'
  | 'said'
  // 
  | 'challenge'  
  | 'buff'   // From PotionEffect
  | 'debuff' // From PotionEffect
  | 'multiply'  // From EnhancementEffect
  | 'add';      // From EnhancementEffect

export interface CardEffect {
  type: EffectType;
  value: number;
  challengeEffects?: {
    winner: {
      type: EffectType;
      value: number;
    };
    loser: {
      type: EffectType;
      value: number;
    };
  };
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
  color: string;
  isChallenge?: boolean;
  isLegendary?: boolean;
  flavorText?: string;
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