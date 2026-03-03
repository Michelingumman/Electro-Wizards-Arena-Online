# Electro Wizards Arena - Game Dynamics and Mechanics Analysis

## Scope and intent

This document maps the current gameplay system, identifies balance and UX issues, and proposes practical pivots for a "party-first" vibe. The target is a fun social game loop, not a simulation of real drinking behavior.

## Current core loop

1. Players start with mana and a hand of cards.
2. On each turn, a player:
   - plays one card (targeted, self, area, or challenge), or
   - drinks for mana (always available in modern mode).
3. Card effects modify mana, drunkness, and some temporary effects.
4. Drunkness decays over time.
5. A player is marked "drunk" at threshold percentage and may miss actions.

## Resource model

- **Mana**
  - Main tactical currency.
  - Spent to play cards.
  - Recovered via drink action and mana-gain cards.
- **Drunkness** (technical field: `manaIntake`)
  - Secondary pressure meter.
  - Increased by drink or certain cards.
  - Decays over time (server sync + local projected timer visuals).
  - Drives drunk status and miss chance.

## Mechanics coverage snapshot

### Action system

- `lastAction` now carries telemetry (cost, deltas, damage, affected players, timestamp).
- Arena animation can display direct action context (attacker to target, floating damage, top banner details).
- Challenge has pending-state architecture (`pendingChallenge`) for modern flow.

### Effect handling (status)

- Top-level card effect types from pools are now covered in `applyCardEffect`.
- Challenge effect schemas supported:
  - `winnerEffect` / `loserEffect`
  - `challengeEffects.winner` / `challengeEffects.loser`
  - `challenge.winnerEffect` / `challenge.loserEffect`

### Outstanding reliability risks

- Large switch-driven effect resolution is hard to reason about and test.
- Many effects rely on conventions (`type`, `effect.type`, `requiresTarget`) without schema-level guarantees.
- "Max mana" wording vs implementation can drift because there is no per-player max stat in state.

## Balance and feel review

## What currently works

- Fast turns and visible impacts.
- Good chaos potential from area and random cards.
- Challenge cards create social engagement if they are clearly broadcast and resolvable.

## What currently creates frustration

- Turn ownership can be unclear on small screens.
- Target selection flow can feel inconsistent if card-state UI blocks taps.
- Some card descriptions imply persistent stats while implementation applies immediate effects only.
- Broad "all player" effects can swing too hard if stacked early.

## High-level balance pressure points

1. **Mana economy inflation**
   - If mana gain outpaces costs, turns become "spam best cards".
2. **Drunkness irrelevance or overload**
   - If decay too fast, drunkness has no strategic weight.
   - If decay too slow, players can become stuck in high miss-chance loops.
3. **Challenge payoff variance**
   - Big winner/loser swings can feel random if not telegraphed and constrained.
4. **Legendary outliers**
   - Highly custom effects can bypass normal tradeoffs and produce non-interactive turns.

## Suggested balance pivots (party-game friendly)

## Pivot A: "Tempo over burst"

- Lower average immediate mana gain.
- Keep card costs meaningful, with stronger identity per rarity.
- Use drunkness as a pacing cost, not a punishment lock.

### Practical rules

- Keep drink available, but tune amount by player count.
- Cap single-turn net mana gain from card effects.
- Reduce repeated "full reset" effects unless they have high opportunity cost.

## Pivot B: "Readable consequences"

- Every effect should map to one visible output category:
  - mana up/down,
  - drunkness up/down,
  - protection/negation,
  - challenge outcome.
- Avoid hidden compound effects unless the UI explicitly displays them.

## Pivot C: "Social challenge lane"

- Challenge cards should:
  - always enter pending state,
  - always be visible to all players,
  - consume turn only on resolve,
  - show explicit winner/loser effects in one place.

## Suggested card taxonomy cleanup

### Keep four tactical lanes

1. **Pressure**: damage, drains, forced drinks.
2. **Recovery**: mana gain, sobering, shields.
3. **Control**: swap/steal/redistribute, target restrictions.
4. **Social**: challenge cards with clear outcomes.

### Reduce effect-string fragmentation

- Consolidate near-duplicates:
  - `manaIntakeMultiply` and `manaIntakeMultiplier`
  - any legacy alias forms for same behavior
- Move all effect definitions to one typed registry with validation.

## Proposed balancing framework

## Baseline numbers

- Define expected turn value budget by rarity:
  - Common: low swing, predictable.
  - Rare: moderate swing or tactical utility.
  - Epic: strong swing or setup.
  - Legendary: unique but bounded impact.

## Drunkness tuning guidelines

- Threshold should matter before hard failure:
  - warning band,
  - impaired band,
  - high-risk band.
- Decay rate should be tuned to keep recovery visible within 2-4 turns in normal play.

## Challenge tuning guidelines

- Reward should be enough to justify social overhead.
- Punishment should avoid immediate game shutdown.
- Prefer "winner gains X, loser loses X" symmetry for readability.

## Data and telemetry to add

Track per match:

- average mana per turn,
- average drunkness per turn,
- cards played by rarity,
- miss-rate due to drunk status,
- challenge pick-rate and resolve-rate,
- win-rate by first player and by card family.

This allows objective balance iteration rather than anecdotal tuning.

## Recommended technical refactor path

1. Introduce `effectRegistry` with:
   - effect id,
   - handler function,
   - validation schema,
   - UI metadata (icon, tone, summary template).
2. Replace switch-based resolution with registry lookup.
3. Add deterministic tests for each effect handler.
4. Add integration tests for turn transactions:
   - targeted play,
   - aoe play,
   - challenge start/resolve,
   - drink action,
   - drunkness decay sync.

## Safety and vibe direction

The game should frame "drunkness" as an in-game status meter, not real-world guidance. Keep language playful and fictional, and avoid rewarding harmful real-world behavior. The social fun should come from timing, bluffing, and challenge interaction, not from real consumption pressure.

## Next practical design workshop topics

1. Decide desired match length target (minutes and turns).
2. Define a card budget table by rarity and lane.
3. Mark 10-15 cards for immediate rebalance test.
4. Run two playtest variants:
   - lower mana economy,
   - stronger control/interaction economy.
5. Review telemetry and player sentiment, then lock a v1 balance pass.

