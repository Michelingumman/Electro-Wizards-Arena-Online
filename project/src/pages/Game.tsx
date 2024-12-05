import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { Card } from '../types/game';
import { GameLayout } from '../components/game/GameLayout';
import { GameHeader } from '../components/game/GameHeader';
import { GameControls } from '../components/game/GameControls';
import { GameStatus } from '../components/game/GameStatus';
import { ActionLog } from '../components/game/ActionLog';
import { ChallengeModal } from '../components/game/ChallengeModal';
import { TurnIndicator } from '../components/game/TurnIndicator';
import { PlayerList } from '../components/game/PlayerList';
import { CurrentPlayerSection } from '../components/game/CurrentPlayerSection';
import { CardsSection } from '../components/game/CardsSection';
import { LoadingScreen } from '../components/game/LoadingScreen';
import { ErrorScreen } from '../components/game/ErrorScreen';
import { useGameActions } from '../hooks/useGameActions';
import { useGameState } from '../hooks/useGameState';
import { usePartyActions } from '../hooks/usePartyActions';
import { useCardTargeting } from '../hooks/useCardTargeting';

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

  const activePlayer = party?.players.find(p => p.id === party.currentTurn);

  const handlePlayCard = async (card: Card) => {
    if (!currentPlayer || !isCurrentTurn || currentPlayer.health <= 0) return;

    if (card.isChallenge) {
      setSelectedCard(card);
    } else if (card.requiresTarget) {
      setSelectedCard(card);
    } else {
      try {
        await applyCardEffect(currentPlayer.id, currentPlayer.id, card);
        setSelectedCard(null);
      } catch (error) {
        console.error('Error playing card:', error);
      }
    }
  };

  const handleTargetSelect = async (targetId: string) => {
    if (!currentPlayer || !selectedCard || !isCurrentTurn || currentPlayer.health <= 0) return;

    try {
      await applyCardEffect(currentPlayer.id, targetId, selectedCard);
      setSelectedCard(null);
    } catch (error) {
      console.error('Error applying card effect:', error);
    }
  };

  const handleChallengeResolve = async (winnerId: string, loserId: string) => {
    if (!currentPlayer || !selectedCard || !isCurrentTurn) return;

    try {
      await resolveChallengeCard(currentPlayer.id, selectedCard, winnerId, loserId);
      setSelectedCard(null);
    } catch (error) {
      console.error('Error resolving challenge:', error);
    }
  };

  const handleDrink = async () => {
    if (!currentPlayer || currentPlayer.health <= 0) return;
    try {
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
    return <LoadingScreen />;
  }

  if (error || !party || !currentPlayer || !activePlayer) {
    return <ErrorScreen error={error} onReturnHome={() => navigate('/')} />;
  }

  return (
    <>
      <TurnIndicator
        currentPlayer={currentPlayer}
        activePlayer={activePlayer}
      />

      <GameLayout
        header={
          <GameHeader
            party={party}
            isLeader={isLeader}
            canStart={canStart}
            onStartGame={handleStartGame}
            onLeaveParty={handleLeaveParty}
            onUpdateSettings={updateGameSettings}
          />
        }
        opponents={
          <PlayerList
            players={party.players}
            currentPlayerId={currentPlayer.id}
            currentTurn={party.currentTurn}
            onSelectTarget={handleTargetSelect}
            isTargetable={(playerId) => Boolean(
              selectedCard?.requiresTarget &&
              !selectedCard.isChallenge &&
              party.players.find(p => p.id === playerId)?.health > 0
            )}
          />
        }
        actionLog={
          party.lastAction && (
            <ActionLog
              lastAction={party.lastAction}
              players={party.players}
              usedCard={selectedCard}
            />
          )
        }
        currentPlayer={
          <CurrentPlayerSection
            player={currentPlayer}
            isCurrentTurn={isCurrentTurn}
            isTargetable={Boolean(
              selectedCard?.requiresTarget &&
              selectedCard.effect.type === 'heal'
            )}
            onSelect={() => handleTargetSelect(currentPlayer.id)}
          />
        }
        cards={
          party.status === 'playing' && currentPlayer.health > 0 && (
            <CardsSection
              cards={currentPlayer.cards}
              onPlayCard={handlePlayCard}
              onDoubleClickCard={handlePlayCard}
              disabled={!isCurrentTurn}
              currentMana={currentPlayer.mana}
              selectedCard={selectedCard}
            />
          )
        }
        controls={
          party.status === 'playing' && currentPlayer.health > 0 && (
            <GameControls
              gameStatus={party.status}
              manaDrinkAmount={party.settings?.manaDrinkAmount ?? 3}
              onDrink={handleDrink}
              disabled={currentPlayer.health <= 0}
            />
          )
        }
      />

      {selectedCard?.isChallenge && (
        <ChallengeModal
          card={selectedCard}
          players={party.players}
          currentPlayerId={currentPlayer.id}
          onConfirm={handleChallengeResolve}
          onCancel={() => setSelectedCard(null)}
        />
      )}
    </>
  );
}