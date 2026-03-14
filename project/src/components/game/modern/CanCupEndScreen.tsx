import { motion } from 'framer-motion';
import { AlertTriangle, Beer, Droplets } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Party, Player } from '../../../types/game';

interface CanCupEndScreenProps {
  party: Party;
  currentPlayer: Player;
}

export function CanCupEndScreen({ party, currentPlayer }: CanCupEndScreenProps) {
  const navigate = useNavigate();
  const losingPlayer = party.players.find((player) => player.id === party.winner);
  const isLoser = currentPlayer.id === party.winner;
  const cansToLose = party.settings?.canCupCansToWin ?? 5;

  const sorted = [...party.players].sort(
    (left, right) => (right.canCup?.emptyCans ?? 0) - (left.canCup?.emptyCans ?? 0)
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex h-full flex-col items-center justify-center px-4 py-6 text-center"
    >
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="mb-4"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-red-700 shadow-[0_0_40px_rgba(244,63,94,0.35)]">
          <AlertTriangle className="h-10 w-10 text-white" />
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="mb-1 text-2xl font-black text-white">
          {isLoser ? 'Du f\u00f6rlorade!' : `${losingPlayer?.name ?? 'N\u00e5gon'} f\u00f6rlorade f\u00f6rst!`}
        </h2>
        <p className="mb-6 text-sm text-rose-200/80">
          {cansToLose} burkar t\u00f6mda - f\u00f6rsta spelaren dit f\u00f6rlorar.
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm"
      >
        <div className="border-b border-white/10 bg-white/5 px-4 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/60">Resultat</p>
        </div>
        <div className="divide-y divide-white/5">
          {sorted.map((player, index) => {
            const cans = player.canCup?.emptyCans ?? 0;
            const sipsLeft = player.canCup?.sipsLeft ?? 0;
            const water = (player.canCup?.waterSips ?? 0) + Math.max(
              0,
              Math.round(((player.canCup as (Player['canCup'] & { deflectCharges?: number }) | undefined)?.deflectCharges ?? 0))
            );
            const isMe = player.id === currentPlayer.id;
            const isFirstOut = player.id === party.winner;

            return (
              <div
                key={player.id}
                className={`flex items-center gap-3 px-4 py-3 ${isFirstOut ? 'bg-rose-950/40' : ''}`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                    isFirstOut
                      ? 'bg-rose-500 text-white'
                      : index === 1
                        ? 'bg-gray-400 text-white'
                        : index === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-white/10 text-white/50'
                  }`}
                >
                  {isFirstOut ? <AlertTriangle className="h-3.5 w-3.5" /> : index + 1}
                </div>

                <div className="min-w-0 flex-1 text-left">
                  <p className={`truncate text-sm font-semibold ${isMe ? 'text-rose-200' : 'text-white/90'}`}>
                    {player.name} {isMe && '(du)'}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="flex items-center gap-0.5 text-[10px] text-white/50">
                      <Beer className="h-3 w-3" /> {sipsLeft} kvar
                    </span>
                    {water > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-cyan-300/60">
                        <Droplets className="h-3 w-3" /> {water}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className={`text-lg font-black ${isFirstOut ? 'text-rose-300' : 'text-white/80'}`}>{cans}</p>
                  <p className="text-[9px] uppercase tracking-wider text-white/40">burkar</p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        onClick={() => navigate('/')}
        className="mt-6 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 px-8 py-3 text-sm font-bold text-white shadow-lg transition-all hover:from-rose-400 hover:to-red-500 active:scale-95"
      >
        Tillbaka till lobby
      </motion.button>
    </motion.div>
  );
}
