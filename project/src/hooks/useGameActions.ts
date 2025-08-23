import { useCallback } from 'react';
import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Card, Party } from '../types/game';
import { GAME_CONFIG } from '../config/gameConfig';
import { drawLegendaryCard, drawNewCard } from '../utils/cardGeneration';
import { getChallengeEffects, validateChallengeParticipants, applyChallengeEffect } from '../utils/challengeEffects';
import { CardEnhancer } from '../utils/cardEnhancer';
import { EffectManager } from '../utils/effectManager';

export function useGameActions(partyId: string) {

  // Apply a card effect
  const applyCardEffect = useCallback(async (playerId: string, targetId: string, card: Card) => {
    console.debug('applyCardEffect invoked', { playerId, targetId, card });
    const partyRef = doc(db, 'parties', partyId);

    try {
      await runTransaction(db, async (transaction) => {
        const partyDoc = await transaction.get(partyRef);
        if (!partyDoc.exists()) throw new Error('Party not found');
        const party = partyDoc.data() as Party;
        console.debug('Party state before applying card effect:', party);

        if (party.currentTurn !== playerId) throw new Error('Not player\'s turn');

        const updatedPlayers = [...party.players];
        const player = updatedPlayers.find(p => p.id === playerId);
        const target = updatedPlayers.find(p => p.id === targetId);

        if (!player || player.health <= 0) throw new Error('Player is dead');
        if (!target) throw new Error('Target not found');
        
        if (card.effect.type === 'damage' && target.health <= 0) throw new Error('Target is dead');

        // Create effect managers for each player and load their existing effects
        const playerEffectManagers = new Map<string, EffectManager>();
        updatedPlayers.forEach(p => {
          const effectManager = new EffectManager();
          if (p.effects && p.effects.length > 0) {
            effectManager.fromPlayerEffects(p.effects);
          }
          playerEffectManagers.set(p.id, effectManager);
        });

        const playerEffectManager = playerEffectManagers.get(playerId)!;
        const targetEffectManager = playerEffectManagers.get(targetId)!;
        const cardEnhancer = new CardEnhancer(playerEffectManager);

        // Process turn start effects for the current player
        const turnStartResults = playerEffectManager.processTurnStartEffects(playerId);
        if (turnStartResults.manaGain > 0) {
          player.mana = Math.min(
            party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA,
            player.mana + turnStartResults.manaGain
          );
          console.debug('Applied turn start mana gain:', turnStartResults.manaGain);
        }

        // Enhance the card before applying the effect
        const enhancedCard = cardEnhancer.enhanceCard(card);

        // Apply mana cost
        player.mana = Math.max(0, player.mana - enhancedCard.manaCost);
        console.debug('Deducting mana:', { currentMana: player.mana, cost: enhancedCard.manaCost });

        // Replace used card
        const cardIndex = player.cards.findIndex(c => c.id === enhancedCard.id);
        if (cardIndex !== -1) {
          console.debug('Replacing used card at index:', cardIndex);
          const cardTheme = party.settings?.cardTheme ?? 'electrical';
          player.cards[cardIndex] = drawNewCard(cardTheme);
        }

        // Check if the card is a special clash royale 1v1 one (support both ids)
        if (card.id === 'clash_royale_1v1' || card.id === 'clashroyale') {
          // special card...
          try {
            const audio = new Audio('/sounds/card_played.mp3');
            audio.play().catch(error => {
              console.error("Audio playback failed:", error);
            });
          } catch (error) {
            console.error("Audio playback failed:", error);
          }
        } 
        
        else {

          // Helper function to apply damage with reduction
          const applyDamageToPlayer = (targetPlayer: any, damage: number, targetPlayerEffectManager: EffectManager) => {
            const reducedDamage = targetPlayerEffectManager.calculateDamageReduction(damage);
            targetPlayer.health = Math.max(0, targetPlayer.health - reducedDamage);
            console.debug('Applied damage:', { original: damage, reduced: reducedDamage, targetId: targetPlayer.id });
            return reducedDamage;
          };

          // Apply the card effect
          switch (enhancedCard.effect.type) {
            
            // --------------------------------------------------------------------------------------

            case 'damage':
              applyDamageToPlayer(target, enhancedCard.effect.value, targetEffectManager);
              break;

            // --------------------------------------------------------------------------------------

            case 'aoeDamage':
              // Apply damage to all players in the game, including the player using the card
              updatedPlayers.forEach(p => {
                const pEffectManager = playerEffectManagers.get(p.id)!;
                applyDamageToPlayer(p, enhancedCard.effect.value, pEffectManager);
              });
              break;

            // --------------------------------------------------------------------------------------

            case 'heal':
              const maxHealth = party.settings?.maxHealth ?? GAME_CONFIG.MAX_HEALTH;
              console.debug('Applying heal effect:', { targetId, heal: enhancedCard.effect.value, maxHealth });
              target.health = Math.min(maxHealth, target.health + enhancedCard.effect.value);
              break;

            // --------------------------------------------------------------------------------------

            case 'life-steal':
              let enemyHealth = target.health;
              target.health = player.health;
              player.health = enemyHealth;
              break;

            // --------------------------------------------------------------------------------------

            case 'manaDrain':
              const drainAmount = Math.min(target.mana, enhancedCard.effect.value);
              console.debug('Applying manaDrain:', { targetId, drainAmount });
              target.mana -= drainAmount;
              player.mana = Math.min(
                party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA,
                player.mana + drainAmount
              );
              break;

            // --------------------------------------------------------------------------------------
            
            case 'manaBurn':
              const burnDamage = target.mana / 2;
              console.debug('Applying manaBurn effect:', { targetId, burnDamage });
              applyDamageToPlayer(target, burnDamage, targetEffectManager);
              target.mana = 0;
              break;

            // --------------------------------------------------------------------------------------
            
            case 'reversed-curse-tech':
              player.health = Math.min(party.settings?.maxHealth ?? GAME_CONFIG.MAX_HEALTH
                , player.health + target.health / 2);
              break;

            // --------------------------------------------------------------------------------------

            case 'manaRefill':
              console.debug('Applying manaRefill:', { playerId });
              player.mana = party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA;
              break;

            // --------------------------------------------------------------------------------------
            
            case 'manaRefillNextTurn':
              console.debug('Applying next turn mana refill:', { playerId, amount: enhancedCard.effect.value });
              playerEffectManager.addNextTurnEffect({
                stackId: 'next_turn_mana',
                type: 'buff',
                value: enhancedCard.effect.value,
                duration: { turnsLeft: 2, initialDuration: 2 }, // Will trigger on next turn
                source: card.id,
              });
              break;

            // --------------------------------------------------------------------------------------
            
            case 'potionBuff':
              playerEffectManager.addPotionEffect({
                type: 'buff',
                value: enhancedCard.effect.value,
                duration: { turnsLeft: 3, initialDuration: 3 },
                source: card.id,
              });
              break;
              
            // --------------------------------------------------------------------------------------
            
            case 'debuff':
              targetEffectManager.addPotionEffect({
                type: 'debuff',
                value: enhancedCard.effect.value,
                duration: { turnsLeft: 3, initialDuration: 3 },
                source: card.id,
              });
              break;
              
            // --------------------------------------------------------------------------------------

            case 'roulette':
              applyDamageToPlayer(target, enhancedCard.effect.value, targetEffectManager);
              // Apply random targeting logic
              const randomTarget = updatedPlayers[Math.floor(Math.random() * updatedPlayers.length)];
              const randomTargetEffectManager = playerEffectManagers.get(randomTarget.id)!;
              applyDamageToPlayer(randomTarget, enhancedCard.effect.value, randomTargetEffectManager);
              break;

            // --------------------------------------------------------------------------------------

            case 'forceDrink':
              console.debug('Applying forceDrink effect:', { targetId });
              break;

            case 'energi_i_rummet':
              console.debug('Någon har inte matchat energin i rummet... -->', { targetId });
              applyDamageToPlayer(target, card.effect.value, targetEffectManager);
              applyDamageToPlayer(player, card.effect.value, playerEffectManager);
              break;
              
            // --------------------------------------------------------------------------------------
            // NEW ELECTRICAL ENGINEERING EFFECTS
            // --------------------------------------------------------------------------------------

            case 'impedance':
              console.debug('Applying impedance effect (voltage divider):', { playerId });
              // Add defensive buff that reduces damage but costs mana
              playerEffectManager.addPotionEffect({
                stackId: 'impedance_protection',
                type: 'buff',
                value: enhancedCard.effect.value, // 0.5 = 50% damage reduction
                duration: { turnsLeft: 2, initialDuration: 2 },
                source: card.id,
              });
              // Cost 1 mana for using resistor network
              player.mana = Math.max(0, player.mana - 1);
              break;

            case 'frequency_response':
              console.debug('Applying AC waveform (frequency response):', { targetId });
              // Deal damage twice like AC current
              applyDamageToPlayer(target, enhancedCard.effect.value, targetEffectManager);
              applyDamageToPlayer(target, enhancedCard.effect.value, targetEffectManager);
              break;

            case 'power_factor':
              console.debug('Applying power factor correction:', { targetId });
              // Efficiency calculation - damage based on target's mana/health ratio
              const efficiency = target.mana / Math.max(target.health, 1);
              const powerDamage = enhancedCard.effect.value * (1 + efficiency);
              applyDamageToPlayer(target, powerDamage, targetEffectManager);
              break;

            case 'electromagnetic_pulse':
              console.debug('Applying EMP effect to all players');
              // Wipe out all mana from all players (like EMP destroying electronics)
              // Also deal damage to all players
              updatedPlayers.forEach(p => {
                p.mana = 0;
                const pEffectManager = playerEffectManagers.get(p.id)!;
                applyDamageToPlayer(p, enhancedCard.effect.value, pEffectManager);
              });
              break;

            case 'signal_amplify':
              console.debug('Applying signal amplification buff:', { playerId });
              // Next card effect is amplified
              playerEffectManager.addPotionEffect({
                stackId: 'signal_boost',
                type: 'buff',
                value: enhancedCard.effect.value, // 1.5 = 150% amplification
                duration: { turnsLeft: 1, initialDuration: 1 },
                source: card.id,
              });
              break;

            case 'noise_filter':
              console.debug('Applying noise filtering (damage reduction):', { playerId });
              // Reduce incoming damage for multiple turns
              playerEffectManager.addPotionEffect({
                stackId: 'noise_filter',
                type: 'buff',
                value: enhancedCard.effect.value, // 0.5 = 50% damage reduction
                duration: { turnsLeft: 3, initialDuration: 3 },
                source: card.id,
              });
              break;

            case 'resonance':
              console.debug('Applying resonance effect:', { targetId });
              // Resonant frequency causes oscillating damage
              const resonanceDamage = enhancedCard.effect.value;
              applyDamageToPlayer(target, resonanceDamage, targetEffectManager);
              // Also affects random adjacent player
              const adjacentTarget = updatedPlayers[Math.floor(Math.random() * updatedPlayers.length)];
              const adjacentTargetEffectManager = playerEffectManagers.get(adjacentTarget.id)!;
              applyDamageToPlayer(adjacentTarget, resonanceDamage / 2, adjacentTargetEffectManager);
              break;

            case 'transformer_isolation':
              console.debug('Applying transformer isolation protection:', { playerId });
              // Complete immunity for 1 turn
              playerEffectManager.addPotionEffect({
                stackId: 'isolation_immunity',
                type: 'buff',
                value: 1.0, // 100% damage immunity
                duration: { turnsLeft: Math.floor(enhancedCard.effect.value), initialDuration: Math.floor(enhancedCard.effect.value) },
                source: card.id,
              });
              break;

            // --------------------------------------------------------------------------------------
            // LEGENDARY CARDS
            // --------------------------------------------------------------------------------------

            case 'oskar':
              console.debug('Applying Oskar legendary effect');
              updatedPlayers.forEach(p => {
                const pEffectManager = playerEffectManagers.get(p.id)!;
                applyDamageToPlayer(p, enhancedCard.effect.value, pEffectManager);
                p.mana = Math.max(0, p.mana / 2);
              });
              break;

            case 'jesper':
              console.debug('Applying Jesper legendary effect - 80% success rate');
              const success = Math.random() < 0.8;
              if (success) {
                console.debug('Jesper effect succeeded!');
                player.health = party.settings?.maxHealth ?? GAME_CONFIG.MAX_HEALTH;
                player.mana = party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA;
              } else {
                console.debug('Jesper effect failed!');
                // Player takes the consequence instead
              }
              break;

            case 'markus':
              console.debug('Applying Markus legendary effect');
              // Player draws 3 legendary cards and loses half of current health
              for (let i = 0; i < 3; i++) {
                const legendaryCard = drawLegendaryCard(party.settings?.cardTheme);
                player.cards.push(legendaryCard);
              }
              player.health = Math.max(0, Math.floor(player.health / 2));
              break;

            case 'sam': {
              const alivePlayersCount = updatedPlayers.filter(p => p.health > 0).length;
              playerEffectManager.addPotionEffect({
                stackId: 'untargetable',
                type: 'untargetable',
                value: 0,
                duration: { turnsLeft: alivePlayersCount * 2, initialDuration: alivePlayersCount * 2 },
                source: card.id,
              });
              break;
            }

            case 'adam':
              console.debug('Applying Adam legendary effect');
              // Remove all legendary cards from enemies' hands
              updatedPlayers.forEach(p => {
                if (p.id !== player.id) {
                  p.cards = p.cards.filter(c => !c.isLegendary);
                }
              });
              // Deal damage equal to number of legendary cards in the player's hand to all enemies
              const legendaryCount = player.cards.filter(c => c.isLegendary).length;
              updatedPlayers.forEach(p => {
                if (p.id !== player.id) {
                  const pEffectManager = playerEffectManagers.get(p.id)!;
                  applyDamageToPlayer(p, legendaryCount, pEffectManager);
                }
              });
              break;

            case 'card-draw':
              console.debug('Applying card draw effect:', { targetId });
              const cardTheme = party.settings?.cardTheme ?? 'electrical';
              target.cards.push(drawNewCard(cardTheme));
              break;

            default:
              console.warn('Unknown effect type:', enhancedCard.effect.type);
              break;
          }
        }

        console.debug('Updating players state after effect:', updatedPlayers);
        
        // Update effects for all players and sync to player state
        updatedPlayers.forEach(p => {
          const effectManager = playerEffectManagers.get(p.id)!;
          effectManager.updateEffects();
          p.effects = effectManager.toPlayerEffects();
        });

        // Calculate next turn and game status - skip disconnected players
        const alivePlayers = updatedPlayers.filter(p => p.health > 0);
        const connectedAlivePlayers = alivePlayers.filter(p => p.connectionStatus === 'connected');
        const status = connectedAlivePlayers.length <= 1 ? 'finished' : 'playing';
        
        // Find next connected, alive player
        let nextPlayerId = playerId;
        if (connectedAlivePlayers.length > 0) {
          const currentPlayerIndex = updatedPlayers.findIndex(p => p.id === playerId);
          let nextIndex = (currentPlayerIndex + 1) % updatedPlayers.length;
          
          // Skip disconnected or dead players
          let attempts = 0;
          while (attempts < updatedPlayers.length) {
            const nextPlayer = updatedPlayers[nextIndex];
            if (nextPlayer && nextPlayer.health > 0 && nextPlayer.connectionStatus === 'connected') {
              nextPlayerId = nextPlayer.id;
              break;
            }
            nextIndex = (nextIndex + 1) % updatedPlayers.length;
            attempts++;
          }
          
          // Fallback to first connected alive player
          if (attempts >= updatedPlayers.length && connectedAlivePlayers.length > 0) {
            nextPlayerId = connectedAlivePlayers[0].id;
          }
        }

        // Set winner if game finished (store only the player ID)
        const winnerId = status === 'finished' && connectedAlivePlayers.length === 1 
          ? connectedAlivePlayers[0].id 
          : null;

        // Update Firestore
        transaction.update(partyRef, {
          players: updatedPlayers,
          status,
          currentTurn: nextPlayerId,
          winner: winnerId,
          lastAction: {
            playerId,
            targetId,
            cardId: card.id,
            cardName: card.name,
            cardType: card.effect.type,
            cardRarity: card.rarity,
            cardDescription: card.description,
          },
        });
      });

      console.info('Card effect applied successfully');
    } catch (error) {
      console.error('Error applying card effect:', error);
      throw error;
    }
  }, [partyId]);

  // Resolve a challenge card
  const resolveChallengeCard = useCallback(async (playerId: string, card: Card, winnerId: string, loserId: string) => {
    console.debug('resolveChallengeCard invoked', { playerId, card, winnerId, loserId });
    
    if (!card.effect.challengeEffects) {
      throw new Error('Challenge effects not defined for this card');
    }

    const partyRef = doc(db, 'parties', partyId);

    try {
      await runTransaction(db, async (transaction) => {
        const partyDoc = await transaction.get(partyRef);
        if (!partyDoc.exists()) throw new Error('Party not found');
        
        const party = partyDoc.data() as Party;
        if (party.currentTurn !== playerId) throw new Error('Not player\'s turn');

        const updatedPlayers = [...party.players];
        const winner = updatedPlayers.find(p => p.id === winnerId);
        const loser = updatedPlayers.find(p => p.id === loserId);

        // Validate participants
        const validation = validateChallengeParticipants(winnerId, loserId, updatedPlayers);
        if (!validation.isValid) {
          throw new Error(validation.error);
        }

        if (!winner || !loser) throw new Error('Winner or loser not found');

        // Apply challenge effects
        const effects = getChallengeEffects(card);
        const maxHealth = party.settings?.maxHealth ?? GAME_CONFIG.MAX_HEALTH;
        const maxMana = party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA;

        // Apply effects to winner and loser
        const winnerResult = applyChallengeEffect(winner, effects.winner, maxHealth, maxMana, card);
        const loserResult = applyChallengeEffect(loser, effects.loser, maxHealth, maxMana, card);

        

        if (card.name === "AH ELLER HUR" && winnerId !== playerId) {
          // Set enemies' mana to zero directly
          updatedPlayers.forEach(player => {
            if (player.id !== playerId) {
              player.mana = 0;
            }
          });
        
          console.log("Updated enemies' mana to zero:", updatedPlayers);
        
          console.log("Trying to play audio files");
        
          const audioFile1 = "/audio/mini-pekka-child.mp3";
          const audioFile2 = "/audio/mini-pekka.mp3";
          const audioFile3 = "/audio/ahelrhur.mp3";
        
          const audio1 = new Audio(audioFile1); // Initialize first audio object
          const audio2 = new Audio(audioFile2); // Initialize second audio object
          const audio3 = new Audio(audioFile3); // Initialize third audio object
        
          audio1.volume = 1;
          audio2.volume = 1;
          audio3.volume = 1;
        
          // Play audio1 and audio2 concurrently
          Promise.all([audio1.play(), audio2.play()])
            .then(() => {
              console.log("Both audio files finished playing, starting audio3");
              // Wait for both audio1 and audio2 to end before playing audio3
              return Promise.all([
                new Promise(resolve => (audio1.onended = resolve)),
                new Promise(resolve => (audio2.onended = resolve)),
              ]);
            })
            .then(() => {
              // Play audio3 after audio1 and audio2 have finished
              audio3.play().then(() => {
                console.log("Audio3 is playing");
              });
            })
            .catch(error => {
              console.error("Audio playback failed:", error);
            });
        }
        
        

        // Update player states
        Object.assign(winner, winnerResult);
        Object.assign(loser, loserResult);

        // Replace used card
        const player = updatedPlayers.find(p => p.id === playerId);
        if (!player) throw new Error('Player not found');

        const cardIndex = player.cards.findIndex(c => c.id === card.id);
        if (cardIndex === -1) throw new Error('Card not found in player\'s hand');

        player.cards[cardIndex] = drawNewCard();

        // Calculate next turn and game status - skip disconnected players
        const alivePlayers = updatedPlayers.filter(p => p.health > 0);
        const connectedAlivePlayers = alivePlayers.filter(p => p.connectionStatus === 'connected');
        const status = connectedAlivePlayers.length <= 1 ? 'finished' : 'playing';
        
        // Find next connected, alive player
        let nextPlayerId = playerId;
        if (connectedAlivePlayers.length > 0) {
          const currentPlayerIndex = updatedPlayers.findIndex(p => p.id === playerId);
          let nextIndex = (currentPlayerIndex + 1) % updatedPlayers.length;
          
          // Skip disconnected or dead players
          let attempts = 0;
          while (attempts < updatedPlayers.length) {
            const nextPlayer = updatedPlayers[nextIndex];
            if (nextPlayer && nextPlayer.health > 0 && nextPlayer.connectionStatus === 'connected') {
              nextPlayerId = nextPlayer.id;
              break;
            }
            nextIndex = (nextIndex + 1) % updatedPlayers.length;
            attempts++;
          }
          
          // Fallback to first connected alive player
          if (attempts >= updatedPlayers.length && connectedAlivePlayers.length > 0) {
            nextPlayerId = connectedAlivePlayers[0].id;
          }
        }

        // Update Firestore
        transaction.update(partyRef, {
          players: updatedPlayers,
          status,
          currentTurn: nextPlayerId,
          winner: status === 'finished' && connectedAlivePlayers.length === 1 ? connectedAlivePlayers[0].id : null,
          lastAction: {
            playerId: winnerId,
            targetId: loserId,
            cardId: card.id,
            cardName: card.name,
            cardType: card.effect.type,
            cardRarity: card.rarity,
            cardDescription: card.description,
          },
        });
      });


      console.info('Challenge resolved successfully');
    } catch (error) {
      console.error('Error resolving challenge:', error);
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

        const updatedPlayers = party.players.map(player => {
          if (player.id === playerId) {
            const manaGain = (party.settings?.manaDrinkAmount ?? GAME_CONFIG.MANA_DRINK_AMOUNT) * 
              (player.potionMultiplier?.value ?? 1);
            return {
              ...player,
              mana: Math.min(
                party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA,
                player.mana + manaGain
              )
            };
          }
          return player;
        });

        transaction.update(partyRef, {
          players: updatedPlayers,
          lastAction: {
            type: 'drink',
            playerId,
            value: party.settings?.manaDrinkAmount ?? GAME_CONFIG.MANA_DRINK_AMOUNT,
            timestamp: Date.now()
          }
        });

        console.debug('Mana drink successful');
      });
    } catch (error) {
      console.error('Error drinking mana:', error);
      throw error;
    }
  }, [partyId]);

  return { applyCardEffect, resolveChallengeCard, drinkMana };
}