import { GAME_CONFIG } from '../config/gameConfig';

export const generatePartyCode = (): string => {

  return Math.floor(Math.random() * (10 ** GAME_CONFIG.PARTY_CODE_LENGTH)).toString().padStart(GAME_CONFIG.PARTY_CODE_LENGTH, '0');
};
