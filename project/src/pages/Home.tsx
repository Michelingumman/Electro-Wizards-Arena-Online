import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInAnonymously } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Sparkles, Users, Wand2 } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { usePartyActions } from '../hooks/usePartyActions';

export function Home() {
  const navigate = useNavigate();
  const { createParty, joinParty } = usePartyActions();
  const [name, setName] = useState('');
  const [partyCode, setPartyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateParty = async () => {
    if (!name) return;
    setLoading(true);
    setError(null);

    try {
      console.log('trying to get the userCredential....');
      
      const userCredential = await signInAnonymously(auth);
      console.log('Got: ', userCredential);
      
      // Save player name to localStorage for reconnection
      localStorage.setItem('playerName', name);
      
      const partyId = await createParty({
        id: userCredential.user.uid,
        name
      });
      console.log('PartyID: ', partyId);
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
      
      // Save player name to localStorage for reconnection
      localStorage.setItem('playerName', name);
      
      const partyQuery = query(
        collection(db, 'parties'),
        where('code', '==', partyCode.toUpperCase()),
        // Allow joining parties that have started for reconnection purposes
        // where('status', '==', 'waiting')
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-purple-900">
      <div className="relative max-w-md w-full space-y-8">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute top-40 -left-20 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl" />
        
        <div className="relative bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-gray-700">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <Wand2 className="w-12 h-12 text-purple-400" />
                <div className="absolute -inset-1 bg-purple-500/20 blur-sm rounded-full" />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              Electro Wizards Arena
            </h1>
            <p className="text-gray-400">Enter your name to start playing</p>
          </div>

          <div className="mt-8 space-y-6">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <Input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-lg"
              maxLength={20}
              disabled={loading}
            />

            <div className="space-y-4">
              <Button
                onClick={handleCreateParty}
                disabled={loading || !name}
                className="w-full group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center">
                  <Sparkles className="mr-2 group-hover:animate-pulse" />
                  Create New Party
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-800/50 text-gray-400">Or</span>
                </div>
              </div>

              <div className="space-y-3">
                <Input
                  type="text"
                  placeholder="Enter party code"
                  value={partyCode}
                  onChange={(e) => setPartyCode(e.target.value.toUpperCase())}
                  maxLength={4}
                  disabled={loading}
                />
                <Button
                  variant="secondary"
                  onClick={handleJoinParty}
                  disabled={loading || !name || !partyCode}
                  className="w-full group"
                >
                  <Users className="mr-2 group-hover:scale-110 transition-transform" />
                  Join Party
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}