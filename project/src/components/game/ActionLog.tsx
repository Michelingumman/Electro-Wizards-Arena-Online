import { Party, Card } from '../../types/game';
import { Sword, Heart, Star, Shield, Crown, Droplet } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface ActionLogProps {
  lastAction: Party['lastAction'];
  players: Party['players'];
  usedCard: Card | null;
}

export function ActionLog({ lastAction, players }: ActionLogProps) {
  if (!lastAction) return null;

  const attacker = players.find((p) => p.id === lastAction.playerId);
  const defender = lastAction.targetId
    ? players.find((p) => p.id === lastAction.targetId)
    : null;

  if (!attacker) return null;

  const isSelfTarget = lastAction.playerId === lastAction.targetId;

  const getCardIcon = (type: string) => {
    switch (type) {
      case 'damage':
        return Sword;
      case 'heal':
        return Heart;
      case 'manaDrain':
      case 'manaRefill':
      case 'potionBuff':
      case 'manaBurn':
      case 'forceDrink':
        return Droplet;
      case 'buff':
      case 'challenge':
        return Star;
      case 'defend':
        return Shield;
      case 'legendary':
        return Crown;
      default:
        return Star;
    }
  };

  const CardIcon = getCardIcon(lastAction.cardType);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900/40 backdrop-blur-lg rounded-lg border border-gray-700 p-6 flex flex-col space-y-4"
    >
      {/* Header */}
      <div className="flex justify-between items-center text-sm font-medium">
        <span className="text-purple-300">Action Log</span>
      </div>

      {/* Content */}
      <div className="flex items-center space-x-4">
        {/* Attacker */}
        <div className="flex flex-col items-center space-y-1">
          <span className="font-bold text-purple-300">{attacker.name}</span>
          <div className="w-10 h-1 bg-purple-500 rounded-full"></div>
        </div>

        {/* Card Box */}
        <div
          className={clsx(
            'flex flex-col items-center justify-center p-3 rounded-lg border shadow',
            lastAction.cardRarity === 'legendary'
              ? 'bg-gradient-to-br from-yellow-500 to-yellow-700 border-yellow-400 shadow-yellow-500/50'
              : lastAction.cardRarity === 'epic'
              ? 'bg-gradient-to-br from-purple-500 to-purple-700 border-purple-400'
              : lastAction.cardRarity === 'rare'
              ? 'bg-gradient-to-br from-blue-500 to-blue-700 border-blue-400'
              : 'bg-gradient-to-br from-gray-500 to-gray-700 border-gray-400'
          )}
        >
          {/* Card Icon */}
          <CardIcon className="w-8 h-8 text-white mb-2" />
          {/* Card Name */}
          <span className="text-sm font-semibold text-white">{lastAction.cardName}</span>
          {/* Card Description */}
          <span className="text-xs text-gray-200 italic text-center">{lastAction.cardDescription}</span>
        </div>

        {/* Defender */}
        {!isSelfTarget && (
          <div className="flex flex-col items-center space-y-1">
            <span className="font-bold text-purple-300">{defender?.name || 'Unknown'}</span>
            <div className="w-10 h-1 bg-purple-500 rounded-full"></div>
          </div>
        )}
      </div>
    </motion.div>
  );
}