import { onCleanup, onMount } from "solid-js";

type Point = {
  x: number;
  y: number;
};

type LightningBolt = {
  birth: number;
  branches: Point[][];
  points: Point[];
  strikeX: number;
};

function randomBetween(minimum: number, maximum: number): number {
  return minimum + Math.random() * (maximum - minimum);
}

function createLightningBolt(
  width: number,
  height: number,
  now: number,
): LightningBolt {
  const strikeX = randomBetween(width * 0.12, width * 0.88);
  const endpointY = height * randomBetween(0.72, 0.96);
  const points: Point[] = [{ x: strikeX, y: -12 }];
  const branches: Point[][] = [];
  let x = strikeX;
  let y = -12;

  while (y < endpointY) {
    const maybePreviousPoint = points.at(-1);

    if (!maybePreviousPoint) {
      break;
    }

    y += randomBetween(18, 40);
    x += randomBetween(-28, 28) + (strikeX - x) * 0.045;
    const point = { x, y: Math.min(y, endpointY) };
    points.push(point);

    if (points.length > 3 && Math.random() < 0.22) {
      const branch: Point[] = [{ ...maybePreviousPoint }];
      const direction = Math.random() < 0.5 ? -1 : 1;
      let branchX = maybePreviousPoint.x;
      let branchY = maybePreviousPoint.y;
      const segmentCount = Math.floor(randomBetween(3, 7));

      for (let index = 0; index < segmentCount; index += 1) {
        branchX +=
          direction * randomBetween(12, 34) + randomBetween(-8, 8);
        branchY += randomBetween(11, 27);
        branch.push({ x: branchX, y: branchY });
      }

      branches.push(branch);
    }
  }

  return { birth: now, branches, points, strikeX };
}

function lightningIntensity(age: number): number {
  if (age < 70) {
    return 1;
  }

  if (age < 125) {
    return 0.12;
  }

  if (age < 260) {
    return 0.92 - (age - 125) / 230;
  }

  if (age < 680) {
    return Math.max(0, 0.22 * (1 - (age - 260) / 420));
  }

  return 0;
}

function drawPath(
  context: CanvasRenderingContext2D,
  points: Point[],
  width: number,
) {
  const firstPoint = points[0];

  if (!firstPoint) {
    return;
  }

  context.beginPath();
  context.moveTo(firstPoint.x, firstPoint.y);

  for (const point of points.slice(1)) {
    context.lineTo(point.x, point.y);
  }

  context.lineWidth = width;
  context.stroke();
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function QuizLightning() {
  let maybeCanvas: HTMLCanvasElement | undefined;
  const shouldAnimate = !prefersReducedMotion();

  onMount(() => {
    const canvas = maybeCanvas;

    if (!canvas || !shouldAnimate) {
      return;
    }

    if (typeof CanvasRenderingContext2D === "undefined") {
      return;
    }

    const maybeContext = canvas.getContext("2d");

    if (!maybeContext) {
      return;
    }

    const context = maybeContext;
    let width = 0;
    let height = 0;
    let animationFrame = 0;
    let nextStrike = performance.now() + 160;
    let bolts: LightningBolt[] = [];

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.max(1, Math.floor(width * ratio));
      canvas.height = Math.max(1, Math.floor(height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const drawBolt = (bolt: LightningBolt, intensity: number) => {
      const flash = context.createRadialGradient(
        bolt.strikeX,
        height * 0.35,
        0,
        bolt.strikeX,
        height * 0.35,
        width * 0.55,
      );
      flash.addColorStop(0, `rgb(255 174 112 / ${intensity * 0.2})`);
      flash.addColorStop(1, "rgb(255 156 82 / 0)");
      context.fillStyle = flash;
      context.fillRect(0, 0, width, height);

      context.save();
      context.globalCompositeOperation = "screen";
      context.lineCap = "round";
      context.lineJoin = "round";
      context.strokeStyle = "#ffad70";
      context.shadowColor = "#ff7d2d";
      context.globalAlpha = intensity * 0.46;
      context.shadowBlur = 26;
      drawPath(context, bolt.points, 7);

      for (const branch of bolt.branches) {
        drawPath(context, branch, 2.6);
      }

      context.strokeStyle = "#fff2e7";
      context.globalAlpha = intensity * 0.94;
      context.shadowBlur = 8;
      drawPath(context, bolt.points, 1.7);

      for (const branch of bolt.branches) {
        drawPath(context, branch, 0.9);
      }

      context.restore();
    };

    const animate = (now: number) => {
      if (now >= nextStrike) {
        bolts.push(createLightningBolt(width, height, now));
        nextStrike = now + randomBetween(1_650, 3_100);
      }

      context.clearRect(0, 0, width, height);
      bolts = bolts.filter((bolt) => now - bolt.birth < 700);

      for (const bolt of bolts) {
        const intensity = lightningIntensity(now - bolt.birth);

        if (intensity > 0) {
          drawBolt(bolt, intensity);
        }
      }

      animationFrame = window.requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener("resize", resize);
    animationFrame = window.requestAnimationFrame(animate);

    onCleanup(() => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    });
  });

  return (
    <canvas
      aria-hidden="true"
      class="absolute pointer-events-none quiz-completion__lightning"
      data-animation-active={shouldAnimate ? "true" : "false"}
      ref={(element) => {
        maybeCanvas = element;
      }}
    />
  );
}
