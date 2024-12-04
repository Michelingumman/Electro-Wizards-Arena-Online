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

export const useGameStore = create<GameState>((set) => ({
  party: null,
  currentPlayer: null,
  loading: true,
  error: null,
  setParty: (party) => set({ party }),
  setCurrentPlayer: (player) => set({ currentPlayer: player }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () => set({ 
    party: null, 
    currentPlayer: null, 
    loading: true, 
    error: null 
  })
}));