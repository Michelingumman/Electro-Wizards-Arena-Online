import { useCallback } from 'react';
import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Card, Party } from '../types/game';
import { GAME_CONFIG } from '../config/gameConfig';
import { drawNewCard } from '../utils/cards';

export function useGameActions(partyId: string) {
  const applyCardEffect = useCallback(async (
    playerId: string,
    targetId: string,
    card: Card
  ) => {
    console.log('Applying card effect:', { playerId, targetId, card });
    const partyRef = doc(db, 'parties', partyId);
  
    try {
      await runTransaction(db, async (transaction) => {
        const partyDoc = await transaction.get(partyRef);
        if (!partyDoc.exists()) throw new Error('Party not found');
  
        const party = partyDoc.data() as Party;
  
        if (party.currentTurn !== playerId) throw new Error('Not player\'s turn');
        var player = party.players.find(p => p.id === playerId);
        if (!player || player.health <= 0) throw new Error('Player is dead');
          
        console.log('Current party state:', party);

        const playerIndex = party.players.findIndex(p => p.id === playerId);
        const targetIndex = party.players.findIndex(p => p.id === targetId);
        
        if (playerIndex === -1 || targetIndex === -1) {
          throw new Error('Player or target not found');
        }
        
        const updatedPlayers = [...party.players];
        player = { ...updatedPlayers[playerIndex] };
        const target = { ...updatedPlayers[targetIndex] };
        
        console.log('Before effect - Player:', player, 'Target:', target);

        // Validate action
        if (player.health <= 0) throw new Error('Player is dead');
        if (party.currentTurn !== playerId) throw new Error('Not player\'s turn');
        if (player.mana < card.manaCost) throw new Error('Not enough mana');
        if (card.effect.type === 'damage' && target.health <= 0) throw new Error('Target is dead');
        
        // Deduct mana cost
        player.mana = Math.max(0, player.mana - card.manaCost);
        
        // Replace used card with new one
        const cardIndex = player.cards.findIndex(c => c.id === card.id);
        if (cardIndex !== -1) {
          const newCard = drawNewCard();
          player.cards = [
            ...player.cards.slice(0, cardIndex),
            newCard,
            ...player.cards.slice(cardIndex + 1)
          ];
        }
        
        // Apply card effect
        switch (card.effect.type) {
          case 'damage':
            target.health = Math.max(0, target.health - card.effect.value);
            break;
          case 'heal':
            target.health = Math.min(
              party.settings?.maxHealth ?? GAME_CONFIG.MAX_HEALTH,
              target.health + card.effect.value
            );
            break;
          case 'manaDrain':
            const drainAmount = Math.min(target.mana, card.effect.value);
            target.mana = Math.max(0, target.mana - drainAmount);
            player.mana = Math.min(
              party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA,
              player.mana + drainAmount
            );
            break;
          case 'forceDrink':
            target.mana = Math.min(
              party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA,
              target.mana + (party.settings?.manaDrinkAmount ?? GAME_CONFIG.MANA_DRINK_AMOUNT)
            );
            break;
          case 'manaBurn':
            const burnDamage = Math.floor(target.mana / 2);
            target.health = Math.max(0, target.health - burnDamage);
            target.mana = 0;
            break;
          case 'potionBuff':
            player.potionMultiplier = {
              value: card.effect.value,
              turnsLeft: 3
            };
            break;
          case 'manaRefill':
            player.mana = party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA;
            break;
        }
        
        console.log('After effect - Player:', player, 'Target:', target);

        // Update players
        updatedPlayers[playerIndex] = player;
        updatedPlayers[targetIndex] = target;
        
        // Check for game over
        const alivePlayers = updatedPlayers.filter(p => p.health > 0);
        console.log('Alive players:', alivePlayers);

        const status = alivePlayers.length <= 1 ? 'finished' : 'playing';
        const winner = status === 'finished' ? (alivePlayers[0]?.id || null) : null;
        
        // Find next alive player
        let nextPlayerIndex = (playerIndex + 1) % updatedPlayers.length;
        while (updatedPlayers[nextPlayerIndex].health <= 0 && nextPlayerIndex !== playerIndex) {
          nextPlayerIndex = (nextPlayerIndex + 1) % updatedPlayers.length;
        }

        // Update potion multiplier durations
        updatedPlayers.forEach(p => {
          if (p.potionMultiplier && p.potionMultiplier.turnsLeft > 0) {
            p.potionMultiplier.turnsLeft--;
            if (p.potionMultiplier.turnsLeft === 0) {
              delete p.potionMultiplier;
            }
          }
        });

        const updateData = {
          players: updatedPlayers,
          status,
          currentTurn: updatedPlayers[nextPlayerIndex].id,
          lastAction: {
            type: card.effect.type,
            playerId,
            targetId,
            value: card.effect.value,
            timestamp: Date.now()
          }
        };

        if (winner !== null) {
          transaction.update(partyRef, { ...updateData, winner });
        } else {
          transaction.update(partyRef, updateData);
        }



      // Update lastAction at the end of the turn
      transaction.update(partyRef, {
        players: updatedPlayers,
        status,
        currentTurn: updatedPlayers[nextPlayerIndex].id,
        lastAction: {
          type: card.effect.type,
          playerId,
          targetId,
          value: card.effect.value,
          timestamp: Date.now()
        }
      });
    });

      console.log('Turn completed, action logged successfully');
    } catch (error) {
      console.error('Error applying card effect:', error);
      throw error;
    }
  }, [partyId]);




  
  const resolveChallengeCard = useCallback(async (
    playerId: string,
    card: Card,
    winnerId: string,
    loserId: string
  ) => {
    console.log('Resolving challenge card:', { playerId, card, winnerId, loserId });
    const partyRef = doc(db, 'parties', partyId);
    
    try {
      await runTransaction(db, async (transaction) => {
        const partyDoc = await transaction.get(partyRef);
        if (!partyDoc.exists()) throw new Error('Party not found');
        
        const party = partyDoc.data() as Party;
        const updatedPlayers = [...party.players];
        
        const winner = updatedPlayers.find(p => p.id === winnerId);
        const loser = updatedPlayers.find(p => p.id === loserId);
        
        if (!winner || !loser) throw new Error('Players not found');
        

        // Apply challenge effects
        if (card.id === 'beer-havf') {
          winner.health = Math.min(
            party.settings?.maxHealth ?? GAME_CONFIG.MAX_HEALTH,
            winner.health + 5
          );
          loser.health = Math.max(0, loser.health - 5);
        } else if (card.id === 'big-muscles') {
          winner.mana = party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA;
          loser.mana = 0;
        }
        
        // Replace used card
        const playerIndex = updatedPlayers.findIndex(p => p.id === playerId);
        const cardIndex = updatedPlayers[playerIndex].cards.findIndex(c => c.id === card.id);
        if (cardIndex !== -1) {
          updatedPlayers[playerIndex].cards[cardIndex] = drawNewCard();
        }
        
        // Find next player
        let nextPlayerIndex = (playerIndex + 1) % updatedPlayers.length;
        while (updatedPlayers[nextPlayerIndex].health <= 0 && nextPlayerIndex !== playerIndex) {
          nextPlayerIndex = (nextPlayerIndex + 1) % updatedPlayers.length;
        }
        
        // Check for game over
        const alivePlayers = updatedPlayers.filter(p => p.health > 0);
        const status = alivePlayers.length <= 1 ? 'finished' : 'playing';
        const gameWinner = status === 'finished' ? (alivePlayers[0]?.id || null) : null;

        const updateData = {
          players: updatedPlayers,
          status,
          currentTurn: updatedPlayers[nextPlayerIndex].id,
          lastAction: {
            type: 'challenge',
            playerId,
            targetId: loserId,
            value: card.effect.value,
            timestamp: Date.now()
          }
        };

        if (gameWinner !== null) {
          transaction.update(partyRef, { ...updateData, winner: gameWinner });
        } else {
          transaction.update(partyRef, updateData);
        }

        console.log('Challenge resolved successfully');
      });
    } catch (error) {
      console.error('Error resolving challenge:', error);
      throw error;
    }
  }, [partyId]);
  
  const drinkMana = useCallback(async (playerId: string) => {
    console.log('Drinking mana for player:', playerId);
    const partyRef = doc(db, 'parties', partyId);
    
    try {
      await runTransaction(db, async (transaction) => {
        const partyDoc = await transaction.get(partyRef);
        if (!partyDoc.exists()) throw new Error('Party not found');
        
        const party = partyDoc.data() as Party;
        const playerIndex = party.players.findIndex(p => p.id === playerId);
        
        if (playerIndex === -1) throw new Error('Player not found');
        if (party.players[playerIndex].health <= 0) throw new Error('Player is dead');
        
        const updatedPlayers = [...party.players];
        const player = { ...updatedPlayers[playerIndex] };
        
        console.log('Before drinking - Player:', player);

        // Calculate mana gain with multiplier if active
        const baseAmount = party.settings?.manaDrinkAmount ?? GAME_CONFIG.MANA_DRINK_AMOUNT;
        const multiplier = player.potionMultiplier?.value ?? 1;
        const manaGain = baseAmount * multiplier;

        // Add mana from drinking
        player.mana = Math.min(
          party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA,
          player.mana + manaGain
        );
        
        updatedPlayers[playerIndex] = player;
        
        console.log('After drinking - Player:', player);

        transaction.update(partyRef, {
          players: updatedPlayers,
          lastAction: {
            type: 'drink',
            playerId,
            value: manaGain,
            timestamp: Date.now()
          }
        });
      });



      console.log('Mana drink successful');
    } catch (error) {
      console.error('Error drinking mana:', error);
      throw error;
    }
  }, [partyId]);

  return { applyCardEffect, drinkMana, resolveChallengeCard };
}