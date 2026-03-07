import { Card } from '../types/game';

type ReactionCardLike = Pick<Card, 'name' | 'description'>;
type CanCupChallengeLike = Pick<Card, 'id' | 'name' | 'description' | 'effect' | 'requiresTarget'>;

const REACTION_NAME_PATTERN = /hur\s*full\s*e\s*du/i;
const REACTION_DESC_PATTERN = /(snabbast hand|reaction|fastest)/i;
const CIRCLE_NAME_PATTERN = /(kategori|flamingon)/i;
const CIRCLE_DESC_PATTERN = /(go around the circle|nämn saker inom|category|foersta som tappar balansen|första som tappar balansen)/i;
const BOTTOM_RACE_NAME_PATTERN = /botten\s*race/i;
const BOTTOM_RACE_DESC_PATTERN = /(racear till botten|race to the bottom|slumpad motståndare)/i;

export function isCanCupReactionChallengeCard(card?: ReactionCardLike | null): boolean {
  if (!card) return false;
  if (REACTION_NAME_PATTERN.test(card.name || '')) return true;
  if (REACTION_DESC_PATTERN.test(card.description || '')) return true;
  return false;
}

export function isCanCupCircleChallengeCard(card?: CanCupChallengeLike | null): boolean {
  if (!card) return false;
  if (card.id === 'cc-category-random' || card.id === 'cc-flamingo') return true;
  if (card.name === 'Flamingon') return true;
  if (card.effect?.type !== 'challenge') return false;
  if (CIRCLE_NAME_PATTERN.test(card.name || '')) return true;
  if (CIRCLE_DESC_PATTERN.test(card.description || '')) return true;
  return false;
}

export function isCanCupBottomRaceChallengeCard(card?: CanCupChallengeLike | null): boolean {
  if (!card) return false;
  if (card.id === 'cc-bottom-race-random') return true;
  if (card.effect?.type !== 'challenge') return false;
  if (BOTTOM_RACE_NAME_PATTERN.test(card.name || '')) return true;
  if (BOTTOM_RACE_DESC_PATTERN.test(card.description || '')) return true;

  const winnerEffect = card.effect?.winnerEffect ?? card.effect?.challenge?.winnerEffect;
  return Boolean(
    card.requiresTarget === false &&
    winnerEffect?.type === 'canCupDeflect' &&
    (winnerEffect?.value ?? 0) >= 8
  );
}

export function isCanCupNoSetupChallengeCard(card?: CanCupChallengeLike | null): boolean {
  return isCanCupCircleChallengeCard(card) || isCanCupBottomRaceChallengeCard(card);
}
