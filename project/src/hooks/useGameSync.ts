import { useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { GameState } from '../types/game';
import { Party } from '../types/party';

export const useGameSync = (partyId: string) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'parties', partyId),
      (snapshot) => {
        if (snapshot.exists()) {
          const party = snapshot.data() as Party;
          setGameState({
            players: party.players,
            currentPlayerIndex: party.players.findIndex(p => p.id === party.currentPlayerId),
            gameStatus: party.status,
          });
          setLoading(false);
        } else {
          setError('Game not found');
          setLoading(false);
        }
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [partyId]);

  const updateGameState = async (newState: Partial<GameState>) => {
    try {
      await updateDoc(doc(db, 'parties', partyId), {
        players: newState.players,
        currentPlayerId: newState.players?.[newState.currentPlayerIndex || 0]?.id,
        status: newState.gameStatus,
        updatedAt: new Date(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update game state');
    }
  };

  return { gameState, loading, error, updateGameState };
};