import { useCallback } from 'react';
import { collection, addDoc, doc, runTransaction, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Party, Player } from '../types/game';
import { generateInitialCards } from '../utils/cards';
import { generatePartyCode } from '../utils/party';
import { GAME_CONFIG } from '../config/gameConfig';

export function usePartyActions() {
  const createParty = useCallback(async (player: Omit<Player, 'cards' | 'isLeader'>) => {
    const code = generatePartyCode();
    
    const partyData: Omit<Party, 'id'> = {
      code,
      status: 'waiting',
      players: [{
        ...player,
        health: GAME_CONFIG.INITIAL_HEALTH,
        mana: GAME_CONFIG.INITIAL_MANA,
        cards: generateInitialCards(),
        isLeader: true
      }],
      currentTurn: player.id,
      leaderId: player.id
    };

    try {
      const partyRef = await addDoc(collection(db, 'parties'), partyData);
      return partyRef.id;
    } catch (error) {
      console.error('Error creating party:', error);
      throw new Error('Failed to create party');
    }
  }, []);

  const joinParty = useCallback(async (partyId: string, player: Omit<Player, 'cards' | 'isLeader'>) => {
    const partyRef = doc(db, 'parties', partyId);
    
    try {
      const result = await runTransaction(db, async (transaction) => {
        const partyDoc = await transaction.get(partyRef);
        
        if (!partyDoc.exists()) {
          throw new Error('Party not found');
        }

        const party = partyDoc.data() as Party;
        
        // Check if player is already in the party
        const existingPlayer = party.players.find(p => p.id === player.id);
        if (existingPlayer) {
          return { partyId, rejoined: true };
        }

        if (party.players.length >= GAME_CONFIG.MAX_PLAYERS) {
          throw new Error('Party is full');
        }

        if (party.status !== 'waiting') {
          throw new Error('Game has already started');
        }

        const newPlayer = {
          ...player,
          health: GAME_CONFIG.INITIAL_HEALTH,
          mana: GAME_CONFIG.INITIAL_MANA,
          cards: generateInitialCards(),
          isLeader: false
        };

        const updatedPlayers = [...party.players, newPlayer];

        transaction.update(partyRef, {
          players: updatedPlayers
        });

        return { partyId, rejoined: false };
      });

      return result.partyId;
    } catch (error) {
      console.error('Error joining party:', error);
      throw error;
    }
  }, []);

  const startGame = useCallback(async (partyId: string, playerId: string) => {
    const partyRef = doc(db, 'parties', partyId);
    
    try {
      await runTransaction(db, async (transaction) => {
        const partyDoc = await transaction.get(partyRef);
        
        if (!partyDoc.exists()) {
          throw new Error('Party not found');
        }

        const party = partyDoc.data() as Party;
        
        if (party.leaderId !== playerId) {
          throw new Error('Only the party leader can start the game');
        }

        if (party.players.length < GAME_CONFIG.MIN_PLAYERS_TO_START) {
          throw new Error(`Need at least ${GAME_CONFIG.MIN_PLAYERS_TO_START} players to start`);
        }

        if (party.status !== 'waiting') {
          throw new Error('Game has already started');
        }

        transaction.update(partyRef, {
          status: 'playing',
          currentTurn: party.players[0].id // Start with the first player
        });
      });
    } catch (error) {
      console.error('Error starting game:', error);
      throw error;
    }
  }, []);

  const leaveParty = useCallback(async (partyId: string, playerId: string) => {
    const partyRef = doc(db, 'parties', partyId);
    
    try {
      await runTransaction(db, async (transaction) => {
        const partyDoc = await transaction.get(partyRef);
        
        if (!partyDoc.exists()) return;

        const party = partyDoc.data() as Party;
        
        // If leader leaves, end the game
        if (party.leaderId === playerId) {
          await transaction.delete(partyRef);
        } else {
          const updatedPlayers = party.players.filter(p => p.id !== playerId);
          
          // If no players left, delete the party
          if (updatedPlayers.length === 0) {
            await transaction.delete(partyRef);
          } else {
            await transaction.update(partyRef, {
              players: updatedPlayers,
              // If it was this player's turn, move to the next player
              currentTurn: party.currentTurn === playerId 
                ? updatedPlayers[0].id 
                : party.currentTurn
            });
          }
        }
      });
    } catch (error) {
      console.error('Error leaving party:', error);
      // Don't throw here to ensure cleanup always happens
    }
  }, []);

  return { createParty, joinParty, startGame, leaveParty };
}