import { BaseGame, GameContext, PoseData } from "@/app/types/game";

interface Circle {
  x: number;
  y: number;
  radius: number;
  collected: boolean;
}

interface GameState {
  circles: Circle[];
  score: number;
  spawnInterval: number | null;
  lastSpawnTime: number;
}

const state: GameState = {
  circles: [],
  score: 0,
  spawnInterval: null,
  lastSpawnTime: 0
};

function isPinching(thumb: any, index: any): boolean {
  if (!thumb || !index) return false;

  const distance = Math.sqrt(
    Math.pow(thumb.x - index.x, 2) + Math.pow(thumb.y - index.y, 2)
  );

  return distance < 0.05; // Threshold for pinch
}

function spawnCircle(canvas: HTMLCanvasElement) {
  const padding = 100;
  const circle: Circle = {
    x: padding + Math.random() * (canvas.width - padding * 2),
    y: padding + Math.random() * (canvas.height - padding * 2),
    radius: 40,
    collected: false
  };
  state.circles.push(circle);
}

export const pinchCirclesGame: BaseGame = {
  metadata: {
    id: "pinch-circles",
    name: "Pinch Circles",
    description: "Pinch your fingers and move over circles to collect them!"
  },

  onInit: (context: GameContext) => {
    state.circles = [];
    state.score = 0;
    state.lastSpawnTime = performance.now();

    // Spawn initial circles
    for (let i = 0; i < 3; i++) {
      spawnCircle(context.canvas);
    }
  },

  onFrame: (context: GameContext, poseData: PoseData | null) => {
    const { ctx, canvas } = context;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Spawn new circles periodically
    const currentTime = performance.now();
    if (currentTime - state.lastSpawnTime > 2000 && state.circles.length < 5) {
      spawnCircle(canvas);
      state.lastSpawnTime = currentTime;
    }

    // Draw circles
    state.circles.forEach((circle, index) => {
      if (!circle.collected) {
        ctx.fillStyle = "#00ff88";
        ctx.strokeStyle = "#00cc66";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw inner circle
        ctx.fillStyle = "#ffffff44";
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Remove collected circles
    state.circles = state.circles.filter(c => !c.collected);

    // Process hand tracking
    if (poseData && poseData.landmarks.length > 0) {
      for (const pose of poseData.landmarks) {
        // Right hand: thumb (22) and index (20)
        const rightThumb = pose[22];
        const rightIndex = pose[20];

        // Left hand: thumb (21) and index (19)
        const leftThumb = pose[21];
        const leftIndex = pose[19];

        // Check right hand pinch
        if (isPinching(rightThumb, rightIndex)) {
          const handX = (1 - rightIndex.x) * canvas.width;
          const handY = rightIndex.y * canvas.height;

          // Draw pinch indicator
          ctx.fillStyle = "#ff0088";
          ctx.beginPath();
          ctx.arc(handX, handY, 20, 0, Math.PI * 2);
          ctx.fill();

          // Check collision with circles
          state.circles.forEach(circle => {
            if (!circle.collected) {
              const dist = Math.sqrt(
                Math.pow(handX - circle.x, 2) + Math.pow(handY - circle.y, 2)
              );
              if (dist < circle.radius + 20) {
                circle.collected = true;
                state.score++;
              }
            }
          });
        } else if (rightIndex) {
          // Draw hand position when not pinching
          const handX = (1 - rightIndex.x) * canvas.width;
          const handY = rightIndex.y * canvas.height;

          ctx.strokeStyle = "#ffffff88";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(handX, handY, 15, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Check left hand pinch
        if (isPinching(leftThumb, leftIndex)) {
          const handX = (1 - leftIndex.x) * canvas.width;
          const handY = leftIndex.y * canvas.height;

          // Draw pinch indicator
          ctx.fillStyle = "#0088ff";
          ctx.beginPath();
          ctx.arc(handX, handY, 20, 0, Math.PI * 2);
          ctx.fill();

          // Check collision with circles
          state.circles.forEach(circle => {
            if (!circle.collected) {
              const dist = Math.sqrt(
                Math.pow(handX - circle.x, 2) + Math.pow(handY - circle.y, 2)
              );
              if (dist < circle.radius + 20) {
                circle.collected = true;
                state.score++;
              }
            }
          });
        } else if (leftIndex) {
          // Draw hand position when not pinching
          const handX = (1 - leftIndex.x) * canvas.width;
          const handY = leftIndex.y * canvas.height;

          ctx.strokeStyle = "#ffffff88";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(handX, handY, 15, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    // Draw score
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px sans-serif";
    ctx.fillText(`Score: ${state.score}`, 30, 50);

    // Draw instructions
    ctx.font = "18px sans-serif";
    ctx.fillStyle = "#ffffff88";
    ctx.fillText("Pinch your fingers and move over circles!", 30, canvas.height - 30);
  },

  onCleanup: () => {
    state.circles = [];
    state.score = 0;
    state.lastSpawnTime = 0;
  }
};
