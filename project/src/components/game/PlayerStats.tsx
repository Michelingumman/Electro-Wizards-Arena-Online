import { Player } from '../../types/game';
import { Heart, Droplet, Crown, Skull, LayoutGrid, Shield, Flame } from 'lucide-react';
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

  const formatNumber = (num: number) => {
    return Number(num.toFixed(1));
  };

  return (
    <div
      onClick={isTargetable && onSelect ? onSelect : undefined}
      className={clsx(
        'p-3 rounded-lg transition-all duration-200',
        {
          'bg-red-900/20': isDead,
          'bg-purple-900/20 ring-1 ring-purple-500/50': isCurrentTurn && !isDead,
          'bg-gray-800/20': !isCurrentTurn && !isDead,
          'transform hover:scale-102': isCurrentTurn && !isDead,
          'cursor-pointer hover:ring-2 hover:ring-purple-400/50': isTargetable,
          'hover:scale-102': isTargetable,
          'ring-2 ring-purple-400/50 scale-102': isTargetable
        }
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-medium">{player.name}</h3>
          {player.isLeader && <Crown className="w-3 h-3 text-yellow-400" />}
          {isDead && <Skull className="w-3 h-3 text-red-400" />}
        </div>

        {!isCurrentPlayer && (
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-gray-800/40 px-1.5 py-0.5 rounded text-xs">
              <LayoutGrid className="w-3 h-3 text-gray-400" />
              <span className="text-gray-400">{player.cards.length}</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between mt-1.5">
        <div className="flex space-x-3">
          <div className="flex items-center">
            <Heart className={clsx('w-3 h-3 mr-1', {
              'text-red-900': isDead,
              'text-red-500': !isDead,
            })} />
            <span className="text-xs font-mono">{formatNumber(player.health)}</span>
          </div>
          <div className="flex items-center">
            <Droplet className={clsx('w-3 h-3 mr-1', {
              'text-blue-900': isDead,
              'text-blue-500': !isDead,
            })} />
            <span className="text-xs font-mono">{formatNumber(player.mana)}</span>
          </div>
        </div>

        {player.effects && player.effects.length > 0 && (
          <div className="flex space-x-1">
            {player.effects.map((effect, index) => (
              <div 
                key={index}
                className="flex items-center bg-gray-800/40 px-1.5 py-0.5 rounded text-xs"
                title={`${effect.type} (${effect.duration} turns)`}
              >
                {effect.type === 'shield' && <Shield className="w-3 h-3 text-blue-400" />}
                {effect.type === 'burn' && <Flame className="w-3 h-3 text-orange-400" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {isCurrentTurn && !isDead && (
        <div className="mt-1.5">
          <span className="text-[10px] bg-purple-500/20 px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-medium">
            Current Turn
          </span>
        </div>
      )}

      {isTargetable && (
        <div className="mt-1.5 text-[10px] text-purple-300 animate-pulse uppercase tracking-wider">
          Click to target
        </div>
      )}
    </div>
  );
}