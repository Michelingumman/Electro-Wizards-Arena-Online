import React, { useState } from 'react';
import { Gamepad } from 'lucide-react';

interface SetupScreenProps {
  onStartGame: (players: { name: string; avatar: string }[]) => void;
}

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&q=80',
  'https://images.unsplash.com/photo-1472457897821-70d3819a0e24?w=100&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80',
];

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStartGame }) => {
  const [players, setPlayers] = useState([
    { name: '', avatar: AVATAR_OPTIONS[0] },
    { name: '', avatar: AVATAR_OPTIONS[1] },
  ]);

  const handleNameChange = (index: number, name: string) => {
    const newPlayers = [...players];
    newPlayers[index] = { ...newPlayers[index], name };
    setPlayers(newPlayers);
  };

  const handleAvatarChange = (index: number, avatar: string) => {
    const newPlayers = [...players];
    newPlayers[index] = { ...newPlayers[index], avatar };
    setPlayers(newPlayers);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (players.every(p => p.name.trim())) {
      onStartGame(players);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="flex items-center justify-center mb-8">
          <Gamepad className="w-12 h-12 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-800 ml-3">Not Enough Mana</h1>
        </div>

        <form onSubmit={handleSubmit}>
          {players.map((player, index) => (
            <div key={index} className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Player {index + 1}</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={player.name}
                  onChange={(e) => handleNameChange(index, e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {AVATAR_OPTIONS.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    className={`p-1 rounded-lg ${
                      player.avatar === avatar ? 'ring-2 ring-purple-500' : ''
                    }`}
                    onClick={() => handleAvatarChange(index, avatar)}
                  >
                    <img
                      src={avatar}
                      alt="Avatar option"
                      className="w-full h-20 object-cover rounded"
                    />
                  </button>
                ))}
              </div>
            </div>
          ))}

          <button
            type="submit"
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            Start Game
          </button>
        </form>
      </div>
    </div>
  );
};