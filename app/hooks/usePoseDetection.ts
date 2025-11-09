"use client";

import { useEffect, useState, useRef } from "react";
import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { PoseData } from "@/app/types/game";

interface UsePoseDetectionOptions {
  numPoses?: number;
  modelType?: "lite" | "full" | "heavy";
}

export function usePoseDetection(options: UsePoseDetectionOptions = {}) {
  const { numPoses = 2, modelType = "heavy" } = options;

  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(null);
  const [error, setError] = useState<string>("");
  const [isReady, setIsReady] = useState(false);

  // Initialize MediaPipe Pose Landmarker
  useEffect(() => {
    async function initializePoseLandmarker() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_${modelType}/float16/1/pose_landmarker_${modelType}.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numPoses
        });

        setPoseLandmarker(landmarker);
        setIsReady(true);
      } catch (err) {
        setError(`Failed to initialize pose detector: ${err}`);
        console.error(err);
      }
    }

    initializePoseLandmarker();

    return () => {
      poseLandmarker?.close();
    };
  }, [numPoses, modelType]);

  const detectPose = (video: HTMLVideoElement, timestamp: number): PoseData | null => {
    if (!poseLandmarker || !isReady) return null;

    try {
      const results = poseLandmarker.detectForVideo(video, timestamp);

      return {
        landmarks: results.landmarks || [],
        worldLandmarks: results.worldLandmarks || [],
        timestamp
      };
    } catch (err) {
      console.error("Pose detection error:", err);
      return null;
    }
  };

  return {
    detectPose,
    isReady,
    error
  };
}
