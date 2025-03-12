import { Player } from '../../types/game';
import { Droplet, Crown, Wine } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { GAME_CONFIG } from '../../config/gameConfig';
import { useGameStore } from '../../store/gameStore';
import { useState, useEffect, useRef, useMemo } from 'react';

interface PlayerStatsProps {
  player: Player;
  isCurrentPlayer: boolean;
  isCurrentTurn: boolean;
  isTargetable: boolean;
  onSelect?: () => void;
}

export function PlayerStats({ 
  player, 
  isCurrentPlayer, 
  isCurrentTurn,
  isTargetable,
  onSelect 
}: PlayerStatsProps) {
  // Get the current player to check if *they* are drunk (not the displayed player)
  const { currentPlayer, party } = useGameStore();
  const isCurrentPlayerDrunk = currentPlayer?.isDrunk || false;
  
  // Get decay rate from party settings or default
  const decayRate = party?.settings?.manaIntakeDecayRate ?? GAME_CONFIG.MANA_INTAKE_DECAY_RATE;
  
  // Calculate drunk threshold using party settings if available
  const drunkThreshold = party?.settings?.drunkThreshold ?? GAME_CONFIG.DRUNK_THRESHOLD;
  
  // Calculate drunk percentage (how close to drunk threshold)
  const drunkPercentage = Math.min(100, Math.floor((player.manaIntake / drunkThreshold) * 100));
  
  // Position for the drunk indicator line (80% of threshold)
  const drunkIndicatorPosition = 80;
  
  // Should we scramble text for current player (when drunk and viewing themselves)
  const shouldScrambleText = isCurrentPlayer && isCurrentPlayerDrunk;
  
  // Determine if the player is drunk (using isDrunk from player data)
  const isDrunk = player.isDrunk || false;

  // Format numbers to be more readable
  const formatNumber = (num: number): string => {
    return num.toFixed(1);
  };

  // Add visualization of decay rate
  const calculateDecayTime = () => {
    if (player.manaIntake <= 0 || decayRate <= 0) return null;
    
    // Calculate time to fully sober (assuming no additional intake)
    const minutesToSober = player.manaIntake / decayRate;
    
    // For display purposes, we'll show as seconds if < 60 seconds, otherwise as minutes
    return minutesToSober < 1 
      ? `${Math.round(minutesToSober * 60)}s` 
      : `${minutesToSober.toFixed(1)}m`;
  };
  
  const soberTime = calculateDecayTime();

  // Store scrambled text in refs to prevent re-scrambling on every render
  const scrambledNameRef = useRef<string>("");
  const scrambledTurnTextRef = useRef<string>("Current Turn");
  const scrambledTargetTextRef = useRef<string>("Click to Target");
  
  // Track when we should update the scrambled text (every few seconds)
  const [scrambleCounter, setScrambleCounter] = useState(0);
  
  // Update scrambled text periodically instead of every render
  useEffect(() => {
    if (!shouldScrambleText) return;
    
    // Set up an interval to update scrambled text every few seconds
    const interval = setInterval(() => {
      setScrambleCounter(prev => prev + 1);
    }, 2500); // Change scrambled text every 2.5 seconds
    
    return () => clearInterval(interval);
  }, [shouldScrambleText]);
  
  // Update scrambled text when counter changes or when drunk status changes
  useEffect(() => {
    if (shouldScrambleText) {
      scrambledNameRef.current = randomizeText(player.name);
      scrambledTurnTextRef.current = randomizeText("Current Turn");
      scrambledTargetTextRef.current = randomizeText("Click to Target");
    }
  }, [scrambleCounter, shouldScrambleText, player.name]);

  // Random text effect for drunk players - this function remains the same
  // but now we call it less frequently
  const randomizeText = (text: string): string => {
    // Similar randomization logic as in the CardList
    const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
    return text.split('').map(char => {
      if (char === ' ') return ' ';
      
      // Chance to replace with a completely different character
      if (Math.random() < 0.3) {
        return alphabet[Math.floor(Math.random() * alphabet.length)];
      }
      
      // Chance to switch case
      if (Math.random() < 0.5) {
        return char.toLowerCase();
      }
      
      return char.toUpperCase();
    }).join('');
  };

  // Determine the text to display (scrambled or normal)
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
        {/* Player Name */}
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
          <span className="text-xs">{formatNumber(player.mana)}</span>
        </div>

        {/* Drunk meter */}
        <div className="flex flex-col space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Wine className={clsx('w-3 h-3', isDrunk ? 'text-amber-400' : 'text-amber-600')} />
              <span className="text-xs">{isDrunk ? "Drunk" : "Drunk"}: {drunkPercentage}%</span>
            </div>
            <div className="flex items-center">
              <span className="text-xs text-gray-400">{formatNumber(player.manaIntake)}/{drunkThreshold}</span>
            </div>
          </div>
          
          {/* Drunk progress bar with container */}
          <div className="relative h-1.5 bg-gray-700 rounded-full overflow-hidden w-full">
            {/* Colored fill based on drunk percentage */}
            <div 
              className={clsx(
                "h-full transition-all duration-300", 
                drunkPercentage >= 80 ? "bg-red-500" : 
                drunkPercentage >= 50 ? "bg-amber-500" : 
                "bg-green-500"
              )}
              style={{ width: `${drunkPercentage}%` }}
            />
            
            {/* Threshold indicator line positioned at 80% of drunk threshold (when player becomes drunk) */}
            <div 
              className="absolute h-1.5 w-0.5 bg-white/70 top-0"
              style={{ left: `${drunkIndicatorPosition}%` }}
              aria-label="Drunk Threshold at 80%"
            />
          </div>
          
          {/* Sober time display (only for current player or if they're drunk) */}
          {(isCurrentPlayer || isDrunk) && soberTime && (
            <div className="text-xs text-gray-400 text-right">
              Time to sober: ~{soberTime}
            </div>
          )}
        </div>

        {/* Effects - only show for current player for space reasons */}
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
