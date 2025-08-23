import { create } from 'zustand';
import { TDMatch } from '../types/td';

interface TDState {
  match: TDMatch | null;
  loading: boolean;
  error: string | null;
  setMatch: (match: TDMatch | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  match: null,
  loading: false,
  error: null,
};

export const useTDStore = create<TDState>((set) => ({
  ...initialState,
  setMatch: (match) => set({ match }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));


