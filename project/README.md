    project/
    ├── src/
    │   ├── components/                # UI components for the application
    │   │   ├── game/
    │   │   │   ├── GameBoard.tsx      - Main game board UI.
    │   │   │   ├── GameControls.tsx   - Controls for players (e.g., end turn, play card).
    │   │   │   ├── PlayerStats.tsx    - Displays player statistics like health, mana, etc.
    │   │
    │   ├── config/                    # Configuration files for game settings
    │   │   ├── gameConfig.ts          - Configuration settings for the game (e.g., max health, mana).
    │   │
    │   ├── hooks/                     # Custom React hooks for managing specific features
    │   │   ├── usePartyActions.ts     - Manages party-related actions (create, join, leave).
    │   │
    │   ├── pages/                     # Main pages in the application
    │   │   ├── Game.tsx               - Main game logic, including turn management.
    │   │   ├── Home.tsx               - Entry page for the game.
    │   │
    │   ├── store/                     # State management for the game
    │   │   ├── gameStore.ts           - Centralized state management for the game.
    │   │
    │   ├── types/                     # Type definitions for game entities
    │   │   ├── game.ts                - Type definitions for game entities (Party, Player, GameSettings).
    │   │
    │   ├── utils/                     # Utility files for reusable game logic
    │   │   ├── cards.ts               - Utility functions for generating and managing cards.
    │   │   ├── effectManager.ts       - Handles in-game effects like poison, healing.
    │   │   ├── party.ts               - Utility functions for party code generation and management.
    │   │   ├── turnManager.ts         - Utility class for managing game turns.
    │   │
    │   ├── App.tsx                    - Main application entry point.
    │   ├── index.css                  - Global styles for the application.
    │   ├── main.tsx                   - Application initialization and rendering.
    │   ├── vite.config.ts             - Build configuration for Vite.
    │
    ├── firebase.json                  - Firebase configuration for hosting and rules.
    ├── package.json                   - Node.js dependencies and project scripts.
    ├── README.md                      - Documentation for the project.
