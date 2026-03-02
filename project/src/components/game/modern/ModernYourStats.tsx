import { Player } from '../../../types/game';
import { Droplet, Wine, Shield } from 'lucide-react';
import { clsx } from 'clsx';
import { GAME_CONFIG } from '../../../config/gameConfig';

interface ModernYourStatsProps {
    player: Player;
    isCurrentTurn: boolean;
    drunkThreshold?: number;
    onDrink: () => void;
    manaDrinkAmount: number;
}

export function ModernYourStats({
    player,
    isCurrentTurn,
    drunkThreshold = GAME_CONFIG.DRUNK_THRESHOLD,
    onDrink,
    manaDrinkAmount
}: ModernYourStatsProps) {
    const isDrunk = player.isDrunk || false;
    const drunkPercent = Math.min(100, Math.floor((player.manaIntake / drunkThreshold) * 100));

    return (
        <div className={clsx(
            "flex items-center gap-3 px-3 py-2 rounded-xl border transition-all duration-300",
            isCurrentTurn
                ? "bg-purple-900/30 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.15)]"
                : "bg-gray-900/60 border-gray-800/50"
        )}>
            {/* YOU badge + name */}
            <div className="flex items-center gap-2 min-w-0">
                <div className={clsx(
                    "shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                    isCurrentTurn ? "bg-purple-600 text-white" : "bg-gray-700 text-gray-300"
                )}>
                    {player.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-white truncate">{player.name}</span>
                        {isDrunk && <Wine className="w-3 h-3 text-amber-400 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px]">
                        {/* Mana */}
                        <span className="flex items-center gap-0.5 text-blue-400">
                            <Droplet className="w-2.5 h-2.5" />
                            {player.mana.toFixed(1)}
                        </span>
                        {/* Drunk bar inline */}
                        <div className="w-10 h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className={clsx(
                                    "h-full rounded-full transition-all",
                                    drunkPercent >= 80 ? "bg-red-500" : drunkPercent >= 50 ? "bg-amber-500" : "bg-green-600"
                                )}
                                style={{ width: `${drunkPercent}%` }}
                            />
                        </div>
                        <span className="text-gray-600">{player.manaIntake.toFixed(0)}/{drunkThreshold}</span>
                    </div>
                </div>
            </div>

            {/* Effects */}
            {player.effects && player.effects.length > 0 && (
                <div className="flex gap-0.5 shrink-0">
                    {player.effects.map((eff, i) => (
                        <div key={i} className="w-5 h-5 rounded bg-blue-900/50 flex items-center justify-center" title={`${eff.type} (${eff.duration}t)`}>
                            <Shield className="w-3 h-3 text-blue-400" />
                        </div>
                    ))}
                </div>
            )}

            {/* Drink button */}
            <button
                onClick={onDrink}
                className={clsx(
                    "shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95",
                    isCurrentTurn
                        ? "bg-amber-600 hover:bg-amber-500 text-white shadow-sm"
                        : "bg-gray-800 text-gray-500 cursor-not-allowed"
                )}
                disabled={!isCurrentTurn}
            >
                <Wine className="w-3 h-3" />
                Drink
            </button>

            {/* Turn indicator */}
            {isCurrentTurn && (
                <div className="shrink-0 w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Your turn!" />
            )}
        </div>
    );
}
