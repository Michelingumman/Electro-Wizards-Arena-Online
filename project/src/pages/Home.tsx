import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInAnonymously } from 'firebase/auth';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { Sparkles, Users } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { generateInitialCards } from '../utils/cards';

export function Home() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [partyCode, setPartyCode] = useState('');
  const [loading, setLoading] = useState(false);

  const createParty = async () => {
    if (!name) return;
    setLoading(true);

    try {
      const userCredential = await signInAnonymously(auth);
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      
      const partyRef = await addDoc(collection(db, 'parties'), {
        code,
        status: 'waiting',
        players: [{
          id: userCredential.user.uid,
          name,
          health: 10,
          mana: 10,
          cards: generateInitialCards()
        }],
        currentTurn: userCredential.user.uid
      });

      navigate(`/game/${partyRef.id}`);
    } catch (error) {
      console.error('Error creating party:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinParty = async () => {
    if (!name || !partyCode) return;
    setLoading(true);

    try {
      const userCredential = await signInAnonymously(auth);
      
      const partyQuery = query(
        collection(db, 'parties'),
        where('code', '==', partyCode),
        where('status', '==', 'waiting')
      );

      const querySnapshot = await getDocs(partyQuery);
      
      if (querySnapshot.empty) {
        alert('Party not found or already started');
        return;
      }

      const partyDoc = querySnapshot.docs[0];
      navigate(`/game/${partyDoc.id}`);
    } catch (error) {
      console.error('Error joining party:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-purple-400 mb-2 flex items-center justify-center">
            <Sparkles className="mr-2" />
            Not Enough Mana
          </h1>
          <p className="text-gray-400">Enter your name to start playing</p>
        </div>

        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="flex flex-col space-y-4">
            <Button
              onClick={createParty}
              disabled={loading || !name}
              className="w-full"
            >
              <Sparkles className="mr-2" />
              Create New Party
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-900 text-gray-400">Or</span>
              </div>
            </div>

            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Enter party code"
                value={partyCode}
                onChange={(e) => setPartyCode(e.target.value)}
              />
              <Button
                variant="secondary"
                onClick={joinParty}
                disabled={loading || !name || !partyCode}
                className="w-full"
              >
                <Users className="mr-2" />
                Join Party
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}