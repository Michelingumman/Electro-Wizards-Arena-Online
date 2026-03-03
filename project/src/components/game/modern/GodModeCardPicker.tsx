import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wrench } from 'lucide-react';
import { Card } from '../../../types/game';
import { CardBase, CardRarity } from '../../../types/cards';
import { CAN_CUP_CARDS } from '../../../config/cards/pools/canCup';
import clsx from 'clsx';

interface GodModeCardPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onPickCard: (cardBase: CardBase) => void;
    replacingCard: Card | null;
}

const RARITY_ORDER: CardRarity[] = [CardRarity.COMMON, CardRarity.RARE, CardRarity.EPIC, CardRarity.LEGENDARY];

const RARITY_STYLES: Record<string, { label: string; border: string; bg: string; text: string }> = {
    common: { label: 'Common', border: 'border-cyan-600/40', bg: 'bg-slate-800/90', text: 'text-cyan-200' },
    rare: { label: 'Rare', border: 'border-teal-500/40', bg: 'bg-teal-900/60', text: 'text-teal-200' },
    epic: { label: 'Epic', border: 'border-indigo-400/40', bg: 'bg-indigo-900/60', text: 'text-indigo-200' },
    legendary: { label: 'Legendary', border: 'border-amber-400/50', bg: 'bg-amber-900/50', text: 'text-amber-200' },
};

export function GodModeCardPicker({ isOpen, onClose, onPickCard, replacingCard }: GodModeCardPickerProps) {
    const [selectedRarity, setSelectedRarity] = useState<CardRarity | 'all'>('all');

    const filteredCards = selectedRarity === 'all'
        ? CAN_CUP_CARDS
        : CAN_CUP_CARDS.filter(c => c.rarity === selectedRarity);

    const grouped = RARITY_ORDER.map(rarity => ({
        rarity,
        cards: filteredCards.filter(c => c.rarity === rarity),
    })).filter(g => g.cards.length > 0);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex flex-col bg-black/85 backdrop-blur-md"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-amber-400/20">
                        <div className="flex items-center gap-2">
                            <Wrench className="w-4 h-4 text-amber-400" />
                            <h2 className="text-sm font-bold text-amber-200 uppercase tracking-wider">God Mode — Välj Kort</h2>
                        </div>
                        <button type="button" onClick={onClose} className="p-1.5 rounded-lg bg-white/10 text-white/80 hover:bg-white/20">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {replacingCard && (
                        <div className="px-4 py-2 bg-amber-950/40 border-b border-amber-400/10">
                            <p className="text-[10px] text-amber-300/80">Ersätter: <strong className="text-amber-100">{replacingCard.name}</strong></p>
                        </div>
                    )}

                    {/* Rarity Filter */}
                    <div className="flex gap-1.5 px-4 py-2 overflow-x-auto">
                        <button
                            type="button"
                            onClick={() => setSelectedRarity('all')}
                            className={clsx(
                                'shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all',
                                selectedRarity === 'all'
                                    ? 'bg-white/15 border-white/30 text-white'
                                    : 'bg-white/5 border-white/10 text-white/50'
                            )}
                        >
                            Alla
                        </button>
                        {RARITY_ORDER.map(r => {
                            const style = RARITY_STYLES[r];
                            const count = CAN_CUP_CARDS.filter(c => c.rarity === r).length;
                            return (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setSelectedRarity(r)}
                                    className={clsx(
                                        'shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all',
                                        selectedRarity === r
                                            ? `${style.bg} ${style.border} ${style.text}`
                                            : 'bg-white/5 border-white/10 text-white/50'
                                    )}
                                >
                                    {style.label} ({count})
                                </button>
                            );
                        })}
                    </div>

                    {/* Card Grid */}
                    <div className="flex-1 overflow-y-auto px-4 pb-8">
                        {grouped.map(({ rarity, cards }) => {
                            const style = RARITY_STYLES[rarity];
                            return (
                                <div key={rarity} className="mt-3">
                                    <p className={`text-[9px] uppercase tracking-[0.2em] font-bold mb-1.5 ${style.text}`}>{style.label}</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {cards.map(card => (
                                            <button
                                                key={card.id}
                                                type="button"
                                                onClick={() => onPickCard(card)}
                                                className={clsx(
                                                    'text-left rounded-xl border p-2.5 transition-all active:scale-95',
                                                    style.border, style.bg,
                                                    'hover:brightness-125'
                                                )}
                                            >
                                                <div className="flex items-start justify-between gap-1">
                                                    <span className="text-[11px] font-bold text-white/90 leading-tight">{card.name}</span>
                                                    {(card.sipCost ?? 0) > 0 && (
                                                        <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-amber-600/80 text-[8px] font-bold text-white">{card.sipCost}🍺</span>
                                                    )}
                                                </div>
                                                <p className="mt-1 text-[9px] text-white/60 leading-snug line-clamp-2">{card.description}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
