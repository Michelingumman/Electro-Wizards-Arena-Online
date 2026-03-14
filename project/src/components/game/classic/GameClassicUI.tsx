import { Card, Party, Player } from '../../../types/game';
import { PlayerStats } from './PlayerStats';
import { CardList } from './CardList';
import { GameHeader } from './GameHeader';
import { GameControls } from './GameControls';
import { GameStatus } from './GameStatus';
import { ActionLog } from './ActionLog';
import { ChallengeModal } from './ChallengeModal';
import { GAME_CONFIG } from '../../../config/gameConfig';
import { isChallengeCard } from '../../../utils/challengeCard';

interface GameClassicUIProps {
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
    onOpenPendingChallenge?: () => void;
    selectedCard: Card | null;
    setSelectedCard: (card: Card | null) => void;
}

export function GameClassicUI({
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
    selectedCard,
    setSelectedCard
}: GameClassicUIProps) {
    const isUntargetablePlayer = (player: Player) =>
        Boolean(player.effects?.some((effect) => effect.type === 'untargetable' && effect.duration > 0));

    return (
        <div className="max-w-6xl mx-auto p-4 relative z-20">
            <GameHeader
                party={party}
                isLeader={isLeader}
                canStart={canStart}
                onStartGame={onStartGame}
                onLeaveParty={onLeaveParty}
                onUpdateSettings={onUpdateSettings}
            />

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 space-y-4">
                    <div className="text-center mb-3">
                        <h3 className="text-sm font-medium text-purple-200 uppercase tracking-wider bg-gray-800/30 py-1 rounded-lg">Opponents</h3>
                    </div>
                    {/* Display opponents in a 2-column grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-800/20 p-3 rounded-lg">
                        {party.players.filter(p => p.id !== currentPlayer.id).map((player) => (
                            <PlayerStats
                                key={player.id}
                                player={player}
                                isCurrentPlayer={false}
                                isCurrentTurn={player.id === party.currentTurn}
                                isTargetable={Boolean(
                                    selectedCard?.requiresTarget &&
                                    !isUntargetablePlayer(player) &&
                                    (selectedCard.effect.type === 'manaRefill' || player.id !== currentPlayer.id)
                                )}
                                onSelect={selectedCard && !isChallengeCard(selectedCard) ? () => onTargetSelect(player.id) : undefined}
                            />
                        ))}
                    </div>

                    {party.lastAction && (
                        <ActionLog lastAction={party.lastAction} players={party.players} />
                    )}
                </div>

                <div className="lg:col-span-8 space-y-6">
                    <div className="text-center mb-3">
                        <h3 className="text-sm font-medium text-purple-200 uppercase tracking-wider bg-purple-900/30 py-1 rounded-lg">You</h3>
                    </div>
                    <div className="bg-purple-900/20 p-3 rounded-lg">
                        <PlayerStats
                            player={currentPlayer}
                            isCurrentPlayer={true}
                            isCurrentTurn={currentPlayer.id === party.currentTurn}
                            isTargetable={false}
                            onSelect={undefined}
                        />
                    </div>
                    <GameStatus
                        status={party.status}
                        winner={party.winner}
                        players={party.players}
                        isLeader={isLeader}
                        code={party.code}
                        showNoValidPlayersWarning={showNoValidPlayersWarning}
                    />

                    {party.status === 'playing' && (
                        <CardList
                            cards={currentPlayer.cards}
                            onPlayCard={onPlayCard}
                            disabled={!isCurrentTurn}
                            currentMana={currentPlayer.mana}
                            selectedCard={selectedCard}
                        />
                    )}
                </div>
            </div>

            {party.status === 'playing' && (
                <GameControls
                    gameStatus={party.status}
                    manaDrinkAmount={party.settings?.manaDrinkAmount ?? GAME_CONFIG.MANA_DRINK_AMOUNT}
                    isCurrentTurn={isCurrentTurn}
                    onDrink={onDrink}
                />
            )}

            {selectedCard && isChallengeCard(selectedCard) && (
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
