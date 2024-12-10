import { useState, useEffect } from 'react';
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








  
  useEffect(() => {
    console.log('Game state updated:', { party, currentPlayer, loading, error });
  }, [party, currentPlayer, loading, error]);








  const handlePlayCard = async (card: Card) => {
    console.log('handlePlayCard invoked:', { card, currentPlayer, isCurrentTurn });
    if (!currentPlayer || !isCurrentTurn || currentPlayer.health <= 0) {
      console.warn('Cannot play card: Invalid conditions.');
      return;
    }

    if (card.isChallenge || card.requiresTarget) {
      setSelectedCard(card);
      console.log('Card selected for targeting or challenge:', card);
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
    console.log('handleTargetSelect invoked:', { targetId, selectedCard });
    if (!currentPlayer || !selectedCard || !isCurrentTurn || currentPlayer.health <= 0) {
      console.warn('Cannot select target: Invalid conditions.');
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
    console.log('handleChallengeResolve invoked:', { winnerId, loserId, selectedCard });
    if (!currentPlayer || !selectedCard || !isCurrentTurn) {
      console.warn('Cannot resolve challenge: Invalid conditions.');
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
    console.log('handleDrink invoked for player:', currentPlayer?.id);
    if (!currentPlayer || currentPlayer.health <= 0) {
      console.warn('Cannot drink: Invalid conditions.');
      return;
    }

    try {
      console.log('Drinking mana potion for player:', currentPlayer.id);
      await drinkMana(currentPlayer.id);
    } catch (error) {
      console.error('Error drinking mana:', error);
    }
  };

  const handleStartGame = async () => {
    console.log('handleStartGame invoked:', { canStart });
    if (!canStart) {
      console.warn('Cannot start game: Invalid conditions.');
      return;
    }

    try {
      console.log('Starting game...');
      await startGame(partyId);
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  const handleLeaveParty = async () => {
    console.log('handleLeaveParty invoked:', { party, currentPlayer });
    if (!party || !currentPlayer) {
      console.warn('Cannot leave party: Invalid conditions.');
      return;
    }

    try {
      console.log('Leaving party...');
      await leaveParty(party.id, currentPlayer.id);
      navigate('/');
    } catch (error) {
      console.error('Error leaving party:', error);
    }
  };

  if (loading) {
    console.log('Loading game...');
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
    console.error('Game error or missing data:', { error, party, currentPlayer });
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

  console.log('Rendering game interface:', { party, currentPlayer });

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
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-sm font-medium text-purple-200 uppercase tracking-wider">Opponents</h3>
            {party.players.filter(p => p.id !== currentPlayer.id).map((player) => (
              <PlayerStats
                key={player.id}
                player={player}
                isCurrentPlayer={false}
                isCurrentTurn={player.id === party.currentTurn}
                isTargetable={Boolean(
                  selectedCard?.requiresTarget &&
                  player.health > 0 &&
                  (selectedCard.effect.type === 'heal' || player.id !== currentPlayer.id)
                )}
                onSelect={selectedCard && !selectedCard.isChallenge ? () => handleTargetSelect(player.id) : undefined}
              />
            ))}

            {party.lastAction && (
              <ActionLog lastAction={party.lastAction} players={party.players} usedCard={selectedCard} />
            )}
          </div>

          <div className="lg:col-span-8 space-y-6">
            <PlayerStats
              player={currentPlayer}
              isCurrentPlayer={true}
              isCurrentTurn={currentPlayer.id === party.currentTurn}
              isTargetable={false}
              onSelect={undefined}
            />
            <GameStatus
              status={party.status}
              winner={party.winner}
              players={party.players}
              isLeader={isLeader}
            />

            {party.status === 'playing' && currentPlayer.health > 0 && (
              <CardList
                cards={currentPlayer.cards}
                onPlayCard={handlePlayCard}
                onDoubleClickCard={handlePlayCard}
                disabled={!isCurrentTurn}
                currentMana={currentPlayer.mana}
                selectedCard={selectedCard}
              />
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
