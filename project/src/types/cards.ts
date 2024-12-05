export enum CardRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

export interface CardEffect {
  type: 'damage' | 'heal' | 'manaDrain' | 'forceDrink' | 'manaBurn' | 'potionBuff' | 'manaRefill' | 'infiniteVoid' | 'titan' | 'challenge';
  value: number;
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