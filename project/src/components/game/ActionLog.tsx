import { Party } from '../../types/game';
import { Beaker, Sword, Heart, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface ActionLogProps {
  lastAction: Party['lastAction'];
  players: Party['players'];
}

export function ActionLog({ lastAction, players }: ActionLogProps) {
  if (!lastAction) return null;

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'damage':
        return <Sword className="w-4 h-4 text-red-400" />;
      case 'heal':
        return <Heart className="w-4 h-4 text-green-400" />;
      case 'drink':
        return <Beaker className="w-4 h-4 text-blue-400" />;
      default:
        return <Zap className="w-4 h-4 text-purple-400" />;
    }
  };

  const getActionText = () => {
    const player = players.find(p => p.id === lastAction.playerId);
    const target = players.find(p => p.id === lastAction.targetId);

    switch (lastAction.type) {
      case 'damage':
        return `${player?.name} dealt ${lastAction.value} damage to ${target?.name}`;
      case 'heal':
        return `${player?.name} healed ${target?.name} for ${lastAction.value}`;
      case 'manaDrain':
        return `${player?.name} drained ${lastAction.value} mana from ${target?.name}`;
      case 'forceDrink':
        return `${player?.name} forced ${target?.name} to drink a mana potion`;
      case 'manaBurn':
        return `${player?.name} burned ${target?.name}'s mana`;
      case 'drink':
        return `${player?.name} drank a mana potion (+${lastAction.value})`;
      default:
        return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50"
    >
      <div className="flex items-center space-x-3">
        {getActionIcon(lastAction.type)}
        <p className="text-sm text-gray-300">{getActionText()}</p>
        <span className="text-xs text-gray-500">
          {new Date(lastAction.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </motion.div>
  );
}