import { useEffect, useRef, useState } from 'react';
import { Card, Party, Player } from '../../../types/game';
import { ModernPlayerAvatar } from './ModernPlayerAvatar';
import { animate, AnimatePresence, motion, useMotionValue } from 'framer-motion';
import { Sword } from 'lucide-react';
import { GAME_CONFIG } from '../../../config/gameConfig';

interface ArenaCircleProps {
    players: Player[];
    currentPlayer: Player;
    currentTurn: string;
    selectedCard: Card | null;
    lastAction?: Party['lastAction'];
    pendingChallenge?: Party['pendingChallenge'];
    canResolvePendingChallenge?: boolean;
    isCurrentTurn: boolean;
    drunkThreshold: number;
    settings?: Party['settings'];
    onTargetSelect: (targetId: string) => Promise<void>;
    onChallengeCardClick?: () => void;
}

function getOpponentAngle(index: number, count: number): number {
    if (count === 1) return 0;
    if (count === 2) return index === 0 ? -70 : 70;
    const start = -140;
    const sweep = 280;
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
    canResolvePendingChallenge = false,
    isCurrentTurn,
    drunkThreshold,
    settings,
    onTargetSelect,
    onChallengeCardClick,
}: ArenaCircleProps) {
    const opponents = players.filter((player) => player.id !== currentPlayer.id);
    const total = players.length;
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
        const threshold = Math.max(drunkThreshold, 0.1);
        const baseSeconds = (intake / threshold) * 60;
        return baseSeconds / Math.max(decayRate, 0.1);
    };

    const BOX_WIDTH = Math.max(260, arenaBounds.width - 14);
    const BOX_HEIGHT = Math.max(220, arenaBounds.height - 20);
    const rawRadiusX = Math.max(76, Math.min(142, BOX_WIDTH / 2 - 58));
    const rawRadiusY = Math.max(74, Math.min(136, BOX_HEIGHT / 2 - 52));
    const spreadFactor = total <= 2 ? 0.72 : total === 3 ? 0.8 : 0.92;
    const radiusX = rawRadiusX * spreadFactor;
    const radiusY = rawRadiusY * spreadFactor;
    const centerGap = pendingChallenge ? 22 : 10;
    const arenaYOffset = pendingChallenge ? 10 : 22;

    const spreadFromCenter = (point: { x: number; y: number }) => ({
        x: point.x,
        y: point.y + (point.y >= 0 ? centerGap : -centerGap),
    });

    const youPos = spreadFromCenter(angleToXY(180, radiusX, radiusY));
    const OFFSET_Y = -15;
    const halfX = BOX_WIDTH / 2;
    const halfY = BOX_HEIGHT / 2;

    const posOf = (id: string) => {
        if (id === currentPlayer.id) return youPos;
        const idx = opponents.findIndex((player) => player.id === id);
        return idx >= 0 ? spreadFromCenter(angleToXY(getOpponentAngle(idx, total - 1), radiusX, radiusY)) : null;
    };

    const atkPos = lastAction?.playerId ? posOf(lastAction.playerId) : null;
    const tgtPos = lastAction?.targetId ? posOf(lastAction.targetId) : null;
    const hasLine = Boolean(atkPos && tgtPos && lastAction?.playerId !== lastAction?.targetId);

    const PLAYER_EDGE_OFFSET = 34;
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
                distance: canOffset ? Math.max(0, distance - PLAYER_EDGE_OFFSET * 2) : distance,
                angle: (Math.atan2(dy, dx) * 180) / Math.PI,
            };
        })()
        : null;

    const [showProjectile, setShowProjectile] = useState(false);
    const projX = useMotionValue(0);
    const projY = useMotionValue(0);

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

    const floatingDamage = typeof lastAction?.targetDamage === 'number' && lastAction.targetDamage > 0
        ? lastAction.targetDamage
        : typeof lastAction?.targetManaDelta === 'number' && lastAction.targetManaDelta < 0
            ? Math.abs(lastAction.targetManaDelta)
            : null;

    const challengeOwnerName = pendingChallenge
        ? players.find((player) => player.id === pendingChallenge.playerId)?.name ?? 'player'
        : '';

    return (
        <div ref={layoutRef} className="relative w-full h-full flex items-center justify-center overflow-hidden">
            <div className="relative" style={{ width: BOX_WIDTH, height: BOX_HEIGHT, transform: `translateY(${arenaYOffset}px)` }}>
                <AnimatePresence>
                    {hasLine && lineGeometry && lastAction && (
                        <motion.div
                            key={`line-${lastAction.cardId}`}
                            className="absolute z-20 pointer-events-none"
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
                                className="relative h-[3px] rounded-full bg-gradient-to-r from-red-500/95 to-orange-400/90 shadow-[0_0_14px_rgba(248,113,113,0.6)]"
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
                                        borderTop: '5px solid transparent',
                                        borderBottom: '5px solid transparent',
                                        borderLeft: '8px solid #f87171',
                                        filter: 'drop-shadow(0 0 6px rgba(248,113,113,0.65))',
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
                            className="absolute z-[19] pointer-events-none"
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
                                className="h-[8px] rounded-full bg-red-500/20 blur-[6px]"
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
                            <div className="rounded-full border border-red-400/50 bg-gray-950/80 p-1.5 shadow-[0_0_12px_rgba(248,113,113,0.4)]">
                                <Sword className="w-3.5 h-3.5 text-red-300" />
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
                            <div className="w-8 h-8 rounded-full bg-black/70 border border-red-500/40 flex items-center justify-center shadow-[0_0_12px_rgba(239,68,68,0.5)]">
                                <Sword className="w-4 h-4 text-red-300" />
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
                            <div className="w-10 h-10 rounded-full bg-red-500/30 border border-red-400/20" />
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
                        <motion.button
                            type="button"
                            key={`challenge-${pendingChallenge.card.id}`}
                            className="absolute left-1/2 top-1/2 z-40 w-[calc(100vw-64px)] max-w-[236px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-purple-400/40 bg-purple-950/75 px-3 py-3 text-left shadow-[0_0_25px_rgba(147,51,234,0.25)] backdrop-blur-sm"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={canResolvePendingChallenge ? onChallengeCardClick : undefined}
                            disabled={!canResolvePendingChallenge}
                        >
                            <p className="text-xs uppercase tracking-wider text-purple-200/80">Challenge card</p>
                            <h3 className="mt-0.5 text-base font-semibold text-white truncate">{pendingChallenge.card.name}</h3>
                            <p className="mt-1 text-xs leading-relaxed text-purple-100/80 line-clamp-3">
                                {pendingChallenge.card.description}
                            </p>
                            <div className="mt-2 flex items-center justify-between text-xs">
                                <span className="rounded-full border border-blue-400/40 bg-blue-950/50 px-2 py-0.5 text-blue-200">
                                    Mana {pendingChallenge.card.manaCost}
                                </span>
                                <span className="text-purple-100/80">
                                    {canResolvePendingChallenge ? 'Tap to resolve' : `${challengeOwnerName} is resolving`}
                                </span>
                            </div>
                        </motion.button>
                    )}
                </AnimatePresence>

                {opponents.map((player, index) => {
                    const pos = spreadFromCenter(angleToXY(getOpponentAngle(index, total - 1), radiusX, radiusY));
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
                                isDrunk={projectedIntake >= drunkThreshold * 0.8}
                                drunkThreshold={drunkThreshold}
                                projectedManaIntake={projectedIntake}
                                soberSeconds={getSoberSeconds(projectedIntake)}
                                maxMana={maxMana}
                                onSelect={selectedCard && !selectedCard.isChallenge ? () => onTargetSelect(player.id) : undefined}
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
                        isDrunk={getProjectedIntake(currentPlayer) >= drunkThreshold * 0.8}
                        drunkThreshold={drunkThreshold}
                        projectedManaIntake={getProjectedIntake(currentPlayer)}
                        soberSeconds={getSoberSeconds(getProjectedIntake(currentPlayer))}
                        maxMana={maxMana}
                        isYou
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
