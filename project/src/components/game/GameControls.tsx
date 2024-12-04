import { Button } from '../ui/Button';
import { Droplet } from 'lucide-react';

interface GameControlsProps {
  isCurrentTurn: boolean;
  gameStatus: string;
  manaDrinkAmount: number;
  onDrink: () => void;
  onEndTurn: () => void;
}

export function GameControls({
  isCurrentTurn,
  gameStatus,
  manaDrinkAmount,
  onDrink,
  onEndTurn
}: GameControlsProps) {
  return (
    <div className="flex items-center justify-between">
      <Button
        onClick={onDrink}
        className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg transition-all duration-200 hover:shadow-cyan-500/25"
      >
        <span className="relative z-10 flex items-center">
          <Droplet className="w-5 h-5 mr-2 group-hover:animate-bounce" />
          Drink Mana Potion (+{manaDrinkAmount})
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-20 transition-opacity" />
      </Button>

      {isCurrentTurn && gameStatus === 'playing' && (
        <Button
          onClick={onEndTurn}
          variant="secondary"
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          End Turn
        </Button>
      )}
    </div>
  );
}