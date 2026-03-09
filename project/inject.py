import sys

file_path = "c:\\_Projects\\Electro-Wizards-Arena-Online\\project\\src\\hooks\\useGameActions.ts"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

target = '''        }
        break;
      }
      default:'''

replacement = '''        }
        break;
      }
      case 'canCupHolyAlliance': {
        const waterBonus = Math.max(0, Math.round(card.effect.value));
        if (waterBonus > 0) {
          addWaterSips(player, waterBonus, sipsPerCan);
          affectedPlayerIds.add(player.id);
          if (target && target.id !== player.id) {
            addWaterSips(target, waterBonus, sipsPerCan);
            affectedPlayerIds.add(target.id);
          }
          nextPendingCanCupSips = recalculatePendingCanCupSips(nextPendingCanCupSips, updatedPlayers, sipsPerCan);
        }
        break;
      }
      case 'canCupRockBottom': {
        const baseDamage = Math.max(0, Math.round(card.effect.value));
        const emptyCans = player.canCup?.emptyCans ?? 0;
        const totalDamage = baseDamage + (2 * emptyCans);
        if (totalDamage > 0) {
          targetSipCommand += queueForcedSips(target.id, totalDamage);
        }
        break;
      }
      case 'canCupRussianRoulette': {
        if (updatedPlayers.length > 0) {
          const randomVictim = updatedPlayers[Math.floor(Math.random() * updatedPlayers.length)];
          resolvedTargetId = randomVictim.id;
          const victimCanCup = ensureCanCupState(randomVictim, sipsPerCan);
          const remainingSips = victimCanCup.sipsLeft + victimCanCup.waterSips;
          if (remainingSips > 0) {
            targetSipCommand += queueForcedSips(randomVictim.id, remainingSips);
          }
        }
        break;
      }
      case 'canCupSharedBurden': {
        const currentPending = player.canCup?.forcedSipsRemaining ?? 0;
        if (currentPending > 0) {
          const sipsToTransfer = Math.floor(currentPending / 2);
          if (sipsToTransfer > 0 && player.canCup) {
            player.canCup.forcedSipsRemaining -= sipsToTransfer;
            targetSipCommand += queueForcedSips(target.id, sipsToTransfer);
            affectedPlayerIds.add(player.id);
            affectedPlayerIds.add(target.id);
          }
        }
        break;
      }
      case 'canCupPenaltyDrink': {
        updatedPlayers.forEach((entry) => {
          const emptyCans = entry.canCup?.emptyCans ?? 0;
          if (emptyCans > 0) {
            const applied = queueForcedSips(entry.id, emptyCans);
            if (entry.id === target.id) {
               targetSipCommand += applied;
            }
          }
        });
        break;
      }
      default:'''

if target in content:
    content = content.replace(target, replacement)
elif target.replace('\n', '\r\n') in content:
    content = content.replace(target.replace('\n', '\r\n'), replacement.replace('\n', '\r\n'))
else:
    print("Target not found")
    sys.exit(1)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Success")
