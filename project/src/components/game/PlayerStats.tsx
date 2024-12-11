import { Player } from '../../types/game';
import { Heart, Droplet, Crown, Skull } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

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
        'rounded-lg transition-all duration-200 relative overflow-hidden p-4',
        {
          'bg-gradient-to-br from-purple-900 to-gray-900 ring-2 ring-purple-500': isCurrentPlayer,
          'bg-gray-800/40 ring-1 ring-gray-600 opacity-80': !isCurrentPlayer && !isCurrentTurn,
          'bg-purple-700/20 ring-2 ring-purple-400 animate-pulse': isCurrentTurn && !isDead,
          'cursor-pointer hover:scale-105': isTargetable,
        }
      )}
    >
      {isCurrentTurn && !isDead && (
        <motion.div
          className="absolute inset-0 bg-purple-500/10 animate-[pulse_2s_ease-in-out_infinite]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.0 }}
        />
      )}

      <div className="flex items-center justify-between mb-2">
        {/* Player Name */}
        <div className="flex items-center space-x-2">
          <h3
            className={clsx(
              'text-base font-bold',
              isCurrentPlayer ? 'text-white' : 'text-purple-300'
            )}
          >
            {player.name}
          </h3>
          {player.isLeader && <Crown className="w-4 h-4 text-yellow-400" />}
          {isDead && <Skull className="w-4 h-4 text-red-500" />}
        </div>
      </div>

      {/* Player Stats */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          {/* Health */}
          <div className="flex items-center space-x-1">
            <Heart className={clsx('w-4 h-4', { 'text-red-900': isDead, 'text-red-400': !isDead })} />
            <span className="text-sm">{formatNumber(player.health)}</span>
          </div>

          {/* Mana */}
          <div className="flex items-center space-x-1">
            <Droplet className={clsx('w-4 h-4', { 'text-blue-900': isDead, 'text-blue-400': !isDead })} />
            <span className="text-sm">{formatNumber(player.mana)}</span>
          </div>
        </div>

        {/* Effects */}
        {player.effects && player.effects.length > 0 && (
          <div className="flex space-x-1">
            {player.effects.map((effect, index) => (
              <div
                key={index}
                className={clsx(
                  'flex items-center px-2 py-0.5 rounded text-xs',
                  effect.stackId === 'untargetable'
                    ? 'bg-blue-700 text-blue-300'
                    : 'bg-gray-800/60'
                )}
                title={`${effect.type} (${effect.duration} turns left)`}
              >
                {effect.stackId === 'untargetable' ? '🛡️ Untargetable' : effect.type}
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Current Turn Indicator */}
      {isCurrentTurn && !isDead && (
        <div className="mt-2 text-sm font-medium text-center text-purple-300">
          <span className="bg-purple-600/20 px-2 py-1 rounded">Current Turn</span>
        </div>
      )}

      {/* Targetable Indicator */}
      {isTargetable && (
        <div className="mt-2 text-center text-xs text-purple-400 animate-pulse uppercase">
          Click to Target
        </div>
      )}
    </div>
  );
}
