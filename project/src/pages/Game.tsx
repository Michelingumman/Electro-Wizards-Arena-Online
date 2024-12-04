import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Droplet, LogOut } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { Card } from '../types/game';
import { PlayerStats } from '../components/game/PlayerStats';
import { CardList } from '../components/game/CardList';
import { Button } from '../components/ui/Button';
import { useGameActions } from '../hooks/useGameActions';
import { useGameState } from '../hooks/useGameState';
import { usePartyActions } from '../hooks/usePartyActions';
import { GAME_CONFIG } from '../config/gameConfig';

export function Game() {
  const { partyId } = useParams<{ partyId: string }>();
  const navigate = useNavigate();
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const { party, currentPlayer, loading, error } = useGameStore();
  const { applyCardEffect, drinkMana } = useGameActions(partyId!);
  const { leaveParty, startGame } = usePartyActions();

  // Initialize game state
  useGameState(partyId!);

  const isCurrentTurn = party?.currentTurn === currentPlayer?.id;
  const isLeader = currentPlayer?.isLeader;

  const handlePlayCard = async (card: Card) => {
    if (!party || !currentPlayer) return;
    
    if (card.requiresTarget && !selectedTarget) return;
    
    if (card.requiresTarget) {
      await applyCardEffect(party, currentPlayer.id, selectedTarget!, card);
    } else {
      await applyCardEffect(party, currentPlayer.id, currentPlayer.id, card);
    }
    setSelectedTarget(null);
  };

  const handleDrink = async () => {
    if (!party || !currentPlayer) return;
    await drinkMana(party, currentPlayer.id);
  };

  const handleLeaveParty = async () => {
    if (!party || !currentPlayer) return;
    await leaveParty(party.id, currentPlayer.id);
    navigate('/');
  };

  const handleStartGame = async () => {
    if (!party || !currentPlayer || !isLeader) return;
    try {
      await startGame(party.id, currentPlayer.id);
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (party && currentPlayer) {
        leaveParty(party.id, currentPlayer.id);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (party && currentPlayer) {
        leaveParty(party.id, currentPlayer.id);
      }
    };
  }, [party, currentPlayer, leaveParty]);

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

  if (error || !party || !currentPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-purple-900">
        <div className="text-center">
          <p className="text-xl text-red-400 mb-4">{error || 'Game not found'}</p>
          <Button onClick={() => navigate('/')}>Return Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-gray-900 to-purple-900">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="text-sm text-purple-200">
            Party Code: <span className="font-mono bg-purple-900/50 px-2 py-1 rounded">{party.code}</span>
          </div>
          <div className="flex gap-4">
            {isLeader && party.status === 'waiting' && (
              <Button
                onClick={handleStartGame}
                disabled={party.players.length < GAME_CONFIG.MIN_PLAYERS_TO_START}
                className="flex items-center"
              >
                Start Game ({party.players.length}/{GAME_CONFIG.MIN_PLAYERS_TO_START} players)
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={handleLeaveParty}
              className="flex items-center text-red-400 hover:text-red-300"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Leave Game
            </Button>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-purple-100 mb-4">Players</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {party.players.map((player) => (
              <div
                key={player.id}
                onClick={() => {
                  if (isCurrentTurn && player.id !== currentPlayer.id) {
                    setSelectedTarget(player.id);
                  }
                }}
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

        {party.status === 'waiting' ? (
          <div className="text-center p-8 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-purple-500/20">
            <p className="text-xl text-purple-200">
              Waiting for {isLeader ? 'more players to join' : 'the leader to start the game'}...
            </p>
          </div>
        ) : isCurrentTurn ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-purple-100">Your Cards</h2>
              <Button
                variant="secondary"
                onClick={handleDrink}
                className="flex items-center group hover:bg-purple-700"
              >
                <Droplet className="mr-2 group-hover:text-blue-400" />
                Drink Mana (+{GAME_CONFIG.MANA_DRINK_AMOUNT})
              </Button>
            </div>
            {!selectedTarget && currentPlayer.cards.some(card => card.requiresTarget && card.manaCost <= currentPlayer.mana) && (
              <div className="bg-purple-900/30 border border-purple-500/30 p-4 rounded-lg">
                <p className="text-purple-200">Select an opponent to target with your damage card</p>
              </div>
            )}
            <CardList
              cards={currentPlayer.cards}
              onPlayCard={handlePlayCard}
              disabled={false}
              currentMana={currentPlayer.mana}
              selectedTarget={selectedTarget}
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