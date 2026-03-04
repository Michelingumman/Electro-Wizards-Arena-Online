import { GameMode, PendingCanCupSipResolution, Player } from '../../../types/game';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { Beer, FlaskConical, Shield } from 'lucide-react';

interface ModernPlayerAvatarProps {
    player: Player;
    isCurrentTurn: boolean;
    isTargetable: boolean;
    isDrunk?: boolean;
    drunkThreshold?: number;
    projectedManaIntake?: number;
    drunkSeconds?: number;
    drunkTimeLimitSeconds?: number;
    maxMana?: number;
    onSelect?: () => void;
    isYou?: boolean;
    compact?: boolean;
    gameMode?: GameMode;
    canCupSipsPerCan?: number;
    pendingCanCupSip?: PendingCanCupSipResolution;
}

function formatClock(seconds: number) {
    if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function ModernPlayerAvatar({
    player,
    isCurrentTurn,
    isTargetable,
    isDrunk = false,
    drunkThreshold = 20,
    projectedManaIntake,
    drunkSeconds,
    drunkTimeLimitSeconds,
    maxMana = 20,
    onSelect,
    isYou = false,
    compact = false,
    gameMode = 'afterski',
    canCupSipsPerCan = 10,
    pendingCanCupSip,
}: ModernPlayerAvatarProps) {
    const intakeValue = projectedManaIntake ?? player.manaIntake ?? 0;
    const intakePercent = Math.min(100, Math.max(0, (intakeValue / drunkThreshold) * 100));
    const drunkLine = 80;
    const isDrunkState = isDrunk || intakePercent >= drunkLine;
    const canCupCapacity = Math.max(1, Math.round(canCupSipsPerCan));
    const canCupState = player.canCup ?? {
        sipsLeft: canCupCapacity,
        waterSips: 0,
        deflectCharges: 0,
        emptyCans: 0,
    };
    const beerSips = Math.max(0, Math.min(canCupCapacity, Math.round(canCupState.sipsLeft)));
    const waterSips = Math.max(0, Math.round(canCupState.waterSips));
    const beerPercent = Math.min(100, Math.max(0, (beerSips / canCupCapacity) * 100));
    const waterPercent = Math.min(100, Math.max(0, (waterSips / canCupCapacity) * 100));
    const totalLiquidPercent = Math.min(100, beerPercent + waterPercent);
    const waterLayerPercent = Math.min(waterPercent, totalLiquidPercent);
    const waterLayerBottomPercent = Math.max(0, totalLiquidPercent - waterLayerPercent);
    const beerLayerPercent = Math.max(0, totalLiquidPercent - waterLayerPercent);
    const pendingWaterSips = Math.max(0, Math.round(pendingCanCupSip?.waterSipsToConsume ?? 0));
    const pendingBeerSips = Math.max(0, Math.round(pendingCanCupSip?.beerSipsToConsume ?? 0));
    const pendingWaterPercent = Math.min(100, Math.max(0, (pendingWaterSips / canCupCapacity) * 100));
    const pendingBeerPercent = Math.min(100, Math.max(0, (pendingBeerSips / canCupCapacity) * 100));
    const pendingWaterLayerPercent = Math.min(pendingWaterPercent, waterLayerPercent);
    const pendingWaterBottomPercent = Math.max(0, totalLiquidPercent - pendingWaterLayerPercent);
    const pendingBeerLayerPercent = Math.min(pendingBeerPercent, beerLayerPercent);
    const pendingBeerBottomPercent = Math.max(0, totalLiquidPercent - waterLayerPercent - pendingBeerLayerPercent);
    const mugWidth = compact ? 44 : 54;
    const mugHeight = compact ? 66 : 80;
    const avatarSizeClass = compact ? 'w-[64px] h-[64px]' : 'w-[72px] h-[72px]';
    const drunkTimerSeconds = Math.max(0, drunkSeconds ?? player.drunkSeconds ?? 0);
    const drunkTimerProgress = !drunkTimeLimitSeconds || drunkTimeLimitSeconds <= 0
        ? 0
        : drunkTimerSeconds / drunkTimeLimitSeconds;
    const drunkTimerText = formatClock(drunkTimerSeconds);

    if (gameMode === 'can-cup') {
        return (
            <motion.div
                layout
                onClick={isTargetable && onSelect ? onSelect : undefined}
                className={clsx(
                    'flex flex-col items-center gap-1.5 transition-all duration-200',
                    isTargetable && 'cursor-pointer'
                )}
                animate={isTargetable ? { scale: [1, 1.03, 1] } : undefined}
                transition={isTargetable ? { repeat: Infinity, duration: 1.5 } : undefined}
            >
                <span
                    className={clsx(
                        compact ? 'text-[12px]' : 'text-[14px]',
                        'font-semibold tracking-[0.02em] max-w-[130px] truncate text-center leading-tight drop-shadow-[0_1px_6px_rgba(0,0,0,0.45)]',
                        isCurrentTurn ? 'text-indigo-100' : 'text-gray-200'
                    )}
                >
                    {player.name}
                </span>
                <div className="relative flex flex-col items-center gap-1">
                    <div className="relative">
                        {isCurrentTurn && (
                            <motion.div
                                className="absolute -inset-3 rounded-[20px] bg-indigo-400/30 blur-xl"
                                animate={{ opacity: [0.35, 0.8, 0.35], scale: [1, 1.08, 1] }}
                                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                            />
                        )}

                        <motion.div
                            className={clsx(
                                'relative rounded-[16px] border overflow-hidden bg-slate-950/45',
                                isYou
                                    ? 'border-cyan-300/80 shadow-[0_0_18px_rgba(34,211,238,0.35)]'
                                    : isCurrentTurn
                                        ? 'border-indigo-300/80 shadow-[0_0_18px_rgba(129,140,248,0.38)]'
                                        : 'border-slate-400/70',
                                isTargetable && 'ring-2 ring-rose-400/70 ring-offset-2 ring-offset-[#120d1f]'
                            )}
                            style={{ width: mugWidth, height: mugHeight }}
                            animate={isCurrentTurn ? { scale: [1, 1.03, 1] } : undefined}
                            transition={isCurrentTurn ? { repeat: Infinity, duration: 1.4 } : undefined}
                        >
                            <motion.div
                                className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-amber-700/95 via-amber-500/92 to-amber-300/85"
                                style={{ height: `${beerLayerPercent}%` }}
                                animate={{ height: `${beerLayerPercent}%` }}
                                transition={{ type: 'spring', stiffness: 160, damping: 20 }}
                            />

                            {waterLayerPercent > 0 && (
                                <motion.div
                                    className="absolute inset-x-0 bg-gradient-to-b from-cyan-200/85 via-cyan-300/75 to-cyan-500/65"
                                    style={{ bottom: `${waterLayerBottomPercent}%`, height: `${waterLayerPercent}%` }}
                                    animate={{ bottom: `${waterLayerBottomPercent}%`, height: `${waterLayerPercent}%` }}
                                    transition={{ type: 'spring', stiffness: 160, damping: 20 }}
                                />
                            )}

                            {pendingWaterLayerPercent > 0 && (
                                <motion.div
                                    className="absolute inset-x-0 bg-slate-300/30 backdrop-saturate-0"
                                    style={{ bottom: `${pendingWaterBottomPercent}%`, height: `${pendingWaterLayerPercent}%` }}
                                    animate={{ bottom: `${pendingWaterBottomPercent}%`, height: `${pendingWaterLayerPercent}%` }}
                                    transition={{ duration: 0.2 }}
                                />
                            )}

                            {pendingBeerLayerPercent > 0 && (
                                <motion.div
                                    className="absolute inset-x-0 bg-slate-300/30 backdrop-saturate-0"
                                    style={{ bottom: `${pendingBeerBottomPercent}%`, height: `${pendingBeerLayerPercent}%` }}
                                    animate={{ bottom: `${pendingBeerBottomPercent}%`, height: `${pendingBeerLayerPercent}%` }}
                                    transition={{ duration: 0.2 }}
                                />
                            )}

                            <div className="absolute inset-x-0 top-0 bottom-0 pointer-events-none">
                                {Array.from({ length: Math.max(1, canCupCapacity - 1) }).map((_, index) => (
                                    <div
                                        key={`sip-line-${player.id}-${index}`}
                                        className="absolute left-1 right-1 h-[1px] bg-white/45 shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
                                        style={{
                                            bottom: `${((index + 1) / canCupCapacity) * 100}%`,
                                            transform: 'translateY(0.5px)'
                                        }}
                                    />
                                ))}
                            </div>

                            <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent" />
                        </motion.div>


                    </div>

                    <div className="flex items-center gap-1 mt-0.5">
                        <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-300/40 bg-amber-950/60 px-1.5 py-0.5 text-[9px] font-semibold text-amber-100 shadow-[0_0_10px_rgba(251,191,36,0.2)]">
                            <Beer className="w-2.5 h-2.5" />
                            x{canCupState.emptyCans}
                        </span>
                        <span className="inline-flex items-center gap-0.5 rounded-full border border-indigo-300/45 bg-indigo-900/75 px-1.5 py-0.5 text-[9px] text-indigo-100 shadow-[0_0_8px_rgba(129,140,248,0.25)]">
                            <Shield className="w-2.5 h-2.5" />
                            {canCupState.deflectCharges}
                        </span>
                    </div>
                </div>

                {isTargetable && (
                    <span className="text-[8px] text-rose-400 font-semibold uppercase animate-pulse">Target</span>
                )}
            </motion.div>
        );
    }

    return (
        <motion.div
            layout
            onClick={isTargetable && onSelect ? onSelect : undefined}
            className={clsx(
                'flex flex-col items-center gap-1.5 transition-all duration-200',
                isTargetable && 'cursor-pointer'
            )}
            animate={isTargetable ? { scale: [1, 1.04, 1] } : undefined}
            transition={isTargetable ? { repeat: Infinity, duration: 1.5 } : undefined}
        >
            <span
                className={clsx(
                    compact ? 'text-[12px]' : 'text-[14px]',
                    'font-semibold tracking-[0.02em] max-w-[116px] truncate text-center leading-tight drop-shadow-[0_1px_6px_rgba(0,0,0,0.45)]',
                    isCurrentTurn ? 'text-purple-200' : 'text-gray-300'
                )}
            >
                {player.name}
            </span>
            {isCurrentTurn && (
                <span className="text-[9px] uppercase tracking-[0.18em] text-purple-200/90">
                    Turn
                </span>
            )}

            <div className="flex items-center gap-2">
                <div
                    className={clsx(
                        'relative rounded-full overflow-hidden border',
                        avatarSizeClass,
                        isYou
                            ? 'border-cyan-300/70 shadow-[0_0_16px_rgba(34,211,238,0.35)]'
                            : isCurrentTurn
                                ? 'border-purple-300/70 shadow-[0_0_16px_rgba(168,85,247,0.35)]'
                                : 'border-gray-600/70',
                        isTargetable && 'ring-2 ring-red-400/70 ring-offset-2 ring-offset-gray-950'
                    )}
                >
                    <div
                        className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-cyan-500/70 to-blue-300/55 transition-all duration-300"
                        style={{ height: `${intakePercent}%` }}
                    />
                    <div className="absolute left-0 right-0 border-t border-dashed border-red-200/70" style={{ bottom: `${drunkLine}%` }} />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />

                    {isCurrentTurn && (
                        <>
                            <div className="absolute -inset-2 rounded-full bg-purple-500/30 blur-md animate-pulse" />
                            <div className="absolute inset-0 rounded-full border-2 border-purple-300/80 shadow-[0_0_18px_rgba(168,85,247,0.65)]" />
                            <div className="absolute inset-0 rounded-full border-2 border-purple-400/70 animate-ping opacity-30" />
                        </>
                    )}

                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className={clsx(
                            'font-mono text-[11px] px-1.5 py-0.5 rounded-md bg-black/40',
                            drunkTimerProgress >= 1
                                ? 'text-red-200'
                                : drunkTimerProgress >= 0.8 || isDrunkState
                                    ? 'text-amber-200'
                                    : 'text-gray-100'
                        )}>
                            {drunkTimerText}
                        </span>
                    </div>
                </div>

                <div className="relative h-8 min-w-[36px] shrink-0 rounded-lg border border-blue-300/45 bg-blue-950/65 px-1.5 shadow-[0_0_8px_rgba(56,189,248,0.22)]">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <FlaskConical className="w-4 h-4 text-cyan-200/30" />
                    </div>
                    <div className="relative z-10 flex h-full items-center justify-center">
                        <span className="text-[9px] font-semibold text-blue-50">
                            {Math.min(player.mana, maxMana).toFixed(1)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-1.5 text-[9px]">
                <span className={clsx(
                    'rounded-full border px-1.5 py-0.5',
                    intakePercent >= 80
                        ? 'border-red-300/50 bg-red-950/40 text-red-200'
                        : intakePercent >= 50
                            ? 'border-amber-300/50 bg-amber-950/40 text-amber-200'
                            : 'border-emerald-300/45 bg-emerald-950/35 text-emerald-200'
                )}>
                    Intake {intakeValue.toFixed(1)}/{drunkThreshold}
                </span>
                <span className="text-gray-300">{Math.round(intakePercent)}%</span>
            </div>

            {isTargetable && (
                <span className="text-[8px] text-red-400 font-semibold uppercase animate-pulse">Target</span>
            )}
        </motion.div>
    );
}
