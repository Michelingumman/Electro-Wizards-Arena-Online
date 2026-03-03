# Can Cup Mode - Mechanics and Balance Notes

## Core loop

Can Cup is a real-time consumption race:

1. Every player has a digital can with `10` sips.
2. Card effects force sip consumption, block sip consumption, or manipulate sip state.
3. When a can reaches `0`, the player gains `+1` empty can trophy and a fresh can spawns at `10/10`.
4. Match pressure is now "who can be forced to cycle cans fastest", not mana economy.

## State model

Each player tracks:

- `sipsLeft`: remaining sips in active can.
- `waterSips`: temporary buffer sips that absorb forced damage.
- `deflectCharges`: one-shot sip blocks.
- `emptyCans`: completed can count (trophy metric).

## Defensive semantics

To keep the game physically coherent:

- **Sip Deflection** blocks the next forced sip.
- **Water Break** adds virtual buffer sips and does not require real drinking when consumed.
- **Top Up** increases digital runway only (stall mechanic), no real refill.

These mechanics reduce immediate punishment without creating impossible "reverse drinking" behavior.

## Card lane design

### Common lane (pace setters)

- `Take a Sip` (target 1)
- `Social!` (all players 1)
- `Water Break` (+2 buffer)
- `Sip Deflection` (+1 block)
- `Top Up` (+2 digital)

Goal: constant pressure with low cognitive load.

### Rare lane (economy manipulation)

- `Double Trouble` (self 2, target 4)
- `Bottoms Up Prep` (target to 1 sip left)
- `Can Swap` (swap active can sip counts)
- `Pressure Pour` (target 2)

Goal: tactical swings and setup plays.

### Epic lane (challenge spikes)

- `Arm Wrestle` (loser 5)
- `Category Random` (loser 3)
- `Rock Paper Scissors` (loser 3)
- `Pushups` (loser 7)

Goal: social pauses with clear, high-stakes penalties.

## Balance watchpoints

1. **Prep + burst chains**
   - `Bottoms Up Prep` into high-sip follow-up can feel oppressive.
   - Mitigation: keep prep effects rare and track play rate.

2. **Defense dead states**
   - Too much `waterSips + deflectCharges` can stall pressure.
   - Mitigation: cap buffer gain per turn if needed.

3. **Challenge volatility**
   - Large losses (`7` sips) can dominate outcomes in small groups.
   - Mitigation: tune penalty by player count in later pass.

4. **Can swap abuse**
   - Repeated swaps may create kingmaker moments.
   - Mitigation: keep rarity at Rare and avoid cheap duplicates.

## Telemetry to capture next

- Average sips forced per turn.
- Empty cans per player over time.
- Defensive block rate (`water` and `deflect` separately).
- Challenge usage and post-challenge lead change.
- Win-rate by first player and by card family.

This gives a fast feedback loop for balancing without guessing.
