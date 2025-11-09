"use client";

import { useState, useEffect, useRef } from "react";
import GameContainer from "./components/GameContainer";
import GameSelection from "./components/GameSelection";
import { getAllGames } from "./games";
import { BaseGame } from "./types/game";
import { usePoseDetection } from "@/app/hooks/usePoseDetection";
import { useCamera } from "@/app/hooks/useCamera";

interface GridCell {
  x: number;
  y: number;
  brightness: number;
}

export default function Home() {
  const [selectedGame, setSelectedGame] = useState<BaseGame | null>(null);
  const games = getAllGames();

  // Hand tracking state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationRef = useRef<number>();
  const [gridCells, setGridCells] = useState<GridCell[][]>([]);

  const { detectPose, isReady: poseReady } = usePoseDetection({ modelType: "lite" });
  const { videoRef: cameraRef, isReady: cameraReady, error: cameraError } = useCamera({
    width: 640,
    height: 480
  });

  const [gridSize, setGridSize] = useState({ cols: 0, rows: 0 });
  const cellSize = 50;
  const maxDistance = 300;

  // Initialize grid cells to fit screen
  useEffect(() => {
    const updateGridSize = () => {
      const cols = Math.ceil(window.innerWidth / cellSize);
      const rows = Math.ceil(window.innerHeight / cellSize);
      setGridSize({ cols, rows });

      const cells: GridCell[][] = [];
      for (let i = 0; i < rows; i++) {
        cells[i] = [];
        for (let j = 0; j < cols; j++) {
          cells[i][j] = {
            x: j * cellSize,
            y: i * cellSize,
            brightness: 0
          };
        }
      }
      setGridCells(cells);
    };

    updateGridSize();
    window.addEventListener('resize', updateGridSize);
    return () => window.removeEventListener('resize', updateGridSize);
  }, []);

  // Get hand landmark positions from pose data (like pinch circles)
  const getHandPositions = (poseData: any) => {
    const handPositions: { x: number; y: number }[] = [];

    if (poseData && poseData.landmarks && poseData.landmarks.length > 0) {
      for (const pose of poseData.landmarks) {
        // Right hand index finger tip (landmark 20)
        const rightIndex = pose[20];
        // Left hand index finger tip (landmark 19)
        const leftIndex = pose[19];

        if (rightIndex) {
          const handX = (1 - rightIndex.x) * window.innerWidth;
          const handY = rightIndex.y * window.innerHeight;
          handPositions.push({ x: handX, y: handY });
        }

        if (leftIndex) {
          const handX = (1 - leftIndex.x) * window.innerWidth;
          const handY = leftIndex.y * window.innerHeight;
          handPositions.push({ x: handX, y: handY });
        }
      }
    }

    return handPositions;
  };

  // Update grid brightness based on hand positions with smooth gradient
  const updateGridBrightness = (handPositions: { x: number; y: number }[]) => {
    setGridCells(prevCells => {
      return prevCells.map((row, i) =>
        row.map((cell, j) => {
          let maxBrightness = 0;

          handPositions.forEach(hand => {
            const cellCenterX = cell.x + cellSize/2;
            const cellCenterY = cell.y + cellSize/2;
            const distance = Math.sqrt(
              Math.pow(hand.x - cellCenterX, 2) +
              Math.pow(hand.y - cellCenterY, 2)
            );

            // Smooth gradient: cells get brighter as hand gets closer
            // Using exponential falloff for smoother gradient
            const normalizedDistance = Math.max(0, 1 - (distance / maxDistance));
            const brightness = Math.pow(normalizedDistance, 2); // Squared for smoother falloff

            maxBrightness = Math.max(maxBrightness, brightness);
          });

          return {
            ...cell,
            brightness: maxBrightness
          };
        })
      );
    });
  };

  // Animation loop - only track real hands
  const animate = () => {
    if (videoRef.current && poseReady && cameraReady && !cameraError) {
      const poseData = detectPose(videoRef.current, performance.now());

      if (poseData) {
        const handPositions = getHandPositions(poseData);
        updateGridBrightness(handPositions);
      }
    }

    animationRef.current = requestAnimationFrame(animate);
  };

  // Start animation when ready
  useEffect(() => {
    if (poseReady && cameraReady && !cameraError) {
      videoRef.current = cameraRef.current;
    }

    // Always start animation
    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [poseReady, cameraReady, cameraError]);

  // Draw grid
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    gridCells.forEach((row, i) => {
      row.forEach((cell, j) => {
        const cellCenterX = cell.x + cellSize/2;
        const cellCenterY = cell.y + cellSize/2;

        // Draw cell with smooth gradient based on brightness
        if (cell.brightness > 0.01) {
          const gradient = ctx.createRadialGradient(
            cellCenterX, cellCenterY, 0,
            cellCenterX, cellCenterY, cellSize * 0.8
          );

          const intensity = cell.brightness;
          gradient.addColorStop(0, `rgba(255, 255, 255, ${intensity})`);
          gradient.addColorStop(0.3, `rgba(220, 220, 255, ${intensity * 0.7})`);
          gradient.addColorStop(0.6, `rgba(150, 150, 255, ${intensity * 0.4})`);
          gradient.addColorStop(1, `rgba(100, 100, 255, ${intensity * 0.1})`);

          ctx.fillStyle = gradient;
          ctx.fillRect(cell.x, cell.y, cellSize, cellSize);
        }

        // Always draw grid lines, but make them brighter based on proximity
        const lineOpacity = 0.1 + (cell.brightness * 0.6);
        ctx.strokeStyle = `rgba(255, 255, 255, ${lineOpacity})`;
        ctx.lineWidth = cell.brightness > 0.01 ? 1.5 : 1;
        ctx.strokeRect(cell.x, cell.y, cellSize, cellSize);
      });
    });
  }, [gridCells]);

  const handleBackToMenu = () => {
    setSelectedGame(null);
  };

  const handleSelectGame = (game: BaseGame) => {
    setSelectedGame(game);
  };

  return (
    <div className="flex min-h-screen items-center justify-center font-sans relative bg-black overflow-hidden">
      <canvas
        ref={canvasRef}
        width={gridSize.cols * cellSize}
        height={gridSize.rows * cellSize}
        className="absolute top-0 left-0 z-0"
      />
      <video
        ref={cameraRef}
        className="hidden"
        playsInline
        muted
      />
      <main className="flex min-h-screen w-full flex-col items-center py-8 px-4 relative z-10">
        {selectedGame ? (
          <div className="w-full flex flex-col items-center gap-4">
            <button
              onClick={handleBackToMenu}
              className="self-start px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors border border-zinc-600"
            >
              ← Back to Menu
            </button>
            <GameContainer game={selectedGame} />
          </div>
        ) : (
          <GameSelection games={games} onSelectGame={handleSelectGame} />
        )}
      </main>
    </div>
  );
}
