export type EffectDuration = {
  turnsLeft: number;
  initialDuration: number;
};

export type PotionEffect = {
  id: string;
  type: 'buff' | 'debuff' | 'untargetable';
  value: number;
  duration: EffectDuration;
  source: string; // Card ID that applied the effect
  stackId?: string; // For tracking stacking effects
};

export type EnhancementEffect = {
  id: string;
  type: 'multiply' | 'add';
  value: number;
  target: 'damage' | 'healing' | 'mana' | 'potion';
  duration: EffectDuration;
};

export type ManaShieldEffect = {
  id: string;
  reduction: number; // Value between 0-1 representing percentage reduction
  duration: EffectDuration;
  source: string; // Card ID that applied the effect
};

export type IntakeEffect = {
  id: string;
  type: 'multiply' | 'add';
  value: number;
  duration: EffectDuration;
  source: string; // Card ID that applied the effect
};

export type LegendaryEffect = {
  id: string;
  type: 'legendary';
  name: string;
  cooldown: number;
  currentCooldown: number;
  triggerCondition?: {
    type: 'mana' | 'effects' | 'cards';
    value: number;
    comparison: 'less' | 'greater' | 'equal';
  };
};

export interface ActiveEffects {
  potions: PotionEffect[];
  enhancements: EnhancementEffect[];
  legendary: LegendaryEffect[];
  manaShields: ManaShieldEffect[];
  intakeEffects: IntakeEffect[];
}