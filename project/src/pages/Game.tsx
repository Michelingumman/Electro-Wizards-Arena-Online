import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PlayCircle, LogOut } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { Card } from '../types/game';
import { PlayerStats } from '../components/game/PlayerStats';
import { CardList } from '../components/game/CardList';
import { Button } from '../components/ui/Button';
import { GameSettings } from '../components/game/GameSettings';
import { useGameActions } from '../hooks/useGameActions';
import { useGameState } from '../hooks/useGameState';
import { usePartyActions } from '../hooks/usePartyActions';
import { GAME_CONFIG } from '../config/gameConfig';

export function Game() {
  const { partyId } = useParams<{ partyId: string }>();
  const navigate = useNavigate();
  const { party, currentPlayer, loading, error } = useGameStore();
  const { applyCardEffect, drinkMana } = useGameActions(partyId!);
  const { startGame, leaveParty, updateGameSettings } = usePartyActions();
  const { cleanup } = useGameState(partyId!);

  const isLeader = currentPlayer?.isLeader;
  const isWaiting = party?.status === 'waiting';
  const isCurrentTurn = party?.currentTurn === currentPlayer?.id;
  const isDead = currentPlayer?.health <= 0;

  const handlePlayCard = async (card: Card) => {
    if (!party || !currentPlayer || isDead) return;
    
    // For healing cards, target self without requiring selection
    if (!card.requiresTarget) {
      await applyCardEffect(party, currentPlayer.id, currentPlayer.id, card);
      return;
    }
    
    // For damage cards, require target selection
    const targetPlayer = party.players.find(p => 
      p.id !== currentPlayer.id && p.health > 0
    );
    
    if (targetPlayer) {
      await applyCardEffect(party, currentPlayer.id, targetPlayer.id, card);
    }
  };

  const handleDrink = async () => {
    if (!party || !currentPlayer || isDead) return;
    await drinkMana(party, currentPlayer.id);
  };

  const handleStartGame = async () => {
    if (!party || !isLeader) return;
    await startGame(party.id);
  };

  const handleLeaveParty = async () => {
    if (!party || !currentPlayer) return;
    await leaveParty(party.id, currentPlayer.id);
    cleanup();
    navigate('/');
  };

  const handleUpdateSettings = async (settings: GameSettingsType) => {
    if (!party || !currentPlayer || !isLeader) return;
    await updateGameSettings(party.id, currentPlayer.id, settings);
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
          <div className="text-sm text-purple-200">
            Party Code: <span className="font-mono bg-purple-900/50 px-2 py-1 rounded">{party.code}</span>
          </div>
          <Button variant="secondary" onClick={handleLeaveParty} className="flex items-center">
            <LogOut className="w-4 h-4 mr-2" />
            Leave Party
          </Button>
        </div>

        {isWaiting ? (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-purple-500/20 p-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl text-purple-200">
                Waiting for players to join...
              </h3>
              {isLeader && <GameSettings onSave={handleUpdateSettings} isLeader={isLeader} />}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {party.players.map((player) => (
                <PlayerStats
                  key={player.id}
                  player={player}
                  isCurrentPlayer={player.id === currentPlayer.id}
                />
              ))}
            </div>
            
            {isLeader && party.players.length >= GAME_CONFIG.MIN_PLAYERS_TO_START && (
              <Button onClick={handleStartGame} className="flex items-center mx-auto">
                <PlayCircle className="w-5 h-5 mr-2" />
                Start Game
              </Button>
            )}
            {!isLeader && (
              <p className="text-center text-gray-400">
                Waiting for the party leader to start the game...
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {party.players.map((player) => (
                <PlayerStats
                  key={player.id}
                  player={player}
                  isCurrentPlayer={player.id === currentPlayer.id}
                />
              ))}
            </div>

            {isDead ? (
              <div className="text-center p-8 bg-red-900/20 backdrop-blur-sm rounded-lg border border-red-500/20">
                <p className="text-xl text-red-400">You have been defeated!</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-purple-100">Your Cards</h2>
                  <Button
                    variant="secondary"
                    onClick={handleDrink}
                    disabled={currentPlayer.mana >= GAME_CONFIG.MAX_MANA}
                    className="flex items-center group hover:bg-purple-700"
                  >
                    Drink Mana (+{GAME_CONFIG.MANA_DRINK_AMOUNT})
                  </Button>
                </div>
                <CardList
                  cards={currentPlayer.cards}
                  onPlayCard={handlePlayCard}
                  disabled={!isCurrentTurn}
                  currentMana={currentPlayer.mana}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}