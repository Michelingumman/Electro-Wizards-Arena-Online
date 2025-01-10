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





        // Apply the card effect
        switch (enhancedCard.effect.type) {
          
          // --------------------------------------------------------------------------------------

          case 'damage':
            target.health = Math.max(0, target.health - enhancedCard.effect.value);
            break;


            // --------------------------------------------------------------------------------------

          case 'aoeDamage':
            // Apply damage to all players in the game, including the player using the card
            updatedPlayers.forEach(p => {
              p.health = Math.max(0, p.health - enhancedCard.effect.value);
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
            target.health = Math.max(0, target.health - burnDamage);
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
            target.health = Math.max(0, target.health - enhancedCard.effect.value);
            // Apply random targeting logic
            const randomTarget = updatedPlayers[Math.floor(Math.random() * updatedPlayers.length)];
            randomTarget.health = Math.max(0, randomTarget.health - enhancedCard.effect.value);
            break;


           // --------------------------------------------------------------------------------------

          case 'forceDrink':
            console.debug('Applying forceDrink effect:', { targetId });

            break;



          case 'energi_i_rummet':
            console.debug('Någon har inte matchat energin i rummet... -->', { targetId });
            target.health = target.health - card.effect.value;
            player.health = player.health - card.effect.value;
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



            console.log("Trying to play auido file");
            const audioFile = "/audio/oskar.mp3";
            const audio = new Audio(audioFile); // Initialize audio object
            audio.volume = 0.8;
            audio.play().catch((error) => {
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
              const alivePlayersCount = updatedPlayers.filter(p => p.health > 0).length;
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
                enemy.health = Math.max(0, enemy.health - (playerLegendaryCount + 1)); //include the card just played as one
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
                enemy.health = 1;
                enemy.mana = 1;
              });
            
              break;
            }

            
        }

        console.debug('Updating players state after effect:', updatedPlayers);
        
         // Update effects and cooldowns
        effectManager.updateEffects();
        effectManager.checkLegendaryTriggers(player.health, player.mana, player.cards.length);

        // Update turn
        const alivePlayers = updatedPlayers.filter(p => p.health > 0);
        const status = alivePlayers.length > 1 ? 'playing' : 'finished';
        const nextTurnIndex = (updatedPlayers.findIndex(p => p.id === playerId) + 1) % updatedPlayers.length;
        const nextPlayerId = alivePlayers[nextTurnIndex]?.id || playerId;

        // Save to Firestore
        transaction.update(partyRef, {
          players: updatedPlayers,
          status,
          currentTurn: nextPlayerId,
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



        if(card.name === "AH ELLER HUR" && winnerId != playerId){
           const targetEnemies = updatedPlayers.filter(p => p.id !== playerId); // Exclude the player using the card

              targetEnemies.forEach(enemy => {
                enemy.mana = 0;
                });


                console.log("Trying to play auido file");
                const audioFile1 = "/audio/formangaomkringmig.mp3";
                const audio1 = new Audio(audioFile1); // Initialize audio object
                audio1.volume = 0.8;
                audio1.play().catch((error) => {
                  console.error("Audio playback failed:", error);
                });

                console.log("Trying to play auido file");
                const audioFile2 = "/audio/ahelrhur.mp3";
                const audio2 = new Audio(audioFile2); // Initialize audio object
                audio2.volume = 0.8;
                audio2.play().catch((error) => {
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

        // Calculate next turn and game status
        const alivePlayers = updatedPlayers.filter(p => p.health > 0);
        const status = alivePlayers.length <= 1 ? 'finished' : 'playing';
        const currentPlayerIndex = updatedPlayers.findIndex(p => p.id === playerId);
        const nextTurnIndex = (currentPlayerIndex + 1) % updatedPlayers.length;
        const nextPlayerId = updatedPlayers[nextTurnIndex]?.id || playerId;

        // Update Firestore
        transaction.update(partyRef, {
          players: updatedPlayers,
          status,
          currentTurn: nextPlayerId,
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