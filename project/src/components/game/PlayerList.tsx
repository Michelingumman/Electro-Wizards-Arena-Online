import { Player } from '../../types/game';
import { PlayerStats } from './PlayerStats';
import { motion } from 'framer-motion';

interface PlayerListProps {
  players: Player[];
  currentPlayerId: string;
  currentTurn: string;
  onSelectTarget?: (playerId: string) => void;
  isTargetable?: (playerId: string) => boolean;
}

export function PlayerList({
  players,
  currentPlayerId,
  currentTurn,
  onSelectTarget,
  isTargetable
}: PlayerListProps) {
  const opponents = players.filter(p => p.id !== currentPlayerId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-gray-800/10 rounded-lg p-4"
    >
      <h3 className="text-sm font-medium text-purple-200 uppercase tracking-wider mb-3">
        Opponents ({opponents.length})
      </h3>
      <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
        {opponents.map((player) => (
          <PlayerStats
            key={player.id}
            player={player}
            isCurrentPlayer={false}
            isCurrentTurn={player.id === currentTurn}
            isTargetable={isTargetable?.(player.id) ?? false}
            onSelect={onSelectTarget ? () => onSelectTarget(player.id) : undefined}
          />
        ))}
      </div>
    </motion.div>
  );
}