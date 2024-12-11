import { Card as CardType } from '../../types/game';
import { Sword, Heart, Droplet, Zap, Crown, Star } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

interface CardListProps {
  cards: CardType[];
  onPlayCard: (card: CardType) => void;
  disabled: boolean;
  currentMana: number;
  selectedCard: CardType | null;
}

export function CardList({ 
  cards, 
  onPlayCard,
  disabled, 
  currentMana,
  selectedCard,
}: CardListProps) {
  // Helper to determine card icons based on effects
  const getCardIcons = (card: CardType) => {
    const icons = [];

    if (card.effect.type === 'damage') {
      icons.push(<Sword key="damage" className="w-4 h-4 text-red-400" />);
    }

    if (card.effect.type === 'heal') {
      icons.push(<Heart key="heal" className="w-4 h-4 text-green-400" />);
      // Add droplet only for heal cards with mana-related effects
      if (
        card.effect.type === 'heal' &&
        ['manaDrain', 'manaBurn', 'manaRefill'].some(manaEffect =>
          card.description.includes(manaEffect)
        )
      ) {
        icons.push(<Droplet key="mana" className="w-4 h-4 text-blue-400" />);
      }
    }

    if (card.isChallenge) {
      icons.push(<Star key="challenge" className="w-4 h-4 text-purple-400" />);
    }

    if (card.isLegendary) {
      icons.push(<Crown key="legendary" className="w-4 h-4 text-yellow-400" />);
    }

    return icons;
  };

  // Helper to format numbers
  const formatNumber = (num: number) => Number(num.toFixed(1));

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
                'cursor-pointer transform hover:scale-105': canPlay,
                'cursor-not-allowed opacity-50': !canPlay,
                'border-purple-400 shadow-lg shadow-purple-500/20': isSelected,
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
                  {card.isChallenge && (
                    <span className="text-xs bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded">
                      Challenge
                    </span>
                  )}
                </div>
                <span className="flex items-center text-blue-400 bg-blue-950/50 px-2 py-1 rounded text-sm">
                  {formatNumber(card.manaCost)} <Droplet className="w-3 h-3 ml-1" />
                </span>
              </div>

  <p className="text-xs text-gray-300 mb-2">{card.description}</p>

              <div className="flex items-center space-x-2 text-xs">
                {getCardIcons(card).map((icon) => (
                  <span key={Math.random()}>{icon}</span> // Render all icons
                ))}
                <span className={clsx({
                  'text-yellow-400': card.isLegendary,
                  'text-red-400': card.type === 'damage',
                  'text-green-400': card.type === 'heal',
                  'text-orange-400': card.isChallenge
                })}>
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
