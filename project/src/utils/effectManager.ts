import { 
  ActiveEffects, 
  PotionEffect, 
  EnhancementEffect, 
  LegendaryEffect,
  EffectDuration,
  ManaShieldEffect,
  IntakeEffect
} from '../types/effects';
import { generateCardId } from '../config/cards';

export class EffectManager {
  static getActiveEffects() {
    throw new Error('Method not implemented.');
  }
  private effects: ActiveEffects = {
    potions: [],
    enhancements: [],
    legendary: [],
    manaShields: [],
    intakeEffects: []
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

  addManaShield(effect: Omit<ManaShieldEffect, 'id'>): void {
    const newEffect = {
      ...effect,
      id: generateCardId()
    };
    this.effects.manaShields.push(newEffect);
  }

  addIntakeEffect(effect: Omit<IntakeEffect, 'id'>): void {
    const newEffect = {
      ...effect,
      id: generateCardId()
    };
    this.effects.intakeEffects.push(newEffect);
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
    this.updateDurations(this.effects.manaShields);
    this.updateDurations(this.effects.intakeEffects);
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
  
  calculateManaIntakeMultiplier(): number {
    let multiplier = 1;
    
    // Apply mana shield effects (reduces intake)
    for (const shield of this.effects.manaShields) {
      multiplier *= (1 - shield.reduction);
    }
    
    // Apply intake multiplier effects (increases or decreases intake)
    for (const effect of this.effects.intakeEffects) {
      if (effect.type === 'multiply') {
        multiplier *= effect.value;
      }
    }
    
    return multiplier;
  }
  
  calculateManaIntakeAdditive(): number {
    let additive = 0;
    
    // Apply additive intake effects
    for (const effect of this.effects.intakeEffects) {
      if (effect.type === 'add') {
        additive += effect.value;
      }
    }
    
    return additive;
  }

  getActiveEffects(): ActiveEffects {
    return {
      potions: [...this.effects.potions],
      enhancements: [...this.effects.enhancements],
      legendary: [...this.effects.legendary],
      manaShields: [...this.effects.manaShields],
      intakeEffects: [...this.effects.intakeEffects]
    };
  }

  checkLegendaryTriggers(
    mana: number,
    cardCount: number
  ): LegendaryEffect[] {
    return this.effects.legendary.filter(effect => {
      if (!effect.triggerCondition || effect.currentCooldown > 0) return false;

      const { type, value, comparison } = effect.triggerCondition;
      const actualValue = type === 'mana' ? mana :
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
    this.effects.manaShields = this.effects.manaShields.filter(e => e.duration.turnsLeft > 0);
    this.effects.intakeEffects = this.effects.intakeEffects.filter(e => e.duration.turnsLeft > 0);
  }
}