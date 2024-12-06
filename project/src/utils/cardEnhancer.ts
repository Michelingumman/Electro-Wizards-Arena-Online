import { Card } from '../types/game';
import { EffectManager } from './effectManager';

export class CardEnhancer {
  private effectManager: EffectManager;

  constructor(effectManager: EffectManager) {
    this.effectManager = effectManager;
  }

  enhanceCard(card: Card): Card {
    const enhancedCard = { ...card };

    if (card.effect.type === 'damage') {
      const calculateDamage = this.effectManager.calculateTotalEffect('damage');
      enhancedCard.effect.value = calculateDamage(card.effect.value);
    }

    if (card.effect.type === 'heal') {
      const calculateHealing = this.effectManager.calculateTotalEffect('healing');
      enhancedCard.effect.value = calculateHealing(card.effect.value);
    }

    if (card.manaCost > 0) {
      const calculateMana = this.effectManager.calculateTotalEffect('mana');
      enhancedCard.manaCost = calculateMana(card.manaCost);
    }

    return enhancedCard;
  }

  enhancePotion(value: number): number {
    const calculatePotion = this.effectManager.calculateTotalEffect('potion');
    return calculatePotion(value);
  }
}