import { useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { useGameStore } from '../store/gameStore';
import { Party } from '../types/game';
import { useAuth } from './useAuth';

export function useGameState(partyId: string) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { 
    setParty, 
    setCurrentPlayer, 
    setLoading, 
    setError,
    reset 
  } = useGameStore();

  useEffect(() => {
    if (!partyId) {
      setError('No party ID provided');
      navigate('/');
      return;
    }

    if (authLoading) {
      return;
    }

    if (!user) {
      setError('Not authenticated');
      navigate('/');
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      doc(db, 'parties', partyId),
      (doc) => {
        if (!doc.exists()) {
          setError('Party not found');
          navigate('/');
          return;
        }

        const partyData = { ...doc.data(), id: doc.id } as Party;
        const player = partyData.players.find(p => p.id === user.uid);

        if (!player) {
          setError('Player not found in party');
          navigate('/');
          return;
        }

        setParty(partyData);
        setCurrentPlayer(player);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Error fetching party:', error);
        setError('Failed to load game data');
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
      reset();
    };
  }, [partyId, user, authLoading, navigate, setParty, setCurrentPlayer, setLoading, setError, reset]);
}