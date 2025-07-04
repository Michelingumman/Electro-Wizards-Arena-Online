import { CardBase, CardRarity, CardStats, PlayerHand } from './cards';
import { FieldValue } from 'firebase/firestore';

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
  connectionStatus?: 'connected' | 'disconnected';
  lastSeen?: number; // timestamp of last activity
  disconnectedAt?: number; // timestamp when disconnected
}

export interface PlayerEffect {
  stackId: string; // Unique identifier for stacking effects
  type: 'buff' | 'debuff' | 'untargetable'; // Add 'untargetable' as a valid effect type
  value: number; // Optional, not used for untargetable
  duration: number; // Number of turns the effect lasts
}


export type Card = CardBase;

export interface Party {
  id: string;
  code: string;
  name: string;
  players: Player[];
  currentTurn: string;
  status: 'waiting' | 'playing' | 'finished';
  leaderId: string;
  createdAt: Date | FieldValue;
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
  playerId: string; // ID of the player performing the action
  targetId?: string; // Optional target player ID
  cardId: string; // ID of the card used
  cardName: string; // Name of the card
  cardType: string; // Type of the card effect (e.g., damage, heal, etc.)
  cardRarity: string; // Rarity of the card (e.g., legendary, rare)
  cardDescription: string; // Description of the card
}


export interface GameSettings {
  maxHealth: number;
  maxMana: number;
  manaDrinkAmount: number;
  initialHealth: number;
  initialMana: number;
}


export { CardRarity, type CardStats, type PlayerHand };