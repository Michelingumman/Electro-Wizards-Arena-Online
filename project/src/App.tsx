import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PartySetup } from './components/PartySetup';
import { GameContainer } from './components/GameContainer';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PartySetup />} />
        <Route path="/game/:partyId" element={<GameContainer />} />
      </Routes>
    </Router>
  );
}

export default App;