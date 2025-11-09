"use client";

import { useEffect, useRef } from "react";
import { BaseGame, GameContext } from "@/app/types/game";
import { usePoseDetection } from "@/app/hooks/usePoseDetection";
import { useCamera } from "@/app/hooks/useCamera";

interface GameContainerProps {
  game: BaseGame;
}

export default function GameContainer({ game }: GameContainerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastVideoTimeRef = useRef(-1);
  const gameInitializedRef = useRef(false);

  const { videoRef, isReady: cameraReady, error: cameraError } = useCamera();
  const { detectPose, isReady: poseReady, error: poseError } = usePoseDetection();

  const error = cameraError || poseError;
  const isReady = cameraReady && poseReady;

  // Initialize game
  useEffect(() => {
    if (!isReady || !canvasRef.current || !videoRef.current || gameInitializedRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context: GameContext = {
      canvas,
      ctx,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight
    };

    // Call game initialization
    game.onInit?.(context);
    gameInitializedRef.current = true;

    return () => {
      game.onCleanup?.();
      gameInitializedRef.current = false;
    };
  }, [isReady, game]);

  // Game loop
  useEffect(() => {
    if (!isReady || !canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    function gameLoop() {
      if (!video || !canvas || !ctx) return;

      const currentTime = video.currentTime;

      // Only process if video time has changed
      if (currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = currentTime;

        // Detect pose
        const poseData = detectPose(video, performance.now());

        // Create game context
        const context: GameContext = {
          canvas,
          ctx,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight
        };

        // Call game's frame handler
        game.onFrame(context, poseData);
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }

    gameLoop();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isReady, game, detectPose]);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="hidden"
        />
        <canvas
          ref={canvasRef}
          className="border-2 border-zinc-300 dark:border-zinc-700 rounded-lg max-w-full"
        />
      </div>
    </div>
  );
}
