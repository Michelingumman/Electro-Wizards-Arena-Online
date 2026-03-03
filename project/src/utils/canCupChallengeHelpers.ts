import { Card } from '../types/game';

type ReactionCardLike = Pick<Card, 'name' | 'description'>;

const REACTION_NAME_PATTERN = /hur\s*full\s*e\s*du/i;
const REACTION_DESC_PATTERN = /(snabbast hand|reaction|fastest)/i;

export function isCanCupReactionChallengeCard(card?: ReactionCardLike | null): boolean {
  if (!card) return false;
  if (REACTION_NAME_PATTERN.test(card.name || '')) return true;
  if (REACTION_DESC_PATTERN.test(card.description || '')) return true;
  return false;
}
