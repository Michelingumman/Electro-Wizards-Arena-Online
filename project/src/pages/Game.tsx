import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { Droplet } from 'lucide-react';
import { db } from '../lib/firebase';
import { useGameStore } from '../store/gameStore';
import { Card, Party } from '../types/game';
import { PlayerStats } from '../components/game/PlayerStats';
import { CardList } from '../components/game/CardList';
import { Button } from '../components/ui/Button';
import { useGameActions } from '../hooks/useGameActions';
import { auth } from '../lib/firebase';

export function Game() {
  const { partyId } = useParams<{ partyId: string }>();
  const navigate = useNavigate();
  const { party, setParty, currentPlayer, setCurrentPlayer } = useGameStore();
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { applyCardEffect, drinkMana } = useGameActions(partyId!);

  useEffect(() => {
    if (!partyId) {
      navigate('/');
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'parties', partyId), (doc) => {
      if (doc.exists()) {
        const partyData = { ...doc.data(), id: doc.id } as Party;
        setParty(partyData);
        
        // Set current player based on auth
        const userId = auth.currentUser?.uid;
        if (userId) {
          const player = partyData.players.find(p => p.id === userId);
          if (player) {
            setCurrentPlayer(player);
          }
        }
        setLoading(false);
      } else {
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [partyId, setParty, setCurrentPlayer, navigate]);

  const isCurrentTurn = party?.currentTurn === currentPlayer?.id;

  const handlePlayCard = async (card: Card) => {
    if (!party || !currentPlayer || !selectedTarget) return;
    await applyCardEffect(party, currentPlayer.id, selectedTarget, card);
    setSelectedTarget(null);
  };

  const handleDrink = async () => {
    if (!party || !currentPlayer) return;
    await drinkMana(party, currentPlayer.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-purple-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-xl text-purple-100">Loading game...</p>
        </div>
      </div>
    );
  }

  if (!party || !currentPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-purple-900">
        <div className="text-center">
          <p className="text-xl text-red-400 mb-4">Game not found</p>
          <Button onClick={() => navigate('/')}>Return Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-gray-900 to-purple-900">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-purple-100">Players</h2>
            <div className="text-sm text-purple-200">
              Party Code: <span className="font-mono bg-purple-900/50 px-2 py-1 rounded">{party.code}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {party.players.map((player) => (
              <div
                key={player.id}
                onClick={() => isCurrentTurn && player.id !== currentPlayer.id && setSelectedTarget(player.id)}
                className={`cursor-pointer transition-all duration-200 ${
                  selectedTarget === player.id ? 'ring-2 ring-purple-500 transform scale-105' : ''
                } ${player.id !== currentPlayer.id && isCurrentTurn ? 'hover:scale-105' : ''}`}
              >
                <PlayerStats
                  player={player}
                  isCurrentPlayer={player.id === party.currentTurn}
                />
              </div>
            ))}
          </div>
        </div>

        {isCurrentTurn ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-purple-100">Your Cards</h2>
              <Button
                variant="secondary"
                onClick={handleDrink}
                className="flex items-center group hover:bg-purple-700"
              >
                <Droplet className="mr-2 group-hover:text-blue-400" />
                Drink Mana (+3)
              </Button>
            </div>
            {!selectedTarget && currentPlayer.cards.some(card => card.manaCost <= currentPlayer.mana) && (
              <div className="bg-purple-900/30 border border-purple-500/30 p-4 rounded-lg">
                <p className="text-purple-200">Select an opponent to target with your card</p>
              </div>
            )}
            <CardList
              cards={currentPlayer.cards}
              onPlayCard={handlePlayCard}
              disabled={!selectedTarget}
              currentMana={currentPlayer.mana}
            />
          </div>
        ) : (
          <div className="text-center p-8 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-purple-500/20">
            <p className="text-xl text-purple-200">Waiting for other player's turn...</p>
          </div>
        )}
      </div>
    </div>
  );
}