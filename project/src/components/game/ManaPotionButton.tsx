import { motion } from 'framer-motion';
import { Beaker } from 'lucide-react';

interface ManaPotionButtonProps {
  onClick: () => void;
  amount: number;
  disabled?: boolean;
}

export function ManaPotionButton({ onClick, amount, disabled }: ManaPotionButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className="group relative"
    >
      <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur-xl transform group-hover:scale-110 transition-transform" />
      
      <div className={`
        relative flex items-center space-x-2 px-4 py-2 rounded-xl
        bg-gradient-to-br from-blue-600 to-cyan-600
        hover:from-blue-500 hover:to-cyan-500
        shadow-lg hover:shadow-cyan-500/25
        transition-all duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}>
        <div className="relative">
          <Beaker className="w-5 h-5 text-blue-200 group-hover:animate-bounce" />
          <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-sm" />
        </div>
        
        <div className="flex flex-col">
          <span className="text-sm font-medium text-blue-100">Drink Potion</span>
          <span className="text-xs text-blue-200">+{amount.toFixed(1)} mana</span>
        </div>
      </div>
    </motion.button>
  );
}