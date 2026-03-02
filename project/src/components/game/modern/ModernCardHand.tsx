import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../../types/game';
import clsx from 'clsx';
import { Zap, Target, ScrollText, Sparkles, Droplets, Flame } from 'lucide-react';

interface ModernCardHandProps {
    cards: Card[];
    onPlayCard: (card: Card) => void;
    disabled: boolean;
    currentMana: number;
    selectedCard: Card | null;
}

export function ModernCardHand({
    cards,
    onPlayCard,
    disabled,
    currentMana,
    selectedCard
}: ModernCardHandProps) {
    const [activeCardId, setActiveCardId] = useState<string | null>(null);
    const prevCardIdsRef = useRef<Set<string>>(new Set(cards.map(c => c.id)));
    const [newCardIds, setNewCardIds] = useState<Set<string>>(new Set());

    // Detect new cards entering the hand
    useEffect(() => {
        const currentIds = new Set(cards.map(c => c.id));
        const incoming = new Set<string>();
        currentIds.forEach(id => {
            if (!prevCardIdsRef.current.has(id)) incoming.add(id);
        });
        if (incoming.size > 0) {
            setNewCardIds(incoming);
            const timer = setTimeout(() => setNewCardIds(new Set()), 800);
            return () => clearTimeout(timer);
        }
        prevCardIdsRef.current = currentIds;
    }, [cards]);

    // Responsive sizing
    const cardCount = cards.length;
    const screenW = typeof window !== 'undefined' ? window.innerWidth : 390;
    const CARD_WIDTH = Math.min(110, (screenW - 32) / Math.max(cardCount, 3));
    const CENTER_INDEX = (cardCount - 1) / 2;
    const ANGLE_SPREAD = cardCount > 5 ? 7 : cardCount > 3 ? 9 : 11;
    const X_SPREAD = cardCount > 5 ? 16 : cardCount > 3 ? 20 : 26;
    const BASE_Y = 35;

    const getEffectIcon = (type: string) => {
        const cls = "w-5 h-5 text-gray-500";
        switch (type) {
            case 'damage': case 'aoeDamage': case 'manaBurn': return <Flame className={cls} />;
            case 'heal': case 'manaRefill': case 'potionBuff': return <Droplets className={cls} />;
            case 'challenge': return <Target className={cls} />;
            case 'manaDrain': return <Zap className={cls} />;
            case 'roulette': return <ScrollText className={cls} />;
            default: return <Sparkles className={cls} />;
        }
    };

    const getRarityStyles = (rarity: string) => {
        switch (rarity) {
            case 'common': return { bg: 'from-gray-800 to-gray-900', border: 'border-gray-700/60' };
            case 'rare': return { bg: 'from-blue-900/80 to-gray-900', border: 'border-blue-500/30' };
            case 'epic': return { bg: 'from-purple-900/80 to-indigo-950', border: 'border-purple-500/30' };
            case 'legendary': return { bg: 'from-amber-900/70 to-red-950', border: 'border-amber-500/40' };
            default: return { bg: 'from-gray-800 to-gray-900', border: 'border-gray-700/60' };
        }
    };

    const handleBackdropClick = useCallback(() => setActiveCardId(null), []);

    useEffect(() => {
        if (!selectedCard) setActiveCardId(null);
    }, [selectedCard]);

    return (
        <>
            {/* Backdrop */}
            <AnimatePresence>
                {activeCardId && !selectedCard && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-black/30"
                        onClick={handleBackdropClick}
                        onTouchStart={handleBackdropClick}
                    />
                )}
            </AnimatePresence>

            {/* Floating tooltip for active card */}
            <AnimatePresence>
                {activeCardId && (
                    <motion.div
                        key="tooltip"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-[200px] left-4 right-4 z-[60] flex justify-center pointer-events-none"
                    >
                        {(() => {
                            const card = cards.find(c => c.id === activeCardId);
                            if (!card) return null;
                            const canPlay = currentMana >= card.manaCost && !disabled;
                            const rarity = getRarityStyles(card.rarity);
                            return (
                                <div className={clsx(
                                    "max-w-[260px] w-full rounded-xl border p-3 shadow-2xl pointer-events-auto",
                                    `bg-gradient-to-b ${rarity.bg} ${rarity.border}`
                                )}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm font-bold text-white">{card.name}</span>
                                        <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600/80 text-[10px] font-bold text-white">{card.manaCost}</span>
                                    </div>
                                    <p className="text-xs text-gray-300 leading-snug mb-3">{card.description}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">{card.rarity} · {card.type.replace('-', ' ')}</span>
                                        {canPlay && (
                                            <button
                                                onClick={() => { setActiveCardId(null); onPlayCard(card); }}
                                                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-xs font-bold shadow-lg shadow-purple-500/30 active:scale-95 transition-transform"
                                            >
                                                PLAY
                                            </button>
                                        )}
                                        {!canPlay && disabled && (
                                            <span className="text-[10px] text-gray-600 italic">Not your turn</span>
                                        )}
                                        {!canPlay && !disabled && (
                                            <span className="text-[10px] text-red-500">Not enough mana</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Card Fan */}
            <div
                className={clsx(
                    "fixed bottom-0 left-0 right-0 pointer-events-none flex justify-center items-end z-50 transition-all duration-300",
                    disabled && "saturate-[0.5] brightness-[0.7]"
                )}
                style={{ height: '180px' }}
            >
                <div className="relative w-full flex justify-center items-end pb-3">
                    <AnimatePresence>
                        {cards.map((card, index) => {
                            const isActive = activeCardId === card.id || selectedCard?.id === card.id;
                            const isNew = newCardIds.has(card.id);
                            const canPlay = currentMana >= card.manaCost && !disabled;

                            const offset = index - CENTER_INDEX;
                            const angle = offset * ANGLE_SPREAD;
                            const yDrop = Math.abs(offset) * 8 + BASE_Y;
                            const rarity = getRarityStyles(card.rarity);

                            return (
                                <motion.div
                                    key={card.id}
                                    layout
                                    initial={isNew
                                        ? { opacity: 0, y: 200, scale: 1.3, rotate: 0 }
                                        : { opacity: 0, y: 200, rotate: angle }
                                    }
                                    animate={{
                                        opacity: 1,
                                        y: isActive ? -60 : yDrop,
                                        x: isActive ? 0 : offset * X_SPREAD,
                                        rotate: isActive ? 0 : angle,
                                        scale: isActive ? 1.15 : 1,
                                        zIndex: isActive ? 100 : 10 + index,
                                    }}
                                    exit={{ opacity: 0, scale: 0.5, y: -80 }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 350,
                                        damping: 28,
                                        mass: 0.6
                                    }}
                                    className={clsx(
                                        "absolute origin-bottom cursor-pointer pointer-events-auto touch-none select-none",
                                        selectedCard?.id === card.id && "ring-2 ring-yellow-400/80 ring-offset-1 ring-offset-gray-900 rounded-lg"
                                    )}
                                    style={{
                                        width: CARD_WIDTH,
                                        filter: !canPlay && !isActive && !disabled ? 'brightness(0.45) grayscale(0.5)' : undefined,
                                        boxShadow: isNew ? '0 0 20px rgba(250, 204, 21, 0.5)' : undefined
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // Always allow tapping to view, even when disabled
                                        if (!isActive) {
                                            setActiveCardId(card.id);
                                        } else if (canPlay) {
                                            setActiveCardId(null);
                                            onPlayCard(card);
                                        }
                                    }}
                                >
                                    <div className={clsx(
                                        "w-full rounded-lg overflow-hidden border",
                                        `bg-gradient-to-b ${rarity.bg} ${rarity.border}`
                                    )}>
                                        {/* Mini header */}
                                        <div className="px-1.5 py-1 flex justify-between items-center bg-black/50">
                                            <span className="font-bold text-[9px] leading-tight truncate pr-1 text-white/90">{card.name}</span>
                                            <span className="shrink-0 w-4 h-4 rounded-full bg-blue-600/80 flex items-center justify-center text-[8px] font-bold text-white">{card.manaCost}</span>
                                        </div>
                                        {/* Icon */}
                                        <div className="h-9 w-full bg-black/40 flex items-center justify-center">
                                            {getEffectIcon(card.effect?.type || card.type)}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </>
    );
}
