import { NormalizedLandmark } from "@mediapipe/tasks-vision";

export interface GameMetadata {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  splashArt?: string;
}

export interface PoseData {
  landmarks: NormalizedLandmark[][];
  worldLandmarks?: NormalizedLandmark[][];
  timestamp: number;
}

export interface GameContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  videoWidth: number;
  videoHeight: number;
}

export interface BaseGame {
  metadata: GameMetadata;

  // Called once when game starts
  onInit?: (context: GameContext) => void;

  // Called every frame with pose data
  onFrame: (context: GameContext, poseData: PoseData | null) => void;

  // Called when game ends
  onCleanup?: () => void;
}

export interface GameRegistry {
  [key: string]: BaseGame;
}
