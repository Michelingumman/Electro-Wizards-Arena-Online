import { Button } from '../ui/Button';
import { LogOut } from 'lucide-react';
import { GameSettings } from './GameSettings';
import { Party } from '../../types/game';

interface GameHeaderProps {
  party: Party;
  isLeader: boolean;
  canStart: boolean;
  onStartGame: () => void;
  onLeaveParty: () => void;
  onUpdateSettings: (settings: any) => void;
}

export function GameHeader({
  party,
  isLeader,
  canStart,
  onStartGame,
  onLeaveParty,
  onUpdateSettings
}: GameHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <h2 className="text-2xl font-bold text-purple-100">Not Enough Mana</h2>
        <div className="text-sm text-purple-200">
          Party Code: <span className="font-mono bg-purple-900/50 px-2 py-1 rounded">{party.code}</span>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        {canStart && (
          <Button onClick={onStartGame}>
            Start Game
          </Button>
        )}
        <GameSettings
          onSave={onUpdateSettings}
          isLeader={isLeader}
        />
        <Button
          variant="secondary"
          onClick={onLeaveParty}
          className="flex items-center space-x-2 hover:bg-red-900/20"
        >
          <LogOut className="w-4 h-4" />
          <span>Leave Game</span>
        </Button>
      </div>
    </div>
  );
}