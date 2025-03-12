import { CardEffect, EffectType } from '../types/cards';
import { Player } from '../types/game';
import { GAME_CONFIG } from '../config/gameConfig';

export class EffectManager {
  static apply(effect: CardEffect, target: Player | null, caster: Player, players: Player[], onEffectApplied?: (effectType: string, value: number, targetPlayer: Player) => void): Player[] {
    // Copy the players array to avoid mutating the original
    const updatedPlayers = [...players];
    const targetIndex = target ? updatedPlayers.findIndex(p => p.id === target.id) : -1;
    const casterIndex = updatedPlayers.findIndex(p => p.id === caster.id);

    // Get player references from the copied array
    const casterPlayer = updatedPlayers[casterIndex];
    const targetPlayer = targetIndex >= 0 ? updatedPlayers[targetIndex] : null;

    switch (effect.type) {
      case 'damage':
        if (targetPlayer) {
          targetPlayer.mana = Math.max(0, targetPlayer.mana - effect.value);
          if (onEffectApplied) onEffectApplied('damage', effect.value, targetPlayer);
        }
        break;
      
      case 'aoe-damage':
        updatedPlayers.forEach(player => {
          if (player.id !== caster.id) {
            player.mana = Math.max(0, player.mana - effect.value);
            if (onEffectApplied) onEffectApplied('aoe-damage', effect.value, player);
          }
        });
        break;
      
      case 'heal':
        casterPlayer.mana = Math.min(casterPlayer.maxMana, casterPlayer.mana + effect.value);
        if (onEffectApplied) onEffectApplied('heal', effect.value, casterPlayer);
        break;
      
      case 'life-steal':
        if (targetPlayer) {
          // Get target's mana value
          const targetMana = targetPlayer.mana;
          // Get caster's mana value
          const casterMana = casterPlayer.mana;
          
          // Swap mana values
          targetPlayer.mana = Math.min(targetPlayer.maxMana, casterMana);
          casterPlayer.mana = Math.min(casterPlayer.maxMana, targetMana);
          
          if (onEffectApplied) {
            onEffectApplied('life-steal-from', casterMana, targetPlayer);
            onEffectApplied('life-steal-to', targetMana, casterPlayer);
          }
        }
        break;
      
      case 'manaDrain':
        if (targetPlayer) {
          const drainAmount = Math.min(targetPlayer.mana, effect.value);
          targetPlayer.mana = Math.max(0, targetPlayer.mana - drainAmount);
          casterPlayer.mana = Math.min(casterPlayer.maxMana, casterPlayer.mana + drainAmount);
          
          if (onEffectApplied) {
            onEffectApplied('mana-drain-from', drainAmount, targetPlayer);
            onEffectApplied('mana-drain-to', drainAmount, casterPlayer);
          }
        }
        break;
      
      case 'manaBurn':
        if (targetPlayer) {
          const burnAmount = Math.floor(targetPlayer.mana / 2); // Burn half of target's mana
          targetPlayer.mana = Math.max(0, targetPlayer.mana - burnAmount);
          targetPlayer.manaIntake += burnAmount; // Convert burned mana to intake
          
          if (onEffectApplied) {
            onEffectApplied('mana-burn', burnAmount, targetPlayer);
          }
        }
        break;
        
      case 'reversed-curse-tech':
        if (targetPlayer) {
          const gainAmount = Math.floor(targetPlayer.mana / 2); // Gain half of target's mana
          casterPlayer.mana = Math.min(casterPlayer.maxMana, casterPlayer.mana + gainAmount);
          
          if (onEffectApplied) {
            onEffectApplied('reversed-curse-tech', gainAmount, casterPlayer);
          }
        }
        break;
      
      case 'manaRefill':
        casterPlayer.mana = casterPlayer.maxMana;
        if (onEffectApplied) onEffectApplied('mana-refill', casterPlayer.maxMana, casterPlayer);
        break;
      
      case 'manaIntake':
        if (targetPlayer) {
          targetPlayer.manaIntake = Math.max(0, targetPlayer.manaIntake + effect.value);
          if (onEffectApplied) onEffectApplied('mana-intake', effect.value, targetPlayer);
        } else {
          // If no target, apply to the caster
          casterPlayer.manaIntake = Math.max(0, casterPlayer.manaIntake + effect.value);
          if (onEffectApplied) onEffectApplied('mana-intake', effect.value, casterPlayer);
        }
        break;
        
      case 'potionBuff':
        casterPlayer.potionBuffs = [...(casterPlayer.potionBuffs || []), {
          turnsLeft: 3,
          type: 'manaRefill',
          value: effect.value
        }];
        if (onEffectApplied) onEffectApplied('potion-buff', effect.value, casterPlayer);
        break;
        
      case 'debuff':
        if (targetPlayer) {
          targetPlayer.debuffs = [...(targetPlayer.debuffs || []), {
            turnsLeft: 3,
            type: 'manaLeakage',
            value: effect.value
          }];
          if (onEffectApplied) onEffectApplied('debuff', effect.value, targetPlayer);
        }
        break;
        
      case 'manaOverload':
        if (targetPlayer) {
          // Increase target's mana by value
          targetPlayer.mana = Math.min(targetPlayer.maxMana, targetPlayer.mana + effect.value);
          // Also increase target's mana intake
          targetPlayer.manaIntake += Math.floor(effect.value / 2);
          if (onEffectApplied) onEffectApplied('mana-overload', effect.value, targetPlayer);
        }
        break;
        
      case 'soberingPotion':
        // Reset mana intake to 0 or reduce by a percentage
        casterPlayer.manaIntake = effect.value === 0 ? 0 : Math.max(0, casterPlayer.manaIntake * (1 - effect.value));
        if (onEffectApplied) onEffectApplied('sobering-potion', effect.value, casterPlayer);
        break;
        
      case 'manaShield':
        // Apply a mana shield effect that lasts for a number of turns
        casterPlayer.manaShield = effect.value;
        if (onEffectApplied) onEffectApplied('mana-shield', effect.value, casterPlayer);
        break;
        
      case 'roulette':
        // Choose a random player and apply mana intake
        const randomIndex = Math.floor(Math.random() * updatedPlayers.length);
        const randomPlayer = updatedPlayers[randomIndex];
        randomPlayer.manaIntake += effect.value;
        if (onEffectApplied) onEffectApplied('roulette', effect.value, randomPlayer);
        break;
        
      case 'manaDouble':
        // Double the caster's current mana and add to mana intake
        const newMana = Math.min(casterPlayer.maxMana, casterPlayer.mana * 2);
        const manaGained = newMana - casterPlayer.mana;
        casterPlayer.mana = newMana;
        casterPlayer.manaIntake += 15; // This is hardcoded from the card description
        if (onEffectApplied) onEffectApplied('mana-double', manaGained, casterPlayer);
        break;
        
      case 'manaIntakeOthers':
        // Increase mana intake for all players except caster
        updatedPlayers.forEach(player => {
          if (player.id !== caster.id) {
            player.manaIntake += effect.value;
            if (onEffectApplied) onEffectApplied('mana-intake-others', effect.value, player);
          }
        });
        break;
        
      case 'setAllToDrunk':
        // Set every player's mana intake to the drunk threshold
        updatedPlayers.forEach(player => {
          player.manaIntake = GAME_CONFIG.DRUNK_THRESHOLD;
          if (onEffectApplied) onEffectApplied('set-all-to-drunk', GAME_CONFIG.DRUNK_THRESHOLD, player);
        });
        break;
        
      case 'resetManaIntake':
        // Reset target player's mana intake to 0
        if (targetPlayer) {
          targetPlayer.manaIntake = 0;
          if (onEffectApplied) onEffectApplied('reset-mana-intake', 0, targetPlayer);
        }
        break;
        
      case 'maxManaAndMana':
        // Increase max mana and current mana
        casterPlayer.maxMana += effect.value;
        casterPlayer.mana += effect.value;
        if (onEffectApplied) onEffectApplied('max-mana-and-mana', effect.value, casterPlayer);
        break;
        
      case 'manaStealAll':
        // Steal mana from all other players
        let totalStolen = 0;
        updatedPlayers.forEach(player => {
          if (player.id !== caster.id) {
            const stealAmount = Math.min(player.mana, effect.value);
            player.mana -= stealAmount;
            // Also reduce their max mana by 2 (hardcoded from card description)
            player.maxMana = Math.max(1, player.maxMana - 2);
            totalStolen += stealAmount;
            if (onEffectApplied) onEffectApplied('mana-steal-all-from', stealAmount, player);
          }
        });
        casterPlayer.mana = Math.min(casterPlayer.maxMana, casterPlayer.mana + totalStolen);
        if (onEffectApplied && totalStolen > 0) onEffectApplied('mana-steal-all-to', totalStolen, casterPlayer);
        break;
        
      case 'divineIntervention':
        // Reset everyone's mana intake to 0 and give everyone some mana
        updatedPlayers.forEach(player => {
          player.manaIntake = 0;
          player.mana = Math.min(player.maxMana, player.mana + effect.value);
          if (onEffectApplied) onEffectApplied('divine-intervention', effect.value, player);
        });
        break;
        
      case 'manaIntakeMultiply':
        // Multiply the target's mana intake
        if (targetPlayer) {
          targetPlayer.manaIntake = Math.floor(targetPlayer.manaIntake * effect.value);
          if (onEffectApplied) onEffectApplied('mana-intake-multiply', effect.value, targetPlayer);
        } else {
          casterPlayer.manaIntake = Math.floor(casterPlayer.manaIntake * effect.value);
          if (onEffectApplied) onEffectApplied('mana-intake-multiply', effect.value, casterPlayer);
        }
        break;
        
      case 'drunkestPlayerDamage':
        // Find the player with the highest mana intake and reduce their mana
        let maxIntakePlayer = updatedPlayers[0];
        updatedPlayers.forEach(player => {
          if (player.manaIntake > maxIntakePlayer.manaIntake) {
            maxIntakePlayer = player;
          }
        });
        
        // Apply the mana loss
        maxIntakePlayer.mana = Math.max(0, maxIntakePlayer.mana + effect.value); // Note: effect.value is negative
        if (onEffectApplied) onEffectApplied('drunkest-player-damage', Math.abs(effect.value), maxIntakePlayer);
        break;
        
      case 'manaTransfer':
        // Transfer mana from caster to target
        if (targetPlayer) {
          const transferAmount = Math.min(casterPlayer.mana, effect.value);
          casterPlayer.mana -= transferAmount;
          targetPlayer.mana = Math.min(targetPlayer.maxMana, targetPlayer.mana + transferAmount);
          if (onEffectApplied) {
            onEffectApplied('mana-transfer-from', transferAmount, casterPlayer);
            onEffectApplied('mana-transfer-to', transferAmount, targetPlayer);
          }
        }
        break;
        
      case 'manaStealer':
        // For challenge cards, steal mana from loser to winner
        if (targetPlayer) {
          const stealAmount = Math.min(targetPlayer.mana, effect.value);
          targetPlayer.mana -= stealAmount;
          casterPlayer.mana = Math.min(casterPlayer.maxMana, casterPlayer.mana + stealAmount);
          if (onEffectApplied) {
            onEffectApplied('mana-stealer-from', stealAmount, targetPlayer);
            onEffectApplied('mana-stealer-to', stealAmount, casterPlayer);
          }
        }
        break;
    }

    return updatedPlayers;
  }
} 