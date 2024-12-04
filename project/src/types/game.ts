export interface Player {
  id: string;
  name: string;
  health: number;
  mana: number;
  cards: Card[];
  isLeader?: boolean;
  effects?: PlayerEffect[];
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
  type: 'damage' | 'heal' | 'utility' | 'curse' | 'buff';
  effect: CardEffect;
  requiresTarget: boolean;
  description: string;
  color: string;
}

export interface CardEffect {
  type: 'damage' | 'heal' | 'manaDrain' | 'forceDrink' | 'manaBurn';
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