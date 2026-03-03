import { useState } from 'react';
import { Party } from '../../../types/game';
import { Sword, Heart, Zap, Wine, Target, Sparkles, ChevronDown, ChevronUp, Droplets } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

interface AttackBannerProps {
    lastAction: Party['lastAction'];
    players: Party['players'];
}

export function AttackBanner({ lastAction, players }: AttackBannerProps) {
    const [expanded, setExpanded] = useState(false);

    if (!lastAction) return null;

    const attacker = players.find(p => p.id === lastAction.playerId);
    const target = lastAction.targetId ? players.find(p => p.id === lastAction.targetId) : null;
    if (!attacker) return null;

    const isSelf = lastAction.playerId === lastAction.targetId;
    const affectedIds = lastAction.affectedPlayerIds || [];

    const getActionVerb = (type: string) => {
        switch (type) {
            case 'damage': case 'aoeDamage': return 'attacked';
            case 'heal': case 'manaRefill': case 'potionBuff': return 'healed';
            case 'manaDrain': case 'manaBurn': return 'drained';
            case 'challenge': return 'challenged';
            case 'forceDrink': return 'forced drink on';
            default: return 'used';
        }
    };

    const getActionIcon = (type: string) => {
        const cls = "w-3.5 h-3.5";
        switch (type) {
            case 'damage': case 'aoeDamage': return <Sword className={clsx(cls, "text-red-400")} />;
            case 'heal': case 'manaRefill': case 'potionBuff': return <Heart className={clsx(cls, "text-green-400")} />;
            case 'manaDrain': case 'manaBurn': return <Zap className={clsx(cls, "text-yellow-400")} />;
            case 'challenge': return <Target className={clsx(cls, "text-orange-400")} />;
            case 'forceDrink': return <Wine className={clsx(cls, "text-amber-400")} />;
            default: return <Sparkles className={clsx(cls, "text-purple-400")} />;
        }
    };

    const getAccentColor = (type: string) => {
        switch (type) {
            case 'damage': case 'aoeDamage': return 'border-red-500/30 bg-red-950/40';
            case 'heal': case 'manaRefill': case 'potionBuff': return 'border-green-500/30 bg-green-950/40';
            case 'manaDrain': case 'manaBurn': return 'border-yellow-500/30 bg-yellow-950/40';
            case 'challenge': return 'border-orange-500/30 bg-orange-950/40';
            case 'forceDrink': return 'border-amber-500/30 bg-amber-950/40';
            default: return 'border-purple-500/30 bg-purple-950/40';
        }
    };

    const verb = getActionVerb(lastAction.cardType);
    const affectedOthers = affectedIds.filter((id) => id !== attacker.id);
    const explicitGroupTypes = new Set([
        'aoeDamage',
        'aoeManaBurst',
        'manaStealAll',
        'manaIntakeOthers',
        'setAllToDrunk',
        'divineIntervention',
        'manaHurricane',
    ]);
    const affectedMany = affectedOthers.length > 1 || explicitGroupTypes.has(lastAction.cardType);
    const includesAttacker = affectedIds.includes(attacker.id);

    let targetText = '';
    if (lastAction.cardId === 'drink') {
        targetText = 'self';
    } else if (affectedMany) {
        targetText = includesAttacker ? 'all players' : 'all opponents';
    } else if (lastAction.targetId && !isSelf) {
        targetText = target?.name || 'target';
    } else if (lastAction.targetId && isSelf && lastAction.cardType === 'forceDrink') {
        targetText = 'self';
    } else if (lastAction.cardType === 'challenge') {
        targetText = 'challenge table';
    }

    const actionPrefix = targetText
        ? `${attacker.name} ${verb} ${targetText} with`
        : `${attacker.name} used`;
    const damageValue =
        typeof lastAction.targetDamage === 'number'
            ? lastAction.targetDamage
            : typeof lastAction.targetManaDelta === 'number' && lastAction.targetManaDelta < 0
                ? Math.abs(lastAction.targetManaDelta)
                : null;
    const manaCost = typeof lastAction.manaCost === 'number' ? lastAction.manaCost : null;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={`${lastAction.playerId}-${lastAction.cardId}`}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className={clsx(
                    "mx-2 rounded-lg border backdrop-blur-sm overflow-hidden cursor-pointer transition-colors",
                    getAccentColor(lastAction.cardType)
                )}
                onClick={() => setExpanded(prev => !prev)}
            >
                {/* Compact banner */}
                <div className="flex items-center gap-1.5 px-3 py-1.5">
                    {getActionIcon(lastAction.cardType)}
                    <span className="text-xs text-white/90 font-medium truncate flex-1">
                        <span className="font-bold">{actionPrefix}</span>
                        {' '}
                        <span className="text-purple-300 italic">{lastAction.cardName}</span>
                    </span>
                    {expanded
                        ? <ChevronUp className="w-3 h-3 text-gray-500 shrink-0" />
                        : <ChevronDown className="w-3 h-3 text-gray-500 shrink-0" />
                    }
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="px-3 pb-2 pt-1 border-t border-white/5">
                                <div className="text-[11px] text-gray-300 leading-relaxed">
                                    {lastAction.cardDescription}
                                </div>
                                <div className="mt-2 flex items-center gap-2 flex-wrap">
                                    <span className="inline-flex items-center gap-1 rounded-full border border-red-400/40 bg-red-950/40 px-2 py-0.5 text-[10px] text-red-200">
                                        <Sword className="w-3 h-3" />
                                        {damageValue !== null ? `Damage ${damageValue}` : 'Damage --'}
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full border border-blue-400/40 bg-blue-950/40 px-2 py-0.5 text-[10px] text-blue-200">
                                        <Droplets className="w-3 h-3" />
                                        {manaCost !== null ? `Mana ${manaCost}` : 'Mana --'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-[9px] text-gray-600 uppercase tracking-wider">
                                        {lastAction.cardRarity} · {lastAction.cardType.replace(/([A-Z])/g, ' $1').trim()}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </AnimatePresence>
    );
}
