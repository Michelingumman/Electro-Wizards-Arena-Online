import { useState, useCallback } from 'react';
import { Card, Player } from '../types/game';
import { getValidTargets, canPlayCard } from '../utils/targeting';

export function useCardTargeting(currentPlayer: Player, allPlayers: Player[]) {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [validTargets, setValidTargets] = useState<Player[]>([]);

  const selectCard = useCallback((card: Card | null) => {
    if (!card) {
      setSelectedCard(null);
      setValidTargets([]);
      return;
    }

    if (!canPlayCard(card, currentPlayer, allPlayers)) {
      return;
    }

    setSelectedCard(card);
    setValidTargets(getValidTargets(card, currentPlayer, allPlayers));
  }, [currentPlayer, allPlayers]);

  const clearSelection = useCallback(() => {
    setSelectedCard(null);
    setValidTargets([]);
  }, []);

  const isValidTarget = useCallback((player: Player) => {
    return validTargets.some(target => target.id === player.id);
  }, [validTargets]);

  return {
    selectedCard,
    validTargets,
    selectCard,
    clearSelection,
    isValidTarget
  };
}