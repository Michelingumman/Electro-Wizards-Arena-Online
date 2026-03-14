import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, Player } from '../../../types/game';
import { Users, Swords, X } from 'lucide-react';

interface ChallengeParticipantsModalProps {
    card: Card;
    players: Player[];
    currentPlayerId: string;
    onConfirm: (duelistOneId: string, duelistTwoId: string) => Promise<void>;
    onCancel: () => void;
}

export function ChallengeParticipantsModal({
    card,
    players,
    currentPlayerId,
    onConfirm,
    onCancel,
}: ChallengeParticipantsModalProps) {
    const usesOwnerTargetSetup = card.challengeParticipantMode === 'owner-target';
    const selectablePlayers = useMemo(
        () => players.filter((player) =>
            player.id === currentPlayerId ||
            !player.effects?.some((effect) => effect.type === 'untargetable' && effect.duration > 0)
        ),
        [currentPlayerId, players]
    );

    // Owner-target challenges always lock the caster as Duelist 1.
    const [duelistOneId, setDuelistOneId] = useState(() => usesOwnerTargetSetup ? currentPlayerId : '');
    const [duelistTwoId, setDuelistTwoId] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const duelistOneName = useMemo(
        () => players.find((player) => player.id === duelistOneId)?.name ?? 'Duelist 1',
        [players, duelistOneId]
    );
    const duelistTwoName = useMemo(
        () => players.find((player) => player.id === duelistTwoId)?.name ?? 'Duelist 2',
        [players, duelistTwoId]
    );

    const handleConfirm = async () => {
        if (!duelistOneId || !duelistTwoId) {
            setError('Select two duelists first.');
            return;
        }
        if (duelistOneId === duelistTwoId) {
            setError('Duelists must be different players.');
            return;
        }

        setError(null);
        setSaving(true);
        try {
            await onConfirm(duelistOneId, duelistTwoId);
        } catch (confirmError) {
            setError('Failed to start challenge. Try again.');
            console.error('Failed to save challenge participants:', confirmError);
        } finally {
            setSaving(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="w-full max-w-sm rounded-2xl border border-purple-500/40 bg-gray-950/95 shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
                >
                    <div className="flex items-center justify-between border-b border-purple-500/20 px-4 py-3">
                        <div className="min-w-0">
                            <p className="text-[11px] uppercase tracking-wide text-purple-300/80">Challenge Setup</p>
                            <h3 className="truncate text-base font-semibold text-white">{card.name}</h3>
                        </div>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="rounded-md p-1 text-gray-400 transition-colors hover:text-gray-200"
                            aria-label="Close challenge setup"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="space-y-3 px-4 py-4">
                        <p className="text-xs text-gray-300">
                            {usesOwnerTargetSetup
                                ? 'Choose a target for this challenge.'
                                : 'Choose both duelists before publishing this challenge to the arena.'}
                        </p>

                        {!usesOwnerTargetSetup && (
                            <label className="block">
                                <span className="mb-1 block text-[11px] uppercase tracking-wide text-gray-400">Duelist 1</span>
                                <select
                                    value={duelistOneId}
                                    onChange={(event) => setDuelistOneId(event.target.value)}
                                    className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
                                >
                                    <option value="">Select player...</option>
                                    {selectablePlayers.map((player) => (
                                        <option key={player.id} value={player.id}>
                                            {player.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        )}

                        <label className="block">
                            <span className="mb-1 block text-[11px] uppercase tracking-wide text-gray-400">
                                {usesOwnerTargetSetup ? 'Välj offer (Target)' : 'Duelist 2'}
                            </span>
                            <select
                                value={duelistTwoId}
                                onChange={(event) => setDuelistTwoId(event.target.value)}
                                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
                            >
                                <option value="">Select player...</option>
                                {selectablePlayers.map((player) => (
                                    <option key={player.id} value={player.id} disabled={player.id === duelistOneId}>
                                        {player.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <div className="rounded-xl border border-purple-400/30 bg-purple-950/40 px-3 py-2 text-xs text-purple-100">
                            <div className="flex items-center gap-1.5 font-semibold">
                                <Swords className="h-3.5 w-3.5 text-purple-200" />
                                {duelistOneName} VS {duelistTwoName}
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs text-red-200">
                                {error}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-purple-500/20 px-4 py-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-300 transition-colors hover:border-gray-600 hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={saving}
                            className="inline-flex items-center gap-1 rounded-lg border border-purple-400/50 bg-purple-600/90 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Users className="h-3.5 w-3.5" />
                            {saving ? 'Saving...' : 'Start Challenge'}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
