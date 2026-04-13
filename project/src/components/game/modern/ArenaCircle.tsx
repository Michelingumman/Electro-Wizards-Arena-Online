import { useEffect, useRef, useState } from 'react';
import { Card, GameActionSegment, Party, PendingCanCupFollowUp, Player, GameMode, isAfterskiMode } from '../../../types/game';
import { ModernPlayerAvatar } from './ModernPlayerAvatar';
import { animate, AnimatePresence, motion, useMotionValue } from 'framer-motion';
import { Sword, X } from 'lucide-react';
import { GAME_CONFIG } from '../../../config/gameConfig';
import {
    isCanCupBottomRaceChallengeCard,
    isCanCupCircleChallengeCard,
    isCanCupReactionChallengeCard as isCanCupReactionChallengeCardUtil,
} from '../../../utils/canCupChallengeHelpers';
import { isChallengeCard } from '../../../utils/challengeCard';
import { serverNow } from '../../../lib/firebase';

interface ArenaCircleProps {
    players: Player[];
    currentPlayer: Player;
    currentTurn: string;
    selectedCard: Card | null;
    lastAction?: Party['lastAction'];
    pendingChallenge?: Party['pendingChallenge'];
    pendingCanCupFollowUp?: PendingCanCupFollowUp | null;
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
    onReactionResultsDismiss?: () => Promise<void>;
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
    pendingCanCupFollowUp,
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
    onReactionResultsDismiss,
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
    const isUntargetablePlayer = (player?: Player | null) =>
        Boolean(player?.effects?.some((effect) => effect.type === 'untargetable' && effect.duration > 0));

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

    const actionSegments: GameActionSegment[] = lastAction
        ? (lastAction.segments?.length ? lastAction.segments : [lastAction])
        : [];
    const getSegmentPalette = (segmentIndex: number) => {
        if (!isCanCup) {
            return {
                glowStroke: 'rgba(239,68,68,0.24)',
                start: '#ef4444',
                end: '#fb923c',
                arrow: '#f87171',
                iconBorder: 'border-red-400/50',
                iconBg: 'bg-gray-950/80',
                iconShadow: 'shadow-[0_0_12px_rgba(248,113,113,0.4)]',
                iconText: 'text-red-300',
                badgeBorder: 'border-red-300/50',
                badgeBg: 'bg-red-950/75',
                badgeText: 'text-red-100',
                badgeShadow: 'shadow-[0_0_10px_rgba(248,113,113,0.35)]',
            };
        }

        if (segmentIndex === 0) {
            return {
                glowStroke: 'rgba(251,191,36,0.24)',
                start: '#fbbf24',
                end: '#fdba74',
                arrow: '#f59e0b',
                iconBorder: 'border-amber-400/50',
                iconBg: 'bg-gray-950/80',
                iconShadow: 'shadow-[0_0_12px_rgba(251,191,36,0.4)]',
                iconText: 'text-amber-200',
                badgeBorder: 'border-amber-300/50',
                badgeBg: 'bg-amber-950/75',
                badgeText: 'text-amber-100',
                badgeShadow: 'shadow-[0_0_10px_rgba(251,191,36,0.35)]',
            };
        }

        return {
            glowStroke: 'rgba(34,211,238,0.22)',
            start: '#22d3ee',
            end: '#34d399',
            arrow: '#22d3ee',
            iconBorder: 'border-cyan-400/50',
            iconBg: 'bg-gray-950/80',
            iconShadow: 'shadow-[0_0_12px_rgba(34,211,238,0.38)]',
            iconText: 'text-cyan-100',
            badgeBorder: 'border-cyan-300/50',
            badgeBg: 'bg-cyan-950/75',
            badgeText: 'text-cyan-100',
            badgeShadow: 'shadow-[0_0_10px_rgba(34,211,238,0.32)]',
        };
    };
    const buildLineGeometry = (segment: GameActionSegment, segmentIndex: number): LineGeometry | null => {
        if (!segment.targetId || segment.playerId === segment.targetId) {
            return null;
        }

        const atkPos = posOf(segment.playerId);
        const tgtPos = posOf(segment.targetId);
        if (!atkPos || !tgtPos) {
            return null;
        }

        const PLAYER_EDGE_OFFSET = isCanCup ? 50 : 28;
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
        const edgeOffset = isCanCup
            ? Math.min(PLAYER_EDGE_OFFSET, distance * 0.30)
            : (distance > PLAYER_EDGE_OFFSET * 2 + 6 ? PLAYER_EDGE_OFFSET : 0);
        const baseStartX = sx + ux * edgeOffset;
        const baseStartY = sy + uy * edgeOffset;
        const baseEndX = tx - ux * edgeOffset;
        const baseEndY = ty - uy * edgeOffset;
        const lineDx = baseEndX - baseStartX;
        const lineDy = baseEndY - baseStartY;
        const lineDistance = Math.max(1, Math.hypot(lineDx, lineDy));
        const nearAdjacent = closeDistanceFactor > 0.55;
        const normalX = -lineDy / lineDistance;
        const normalY = lineDx / lineDistance;
        const reverseSegmentIndex = actionSegments.findIndex((candidate, candidateIndex) =>
            candidateIndex !== segmentIndex &&
            candidate.playerId === segment.targetId &&
            candidate.targetId === segment.playerId
        );
        const distributedLaneOffset = actionSegments.length > 1
            ? (segmentIndex - (actionSegments.length - 1) / 2) * (isTightCanCupLayout ? 12 : 10)
            : 0;
        const laneOffset = isCanCup
            ? reverseSegmentIndex >= 0
                ? (segmentIndex < reverseSegmentIndex ? 1 : -1) * (isTightCanCupLayout ? 18 : 15)
                : distributedLaneOffset
            : 0;
        const startX = baseStartX + normalX * laneOffset;
        const startY = baseStartY + normalY * laneOffset;
        const endX = baseEndX + normalX * laneOffset;
        const endY = baseEndY + normalY * laneOffset;
        const baseMidX = (startX + endX) / 2;
        const baseMidY = (startY + endY) / 2;

        const curvature = isCanCup
            ? Math.max(
                isTightCanCupLayout ? 48 : 30,
                Math.min(
                    isTightCanCupLayout ? 140 : 116,
                    lineDistance * ((isTightCanCupLayout ? 0.66 : 0.38) + closeDistanceFactor * (isTightCanCupLayout ? 0.24 : 0.24))
                )
            ) + Math.abs(laneOffset) * 1.25
            : 0;
        const arenaCenterX = halfX;
        const arenaCenterY = centerY + OFFSET_Y;

        const candidateAX = baseMidX + normalX * curvature;
        const candidateAY = baseMidY + normalY * curvature;
        const candidateBX = baseMidX - normalX * curvature;
        const candidateBY = baseMidY - normalY * curvature;
        const candidateADistance = Math.hypot(candidateAX - arenaCenterX, candidateAY - arenaCenterY);
        const candidateBDistance = Math.hypot(candidateBX - arenaCenterX, candidateBY - arenaCenterY);
        const preferredCurveSign = curvature > 0 && candidateBDistance < candidateADistance ? -1 : 1;
        const curveSign = reverseSegmentIndex >= 0
            ? (segmentIndex < reverseSegmentIndex ? preferredCurveSign : -preferredCurveSign)
            : preferredCurveSign;
        const chosenControlX = curveSign < 0 ? candidateBX : candidateAX;
        const chosenControlY = curveSign < 0 ? candidateBY : candidateAY;
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
        const badgeX = baseBadgeX * (1 - badgeControlPull) + controlX * badgeControlPull + normalX * laneOffset * 0.2;
        const badgeY = baseBadgeY * (1 - badgeControlPull) + controlY * badgeControlPull + normalY * laneOffset * 0.2;
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
    };
    const actionLineItems = actionSegments
        .map((segment, segmentIndex) => {
            const geometry = buildLineGeometry(segment, segmentIndex);
            if (!geometry) {
                return null;
            }

            const value = typeof segment.targetDamage === 'number' && segment.targetDamage > 0
                ? segment.targetDamage
                : typeof segment.targetManaDelta === 'number' && segment.targetManaDelta < 0
                    ? Math.abs(segment.targetManaDelta)
                    : null;

            return {
                segment,
                segmentIndex,
                geometry,
                value,
                palette: getSegmentPalette(segmentIndex),
                gradientId: `attack-line-${segment.cardId}-${segmentIndex}`.replace(/[^a-zA-Z0-9_-]/g, ''),
                targetPos: segment.targetId ? posOf(segment.targetId) : null,
            };
        })
        .filter(Boolean) as Array<{
            segment: GameActionSegment;
            segmentIndex: number;
            geometry: LineGeometry;
            value: number | null;
            palette: ReturnType<typeof getSegmentPalette>;
            gradientId: string;
            targetPos: ReturnType<typeof posOf>;
        }>;
    const primaryActionLine = actionLineItems[0] ?? null;

    const [showProjectile, setShowProjectile] = useState(false);
    const [reactionNow, setReactionNow] = useState(serverNow());
    const [submittingReactionReady, setSubmittingReactionReady] = useState(false);
    const [submittingReactionPress, setSubmittingReactionPress] = useState(false);
    const [submittingReactionDismiss, setSubmittingReactionDismiss] = useState(false);
    const projX = useMotionValue(0);
    const projY = useMotionValue(0);
    const projectileTone = isCanCup
        ? 'bg-black/70 border border-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.45)]'
        : 'bg-black/70 border border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.5)]';

    useEffect(() => {
        if (!primaryActionLine || !lastAction) return;
        if (isCanCup) {
            setShowProjectile(false);
            return;
        }

        projX.set(primaryActionLine.geometry.startX);
        projY.set(primaryActionLine.geometry.startY);
        setShowProjectile(true);

        const ctrlX = animate(projX, primaryActionLine.geometry.endX, { duration: 0.45, ease: 'easeInOut' });
        const ctrlY = animate(projY, primaryActionLine.geometry.endY, { duration: 0.45, ease: 'easeInOut' });

        const timer = setTimeout(() => setShowProjectile(false), 500);
        return () => {
            ctrlX.stop();
            ctrlY.stop();
            clearTimeout(timer);
        };
    }, [
        isCanCup,
        lastAction?.cardId,
        primaryActionLine?.geometry.endX,
        primaryActionLine?.geometry.endY,
        primaryActionLine?.geometry.startX,
        primaryActionLine?.geometry.startY,
        projX,
        projY,
    ]);

    const floatingDamage = isCanCup ? null : (primaryActionLine?.value ?? null);

    const challengeOwnerName = pendingChallenge
        ? players.find((player) => player.id === pendingChallenge.playerId)?.name ?? 'player'
        : '';
    const pendingCanCupFollowUpResponderName = pendingCanCupFollowUp
        ? players.find((player) => player.id === pendingCanCupFollowUp.responderId)?.name ?? 'player'
        : '';
    const isPendingCanCupFollowUpChooser = Boolean(
        pendingCanCupFollowUp &&
        pendingCanCupFollowUp.responderId === currentPlayer.id
    );
    const pendingCanCupFollowUpPrompt = pendingCanCupFollowUp
        ? isPendingCanCupFollowUpChooser
            ? `You got hit. Pick someone else to take ${pendingCanCupFollowUp.sipCount} sip${pendingCanCupFollowUp.sipCount === 1 ? '' : 's'}.`
            : `Waiting for ${pendingCanCupFollowUpResponderName} to pass on ${pendingCanCupFollowUp.sipCount} sip${pendingCanCupFollowUp.sipCount === 1 ? '' : 's'}.`
        : '';
    const isCurrentPlayerSelfTargetable = Boolean(
        selectedCard?.requiresTarget &&
        selectedCard.canTargetSelf &&
        !isChallengeCard(selectedCard) &&
        !pendingChallenge &&
        !isPendingCanCupFollowUpChooser
    );
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
    const hasExplicitDuelists = Boolean(pendingChallenge?.duelistOneId && pendingChallenge?.duelistTwoId);
    const isCircleChallenge = isCanCupCircleChallengeCard(pendingChallenge?.card);
    const isFlamingoChallenge = Boolean(pendingChallenge && /flamingon/i.test(pendingChallenge.card.name));
    const isCategoryChallenge = Boolean(pendingChallenge && /^kategori\b/i.test(pendingChallenge.card.name));
    const isBottomRaceChallenge = isCanCupBottomRaceChallengeCard(pendingChallenge?.card);
    const categoryFromName = pendingChallenge?.card.name.match(/kategori\s*:\s*(.+)$/i)?.[1]?.trim() ?? null;
    const categoryFromDescription = pendingChallenge?.card.description.match(/"([^"]+)"/)?.[1]?.trim() ?? null;
    const categoryLabel = categoryFromName || categoryFromDescription;
    const challengeParticipantsLabel = (() => {
        if (!pendingChallenge) return '';
        if (pendingChallenge.card.name === 'Tungvrickaren') {
            return `${duelistOneName} utmanar ${duelistTwoName} att läsa...`;
        }
        if (isFlamingoChallenge) {
            return `Alla utom ${challengeOwnerName}`;
        }
        if (isCategoryChallenge || (isCircleChallenge && !hasExplicitDuelists)) {
            return categoryLabel ? `Kategori: ${categoryLabel}` : 'Kategori-runda (alla)';
        }
        if (hasExplicitDuelists) {
            return `${duelistOneName} VS ${duelistTwoName}`;
        }
        if (isBottomRaceChallenge) {
            return 'Slumpar motståndare...';
        }
        return 'Alla spelare';
    })();
    const reactionTimes = reactionState?.reactionTimes ?? {};
    const reactionWinnerId = reactionState?.winnerId;
    const reactionLoserId = reactionState?.loserId;
    const reactionWinnerName = reactionWinnerId
        ? players.find((player) => player.id === reactionWinnerId)?.name ?? 'Winner'
        : 'Winner';
    const reactionRows = reactionDuelistIds.map((duelistId) => ({
        id: duelistId,
        name: players.find((player) => player.id === duelistId)?.name ?? 'Duelist',
        time: typeof reactionTimes[duelistId] === 'number' ? reactionTimes[duelistId] : null,
    }));

    // Store the exact physical ms when the screen turned green locally
    const localGreenLitAtRef = useRef<number | null>(null);
    const countdownSessionKeyRef = useRef<string>('');

    useEffect(() => {
        if (!isReactionChallengeCard || !reactionState || reactionState.phase !== 'countdown') return;

        let animationFrameId: number | undefined;
        const targetGreenAt = typeof reactionState.greenAt === 'number' ? reactionState.greenAt : 0;
        const sessionKey = `${reactionState.countdownStartedAt ?? 0}:${targetGreenAt}`;

        if (sessionKey !== countdownSessionKeyRef.current) {
            countdownSessionKeyRef.current = sessionKey;
            localGreenLitAtRef.current = null;
        }

        const tick = () => {
            const current = serverNow();
            setReactionNow(current);

            if (targetGreenAt > 0 && current >= targetGreenAt) {
                if (localGreenLitAtRef.current === null) {
                    localGreenLitAtRef.current = performance.now();
                }
                console.log(`[SYNC-UI] GREEN LIGHT HIT! serverNow()=${current}, target greenAt=${targetGreenAt}, Diff=${current - targetGreenAt}ms`);
                return;
            }

            animationFrameId = requestAnimationFrame(tick);
        };

        if (targetGreenAt > 0) {
            console.log(`[SYNC-UI] Starting countdown monitor. target greenAt=${targetGreenAt}`);
            animationFrameId = requestAnimationFrame(tick);
        }

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [
        isReactionChallengeCard,
        reactionState?.phase,
        reactionState?.countdownStartedAt,
        reactionState?.greenAt,
    ]);

    useEffect(() => {
        if (reactionPhaseLabel === 'green' && localGreenLitAtRef.current === null) {
            localGreenLitAtRef.current = performance.now();
        }
    }, [reactionPhaseLabel]);

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
        const fallbackFromServerTime = reactionState?.greenAt
            ? Math.max(0, Math.round(serverNow() - reactionState.greenAt))
            : 0;
        const reactionTimeMs = localGreenLitAtRef.current !== null
            ? Math.max(0, Math.round(tapTime - localGreenLitAtRef.current))
            : fallbackFromServerTime;

        console.log(`[SYNC-ACTION] Player TAPPED! Exact Physical Reaction Time: ${reactionTimeMs}ms`);

        if (!onReactionPress || submittingReactionPress) return;
        setSubmittingReactionPress(true);
        try {
            await onReactionPress(reactionTimeMs);
        } finally {
            setSubmittingReactionPress(false);
        }
    };

    const handleReactionDismissClick = async () => {
        if (!onReactionResultsDismiss || submittingReactionDismiss || !canResolvePendingChallenge) return;
        setSubmittingReactionDismiss(true);
        try {
            await onReactionResultsDismiss();
        } finally {
            setSubmittingReactionDismiss(false);
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
                    {actionLineItems.map(({ segment, segmentIndex, geometry, palette, gradientId }) => (
                        <motion.svg
                            key={`line-${segment.cardId}-${segmentIndex}-${segment.timestamp ?? segmentIndex}`}
                            className="absolute inset-0 z-[25] pointer-events-none overflow-visible"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, transition: { duration: 0.8 } }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                        >
                            <defs>
                                <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1={geometry.startX} y1={geometry.startY} x2={geometry.endX} y2={geometry.endY}>
                                    <stop offset="0%" stopColor={palette.start} stopOpacity="0.95" />
                                    <stop offset="100%" stopColor={palette.end} stopOpacity="0.92" />
                                </linearGradient>
                            </defs>
                            <motion.path
                                d={geometry.path}
                                fill="none"
                                stroke={palette.glowStroke}
                                strokeWidth={9}
                                strokeLinecap="round"
                                style={{ filter: 'blur(6px)' }}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                exit={{ pathLength: 0 }}
                                transition={{ duration: 0.35, ease: 'easeOut' }}
                            />
                            <motion.path
                                d={geometry.path}
                                fill="none"
                                stroke={`url(#${gradientId})`}
                                strokeWidth={3}
                                strokeLinecap="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                exit={{ pathLength: 0 }}
                                transition={{ duration: 0.35, ease: 'easeOut' }}
                            />
                        </motion.svg>
                    ))}
                </AnimatePresence>

                <AnimatePresence>
                    {actionLineItems.map(({ segment, segmentIndex, geometry, palette }) => (
                        <motion.div
                            key={`arrow-${segment.cardId}-${segmentIndex}-${segment.timestamp ?? segmentIndex}`}
                            className="absolute z-[27] pointer-events-none"
                            style={{
                                left: geometry.endX,
                                top: geometry.endY,
                                translateX: '-50%',
                                translateY: '-50%',
                                rotate: `${geometry.endAngle}deg`,
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
                                    borderLeft: `14px solid ${palette.arrow}`,
                                    filter: `drop-shadow(0 0 8px ${palette.arrow}aa)`,
                                }}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>

                <AnimatePresence>
                    {actionLineItems.map(({ segment, segmentIndex, geometry, palette, value }) => (
                        <motion.div
                            key={`sword-${segment.cardId}-${segmentIndex}-${segment.timestamp ?? segmentIndex}`}
                            className="absolute z-30 pointer-events-none"
                            style={{
                                left: geometry.midX,
                                top: geometry.midY,
                                translateX: '-50%',
                                translateY: '-50%',
                                rotate: `${geometry.midAngle}deg`,
                            }}
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="flex items-center gap-1.5">
                                <div className={`rounded-full p-1.5 border ${palette.iconBorder} ${palette.iconBg} ${palette.iconShadow}`}>
                                    <Sword className={`w-3.5 h-3.5 ${palette.iconText}`} />
                                </div>
                                {isCanCup && value !== null && value > 0 && (
                                    <span
                                        className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-bold ${palette.badgeBorder} ${palette.badgeBg} ${palette.badgeText} ${palette.badgeShadow}`}
                                        style={{ transform: `rotate(${-geometry.midAngle}deg)` }}
                                    >
                                        {formatNumber(value)}
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                <AnimatePresence>
                    {showProjectile && primaryActionLine && (
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
                    {!isCanCup && !showProjectile && primaryActionLine && (
                        <motion.div
                            key={`burst-${primaryActionLine.segment.cardId}`}
                            className="absolute z-30 pointer-events-none"
                            style={{
                                left: primaryActionLine.geometry.endX,
                                top: primaryActionLine.geometry.endY,
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
                    {primaryActionLine?.targetPos && floatingDamage !== null && (
                        <motion.div
                            key={`dmg-${primaryActionLine.segment.cardId}`}
                            className="absolute z-50 pointer-events-none whitespace-nowrap"
                            style={{
                                left: primaryActionLine.targetPos.x + halfX + 24,
                                top: primaryActionLine.targetPos.y + centerY + OFFSET_Y - 28,
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
                    {pendingCanCupFollowUp && !pendingChallenge && (
                        <motion.div
                            key={`follow-up-prompt-${pendingCanCupFollowUp.createdAt}`}
                            className="absolute left-1/2 top-1/2 z-[38] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        >
                            <div className={`max-w-[240px] rounded-2xl border px-4 py-3 text-center backdrop-blur-sm ${isPendingCanCupFollowUpChooser
                                ? 'border-cyan-300/55 bg-cyan-950/80 shadow-[0_0_28px_rgba(34,211,238,0.24)]'
                                : 'border-amber-300/45 bg-amber-950/75 shadow-[0_0_24px_rgba(245,158,11,0.2)]'
                                }`}>
                                <p className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${isPendingCanCupFollowUpChooser ? 'text-cyan-100/85' : 'text-amber-100/80'}`}>
                                    {isPendingCanCupFollowUpChooser ? 'Pass it on' : 'Pending response'}
                                </p>
                                <p className={`mt-1 text-sm font-semibold ${isPendingCanCupFollowUpChooser ? 'text-cyan-50' : 'text-amber-50'}`}>
                                    {pendingCanCupFollowUpPrompt}
                                </p>
                            </div>
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
                                    {challengeParticipantsLabel}
                                </p>
                                <p className={`mt-1 text-xs leading-relaxed line-clamp-3 whitespace-pre-line ${isReactionChallengeCard
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
                                        {reactionPhaseLabel === 'resolved' && (
                                            <div className="mt-2 space-y-1.5">
                                                {reactionRows.map((entry) => (
                                                    <div
                                                        key={`reaction-result-${entry.id}`}
                                                        className={`flex items-center justify-between rounded-md border px-2 py-1 text-[11px] ${entry.id === reactionWinnerId
                                                            ? 'border-emerald-200/45 bg-emerald-900/40 text-emerald-100'
                                                            : entry.id === reactionLoserId
                                                                ? 'border-rose-200/40 bg-rose-900/40 text-rose-100'
                                                                : 'border-amber-200/25 bg-amber-950/35 text-amber-50/90'
                                                            }`}
                                                    >
                                                        <span className="font-semibold">{entry.name}</span>
                                                        <span>{entry.time !== null ? `${entry.time} ms` : '--'}</span>
                                                    </div>
                                                ))}
                                                <p className="text-center text-[11px] font-semibold text-amber-50">
                                                    {reactionWinnerName} vann reaktionsduellen
                                                </p>
                                                {canResolvePendingChallenge ? (
                                                    <button
                                                        type="button"
                                                        onClick={handleReactionDismissClick}
                                                        disabled={submittingReactionDismiss}
                                                        className="w-full rounded-lg border border-amber-200/45 bg-amber-500/90 px-2.5 py-1.5 text-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        <span className="inline-flex items-center gap-1.5">
                                                            <X className="h-3.5 w-3.5" />
                                                            {submittingReactionDismiss ? 'Closing results...' : 'Press to continue'}
                                                        </span>
                                                    </button>
                                                ) : (
                                                    <p className="text-center text-[11px] text-amber-100/90">
                                                        {challengeOwnerName} stänger resultatet när alla hunnit se.
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="mt-2 flex items-center justify-between text-xs">
                                    <span className="rounded-full border border-blue-400/40 bg-blue-950/50 px-2 py-0.5 text-blue-200">
                                        {gameMode === 'can-cup'
                                            ? `Cost ${pendingChallenge.card.sipCost ?? pendingChallenge.card.manaCost ?? 0} sip${(pendingChallenge.card.sipCost ?? pendingChallenge.card.manaCost ?? 0) === 1 ? '' : 's'}`
                                            : `Mana ${pendingChallenge.card.manaCost ?? 0}`}
                                    </span>
                                    <span className={gameMode === 'can-cup' ? 'text-cyan-50/80' : 'text-purple-100/80'}>
                                        {isReactionChallengeCard
                                            ? (reactionPhaseLabel === 'green'
                                                ? 'Green! Duelists tap now'
                                                : reactionPhaseLabel === 'countdown'
                                                    ? 'Countdown running...'
                                                    : reactionPhaseLabel === 'resolved'
                                                        ? (canResolvePendingChallenge ? 'Press X to continue' : `${challengeOwnerName} visar resultaten`)
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

                {
                    opponents.map((player, index) => {
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
                                        isPendingCanCupFollowUpChooser
                                            ? player.id !== currentPlayer.id && !isUntargetablePlayer(player)
                                            : (
                                                selectedCard?.requiresTarget &&
                                                !isUntargetablePlayer(player) &&
                                                (selectedCard.effect.type === 'manaRefill' || player.id !== currentPlayer.id)
                                            )
                                    )}
                                    isDrunk={gameMode === 'can-cup' ? false : projectedIntake >= drunkThreshold * 0.8}
                                    drunkThreshold={drunkThreshold}
                                    projectedManaIntake={projectedIntake}
                                    drunkSeconds={getProjectedDrunkSeconds(player)}
                                    drunkTimeLimitSeconds={drunkTimeLimitSeconds}
                                    maxMana={maxMana}
                                    onSelect={isPendingCanCupFollowUpChooser
                                        ? () => onTargetSelect(player.id)
                                        : (selectedCard && !isChallengeCard(selectedCard) ? () => onTargetSelect(player.id) : undefined)}
                                    gameMode={gameMode}
                                    canCupSipsPerCan={settings?.canCupSipsPerCan ?? GAME_CONFIG.CAN_CUP_SIPS_PER_CAN}
                                    pendingCanCupSip={pendingCanCupSips?.[player.id]}
                                    compact={useCompactAvatars}
                                />
                            </motion.div>
                        );
                    })
                }

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
                        isTargetable={isCurrentPlayerSelfTargetable}
                        isDrunk={gameMode === 'can-cup' ? false : getProjectedIntake(currentPlayer) >= drunkThreshold * 0.8}
                        drunkThreshold={drunkThreshold}
                        projectedManaIntake={getProjectedIntake(currentPlayer)}
                        drunkSeconds={getProjectedDrunkSeconds(currentPlayer)}
                        drunkTimeLimitSeconds={drunkTimeLimitSeconds}
                        maxMana={maxMana}
                        onSelect={isCurrentPlayerSelfTargetable ? () => onTargetSelect(currentPlayer.id) : undefined}
                        isYou
                        gameMode={gameMode}
                        canCupSipsPerCan={settings?.canCupSipsPerCan ?? GAME_CONFIG.CAN_CUP_SIPS_PER_CAN}
                        pendingCanCupSip={pendingCanCupSips?.[currentPlayer.id]}
                        compact={useCompactAvatars}
                    />
                </motion.div>
            </div>

            {!lastAction && !pendingChallenge && !pendingCanCupFollowUp && (
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
