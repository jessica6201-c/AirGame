"use client";

import { useRef } from "react";
import { PoseData } from "@/app/types/game";
import { NormalizedLandmark } from "@mediapipe/tasks-vision";

interface SmoothingOptions {
  slowFactor?: number;
  fastFactor?: number;
  velocityThreshold?: number;
}

/**
 * Hook to smooth landmark positions using adaptive exponential moving average
 * Uses velocity-based smoothing: more responsive during fast movements, more stable when slow
 */
export function useLandmarkSmoothing(options: SmoothingOptions = {}) {
  const {
    slowFactor = 0.6,
    fastFactor = 0.2,
    velocityThreshold = 0.015
  } = options;

  const previousPoseData = useRef<PoseData | null>(null);

  const smoothLandmark = (
    current: NormalizedLandmark,
    previous: NormalizedLandmark | undefined
  ): NormalizedLandmark => {
    if (!previous) return current;

    const dx = current.x - previous.x;
    const dy = current.y - previous.y;
    const velocity = Math.sqrt(dx * dx + dy * dy);

    const alpha = velocity > velocityThreshold ? fastFactor : slowFactor;

    return {
      x: alpha * previous.x + (1 - alpha) * current.x,
      y: alpha * previous.y + (1 - alpha) * current.y,
      z: alpha * previous.z + (1 - alpha) * current.z,
      visibility: current.visibility
    };
  };

  const smoothPoseData = (poseData: PoseData | null): PoseData | null => {
    if (!poseData) {
      previousPoseData.current = null;
      return null;
    }

    if (!previousPoseData.current) {
      previousPoseData.current = poseData;
      return poseData;
    }

    const smoothedLandmarks = poseData.landmarks.map((pose, poseIndex) => {
      const previousPose = previousPoseData.current?.landmarks[poseIndex];

      return pose.map((landmark, landmarkIndex) => {
        const previousLandmark = previousPose?.[landmarkIndex];
        return smoothLandmark(landmark, previousLandmark);
      });
    });

    const smoothedData: PoseData = {
      landmarks: smoothedLandmarks,
      worldLandmarks: poseData.worldLandmarks,
      timestamp: poseData.timestamp
    };

    previousPoseData.current = smoothedData;
    return smoothedData;
  };

  const reset = () => {
    previousPoseData.current = null;
  };

  return {
    smoothPoseData,
    reset
  };
}
