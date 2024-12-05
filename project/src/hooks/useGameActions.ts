import { useCallback } from 'react';
import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Card, Party } from '../types/game';
import { GAME_CONFIG } from '../config/gameConfig';
import { drawNewCard } from '../utils/cards';
import {
  applyHealingEffect,
  applyBuffEffect,
  updateBuffDurations,
  removeCard,
  validateCardAction
} from '../utils/cardEffects';

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
        console.log('Current party state:', party);

        const playerIndex = party.players.findIndex(p => p.id === playerId);
        const targetIndex = party.players.findIndex(p => p.id === targetId);
        
        if (playerIndex === -1 || targetIndex === -1) {
          throw new Error('Player or target not found');
        }
        
        const updatedPlayers = [...party.players];
        let player = { ...updatedPlayers[playerIndex] };
        let target = { ...updatedPlayers[targetIndex] };
        
        // Validate action
        if (!validateCardAction(player, card, party.settings)) {
          throw new Error('Invalid card action');
        }
        
        // Deduct mana cost
        player.mana = Math.max(0, player.mana - card.manaCost);
        
        // Apply card effect
        switch (card.effect.type) {
          case 'heal':
            target = applyHealingEffect(target, card.effect.value, party.settings);
            break;
          case 'damage':
            target.health = Math.max(0, target.health - card.effect.value);
            break;
          case 'manaDrain':
            const drainAmount = Math.min(target.mana, card.effect.value);
            target.mana = Math.max(0, target.mana - drainAmount);
            player.mana = Math.min(
              party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA,
              player.mana + drainAmount
            );
            break;
          case 'potionBuff':
            player = applyBuffEffect(player, 'potionBuff', card.effect.value, 3);
            break;
          case 'manaRefill':
            player.mana = party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA;
            break;
        }
        
        // Remove used card and draw new one
        player = removeCard(player, card.id);
        player.cards.push(drawNewCard());
        
        // Update players array
        updatedPlayers[playerIndex] = player;
        updatedPlayers[targetIndex] = target;
        
        // Update buff durations for all players
        const playersWithUpdatedBuffs = updatedPlayers.map(p => updateBuffDurations(p));
        
        // Check for game over
        const alivePlayers = playersWithUpdatedBuffs.filter(p => p.health > 0);
        const status = alivePlayers.length <= 1 ? 'finished' : 'playing';
        const winner = status === 'finished' ? (alivePlayers[0]?.id || null) : null;
        
        // Find next alive player
        let nextPlayerIndex = (playerIndex + 1) % playersWithUpdatedBuffs.length;
        while (playersWithUpdatedBuffs[nextPlayerIndex].health <= 0 && nextPlayerIndex !== playerIndex) {
          nextPlayerIndex = (nextPlayerIndex + 1) % playersWithUpdatedBuffs.length;
        }

        const updateData = {
          players: playersWithUpdatedBuffs,
          status,
          currentTurn: playersWithUpdatedBuffs[nextPlayerIndex].id,
          lastAction: {
            type: card.effect.type,
            playerId,
            targetId,
            value: card.effect.value,
            timestamp: Date.now(),
            cardId: card.id
          }
        };

        if (winner !== null) {
          transaction.update(partyRef, { ...updateData, winner });
        } else {
          transaction.update(partyRef, updateData);
        }

        console.log('Card effect applied successfully');
      });
    } catch (error) {
      console.error('Error applying card effect:', error);
      throw error;
    }
  }, [partyId]);

  // Rest of the hooks implementation remains the same...
  return { applyCardEffect };
}