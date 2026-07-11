import { onCleanup, onMount } from "solid-js";

import {
  createLightningBolt,
  drawLightningBolt,
  lightningIntensity,
  randomBetween,
  type LightningBolt,
} from "../effects/lightningCanvas";

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
          drawLightningBolt(context, bolt, width, height, intensity);
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
