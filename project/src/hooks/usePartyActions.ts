import { useCallback } from 'react';
import { collection, addDoc, doc, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Party, Player, GameSettings } from '../types/game';
import { generateInitialCards } from '../utils/cardGeneration';
import { generatePartyCode } from '../utils/party';
import { GAME_CONFIG } from '../config/gameConfig';

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
          health: GAME_CONFIG.INITIAL_HEALTH,
          mana: GAME_CONFIG.INITIAL_MANA,
          cards: generateInitialCards(),
          isLeader: true,
          connectionStatus: 'connected',
          lastSeen: Date.now(),
        },
      ],
      currentTurn: player.id,
      leaderId: player.id,
      settings: {
        maxHealth: GAME_CONFIG.MAX_HEALTH,
        maxMana: GAME_CONFIG.MAX_MANA,
        manaDrinkAmount: GAME_CONFIG.MANA_DRINK_AMOUNT,
        initialHealth: GAME_CONFIG.INITIAL_HEALTH,
        initialMana: GAME_CONFIG.INITIAL_MANA,
        partyId: '', // Placeholder for now
        playerId: player.id,
      },
    };
  
    try {
      // Add the party to the Firestore collection
      const partyRef = await addDoc(collection(db, 'parties'), partyData);
  
      // Update the `partyId` field in the settings after creating the document
      await runTransaction(db, async (transaction) => {
        const docRef = doc(db, 'parties', partyRef.id);
        transaction.update(docRef, {
          'settings.partyId': partyRef.id, // Set the `partyId` field in the settings
        });
      });
  
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
        
        console.log('🔍 JOIN PARTY DEBUG:', {
          partyId,
          playerTryingToJoin: player,
          currentPlayers: party.players.map(p => ({ id: p.id, name: p.name, connectionStatus: p.connectionStatus }))
        });
        
        // Check if player with same NAME exists (for reconnection) - PRIORITIZE THIS
        const existingPlayerByName = party.players.find(p => p.name.toLowerCase() === player.name.toLowerCase());
        
        console.log('🔍 RECONNECTION CHECK:', {
          searchingForName: player.name.toLowerCase(),
          foundExistingPlayer: existingPlayerByName ? { 
            id: existingPlayerByName.id, 
            name: existingPlayerByName.name, 
            connectionStatus: existingPlayerByName.connectionStatus 
          } : null
        });
        
        if (existingPlayerByName) {
          // RECONNECTION LOGIC: Player with same name exists, update their ID and restore connection
          console.log(`✅ Player "${player.name}" reconnecting - restoring game state`);
          
          const updatedPlayers = party.players.map(p => {
            if (p.name.toLowerCase() === player.name.toLowerCase()) {
              const reconnectedPlayer = {
                ...p,
                id: player.id, // Update to new Firebase UID
                connectionStatus: 'connected' as const,
                lastSeen: Date.now()
              };
              // Remove disconnectedAt field by not including it
              delete (reconnectedPlayer as any).disconnectedAt;
              return reconnectedPlayer;
            }
            return p;
          });

          // Update party leader if the reconnecting player was the leader
          const newLeaderId = existingPlayerByName.isLeader ? player.id : party.leaderId;

          transaction.update(partyRef, {
            players: updatedPlayers,
            leaderId: newLeaderId
          });

          console.log(`✅ Player "${player.name}" successfully reconnected with restored state`);
        } else {
          // Check if player with same ID already exists (prevent duplicate IDs for new players)
          const existingPlayerById = party.players.find(p => p.id === player.id);
          
          console.log('🔍 DUPLICATE ID CHECK:', {
            playerIdToCheck: player.id,
            foundExistingPlayerWithSameId: existingPlayerById ? {
              id: existingPlayerById.id,
              name: existingPlayerById.name,
              connectionStatus: existingPlayerById.connectionStatus
            } : null
          });
          
          if (existingPlayerById) {
            console.error('❌ DUPLICATE ID ERROR: Player with same ID already exists:', existingPlayerById);
            throw new Error('Player already in party');
          }

          // NEW PLAYER LOGIC: No existing player with this name, create new player
          console.log(`✅ New player "${player.name}" joining party`);
          
          const newPlayer = {
            ...player,
            health: party.settings?.initialHealth ?? GAME_CONFIG.INITIAL_HEALTH,
            mana: party.settings?.initialMana ?? GAME_CONFIG.INITIAL_MANA,
            cards: generateInitialCards(),
            isLeader: false,
            connectionStatus: 'connected' as const,
            lastSeen: Date.now()
          };

          transaction.update(partyRef, {
            players: [...party.players, newPlayer]
          });
        }
      });

      // Save the partyId and playerId to localStorage for session persistence
      localStorage.setItem('partyId', partyId);
      localStorage.setItem('playerId', player.id);
            
      return partyId;
    } catch (error) {
      console.error('❌ Error joining party:', error);
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
        const leavingPlayer = party.players.find(p => p.id === playerId);
        
        if (!leavingPlayer) return; // Player not found
        
        if (isLeader) {
          // If leader leaves, delete the party (original behavior)
          transaction.delete(partyRef);
        } else {
          // Instead of removing player, mark as disconnected for potential reconnection
          console.log(`Marking player "${leavingPlayer.name}" as disconnected`);
          
          const updatedPlayers = party.players.map(p => {
            if (p.id === playerId) {
              return {
                ...p,
                connectionStatus: 'disconnected' as const,
                disconnectedAt: Date.now(),
                lastSeen: Date.now()
              };
            }
            return p;
          });
          
          // If it's the leaving player's turn, move to next CONNECTED player
          let nextPlayerId = party.currentTurn;
          if (party.currentTurn === playerId) {
            const connectedPlayers = updatedPlayers.filter(p => p.connectionStatus === 'connected' && p.health > 0);
            if (connectedPlayers.length > 0) {
              const currentIndex = party.players.findIndex(p => p.id === playerId);
              let nextIndex = (currentIndex + 1) % party.players.length;
              
              // Find next connected player
              while (updatedPlayers[nextIndex]?.connectionStatus !== 'connected' || updatedPlayers[nextIndex]?.health <= 0) {
                nextIndex = (nextIndex + 1) % updatedPlayers.length;
                // Prevent infinite loop
                if (nextIndex === currentIndex) break;
              }
              
              nextPlayerId = updatedPlayers[nextIndex]?.id || connectedPlayers[0].id;
            }
          }
          
          transaction.update(partyRef, {
            players: updatedPlayers,
            currentTurn: nextPlayerId
          });
        }
      });
    } catch (error) {
      console.error('Error leaving party:', error);
      throw error;
    }
  }, []);














  const updateGameSettings = useCallback(async (settings: GameSettings) => {
    // console.log("Debug: Received settings", settings); // Log settings object
    // console.log("Debug: Firestore instance", db); // Log Firestore instance
    // const partyRef = doc(db, 'parties', partyId);

  
    // if (!partyRef.id) {
    //   console.error("Error: partyId is undefined in settings.");
    //   throw new Error("Party ID is required to update game settings.");
    // }
  
    // try {
    //   const partyRef = doc(db, 'parties', settings.partyId);
    //   await runTransaction(db, async (transaction) => {
    //     const partyDoc = await transaction.get(partyRef);
  
    //     if (!partyDoc.exists()) {
    //       throw new Error('Party not found');
    //     }
  
    //     const party = partyDoc.data() as Party;
  
    //     if (party.leaderId !== settings.playerId) {
    //       throw new Error('Only the party leader can update settings');
    //     }
  
    //     if (party.status !== 'waiting') {
    //       throw new Error('Cannot update settings after game has started');
    //     }
  
    //     transaction.update(partyRef, { settings });
    //   });
    // } catch (error) {
    //   console.error("Error updating game settings:", error);
    //   throw error;
    // }
  }, []);
  

  const cleanupDisconnectedPlayers = useCallback(async (partyId: string) => {
    const partyRef = doc(db, 'parties', partyId);
    const DISCONNECT_TIMEOUT = 10 * 60 * 1000; // 10 minutes
    
    try {
      await runTransaction(db, async (transaction) => {
        const partyDoc = await transaction.get(partyRef);
        
        if (!partyDoc.exists()) return;

        const party = partyDoc.data() as Party;
        const now = Date.now();
        
        // Remove players who have been disconnected for more than 10 minutes
        const activePlayers = party.players.filter(player => {
          if (player.connectionStatus === 'disconnected' && player.disconnectedAt) {
            const disconnectedTime = now - player.disconnectedAt;
            if (disconnectedTime > DISCONNECT_TIMEOUT) {
              console.log(`Removing player "${player.name}" - disconnected for ${Math.round(disconnectedTime / 60000)} minutes`);
              return false;
            }
          }
          return true;
        });

        // Only update if players were actually removed
        if (activePlayers.length !== party.players.length) {
          transaction.update(partyRef, {
            players: activePlayers
          });
        }
      });
    } catch (error) {
      console.error('Error cleaning up disconnected players:', error);
    }
  }, []);

  return {
    createParty,
    joinParty,
    startGame,
    leaveParty,
    updateGameSettings,
    cleanupDisconnectedPlayers
  };
}