import { useCallback } from 'react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Card, Party, Player } from '../types/game';

export function useGameActions(partyId: string) {
  const applyCardEffect = useCallback(async (
    party: Party,
    playerId: string,
    targetId: string,
    card: Card
  ) => {
    const playerIndex = party.players.findIndex(p => p.id === playerId);
    const targetIndex = party.players.findIndex(p => p.id === targetId);
    
    if (playerIndex === -1 || targetIndex === -1) return;
    
    const updatedPlayers = [...party.players];
    const player = { ...updatedPlayers[playerIndex] };
    const target = { ...updatedPlayers[targetIndex] };
    
    // Deduct mana cost
    player.mana -= card.manaCost;
    
    // Apply card effect
    if (card.effect.type === 'damage') {
      target.health -= card.effect.value;
    } else if (card.effect.type === 'heal') {
      player.health = Math.min(10, player.health + card.effect.value);
    }
    
    updatedPlayers[playerIndex] = player;
    updatedPlayers[targetIndex] = target;
    
    // Update next turn
    const nextPlayerIndex = (playerIndex + 1) % party.players.length;
    
    await updateDoc(doc(db, 'parties', partyId), {
      players: updatedPlayers,
      currentTurn: updatedPlayers[nextPlayerIndex].id
    });
  }, [partyId]);
  
  const drinkMana = useCallback(async (
    party: Party,
    playerId: string
  ) => {
    const playerIndex = party.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return;
    
    const updatedPlayers = [...party.players];
    const player = { ...updatedPlayers[playerIndex] };
    
    // Restore 3 mana, max 10
    player.mana = Math.min(10, player.mana + 3);
    updatedPlayers[playerIndex] = player;
    
    // Update next turn
    const nextPlayerIndex = (playerIndex + 1) % party.players.length;
    
    await updateDoc(doc(db, 'parties', partyId), {
      players: updatedPlayers,
      currentTurn: updatedPlayers[nextPlayerIndex].id
    });
  }, [partyId]);

  return { applyCardEffect, drinkMana };
}