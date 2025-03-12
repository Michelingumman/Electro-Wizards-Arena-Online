import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { GameSettings as GameSettingsType } from '../../types/game';
import { GAME_CONFIG } from '../../config/gameConfig';
import { useGameStore } from '../../store/gameStore';

interface GameSettingsProps {
  onSave: (settings: GameSettingsType) => void;
  isLeader: boolean;
}

export function GameSettings({ onSave, isLeader }: GameSettingsProps) {
  const { party } = useGameStore();
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<GameSettingsType>({
    maxMana: GAME_CONFIG.MAX_MANA,
    manaDrinkAmount: GAME_CONFIG.MANA_DRINK_AMOUNT,
    initialMana: GAME_CONFIG.INITIAL_MANA,
    drunkThreshold: GAME_CONFIG.DRUNK_THRESHOLD,
    manaIntakeDecayRate: GAME_CONFIG.MANA_INTAKE_DECAY_RATE,
  });

  // Update settings from party when it changes
  useEffect(() => {
    if (party?.settings) {
      setSettings({
        maxMana: party.settings.maxMana || GAME_CONFIG.MAX_MANA,
        manaDrinkAmount: party.settings.manaDrinkAmount || GAME_CONFIG.MANA_DRINK_AMOUNT,
        initialMana: party.settings.initialMana || GAME_CONFIG.INITIAL_MANA,
        drunkThreshold: party.settings.drunkThreshold || GAME_CONFIG.DRUNK_THRESHOLD,
        manaIntakeDecayRate: party.settings.manaIntakeDecayRate || GAME_CONFIG.MANA_INTAKE_DECAY_RATE,
      });
    }
  }, [party]);

  if (!isLeader) return null;

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
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Initial Mana</label>
              <Input
                type="number"
                value={settings.initialMana}
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
                value={settings.maxMana}
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
                value={settings.manaDrinkAmount}
                onChange={(e) => setSettings(s => ({
                  ...s,
                  manaDrinkAmount: parseInt(e.target.value)
                }))}
                min={1}
                max={100}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Drunk Threshold</label>
              <Input
                type="number"
                value={settings.drunkThreshold}
                onChange={(e) => setSettings(s => ({
                  ...s,
                  drunkThreshold: parseInt(e.target.value)
                }))}
                min={1}
                max={100}
              />
              <p className="text-xs text-gray-500 mt-1">
                Player becomes "drunk" when mana intake exceeds this value
              </p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Mana Intake Decay Rate</label>
              <Input
                type="number"
                value={settings.manaIntakeDecayRate}
                onChange={(e) => setSettings(s => ({
                  ...s,
                  manaIntakeDecayRate: parseFloat(e.target.value)
                }))}
                min={0.1}
                max={20}
                step={0.1}
              />
              <p className="text-xs text-gray-500 mt-1">
                How quickly mana intake decreases per minute (higher = faster sobering)
              </p>
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