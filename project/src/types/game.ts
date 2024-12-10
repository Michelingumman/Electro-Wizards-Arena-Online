import { CardBase, CardRarity, CardStats, PlayerHand } from './cards';

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
  titanForm?: {
    turnsLeft: number;
    bonusHealth: number;
    bonusDamage: number;
  };
  infiniteVoid?: {
    turnsLeft: number;
  };
}

export interface PlayerEffect {
  type: string;
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
  type: string;
  playerId: string;
  targetId?: string;
  value: number;
  timestamp: number;
  cardName: string;
}

export interface GameSettings {
  maxHealth: number;
  maxMana: number;
  manaDrinkAmount: number;
  initialHealth: number;
  initialMana: number;
  partyId: string;
  playerId: string;
}

export { CardRarity, type CardStats, type PlayerHand };