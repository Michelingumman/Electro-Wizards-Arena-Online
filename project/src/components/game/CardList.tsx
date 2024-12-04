import { Card as CardType } from '../../types/game';
import { Button } from '../ui/Button';

interface CardListProps {
  cards: CardType[];
  onPlayCard: (card: CardType) => void;
  disabled: boolean;
  currentMana: number;
}

export function CardList({ cards, onPlayCard, disabled, currentMana }: CardListProps) {
  return (
    <div className="grid grid-cols-2 gap-4 mt-4">
      {cards.map((card) => (
        <div
          key={card.id}
          className="bg-gray-800 rounded-lg p-4 border border-gray-700"
        >
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold">{card.name}</h4>
            <span className="text-blue-400">{card.manaCost} 💧</span>
          </div>
          <p className="text-sm text-gray-400 mb-2">
            {card.effect.type === 'damage' ? '🔥' : '💚'} {card.effect.value}
          </p>
          <Button
            variant="secondary"
            onClick={() => onPlayCard(card)}
            disabled={disabled || card.manaCost > currentMana}
            className="w-full"
          >
            Play Card
          </Button>
        </div>
      ))}
    </div>
  );
}