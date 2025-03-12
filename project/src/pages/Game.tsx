import { useState, useEffect, useRef } from 'react';
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
import { doc, runTransaction, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
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
  const lastDecayTimeRef = useRef<number>(Date.now());

  useGameState(partyId);

  // Real-time mana intake decay
  useEffect(() => {
    if (!party || party.status !== 'playing') return;

    console.debug("Setting up mana intake decay system");
    
    // Initialize the last decay time reference if not set
    if (!lastDecayTimeRef.current) {
      lastDecayTimeRef.current = Date.now();
    }

    // Reference to track if we have an update in progress
    let isUpdating = false;
    let consecutiveErrors = 0;
    let interval = 1000; // Update every second to make decay smoother
    let lastSuccessfulUpdate = Date.now();
    
    const decayInterval = setInterval(async () => {
      try {
        // Skip if another update is in progress
        if (isUpdating) return;
        
        const now = Date.now();
        const elapsedSeconds = (now - lastDecayTimeRef.current) / 1000;
        
        // Always update at least every 2 seconds for visual feedback
        // This ensures players see their mana intake decreasing
        if (elapsedSeconds < 1) return;
        
        // If the last successful update was too long ago, reset the reference time
        // to avoid large jumps in decay amounts
        if (now - lastSuccessfulUpdate > 5000) { // More than 5 seconds
          console.debug("Large gap in updates detected, resetting decay time reference");
          lastDecayTimeRef.current = now - 2000; // Assume only 2 seconds passed
        } else {
          lastDecayTimeRef.current = now;
        }
        
        isUpdating = true;
        console.debug(`Processing decay update after ${elapsedSeconds} seconds`);

        const partyRef = doc(db, 'parties', partyId);
        
        // First verify if the party document exists and is still in 'playing' state
        try {
          const partySnapshot = await getDoc(partyRef);
          if (!partySnapshot.exists() || partySnapshot.data()?.status !== 'playing') {
            console.log('Party no longer in playing state, skipping decay update');
            isUpdating = false;
            return;
          }
        } catch (checkError) {
          console.error('Error checking party state:', checkError);
          isUpdating = false;
          return;
        }

        // Use a simpler update approach for mana decay to avoid transaction errors
        // For minor updates like decay, we can use a regular update instead of a transaction
        try {
          // Fetch current party data
          const partySnapshot = await getDoc(partyRef);
          if (!partySnapshot.exists()) {
            isUpdating = false;
            return;
          }
          
          const partyData = partySnapshot.data();
          if (!partyData || partyData.status !== 'playing') {
            isUpdating = false;
            return;
          }

          // Check if players array exists and has items
          if (!Array.isArray(partyData.players) || partyData.players.length === 0) {
            console.warn('Invalid players data, skipping decay update');
            isUpdating = false;
            return;
          }

          const decayRate = partyData.settings?.manaIntakeDecayRate ?? GAME_CONFIG.MANA_INTAKE_DECAY_RATE;
          const drunkThreshold = partyData.settings?.drunkThreshold ?? GAME_CONFIG.DRUNK_THRESHOLD;
          
          // Calculate decay amount based on time passed
          const elapsedSecondsForDecay = Math.min(10, elapsedSeconds); // Cap to prevent large jumps
          const decayAmount = (decayRate / 60) * elapsedSecondsForDecay; // Per second decay rate
          
          console.debug(`Decay calculation: ${decayRate}/min * ${elapsedSecondsForDecay}s = ${decayAmount}`);
          
          // Force at least a minimum decay amount for visual feedback
          const minDecayAmount = 0.05;
          const effectiveDecayAmount = Math.max(minDecayAmount, decayAmount);
          
          let updatedPlayers = partyData.players.map(player => {
            if (!player || typeof player !== 'object') {
              return {
                id: '',
                name: 'Unknown',
                mana: 0,
                maxMana: GAME_CONFIG.MAX_MANA,
                manaIntake: 0,
                isDrunk: false,
                cards: [],
                isLeader: false,
                effects: []
              };
            }
            
            // Safely access manaIntake with fallback
            const currentManaIntake = typeof player.manaIntake === 'number' ? player.manaIntake : 0;
            
            // Skip decay for players with zero intake
            if (currentManaIntake <= 0) {
              return player;
            }
            
            // Apply decay
            const newManaIntake = Math.max(0, currentManaIntake - effectiveDecayAmount);
            const isDrunk = newManaIntake >= drunkThreshold * 0.8;
            
            // Debug this player's decay
            if (currentManaIntake > 0) {
              console.debug(`Player ${player.name}: ${currentManaIntake} -> ${newManaIntake} (decay: ${effectiveDecayAmount})`);
            }
            
            return {
              ...player,
              manaIntake: parseFloat(newManaIntake.toFixed(2)), // Keep 2 decimal places
              isDrunk
            };
          });
          
          // Ensure all required fields are present in the players array
          updatedPlayers = updatedPlayers.map(player => ({
            id: player.id || '',
            name: player.name || '',
            mana: typeof player.mana === 'number' ? player.mana : 0,
            maxMana: typeof player.maxMana === 'number' ? player.maxMana : GAME_CONFIG.MAX_MANA,
            manaIntake: typeof player.manaIntake === 'number' ? player.manaIntake : 0,
            isDrunk: !!player.isDrunk,
            cards: Array.isArray(player.cards) ? player.cards : [],
            isLeader: !!player.isLeader,
            effects: Array.isArray(player.effects) ? player.effects : []
          }));
          
          // Any player with intake > 0 should be updated, regardless of the amount of change
          // This ensures the decay is visually apparent to users
          let shouldUpdate = updatedPlayers.some(p => p.manaIntake > 0);
          
          if (shouldUpdate) {
            console.debug("Updating party with new player mana intake values");
            
            // Create an update object that preserves ALL existing fields
            // We only explicitly update the players array and lastUpdate fields
            const updateData: Record<string, any> = {
              players: updatedPlayers,
              lastUpdate: serverTimestamp() // Add server timestamp to force UI refresh
            };
            
            // IMPORTANT: Log settings before update to ensure they're preserved
            console.debug('Current party settings before update:', partyData.settings);
            
            // Use a direct update instead of transaction for non-critical decay updates
            // This is more stable and less likely to cause conflicts
            await updateDoc(partyRef, updateData);
          }
          
          // Update successful
          lastSuccessfulUpdate = Date.now();
          consecutiveErrors = 0;
          
          // If we've increased the interval due to errors, gradually reduce it back
          if (interval > 1000) {
            interval = Math.max(1000, interval * 0.8);
            clearInterval(decayInterval);
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            resetInterval();
          }
        } catch (error) {
          console.error('Error updating mana intake decay (regular update):', error);
          handleDecayError(error);
        }
      } catch (error) {
        console.error('Top level error in mana decay interval:', error);
        handleDecayError(error);
      } finally {
        isUpdating = false;
      }
    }, interval);

    // Error handler function with retry logic
    const handleDecayError = (error) => {
      consecutiveErrors++;
      
      // Check if it's a precondition error (transaction failure)
      const isPreconditionError = 
        error.message && 
        (error.message.includes('FAILED_PRECONDITION') || 
         error.message.includes('expired') ||
         error.message.includes('does not exist'));
      
      if (isPreconditionError) {
        console.warn('Firebase transaction error detected. This is expected occasionally and will be handled.');
      }
      
      if (consecutiveErrors > 2) {
        // Exponential backoff - increase interval to reduce server load
        interval = Math.min(15000, interval * 1.5);
        clearInterval(decayInterval);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        resetInterval();
        console.log(`Backing off mana decay updates, new interval: ${interval}ms`);
      }
    };

    // Function to reset the interval with the new timing
    const resetInterval = () => {
      return setInterval(async () => {
        try {
          // Skip if another update is in progress
          if (isUpdating) return;
          
          const now = Date.now();
          const elapsedSeconds = (now - lastDecayTimeRef.current) / 1000;
          
          // More time needed when players are drunk
          const hasDrunkPlayers = party?.players?.some(p => p.isDrunk) || false;
          const minTimeRequired = hasDrunkPlayers ? 2 : 1;
          
          if (elapsedSeconds < minTimeRequired) return;
          
          if (now - lastSuccessfulUpdate > 10000) {
            lastDecayTimeRef.current = now - 2000;
          } else {
            lastDecayTimeRef.current = now;
          }
          
          isUpdating = true;

          // Using the same non-transactional approach for consistency
          try {
            const partyRef = doc(db, 'parties', partyId);
            const partySnapshot = await getDoc(partyRef);
            
            if (!partySnapshot.exists()) {
              isUpdating = false;
              return;
            }
            
            const partyData = partySnapshot.data();
            if (!partyData || partyData.status !== 'playing') {
              isUpdating = false;
              return;
            }

            if (!Array.isArray(partyData.players) || partyData.players.length === 0) {
              console.warn('Invalid players data, skipping decay update');
              isUpdating = false;
              return;
            }

            const decayRate = partyData.settings?.manaIntakeDecayRate ?? GAME_CONFIG.MANA_INTAKE_DECAY_RATE;
            const drunkThreshold = partyData.settings?.drunkThreshold ?? GAME_CONFIG.DRUNK_THRESHOLD;
            
            const elapsedSecondsForDecay = Math.min(10, elapsedSeconds);
            const decayAmount = (decayRate / 60) * elapsedSecondsForDecay;
            
            let updatedPlayers = partyData.players.map(player => {
              if (!player || typeof player !== 'object') {
                return {
                  id: '',
                  name: 'Unknown',
                  mana: 0,
                  maxMana: GAME_CONFIG.MAX_MANA,
                  manaIntake: 0,
                  isDrunk: false,
                  cards: [],
                  isLeader: false,
                  effects: []
                };
              }
              
              const currentManaIntake = typeof player.manaIntake === 'number' ? player.manaIntake : 0;
              
              // Skip decay for players with zero intake
              if (currentManaIntake <= 0) {
                return player;
              }
              
              const newManaIntake = Math.max(0, currentManaIntake - decayAmount);
              const isDrunk = newManaIntake >= drunkThreshold * 0.8;
              
              return {
                ...player,
                manaIntake: parseFloat(newManaIntake.toFixed(2)),
                isDrunk
              };
            });
            
            updatedPlayers = updatedPlayers.map(player => ({
              id: player.id || '',
              name: player.name || '',
              mana: typeof player.mana === 'number' ? player.mana : 0,
              maxMana: typeof player.maxMana === 'number' ? player.maxMana : GAME_CONFIG.MAX_MANA,
              manaIntake: typeof player.manaIntake === 'number' ? player.manaIntake : 0,
              isDrunk: !!player.isDrunk,
              cards: Array.isArray(player.cards) ? player.cards : [],
              isLeader: !!player.isLeader,
              effects: Array.isArray(player.effects) ? player.effects : []
            }));
            
            let shouldUpdate = updatedPlayers.some(p => p.manaIntake > 0);
            
            if (shouldUpdate) {
              // Create an update object that only changes specific fields
              const updateData: Record<string, any> = {
                players: updatedPlayers,
                lastUpdate: serverTimestamp()
              };
              
              // Log settings to make sure they're preserved
              console.debug('Current party settings in resetInterval before update:', partyData.settings);
              
              await updateDoc(partyRef, updateData);
            }
            
            lastSuccessfulUpdate = Date.now();
            consecutiveErrors = 0;
          } catch (error) {
            console.error('Error in resetInterval update:', error);
            handleDecayError(error);
          }
        } catch (error) {
          console.error('Top level error in resetInterval:', error);
          handleDecayError(error);
        } finally {
          isUpdating = false;
        }
      }, interval);
    };

    return () => clearInterval(decayInterval);
  }, [partyId, party?.status, party?.players]);


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
