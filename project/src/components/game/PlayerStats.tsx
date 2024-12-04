import { Player } from '../../types/game';
import { Heart, Droplet, Crown, Skull } from 'lucide-react';
import { clsx } from 'clsx';

interface PlayerStatsProps {
  player: Player;
  isCurrentPlayer: boolean;
  isCurrentTurn: boolean;
  isTargetable: boolean;
  onSelect?: () => void;
}

export function PlayerStats({ 
  player, 
  isCurrentPlayer, 
  isCurrentTurn,
  isTargetable,
  onSelect 
}: PlayerStatsProps) {
  const isDead = player.health <= 0;

  return (
    <div
      onClick={isTargetable && onSelect ? onSelect : undefined}
      className={clsx(
        'p-4 rounded-lg transition-all duration-200',
        {
          'bg-red-900/20': isDead,
          'bg-purple-900/50 ring-2 ring-purple-500/50': isCurrentTurn && !isDead,
          'bg-gray-800/50': !isCurrentTurn && !isDead,
          'transform scale-105': isCurrentTurn && !isDead,
          'cursor-pointer hover:ring-2 hover:ring-purple-400/50': isTargetable,
          'hover:scale-105': isTargetable
        }
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold">{player.name}</h3>
          {player.isLeader && <Crown className="w-4 h-4 text-yellow-400" />}
          {isDead && <Skull className="w-4 h-4 text-red-400" />}
        </div>
        {isCurrentTurn && !isDead && (
          <div className="flex items-center space-x-2">
            <span className="text-xs bg-purple-500 px-2 py-1 rounded animate-pulse">
              Current Turn
            </span>
          </div>
        )}
      </div>
      
      <div className="flex space-x-4">
        <div className="flex items-center">
          <Heart className={clsx('w-5 h-5 mr-1', {
            'text-red-900': isDead,
            'text-red-500': !isDead,
          })} />
          <span>{player.health}</span>
        </div>
        <div className="flex items-center">
          <Droplet className={clsx('w-5 h-5 mr-1', {
            'text-blue-900': isDead,
            'text-blue-500': !isDead,
          })} />
          <span>{player.mana}</span>
        </div>
      </div>

      {isTargetable && (
        <div className="mt-2 text-sm text-purple-300 animate-pulse">
          Click to target
        </div>
      )}
    </div>
  );
}