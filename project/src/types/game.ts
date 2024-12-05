export interface Player {
  id: string;
  name: string;
  health: number;
  mana: number;
  cards: Card[];
  isLeader?: boolean;
  effects?: PlayerEffect[];
  potionMultiplier?: {
    value: number;
    turnsLeft: number;
  };
  maxHealth?: number;
  maxMana?: number;
}

export interface PlayerEffect {
  type: string;
  value: number;
  duration: number;
}

export interface Card {
  id: string;
  name: string;
  manaCost: number;
  type: 'damage' | 'heal' | 'utility' | 'curse' | 'buff' | 'challenge';
  effect: CardEffect;
  requiresTarget: boolean;
  description: string;
  color: string;
  isChallenge?: boolean;
}

export interface CardEffect {
  type: 'damage' | 'heal' | 'manaDrain' | 'forceDrink' | 'manaBurn' | 'potionBuff' | 'challenge' | 'manaRefill';
  value: number;
}

export interface Party {
  id: string;
  code: string;
  players: Player[];
  currentTurn: string;
  status: 'waiting' | 'playing' | 'finished';
  leaderId: string;
  winner?: string | null;
  settings?: GameSettings;
  lastAction?: GameAction;
}

export interface GameAction {
  type: string;
  playerId: string;
  targetId?: string;
  value: number;
  timestamp: number;
  cardId?: string;
}

export interface GameSettings {
  maxHealth: number;
  maxMana: number;
  manaDrinkAmount: number;
  initialHealth: number;
  initialMana: number;
  partyId?: string;
  playerId?: string;
}