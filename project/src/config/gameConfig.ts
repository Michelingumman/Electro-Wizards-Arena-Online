export const GAME_CONFIG = {
  // Party settings
  MAX_PLAYERS: 10,
  MIN_PLAYERS_TO_START: 2,
  PARTY_CODE_LENGTH: 2,
  CARDS_PER_HAND: 6,

  // Player stats (now using floating points)
  INITIAL_HEALTH: 20.0,
  INITIAL_MANA: 10.0,
  MAX_HEALTH: 10.0,
  MAX_MANA: 10.0,
  MANA_DRINK_AMOUNT: 10.0,

} as const;

