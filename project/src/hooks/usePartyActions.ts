import { useCallback } from 'react';
import { collection, addDoc, doc, runTransaction, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Party, Player, GameSettings } from '../types/game';
import { generateInitialCards } from '../utils/cardGeneration';
import { generatePartyCode } from '../utils/party';
import { GAME_CONFIG } from '../config/gameConfig';
import { auth } from '../lib/firebase';

export function usePartyActions() {


  const createParty = useCallback(async (player: Pick<Player, 'id' | 'name'>) => {
    const code = generatePartyCode();
  
    // Prepare initial party data with an empty partyId placeholder
    const partyData: Omit<Party, 'id'> = {
      code,
      status: 'waiting',
      players: [
        {
          ...player,
          mana: GAME_CONFIG.INITIAL_MANA,
          manaIntake: 0,
          isDrunk: false,
          cards: generateInitialCards(),
          isLeader: true,
        },
      ],
      currentTurn: player.id,
      leaderId: player.id,
      settings: {
        maxMana: GAME_CONFIG.MAX_MANA,
        manaDrinkAmount: GAME_CONFIG.MANA_DRINK_AMOUNT,
        initialMana: GAME_CONFIG.INITIAL_MANA,
        drunkThreshold: GAME_CONFIG.DRUNK_THRESHOLD,
        manaIntakeDecayRate: GAME_CONFIG.MANA_INTAKE_DECAY_RATE,
      },
    };
  
    try {
      // Add the party to the Firestore collection
      const partyRef = await addDoc(collection(db, 'parties'), partyData);
  
      console.log(`Party created successfully with ID: ${partyRef.id}`);
      return partyRef.id;
    } catch (error) {
      console.error('usePartyActions.ts --> Error creating party:', error);
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
        
        // Allow joining any party regardless of status for reconnection purposes
        // Comment out the status check: if (party.status !== 'waiting') throw new Error('Game already started');
        
        // Check if player with the same name already exists in the party
        const existingPlayerWithSameName = party.players.find(p => p.name === player.name);
        
        if (existingPlayerWithSameName) {
          // If player with same name exists, update their ID but keep their existing stats
          const updatedPlayers = party.players.map(p => 
            p.name === player.name 
              ? { ...p, id: player.id } // Update the ID to the new session ID
              : p
          );
          
          transaction.update(partyRef, {
            players: updatedPlayers
          });
          
          return; // Exit early as we've updated the existing player
        }
        
        // Check if player with the same ID already exists
        if (party.players.some(p => p.id === player.id)) {
          // Player already in party with same ID - no need to update anything
          return;
        }

        // Create a new player if the player doesn't exist in the party
        const newPlayer = {
          ...player,
          mana: party.settings?.initialMana ?? GAME_CONFIG.INITIAL_MANA,
          manaIntake: 0,
          isDrunk: false,
          cards: generateInitialCards(),
          isLeader: false
        };

        transaction.update(partyRef, {
          players: [...party.players, newPlayer]
        });
      });

      // Save the partyId and playerId to localStorage for session persistence
      localStorage.setItem('partyId', partyId);
      localStorage.setItem('playerId', player.id);
            
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













  const leaveParty = useCallback(async (partyId: string, playerId: string, isIntentionalLeave: boolean = false) => {
    const partyRef = doc(db, 'parties', partyId);
    
    try {
      await runTransaction(db, async (transaction) => {
        const partyDoc = await transaction.get(partyRef);
        
        if (!partyDoc.exists()) return;

        const party = partyDoc.data() as Party;
        const isLeader = party.leaderId === playerId;
        
        // If leader is intentionally leaving, delete the party
        if (isLeader && isIntentionalLeave) {
          // If leader intentionally leaves, delete the party
          transaction.delete(partyRef);
          return;
        }
        
        // For non-leader players or non-intentional disconnects
        // We simply remove the player from active players list but keep their data
        // This will allow them to rejoin with the same name later
        
        // If it's the leaving player's turn, move to next player
        if (party.currentTurn === playerId) {
          const currentIndex = party.players.findIndex(p => p.id === playerId);
          const nextPlayer = party.players[(currentIndex + 1) % party.players.length];
          
          // Update current turn to next player
          transaction.update(partyRef, {
            currentTurn: nextPlayer.id
          });
        }
      });
    } catch (error) {
      console.error('Error leaving party:', error);
      throw error;
    }
  }, []);














  const updateGameSettings = useCallback(async (settings: GameSettings, partyId?: string) => {
    try {
      if (!partyId) {
        throw new Error('Party ID is required to update settings');
      }
      
      const partyRef = doc(db, 'parties', partyId);
      
      await runTransaction(db, async (transaction) => {
        const partyDoc = await transaction.get(partyRef);
        
        if (!partyDoc.exists()) {
          throw new Error('Party not found');
        }
        
        // Get current party data to check if user is leader
        const partyData = partyDoc.data() as Party;
        const currentUserId = auth.currentUser?.uid;
        
        // Only allow admin/leader to update settings
        const isLeader = partyData.players.some(p => p.id === currentUserId && p.isLeader);
        if (!isLeader) {
          throw new Error('Only the party leader can update settings');
        }
        
        // Get current settings to merge with new settings
        const currentSettings = partyData.settings || {
          maxMana: GAME_CONFIG.MAX_MANA,
          manaDrinkAmount: GAME_CONFIG.MANA_DRINK_AMOUNT,
          initialMana: GAME_CONFIG.INITIAL_MANA,
          drunkThreshold: GAME_CONFIG.DRUNK_THRESHOLD,
          manaIntakeDecayRate: GAME_CONFIG.MANA_INTAKE_DECAY_RATE,
        };
        
        // Merge current settings with new settings
        const updatedSettings = {
          ...currentSettings,
          ...settings,
        };
        
        // Log the settings update for debugging
        console.debug('Updating game settings:', {
          current: currentSettings,
          new: settings,
          merged: updatedSettings
        });
        
        transaction.update(partyRef, { 
          settings: updatedSettings
        });
      });
      
      return true;
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