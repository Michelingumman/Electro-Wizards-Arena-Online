import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { GameSettings as GameSettingsType } from '../../../types/game';
import { GAME_CONFIG } from '../../../config/gameConfig';
import { useGameStore } from '../../../store/gameStore';

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
  }, [party?.settings]);

  if (!isLeader) return null;

  const handleSave = () => {
    onSave(settings);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="secondary"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 flex items-center justify-center min-w-[40px] h-[40px]"
        title="Game Settings"
      >
        <Settings className="w-5 h-5" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-gray-800 rounded-lg shadow-xl p-4 z-50 border border-purple-500/20">
          <h3 className="text-lg font-semibold mb-4 text-purple-100">Game Settings</h3>

          <div className="space-y-4">
            {party?.gameMode === 'can-cup' ? (
              <>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Klunkar per burk</label>
                  <Input
                    type="number"
                    value={settings.canCupSipsPerCan ?? 10}
                    onChange={(e) => setSettings(s => ({
                      ...s,
                      canCupSipsPerCan: Math.max(1, Math.min(30, parseInt(e.target.value) || 10))
                    }))}
                    min={1}
                    max={30}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Antal klunkar i varje burk
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Burkar för vinst</label>
                  <Input
                    type="number"
                    value={settings.canCupCansToWin ?? 5}
                    onChange={(e) => setSettings(s => ({
                      ...s,
                      canCupCansToWin: Math.max(1, Math.min(20, parseInt(e.target.value) || 5))
                    }))}
                    min={1}
                    max={20}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Spelet slutar när någon tömt så många burkar
                  </p>
                </div>
              </>
            ) : (
              <>
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
                    Player becomes "drunk" when drunkness exceeds this value
                  </p>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Drunkness Decay Rate</label>
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
                    How quickly drunkness decreases per minute (higher = faster sobering)
                  </p>
                </div>
              </>
            )}

            <div className="pt-3 mt-3 border-t border-gray-700/50">
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <span className="block text-sm text-amber-300 font-semibold">🔧 God Mode</span>
                  <span className="block text-[10px] text-gray-500">Debug: pick any card from the pool</span>
                </div>
                <div
                  className={`relative w-10 h-5 rounded-full transition-colors ${settings.godMode ? 'bg-amber-500' : 'bg-gray-600'}`}
                  onClick={() => setSettings(s => ({ ...s, godMode: !s.godMode }))}
                >
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${settings.godMode ? 'translate-x-5' : ''}`} />
                </div>
              </label>
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="secondary"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
