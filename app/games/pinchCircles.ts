import { BaseGame, GameContext, PoseData } from "@/app/types/game";
import { detectHandPinches } from "@/app/utils/gestures";

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
        const pinches = detectHandPinches(pose, canvas.width, canvas.height);

        // Right hand
        if (pinches.right.position) {
          const handX = pinches.right.position.x * canvas.width;
          const handY = pinches.right.position.y * canvas.height;

          if (pinches.right.isPinching) {
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
          } else {
            // Draw hand position when not pinching
            ctx.strokeStyle = "#ffffff88";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(handX, handY, 15, 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        // Left hand
        if (pinches.left.position) {
          const handX = pinches.left.position.x * canvas.width;
          const handY = pinches.left.position.y * canvas.height;

          if (pinches.left.isPinching) {
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
          } else {
            // Draw hand position when not pinching
            ctx.strokeStyle = "#ffffff88";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(handX, handY, 15, 0, Math.PI * 2);
            ctx.stroke();
          }
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
