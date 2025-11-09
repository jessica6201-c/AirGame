# Game Framework Documentation

## Overview

This framework allows you to easily create games built on top of MediaPipe pose detection. Games receive real-time pose data and can render their own game logic on a canvas.

## Architecture

```
app/
├── types/
│   └── game.ts          # Core game interfaces
├── hooks/
│   ├── usePoseDetection.ts  # MediaPipe pose detection hook
│   └── useCamera.ts         # Camera access hook
├── components/
│   └── GameContainer.tsx    # Game runner component
└── games/
    ├── index.ts             # Game registry
    ├── poseVisualizer.ts    # Example: Pose visualization
    └── fruitNinja.ts        # Example: Fruit Ninja template
```

## Creating a New Game

### 1. Define Your Game

Create a new file in `app/games/yourGame.ts`:

```typescript
import { BaseGame, GameContext, PoseData } from "@/app/types/game";

export const yourGame: BaseGame = {
  metadata: {
    id: "your-game",
    name: "Your Game Name",
    description: "Game description",
    splashArt: "/images/your-game-splash.png" // Optional
  },

  onInit: (context: GameContext) => {
    // Initialize game state, load assets, etc.
  },

  onFrame: (context: GameContext, poseData: PoseData | null) => {
    const { ctx, canvas } = context;

    // Update game logic
    // Draw game graphics

    if (poseData && poseData.landmarks.length > 0) {
      // Access pose landmarks
      const firstPose = poseData.landmarks[0];
      // Use landmark data for game interactions
    }
  },

  onCleanup: () => {
    // Clean up resources, intervals, etc.
  }
};
```

### 2. Register Your Game

Add it to `app/games/index.ts`:

```typescript
import { yourGame } from "./yourGame";

export const GAMES: GameRegistry = {
  "your-game": yourGame,
  // ... other games
};
```

### 3. Use Your Game

```typescript
import GameContainer from "./components/GameContainer";
import { yourGame } from "./games/yourGame";

<GameContainer game={yourGame} />
```

## Key Interfaces

### GameContext

Provided to your game on each frame:

```typescript
interface GameContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  videoWidth: number;
  videoHeight: number;
}
```

### PoseData

Pose detection results:

```typescript
interface PoseData {
  landmarks: NormalizedLandmark[][];  // Array of poses, each with 33 landmarks
  worldLandmarks?: NormalizedLandmark[][];
  timestamp: number;
}
```

### Pose Landmarks

Each pose has 33 landmarks (indices 0-32):
- 0-10: Face (nose, eyes, ears, mouth)
- 11-12: Shoulders
- 13-14: Elbows
- 15-16: Wrists
- 17-22: Hands (pinky, index, thumb)
- 23-24: Hips
- 25-26: Knees
- 27-28: Ankles
- 29-32: Feet

Each landmark has:
```typescript
{
  x: number;  // Normalized [0-1]
  y: number;  // Normalized [0-1]
  z: number;  // Depth
  visibility?: number;
}
```

## Game Lifecycle

1. **onInit**: Called once when game starts
   - Set up game state
   - Load assets
   - Initialize game objects

2. **onFrame**: Called every video frame (~30-60 FPS)
   - Update game logic
   - Process pose data
   - Render graphics

3. **onCleanup**: Called when game ends
   - Clear intervals/timeouts
   - Reset state
   - Free resources

## Future: Game Selection Screen

When implementing a game selection screen:

```typescript
// Each game has metadata
game.metadata = {
  id: "fruit-ninja",
  name: "Fruit Ninja",
  description: "Slice fruits with your hands!",
  thumbnail: "/thumbnails/fruit-ninja.png",
  splashArt: "/splash/fruit-ninja.png"
}

// Display all games
import { getAllGames } from "@/app/games";

const games = getAllGames();
games.map(game => (
  <GameCard
    key={game.metadata.id}
    metadata={game.metadata}
    onClick={() => selectGame(game)}
  />
));
```

## Examples

See:
- `app/games/poseVisualizer.ts` - Simple pose visualization
- `app/games/fruitNinja.ts` - Game template with state management
