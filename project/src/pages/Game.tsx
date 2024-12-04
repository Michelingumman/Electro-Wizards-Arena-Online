import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Droplet, LogOut } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { Card } from '../types/game';
import { PlayerStats } from '../components/game/PlayerStats';
import { CardList } from '../components/game/CardList';
import { Button } from '../components/ui/Button';
import { GameSettings } from '../components/game/GameSettings';
import { useGameActions } from '../hooks/useGameActions';
import { useGameState } from '../hooks/useGameState';
import { usePartyActions } from '../hooks/usePartyActions';

export function Game() {
  const { partyId } = useParams<{ partyId: string }>();
  const navigate = useNavigate();
  const { party, currentPlayer, loading, error } = useGameStore();
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const { applyCardEffect, drinkMana, endTurn } = useGameActions(partyId!);
  const { leaveParty, startGame, updateGameSettings } = usePartyActions();
  
  // Set up game state subscription
  useGameState(partyId!);

  const isCurrentTurn = party?.currentTurn === currentPlayer?.id;
  const isLeader = currentPlayer?.isLeader;
  const canStart = party?.status === 'waiting' && isLeader && (party?.players.length ?? 0) >= 2;
  const canDrink = currentPlayer?.health > 0 && currentPlayer?.mana < (party?.settings?.maxMana ?? 10);

  const handlePlayCard = async (card: Card) => {
    if (!party || !currentPlayer || (!selectedTarget && card.requiresTarget)) return;
    
    try {
      await applyCardEffect(
        party,
        currentPlayer.id,
        card.requiresTarget ? selectedTarget! : currentPlayer.id,
        card
      );
      setSelectedTarget(null);
    } catch (error) {
      console.error('Error playing card:', error);
    }
  };

  const handleDrink = async () => {
    if (!party || !currentPlayer || !canDrink) return;
    try {
      await drinkMana(party, currentPlayer.id);
    } catch (error) {
      console.error('Error drinking mana:', error);
    }
  };

  const handleEndTurn = async () => {
    if (!party || !currentPlayer || !isCurrentTurn) return;
    try {
      await endTurn(party, currentPlayer.id);
    } catch (error) {
      console.error('Error ending turn:', error);
    }
  };

  const handleLeaveParty = async () => {
    if (!party || !currentPlayer) return;
    try {
      await leaveParty(party.id, currentPlayer.id);
      navigate('/');
    } catch (error) {
      console.error('Error leaving party:', error);
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
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-purple-100">Players</h2>
              <div className="text-sm text-purple-200">
                Party Code: <span className="font-mono bg-purple-900/50 px-2 py-1 rounded">{party.code}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {canStart && (
                <Button onClick={() => startGame(party.id)}>
                  Start Game
                </Button>
              )}
              <GameSettings
                onSave={(settings) => updateGameSettings(party.id, currentPlayer.id, settings)}
                isLeader={isLeader}
              />
              {canDrink && (
                <Button
                  variant="secondary"
                  onClick={handleDrink}
                  className="flex items-center group hover:bg-blue-900/20"
                >
                  <Droplet className="mr-2 group-hover:text-blue-400" />
                  Drink (+{party.settings?.manaDrinkAmount ?? 3})
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={handleLeaveParty}
                className="flex items-center space-x-2 hover:bg-red-900/20"
              >
                <LogOut className="w-4 h-4" />
                <span>Leave Game</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {party.players.map((player) => (
              <div
                key={player.id}
                onClick={() => {
                  if (isCurrentTurn && player.id !== currentPlayer.id && player.health > 0) {
                    setSelectedTarget(player.id);
                  }
                }}
                className={`cursor-pointer transition-all duration-200 ${
                  selectedTarget === player.id ? 'ring-2 ring-purple-500 transform scale-105' : ''
                } ${player.id !== currentPlayer.id && isCurrentTurn ? 'hover:scale-105' : ''}`}
              >
                <PlayerStats
                  player={player}
                  isCurrentPlayer={player.id === currentPlayer.id}
                  isCurrentTurn={player.id === party.currentTurn}
                />
              </div>
            ))}
          </div>
        </div>

        {party.status === 'finished' ? (
          <div className="text-center p-8 bg-purple-900/30 backdrop-blur-sm rounded-lg border border-purple-500/20">
            <h3 className="text-2xl font-bold text-purple-100 mb-4">Game Over!</h3>
            {party.winner && (
              <p className="text-xl text-purple-200">
                Winner: {party.players.find(p => p.id === party.winner)?.name}
              </p>
            )}
          </div>
        ) : party.status === 'waiting' ? (
          <div className="text-center p-8 bg-purple-900/30 backdrop-blur-sm rounded-lg border border-purple-500/20">
            <p className="text-xl text-purple-200">
              Waiting for {isLeader ? 'more players to join...' : 'the game to start...'}
            </p>
          </div>
        ) : currentPlayer.health <= 0 ? (
          <div className="text-center p-8 bg-red-900/30 backdrop-blur-sm rounded-lg border border-red-500/20">
            <p className="text-xl text-red-200">You have been defeated!</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-purple-100">Your Cards</h2>
            </div>
            {selectedTarget && (
              <div className="bg-purple-900/30 border border-purple-500/30 p-4 rounded-lg">
                <p className="text-purple-200">Target selected: {party.players.find(p => p.id === selectedTarget)?.name}</p>
              </div>
            )}
            <CardList
              cards={currentPlayer.cards}
              onPlayCard={handlePlayCard}
              disabled={!isCurrentTurn}
              currentMana={currentPlayer.mana}
              showEndTurn={isCurrentTurn}
              onEndTurn={handleEndTurn}
            />
          </div>
        )}
      </div>
    </div>
  );
}