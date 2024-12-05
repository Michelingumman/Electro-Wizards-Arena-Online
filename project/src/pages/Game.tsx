import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { Card } from '../types/game';
import { PlayerStats } from '../components/game/PlayerStats';
import { CardList } from '../components/game/CardList';
import { GameHeader } from '../components/game/GameHeader';
import { GameControls } from '../components/game/GameControls';
import { GameStatus } from '../components/game/GameStatus';
import { ActionLog } from '../components/game/ActionLog';
import { ChallengeModal } from '../components/game/ChallengeModal';
import { useGameActions } from '../hooks/useGameActions';
import { useGameState } from '../hooks/useGameState';
import { usePartyActions } from '../hooks/usePartyActions';

export function Game() {
  const { partyId = '' } = useParams<{ partyId: string }>();
  const navigate = useNavigate();
  const { party, currentPlayer, loading, error } = useGameStore();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const { applyCardEffect, drinkMana, resolveChallengeCard } = useGameActions(partyId);
  const { leaveParty, startGame, updateGameSettings } = usePartyActions();
  
  useGameState(partyId);

  const isCurrentTurn = Boolean(party?.currentTurn === currentPlayer?.id);
  const isLeader = Boolean(currentPlayer?.isLeader);
  const canStart = Boolean(
    party?.status === 'waiting' && 
    isLeader && 
    (party?.players.length ?? 0) >= 2
  );

  const handlePlayCard = async (card: Card) => {
    if (!currentPlayer || !isCurrentTurn || currentPlayer.health <= 0) {
      return;
    }

    if (card.isChallenge) {
      setSelectedCard(card);
      console.log("YOU SEEE MEEE, TARGET IS REQUIRED");
    } else if (card.requiresTarget) {
      console.log("YOU SEEE MEEE, TARGET IS REQUIRED");
      setSelectedCard(card);
    } else {
      try {
        console.log('Playing non-targeted card:', card);
        await applyCardEffect(currentPlayer.id, currentPlayer.id, card);
        setSelectedCard(null);
      } catch (error) {
        console.error('Error playing card:', error);
      }
    }
  };

  const handleTargetSelect = async (targetId: string) => {
    if (!currentPlayer || !selectedCard || !isCurrentTurn || currentPlayer.health <= 0) {
      return;
    }

    try {
      console.log('Applying card effect to target:', targetId);
      await applyCardEffect(currentPlayer.id, targetId, selectedCard);
      setSelectedCard(null);
    } catch (error) {
      console.error('Error applying card effect:', error);
    }
  };


  const handleChallengeResolve = async (winnerId: string, loserId: string) => {
    if (!currentPlayer || !selectedCard || !isCurrentTurn) {
      return;
    }

    try {
      console.log('Resolving challenge card:', { winnerId, loserId });
      await resolveChallengeCard(currentPlayer.id, selectedCard, winnerId, loserId);
      setSelectedCard(null);
    } catch (error) {
      console.error('Error resolving challenge:', error);
    }
  };

  const handleDrink = async () => {
    if (!currentPlayer || currentPlayer.health <= 0) return;
    try {
      console.log('Drinking mana potion');
      await drinkMana(currentPlayer.id);
    } catch (error) {
      console.error('Error drinking mana:', error);
    }
  };

  const handleStartGame = async () => {
    if (!canStart) return;
    try {
      await startGame(partyId);
    } catch (error) {
      console.error('Error starting game:', error);
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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-purple-900 overflow-auto">
      <div className="max-w-6xl mx-auto p-4">
        <GameHeader
          party={party}
          isLeader={isLeader}
          canStart={canStart}
          onStartGame={handleStartGame}
          onLeaveParty={handleLeaveParty}
          onUpdateSettings={updateGameSettings}
        />

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Opponents and Action Log */}
          <div className="lg:col-span-4 space-y-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-purple-200 uppercase tracking-wider">Opponents</h3>
              <div className="space-y-2">
                {party.players.filter(p => p.id !== currentPlayer.id).map((player) => (
                  <PlayerStats
                    key={player.id}
                    player={player}
                    isCurrentPlayer={false}
                    isCurrentTurn={player.id === party.currentTurn}
                    isTargetable={Boolean(
                      selectedCard?.requiresTarget && 
                      player.health > 0 && 
                      (selectedCard.effect.type === 'heal' ? true : player.id !== currentPlayer.id)
                    )}
                    onSelect={selectedCard && !selectedCard.isChallenge ? () => handleTargetSelect(player.id) : undefined}
                  />
                ))}
              </div>
            </div>

            {party.lastAction && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-purple-200 uppercase tracking-wider">Last Action</h3>
                <ActionLog
                  lastAction={party.lastAction}
                  players={party.players}
                  usedCard={selectedCard}
                />
              </div>
            )}
          </div>

          {/* Right Column - Game Content */}
          <div className="lg:col-span-8 space-y-6">
            {/* Current Player */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-purple-200 uppercase tracking-wider">You</h3>
              <PlayerStats
                player={currentPlayer}
                isCurrentPlayer={true}
                isCurrentTurn={currentPlayer.id === party.currentTurn}
                isTargetable={Boolean(
                  selectedCard?.requiresTarget && 
                  currentPlayer.health > 0 && 
                  selectedCard.effect.type === 'heal'
                )}
                onSelect={selectedCard && !selectedCard.isChallenge ? () => handleTargetSelect(currentPlayer.id) : undefined}
              />
            </div>

            <GameStatus
              status={party.status}
              winner={party.winner}
              players={party.players}
              isLeader={isLeader}
            />

            {party.status === 'playing' && currentPlayer.health > 0 && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-purple-100">Your Cards</h3>
                  <CardList
                    cards={currentPlayer.cards}
                    onPlayCard={handlePlayCard}
                    onDoubleClickCard={handlePlayCard}
                    disabled={!isCurrentTurn}
                    currentMana={currentPlayer.mana}
                    selectedCard={selectedCard}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {party.status === 'playing' && currentPlayer.health > 0 && (
          <GameControls
            gameStatus={party.status}
            manaDrinkAmount={party.settings?.manaDrinkAmount ?? 3}
            onDrink={handleDrink}
          />
        )}

        {selectedCard?.isChallenge && (
          <ChallengeModal
            card={selectedCard}
            players={party.players}
            currentPlayerId={currentPlayer.id}
            onConfirm={handleChallengeResolve}
            onCancel={() => setSelectedCard(null)}
          />
        )}
      </div>
    </div>
  );
}