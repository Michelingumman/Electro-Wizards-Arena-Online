import { useCallback } from 'react';
import { collection, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Party, Player } from '../types/game';
import { generateInitialCards } from '../utils/cards';
import { generatePartyCode, canJoinParty } from '../utils/party';
import { GAME_CONFIG } from '../constants/gameConfig';

export function usePartyActions() {
  const createParty = useCallback(async (player: Omit<Player, 'cards'>) => {
    const code = generatePartyCode();
    
    const partyData: Omit<Party, 'id'> = {
      code,
      status: 'waiting',
      players: [{
        ...player,
        health: GAME_CONFIG.INITIAL_HEALTH,
        mana: GAME_CONFIG.INITIAL_MANA,
        cards: generateInitialCards()
      }],
      currentTurn: player.id
    };

    const partyRef = await addDoc(collection(db, 'parties'), partyData);
    return partyRef.id;
  }, []);

  const joinParty = useCallback(async (partyId: string, player: Omit<Player, 'cards'>) => {
    const partyRef = doc(db, 'parties', partyId);
    const partySnap = await getDoc(partyRef);
    
    if (!partySnap.exists()) {
      throw new Error('Party not found');
    }

    const party = partySnap.data() as Party;
    
    if (!canJoinParty(party.players.length)) {
      throw new Error('Party is full');
    }

    if (party.status !== 'waiting') {
      throw new Error('Game has already started');
    }

    const newPlayer = {
      ...player,
      health: GAME_CONFIG.INITIAL_HEALTH,
      mana: GAME_CONFIG.INITIAL_MANA,
      cards: generateInitialCards()
    };

    await updateDoc(partyRef, {
      players: [...party.players, newPlayer],
      status: party.players.length + 1 >= GAME_CONFIG.MAX_PLAYERS ? 'playing' : 'waiting'
    });

    return partyId;
  }, []);

  return { createParty, joinParty };
}