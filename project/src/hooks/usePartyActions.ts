import { useCallback } from 'react';
import { collection, addDoc, doc, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Party, Player, GameSettings } from '../types/game';
import { generateInitialCards } from '../utils/cards';
import { generatePartyCode } from '../utils/party';
import { GAME_CONFIG } from '../config/gameConfig';

export function usePartyActions() {
  const createParty = useCallback(async (player: Pick<Player, 'id' | 'name'>) => {
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
      leaderId: player.id,
      settings: {
        maxHealth: GAME_CONFIG.MAX_HEALTH,
        maxMana: GAME_CONFIG.MAX_MANA,
        manaDrinkAmount: GAME_CONFIG.MANA_DRINK_AMOUNT,
        initialHealth: GAME_CONFIG.INITIAL_HEALTH,
        initialMana: GAME_CONFIG.INITIAL_MANA,
      }
    };

    try {
      const partyRef = await addDoc(collection(db, 'parties'), partyData);
      return partyRef.id;
    } catch (error) {
      console.error('Error creating party:', error);
      throw new Error('Failed to create party');
    }
  }, []);

  const joinParty = useCallback(async (partyId: string, player: Pick<Player, 'id' | 'name'>) => {
    const partyRef = doc(db, 'parties', partyId);
    
    try {
      await runTransaction(db, async (transaction) => {
        const partyDoc = await transaction.get(partyRef);
        
        if (!partyDoc.exists()) {
          throw new Error('Party not found');
        }

        const party = partyDoc.data() as Party;
        
        if (party.status !== 'waiting') {
          throw new Error('Game has already started');
        }

        if (party.players.some(p => p.id === player.id)) {
          throw new Error('Player already in party');
        }

        const newPlayer = {
          ...player,
          health: party.settings?.initialHealth ?? GAME_CONFIG.INITIAL_HEALTH,
          mana: party.settings?.initialMana ?? GAME_CONFIG.INITIAL_MANA,
          cards: generateInitialCards(),
          isLeader: false
        };

        transaction.update(partyRef, {
          players: [...party.players, newPlayer]
        });
      });

      return partyId;
    } catch (error) {
      console.error('Error joining party:', error);
      throw error;
    }
  }, []);

  const startGame = useCallback(async (partyId: string) => {
    const partyRef = doc(db, 'parties', partyId);
    
    try {
      await runTransaction(db, async (transaction) => {
        const partyDoc = await transaction.get(partyRef);
        
        if (!partyDoc.exists()) {
          throw new Error('Party not found');
        }

        const party = partyDoc.data() as Party;
        
        if (party.status !== 'waiting') {
          throw new Error('Game has already started');
        }

        if (party.players.length < 2) {
          throw new Error('Not enough players to start');
        }

        // Randomize first turn
        const firstPlayer = party.players[Math.floor(Math.random() * party.players.length)];

        transaction.update(partyRef, {
          status: 'playing',
          currentTurn: firstPlayer.id
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
        const isLeader = party.leaderId === playerId;
        
        if (isLeader) {
          // If leader leaves, delete the party
          transaction.delete(partyRef);
        } else {
          // Remove player from party
          const updatedPlayers = party.players.filter(p => p.id !== playerId);
          
          // If it's the leaving player's turn, move to next player
          if (party.currentTurn === playerId) {
            const currentIndex = party.players.findIndex(p => p.id === playerId);
            const nextPlayer = party.players[(currentIndex + 1) % party.players.length];
            transaction.update(partyRef, {
              players: updatedPlayers,
              currentTurn: nextPlayer.id
            });
          } else {
            transaction.update(partyRef, {
              players: updatedPlayers
            });
          }
        }
      });
    } catch (error) {
      console.error('Error leaving party:', error);
      throw error;
    }
  }, []);

  const updateGameSettings = useCallback(async (settings: GameSettings) => {
    try {
      const partyRef = doc(db, 'parties', settings.partyId);
      await runTransaction(db, async (transaction) => {
        const partyDoc = await transaction.get(partyRef);
        
        if (!partyDoc.exists()) {
          throw new Error('Party not found');
        }

        const party = partyDoc.data() as Party;
        
        if (party.leaderId !== settings.playerId) {
          throw new Error('Only the party leader can update settings');
        }

        if (party.status !== 'waiting') {
          throw new Error('Cannot update settings after game has started');
        }

        transaction.update(partyRef, { settings });
      });
    } catch (error) {
      console.error('Error updating game settings:', error);
      throw error;
    }
  }, []);

  return {
    createParty,
    joinParty,
    startGame,
    leaveParty,
    updateGameSettings
  };
}