import { ManaPotionButton } from './ManaPotionButton';
import { motion } from 'framer-motion';

interface GameControlsProps {
  gameStatus: string;
  manaDrinkAmount: number;
  onDrink: () => void;
  disabled?: boolean;
}

export function GameControls({
  gameStatus,
  manaDrinkAmount,
  onDrink,
  disabled
}: GameControlsProps) {
  if (gameStatus !== 'playing') return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 z-50"
    >
      <ManaPotionButton
        onClick={onDrink}
        amount={manaDrinkAmount}
        disabled={disabled}
      />
    </motion.div>
  );
}