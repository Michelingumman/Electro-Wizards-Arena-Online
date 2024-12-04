import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameSync } from '../hooks/useGameSync';
import { GameScreen } from './GameScreen';
import { useGame } from '../hooks/useGame';

export const GameContainer: React.FC = () => {
  const { partyId } = useParams<{ partyId: string }>();
  const navigate = useNavigate();
  const { gameState, loading, error, updateGameState } = useGameSync(partyId!);
  const { playCard, drinkForMana } = useGame();

  useEffect(() => {
    if (error) {
      console.error('Game error:', error);
      navigate('/');
    }
  }, [error, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading game...</div>
      </div>
    );
  }

  if (!gameState) {
    return null;
  }

  const handlePlayCard = async (cardIndex: number) => {
    try {
      const newState = { ...gameState };
      const currentPlayer = newState.players[newState.currentPlayerIndex];
      const card = currentPlayer.hand[cardIndex];

      if (currentPlayer.mana >= card.manaCost) {
        currentPlayer.mana -= card.manaCost;
        currentPlayer.hand.splice(cardIndex, 1, cards[Math.floor(Math.random() * cards.length)]);
        newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % newState.players.length;
        await updateGameState(newState);
      }
    } catch (err) {
      console.error('Error playing card:', err);
    }
  };

  const handleDrinkMana = async () => {
    try {
      const newState = { ...gameState };
      const currentPlayer = newState.players[newState.currentPlayerIndex];
      currentPlayer.mana = Math.min(currentPlayer.mana + 10, 10);
      newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % newState.players.length;
      await updateGameState(newState);
    } catch (err) {
      console.error('Error drinking mana:', err);
    }
  };

  return (
    <GameScreen
      gameState={gameState}
      onPlayCard={handlePlayCard}
      onDrinkMana={handleDrinkMana}
    />
  );
};