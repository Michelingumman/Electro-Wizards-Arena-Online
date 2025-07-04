import { useState } from 'react';
import { Settings, Plus, Minus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { GameSettings as GameSettingsType, CardTheme } from '../../types/game';
import { GAME_CONFIG } from '../../config/gameConfig';

interface GameSettingsProps {
  onSave: (settings: GameSettingsType) => void;
  isLeader: boolean;
}

export function GameSettings({ onSave, isLeader }: GameSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<GameSettingsType>({
    maxHealth: GAME_CONFIG.MAX_HEALTH,
    maxMana: GAME_CONFIG.MAX_MANA,
    manaDrinkAmount: GAME_CONFIG.MANA_DRINK_AMOUNT,
    initialHealth: GAME_CONFIG.INITIAL_HEALTH,
    initialMana: GAME_CONFIG.INITIAL_MANA,
    cardTheme: 'electrical' as CardTheme
  });

  if (!isLeader) return null;

  const currentSettings = settings || {
    maxHealth: 30,
    maxMana: 5,
    manaDrinkAmount: 1,
    initialHealth: 20,
    initialMana: 2,
    cardTheme: 'electrical' as CardTheme
  };

  return (
    <div className="relative">
      <Button
        variant="secondary"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2"
      >
        <Settings className="w-4 h-4" />
        <span>Game Settings</span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-gray-800 rounded-lg shadow-xl p-4 z-50 border border-purple-500/20">
          <h3 className="text-lg font-semibold mb-4 text-purple-100">Game Settings</h3>
          
          <div className="space-y-6">
            {/* Card Theme Setting */}
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">Card Theme</span>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSettings(s => ({ ...s, cardTheme: 'original' }))}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentSettings.cardTheme === 'original'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Original Party
                </button>
                <button
                  onClick={() => setSettings(s => ({ ...s, cardTheme: 'electrical' }))}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentSettings.cardTheme === 'electrical'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Electrical Engineering
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Initial Health</label>
              <Input
                type="number"
                value={currentSettings.initialHealth}
                onChange={(e) => setSettings(s => ({
                  ...s,
                  initialHealth: parseInt(e.target.value)
                }))}
                min={1}
                max={100}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Max Health</label>
              <Input
                type="number"
                value={currentSettings.maxHealth}
                onChange={(e) => setSettings(s => ({
                  ...s,
                  maxHealth: parseInt(e.target.value)
                }))}
                min={1}
                max={100}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Initial Mana</label>
              <Input
                type="number"
                value={currentSettings.initialMana}
                onChange={(e) => setSettings(s => ({
                  ...s,
                  initialMana: parseInt(e.target.value)
                }))}
                min={1}
                max={100}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Max Mana</label>
              <Input
                type="number"
                value={currentSettings.maxMana}
                onChange={(e) => setSettings(s => ({
                  ...s,
                  maxMana: parseInt(e.target.value)
                }))}
                min={1}
                max={100}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Mana per Drink</label>
              <Input
                type="number"
                value={currentSettings.manaDrinkAmount}
                onChange={(e) => setSettings(s => ({
                  ...s,
                  manaDrinkAmount: parseInt(e.target.value)
                }))}
                min={1}
                max={100}
              />
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="secondary"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  onSave(settings);
                  setIsOpen(false);
                }}
              >
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}