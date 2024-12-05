import { Button } from '../ui/Button';
import { Beaker } from 'lucide-react';
import { motion } from 'framer-motion';

interface GameControlsProps {
  gameStatus: string;
  manaDrinkAmount: number;
  onDrink: () => void;
}

export function GameControls({
  gameStatus,
  manaDrinkAmount,
  onDrink
}: GameControlsProps) {
  if (gameStatus !== 'playing') return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 z-50"
    >
      <Button
        onClick={onDrink}
        className="group relative overflow-hidden bg-gradient-to-br from-blue-600 via-cyan-600 to-blue-600 hover:from-blue-500 hover:via-cyan-500 hover:to-blue-500 text-white shadow-lg transition-all duration-200 hover:shadow-cyan-500/25 rounded-xl px-4 py-2"
      >
        <span className="relative z-10 flex items-center justify-center text-sm font-medium">
          <Beaker className="w-4 h-4 mr-2 group-hover:animate-bounce" />
          Drink Potion (+{manaDrinkAmount.toFixed(1)})
        </span>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-cyan-400 to-blue-400 opacity-0 group-hover:opacity-20 transition-opacity" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(56,189,248,0.2),transparent_70%)]" />
      </Button>
    </motion.div>
  );
}