import { Party } from '../../types/game';

interface GameStatusProps {
  status: Party['status'];
  winner: string | null | undefined;
  players: Party['players'];
  isLeader: boolean;
}

export function GameStatus({ status, winner, players, isLeader }: GameStatusProps) {
  if (status === 'finished') {
    return (
      <div className="text-center p-8 bg-purple-900/30 backdrop-blur-sm rounded-lg border border-purple-500/20">
        <h3 className="text-2xl font-bold text-purple-100 mb-4">Game Over!</h3>
        {winner && (
          <p className="text-xl text-purple-200">
            Winner: {players.find(p => p.id === winner)?.name}
          </p>
        )}
      </div>
    );
  }

  if (status === 'waiting') {
    return (
      <div className="text-center p-8 bg-purple-900/30 backdrop-blur-sm rounded-lg border border-purple-500/20">
        <p className="text-xl text-purple-200">
          Waiting for {isLeader ? 'more players to join...' : 'the game to start...'}
        </p>
      </div>
    );
  }

  return null;
}