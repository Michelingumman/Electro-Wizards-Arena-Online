import { useCallback } from 'react';
import { addDoc, collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { auth, db } from '../../../lib/firebase';
import { TDMatch, TDPlayer } from '../types/td';

export function useTDMatchmaking() {
  const createMatch = useCallback(async (name: string) => {
    const userCred = await signInAnonymously(auth);
    const hostId = userCred.user.uid;

    // Generate a simple 2-digit numeric code
    const code = String(Math.floor(Math.random() * 100)).padStart(2, '0');

    const player: TDPlayer = {
      id: hostId,
      name,
      ready: false,
      deck: [],
    };

    const matchData: Omit<TDMatch, 'id'> = {
      code,
      status: 'lobby',
      hostId,
      players: [player],
      createdAt: serverTimestamp(),
      winnerId: null,
    };

    const ref = await addDoc(collection(db, 'td_matches'), matchData);
    return { matchId: ref.id, hostId };
  }, []);

  const joinMatchByCode = useCallback(async (code: string, name: string) => {
    const userCred = await signInAnonymously(auth);
    const uid = userCred.user.uid;

    const q = query(collection(db, 'td_matches'), where('code', '==', code));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('Match not found');
    const docSnap = snap.docs[0];
    const matchId = docSnap.id;

    const ref = doc(db, 'td_matches', matchId);

    // Use a transaction-free append pattern with arrayUnion via update is possible,
    // but to keep imports small here we fetch and patch via set/update using runTransaction later if needed.
    // For initial scaffold we'll do a simple optimistic append through a small Cloud-side merge.
    const data = docSnap.data() as TDMatch;
    if (data.players.find((p) => p.id === uid)) {
      return { matchId, uid };
    }
    const updated = {
      players: [...data.players, { id: uid, name, ready: false, deck: [], joined: true }],
    };
    // Minimal write: set with merge
    await updateDoc(ref, updated as any);

    return { matchId, uid };
  }, []);

  return { createMatch, joinMatchByCode };
}


