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


  const effectManager = new EffectManager();
  const cardEnhancer = new CardEnhancer(effectManager);

  // Decay mana intake and update turn
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

        // Save current settings before update to preserve them
        const currentSettings = party.settings;
        
        // Log settings to ensure they're preserved
        console.debug('Current settings before end turn update:', currentSettings);

        // Only update the currentTurn field, preserving all other fields
        // including settings and players
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

        if (!player) throw new Error('Player not found');
        if (!target) throw new Error('Target not found');
        
        // Enhance the card before applying the effect
        const enhancedCard = cardEnhancer.enhanceCard(card);

        // Apply mana cost
        player.mana = Math.max(0, player.mana - enhancedCard.manaCost);
        console.debug('Deducting mana:', { currentMana: player.mana, cost: enhancedCard.manaCost });

        // Replace used card
        const cardIndex = player.cards.findIndex(c => c.id === enhancedCard.id);
        if (cardIndex !== -1) {
          console.debug('Replacing used card at index:', cardIndex);
          player.cards[cardIndex] = drawNewCard();
        }

        // Apply the effect
        try {
          console.debug('Applying card effect:', enhancedCard.effect);
          
          switch (enhancedCard.effect.type) {
            
            // --------------------------------------------------------------------------------------

            case 'damage':
              target.mana = Math.max(0, target.mana - enhancedCard.effect.value);
              break;


              // --------------------------------------------------------------------------------------

            case 'aoeDamage':
              // Apply damage to all players' mana in the game, including the player using the card
              updatedPlayers.forEach(p => {
                p.mana = Math.max(0, p.mana - enhancedCard.effect.value);
              });
              break;

              
            // --------------------------------------------------------------------------------------


            case 'heal':
              const maxMana = party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA;
              console.debug('Applying heal effect:', { targetId, heal: enhancedCard.effect.value, maxMana });
              target.mana = Math.min(maxMana, target.mana + enhancedCard.effect.value);
              break;


            // --------------------------------------------------------------------------------------


            case 'life-steal':
              let enemyMana = target.mana;
              target.mana = player.mana;
              player.mana = enemyMana;
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
              const burnAmount = Math.ceil(target.mana / 2);
              console.debug('Applying manaBurn effect:', { targetId, burnAmount });
              target.mana = Math.max(0, target.mana - burnAmount);
              target.manaIntake = (target.manaIntake || 0) + burnAmount;
              break;


            // --------------------------------------------------------------------------------------
            
            case 'reversed-curse-tech':
              player.mana = Math.min(party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA
                , player.mana + target.mana / 2);
              break;


            // --------------------------------------------------------------------------------------


            case 'manaRefill':
              console.debug('Applying manaRefill:', { playerId });
              player.mana = party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA;
              break;

            // --------------------------------------------------------------------------------------
            
            
            case 'potionBuff':
              effectManager.addPotionEffect({
                type: 'buff',
                value: enhancedCard.effect.value,
                duration: { turnsLeft: 3, initialDuration: 3 },
                source: card.id,
              });
              break;
              
                
            // --------------------------------------------------------------------------------------
            
            case 'debuff':
              effectManager.addPotionEffect({
                type: 'debuff',
                value: enhancedCard.effect.value,
                duration: { turnsLeft: 3, initialDuration: 3 },
                source: card.id,
              });
              break;
              
                
            // --------------------------------------------------------------------------------------


            case 'roulette':
              target.manaIntake = (target.manaIntake || 0) + enhancedCard.effect.value;
              // Apply random targeting logic
              const randomTarget = updatedPlayers[Math.floor(Math.random() * updatedPlayers.length)];
              randomTarget.manaIntake = (randomTarget.manaIntake || 0) + enhancedCard.effect.value;
              break;


            // --------------------------------------------------------------------------------------

            case 'forceDrink':
              console.debug('Applying forceDrink effect:', { targetId });
              const drinkAmount = party.settings?.manaDrinkAmount ?? GAME_CONFIG.MANA_DRINK_AMOUNT;
              target.mana = Math.min(
                party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA,
                target.mana + drinkAmount
              );
              target.manaIntake = (target.manaIntake || 0) + drinkAmount;
              break;



            case 'energi_i_rummet':
              console.debug('Någon har inte matchat energin i rummet... -->', { targetId });
              target.manaIntake = (target.manaIntake || 0) + enhancedCard.effect.value;
              player.manaIntake = (player.manaIntake || 0) + enhancedCard.effect.value;
              break;
              
                
                
  // ------------ CUSTOM LEGENDARY CARDS --------------------------------------------------------------------------

            case 'oskar':
              console.debug('Applying oskars legendary to:', { targetId });
              // Deal damage to all other players and half their mana
              updatedPlayers.forEach(p => {
                if (p.id !== playerId) {
                  // Deal damage
                  p.health = Math.max(0, p.health - enhancedCard.effect.value);

                  // Half their mana
                  p.mana = p.mana / 2;
                }
              });



              const audioFile1 = "/audio/oskar2.mp3";
              const audioFile2 = "/audio/oskar.mp3";
              
              const audio1 = new Audio(audioFile1); // Initialize first audio object
              const audio2 = new Audio(audioFile2); // Initialize second audio object
              
              audio1.volume = 0.8;
              audio2.volume = 0.8;

              audio1.play().catch((error) => {
                console.error("Audio playback failed:", error);
              });
              audio2.play().catch((error) => {
                console.error("Audio playback failed:", error);
              });



              break;

              // -----------------------------------------------------------------------------------

              case 'jesper': {
                // Generate a random number to determine success (15% chance)
              
                if (Math.random() <= 0.70) {
                  // Fully restore the player's stats
                  player.health = party.settings?.maxHealth ?? GAME_CONFIG.MAX_HEALTH;
                  player.mana = party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA;
                }


                const audioFile1 = "/audio/jesper.mp3";
                const audioFile2 = "/audio/jesper2.mp3";
                
                const audio1 = new Audio(audioFile1); // Initialize first audio object
                const audio2 = new Audio(audioFile2); // Initialize second audio object
                
                audio1.volume = 0.8;
                audio2.volume = 0.8;
                
                Promise.all([audio1.play(), audio2.play()])
                  .then(() => {
                    console.log("Both audio files are playing");
                  })
                  .catch((error) => {
                    console.error("Audio playback failed:", error);
                  });

              
                break;
              }


              // ---------------FELLAN IS PLACED AS A CHALLENGE CARD, LOOK IN challengeEffects.ts--------------------------------------------------------------------


              case 'markus': {
                // Draw 2 legendary cards for the player using the card
                const legendaryCard1 = drawLegendaryCard();
                const legendaryCard2 = drawLegendaryCard();
                
                // Add the drawn cards to the player's hand
                player.cards.push(legendaryCard1, legendaryCard2);

                player.health = player.health / 2;
                
                console.log("Trying to play audio files");

                const audioFile1 = "/audio/hub.mp3";
                const audioFile2 = "/audio/vafangorumannen.mp3";
                
                const audio1 = new Audio(audioFile1); // Initialize first audio object
                const audio2 = new Audio(audioFile2); // Initialize second audio object
                
                audio1.volume = 0.8;
                audio2.volume = 0.8;
                
                Promise.all([audio1.play(), audio2.play()])
                  .then(() => {
                    console.log("Both audio files are playing");
                  })
                  .catch((error) => {
                    console.error("Audio playback failed:", error);
                  });

                  

                break;
              }

              // -----------------------------------------------------------------------------------

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
              
              
              
              // -----------------------------------------------------------------------------------

              
              case 'adam': {
                const targetEnemies = updatedPlayers.filter(p => p.id !== playerId); // Exclude the player using the card

                targetEnemies.forEach(enemy => {
                  const legendaryCards = enemy.cards.filter(card => card.isLegendary);

                  // Remove legendary cards and replace each with a new random card
                  enemy.cards = enemy.cards.filter(card => !card.isLegendary);
                  legendaryCards.forEach(() => {
                    enemy.cards.push(drawNewCard());
                  });

                  // Deal damage equal to the number of legendary cards the player has
                  const playerLegendaryCount = player.cards.filter(card => card.isLegendary).length;
                  enemy.mana = Math.max(0, enemy.mana - (playerLegendaryCount + 1)); //include the card just played as one
                });




                console.log("Trying to play auido file");
                const audioFile = "/audio/meow.mp3";
                const audio = new Audio(audioFile); // Initialize audio object
                audio.volume = 0.8;
                audio.play().catch((error) => {
                  console.error("Audio playback failed:", error);
                });


              
                break;
              }


              case 'said': {
                const targetEnemies = updatedPlayers.filter(p => p.id !== playerId); // Exclude the player using the card

                targetEnemies.forEach(enemy => {
                  enemy.mana = 1;
                });
              
                break;
              }

              
            case 'manaShield':
              console.debug('Applying manaShield effect:', { playerId, value: enhancedCard.effect.value });
              effectManager.addManaShield({
                reduction: enhancedCard.effect.value, // Value between 0-1 representing percentage reduction
                duration: { turnsLeft: 3, initialDuration: 3 },
                source: card.id,
              });
              break;

            case 'manaIntakeMultiplier':
              console.debug('Applying manaIntakeMultiplier effect:', { targetId, value: enhancedCard.effect.value });
              effectManager.addIntakeEffect({
                type: 'multiply',
                value: enhancedCard.effect.value,
                duration: { turnsLeft: 3, initialDuration: 3 },
                source: card.id,
              });
              break;

            case 'manaIntakeReduction':
              console.debug('Applying manaIntakeReduction effect:', { playerId, value: enhancedCard.effect.value });
              effectManager.addIntakeEffect({
                type: 'multiply',
                value: 1 - enhancedCard.effect.value, // Convert reduction to multiplier (e.g. 0.3 reduction becomes 0.7 multiplier)
                duration: { turnsLeft: 3, initialDuration: 3 },
                source: card.id,
              });
              break;

            case 'increaseIntake':
              console.debug('Applying increaseIntake effect:', { targetId, value: enhancedCard.effect.value });
              target.manaIntake = (target.manaIntake || 0) + enhancedCard.effect.value;
              break;

            case 'manaOverload':
              console.debug('Applying manaOverload effect:', { targetId, value: enhancedCard.effect.value });
              target.mana = Math.min(
                party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA,
                target.mana + 2
              );
              target.manaIntake = (target.manaIntake || 0) + enhancedCard.effect.value;
              break;

            case 'resetIntake':
              console.debug('Applying resetIntake effect:', { targetId });
              target.manaIntake = 0;
              break;

            case 'soberingPotion':
              console.debug('Applying soberingPotion effect:', { playerId, value: enhancedCard.effect.value });
              player.manaIntake = Math.max(0, player.manaIntake * (1 - enhancedCard.effect.value));
              break;

            case 'goldenLiver':
              console.debug('Applying goldenLiver effect:', { playerId, value: enhancedCard.effect.value });
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
              console.debug('Applying divineSobriety effect:', { playerId, value: enhancedCard.effect.value });
              player.manaIntake = 0;
              player.mana = Math.min(
                party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA,
                player.mana + enhancedCard.effect.value
              );
              break;

            case 'manaSwapAny':
              console.debug('Applying manaSwapAny effect:', { winnerId, loserId });
              // This will be handled in the challenge resolution, as it needs the winner and target selection
              break;

            case 'manaStealAny':
              console.debug('Applying manaStealAny effect:', { winnerId, loserId });
              // This will be handled in the challenge resolution, as it needs the winner and target selection
              break;

            case 'manaExplosion':
              console.debug('Applying manaExplosion effect to all players:', { value: enhancedCard.effect.value });
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
              console.debug('Applying aoeManaBurst effect to all players:', { value: enhancedCard.effect.value });
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
              console.debug('Applying manaHurricane effect to all players');
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
              // This is a special effect that will be handled in the UI with a custom modal
              // It lets you set any player's mana and mana intake values
              console.debug('Applying partyMaster effect:', { targetId });
              break;
          }
          
          // Apply any additional effects from the effect manager
          effectManager.applyAllEffects(player, target);
          
        } catch (effectError) {
          console.error('Error applying card effect:', effectError);
          throw new Error('Failed to apply card effect');
        }
        
        // Check if any player is drunk (over the threshold)
        const drunkThreshold = party.settings?.drunkThreshold ?? GAME_CONFIG.DRUNK_THRESHOLD;
        updatedPlayers.forEach(p => {
          p.isDrunk = (p.manaIntake || 0) >= drunkThreshold * 0.8;
        });
        
        // Save current settings before update to preserve them
        const currentSettings = party.settings;
        
        // Log settings to ensure they're preserved
        console.debug('Current settings before card effect update:', currentSettings);
        
        // Only update specific fields to prevent settings overwrite
        transaction.update(partyRef, {
          players: updatedPlayers,
          lastAction: {
            playerId,
            targetId,
            cardId: card.id,
            cardName: card.name,
            cardType: enhancedCard.effect.type,
            cardRarity: card.rarity,
            cardDescription: card.description,
          }
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
    console.debug('resolveChallengeCard invoked', { playerId, winnerId, loserId, card });
    
    // Log detailed card info for debugging
    console.debug('Challenge card details:', {
      id: card.id,
      name: card.name,
      type: card.type,
      effectType: card.effect.type,
      hasWinnerEffect: !!card.effect.winnerEffect,
      hasLoserEffect: !!card.effect.loserEffect,
      hasChallengeEffects: !!card.effect.challengeEffects
    });
    
    // Check if challenge effects are defined in any of the supported formats
    if (!card.effect.challengeEffects && !card.effect.winnerEffect && !card.effect.loserEffect && !card.name.includes('Name the most') && 
        card.name !== 'Öl Hävf' && card.name !== 'Got Big Muscles?' && card.name !== 'Shot Contest' && card.name !== 'SHOT MASTER') {
      console.error('Challenge effects not defined for this card:', card);
      throw new Error('Challenge effects not defined for this card: ' + card.name);
    }

    // Verify input parameters
    if (!playerId || !winnerId || !loserId) {
      console.error('Missing required parameters', { playerId, winnerId, loserId });
      throw new Error('Missing required parameters for challenge resolution');
    }

    const partyRef = doc(db, 'parties', partyId);

    try {
      await runTransaction(db, async (transaction) => {
        const partyDoc = await transaction.get(partyRef);
        if (!partyDoc.exists()) {
          console.error('Party not found');
          throw new Error('Party not found');
        }
        
        const party = partyDoc.data() as Party;
        if (party.currentTurn !== playerId) {
          console.error('Not player\'s turn', { currentTurn: party.currentTurn, playerId });
          throw new Error('Not player\'s turn');
        }

        const updatedPlayers = [...party.players];
        const winner = updatedPlayers.find(p => p.id === winnerId);
        const loser = updatedPlayers.find(p => p.id === loserId);

        // Validate participants
        const validation = validateChallengeParticipants(winnerId, loserId, updatedPlayers);
        if (!validation.isValid) {
          console.error('Invalid challenge participants', validation.error);
          throw new Error(validation.error);
        }

        if (!winner || !loser) {
          console.error('Winner or loser not found', { winnerId, loserId, updatedPlayers });
          throw new Error('Winner or loser not found');
        }

        // Apply challenge effects
        let winnerEffect;
        let loserEffect;
        const maxMana = party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA;

        try {
          // Determine challenge effects based on the card structure or name
          if (card.effect.winnerEffect && card.effect.loserEffect) {
            // Direct winner/loser effects
            winnerEffect = card.effect.winnerEffect;
            loserEffect = card.effect.loserEffect;
            console.debug('Using direct winner/loser effects', { winnerEffect, loserEffect });
          } else if (card.effect.challengeEffects?.winner && card.effect.challengeEffects?.loser) {
            // Effects nested in challengeEffects
            winnerEffect = card.effect.challengeEffects.winner;
            loserEffect = card.effect.challengeEffects.loser;
            console.debug('Using nested challenge effects', { winnerEffect, loserEffect });
          } else {
            // Fallback for cards with non-standard effects
            console.debug('Using fallback effects for card:', card.name);
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
            console.debug('Fallback effects determined', { winnerEffect, loserEffect });
          }

          // Apply effects to winner and loser
          console.debug('Applying effects to participants', { 
            winner: winner.name, 
            loser: loser.name,
            winnerEffect,
            loserEffect
          });
          
          const winnerResult = applyChallengeEffect(winner, winnerEffect, maxMana, card);
          const loserResult = applyChallengeEffect(loser, loserEffect, maxMana, card);

          // Update player states
          Object.assign(winner, winnerResult);
          Object.assign(loser, loserResult);
        } catch (effectError) {
          console.error('Error applying challenge effects', effectError);
          throw new Error('Failed to apply challenge effects: ' + effectError.message);
        }

        // Replace used card
        const player = updatedPlayers.find(p => p.id === playerId);
        if (!player) {
          console.error('Player not found', { playerId, updatedPlayers });
          throw new Error('Player not found');
        }

        const cardIndex = player.cards.findIndex(c => c.id === card.id);
        if (cardIndex === -1) {
          console.error('Card not found in player\'s hand', { card, playerCards: player.cards });
          throw new Error('Card not found in player\'s hand');
        }

        player.cards[cardIndex] = drawNewCard();

        // Check if any player is drunk (over the threshold)
        const drunkThreshold = party.settings?.drunkThreshold ?? GAME_CONFIG.DRUNK_THRESHOLD;
        updatedPlayers.forEach(p => {
          p.isDrunk = (p.manaIntake || 0) >= drunkThreshold * 0.8;
        });

        // Save current settings before update to preserve them
        const currentSettings = party.settings;
        
        // Log settings to ensure they're preserved
        console.debug('Current settings before challenge update:', currentSettings);

        // Update Firestore with challenge results but don't change turn yet
        // Only update specific fields to avoid overwriting settings
        transaction.update(partyRef, {
          players: updatedPlayers,
          lastAction: {
            playerId: winnerId,
            targetId: loserId,
            cardId: card.id,
            cardName: card.name,
            cardType: card.effect.type,
            cardRarity: card.rarity,
            cardDescription: card.description,
          }
        });
        
        console.debug('Challenge transaction completed successfully');
      });

      // End turn and decay mana intake
      await endTurn(playerId);

      console.info('Challenge resolved successfully');
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

        // Save current settings before update to preserve them
        const currentSettings = party.settings;
        
        // Log settings to ensure they're preserved
        console.debug('Current settings before drink mana update:', currentSettings);

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

        // Only update specific fields to avoid overwriting settings
        transaction.update(partyRef, {
          players: updatedPlayers,
          lastAction: {
            playerId,
            cardId: 'drink',
            cardName: 'Drink Potion',
            cardType: 'forceDrink',
            cardRarity: 'common',
            cardDescription: `Drink ${party.settings?.manaDrinkAmount ?? GAME_CONFIG.MANA_DRINK_AMOUNT} mana.`,
          }
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