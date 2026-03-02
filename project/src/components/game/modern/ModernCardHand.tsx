import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card } from '../../../types/game';
import clsx from 'clsx';
import { Droplets, Flame, ScrollText, Sparkles, Target, Zap } from 'lucide-react';

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
    selectedCard,
}: ModernCardHandProps) {
    const [activeCardId, setActiveCardId] = useState<string | null>(null);
    const prevCardIdsRef = useRef<Set<string>>(new Set(cards.map((card) => card.id)));
    const [newCardIds, setNewCardIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const currentIds = new Set(cards.map((card) => card.id));
        const incoming = new Set<string>();

        currentIds.forEach((id) => {
            if (!prevCardIdsRef.current.has(id)) incoming.add(id);
        });

        if (incoming.size > 0) {
            setNewCardIds(incoming);
            const timer = setTimeout(() => setNewCardIds(new Set()), 800);
            prevCardIdsRef.current = currentIds;
            return () => clearTimeout(timer);
        }

        prevCardIdsRef.current = currentIds;
    }, [cards]);

    useEffect(() => {
        if (!selectedCard) setActiveCardId(null);
    }, [selectedCard]);

    const cardCount = cards.length;
    const screenW = typeof window !== 'undefined' ? window.innerWidth : 390;
    const maxWidth = cardCount <= 4 ? 170 : cardCount === 5 ? 150 : 132;
    const CARD_WIDTH = Math.min(maxWidth, Math.max(118, (screenW - 20) / Math.max(cardCount, 4)));
    const CENTER_INDEX = (cardCount - 1) / 2;
    const ANGLE_SPREAD = cardCount <= 4 ? 11 : cardCount === 5 ? 8 : 6;
    const X_SPREAD = cardCount <= 4 ? CARD_WIDTH * 0.58 : cardCount === 5 ? CARD_WIDTH * 0.5 : CARD_WIDTH * 0.42;
    const BASE_Y = cardCount <= 4 ? 88 : 96;
    const POPUP_Y = -112;

    const getEffectIcon = (type: string) => {
        const cls = 'w-6 h-6 text-gray-400';
        switch (type) {
            case 'damage':
            case 'aoeDamage':
            case 'manaBurn':
                return <Flame className={cls} />;
            case 'heal':
            case 'manaRefill':
            case 'potionBuff':
                return <Droplets className={cls} />;
            case 'challenge':
                return <Target className={cls} />;
            case 'manaDrain':
                return <Zap className={cls} />;
            case 'roulette':
                return <ScrollText className={cls} />;
            default:
                return <Sparkles className={cls} />;
        }
    };

    const getRarityStyles = (rarity: string) => {
        switch (rarity) {
            case 'common':
                return { bg: 'from-gray-800 to-gray-900', border: 'border-gray-700/60' };
            case 'rare':
                return { bg: 'from-blue-900/80 to-gray-900', border: 'border-blue-500/30' };
            case 'epic':
                return { bg: 'from-purple-900/80 to-indigo-950', border: 'border-purple-500/30' };
            case 'legendary':
                return { bg: 'from-amber-900/70 to-red-950', border: 'border-amber-500/40' };
            default:
                return { bg: 'from-gray-800 to-gray-900', border: 'border-gray-700/60' };
        }
    };

    return (
        <div
            className={clsx(
                'fixed bottom-0 left-0 right-0 pointer-events-none flex justify-center items-end z-50 transition-all duration-300',
                disabled && 'saturate-[0.7] brightness-[0.85]'
            )}
            style={{ height: '340px' }}
        >
            <div className="relative w-full flex justify-center items-end pb-4">
                <AnimatePresence>
                    {cards.map((card, index) => {
                        const isActive = activeCardId === card.id || selectedCard?.id === card.id;
                        const isNew = newCardIds.has(card.id);
                        const canPlay = currentMana >= card.manaCost && !disabled;

                        const offset = index - CENTER_INDEX;
                        const angle = offset * ANGLE_SPREAD;
                        const yDrop = Math.abs(offset) * 10 + BASE_Y;
                        const rarity = getRarityStyles(card.rarity);

                        return (
                            <motion.div
                                key={card.id}
                                layout
                                initial={
                                    isNew
                                        ? { opacity: 0, y: 220, scale: 1.25, rotate: 0 }
                                        : { opacity: 0, y: 220, rotate: angle }
                                }
                                animate={{
                                    opacity: 1,
                                    y: isActive ? POPUP_Y : yDrop,
                                    x: isActive ? offset * 8 : offset * X_SPREAD,
                                    rotate: isActive ? offset * 1.5 : angle,
                                    scale: isActive ? 1.2 : 1,
                                    zIndex: isActive ? 120 : 10 + index,
                                }}
                                exit={{ opacity: 0, scale: 0.6, y: -90 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 300,
                                    damping: 24,
                                    mass: 0.7,
                                }}
                                className={clsx(
                                    'absolute origin-bottom cursor-pointer pointer-events-auto touch-none select-none',
                                    selectedCard?.id === card.id &&
                                        'ring-2 ring-yellow-400/90 ring-offset-1 ring-offset-gray-900 rounded-xl'
                                )}
                                style={{
                                    width: CARD_WIDTH,
                                    filter:
                                        !canPlay && !isActive && !disabled
                                            ? 'brightness(0.55) grayscale(0.25)'
                                            : undefined,
                                    boxShadow: isNew ? '0 0 20px rgba(250, 204, 21, 0.45)' : undefined,
                                }}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    if (!isActive) {
                                        setActiveCardId(card.id);
                                        return;
                                    }

                                    if (canPlay) {
                                        setActiveCardId(null);
                                        onPlayCard(card);
                                    }
                                }}
                            >
                                <div
                                    className={clsx(
                                        'w-full rounded-xl overflow-hidden border backdrop-blur-sm',
                                        `bg-gradient-to-b ${rarity.bg} ${rarity.border}`
                                    )}
                                >
                                    <div className="px-3 py-2.5 flex items-start justify-between bg-black/45 gap-2">
                                        <span className="font-bold text-[12px] leading-tight text-white/95 line-clamp-2">
                                            {card.name}
                                        </span>
                                        <span className="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-blue-600/90 flex items-center justify-center text-[10px] font-bold text-white">
                                            {card.manaCost}
                                        </span>
                                    </div>

                                    <div className="h-16 w-full bg-black/35 flex items-center justify-center">
                                        {getEffectIcon(card.effect?.type || card.type)}
                                    </div>

                                    <div className="px-2.5 py-2 bg-black/35 space-y-1.5">
                                        <p className="text-[10px] leading-snug text-gray-300 line-clamp-2">
                                            {card.description}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[8px] text-gray-500 uppercase tracking-wider">
                                                {card.rarity}
                                            </span>
                                            {isActive && canPlay && (
                                                <span className="text-[8px] rounded-full bg-purple-600/80 px-2 py-0.5 text-white font-semibold tracking-wide uppercase">
                                                    Tap to play
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}
