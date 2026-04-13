import { useCallback } from 'react';
import { doc, runTransaction } from 'firebase/firestore';
import { db, serverNow } from '../lib/firebase';
import {
  Card,
  GameAction,
  GameActionSegment,
  GameMode,
  Party,
  PendingCanCupFollowUp,
  PendingCanCupReplacementChoice,
  PendingCanCupSipResolution,
  Player,
  isAfterskiMode,
} from '../types/game';
import { CardRarity } from '../types/cards';
import { GAME_CONFIG } from '../config/gameConfig';
import { drawCardByRarity, drawLegendaryCard, drawNewCard } from '../utils/cardGeneration';
import { validateChallengeParticipants, applyChallengeEffect } from '../utils/challengeEffects';
import { isChallengeCard, isNamingChallengeCard } from '../utils/challengeCard';
import { CardEnhancer } from '../utils/cardEnhancer';
import { EffectManager } from '../utils/effectManager';
import {
  addWaterSips,
  applyDirectSips,
  applyForcedSips,
  canCupGiveEmptyCan,
  canCupRemoveDefense,
  getReducedTargetedSipCount,
  getPlayersWithFewestEmptyCans,
  sanitizeSipsPerCan,
  swapSipsLeft,
  topUpSips,
} from '../utils/canCupMechanics';
import {
  isCanCupReactionChallengeCard,
  isCanCupRandomOpponentChallengeCard,
  isCanCupNoSetupChallengeCard
} from '../utils/canCupChallengeHelpers';
import { CAN_CUP_CATEGORIES, CAN_CUP_TONGUE_TWISTERS } from '../config/cards/pools/canCup';

export function useGameActions(partyId: string) {
  const effectManager = new EffectManager();
  const cardEnhancer = new CardEnhancer(effectManager);
  const getGameMode = (party: Party): GameMode => party.gameMode ?? 'classic';
  const getCanCupSipsPerCan = (party: Party): number =>
    sanitizeSipsPerCan(party.settings?.canCupSipsPerCan ?? GAME_CONFIG.CAN_CUP_SIPS_PER_CAN);
  const getCanCupCansToWin = (party: Party): number =>
    party.settings?.canCupCansToWin ?? 5;
  const getCanCupPlayCost = (card: Pick<Card, 'manaCost' | 'sipCost'>): number =>
    Math.max(0, Math.round(card.sipCost ?? card.manaCost ?? 0));
  const checkCanCupWinner = (players: Party['players'], cansToWin: number): string | null => {
    const winner = players.find(p => (p.canCup?.emptyCans ?? 0) >= cansToWin);
    return winner?.id ?? null;
  };
  const isCanCupCategoryChallenge = (card: Card): boolean =>
    card.id === 'cc-category-random' ||
    /^kategori\b/i.test(card.name) ||
    /nämn saker inom/i.test(card.description);
  const getChallengeCardForPendingState = (card: Card, gameMode: GameMode): Card => {
    if (gameMode !== 'can-cup') return card;

    // Tungvrickaren
    if (card.name === 'Tungvrickaren' && !card.description.includes('felfritt: "')) {
      const twister = CAN_CUP_TONGUE_TWISTERS[Math.floor(Math.random() * CAN_CUP_TONGUE_TWISTERS.length)];
      return {
        ...card,
        description: `Läs denna felfritt: "${twister}"\nStakar du dig tar du 3 klunkar.`,
      };
    }

    // Kategori
    if (isCanCupCategoryChallenge(card) && !card.name.includes(':')) {
      const category = CAN_CUP_CATEGORIES[Math.floor(Math.random() * CAN_CUP_CATEGORIES.length)];
      const baseName = card.name.includes(':') ? card.name.split(':')[0].trim() : card.name;
      return {
        ...card,
        name: `${baseName}: ${category}`,
        description: `Nämn saker inom "${category}". Den som missar tar 3 klunkar.`,
      };
    }

    return card;
  };
  const getNextTurnPlayerId = (players: Party['players'], currentPlayerId: string): string => {
    const currentPlayerIndex = players.findIndex((player) => player.id === currentPlayerId);
    if (currentPlayerIndex < 0) return currentPlayerId;
    const nextTurnIndex = (currentPlayerIndex + 1) % players.length;
    return players[nextTurnIndex]?.id || currentPlayerId;
  };
  const clonePlayerForSimulation = (player: Party['players'][number]): Party['players'][number] => ({
    ...player,
    ...(player.canCup ? { canCup: { ...player.canCup } } : {}),
    ...(player.effects ? { effects: [...player.effects] } : {}),
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
        canCupEmptyCans: player.canCup?.emptyCans ?? null,
      },
    ]));

  const buildGameActionSegment = ({
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
    label,
  }: {
    beforeStats: Map<string, {
      mana: number;
      manaIntake: number;
      drunkSeconds: number;
      canCupSipsLeft: number | null;
      canCupWaterSips: number | null;
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
    label?: string;
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
          (player.canCup?.emptyCans ?? null) !== before.canCupEmptyCans
        );
      })
      .map((player) => player.id);

    const affectedPlayerIds = affectedPlayerIdsOverride && affectedPlayerIdsOverride.length > 0
      ? affectedPlayerIdsOverride
      : detectedAffectedPlayerIds;

    const payload: GameActionSegment = {
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
    if (label) payload.label = label;

    return payload;
  };

  const buildLastActionPayload = ({
    segmentsOverride,
    ...segmentArgs
  }: Parameters<typeof buildGameActionSegment>[0] & {
    segmentsOverride?: GameActionSegment[];
  }): GameAction => {
    const primarySegment = buildGameActionSegment(segmentArgs);
    const segments = segmentsOverride && segmentsOverride.length > 0
      ? segmentsOverride
      : [primarySegment];

    return {
      ...primarySegment,
      segments,
      timestamp: Date.now(),
    };
  };

  const sanitizeCardForFirestore = (card: Card): Card =>
    JSON.parse(JSON.stringify(card)) as Card;
  const drawCanCupRewardChoices = (count: number): Card[] => {
    const desiredCount = Math.max(1, Math.round(count));
    const choices: Card[] = [];
    const seen = new Set<string>();

    while (choices.length < desiredCount) {
      let candidate = drawNewCard('can-cup');
      let key = `${candidate.name}|${candidate.description}|${candidate.rarity}`;
      let attempts = 0;

      while (seen.has(key) && attempts < 6) {
        candidate = drawNewCard('can-cup');
        key = `${candidate.name}|${candidate.description}|${candidate.rarity}`;
        attempts += 1;
      }

      choices.push(candidate);
      seen.add(key);
    }

    return choices;
  };
  const hasUntargetableEffect = (player?: Pick<Player, 'effects'> | null): boolean =>
    Boolean(player?.effects?.some((effect) => effect.type === 'untargetable' && effect.duration > 0));
  const addOrRefreshUntargetableEffect = (player: Player, duration: number, stackId = 'untargetable') => {
    const normalizedDuration = Math.max(1, Math.round(duration));
    const existingEffects = player.effects || [];
    const existingUntargetable = existingEffects.find((effect) => effect.stackId === stackId);

    if (existingUntargetable) {
      existingUntargetable.duration = Math.max(existingUntargetable.duration, normalizedDuration);
      player.effects = [...existingEffects];
      return;
    }

    player.effects = [
      ...existingEffects.filter((effect) => effect.stackId !== stackId),
      {
        stackId,
        type: 'untargetable',
        value: 0,
        duration: normalizedDuration,
      },
    ];
  };
  const decrementUntargetableEffects = (player: Player) => {
    if (!player.effects || player.effects.length === 0) return;

    player.effects = player.effects
      .map((effect) => (
        effect.type === 'untargetable'
          ? { ...effect, duration: Math.max(0, effect.duration - 1) }
          : effect
      ))
      .filter((effect) => effect.duration > 0);

    if (player.effects.length === 0) {
      delete player.effects;
    }
  };
  const getCanCupFollowUpCandidates = (
    players: Party['players'],
    responderId: string
  ): Party['players'] => players.filter((entry) => entry.id !== responderId && !hasUntargetableEffect(entry));
  const assertNoPendingCanCupFollowUp = (party: Party) => {
    if (getGameMode(party) === 'can-cup' && party.pendingCanCupFollowUp) {
      throw new Error('Resolve the pending pass-along target first');
    }
  };
  const assertNoPendingCanCupReplacementChoice = (party: Party) => {
    if (getGameMode(party) === 'can-cup' && party.pendingCanCupReplacementChoice) {
      throw new Error('Resolve the pending replacement card choice first');
    }
  };

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
    let replacementCardForPlayedCard: Card | null = null;
    let skipDefaultPlayedCardReplacement = false;
    let pendingCanCupFollowUp: Pick<
      PendingCanCupFollowUp,
      'responderId' |
      'turnOwnerId' |
      'sourcePlayerId' |
      'originalTargetId' |
      'sipCount' |
      'sourceCardId' |
      'sourceCardName' |
      'sourceCardType' |
      'sourceCardRarity' |
      'sourceCardDescription'
    > | null = null;

    const isLegendaryHandCard = (handCard: Card): boolean =>
      handCard.rarity === CardRarity.LEGENDARY || Boolean(handCard.isLegendary);

    const ensureCanCupState = (player: Player, sipsPerCan: number) => {
      if (!player.canCup) {
        player.canCup = {
          sipsLeft: sipsPerCan,
          waterSips: 0,
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
        sourcePlayerId: playerId,
        sourceCardId: card.id,
        sourceCardName: card.name,
        updatedAt: Date.now(),
      };

      nextPendingCanCupSips = recalculatePendingCanCupSips(nextPendingCanCupSips, updatedPlayers, sipsPerCan);
      affectedPlayerIds.add(targetPlayerId);
      return totalSipsToQueue;
    };

    const queueTargetedSips = (targetPlayerId: string, sipCount: number) => {
      const targetPlayer = updatedPlayers.find((entry) => entry.id === targetPlayerId);
      const reducedSipCount = targetPlayer
        ? getReducedTargetedSipCount(targetPlayer, sipCount, sipsPerCan)
        : Math.max(0, Math.round(sipCount));

      return queueForcedSips(targetPlayerId, reducedSipCount);
    };

    const playCostSips = getCanCupPlayCost(card);
    if (playCostSips > 0) {
      queueForcedSips(playerId, playCostSips);
    }

    switch (card.effect.type) {
      case 'canCupSip': {
        targetSipCommand += queueTargetedSips(target.id, card.effect.value);
        break;
      }
      case 'canCupAoESip': {
        updatedPlayers.forEach((entry) => {
          if (entry.id !== playerId) {
            queueForcedSips(entry.id, card.effect.value);
            if (entry.id === target.id) {
              targetSipCommand += Math.max(0, Math.round(card.effect.value));
            }
          }
        });
        break;
      }
      case 'canCupWaterOrSip': {
        if (target.id === playerId) {
          addWaterSips(player, Math.max(0, Math.round(card.effect.value)), sipsPerCan);
          affectedPlayerIds.add(player.id);
          nextPendingCanCupSips = recalculatePendingCanCupSips(nextPendingCanCupSips, updatedPlayers, sipsPerCan);
        } else {
          targetSipCommand += queueTargetedSips(target.id, 2);
        }
        break;
      }
      case 'canCupWater': {
        addWaterSips(player, card.effect.value, sipsPerCan);
        affectedPlayerIds.add(player.id);
        nextPendingCanCupSips = recalculatePendingCanCupSips(nextPendingCanCupSips, updatedPlayers, sipsPerCan);
        break;
      }
      case 'canCupBathroomBreak': {
        addOrRefreshUntargetableEffect(player, updatedPlayers.length, 'bathroom-break');
        affectedPlayerIds.add(player.id);
        break;
      }
      case 'canCupDeflect': {
        // Legacy compatibility: old shield effects now grant the same amount as water sips.
        addWaterSips(player, card.effect.value, sipsPerCan);
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
        targetSipCommand += queueTargetedSips(target.id, card.effect.value);
        break;
      }
      case 'canCupRelaySip': {
        targetSipCommand += queueTargetedSips(target.id, card.effect.value);
        if (getCanCupFollowUpCandidates(updatedPlayers, target.id).length > 0) {
          pendingCanCupFollowUp = {
            responderId: target.id,
            turnOwnerId: playerId,
            sourcePlayerId: playerId,
            originalTargetId: target.id,
            sipCount: Math.max(1, Math.round(card.effect.value)),
            sourceCardId: card.id,
            sourceCardName: card.name,
            sourceCardType: card.effect.type,
            sourceCardRarity: card.rarity,
            sourceCardDescription: card.description,
          };
        }
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
          targetSipCommand += queueTargetedSips(target.id, remainingSips);
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
          targetSipCommand += queueTargetedSips(target.id, sipsToTransfer);
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
            if (entry.id === playerId) {
              return;
            }
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
            targetSipCommand += queueTargetedSips(target.id, penaltySips);
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
      case 'canCupLegendaryHeist': {
        const opponents = updatedPlayers.filter((entry) => entry.id !== player.id && !hasUntargetableEffect(entry));
        if (opponents.length === 0) {
          resolvedTargetId = player.id;
          const penaltySips = Math.max(0, Math.round(card.effect.value));
          if (penaltySips > 0) {
            targetSipCommand += queueForcedSips(player.id, penaltySips);
          }
          break;
        }

        const randomOpponent = opponents[Math.floor(Math.random() * opponents.length)];
        resolvedTargetId = randomOpponent.id;

        const legendarySlots = randomOpponent.cards
          .map((handCard, index) => ({ handCard, index }))
          .filter(({ handCard }) => isLegendaryHandCard(handCard));

        if (legendarySlots.length > 0) {
          const randomLegendarySlot = legendarySlots[Math.floor(Math.random() * legendarySlots.length)];
          const stolenLegendaryCard = randomLegendarySlot.handCard;

          randomOpponent.cards[randomLegendarySlot.index] = drawCardByRarity(CardRarity.COMMON, 'can-cup');
          replacementCardForPlayedCard = stolenLegendaryCard;
          affectedPlayerIds.add(player.id);
          affectedPlayerIds.add(randomOpponent.id);
        } else {
          const penaltySips = Math.max(0, Math.round(card.effect.value));
          if (penaltySips > 0) {
            queueForcedSips(player.id, penaltySips);
          }
        }
        break;
      }
      case 'canCupTaxSober': {
        const taxSips = Math.max(0, Math.round(card.effect.value));
        const candidates = getPlayersWithFewestEmptyCans(updatedPlayers, sipsPerCan)
          .filter((entry) => !hasUntargetableEffect(entry));
        if (candidates.length > 0 && taxSips > 0) {
          const randomCandidate = candidates[Math.floor(Math.random() * candidates.length)];
          resolvedTargetId = randomCandidate.id;
          targetSipCommand += queueTargetedSips(randomCandidate.id, taxSips);
        }
        break;
      }
      case 'canCupHolyAlliance': {
        const waterBonus = Math.max(0, Math.round(card.effect.value));
        if (waterBonus > 0) {
          addWaterSips(player, waterBonus, sipsPerCan);
          affectedPlayerIds.add(player.id);
          if (target && target.id !== player.id) {
            addWaterSips(target, waterBonus, sipsPerCan);
            affectedPlayerIds.add(target.id);
          }

          // Everyone else takes 2 sips
          updatedPlayers.forEach((p) => {
            if (p.id !== player.id && (!target || p.id !== target.id)) {
              queueTargetedSips(p.id, 2);
            }
          });

          nextPendingCanCupSips = recalculatePendingCanCupSips(nextPendingCanCupSips, updatedPlayers, sipsPerCan);
        }
        break;
      }
      case 'canCupRockBottom': {
        const baseDamage = Math.max(0, Math.round(card.effect.value));
        const emptyCans = player.canCup?.emptyCans ?? 0;
        const totalDamage = baseDamage + (2 * emptyCans);
        if (totalDamage > 0) {
          targetSipCommand += queueTargetedSips(target.id, totalDamage);
        }
        break;
      }
      case 'canCupRussianRoulette': {
        const eligibleVictims = updatedPlayers.filter((entry) => !hasUntargetableEffect(entry));
        if (eligibleVictims.length > 0) {
          const randomVictim = eligibleVictims[Math.floor(Math.random() * eligibleVictims.length)];
          resolvedTargetId = randomVictim.id;
          const victimCanCup = ensureCanCupState(randomVictim, sipsPerCan);
          const remainingSips = victimCanCup.sipsLeft + victimCanCup.waterSips;
          if (remainingSips > 0) {
            targetSipCommand += queueTargetedSips(randomVictim.id, remainingSips);
          }
        }
        break;
      }

      case 'canCupPenaltyDrink': {
        updatedPlayers.forEach((entry) => {
          const emptyCans = entry.canCup?.emptyCans ?? 0;
          if (emptyCans > 0) {
            const applied = queueForcedSips(entry.id, emptyCans);
            if (entry.id === target.id) {
              targetSipCommand += applied;
            }
          }
        });
        break;
      }
      case 'canCupRedrawHand': {
        player.cards = player.cards.map(() => drawNewCard('can-cup'));
        skipDefaultPlayedCardReplacement = true;
        affectedPlayerIds.add(player.id);
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
      pendingCanCupFollowUp,
      replacementCardForPlayedCard,
      skipDefaultPlayedCardReplacement,
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
        assertNoPendingCanCupReplacementChoice(party);

        const updatedPlayers = party.players.map(clonePlayerForSimulation);
        updatedPlayers.forEach(decrementUntargetableEffects);

        // Find next player's turn
        const currentPlayerIndex = updatedPlayers.findIndex(p => p.id === playerId);
        const nextTurnIndex = (currentPlayerIndex + 1) % updatedPlayers.length;
        const nextPlayerId = updatedPlayers[nextTurnIndex]?.id || playerId;

        // Only update the currentTurn field, preserving all other fields
        transaction.update(partyRef, {
          players: updatedPlayers,
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
        assertNoPendingCanCupFollowUp(party);
        assertNoPendingCanCupReplacementChoice(party);
        if (!isChallengeCard(card)) throw new Error('This card is not a challenge card');

        const updatedPlayers = [...party.players];
        const beforeStats = snapshotPlayerStats(updatedPlayers);
        const gameMode = getGameMode(party);
        const effectiveCard = card;
        const canCupSipsPerCan = getCanCupSipsPerCan(party);
        let nextPendingCanCupSips = normalizePendingCanCupSips(party.pendingCanCupSips);
        const isRandomOpponentChallenge = gameMode === 'can-cup' && isCanCupRandomOpponentChallengeCard(effectiveCard);
        const usesOwnerTargetSetup = gameMode === 'can-cup' && effectiveCard.challengeParticipantMode === 'owner-target';
        const requiresParticipantSetup = !(
          gameMode === 'can-cup' &&
          isCanCupNoSetupChallengeCard(effectiveCard)
        );
        const pendingChallengeCard = getChallengeCardForPendingState(effectiveCard, gameMode);
        const player = updatedPlayers.find((entry) => entry.id === playerId);
        if (!player) throw new Error('Player not found');

        let resolvedDuelistOneId = usesOwnerTargetSetup ? playerId : duelistOneId;
        let resolvedDuelistTwoId = duelistTwoId;
        if (isRandomOpponentChallenge) {
          const opponents = updatedPlayers.filter((entry) => entry.id !== playerId && !hasUntargetableEffect(entry));
          if (opponents.length === 0) {
            throw new Error('No valid opponent found for this challenge');
          }
          const randomOpponent = opponents[Math.floor(Math.random() * opponents.length)];
          resolvedDuelistOneId = playerId;
          resolvedDuelistTwoId = randomOpponent.id;
        }

        if (requiresParticipantSetup) {
          if (!resolvedDuelistOneId || !resolvedDuelistTwoId) throw new Error('Two duelists are required');
          if (resolvedDuelistOneId === resolvedDuelistTwoId) throw new Error('Duelists must be unique players');
          const duelistOne = updatedPlayers.find((entry) => entry.id === resolvedDuelistOneId);
          const duelistTwo = updatedPlayers.find((entry) => entry.id === resolvedDuelistTwoId);
          if (!duelistOne || !duelistTwo) throw new Error('Selected duelists not found');
          if (usesOwnerTargetSetup && resolvedDuelistOneId !== playerId) {
            throw new Error('The challenge owner must be one of the duelists');
          }
          const targetedDuelists = [duelistOne, duelistTwo]
            .filter((entry) => entry.id !== playerId);
          if (targetedDuelists.some((entry) => hasUntargetableEffect(entry))) {
            throw new Error('Untargetable players cannot be chosen for this challenge');
          }
        }

        const hasCard = player.cards.some((entry) => entry.id === effectiveCard.id);
        if (!hasCard) throw new Error('Challenge card not found in hand');
        if (gameMode !== 'can-cup' && player.mana < effectiveCard.manaCost) throw new Error('Not enough mana for challenge card');
        if (gameMode !== 'can-cup') {
          player.mana = Math.max(0, player.mana - effectiveCard.manaCost);
        }
        if (gameMode === 'can-cup') {
          const playCostSips = getCanCupPlayCost(effectiveCard);
          if (playCostSips > 0) {
            const existing = nextPendingCanCupSips[playerId];
            nextPendingCanCupSips[playerId] = {
              targetPlayerId: playerId,
              totalSips: (existing?.totalSips ?? 0) + playCostSips,
              beerSipsToConsume: existing?.beerSipsToConsume ?? 0,
              waterSipsToConsume: existing?.waterSipsToConsume ?? 0,
              sourcePlayerId: playerId,
              sourceCardId: effectiveCard.id,
              sourceCardName: effectiveCard.name,
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
        const hasResolvedDuelists = Boolean(resolvedDuelistOneId && resolvedDuelistTwoId);
        if (hasResolvedDuelists && resolvedDuelistOneId && resolvedDuelistTwoId) {
          pendingChallengePayload.duelistOneId = resolvedDuelistOneId;
          pendingChallengePayload.duelistTwoId = resolvedDuelistTwoId;
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
            targetId: isRandomOpponentChallenge
              ? resolvedDuelistTwoId
              : usesOwnerTargetSetup
                ? resolvedDuelistTwoId
                : (requiresParticipantSetup ? resolvedDuelistOneId : undefined),
            cardId: effectiveCard.id,
            cardName: pendingChallengeCard.name,
            cardType: effectiveCard.effect.type,
            cardRarity: effectiveCard.rarity,
            cardDescription: pendingChallengeCard.description,
            manaCost: gameMode === 'can-cup' ? getCanCupPlayCost(effectiveCard) : effectiveCard.manaCost,
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

        const updatedReactionTimes = { ...(reactionState.reactionTimes || {}) };
        if (playerId in updatedReactionTimes) {
          return;
        }

        updatedReactionTimes[playerId] = Math.max(0, Math.round(reactionTimeMs));

        if (Object.keys(updatedReactionTimes).length < 2) {
          transaction.update(partyRef, {
            'pendingChallenge.reactionGame.reactionTimes': updatedReactionTimes
          });
          return;
        }

        const entries = Object.entries(updatedReactionTimes);
        let winnerId = entries[0][0];
        let loserId = entries[1][0];

        if (entries[1][1] < entries[0][1]) {
          winnerId = entries[1][0];
          loserId = entries[0][0];
        }

        transaction.update(partyRef, {
          pendingChallenge: {
            ...pendingChallenge,
            reactionGame: {
              mode: 'reaction',
              phase: 'resolved',
              readyPlayerIds: Array.from(new Set([...(reactionState.readyPlayerIds ?? []), ...duelistIds])),
              countdownStartedAt: reactionState.countdownStartedAt,
              redAt: reactionState.redAt,
              yellowAt: reactionState.yellowAt,
              greenAt: reactionState.greenAt,
              reactionTimes: updatedReactionTimes,
              winnerId,
              loserId,
              resolvedAt: serverNow(),
            },
          },
        });
      });
      return true;
    } catch (error) {
      console.error('Error resolving reaction challenge press:', error);
      throw error;
    }
  }, [partyId]);

  const dismissReactionChallengeResults = useCallback(async (playerId: string) => {
    const partyRef = doc(db, 'parties', partyId);

    try {
      await runTransaction(db, async (transaction) => {
        const partyDoc = await transaction.get(partyRef);
        if (!partyDoc.exists()) throw new Error('Party not found');
        const party = partyDoc.data() as Party;
        if (getGameMode(party) !== 'can-cup') return;

        const pendingChallenge = party.pendingChallenge;
        if (!pendingChallenge || !isCanCupReactionChallengeCard(pendingChallenge.card)) {
          throw new Error('No resolved reaction challenge to dismiss');
        }
        if (pendingChallenge.playerId !== playerId) {
          throw new Error('Only the challenge owner can dismiss reaction results');
        }
        if (!pendingChallenge.duelistOneId || !pendingChallenge.duelistTwoId) {
          throw new Error('Reaction challenge duelists are missing');
        }

        const reactionState = pendingChallenge.reactionGame;
        if (!reactionState || reactionState.phase !== 'resolved') {
          throw new Error('Reaction challenge results are not ready yet');
        }

        const winnerId = reactionState.winnerId;
        const loserId = reactionState.loserId;
        if (!winnerId || !loserId || winnerId === loserId) {
          throw new Error('Reaction challenge winner/loser could not be determined');
        }

        const duelistIds = [pendingChallenge.duelistOneId, pendingChallenge.duelistTwoId];
        if (!duelistIds.includes(winnerId) || !duelistIds.includes(loserId)) {
          throw new Error('Resolved duelists are invalid');
        }

        const updatedPlayers = party.players.map((player) => ({
          ...clonePlayerForSimulation(player),
          cards: [...player.cards],
        }));
        const beforeStats = snapshotPlayerStats(updatedPlayers);
        const canCupSipsPerCan = getCanCupSipsPerCan(party);
        let nextPendingCanCupSips = normalizePendingCanCupSips(party.pendingCanCupSips);

        const challengeOwner = updatedPlayers.find((player) => player.id === pendingChallenge.playerId);
        if (!challengeOwner) {
          throw new Error('Challenge owner not found');
        }

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
            manaCost: getCanCupPlayCost(pendingChallenge.card),
            targetDamageOverride: loserSipPenalty,
            targetManaDeltaOverride: -loserSipPenalty,
            targetManaIntakeDeltaOverride: 0,
            affectedPlayerIdsOverride: [winnerId, loserId, pendingChallenge.playerId],
          }),
        });
      });
      return true;
    } catch (error) {
      console.error('Error dismissing reaction challenge results:', error);
      throw error;
    }
  }, [partyId]);

  // Apply a card effect
  const applyCardEffect = useCallback(async (playerId: string, targetId: string, card: Card) => {
    const partyRef = doc(db, 'parties', partyId);
    let shouldEndTurnAfterAction = true;

    try {
      await runTransaction(db, async (transaction) => {
        const partyDoc = await transaction.get(partyRef);
        if (!partyDoc.exists()) throw new Error('Party not found');
        const party = partyDoc.data() as Party;

        if (party.currentTurn !== playerId) throw new Error('Not player\'s turn');
        if (party.pendingChallenge) throw new Error('Resolve the active challenge first');
        assertNoPendingCanCupFollowUp(party);
        assertNoPendingCanCupReplacementChoice(party);

        const updatedPlayers = [...party.players];
        const beforeStats = snapshotPlayerStats(updatedPlayers);
        const gameMode = getGameMode(party);
        const effectiveCard = card;
        const canCupSipsPerCan = getCanCupSipsPerCan(party);
        const player = updatedPlayers.find(p => p.id === playerId);
        const target = updatedPlayers.find(p => p.id === targetId);

        if (!player) throw new Error('Player not found');
        if (!target) throw new Error('Target not found');
        if (target.id !== playerId && effectiveCard.requiresTarget && hasUntargetableEffect(target)) {
          throw new Error('Target player is untargetable');
        }

        if (gameMode === 'can-cup') {
          const cardIndex = player.cards.findIndex(c => c.id === effectiveCard.id);
          if (cardIndex === -1) {
            throw new Error('Card not found in player hand');
          }

          const normalizedPendingCanCupSips = normalizePendingCanCupSips(party.pendingCanCupSips);
          const canCupResult = applyCanCupCardEffect({
            card: effectiveCard,
            player,
            target,
            updatedPlayers,
            sipsPerCan: canCupSipsPerCan,
            playerId,
            pendingCanCupSips: normalizedPendingCanCupSips,
          });

          if (!canCupResult.skipDefaultPlayedCardReplacement) {
            player.cards[cardIndex] = canCupResult.replacementCardForPlayedCard ?? drawNewCard(gameMode);
          }
          const actionTargetId = canCupResult.resolvedTargetId ?? targetId;
          const actionPayload = buildLastActionPayload({
            beforeStats,
            updatedPlayers,
            playerId,
            targetId: actionTargetId,
            cardId: effectiveCard.id,
            cardName: effectiveCard.name,
            cardType: effectiveCard.effect.type,
            cardRarity: effectiveCard.rarity,
            cardDescription: effectiveCard.description,
            manaCost: getCanCupPlayCost(effectiveCard),
            targetDamageOverride: canCupResult.targetSipCommand,
            targetManaDeltaOverride: canCupResult.targetSipCommand > 0 ? -canCupResult.targetSipCommand : 0,
            targetManaIntakeDeltaOverride: 0,
            affectedPlayerIdsOverride: canCupResult.affectedPlayerIds,
          });
          const pendingCanCupFollowUp = canCupResult.pendingCanCupFollowUp
            ? {
              ...canCupResult.pendingCanCupFollowUp,
              originalAction: actionPayload.segments?.[0] ?? actionPayload,
              createdAt: Date.now(),
            }
            : null;
          shouldEndTurnAfterAction = !pendingCanCupFollowUp;

          transaction.update(partyRef, {
            players: updatedPlayers,
            pendingCanCupSips: toPendingCanCupSipsField(canCupResult.pendingCanCupSips),
            pendingCanCupFollowUp,
            lastAction: actionPayload,
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
      if (shouldEndTurnAfterAction) {
        await endTurn(playerId);
      }

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
    let shouldEndTurnAfterResolution = true;

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
        assertNoPendingCanCupFollowUp(party);
        assertNoPendingCanCupReplacementChoice(party);
        if (party.pendingChallenge && party.pendingChallenge.playerId !== playerId) {
          throw new Error('Only the challenge owner can resolve this challenge');
        }

        const gameMode = getGameMode(party);
        const challengeCard = card ?? party.pendingChallenge?.card;
        if (!challengeCard) {
          throw new Error('Challenge card data is missing');
        }
        const resolvedChallengeCard = challengeCard;
        if (!isChallengeCard(resolvedChallengeCard)) {
          console.error('Challenge effects not defined for this card:', resolvedChallengeCard);
          throw new Error('Challenge effects not defined for this card: ' + resolvedChallengeCard.name);
        }

        const updatedPlayers = [...party.players];
        const beforeStats = snapshotPlayerStats(updatedPlayers);
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
          if (challengeOwner.mana < resolvedChallengeCard.manaCost) {
            throw new Error('Not enough mana for challenge card');
          }
          challengeOwner.mana = Math.max(0, challengeOwner.mana - resolvedChallengeCard.manaCost);
        }

        let winnerEffect;
        let loserEffect;
        const maxMana = party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA;
        let challengeTargetSipCount = 0;
        const affectedPlayers = new Set<string>();
        let nextPendingCanCupSips = normalizePendingCanCupSips(party.pendingCanCupSips);

        try {
          if (resolvedChallengeCard.effect.winnerEffect && resolvedChallengeCard.effect.loserEffect) {
            winnerEffect = resolvedChallengeCard.effect.winnerEffect;
            loserEffect = resolvedChallengeCard.effect.loserEffect;
          } else if (resolvedChallengeCard.effect.challenge?.winnerEffect && resolvedChallengeCard.effect.challenge?.loserEffect) {
            winnerEffect = resolvedChallengeCard.effect.challenge.winnerEffect;
            loserEffect = resolvedChallengeCard.effect.challenge.loserEffect;
          } else if (resolvedChallengeCard.effect.challengeEffects?.winner && resolvedChallengeCard.effect.challengeEffects?.loser) {
            winnerEffect = resolvedChallengeCard.effect.challengeEffects.winner;
            loserEffect = resolvedChallengeCard.effect.challengeEffects.loser;
          } else {
            // Fallback for cards with non-standard effects
            switch (resolvedChallengeCard.id) {
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
                if (isNamingChallengeCard(resolvedChallengeCard)) {
                  // 'Name the most' cards
                  const value = 5; // Default value for naming challenges
                  winnerEffect = { type: 'manaStealer', value: value };
                  loserEffect = { type: 'manaBurn', value: value };
                } else {
                  console.error('Unable to determine challenge effects for card', resolvedChallengeCard);
                  throw new Error('Unable to determine challenge effects for card: ' + resolvedChallengeCard.name);
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
                sourcePlayerId: playerId,
                sourceCardId: resolvedChallengeCard.id,
                sourceCardName: resolvedChallengeCard.name,
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
                  addWaterSips(effectTarget, effect.value, canCupSipsPerCan);
                  affectedPlayers.add(effectTarget.id);
                  nextPendingCanCupSips = recalculatePendingCanCupSips(nextPendingCanCupSips, updatedPlayers, canCupSipsPerCan);
                  return 0;
                case 'null':
                default:
                  return 0;
              }
            };

            if (resolvedChallengeCard.challengeOutcomeRule === 'owner-safe') {
              if (winner.id === playerId) {
                challengeTargetSipCount = applyCanCupChallengeEffect(loser, loserEffect);
              }
            } else {
              applyCanCupChallengeEffect(winner, winnerEffect);
              challengeTargetSipCount = applyCanCupChallengeEffect(loser, loserEffect);
            }
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
            const winnerResult = applyChallengeEffect(winner, winnerEffect, maxMana, resolvedChallengeCard);
            const loserResult = applyChallengeEffect(loser, loserEffect, maxMana, resolvedChallengeCard);

            Object.assign(winner, winnerResult);
            Object.assign(loser, loserResult);
          }
        } catch (effectError) {
          console.error('Error applying challenge effects', effectError);
          const errorMessage = effectError instanceof Error ? effectError.message : String(effectError);
          throw new Error('Failed to apply challenge effects: ' + errorMessage);
        }

        const player = updatedPlayers.find(p => p.id === playerId);
        if (!player) {
          throw new Error('Player not found');
        }

        const cardIndex = player.cards.findIndex(c => c.id === resolvedChallengeCard.id);
        if (cardIndex === -1) {
          throw new Error('Card not found in player\'s hand');
        }

        let pendingCanCupReplacementChoice: PendingCanCupReplacementChoice | null = null;
        const rewardChoiceCount = Math.max(0, Math.round(resolvedChallengeCard.challengeRewardDrawChoices ?? 0));
        const shouldOfferReplacementChoice =
          gameMode === 'can-cup' &&
          rewardChoiceCount > 0 &&
          winner.id === playerId;

        if (shouldOfferReplacementChoice) {
          pendingCanCupReplacementChoice = {
            playerId,
            cardSlotIndex: cardIndex,
            sourceCardId: resolvedChallengeCard.id,
            sourceCardName: resolvedChallengeCard.name,
            options: drawCanCupRewardChoices(rewardChoiceCount).map(sanitizeCardForFirestore),
            createdAt: Date.now(),
          };
          shouldEndTurnAfterResolution = false;
        } else {
          player.cards[cardIndex] = drawNewCard(gameMode);
        }

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
            cardId: resolvedChallengeCard.id,
            cardName: resolvedChallengeCard.name,
            cardType: resolvedChallengeCard.effect.type,
            cardRarity: resolvedChallengeCard.rarity,
            cardDescription: resolvedChallengeCard.description,
            manaCost: gameMode === 'can-cup' ? getCanCupPlayCost(resolvedChallengeCard) : resolvedChallengeCard.manaCost,
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
        if (pendingCanCupReplacementChoice) {
          updatePayload.pendingCanCupReplacementChoice = pendingCanCupReplacementChoice;
        }

        transaction.update(partyRef, {
          ...updatePayload,
        });


      });

      // End turn and decay mana intake
      if (shouldEndTurnAfterResolution) {
        await endTurn(playerId);
      }

      return true;
    } catch (error) {
      console.error('Error resolving challenge:', error);
      throw error;
    }
  }, [partyId, endTurn]);

  const resolveCanCupReplacementChoice = useCallback(async (playerId: string, chosenCardId: string) => {
    const partyRef = doc(db, 'parties', partyId);

    try {
      await runTransaction(db, async (transaction) => {
        const partyDoc = await transaction.get(partyRef);
        if (!partyDoc.exists()) throw new Error('Party not found');
        const party = partyDoc.data() as Party;

        if (getGameMode(party) !== 'can-cup') {
          throw new Error('Replacement choice is only available in Can Cup');
        }
        if (party.currentTurn !== playerId) {
          throw new Error('Not player\'s turn');
        }

        const pendingReplacementChoice = party.pendingCanCupReplacementChoice;
        if (!pendingReplacementChoice) {
          throw new Error('No pending replacement choice');
        }
        if (pendingReplacementChoice.playerId !== playerId) {
          throw new Error('Only the acting player can choose a replacement card');
        }

        const chosenCard = pendingReplacementChoice.options.find((option) => option.id === chosenCardId);
        if (!chosenCard) {
          throw new Error('Chosen replacement card was not found');
        }

        const updatedPlayers = party.players.map((entry) => ({
          ...clonePlayerForSimulation(entry),
          cards: [...entry.cards],
        }));
        const player = updatedPlayers.find((entry) => entry.id === playerId);
        if (!player) {
          throw new Error('Player not found');
        }

        if (
          pendingReplacementChoice.cardSlotIndex < 0 ||
          pendingReplacementChoice.cardSlotIndex >= player.cards.length
        ) {
          throw new Error('Replacement slot is invalid');
        }

        player.cards[pendingReplacementChoice.cardSlotIndex] = sanitizeCardForFirestore(chosenCard);

        transaction.update(partyRef, {
          players: updatedPlayers,
          pendingCanCupReplacementChoice: null,
        });
      });

      await endTurn(playerId);
      return true;
    } catch (error) {
      console.error('Error resolving Can Cup replacement choice:', error);
      throw error;
    }
  }, [partyId, endTurn]);

  const resolveCanCupFollowUpTarget = useCallback(async (playerId: string, targetId: string) => {
    const partyRef = doc(db, 'parties', partyId);

    try {
      await runTransaction(db, async (transaction) => {
        const partyDoc = await transaction.get(partyRef);
        if (!partyDoc.exists()) throw new Error('Party not found');
        const party = partyDoc.data() as Party;
        if (getGameMode(party) !== 'can-cup') {
          throw new Error('Pass-along targeting is only available in Can Cup');
        }

        const pendingFollowUp = party.pendingCanCupFollowUp;
        if (!pendingFollowUp) {
          throw new Error('No pending pass-along target to choose');
        }
        if (pendingFollowUp.responderId !== playerId) {
          throw new Error('Only the struck player can choose the follow-up target');
        }
        if (targetId === playerId) {
          throw new Error('You must choose someone else');
        }

        const updatedPlayers = party.players.map(clonePlayerForSimulation);
        const beforeStats = snapshotPlayerStats(updatedPlayers);
        const relayTarget = updatedPlayers.find((entry) => entry.id === targetId);
        if (!relayTarget) {
          throw new Error('Target player not found');
        }
        const isUntargetable = relayTarget.effects?.some(
          (effect) => effect.stackId === 'untargetable' && effect.type === 'untargetable'
        );
        if (isUntargetable) {
          throw new Error('Target player is untargetable');
        }

        if (!getCanCupFollowUpCandidates(updatedPlayers, playerId).some((entry) => entry.id === targetId)) {
          throw new Error('Invalid follow-up target');
        }

        const nextPendingCanCupSips = normalizePendingCanCupSips(party.pendingCanCupSips);
        const canCupSipsPerCan = getCanCupSipsPerCan(party);
        const reducedSipCount = getReducedTargetedSipCount(relayTarget, pendingFollowUp.sipCount, canCupSipsPerCan);
        const existing = nextPendingCanCupSips[targetId];
        nextPendingCanCupSips[targetId] = {
          targetPlayerId: targetId,
          totalSips: (existing?.totalSips ?? 0) + reducedSipCount,
          beerSipsToConsume: existing?.beerSipsToConsume ?? 0,
          waterSipsToConsume: existing?.waterSipsToConsume ?? 0,
          sourcePlayerId: playerId,
          sourceCardId: pendingFollowUp.sourceCardId,
          sourceCardName: pendingFollowUp.sourceCardName,
          updatedAt: Date.now(),
        };

        const recalculatedPendingCanCupSips = recalculatePendingCanCupSips(
          nextPendingCanCupSips,
          updatedPlayers,
          canCupSipsPerCan
        );
        const responseSegment = buildGameActionSegment({
          beforeStats,
          updatedPlayers,
          playerId,
          targetId,
          cardId: pendingFollowUp.sourceCardId,
          cardName: pendingFollowUp.sourceCardName,
          cardType: pendingFollowUp.sourceCardType,
          cardRarity: pendingFollowUp.sourceCardRarity,
          cardDescription: pendingFollowUp.sourceCardDescription,
          manaCost: 0,
          targetDamageOverride: reducedSipCount,
          targetManaDeltaOverride: reducedSipCount > 0 ? -reducedSipCount : 0,
          targetManaIntakeDeltaOverride: 0,
          affectedPlayerIdsOverride: [playerId, targetId],
          label: 'Pass-along',
        });
        const combinedAffectedPlayerIds = Array.from(new Set([
          ...(pendingFollowUp.originalAction.affectedPlayerIds ?? []),
          ...(responseSegment.affectedPlayerIds ?? []),
        ]));
        const chainedLastAction: GameAction = {
          ...pendingFollowUp.originalAction,
          affectedPlayerIds: combinedAffectedPlayerIds.length > 0
            ? combinedAffectedPlayerIds
            : pendingFollowUp.originalAction.affectedPlayerIds,
          segments: [
            pendingFollowUp.originalAction,
            responseSegment,
          ],
          timestamp: Date.now(),
        };

        transaction.update(partyRef, {
          pendingCanCupSips: toPendingCanCupSipsField(recalculatedPendingCanCupSips),
          pendingCanCupFollowUp: null,
          lastAction: chainedLastAction,
          currentTurn: getNextTurnPlayerId(updatedPlayers, pendingFollowUp.turnOwnerId),
        });
      });
      return true;
    } catch (error) {
      console.error('Error resolving Can Cup pass-along target:', error);
      throw error;
    }
  }, [partyId]);

  const resolveCanCupSips = useCallback(async (playerId: string) => {
    const partyRef = doc(db, 'parties', partyId);

    try {
      await runTransaction(db, async (transaction) => {
        const partyDoc = await transaction.get(partyRef);
        if (!partyDoc.exists()) throw new Error('Party not found');
        const party = partyDoc.data() as Party;
        if (getGameMode(party) !== 'can-cup') return;
        assertNoPendingCanCupFollowUp(party);
        assertNoPendingCanCupReplacementChoice(party);

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
        assertNoPendingCanCupFollowUp(party);
        assertNoPendingCanCupReplacementChoice(party);

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
    dismissReactionChallengeResults,
    resolveChallengeCard,
    resolveCanCupReplacementChoice,
    resolveCanCupFollowUpTarget,
    resolveCanCupSips,
    drinkMana,
    godModeSwapCard,
  };
}
