import { useCallback } from 'react';
import { collection, addDoc, updateDoc, doc, getDoc, deleteDoc } from 'firebase/firestore';
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

    const partyRef = await addDoc(collection(db, 'parties'), partyData);
    return partyRef.id;
  }, []);

  const joinParty = useCallback(async (partyId: string, player: Omit<Player, 'cards' | 'isLeader'>) => {
    const partyRef = doc(db, 'parties', partyId);
    const partySnap = await getDoc(partyRef);
    
    if (!partySnap.exists()) {
      throw new Error('Party not found');
    }

    const party = partySnap.data() as Party;
    
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

    await updateDoc(partyRef, {
      players: [...party.players, newPlayer]
    });

    return partyId;
  }, []);

  const startGame = useCallback(async (partyId: string, playerId: string) => {
    const partyRef = doc(db, 'parties', partyId);
    const partySnap = await getDoc(partyRef);
    
    if (!partySnap.exists()) {
      throw new Error('Party not found');
    }

    const party = partySnap.data() as Party;
    
    if (party.leaderId !== playerId) {
      throw new Error('Only the party leader can start the game');
    }

    if (party.players.length < GAME_CONFIG.MIN_PLAYERS_TO_START) {
      throw new Error(`Need at least ${GAME_CONFIG.MIN_PLAYERS_TO_START} players to start`);
    }

    await updateDoc(partyRef, {
      status: 'playing'
    });
  }, []);

  const leaveParty = useCallback(async (partyId: string, playerId: string) => {
    const partyRef = doc(db, 'parties', partyId);
    const partySnap = await getDoc(partyRef);
    
    if (!partySnap.exists()) return;

    const party = partySnap.data() as Party;
    
    if (party.leaderId === playerId) {
      // If leader leaves, delete the party
      await deleteDoc(partyRef);
    } else {
      // Otherwise, remove the player from the party
      const updatedPlayers = party.players.filter(p => p.id !== playerId);
      await updateDoc(partyRef, {
        players: updatedPlayers
      });
    }
  }, []);

  return { createParty, joinParty, startGame, leaveParty };
}