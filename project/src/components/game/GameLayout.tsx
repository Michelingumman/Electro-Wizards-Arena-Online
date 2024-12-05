import { ReactNode } from 'react';

interface GameLayoutProps {
  header: ReactNode;
  opponents: ReactNode;
  actionLog: ReactNode;
  currentPlayer: ReactNode;
  cards: ReactNode;
  controls: ReactNode;
}

export function GameLayout({
  header,
  opponents,
  actionLog,
  currentPlayer,
  cards,
  controls
}: GameLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-purple-900 overflow-auto">
      <div className="max-w-6xl mx-auto p-4">
        {header}
        
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Opponents and Action Log */}
          <div className="lg:col-span-4 space-y-4">
            {opponents}
            {actionLog}
          </div>

          {/* Right Column - Game Content */}
          <div className="lg:col-span-8 space-y-6">
            {currentPlayer}
            {cards}
          </div>
        </div>

        {controls}
      </div>
    </div>
  );
}