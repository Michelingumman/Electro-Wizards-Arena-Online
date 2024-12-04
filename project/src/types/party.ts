import { Player } from './game';

export interface Party {
  id: string;
  code: string;
  hostId: string;
  players: Player[];
  status: 'waiting' | 'playing' | 'finished';
  currentPlayerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PartyJoinRequest {
  code: string;
  playerName: string;
  profilePicture?: File;
}