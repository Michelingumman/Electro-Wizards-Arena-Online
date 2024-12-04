import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { Card, GameSettings as GameSettingsType } from '../types/game';
import { PlayerStats } from '../components/game/PlayerStats';
import { CardList } from '../components/game/CardList';
import { GameHeader } from '../components/game/GameHeader';
import { GameControls } from '../components/game/GameControls';
import { GameStatus } from '../components/game/GameStatus';
import { useGameActions } from '../hooks/useGameActions';
import { useGameState } from '../hooks/useGameState';
import { usePartyActions } from '../hooks/usePartyActions';

export function Game() {
  const { partyId = '' } = useParams<{ partyId: string }>();
  const navigate = useNavigate();
  const { party, currentPlayer, loading, error } = useGameStore();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const { applyCardEffect, drinkMana, endTurn } = useGameActions(partyId);
  const { leaveParty, startGame, updateGameSettings } = usePartyActions();
  
  useGameState(partyId);

  const isCurrentTurn = Boolean(party?.currentTurn === currentPlayer?.id);
  const isLeader = Boolean(currentPlayer?.isLeader);
  const canStart = Boolean(
    party?.status === 'waiting' && 
    isLeader && 
    (party?.players.length ?? 0) >= 2
  );
  const canDrink = Boolean(currentPlayer?.health && currentPlayer.health > 0);

  const handlePlayCard = async (card: Card) => {
    if (!party || !currentPlayer || !isCurrentTurn || currentPlayer.health <= 0) return;
    
    if (!card.requiresTarget) {
      try {
        await applyCardEffect(party, currentPlayer.id, currentPlayer.id, card);
        setSelectedCard(null);
      } catch (error) {
        console.error('Error playing card:', error);
      }
    } else {
      setSelectedCard(card);
    }
  };

  const handlePlayerClick = async (targetId: string) => {
    if (!party || !currentPlayer || !selectedCard || !isCurrentTurn || currentPlayer.health <= 0) return;
    
    try {
      await applyCardEffect(party, currentPlayer.id, targetId, selectedCard);
      setSelectedCard(null);
    } catch (error) {
      console.error('Error applying card effect:', error);
    }
  };

  const handleDrink = async () => {
    if (!party || !currentPlayer || !canDrink) return;
    try {
      await drinkMana(party, currentPlayer.id);
    } catch (error) {
      console.error('Error drinking mana:', error);
    }
  };

  const handleEndTurn = async () => {
    if (!party || !currentPlayer || !isCurrentTurn || currentPlayer.health <= 0) return;
    try {
      await endTurn(party, currentPlayer.id);
      setSelectedCard(null);
    } catch (error) {
      console.error('Error ending turn:', error);
    }
  };

  const handleLeaveParty = async () => {
    if (!party || !currentPlayer) return;
    try {
      await leaveParty(party.id, currentPlayer.id);
      navigate('/');
    } catch (error) {
      console.error('Error leaving party:', error);
    }
  };

  const handleStartGame = async () => {
    if (!party || !canStart) return;
    try {
      await startGame(party.id);
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  const handleUpdateSettings = async (settings: GameSettingsType) => {
    if (!party || !currentPlayer) return;
    try {
      await updateGameSettings(party.id, currentPlayer.id, settings);
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-purple-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-xl text-purple-100">Loading game...</p>
        </div>
      </div>
    );
  }

  if (error || !party || !currentPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-purple-900">
        <div className="text-center">
          <p className="text-xl text-red-400 mb-4">{error || 'Game not found'}</p>
          <button onClick={() => navigate('/')} className="text-purple-400 hover:text-purple-300">
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-gray-900 to-purple-900">
      <div className="max-w-4xl mx-auto space-y-6">
        <GameHeader
          party={party}
          isLeader={isLeader}
          canStart={canStart}
          onStartGame={handleStartGame}
          onLeaveParty={handleLeaveParty}
          onUpdateSettings={handleUpdateSettings}
        />

        <GameControls
          isCurrentTurn={isCurrentTurn}
          gameStatus={party.status}
          manaDrinkAmount={party.settings?.manaDrinkAmount ?? 3}
          onDrink={handleDrink}
          onEndTurn={handleEndTurn}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {party.players.map((player) => (
            <PlayerStats
              key={player.id}
              player={player}
              isCurrentPlayer={player.id === currentPlayer.id}
              isCurrentTurn={player.id === party.currentTurn}
              isTargetable={
                Boolean(
                  selectedCard?.requiresTarget &&
                  player.id !== currentPlayer.id &&
                  player.health > 0 &&
                  isCurrentTurn
                )
              }
              onSelect={() => handlePlayerClick(player.id)}
            />
          ))}
        </div>

        <GameStatus
          status={party.status}
          winner={party.winner}
          players={party.players}
          isLeader={isLeader}
        />

        {party.status === 'playing' && currentPlayer.health > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-purple-100">Your Cards</h3>
            <CardList
              cards={currentPlayer.cards}
              onPlayCard={handlePlayCard}
              disabled={!isCurrentTurn}
              currentMana={currentPlayer.mana}
              selectedCard={selectedCard}
            />
          </div>
        )}
      </div>
    </div>
  );
}