import { useEffect, useRef, useState } from 'react';
import { Card, Party, Player, GameMode } from '../../../types/game';
import { ModernPlayerAvatar } from './ModernPlayerAvatar';
import { animate, AnimatePresence, motion, useMotionValue } from 'framer-motion';
import { Sword } from 'lucide-react';
import { GAME_CONFIG } from '../../../config/gameConfig';
import { isCanCupReactionChallengeCard as isCanCupReactionChallengeCardUtil } from '../../../utils/canCupChallengeHelpers';

interface ArenaCircleProps {
    players: Player[];
    currentPlayer: Player;
    currentTurn: string;
    selectedCard: Card | null;
    lastAction?: Party['lastAction'];
    pendingChallenge?: Party['pendingChallenge'];
    pendingCanCupSips?: Party['pendingCanCupSips'];
    canResolvePendingChallenge?: boolean;
    isCurrentTurn: boolean;
    drunkThreshold: number;
    settings?: Party['settings'];
    onTargetSelect: (targetId: string) => Promise<void>;
    onChallengeCardClick?: () => void;
    onReactionReady?: () => Promise<void>;
    onReactionPress?: () => Promise<void>;
    gameMode?: GameMode;
}

function getOpponentAngle(index: number, count: number): number {
    if (count === 1) return 0;
    if (count === 2) return index === 0 ? -70 : 70;
    const start = -140;
    const sweep = 280;
    const step = sweep / (count - 1);
    return start + step * index;
}

function getCanCupOpponentAngle(index: number, count: number): number {
    if (count === 1) return 0;
    if (count === 2) return index === 0 ? -102 : 102;
    const start = -128;
    const sweep = 256;
    const step = sweep / (count - 1);
    return start + step * index;
}

function angleToXY(deg: number, radiusX: number, radiusY: number) {
    const rad = (deg * Math.PI) / 180;
    return { x: Math.sin(rad) * radiusX, y: -Math.cos(rad) * radiusY };
}

function formatNumber(value: number) {
    const rounded = Number(value.toFixed(1));
    return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1);
}

export function ArenaCircle({
    players,
    currentPlayer,
    currentTurn,
    selectedCard,
    lastAction,
    pendingChallenge,
    pendingCanCupSips,
    canResolvePendingChallenge = false,
    isCurrentTurn,
    drunkThreshold,
    settings,
    onTargetSelect,
    onChallengeCardClick,
    onReactionReady,
    onReactionPress,
    gameMode = 'modern',
}: ArenaCircleProps) {
    const opponents = players.filter((player) => player.id !== currentPlayer.id);
    const total = players.length;
    const isCanCup = gameMode === 'can-cup';
    const layoutRef = useRef<HTMLDivElement>(null);
    const [arenaBounds, setArenaBounds] = useState({ width: 360, height: 360 });

    const maxMana = settings?.maxMana ?? GAME_CONFIG.MAX_MANA;
    const decayRate = settings?.manaIntakeDecayRate ?? GAME_CONFIG.MANA_INTAKE_DECAY_RATE;

    const intakeSnapshotRef = useRef<Map<string, number>>(new Map());
    const snapshotTimeRef = useRef<number>(Date.now());
    const [tickNow, setTickNow] = useState(Date.now());

    const intakeKey = players.map((player) => `${player.id}:${player.manaIntake}`).join('|');

    useEffect(() => {
        intakeSnapshotRef.current = new Map(players.map((player) => [player.id, player.manaIntake || 0]));
        snapshotTimeRef.current = Date.now();
        setTickNow(Date.now());
    }, [intakeKey]);

    useEffect(() => {
        const timer = setInterval(() => setTickNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const element = layoutRef.current;
        if (!element) return;

        const updateBounds = () => {
            const rect = element.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) return;
            setArenaBounds({
                width: rect.width,
                height: rect.height,
            });
        };

        updateBounds();

        if (typeof ResizeObserver !== 'undefined') {
            const observer = new ResizeObserver(() => updateBounds());
            observer.observe(element);
            return () => observer.disconnect();
        }

        window.addEventListener('resize', updateBounds);
        return () => window.removeEventListener('resize', updateBounds);
    }, []);

    const getProjectedIntake = (player: Player) => {
        const baseIntake = intakeSnapshotRef.current.get(player.id) ?? player.manaIntake ?? 0;
        if (baseIntake <= 0 || decayRate <= 0) return 0;
        const elapsedSec = (tickNow - snapshotTimeRef.current) / 1000;
        return Math.max(0, baseIntake - (decayRate / 60) * elapsedSec);
    };

    const getSoberSeconds = (intake: number) => {
        if (intake <= 0 || decayRate <= 0) return 0;
        return (intake / decayRate) * 60;
    };

    const BOX_WIDTH = Math.max(260, arenaBounds.width - (isCanCup ? 4 : 14));
    const BOX_HEIGHT = Math.max(220, arenaBounds.height - (isCanCup ? 6 : 20));
    const rawRadiusX = isCanCup
        ? Math.max(68, Math.min(BOX_WIDTH / 2 - 60, 176))
        : Math.max(76, Math.min(142, BOX_WIDTH / 2 - 58));
    const rawRadiusY = isCanCup
        ? Math.max(76, Math.min(BOX_HEIGHT / 2 - 78, 182))
        : Math.max(74, Math.min(136, BOX_HEIGHT / 2 - 52));
    const spreadFactor = total <= 2 ? 0.72 : total === 3 ? 0.8 : 0.92;
    const canCupSpreadX = total <= 2 ? 0.7 : total === 3 ? 0.82 : total === 4 ? 0.9 : 0.96;
    const canCupSpreadY = total <= 2 ? 0.62 : total === 3 ? 0.7 : total === 4 ? 0.78 : 0.88;
    const radiusX = isCanCup
        ? rawRadiusX * canCupSpreadX
        : rawRadiusX * spreadFactor;
    const radiusY = (isCanCup
        ? rawRadiusY * canCupSpreadY
        : rawRadiusY * spreadFactor) * (pendingChallenge ? 0.86 : 1);
    const centerGap = pendingChallenge ? 28 : (isCanCup ? 18 : 12);
    const arenaYOffset = pendingChallenge ? (isCanCup ? 30 : 52) : (isCanCup ? 26 : 72);

    const spreadFromCenter = (point: { x: number; y: number }) => ({
        x: point.x,
        y: point.y + (point.y >= 0 ? centerGap : -centerGap),
    });

    const youPos = spreadFromCenter(angleToXY(180, radiusX, radiusY));
    const OFFSET_Y = isCanCup ? -8 : -15;
    const halfX = BOX_WIDTH / 2;
    const halfY = BOX_HEIGHT / 2;

    const getAngle = (index: number, count: number) => (
        isCanCup ? getCanCupOpponentAngle(index, count) : getOpponentAngle(index, count)
    );

    const posOf = (id: string) => {
        if (id === currentPlayer.id) return youPos;
        const idx = opponents.findIndex((player) => player.id === id);
        return idx >= 0 ? spreadFromCenter(angleToXY(getAngle(idx, total - 1), radiusX, radiusY)) : null;
    };

    const atkPos = lastAction?.playerId ? posOf(lastAction.playerId) : null;
    const tgtPos = lastAction?.targetId ? posOf(lastAction.targetId) : null;
    const hasLine = Boolean(atkPos && tgtPos && lastAction?.playerId !== lastAction?.targetId);

    const PLAYER_EDGE_OFFSET = isCanCup ? 46 : 28;
    const lineGeometry = hasLine && atkPos && tgtPos
        ? (() => {
            const sx = atkPos.x + halfX;
            const sy = atkPos.y + halfY + OFFSET_Y;
            const tx = tgtPos.x + halfX;
            const ty = tgtPos.y + halfY + OFFSET_Y;
            const dx = tx - sx;
            const dy = ty - sy;
            const distance = Math.hypot(dx, dy) || 1;
            const ux = dx / distance;
            const uy = dy / distance;
            const canOffset = distance > PLAYER_EDGE_OFFSET * 2 + 6;

            return {
                startX: canOffset ? sx + ux * PLAYER_EDGE_OFFSET : sx,
                startY: canOffset ? sy + uy * PLAYER_EDGE_OFFSET : sy,
                endX: canOffset ? tx - ux * PLAYER_EDGE_OFFSET : tx,
                endY: canOffset ? ty - uy * PLAYER_EDGE_OFFSET : ty,
                distance: Math.max(40, canOffset ? Math.max(0, distance - PLAYER_EDGE_OFFSET * 2) : distance),
                angle: (Math.atan2(dy, dx) * 180) / Math.PI,
            };
        })()
        : null;

    const [showProjectile, setShowProjectile] = useState(false);
    const [reactionNow, setReactionNow] = useState(Date.now());
    const [submittingReactionReady, setSubmittingReactionReady] = useState(false);
    const [submittingReactionPress, setSubmittingReactionPress] = useState(false);
    const projX = useMotionValue(0);
    const projY = useMotionValue(0);
    const lineTone = isCanCup
        ? 'bg-gradient-to-r from-amber-400/95 to-orange-300/95 shadow-[0_0_14px_rgba(251,191,36,0.6)]'
        : 'bg-gradient-to-r from-red-500/95 to-orange-400/90 shadow-[0_0_14px_rgba(248,113,113,0.6)]';
    const lineBlurTone = isCanCup ? 'bg-amber-400/20' : 'bg-red-500/20';
    const projectileTone = isCanCup
        ? 'bg-black/70 border border-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.45)]'
        : 'bg-black/70 border border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.5)]';

    useEffect(() => {
        if (!hasLine || !lineGeometry || !lastAction) return;

        projX.set(lineGeometry.startX);
        projY.set(lineGeometry.startY);
        setShowProjectile(true);

        const ctrlX = animate(projX, lineGeometry.endX, { duration: 0.45, ease: 'easeInOut' });
        const ctrlY = animate(projY, lineGeometry.endY, { duration: 0.45, ease: 'easeInOut' });

        const timer = setTimeout(() => setShowProjectile(false), 500);
        return () => {
            ctrlX.stop();
            ctrlY.stop();
            clearTimeout(timer);
        };
    }, [hasLine, lineGeometry?.startX, lineGeometry?.startY, lineGeometry?.endX, lineGeometry?.endY, lastAction?.cardId, projX, projY]);

    const lineActionValue = typeof lastAction?.targetDamage === 'number' && lastAction.targetDamage > 0
        ? lastAction.targetDamage
        : typeof lastAction?.targetManaDelta === 'number' && lastAction.targetManaDelta < 0
            ? Math.abs(lastAction.targetManaDelta)
            : null;
    const floatingDamage = isCanCup ? null : lineActionValue;

    const challengeOwnerName = pendingChallenge
        ? players.find((player) => player.id === pendingChallenge.playerId)?.name ?? 'player'
        : '';
    const isReactionChallengeCard = isCanCupReactionChallengeCardUtil(pendingChallenge?.card);
    const reactionState = pendingChallenge?.reactionGame;
    const reactionDuelistIds = [pendingChallenge?.duelistOneId, pendingChallenge?.duelistTwoId].filter(Boolean) as string[];
    const isCurrentPlayerReactionDuelist = reactionDuelistIds.includes(currentPlayer.id);
    const isCurrentPlayerReactionReady = (reactionState?.readyPlayerIds ?? []).includes(currentPlayer.id);
    const isReactionGreen = Boolean(
        reactionState &&
        reactionState.phase !== 'resolved' &&
        typeof reactionState.greenAt === 'number' &&
        reactionNow >= reactionState.greenAt
    );
    const reactionPhaseLabel = !reactionState
        ? 'waiting'
        : reactionState.phase === 'resolved'
            ? 'resolved'
            : isReactionGreen
                ? 'green'
                : reactionState.phase;
    const isRedLit = Boolean(reactionState?.redAt && reactionNow >= reactionState.redAt);
    const isYellowLit = Boolean(reactionState?.yellowAt && reactionNow >= reactionState.yellowAt);
    const duelistOneName = pendingChallenge?.duelistOneId
        ? players.find((player) => player.id === pendingChallenge.duelistOneId)?.name ?? 'Duelist 1'
        : 'Duelist 1';
    const duelistTwoName = pendingChallenge?.duelistTwoId
        ? players.find((player) => player.id === pendingChallenge.duelistTwoId)?.name ?? 'Duelist 2'
        : 'Duelist 2';

    useEffect(() => {
        if (!isReactionChallengeCard || !reactionState || reactionState.phase === 'resolved') return;
        if (reactionState.phase === 'countdown' || isReactionGreen) {
            const timer = setInterval(() => setReactionNow(Date.now()), 80);
            return () => clearInterval(timer);
        }
        return;
    }, [isReactionChallengeCard, reactionState, isReactionGreen]);

    const handleReactionReadyClick = async () => {
        if (!onReactionReady || submittingReactionReady) return;
        setSubmittingReactionReady(true);
        try {
            await onReactionReady();
        } finally {
            setSubmittingReactionReady(false);
        }
    };

    const handleReactionPressClick = async () => {
        if (!onReactionPress || submittingReactionPress) return;
        setSubmittingReactionPress(true);
        try {
            await onReactionPress();
        } finally {
            setSubmittingReactionPress(false);
        }
    };

    return (
        <div ref={layoutRef} className={isCanCup ? 'relative w-full h-full flex items-center justify-center overflow-visible' : 'relative w-full h-full flex items-center justify-center overflow-hidden'}>
            <div className="relative" style={{ width: BOX_WIDTH, height: BOX_HEIGHT, transform: `translateY(${arenaYOffset}px)` }}>
                <AnimatePresence>
                    {hasLine && lineGeometry && lastAction && (
                        <motion.div
                            key={`line-${lastAction.cardId}`}
                            className="absolute z-[26] pointer-events-none"
                            style={{
                                left: lineGeometry.startX,
                                top: lineGeometry.startY,
                                transform: `translateY(-50%) rotate(${lineGeometry.angle}deg)`,
                                transformOrigin: '0 50%',
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, transition: { duration: 0.8 } }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                        >
                            <motion.div
                                className={`relative h-[3px] rounded-full ${lineTone}`}
                                initial={{ width: 0 }}
                                animate={{ width: lineGeometry.distance }}
                                exit={{ width: 0 }}
                                transition={{ duration: 0.35, ease: 'easeOut' }}
                            >
                                <div
                                    className="absolute -right-[2px] top-1/2 -translate-y-1/2"
                                    style={{
                                        width: 0,
                                        height: 0,
                                        borderTop: '8px solid transparent',
                                        borderBottom: '8px solid transparent',
                                        borderLeft: isCanCup ? '14px solid #f59e0b' : '14px solid #f87171',
                                        filter: isCanCup
                                            ? 'drop-shadow(0 0 8px rgba(251,191,36,0.7))'
                                            : 'drop-shadow(0 0 8px rgba(248,113,113,0.7))',
                                    }}
                                />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {hasLine && lineGeometry && lastAction && (
                        <motion.div
                            key={`line-shadow-${lastAction.cardId}`}
                            className="absolute z-[25] pointer-events-none"
                            style={{
                                left: lineGeometry.startX,
                                top: lineGeometry.startY,
                                transform: `translateY(-50%) rotate(${lineGeometry.angle}deg)`,
                                transformOrigin: '0 50%',
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.div
                                className={`h-[8px] rounded-full blur-[6px] ${lineBlurTone}`}
                                initial={{ width: 0 }}
                                animate={{ width: lineGeometry.distance }}
                                exit={{ width: 0 }}
                                transition={{ duration: 0.35, ease: 'easeOut' }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {hasLine && lineGeometry && lastAction && (
                        <motion.div
                            key={`sword-${lastAction.cardId}`}
                            className="absolute z-30 pointer-events-none"
                            style={{
                                left: (lineGeometry.startX + lineGeometry.endX) / 2,
                                top: (lineGeometry.startY + lineGeometry.endY) / 2,
                                translateX: '-50%',
                                translateY: '-50%',
                                rotate: `${lineGeometry.angle}deg`,
                            }}
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="flex items-center gap-1.5">
                                <div className={`rounded-full p-1.5 ${isCanCup
                                    ? 'border border-amber-400/50 bg-gray-950/80 shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                                    : 'border border-red-400/50 bg-gray-950/80 shadow-[0_0_12px_rgba(248,113,113,0.4)]'
                                    }`}>
                                    <Sword className={`w-3.5 h-3.5 ${isCanCup ? 'text-amber-200' : 'text-red-300'}`} />
                                </div>
                                {isCanCup && lineActionValue !== null && lineActionValue > 0 && (
                                    <span
                                        className="inline-block rounded-full border border-amber-300/50 bg-amber-950/75 px-2 py-0.5 text-[11px] font-bold text-amber-100 shadow-[0_0_10px_rgba(251,191,36,0.35)]"
                                        style={{ transform: `rotate(${-lineGeometry.angle}deg)` }}
                                    >
                                        {formatNumber(lineActionValue)}
                                    </span>
                                )}
                            </div>
                        </motion.div>
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
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${projectileTone}`}>
                                <Sword className={`w-4 h-4 ${isCanCup ? 'text-amber-100' : 'text-red-300'}`} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {!showProjectile && lastAction && lineGeometry && (
                        <motion.div
                            key={`burst-${lastAction.cardId}`}
                            className="absolute z-30 pointer-events-none"
                            style={{
                                left: lineGeometry.endX,
                                top: lineGeometry.endY,
                                translateX: '-50%',
                                translateY: '-50%',
                            }}
                            initial={{ scale: 0.3, opacity: 1 }}
                            animate={{ scale: 2.5, opacity: 0 }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                        >
                            <div className={`w-10 h-10 rounded-full ${isCanCup ? 'bg-amber-400/30 border border-amber-300/25' : 'bg-red-500/30 border border-red-400/20'}`} />
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {lastAction && tgtPos && floatingDamage !== null && (
                        <motion.div
                            key={`dmg-${lastAction.cardId}`}
                            className="absolute z-50 pointer-events-none whitespace-nowrap"
                            style={{
                                left: tgtPos.x + halfX + 24,
                                top: tgtPos.y + halfY + OFFSET_Y - 28,
                            }}
                            initial={{ opacity: 0, y: 0, scale: 0.6 }}
                            animate={{ opacity: 1, y: -10, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.85 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                        >
                            <span className="text-sm font-bold text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]">
                                -{formatNumber(floatingDamage)}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {pendingChallenge && (
                        <div className="absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                            <motion.div
                                key={`challenge-${pendingChallenge.card.id}`}
                                className={`pointer-events-auto w-[calc(100vw-64px)] max-w-[236px] rounded-2xl border px-3 py-3 text-left backdrop-blur-sm ${isReactionChallengeCard
                                    ? 'border-amber-200/75 bg-gradient-to-br from-[#2f1802]/95 via-[#8f500a]/45 to-[#3a1304]/95 shadow-[0_0_42px_rgba(245,158,11,0.62)]'
                                    : gameMode === 'can-cup'
                                        ? 'border-cyan-400/40 bg-cyan-950/70 shadow-[0_0_25px_rgba(8,145,178,0.25)]'
                                        : 'border-purple-400/40 bg-purple-950/75 shadow-[0_0_25px_rgba(147,51,234,0.25)]'
                                    }`}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                onClick={canResolvePendingChallenge && !isReactionChallengeCard ? onChallengeCardClick : undefined}
                            >
                                {isReactionChallengeCard && (
                                    <>
                                        <div className="pointer-events-none absolute right-3 top-2 h-8 w-8 rounded-full bg-amber-300/30 blur-md animate-pulse" />
                                        <div className="pointer-events-none absolute left-4 top-4 h-2 w-2 rounded-full bg-yellow-100/90 shadow-[0_0_10px_rgba(253,224,71,0.85)]" />
                                        <div className="pointer-events-none absolute right-8 bottom-4 h-1.5 w-1.5 rounded-full bg-amber-100/90 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                                    </>
                                )}
                                <p className={`text-xs uppercase tracking-wider ${isReactionChallengeCard
                                    ? 'text-amber-100/90'
                                    : gameMode === 'can-cup'
                                        ? 'text-cyan-200/80'
                                        : 'text-purple-200/80'
                                    }`}>
                                    {isReactionChallengeCard ? 'Legendary Challenge' : 'Challenge card'}
                                </p>
                                <h3 className="mt-0.5 text-base font-semibold text-white truncate">{pendingChallenge.card.name}</h3>
                                <p className={`mt-0.5 text-[11px] font-semibold tracking-wide ${isReactionChallengeCard
                                    ? 'text-amber-100'
                                    : gameMode === 'can-cup'
                                        ? 'text-cyan-100/90'
                                        : 'text-purple-200/90'
                                    }`}>
                                    {duelistOneName} VS {duelistTwoName}
                                </p>
                                <p className={`mt-1 text-xs leading-relaxed line-clamp-3 ${isReactionChallengeCard
                                    ? 'text-amber-50/90'
                                    : gameMode === 'can-cup'
                                        ? 'text-cyan-50/80'
                                        : 'text-purple-100/80'
                                    }`}>
                                    {pendingChallenge.card.description}
                                </p>
                                {isReactionChallengeCard && (
                                    <div className="mt-2">
                                        <p className="mb-1 text-center text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-100/90">
                                            {reactionPhaseLabel === 'waiting'
                                                ? 'Both duelists must accept'
                                                : reactionPhaseLabel === 'countdown'
                                                    ? 'Countdown active'
                                                    : reactionPhaseLabel === 'green'
                                                        ? 'Green light - tap now'
                                                        : 'Resolved'}
                                        </p>
                                        <div className="flex items-center justify-center gap-2.5">
                                            <span className={`h-4 w-4 rounded-full border ${isRedLit ? 'bg-red-500 border-red-200 shadow-[0_0_10px_rgba(239,68,68,0.75)]' : 'bg-gray-700/70 border-gray-500/60'}`} />
                                            <span className={`h-4 w-4 rounded-full border ${isYellowLit ? 'bg-yellow-400 border-yellow-200 shadow-[0_0_10px_rgba(250,204,21,0.75)]' : 'bg-gray-700/70 border-gray-500/60'}`} />
                                            <span className={`h-4 w-4 rounded-full border ${reactionPhaseLabel === 'green' ? 'bg-emerald-400 border-emerald-200 shadow-[0_0_11px_rgba(52,211,153,0.85)]' : 'bg-gray-700/70 border-gray-500/60'}`} />
                                        </div>
                                        {reactionPhaseLabel === 'waiting' && (
                                            <div className="mt-2">
                                                {isCurrentPlayerReactionDuelist ? (
                                                    <button
                                                        type="button"
                                                        onClick={handleReactionReadyClick}
                                                        disabled={isCurrentPlayerReactionReady || submittingReactionReady}
                                                        className="w-full rounded-lg border border-amber-200/45 bg-amber-500/90 px-2.5 py-1.5 text-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        {isCurrentPlayerReactionReady ? 'Accepted - waiting for opponent' : (submittingReactionReady ? 'Setting ready...' : 'Accept Duel')}
                                                    </button>
                                                ) : (
                                                    <p className="text-center text-[11px] text-amber-100/90">Waiting for duelists to accept</p>
                                                )}
                                            </div>
                                        )}
                                        {reactionPhaseLabel === 'countdown' && (
                                            <p className="mt-2 text-center text-[11px] font-semibold text-amber-100">Get ready...</p>
                                        )}
                                        {reactionPhaseLabel === 'green' && (
                                            <div className="mt-2">
                                                <button
                                                    type="button"
                                                    onClick={handleReactionPressClick}
                                                    disabled={!isCurrentPlayerReactionDuelist || submittingReactionPress}
                                                    className="w-full rounded-lg border border-emerald-200/45 bg-emerald-500/90 px-2.5 py-1.5 text-[11px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    {isCurrentPlayerReactionDuelist
                                                        ? (submittingReactionPress ? 'Submitting...' : 'TAP NOW')
                                                        : 'Duelists only'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="mt-2 flex items-center justify-between text-xs">
                                    <span className="rounded-full border border-blue-400/40 bg-blue-950/50 px-2 py-0.5 text-blue-200">
                                        {gameMode === 'can-cup'
                                            ? `Cost ${pendingChallenge.card.manaCost ?? 0} sip${(pendingChallenge.card.manaCost ?? 0) === 1 ? '' : 's'}`
                                            : `Mana ${pendingChallenge.card.manaCost ?? 0}`}
                                    </span>
                                    <span className={gameMode === 'can-cup' ? 'text-cyan-50/80' : 'text-purple-100/80'}>
                                        {isReactionChallengeCard
                                            ? (reactionPhaseLabel === 'green'
                                                ? 'Green! Duelists tap now'
                                                : reactionPhaseLabel === 'countdown'
                                                    ? 'Countdown running...'
                                                    : 'Accept duel to start')
                                            : canResolvePendingChallenge
                                                ? 'Tap to resolve'
                                                : `${challengeOwnerName} is resolving`}
                                    </span>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {opponents.map((player, index) => {
                    const pos = spreadFromCenter(angleToXY(getAngle(index, total - 1), radiusX, radiusY));
                    const projectedIntake = getProjectedIntake(player);
                    return (
                        <motion.div
                            key={player.id}
                            className="absolute z-20"
                            style={{
                                left: pos.x + halfX,
                                top: pos.y + halfY + OFFSET_Y,
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
                                isDrunk={gameMode === 'can-cup' ? false : projectedIntake >= drunkThreshold * 0.8}
                                drunkThreshold={drunkThreshold}
                                projectedManaIntake={projectedIntake}
                                soberSeconds={getSoberSeconds(projectedIntake)}
                                maxMana={maxMana}
                                onSelect={selectedCard && !selectedCard.isChallenge ? () => onTargetSelect(player.id) : undefined}
                                gameMode={gameMode}
                                canCupSipsPerCan={settings?.canCupSipsPerCan ?? GAME_CONFIG.CAN_CUP_SIPS_PER_CAN}
                                pendingCanCupSip={pendingCanCupSips?.[player.id]}
                            />
                        </motion.div>
                    );
                })}

                <motion.div
                    className="absolute z-20"
                    style={{
                        left: youPos.x + halfX,
                        top: youPos.y + halfY + OFFSET_Y,
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
                        isDrunk={gameMode === 'can-cup' ? false : getProjectedIntake(currentPlayer) >= drunkThreshold * 0.8}
                        drunkThreshold={drunkThreshold}
                        projectedManaIntake={getProjectedIntake(currentPlayer)}
                        soberSeconds={getSoberSeconds(getProjectedIntake(currentPlayer))}
                        maxMana={maxMana}
                        isYou
                        gameMode={gameMode}
                        canCupSipsPerCan={settings?.canCupSipsPerCan ?? GAME_CONFIG.CAN_CUP_SIPS_PER_CAN}
                        pendingCanCupSip={pendingCanCupSips?.[currentPlayer.id]}
                    />
                </motion.div>
            </div>

            {!lastAction && !pendingChallenge && (
                <motion.div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <span className="text-base text-gray-500 font-medium" style={{ marginTop: OFFSET_Y }}>
                        {isCurrentTurn ? 'Your turn - play a card!' : 'Waiting...'}
                    </span>
                </motion.div>
            )}
        </div>
    );
}
