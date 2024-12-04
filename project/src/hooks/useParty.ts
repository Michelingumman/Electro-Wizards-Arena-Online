import { useState, useCallback } from 'react';
import { db, storage } from '../config/firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Party, PartyJoinRequest } from '../types/party';
import { cards } from '../data/cards';

const generateInitialHand = () => {
  return Array.from({ length: 3 }, () => {
    const randomIndex = Math.floor(Math.random() * cards.length);
    return cards[randomIndex];
  });
};

export const useParty = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createParty = useCallback(async (hostName: string, profilePicture?: File): Promise<Party> => {
    setLoading(true);
    setError(null);
    
    try {
      let profileUrl = '';
      if (profilePicture) {
        const storageRef = ref(storage, `profiles/${Date.now()}-${profilePicture.name}`);
        const snapshot = await uploadBytes(storageRef, profilePicture);
        profileUrl = await getDownloadURL(snapshot.ref);
      }

      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const hostId = crypto.randomUUID();
      
      const partyData = {
        code,
        hostId,
        players: [{
          id: hostId,
          name: hostName,
          avatar: profileUrl || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&q=80',
          health: 10,
          mana: 10,
          hand: generateInitialHand()
        }],
        status: 'waiting',
        currentPlayerId: hostId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'parties'), partyData);
      
      // Return the party with the generated ID
      return {
        id: docRef.id,
        ...partyData,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Party;
    } catch (err) {
      console.error('Error creating party:', err);
      const message = err instanceof Error ? err.message : 'Failed to create party';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const joinParty = useCallback(async ({ code, playerName, profilePicture }: PartyJoinRequest): Promise<Party> => {
    setLoading(true);
    setError(null);

    try {
      const partyQuery = query(collection(db, 'parties'), where('code', '==', code.toUpperCase()));
      const querySnapshot = await getDocs(partyQuery);
      
      if (querySnapshot.empty) {
        throw new Error('Party not found');
      }

      const partyDoc = querySnapshot.docs[0];
      const party = { id: partyDoc.id, ...partyDoc.data() } as Party;

      if (party.status !== 'waiting') {
        throw new Error('Party is no longer accepting players');
      }

      if (party.players.length >= 4) {
        throw new Error('Party is full');
      }

      let profileUrl = '';
      if (profilePicture) {
        const storageRef = ref(storage, `profiles/${Date.now()}-${profilePicture.name}`);
        const snapshot = await uploadBytes(storageRef, profilePicture);
        profileUrl = await getDownloadURL(snapshot.ref);
      }

      const newPlayer = {
        id: crypto.randomUUID(),
        name: playerName,
        avatar: profileUrl || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&q=80',
        health: 10,
        mana: 10,
        hand: generateInitialHand()
      };

      const updatedParty = {
        ...party,
        players: [...party.players, newPlayer],
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'parties', party.id), updatedParty);
      
      // Return the updated party
      return {
        ...updatedParty,
        updatedAt: new Date()
      };
    } catch (err) {
      console.error('Error joining party:', err);
      const message = err instanceof Error ? err.message : 'Failed to join party';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createParty,
    joinParty,
    loading,
    error
  };
};