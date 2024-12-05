import { Player } from '../../types/game';
import { PlayerStats } from './PlayerStats';

interface CurrentPlayerSectionProps {
  player: Player;
  isCurrentTurn: boolean;
  isTargetable: boolean;
  onSelect?: () => void;
}

export function CurrentPlayerSection({
  player,
  isCurrentTurn,
  isTargetable,
  onSelect
}: CurrentPlayerSectionProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-purple-200 uppercase tracking-wider">You</h3>
      <PlayerStats
        player={player}
        isCurrentPlayer={true}
        isCurrentTurn={isCurrentTurn}
        isTargetable={isTargetable}
        onSelect={onSelect}
      />
    </div>
  );
}