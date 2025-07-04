import { 
  ActiveEffects, 
  PotionEffect, 
  EnhancementEffect, 
  LegendaryEffect,
  EffectDuration 
} from '../types/effects';
import { generateCardId } from '../config/cards';

export class EffectManager {
  static getActiveEffects() {
    throw new Error('Method not implemented.');
  }
  private effects: ActiveEffects = {
    potions: [],
    enhancements: [],
    legendary: []
  };

  addPotionEffect(effect: Omit<PotionEffect, 'id'>): void {
    const newEffect = {
      ...effect,
      id: generateCardId(),
    };
  
    // Ensure only one untargetable effect exists at a time
    if (effect.stackId === 'untargetable') {
      const existingEffect = this.effects.potions.find(e => e.stackId === 'untargetable');
      if (existingEffect) {
        existingEffect.duration.turnsLeft = Math.max(
          existingEffect.duration.turnsLeft,
          effect.duration.turnsLeft
        );
        return;
      }
    }
  
    // Check for existing effects with the same stackId
    if (effect.stackId) {
      const existingEffect = this.effects.potions.find(e => e.stackId === effect.stackId);
      if (existingEffect) {
        existingEffect.value += effect.value;
        existingEffect.duration.turnsLeft = Math.max(
          existingEffect.duration.turnsLeft,
          effect.duration.turnsLeft
        );
        return;
      }
    }
  
    this.effects.potions.push(newEffect);
  }

  addEnhancement(effect: Omit<EnhancementEffect, 'id'>): void {
    const newEffect = {
      ...effect,
      id: generateCardId()
    };
    this.effects.enhancements.push(newEffect);
  }

  addLegendaryEffect(effect: Omit<LegendaryEffect, 'id'>): void {
    const newEffect = {
      ...effect,
      id: generateCardId()
    };
    this.effects.legendary.push(newEffect);
  }

  updateEffects(): void {
    this.updateDurations(this.effects.potions);
    this.updateDurations(this.effects.enhancements);
    this.updateLegendaryCooldowns();
  }

  private updateDurations<T extends { duration: EffectDuration }>(effects: T[]): void {
    for (let i = effects.length - 1; i >= 0; i--) {
      effects[i].duration.turnsLeft--;
      if (effects[i].duration.turnsLeft <= 0) {
        effects.splice(i, 1);
      }
    }
  }

  private updateLegendaryCooldowns(): void {
    this.effects.legendary = this.effects.legendary.map(effect => ({
      ...effect,
      currentCooldown: Math.max(0, effect.currentCooldown - 1)
    }));
  }

  calculateTotalEffect(
    type: 'damage' | 'healing' | 'mana' | 'potion'
  ): (value: number) => number {
    let multiplier = 1;
    let additive = 0;
  
    this.effects.enhancements
      .filter(e => e.target === type)
      .forEach(effect => {
        if (effect.type === 'multiply') {
          multiplier *= effect.value;
        } else {
          additive += effect.value;
        }
      });
  
    // Return a function that applies the total effect to the given value
    return (value: number) => (value + additive) * multiplier;
  }

  calculateDamageReduction(baseDamage: number): number {
    let finalDamage = baseDamage;
    let isImmune = false;

    // Check for defensive effects
    this.effects.potions.forEach(effect => {
      if (effect.type === 'buff') {
        // Check for damage reduction effects
        if (effect.stackId === 'noise_filter' || 
            effect.stackId === 'impedance_protection') {
          finalDamage *= (1 - effect.value); // Reduce damage by percentage
        }
        // Check for immunity effects
        else if (effect.stackId === 'isolation_immunity') {
          isImmune = true;
        }
      }
    });

    return isImmune ? 0 : Math.max(0, finalDamage);
  }

  // Add method to handle next turn effects
  addNextTurnEffect(effect: Omit<PotionEffect, 'id'> & { triggerOnTurnStart?: boolean }): void {
    const newEffect = {
      ...effect,
      id: generateCardId(),
      triggerOnTurnStart: true
    };
    
    this.effects.potions.push(newEffect);
  }

  // Process effects that trigger at turn start
  processTurnStartEffects(playerId: string): { manaGain: number } {
    let manaGain = 0;
    
    // Find and process next turn mana effects
    this.effects.potions = this.effects.potions.filter(effect => {
      if (effect.stackId === 'next_turn_mana' && effect.duration.turnsLeft === 1) {
        manaGain += effect.value;
        return false; // Remove the effect
      }
      return true;
    });

    return { manaGain };
  }
  
  // Convert effect manager effects to player effects for persistence
  toPlayerEffects(): Array<{
    stackId: string;
    type: 'buff' | 'debuff' | 'untargetable';
    value: number;
    duration: number;
  }> {
    return this.effects.potions.map(effect => ({
      stackId: effect.stackId || effect.id,
      type: effect.type,
      value: effect.value,
      duration: effect.duration.turnsLeft
    }));
  }

  // Load effects from player effects for persistence
  fromPlayerEffects(playerEffects: Array<{
    stackId: string;
    type: 'buff' | 'debuff' | 'untargetable';
    value: number;
    duration: number;
  }>): void {
    this.effects.potions = playerEffects.map(effect => ({
      id: generateCardId(),
      stackId: effect.stackId,
      type: effect.type,
      value: effect.value,
      duration: { turnsLeft: effect.duration, initialDuration: effect.duration },
      source: 'loaded'
    }));
  }

  getActiveEffects(): ActiveEffects {
    return {
      potions: [...this.effects.potions],
      enhancements: [...this.effects.enhancements],
      legendary: [...this.effects.legendary]
    };
  }

  checkLegendaryTriggers(
    health: number,
    mana: number,
    cardCount: number
  ): LegendaryEffect[] {
    return this.effects.legendary.filter(effect => {
      if (!effect.triggerCondition || effect.currentCooldown > 0) return false;

      const { type, value, comparison } = effect.triggerCondition;
      const actualValue = type === 'health' ? health :
                        type === 'mana' ? mana :
                        type === 'cards' ? cardCount : 0;

      switch (comparison) {
        case 'less': return actualValue < value;
        case 'greater': return actualValue > value;
        case 'equal': return actualValue === value;
        default: return false;
      }
    });
  }

  clearExpiredEffects(): void {
    this.effects.potions = this.effects.potions.filter(e => e.duration.turnsLeft > 0);
    this.effects.enhancements = this.effects.enhancements.filter(e => e.duration.turnsLeft > 0);
  }
}