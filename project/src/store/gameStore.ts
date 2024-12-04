import { create } from 'zustand';
import { Party, Player } from '../types/game';

interface GameState {
  party: Party | null;
  currentPlayer: Player | null;
  loading: boolean;
  error: string | null;
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
  setParty: (party) => set({ party }),
  setCurrentPlayer: (player) => set({ currentPlayer: player }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState)
}));