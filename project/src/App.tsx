import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Game } from './pages/Game';
import { initServerTimeOffset } from './lib/firebase';

function App() {
  useEffect(() => {
    initServerTimeOffset();
  }, []);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen min-h-[100dvh] bg-gray-900 text-white">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game/:partyId" element={<Game />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
