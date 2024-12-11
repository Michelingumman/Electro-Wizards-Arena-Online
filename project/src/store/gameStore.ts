import { create } from 'zustand';
import {GameAction, Party, Player } from '../types/game';

interface GameState {
  currentPlayer: Player | null;
  loading: boolean;
  error: string | null;
  lastAction: GameAction | null; // Ensure the type is GameAction
  updateLastAction: (action: GameAction) => void; // Add a method to update it
  party: Party | null;
  setParty: (party: Party | null) => void;
  setCurrentPlayer: (player: Player | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  party: null,
  currentPlayer: null,
  loading: true,
  error: null
};

export const useGameStore = create<GameState>((set) => ({
  ...initialState,
  lastAction: null,
  updateLastAction: (action) =>
    set((state) => ({
      ...state,
      lastAction: action, // Update the lastAction field
    })),
  setParty: (party) => set({ party }),
  setCurrentPlayer: (player) => set({ currentPlayer: player }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState)
}));

