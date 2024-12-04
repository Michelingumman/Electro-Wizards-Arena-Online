import { GAME_CONFIG } from '../constants/gameConfig';

export const generatePartyCode = (): string => {
  return Math.floor(Math.random() * (10 ** GAME_CONFIG.PARTY_CODE_LENGTH)).toString().padStart(GAME_CONFIG.PARTY_CODE_LENGTH, '0');
};

export const isPartyFull = (playerCount: number): boolean => {
  return playerCount >= GAME_CONFIG.MAX_PLAYERS;
};

export const canJoinParty = (playerCount: number): boolean => {
  return playerCount < GAME_CONFIG.MAX_PLAYERS;
};