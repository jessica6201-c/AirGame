"use client";

import { useEffect, useRef, useState } from "react";

interface UseCameraOptions {
  width?: number;
  height?: number;
}

export function useCamera(options: UseCameraOptions = {}) {
  const { width = 1280, height = 720 } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string>("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width, height },
          audio: false
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener("loadeddata", () => {
            setIsReady(true);
          });
        }
      } catch (err) {
        setError(`Camera access denied: ${err}`);
        console.error(err);
      }
    }

    setupCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [width, height]);

  return {
    videoRef,
    isReady,
    error
  };
}
