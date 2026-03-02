import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInAnonymously } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Zap, Users, Layers, Sparkles, ArrowRight, Hash } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { Input } from '../components/ui/Input';
import { usePartyActions } from '../hooks/usePartyActions';

export function Home() {
  const navigate = useNavigate();
  const { createParty, joinParty } = usePartyActions();
  const [name, setName] = useState('');
  const [partyCode, setPartyCode] = useState('');
  const [gameMode, setGameMode] = useState<'classic' | 'modern'>('classic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateParty = async () => {
    if (!name) return;
    setLoading(true);
    setError(null);

    try {
      const userCredential = await signInAnonymously(auth);
      localStorage.setItem('playerName', name);

      const partyId = await createParty({
        id: userCredential.user.uid,
        name
      }, gameMode);
      navigate(`/game/${partyId}`);
    } catch (err) {
      setError('Failed to create party. Please try again.');
      console.error('Home.tsx --> Error creating party:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinParty = async () => {
    if (!name || !partyCode) return;
    setLoading(true);
    setError(null);

    try {
      const userCredential = await signInAnonymously(auth);
      localStorage.setItem('playerName', name);

      const partyQuery = query(
        collection(db, 'parties'),
        where('code', '==', partyCode.toUpperCase()),
      );

      const querySnapshot = await getDocs(partyQuery);

      if (querySnapshot.empty) {
        throw new Error('Party not found');
      }

      const partyDoc = querySnapshot.docs[0];
      const partyId = partyDoc.id;

      await joinParty(partyId, {
        id: userCredential.user.uid,
        name
      });

      navigate(`/game/${partyId}`);
    } catch (error: any) {
      setError(error.message || 'Failed to join party. Please try again.');
      console.error('Error joining party:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center px-4 py-6 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      <div className="relative w-full max-w-sm space-y-6">
        {/* Ambient glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-32 h-32 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Main Card */}
        <div className="relative bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-gray-800/80">
          {/* Logo Section */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 mb-4 shadow-lg shadow-purple-500/20">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Electro Wizards Arena
            </h1>
            <p className="text-sm text-gray-500 mt-1">Enter your name to start playing</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-5">
            {/* Name */}
            <Input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-base"
              maxLength={20}
              disabled={loading}
            />

            {/* Mode Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Game Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setGameMode('classic')}
                  className={`relative p-3 rounded-xl border text-left transition-all duration-200 ${gameMode === 'classic'
                    ? 'bg-gray-800 border-purple-500/60 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                    : 'bg-gray-900/50 border-gray-800 hover:border-gray-700'
                    }`}
                >
                  <Layers className={`w-4 h-4 mb-1.5 ${gameMode === 'classic' ? 'text-purple-400' : 'text-gray-600'}`} />
                  <div className={`text-sm font-semibold ${gameMode === 'classic' ? 'text-white' : 'text-gray-500'}`}>Classic</div>
                  <div className="text-[10px] text-gray-600">Standard UI</div>
                </button>
                <button
                  onClick={() => setGameMode('modern')}
                  className={`relative p-3 rounded-xl border text-left transition-all duration-200 ${gameMode === 'modern'
                    ? 'bg-gray-800 border-purple-500/60 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                    : 'bg-gray-900/50 border-gray-800 hover:border-gray-700'
                    }`}
                >
                  <Sparkles className={`w-4 h-4 mb-1.5 ${gameMode === 'modern' ? 'text-purple-400' : 'text-gray-600'}`} />
                  <div className={`text-sm font-semibold ${gameMode === 'modern' ? 'text-white' : 'text-gray-500'}`}>Modern</div>
                  <div className="text-[10px] text-gray-600">Card hand view</div>
                </button>
              </div>
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreateParty}
              disabled={loading || !name}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20 active:scale-[0.98]"
            >
              <Zap className="w-4 h-4" />
              Create New Party
              <ArrowRight className="w-4 h-4 ml-auto" />
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-800" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-xs text-gray-600 bg-gray-900/80">or join existing</span>
              </div>
            </div>

            {/* Join */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input
                  type="text"
                  placeholder="Party code"
                  value={partyCode}
                  onChange={(e) => setPartyCode(e.target.value.toUpperCase())}
                  maxLength={4}
                  disabled={loading}
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-800/50 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-colors font-mono tracking-widest"
                />
              </div>
              <button
                onClick={handleJoinParty}
                disabled={loading || !name || !partyCode}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 hover:border-gray-600 text-sm font-medium text-gray-300 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                <Users className="w-4 h-4" />
                Join
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}