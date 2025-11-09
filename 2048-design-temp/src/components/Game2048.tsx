import { useEffect, useState, useCallback } from 'react';
import { Button } from './ui/button';
import { RotateCcw, Hand, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

type Grid = (number | null)[][];

const GRID_SIZE = 4;

// Color mapping for different tile values - Cyan/Purple Synthwave Arcade style
const getTileColor = (value: number | null): string => {
  if (!value) return 'bg-[#1a1a2e]/40 border-2 border-[#a855f7]/30';
  
  const colors: { [key: number]: string } = {
    2: 'bg-gradient-to-br from-[#06b6d4] to-[#22d3ee] text-white shadow-[0_0_20px_rgba(168,85,247,0.6)] border-2 border-[#a855f7]/50',
    4: 'bg-gradient-to-br from-[#22d3ee] to-[#67e8f9] text-white shadow-[0_0_20px_rgba(168,85,247,0.6)] border-2 border-[#a855f7]/50',
    8: 'bg-gradient-to-br from-[#0891b2] to-[#06b6d4] text-white shadow-[0_0_25px_rgba(168,85,247,0.7)] border-2 border-[#a855f7]/60',
    16: 'bg-gradient-to-br from-[#0e7490] to-[#0891b2] text-white shadow-[0_0_25px_rgba(168,85,247,0.7)] border-2 border-[#a855f7]/60',
    32: 'bg-gradient-to-br from-[#22d3ee] to-[#a855f7] text-white shadow-[0_0_30px_rgba(168,85,247,0.8)] border-2 border-[#a855f7]/70',
    64: 'bg-gradient-to-br from-[#67e8f9] to-[#c084fc] text-white shadow-[0_0_30px_rgba(168,85,247,0.8)] border-2 border-[#a855f7]/70',
    128: 'bg-gradient-to-br from-[#06b6d4] to-[#8b5cf6] text-white shadow-[0_0_35px_rgba(168,85,247,0.9)] border-2 border-[#a855f7]/80',
    256: 'bg-gradient-to-br from-[#0891b2] to-[#a855f7] text-white shadow-[0_0_35px_rgba(168,85,247,0.9)] border-2 border-[#a855f7]/80',
    512: 'bg-gradient-to-br from-[#22d3ee] to-[#7c3aed] text-white shadow-[0_0_40px_rgba(168,85,247,1)] border-2 border-[#a855f7]/90',
    1024: 'bg-gradient-to-br from-[#06b6d4] to-[#9333ea] text-white shadow-[0_0_40px_rgba(168,85,247,1)] border-2 border-[#a855f7]/90',
    2048: 'bg-gradient-to-br from-[#00f0ff] to-[#a855f7] text-white shadow-[0_0_50px_rgba(168,85,247,1)] border-2 border-[#a855f7]',
  };
  
  return colors[value] || 'bg-gradient-to-br from-[#06b6d4] to-[#a855f7] text-white shadow-[0_0_20px_rgba(168,85,247,0.6)] border-2 border-[#a855f7]/50';
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
    // Filter out nulls and compress
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
    
    // Fill the rest with nulls
    while (merged.length < GRID_SIZE) {
      merged.push(null);
    }
    
    // Check if anything moved
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
    case 'left':
      rotations = 0;
      break;
    case 'up':
      rotations = 1;
      break;
    case 'right':
      rotations = 2;
      break;
    case 'down':
      rotations = 3;
      break;
  }
  
  // Rotate to make it a left move
  for (let i = 0; i < rotations; i++) {
    currentGrid = rotateGrid(currentGrid);
  }
  
  const result = moveLeft(currentGrid);
  
  // Rotate back
  for (let i = 0; i < (4 - rotations) % 4; i++) {
    result.grid = rotateGrid(result.grid);
  }
  
  return result;
};

const canMove = (grid: Grid): boolean => {
  // Check for empty cells
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] === null) return true;
    }
  }
  
  // Check for possible merges
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const current = grid[row][col];
      if (col < GRID_SIZE - 1 && current === grid[row][col + 1]) return true;
      if (row < GRID_SIZE - 1 && current === grid[row + 1][col]) return true;
    }
  }
  
  return false;
};

export function Game2048() {
  const [grid, setGrid] = useState<Grid>(initializeGrid);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const handleMove = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    if (gameOver) return;
    
    const result = move(grid, direction);
    
    if (result.moved) {
      let newGrid = addRandomTile(result.grid);
      setGrid(newGrid);
      setScore(prev => prev + result.scoreGained);
      
      // Check for 2048 tile
      if (!won) {
        for (let row = 0; row < GRID_SIZE; row++) {
          for (let col = 0; col < GRID_SIZE; col++) {
            if (newGrid[row][col] === 2048) {
              setWon(true);
              break;
            }
          }
        }
      }
      
      // Check if game over
      if (!canMove(newGrid)) {
        setGameOver(true);
      }
    }
  }, [grid, gameOver, won]);

  const resetGame = () => {
    setGrid(initializeGrid());
    setScore(0);
    setGameOver(false);
    setWon(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        
        switch (e.key) {
          case 'ArrowLeft':
            handleMove('left');
            break;
          case 'ArrowRight':
            handleMove('right');
            break;
          case 'ArrowUp':
            handleMove('up');
            break;
          case 'ArrowDown':
            handleMove('down');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove]);

  return (
    <div className="flex items-center justify-center gap-12 p-8">
      {/* Left Side Controls */}
      <div className="flex flex-col gap-8">
        {/* Header with title */}
        <div className="flex flex-col gap-6">
          <h1 
            className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#22d3ee] drop-shadow-[0_0_30px_rgba(0,240,255,0.8)]"
            style={{ fontSize: '56px', fontWeight: '900', letterSpacing: '2px' }}
          >
            2048
          </h1>
          <Button 
            onClick={resetGame} 
            className="gap-2 bg-gradient-to-br from-[#06b6d4] to-[#22d3ee] hover:from-[#0891b2] hover:to-[#06b6d4] text-white border-2 border-[#a855f7]/50 shadow-[0_0_20px_rgba(168,85,247,0.6)] uppercase tracking-wider w-full"
            size="lg"
          >
            <RotateCcw className="w-5 h-5" />
            New Game
          </Button>
        </div>

        {/* Hand Gesture Instructions */}
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-2 border-[#a855f7]/50 text-white p-5 rounded-xl w-[300px] shadow-[0_0_25px_rgba(168,85,247,0.4)]">
          <div className="flex items-center gap-2 mb-4">
            <Hand className="w-5 h-5 text-[#22d3ee]" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#22d3ee] uppercase tracking-wider">Controls</span>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 bg-[#1a1a2e]/60 border-2 border-[#a855f7]/40 p-3 rounded backdrop-blur-sm shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <ArrowUp className="w-5 h-5 text-[#22d3ee]" />
              <span className="text-[#22d3ee] uppercase tracking-wide">Swipe Up</span>
            </div>
            <div className="flex items-center gap-2 bg-[#1a1a2e]/60 border-2 border-[#a855f7]/40 p-3 rounded backdrop-blur-sm shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <ArrowDown className="w-5 h-5 text-[#22d3ee]" />
              <span className="text-[#22d3ee] uppercase tracking-wide">Swipe Down</span>
            </div>
            <div className="flex items-center gap-2 bg-[#1a1a2e]/60 border-2 border-[#a855f7]/40 p-3 rounded backdrop-blur-sm shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <ArrowLeft className="w-5 h-5 text-[#22d3ee]" />
              <span className="text-[#22d3ee] uppercase tracking-wide">Swipe Left</span>
            </div>
            <div className="flex items-center gap-2 bg-[#1a1a2e]/60 border-2 border-[#a855f7]/40 p-3 rounded backdrop-blur-sm shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <ArrowRight className="w-5 h-5 text-[#22d3ee]" />
              <span className="text-[#22d3ee] uppercase tracking-wide">Swipe Right</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-[#22d3ee]/70 text-center max-w-[300px] uppercase tracking-wide text-[12px]">
          <p>Use hand gestures to swipe in any direction. When two tiles with the same number touch, they merge into one!</p>
        </div>
      </div>

      {/* Right Side - Score and Board */}
      <div className="flex flex-col gap-6">
        {/* Score */}
        <div className="flex flex-col gap-2 items-center">
          <div className="text-[#22d3ee]/70 uppercase tracking-wider text-[12px]">Score</div>
          <div 
            className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#22d3ee] drop-shadow-[0_0_15px_rgba(0,240,255,0.6)]" 
            style={{ fontSize: '48px', fontWeight: '900', lineHeight: '1' }}
          >
            {score}
          </div>
        </div>

        {/* Game Board */}
        <div className="relative">
        <div 
          className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-4 rounded-2xl shadow-[0_0_40px_rgba(168,85,247,0.5)] border-2 border-[#a855f7]/50"
          style={{ width: '520px', height: '520px' }}
        >
          <div className="grid grid-cols-4 gap-4">
            {grid.map((row, rowIndex) => (
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`
                    ${getTileColor(cell)}
                    rounded-lg flex items-center justify-center
                    transition-all duration-200
                  `}
                  style={{ width: '110px', height: '110px' }}
                >
                  {cell && (
                    <span 
                      className={`
                        ${cell >= 1000 ? 'text-[40px]' : cell >= 100 ? 'text-[48px]' : 'text-[56px]'}
                      `}
                      style={{ fontWeight: '900', letterSpacing: '1px' }}
                    >
                      {cell}
                    </span>
                  )}
                </div>
              ))
            ))}
          </div>
        </div>

        {/* Game Over / Won Overlay */}
        {(gameOver || won) && (
          <div className="absolute inset-0 bg-[#0f0f1e]/95 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-[#a855f7]/60 shadow-[0_0_40px_rgba(168,85,247,0.8)]">
            <div className="text-center">
              <h2 
                className="mb-6 text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#22d3ee] text-[64px] drop-shadow-[0_0_30px_rgba(0,240,255,0.8)]"
                style={{ fontWeight: '900', letterSpacing: '2px' }}
              >
                {won ? 'YOU WON!' : 'GAME OVER!'}
              </h2>
              <Button 
                onClick={resetGame} 
                size="lg"
                className="bg-gradient-to-br from-[#06b6d4] to-[#22d3ee] hover:from-[#0891b2] hover:to-[#06b6d4] text-white border-2 border-[#a855f7]/50 shadow-[0_0_25px_rgba(168,85,247,0.6)] uppercase tracking-wider"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
