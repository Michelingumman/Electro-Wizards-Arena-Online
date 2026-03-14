import { CardBase } from './cards';

export type GameMode = 'classic' | 'modern' | 'afterski' | 'can-cup';

// 'modern' is kept for backward compatibility with existing parties.
export const isAfterskiMode = (gameMode?: GameMode | null): boolean =>
  gameMode === 'afterski' || gameMode === 'modern';

export interface CanCupState {
  sipsLeft: number;
  waterSips: number;
  emptyCans: number;
  pendingResolution?: boolean;
}

export interface Player {
  id: string;
  name: string;
  mana: number;
  manaIntake: number;
  drunkSeconds?: number;
  canCup?: CanCupState;
  cards: Card[];
  isLeader?: boolean;
  effects?: PlayerEffect[];
  potionMultiplier?: {
    value: number;
    turnsLeft: number;
  };
  titanForm?: {
    turnsLeft: number;
    bonusDamage: number;
  };
  infiniteVoid?: {
    turnsLeft: number;
  };
  isDrunk?: boolean;
}

export interface PlayerEffect {
  stackId: string;
  type: 'buff' | 'debuff' | 'untargetable';
  value: number;
  duration: number;
}

export type Card = CardBase;

export interface PendingChallenge {
  playerId: string;
  card: Card;
  duelistOneId?: string;
  duelistTwoId?: string;
  reactionGame?: {
    mode: 'reaction';
    phase: 'waiting' | 'countdown' | 'resolved';
    readyPlayerIds: string[];
    countdownStartedAt?: number;
    redAt?: number;
    yellowAt?: number;
    greenAt?: number;
    reactionTimes?: Record<string, number>;
    winnerId?: string;
    loserId?: string;
    resolvedAt?: number;
  };
  createdAt: number;
}

export interface PendingCanCupSipResolution {
  targetPlayerId: string;
  totalSips: number;
  beerSipsToConsume: number;
  waterSipsToConsume: number;
  sourcePlayerId?: string;
  sourceCardId?: string;
  sourceCardName?: string;
  updatedAt: number;
}

export interface GameActionSegment {
  playerId: string;
  targetId?: string;
  cardId: string;
  cardName: string;
  cardType: string;
  cardRarity: string;
  cardDescription: string;
  manaCost?: number;
  attackerManaDelta?: number;
  targetManaDelta?: number;
  targetDamage?: number;
  targetManaIntakeDelta?: number;
  affectedPlayerIds?: string[];
  timestamp?: number;
  label?: string;
}

export interface PendingCanCupFollowUp {
  responderId: string;
  turnOwnerId: string;
  sourcePlayerId: string;
  originalTargetId: string;
  sipCount: number;
  sourceCardId: string;
  sourceCardName: string;
  sourceCardType: string;
  sourceCardRarity: string;
  sourceCardDescription: string;
  originalAction: GameActionSegment;
  createdAt: number;
}

export interface Party {
  id: string;
  code: string;
  players: Player[];
  currentTurn: string;
  status: 'waiting' | 'playing' | 'finished';
  leaderId: string;
  gameMode?: GameMode;
  winner?: string | null;
  settings?: GameSettings;
  lastAction?: GameAction;
  pendingChallenge?: PendingChallenge | null;
  pendingCanCupSips?: Record<string, PendingCanCupSipResolution> | null;
  pendingCanCupFollowUp?: PendingCanCupFollowUp | null;
  previousState?: {
    players: Player[];
    currentTurn: string;
    timestamp: number;
  };
  drunkTimerLastSyncedAt?: number;
  expiresAt?: number;
}

export interface GameAction extends GameActionSegment {
  segments?: GameActionSegment[];
}

export interface GameSettings {
  maxMana: number;
  manaDrinkAmount: number;
  initialMana: number;
  drunkThreshold: number;
  manaIntakeDecayRate: number;
  drunkTimeLimitSeconds?: number;
  canCupSipsPerCan?: number;
  canCupCansToWin?: number;
  godMode?: boolean;
}
