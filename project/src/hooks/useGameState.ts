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
    
    // Look for player with either matching ID or name
    const savedPlayerName = localStorage.getItem('playerName');
    let player = partyData.players.find(p => p.id === user.uid);
    
    // If player is not found by ID but we have a saved name and a player with that name exists,
    // it means we're reconnecting, and we should trigger a re-join with same name
    if (!player && savedPlayerName) {
      const playerWithSameName = partyData.players.find(p => p.name === savedPlayerName);
      if (playerWithSameName) {
        console.log('Detected reconnection with same name, updating player data');
        // We find the player by name, but we'll continue with the current user ID
        player = playerWithSameName;
      }
    }

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
      // We don't need to call leaveParty on normal disconnects anymore
      // Instead, we just let the player remain in the party so they can rejoin
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Only clean up if we're actually navigating away from the game page
      // Not for refreshes or disconnects
      if (window.location.pathname !== `/game/${partyId}`) {
        // Note: We're not calling leaveParty here anymore since we want to allow rejoin
        // Only explicit Leave Game button calls will use leaveParty with isIntentionalLeave=true
        cleanup();
        reset();
      }
    };
  }, [partyId, cleanup, reset]);

  return { cleanup };
}