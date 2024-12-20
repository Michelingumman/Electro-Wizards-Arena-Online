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
  if (!card.effect.challengeEffects) {
    throw new Error(`Challenge effects not defined for card: ${card.name}`);
  }

  return {
    winner: card.effect.challengeEffects.winner,
    loser: card.effect.challengeEffects.loser
  };
}

export function validateChallengeParticipants(
  winnerId: string | null,
  loserId: string | null,
  players: { id: string; health: number }[]
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

  if (winner.health <= 0 || loser.health <= 0) {
    return { isValid: false, error: 'Cannot challenge dead players' };
  }

  return { isValid: true };
}

export function applyChallengeEffect(
  player: { health: number; mana: number },
  effect: { type: EffectType; value: number },
  maxHealth: number,
  maxMana: number,
  card: Card
): { health: number; mana: number } {
  const result = { ...player };

  // adding special function to  the armwrestling battle so if winner here gets +3 mana AND health
    if(card.name === "King of the Table #KingsMove!Allowed" && effect.type === 'heal'){
      result.health += effect.value;
      result.mana += effect.value;
      return result;
    }

  switch (effect.type) {
    case 'heal':
      result.health = Math.min(maxHealth, result.health + effect.value);
      break;
    case 'damage':
      result.health = Math.max(0, result.health - effect.value);
      break;
    case 'manaRefill':
      result.mana = Math.min(maxMana, result.mana + effect.value);
      break;
    case 'manaBurn':
      result.mana = Math.min(0, result.mana - effect.value);
      break;
    case 'fellan_won':
      result.health = GAME_CONFIG.MAX_HEALTH;
      break;
    case 'fellan_lost':
      result.mana = 0;
      break;
    default:
      throw new Error(`Unsupported challenge effect type: ${effect.type}`);
  }

  return result;
}