export interface Player {
  id: string;
  name: string;
  health: number;
  mana: number;
  cards: Card[];
}

export interface Card {
  id: string;
  name: string;
  manaCost: number;
  effect: CardEffect;
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
}