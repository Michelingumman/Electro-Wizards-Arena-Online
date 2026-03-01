import { Player } from '../../types/game';
import { Droplet, Crown, Wine } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { GAME_CONFIG } from '../../config/gameConfig';
import { useGameStore } from '../../store/gameStore';
import { useState, useEffect, useRef } from 'react';

interface PlayerStatsProps {
  player: Player;
  isCurrentPlayer: boolean;
  isCurrentTurn: boolean;
  isTargetable: boolean;
  onSelect?: () => void;
}

function formatSoberTime(totalSeconds: number): string {
  if (totalSeconds <= 0) return 'Sober';
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function PlayerStats({
  player,
  isCurrentPlayer,
  isCurrentTurn,
  isTargetable,
  onSelect
}: PlayerStatsProps) {
  const { currentPlayer, party } = useGameStore();
  const isCurrentPlayerDrunk = currentPlayer?.isDrunk || false;

  const decayRate = party?.settings?.manaIntakeDecayRate ?? GAME_CONFIG.MANA_INTAKE_DECAY_RATE;
  const drunkThreshold = party?.settings?.drunkThreshold ?? GAME_CONFIG.DRUNK_THRESHOLD;
  const drunkPercentage = Math.min(100, Math.floor((player.manaIntake / drunkThreshold) * 100));
  const drunkIndicatorPosition = 80;
  const shouldScrambleText = isCurrentPlayer && isCurrentPlayerDrunk;
  const isDrunk = player.isDrunk || false;

  // --- Local countdown timer (m:ss) ---
  // Track the snapshot time so we can calculate elapsed locally
  const snapshotTimeRef = useRef<number>(Date.now());
  const snapshotIntakeRef = useRef<number>(player.manaIntake);
  const [displaySeconds, setDisplaySeconds] = useState<number>(() => {
    if (player.manaIntake <= 0 || decayRate <= 0) return 0;
    return (player.manaIntake / decayRate) * 60;
  });

  // When Firestore pushes a new manaIntake value, reset the snapshot
  useEffect(() => {
    snapshotTimeRef.current = Date.now();
    snapshotIntakeRef.current = player.manaIntake;
    if (player.manaIntake <= 0 || decayRate <= 0) {
      setDisplaySeconds(0);
    } else {
      setDisplaySeconds((player.manaIntake / decayRate) * 60);
    }
  }, [player.manaIntake, decayRate]);

  // Tick the countdown locally every second (no Firestore writes)
  useEffect(() => {
    if (snapshotIntakeRef.current <= 0 || decayRate <= 0) return;

    const timer = setInterval(() => {
      const elapsedSec = (Date.now() - snapshotTimeRef.current) / 1000;
      const currentIntake = Math.max(0, snapshotIntakeRef.current - (decayRate / 60) * elapsedSec);
      const remainingSec = (currentIntake / decayRate) * 60;
      setDisplaySeconds(Math.max(0, remainingSec));
    }, 1000);

    return () => clearInterval(timer);
  }, [player.manaIntake, decayRate]);

  // --- Scramble text for drunk view ---
  const scrambledNameRef = useRef<string>("");
  const scrambledTurnTextRef = useRef<string>("Current Turn");
  const scrambledTargetTextRef = useRef<string>("Click to Target");
  const [scrambleCounter, setScrambleCounter] = useState(0);

  useEffect(() => {
    if (!shouldScrambleText) return;
    const interval = setInterval(() => setScrambleCounter(prev => prev + 1), 2500);
    return () => clearInterval(interval);
  }, [shouldScrambleText]);

  useEffect(() => {
    if (shouldScrambleText) {
      scrambledNameRef.current = randomizeText(player.name);
      scrambledTurnTextRef.current = randomizeText("Current Turn");
      scrambledTargetTextRef.current = randomizeText("Click to Target");
    }
  }, [scrambleCounter, shouldScrambleText, player.name]);

  const randomizeText = (text: string): string => {
    const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return text.split('').map(char => {
      if (char === ' ') return ' ';
      if (Math.random() < 0.3) return alphabet[Math.floor(Math.random() * alphabet.length)];
      if (Math.random() < 0.5) return char.toLowerCase();
      return char.toUpperCase();
    }).join('');
  };

  const displayName = shouldScrambleText ? scrambledNameRef.current : player.name;
  const displayTurnText = shouldScrambleText ? scrambledTurnTextRef.current : "Current Turn";
  const displayTargetText = shouldScrambleText ? scrambledTargetTextRef.current : "Click to Target";

  return (
    <div
      onClick={isTargetable && onSelect ? onSelect : undefined}
      className={clsx(
        'rounded-lg transition-all duration-200 relative overflow-hidden p-3',
        {
          'bg-gradient-to-br from-purple-900 to-gray-900 ring-2 ring-purple-500': isCurrentPlayer,
          'bg-gray-800/40 ring-1 ring-gray-600 opacity-80': !isCurrentPlayer && !isCurrentTurn,
          'bg-purple-700/20 ring-2 ring-purple-400 animate-pulse': isCurrentTurn,
          'cursor-pointer hover:scale-105': isTargetable,
          'bg-amber-900/30': isDrunk,
        }
      )}
    >
      {isCurrentTurn && (
        <motion.div
          className="absolute inset-0 bg-purple-500/10 animate-[pulse_2s_ease-in-out_infinite]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.0 }}
        />
      )}

      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center space-x-1">
          <h3
            className={clsx(
              'text-sm font-bold',
              isCurrentPlayer ? 'text-white' : 'text-purple-300',
              isDrunk ? 'animate-wiggle' : ''
            )}
          >
            {displayName}
          </h3>
          {player.isLeader && <Crown className="w-3 h-3 text-yellow-400" />}
          {isDrunk && <Wine className="w-3 h-3 text-amber-400" aria-label="Drunk" />}
        </div>
      </div>

      {/* Player Stats */}
      <div className="flex flex-col space-y-1">
        {/* Mana */}
        <div className="flex items-center space-x-1">
          <Droplet className="w-3 h-3 text-blue-400" />
          <span className="text-xs">{player.mana.toFixed(1)}</span>
        </div>

        {/* Drunk meter — m:ss countdown */}
        <div className="flex flex-col space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Wine className={clsx('w-3 h-3', isDrunk ? 'text-amber-400' : 'text-amber-600')} />
              <span className={clsx('text-xs font-mono', isDrunk && 'text-amber-300 font-bold')}>
                {displaySeconds > 0 ? formatSoberTime(displaySeconds) : 'Sober'}
              </span>
            </div>
            <span className="text-xs text-gray-400">
              {player.manaIntake.toFixed(1)}/{drunkThreshold}
            </span>
          </div>

          {/* Drunk progress bar */}
          <div className="relative h-1.5 bg-gray-700 rounded-full overflow-hidden w-full">
            <div
              className={clsx(
                "h-full transition-all duration-300",
                drunkPercentage >= 80 ? "bg-red-500" :
                  drunkPercentage >= 50 ? "bg-amber-500" :
                    "bg-green-500"
              )}
              style={{ width: `${drunkPercentage}%` }}
            />
            <div
              className="absolute h-1.5 w-0.5 bg-white/70 top-0"
              style={{ left: `${drunkIndicatorPosition}%` }}
              aria-label="Drunk Threshold at 80%"
            />
          </div>
        </div>

        {/* Effects */}
        {isCurrentPlayer && player.effects && player.effects.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {player.effects.map((effect, index) => (
              <div
                key={index}
                className={clsx(
                  'flex items-center px-1 py-0.5 rounded text-[10px]',
                  effect.stackId === 'untargetable'
                    ? 'bg-blue-700 text-blue-300'
                    : 'bg-gray-800/60'
                )}
                aria-label={`${effect.type} (${effect.duration} turns left)`}
              >
                {effect.stackId === 'untargetable' ? '🛡️ Untargetable' : effect.type}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Current Turn Indicator */}
      {isCurrentTurn && (
        <div className="mt-1 text-xs font-medium text-center text-purple-300">
          <span className={clsx("bg-purple-600/20 px-2 py-0.5 rounded", isDrunk ? 'animate-wiggle' : '')}>
            {displayTurnText}
          </span>
        </div>
      )}

      {/* Targetable Indicator */}
      {isTargetable && (
        <div className="mt-1 text-center text-[10px] text-purple-400 animate-pulse uppercase">
          {displayTargetText}
        </div>
      )}
    </div>
  );
}
