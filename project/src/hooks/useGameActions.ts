import { useCallback } from 'react';
import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Card, Party, Player } from '../types/game';
import { GAME_CONFIG } from '../config/gameConfig';

export function useGameActions(partyId: string) {
  const applyCardEffect = useCallback(async (
    party: Party,
    playerId: string,
    targetId: string,
    card: Card
  ) => {
    const partyRef = doc(db, 'parties', partyId);
    
    await runTransaction(db, async (transaction) => {
      const partyDoc = await transaction.get(partyRef);
      if (!partyDoc.exists()) return;
      
      const currentParty = partyDoc.data() as Party;
      const playerIndex = currentParty.players.findIndex(p => p.id === playerId);
      const targetIndex = currentParty.players.findIndex(p => p.id === targetId);
      
      if (playerIndex === -1 || targetIndex === -1) return;
      
      const updatedPlayers = [...currentParty.players];
      const player = { ...updatedPlayers[playerIndex] };
      const target = { ...updatedPlayers[targetIndex] };
      
      // Check if player is dead
      if (player.health <= 0) return;
      
      // Deduct mana cost
      player.mana -= card.manaCost;
      
      // Update player's cards
      const cardIndex = player.cards.findIndex(c => c.id === card.id);
      if (cardIndex !== -1) {
        player.cards[cardIndex] = { ...card }; // Keep the same card but create a new reference
      }
      
      // Apply card effect
      if (card.effect.type === 'damage') {
        target.health = Math.max(0, target.health - card.effect.value);
      } else if (card.effect.type === 'heal') {
        player.health = Math.min(GAME_CONFIG.MAX_HEALTH, player.health + card.effect.value);
      }
      
      updatedPlayers[playerIndex] = player;
      updatedPlayers[targetIndex] = target;
      
      // Update next turn
      const nextPlayerIndex = (playerIndex + 1) % currentParty.players.length;
      let nextTurn = updatedPlayers[nextPlayerIndex].id;
      
      // Skip dead players for next turn
      let attempts = updatedPlayers.length;
      while (attempts > 0 && updatedPlayers[updatedPlayers.findIndex(p => p.id === nextTurn)].health <= 0) {
        const currentIndex = updatedPlayers.findIndex(p => p.id === nextTurn);
        nextTurn = updatedPlayers[(currentIndex + 1) % updatedPlayers.length].id;
        attempts--;
      }
      
      // Check if game is over (only one player alive)
      const alivePlayers = updatedPlayers.filter(p => p.health > 0);
      const status = alivePlayers.length <= 1 ? 'finished' : 'playing';
      
      transaction.update(partyRef, {
        players: updatedPlayers,
        currentTurn: nextTurn,
        status,
        winner: status === 'finished' ? alivePlayers[0]?.id : null
      });
    });
  }, [partyId]);
  
  const drinkMana = useCallback(async (
    party: Party,
    playerId: string
  ) => {
    const partyRef = doc(db, 'parties', partyId);
    
    await runTransaction(db, async (transaction) => {
      const partyDoc = await transaction.get(partyRef);
      if (!partyDoc.exists()) return;
      
      const currentParty = partyDoc.data() as Party;
      const playerIndex = currentParty.players.findIndex(p => p.id === playerId);
      
      if (playerIndex === -1) return;
      
      const updatedPlayers = [...currentParty.players];
      const player = { ...updatedPlayers[playerIndex] };
      
      // Check if player is dead
      if (player.health <= 0) return;
      
      // Restore mana
      player.mana = Math.min(GAME_CONFIG.MAX_MANA, player.mana + GAME_CONFIG.MANA_DRINK_AMOUNT);
      updatedPlayers[playerIndex] = player;
      
      transaction.update(partyRef, {
        players: updatedPlayers
      });
    });
  }, [partyId]);

  return { applyCardEffect, drinkMana };
}