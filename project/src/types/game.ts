export interface Player {
  id: string;
  name: string;
  health: number;
  mana: number;
  cards: Card[];
  isLeader?: boolean;
}

export interface Card {
  id: string;
  name: string;
  manaCost: number;
  effect: CardEffect;
  requiresTarget: boolean;
}

export interface CardEffect {
  type: 'damage' | 'heal';
  value: number;
}

export interface Party {
  id: string;
  code: string;
  players: Player[];
  currentTurn: string; // player id
  status: 'waiting' | 'playing' | 'finished';
  leaderId: string;
  winner?: string;
  settings?: GameSettings;
}

export interface GameSettings {
  maxHealth: number;
  maxMana: number;
  manaDrinkAmount: number;
  initialHealth: number;
  initialMana: number;
}