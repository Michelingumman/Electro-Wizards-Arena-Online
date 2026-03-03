import { Player } from '../../../types/game';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

interface ModernPlayerAvatarProps {
    player: Player;
    isCurrentTurn: boolean;
    isTargetable: boolean;
    isDrunk?: boolean;
    drunkThreshold?: number;
    projectedManaIntake?: number;
    soberSeconds?: number;
    maxMana?: number;
    onSelect?: () => void;
    isYou?: boolean;
    compact?: boolean;
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
    soberSeconds,
    maxMana = 20,
    onSelect,
    isYou = false,
    compact = false,
}: ModernPlayerAvatarProps) {
    const intakeValue = projectedManaIntake ?? player.manaIntake ?? 0;
    const intakePercent = Math.min(100, Math.max(0, (intakeValue / drunkThreshold) * 100));
    const manaPercent = Math.min(100, Math.max(0, (player.mana / maxMana) * 100));
    const drunkLine = 80;
    const isDrunkState = isDrunk || intakePercent >= drunkLine;

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
                        compact ? 'w-[64px] h-[64px]' : 'w-[72px] h-[72px]',
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
                        <span className={clsx('font-mono text-[11px] px-1.5 py-0.5 rounded-md bg-black/40', isDrunkState ? 'text-amber-200' : 'text-gray-100')}>
                            {formatClock(soberSeconds ?? 0)}
                        </span>
                    </div>
                </div>

                <div className="relative h-[58px] w-[26px] shrink-0">
                    <div className="absolute left-1/2 top-0 h-2.5 w-3 -translate-x-1/2 rounded-t-md border border-blue-300/50 bg-blue-950/70" />
                    <div className="absolute bottom-0 left-1/2 h-[49px] w-[24px] -translate-x-1/2 overflow-hidden rounded-[10px] border border-blue-300/50 bg-blue-950/70 shadow-[0_0_8px_rgba(56,189,248,0.28)]">
                        <div
                            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-500 to-blue-400 transition-all duration-300"
                            style={{ height: `${manaPercent}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[9px] font-semibold text-blue-50 drop-shadow-[0_1px_4px_rgba(0,0,0,0.65)]">
                                {player.mana.toFixed(1)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {isTargetable && (
                <span className="text-[8px] text-red-400 font-semibold uppercase animate-pulse">Target</span>
            )}
        </motion.div>
    );
}
