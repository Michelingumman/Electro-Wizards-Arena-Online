import { useState, useCallback } from 'react';
import { Card } from '../types/game';

interface ChallengeState {
  selectedCard: Card | null;
  isModalOpen: boolean;
}

export function useChallengeState() {
  const [state, setState] = useState<ChallengeState>({
    selectedCard: null,
    isModalOpen: false
  });

  const openChallengeModal = useCallback((card: Card) => {
    setState({
      selectedCard: card,
      isModalOpen: true
    });
  }, []);

  const closeChallengeModal = useCallback(() => {
    setState({
      selectedCard: null,
      isModalOpen: false
    });
  }, []);

  return {
    selectedCard: state.selectedCard,
    isModalOpen: state.isModalOpen,
    openChallengeModal,
    closeChallengeModal
  };
}