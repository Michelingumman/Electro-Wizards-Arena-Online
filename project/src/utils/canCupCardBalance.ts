import { CardBase, CardRarity } from '../types/cards';
import type { Party } from '../types/game';

const CHEERS_CARD_NAME = 'Sk\u00e5l!';
const REMOVED_CARD_NAME = 'N\u00e4stan Klar';
const ROCK_PAPER_SCISSORS_CARD_NAME = 'Sten, Sax, P\u00e5se';
const SWEEP_CARD_NAME = 'Svep!';
const CAN_CUP_BALANCE_VERSION = 1;

function getBaseCardName(name: string): string {
  return name.split(':')[0]?.trim() ?? name;
}

function isRemovedBottomsUpPrepCard(card: Pick<CardBase, 'name' | 'effect'>): boolean {
  return getBaseCardName(card.name) === REMOVED_CARD_NAME || card.effect.type === 'canCupBottomsUpPrep';
}

function setCanCupPlayCost(card: CardBase, playCost: number): CardBase {
  return {
    ...card,
    manaCost: playCost,
    sipCost: playCost,
    canCupBalanceVersion: CAN_CUP_BALANCE_VERSION,
  };
}

function buildSweepReplacement(card: CardBase): CardBase {
  return {
    ...card,
    name: SWEEP_CARD_NAME,
    description: 'Motst\u00e5ndaren m\u00e5ste supa klart sin burk!',
    manaCost: 4,
    sipCost: 4,
    rarity: CardRarity.EPIC,
    type: 'targeted',
    effect: { type: 'canCupBottenUpp', value: 0 },
    requiresTarget: true,
    isChallenge: false,
    isLegendary: false,
    color: 'rose',
    flavorText: undefined,
    canCupBalanceVersion: CAN_CUP_BALANCE_VERSION,
  };
}

export function getCanCupCardPlayCost(card: Pick<CardBase, 'manaCost' | 'sipCost'>): number {
  return Math.max(0, Math.round(card.sipCost ?? card.manaCost ?? 0));
}

export function isCanCupRockPaperScissorsCard(card: Pick<CardBase, 'name'>): boolean {
  return getBaseCardName(card.name) === ROCK_PAPER_SCISSORS_CARD_NAME;
}

export function shouldRemoveCanCupCardFromPool(card: Pick<CardBase, 'name' | 'effect'>): boolean {
  return isRemovedBottomsUpPrepCard(card);
}

export function normalizeCanCupCard(card: CardBase): CardBase {
  if (card.canCupBalanceVersion === CAN_CUP_BALANCE_VERSION) {
    return card;
  }

  if (isRemovedBottomsUpPrepCard(card)) {
    return buildSweepReplacement(card);
  }

  const shiftedCost = Math.max(0, getCanCupCardPlayCost(card) - 1);
  let normalizedCard = setCanCupPlayCost(card, shiftedCost);
  const baseName = getBaseCardName(normalizedCard.name);

  if (baseName === CHEERS_CARD_NAME) {
    normalizedCard = setCanCupPlayCost(normalizedCard, 0);
  }

  if (baseName === ROCK_PAPER_SCISSORS_CARD_NAME) {
    normalizedCard = {
      ...setCanCupPlayCost(normalizedCard, 1),
      description: 'V\u00e4lj en motst\u00e5ndare f\u00f6r en klassisk Sten-Sax-P\u00e5se duell (B\u00e4st av 3). Om motst\u00e5ndaren f\u00f6rlorar m\u00e5ste de dricka 4 klunkar. F\u00f6rlorar du h\u00e4nder inget.',
    };
  }

  return normalizedCard;
}

export function normalizeCanCupPartyState(party: Party): Party {
  if (party.gameMode !== 'can-cup') {
    return party;
  }

  return {
    ...party,
    players: party.players.map((player) => ({
      ...player,
      cards: player.cards.map((card) => normalizeCanCupCard(card)),
    })),
    pendingChallenge: party.pendingChallenge
      ? {
        ...party.pendingChallenge,
        card: normalizeCanCupCard(party.pendingChallenge.card),
      }
      : party.pendingChallenge,
  };
}
