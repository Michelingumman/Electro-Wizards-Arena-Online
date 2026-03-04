import { useCallback } from 'react';
import { doc, runTransaction } from 'firebase/firestore';
import { db, serverNow } from '../lib/firebase';
import { Card, GameMode, Party, PendingCanCupSipResolution, Player, isAfterskiMode } from '../types/game';
import { GAME_CONFIG } from '../config/gameConfig';
import { drawLegendaryCard, drawNewCard } from '../utils/cardGeneration';
import { validateChallengeParticipants, applyChallengeEffect } from '../utils/challengeEffects';
import { isChallengeCard, isNamingChallengeCard } from '../utils/challengeCard';
import { CardEnhancer } from '../utils/cardEnhancer';
import { EffectManager } from '../utils/effectManager';
import {
  addDeflectCharges,
  addWaterSips,
  applyDirectSips,
  applyForcedSips,
  canCupGiveEmptyCan,
  canCupRemoveDefense,
  getPlayersWithFewestEmptyCans,
  sanitizeSipsPerCan,
  swapSipsLeft,
  topUpSips,
} from '../utils/canCupMechanics';
import { isCanCupReactionChallengeCard } from '../utils/canCupChallengeHelpers';

export function useGameActions(partyId: string) {
  const effectManager = new EffectManager();
  const cardEnhancer = new CardEnhancer(effectManager);
  const getGameMode = (party: Party): GameMode => party.gameMode ?? 'classic';
  const getCanCupSipsPerCan = (party: Party): number =>
    sanitizeSipsPerCan(party.settings?.canCupSipsPerCan ?? GAME_CONFIG.CAN_CUP_SIPS_PER_CAN);
  const getCanCupCansToWin = (party: Party): number =>
    party.settings?.canCupCansToWin ?? 5;
  const checkCanCupWinner = (players: Party['players'], cansToWin: number): string | null => {
    const winner = players.find(p => (p.canCup?.emptyCans ?? 0) >= cansToWin);
    return winner?.id ?? null;
  };
  const CAN_CUP_CATEGORY_POOL = [
    'Beer brands',
    'Countries',
    'Car brands',
    'Ski brands',
    'Universities',
    'Liquor brands',
    'Football teams',
    'Movie titles',
    'Music artists',
    'Cities',
  ];
  const isCanCupCircleChallenge = (card: Card): boolean =>
    card.id === 'cc-category-random' ||
    /go around the circle/i.test(card.description) ||
    /category/i.test(card.name);
  const getChallengeCardForPendingState = (card: Card, gameMode: GameMode): Card => {
    if (!(gameMode === 'can-cup' && isCanCupCircleChallenge(card))) return card;
    const category = CAN_CUP_CATEGORY_POOL[Math.floor(Math.random() * CAN_CUP_CATEGORY_POOL.length)];
    const baseName = card.name.includes(':') ? card.name.split(':')[0].trim() : card.name;
    return {
      ...card,
      name: `${baseName}: ${category.toUpperCase()}`,
      description: `Category: ${category}. First to fail takes the sip penalty.`,
    };
  };
  const getNextTurnPlayerId = (players: Party['players'], currentPlayerId: string): string => {
    const currentPlayerIndex = players.findIndex((player) => player.id === currentPlayerId);
    if (currentPlayerIndex < 0) return currentPlayerId;
    const nextTurnIndex = (currentPlayerIndex + 1) % players.length;
    return players[nextTurnIndex]?.id || currentPlayerId;
  };
  const clonePlayerForSimulation = (player: Party['players'][number]): Party['players'][number] => ({
    ...player,
    canCup: player.canCup ? { ...player.canCup } : undefined,
  });

  const normalizePendingCanCupSips = (
    pendingCanCupSips?: Party['pendingCanCupSips']
  ): Record<string, PendingCanCupSipResolution> => {
    if (!pendingCanCupSips) return {};
    return Object.entries(pendingCanCupSips).reduce<Record<string, PendingCanCupSipResolution>>((acc, [playerId, entry]) => {
      if (!entry) return acc;
      const totalSips = Math.max(0, Math.round(entry.totalSips || 0));
      if (totalSips <= 0) return acc;
      acc[playerId] = {
        ...entry,
        targetPlayerId: entry.targetPlayerId || playerId,
        totalSips,
        beerSipsToConsume: Math.max(0, Math.round(entry.beerSipsToConsume || 0)),
        waterSipsToConsume: Math.max(0, Math.round(entry.waterSipsToConsume || 0)),
        deflectSipsToConsume: Math.max(0, Math.round(entry.deflectSipsToConsume || 0)),
        updatedAt: entry.updatedAt || Date.now(),
      };
      return acc;
    }, {});
  };

  const recalculatePendingCanCupSips = (
    pendingCanCupSips: Record<string, PendingCanCupSipResolution>,
    players: Party['players'],
    sipsPerCan: number
  ): Record<string, PendingCanCupSipResolution> => {
    const recalculated: Record<string, PendingCanCupSipResolution> = {};
    Object.entries(pendingCanCupSips).forEach(([playerId, entry]) => {
      const target = players.find((player) => player.id === playerId);
      if (!target) return;
      const totalSips = Math.max(0, Math.round(entry.totalSips || 0));
      if (totalSips <= 0) return;

      const simulatedTarget = clonePlayerForSimulation(target);
      const result = applyForcedSips(simulatedTarget, totalSips, sipsPerCan);

      recalculated[playerId] = {
        ...entry,
        targetPlayerId: playerId,
        totalSips,
        beerSipsToConsume: result.appliedSips,
        waterSipsToConsume: result.blockedByWater,
        deflectSipsToConsume: result.blockedByDeflect,
        updatedAt: Date.now(),
      };
    });
    return recalculated;
  };

  const toPendingCanCupSipsField = (
    pendingCanCupSips: Record<string, PendingCanCupSipResolution>
  ): Party['pendingCanCupSips'] => (
    Object.keys(pendingCanCupSips).length > 0 ? pendingCanCupSips : null
  );

  const toRounded = (value: number) => Number(value.toFixed(2));

  const snapshotPlayerStats = (players: Party['players']) =>
    new Map(players.map((player) => [
      player.id,
      {
        mana: toRounded(player.mana),
        manaIntake: toRounded(player.manaIntake || 0),
        drunkSeconds: Math.max(0, Math.round(player.drunkSeconds || 0)),
        canCupSipsLeft: player.canCup?.sipsLeft ?? null,
        canCupWaterSips: player.canCup?.waterSips ?? null,
        canCupDeflectCharges: player.canCup?.deflectCharges ?? null,
        canCupEmptyCans: player.canCup?.emptyCans ?? null,
      },
    ]));

  const buildLastActionPayload = ({
    beforeStats,
    updatedPlayers,
    playerId,
    targetId,
    cardId,
    cardName,
    cardType,
    cardRarity,
    cardDescription,
    manaCost,
    targetDamageOverride,
    targetManaDeltaOverride,
    targetManaIntakeDeltaOverride,
    affectedPlayerIdsOverride,
  }: {
    beforeStats: Map<string, {
      mana: number;
      manaIntake: number;
      drunkSeconds: number;
      canCupSipsLeft: number | null;
      canCupWaterSips: number | null;
      canCupDeflectCharges: number | null;
      canCupEmptyCans: number | null;
    }>;
    updatedPlayers: Party['players'];
    playerId: string;
    targetId?: string;
    cardId: string;
    cardName: string;
    cardType: string;
    cardRarity: string;
    cardDescription: string;
    manaCost?: number;
    targetDamageOverride?: number;
    targetManaDeltaOverride?: number;
    targetManaIntakeDeltaOverride?: number;
    affectedPlayerIdsOverride?: string[];
  }) => {
    const attackerBefore = beforeStats.get(playerId);
    const attackerAfter = updatedPlayers.find((player) => player.id === playerId);
    const targetBefore = targetId ? beforeStats.get(targetId) : undefined;
    const targetAfter = targetId ? updatedPlayers.find((player) => player.id === targetId) : undefined;

    const attackerManaDelta = attackerBefore && attackerAfter
      ? toRounded(attackerAfter.mana - attackerBefore.mana)
      : undefined;
    const rawTargetManaDelta = targetBefore && targetAfter
      ? toRounded(targetAfter.mana - targetBefore.mana)
      : undefined;
    const rawTargetManaIntakeDelta = targetBefore && targetAfter
      ? toRounded((targetAfter.manaIntake || 0) - targetBefore.manaIntake)
      : undefined;
    const rawTargetDamage = targetBefore && targetAfter
      ? Math.max(0, toRounded(targetBefore.mana - targetAfter.mana))
      : undefined;

    const targetManaDelta = typeof targetManaDeltaOverride === 'number'
      ? targetManaDeltaOverride
      : rawTargetManaDelta;
    const targetManaIntakeDelta = typeof targetManaIntakeDeltaOverride === 'number'
      ? targetManaIntakeDeltaOverride
      : rawTargetManaIntakeDelta;
    const targetDamage = typeof targetDamageOverride === 'number'
      ? targetDamageOverride
      : rawTargetDamage;

    const detectedAffectedPlayerIds = updatedPlayers
      .filter((player) => {
        const before = beforeStats.get(player.id);
        if (!before) return false;
        return (
          Math.abs((player.mana || 0) - before.mana) > 0.001 ||
          Math.abs((player.manaIntake || 0) - before.manaIntake) > 0.001 ||
          Math.abs((player.drunkSeconds || 0) - before.drunkSeconds) > 0.001 ||
          (player.canCup?.sipsLeft ?? null) !== before.canCupSipsLeft ||
          (player.canCup?.waterSips ?? null) !== before.canCupWaterSips ||
          (player.canCup?.deflectCharges ?? null) !== before.canCupDeflectCharges ||
          (player.canCup?.emptyCans ?? null) !== before.canCupEmptyCans
        );
      })
      .map((player) => player.id);

    const affectedPlayerIds = affectedPlayerIdsOverride && affectedPlayerIdsOverride.length > 0
      ? affectedPlayerIdsOverride
      : detectedAffectedPlayerIds;

    const payload: NonNullable<Party['lastAction']> = {
      playerId,
      cardId,
      cardName,
      cardType,
      cardRarity,
      cardDescription,
      timestamp: Date.now(),
    };

    if (targetId) payload.targetId = targetId;
    if (typeof manaCost === 'number') payload.manaCost = manaCost;
    if (typeof attackerManaDelta === 'number') payload.attackerManaDelta = attackerManaDelta;
    if (typeof targetManaDelta === 'number') payload.targetManaDelta = targetManaDelta;
    if (typeof targetDamage === 'number') payload.targetDamage = targetDamage;
    if (typeof targetManaIntakeDelta === 'number') payload.targetManaIntakeDelta = targetManaIntakeDelta;
    if (affectedPlayerIds.length > 0) payload.affectedPlayerIds = affectedPlayerIds;

    return payload;
  };

  const sanitizeCardForFirestore = (card: Card): Card =>
    JSON.parse(JSON.stringify(card)) as Card;

  const applyCanCupCardEffect = ({
    card,
    player,
    target,
    updatedPlayers,
    sipsPerCan,
    playerId,
    pendingCanCupSips,
  }: {
    card: Card;
    player: Party['players'][number];
    target: Party['players'][number];
    updatedPlayers: Party['players'];
    sipsPerCan: number;
    playerId: string;
    pendingCanCupSips: Record<string, PendingCanCupSipResolution>;
  }) => {
    let targetSipCommand = 0;
    const affectedPlayerIds = new Set<string>();
    let nextPendingCanCupSips = normalizePendingCanCupSips(pendingCanCupSips);
    let resolvedTargetId = target.id;

    const ensureCanCupState = (player: Player, sipsPerCan: number) => {
      if (!player.canCup) {
        player.canCup = {
          sipsLeft: sipsPerCan,
          waterSips: 0,
          deflectCharges: 0,
          emptyCans: 0,
          pendingResolution: false,
        };
      }
      return player.canCup;
    };

    const queueForcedSips = (targetPlayerId: string, sipCount: number) => {
      const totalSipsToQueue = Math.max(0, Math.round(sipCount));
      if (totalSipsToQueue <= 0) return 0;

      const existing = nextPendingCanCupSips[targetPlayerId];
      const existingTotal = existing?.totalSips ?? 0;
      nextPendingCanCupSips[targetPlayerId] = {
        targetPlayerId,
        totalSips: existingTotal + totalSipsToQueue,
        beerSipsToConsume: existing?.beerSipsToConsume ?? 0,
        waterSipsToConsume: existing?.waterSipsToConsume ?? 0,
        deflectSipsToConsume: existing?.deflectSipsToConsume ?? 0,
        sourcePlayerId: playerId,
        sourceCardId: card.id,
        sourceCardName: card.name,
        updatedAt: Date.now(),
      };

      nextPendingCanCupSips = recalculatePendingCanCupSips(nextPendingCanCupSips, updatedPlayers, sipsPerCan);
      affectedPlayerIds.add(targetPlayerId);
      return totalSipsToQueue;
    };

    const playCostSips = Math.max(0, Math.round(card.sipCost ?? card.manaCost ?? 0));
    if (playCostSips > 0) {
      queueForcedSips(playerId, playCostSips);
    }

    switch (card.effect.type) {
      case 'canCupSip': {
        targetSipCommand += queueForcedSips(target.id, card.effect.value);
        break;
      }
      case 'canCupAoESip': {
        updatedPlayers.forEach((entry) => {
          queueForcedSips(entry.id, card.effect.value);
          if (entry.id === target.id) {
            targetSipCommand += Math.max(0, Math.round(card.effect.value));
          }
        });
        break;
      }
      case 'canCupWater': {
        addWaterSips(player, card.effect.value, sipsPerCan);
        affectedPlayerIds.add(player.id);
        nextPendingCanCupSips = recalculatePendingCanCupSips(nextPendingCanCupSips, updatedPlayers, sipsPerCan);
        break;
      }
      case 'canCupDeflect': {
        addDeflectCharges(player, card.effect.value, sipsPerCan);
        affectedPlayerIds.add(player.id);
        nextPendingCanCupSips = recalculatePendingCanCupSips(nextPendingCanCupSips, updatedPlayers, sipsPerCan);
        break;
      }
      case 'canCupTopUp': {
        topUpSips(player, card.effect.value, sipsPerCan);
        affectedPlayerIds.add(player.id);
        nextPendingCanCupSips = recalculatePendingCanCupSips(nextPendingCanCupSips, updatedPlayers, sipsPerCan);
        break;
      }
      case 'canCupDoubleTrouble': {
        targetSipCommand += queueForcedSips(target.id, card.effect.value);
        break;
      }
      case 'canCupBottomsUpPrep': {
        const alreadyQueued = nextPendingCanCupSips[target.id]?.totalSips ?? 0;
        const simulatedTarget = clonePlayerForSimulation(target);
        if (alreadyQueued > 0) {
          applyForcedSips(simulatedTarget, alreadyQueued, sipsPerCan);
        } else {
          applyForcedSips(simulatedTarget, 0, sipsPerCan);
        }
        const remainingBeer = simulatedTarget.canCup?.sipsLeft ?? sipsPerCan;
        const remainingWater = simulatedTarget.canCup?.waterSips ?? 0;
        const requiredToLeaveOneBeer = Math.max(0, remainingWater + Math.max(0, remainingBeer - 1));
        targetSipCommand += queueForcedSips(target.id, requiredToLeaveOneBeer);
        break;
      }
      case 'canCupSwap': {
        swapSipsLeft(player, target, sipsPerCan);
        affectedPlayerIds.add(playerId);
        affectedPlayerIds.add(target.id);
        nextPendingCanCupSips = recalculatePendingCanCupSips(nextPendingCanCupSips, updatedPlayers, sipsPerCan);
        break;
      }
      case 'canCupBottenUpp': {
        // Drain ALL remaining sips from the target's can
        const targetCanCup = ensureCanCupState(target, sipsPerCan);
        const remainingSips = targetCanCup.sipsLeft + targetCanCup.waterSips;
        if (remainingSips > 0) {
          targetSipCommand += queueForcedSips(target.id, remainingSips);
        }
        break;
      }
      case 'canCupVampire': {
        const stolenSips = Math.min(target.canCup?.sipsLeft ?? 0, card.effect.value);
        if (stolenSips > 0) {
          applyDirectSips(target, stolenSips, sipsPerCan);
          topUpSips(player, stolenSips, sipsPerCan);
          affectedPlayerIds.add(player.id);
          affectedPlayerIds.add(target.id);
          nextPendingCanCupSips = recalculatePendingCanCupSips(nextPendingCanCupSips, updatedPlayers, sipsPerCan);
        }
        break;
      }
      case 'canCupReflect': {
        const myPending = nextPendingCanCupSips[player.id];
        if (myPending && myPending.totalSips > 0) {
          const sipsToTransfer = myPending.totalSips;
          delete nextPendingCanCupSips[player.id];
          queueForcedSips(target.id, sipsToTransfer);
          affectedPlayerIds.add(player.id);
          affectedPlayerIds.add(target.id);
        }
        break;
      }
      case 'canCupRemoveDefense': {
        const penaltySips = Math.max(0, Math.round(card.effect.value));
        const isAoeDefenseRemoval = !card.requiresTarget || card.type === 'aoe';

        if (isAoeDefenseRemoval) {
          updatedPlayers.forEach((entry) => {
            canCupRemoveDefense(entry, sipsPerCan);
            affectedPlayerIds.add(entry.id);
            if (penaltySips > 0) {
              const applied = queueForcedSips(entry.id, penaltySips);
              if (entry.id === target.id) {
                targetSipCommand += applied;
              }
            }
          });
        } else {
          canCupRemoveDefense(target, sipsPerCan);
          affectedPlayerIds.add(target.id);
          if (penaltySips > 0) {
            targetSipCommand += queueForcedSips(target.id, penaltySips);
          }
        }

        if (penaltySips === 0) {
          nextPendingCanCupSips = recalculatePendingCanCupSips(nextPendingCanCupSips, updatedPlayers, sipsPerCan);
        }
        break;
      }
      case 'canCupGiveEmptyCan': {
        const transferCount = Math.max(0, Math.round(card.effect.value));
        const sourceBefore = player.canCup?.emptyCans ?? 0;
        const targetBefore = target.canCup?.emptyCans ?? 0;

        for (let index = 0; index < transferCount; index += 1) {
          canCupGiveEmptyCan(player, target, sipsPerCan);
        }

        const sourceAfter = player.canCup?.emptyCans ?? sourceBefore;
        const targetAfter = target.canCup?.emptyCans ?? targetBefore;
        if (sourceAfter !== sourceBefore || targetAfter !== targetBefore) {
          affectedPlayerIds.add(player.id);
          affectedPlayerIds.add(target.id);
        }
        break;
      }
      case 'canCupTaxSober': {
        const taxSips = Math.max(0, Math.round(card.effect.value));
        const candidates = getPlayersWithFewestEmptyCans(updatedPlayers, sipsPerCan);
        if (candidates.length > 0 && taxSips > 0) {
          const randomCandidate = candidates[Math.floor(Math.random() * candidates.length)];
          resolvedTargetId = randomCandidate.id;
          targetSipCommand += queueForcedSips(randomCandidate.id, taxSips);
        }
        break;
      }
      default:
        throw new Error(`Unsupported Can Cup effect type: ${card.effect.type}`);
    }

    return {
      targetSipCommand,
      resolvedTargetId,
      affectedPlayerIds: Array.from(affectedPlayerIds),
      pendingCanCupSips: nextPendingCanCupSips,
    };
  };

  // End turn and advance to next player
  const endTurn = useCallback(async (playerId: string) => {
    const partyRef = doc(db, 'parties', partyId);

    try {
      await runTransaction(db, async (transaction) => {
        const partyDoc = await transaction.get(partyRef);
        if (!partyDoc.exists()) throw new Error('Party not found');
        const party = partyDoc.data() as Party;

        if (party.currentTurn !== playerId) throw new Error('Not player\'s turn');

        const updatedPlayers = [...party.players];

        // Find next player's turn
        const currentPlayerIndex = updatedPlayers.findIndex(p => p.id === playerId);
        const nextTurnIndex = (currentPlayerIndex + 1) % updatedPlayers.length;
        const nextPlayerId = updatedPlayers[nextTurnIndex]?.id || playerId;

        // Only update the currentTurn field, preserving all other fields
        transaction.update(partyRef, {
          currentTurn: nextPlayerId,
        });
      });
      return true;
    } catch (error) {
      console.error('Error ending turn:', error);
      throw error;
    }
  }, [partyId]);

  const startChallengeCard = useCallback(async (
    playerId: string,
    card: Card,
    duelistOneId?: string,
    duelistTwoId?: string
  ) => {
    const partyRef = doc(db, 'parties', partyId);

    try {
      await runTransaction(db, async (transaction) => {
        const partyDoc = await transaction.get(partyRef);
        if (!partyDoc.exists()) throw new Error('Party not found');
        const party = partyDoc.data() as Party;

        if (party.currentTurn !== playerId) throw new Error('Not player\'s turn');
        if (party.pendingChallenge) throw new Error('Resolve the active challenge first');
        if (!isChallengeCard(card)) throw new Error('This card is not a challenge card');

        const updatedPlayers = [...party.players];
        const beforeStats = snapshotPlayerStats(updatedPlayers);
        const gameMode = getGameMode(party);
        const canCupSipsPerCan = getCanCupSipsPerCan(party);
        let nextPendingCanCupSips = normalizePendingCanCupSips(party.pendingCanCupSips);
        const requiresParticipantSetup = !(gameMode === 'can-cup' && isCanCupCircleChallenge(card));
        const pendingChallengeCard = getChallengeCardForPendingState(card, gameMode);
        const player = updatedPlayers.find((entry) => entry.id === playerId);
        if (!player) throw new Error('Player not found');
        if (requiresParticipantSetup) {
          if (!duelistOneId || !duelistTwoId) throw new Error('Two duelists are required');
          if (duelistOneId === duelistTwoId) throw new Error('Duelists must be unique players');
          const duelistOne = updatedPlayers.find((entry) => entry.id === duelistOneId);
          const duelistTwo = updatedPlayers.find((entry) => entry.id === duelistTwoId);
          if (!duelistOne || !duelistTwo) throw new Error('Selected duelists not found');
        }

        const hasCard = player.cards.some((entry) => entry.id === card.id);
        if (!hasCard) throw new Error('Challenge card not found in hand');
        if (gameMode !== 'can-cup' && player.mana < card.manaCost) throw new Error('Not enough mana for challenge card');
        if (gameMode !== 'can-cup') {
          player.mana = Math.max(0, player.mana - card.manaCost);
        }
        if (gameMode === 'can-cup') {
          const playCostSips = Math.max(0, Math.round(card.sipCost ?? card.manaCost ?? 0));
          if (playCostSips > 0) {
            const existing = nextPendingCanCupSips[playerId];
            nextPendingCanCupSips[playerId] = {
              targetPlayerId: playerId,
              totalSips: (existing?.totalSips ?? 0) + playCostSips,
              beerSipsToConsume: existing?.beerSipsToConsume ?? 0,
              waterSipsToConsume: existing?.waterSipsToConsume ?? 0,
              deflectSipsToConsume: existing?.deflectSipsToConsume ?? 0,
              sourcePlayerId: playerId,
              sourceCardId: card.id,
              sourceCardName: card.name,
              updatedAt: Date.now(),
            };
            nextPendingCanCupSips = recalculatePendingCanCupSips(
              nextPendingCanCupSips,
              updatedPlayers,
              canCupSipsPerCan
            );
          }
        }

        const pendingChallengePayload: NonNullable<Party['pendingChallenge']> = {
          playerId,
          card: sanitizeCardForFirestore(pendingChallengeCard),
          createdAt: Date.now(),
        };
        if (requiresParticipantSetup && duelistOneId && duelistTwoId) {
          pendingChallengePayload.duelistOneId = duelistOneId;
          pendingChallengePayload.duelistTwoId = duelistTwoId;
          if (gameMode === 'can-cup' && isCanCupReactionChallengeCard(pendingChallengeCard)) {
            pendingChallengePayload.reactionGame = {
              mode: 'reaction',
              phase: 'waiting',
              readyPlayerIds: [],
            };
          }
        }

        transaction.update(partyRef, {
          players: updatedPlayers,
          pendingChallenge: pendingChallengePayload,
          drunkTimerLastSyncedAt: gameMode === 'can-cup' ? party.drunkTimerLastSyncedAt : Date.now(),
          pendingCanCupSips: gameMode === 'can-cup'
            ? toPendingCanCupSipsField(nextPendingCanCupSips)
            : party.pendingCanCupSips ?? null,
          lastAction: buildLastActionPayload({
            beforeStats,
            updatedPlayers,
            playerId,
            targetId: requiresParticipantSetup ? duelistOneId : undefined,
            cardId: card.id,
            cardName: pendingChallengeCard.name,
            cardType: card.effect.type,
            cardRarity: card.rarity,
            cardDescription: pendingChallengeCard.description,
            manaCost: card.manaCost,
          }),
        });
      });
      return true;
    } catch (error) {
      console.error('Error starting challenge card:', error);
      throw error;
    }
  }, [partyId]);

  const setReactionChallengeReady = useCallback(async (playerId: string) => {
    const partyRef = doc(db, 'parties', partyId);

    try {
      await runTransaction(db, async (transaction) => {
        const partyDoc = await transaction.get(partyRef);
        if (!partyDoc.exists()) throw new Error('Party not found');
        const party = partyDoc.data() as Party;
        if (getGameMode(party) !== 'can-cup') return;

        const pendingChallenge = party.pendingChallenge;
        if (!pendingChallenge || !isCanCupReactionChallengeCard(pendingChallenge.card)) {
          throw new Error('No active reaction challenge');
        }
        if (!pendingChallenge.duelistOneId || !pendingChallenge.duelistTwoId) {
          throw new Error('Reaction challenge duelists are missing');
        }

        const duelistIds = [pendingChallenge.duelistOneId, pendingChallenge.duelistTwoId];
        if (!duelistIds.includes(playerId)) {
          throw new Error('Only duelists can ready up');
        }

        const currentReactionState = pendingChallenge.reactionGame ?? {
          mode: 'reaction' as const,
          phase: 'waiting' as const,
          readyPlayerIds: [],
        };

        if (currentReactionState.phase !== 'waiting') {
          return;
        }

        const readySet = new Set(currentReactionState.readyPlayerIds || []);
        readySet.add(playerId);

        const updatedReactionState: NonNullable<Party['pendingChallenge']>['reactionGame'] = {
          mode: 'reaction',
          phase: 'waiting',
          readyPlayerIds: Array.from(readySet),
        };

        if (duelistIds.every((id) => readySet.has(id))) {
          const now = serverNow();
          // Each light stage gets a random delay of 1-5 seconds for unpredictability
          const redDelay = 1000 + Math.floor(Math.random() * 4000);
          const yellowDelay = 1000 + Math.floor(Math.random() * 4000);
          const greenDelay = 1000 + Math.floor(Math.random() * 4000);
          updatedReactionState.phase = 'countdown';
          updatedReactionState.countdownStartedAt = now;
          updatedReactionState.redAt = now + redDelay;
          updatedReactionState.yellowAt = now + redDelay + yellowDelay;
          updatedReactionState.greenAt = now + redDelay + yellowDelay + greenDelay;
          console.log(`[SYNC-GEN] Countdown generated! local serverNow()=${now}. target greenAt=${updatedReactionState.greenAt}. Delays: ${redDelay}, ${yellowDelay}, ${greenDelay}`);
        }

        transaction.update(partyRef, {
          pendingChallenge: {
            ...pendingChallenge,
            reactionGame: updatedReactionState,
          },
        });
      });
      return true;
    } catch (error) {
      console.error('Error setting reaction ready state:', error);
      throw error;
    }
  }, [partyId]);

  const pressReactionChallenge = useCallback(async (playerId: string, reactionTimeMs: number) => {
    const partyRef = doc(db, 'parties', partyId);

    try {
      await runTransaction(db, async (transaction) => {
        const partyDoc = await transaction.get(partyRef);
        if (!partyDoc.exists()) throw new Error('Party not found');
        const party = partyDoc.data() as Party;
        if (getGameMode(party) !== 'can-cup') return;

        const pendingChallenge = party.pendingChallenge;
        if (!pendingChallenge || !isCanCupReactionChallengeCard(pendingChallenge.card)) {
          throw new Error('No active reaction challenge');
        }
        if (!pendingChallenge.duelistOneId || !pendingChallenge.duelistTwoId) {
          throw new Error('Reaction challenge duelists are missing');
        }

        const reactionState = pendingChallenge.reactionGame;
        if (!reactionState || reactionState.phase === 'waiting') {
          throw new Error('Reaction challenge has not started');
        }
        if (reactionState.phase === 'resolved') {
          return; // Already resolved
        }

        const duelistIds = [pendingChallenge.duelistOneId, pendingChallenge.duelistTwoId];
        if (!duelistIds.includes(playerId)) {
          throw new Error('Only duelists can press');
        }

        // Initialize reactionTimes record if it doesn't exist
        const updatedReactionTimes = { ...(reactionState.reactionTimes || {}) };

        // Prevent re-submission
        if (playerId in updatedReactionTimes) {
          return;
        }

        // Record player's exact DOM reaction time
        updatedReactionTimes[playerId] = reactionTimeMs;

        // If only 1 player has pressed, save their time and wait for the other.
        if (Object.keys(updatedReactionTimes).length < 2) {
          transaction.update(partyRef, {
            'pendingChallenge.reactionGame.reactionTimes': updatedReactionTimes
          });
          return;
        }

        // --- BOTH PLAYERS HAVE PRESSED! ---
        // Find who has the lowest reaction time in milliseconds
        const entries = Object.entries(updatedReactionTimes);
        let winnerId = entries[0][0];
        let loserId = entries[1][0];

        if (entries[1][1] < entries[0][1]) {
          winnerId = entries[1][0];
          loserId = entries[0][0];
        }

        const updatedPlayers = party.players.map((player) => ({
          ...player,
          cards: [...player.cards],
          canCup: player.canCup ? { ...player.canCup } : undefined,
        }));
        const beforeStats = snapshotPlayerStats(updatedPlayers);
        const canCupSipsPerCan = getCanCupSipsPerCan(party);
        let nextPendingCanCupSips = normalizePendingCanCupSips(party.pendingCanCupSips);

        const challengeOwner = updatedPlayers.find((player) => player.id === pendingChallenge.playerId);
        if (!challengeOwner) {
          throw new Error('Challenge owner not found');
        }

        // Swap out the card
        const usedCardIndex = challengeOwner.cards.findIndex((entry) => entry.id === pendingChallenge.card.id);
        if (usedCardIndex !== -1) {
          challengeOwner.cards[usedCardIndex] = drawNewCard('can-cup');
        }

        const loserSipPenalty = canCupSipsPerCan * 2;
        const existingPenalty = nextPendingCanCupSips[loserId];
        nextPendingCanCupSips[loserId] = {
          targetPlayerId: loserId,
          totalSips: (existingPenalty?.totalSips ?? 0) + loserSipPenalty,
          beerSipsToConsume: existingPenalty?.beerSipsToConsume ?? 0,
          waterSipsToConsume: existingPenalty?.waterSipsToConsume ?? 0,
          deflectSipsToConsume: existingPenalty?.deflectSipsToConsume ?? 0,
          sourcePlayerId: winnerId,
          sourceCardId: pendingChallenge.card.id,
          sourceCardName: pendingChallenge.card.name,
          updatedAt: serverNow(),
        };
        nextPendingCanCupSips = recalculatePendingCanCupSips(nextPendingCanCupSips, updatedPlayers, canCupSipsPerCan);

        transaction.update(partyRef, {
          players: updatedPlayers,
          pendingChallenge: null,
          pendingCanCupSips: toPendingCanCupSipsField(nextPendingCanCupSips),
          currentTurn: getNextTurnPlayerId(updatedPlayers, pendingChallenge.playerId),
          lastAction: buildLastActionPayload({
            beforeStats,
            updatedPlayers,
            playerId: winnerId,
            targetId: loserId,
            cardId: pendingChallenge.card.id,
            cardName: pendingChallenge.card.name,
            cardType: pendingChallenge.card.effect.type,
            cardRarity: pendingChallenge.card.rarity,
            cardDescription: pendingChallenge.card.description,
            manaCost: pendingChallenge.card.manaCost,
            targetDamageOverride: loserSipPenalty,
            targetManaDeltaOverride: -loserSipPenalty,
            targetManaIntakeDeltaOverride: 0,
            affectedPlayerIdsOverride: [winnerId, loserId, pendingChallenge.playerId],
          }),
        });
      });
      return true;
    } catch (error) {
      console.error('Error resolving reaction challenge press:', error);
      throw error;
    }
  }, [partyId]);

  // Apply a card effect
  const applyCardEffect = useCallback(async (playerId: string, targetId: string, card: Card) => {
    const partyRef = doc(db, 'parties', partyId);

    try {
      await runTransaction(db, async (transaction) => {
        const partyDoc = await transaction.get(partyRef);
        if (!partyDoc.exists()) throw new Error('Party not found');
        const party = partyDoc.data() as Party;

        if (party.currentTurn !== playerId) throw new Error('Not player\'s turn');
        if (party.pendingChallenge) throw new Error('Resolve the active challenge first');

        const updatedPlayers = [...party.players];
        const beforeStats = snapshotPlayerStats(updatedPlayers);
        const gameMode = getGameMode(party);
        const canCupSipsPerCan = getCanCupSipsPerCan(party);
        const player = updatedPlayers.find(p => p.id === playerId);
        const target = updatedPlayers.find(p => p.id === targetId);

        if (!player) throw new Error('Player not found');
        if (!target) throw new Error('Target not found');

        if (gameMode === 'can-cup') {
          const cardIndex = player.cards.findIndex(c => c.id === card.id);
          if (cardIndex === -1) {
            throw new Error('Card not found in player hand');
          }

          const normalizedPendingCanCupSips = normalizePendingCanCupSips(party.pendingCanCupSips);
          const canCupResult = applyCanCupCardEffect({
            card,
            player,
            target,
            updatedPlayers,
            sipsPerCan: canCupSipsPerCan,
            playerId,
            pendingCanCupSips: normalizedPendingCanCupSips,
          });

          player.cards[cardIndex] = drawNewCard(gameMode);
          const actionTargetId = canCupResult.resolvedTargetId ?? targetId;

          transaction.update(partyRef, {
            players: updatedPlayers,
            pendingCanCupSips: toPendingCanCupSipsField(canCupResult.pendingCanCupSips),
            lastAction: buildLastActionPayload({
              beforeStats,
              updatedPlayers,
              playerId,
              targetId: actionTargetId,
              cardId: card.id,
              cardName: card.name,
              cardType: card.effect.type,
              cardRarity: card.rarity,
              cardDescription: card.description,
              manaCost: card.manaCost,
              targetDamageOverride: canCupResult.targetSipCommand,
              targetManaDeltaOverride: canCupResult.targetSipCommand > 0 ? -canCupResult.targetSipCommand : 0,
              targetManaIntakeDeltaOverride: 0,
              affectedPlayerIdsOverride: canCupResult.affectedPlayerIds,
            }),
          });

          // Check Can Cup winner after card effect
          const canCupWinnerId = checkCanCupWinner(updatedPlayers, getCanCupCansToWin(party));
          if (canCupWinnerId) {
            transaction.update(partyRef, { status: 'finished', winner: canCupWinnerId });
          }
          return;
        }

        // Enhance the card before applying the effect
        const enhancedCard = cardEnhancer.enhanceCard(card);

        // Apply mana cost
        player.mana = Math.max(0, player.mana - enhancedCard.manaCost);

        // Replace used card
        const cardIndex = player.cards.findIndex(c => c.id === enhancedCard.id);
        if (cardIndex !== -1) {
          player.cards[cardIndex] = drawNewCard(gameMode);
        }

        // Apply the effect
        try {
          switch (enhancedCard.effect.type) {
            case 'damage':
              target.mana = Math.max(0, target.mana - enhancedCard.effect.value);
              break;

            case 'aoeDamage':
              updatedPlayers.forEach(p => {
                p.mana = Math.max(0, p.mana - enhancedCard.effect.value);
              });
              break;


            case 'heal':
              const maxMana = party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA;
              target.mana = Math.min(maxMana, target.mana + enhancedCard.effect.value);
              break;

            case 'mana': {
              const manaValue = enhancedCard.effect.value;
              const manaCap = party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA;
              const isAoeMana = enhancedCard.type === 'aoe' || enhancedCard.type === 'aoe-damage';

              if (isAoeMana) {
                updatedPlayers.forEach((entry) => {
                  entry.mana = Math.min(manaCap, Math.max(0, entry.mana + manaValue));
                });
              } else {
                target.mana = Math.min(manaCap, Math.max(0, target.mana + manaValue));
              }
              break;
            }

            case 'manaTransfer': {
              const transferAmount = Math.min(player.mana, Math.max(0, enhancedCard.effect.value));
              player.mana = Math.max(0, player.mana - transferAmount);
              target.mana = Math.min(
                party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA,
                target.mana + transferAmount
              );
              break;
            }

            case 'manaIntake': {
              const isAoeIntake = enhancedCard.type === 'aoe' || enhancedCard.type === 'aoe-damage';
              if (isAoeIntake) {
                updatedPlayers.forEach((entry) => {
                  entry.manaIntake = Math.max(0, (entry.manaIntake || 0) + enhancedCard.effect.value);
                });
              } else {
                target.manaIntake = Math.max(0, (target.manaIntake || 0) + enhancedCard.effect.value);
              }
              break;
            }


            case 'life-steal':
              let enemyMana = target.mana;
              target.mana = player.mana;
              player.mana = enemyMana;
              break;


            case 'manaDrain': {
              const shieldIndex = target.effects?.findIndex((effect) => effect.stackId === 'manaShield') ?? -1;
              if (shieldIndex >= 0) {
                target.effects = (target.effects || []).filter((_, idx) => idx !== shieldIndex);
                break;
              }
              const drainAmount = Math.min(target.mana, enhancedCard.effect.value);
              target.mana -= drainAmount;
              player.mana = Math.min(
                party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA,
                player.mana + drainAmount
              );
              break;
            }

            case 'manaBurn':
              const burnAmount = Math.ceil(target.mana / 2);
              target.mana = Math.max(0, target.mana - burnAmount);
              target.manaIntake = (target.manaIntake || 0) + burnAmount;
              break;

            case 'reversed-curse-tech':
              player.mana = Math.min(party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA, player.mana + target.mana / 2);
              break;


            case 'manaRefill':
              player.mana = Math.min(
                party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA,
                player.mana + enhancedCard.effect.value
              );
              if (card.id === 'bar-tab') {
                player.manaIntake = Math.max(0, (player.manaIntake || 0) + 1);
              }
              break;


            case 'potionBuff':
              effectManager.addPotionEffect({
                type: 'buff',
                value: enhancedCard.effect.value,
                duration: { turnsLeft: 3, initialDuration: 3 },
                source: card.id,
              });
              break;

            case 'debuff':
              effectManager.addPotionEffect({
                type: 'debuff',
                value: enhancedCard.effect.value,
                duration: { turnsLeft: 3, initialDuration: 3 },
                source: card.id,
              });
              break;

            case 'roulette':
              target.manaIntake = (target.manaIntake || 0) + enhancedCard.effect.value;
              const randomTarget = updatedPlayers[Math.floor(Math.random() * updatedPlayers.length)];
              randomTarget.manaIntake = (randomTarget.manaIntake || 0) + enhancedCard.effect.value;
              break;

            case 'forceDrink':
              const drinkAmount = party.settings?.manaDrinkAmount ?? GAME_CONFIG.MANA_DRINK_AMOUNT;
              target.mana = Math.min(
                party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA,
                target.mana + drinkAmount
              );
              target.manaIntake = (target.manaIntake || 0) + drinkAmount;
              break;

            case 'energi_i_rummet':
              target.manaIntake = (target.manaIntake || 0) + enhancedCard.effect.value;
              player.manaIntake = (player.manaIntake || 0) + enhancedCard.effect.value;
              break;

            // Custom Legendary Cards

            case 'oskar':
              updatedPlayers.forEach(p => {
                if (p.id !== playerId) {
                  p.mana = p.mana / 2;
                }
              });

              new Audio("/audio/oskar2.mp3").play().catch(e => console.error("Audio playback failed:", e));
              new Audio("/audio/oskar.mp3").play().catch(e => console.error("Audio playback failed:", e));
              break;

            case 'jesper': {
              if (Math.random() <= 0.80) {
                player.mana = party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA;
              }

              Promise.all([
                new Audio("/audio/jesper.mp3").play(),
                new Audio("/audio/jesper2.mp3").play()
              ]).catch(e => console.error("Audio playback failed:", e));

              break;
            }

            // Fellan is a challenge card — see challengeEffects.ts

            case 'markus': {
              const legendaryCard1 = drawLegendaryCard();
              const legendaryCard2 = drawLegendaryCard();
              const legendaryCard3 = drawLegendaryCard();
              player.cards.push(legendaryCard1, legendaryCard2, legendaryCard3);

              Promise.all([
                new Audio("/audio/hub.mp3").play(),
                new Audio("/audio/vafangorumannen.mp3").play()
              ]).catch(e => console.error("Audio playback failed:", e));

              break;
            }

            case 'sam': {
              const alivePlayersCount = updatedPlayers.length;
              effectManager.addPotionEffect({
                stackId: 'untargetable',
                type: 'untargetable',
                value: 0,
                duration: { turnsLeft: alivePlayersCount * 2, initialDuration: alivePlayersCount * 2 },
                source: card.id,
              });
              break;
            }

            case 'adam': {
              const targetEnemies = updatedPlayers.filter(p => p.id !== playerId);

              targetEnemies.forEach(enemy => {
                const legendaryCards = enemy.cards.filter(card => card.isLegendary);
                enemy.cards = enemy.cards.filter(card => !card.isLegendary);
                legendaryCards.forEach(() => {
                  enemy.cards.push(drawNewCard(gameMode));
                });

                const playerLegendaryCount = player.cards.filter(card => card.isLegendary).length;
                enemy.mana = Math.max(0, enemy.mana - (playerLegendaryCount + 1));
              });

              new Audio("/audio/meow.mp3").play().catch(e => console.error("Audio playback failed:", e));
              break;
            }


            case 'said': {
              const targetEnemies = updatedPlayers.filter(p => p.id !== playerId);
              targetEnemies.forEach(enemy => {
                enemy.mana = 1;
              });
              break;
            }

            case 'manaShield':
              player.effects = [
                ...(player.effects || []).filter((effect) => effect.stackId !== 'manaShield'),
                {
                  stackId: 'manaShield',
                  type: 'buff',
                  value: 1,
                  duration: 1,
                },
              ];
              break;

            case 'manaIntakeMultiplier':
              target.manaIntake = Math.max(0, (target.manaIntake || 0) * enhancedCard.effect.value);
              break;

            case 'manaIntakeMultiply':
              target.manaIntake = Math.max(0, (target.manaIntake || 0) * enhancedCard.effect.value);
              break;

            case 'manaIntakeReduction':
              target.manaIntake = Math.max(0, (target.manaIntake || 0) * (1 - enhancedCard.effect.value));
              break;

            case 'increaseIntake':
              target.manaIntake = (target.manaIntake || 0) + enhancedCard.effect.value;
              break;

            case 'manaOverload':
              target.mana = Math.min(
                party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA,
                target.mana + 2
              );
              target.manaIntake = (target.manaIntake || 0) + enhancedCard.effect.value;
              break;

            case 'resetIntake':
              target.manaIntake = 0;
              break;

            case 'soberingPotion':
              if (enhancedCard.effect.value <= 0) {
                player.manaIntake = 0;
              } else {
                player.manaIntake = Math.max(0, (player.manaIntake || 0) - enhancedCard.effect.value);
              }
              break;

            case 'goldenLiver':
              player.mana = Math.min(
                party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA,
                player.mana + enhancedCard.effect.value
              );
              player.manaIntake = Math.max(0, (player.manaIntake || 0) * 0.2);
              break;

            case 'divineSobriety':
              player.manaIntake = 0;
              player.mana = Math.min(
                party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA,
                player.mana + enhancedCard.effect.value
              );
              break;

            case 'manaSwapAny':
              // Handled in challenge resolution
              break;

            case 'manaStealAny':
              // Handled in challenge resolution
              break;

            case 'manaExplosion':
              updatedPlayers.forEach(p => {
                if (p.id !== playerId) { // Apply to everyone except the caster
                  p.mana = Math.min(
                    party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA,
                    p.mana + enhancedCard.effect.value
                  );
                  p.manaIntake = (p.manaIntake || 0) + 2; // Fixed +2 intake for everyone
                }
              });
              break;

            case 'aoeManaBurst':
              updatedPlayers.forEach(p => {
                if (p.id !== playerId) { // Apply to everyone except the caster
                  p.mana = Math.min(
                    party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA,
                    p.mana + enhancedCard.effect.value
                  );
                  p.manaIntake = (p.manaIntake || 0) + 4; // Higher intake for legendary effect
                }
              });
              break;

            case 'manaHurricane':
              // Get all current mana and intake values
              const allMana = updatedPlayers.map(p => p.mana);
              const allIntake = updatedPlayers.map(p => p.manaIntake || 0);

              // Shuffle them
              for (let i = allMana.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allMana[i], allMana[j]] = [allMana[j], allMana[i]];
              }

              for (let i = allIntake.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allIntake[i], allIntake[j]] = [allIntake[j], allIntake[i]];
              }

              // Reassign them
              updatedPlayers.forEach((p, index) => {
                p.mana = allMana[index];
                p.manaIntake = allIntake[index];
              });
              break;

            case 'manaDouble':
              player.mana = Math.min(
                party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA,
                player.mana * 2
              );
              player.manaIntake = Math.max(0, (player.manaIntake || 0) + enhancedCard.effect.value);
              break;

            case 'manaIntakeOthers':
              updatedPlayers.forEach((entry) => {
                if (entry.id !== playerId) {
                  entry.manaIntake = Math.max(0, (entry.manaIntake || 0) + enhancedCard.effect.value);
                }
              });
              break;

            case 'drunkTimer': {
              const deltaSeconds = Math.round(enhancedCard.effect.value);
              const isAoeTimer = enhancedCard.type === 'aoe' || enhancedCard.type === 'aoe-damage';
              if (isAoeTimer) {
                updatedPlayers.forEach((entry) => {
                  entry.drunkSeconds = Math.max(0, Math.round((entry.drunkSeconds || 0) + deltaSeconds));
                });
              } else {
                target.drunkSeconds = Math.max(0, Math.round((target.drunkSeconds || 0) + deltaSeconds));
              }
              break;
            }

            case 'drunkTimerShift': {
              const shiftSeconds = Math.max(0, Math.round(enhancedCard.effect.value));
              target.drunkSeconds = Math.max(0, Math.round((target.drunkSeconds || 0) + shiftSeconds));
              const candidates = updatedPlayers.filter((entry) => entry.id !== target.id);
              if (candidates.length > 0) {
                const randomBeneficiary = candidates[Math.floor(Math.random() * candidates.length)];
                randomBeneficiary.drunkSeconds = Math.max(
                  0,
                  Math.round((randomBeneficiary.drunkSeconds || 0) - shiftSeconds)
                );
              }
              break;
            }

            case 'drunkestTimer': {
              const sortedByDrunkness = [...updatedPlayers].sort((left, right) => {
                const leftDrunkSeconds = left.drunkSeconds || 0;
                const rightDrunkSeconds = right.drunkSeconds || 0;
                if (leftDrunkSeconds !== rightDrunkSeconds) {
                  return rightDrunkSeconds - leftDrunkSeconds;
                }
                return (right.manaIntake || 0) - (left.manaIntake || 0);
              });

              const drunkestPlayer = sortedByDrunkness[0];
              if (drunkestPlayer) {
                drunkestPlayer.drunkSeconds = Math.max(
                  0,
                  Math.round((drunkestPlayer.drunkSeconds || 0) + enhancedCard.effect.value)
                );
              }
              break;
            }

            case 'leastDrunkForceDrink': {
              const sortedBySobriety = [...updatedPlayers].sort((left, right) => {
                const leftDrunkSeconds = left.drunkSeconds || 0;
                const rightDrunkSeconds = right.drunkSeconds || 0;
                if (leftDrunkSeconds !== rightDrunkSeconds) {
                  return leftDrunkSeconds - rightDrunkSeconds;
                }
                return (left.manaIntake || 0) - (right.manaIntake || 0);
              });

              const leastDrunkPlayer = sortedBySobriety[0];
              if (leastDrunkPlayer) {
                const forcedDrinkAmount = party.settings?.manaDrinkAmount ?? GAME_CONFIG.MANA_DRINK_AMOUNT;
                leastDrunkPlayer.mana = Math.min(
                  party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA,
                  leastDrunkPlayer.mana + forcedDrinkAmount
                );
                leastDrunkPlayer.manaIntake = Math.max(
                  0,
                  (leastDrunkPlayer.manaIntake || 0) + forcedDrinkAmount
                );
              }
              break;
            }

            case 'setAllToDrunk': {
              const threshold = party.settings?.drunkThreshold ?? GAME_CONFIG.DRUNK_THRESHOLD;
              updatedPlayers.forEach((entry) => {
                entry.manaIntake = threshold;
              });
              break;
            }

            case 'maxMana':
              player.mana = Math.min(
                (party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA) + enhancedCard.effect.value,
                player.mana + enhancedCard.effect.value
              );
              break;

            case 'maxManaAndMana':
              player.mana = Math.min(
                (party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA) + enhancedCard.effect.value,
                player.mana + enhancedCard.effect.value
              );
              break;

            case 'manaStealAll': {
              let stolen = 0;
              updatedPlayers.forEach((entry) => {
                if (entry.id === playerId) return;
                const taken = Math.min(entry.mana, enhancedCard.effect.value);
                entry.mana = Math.max(0, entry.mana - taken);
                stolen += taken;
              });
              player.mana = Math.min(
                party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA,
                player.mana + stolen
              );
              break;
            }

            case 'divineIntervention':
              updatedPlayers.forEach((entry) => {
                entry.manaIntake = 0;
                entry.mana = Math.min(
                  party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA,
                  entry.mana + enhancedCard.effect.value
                );
              });
              break;

            case 'drunkestPlayerDamage': {
              const drunkestPlayer = [...updatedPlayers]
                .sort((a, b) => (b.manaIntake || 0) - (a.manaIntake || 0))[0];
              if (drunkestPlayer) {
                drunkestPlayer.mana = Math.max(0, drunkestPlayer.mana + enhancedCard.effect.value);
              }
              break;
            }

            case 'fellan':
            case 'infiniteVoid':
            case 'titan':
              // Challenge or legacy legendary effects are resolved outside this switch.
              break;

            case 'partyMaster':
              // Handled in the UI with a custom modal
              break;
          }

        } catch (effectError) {
          console.error('Error applying card effect:', effectError);
          throw new Error('Failed to apply card effect');
        }

        // Check if any player is drunk (over the threshold)
        const drunkThreshold = party.settings?.drunkThreshold ?? GAME_CONFIG.DRUNK_THRESHOLD;
        updatedPlayers.forEach(p => {
          p.isDrunk = (p.manaIntake || 0) >= drunkThreshold * 0.8;
        });

        const updatePayload: Partial<Party> & { lastAction: NonNullable<Party['lastAction']> } = {
          players: updatedPlayers,
          drunkTimerLastSyncedAt: Date.now(),
          lastAction: buildLastActionPayload({
            beforeStats,
            updatedPlayers,
            playerId,
            targetId,
            cardId: card.id,
            cardName: card.name,
            cardType: enhancedCard.effect.type,
            cardRarity: card.rarity,
            cardDescription: card.description,
            manaCost: enhancedCard.manaCost,
          }),
        };

        if (isAfterskiMode(gameMode)) {
          const drunkTimeLimitSeconds = Math.max(
            1,
            Math.round(party.settings?.drunkTimeLimitSeconds ?? GAME_CONFIG.DRUNK_TIME_LIMIT_SECONDS)
          );
          const hasReachedDrunkTimeLimit = updatedPlayers.some(
            (entry) => (entry.drunkSeconds || 0) >= drunkTimeLimitSeconds
          );
          if (hasReachedDrunkTimeLimit) {
            const winnerPool = updatedPlayers.filter(
              (entry) => (entry.drunkSeconds || 0) < drunkTimeLimitSeconds
            );
            const rankingPool = winnerPool.length > 0 ? winnerPool : updatedPlayers;
            const winner = [...rankingPool].sort((left, right) => {
              const leftDrunkSeconds = left.drunkSeconds || 0;
              const rightDrunkSeconds = right.drunkSeconds || 0;
              if (leftDrunkSeconds !== rightDrunkSeconds) return leftDrunkSeconds - rightDrunkSeconds;
              if ((left.manaIntake || 0) !== (right.manaIntake || 0)) {
                return (left.manaIntake || 0) - (right.manaIntake || 0);
              }
              return right.mana - left.mana;
            })[0];
            if (winner) {
              updatePayload.status = 'finished';
              updatePayload.winner = winner.id;
            }
          }
        }

        transaction.update(partyRef, updatePayload);
      });

      // End turn and decay mana intake
      await endTurn(playerId);

      return true;
    } catch (error) {
      console.error('Error applying card effect:', error);
      throw error;
    }
  }, [partyId, cardEnhancer, effectManager, endTurn]);

  // Resolve a challenge card
  const resolveChallengeCard = useCallback(async (playerId: string, winnerId: string, loserId: string, card?: Card) => {
    if (!playerId || !winnerId || !loserId) {
      throw new Error('Missing required parameters for challenge resolution');
    }

    const partyRef = doc(db, 'parties', partyId);

    try {
      await runTransaction(db, async (transaction) => {
        const partyDoc = await transaction.get(partyRef);
        if (!partyDoc.exists()) {
          throw new Error('Party not found');
        }

        const party = partyDoc.data() as Party;
        if (party.currentTurn !== playerId) {
          throw new Error('Not player\'s turn');
        }
        if (party.pendingChallenge && party.pendingChallenge.playerId !== playerId) {
          throw new Error('Only the challenge owner can resolve this challenge');
        }

        const challengeCard = card ?? party.pendingChallenge?.card;
        if (!challengeCard) {
          throw new Error('Challenge card data is missing');
        }
        if (!isChallengeCard(challengeCard)) {
          console.error('Challenge effects not defined for this card:', challengeCard);
          throw new Error('Challenge effects not defined for this card: ' + challengeCard.name);
        }

        const updatedPlayers = [...party.players];
        const beforeStats = snapshotPlayerStats(updatedPlayers);
        const gameMode = getGameMode(party);
        const canCupSipsPerCan = getCanCupSipsPerCan(party);
        const winner = updatedPlayers.find(p => p.id === winnerId);
        const loser = updatedPlayers.find(p => p.id === loserId);

        // Validate participants
        const validation = validateChallengeParticipants(winnerId, loserId, updatedPlayers);
        if (!validation.isValid) {
          throw new Error(validation.error);
        }

        if (!winner || !loser) {
          throw new Error('Winner or loser not found');
        }

        if (party.pendingChallenge?.duelistOneId && party.pendingChallenge?.duelistTwoId) {
          const allowed = new Set([party.pendingChallenge.duelistOneId, party.pendingChallenge.duelistTwoId]);
          if (!allowed.has(winnerId) || !allowed.has(loserId)) {
            throw new Error('Winner and loser must be selected from the chosen duelists');
          }
        }

        const challengeOwner = updatedPlayers.find(p => p.id === playerId);
        if (!challengeOwner) {
          throw new Error('Challenge owner not found');
        }
        if (!party.pendingChallenge && gameMode !== 'can-cup') {
          if (challengeOwner.mana < challengeCard.manaCost) {
            throw new Error('Not enough mana for challenge card');
          }
          challengeOwner.mana = Math.max(0, challengeOwner.mana - challengeCard.manaCost);
        }

        let winnerEffect;
        let loserEffect;
        const maxMana = party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA;
        let challengeTargetSipCount = 0;
        const affectedPlayers = new Set<string>();
        let nextPendingCanCupSips = normalizePendingCanCupSips(party.pendingCanCupSips);

        try {
          if (challengeCard.effect.winnerEffect && challengeCard.effect.loserEffect) {
            winnerEffect = challengeCard.effect.winnerEffect;
            loserEffect = challengeCard.effect.loserEffect;
          } else if (challengeCard.effect.challenge?.winnerEffect && challengeCard.effect.challenge?.loserEffect) {
            winnerEffect = challengeCard.effect.challenge.winnerEffect;
            loserEffect = challengeCard.effect.challenge.loserEffect;
          } else if (challengeCard.effect.challengeEffects?.winner && challengeCard.effect.challengeEffects?.loser) {
            winnerEffect = challengeCard.effect.challengeEffects.winner;
            loserEffect = challengeCard.effect.challengeEffects.loser;
          } else {
            // Fallback for cards with non-standard effects
            switch (challengeCard.id) {
              case 'ol-havf':
                winnerEffect = { type: 'mana', value: 5 };
                loserEffect = { type: 'manaIntake', value: 10 };
                break;
              case 'got-big-muscles':
                winnerEffect = { type: 'mana', value: 3 };
                loserEffect = { type: 'manaBurn', value: 4 };
                break;
              case 'shot-contest':
                winnerEffect = { type: 'mana', value: 2 };
                loserEffect = { type: 'manaIntake', value: 6 };
                break;
              case 'shot-master':
                winnerEffect = { type: 'resetManaIntake', value: 0 };
                loserEffect = { type: 'manaIntakeMultiply', value: 2 };
                break;
              default:
                if (isNamingChallengeCard(challengeCard)) {
                  // 'Name the most' cards
                  const value = 5; // Default value for naming challenges
                  winnerEffect = { type: 'manaStealer', value: value };
                  loserEffect = { type: 'manaBurn', value: value };
                } else {
                  console.error('Unable to determine challenge effects for card', challengeCard);
                  throw new Error('Unable to determine challenge effects for card: ' + challengeCard.name);
                }
            }
          }

          if (gameMode === 'can-cup') {
            const queueChallengeSips = (
              targetPlayerId: string,
              sipCount: number
            ) => {
              const totalSipsToQueue = Math.max(0, Math.round(sipCount));
              if (totalSipsToQueue <= 0) return 0;

              const existing = nextPendingCanCupSips[targetPlayerId];
              const existingTotal = existing?.totalSips ?? 0;
              nextPendingCanCupSips[targetPlayerId] = {
                targetPlayerId,
                totalSips: existingTotal + totalSipsToQueue,
                beerSipsToConsume: existing?.beerSipsToConsume ?? 0,
                waterSipsToConsume: existing?.waterSipsToConsume ?? 0,
                deflectSipsToConsume: existing?.deflectSipsToConsume ?? 0,
                sourcePlayerId: playerId,
                sourceCardId: challengeCard.id,
                sourceCardName: challengeCard.name,
                updatedAt: Date.now(),
              };

              nextPendingCanCupSips = recalculatePendingCanCupSips(nextPendingCanCupSips, updatedPlayers, canCupSipsPerCan);
              affectedPlayers.add(targetPlayerId);
              return totalSipsToQueue;
            };

            const applyCanCupChallengeEffect = (
              effectTarget: Party['players'][number],
              effect: { type: string; value: number } | undefined
            ) => {
              if (!effect) return 0;

              switch (effect.type) {
                case 'canCupSip':
                  return queueChallengeSips(effectTarget.id, effect.value);
                case 'canCupTopUp':
                  topUpSips(effectTarget, effect.value, canCupSipsPerCan);
                  affectedPlayers.add(effectTarget.id);
                  nextPendingCanCupSips = recalculatePendingCanCupSips(nextPendingCanCupSips, updatedPlayers, canCupSipsPerCan);
                  return 0;
                case 'canCupWater':
                  addWaterSips(effectTarget, effect.value, canCupSipsPerCan);
                  affectedPlayers.add(effectTarget.id);
                  nextPendingCanCupSips = recalculatePendingCanCupSips(nextPendingCanCupSips, updatedPlayers, canCupSipsPerCan);
                  return 0;
                case 'canCupDeflect':
                  addDeflectCharges(effectTarget, effect.value, canCupSipsPerCan);
                  affectedPlayers.add(effectTarget.id);
                  nextPendingCanCupSips = recalculatePendingCanCupSips(nextPendingCanCupSips, updatedPlayers, canCupSipsPerCan);
                  return 0;
                case 'null':
                default:
                  return 0;
              }
            };

            applyCanCupChallengeEffect(winner, winnerEffect);
            challengeTargetSipCount = applyCanCupChallengeEffect(loser, loserEffect);
          } else {
            if (winnerEffect?.type === 'manaStealer') {
              const stealAmount = Math.min(loser.mana, winnerEffect.value);
              loser.mana = Math.max(0, loser.mana - stealAmount);
              winner.mana = Math.min(maxMana, winner.mana + stealAmount);
              winnerEffect = { type: 'null', value: 0 };
              if (loserEffect?.type === 'manaBurn') {
                loserEffect = { type: 'null', value: 0 };
              }
            }

            // Apply effects to winner and loser
            const winnerResult = applyChallengeEffect(winner, winnerEffect, maxMana, challengeCard);
            const loserResult = applyChallengeEffect(loser, loserEffect, maxMana, challengeCard);

            Object.assign(winner, winnerResult);
            Object.assign(loser, loserResult);
          }
        } catch (effectError) {
          console.error('Error applying challenge effects', effectError);
          throw new Error('Failed to apply challenge effects: ' + effectError.message);
        }

        const player = updatedPlayers.find(p => p.id === playerId);
        if (!player) {
          throw new Error('Player not found');
        }

        const cardIndex = player.cards.findIndex(c => c.id === challengeCard.id);
        if (cardIndex === -1) {
          throw new Error('Card not found in player\'s hand');
        }

        player.cards[cardIndex] = drawNewCard(gameMode);

        if (gameMode !== 'can-cup') {
          const drunkThreshold = party.settings?.drunkThreshold ?? GAME_CONFIG.DRUNK_THRESHOLD;
          updatedPlayers.forEach(p => {
            p.isDrunk = (p.manaIntake || 0) >= drunkThreshold * 0.8;
          });
        }

        // Update Firestore with challenge results
        const updatePayload: Partial<Party> = {
          players: updatedPlayers,
          drunkTimerLastSyncedAt: gameMode === 'can-cup' ? party.drunkTimerLastSyncedAt : Date.now(),
          pendingCanCupSips: gameMode === 'can-cup'
            ? toPendingCanCupSipsField(nextPendingCanCupSips)
            : party.pendingCanCupSips ?? null,
          lastAction: buildLastActionPayload({
            beforeStats,
            updatedPlayers,
            playerId: winnerId,
            targetId: loserId,
            cardId: challengeCard.id,
            cardName: challengeCard.name,
            cardType: challengeCard.effect.type,
            cardRarity: challengeCard.rarity,
            cardDescription: challengeCard.description,
            manaCost: challengeCard.manaCost,
            targetDamageOverride: gameMode === 'can-cup' ? challengeTargetSipCount : undefined,
            targetManaDeltaOverride: gameMode === 'can-cup' ? (challengeTargetSipCount > 0 ? -challengeTargetSipCount : 0) : undefined,
            targetManaIntakeDeltaOverride: gameMode === 'can-cup' ? 0 : undefined,
            affectedPlayerIdsOverride: gameMode === 'can-cup'
              ? Array.from(new Set([...affectedPlayers, winner.id, loser.id]))
              : undefined,
          }),
        };
        if (party.pendingChallenge) {
          updatePayload.pendingChallenge = null;
        }

        transaction.update(partyRef, {
          ...updatePayload,
        });


      });

      // End turn and decay mana intake
      await endTurn(playerId);

      return true;
    } catch (error) {
      console.error('Error resolving challenge:', error);
      throw error;
    }
  }, [partyId, endTurn]);

  const resolveCanCupSips = useCallback(async (playerId: string) => {
    const partyRef = doc(db, 'parties', partyId);

    try {
      await runTransaction(db, async (transaction) => {
        const partyDoc = await transaction.get(partyRef);
        if (!partyDoc.exists()) throw new Error('Party not found');
        const party = partyDoc.data() as Party;
        if (getGameMode(party) !== 'can-cup') return;

        const pendingCanCupSips = normalizePendingCanCupSips(party.pendingCanCupSips);
        const resolution = pendingCanCupSips[playerId];
        if (!resolution || resolution.totalSips <= 0) return;

        const updatedPlayers = party.players.map((player) => ({ ...player }));
        const targetPlayer = updatedPlayers.find((player) => player.id === playerId);
        if (!targetPlayer) return;

        applyForcedSips(targetPlayer, resolution.totalSips, getCanCupSipsPerCan(party));
        delete pendingCanCupSips[playerId];

        const recalculatedPendingCanCupSips = recalculatePendingCanCupSips(
          pendingCanCupSips,
          updatedPlayers,
          getCanCupSipsPerCan(party)
        );

        transaction.update(partyRef, {
          players: updatedPlayers,
          pendingCanCupSips: toPendingCanCupSipsField(recalculatedPendingCanCupSips),
        });

        // Check for Can Cup winner
        const cansToWin = getCanCupCansToWin(party);
        const winnerId = checkCanCupWinner(updatedPlayers, cansToWin);
        if (winnerId) {
          transaction.update(partyRef, {
            status: 'finished',
            winner: winnerId,
          });
        }
      });
      return true;
    } catch (error) {
      console.error('Error resolving Can Cup sips:', error);
      throw error;
    }
  }, [partyId]);

  // Drink mana
  const drinkMana = useCallback(async (playerId: string) => {
    const partyRef = doc(db, 'parties', partyId);

    try {
      await runTransaction(db, async (transaction) => {
        const partyDoc = await transaction.get(partyRef);
        if (!partyDoc.exists()) throw new Error('Party not found');
        const party = partyDoc.data() as Party;
        const gameMode = getGameMode(party);
        const canCupSipsPerCan = getCanCupSipsPerCan(party);

        const beforeStats = snapshotPlayerStats(party.players);

        const updatedPlayers = party.players.map(player => ({ ...player }));
        const actingPlayer = updatedPlayers.find((entry) => entry.id === playerId);
        if (!actingPlayer) {
          throw new Error('Player not found');
        }

        let targetDamageOverride: number | undefined;

        if (gameMode === 'can-cup') {
          const directSipResult = applyDirectSips(actingPlayer, 1, canCupSipsPerCan);
          targetDamageOverride = directSipResult.appliedSips;
        } else {
          const manaGain = (party.settings?.manaDrinkAmount ?? GAME_CONFIG.MANA_DRINK_AMOUNT) *
            (actingPlayer.potionMultiplier?.value ?? 1);
          const newManaIntake = (actingPlayer.manaIntake || 0) + manaGain;
          const drunkThreshold = party.settings?.drunkThreshold ?? GAME_CONFIG.DRUNK_THRESHOLD;

          actingPlayer.mana = Math.min(
            party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA,
            actingPlayer.mana + manaGain
          );
          actingPlayer.manaIntake = newManaIntake;
          actingPlayer.isDrunk = newManaIntake >= drunkThreshold * 0.8;
        }

        transaction.update(partyRef, {
          players: updatedPlayers,
          drunkTimerLastSyncedAt: gameMode === 'can-cup' ? party.drunkTimerLastSyncedAt : Date.now(),
          lastAction: buildLastActionPayload({
            beforeStats,
            updatedPlayers,
            playerId,
            targetId: playerId,
            cardId: 'drink',
            cardName: gameMode === 'can-cup' ? 'Manual Sip' : 'Drink Potion',
            cardType: gameMode === 'can-cup' ? 'canCupSip' : 'forceDrink',
            cardRarity: 'common',
            cardDescription: gameMode === 'can-cup'
              ? 'Log one sip from your active can.'
              : `Drink ${party.settings?.manaDrinkAmount ?? GAME_CONFIG.MANA_DRINK_AMOUNT} mana.`,
            manaCost: 0,
            targetDamageOverride,
            targetManaDeltaOverride: gameMode === 'can-cup' ? (targetDamageOverride ? -targetDamageOverride : 0) : undefined,
            targetManaIntakeDeltaOverride: gameMode === 'can-cup' ? 0 : undefined,
            affectedPlayerIdsOverride: [playerId],
          }),
        });
      });
      return true;
    } catch (error) {
      console.error('Error drinking mana:', error);
      throw error;
    }
  }, [partyId]);

  const godModeSwapCard = useCallback(async (playerId: string, oldCardId: string, newCardBase: import('../types/cards').CardBase) => {
    const partyRef = doc(db, 'parties', partyId);
    try {
      await runTransaction(db, async (transaction) => {
        const partyDoc = await transaction.get(partyRef);
        if (!partyDoc.exists()) throw new Error('Party not found');
        const party = partyDoc.data() as Party;
        if (!party.settings?.godMode) throw new Error('God Mode is not enabled');

        const updatedPlayers = party.players.map(p => ({ ...p, cards: [...p.cards] }));
        const player = updatedPlayers.find(p => p.id === playerId);
        if (!player) throw new Error('Player not found');

        const cardIndex = player.cards.findIndex(c => c.id === oldCardId);
        if (cardIndex === -1) throw new Error('Card not found in hand');

        const newId = `gm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        player.cards[cardIndex] = { ...newCardBase, id: newId };

        transaction.update(partyRef, { players: updatedPlayers });
      });
      return true;
    } catch (error) {
      console.error('Error swapping card (God Mode):', error);
      throw error;
    }
  }, [partyId]);

  return {
    applyCardEffect,
    startChallengeCard,
    setReactionChallengeReady,
    pressReactionChallenge,
    resolveChallengeCard,
    resolveCanCupSips,
    drinkMana,
    godModeSwapCard,
  };
}
