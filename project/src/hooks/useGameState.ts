import { useEffect, useRef, useCallback } from 'react';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { useGameStore } from '../store/gameStore';
import { Party } from '../types/game';
import { useAuth } from './useAuth';
import { usePartyActions } from './usePartyActions';

export function useGameState(partyId: string) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { leaveParty } = usePartyActions();
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const { 
    setParty, 
    setCurrentPlayer, 
    setLoading, 
    setError,
    reset,
    party,
    currentPlayer 
  } = useGameStore();

  const cleanup = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, []);

  const handlePartyUpdate = useCallback((doc: any) => {
    if (!doc.exists()) {
      cleanup();
      setError('Party not found');
      navigate('/');
      return;
    }

    if (!user) {
      cleanup();
      setError('Authentication required');
      navigate('/');
      return;
    }

    const partyData = { ...doc.data(), id: doc.id } as Party;
    const player = partyData.players.find(p => p.id === user.uid);

    if (!player) {
      cleanup();
      setError('Player not found in party');
      navigate('/');
      return;
    }

    setParty(partyData);
    setCurrentPlayer(player);
    setLoading(false);
  }, [cleanup, navigate, setError, setLoading, setParty, setCurrentPlayer, user]);

  useEffect(() => {
    if (!partyId || authLoading || !user) {
      return;
    }

    const setupSubscription = async () => {
      cleanup();
      setLoading(true);
      setError(null);

      try {
        const partyRef = doc(db, 'parties', partyId);
        
        // Set up real-time updates
        const unsubscribe = onSnapshot(
          partyRef,
          {
            next: handlePartyUpdate,
            error: (error) => {
              console.error('Error fetching party:', error);
              setError('Failed to load game data');
              setLoading(false);
              cleanup();
            }
          }
        );

        unsubscribeRef.current = unsubscribe;
      } catch (error) {
        console.error('Error setting up party subscription:', error);
        setError('Failed to connect to game');
        setLoading(false);
        cleanup();
      }
    };

    setupSubscription();

    return () => {
      cleanup();
    };
  }, [partyId, user, authLoading, cleanup, setLoading, setError, handlePartyUpdate]);

  // Handle cleanup when leaving the game
  useEffect(() => {
    const handleBeforeUnload = async (event: BeforeUnloadEvent) => {
      // Don't automatically leave party on page unload - allow reconnection
      // The party system will mark them as disconnected instead
      console.log('Page unloading - player will be marked as disconnected');
    };

    const handleVisibilityChange = () => {
      // Update last seen timestamp when page becomes visible again
      if (!document.hidden && party && currentPlayer) {
        // Player is back, they can reconnect through normal join flow
        console.log('Player returned to page');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Only clean up if we're actually leaving the game page permanently
      // Removed automatic leaveParty call to prevent immediate disconnections
      if (window.location.pathname !== `/game/${partyId}`) {
        cleanup();
        reset();
      }
    };
  }, [partyId, party, currentPlayer, cleanup, reset]);

  return { cleanup };
}