import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { PendingCanCupReplacementChoice } from '../../../types/game';

interface CanCupReplacementChoiceModalProps {
    choice: PendingCanCupReplacementChoice;
    onChoose: (cardId: string) => Promise<void>;
}

const RARITY_STYLES: Record<string, { border: string; bg: string; badge: string }> = {
    common: {
        border: 'border-cyan-500/30',
        bg: 'from-slate-800/95 to-slate-950/95',
        badge: 'bg-cyan-600/90',
    },
    rare: {
        border: 'border-teal-400/30',
        bg: 'from-teal-900/85 to-slate-950/95',
        badge: 'bg-teal-600/90',
    },
    epic: {
        border: 'border-indigo-400/30',
        bg: 'from-indigo-900/90 to-violet-950/95',
        badge: 'bg-indigo-600/90',
    },
    legendary: {
        border: 'border-amber-400/40',
        bg: 'from-amber-900/85 to-red-950/95',
        badge: 'bg-amber-600/90',
    },
};

export function CanCupReplacementChoiceModal({ choice, onChoose }: CanCupReplacementChoiceModalProps) {
    const [submittingCardId, setSubmittingCardId] = useState<string | null>(null);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[190] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.96, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.96, opacity: 0 }}
                    className="w-full max-w-2xl rounded-3xl border border-cyan-400/25 bg-[#071322]/95 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
                >
                    <div className="flex items-start gap-3">
                        <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-2.5">
                            <Sparkles className="h-5 w-5 text-cyan-200" />
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/70">Reward Choice</p>
                            <h2 className="mt-1 text-xl font-semibold text-white">Choose your next card</h2>
                            <p className="mt-2 text-sm text-cyan-100/75">
                                <span className="font-semibold text-cyan-100">{choice.sourceCardName}</span> won you a bonus pick.
                                Choose 1 of these 2 cards to replace the one you just played. Your turn ends after the pick.
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                        {choice.options.map((card) => {
                            const rarityStyle = RARITY_STYLES[card.rarity] ?? RARITY_STYLES.common;
                            const cost = card.sipCost ?? card.manaCost ?? 0;
                            const isSubmitting = submittingCardId === card.id;

                            return (
                                <button
                                    key={card.id}
                                    type="button"
                                    disabled={Boolean(submittingCardId)}
                                    onClick={async () => {
                                        setSubmittingCardId(card.id);
                                        try {
                                            await onChoose(card.id);
                                        } finally {
                                            setSubmittingCardId(null);
                                        }
                                    }}
                                    className={clsx(
                                        'rounded-2xl border bg-gradient-to-b p-4 text-left transition-all',
                                        rarityStyle.border,
                                        rarityStyle.bg,
                                        submittingCardId ? 'cursor-wait opacity-70' : 'hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.99]'
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-white">{card.name}</p>
                                            <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-white/45">{card.rarity}</p>
                                        </div>
                                        <span className={clsx('rounded-full px-2 py-1 text-[10px] font-bold text-white', rarityStyle.badge)}>
                                            {cost} sip{cost === 1 ? '' : 's'}
                                        </span>
                                    </div>
                                    <p className="mt-4 text-sm leading-relaxed text-white/72">{card.description}</p>
                                    <div className="mt-5 inline-flex rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold text-cyan-100">
                                        {isSubmitting ? 'Choosing...' : 'Choose this card'}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
