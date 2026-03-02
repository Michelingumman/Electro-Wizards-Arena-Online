import { Party } from '../../../types/game';
import { Sword, Heart, Droplet, Zap, Wine, Target, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

interface ArenaActionDisplayProps {
    lastAction: Party['lastAction'];
    players: Party['players'];
}

export function ArenaActionDisplay({ lastAction, players }: ArenaActionDisplayProps) {
    if (!lastAction) return null;

    const attacker = players.find(p => p.id === lastAction.playerId);
    const defender = lastAction.targetId ? players.find(p => p.id === lastAction.targetId) : null;
    if (!attacker) return null;

    const isSelfTarget = lastAction.playerId === lastAction.targetId;

    const getActionIcon = (type: string) => {
        const size = "w-5 h-5";
        switch (type) {
            case 'damage':
            case 'aoeDamage': return <Sword className={clsx(size, "text-red-400")} />;
            case 'heal':
            case 'manaRefill':
            case 'potionBuff': return <Heart className={clsx(size, "text-green-400")} />;
            case 'manaDrain':
            case 'manaBurn': return <Zap className={clsx(size, "text-yellow-400")} />;
            case 'challenge': return <Target className={clsx(size, "text-orange-400")} />;
            case 'forceDrink': return <Wine className={clsx(size, "text-amber-400")} />;
            default: return <Sparkles className={clsx(size, "text-purple-400")} />;
        }
    };

    const getActionColor = (type: string) => {
        switch (type) {
            case 'damage':
            case 'aoeDamage': return 'from-red-600/20 to-transparent border-red-500/30';
            case 'heal':
            case 'manaRefill':
            case 'potionBuff': return 'from-green-600/20 to-transparent border-green-500/30';
            case 'manaDrain':
            case 'manaBurn': return 'from-yellow-600/20 to-transparent border-yellow-500/30';
            case 'challenge': return 'from-orange-600/20 to-transparent border-orange-500/30';
            case 'forceDrink': return 'from-amber-600/20 to-transparent border-amber-500/30';
            default: return 'from-purple-600/20 to-transparent border-purple-500/30';
        }
    };

    const getRarityBorder = (rarity: string) => {
        switch (rarity) {
            case 'legendary': return 'border-amber-500/50';
            case 'epic': return 'border-purple-500/50';
            case 'rare': return 'border-blue-500/50';
            default: return 'border-gray-600/50';
        }
    };

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={`${lastAction.playerId}-${lastAction.cardId}-${Date.now()}`}
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className={clsx(
                    "w-full max-w-xs mx-auto rounded-xl border p-3",
                    "bg-gradient-to-b",
                    getActionColor(lastAction.cardType)
                )}
            >
                {/* Action Flow: Attacker → Icon → Target */}
                <div className="flex items-center justify-center gap-2 mb-2">
                    {/* Attacker */}
                    <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
                            {attacker.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold text-white">{attacker.name}</span>
                    </div>

                    {/* Action Icon */}
                    <motion.div
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
                        className="flex items-center gap-1"
                    >
                        {getActionIcon(lastAction.cardType)}
                        {defender && !isSelfTarget && (
                            <ArrowRight className="w-3 h-3 text-gray-500" />
                        )}
                    </motion.div>

                    {/* Target */}
                    {defender && !isSelfTarget && (
                        <motion.div
                            initial={{ x: 10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3, type: 'spring', stiffness: 400 }}
                            className="flex items-center gap-1.5"
                        >
                            <span className="text-xs font-semibold text-white">{defender.name}</span>
                            <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-[10px] font-bold text-white">
                                {defender.name.charAt(0).toUpperCase()}
                            </div>
                        </motion.div>
                    )}

                    {/* Self target */}
                    {isSelfTarget && (
                        <span className="text-[10px] text-gray-500 italic">self</span>
                    )}
                </div>

                {/* Card Info */}
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className={clsx(
                        "rounded-lg border px-2.5 py-1.5 text-center",
                        "bg-black/30",
                        getRarityBorder(lastAction.cardRarity)
                    )}
                >
                    <div className="text-xs font-bold text-white">{lastAction.cardName}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">{lastAction.cardDescription}</div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
