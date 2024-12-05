import { Party, Card } from '../../types/game';
import { Sword, Heart, Star, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface ActionLogProps {
  lastAction: Party['lastAction'];
  players: Party['players'];
  usedCard: Card | null;
}

export function ActionLog({ lastAction, players, usedCard }: ActionLogProps) {
  if (!lastAction || !usedCard) return null;

  const attacker = players.find(p => p.id === lastAction.playerId);
  const defender = lastAction.targetId
    ? players.find(p => p.id === lastAction.targetId)
    : null;

  if (!attacker) return null;

  const isSelfTarget = lastAction.playerId === lastAction.targetId;

  // Determine icon based on action type
  const Icon = (() => {
    switch (lastAction.type) {
      case 'damage':
        return Sword;
      case 'heal':
        return Heart;
      case 'buff':
        return Star;
      case 'defend':
        return Shield;
      default:
        return Star;
    }
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/30 backdrop-blur-lg rounded-lg border border-gray-700/50 p-4 flex flex-col space-y-2"
    >
      {/* Action Information */}
      <div className="flex items-center justify-between text-sm text-gray-200">
        <span className="font-bold text-purple-300">{attacker.name}</span>
        <Icon className="w-5 h-5 text-red-400 mx-2" />
        {!isSelfTarget && (
          <span className="font-bold text-purple-300">{defender?.name || 'Unknown'}</span>
        )}
      </div>

      {/* Card Name */}
      <div
        className={clsx(
          'text-center text-sm font-medium text-gray-300 rounded-md p-1',
          usedCard.color
        )}
      >
        {usedCard.name}
      </div>
    </motion.div>
  );
}
