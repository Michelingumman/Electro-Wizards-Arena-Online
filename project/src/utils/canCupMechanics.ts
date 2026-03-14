import { GAME_CONFIG } from '../config/gameConfig';
import { CanCupState, Player } from '../types/game';

export interface SipResolution {
  appliedSips: number;
  blockedByWater: number;
  emptiedCans: number;
}

export const sanitizeSipsPerCan = (sipsPerCan?: number): number => {
  if (!Number.isFinite(sipsPerCan) || (sipsPerCan ?? 0) <= 0) {
    return GAME_CONFIG.CAN_CUP_SIPS_PER_CAN;
  }
  return Math.max(1, Math.round(sipsPerCan as number));
};

export const ensureCanCupState = (player: Player, sipsPerCan?: number): CanCupState => {
  const normalizedSipsPerCan = sanitizeSipsPerCan(sipsPerCan);
  if (!player.canCup) {
    player.canCup = {
      sipsLeft: normalizedSipsPerCan,
      waterSips: 0,
      emptyCans: 0,
      pendingResolution: false,
    };
  }

  const legacyCanCupState = player.canCup as CanCupState & { deflectCharges?: number };

  player.canCup.sipsLeft = Math.min(
    normalizedSipsPerCan,
    Math.max(0, Math.round(player.canCup.sipsLeft ?? normalizedSipsPerCan))
  );
  if (player.canCup.sipsLeft === 0) {
    player.canCup.sipsLeft = normalizedSipsPerCan;
  }
  const legacyDeflectCharges = Math.max(0, Math.round(legacyCanCupState.deflectCharges ?? 0));
  player.canCup.waterSips = Math.max(0, Math.round(player.canCup.waterSips ?? 0)) + legacyDeflectCharges;
  player.canCup.emptyCans = Math.max(0, Math.round(player.canCup.emptyCans ?? 0));
  delete legacyCanCupState.deflectCharges;

  return player.canCup;
};

export const applyForcedSips = (
  player: Player,
  sipCount: number,
  sipsPerCan?: number
): SipResolution => {
  const state = ensureCanCupState(player, sipsPerCan);
  const normalizedSipsPerCan = sanitizeSipsPerCan(sipsPerCan);
  const total = Math.max(0, Math.round(sipCount));

  const result: SipResolution = {
    appliedSips: 0,
    blockedByWater: 0,
    emptiedCans: 0,
  };

  for (let i = 0; i < total; i += 1) {
    if (state.waterSips > 0) {
      state.waterSips -= 1;
      result.blockedByWater += 1;
      continue;
    }

    state.sipsLeft = Math.max(0, state.sipsLeft - 1);
    result.appliedSips += 1;

    if (state.sipsLeft === 0) {
      state.emptyCans += 1;
      result.emptiedCans += 1;
      state.sipsLeft = normalizedSipsPerCan;
    }
  }

  return result;
};

export const applyDirectSips = (
  player: Player,
  sipCount: number,
  sipsPerCan?: number
): SipResolution => {
  const state = ensureCanCupState(player, sipsPerCan);
  const normalizedSipsPerCan = sanitizeSipsPerCan(sipsPerCan);
  const total = Math.max(0, Math.round(sipCount));

  const result: SipResolution = {
    appliedSips: 0,
    blockedByWater: 0,
    emptiedCans: 0,
  };

  for (let i = 0; i < total; i += 1) {
    state.sipsLeft = Math.max(0, state.sipsLeft - 1);
    result.appliedSips += 1;

    if (state.sipsLeft === 0) {
      state.emptyCans += 1;
      result.emptiedCans += 1;
      state.sipsLeft = normalizedSipsPerCan;
    }
  }

  return result;
};

export const getReducedTargetedSipCount = (
  _player: Player,
  sipCount: number,
  _sipsPerCan?: number
): number => {
  return Math.max(0, Math.round(sipCount));
};

export const addWaterSips = (player: Player, amount: number, sipsPerCan?: number): CanCupState => {
  const state = ensureCanCupState(player, sipsPerCan);
  state.waterSips = Math.max(0, state.waterSips + Math.max(0, Math.round(amount)));
  return state;
};

export const topUpSips = (player: Player, amount: number, sipsPerCan?: number): CanCupState => {
  const state = ensureCanCupState(player, sipsPerCan);
  const normalizedSipsPerCan = sanitizeSipsPerCan(sipsPerCan);
  state.sipsLeft = Math.min(normalizedSipsPerCan, state.sipsLeft + Math.max(0, Math.round(amount)));
  return state;
};

export const swapSipsLeft = (first: Player, second: Player, sipsPerCan?: number): void => {
  const firstState = ensureCanCupState(first, sipsPerCan);
  const secondState = ensureCanCupState(second, sipsPerCan);
  const firstSips = firstState.sipsLeft;
  firstState.sipsLeft = secondState.sipsLeft;
  secondState.sipsLeft = firstSips;
};

export const setSipsLeft = (player: Player, nextSipsLeft: number, sipsPerCan?: number): CanCupState => {
  const state = ensureCanCupState(player, sipsPerCan);
  const normalizedSipsPerCan = sanitizeSipsPerCan(sipsPerCan);
  state.sipsLeft = Math.min(normalizedSipsPerCan, Math.max(0, Math.round(nextSipsLeft)));
  return state;
};

export const canCupRemoveDefense = (player: Player, sipsPerCan?: number): CanCupState => {
  const state = ensureCanCupState(player, sipsPerCan);
  state.waterSips = 0;
  return state;
};

export const canCupGiveEmptyCan = (source: Player, target: Player, sipsPerCan?: number): void => {
  const sourceState = ensureCanCupState(source, sipsPerCan);
  const targetState = ensureCanCupState(target, sipsPerCan);

  if (sourceState.emptyCans > 0) {
    sourceState.emptyCans -= 1;
    targetState.emptyCans += 1;
  }
};

export const getPlayersWithFewestEmptyCans = (players: Player[], sipsPerCan?: number): Player[] => {
  if (players.length === 0) return [];

  // Ensure all have state
  players.forEach(p => ensureCanCupState(p, sipsPerCan));

  const minCans = Math.min(...players.map(p => p.canCup!.emptyCans));
  return players.filter(p => p.canCup!.emptyCans === minCans);
};
