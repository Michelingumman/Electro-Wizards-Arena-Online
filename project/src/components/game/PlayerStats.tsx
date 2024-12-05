import { Player } from '../../types/game';
import { Heart, Droplet, Crown, Skull, LayoutGrid, Shield, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
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
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={isTargetable ? { scale: 1.02 } : undefined}
      onClick={isTargetable && onSelect ? onSelect : undefined}
      className={clsx(
        'relative p-3 rounded-lg transition-all duration-200',
        'backdrop-blur-sm shadow-lg',
        {
          'bg-red-900/20 border border-red-900/30': isDead,
          'bg-purple-900/20 border border-purple-500/30': isCurrentTurn && !isDead,
          'bg-gray-800/20 border border-gray-700/30': !isCurrentTurn && !isDead,
          'cursor-pointer hover:border-purple-400/50': isTargetable,
          'transform hover:scale-102': isTargetable
        }
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-medium">{player.name}</h3>
          {player.isLeader && (
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Crown className="w-3 h-3 text-yellow-400" />
            </motion.div>
          )}
          {isDead && <Skull className="w-3 h-3 text-red-400" />}
        </div>

        {!isCurrentPlayer && (
          <div className="flex items-center space-x-2">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center space-x-1 bg-gray-800/40 px-1.5 py-0.5 rounded text-xs"
            >
              <LayoutGrid className="w-3 h-3 text-gray-400" />
              <span className="text-gray-400">{player.cards.length}</span>
            </motion.div>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between mt-2">
        <div className="flex space-x-3">
          <motion.div 
            className="flex items-center"
            animate={isCurrentTurn ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Heart className={clsx('w-3 h-3 mr-1', {
              'text-red-900': isDead,
              'text-red-500': !isDead,
            })} />
            <span className="text-xs font-mono">{formatNumber(player.health)}</span>
          </motion.div>
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
              <motion.div 
                key={index}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center bg-gray-800/40 px-1.5 py-0.5 rounded text-xs"
                title={`${effect.type} (${effect.duration} turns)`}
              >
                {effect.type === 'shield' && <Shield className="w-3 h-3 text-blue-400" />}
                {effect.type === 'burn' && <Flame className="w-3 h-3 text-orange-400" />}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {isCurrentTurn && !isDead && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2"
        >
          <span className="text-[10px] bg-purple-500/20 px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-medium">
            Current Turn
          </span>
        </motion.div>
      )}

      {isTargetable && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 text-[10px] text-purple-300 animate-pulse uppercase tracking-wider"
        >
          Click to target
        </motion.div>
      )}
    </motion.div>
  );
}