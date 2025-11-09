import { NormalizedLandmark } from "@mediapipe/tasks-vision";

export interface Point {
  x: number;
  y: number;
}

export interface PinchState {
  isPinching: boolean;
  position: Point | null;
  distance: number;
}

export interface HandPinchStates {
  left: PinchState;
  right: PinchState;
}

const PINCH_THRESHOLD = 0.05;

export function calculateDistance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function getMidpoint(p1: Point, p2: Point): Point {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2
  };
}

/**
 * Detects pinch gesture for pose landmarks
 * MediaPipe Pose hand keypoints: 19 (L index), 20 (R index), 21 (L thumb), 22 (R thumb)
 * Based on Air Canvas pinch detection
 */
export function detectPosePinch(
  thumb: NormalizedLandmark | undefined,
  index: NormalizedLandmark | undefined,
  canvasWidth: number,
  canvasHeight: number,
  mirror: boolean = true
): PinchState {
  if (!thumb || !index) {
    return {
      isPinching: false,
      position: null,
      distance: 0
    };
  }

  const thumbPoint: Point = {
    x: thumb.x,
    y: thumb.y
  };

  const indexPoint: Point = {
    x: index.x,
    y: index.y
  };

  const distance = calculateDistance(thumbPoint, indexPoint);
  const midpoint = getMidpoint(thumbPoint, indexPoint);

  // Adjust position slightly above midpoint
  const adjustedPoint: Point = {
    x: mirror ? 1 - midpoint.x : midpoint.x,
    y: midpoint.y - (15 / canvasHeight)
  };

  return {
    isPinching: distance < PINCH_THRESHOLD,
    position: adjustedPoint,
    distance
  };
}

/**
 * Detect pinch for both hands in a pose
 */
export function detectHandPinches(
  landmarks: NormalizedLandmark[],
  canvasWidth: number,
  canvasHeight: number,
  mirror: boolean = true
): HandPinchStates {
  if (!landmarks || landmarks.length < 23) {
    return {
      left: { isPinching: false, position: null, distance: 0 },
      right: { isPinching: false, position: null, distance: 0 }
    };
  }

  // Left hand: thumb (21) and index (19)
  const leftThumb = landmarks[21];
  const leftIndex = landmarks[19];

  // Right hand: thumb (22) and index (20)
  const rightThumb = landmarks[22];
  const rightIndex = landmarks[20];

  return {
    left: detectPosePinch(leftThumb, leftIndex, canvasWidth, canvasHeight, mirror),
    right: detectPosePinch(rightThumb, rightIndex, canvasWidth, canvasHeight, mirror)
  };
}
