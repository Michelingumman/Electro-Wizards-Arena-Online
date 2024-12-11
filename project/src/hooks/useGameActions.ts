import { useCallback } from 'react';
import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Card, Party } from '../types/game';
import { GAME_CONFIG } from '../config/gameConfig';
import { drawNewCard } from '../utils/cardGeneration';
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
        console.debug('Deducting mana:', { currentMana: player.mana, cost: enhancedCard.manaCost });
        player.mana = Math.max(0, player.mana - enhancedCard.manaCost);

        // Replace used card
        const cardIndex = player.cards.findIndex(c => c.id === enhancedCard.id);
        if (cardIndex !== -1) {
          console.debug('Replacing used card at index:', cardIndex);
          player.cards[cardIndex] = drawNewCard();
        }




        
        // Apply the card effect
        switch (enhancedCard.effect.type) {
          case 'damage':
            console.debug('Applying damage effect:', { targetId, damage: enhancedCard.effect.value });
            target.health = Math.max(0, target.health - enhancedCard.effect.value);
            break;
          case 'heal':
            const maxHealth = party.settings?.maxHealth ?? GAME_CONFIG.MAX_HEALTH;
            console.debug('Applying heal effect:', { targetId, heal: enhancedCard.effect.value, maxHealth });
            target.health = Math.min(maxHealth, target.health + enhancedCard.effect.value);
            break;
          case 'manaDrain':
            const drainAmount = Math.min(target.mana, enhancedCard.effect.value);
            console.debug('Applying manaDrain:', { targetId, drainAmount });
            target.mana -= drainAmount;
            player.mana = Math.min(
              party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA,
              player.mana + drainAmount
            );
            break;
          case 'forceDrink':
            console.debug('Applying forceDrink effect:', { targetId });
            target.mana = Math.min(
              party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA,
              target.mana + GAME_CONFIG.MANA_DRINK_AMOUNT
            );
            break;
          case 'manaBurn':
            const burnDamage = Math.floor(target.mana / 2);
            console.debug('Applying manaBurn effect:', { targetId, burnDamage });
            target.health = Math.max(0, target.health - burnDamage);
            target.mana = 0;
            break;
          case 'potionBuff':
            console.debug('Applying potionBuff:', { playerId });
            player.potionMultiplier = { value: enhancedCard.effect.value, turnsLeft: 3 };
            break;
          case 'manaRefill':
            console.debug('Applying manaRefill:', { playerId });
            player.mana = party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA;
            break;
        }

        // Update players and calculate next turn
        console.debug('Updating players state after effect:', updatedPlayers);
        const alivePlayers = updatedPlayers.filter(p => p.health > 0);
        const status = alivePlayers.length > 1 ? 'playing' : 'finished';
        const nextTurnIndex = (updatedPlayers.findIndex(p => p.id === playerId) + 1) % updatedPlayers.length;
        const nextPlayerId = alivePlayers[nextTurnIndex]?.id || playerId;

        // Save to Firestore
        console.debug('Saving updated party state to Firestore:', {
          updatedPlayers,
          nextPlayerId,
          status,
        });
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
        const winnerResult = applyChallengeEffect(winner, effects.winner, maxHealth, maxMana);
        const loserResult = applyChallengeEffect(loser, effects.loser, maxHealth, maxMana);

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