import { useState } from 'react';
import { Card, Party, PendingCanCupSipResolution, Player } from '../../../types/game';
import { GAME_CONFIG } from '../../../config/gameConfig';
import { LogOut, Play, Hash, Wine } from 'lucide-react';
import { motion } from 'framer-motion';

import { ChallengeModal } from '../classic/ChallengeModal';
import { GameSettings } from '../classic/GameSettings';
import { GameStatus } from '../classic/GameStatus';
import { ModernCardHand } from './ModernCardHand';
import { ArenaCircle } from './ArenaCircle';
import { AttackBanner } from './AttackBanner';
import { ChallengeParticipantsModal } from './ChallengeParticipantsModal';
import { GodModeCardPicker } from './GodModeCardPicker';
import { CanCupEndScreen } from './CanCupEndScreen';
import { CardBase } from '../../../types/cards';
import { isCanCupReactionChallengeCard } from '../../../utils/canCupChallengeHelpers';

interface GameModernUIProps {
    party: Party;
    currentPlayer: Player;
    isLeader: boolean;
    canStart: boolean;
    isCurrentTurn: boolean;
    showNoValidPlayersWarning: boolean;
    onPlayCard: (card: Card) => Promise<void>;
    onTargetSelect: (targetId: string) => Promise<void>;
    onChallengeResolve: (winnerId: string, loserId: string) => Promise<void>;
    onStartGame: () => Promise<void>;
    onLeaveParty: () => Promise<void>;
    onUpdateSettings: (settings: any) => Promise<void>;
    onDrink: () => Promise<void>;
    onOpenPendingChallenge: () => void;
    pendingCanCupSipForCurrentPlayer?: PendingCanCupSipResolution | null;
    onResolvePendingCanCupSips?: () => Promise<void>;
    onSetReactionChallengeReady?: () => Promise<void>;
    onPressReactionChallenge?: (reactionTimeMs: number) => Promise<void>;
    challengeSetupCard: Card | null;
    onChallengeSetupConfirm: (duelistOneId: string, duelistTwoId: string) => Promise<void>;
    onChallengeSetupCancel: () => void;
    selectedCard: Card | null;
    setSelectedCard: (card: Card | null) => void;
    onGodModeSwapCard?: (playerId: string, oldCardId: string, newCardBase: CardBase) => Promise<boolean>;
}

export function GameModernUI({
    party,
    currentPlayer,
    isLeader,
    canStart,
    isCurrentTurn,
    showNoValidPlayersWarning,
    onPlayCard,
    onTargetSelect,
    onChallengeResolve,
    onStartGame,
    onLeaveParty,
    onUpdateSettings,
    onDrink,
    onOpenPendingChallenge,
    pendingCanCupSipForCurrentPlayer,
    onResolvePendingCanCupSips,
    onSetReactionChallengeReady,
    onPressReactionChallenge,
    challengeSetupCard,
    onChallengeSetupConfirm,
    onChallengeSetupCancel,
    selectedCard,
    setSelectedCard,
    onGodModeSwapCard,
}: GameModernUIProps) {
    const [godModePickingCard, setGodModePickingCard] = useState<Card | null>(null);
    const gameMode = party.gameMode ?? 'modern';
    const isCanCup = gameMode === 'can-cup';
    const drunkThreshold = party.settings?.drunkThreshold ?? GAME_CONFIG.DRUNK_THRESHOLD;
    const manaDrinkAmount = party.settings?.manaDrinkAmount ?? GAME_CONFIG.MANA_DRINK_AMOUNT;
    const pendingChallenge = party.pendingChallenge;
    const canResolvePendingChallenge = Boolean(
        pendingChallenge &&
        pendingChallenge.playerId === currentPlayer.id &&
        party.status === 'playing'
    );
    const rootClass = isCanCup
        ? 'bg-gradient-to-b from-[#0d1122] via-[#1e1332] to-[#2a1407]'
        : 'bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950';
    const headerClass = isCanCup
        ? 'bg-[#070e1c]/80 border-cyan-900/30'
        : 'bg-black/40 border-gray-800/40';
    const startButtonClass = isCanCup
        ? 'flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-semibold rounded-lg transition-colors active:scale-95'
        : 'flex items-center gap-1 px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-semibold rounded-lg transition-colors active:scale-95';
    const partyCodeClass = isCanCup ? 'bg-cyan-950/55' : 'bg-gray-800/80';
    const partyCodeTextClass = isCanCup ? 'text-cyan-200' : 'text-purple-300';
    const drinkButtonClass = isCanCup
        ? 'fixed right-3 z-[70] flex items-center gap-2 rounded-xl border border-cyan-400/45 bg-cyan-600/90 px-4 py-2 text-xs font-semibold text-white shadow-[0_10px_30px_rgba(6,182,212,0.35)] transition-all hover:bg-cyan-500 active:scale-95'
        : 'fixed right-3 z-[70] flex items-center gap-2 rounded-xl border border-blue-400/40 bg-blue-600/90 px-4 py-2 text-xs font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.35)] transition-all hover:bg-blue-500 active:scale-95';
    const pendingSipButtonLabel = pendingCanCupSipForCurrentPlayer
        ? (() => {
            const drinkSips = pendingCanCupSipForCurrentPlayer.beerSipsToConsume;
            const detailParts: string[] = [];

            if (pendingCanCupSipForCurrentPlayer.deflectSipsToConsume > 0) {
                const count = pendingCanCupSipForCurrentPlayer.deflectSipsToConsume;
                detailParts.push(`armor covered ${count} sip${count === 1 ? '' : 's'}`);
            }
            if (pendingCanCupSipForCurrentPlayer.waterSipsToConsume > 0) {
                const count = pendingCanCupSipForCurrentPlayer.waterSipsToConsume;
                detailParts.push(`water covered ${count} sip${count === 1 ? '' : 's'}`);
            }

            const base = `Drink ${drinkSips} sip${drinkSips === 1 ? '' : 's'}`;
            if (detailParts.length === 0) return base;
            return `${base} (${detailParts.join(', ')})`;
        })()
        : '';
    const arenaBottomOffset = isCanCup ? 0 : 360;
    const arenaBottomInset = isCanCup ? 160 : 0;
    const arenaTopInset = isCanCup ? (party.lastAction ? 56 : 18) : 0;

    return (
        <div className={`w-full min-h-0 flex flex-col relative overflow-hidden ${rootClass}`} style={{ height: 'var(--app-height, 100dvh)' }}>
            {isCanCup && (
                <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden">
                    <motion.div
                        className="absolute -top-28 -left-20 h-72 w-72 rounded-full bg-cyan-500/14 blur-3xl"
                        animate={{ x: [0, 26, -18, 0], y: [0, 22, 8, 0], opacity: [0.55, 0.75, 0.6, 0.55] }}
                        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                        className="absolute top-1/4 -right-16 h-80 w-80 rounded-full bg-amber-500/12 blur-3xl"
                        animate={{ x: [0, -24, 10, 0], y: [0, -14, 20, 0], opacity: [0.45, 0.6, 0.5, 0.45] }}
                        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                        className="absolute -bottom-28 left-1/3 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl"
                        animate={{ x: [0, -18, 14, 0], y: [0, -20, -8, 0], opacity: [0.3, 0.48, 0.35, 0.3] }}
                        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
                    />
                </div>
            )}

            {/* ─── Header ─── */}
            <div className={`flex items-center justify-between px-3 py-2 border-b backdrop-blur-sm shrink-0 z-30 ${headerClass}`}>
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-bold text-white truncate">
                        {isCanCup ? 'Can Cup Arena' : 'Electro Wizards'}
                    </span>
                    <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded ${partyCodeClass}`}>
                        <Hash className="w-2.5 h-2.5 text-gray-600" />
                        <span className={`text-[10px] font-mono ${partyCodeTextClass}`}>{party.code}</span>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    {canStart && (
                        <button onClick={onStartGame} className={startButtonClass}>
                            <Play className="w-3 h-3" /> Start
                        </button>
                    )}
                    <GameSettings onSave={onUpdateSettings} isLeader={isLeader} />
                    <button onClick={onLeaveParty} className="p-1.5 rounded-lg bg-gray-800/50 hover:bg-red-900/30 border border-gray-800 hover:border-red-800/50 text-gray-500 hover:text-red-400 transition-all" title="Leave">
                        <LogOut className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* ─── Waiting State ─── */}
            {party.status === 'waiting' && (
                <div className="flex-1 flex items-center justify-center px-4">
                    <div className="text-center">
                        <GameStatus
                            status={party.status}
                            winner={party.winner}
                            players={party.players}
                            isLeader={isLeader}
                            code={party.code}
                            showNoValidPlayersWarning={showNoValidPlayersWarning}
                        />
                        {isCanCup && (
                            <p className="mt-3 text-xs text-cyan-200/80">
                                Can Cup tracks your active can in real-time and awards empty can trophies.
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* ─── Playing State: 3-Zone Layout ─── */}
            {party.status !== 'waiting' && (
                <>
                    {party.lastAction && (
                        <div className="absolute left-0 right-0 top-[52px] z-[65] px-2 pointer-events-none">
                            <div className="pointer-events-auto">
                                <AttackBanner
                                    lastAction={party.lastAction}
                                    players={party.players}
                                    gameMode={gameMode}
                                />
                            </div>
                        </div>
                    )}

                    {/* Zone 2: Arena Circle (fills space between header+banner and card fan) */}
                    <div className="flex-1 min-h-0 relative z-10" style={{ marginBottom: `${arenaBottomOffset}px` }}>
                        {party.status === 'finished' ? (
                            <div className="flex items-center justify-center h-full">
                                {isCanCup ? (
                                    <CanCupEndScreen party={party} currentPlayer={currentPlayer} />
                                ) : (
                                    <GameStatus status={party.status} winner={party.winner} players={party.players} isLeader={isLeader} code={party.code} />
                                )}
                            </div>
                        ) : (
                            <ArenaCircle
                                players={party.players}
                                currentPlayer={currentPlayer}
                                currentTurn={party.currentTurn}
                                selectedCard={selectedCard}
                                lastAction={party.lastAction}
                                isCurrentTurn={isCurrentTurn}
                                drunkThreshold={drunkThreshold}
                                onTargetSelect={onTargetSelect}
                                settings={party.settings}
                                pendingChallenge={pendingChallenge}
                                pendingCanCupSips={party.pendingCanCupSips}
                                canResolvePendingChallenge={canResolvePendingChallenge}
                                onChallengeCardClick={onOpenPendingChallenge}
                                onReactionReady={onSetReactionChallengeReady}
                                onReactionPress={onPressReactionChallenge}
                                gameMode={gameMode}
                                topInset={arenaTopInset}
                                bottomInset={arenaBottomInset}
                            />
                        )}
                    </div>

                    {/* Zone 3: Card Fan (fixed bottom, 240px) */}
                    {party.status === 'playing' && (
                        <ModernCardHand
                            cards={currentPlayer.cards}
                            onPlayCard={onPlayCard}
                            onCancelSelection={() => setSelectedCard(null)}
                            disabled={!isCurrentTurn || Boolean(pendingChallenge) || Boolean(pendingCanCupSipForCurrentPlayer)}
                            currentMana={currentPlayer.mana}
                            selectedCard={selectedCard}
                            gameMode={gameMode}
                            godMode={isLeader && Boolean(party.settings?.godMode)}
                            onGodModePick={(card) => setGodModePickingCard(card)}
                            canCupSipsLeft={isCanCup ? (currentPlayer.canCup?.sipsLeft ?? (party.settings?.canCupSipsPerCan ?? 10)) : undefined}
                            canCupSipsPerCan={isCanCup ? (party.settings?.canCupSipsPerCan ?? 10) : undefined}
                        />
                    )}

                    {/* God Mode Card Picker */}
                    <GodModeCardPicker
                        isOpen={Boolean(godModePickingCard)}
                        onClose={() => setGodModePickingCard(null)}
                        replacingCard={godModePickingCard}
                        onPickCard={async (cardBase) => {
                            if (godModePickingCard && onGodModeSwapCard) {
                                await onGodModeSwapCard(currentPlayer.id, godModePickingCard.id, cardBase);
                            }
                            setGodModePickingCard(null);
                        }}
                    />

                    {party.status === 'playing' && !isCanCup && (
                        <button
                            onClick={onDrink}
                            className={drinkButtonClass}
                            style={{ bottom: 'calc(124px + env(safe-area-inset-bottom))' }}
                        >
                            <Wine className="h-4 w-4 text-blue-100" />
                            Drink +{manaDrinkAmount}
                        </button>
                    )}

                    {party.status === 'playing' && isCanCup && pendingCanCupSipForCurrentPlayer && onResolvePendingCanCupSips && (
                        <button
                            onClick={onResolvePendingCanCupSips}
                            className="fixed left-1/2 z-[70] -translate-x-1/2 rounded-xl border border-amber-300/45 bg-amber-600/90 px-4 py-2 text-xs font-semibold text-white shadow-[0_10px_30px_rgba(245,158,11,0.35)] transition-all hover:bg-amber-500 active:scale-95 max-w-[calc(100vw-40px)] truncate"
                            style={{ bottom: 'calc(168px + env(safe-area-inset-bottom))' }}
                        >
                            {pendingSipButtonLabel}
                        </button>
                    )}

                </>
            )}

            {challengeSetupCard && (
                <ChallengeParticipantsModal
                    card={challengeSetupCard}
                    players={party.players}
                    onConfirm={onChallengeSetupConfirm}
                    onCancel={onChallengeSetupCancel}
                />
            )}

            {/* ─── Challenge Modal ─── */}
            {selectedCard && !isCanCupReactionChallengeCard(selectedCard) && (
                party.pendingChallenge?.card.id === selectedCard.id ||
                selectedCard.isChallenge ||
                selectedCard.type === 'challenge' ||
                selectedCard.effect.type === 'challenge' ||
                selectedCard.effect.challenge ||
                ['Öl Hävf', 'Got Big Muscles?', 'Shot Contest', 'SHOT MASTER'].includes(selectedCard.name) ||
                (selectedCard.name && selectedCard.name.includes('Name the most')) ||
                selectedCard.effect.winnerEffect ||
                selectedCard.effect.loserEffect ||
                selectedCard.effect.challengeEffects
            ) && (
                    <ChallengeModal
                        card={selectedCard}
                        players={party.players}
                        currentPlayerId={currentPlayer.id}
                        eligiblePlayerIds={
                            party.pendingChallenge?.card.id === selectedCard.id
                                ? [party.pendingChallenge?.duelistOneId, party.pendingChallenge?.duelistTwoId].filter(Boolean) as string[]
                                : undefined
                        }
                        onConfirm={onChallengeResolve}
                        onCancel={() => setSelectedCard(null)}
                    />
                )}
        </div>
    );
}
