import { Party } from '../../../types/game';

interface GameStatusProps {
  status: Party['status'];
  winner: string | null | undefined;
  players: Party['players'];
  isLeader: boolean;
  showNoValidPlayersWarning?: boolean;
}

export function GameStatus({ status, winner, players, isLeader, showNoValidPlayersWarning }: GameStatusProps) {
  if (status === 'finished') {
    return (
      <div className="text-center p-8 bg-purple-900/30 backdrop-blur-sm rounded-lg border border-purple-500/20">
        <h3 className="text-2xl font-bold text-purple-100 mb-4">Game Over!</h3>
        {winner && (
          <p className="text-xl text-purple-200">
            Winner: {players.find(p => p.id === winner)?.name}
          </p>
        )}
        <p className="text-sm text-purple-300 mt-2">
          The last wizard standing with mana!
        </p>
      </div>
    );
  }

  if (status === 'waiting') {
    return (
      <div className="text-center p-6 bg-purple-900/30 backdrop-blur-sm rounded-lg border border-purple-500/20 max-w-md w-full">
        <p className="text-xl text-purple-200">
          Waiting for {isLeader ? 'more players to join...' : 'the game to start...'}
        </p>
        <div className="mt-4 text-left">
          <p className="text-xs uppercase tracking-wider text-purple-300/80 mb-2">
            Players in room ({players.length})
          </p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {players.map((player) => (
              <div key={player.id} className="flex items-center justify-between rounded-lg bg-gray-900/40 border border-gray-700/40 px-3 py-2">
                <span className="text-sm text-gray-100 truncate">{player.name}</span>
                {player.isLeader && (
                  <span className="text-[10px] uppercase tracking-wide text-amber-300">Leader</span>
                )}
              </div>
            ))}
          </div>
        </div>
        {showNoValidPlayersWarning && (
          <div className="mt-4 px-4 py-3 bg-amber-900/30 border border-amber-500/30 rounded-lg">
            <p className="text-sm text-amber-300">
              ⚠️ None of the players have a recognized name. At least one player must use an allowed name to start the game.
            </p>
          </div>
        )}
      </div>
    );
  }

  return null;
}
