import { Player } from '../../types/game';
import { Heart, Droplet, Crown, Skull } from 'lucide-react';

interface PlayerStatsProps {
  player: Player;
  isCurrentPlayer: boolean;
}

export function PlayerStats({ player, isCurrentPlayer }: PlayerStatsProps) {
  const isDead = player.health <= 0;

  return (
    <div className={`p-4 rounded-lg ${
      isDead ? 'bg-red-900/20' :
      isCurrentPlayer ? 'bg-purple-900/50' : 'bg-gray-800/50'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold">{player.name}</h3>
          {player.isLeader && <Crown className="w-4 h-4 text-yellow-400" />}
          {isDead && <Skull className="w-4 h-4 text-red-400" />}
        </div>
        {isCurrentPlayer && !isDead && (
          <span className="text-xs bg-purple-500 px-2 py-1 rounded">
            Your Turn
          </span>
        )}
      </div>
      
      <div className="flex space-x-4">
        <div className="flex items-center">
          <Heart className={`w-5 h-5 ${isDead ? 'text-red-900' : 'text-red-500'} mr-1`} />
          <span>{player.health}</span>
        </div>
        <div className="flex items-center">
          <Droplet className={`w-5 h-5 ${isDead ? 'text-blue-900' : 'text-blue-500'} mr-1`} />
          <span>{player.mana}</span>
        </div>
      </div>
    </div>
  );
}