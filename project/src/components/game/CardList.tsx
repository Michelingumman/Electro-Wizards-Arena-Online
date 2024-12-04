import { Card as CardType } from '../../types/game';
import { Sword, Heart, Droplet, Zap } from 'lucide-react';
import { clsx } from 'clsx';

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
  selectedCard
}: CardListProps) {
  const getCardIcon = (card: CardType) => {
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

  return (
    <div className="grid grid-cols-2 gap-4">
      {cards.map((card) => {
        const isSelected = selectedCard?.id === card.id;
        const canPlay = !disabled && card.manaCost <= currentMana;

        return (
          <div
            key={card.id}
            onClick={() => canPlay && onPlayCard(card)}
            className={clsx(
              'relative overflow-hidden transition-all duration-200',
              'rounded-lg border',
              {
                'cursor-pointer transform hover:scale-105': canPlay,
                'cursor-not-allowed': !canPlay,
                'transform scale-105 border-purple-400 shadow-lg shadow-purple-500/20': isSelected,
                'border-gray-700 hover:border-gray-600': !isSelected && canPlay,
                'opacity-50': !canPlay,
                'bg-gradient-to-br': true,
                [card.color]: true
              }
            )}
          >
            {isSelected && (
              <div className="absolute inset-0 bg-purple-500/10 animate-pulse" />
            )}

            <div className="relative p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-lg">{card.name}</h4>
                <span className="flex items-center text-blue-400 bg-blue-950/50 px-2 py-1 rounded">
                  {card.manaCost} <Droplet className="w-4 h-4 ml-1" />
                </span>
              </div>

              <p className="text-sm text-gray-300 mb-2">{card.description}</p>

              <div className="flex items-center space-x-2 text-sm">
                {getCardIcon(card)}
                <span className={clsx({
                  'text-red-400': card.type === 'damage',
                  'text-green-400': card.type === 'heal',
                  'text-purple-400': card.type === 'utility' || card.type === 'curse'
                })}>
                  {card.effect.value > 0 ? `${card.effect.value}` : 'Special'}
                </span>
              </div>

              {isSelected && card.requiresTarget && (
                <div className="mt-2 text-sm text-purple-200 animate-pulse">
                  Click a player to target
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}