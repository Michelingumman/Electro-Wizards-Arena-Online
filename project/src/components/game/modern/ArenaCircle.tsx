import { useEffect, useRef, useState } from 'react';
import { Card, Party, Player, GameMode, isAfterskiMode } from '../../../types/game';
import { ModernPlayerAvatar } from './ModernPlayerAvatar';
import { animate, AnimatePresence, motion, useMotionValue } from 'framer-motion';
import { Sword } from 'lucide-react';
import { GAME_CONFIG } from '../../../config/gameConfig';
import { isCanCupReactionChallengeCard as isCanCupReactionChallengeCardUtil } from '../../../utils/canCupChallengeHelpers';
import { isChallengeCard } from '../../../utils/challengeCard';
import { serverNow } from '../../../lib/firebase';

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
    drunkTimeLimitSeconds?: number;
    settings?: Party['settings'];
    onTargetSelect: (targetId: string) => Promise<void>;
    onChallengeCardClick?: () => void;
    onReactionReady?: () => Promise<void>;
    onReactionPress?: (reactionTimeMs: number) => Promise<void>;
    gameMode?: GameMode;
    topInset?: number;
    bottomInset?: number;
}

function getOpponentAngle(index: number, count: number): number {
    if (count === 1) return 0;
    if (count === 2) return index === 0 ? -70 : 70;
    const start = -140;
    const sweep = 280;
    const step = sweep / (count - 1);
    return start + step * index;
}

// Can Cup: place players at fixed positions using % of arena box
// Returns {x, y} as fractions of halfWidth/halfHeight from center (-1 to 1)
function getCanCupOpponentPositions(count: number, tightLayout = false): { x: number; y: number }[] {
    switch (count) {
        case 1: return [{ x: 0, y: tightLayout ? -0.70 : -0.66 }];
        case 2: return [
            { x: tightLayout ? -0.74 : -0.72, y: tightLayout ? -0.34 : -0.30 },
            { x: tightLayout ? 0.74 : 0.72, y: tightLayout ? -0.34 : -0.30 },
        ];
        case 3: return [
            // 4 players total: opponent 1 left, opponent 2 right, opponent 3 top-center
            { x: tightLayout ? -0.78 : -0.78, y: tightLayout ? 0.06 : -0.02 },
            { x: tightLayout ? 0.78 : 0.78, y: tightLayout ? 0.06 : -0.02 },
            { x: 0.0, y: tightLayout ? -0.74 : -0.62 },
        ];
        case 4: return [
            // 5 players total: opponent 1 bottom-left, opponent 2 bottom-right, opponent 3 top-left, opponent 4 top-right
            { x: tightLayout ? -0.74 : -0.74, y: tightLayout ? 0.16 : -0.04 },
            { x: tightLayout ? 0.74 : 0.74, y: tightLayout ? 0.16 : -0.04 },
            { x: tightLayout ? -0.72 : -0.72, y: tightLayout ? -0.82 : -0.66 },
            { x: tightLayout ? 0.72 : 0.72, y: tightLayout ? -0.82 : -0.66 },
        ];
        case 5: return [
            // 6 players total: more uniform spacing — outers pulled in, inners slightly adjusted
            { x: -0.72, y: tightLayout ? 0.18 : 0.12 },
            { x: -0.42, y: tightLayout ? -0.34 : -0.30 },
            { x: 0.0, y: tightLayout ? -0.82 : -0.72 },
            { x: 0.42, y: tightLayout ? -0.34 : -0.30 },
            { x: 0.72, y: tightLayout ? 0.18 : 0.12 },
        ];
        default: {
            // 6+: distribute evenly in an arc
            const positions: { x: number; y: number }[] = [];
            for (let i = 0; i < count; i++) {
                const t = count === 1 ? 0.5 : i / (count - 1);
                const angle = -118 + t * 236; // degrees, 0=top
                const rad = (angle * Math.PI) / 180;
                positions.push({
                    x: Math.sin(rad) * 0.78,
                    y: -Math.cos(rad) * 0.68,
                });
            }
            return positions;
        }
    }
}

function getCanCupUserPosition(opponentCount: number, tightLayout = false): { x: number; y: number } {
    if (opponentCount >= 4) return { x: 0, y: tightLayout ? 0.66 : 0.84 };
    if (opponentCount === 3) return { x: 0, y: tightLayout ? 0.74 : 0.87 };
    if (opponentCount === 1) return { x: 0, y: tightLayout ? 0.55 : 0.60 };
    return { x: 0, y: tightLayout ? 0.60 : 0.68 };
}

function angleToXY(deg: number, radiusX: number, radiusY: number) {
    const rad = (deg * Math.PI) / 180;
    return { x: Math.sin(rad) * radiusX, y: -Math.cos(rad) * radiusY };
}

function formatNumber(value: number) {
    const rounded = Number(value.toFixed(1));
    return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1);
}

interface LineGeometry {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    controlX: number;
    controlY: number;
    distance: number;
    path: string;
    midX: number;
    midY: number;
    midAngle: number;
    endAngle: number;
}

function quadraticPoint(t: number, p0: number, p1: number, p2: number) {
    const oneMinusT = 1 - t;
    return oneMinusT * oneMinusT * p0 + 2 * oneMinusT * t * p1 + t * t * p2;
}

function quadraticDerivative(t: number, p0: number, p1: number, p2: number) {
    return 2 * (1 - t) * (p1 - p0) + 2 * t * (p2 - p1);
}

function approximateQuadraticLength(
    x0: number,
    y0: number,
    cx: number,
    cy: number,
    x1: number,
    y1: number
) {
    let length = 0;
    let prevX = x0;
    let prevY = y0;
    const steps = 20;

    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const x = quadraticPoint(t, x0, cx, x1);
        const y = quadraticPoint(t, y0, cy, y1);
        length += Math.hypot(x - prevX, y - prevY);
        prevX = x;
        prevY = y;
    }

    return length;
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
    drunkTimeLimitSeconds = GAME_CONFIG.DRUNK_TIME_LIMIT_SECONDS,
    settings,
    onTargetSelect,
    onChallengeCardClick,
    onReactionReady,
    onReactionPress,
    gameMode = 'afterski',
    topInset = 0,
    bottomInset = 0,
}: ArenaCircleProps) {
    const opponents = players.filter((player) => player.id !== currentPlayer.id);
    const total = players.length;
    const isCanCup = gameMode === 'can-cup';
    const isAfterski = isAfterskiMode(gameMode);
    const useCanCupPlacement = isCanCup || isAfterski;
    const layoutRef = useRef<HTMLDivElement>(null);
    const [arenaBounds, setArenaBounds] = useState({ width: 360, height: 360 });

    const maxMana = settings?.maxMana ?? GAME_CONFIG.MAX_MANA;
    const decayRate = settings?.manaIntakeDecayRate ?? GAME_CONFIG.MANA_INTAKE_DECAY_RATE;

    const intakeSnapshotRef = useRef<Map<string, number>>(new Map());
    const drunkSecondsSnapshotRef = useRef<Map<string, number>>(new Map());
    const snapshotTimeRef = useRef<number>(Date.now());
    const [tickNow, setTickNow] = useState(Date.now());

    const intakeKey = players.map((player) => `${player.id}:${player.manaIntake}:${player.drunkSeconds ?? 0}`).join('|');

    useEffect(() => {
        intakeSnapshotRef.current = new Map(players.map((player) => [player.id, player.manaIntake || 0]));
        drunkSecondsSnapshotRef.current = new Map(players.map((player) => [player.id, player.drunkSeconds || 0]));
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

    const getProjectedDrunkSeconds = (player: Player) => {
        const baseDrunkSeconds = drunkSecondsSnapshotRef.current.get(player.id) ?? player.drunkSeconds ?? 0;
        const projectedIntake = getProjectedIntake(player);
        const projectedIsDrunk = projectedIntake >= drunkThreshold * 0.8;
        if (!projectedIsDrunk) {
            return Math.max(0, baseDrunkSeconds);
        }
        const elapsedSec = (tickNow - snapshotTimeRef.current) / 1000;
        return Math.max(0, baseDrunkSeconds + elapsedSec);
    };

    const BOX_WIDTH = Math.max(260, arenaBounds.width - (useCanCupPlacement ? 4 : 14));
    const BOX_HEIGHT = Math.max(220, arenaBounds.height - (useCanCupPlacement ? 6 : 20));
    const canCupTopInset = useCanCupPlacement
        ? Math.max(0, Math.min(topInset, Math.max(0, BOX_HEIGHT * 0.30)))
        : 0;
    const canCupBottomInset = useCanCupPlacement
        ? Math.max(0, Math.min(bottomInset, Math.max(0, BOX_HEIGHT - canCupTopInset - 140)))
        : 0;
    const rawRadiusX = useCanCupPlacement
        ? Math.max(80, Math.min(BOX_WIDTH / 2 - 40, 200))
        : Math.max(76, Math.min(142, BOX_WIDTH / 2 - 58));
    const rawRadiusY = useCanCupPlacement
        ? Math.max(90, Math.min(BOX_HEIGHT / 2 - 50, 200))
        : Math.max(74, Math.min(136, BOX_HEIGHT / 2 - 52));
    const spreadFactor = total <= 2 ? 0.72 : total === 3 ? 0.8 : 0.92;
    const canCupSpreadX = total <= 2 ? 0.85 : total === 3 ? 0.95 : 1.0;
    const canCupSpreadY = total <= 2 ? 0.78 : total === 3 ? 0.85 : total === 4 ? 0.9 : 0.95;
    const radiusX = useCanCupPlacement
        ? rawRadiusX * canCupSpreadX
        : rawRadiusX * spreadFactor;
    const radiusY = (useCanCupPlacement
        ? rawRadiusY * canCupSpreadY
        : rawRadiusY * spreadFactor) * (pendingChallenge ? 0.86 : 1);
    const centerGap = pendingChallenge ? 28 : (useCanCupPlacement ? 24 : 12);
    const arenaYOffset = pendingChallenge ? (useCanCupPlacement ? 8 : 52) : (useCanCupPlacement ? 0 : 72);

    const spreadFromCenter = (point: { x: number; y: number }) => ({
        x: point.x,
        y: point.y + (point.y >= 0 ? centerGap : -centerGap),
    });

    const youPos = spreadFromCenter(angleToXY(180, radiusX, radiusY));
    const OFFSET_Y = useCanCupPlacement ? 0 : -15;
    const halfX = BOX_WIDTH / 2;
    const playfieldHeight = useCanCupPlacement
        ? Math.max(140, BOX_HEIGHT - canCupTopInset - canCupBottomInset)
        : BOX_HEIGHT;
    const halfY = playfieldHeight / 2;
    const centerY = useCanCupPlacement ? (canCupTopInset + halfY) : (BOX_HEIGHT / 2);
    const isTightCanCupLayout = useCanCupPlacement && (arenaBounds.width <= 410 || playfieldHeight <= 430);
    const useCompactAvatars = useCanCupPlacement && (isTightCanCupLayout || opponents.length >= 4);

    const getAngle = (index: number, count: number) => (
        getOpponentAngle(index, count)
    );

    // For Can Cup: use percentage-based positions; for others: use radial angles
    const canCupOpponentPositions = useCanCupPlacement ? getCanCupOpponentPositions(opponents.length, isTightCanCupLayout) : [];
    const canCupUserPos = useCanCupPlacement ? getCanCupUserPosition(opponents.length, isTightCanCupLayout) : null;

    const canCupPosToCoord = (frac: { x: number; y: number }) => ({
        x: frac.x * halfX,
        y: frac.y * halfY,
    });

    const posOf = (id: string) => {
        if (useCanCupPlacement) {
            if (id === currentPlayer.id) return canCupPosToCoord(canCupUserPos ?? { x: 0, y: 0.82 });
            const idx = opponents.findIndex((player) => player.id === id);
            if (idx >= 0 && canCupOpponentPositions[idx]) {
                return canCupPosToCoord(canCupOpponentPositions[idx]);
            }
            return null;
        }
        if (id === currentPlayer.id) return youPos;
        const idx = opponents.findIndex((player) => player.id === id);
        return idx >= 0 ? spreadFromCenter(angleToXY(getAngle(idx, total - 1), radiusX, radiusY)) : null;
    };

    const atkPos = lastAction?.playerId ? posOf(lastAction.playerId) : null;
    const tgtPos = lastAction?.targetId ? posOf(lastAction.targetId) : null;
    const hasLine = Boolean(atkPos && tgtPos && lastAction?.playerId !== lastAction?.targetId);

    const PLAYER_EDGE_OFFSET = isCanCup ? 50 : 28;
    const lineGeometry: LineGeometry | null = hasLine && atkPos && tgtPos
        ? (() => {
            const sx = atkPos.x + halfX;
            const sy = atkPos.y + centerY + OFFSET_Y;
            const tx = tgtPos.x + halfX;
            const ty = tgtPos.y + centerY + OFFSET_Y;
            const dx = tx - sx;
            const dy = ty - sy;
            const distance = Math.hypot(dx, dy) || 1;
            const closeDistanceFactor = Math.max(0, Math.min(1, 1 - distance / 260));
            const ux = dx / distance;
            const uy = dy / distance;
            // For Can Cup: generous offset but never eat more than 30% of each end
            // so the arrow always spans at least ~40% of the total distance
            const edgeOffset = isCanCup
                ? Math.min(PLAYER_EDGE_OFFSET, distance * 0.30)
                : (distance > PLAYER_EDGE_OFFSET * 2 + 6 ? PLAYER_EDGE_OFFSET : 0);
            const startX = sx + ux * edgeOffset;
            const startY = sy + uy * edgeOffset;
            const endX = tx - ux * edgeOffset;
            const endY = ty - uy * edgeOffset;
            const lineDx = endX - startX;
            const lineDy = endY - startY;
            const lineDistance = Math.max(1, Math.hypot(lineDx, lineDy));
            const nearAdjacent = closeDistanceFactor > 0.55;
            const baseMidX = (startX + endX) / 2;
            const baseMidY = (startY + endY) / 2;
            const normalX = -lineDy / lineDistance;
            const normalY = lineDx / lineDistance;

            const curvature = isCanCup
                ? Math.max(
                    isTightCanCupLayout ? 48 : 30,
                    Math.min(
                        isTightCanCupLayout ? 140 : 116,
                        lineDistance * ((isTightCanCupLayout ? 0.66 : 0.38) + closeDistanceFactor * (isTightCanCupLayout ? 0.24 : 0.24))
                    )
                )
                : 0;
            const arenaCenterX = halfX;
            const arenaCenterY = centerY + OFFSET_Y;

            const candidateAX = baseMidX + normalX * curvature;
            const candidateAY = baseMidY + normalY * curvature;
            const candidateBX = baseMidX - normalX * curvature;
            const candidateBY = baseMidY - normalY * curvature;
            const candidateADistance = Math.hypot(candidateAX - arenaCenterX, candidateAY - arenaCenterY);
            const candidateBDistance = Math.hypot(candidateBX - arenaCenterX, candidateBY - arenaCenterY);
            const chosenControlX = curvature > 0 && candidateBDistance < candidateADistance ? candidateBX : candidateAX;
            const chosenControlY = curvature > 0 && candidateBDistance < candidateADistance ? candidateBY : candidateAY;
            const centerPull = isCanCup
                ? Math.min(
                    nearAdjacent ? 0.9 : 0.82,
                    (isTightCanCupLayout ? 0.54 : 0.36) + closeDistanceFactor * (isTightCanCupLayout ? 0.34 : 0.34)
                )
                : 0;
            const controlX = chosenControlX * (1 - centerPull) + arenaCenterX * centerPull;
            const controlY = chosenControlY * (1 - centerPull) + arenaCenterY * centerPull;

            const badgeT = 0.5;
            const baseBadgeX = quadraticPoint(badgeT, startX, controlX, endX);
            const baseBadgeY = quadraticPoint(badgeT, startY, controlY, endY);
            const badgeControlPull = isCanCup
                ? Math.min(
                    nearAdjacent ? 0.88 : 0.76,
                    (isTightCanCupLayout ? 0.46 : 0.30) + closeDistanceFactor * (isTightCanCupLayout ? 0.34 : 0.28)
                )
                : 0;
            const badgeX = baseBadgeX * (1 - badgeControlPull) + controlX * badgeControlPull;
            const badgeY = baseBadgeY * (1 - badgeControlPull) + controlY * badgeControlPull;
            const badgeTangentX = quadraticDerivative(badgeT, startX, controlX, endX);
            const badgeTangentY = quadraticDerivative(badgeT, startY, controlY, endY);
            const endTangentX = quadraticDerivative(0.96, startX, controlX, endX);
            const endTangentY = quadraticDerivative(0.96, startY, controlY, endY);

            return {
                startX,
                startY,
                endX,
                endY,
                controlX,
                controlY,
                distance: approximateQuadraticLength(startX, startY, controlX, controlY, endX, endY),
                path: `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`,
                midX: badgeX,
                midY: badgeY,
                midAngle: (Math.atan2(badgeTangentY, badgeTangentX) * 180) / Math.PI,
                endAngle: (Math.atan2(endTangentY, endTangentX) * 180) / Math.PI,
            };
        })()
        : null;
    const lineGradientId = `attack-line-${lastAction?.cardId ?? 'none'}`.replace(/[^a-zA-Z0-9_-]/g, '');

    const [showProjectile, setShowProjectile] = useState(false);
    const [reactionNow, setReactionNow] = useState(serverNow());
    const [submittingReactionReady, setSubmittingReactionReady] = useState(false);
    const [submittingReactionPress, setSubmittingReactionPress] = useState(false);
    const projX = useMotionValue(0);
    const projY = useMotionValue(0);
    const projectileTone = isCanCup
        ? 'bg-black/70 border border-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.45)]'
        : 'bg-black/70 border border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.5)]';

    useEffect(() => {
        if (!hasLine || !lineGeometry || !lastAction) return;
        if (isCanCup) {
            setShowProjectile(false);
            return;
        }

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
    }, [hasLine, isCanCup, lineGeometry?.startX, lineGeometry?.startY, lineGeometry?.endX, lineGeometry?.endY, lastAction?.cardId, projX, projY]);

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

    // Store the exact physical ms when the screen turned green locally
    const localGreenLitAtRef = useRef<number | null>(null);

    useEffect(() => {
        if (!isReactionChallengeCard || !reactionState || reactionState.phase === 'resolved') return;

        let animationFrameId: number;
        let loggedGreen = false;

        // Reset the green lit ref when a new challenge starts
        if (reactionState.phase === 'countdown') {
            localGreenLitAtRef.current = null;
        }

        const targetGreenAt = typeof reactionState.greenAt === 'number' ? reactionState.greenAt : 0;

        const tick = () => {
            const current = serverNow();
            setReactionNow(current);

            if (targetGreenAt > 0 && current >= targetGreenAt && !loggedGreen) {
                // The exact millisecond the DOM realizes it should render green:
                localGreenLitAtRef.current = performance.now();
                console.log(`[SYNC-UI] GREEN LIGHT HIT! serverNow()=${current}, target greenAt=${targetGreenAt}, Diff=${current - targetGreenAt}ms`);
                loggedGreen = true;
            }

            if (!loggedGreen) {
                animationFrameId = requestAnimationFrame(tick);
            }
        };

        if (reactionState.phase === 'countdown' && !isReactionGreen) {
            console.log(`[SYNC-UI] Starting countdown monitor. target greenAt=${targetGreenAt}`);
            animationFrameId = requestAnimationFrame(tick);
        }

        return () => cancelAnimationFrame(animationFrameId);
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
        // Measure exact physical gap between DOM turning green and the screen tap
        const tapTime = performance.now();
        const reactionTimeMs = localGreenLitAtRef.current
            ? Math.round(tapTime - localGreenLitAtRef.current)
            : 9999; // Fallback if tapped too early or missed

        console.log(`[SYNC-ACTION] Player TAPPED! Exact Physical Reaction Time: ${reactionTimeMs}ms`);

        if (!onReactionPress || submittingReactionPress) return;
        setSubmittingReactionPress(true);
        try {
            await onReactionPress(reactionTimeMs);
        } finally {
            setSubmittingReactionPress(false);
        }
    };

    return (
        <div
            ref={layoutRef}
            className={useCanCupPlacement
                ? 'relative w-full h-full flex items-center justify-center overflow-visible'
                : 'relative w-full h-full flex items-center justify-center overflow-hidden'}
        >
            <div className="relative" style={{ width: BOX_WIDTH, height: BOX_HEIGHT, transform: `translateY(${arenaYOffset}px)` }}>
                <AnimatePresence>
                    {hasLine && lineGeometry && lastAction && (
                        <motion.svg
                            key={`line-${lastAction.cardId}`}
                            className="absolute inset-0 z-[25] pointer-events-none overflow-visible"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, transition: { duration: 0.8 } }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                        >
                            <defs>
                                <linearGradient id={lineGradientId} gradientUnits="userSpaceOnUse" x1={lineGeometry.startX} y1={lineGeometry.startY} x2={lineGeometry.endX} y2={lineGeometry.endY}>
                                    <stop offset="0%" stopColor={isCanCup ? '#fbbf24' : '#ef4444'} stopOpacity="0.95" />
                                    <stop offset="100%" stopColor={isCanCup ? '#fdba74' : '#fb923c'} stopOpacity="0.92" />
                                </linearGradient>
                            </defs>
                            <motion.path
                                d={lineGeometry.path}
                                fill="none"
                                stroke={isCanCup ? 'rgba(251,191,36,0.24)' : 'rgba(239,68,68,0.24)'}
                                strokeWidth={9}
                                strokeLinecap="round"
                                style={{ filter: 'blur(6px)' }}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                exit={{ pathLength: 0 }}
                                transition={{ duration: 0.35, ease: 'easeOut' }}
                            />
                            <motion.path
                                d={lineGeometry.path}
                                fill="none"
                                stroke={`url(#${lineGradientId})`}
                                strokeWidth={3}
                                strokeLinecap="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                exit={{ pathLength: 0 }}
                                transition={{ duration: 0.35, ease: 'easeOut' }}
                            />
                        </motion.svg>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {hasLine && lineGeometry && lastAction && (
                        <motion.div
                            key={`arrow-${lastAction.cardId}`}
                            className="absolute z-[27] pointer-events-none"
                            style={{
                                left: lineGeometry.endX,
                                top: lineGeometry.endY,
                                translateX: '-50%',
                                translateY: '-50%',
                                rotate: `${lineGeometry.endAngle}deg`,
                            }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.7 }}
                        >
                            <div
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
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {hasLine && lineGeometry && lastAction && (
                        <motion.div
                            key={`sword-${lastAction.cardId}`}
                            className="absolute z-30 pointer-events-none"
                            style={{
                                left: lineGeometry.midX,
                                top: lineGeometry.midY,
                                translateX: '-50%',
                                translateY: '-50%',
                                rotate: `${lineGeometry.midAngle}deg`,
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
                                        style={{ transform: `rotate(${-lineGeometry.midAngle}deg)` }}
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
                    {!isCanCup && !showProjectile && lastAction && lineGeometry && (
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
                                top: tgtPos.y + centerY + OFFSET_Y - 28,
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
                    const pos = useCanCupPlacement && canCupOpponentPositions[index]
                        ? canCupPosToCoord(canCupOpponentPositions[index])
                        : spreadFromCenter(angleToXY(getAngle(index, total - 1), radiusX, radiusY));
                    const projectedIntake = getProjectedIntake(player);
                    return (
                        <motion.div
                            key={player.id}
                            className="absolute z-20"
                            style={{
                                left: pos.x + halfX,
                                top: pos.y + centerY + OFFSET_Y,
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
                                drunkSeconds={getProjectedDrunkSeconds(player)}
                                drunkTimeLimitSeconds={drunkTimeLimitSeconds}
                                maxMana={maxMana}
                                onSelect={selectedCard && !isChallengeCard(selectedCard) ? () => onTargetSelect(player.id) : undefined}
                                gameMode={gameMode}
                                canCupSipsPerCan={settings?.canCupSipsPerCan ?? GAME_CONFIG.CAN_CUP_SIPS_PER_CAN}
                                pendingCanCupSip={pendingCanCupSips?.[player.id]}
                                compact={useCompactAvatars}
                            />
                        </motion.div>
                    );
                })}

                <motion.div
                    className="absolute z-20"
                    style={{
                        left: (useCanCupPlacement ? canCupPosToCoord(canCupUserPos ?? { x: 0, y: 0.82 }).x : youPos.x) + halfX,
                        top: (useCanCupPlacement ? canCupPosToCoord(canCupUserPos ?? { x: 0, y: 0.82 }).y : youPos.y) + centerY + OFFSET_Y,
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
                        drunkSeconds={getProjectedDrunkSeconds(currentPlayer)}
                        drunkTimeLimitSeconds={drunkTimeLimitSeconds}
                        maxMana={maxMana}
                        isYou
                        gameMode={gameMode}
                        canCupSipsPerCan={settings?.canCupSipsPerCan ?? GAME_CONFIG.CAN_CUP_SIPS_PER_CAN}
                        pendingCanCupSip={pendingCanCupSips?.[currentPlayer.id]}
                        compact={useCompactAvatars}
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
