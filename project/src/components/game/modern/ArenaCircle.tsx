import { useEffect, useState } from 'react';
import { Card, Party, Player } from '../../../types/game';
import { ModernPlayerAvatar } from './ModernPlayerAvatar';
import { animate, AnimatePresence, motion, useMotionValue } from 'framer-motion';
import { Droplets, Heart, Sparkles, Sword, Target, Wine, Zap } from 'lucide-react';

interface ArenaCircleProps {
    players: Player[];
    currentPlayer: Player;
    currentTurn: string;
    selectedCard: Card | null;
    lastAction?: Party['lastAction'];
    isCurrentTurn: boolean;
    drunkThreshold: number;
    onTargetSelect: (targetId: string) => Promise<void>;
}

const ACTION_ICON_MAP: Record<string, { icon: typeof Sword; color: string }> = {
    damage: { icon: Sword, color: 'text-red-400' },
    aoeDamage: { icon: Sword, color: 'text-red-400' },
    heal: { icon: Heart, color: 'text-green-400' },
    manaRefill: { icon: Heart, color: 'text-green-400' },
    potionBuff: { icon: Heart, color: 'text-green-400' },
    manaDrain: { icon: Zap, color: 'text-yellow-400' },
    manaBurn: { icon: Zap, color: 'text-yellow-400' },
    challenge: { icon: Target, color: 'text-orange-400' },
    forceDrink: { icon: Wine, color: 'text-amber-400' },
};

function ActionIcon({ type, size = 'w-6 h-6' }: { type: string; size?: string }) {
    const entry = ACTION_ICON_MAP[type] || { icon: Sparkles, color: 'text-purple-400' };
    const Icon = entry.icon;
    return <Icon className={`${size} ${entry.color}`} />;
}

const RADIUS = 68;

function getOpponentAngle(index: number, count: number): number {
    if (count === 1) return 0;
    if (count === 2) return index === 0 ? 320 : 40;
    if (count === 3) return [300, 0, 60][index];
    const step = 160 / (count - 1);
    return (280 + step * index) % 360;
}

function angleToXY(deg: number) {
    const rad = (deg * Math.PI) / 180;
    return { x: Math.sin(rad) * RADIUS, y: -Math.cos(rad) * RADIUS };
}

function formatNumber(value: number) {
    const rounded = Number(value.toFixed(1));
    return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1);
}

function formatSigned(value: number) {
    const rounded = Number(value.toFixed(1));
    return `${rounded > 0 ? '+' : ''}${formatNumber(rounded)}`;
}

export function ArenaCircle({
    players,
    currentPlayer,
    currentTurn,
    selectedCard,
    lastAction,
    isCurrentTurn,
    drunkThreshold,
    onTargetSelect,
}: ArenaCircleProps) {
    const opponents = players.filter((player) => player.id !== currentPlayer.id);
    const total = players.length;

    const youPos = angleToXY(180);
    const OFFSET_Y = -15;
    const BOX_SIZE = RADIUS * 2 + 130;
    const half = BOX_SIZE / 2;

    const posOf = (id: string) => {
        if (id === currentPlayer.id) return youPos;
        const idx = opponents.findIndex((player) => player.id === id);
        return idx >= 0 ? angleToXY(getOpponentAngle(idx, total - 1)) : null;
    };

    const atkPos = lastAction?.playerId ? posOf(lastAction.playerId) : null;
    const tgtPos = lastAction?.targetId ? posOf(lastAction.targetId) : null;
    const hasLine = atkPos && tgtPos && lastAction?.playerId !== lastAction?.targetId;

    const attackerName = lastAction?.playerId
        ? players.find((player) => player.id === lastAction.playerId)?.name ?? '--'
        : '--';
    const targetName = lastAction?.targetId
        ? players.find((player) => player.id === lastAction.targetId)?.name ?? '--'
        : '--';

    const targetDamage = typeof lastAction?.targetDamage === 'number' ? lastAction.targetDamage : null;
    const targetManaDelta = typeof lastAction?.targetManaDelta === 'number' ? lastAction.targetManaDelta : null;
    const targetManaIntakeDelta = typeof lastAction?.targetManaIntakeDelta === 'number'
        ? lastAction.targetManaIntakeDelta
        : null;
    const manaCost = typeof lastAction?.manaCost === 'number' ? lastAction.manaCost : null;

    let targetDeltaLabel = '--';
    let targetDeltaTone = 'text-gray-300';

    if (targetDamage !== null && targetDamage > 0) {
        targetDeltaLabel = `-${formatNumber(targetDamage)}`;
        targetDeltaTone = 'text-red-300';
    } else if (targetManaDelta !== null) {
        targetDeltaLabel = formatSigned(targetManaDelta);
        targetDeltaTone = targetManaDelta < 0 ? 'text-red-300' : targetManaDelta > 0 ? 'text-green-300' : 'text-gray-300';
    } else if (targetManaIntakeDelta !== null) {
        targetDeltaLabel = `I ${formatSigned(targetManaIntakeDelta)}`;
        targetDeltaTone = targetManaIntakeDelta > 0 ? 'text-amber-300' : 'text-gray-300';
    }

    const [showProjectile, setShowProjectile] = useState(false);
    const projX = useMotionValue(0);
    const projY = useMotionValue(0);

    useEffect(() => {
        if (!hasLine || !atkPos || !tgtPos || !lastAction) return;

        const ax = atkPos.x + half;
        const ay = atkPos.y + half + OFFSET_Y;
        const tx = tgtPos.x + half;
        const ty = tgtPos.y + half + OFFSET_Y;

        projX.set(ax);
        projY.set(ay);
        setShowProjectile(true);

        const ctrlX = animate(projX, tx, { duration: 0.45, ease: 'easeInOut' });
        const ctrlY = animate(projY, ty, { duration: 0.45, ease: 'easeInOut' });

        const timer = setTimeout(() => setShowProjectile(false), 500);
        return () => {
            ctrlX.stop();
            ctrlY.stop();
            clearTimeout(timer);
        };
    }, [hasLine, atkPos?.x, atkPos?.y, tgtPos?.x, tgtPos?.y, half, OFFSET_Y, lastAction?.cardId, projX, projY]);

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            <div className="relative" style={{ width: BOX_SIZE, height: BOX_SIZE }}>
                <AnimatePresence>
                    {hasLine && lastAction && (
                        <motion.svg
                            key={`line-${lastAction.cardId}`}
                            className="absolute inset-0 w-full h-full pointer-events-none z-20"
                            style={{ overflow: 'visible' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, transition: { duration: 0.8 } }}
                        >
                            <defs>
                                <linearGradient id="atkLine" x1="0%" y1="0%" x2="100%">
                                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                                    <stop offset="100%" stopColor="#f97316" stopOpacity="0.5" />
                                </linearGradient>
                                <filter id="lineGlow">
                                    <feGaussianBlur stdDeviation="4" result="b" />
                                    <feMerge>
                                        <feMergeNode in="b" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>
                            <motion.line
                                x1={atkPos!.x + half}
                                y1={atkPos!.y + half + OFFSET_Y}
                                x2={tgtPos!.x + half}
                                y2={tgtPos!.y + half + OFFSET_Y}
                                stroke="url(#atkLine)"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                filter="url(#lineGlow)"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.4, ease: 'easeOut' }}
                            />
                        </motion.svg>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showProjectile && lastAction && (
                        <motion.div
                            className="absolute z-40 pointer-events-none"
                            style={{ x: projX, y: projY, translateX: '-50%', translateY: '-50%' }}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 2, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            <div className="w-8 h-8 rounded-full bg-black/70 border border-red-500/40 flex items-center justify-center shadow-[0_0_12px_rgba(239,68,68,0.5)]">
                                <ActionIcon type={lastAction.cardType} size="w-4 h-4" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {!showProjectile && lastAction && tgtPos && (
                        <motion.div
                            key={`burst-${lastAction.cardId}`}
                            className="absolute z-30 pointer-events-none"
                            style={{
                                left: tgtPos.x + half,
                                top: tgtPos.y + half + OFFSET_Y,
                                translateX: '-50%',
                                translateY: '-50%',
                            }}
                            initial={{ scale: 0.3, opacity: 1 }}
                            animate={{ scale: 2.5, opacity: 0 }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                        >
                            <div className="w-10 h-10 rounded-full bg-red-500/30 border border-red-400/20" />
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {lastAction && tgtPos && targetDamage !== null && targetDamage > 0 && (
                        <motion.div
                            key={`dmg-${lastAction.cardId}`}
                            className="absolute z-50 pointer-events-none whitespace-nowrap"
                            style={{
                                left: tgtPos.x + half + 28,
                                top: tgtPos.y + half + OFFSET_Y - 16,
                            }}
                            initial={{ opacity: 0, y: 0, scale: 0.6 }}
                            animate={{ opacity: 1, y: -12, scale: 1 }}
                            exit={{ opacity: 0, y: -28, scale: 0.8 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                        >
                            <span className="text-xs font-bold text-red-400 drop-shadow-[0_0_6px_rgba(239,68,68,0.6)]">
                                -{formatNumber(targetDamage)}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    {lastAction && (
                        <motion.div
                            key={`center-${lastAction.cardId}`}
                            className="absolute z-40 pointer-events-none"
                            style={{ left: half, top: half + OFFSET_Y, translateX: '-50%', translateY: '-50%' }}
                            initial={{ scale: 0, opacity: 0, y: 8 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.85, opacity: 0, y: -8 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 24, delay: 0.2 }}
                        >
                            <div className="min-w-[200px] max-w-[230px] rounded-2xl border border-gray-700/70 bg-gray-950/85 px-3 py-2 backdrop-blur-sm shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-[9px] uppercase tracking-wider text-gray-500">
                                            {lastAction.cardType}
                                        </p>
                                        <p className="text-xs font-semibold text-white truncate">
                                            {lastAction.cardName}
                                        </p>
                                    </div>
                                    <div className="shrink-0 flex items-center gap-1 rounded-full border border-blue-500/40 bg-blue-950/50 px-2 py-1">
                                        <Droplets className="w-3 h-3 text-blue-300" />
                                        <span className="text-[11px] font-semibold text-blue-200">
                                            {manaCost !== null ? formatNumber(manaCost) : '--'}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-2 grid grid-cols-2 gap-2">
                                    <div className="flex items-center gap-1.5 rounded-lg border border-gray-700/80 bg-gray-900/60 px-2 py-1">
                                        <Sword className="w-3 h-3 text-red-300 shrink-0" />
                                        <span className="text-[10px] text-gray-300 truncate">
                                            {attackerName}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 rounded-lg border border-gray-700/80 bg-gray-900/60 px-2 py-1">
                                        <Target className="w-3 h-3 text-rose-300 shrink-0" />
                                        <span className="text-[10px] text-gray-400 truncate">
                                            {targetName}
                                        </span>
                                        <span className={`ml-auto text-[10px] font-bold ${targetDeltaTone}`}>
                                            {targetDeltaLabel}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {opponents.map((player, index) => {
                    const pos = angleToXY(getOpponentAngle(index, total - 1));
                    return (
                        <motion.div
                            key={player.id}
                            className="absolute z-20"
                            style={{
                                left: pos.x + half,
                                top: pos.y + half + OFFSET_Y,
                                translateX: '-50%',
                                translateY: '-50%',
                            }}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                                type: 'spring',
                                stiffness: 260,
                                damping: 20,
                                delay: 0.1 + index * 0.08,
                            }}
                        >
                            <ModernPlayerAvatar
                                player={player}
                                isCurrentTurn={player.id === currentTurn}
                                isTargetable={Boolean(
                                    selectedCard?.requiresTarget &&
                                    (selectedCard.effect.type === 'manaRefill' || player.id !== currentPlayer.id)
                                )}
                                isDrunk={player.isDrunk}
                                drunkThreshold={drunkThreshold}
                                onSelect={selectedCard && !selectedCard.isChallenge ? () => onTargetSelect(player.id) : undefined}
                                compact
                            />
                        </motion.div>
                    );
                })}

                <motion.div
                    className="absolute z-20"
                    style={{
                        left: youPos.x + half,
                        top: youPos.y + half + OFFSET_Y,
                        translateX: '-50%',
                        translateY: '-50%',
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.05 }}
                >
                    <ModernPlayerAvatar
                        player={currentPlayer}
                        isCurrentTurn={isCurrentTurn}
                        isTargetable={false}
                        isDrunk={currentPlayer.isDrunk}
                        drunkThreshold={drunkThreshold}
                        isYou
                        compact
                    />
                </motion.div>
            </div>

            {!lastAction && (
                <motion.div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <span className="text-xs text-gray-700 font-medium" style={{ marginTop: OFFSET_Y }}>
                        {isCurrentTurn ? 'Your turn — play a card!' : 'Waiting...'}
                    </span>
                </motion.div>
            )}
        </div>
    );
}
