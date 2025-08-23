import { useEffect, useRef, useCallback } from 'react';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { useGameStore } from '../store/gameStore';
import { Party } from '../types/game';
import { useAuth } from './useAuth';
import { usePartyActions } from './usePartyActions';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../lib/firebase';

export function useGameState(partyId: string) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { leaveParty } = usePartyActions();
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const isSubscribedRef = useRef<boolean>(false);
  const isSigningInRef = useRef<boolean>(false);
  const { 
    party,
    currentPlayer 
  } = useGameStore();

  const cleanup = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    isSubscribedRef.current = false;
  }, []);

  useEffect(() => {
    // Early return if already subscribed or missing required data
    if (!partyId) {
      console.log('🔍 useGameState: Early return - missing partyId');
      return;
    }

    if (authLoading) {
      console.log('🔍 useGameState: Early return - auth loading');
      return;
    }

    if (!user) {
      // Attempt to sign in if not authenticated
      if (!isSigningInRef.current) {
        isSigningInRef.current = true;
        console.log('🔐 No user - signing in anonymously');
        signInAnonymously(auth)
          .catch((err) => {
            console.error('❌ Anonymous sign-in failed:', err);
          })
          .finally(() => {
            isSigningInRef.current = false;
          });
      }
      return;
    }

    if (isSubscribedRef.current) {
      console.log('🔍 useGameState: Early return - already subscribed');
      return;
    }

    // Get store functions inside the effect
    const { setParty, setCurrentPlayer, setLoading, setError, reset } = useGameStore.getState();

    const handlePartyUpdate = (doc: any) => {
      console.log('🔍 handlePartyUpdate called', { exists: doc.exists(), docId: doc.id });
      
      if (!doc.exists()) {
        console.log('❌ Party document not found');
        cleanup();
        setError('Party not found');
        navigate('/');
        return;
      }

      if (!user) {
        console.log('❌ No user found during party update');
        cleanup();
        setError('Authentication required');
        navigate('/');
        return;
      }

      const partyData = { ...doc.data(), id: doc.id } as Party;
      console.log('🔍 Party data received', { 
        partyId: partyData.id, 
        playersCount: partyData.players.length,
        status: partyData.status 
      });
      
      const player = partyData.players.find(p => p.id === user.uid);
      console.log('🔍 Looking for player', { userId: user.uid, foundPlayer: !!player });

      if (!player) {
        console.log('❌ Player not found in party');
        cleanup();
        setError('Player not found in party');
        navigate('/');
        return;
      }

      console.log('✅ Setting party and player data');
      setParty(partyData);
      setCurrentPlayer(player);
      setLoading(false);
    };

    const setupSubscription = async () => {
      if (isSubscribedRef.current) {
        console.log('🔍 Already subscribed, skipping');
        return;
      }

      console.log('🔍 Setting up subscription for party:', partyId);
      cleanup();
      setLoading(true);
      setError(null);

      try {
        const partyRef = doc(db, 'parties', partyId);
        console.log('🔍 Setting up onSnapshot listener');

        // First, try to get the document once to check if it exists
        const docSnapshot = await getDoc(partyRef);
        console.log('🔍 Initial document check', { exists: docSnapshot.exists(), partyId });

        if (!docSnapshot.exists()) {
          console.log('❌ Party document does not exist');
          setError('Party not found');
          setLoading(false);
          cleanup();
          return;
        }

        // Set up real-time updates
        const unsubscribe = onSnapshot(
          partyRef,
          {
            next: handlePartyUpdate,
            error: (error) => {
              console.error('❌ Error in onSnapshot:', error);
              setError('Failed to load game data');
              setLoading(false);
              cleanup();
            }
          }
        );

        unsubscribeRef.current = unsubscribe;
        isSubscribedRef.current = true;
        console.log('✅ Subscription set up successfully');
      } catch (error) {
        console.error('❌ Error setting up party subscription:', error);
        setError('Failed to connect to game');
        setLoading(false);
        cleanup();
      }
    };

    setupSubscription();

    return () => {
      console.log('🔍 useGameState cleanup called');
      cleanup();
    };
  }, [partyId, user?.uid, authLoading, cleanup, navigate]); // Simplified dependencies

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
    };
  }, [party, currentPlayer, cleanup]);

  return { cleanup };
}