# Games Directory Structure

This directory contains all the games in the Electro Wizards Arena project. The structure is designed to be modular and scalable, making it easy to add new games without affecting existing ones.

## Current Structure

```
games/
├── card-battle/          # Card Battle Arena Game
│   ├── pages/           # Game-specific pages
│   │   └── CardBattleLobby.tsx
│   ├── components/      # Game-specific components
│   ├── hooks/           # Game-specific hooks
│   ├── types/           # Game-specific types
│   └── index.ts         # Module exports
├── tower-defense/       # Tower Defense Game (Coming Soon)
│   └── TowerDefense.tsx
├── racing/              # Racing Game (Coming Soon)
│   └── Racing.tsx
├── puzzle/              # Puzzle Game (Coming Soon)
│   └── Puzzle.tsx
├── index.ts             # Main games exports
└── README.md            # This file
```

## Adding a New Game

To add a new game to the project:

1. **Create the game directory**:
   ```bash
   mkdir src/games/your-game-name
   ```

2. **Create the basic structure**:
   ```bash
   mkdir src/games/your-game-name/pages
   mkdir src/games/your-game-name/components
   mkdir src/games/your-game-name/hooks
   mkdir src/games/your-game-name/types
   ```

3. **Create the main game component**:
   ```typescript
   // src/games/your-game-name/YourGameName.tsx
   import { useNavigate } from 'react-router-dom';
   import { ArrowLeft } from 'lucide-react';
   import { Button } from '../../components/ui/Button';

   export function YourGameName() {
     const navigate = useNavigate();

     return (
       <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-your-color-900">
         {/* Your game content */}
       </div>
     );
   }
   ```

4. **Add to routing**:
   Update `src/App.tsx` to include the new route:
   ```typescript
   import { YourGameName } from './games/your-game-name/YourGameName';
   
   // In the Routes component:
   <Route path="/games/your-game-name" element={<YourGameName />} />
   ```

5. **Add to main menu**:
   Update `src/pages/MainMenu.tsx` to include your game in the games array:
   ```typescript
   {
     id: 'your-game-name',
     name: 'Your Game Name',
     description: 'Description of your game',
     icon: YourIcon,
     status: 'available', // or 'coming-soon'
     path: '/games/your-game-name',
     gradient: 'from-your-color-600 to-another-color-600'
   }
   ```

6. **Export from index files**:
   ```typescript
   // src/games/your-game-name/index.ts
   export { YourGameName } from './YourGameName';
   
   // src/games/index.ts
   export { YourGameName } from './your-game-name/YourGameName';
   ```

## Design Principles

- **Modularity**: Each game is self-contained in its own directory
- **Consistency**: All games follow the same basic structure
- **Scalability**: Easy to add new games without breaking existing ones
- **Separation of Concerns**: Game-specific logic is isolated from shared components
- **Backward Compatibility**: Legacy routes are maintained

## Shared Resources

Games can use shared resources from the main project:
- `src/components/ui/` - UI components
- `src/hooks/` - Shared hooks
- `src/lib/` - Utility functions and Firebase config
- `src/types/` - Global types
- `src/store/` - Global state management

## Current Games

### 1. Card Battle Arena ✅
- **Status**: Available
- **Path**: `/games/card-battle`
- **Description**: Strategic card battles with electrical engineering themes
- **Features**: 
  - Multiplayer lobbies
  - Card themes (Original Party, Electrical Engineering)
  - Real-time gameplay

### 2. Tower Defense 🚧
- **Status**: Coming Soon
- **Path**: `/games/tower-defense`
- **Description**: Defend your base with strategic tower placement

### 3. Racing Game 🚧
- **Status**: Coming Soon
- **Path**: `/games/racing`
- **Description**: High-speed racing with customizable vehicles

### 4. Puzzle Adventure 🚧
- **Status**: Coming Soon
- **Path**: `/games/puzzle`
- **Description**: Mind-bending puzzles and brain teasers

## Contributing

When adding a new game:
1. Follow the established directory structure
2. Use consistent naming conventions
3. Add proper TypeScript types
4. Include error handling
5. Test the integration with the main menu
6. Update this README with your game information 