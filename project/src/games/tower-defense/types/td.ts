export type TDCardType = 'troop' | 'building' | 'spell';

export interface TDCard {
  id: string;
  name: string;
  description: string;
  elixir: number;
  type: TDCardType;
  icon?: string;
}

export interface TDPlayer {
  id: string;
  name: string;
  ready: boolean;
  deck: TDCard[];
  joined?: boolean;
}

export type TDMatchStatus = 'lobby' | 'countdown' | 'playing' | 'finished';

export interface TDMatch {
  id: string;
  code: string;
  status: TDMatchStatus;
  hostId: string;
  players: TDPlayer[];
  createdAt: any;
  startTime?: any;
  winnerId?: string | null;
}

export type TDEventType = 'ready' | 'deck_update' | 'start' | 'place_card' | 'surrender';

export interface TDEvent {
  id?: string;
  matchId: string;
  type: TDEventType;
  playerId: string;
  createdAt: any;
  payload?: Record<string, unknown>;
}

export interface TDUnit {
  id: string;
  ownerId: string;
  cardId: string;
  x: number; // 0..1
  y: number; // 0..1
  hp: number;
  side: 'top' | 'bottom';
}

export interface TDTower {
  id: string;
  side: 'top' | 'bottom';
  kind: 'princess' | 'king';
  x: number;
  y: number;
  hp: number;
}


