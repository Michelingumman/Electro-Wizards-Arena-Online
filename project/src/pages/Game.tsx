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
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { GAME_CONFIG } from '../config/gameConfig';
import clsx from 'clsx';

export function Game() {
  const { partyId = '' } = useParams<{ partyId: string }>();
  const navigate = useNavigate();
  const { party, currentPlayer, loading, error } = useGameStore();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const { applyCardEffect, drinkMana, resolveChallengeCard } = useGameActions(partyId);
  const { leaveParty, startGame, updateGameSettings } = usePartyActions();

  useGameState(partyId);

  // Mana intake decay — syncs to Firestore every 30s (visual countdown is client-side in PlayerStats)
  useEffect(() => {
    if (!party || party.status !== 'playing') return;

    const SYNC_INTERVAL_MS = 30_000; // Write to Firestore every 30 seconds
    let isUpdating = false;

    const decayInterval = setInterval(async () => {
      if (isUpdating) return;
      isUpdating = true;

      try {
        const partyRef = doc(db, 'parties', partyId);
        const partySnapshot = await getDoc(partyRef);

        if (!partySnapshot.exists()) { isUpdating = false; return; }
        const partyData = partySnapshot.data();
        if (!partyData || partyData.status !== 'playing') { isUpdating = false; return; }
        if (!Array.isArray(partyData.players) || partyData.players.length === 0) { isUpdating = false; return; }

        const decayRate = partyData.settings?.manaIntakeDecayRate ?? GAME_CONFIG.MANA_INTAKE_DECAY_RATE;
        const drunkThreshold = partyData.settings?.drunkThreshold ?? GAME_CONFIG.DRUNK_THRESHOLD;
        const decayAmount = (decayRate / 60) * (SYNC_INTERVAL_MS / 1000); // decay for the full interval

        // Only bother updating if someone has intake > 0
        const hasIntake = partyData.players.some(p => (p.manaIntake ?? 0) > 0);
        if (!hasIntake) { isUpdating = false; return; }

        const updatedPlayers = partyData.players.map(player => {
          if (!player || typeof player !== 'object') return player;
          const currentIntake = typeof player.manaIntake === 'number' ? player.manaIntake : 0;
          if (currentIntake <= 0) return player;

          const newIntake = Math.max(0, currentIntake - decayAmount);
          return {
            ...player,
            manaIntake: parseFloat(newIntake.toFixed(2)),
            isDrunk: newIntake >= drunkThreshold * 0.8,
          };
        });

        await updateDoc(partyRef, {
          players: updatedPlayers,
          lastUpdate: serverTimestamp(),
        });
      } catch (error) {
        console.error('Error in mana decay sync:', error);
      } finally {
        isUpdating = false;
      }
    }, SYNC_INTERVAL_MS);

    return () => clearInterval(decayInterval);
  }, [partyId, party?.status]);


  const validPlayers = [
    'adam',
    'madde',
    'markus',
    'oskar',
    'jesper',
    'said',
    'BORGMÄSTAREN',
    'babis',
    'admin',
    'charlie',
    'pim',
    'siadman',
    'linus',
    'limpan',
    'siadman',
    'master',
    'master1',
    'master2',
    'master3',
    'slave',
    'slave1',
    'slave2',
    'slave3',
    'SB',
    'limpan_döda_mig_inte',
    'ollanbollan',
    'ollan',
    'The_Boss',
    'The_Frowning_Friends',
    'The_Smiling_Friends',
    'papis',
    'SB',
    'left',
    'pc',
    'inco',
    'right',
    'phone',
    'SB',
    'SB',
    'SB',
    'SB',
    'SB',
    'fellan',
    'felix'
  ];

  const isCurrentTurn = Boolean(party?.currentTurn === currentPlayer?.id);
  const isLeader = Boolean(currentPlayer?.isLeader);
  const canStart = Boolean(
    party?.status === 'waiting' &&
    isLeader &&
    (party?.players.length ?? 0) >= 2
    && party.players.some((player) => validPlayers.includes(player.name.toLowerCase()))
  );





  useEffect(() => {
    console.log('Game state updated:', { party, currentPlayer, loading, error });
  }, [party, currentPlayer, loading, error]);


  const handlePlayCard = async (card: Card) => {
    console.log('handlePlayCard invoked:', { card, currentPlayer, isCurrentTurn });
    if (!currentPlayer || !isCurrentTurn) {
      console.warn('Cannot play card: Invalid conditions.');
      return;
    }

    // Implement drunk "miss" chance - 20% chance to miss if drunk
    const isDrunk = currentPlayer.isDrunk;
    const isMiss = isDrunk && Math.random() < 0.2;

    if (isMiss) {
      console.log('Drunk player missed their card effect!');
      // Still update the UI like the card was played, but don't actually apply the effect
      // This simulates the drunk player thinking they played the card correctly
      setSelectedCard(null);

      // Wait a brief moment to simulate the card being played
      await new Promise(resolve => setTimeout(resolve, 500));
      return;
    }

    // Identify if it's a challenge card either by isChallenge flag, type, name or effect type
    const isChallenge =
      card.isChallenge ||
      card.type === 'challenge' ||
      card.effect.type === 'challenge' ||
      ['Öl Hävf', 'Got Big Muscles?', 'Shot Contest', 'SHOT MASTER'].includes(card.name) ||
      card.name.includes('Name the most') ||
      card.effect.winnerEffect ||
      card.effect.loserEffect ||
      card.effect.challengeEffects;

    if (isChallenge) {
      // Always set isChallenge property for consistency
      card.isChallenge = true;
      setSelectedCard(card);
      console.log('Challenge card selected:', card);
    } else if (card.requiresTarget) {
      setSelectedCard(card);
      console.log('Card selected for targeting:', card);
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
    if (!currentPlayer || !selectedCard || !isCurrentTurn) {
      console.warn('Cannot select target: Invalid conditions.');
      return;
    }

    // Find the target player
    const targetPlayer = party?.players.find(p => p.id === targetId);
    if (!targetPlayer) {
      console.warn('Target player not found.');
      return;
    }

    // Check for untargetable status
    const isUntargetable = targetPlayer.effects?.some(
      effect => effect.stackId === 'untargetable' && effect.type === 'untargetable'
    );

    if (isUntargetable) {
      console.warn('Target is untargetable.');
      return;
    }

    // Implement drunk "miss" chance - 20% chance to miss if drunk
    const isDrunk = currentPlayer.isDrunk;
    const isMiss = isDrunk && Math.random() < 0.2;

    if (isMiss) {
      console.log('Drunk player missed their targeted card effect!');
      // Still update the UI like the card was played, but don't actually apply the effect
      setSelectedCard(null);

      // Wait a brief moment to simulate the card being played
      await new Promise(resolve => setTimeout(resolve, 500));
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

    // Implement drunk "miss" chance - 20% chance to miss if drunk
    const isDrunk = currentPlayer.isDrunk;
    const isMiss = isDrunk && Math.random() < 0.2;

    if (isMiss) {
      console.log('Drunk player messed up the challenge resolution!');
      // For challenges, a "miss" means we reverse the winner and loser
      // This simulates the drunk player getting confused about who won
      const originalWinnerId = winnerId;
      winnerId = loserId;
      loserId = originalWinnerId;
      console.log('Drunk player switched winner and loser:', { newWinner: winnerId, newLoser: loserId });
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
    if (!currentPlayer) {
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
      await leaveParty(party.id, currentPlayer.id, true);
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

  // Determine if the current player is drunk for visual effects
  const isPlayerDrunk = currentPlayer?.isDrunk || false;

  return (
    <div className={clsx(
      "min-h-screen bg-gradient-to-b from-gray-900 to-purple-900 overflow-auto relative",
      isPlayerDrunk && "drunk-player-view" // Apply drunk-specific styling
    )}>
      {/* Global blur overlay when player is drunk */}
      {isPlayerDrunk && (
        <div className="absolute inset-0 backdrop-blur-sm pointer-events-none z-10 bg-amber-900/10" />
      )}

      <div className="max-w-6xl mx-auto p-4 relative z-20">
        <GameHeader
          party={party}
          isLeader={isLeader}
          canStart={canStart}
          onStartGame={handleStartGame}
          onLeaveParty={handleLeaveParty}
          onUpdateSettings={(settings) => updateGameSettings(settings, partyId)}
        />

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-4">
            <div className="text-center mb-3">
              <h3 className="text-sm font-medium text-purple-200 uppercase tracking-wider bg-gray-800/30 py-1 rounded-lg">Opponents</h3>
            </div>
            {/* Display opponents in a 2-column grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-800/20 p-3 rounded-lg">
              {party.players.filter(p => p.id !== currentPlayer.id).map((player) => (
                <PlayerStats
                  key={player.id}
                  player={player}
                  isCurrentPlayer={false}
                  isCurrentTurn={player.id === party.currentTurn}
                  isTargetable={Boolean(
                    selectedCard?.requiresTarget &&
                    (selectedCard.effect.type === 'manaRefill' || player.id !== currentPlayer.id)
                  )}
                  onSelect={selectedCard && !selectedCard.isChallenge ? () => handleTargetSelect(player.id) : undefined}
                />
              ))}
            </div>

            {party.lastAction && (
              <ActionLog lastAction={party.lastAction} players={party.players} />
            )}
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="text-center mb-3">
              <h3 className="text-sm font-medium text-purple-200 uppercase tracking-wider bg-purple-900/30 py-1 rounded-lg">You</h3>
            </div>
            <div className="bg-purple-900/20 p-3 rounded-lg">
              <PlayerStats
                player={currentPlayer}
                isCurrentPlayer={true}
                isCurrentTurn={currentPlayer.id === party.currentTurn}
                isTargetable={false}
                onSelect={undefined}
              />
            </div>
            <GameStatus
              status={party.status}
              winner={party.winner}
              players={party.players}
              isLeader={isLeader}
            />

            {party.status === 'playing' && (
              <CardList
                cards={currentPlayer.cards}
                onPlayCard={handlePlayCard}
                disabled={!isCurrentTurn}
                currentMana={currentPlayer.mana}
                selectedCard={selectedCard}
              />
            )}
          </div>
        </div>

        {party.status === 'playing' && (
          <GameControls
            gameStatus={party.status}
            manaDrinkAmount={party.settings?.manaDrinkAmount ?? GAME_CONFIG.MANA_DRINK_AMOUNT}
            isCurrentTurn={isCurrentTurn}
            onDrink={handleDrink}
          />
        )}

        {selectedCard && (
          selectedCard.isChallenge ||
          selectedCard.type === 'challenge' ||
          selectedCard.effect.type === 'challenge' ||
          ['Öl Hävf', 'Got Big Muscles?', 'Shot Contest', 'SHOT MASTER'].includes(selectedCard.name) ||
          (selectedCard.name && selectedCard.name.includes('Name the most')) ||
          selectedCard.effect.winnerEffect ||
          selectedCard.effect.loserEffect ||
          selectedCard.effect.challengeEffects
        ) && (
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
