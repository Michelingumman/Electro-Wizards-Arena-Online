import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MainMenu } from './pages/MainMenu';
import { Game } from './pages/Game';
import { CardBattleLobby } from './games/card-battle/pages/CardBattleLobby';
import { TDLobby } from './games/tower-defense/pages/TDLobby';
import { TDDeckBuilder } from './games/tower-defense/pages/TDDeckBuilder';
import { TDMatch } from './games/tower-defense/pages/TDMatch';
import { Racing } from './games/racing/Racing';
import { Puzzle } from './games/puzzle/Puzzle';
import { DebugFirebase } from './debug-firebase';
import { FirebaseTest } from './components/FirebaseTest';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">
        <Routes>
          {/* Main Menu */}
          <Route path="/" element={<MainMenu />} />
          
          {/* Debug Route */}
          <Route path="/debug" element={<DebugFirebase />} />
          
          {/* Firebase Test Route */}
          <Route path="/test-firebase" element={<FirebaseTest />} />
          
          {/* Card Battle Game Routes */}
          <Route path="/games/card-battle" element={<CardBattleLobby />} />
          <Route path="/games/card-battle/game/:partyId" element={<Game />} />
          
          {/* Legacy route for backward compatibility */}
          <Route path="/game/:partyId" element={<Game />} />
          
          {/* Tower Defense Routes */}
          <Route path="/games/tower-defense" element={<TDLobby />} />
          <Route path="/games/tower-defense/deck/:matchId" element={<TDDeckBuilder />} />
          <Route path="/games/tower-defense/match/:matchId" element={<TDMatch />} />
          {/* Other Games */}
          <Route path="/games/racing" element={<Racing />} />
          <Route path="/games/puzzle" element={<Puzzle />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;