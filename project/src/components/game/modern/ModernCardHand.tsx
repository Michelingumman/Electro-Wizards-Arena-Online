import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, GameMode } from '../../../types/game';
import clsx from 'clsx';
import { Beer, Droplets, Flame, Shield, ScrollText, Sparkles, Target, Wrench, Zap } from 'lucide-react';

interface ModernCardHandProps {
    cards: Card[];
    onPlayCard: (card: Card) => void;
    onCancelSelection?: () => void;
    disabled: boolean;
    currentMana: number;
    selectedCard: Card | null;
    gameMode?: GameMode;
    godMode?: boolean;
    onGodModePick?: (card: Card) => void;
    canCupSipsLeft?: number;
    canCupSipsPerCan?: number;
}

export function ModernCardHand({
    cards,
    onPlayCard,
    onCancelSelection,
    disabled,
    currentMana,
    selectedCard,
    gameMode = 'afterski',
    godMode = false,
    onGodModePick,
    canCupSipsLeft,
    canCupSipsPerCan,
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
        if (selectedCard) setActiveCardId(null);
    }, [selectedCard?.id]);

    const cardCount = cards.length;
    const screenW = typeof window !== 'undefined' ? window.innerWidth : 390;
    const isCanCup = gameMode === 'can-cup';
    const CARD_WIDTH = cardCount <= 4
        ? Math.min(188, Math.max(146, screenW * 0.39))
        : cardCount === 5
            ? Math.min(170, Math.max(132, screenW * 0.34))
            : Math.min(150, Math.max(118, screenW * 0.29));
    const CENTER_INDEX = (cardCount - 1) / 2;
    const ANGLE_SPREAD = cardCount <= 4 ? 10 : cardCount === 5 ? 8 : 6;
    const X_SPREAD = cardCount <= 4 ? CARD_WIDTH * 0.5 : cardCount === 5 ? CARD_WIDTH * 0.45 : CARD_WIDTH * 0.38;
    const BASE_Y = isCanCup
        ? (cardCount <= 4 ? 72 : 82)
        : (cardCount <= 4 ? 55 : 64);
    const POPUP_Y = isCanCup ? -148 : -160;
    const FAN_HEIGHT = isCanCup ? 350 : 390;
    const BASE_CARD_HEIGHT = isCanCup ? 210 : 204;
    const EXPANDED_CARD_HEIGHT = BASE_CARD_HEIGHT + (isCanCup ? 68 : 60);
    const hasSelection = Boolean(activeCardId);

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
            case 'canCupSip':
            case 'canCupAoESip':
            case 'canCupDoubleTrouble':
            case 'canCupBottomsUpPrep':
            case 'canCupBottenUpp':
                return <Flame className={cls} />;
            case 'canCupWater':
            case 'canCupTopUp':
                return <Droplets className={cls} />;
            case 'canCupDeflect':
            case 'canCupSwap':
            case 'canCupReflect':
                return <Shield className={cls} />;
            case 'canCupVampire':
                return <Zap className={cls} />;
            case 'roulette':
                return <ScrollText className={cls} />;
            default:
                return <Sparkles className={cls} />;
        }
    };

    const getRarityStyles = (rarity: string) => {
        const canCup = gameMode === 'can-cup';
        switch (rarity) {
            case 'common':
                return canCup
                    ? { bg: 'from-slate-800 to-slate-900', border: 'border-cyan-600/35' }
                    : { bg: 'from-gray-800 to-gray-900', border: 'border-gray-700/60' };
            case 'rare':
                return canCup
                    ? { bg: 'from-teal-900/80 to-slate-900', border: 'border-teal-500/35' }
                    : { bg: 'from-blue-900/80 to-gray-900', border: 'border-blue-500/30' };
            case 'epic':
                return canCup
                    ? { bg: 'from-indigo-900/80 to-violet-950', border: 'border-indigo-400/35' }
                    : { bg: 'from-purple-900/80 to-indigo-950', border: 'border-purple-500/30' };
            case 'legendary':
                return { bg: 'from-amber-900/70 to-red-950', border: 'border-amber-500/40' };
            default:
                return { bg: 'from-gray-800 to-gray-900', border: 'border-gray-700/60' };
        }
    };

    return (
        <>
            <AnimatePresence>
                {hasSelection && (
                    <motion.button
                        key="collapse-active-card"
                        type="button"
                        aria-label="Collapse selected card"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-transparent"
                        onClick={() => {
                            setActiveCardId(null);
                        }}
                    />
                )}
            </AnimatePresence>

            <div
                className={clsx(
                    'fixed bottom-0 left-0 right-0 pointer-events-none flex justify-center items-end z-50 transition-all duration-300',
                    disabled && 'saturate-[0.7] brightness-[0.85]'
                )}
                style={{ height: `${FAN_HEIGHT}px` }}
            >
                <div className="relative w-full flex justify-center items-end" style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
                    <AnimatePresence>
                        {cards.map((card, index) => {
                            const isActive = activeCardId === card.id;
                            const isTargetSelected = selectedCard?.id === card.id;
                            const isNew = newCardIds.has(card.id);
                            const isTopUpAtMax = gameMode === 'can-cup'
                                && card.effect.type === 'canCupTopUp'
                                && typeof canCupSipsLeft === 'number'
                                && typeof canCupSipsPerCan === 'number'
                                && canCupSipsLeft >= canCupSipsPerCan;
                            const canPlay = gameMode === 'can-cup'
                                ? !disabled && !selectedCard && !isTopUpAtMax
                                : currentMana >= card.manaCost && !disabled && !selectedCard;

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
                                        isTargetSelected &&
                                        'ring-2 ring-yellow-400/90 ring-offset-1 ring-offset-gray-900 rounded-xl'
                                    )}
                                    style={{
                                        width: CARD_WIDTH,
                                        height: isActive ? EXPANDED_CARD_HEIGHT : BASE_CARD_HEIGHT,
                                        filter:
                                            !canPlay && !isActive && !disabled
                                                ? 'brightness(0.55) grayscale(0.25)'
                                                : undefined,
                                        boxShadow: isNew ? '0 0 20px rgba(250, 204, 21, 0.45)' : undefined,
                                    }}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        if (selectedCard) {
                                            if (isTargetSelected && onCancelSelection) {
                                                onCancelSelection();
                                            }
                                            return;
                                        }

                                        if (isActive) {
                                            setActiveCardId(null);
                                            return;
                                        }

                                        if (!isActive) {
                                            setActiveCardId(card.id);
                                        }
                                    }}
                                >
                                    <div
                                        className={clsx(
                                            'w-full h-full rounded-xl overflow-hidden border backdrop-blur-sm',
                                            `bg-gradient-to-b ${rarity.bg} ${rarity.border}`
                                        )}
                                    >
                                        <div className="h-full flex flex-col">
                                            <div className="px-3 py-2.5 min-h-[46px] flex items-start justify-between bg-black/45 gap-2 shrink-0">
                                                <span className="min-h-[30px] font-bold text-[12px] leading-tight text-white/95 line-clamp-2">
                                                    {card.name}
                                                </span>
                                                <div
                                                    className={clsx(
                                                        'shrink-0 mt-0.5 px-1.5 h-6 rounded-full flex items-center justify-center gap-1 text-[10px] font-bold text-white',
                                                        gameMode === 'can-cup' ? 'bg-amber-600/90' : 'bg-blue-600/90'
                                                    )}
                                                >
                                                    {gameMode === 'can-cup' && <Beer className="w-3 h-3" />}
                                                    {card.sipCost ?? card.manaCost}
                                                    {gameMode !== 'can-cup' && <Zap className="w-2.5 h-2.5 opacity-60" />}
                                                </div>
                                            </div>

                                            <div className="h-16 w-full bg-black/35 flex items-center justify-center shrink-0">
                                                {getEffectIcon(card.effect?.type || card.type)}
                                            </div>

                                            <div className="px-2.5 py-2 bg-black/35 flex-1 flex flex-col justify-between min-h-0">
                                                <p className={clsx(
                                                    'text-[10px] leading-snug text-gray-300 whitespace-pre-line',
                                                    isActive
                                                        ? 'line-clamp-none overflow-y-auto pr-1'
                                                        : 'line-clamp-3 min-h-[40px]'
                                                )}>
                                                    {card.description}
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[8px] text-gray-500 uppercase tracking-wider">
                                                        {card.rarity}
                                                    </span>
                                                    {isActive && (
                                                        <div className="flex items-center gap-1.5">
                                                            {godMode && onGodModePick && (
                                                                <button
                                                                    type="button"
                                                                    onClick={(event) => {
                                                                        event.stopPropagation();
                                                                        setActiveCardId(null);
                                                                        onGodModePick(card);
                                                                    }}
                                                                    className="text-[9px] rounded-full px-2 py-1 font-semibold tracking-wide uppercase bg-amber-600/90 text-white hover:bg-amber-500 flex items-center gap-0.5"
                                                                >
                                                                    <Wrench className="w-2.5 h-2.5" /> Swap
                                                                </button>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={(event) => {
                                                                    event.stopPropagation();
                                                                    if (!canPlay) return;
                                                                    setActiveCardId(null);
                                                                    onPlayCard(card);
                                                                }}
                                                                disabled={!canPlay}
                                                                className={clsx(
                                                                    'text-[9px] rounded-full px-2.5 py-1 font-semibold tracking-wide uppercase transition-all',
                                                                    canPlay
                                                                        ? gameMode === 'can-cup'
                                                                            ? 'bg-cyan-600/90 text-white hover:bg-cyan-500'
                                                                            : 'bg-purple-600/90 text-white hover:bg-purple-500'
                                                                        : 'bg-gray-700/70 text-gray-400 cursor-not-allowed'
                                                                )}
                                                            >
                                                                {canPlay ? 'Play' : disabled ? 'Wait turn' : (gameMode === 'can-cup' ? 'Play' : 'No mana')}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
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
