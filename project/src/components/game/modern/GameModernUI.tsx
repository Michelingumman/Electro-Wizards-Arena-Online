import { Card, Party, Player } from '../../../types/game';
import { GAME_CONFIG } from '../../../config/gameConfig';
import { LogOut, Play, Hash, Wine } from 'lucide-react';

import { ChallengeModal } from '../classic/ChallengeModal';
import { GameSettings } from '../classic/GameSettings';
import { GameStatus } from '../classic/GameStatus';
import { ModernCardHand } from './ModernCardHand';
import { ArenaCircle } from './ArenaCircle';
import { AttackBanner } from './AttackBanner';

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
    selectedCard: Card | null;
    setSelectedCard: (card: Card | null) => void;
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
    selectedCard,
    setSelectedCard
}: GameModernUIProps) {
    const drunkThreshold = party.settings?.drunkThreshold ?? GAME_CONFIG.DRUNK_THRESHOLD;
    const manaDrinkAmount = party.settings?.manaDrinkAmount ?? GAME_CONFIG.MANA_DRINK_AMOUNT;
    const pendingChallenge = party.pendingChallenge;
    const canResolvePendingChallenge = Boolean(
        pendingChallenge &&
        pendingChallenge.playerId === currentPlayer.id &&
        party.status === 'playing'
    );

    return (
        <div className="w-full h-screen h-[100dvh] flex flex-col relative bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 overflow-hidden">
            {/* ─── Header ─── */}
            <div className="flex items-center justify-between px-3 py-2 bg-black/40 border-b border-gray-800/40 backdrop-blur-sm shrink-0 z-30">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-bold text-white truncate">Electro Wizards</span>
                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-800/80 rounded">
                        <Hash className="w-2.5 h-2.5 text-gray-600" />
                        <span className="text-[10px] font-mono text-purple-300">{party.code}</span>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    {canStart && (
                        <button onClick={onStartGame} className="flex items-center gap-1 px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-semibold rounded-lg transition-colors active:scale-95">
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
                        <GameStatus status={party.status} winner={party.winner} players={party.players} isLeader={isLeader} showNoValidPlayersWarning={showNoValidPlayersWarning} />
                    </div>
                </div>
            )}

            {/* ─── Playing State: 3-Zone Layout ─── */}
            {party.status !== 'waiting' && (
                <>
                    {party.lastAction && (
                        <div className="absolute left-0 right-0 top-[52px] z-[65] px-2 pointer-events-none">
                            <div className="pointer-events-auto">
                                <AttackBanner lastAction={party.lastAction} players={party.players} />
                            </div>
                        </div>
                    )}

                    {/* Zone 2: Arena Circle (fills space between header+banner and card fan) */}
                    <div className="flex-1 relative z-10" style={{ marginBottom: '370px' }}>
                        {party.status === 'finished' ? (
                            <div className="flex items-center justify-center h-full">
                                <GameStatus status={party.status} winner={party.winner} players={party.players} isLeader={isLeader} />
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
                                canResolvePendingChallenge={canResolvePendingChallenge}
                                onChallengeCardClick={onOpenPendingChallenge}
                            />
                        )}
                    </div>

                    {/* Zone 3: Card Fan (fixed bottom, 240px) */}
                    {party.status === 'playing' && (
                        <ModernCardHand
                            cards={currentPlayer.cards}
                            onPlayCard={onPlayCard}
                            onCancelSelection={() => setSelectedCard(null)}
                            disabled={!isCurrentTurn || Boolean(pendingChallenge)}
                            currentMana={currentPlayer.mana}
                            selectedCard={selectedCard}
                        />
                    )}

                    {party.status === 'playing' && (
                        <button
                            onClick={onDrink}
                            className="fixed right-3 z-[70] flex items-center gap-2 rounded-xl border border-blue-400/40 bg-blue-600/90 px-4 py-2 text-xs font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.35)] transition-all hover:bg-blue-500 active:scale-95"
                            style={{ bottom: 'calc(124px + env(safe-area-inset-bottom))' }}
                        >
                            <Wine className="h-4 w-4 text-blue-100" />
                            Drink +{manaDrinkAmount}
                        </button>
                    )}
                </>
            )}

            {/* ─── Challenge Modal ─── */}
            {selectedCard && (
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
                        onConfirm={onChallengeResolve}
                        onCancel={() => setSelectedCard(null)}
                    />
                )}
        </div>
    );
}
