import { Party, Card } from '../../types/game';
import { Beaker, Sword, Heart, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

interface ActionLogProps {
  lastAction: Party['lastAction'];
  players: Party['players'];
  usedCard: Card | null;
}

export function ActionLog({ lastAction, players, usedCard }: ActionLogProps) {
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

  const player = players.find(p => p.id === lastAction.playerId);
  const target = players.find(p => p.id === lastAction.targetId);
  const isSelfTarget = lastAction.playerId === lastAction.targetId;
  const card = usedCard && lastAction.cardId === usedCard.id ? usedCard : null;

  const getEffectDescription = (type: string, value: number) => {
    switch (type) {
      case 'damage':
        return `dealt ${value.toFixed(1)} damage to`;
      case 'heal':
        return isSelfTarget ? `healed themself for ${value.toFixed(1)}` : `healed ${value.toFixed(1)} health to`;
      case 'manaDrain':
        return `drained ${value.toFixed(1)} mana from`;
      case 'forceDrink':
        return 'forced a mana potion on';
      case 'manaBurn':
        return 'burned all mana from';
      case 'drink':
        return `drank a mana potion (+${value.toFixed(1)})`;
      default:
        return 'used an ability on';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/20 backdrop-blur-sm rounded-lg border border-gray-700/50 overflow-hidden"
    >
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getActionIcon(lastAction.type)}
          <span className="font-medium text-purple-200">{player?.name}</span>
          <span className="text-gray-400">
            {getEffectDescription(lastAction.type, lastAction.value)}
          </span>
          {!isSelfTarget && lastAction.type !== 'drink' && (
            <span className="font-medium text-purple-200">{target?.name}</span>
          )}
        </div>
        <span className="text-xs text-gray-500">
          {new Date(lastAction.timestamp).toLocaleTimeString()}
        </span>
      </div>

      <AnimatePresence>
        {card && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={clsx(
              'p-3 border-t border-gray-700/50',
              card.color
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-sm">{card.name}</h4>
                <p className="text-xs text-gray-300 mt-1">{card.description}</p>
              </div>
              <span className="text-xs bg-blue-900/50 px-2 py-1 rounded">
                {card.manaCost.toFixed(1)} mana
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}