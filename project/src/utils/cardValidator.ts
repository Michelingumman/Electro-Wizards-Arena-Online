import { Card } from '../types/cards';

export class CardValidator {
  validateCard(card: Partial<Card>): string[] {
    const errors: string[] = [];

    if (!card.name?.trim()) {
      errors.push('Card name is required');
    }

    if (!card.description?.trim()) {
      errors.push('Card description is required');
    }

    if (typeof card.manaCost !== 'number' || card.manaCost < 0) {
      errors.push('Mana cost must be a non-negative number');
    }

    if (!card.type || !['attack', 'defense', 'utility'].includes(card.type)) {
      errors.push('Invalid card type');
    }

    if (!card.rarity || !['common', 'rare', 'epic', 'legendary'].includes(card.rarity)) {
      errors.push('Invalid card rarity');
    }

    if (!Array.isArray(card.effects) || card.effects.length === 0) {
      errors.push('Card must have at least one effect');
    }

    return errors;
  }
}