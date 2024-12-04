import React from 'react';
import { Shield, Droplet } from 'lucide-react';
import { GameState, Card } from '../types/game';

interface GameScreenProps {
  gameState: GameState;
  onPlayCard: (cardIndex: number) => void;
  onDrinkMana: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  gameState,
  onPlayCard,
  onDrinkMana,
}) => {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Players Status */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {gameState.players.map((player, index) => (
            <div
              key={player.id}
              className={`bg-white rounded-lg p-4 ${
                index === gameState.currentPlayerIndex
                  ? 'ring-2 ring-yellow-400'
                  : ''
              }`}
            >
              <div className="flex items-center space-x-4">
                <img
                  src={player.avatar}
                  alt={player.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h2 className="text-xl font-bold">{player.name}</h2>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center">
                      <Shield className="w-5 h-5 text-red-500 mr-1" />
                      <span>{player.health}</span>
                    </div>
                    <div className="flex items-center">
                      <Droplet className="w-5 h-5 text-blue-500 mr-1" />
                      <span>{player.mana}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Current Player's Hand */}
        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Your Hand</h3>
          <div className="grid grid-cols-3 gap-4">
            {currentPlayer.hand.map((card, index) => (
              <button
                key={`${card.id}-${index}`}
                onClick={() => onPlayCard(index)}
                disabled={card.manaCost > currentPlayer.mana}
                className={`relative bg-gradient-to-br from-purple-100 to-indigo-100 p-4 rounded-lg border-2 border-purple-200 hover:border-purple-400 transition-colors ${
                  card.manaCost > currentPlayer.mana
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  {card.manaCost}
                </div>
                <img
                  src={card.imageUrl}
                  alt={card.name}
                  className="w-full h-32 object-cover rounded mb-2"
                />
                <h4 className="font-semibold">{card.name}</h4>
                <p className="text-sm text-gray-600">{card.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex justify-center">
          <button
            onClick={onDrinkMana}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            Drink for Mana (+10)
          </button>
        </div>
      </div>
    </div>
  );
};