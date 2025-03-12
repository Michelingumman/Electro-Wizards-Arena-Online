import { Player, Card } from '../../types/game';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { PlayerStats } from './PlayerStats';

interface TargetSelectionModalProps {
  card: Card;
  players: Player[];
  currentPlayerId: string;
  selectedTargetId: string | null;
  onSelectTarget: (targetId: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function TargetSelectionModal({
  card,
  players,
  currentPlayerId,
  selectedTargetId,
  onSelectTarget,
  onConfirm,
  onCancel
}: TargetSelectionModalProps) {
  const canConfirm = selectedTargetId !== null;
  const targetablePlayers = players.filter(p => (card.effect.type === 'manaRefill' ? true : p.id !== currentPlayerId));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-gray-800 rounded-lg shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-purple-100">Select Target</h3>
            <p className="text-sm text-gray-400">Using {card.name}</p>
          </div>
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {targetablePlayers.map(player => (
            <div
              key={player.id}
              onClick={() => onSelectTarget(player.id)}
              className="transition-all duration-200"
            >
              <div className={`
                relative rounded-lg overflow-hidden
                ${selectedTargetId === player.id ? 'ring-2 ring-purple-500 transform scale-[1.02]' : ''}
              `}>
                {selectedTargetId === player.id && (
                  <div className="absolute inset-0 bg-purple-500/10 animate-pulse pointer-events-none" />
                )}
                <PlayerStats
                  player={player}
                  isCurrentPlayer={player.id === currentPlayerId}
                  isCurrentTurn={false}
                  isTargetable={true}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-gray-700">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!canConfirm}
            className={`
              ${canConfirm ? 'animate-pulse bg-purple-600 hover:bg-purple-700' : ''}
            `}
          >
            Confirm Target
          </Button>
        </div>
      </div>
    </div>
  );
}