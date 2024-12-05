import { Card as CardType } from '../../types/game';
import { Sword, Heart, Droplet, Zap } from 'lucide-react';
import { clsx } from 'clsx';

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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {cards.map((card) => {
        const isSelected = selectedCard?.id === card.id;
        const canPlay = !disabled && card.manaCost <= currentMana;

        return (
          <div
            key={card.id}
            onClick={() => canPlay && onPlayCard(card)}
            onDoubleClick={() => canPlay && !card.requiresTarget && onDoubleClickCard(card)}
            className={clsx(
              'relative overflow-hidden transition-all duration-200',
              'rounded-lg border p-3',
              {
                'cursor-pointer transform hover:scale-102': canPlay,
                'cursor-not-allowed opacity-50': !canPlay,
                'transform scale-102 border-purple-400 shadow-lg shadow-purple-500/20': isSelected,
                'border-gray-700 hover:border-gray-600': !isSelected && canPlay,
                'bg-gradient-to-br': true,
                [card.color]: true
              }
            )}
          >
            {isSelected && (
              <div className="absolute inset-0 bg-purple-500/10 animate-pulse" />
            )}

            <div className="relative">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-base">{card.name}</h4>
                <span className="flex items-center text-blue-400 bg-blue-950/50 px-2 py-1 rounded text-sm">
                  {card.manaCost} <Droplet className="w-3 h-3 ml-1" />
                </span>
              </div>

              <p className="text-xs text-gray-300 mb-2">{card.description}</p>

              <div className="flex items-center space-x-2 text-xs">
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
                <div className="mt-2 text-xs text-purple-200 animate-pulse">
                  Click a player to target
                </div>
              )}

              {!card.requiresTarget && (
                <div className="mt-2 text-xs text-gray-400">
                  Double-click to use on yourself
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}