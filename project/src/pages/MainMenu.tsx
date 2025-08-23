import { useNavigate } from 'react-router-dom';
import { Sparkles, Wand2, Zap, Car, Shield, PuzzleIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface GameOption {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  status: 'available' | 'coming-soon';
  path: string;
  gradient: string;
}

const games: GameOption[] = [
  {
    id: 'card-battle',
    name: 'Card Battle Arena',
    description: 'Strategic card battles with electrical engineering themes',
    icon: Zap,
    status: 'available',
    path: '/games/card-battle',
    gradient: 'from-purple-600 to-pink-600'
  },
  {
    id: 'tower-defense',
    name: 'Tower Defense',
    description: 'Defend your base with strategic tower placement',
    icon: Shield,
    status: 'available',
    path: '/games/tower-defense',
    gradient: 'from-green-600 to-blue-600'
  },
  {
    id: 'racing',
    name: 'Racing Game',
    description: 'High-speed racing with customizable vehicles',
    icon: Car,
    status: 'coming-soon',
    path: '/games/racing',
    gradient: 'from-red-600 to-orange-600'
  },
  {
    id: 'puzzle',
    name: 'Puzzle Adventure',
    description: 'Mind-bending puzzles and brain teasers',
    icon: PuzzleIcon,
    status: 'coming-soon',
    path: '/games/puzzle',
    gradient: 'from-indigo-600 to-purple-600'
  }
];

export function MainMenu() {
  const navigate = useNavigate();

  const handleGameSelect = (game: GameOption) => {
    if (game.status === 'available') {
      navigate(game.path);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-purple-900">
      <div className="relative max-w-4xl w-full">
        {/* Background effects */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute top-40 -left-20 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -right-20 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl" />
        
        <div className="relative bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-gray-700">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <Wand2 className="w-16 h-16 text-purple-400" />
                <div className="absolute -inset-2 bg-purple-500/20 blur-sm rounded-full" />
              </div>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              Electro Wizards Arena
            </h1>
            <p className="text-xl text-gray-300 mb-2">Choose Your Adventure</p>
            <p className="text-gray-400">Select a game to start playing</p>
          </div>

          {/* Game Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {games.map((game) => {
              const Icon = game.icon;
              return (
                <div
                  key={game.id}
                  className={`relative group cursor-pointer transition-all duration-300 hover:scale-105 ${
                    game.status === 'coming-soon' ? 'opacity-75' : ''
                  }`}
                  onClick={() => handleGameSelect(game)}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${game.gradient} opacity-0 group-hover:opacity-10 transition-opacity rounded-xl`} />
                  
                  <div className="relative bg-gray-700/50 backdrop-blur-sm rounded-xl p-6 border border-gray-600 group-hover:border-gray-500 transition-colors">
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${game.gradient} flex-shrink-0`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-xl font-semibold text-white group-hover:text-purple-300 transition-colors">
                            {game.name}
                          </h3>
                          {game.status === 'coming-soon' && (
                            <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded-full border border-yellow-500/30">
                              Coming Soon
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-400 text-sm mb-4 group-hover:text-gray-300 transition-colors">
                          {game.description}
                        </p>
                        
                        <Button
                          variant={game.status === 'available' ? 'default' : 'secondary'}
                          size="sm"
                          disabled={game.status === 'coming-soon'}
                          className={`w-full ${game.status === 'available' ? 'group-hover:bg-purple-600' : ''}`}
                        >
                          {game.status === 'available' ? (
                            <>
                              <Sparkles className="mr-2 w-4 h-4" />
                              Play Now
                            </>
                          ) : (
                            'Coming Soon'
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-gray-500 text-sm">
              More games coming soon! Stay tuned for updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 