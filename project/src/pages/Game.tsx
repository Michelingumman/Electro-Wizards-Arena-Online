import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Droplet, LogOut, Users, PlayCircle } from 'lucide-react';
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
  const { cleanup } = useGameState(partyId!);

  const isCurrentTurn = party?.currentTurn === currentPlayer?.id;
  const isLeader = currentPlayer?.isLeader;
  const isWaiting = party?.status === 'waiting';

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
    cleanup();
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
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-purple-100">
              {isWaiting ? 'Waiting Room' : 'Battle Arena'}
            </h2>
            <div className="text-sm text-purple-200 bg-purple-900/50 px-3 py-1 rounded-full flex items-center">
              <Users className="w-4 h-4 mr-2" />
              {party.players.length} / {GAME_CONFIG.MAX_PLAYERS}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-purple-200">
              Party Code: <span className="font-mono bg-purple-900/50 px-2 py-1 rounded">{party.code}</span>
            </div>
            <Button
              variant="secondary"
              onClick={handleLeaveParty}
              className="flex items-center text-red-400 hover:text-red-300"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Leave Party
            </Button>
          </div>
        </div>

        {isWaiting ? (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-purple-500/20 p-8 text-center">
            <h3 className="text-xl text-purple-200 mb-4">
              Waiting for players to join...
            </h3>
            {isLeader && party.players.length >= GAME_CONFIG.MIN_PLAYERS_TO_START && (
              <Button onClick={handleStartGame} className="flex items-center mx-auto">
                <PlayCircle className="w-5 h-5 mr-2" />
                Start Game
              </Button>
            )}
            {!isLeader && (
              <p className="text-gray-400">
                Waiting for the party leader to start the game...
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="mb-8">
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
                />
              </div>
            ) : (
              <div className="text-center p-8 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-purple-500/20">
                <p className="text-xl text-purple-200">Waiting for other player's turn...</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}