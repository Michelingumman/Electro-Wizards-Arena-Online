import { create } from 'zustand';
import { Party, Player } from '../types/game';

interface GameState {
  party: Party | null;
  currentPlayer: Player | null;
  setParty: (party: Party | null) => void;
  setCurrentPlayer: (player: Player | null) => void;
}

export const useGameStore = create<GameState>((set) => ({
  party: null,
  currentPlayer: null,
  setParty: (party) => set({ party }),
  setCurrentPlayer: (player) => set({ currentPlayer }),
}));