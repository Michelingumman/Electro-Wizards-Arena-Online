import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Sword, Copy, Check } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useTDMatchState } from '../hooks/useTDMatchState';
import { useTDStore } from '../store/useTDStore';
import { TDCard } from '../types/td';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../hooks/useAuth';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../../../lib/firebase';

const CARD_POOL: TDCard[] = [
  { id: 'bowler', name: 'Bowler', description: 'Rolls a huge boulder', elixir: 5, type: 'troop', icon: '/td/cards/bowler.png' },
  { id: 'prince', name: 'Prince', description: 'Charges at enemies', elixir: 5, type: 'troop', icon: '/td/cards/prince.png' },
  { id: 'spear_goblin', name: 'Spear Goblin', description: 'Throws spears', elixir: 2, type: 'troop', icon: '/td/cards/spear_goblin.png' },
  { id: 'lumberjack', name: 'Lumberjack', description: 'Fast melee fighter', elixir: 4, type: 'troop', icon: '/td/cards/lumberjack.png' },
  { id: 'miner', name: 'Miner', description: 'Burrows to any location', elixir: 3, type: 'troop', icon: '/td/cards/miner.png' },
  { id: 'electro_wizard', name: 'Electro Wizard', description: 'Stuns with zaps', elixir: 4, type: 'troop', icon: '/td/cards/electro_wizard.png' },
  { id: 'golden_knight', name: 'Golden Knight', description: 'Dashes between foes', elixir: 4, type: 'troop', icon: '/td/cards/golden_knight.png' },
];

export function TDDeckBuilder() {
  const navigate = useNavigate();
  const { matchId } = useParams();
  useTDMatchState(matchId);
  const { match } = useTDStore();
  const { user } = useAuth();

  const [selected, setSelected] = useState<TDCard[]>([]);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canStart = useMemo(() => {
    if (!match) return false;
    const twoPlayers = match.players.length >= 2;
    const allReady = match.players.every((p) => p.ready && (p.deck?.length || 0) === 6);
    return twoPlayers && allReady;
  }, [match]);

  const handleToggle = (card: TDCard) => {
    setSelected((cur) => {
      const exists = cur.find((c) => c.id === card.id);
      if (exists) return cur.filter((c) => c.id !== card.id);
      if (cur.length >= 6) return cur; // enforce 6
      return [...cur, card];
    });
  };

  const handleSaveDeck = async () => {
    if (!match || !matchId) return;
    try {
      setError(null);
      let uid = user?.uid;
      if (!uid) {
        const cred = await signInAnonymously(auth);
        uid = cred.user.uid;
      }
      const me = match.players.find((p) => p.id === uid) || match.players[0];
      const ref = doc(db, 'td_matches', matchId);
      const updatedPlayers = match.players.map((p) =>
        p.id === me.id ? { ...p, deck: selected, ready: selected.length === 6 } : p
      );
      console.log('Saving deck', { matchId, playerId: me.id, deckSize: selected.length });
      await updateDoc(ref, { players: updatedPlayers, updatedAt: serverTimestamp() } as any);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (e: any) {
      console.error('Save deck failed', e);
      setError(e?.message || 'Failed to save deck');
    }
  };

  const handleStartIfReady = async () => {
    if (!match || !matchId || !canStart) return;
    // Host sets startTime so both clients sync their timers
    const isHost = match.hostId === user?.uid || match.hostId === match.players[0]?.id;
    if (isHost) {
      const ref = doc(db, 'td_matches', matchId);
      await updateDoc(ref, { status: 'playing', startTime: serverTimestamp() } as any);
    }
    navigate(`/games/tower-defense/match/${matchId}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-green-900">
      <div className="relative max-w-4xl w-full">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-green-500/20 rounded-full blur-3xl" />
        <div className="absolute top-40 -left-20 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-gray-700">
          <div className="absolute top-6 left-6">
            <Button variant="ghost" onClick={() => navigate('/')} className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Menu
            </Button>
          </div>

          <div className="text-center pt-4 mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              Build Your Deck (6 cards)
            </h1>
          </div>

          {/* Match Code + Players */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-300">
              Match code: <span className="font-semibold text-green-300">{match?.code || '----'}</span>
              <button
                onClick={async () => {
                  if (!match?.code) return;
                  try {
                    await navigator.clipboard.writeText(match.code);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1200);
                  } catch {}
                }}
                className="ml-2 inline-flex items-center px-2 py-1 rounded border border-gray-600 hover:bg-gray-700 text-xs"
              >
                {copied ? <><Check className="w-3 h-3 mr-1"/>Copied</> : <><Copy className="w-3 h-3 mr-1"/>Copy</>}
              </button>
            </div>
            <div className="text-sm text-gray-400">
              Players: {match?.players.map(p => p.ready ? `${p.name} ✅` : `${p.name} ⏳`).join(' vs ') || 'Waiting...'}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded border border-red-500/30 bg-red-500/10 text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CARD_POOL.map((card) => {
              const isSelected = selected.some((c) => c.id === card.id);
              return (
                <button
                  key={card.id}
                  onClick={() => handleToggle(card)}
                  className={`p-4 rounded-lg border ${isSelected ? 'border-green-400 bg-green-500/10' : 'border-gray-700 bg-gray-700/30'} text-left`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {card.icon ? (
                        <img
                          src={card.icon}
                          onError={(e) => {
                            const el = e.currentTarget as HTMLImageElement;
                            el.onerror = null;
                            el.src = `/td/cards/${card.id}.png`;
                          }}
                          alt=""
                          className="mr-2 w-14 h-14 rounded object-cover"
                        />
                      ) : (
                        <span className="mr-2 inline-block w-14 h-14 rounded bg-gray-500/40" />
                      )}
                    </div>
                    <div className="text-base text-green-300 font-semibold">{card.elixir}</div>
                  </div>
                  <div className="text-xs text-gray-300">{card.type}</div>
                  <div className="text-xs text-gray-400 mt-2">{card.description}</div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="text-gray-300">Selected: {selected.length}/6</div>
            <div className="space-x-3">
              <Button onClick={handleSaveDeck} disabled={selected.length !== 6}>
                <CheckCircle className="w-4 h-4 mr-2 inline" /> {saved ? 'Saved!' : 'Save Deck'}
              </Button>
              <Button variant="secondary" onClick={handleStartIfReady} disabled={!canStart}>
                <Sword className="w-4 h-4 mr-2 inline" /> Go To Arena
              </Button>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-400">
            Both players must save a 6-card deck to become ready. When both are ready, proceed to the arena.
          </div>
        </div>
      </div>
    </div>
  );
}


