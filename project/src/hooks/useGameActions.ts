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
      
      // Check if player is dead or it's not their turn
      if (player.health <= 0 || currentParty.currentTurn !== playerId) return;
      
      // Check if target is dead for damage effects
      if (card.effect.type === 'damage' && target.health <= 0) return;
      
      // Check mana cost
      if (player.mana < card.manaCost) return;
      
      // Deduct mana cost
      player.mana = Math.max(0, player.mana - card.manaCost);
      
      // Apply card effect
      switch (card.effect.type) {
        case 'damage':
          target.health = Math.max(0, target.health - card.effect.value);
          break;
        case 'heal':
          player.health = Math.min(
            party.settings?.maxHealth ?? GAME_CONFIG.MAX_HEALTH,
            player.health + card.effect.value
          );
          break;
        case 'manaDrain':
          const drainAmount = Math.min(target.mana, card.effect.value);
          target.mana -= drainAmount;
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
          const damage = target.mana;
          target.health = Math.max(0, target.health - damage);
          target.mana = 0;
          break;
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
        winner: status === 'finished' ? alivePlayers[0]?.id : undefined
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
      
      // Restore mana (can be done at any time, doesn't count as a turn)
      player.mana = Math.min(
        party.settings?.maxMana ?? GAME_CONFIG.MAX_MANA,
        player.mana + (party.settings?.manaDrinkAmount ?? GAME_CONFIG.MANA_DRINK_AMOUNT)
      );
      updatedPlayers[playerIndex] = player;
      
      transaction.update(partyRef, {
        players: updatedPlayers
      });
    });
  }, [partyId]);

  return { applyCardEffect, drinkMana };
}