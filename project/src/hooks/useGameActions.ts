import { useCallback } from 'react';
import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Card, Party } from '../types/game';
import { GAME_CONFIG } from '../config/gameConfig';
import { drawLegendaryCard, drawNewCard } from '../utils/cardGeneration';
import { validateChallengeParticipants, applyChallengeEffect } from '../utils/challengeEffects';
import { CardEnhancer } from '../utils/cardEnhancer';
import { EffectManager } from '../utils/effectManager';

export function useGameActions(partyId: string) {
  const effectManager = new EffectManager();
  const cardEnhancer = new CardEnhancer(effectManager);

  const toRounded = (value: number) => Number(value.toFixed(2));

  const snapshotPlayerStats = (players: Party['players']) =>
    new Map(players.map((player) => [
      player.id,
      {
        mana: toRounded(player.mana),
        manaIntake: toRounded(player.manaIntake || 0),
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
  }: {
    beforeStats: Map<string, { mana: number; manaIntake: number }>;
    updatedPlayers: Party['players'];
    playerId: string;
    targetId?: string;
    cardId: string;
    cardName: string;
    cardType: string;
    cardRarity: string;
    cardDescription: string;
    manaCost?: number;
  }) => {
    const attackerBefore = beforeStats.get(playerId);
    const attackerAfter = updatedPlayers.find((player) => player.id === playerId);
    const targetBefore = targetId ? beforeStats.get(targetId) : undefined;
    const targetAfter = targetId ? updatedPlayers.find((player) => player.id === targetId) : undefined;

    const attackerManaDelta = attackerBefore && attackerAfter
      ? toRounded(attackerAfter.mana - attackerBefore.mana)
      : undefined;
    const targetManaDelta = targetBefore && targetAfter
      ? toRounded(targetAfter.mana - targetBefore.mana)
      : undefined;
    const targetManaIntakeDelta = targetBefore && targetAfter
      ? toRounded((targetAfter.manaIntake || 0) - targetBefore.manaIntake)
      : undefined;
    const targetDamage = targetBefore && targetAfter
      ? Math.max(0, toRounded(targetBefore.mana - targetAfter.mana))
      : undefined;

    const affectedPlayerIds = updatedPlayers
      .filter((player) => {
        const before = beforeStats.get(player.id);
        if (!before) return false;
        return (
          Math.abs((player.mana || 0) - before.mana) > 0.001 ||
          Math.abs((player.manaIntake || 0) - before.manaIntake) > 0.001
        );
      })
      .map((player) => player.id);

    return {
      playerId,
      targetId,
      cardId,
      cardName,
      cardType,
      cardRarity,
      cardDescription,
      manaCost,
      attackerManaDelta,
      targetManaDelta,
      targetDamage,
      targetManaIntakeDelta,
      affectedPlayerIds: affectedPlayerIds.length > 0 ? affectedPlayerIds : undefined,
      timestamp: Date.now(),
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

  // Apply a card effect
  const applyCardEffect = useCallback(async (playerId: string, targetId: string, card: Card) => {
    const partyRef = doc(db, 'parties', partyId);

    try {
      await runTransaction(db, async (transaction) => {
        const partyDoc = await transaction.get(partyRef);
        if (!partyDoc.exists()) throw new Error('Party not found');
        const party = partyDoc.data() as Party;

        if (party.currentTurn !== playerId) throw new Error('Not player\'s turn');

        const updatedPlayers = [...party.players];
        const beforeStats = snapshotPlayerStats(updatedPlayers);
        const player = updatedPlayers.find(p => p.id === playerId);
        const target = updatedPlayers.find(p => p.id === targetId);

        if (!player) throw new Error('Player not found');
        if (!target) throw new Error('Target not found');

        // Enhance the card before applying the effect
        const enhancedCard = cardEnhancer.enhanceCard(card);

        // Apply mana cost
        player.mana = Math.max(0, player.mana - enhancedCard.manaCost);

        // Replace used card
        const cardIndex = player.cards.findIndex(c => c.id === enhancedCard.id);
        if (cardIndex !== -1) {
          player.cards[cardIndex] = drawNewCard();
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


            case 'life-steal':
              let enemyMana = target.mana;
              target.mana = player.mana;
              player.mana = enemyMana;
              break;


            case 'manaDrain':
              const drainAmount = Math.min(target.mana, enhancedCard.effect.value);
              target.mana -= drainAmount;
              player.mana = Math.min(
                party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA,
                player.mana + drainAmount
              );
              break;

            case 'manaBurn':
              const burnAmount = Math.ceil(target.mana / 2);
              target.mana = Math.max(0, target.mana - burnAmount);
              target.manaIntake = (target.manaIntake || 0) + burnAmount;
              break;

            case 'reversed-curse-tech':
              player.mana = Math.min(party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA, player.mana + target.mana / 2);
              break;


            case 'manaRefill':
              player.mana = party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA;
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
                  enemy.cards.push(drawNewCard());
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
              effectManager.addManaShield({
                reduction: enhancedCard.effect.value, // Value between 0-1 representing percentage reduction
                duration: { turnsLeft: 3, initialDuration: 3 },
                source: card.id,
              });
              break;

            case 'manaIntakeMultiplier':
              effectManager.addIntakeEffect({
                type: 'multiply',
                value: enhancedCard.effect.value,
                duration: { turnsLeft: 3, initialDuration: 3 },
                source: card.id,
              });
              break;

            case 'manaIntakeReduction':
              effectManager.addIntakeEffect({
                type: 'multiply',
                value: 1 - enhancedCard.effect.value, // Convert reduction to multiplier (e.g. 0.3 reduction becomes 0.7 multiplier)
                duration: { turnsLeft: 3, initialDuration: 3 },
                source: card.id,
              });
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
              player.manaIntake = Math.max(0, player.manaIntake * (1 - enhancedCard.effect.value));
              break;

            case 'goldenLiver':
              player.mana = Math.min(
                party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA,
                player.mana + enhancedCard.effect.value
              );
              effectManager.addManaShield({
                reduction: 0.8, // 80% reduction
                duration: { turnsLeft: 3, initialDuration: 3 },
                source: card.id,
              });
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

        transaction.update(partyRef, {
          players: updatedPlayers,
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
        });
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
  const resolveChallengeCard = useCallback(async (playerId: string, winnerId: string, loserId: string, card: Card) => {

    // Check if challenge effects are defined in any of the supported formats
    if (!card.effect.challengeEffects && !card.effect.winnerEffect && !card.effect.loserEffect && !card.name.includes('Name the most') &&
      card.name !== 'Öl Hävf' && card.name !== 'Got Big Muscles?' && card.name !== 'Shot Contest' && card.name !== 'SHOT MASTER') {
      console.error('Challenge effects not defined for this card:', card);
      throw new Error('Challenge effects not defined for this card: ' + card.name);
    }


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

        const updatedPlayers = [...party.players];
        const beforeStats = snapshotPlayerStats(updatedPlayers);
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

        let winnerEffect;
        let loserEffect;
        const maxMana = party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA;

        try {
          if (card.effect.winnerEffect && card.effect.loserEffect) {
            winnerEffect = card.effect.winnerEffect;
            loserEffect = card.effect.loserEffect;
          } else if (card.effect.challengeEffects?.winner && card.effect.challengeEffects?.loser) {
            winnerEffect = card.effect.challengeEffects.winner;
            loserEffect = card.effect.challengeEffects.loser;
          } else {
            // Fallback for cards with non-standard effects
            switch (card.name) {
              case 'Öl Hävf':
                winnerEffect = { type: 'mana', value: 5 };
                loserEffect = { type: 'manaIntake', value: 10 };
                break;
              case 'Got Big Muscles?':
                winnerEffect = { type: 'mana', value: 3 };
                loserEffect = { type: 'manaBurn', value: 4 };
                break;
              case 'Shot Contest':
                winnerEffect = { type: 'mana', value: 2 };
                loserEffect = { type: 'manaIntake', value: 6 };
                break;
              case 'SHOT MASTER':
                winnerEffect = { type: 'resetManaIntake', value: 0 };
                loserEffect = { type: 'manaIntakeMultiply', value: 2 };
                break;
              default:
                if (card.name.includes('Name the most')) {
                  // 'Name the most' cards
                  const value = 5; // Default value for naming challenges
                  winnerEffect = { type: 'manaStealer', value: value };
                  loserEffect = { type: 'manaBurn', value: value };
                } else {
                  console.error('Unable to determine challenge effects for card', card);
                  throw new Error('Unable to determine challenge effects for card: ' + card.name);
                }
            }
          }

          // Apply effects to winner and loser

          const winnerResult = applyChallengeEffect(winner, winnerEffect, maxMana, card);
          const loserResult = applyChallengeEffect(loser, loserEffect, maxMana, card);

          Object.assign(winner, winnerResult);
          Object.assign(loser, loserResult);
        } catch (effectError) {
          console.error('Error applying challenge effects', effectError);
          throw new Error('Failed to apply challenge effects: ' + effectError.message);
        }

        const player = updatedPlayers.find(p => p.id === playerId);
        if (!player) {
          throw new Error('Player not found');
        }

        const cardIndex = player.cards.findIndex(c => c.id === card.id);
        if (cardIndex === -1) {
          throw new Error('Card not found in player\'s hand');
        }

        player.cards[cardIndex] = drawNewCard();

        const drunkThreshold = party.settings?.drunkThreshold ?? GAME_CONFIG.DRUNK_THRESHOLD;
        updatedPlayers.forEach(p => {
          p.isDrunk = (p.manaIntake || 0) >= drunkThreshold * 0.8;
        });

        // Update Firestore with challenge results
        transaction.update(partyRef, {
          players: updatedPlayers,
          lastAction: buildLastActionPayload({
            beforeStats,
            updatedPlayers,
            playerId: winnerId,
            targetId: loserId,
            cardId: card.id,
            cardName: card.name,
            cardType: card.effect.type,
            cardRarity: card.rarity,
            cardDescription: card.description,
            manaCost: card.manaCost,
          }),
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

  // Drink mana
  const drinkMana = useCallback(async (playerId: string) => {
    const partyRef = doc(db, 'parties', partyId);

    try {
      await runTransaction(db, async (transaction) => {
        const partyDoc = await transaction.get(partyRef);
        if (!partyDoc.exists()) throw new Error('Party not found');
        const party = partyDoc.data() as Party;

        const beforeStats = snapshotPlayerStats(party.players);

        const updatedPlayers = party.players.map(player => {
          if (player.id === playerId) {
            const manaGain = (party.settings?.manaDrinkAmount ?? GAME_CONFIG.MANA_DRINK_AMOUNT) *
              (player.potionMultiplier?.value ?? 1);

            // Add mana intake tracking
            const newManaIntake = (player.manaIntake || 0) + manaGain;
            const drunkThreshold = party.settings?.drunkThreshold ?? GAME_CONFIG.DRUNK_THRESHOLD;

            return {
              ...player,
              mana: Math.min(
                party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA,
                player.mana + manaGain
              ),
              manaIntake: newManaIntake,
              isDrunk: newManaIntake >= drunkThreshold * 0.8
            };
          }
          return player;
        });


        transaction.update(partyRef, {
          players: updatedPlayers,
          lastAction: buildLastActionPayload({
            beforeStats,
            updatedPlayers,
            playerId,
            targetId: playerId,
            cardId: 'drink',
            cardName: 'Drink Potion',
            cardType: 'forceDrink',
            cardRarity: 'common',
            cardDescription: `Drink ${party.settings?.manaDrinkAmount ?? GAME_CONFIG.MANA_DRINK_AMOUNT} mana.`,
            manaCost: 0,
          }),
        });
      });
      return true;
    } catch (error) {
      console.error('Error drinking mana:', error);
      throw error;
    }
  }, [partyId]);

  return { applyCardEffect, resolveChallengeCard, drinkMana };
}
