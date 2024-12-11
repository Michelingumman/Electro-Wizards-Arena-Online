import { Card } from '../types/game';
import { EffectManager } from './effectManager';

export class CardEnhancer {
  private effectManager: EffectManager;

  constructor(effectManager: EffectManager) {
    this.effectManager = effectManager;
  }


  
  enhanceCard(card: Card): Card {
    const enhancedCard = { ...card };

    // Enhance card based on effect type
    switch (card.effect.type) {
      case 'damage':
        case 'aoeDamage':
        case 'roulette':
        const calculateDamage = this.effectManager.calculateTotalEffect('damage');
        enhancedCard.effect.value = calculateDamage(card.effect.value);
        break;
      case 'heal':
        const calculateHealing = this.effectManager.calculateTotalEffect('healing');
        enhancedCard.effect.value = calculateHealing(card.effect.value);
        break;
      case 'manaDrain':
      case 'manaBurn':
      case 'manaRefill':
        const calculateMana = this.effectManager.calculateTotalEffect('mana');
        enhancedCard.effect.value = calculateMana(card.effect.value);
        break;
      case 'challenge':
      case 'infiniteVoid':
      case 'titan':
        // Special effects can be handled here if needed in the future
        break;
      case 'buff':
      case 'debuff':
      case 'multiply':
      case 'add':
        const calculateEnhancement = this.effectManager.calculateTotalEffect('potion');
        enhancedCard.effect.value = calculateEnhancement(card.effect.value);
        break;
    }

    // Adjust mana cost
    if (card.manaCost > 0) {
      const calculateManaCost = this.effectManager.calculateTotalEffect('mana');
      enhancedCard.manaCost = calculateManaCost(card.manaCost);
    }

    return enhancedCard;
    }

  enhancePotion(value: number): number {
    const calculatePotion = this.effectManager.calculateTotalEffect('potion');
    return calculatePotion(value);
  }
}