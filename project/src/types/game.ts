export interface Player {
  id: string;
  name: string;
  avatar: string;
  health: number;
  mana: number;
  hand: Card[];
}

export interface Card {
  id: string;
  name: string;
  manaCost: number;
  description: string;
  effect: CardEffect;
  imageUrl: string;
}

export interface CardEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff';
  value: number;
  target: 'opponent' | 'self' | 'all';
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  gameStatus: 'setup' | 'playing' | 'finished';
  winner?: Player;
}