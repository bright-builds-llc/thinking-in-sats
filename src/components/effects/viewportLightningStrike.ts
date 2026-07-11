import {
  createLightningBolt,
  drawLightningBolt,
  lightningIntensity,
} from "./lightningCanvas";

type ViewportLightningStrikeOptions = {
  maybeCanvas: () => HTMLCanvasElement | undefined;
  onActiveChange: (isActive: boolean) => void;
  shouldAnimate: boolean;
};

type ViewportLightningStrike = {
  dispose: () => void;
  trigger: () => void;
};

export function createViewportLightningStrike(
  options: ViewportLightningStrikeOptions,
): ViewportLightningStrike {
  let strikeAnimationFrame = 0;
  let maybeStrikeTimeout: number | undefined;

  const clear = (maybeContext?: CanvasRenderingContext2D) => {
    if (strikeAnimationFrame !== 0) {
      window.cancelAnimationFrame(strikeAnimationFrame);
      strikeAnimationFrame = 0;
    }

    if (maybeStrikeTimeout !== undefined) {
      window.clearTimeout(maybeStrikeTimeout);
      maybeStrikeTimeout = undefined;
    }

    const maybeCanvas = options.maybeCanvas();

    if (maybeContext && maybeCanvas) {
      maybeContext.clearRect(0, 0, maybeCanvas.width, maybeCanvas.height);
    }

    options.onActiveChange(false);
  };

  const scheduleFallbackClear = () => {
    maybeStrikeTimeout = window.setTimeout(() => clear(), 280);
  };

  const trigger = () => {
    const maybeCanvas = options.maybeCanvas();
    options.onActiveChange(true);

    if (
      !maybeCanvas ||
      typeof CanvasRenderingContext2D === "undefined"
    ) {
      scheduleFallbackClear();
      return;
    }

    const maybeContext = maybeCanvas.getContext("2d");

    if (!maybeContext) {
      scheduleFallbackClear();
      return;
    }

    clear(maybeContext);
    options.onActiveChange(true);
    const context = maybeContext;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    maybeCanvas.width = Math.max(1, Math.floor(width * ratio));
    maybeCanvas.height = Math.max(1, Math.floor(height * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const startedAt = performance.now();
    const bolt = createLightningBolt(width, height, startedAt);

    if (!options.shouldAnimate) {
      drawLightningBolt(context, bolt, width, height, 0.62);
      maybeStrikeTimeout = window.setTimeout(
        () => clear(context),
        280,
      );
      return;
    }

    const animateStrike = (now: number) => {
      const age = now - startedAt;
      const intensity = lightningIntensity(age);
      context.clearRect(0, 0, width, height);

      if (intensity > 0) {
        drawLightningBolt(context, bolt, width, height, intensity);
      }

      if (age < 700) {
        strikeAnimationFrame = window.requestAnimationFrame(animateStrike);
        return;
      }

      clear(context);
    };

    strikeAnimationFrame = window.requestAnimationFrame(animateStrike);
  };

  return { dispose: clear, trigger };
}
