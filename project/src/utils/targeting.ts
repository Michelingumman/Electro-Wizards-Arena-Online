import { Card, Player } from '../types/game';

export interface TargetingRules {
  canTargetSelf: boolean;
  canTargetEnemies: boolean;
  canTargetAllies: boolean;
  requiresTarget: boolean;
}

export function getCardTargetingRules(card: Card): TargetingRules {
  switch (card.effect.type) {
    case 'damage':
    case 'manaDrain':
    case 'manaBurn':
      return {
        canTargetSelf: false,
        canTargetEnemies: true,
        canTargetAllies: false,
        requiresTarget: true
      };
    case 'heal':
      return {
        canTargetSelf: true,
        canTargetEnemies: false,
        canTargetAllies: true,
        requiresTarget: true
      };
    case 'potionBuff':
    case 'manaRefill':
      return {
        canTargetSelf: true,
        canTargetEnemies: false,
        canTargetAllies: false,
        requiresTarget: false
      };
    case 'challenge':
      return {
        canTargetSelf: false,
        canTargetEnemies: true,
        canTargetAllies: false,
        requiresTarget: true
      };
    default:
      return {
        canTargetSelf: false,
        canTargetEnemies: false,
        canTargetAllies: false,
        requiresTarget: false
      };
  }
}

export function getValidTargets(
  card: Card,
  currentPlayer: Player,
  allPlayers: Player[]
): Player[] {
  const rules = getCardTargetingRules(card);
  
  if (!rules.requiresTarget) {
    return [];
  }

  return allPlayers.filter(player => {
    if (player.health <= 0) return false;

    const isSelf = player.id === currentPlayer.id;
    const isEnemy = !isSelf;

    if (isSelf && !rules.canTargetSelf) return false;
    if (isEnemy && !rules.canTargetEnemies) return false;
    if (!isEnemy && !isSelf && !rules.canTargetAllies) return false;

    // Additional card-specific validation
    if (card.effect.type === 'heal') {
      const isAtFullHealth = player.health >= (player.maxHealth ?? 10.0);
      if (isAtFullHealth) return false;
    }

    return true;
  });
}

export function isValidTarget(
  card: Card,
  currentPlayer: Player,
  targetPlayer: Player
): boolean {
  const validTargets = getValidTargets(card, currentPlayer, [targetPlayer]);
  return validTargets.length > 0;
}

export function canPlayCard(
  card: Card,
  currentPlayer: Player,
  allPlayers: Player[]
): boolean {
  if (currentPlayer.health <= 0) return false;
  if (currentPlayer.mana < card.manaCost) return false;

  const rules = getCardTargetingRules(card);
  if (!rules.requiresTarget) return true;

  const validTargets = getValidTargets(card, currentPlayer, allPlayers);
  return validTargets.length > 0;
}