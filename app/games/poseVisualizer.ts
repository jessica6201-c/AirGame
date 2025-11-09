import { BaseGame, GameContext, PoseData } from "@/app/types/game";

type Grid = (number | null)[][];

const GRID_SIZE = 4;

interface GameState {
  grid: Grid;
  score: number;
  gameOver: boolean;
  won: boolean;
  lastSwipeTime: number;
  swipeDirection: 'left' | 'right' | 'up' | 'down' | null;
  lastWristPos: { x: number; y: number } | null;
  keyboardHandler: ((e: KeyboardEvent) => void) | null;
  trail: { x: number; y: number; time: number }[];
}

const state: GameState = {
  grid: [],
  score: 0,
  gameOver: false,
  won: false,
  lastSwipeTime: 0,
  swipeDirection: null,
  lastWristPos: null,
  keyboardHandler: null,
  trail: []
};

// Color mapping for tiles - Cyan/Purple Synthwave style
const getTileColor = (value: number | null): { bg: string; shadow: string } => {
  if (!value) return { bg: '#1a1a2e', shadow: 'rgba(168, 85, 247, 0.3)' };

  const colors: { [key: number]: { bg: string; shadow: string } } = {
    2: { bg: '#06b6d4', shadow: 'rgba(6, 182, 212, 0.8)' },
    4: { bg: '#22d3ee', shadow: 'rgba(34, 211, 238, 0.8)' },
    8: { bg: '#0891b2', shadow: 'rgba(8, 145, 178, 0.8)' },
    16: { bg: '#0e7490', shadow: 'rgba(14, 116, 144, 0.8)' },
    32: { bg: '#22d3ee', shadow: 'rgba(34, 211, 238, 0.8)' },
    64: { bg: '#67e8f9', shadow: 'rgba(103, 232, 249, 0.8)' },
    128: { bg: '#06b6d4', shadow: 'rgba(6, 182, 212, 0.9)' },
    256: { bg: '#0891b2', shadow: 'rgba(8, 145, 178, 0.9)' },
    512: { bg: '#22d3ee', shadow: 'rgba(34, 211, 238, 0.9)' },
    1024: { bg: '#06b6d4', shadow: 'rgba(6, 182, 212, 1)' },
    2048: { bg: '#00f0ff', shadow: 'rgba(0, 240, 255, 1)' },
  };

  return colors[value] || { bg: '#06b6d4', shadow: 'rgba(6, 182, 212, 0.6)' };
};

const createEmptyGrid = (): Grid => {
  return Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
};

const addRandomTile = (grid: Grid): Grid => {
  const emptyCells: [number, number][] = [];

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] === null) {
        emptyCells.push([row, col]);
      }
    }
  }

  if (emptyCells.length === 0) return grid;

  const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const newGrid = grid.map(r => [...r]);
  newGrid[row][col] = Math.random() < 0.9 ? 2 : 4;

  return newGrid;
};

const initializeGrid = (): Grid => {
  let grid = createEmptyGrid();
  grid = addRandomTile(grid);
  grid = addRandomTile(grid);
  return grid;
};

const moveLeft = (grid: Grid): { grid: Grid; moved: boolean; scoreGained: number } => {
  let moved = false;
  let scoreGained = 0;
  const newGrid = grid.map(row => {
    const filtered = row.filter(cell => cell !== null) as number[];
    const merged: (number | null)[] = [];

    let i = 0;
    while (i < filtered.length) {
      if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
        const mergedValue = filtered[i] * 2;
        merged.push(mergedValue);
        scoreGained += mergedValue;
        i += 2;
        moved = true;
      } else {
        merged.push(filtered[i]);
        i++;
      }
    }

    while (merged.length < GRID_SIZE) {
      merged.push(null);
    }

    if (!moved) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (row[j] !== merged[j]) {
          moved = true;
          break;
        }
      }
    }

    return merged;
  });

  return { grid: newGrid, moved, scoreGained };
};

const rotateGrid = (grid: Grid): Grid => {
  const newGrid = createEmptyGrid();
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      newGrid[col][GRID_SIZE - 1 - row] = grid[row][col];
    }
  }
  return newGrid;
};

const move = (grid: Grid, direction: 'left' | 'right' | 'up' | 'down'): { grid: Grid; moved: boolean; scoreGained: number } => {
  let rotations = 0;
  let currentGrid = grid;

  switch (direction) {
    case 'left': rotations = 0; break;
    case 'up': rotations = 1; break;
    case 'right': rotations = 2; break;
    case 'down': rotations = 3; break;
  }

  for (let i = 0; i < rotations; i++) {
    currentGrid = rotateGrid(currentGrid);
  }

  const result = moveLeft(currentGrid);

  for (let i = 0; i < (4 - rotations) % 4; i++) {
    result.grid = rotateGrid(result.grid);
  }

  return result;
};

const canMove = (grid: Grid): boolean => {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] === null) return true;
    }
  }

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const current = grid[row][col];
      if (col < GRID_SIZE - 1 && current === grid[row][col + 1]) return true;
      if (row < GRID_SIZE - 1 && current === grid[row + 1][col]) return true;
    }
  }

  return false;
};

const detectSwipe = (poseData: PoseData | null): 'left' | 'right' | 'up' | 'down' | null => {
  if (!poseData || poseData.landmarks.length === 0) {
    state.lastWristPos = null;
    return null;
  }

  const firstPose = poseData.landmarks[0];
  const rightWrist = firstPose[16];

  if (!rightWrist) {
    state.lastWristPos = null;
    return null;
  }

  const currentPos = { x: rightWrist.x, y: rightWrist.y };

  // Add to trail for visual feedback
  const now = performance.now();
  state.trail.push({ x: currentPos.x, y: currentPos.y, time: now });

  // Keep only recent trail points (last 300ms)
  state.trail = state.trail.filter(point => now - point.time < 300);

  // If we don't have a previous position, store current and return
  if (!state.lastWristPos) {
    state.lastWristPos = currentPos;
    return null;
  }

  // Calculate movement delta
  const dx = currentPos.x - state.lastWristPos.x;
  const dy = currentPos.y - state.lastWristPos.y;

  const threshold = 0.06; // Even more sensitive threshold for fluid movement

  let direction: 'left' | 'right' | 'up' | 'down' | null = null;

  // Detect dominant direction
  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal movement (note: x is flipped for camera)
    if (dx > threshold) direction = 'right'; // Moving hand right = swipe right
    else if (dx < -threshold) direction = 'left'; // Moving hand left = swipe left
  } else {
    // Vertical movement
    if (dy > threshold) direction = 'down';
    else if (dy < -threshold) direction = 'up';
  }

  // Update last position
  state.lastWristPos = currentPos;

  return direction;
};

export const poseVisualizerGame: BaseGame = {
  metadata: {
    id: "pose-visualizer",
    name: "2048",
    description: "Real-time Detection",
    splashArt: "/2048-stockimg.png"
  },

  onInit: (context: GameContext) => {
    state.grid = initializeGrid();
    state.score = 0;
    state.gameOver = false;
    state.won = false;
    state.lastSwipeTime = 0;
    state.swipeDirection = null;
    state.lastWristPos = null;
    state.trail = [];

    // Add keyboard controls
    state.keyboardHandler = (e: KeyboardEvent) => {
      if (state.gameOver && !state.won) return;

      let direction: 'left' | 'right' | 'up' | 'down' | null = null;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          direction = 'left';
          e.preventDefault();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          direction = 'right';
          e.preventDefault();
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          direction = 'up';
          e.preventDefault();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          direction = 'down';
          e.preventDefault();
          break;
        case 'r':
        case 'R':
          // Restart game
          state.grid = initializeGrid();
          state.score = 0;
          state.gameOver = false;
          state.won = false;
          state.lastSwipeTime = 0;
          state.trail = [];
          e.preventDefault();
          return;
      }

      if (direction) {
        const result = move(state.grid, direction);
        if (result.moved) {
          state.grid = addRandomTile(result.grid);
          state.score += result.scoreGained;

          // Check for 2048
          if (!state.won) {
            for (let row = 0; row < GRID_SIZE; row++) {
              for (let col = 0; col < GRID_SIZE; col++) {
                if (state.grid[row][col] === 2048) {
                  state.won = true;
                }
              }
            }
          }

          if (!canMove(state.grid)) {
            state.gameOver = true;
          }
        }
      }
    };

    window.addEventListener('keydown', state.keyboardHandler);
    console.log("2048 Game initialized - Use arrow keys, WASD, or hand gestures!");
  },

  onFrame: (context: GameContext, poseData: PoseData | null) => {
    const { ctx, canvas } = context;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dark background with gradient
    const gradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2);
    gradient.addColorStop(0, '#1a1a3e');
    gradient.addColorStop(1, '#0f0f1e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Detect swipe gesture
    const currentTime = performance.now();
    if (currentTime - state.lastSwipeTime > 250) { // Reduced cooldown for fluid movement
      const swipe = detectSwipe(poseData);
      if (swipe) {
        state.swipeDirection = swipe;
        state.lastSwipeTime = currentTime;

        if (!state.gameOver) {
          const result = move(state.grid, swipe);
          if (result.moved) {
            state.grid = addRandomTile(result.grid);
            state.score += result.scoreGained;

            if (!state.won) {
              for (let row = 0; row < GRID_SIZE; row++) {
                for (let col = 0; col < GRID_SIZE; col++) {
                  if (state.grid[row][col] === 2048) {
                    state.won = true;
                  }
                }
              }
            }

            if (!canMove(state.grid)) {
              state.gameOver = true;
            }
          }
        }
      }
    }

    // Draw visual feedback for hand tracking
    if (poseData && poseData.landmarks && poseData.landmarks.length > 0) {
      const firstPose = poseData.landmarks[0];
      const rightWrist = firstPose[16];

      if (rightWrist) {
        const wristX = (1 - rightWrist.x) * canvas.width;
        const wristY = rightWrist.y * canvas.height;

        // Draw motion trail
        if (state.trail.length > 1) {
          for (let i = 0; i < state.trail.length - 1; i++) {
            const point = state.trail[i];
            const age = currentTime - point.time;
            const opacity = Math.max(0, 1 - (age / 300)); // Fade out over 300ms, ensure non-negative
            const size = Math.max(1, 8 + (opacity * 12)); // Shrink as it fades, ensure positive

            // Skip if too faded
            if (opacity <= 0 || size <= 0) continue;

            const trailX = (1 - point.x) * canvas.width;
            const trailY = point.y * canvas.height;

            ctx.fillStyle = `rgba(0, 240, 255, ${opacity * 0.4})`;
            ctx.shadowColor = `rgba(0, 240, 255, ${opacity * 0.6})`;
            ctx.shadowBlur = size * 2;
            ctx.beginPath();
            ctx.arc(trailX, trailY, size, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.shadowBlur = 0;
        }

        // Draw main hand cursor (larger and more visible)
        // Outer glow
        ctx.fillStyle = "rgba(0, 240, 255, 0.3)";
        ctx.shadowColor = "rgba(0, 240, 255, 1)";
        ctx.shadowBlur = 40;
        ctx.beginPath();
        ctx.arc(wristX, wristY, 35, 0, Math.PI * 2);
        ctx.fill();

        // Middle layer
        ctx.fillStyle = "rgba(0, 240, 255, 0.6)";
        ctx.shadowBlur = 25;
        ctx.beginPath();
        ctx.arc(wristX, wristY, 25, 0, Math.PI * 2);
        ctx.fill();

        // Inner core
        ctx.fillStyle = "#00f0ff";
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(wristX, wristY, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw direction indicator if moving (larger and more visible)
        if (state.swipeDirection && currentTime - state.lastSwipeTime < 300) {
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 48px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.shadowColor = "rgba(0, 240, 255, 1)";
          ctx.shadowBlur = 20;
          const arrow = state.swipeDirection === 'up' ? '↑' :
                       state.swipeDirection === 'down' ? '↓' :
                       state.swipeDirection === 'left' ? '←' : '→';
          ctx.fillText(arrow, wristX, wristY - 60);
          ctx.shadowBlur = 0;
        }
      }
    }

    // Layout dimensions - centered
    const sidebarWidth = 330;
    const boardSize = 560;
    const gapBetween = 120;
    const totalWidth = sidebarWidth + gapBetween + boardSize;
    const startX = (canvas.width - totalWidth) / 2;
    const sidebarX = startX;
    const sidebarY = 100;

    // Draw title "2048"
    ctx.font = "900 56px 'Orbitron', Arial";
    ctx.fillStyle = "#00f0ff";
    ctx.shadowColor = "rgba(0, 240, 255, 0.8)";
    ctx.shadowBlur = 40;
    ctx.textAlign = "left";
    ctx.letterSpacing = "2px";
    ctx.fillText("2048", sidebarX, sidebarY + 60);
    ctx.shadowBlur = 0;
    ctx.letterSpacing = "0px";

    // Draw "NEW GAME" button
    const buttonY = sidebarY + 100;
    ctx.fillStyle = "#00f0ff";
    ctx.shadowColor = "rgba(0, 240, 255, 0.6)";
    ctx.shadowBlur = 25;
    roundRect(ctx, sidebarX, buttonY, sidebarWidth, 50, 12, true, false);
    ctx.shadowBlur = 0;

    ctx.font = "700 16px 'Orbitron', Arial";
    ctx.fillStyle = "#0f0f1e";
    ctx.textAlign = "center";
    ctx.letterSpacing = "2px";
    ctx.fillText("↻ NEW GAME", sidebarX + sidebarWidth / 2, buttonY + 32);
    ctx.letterSpacing = "0px";

    // Draw "CONTROLS" section
    const controlsY = buttonY + 80;

    // Subtle background fill
    ctx.fillStyle = "#1a1a2e40";
    roundRect(ctx, sidebarX, controlsY, sidebarWidth, 380, 15, true, false);

    // Purple border
    ctx.strokeStyle = "#a855f7";
    ctx.lineWidth = 2;
    roundRect(ctx, sidebarX, controlsY, sidebarWidth, 380, 15, false, true);

    // Draw hand icon (blue transparent)
    ctx.font = "24px Arial";
    ctx.fillStyle = "#22d3ee80";
    ctx.textAlign = "left";
    ctx.fillText("✋", sidebarX + 25, controlsY + 42);

    // Draw CONTROLS text
    ctx.font = "700 16px 'Orbitron', Arial";
    ctx.fillStyle = "#22d3ee";
    ctx.letterSpacing = "2px";
    ctx.fillText("CONTROLS", sidebarX + 60, controlsY + 40);
    ctx.letterSpacing = "0px";

    // Control instructions
    const controls = [
      { icon: "↑", text: "SWIPE UP", y: controlsY + 80 },
      { icon: "↓", text: "SWIPE DOWN", y: controlsY + 150 },
      { icon: "←", text: "SWIPE LEFT", y: controlsY + 220 },
      { icon: "→", text: "SWIPE RIGHT", y: controlsY + 290 }
    ];

    controls.forEach(control => {
      // Fill with dark background
      ctx.fillStyle = "#1a1a2e";
      roundRect(ctx, sidebarX + 25, control.y, sidebarWidth - 50, 55, 8, true, false);

      // Purple border
      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 2;
      roundRect(ctx, sidebarX + 25, control.y, sidebarWidth - 50, 55, 8, false, true);

      // Draw arrow icon (bigger)
      ctx.font = "700 24px 'Orbitron', Arial";
      ctx.fillStyle = "#22d3ee";
      ctx.textAlign = "left";
      ctx.letterSpacing = "2px";
      ctx.fillText(control.icon, sidebarX + 40, control.y + 37);

      // Draw text (closer to arrow)
      ctx.font = "700 16px 'Orbitron', Arial";
      ctx.fillText(control.text, sidebarX + 75, control.y + 35);
      ctx.letterSpacing = "0px";
    });

    // Instructions text
    const instructY = controlsY + 400;
    ctx.font = "400 10px 'Orbitron', Arial";
    ctx.fillStyle = "#22d3ee99";
    ctx.textAlign = "center";
    ctx.letterSpacing = "0.5px";
    const lines = [
      "USE HAND GESTURES TO SWIPE IN ANY",
      "DIRECTION. WHEN TWO TILES WITH THE",
      "SAME NUMBER TOUCH, THEY MERGE INTO",
      "ONE!"
    ];
    lines.forEach((line, i) => {
      ctx.fillText(line, sidebarX + sidebarWidth / 2, instructY + i * 17);
    });
    ctx.letterSpacing = "0px";

    // Game board on the right - closer to sidebar
    const boardX = sidebarX + sidebarWidth + gapBetween;
    const boardY = sidebarY;

    // Draw score above board
    ctx.font = "700 12px 'Orbitron', Arial";
    ctx.fillStyle = "#22d3ee99";
    ctx.textAlign = "center";
    ctx.letterSpacing = "2px";
    ctx.fillText("SCORE", boardX + boardSize / 2, boardY + 15);
    ctx.letterSpacing = "0px";

    ctx.font = "900 48px 'Orbitron', Arial";
    ctx.fillStyle = "#00f0ff";
    ctx.shadowColor = "rgba(0, 240, 255, 0.8)";
    ctx.shadowBlur = 30;
    ctx.letterSpacing = "1px";
    ctx.fillText(state.score.toString(), boardX + boardSize / 2, boardY + 70);
    ctx.shadowBlur = 0;
    ctx.letterSpacing = "0px";

    // Draw board background
    const gameboardY = boardY + 110;
    ctx.fillStyle = "#1a1a2e";
    ctx.strokeStyle = "#a855f7";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(168, 85, 247, 0.5)";
    ctx.shadowBlur = 40;
    roundRect(ctx, boardX, gameboardY, boardSize, boardSize, 16, true, true);
    ctx.shadowBlur = 0;

    // Draw tiles with equal padding
    const gap = 16;
    const gridPadding = 16;
    // Calculate cell size: (boardSize - 2*padding - 3*gap) / 4
    const cellSize = (boardSize - 2 * gridPadding - 3 * gap) / 4;

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const value = state.grid[row][col];
        const x = boardX + gridPadding + col * (cellSize + gap);
        const y = gameboardY + gridPadding + row * (cellSize + gap);

        const colors = getTileColor(value);

        ctx.fillStyle = colors.bg;
        if (value) {
          ctx.shadowColor = colors.shadow;
          ctx.shadowBlur = 20;
        } else {
          ctx.shadowBlur = 0;
        }

        roundRect(ctx, x, y, cellSize, cellSize, 10, true, false);
        ctx.shadowBlur = 0;

        // Draw tile border
        ctx.strokeStyle = "#a855f780";
        ctx.lineWidth = 2;
        roundRect(ctx, x, y, cellSize, cellSize, 10, false, true);

        // Draw value
        if (value) {
          ctx.fillStyle = "#ffffff";
          ctx.font = value >= 1000 ? "900 36px 'Orbitron', Arial" : value >= 100 ? "900 44px 'Orbitron', Arial" : "900 52px 'Orbitron', Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.letterSpacing = "1px";
          ctx.fillText(value.toString(), x + cellSize / 2, y + cellSize / 2);
          ctx.letterSpacing = "0px";
        }
      }
    }

    // Draw game over/won overlay
    if (state.gameOver || state.won) {
      ctx.fillStyle = "rgba(15, 15, 30, 0.95)";
      roundRect(ctx, boardX, gameboardY, boardSize, boardSize, 16, true, false);

      ctx.font = "900 64px 'Orbitron', Arial";
      ctx.fillStyle = "#00f0ff";
      ctx.shadowColor = "rgba(0, 240, 255, 0.8)";
      ctx.shadowBlur = 40;
      ctx.textAlign = "center";
      ctx.letterSpacing = "2px";
      ctx.fillText(state.won ? "YOU WON!" : "GAME OVER!", boardX + boardSize / 2, gameboardY + boardSize / 2 - 30);
      ctx.shadowBlur = 0;
      ctx.letterSpacing = "0px";

      ctx.font = "400 18px 'Orbitron', Arial";
      ctx.fillStyle = "#22d3ee";
      ctx.fillText("Press R to restart", boardX + boardSize / 2, gameboardY + boardSize / 2 + 40);
    }
  },

  onCleanup: () => {
    // Remove keyboard event listener
    if (state.keyboardHandler) {
      window.removeEventListener('keydown', state.keyboardHandler);
      state.keyboardHandler = null;
    }

    state.grid = [];
    state.score = 0;
    state.gameOver = false;
    state.won = false;
    state.lastWristPos = null;
    state.trail = [];
    console.log("2048 Game cleanup");
  }
};

// Helper function to draw rounded rectangles
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: boolean,
  stroke: boolean
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}
