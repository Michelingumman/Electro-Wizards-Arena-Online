import { useState, useEffect } from 'react';
import { Card, Player } from '../../../types/game';
import { Trophy, Wine, X } from 'lucide-react';
import { Button } from '../../ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { isNamingChallengeCard } from '../../../utils/challengeCard';

interface ChallengeModalProps {
  card: Card;
  players: Player[];
  currentPlayerId: string;
  eligiblePlayerIds?: string[];
  onConfirm: (winnerId: string, loserId: string) => void;
  onCancel: () => void;
}

export function ChallengeModal({
  card,
  players,
  currentPlayerId,
  eligiblePlayerIds,
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

  const eligiblePlayers = eligiblePlayerIds && eligiblePlayerIds.length > 0
    ? players.filter((player) => eligiblePlayerIds.includes(player.id))
    : players;
  const currentPlayerName = players.find((player) => player.id === currentPlayerId)?.name ?? 'Host';

  const isEffectObject = (effect: unknown): effect is { type: string; value: number } => {
    if (!effect || typeof effect !== 'object') return false;
    const maybeEffect = effect as { type?: unknown; value?: unknown };
    return typeof maybeEffect.type === 'string' && typeof maybeEffect.value === 'number';
  };

  const getChallengeEffects = () => {
    try {
      const winnerEffect = card.effect.winnerEffect
        ?? card.effect.challenge?.winnerEffect
        ?? (isEffectObject((card.effect.challengeEffects as { winner?: unknown } | undefined)?.winner)
          ? (card.effect.challengeEffects as { winner: { type: string; value: number } }).winner
          : null);
      const loserEffect = card.effect.loserEffect
        ?? card.effect.challenge?.loserEffect
        ?? (isEffectObject((card.effect.challengeEffects as { loser?: unknown } | undefined)?.loser)
          ? (card.effect.challengeEffects as { loser: { type: string; value: number } }).loser
          : null);

      if (winnerEffect && loserEffect) {
        return {
          winEffect: getEffectDescription(winnerEffect),
          loseEffect: getEffectDescription(loserEffect),
        };
      }

      // Legacy fallback for old cards that might miss explicit loser effect in DB snapshots.
      if (card.id === 'ol-havf') {
        return {
          winEffect: '+5 Mana',
          loseEffect: '+10 Drunkness',
        };
      }
      if (card.id === 'got-big-muscles') {
        return {
          winEffect: '+3 Mana',
          loseEffect: '-4 Mana',
        };
      }
      if (card.id === 'shot-contest') {
        return {
          winEffect: '+2 Mana',
          loseEffect: '+6 Drunkness',
        };
      }
      if (card.id === 'shot-master') {
        return {
          winEffect: 'Drunkness reset to 0',
          loseEffect: 'Drunkness doubled',
        };
      }
      if (isNamingChallengeCard(card)) {
        const value = card.effect.winnerEffect?.value || card.effect.challenge?.winnerEffect?.value || 4;
        return {
          winEffect: `Steal ${value} mana from loser`,
          loseEffect: `Lose ${value} mana`,
        };
      }

      return {
        winEffect: 'Effect decided by challenge host',
        loseEffect: 'Effect decided by challenge host',
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
  const getEffectDescription = (effect: { type: string; value: number } | null) => {
    if (!effect) return 'No effect';

    try {
      switch (effect.type) {
        case 'mana':
          return `${effect.value > 0 ? '+' : ''}${effect.value} Mana`;
        case 'manaIntake':
          return `${effect.value > 0 ? '+' : ''}${effect.value} Drunkness`;
        case 'manaBurn':
          return `${effect.value > 0 ? '-' : ''}${effect.value} Mana`;
        case 'manaStealer':
          return `Steal ${effect.value} Mana`;
        case 'resetManaIntake':
          return `Reset Drunkness to 0`;
        case 'manaIntakeMultiply':
          return `Multiply Drunkness by ${effect.value}`;
        case 'heal':
          return `${effect.value > 0 ? '+' : ''}${effect.value} Mana`;
        case 'damage':
          return `${effect.value > 0 ? '-' : ''}${effect.value} Mana`;
        case 'manaRefill':
          return `${effect.value > 0 ? '+' : ''}${effect.value} Mana`;
        case 'canCupSip':
          return `${effect.value} Sip${effect.value === 1 ? '' : 's'}`;
        case 'canCupWater':
          return `+${effect.value} Water Sip${effect.value === 1 ? '' : 's'}`;
        case 'canCupDeflect':
          return `Deflect ${effect.value} forced sip${effect.value === 1 ? '' : 's'}`;
        case 'canCupTopUp':
          return `Top up ${effect.value} sip${effect.value === 1 ? '' : 's'}`;
        case 'null':
          return 'No direct effect';
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
              <p className="text-sm text-gray-300">Challenge Resolution · {currentPlayerName}</p>
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

            {/* Winner/Loser Selection */}
            {card.name === 'Tungvrickaren' && eligiblePlayers.length >= 2 ? (
              <div className="space-y-3 bg-black/20 rounded-lg p-4 border border-purple-500/20">
                <p className="text-center text-sm font-medium text-purple-200">
                  Lyckades {eligiblePlayers[1]?.name} läsa tungvrickaren felfritt?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setWinnerId(eligiblePlayers[1].id);
                      setLoserId(eligiblePlayers[0].id);
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${winnerId === eligiblePlayers[1].id
                      ? 'bg-emerald-600/90 border-emerald-400 text-white shadow-[0_0_15px_rgba(52,211,153,0.4)]'
                      : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50'
                      }`}
                  >
                    <span className="font-bold text-sm">Godkänd (Pass)</span>
                    <span className="text-[10px] opacity-80 mt-1">Ingen dricker</span>
                  </button>
                  <button
                    onClick={() => {
                      setWinnerId(eligiblePlayers[0].id);
                      setLoserId(eligiblePlayers[1].id);
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${winnerId === eligiblePlayers[0].id
                      ? 'bg-rose-600/90 border-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                      : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50'
                      }`}
                  >
                    <span className="font-bold text-sm">Underkänd (Fail)</span>
                    <span className="text-[10px] opacity-80 mt-1">{eligiblePlayers[1]?.name} dricker 3</span>
                  </button>
                </div>
              </div>
            ) : card.name === 'Flamingon' ? (
              <div className="space-y-3 bg-black/20 rounded-lg p-4 border border-fuchsia-500/20">
                <p className="text-center text-sm font-medium text-fuchsia-200">
                  Vem tappade balansen först? (Who lost first?)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {eligiblePlayers.map(player => (
                    <button
                      key={player.id}
                      onClick={() => {
                        setLoserId(player.id);
                        // Just set winner to whoever isn't the loser to satisfy canConfirm.
                        // Flamingo has null winner effect anyway.
                        const anyWinner = eligiblePlayers.find(p => p.id !== player.id);
                        if (anyWinner) setWinnerId(anyWinner.id);
                      }}
                      className={`py-2 px-3 rounded-lg border text-sm transition-all truncate ${loserId === player.id
                        ? 'bg-fuchsia-600/90 border-fuchsia-400 text-white shadow-[0_0_15px_rgba(217,70,239,0.4)]'
                        : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50'
                        }`}
                    >
                      {player.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-purple-200">Winner</label>
                  <select
                    value={winnerId}
                    onChange={(e) => setWinnerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700 text-white focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="">Select winner...</option>
                    {eligiblePlayers.map(player => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-purple-200">Loser</label>
                  <select
                    value={loserId}
                    onChange={(e) => setLoserId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700 text-white focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="">Select loser...</option>
                    {eligiblePlayers.map(player => (
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
              </>
            )}

            {/* Effects Preview */}
            <div className="bg-black/20 rounded-lg p-3 space-y-2">
              <h4 className="text-sm font-medium text-purple-200">Challenge Effects:</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <p className="text-green-400">
                    Winner {winnerId ? `(${eligiblePlayers.find(p => p.id === winnerId)?.name})` : ''}: {effects.winEffect}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Wine className="w-4 h-4 text-red-400" />
                  <p className="text-red-400">
                    Loser {loserId ? `(${eligiblePlayers.find(p => p.id === loserId)?.name})` : ''}: {effects.loseEffect}
                  </p>
                </div>
              </div>
            </div>
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
              <span>Use Challenge</span>
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
