import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { Droplet } from 'lucide-react';
import { db } from '../lib/firebase';
import { useGameStore } from '../store/gameStore';
import { Card, Party } from '../types/game';
import { PlayerStats } from '../components/game/PlayerStats';
import { CardList } from '../components/game/CardList';
import { Button } from '../components/ui/Button';
import { useGameActions } from '../hooks/useGameActions';

export function Game() {
  const { partyId } = useParams<{ partyId: string }>();
  const { party, setParty, currentPlayer } = useGameStore();
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const { applyCardEffect, drinkMana } = useGameActions(partyId!);

  useEffect(() => {
    if (!partyId) return;

    const unsubscribe = onSnapshot(doc(db, 'parties', partyId), (doc) => {
      if (doc.exists()) {
        const partyData = doc.data() as Party;
        setParty({ ...partyData, id: doc.id });
      }
    });

    return () => unsubscribe();
  }, [partyId, setParty]);

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

  if (!party || !currentPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading game...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Players</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {party.players.map((player) => (
              <div
                key={player.id}
                onClick={() => isCurrentTurn && setSelectedTarget(player.id)}
                className={`cursor-pointer ${
                  selectedTarget === player.id ? 'ring-2 ring-purple-500' : ''
                }`}
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
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Your Cards</h2>
              <Button
                variant="secondary"
                onClick={handleDrink}
                className="flex items-center"
              >
                <Droplet className="mr-2" />
                Drink Mana (+3)
              </Button>
            </div>
            <CardList
              cards={currentPlayer.cards}
              onPlayCard={handlePlayCard}
              disabled={!selectedTarget}
              currentMana={currentPlayer.mana}
            />
          </div>
        ) : (
          <div className="text-center p-8 bg-gray-800 rounded-lg">
            <p className="text-xl">Waiting for other player's turn...</p>
          </div>
        )}
      </div>
    </div>
  );
}