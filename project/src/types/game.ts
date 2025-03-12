import { CardBase, CardRarity, CardStats, PlayerHand } from './cards';

export interface Player {
  id: string;
  name: string;
  mana: number;
  manaIntake: number; // Tracks how much mana the player has consumed recently
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
  isDrunk?: boolean; // Indicates if the player is "drunk" based on mana intake
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
  playerId: string; // ID of the player performing the action
  targetId?: string; // Optional target player ID
  cardId: string; // ID of the card used
  cardName: string; // Name of the card
  cardType: string; // Type of the card effect (e.g., manaDrain, etc.)
  cardRarity: string; // Rarity of the card (e.g., legendary, rare)
  cardDescription: string; // Description of the card
}


export interface GameSettings {
  maxMana: number;
  manaDrinkAmount: number;
  initialMana: number;
  drunkThreshold: number; // The threshold at which a player becomes "drunk"
  manaIntakeDecayRate: number; // How fast the mana intake counter decreases per turn
}


export { CardRarity, type CardStats, type PlayerHand };