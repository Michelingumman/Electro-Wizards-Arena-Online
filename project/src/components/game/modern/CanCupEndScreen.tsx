import { motion } from 'framer-motion';
import { Trophy, Beer, Droplets, Shield, Crown } from 'lucide-react';
import { Party, Player } from '../../../types/game';
import { useNavigate } from 'react-router-dom';

interface CanCupEndScreenProps {
    party: Party;
    currentPlayer: Player;
}

export function CanCupEndScreen({ party, currentPlayer }: CanCupEndScreenProps) {
    const navigate = useNavigate();
    const winner = party.players.find(p => p.id === party.winner);
    const isWinner = currentPlayer.id === party.winner;

    const sorted = [...party.players].sort(
        (a, b) => (b.canCup?.emptyCans ?? 0) - (a.canCup?.emptyCans ?? 0)
    );

    const cansToWin = party.settings?.canCupCansToWin ?? 5;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-full px-4 py-6 text-center"
        >
            {/* Trophy */}
            <motion.div
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mb-4"
            >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.4)]">
                    <Trophy className="w-10 h-10 text-white" />
                </div>
            </motion.div>

            {/* Winner announcement */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
            >
                <h2 className="text-2xl font-black text-white mb-1">
                    {isWinner ? '🎉 Du vann!' : `${winner?.name ?? 'Någon'} vann!`}
                </h2>
                <p className="text-sm text-amber-300/80 mb-6">
                    {cansToWin} burkar tömda — spelet är slut!
                </p>
            </motion.div>

            {/* Leaderboard */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden"
            >
                <div className="px-4 py-2.5 border-b border-white/10 bg-white/5">
                    <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-white/60">Resultat</p>
                </div>
                <div className="divide-y divide-white/5">
                    {sorted.map((player, index) => {
                        const cans = player.canCup?.emptyCans ?? 0;
                        const sipsLeft = player.canCup?.sipsLeft ?? 0;
                        const water = player.canCup?.waterSips ?? 0;
                        const deflect = player.canCup?.deflectCharges ?? 0;
                        const isMe = player.id === currentPlayer.id;
                        const isChampion = player.id === party.winner;

                        return (
                            <div
                                key={player.id}
                                className={`flex items-center gap-3 px-4 py-3 ${isChampion ? 'bg-amber-900/20' : ''}`}
                            >
                                {/* Rank */}
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0
                  ${index === 0 ? 'bg-amber-500 text-white' : index === 1 ? 'bg-gray-400 text-white' : index === 2 ? 'bg-amber-700 text-white' : 'bg-white/10 text-white/50'}`}>
                                    {index === 0 ? <Crown className="w-3.5 h-3.5" /> : index + 1}
                                </div>

                                {/* Name */}
                                <div className="flex-1 min-w-0 text-left">
                                    <p className={`text-sm font-semibold truncate ${isMe ? 'text-amber-200' : 'text-white/90'}`}>
                                        {player.name} {isMe && '(du)'}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="flex items-center gap-0.5 text-[10px] text-white/50">
                                            <Beer className="w-3 h-3" /> {sipsLeft} kvar
                                        </span>
                                        {water > 0 && (
                                            <span className="flex items-center gap-0.5 text-[10px] text-cyan-300/60">
                                                <Droplets className="w-3 h-3" /> {water}
                                            </span>
                                        )}
                                        {deflect > 0 && (
                                            <span className="flex items-center gap-0.5 text-[10px] text-indigo-300/60">
                                                <Shield className="w-3 h-3" /> {deflect}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Cans count */}
                                <div className="text-right shrink-0">
                                    <p className={`text-lg font-black ${isChampion ? 'text-amber-400' : 'text-white/80'}`}>{cans}</p>
                                    <p className="text-[9px] text-white/40 uppercase tracking-wider">burkar</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Return button */}
            <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                onClick={() => navigate('/')}
                className="mt-6 px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-sm shadow-lg hover:from-amber-400 hover:to-amber-500 transition-all active:scale-95"
            >
                Tillbaka till lobby
            </motion.button>
        </motion.div>
    );
}
