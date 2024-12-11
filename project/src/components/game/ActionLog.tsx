import { Party } from '../../types/game';
import { Sword, Heart, Star, Shield, Crown, Droplet } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface ActionLogProps {
  lastAction: Party['lastAction'];
  players: Party['players'];
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
      className="bg-gray-900/50 backdrop-blur-lg rounded-lg border border-gray-700 p-6 flex flex-col items-center space-y-4"
    >
      {/* Title */}
      <h3 className="text-sm font-bold text-purple-200 uppercase tracking-wider">Action Log:</h3>

      {/* Centered Log Details */}
      <div className="flex flex-col items-center space-y-2">
        {/* Attacker */}
        <span className="text-lg font-bold text-purple-300">{attacker.name}</span>

        {/* Card Box */}
        <div
          className={clsx(
            'flex items-center space-x-2 p-3 rounded-lg border shadow text-center',
            lastAction.cardRarity === 'legendary'
              ? 'bg-gradient-to-br from-yellow-500 to-yellow-700 border-yellow-400 shadow-yellow-500/50'
              : lastAction.cardRarity === 'epic'
              ? 'bg-gradient-to-br from-orange-500 to-orange-700 border-orange-400'
              : lastAction.cardRarity === 'rare'
              ? 'bg-gradient-to-br from-teal-500 to-teal-700 border-teal-400'
              : 'bg-gradient-to-br from-gray-500 to-gray-700 border-gray-400'
          )}
          title={lastAction.cardDescription}
        >
          {/* Card Icon */}
          <CardIcon className="w-5 h-5 text-white" />

          {/* Card Details */}
          <div className="flex flex-col items-center">
            <span className="text-sm font-semibold text-white">{lastAction.cardName} used:</span>
            <span className="text-xs text-gray-200">{lastAction.cardDescription}</span>
          </div>
        </div>

        {/* Defender */}
        {!isSelfTarget && (
          <span className="text-lg font-bold text-purple-300">on {defender?.name || 'Unknown'}</span>
        )}
      </div>
    </motion.div>
  );
}
