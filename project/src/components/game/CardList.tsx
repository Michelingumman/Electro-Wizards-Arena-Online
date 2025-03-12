import { Card as CardType } from '../../types/game';
import { Sword, Heart, Droplet, Zap, Crown, Star } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';

interface CardListProps {
  cards: CardType[];
  onPlayCard: (card: CardType) => void;
  disabled: boolean;
  currentMana: number;
  selectedCard: CardType | null;
}

export function CardList({ 
  cards, 
  onPlayCard,
  disabled, 
  currentMana,
  selectedCard,
}: CardListProps) {
  // Get current player state to check for drunk status
  const { currentPlayer } = useGameStore();
  const isDrunk = currentPlayer?.isDrunk || false;

  // Helper to determine card icons based on effects
  const getCardIcons = (card: CardType) => {
    const icons = [];

    if (card.effect.type === 'damage') {
      icons.push(<Sword key="damage" className="w-4 h-4 text-red-400" />);
    }

    if (card.effect.type === 'heal') {
      icons.push(<Heart key="heal" className="w-4 h-4 text-green-400" />);
      // Add droplet only for heal cards with mana-related effects
      if (
        card.effect.type === 'heal' &&
        ['manaDrain', 'manaBurn', 'manaRefill'].some(manaEffect =>
          card.description.includes(manaEffect)
        )
      ) {
        icons.push(<Droplet key="mana" className="w-4 h-4 text-blue-400" />);
      }
    }

    if (card.isChallenge) {
      icons.push(<Star key="challenge" className="w-4 h-4 text-purple-400" />);
    }

    if (card.isLegendary) {
      icons.push(<Crown key="legendary" className="w-4 h-4 text-yellow-400" />);
    }

    return icons;
  };

  // Helper to format numbers
  const formatNumber = (num: number) => Number(num.toFixed(1));

  // Helper to scramble text for drunk player
  const randomizeText = (text: string): string => {
    // Create a mapping of characters to use for scrambling
    const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
    // For some words, completely replace them with nonsense
    if (Math.random() < 0.3) {
      return Array.from({ length: text.length }).map(() => 
        alphabet[Math.floor(Math.random() * alphabet.length)]
      ).join('');
    }
    
    // For other words, scramble individual characters
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

  // Helper to get rarity-based styling
  const getRarityStyles = (card: CardType) => {
    const base = {
      border: '',
      gradient: '',
      glow: ''
    };

    switch (card.rarity) {
      case 'legendary':
        base.border = 'border-yellow-400';
        base.gradient = 'from-yellow-600 to-yellow-800';
        base.glow = 'shadow-lg shadow-yellow-500/40';
        break;
      case 'epic':
        base.border = 'border-purple-400';
        base.gradient = 'from-purple-600 to-purple-800';
        base.glow = 'shadow-md shadow-purple-500/30';
        break;
      case 'rare':
        base.border = 'border-blue-400';
        base.gradient = 'from-blue-600 to-blue-800';
        base.glow = 'shadow-sm shadow-blue-500/20';
        break;
      case 'common':
      default:
        base.border = 'border-gray-500';
        base.gradient = 'from-gray-600 to-gray-800';
        base.glow = '';
        break;
    }

    return base;
  };

  // Helper to get color-based styling
  const getColorStyles = (card: CardType) => {
    if (!card.color) return 'from-gray-600 to-gray-800';

    const colorMap: Record<string, string> = {
      'blue': 'from-blue-600 to-blue-800',
      'red': 'from-red-600 to-red-800',
      'green': 'from-green-600 to-green-800',
      'yellow': 'from-yellow-600 to-yellow-800',
      'purple': 'from-purple-600 to-purple-800',
      'indigo': 'from-indigo-600 to-indigo-800',
      'pink': 'from-pink-600 to-pink-800',
      'orange': 'from-orange-600 to-orange-800',
      'teal': 'from-teal-600 to-teal-800',
      'cyan': 'from-cyan-600 to-cyan-800',
      'amber': 'from-amber-600 to-amber-800',
      'lime': 'from-lime-600 to-lime-800',
      'emerald': 'from-emerald-600 to-emerald-800',
      'rose': 'from-rose-600 to-rose-800',
      'fuchsia': 'from-fuchsia-600 to-fuchsia-800',
      'violet': 'from-violet-600 to-violet-800'
    };

    return colorMap[card.color] || 'from-gray-600 to-gray-800';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {cards.map((card) => {
        const isSelected = selectedCard?.id === card.id;
        const canPlay = !disabled && card.manaCost <= currentMana;
        const rarityStyles = getRarityStyles(card);
        const colorGradient = getColorStyles(card);
        
        // For drunk players, randomly adjust displayed mana cost (visual only, not functional)
        const displayedManaCost = isDrunk 
          ? formatNumber(card.manaCost + (Math.random() > 0.5 ? Math.floor(Math.random() * 3) : 0))
          : formatNumber(card.manaCost);

        return (
          <motion.div
            key={card.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={() => canPlay && onPlayCard(card)}
            className={clsx(
              'relative overflow-hidden transition-all duration-200',
              'rounded-lg border-2 p-3',
              rarityStyles.border,
              rarityStyles.glow,
              {
                'cursor-pointer transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30': canPlay,
                'cursor-not-allowed opacity-75': !canPlay,
                'opacity-75 filter saturate-50': disabled, 
                'ring-2 ring-purple-400 shadow-lg shadow-purple-500/30': isSelected,
                'hover:border-white': !isSelected && canPlay,
                'bg-gradient-to-br': true,
                'drunk-card-effect': isDrunk,
              },
              colorGradient
            )}
          >
            {isSelected && (
              <motion.div 
                className="absolute inset-0 bg-purple-500/10 animate-pulse"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            )}

            {!disabled && canPlay && (
              <div className="absolute inset-0 bg-white/5 animate-pulse pointer-events-none"></div>
            )}

            <div className="relative">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-base text-white">
                    {isDrunk ? randomizeText(card.name) : card.name}
                  </h4>
                  {card.isLegendary && (
                    <span className="text-xs bg-yellow-500/30 text-yellow-300 px-1.5 py-0.5 rounded-full">
                      {isDrunk ? randomizeText("Legendary") : "Legendary"}
                    </span>
                  )}
                  {card.isChallenge && (
                    <span className="text-xs bg-orange-500/30 text-orange-300 px-1.5 py-0.5 rounded-full">
                      {isDrunk ? randomizeText("Challenge") : "Challenge"}
                    </span>
                  )}
                </div>
                <span className="flex items-center text-white bg-blue-900/80 px-2 py-1 rounded-full text-sm font-medium">
                  {displayedManaCost} <Droplet className="w-3 h-3 ml-1 text-blue-300" />
                </span>
              </div>

              <p className="text-xs text-gray-200 mb-3 min-h-[2.5rem]">
                {isDrunk ? randomizeText(card.description) : card.description}
              </p>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 text-xs">
                  {getCardIcons(card).map((icon, index) => (
                    <span key={`icon-${index}`}>{icon}</span>
                  ))}
                </div>

                {isSelected && card.requiresTarget && (
                  <div className="text-xs text-purple-200 animate-pulse font-medium">
                    {isDrunk ? randomizeText("Click a player to target") : "Click a player to target"}
                  </div>
                )}

                {!card.requiresTarget && canPlay && (
                  <div className="text-xs text-gray-300">
                    {isDrunk ? randomizeText("Click to use") : "Click to use"}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
