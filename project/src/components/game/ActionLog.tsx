import { Party } from '../../types/game';
import { Sword, Heart, Star, Shield, Crown, Droplet, Wine, ArrowDown, Shuffle } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface ActionLogProps {
  lastAction: Party['lastAction'];
  players: Party['players'];
}

export function ActionLog({ lastAction, players }: ActionLogProps) {
  if (!lastAction) return null;

  const attacker = players.find((p) => p.id === lastAction.playerId);
  const defender = lastAction.targetId
    ? players.find((p) => p.id === lastAction.targetId)
    : null;

  if (!attacker) return null;

  const isSelfTarget = lastAction.playerId === lastAction.targetId;
  const isRandomTarget = lastAction.cardDescription?.toLowerCase().includes('randomly select') || 
                         lastAction.cardDescription?.toLowerCase().includes('random player');

  // Helper to get card color class based on card rarity
  const getCardColorClass = (rarity: string, type: string) => {
    // First check for special types
    if (type === 'challenge') {
      return 'bg-gradient-to-br from-orange-600 to-orange-800 border-orange-400 shadow-orange-500/40';
    }
    
    if (type === 'forceDrink') {
      return 'bg-gradient-to-br from-amber-600 to-amber-800 border-amber-400 shadow-amber-500/40';
    }

    // Then check for rarity-based colors
    switch (rarity) {
      case 'legendary':
        return 'bg-gradient-to-br from-yellow-600 to-yellow-800 border-yellow-400 shadow-yellow-500/40';
      case 'epic':
        return 'bg-gradient-to-br from-purple-600 to-purple-800 border-purple-400 shadow-purple-500/30';
      case 'rare':
        return 'bg-gradient-to-br from-blue-600 to-blue-800 border-blue-400 shadow-blue-500/30';
      case 'common':
      default:
        if (type === 'damage') {
          return 'bg-gradient-to-br from-red-600 to-red-800 border-red-400 shadow-red-500/30';
        }
        if (type === 'heal') {
          return 'bg-gradient-to-br from-green-600 to-green-800 border-green-400 shadow-green-500/30';
        }
        return 'bg-gradient-to-br from-gray-600 to-gray-800 border-gray-400 shadow-gray-500/20';
    }
  };

  // Helper to get icon by card type
  const getCardIcon = (type: string) => {
    switch (type) {
      case 'damage':
        return <Sword className="w-4 h-4 text-white" />;
      case 'heal':
        return <Heart className="w-4 h-4 text-white" />;
      case 'manaDrain':
      case 'manaRefill':
      case 'potionBuff':
      case 'manaBurn':
      case 'forceDrink':
        return <Droplet className="w-4 h-4 text-white" />;
      case 'buff':
      case 'challenge':
        return <Star className="w-4 h-4 text-white" />;
      case 'defend':
        return <Shield className="w-4 h-4 text-white" />;
      case 'legendary':
        return <Crown className="w-4 h-4 text-white" />;
      default:
        return <Star className="w-4 h-4 text-white" />;
    }
  };

  // Extract mana costs from card description
  const extractEffectValues = () => {
    const effects = {
      manaCost: null as number | null,
      manaValue: null as number | null,
      intakeValue: null as number | null,
    };
    
    // Card mana cost from description if available
    if (lastAction.cardDescription) {
      // Check for mana gain patterns
      const manaMatch = lastAction.cardDescription.match(/(\+|\-)\s*(\d+)\s*[Mm]ana/);
      if (manaMatch && manaMatch[2]) {
        effects.manaValue = parseInt(manaMatch[2]) * (manaMatch[1] === '-' ? -1 : 1);
      }
      
      // Check for intake patterns
      const intakeMatch = lastAction.cardDescription.match(/(\+|\-)\s*(\d+)\s*[Ii]ntake/);
      if (intakeMatch && intakeMatch[2]) {
        effects.intakeValue = parseInt(intakeMatch[2]) * (intakeMatch[1] === '-' ? -1 : 1);
      }
    }
    
    // If we have numeric card ID that might be a mana cost
    if (lastAction.cardId && /^\d+$/.test(lastAction.cardId)) {
      effects.manaCost = parseInt(lastAction.cardId);
    }

    // Try to extract mana cost from card name if it's a number
    if (!effects.manaCost && lastAction.cardName && /^\d+$/.test(lastAction.cardName)) {
      effects.manaCost = parseInt(lastAction.cardName);
    }
    
    return effects;
  };

  const { manaCost, manaValue, intakeValue } = extractEffectValues();
  const cardColorClass = getCardColorClass(lastAction.cardRarity, lastAction.cardType);
  
  // Check if it's a drinking action
  const isDrinkAction = lastAction.cardType === 'forceDrink' || lastAction.cardId === 'drink';
  
  // Extract intake value from description for random cards
  const getIntakeValueFromDescription = () => {
    if (!lastAction.cardDescription) return null;
    
    const match = lastAction.cardDescription.match(/gain\s+(\d+)\s+mana\s+intake/i);
    if (match && match[1]) {
      return parseInt(match[1]);
    }
    return null;
  };

  const randomIntakeValue = getIntakeValueFromDescription();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-700 p-4 flex flex-col items-center space-y-3"
    >
      {/* Player who used the card */}
      <div className="flex flex-col items-center space-y-1">
        <div className="flex items-center justify-center space-x-2 p-1 rounded-full bg-gray-900/60">
          <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold">
            {attacker.name.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-semibold text-purple-100 px-1">{attacker.name}</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-xs text-gray-400">played</span>
        </div>
      </div>

      {/* Card icon to show direction */}
      <div className="h-6 flex items-center">
        <ArrowDown className="w-4 h-4 text-gray-400" />
      </div>

      {/* Centered Log Details */}
      <div className="flex flex-col items-center space-y-3 w-full">
        {/* Card Box with enhanced styling */}
        <div
          className={clsx(
            'relative flex items-center justify-between w-full p-3 rounded-lg border-2 shadow-md',
            cardColorClass
          )}
          title={lastAction.cardDescription}
        >
          {/* Decorative card patterns */}
          <div className="absolute top-0 right-0 w-16 h-16 opacity-10 rounded-bl-3xl bg-white"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 opacity-10 rounded-tr-xl bg-white"></div>
          
          {/* Card Icon and Name */}
          <div className="flex items-center space-x-2 z-10">
            <div className="bg-black/30 p-1 rounded-full">
              {getCardIcon(lastAction.cardType)}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">{lastAction.cardName}</span>
              <span className="text-xs text-gray-200 opacity-80">{lastAction.cardRarity}</span>
            </div>
          </div>

          {/* Effects and Costs */}
          <div className="flex items-center space-x-2 z-10">
            {/* Original Mana Cost */}
            {lastAction.cardId && /^\d+$/.test(lastAction.cardId) && (
              <div className="flex items-center bg-blue-900/70 px-2 py-1 rounded-full">
                <span className="text-xs text-white font-medium">{lastAction.cardId}</span>
                <Droplet className="w-3 h-3 ml-1 text-blue-300" />
              </div>
            )}
            
            {/* Mana Effect */}
            {manaValue !== null && (
              <div className="flex items-center bg-emerald-900/70 px-2 py-1 rounded-full">
                <span className="text-xs text-white font-medium">
                  {manaValue > 0 ? `+${manaValue}` : manaValue} 
                </span>
                <Droplet className="w-3 h-3 ml-1 text-emerald-300" />
              </div>
            )}
            
            {/* Intake Effect */}
            {(intakeValue !== null || randomIntakeValue !== null) && (
              <div className="flex items-center bg-amber-900/70 px-2 py-1 rounded-full">
                <span className="text-xs text-white font-medium">
                  {intakeValue !== null 
                    ? (intakeValue > 0 ? `+${intakeValue}` : intakeValue)
                    : (randomIntakeValue !== null ? `+${randomIntakeValue}` : null)}
                </span>
                <Wine className="w-3 h-3 ml-1 text-amber-300" />
              </div>
            )}
          </div>
        </div>

        {/* Card Description */}
        <div className="text-xs text-gray-300 text-center max-w-full px-2 py-1 bg-gray-900/50 rounded-md">
          {lastAction.cardDescription}
        </div>
        
        {/* Random selection indicator */}
        {isRandomTarget && (
          <div className="flex items-center space-x-1 text-xs text-gray-400 bg-gray-800/70 px-2 py-1 rounded-full">
            <Shuffle className="w-3 h-3 text-blue-400" />
            <span>Random Selection</span>
          </div>
        )}

        {/* Arrow icon pointing to target */}
        {(defender || isSelfTarget) && (
          <div className="h-6 flex items-center">
            <ArrowDown className="w-4 h-4 text-gray-400" />
          </div>
        )}

        {/* Target player info */}
        {defender && (
          <div className="flex flex-col items-center space-y-1">
            <div className="flex items-center justify-center space-x-2 p-1 rounded-full bg-gray-900/60">
              <div className={clsx(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                isSelfTarget ? "bg-purple-600" : "bg-red-600"
              )}>
                {defender.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-gray-100 px-1">{defender.name}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-400">{isRandomTarget ? "randomly selected" : "targeted"}</span>
            </div>
          </div>
        )}
        
        {/* Self-target case but shown clearly */}
        {isSelfTarget && !defender && (
          <div className="flex flex-col items-center space-y-1">
            <div className="flex items-center justify-center space-x-2 p-1 rounded-full bg-gray-900/60">
              <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold">
                {attacker.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-gray-100 px-1">{attacker.name}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-400">{isRandomTarget ? "randomly selected self" : "self-targeted"}</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
