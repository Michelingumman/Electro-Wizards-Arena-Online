import { Player } from '../../../types/game';
import { Wine } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

interface ModernPlayerAvatarProps {
    player: Player;
    isCurrentTurn: boolean;
    isTargetable: boolean;
    isDrunk?: boolean;
    drunkThreshold?: number;
    onSelect?: () => void;
    isYou?: boolean;
    compact?: boolean;
}

export function ModernPlayerAvatar({
    player,
    isCurrentTurn,
    isTargetable,
    isDrunk = false,
    drunkThreshold = 20,
    onSelect,
    isYou = false,
    compact = false,
}: ModernPlayerAvatarProps) {
    const drunkPercent = Math.min(100, Math.floor((player.manaIntake / drunkThreshold) * 100));
    const initial = player.name.charAt(0).toUpperCase();

    return (
        <motion.div
            layout
            onClick={isTargetable && onSelect ? onSelect : undefined}
            className={clsx(
                "flex flex-col items-center gap-1 transition-all duration-200",
                isTargetable && "cursor-pointer"
            )}
            animate={isTargetable ? { scale: [1, 1.05, 1] } : { scale: 1 }}
            transition={isTargetable ? { repeat: Infinity, duration: 1.5 } : {}}
        >
            {/* Avatar Circle */}
            <div className={clsx(
                "relative rounded-full flex items-center justify-center font-bold transition-all duration-300",
                compact ? "w-10 h-10 text-xs" : "w-11 h-11 text-sm",
                isYou
                    ? "bg-cyan-700 text-white ring-2 ring-cyan-400 ring-offset-2 ring-offset-gray-900 shadow-lg shadow-cyan-500/30"
                    : isCurrentTurn
                        ? "bg-purple-600 text-white ring-2 ring-purple-400 ring-offset-2 ring-offset-gray-900 shadow-lg shadow-purple-500/30"
                        : isDrunk
                            ? "bg-amber-800 text-amber-200 ring-1 ring-amber-500/50"
                            : "bg-gray-700 text-gray-300 ring-1 ring-gray-600",
                isTargetable && "ring-2 ring-red-400 ring-offset-2 ring-offset-gray-900"
            )}>
                {initial}

                {/* Drunk indicator */}
                {isDrunk && (
                    <Wine className="absolute -bottom-1 -right-1 w-3 h-3 text-amber-400" />
                )}

                {/* Current turn pulse ring */}
                {isCurrentTurn && (
                    <div className="absolute inset-0 rounded-full border-2 border-purple-400 animate-ping opacity-30" />
                )}
            </div>

            {/* Name */}
            <span className={clsx(
                "text-[10px] font-medium max-w-[60px] truncate",
                isCurrentTurn ? "text-purple-300" : "text-gray-500"
            )}>
                {player.name}
            </span>

            {/* Mana Bar */}
            <div className="w-10 flex items-center gap-0.5">
                <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (player.mana / 20) * 100)}%` }}
                    />
                </div>
                <span className="text-[8px] text-gray-600 font-mono w-4 text-right">{player.mana.toFixed(0)}</span>
            </div>

            {/* Drunk Progress (tiny bar) */}
            {player.manaIntake > 0 && (
                <div className="w-10 h-0.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className={clsx(
                            "h-full rounded-full transition-all duration-300",
                            drunkPercent >= 80 ? "bg-red-500" : drunkPercent >= 50 ? "bg-amber-500" : "bg-green-600"
                        )}
                        style={{ width: `${drunkPercent}%` }}
                    />
                </div>
            )}

            {/* Targetable label */}
            {isTargetable && (
                <span className="text-[8px] text-red-400 font-semibold uppercase animate-pulse">Target</span>
            )}
        </motion.div>
    );
}
