import { TDCard } from '../types/td';

export interface TDCardDef {
  id: string;
  elixir: number;
  type: TDCard['type'];
  // Simulation params (for troop/building)
  hp?: number;
  speed?: number; // units per second (0..1 of arena height per second)
  range?: number; // normalized 0..1
  dps?: number;   // damage per second
  spawnCount?: number; // for swarm-type
  targetTowersFirst?: boolean; // e.g., giant
  lifetime?: number; // building lifetime in seconds
  // For spells
  radius?: number; // AoE radius
  damage?: number; // spell damage
}

export const TD_CARD_DEFS: Record<string, TDCardDef> = {
  // Slower normalized speeds for mobile pacing (0.02..0.03 of arena height per second)
  bowler: { id: 'bowler', elixir: 5, type: 'troop', hp: 1600, speed: 0.022, range: 0.15, dps: 120 },
  prince: { id: 'prince', elixir: 5, type: 'troop', hp: 1500, speed: 0.028, range: 0.03, dps: 160 },
  spear_goblin: { id: 'spear_goblin', elixir: 2, type: 'troop', hp: 220, speed: 0.03, range: 0.18, dps: 60, spawnCount: 3 },
  lumberjack: { id: 'lumberjack', elixir: 4, type: 'troop', hp: 1060, speed: 0.03, range: 0.03, dps: 180 },
  miner: { id: 'miner', elixir: 3, type: 'troop', hp: 1000, speed: 0.026, range: 0.03, dps: 120 },
  electro_wizard: { id: 'electro_wizard', elixir: 4, type: 'troop', hp: 900, speed: 0.025, range: 0.20, dps: 130 },
  golden_knight: { id: 'golden_knight', elixir: 4, type: 'troop', hp: 1700, speed: 0.028, range: 0.03, dps: 140 },
};

export function getCardDef(id: string): TDCardDef | undefined {
  return TD_CARD_DEFS[id];
}


