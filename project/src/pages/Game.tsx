import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { Card, PendingCanCupSipResolution } from '../types/game';
import { useGameActions } from '../hooks/useGameActions';
import { useGameState } from '../hooks/useGameState';
import { usePartyActions } from '../hooks/usePartyActions';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { GAME_CONFIG } from '../config/gameConfig';
import clsx from 'clsx';
import { GameClassicUI } from '../components/game/classic/GameClassicUI';
import { GameModernUI } from '../components/game/modern/GameModernUI';
import { isCanCupReactionChallengeCard } from '../utils/canCupChallengeHelpers';

export function Game() {
  const { partyId = '' } = useParams<{ partyId: string }>();
  const navigate = useNavigate();
  const { party, currentPlayer, loading, error } = useGameStore();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [challengeSetupCard, setChallengeSetupCard] = useState<Card | null>(null);
  const {
    applyCardEffect,
    startChallengeCard,
    setReactionChallengeReady,
    pressReactionChallenge,
    drinkMana,
    resolveChallengeCard,
    resolveCanCupSips,
    godModeSwapCard,
  } = useGameActions(partyId);
  const { leaveParty, startGame, updateGameSettings } = usePartyActions();

  useGameState(partyId);

  // Drunkness decay sync — updates Firestore in 30s batches
  useEffect(() => {
    if (!party || party.status !== 'playing') return;
    if (party.gameMode === 'can-cup') return;

    const SYNC_INTERVAL_MS = 30_000;
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
        const decayAmount = (decayRate / 60) * (SYNC_INTERVAL_MS / 1000);

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
  }, [partyId, party?.status, party?.gameMode]);

  const validPlayers = [
    'adam', 'madde', 'markus', 'oskar', 'jesper', 'said', 'BORGMÄSTAREN',
    'babis', 'admin', 'charlie', 'pim', 'siadman', 'linus', 'limpan',
    'master', 'master1', 'master2', 'master3', 'slave', 'slave1', 'slave2', 'slave3',
    'SB', 'limpan_döda_mig_inte', 'ollanbollan', 'ollan', 'The_Boss',
    'The_Frowning_Friends', 'The_Smiling_Friends', 'papis', 'left', 'pc', 'inco',
    'right', 'phone', 'fellan', 'felix', 'top', 'bot', 'test'
  ];

  const isCurrentTurn = Boolean(party?.currentTurn === currentPlayer?.id);
  const isLeader = Boolean(currentPlayer?.isLeader);
  const gameMode = party?.gameMode || 'classic';
  const usesArenaLayout = gameMode !== 'classic';
  const pendingCanCupSipForCurrentPlayer: PendingCanCupSipResolution | null = currentPlayer
    ? party?.pendingCanCupSips?.[currentPlayer.id] ?? null
    : null;
  const hasPendingCanCupSipForCurrentPlayer = Boolean(pendingCanCupSipForCurrentPlayer);
  const hasValidPlayer = party?.players.some((player) => validPlayers.includes(player.name.toLowerCase())) ?? false;
  const canStart = Boolean(
    party?.status === 'waiting' &&
    isLeader &&
    (party?.players.length ?? 0) >= 2 &&
    hasValidPlayer
  );
  const showNoValidPlayersWarning = Boolean(
    party?.status === 'waiting' &&
    isLeader &&
    (party?.players.length ?? 0) >= 2 &&
    !hasValidPlayer
  );

  useEffect(() => {
    if (!usesArenaLayout) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    // Force scroll to top - crucial for fixing "missing header" on mobile
    window.scrollTo(0, 0);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [usesArenaLayout]);

  const handlePlayCard = async (card: Card) => {
    if (!currentPlayer || !isCurrentTurn) return;
    if (party?.pendingChallenge) return;
    if (hasPendingCanCupSipForCurrentPlayer) return;

    const isDrunk = currentPlayer.isDrunk;
    const isMiss = isDrunk && Math.random() < 0.2;

    if (isMiss) {
      setSelectedCard(null);
      await new Promise(resolve => setTimeout(resolve, 500));
      return;
    }

    const isChallenge =
      card.isChallenge ||
      card.type === 'challenge' ||
      card.effect.type === 'challenge' ||
      card.effect.challenge ||
      ['Öl Hävf', 'Got Big Muscles?', 'Shot Contest', 'SHOT MASTER'].includes(card.name) ||
      card.name.includes('Name the most') ||
      card.effect.winnerEffect ||
      card.effect.loserEffect ||
      card.effect.challengeEffects;

    if (isChallenge) {
      const isCircleChallengeWithoutParticipantSetup =
        gameMode === 'can-cup' &&
        (card.id === 'cc-category-random' ||
          /go around the circle/i.test(card.description) ||
          /category/i.test(card.name));

      if (usesArenaLayout) {
        if (isCircleChallengeWithoutParticipantSetup) {
          try {
            await startChallengeCard(currentPlayer.id, card);
            setSelectedCard(null);
            setChallengeSetupCard(null);
          } catch (error) {
            console.error('Error starting challenge:', error);
          }
        } else {
          setSelectedCard(null);
          setChallengeSetupCard(card);
        }
      } else {
        card.isChallenge = true;
        setSelectedCard(card);
      }
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
    if (!currentPlayer || !selectedCard || !isCurrentTurn) return;
    if (hasPendingCanCupSipForCurrentPlayer) return;

    const targetPlayer = party?.players.find(p => p.id === targetId);
    if (!targetPlayer) return;

    const isUntargetable = targetPlayer.effects?.some(
      effect => effect.stackId === 'untargetable' && effect.type === 'untargetable'
    );
    if (isUntargetable) return;

    const isDrunk = currentPlayer.isDrunk;
    const isMiss = isDrunk && Math.random() < 0.2;

    if (isMiss) {
      setSelectedCard(null);
      await new Promise(resolve => setTimeout(resolve, 500));
      return;
    }

    try {
      await applyCardEffect(currentPlayer.id, targetId, selectedCard);
      setSelectedCard(null);
    } catch (error) {
      console.error('Error applying card effect:', error);
    }
  };

  const handleChallengeResolve = async (winnerId: string, loserId: string) => {
    const challengeCard = party?.pendingChallenge?.card || selectedCard;
    if (!currentPlayer || !challengeCard || !isCurrentTurn) return;
    if (hasPendingCanCupSipForCurrentPlayer) return;

    let finalWinnerId = winnerId;
    let finalLoserId = loserId;

    const isDrunk = currentPlayer.isDrunk;
    const isMiss = isDrunk && Math.random() < 0.2;

    if (isMiss) {
      finalWinnerId = loserId;
      finalLoserId = winnerId;
    }

    try {
      await resolveChallengeCard(currentPlayer.id, finalWinnerId, finalLoserId, challengeCard);
      setSelectedCard(null);
    } catch (error) {
      console.error('Error resolving challenge:', error);
    }
  };

  const handleChallengeSetupConfirm = async (duelistOneId: string, duelistTwoId: string) => {
    if (!currentPlayer || !challengeSetupCard) return;

    try {
      await startChallengeCard(currentPlayer.id, challengeSetupCard, duelistOneId, duelistTwoId);
      setChallengeSetupCard(null);
      setSelectedCard(null);
    } catch (error) {
      console.error('Error starting challenge:', error);
    }
  };

  const handleChallengeSetupCancel = () => {
    setChallengeSetupCard(null);
  };

  const handleOpenPendingChallenge = () => {
    if (!party?.pendingChallenge || !currentPlayer) return;
    if (party.pendingChallenge.playerId !== currentPlayer.id) return;
    if (isCanCupReactionChallengeCard(party.pendingChallenge.card)) return;
    setSelectedCard(party.pendingChallenge.card);
  };

  const handleSetReactionChallengeReady = async () => {
    if (!currentPlayer) return;
    try {
      await setReactionChallengeReady(currentPlayer.id);
    } catch (error) {
      console.error('Error setting reaction ready state:', error);
    }
  };

  const handlePressReactionChallenge = async (reactionTimeMs: number) => {
    if (!currentPlayer) return;
    try {
      await pressReactionChallenge(currentPlayer.id, reactionTimeMs);
    } catch (error) {
      console.error('Error pressing reaction challenge:', error);
    }
  };

  const handleDrink = async () => {
    if (!currentPlayer) return;
    try {
      await drinkMana(currentPlayer.id);
    } catch (error) {
      console.error('Error drinking mana:', error);
    }
  };

  const handleResolvePendingCanCupSips = async () => {
    if (!currentPlayer || !pendingCanCupSipForCurrentPlayer) return;
    try {
      await resolveCanCupSips(currentPlayer.id);
    } catch (error) {
      console.error('Error resolving pending Can Cup sips:', error);
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
      await leaveParty(party.id, currentPlayer.id, true);
      navigate('/');
    } catch (error) {
      console.error('Error leaving party:', error);
    }
  };

  const handleUpdateSettings = async (settings: any) => {
    await updateGameSettings(settings, partyId);
  };

  if (loading) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-gradient-to-b from-gray-900 to-purple-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-xl text-purple-100">Loading game...</p>
        </div>
      </div>
    );
  }

  if (error || !party || !currentPlayer) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-gradient-to-b from-gray-900 to-purple-900">
        <div className="text-center">
          <p className="text-xl text-red-400 mb-4">{error || 'Game not found'}</p>
          <button onClick={() => navigate('/')} className="text-purple-400 hover:text-purple-300">
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const isPlayerDrunk = currentPlayer?.isDrunk || false;
  const props = {
    party,
    currentPlayer,
    isLeader,
    canStart,
    isCurrentTurn,
    showNoValidPlayersWarning,
    onPlayCard: handlePlayCard,
    onTargetSelect: handleTargetSelect,
    onChallengeResolve: handleChallengeResolve,
    onStartGame: handleStartGame,
    onLeaveParty: handleLeaveParty,
    onUpdateSettings: handleUpdateSettings,
    onDrink: handleDrink,
    onOpenPendingChallenge: handleOpenPendingChallenge,
    pendingCanCupSipForCurrentPlayer,
    onResolvePendingCanCupSips: handleResolvePendingCanCupSips,
    onSetReactionChallengeReady: handleSetReactionChallengeReady,
    onPressReactionChallenge: handlePressReactionChallenge,
    challengeSetupCard,
    onChallengeSetupConfirm: handleChallengeSetupConfirm,
    onChallengeSetupCancel: handleChallengeSetupCancel,
    selectedCard,
    setSelectedCard,
    onGodModeSwapCard: godModeSwapCard,
  };

  return (
    <div
      className={clsx(
        "bg-gradient-to-b from-gray-900 to-purple-900 relative",
        usesArenaLayout ? "overflow-hidden" : "min-h-screen min-h-[100dvh] overflow-auto",
        isPlayerDrunk && "drunk-player-view"
      )}
      style={usesArenaLayout ? { height: 'calc(var(--app-height, 100dvh) - var(--sat, 0px) - var(--sab, 0px))' } : undefined}
    >
      {isPlayerDrunk && (
        <div className="absolute inset-0 backdrop-blur-sm pointer-events-none z-10 bg-amber-900/10" />
      )}

      {gameMode === 'classic' ? (
        <GameClassicUI {...props} />
      ) : (
        <GameModernUI {...props} />
      )}
    </div>
  );
}
