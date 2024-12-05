import { Card } from '../../types/game';
import { CardList } from './CardList';

interface CardsSectionProps {
  cards: Card[];
  onPlayCard: (card: Card) => void;
  onDoubleClickCard: (card: Card) => void;
  disabled: boolean;
  currentMana: number;
  selectedCard: Card | null;
}

export function CardsSection({
  cards,
  onPlayCard,
  onDoubleClickCard,
  disabled,
  currentMana,
  selectedCard
}: CardsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-purple-100">Your Cards</h3>
        <CardList
          cards={cards}
          onPlayCard={onPlayCard}
          onDoubleClickCard={onDoubleClickCard}
          disabled={disabled}
          currentMana={currentMana}
          selectedCard={selectedCard}
        />
      </div>
    </div>
  );
}