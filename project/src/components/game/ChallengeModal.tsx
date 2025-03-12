import { useState, useEffect } from 'react';
import { Card, Player } from '../../types/game';
import { Trophy, Droplet, Wine, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { GAME_CONFIG } from '../../config/gameConfig';

interface ChallengeModalProps {
  card: Card;
  players: Player[];
  currentPlayerId: string;
  onConfirm: (winnerId: string, loserId: string) => void;
  onCancel: () => void;
}

export function ChallengeModal({
  card,
  players,
  currentPlayerId,
  onConfirm,
  onCancel
}: ChallengeModalProps) {
  const [winnerId, setWinnerId] = useState<string>('');
  const [loserId, setLoserId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Reset error when selections change
  useEffect(() => {
    setError(null);
  }, [winnerId, loserId]);

  const challengeCardNames = [
    'Name the most: CAR BRANDS',
    'Name the most: FOOTBALL TEAMS',
    'Name the most: BEER BRANDS',
    'Name the most: LIQUOR BRANDS',
    'Name the most: COUNTRIES',
    'Name the most: TYPES OF PORN',
    'Wim Hoff Wannabe',
  ];

  const getChallengeEffects = () => {
    try {
      // Check for direct winnerEffect and loserEffect properties
      if (card.effect.winnerEffect && card.effect.loserEffect) {
        const winnerEffect = card.effect.winnerEffect;
        const loserEffect = card.effect.loserEffect;

        return {
          winEffect: `${getEffectDescription(winnerEffect)}`,
          loseEffect: `${getEffectDescription(loserEffect)}`
        };
      }
      // Backward compatibility for older challenge structure
      else if (card.effect.challengeEffects?.winner && card.effect.challengeEffects?.loser) {
        return {
          winEffect: `${getEffectDescription(card.effect.challengeEffects.winner)}`,
          loseEffect: `${getEffectDescription(card.effect.challengeEffects.loser)}`,
        };
      }
      // Handle specific card cases by name
      else if (card.name === 'Öl Hävf'){ //non standard challenge
        return {
          winEffect: `+ 5 Mana`,
          loseEffect: `+ 10 Mana Intake`
        };
      }
      else if (card.name === 'Got Big Muscles?'){ // non standrad challenge
        return {
          winEffect: `+ 3 Mana`,
          loseEffect: `- 4 Mana`
        };
      }
      else if (card.name === 'Shot Contest'){ // non standard challenge
        return {
          winEffect: `+ 2 Mana`,
          loseEffect: `+ 6 Mana Intake`
        };
      }
      else if (card.name === 'SHOT MASTER'){ // non standard challenge
        return {
          winEffect: `Mana intake reset to 0`,
          loseEffect: `Mana intake doubled`
        };
      }
      else if (card.name.includes('Name the most')){ // Naming challenges
        const value = card.effect.winnerEffect?.value || 5;
        return {
          winEffect: `Steal ${value} mana from loser`,
          loseEffect: `Lose ${value} mana to winner`
        };
      }
      else return {
        winEffect: 'Effect will be determined based on card', // More generic fallback message
        loseEffect: 'Effect will be determined based on card'
      };
    } catch (error) {
      console.error('Error determining challenge effects:', error);
      return {
        winEffect: 'Effects could not be determined',
        loseEffect: 'Effects could not be determined'
      };
    }
  };

  // Helper to get human-readable description of an effect
  const getEffectDescription = (effect: any) => {
    if (!effect) return 'No effect';
    
    try {
      switch (effect.type) {
        case 'mana':
          return `${effect.value > 0 ? '+' : ''}${effect.value} Mana`;
        case 'manaIntake':
          return `${effect.value > 0 ? '+' : ''}${effect.value} Mana Intake`;
        case 'manaBurn':
          return `${effect.value > 0 ? '-' : ''}${effect.value} Mana`;
        case 'manaStealer':
          return `Steal ${effect.value} Mana`;
        case 'resetManaIntake':
          return `Reset Mana Intake to 0`;
        case 'manaIntakeMultiply':
          return `Multiply Mana Intake by ${effect.value}`;
        case 'heal':
          return `${effect.value > 0 ? '+' : ''}${effect.value} Mana`;
        case 'damage':
          return `${effect.value > 0 ? '-' : ''}${effect.value} Mana`;
        case 'manaRefill':
          return `${effect.value > 0 ? '+' : ''}${effect.value} Mana`;
        default:
          return `${effect.type}: ${effect.value}`;
      }
    } catch (err) {
      console.error('Error parsing effect description:', err, effect);
      return 'Effect parsing error';
    }
  };

  const handleConfirm = () => {
    if (!winnerId || !loserId) {
      setError('Please select both a winner and loser');
      return;
    }
    
    if (winnerId === loserId) {
      setError('Winner and loser cannot be the same player');
      return;
    }
    
    try {
      onConfirm(winnerId, loserId);
    } catch (error) {
      console.error('Error confirming challenge:', error);
      setError('Failed to resolve challenge. Please try again.');
    }
  };

  const canConfirm = winnerId && loserId && winnerId !== loserId;
  const effects = getChallengeEffects();
  
  // Enhanced card styling based on its color
  const cardColorClass = card.color ? 
    `from-${card.color}-600 to-${card.color}-800` : 
    'from-purple-600 to-purple-900';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={`w-full max-w-md bg-gradient-to-br ${cardColorClass} rounded-lg shadow-xl border border-gray-700/50 overflow-hidden`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
            <div>
              <h3 className="text-lg font-semibold text-purple-100">{card.name}</h3>
              <p className="text-sm text-gray-300">Challenge Resolution</p>
            </div>
            <button
              onClick={onCancel}
              className="p-1 text-gray-400 hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            <div className="bg-black/20 rounded-lg p-3">
              <p className="text-sm text-gray-200">{card.description}</p>
            </div>

            {/* Error message if any */}
            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-2 text-sm text-red-200">
                {error}
              </div>
            )}

            {/* Winner Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-purple-200">Winner</label>
              <select
                value={winnerId}
                onChange={(e) => setWinnerId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700 text-white focus:ring-2 focus:ring-purple-500/20"
              >
                <option value="">Select winner...</option>
                {players.map(player => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Loser Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-purple-200">Loser</label>
              <select
                value={loserId}
                onChange={(e) => setLoserId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700 text-white focus:ring-2 focus:ring-purple-500/20"
              >
                <option value="">Select loser...</option>
                {players.map(player => (
                  <option 
                    key={player.id} 
                    value={player.id}
                    disabled={player.id === winnerId}
                  >
                    {player.name} {player.id === winnerId ? '(Winner)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Effects Preview */}
            {(
              <div className="bg-black/20 rounded-lg p-3 space-y-2">
                <h4 className="text-sm font-medium text-purple-200">Challenge Effects:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <p className="text-green-400">
                      Winner {winnerId ? `(${players.find(p => p.id === winnerId)?.name})` : ''}: {effects.winEffect}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Wine className="w-4 h-4 text-red-400" />
                    <p className="text-red-400">
                      Loser {loserId ? `(${players.find(p => p.id === loserId)?.name})` : ''}: {effects.loseEffect}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-4 border-t border-gray-700/50">
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="flex items-center space-x-2"
            >
              <Trophy className="w-4 h-4" />
              <span>Confirm Challenge</span>
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}