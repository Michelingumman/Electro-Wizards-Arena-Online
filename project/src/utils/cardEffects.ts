import { Card, Player, GameSettings } from '../types/game';
import { GAME_CONFIG } from '../config/gameConfig';

export function applyHealingEffect(
  target: Player,
  healAmount: number,
  settings?: GameSettings
): Player {
  const maxHealth = settings?.maxHealth ?? GAME_CONFIG.MAX_HEALTH;
  return {
    ...target,
    health: Math.min(maxHealth, target.health + healAmount)
  };
}

export function applyBuffEffect(
  target: Player,
  buffType: string,
  value: number,
  duration: number
): Player {
  const newEffects = target.effects ? [...target.effects] : [];
  
  // Remove existing buff of the same type
  const existingBuffIndex = newEffects.findIndex(effect => effect.type === buffType);
  if (existingBuffIndex !== -1) {
    newEffects.splice(existingBuffIndex, 1);
  }
  
  // Add new buff
  newEffects.push({
    type: buffType,
    value,
    duration
  });

  return {
    ...target,
    effects: newEffects
  };
}

export function updateBuffDurations(player: Player): Player {
  if (!player.effects?.length) return player;

  const updatedEffects = player.effects
    .map(effect => ({
      ...effect,
      duration: effect.duration - 1
    }))
    .filter(effect => effect.duration > 0);

  return {
    ...player,
    effects: updatedEffects
  };
}

export function removeCard(player: Player, cardId: string): Player {
  return {
    ...player,
    cards: player.cards.filter(card => card.id !== cardId)
  };
}

export function validateCardAction(
  player: Player,
  card: Card,
  settings?: GameSettings
): boolean {
  if (player.health <= 0) return false;
  if (player.mana < card.manaCost) return false;
  
  const maxHealth = settings?.maxHealth ?? GAME_CONFIG.MAX_HEALTH;
  
  // Validate healing cards
  if (card.effect.type === 'heal' && player.health >= maxHealth) {
    return false;
  }

  return true;
}