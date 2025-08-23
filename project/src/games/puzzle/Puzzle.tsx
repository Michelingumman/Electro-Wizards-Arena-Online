import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PuzzleIcon, Wrench } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export function Puzzle() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-indigo-900">
      <div className="relative max-w-2xl w-full">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute top-40 -left-20 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl" />
        
        <div className="relative bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-gray-700">
          {/* Back Button */}
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
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <PuzzleIcon className="w-16 h-16 text-indigo-400" />
                <div className="absolute -inset-2 bg-indigo-500/20 blur-sm rounded-full" />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4">
              Puzzle Adventure
            </h1>
            <p className="text-xl text-gray-300 mb-2">Coming Soon!</p>
            <p className="text-gray-400 mb-8">Mind-bending puzzles and brain teasers</p>
            
            <div className="bg-gray-700/50 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-center mb-4">
                <Wrench className="w-8 h-8 text-yellow-400 mr-2" />
                <h2 className="text-xl font-semibold text-yellow-400">Under Development</h2>
              </div>
              <p className="text-gray-300 text-center">
                This game is currently being developed. Check back soon for updates!
              </p>
            </div>
            
            <Button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              Back to Game Menu
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 