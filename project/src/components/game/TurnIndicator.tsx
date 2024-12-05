import { motion, AnimatePresence } from 'framer-motion';
import { Player } from '../../types/game';
import { Crown } from 'lucide-react';

interface TurnIndicatorProps {
  currentPlayer: Player;
  activePlayer: Player;
}

export function TurnIndicator({ currentPlayer, activePlayer }: TurnIndicatorProps) {
  const isPlayerTurn = currentPlayer.id === activePlayer.id;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
      >
        <motion.div
          animate={{
            scale: isPlayerTurn ? [1, 1.05, 1] : 1,
            transition: { duration: 0.5, repeat: isPlayerTurn ? Infinity : 0 }
          }}
          className={`
            px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm
            ${isPlayerTurn ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-gray-800/20 border border-gray-700/30'}
          `}
        >
          <div className="flex items-center space-x-2">
            {isPlayerTurn && (
              <Crown className="w-4 h-4 text-yellow-400 animate-pulse" />
            )}
            <span className={`font-medium ${isPlayerTurn ? 'text-purple-200' : 'text-gray-400'}`}>
              {isPlayerTurn ? "Your Turn" : `${activePlayer.name}'s Turn`}
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}