import { PlayerHand } from '../../types/cards';
import { Crown, Shield, Sword, Sparkles } from 'lucide-react';

interface CardStatsProps {
  hand: PlayerHand;
}

export function CardStats({ hand }: CardStatsProps) {
  return (
    <div className="flex items-center space-x-4 bg-gray-800/50 rounded-lg p-2">
      <div className="flex items-center space-x-1">
        <Shield className="w-4 h-4 text-gray-400" />
        <span className="text-xs text-gray-400">{hand.stats.common}</span>
      </div>
      <div className="flex items-center space-x-1">
        <Sword className="w-4 h-4 text-blue-400" />
        <span className="text-xs text-blue-400">{hand.stats.rare}</span>
      </div>
      <div className="flex items-center space-x-1">
        <Sparkles className="w-4 h-4 text-purple-400" />
        <span className="text-xs text-purple-400">{hand.stats.epic}</span>
      </div>
      <div className="flex items-center space-x-1">
        <Crown className="w-4 h-4 text-yellow-400" />
        <span className="text-xs text-yellow-400">{hand.stats.legendary}</span>
      </div>
    </div>
  );
}