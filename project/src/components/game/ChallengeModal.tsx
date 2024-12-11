import { useState } from 'react';
import { Card, Player } from '../../types/game';
import { Trophy, X, Crown, Skull } from 'lucide-react';
import { Button } from '../ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

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

  const alivePlayers = players.filter(p => p.health > 0);


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

    if (challengeCardNames.includes(card.name)) {
      return {
        winEffect: `+ ${card.effect.challengeEffects?.winner.value} Mana`,
        loseEffect: `- ${card.effect.challengeEffects?.loser.value} HP`,
      };
    }
    
    else if (card.name === 'Öl Hävf'){ //non standard challenge
      return {
        winEffect: `+ ${card.effect.challengeEffects?.winner.value} HP`,
        loseEffect: `- ${card.effect.challengeEffects?.loser.value} HP`
      };
    }
    else if (card.name === 'Got Big Muscles?'){ // non standrad challenge
      return {
        winEffect: `Full Mana refill`,
        loseEffect: `- ${card.effect.challengeEffects?.winner.value} Mana`
      };
    }
    else if (card.name === 'STRIP TEASE TIME!!!'){ // non standrad challenge
      return {
        winEffect: `+ ${card.effect.challengeEffects?.winner.value} Mana`,
        loseEffect: `take one piece of clothing of bby`
      };
    }
    else if (card.name === 'King of the Table #KingsMove!Allowed'){ // non standrad challenge
      return {
        winEffect: `+ ${card.effect.challengeEffects?.winner.value} HP and + ${card.effect.challengeEffects?.winner.value} Mana`,
        loseEffect: `takes 2 shots`
      };
    }
    else return {
      winEffect: '???', //non existant card
      loseEffect: '???'
    };
  };


  console.log("HÄR ÄR JAG!!!!!!! ---> winner value:", card.effect.challengeEffects?.winner.value);
  console.log("CARD NAME:", card.name);
  
  // const canConfirm = winnerId && loserId && winnerId !== loserId;
  const effects = getChallengeEffects();
  console.log(effects);
  if (!effects) console.log('Couldnt get challenge correct card id. Got:', card.id);

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
          className={`w-full max-w-md bg-gradient-to-br ${card.color} rounded-lg shadow-xl border border-gray-700/50 overflow-hidden`}
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

            {/* Winner Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-purple-200">Winner</label>
              <select
                value={winnerId}
                onChange={(e) => setWinnerId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700 text-white focus:ring-2 focus:ring-purple-500/20"
              >
                <option value="">Select winner...</option>
                {alivePlayers.map(player => (
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
                {alivePlayers.map(player => (
                  <option 
                    key={player.id} 
                    value={player.id}
                    disabled={player.id === winnerId}
                  >
                    {player.name}
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
                    <Crown className="w-4 h-4 text-yellow-400" />
                    <p className="text-green-400">
                      Winner ({players.find(p => p.id === winnerId)?.name}): {effects.winEffect}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Skull className="w-4 h-4 text-red-400" />
                    <p className="text-red-400">
                      Loser ({players.find(p => p.id === loserId)?.name}): {effects.loseEffect}
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
              onClick={() => onConfirm(winnerId, loserId)}
              // disabled={!canConfirm}
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