import { Player } from '../../types/game';
import { Heart, Droplet } from 'lucide-react';

interface PlayerStatsProps {
  player: Player;
  isCurrentPlayer: boolean;
}

export function PlayerStats({ player, isCurrentPlayer }: PlayerStatsProps) {
  return (
    <div className={`p-4 rounded-lg ${
      isCurrentPlayer ? 'bg-purple-900/50' : 'bg-gray-800/50'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">{player.name}</h3>
        {isCurrentPlayer && (
          <span className="text-xs bg-purple-500 px-2 py-1 rounded">
            Your Turn
          </span>
        )}
      </div>
      
      <div className="flex space-x-4">
        <div className="flex items-center">
          <Heart className="w-5 h-5 text-red-500 mr-1" />
          <span>{player.health}</span>
        </div>
        <div className="flex items-center">
          <Droplet className="w-5 h-5 text-blue-500 mr-1" />
          <span>{player.mana}</span>
        </div>
      </div>
    </div>
  );
}