import { Card } from '../types/game';

const LEGACY_CHALLENGE_CARD_IDS = new Set([
  'ol-havf',
  'got-big-muscles',
  'shot-contest',
  'shot-master',
]);

const isNamingChallengeById = (cardId: string): boolean =>
  cardId.startsWith('name-the-most-');

export const isChallengeCard = (card: Card): boolean => {
  if (!card) return false;

  return Boolean(
    card.isChallenge ||
    card.type === 'challenge' ||
    card.effect.type === 'challenge' ||
    card.effect.challenge ||
    card.effect.winnerEffect ||
    card.effect.loserEffect ||
    card.effect.challengeEffects ||
    LEGACY_CHALLENGE_CARD_IDS.has(card.id) ||
    isNamingChallengeById(card.id)
  );
};

export const isNamingChallengeCard = (card: Card): boolean =>
  isNamingChallengeById(card.id);

