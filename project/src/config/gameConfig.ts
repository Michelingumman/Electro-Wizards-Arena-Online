export const GAME_CONFIG = {
  // Party settings
  MAX_PLAYERS: 10,
  MIN_PLAYERS_TO_START: 2,
  PARTY_CODE_LENGTH: 2,
  CARDS_PER_HAND: 6,

  // Player stats
  INITIAL_MANA: 10.0,
  MAX_MANA: 20.0,
  MANA_DRINK_AMOUNT: 10.0,
  
  // Mana intake system
  DRUNK_THRESHOLD: 20.0,
  MANA_INTAKE_DECAY_RATE: 1.0, // Amount of mana intake that decays per minute (will be divided for per-second updates)

} as const;

