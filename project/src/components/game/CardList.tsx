import { Card as CardType } from '../../types/game';
import { Sword, Heart, Droplet, Zap, Crown } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface CardListProps {
  cards: CardType[];
  onPlayCard: (card: CardType) => void;
  onDoubleClickCard: (card: CardType) => void;
  disabled: boolean;
  currentMana: number;
  selectedCard: CardType | null;
}

export function CardList({ 
  cards, 
  onPlayCard,
  onDoubleClickCard,
  disabled, 
  currentMana,
  selectedCard
}: CardListProps) {
  const getCardIcon = (card: CardType) => {
    if (card.isLegendary) return <Crown className="w-4 h-4 text-yellow-400" />;
    
    switch (card.type) {
      case 'damage':
        return <Sword className="w-4 h-4 text-red-400" />;
      case 'heal':
        return <Heart className="w-4 h-4 text-green-400" />;
      case 'utility':
      case 'curse':
        return <Zap className="w-4 h-4 text-purple-400" />;
      default:
        return null;
    }
  };

  const formatNumber = (num: number) => {
    return Number(num.toFixed(1));
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {cards.map((card) => {
        const isSelected = selectedCard?.id === card.id;
        const canPlay = !disabled && card.manaCost <= currentMana;

        return (
          <motion.div
            key={card.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={() => canPlay && onPlayCard(card)}
            className={clsx(
              'relative overflow-hidden transition-all duration-200',
              'rounded-lg border p-3',
              {
                'cursor-pointer transform hover:scale-102': canPlay,
                'cursor-not-allowed opacity-50': !canPlay,
                'transform scale-102 border-purple-400 shadow-lg shadow-purple-500/20': isSelected,
                'border-gray-700 hover:border-gray-600': !isSelected && canPlay,
                'bg-gradient-to-br': true,
                [card.color]: true,
                'ring-2 ring-yellow-500/50': card.isLegendary
              }
            )}
          >
            {isSelected && (
              <motion.div 
                className="absolute inset-0 bg-purple-500/10 animate-pulse"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            )}

            <div className="relative">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-base">{card.name}</h4>
                  {card.isLegendary && (
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">
                      Legendary
                    </span>
                  )}
                </div>
                <span className="flex items-center text-blue-400 bg-blue-950/50 px-2 py-1 rounded text-sm">
                  {formatNumber(card.manaCost)} <Droplet className="w-3 h-3 ml-1" />
                </span>
              </div>

              <p className="text-xs text-gray-300 mb-2">{card.description}</p>

              {card.flavorText && (
                <p className="text-xs italic text-gray-400 mb-2 border-l-2 border-gray-700 pl-2">
                  {card.flavorText}
                </p>
              )}

              <div className="flex items-center space-x-2 text-xs">
                {getCardIcon(card)}
                <span className={clsx({
                  'text-yellow-400': card.isLegendary,
                  'text-red-400': card.type === 'damage',
                  'text-green-400': card.type === 'heal',
                  'text-purple-400': card.type === 'utility' || card.type === 'curse'
                })}>
                  {card.effect.value > 0 ? formatNumber(card.effect.value) : 'Challenge'}
                </span>
              </div>

              {isSelected && card.requiresTarget && (
                <div className="mt-2 text-xs text-purple-200 animate-pulse">
                  Click a player to target
                </div>
              )}

              {!card.requiresTarget && canPlay && (
                <div className="mt-2 text-xs text-gray-400">
                  Click to use
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}