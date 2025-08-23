import { useEffect } from 'react';
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useTDStore } from '../store/useTDStore';
import { TDMatch } from '../types/td';

export function useTDMatchState(matchId: string | undefined) {
  const { setMatch, setLoading, setError } = useTDStore();

  useEffect(() => {
    if (!matchId) return;
    setLoading(true);
    const ref = doc(db, 'td_matches', matchId);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        setError('Match not found');
        setLoading(false);
        return;
      }
      const match = { id: snap.id, ...snap.data() } as TDMatch;
      setMatch(match);
      setLoading(false);
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });
    // Subscribe to events stream (ordered)
    const eventsRef = collection(db, 'td_matches', matchId, 'events');
    const eventsQ = query(eventsRef, orderBy('createdAt', 'asc'));
    const unsubEvents = onSnapshot(eventsQ, () => {
      // For now we just rely on match.lastEvent writes; full events processing will come next
    });

    return () => { unsub(); unsubEvents(); };
  }, [matchId, setMatch, setLoading, setError]);
}


