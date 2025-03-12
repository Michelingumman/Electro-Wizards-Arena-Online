import { Card } from '../types/game';
import { EffectType } from '../types/cards';
import { GAME_CONFIG } from '../config/gameConfig';
export interface ChallengeOutcome {
  winner: {
    type: EffectType;
    value: number;
  };
  loser: {
    type: EffectType;
    value: number;
  };
}

export function getChallengeEffects(card: Card): ChallengeOutcome {
  if (!card.effect.challenge) {
    throw new Error(`Challenge effects not defined for card: ${card.name}`);
  }

  return {
    winner: card.effect.challenge.winnerEffect,
    loser: card.effect.challenge.loserEffect
  };
}

export function validateChallengeParticipants(
  winnerId: string | null,
  loserId: string | null,
  players: { id: string; mana: number }[]
): { isValid: boolean; error?: string } {
  if (!winnerId || !loserId) {
    return { isValid: false, error: 'Both winner and loser must be selected' };
  }

  if (winnerId === loserId) {
    return { isValid: false, error: 'Winner and loser cannot be the same player' };
  }

  const winner = players.find(p => p.id === winnerId);
  const loser = players.find(p => p.id === loserId);

  if (!winner || !loser) {
    return { isValid: false, error: 'Selected players not found in game' };
  }

  return { isValid: true };
}

export function applyChallengeEffect(
  player: { mana: number; manaIntake?: number },
  effect: { type: EffectType; value: number },
  maxMana: number,
  card: Card,
  allPlayers?: { id: string; mana: number; manaIntake?: number }[],
  targetSelection?: string
): { mana: number; manaIntake: number } {
  const result = { 
    ...player,
    manaIntake: player.manaIntake || 0
  };

  console.debug(`Applying challenge effect: ${effect.type} with value: ${effect.value}`);

  switch (effect.type) {
    case 'heal':
      result.mana = Math.min(maxMana, result.mana + effect.value);
      console.debug(`Healed player to ${result.mana} mana`);
      break;
    case 'damage':
      result.mana = Math.max(0, result.mana - effect.value);
      console.debug(`Damaged player to ${result.mana} mana`);
      break;
    case 'mana':
      // Handle mana increase or decrease
      result.mana = Math.min(maxMana, Math.max(0, result.mana + effect.value));
      console.debug(`Modified player mana to ${result.mana}`);
      break;
    case 'manaRefill':
      result.mana = Math.min(maxMana, result.mana + effect.value);
      console.debug(`Refilled player to ${result.mana} mana`);
      break;
    case 'manaBurn':
      result.mana = Math.max(0, result.mana - effect.value);
      console.debug(`Burned player to ${result.mana} mana`);
      break;
    case 'manaOverload':
      result.manaIntake += effect.value;
      console.debug(`Overloaded player to ${result.manaIntake} intake`);
      break;
    case 'soberingPotion':
      result.manaIntake = Math.max(0, result.manaIntake - effect.value);
      console.debug(`Sobered player to ${result.manaIntake} intake`);
      break;
    case 'manaIntake':
      // Allow for both positive and negative intake adjustments
      result.manaIntake = Math.max(0, result.manaIntake + effect.value);
      console.debug(`Adjusted player intake to ${result.manaIntake}`);
      break;
    case 'manaIntakeMultiply':
      result.manaIntake = Math.max(0, result.manaIntake * effect.value);
      console.debug(`Multiplied player intake to ${result.manaIntake}`);
      break;
    case 'manaIntakeMultiplier':
      result.manaIntake = Math.max(0, result.manaIntake * effect.value);
      console.debug(`Multiplied player intake to ${result.manaIntake} (using multiplier)`);
      break;
    case 'manaIntakeReduction':
      result.manaIntake = Math.max(0, result.manaIntake * (1 - effect.value));
      console.debug(`Reduced player intake to ${result.manaIntake}`);
      break;
    case 'resetIntake':
    case 'resetManaIntake':
      result.manaIntake = 0;
      console.debug(`Reset player intake to 0`);
      break;
    case 'increaseIntake':
      result.manaIntake += effect.value;
      console.debug(`Increased player intake to ${result.manaIntake}`);
      break;
    case 'manaStealer':
      // This is a special case that requires handling outside this function
      // in the transaction where we have access to both players
      console.debug(`Mana stealer effect detected with value: ${effect.value}`);
      break;
    case 'manaSwapAny':
      if (allPlayers && targetSelection) {
        const target = allPlayers.find(p => p.id === targetSelection);
        if (target) {
          const tempMana = result.mana;
          result.mana = target.mana;
          target.mana = tempMana;
          console.debug(`Swapped mana with target: ${target.mana} <-> ${result.mana}`);
        }
      }
      break;
    case 'manaStealAny':
      if (allPlayers && targetSelection) {
        const target = allPlayers.find(p => p.id === targetSelection);
        if (target) {
          const stealAmount = Math.min(target.mana, effect.value);
          target.mana -= stealAmount;
          result.mana = Math.min(maxMana, result.mana + stealAmount);
          console.debug(`Stole ${stealAmount} mana from target`);
        }
      }
      break;
    case 'fellan_won':
      result.mana = maxMana;
      console.debug(`Fellan win effect - set mana to max: ${maxMana}`);
      break;
    case 'fellan_lost':
      result.mana = 0;
      result.manaIntake += effect.value;
      console.debug(`Fellan lose effect - set mana to 0 and added ${effect.value} intake`);
      break;
    default:
      console.warn(`Unsupported challenge effect type: ${effect.type}`, effect);
      // Fall back to mana increase for unknown effects to prevent game from breaking
      if (effect.value > 0) {
        result.mana = Math.min(maxMana, result.mana + effect.value);
        console.debug(`Fallback: treated as mana increase to ${result.mana}`);
      }
      break;
  }

  return result;
}