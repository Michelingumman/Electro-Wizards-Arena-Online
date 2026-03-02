import { CardBase } from './cards';

export interface Player {
  id: string;
  name: string;
  mana: number;
  manaIntake: number;
  cards: Card[];
  isLeader?: boolean;
  effects?: PlayerEffect[];
  potionMultiplier?: {
    value: number;
    turnsLeft: number;
  };
  titanForm?: {
    turnsLeft: number;
    bonusDamage: number;
  };
  infiniteVoid?: {
    turnsLeft: number;
  };
  isDrunk?: boolean;
}

export interface PlayerEffect {
  stackId: string;
  type: 'buff' | 'debuff' | 'untargetable';
  value: number;
  duration: number;
}

export type Card = CardBase;

export interface Party {
  id: string;
  code: string;
  players: Player[];
  currentTurn: string;
  status: 'waiting' | 'playing' | 'finished';
  leaderId: string;
  gameMode?: 'classic' | 'modern';
  winner?: string | null;
  settings?: GameSettings;
  lastAction?: GameAction;
  previousState?: {
    players: Player[];
    currentTurn: string;
    timestamp: number;
  };
}

export interface GameAction {
  playerId: string;
  targetId?: string;
  cardId: string;
  cardName: string;
  cardType: string;
  cardRarity: string;
  cardDescription: string;
}

export interface GameSettings {
  maxMana: number;
  manaDrinkAmount: number;
  initialMana: number;
  drunkThreshold: number;
  manaIntakeDecayRate: number;
}
