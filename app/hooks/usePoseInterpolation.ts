"use client";

import { useRef } from "react";
import { PoseData } from "@/app/types/game";
import { NormalizedLandmark } from "@mediapipe/tasks-vision";

interface PoseSnapshot {
  data: PoseData;
  timestamp: number;
}

/**
 * Hook to interpolate pose data between detection frames
 * Provides smooth 60fps rendering even when pose detection runs at lower fps
 */
export function usePoseInterpolation() {
  const previousSnapshot = useRef<PoseSnapshot | null>(null);
  const currentSnapshot = useRef<PoseSnapshot | null>(null);

  const interpolateLandmark = (
    prev: NormalizedLandmark,
    curr: NormalizedLandmark,
    t: number
  ): NormalizedLandmark => {
    return {
      x: prev.x + (curr.x - prev.x) * t,
      y: prev.y + (curr.y - prev.y) * t,
      z: prev.z + (curr.z - prev.z) * t,
      visibility: curr.visibility
    };
  };

  const updatePoseData = (poseData: PoseData | null, timestamp: number) => {
    if (!poseData) {
      previousSnapshot.current = null;
      currentSnapshot.current = null;
      return;
    }

    previousSnapshot.current = currentSnapshot.current;
    currentSnapshot.current = {
      data: poseData,
      timestamp
    };
  };

  const getInterpolatedPose = (currentTime: number): PoseData | null => {
    if (!currentSnapshot.current) {
      return null;
    }

    // If no previous snapshot, return current
    if (!previousSnapshot.current) {
      return currentSnapshot.current.data;
    }

    // Calculate interpolation factor
    const timeDelta = currentSnapshot.current.timestamp - previousSnapshot.current.timestamp;
    if (timeDelta === 0) {
      return currentSnapshot.current.data;
    }

    const elapsed = currentTime - previousSnapshot.current.timestamp;
    let t = elapsed / timeDelta;

    // Clamp t between 0 and 1
    t = Math.max(0, Math.min(1, t));

    // If t > 1, we're past the current snapshot, just return current
    if (t >= 1) {
      return currentSnapshot.current.data;
    }

    // Interpolate landmarks
    const interpolatedLandmarks = currentSnapshot.current.data.landmarks.map((pose, poseIndex) => {
      const prevPose = previousSnapshot.current?.data.landmarks[poseIndex];
      if (!prevPose) return pose;

      return pose.map((landmark, landmarkIndex) => {
        const prevLandmark = prevPose[landmarkIndex];
        if (!prevLandmark) return landmark;

        return interpolateLandmark(prevLandmark, landmark, t);
      });
    });

    return {
      landmarks: interpolatedLandmarks,
      worldLandmarks: currentSnapshot.current.data.worldLandmarks,
      timestamp: currentTime
    };
  };

  const reset = () => {
    previousSnapshot.current = null;
    currentSnapshot.current = null;
  };

  return {
    updatePoseData,
    getInterpolatedPose,
    reset
  };
}
