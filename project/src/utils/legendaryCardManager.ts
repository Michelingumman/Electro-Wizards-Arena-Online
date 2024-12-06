import { Card } from '../types/game';
import { LegendaryEffect } from '../types/effects';
import { EffectManager } from './effectManager';

export class LegendaryCardManager {
  private effectManager: EffectManager;

  constructor(effectManager: EffectManager) {
    this.effectManager = effectManager;
  }

  activateLegendaryCard(card: Card, playerState: {
    health: number;
    mana: number;
    cardCount: number;
  }): boolean {
    if (!card.isLegendary) return false;

    const legendaryEffects = this.effectManager.checkLegendaryTriggers(
      playerState.health,
      playerState.mana,
      playerState.cardCount
    );

    if (legendaryEffects.length === 0) return false;

    // Apply legendary effects
    legendaryEffects.forEach(effect => {
      effect.currentCooldown = effect.cooldown;
    });

    return true;
  }

  getLegendaryStatus(card: Card): {
    isReady: boolean;
    cooldownRemaining: number;
  } {
    if (!card.isLegendary) return { isReady: false, cooldownRemaining: 0 };

    const effects = this.effectManager.getActiveEffects().legendary;
    const cardEffect = effects.find(e => e.name === card.name);

    return {
      isReady: !cardEffect || cardEffect.currentCooldown === 0,
      cooldownRemaining: cardEffect?.currentCooldown || 0
    };
  }
}