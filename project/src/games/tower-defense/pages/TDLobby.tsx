import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Users, Shield } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useTDMatchmaking } from '../hooks/useTDMatchmaking';

export function TDLobby() {
  const navigate = useNavigate();
  const { createMatch, joinMatchByCode } = useTDMatchmaking();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name) return;
    setLoading(true);
    setError(null);
    try {
      const { matchId } = await createMatch(name);
      navigate(`/games/tower-defense/deck/${matchId}`);
    } catch (e: any) {
      setError(e.message || 'Failed to create match');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!name || !code) return;
    setLoading(true);
    setError(null);
    try {
      const { matchId } = await joinMatchByCode(code, name);
      navigate(`/games/tower-defense/deck/${matchId}`);
    } catch (e: any) {
      setError(e.message || 'Failed to join match');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-green-900">
      <div className="relative max-w-md w-full space-y-8">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-green-500/20 rounded-full blur-3xl" />
        <div className="absolute top-40 -left-20 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-gray-700">
          <div className="absolute top-6 left-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Menu
            </Button>
          </div>

          <div className="text-center pt-8">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <Shield className="w-12 h-12 text-green-400" />
                <div className="absolute -inset-1 bg-green-500/20 blur-sm rounded-full" />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent mb-2">
              Tower Defense Arena
            </h1>
            <p className="text-gray-400">Enter your name to begin</p>
          </div>

          <div className="mt-3 text-xs text-gray-400 text-center">
            Create a match to generate a 4-letter code. Share that code for others to join.
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

            <Button onClick={handleCreate} disabled={loading || !name} className="w-full group relative overflow-hidden">
              <span className="relative z-10 flex items-center justify-center">
                <Sparkles className="mr-2 group-hover:animate-pulse" />
                Create New Match
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
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
                placeholder="Enter match code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 2))}
                maxLength={2}
                disabled={loading}
              />
              <Button variant="secondary" onClick={handleJoin} disabled={loading || !name || !code} className="w-full group">
                <Users className="mr-2 group-hover:scale-110 transition-transform" />
                Join Match
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


