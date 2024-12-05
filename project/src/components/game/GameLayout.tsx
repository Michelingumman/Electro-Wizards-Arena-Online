import { ReactNode } from 'react';
import { motion } from 'framer-motion';

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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-purple-900 overflow-hidden">
      <div className="h-screen flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex-none py-4">
          {header}
        </div>
        
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 overflow-hidden">
          {/* Left Column - Opponents and Action Log */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 flex flex-col gap-4 overflow-hidden"
          >
            <div className="flex-none">{opponents}</div>
            <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent pr-2">
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-purple-200 uppercase tracking-wider sticky top-0 bg-gradient-to-b from-gray-900/90 to-transparent backdrop-blur-sm py-2 z-10">
                  Action Log
                </h3>
                {actionLog}
              </div>
            </div>
          </motion.div>

          {/* Right Column - Game Content */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-8 flex flex-col gap-4 lg:gap-6 overflow-hidden"
          >
            <div className="flex-none">{currentPlayer}</div>
            <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent pr-2">
              {cards}
            </div>
          </motion.div>
        </div>

        <div className="flex-none py-4">
          {controls}
        </div>
      </div>
    </div>
  );
}