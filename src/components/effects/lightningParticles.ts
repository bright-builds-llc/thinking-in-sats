import { createSignal, type Accessor } from "solid-js";

import { randomBetween } from "./lightningCanvas";

type RandomSource = () => number;

export type LightningParticle = {
  ageMs: number;
  angularVelocity: number;
  id: number;
  isStatic: boolean;
  rotation: number;
  velocityX: number;
  velocityY: number;
  x: number;
  y: number;
};

type LightningParticleSystem = {
  dispose: () => void;
  emit: (x: number, y: number) => void;
  particles: Accessor<LightningParticle[]>;
};

const particleGravityPxPerSecond = 940;
const particleRemovalMarginPx = 64;
const maximumParticleCount = 24;
export const minimumParticleSpinDegreesPerSecond = 420;
export const maximumParticleSpinDegreesPerSecond = 1_440;

export function createMovingLightningParticle(
  id: number,
  x: number,
  y: number,
  random: RandomSource = Math.random,
): LightningParticle {
  const horizontalDirection = random() < 0.5 ? -1 : 1;

  return {
    ageMs: 0,
    angularVelocity:
      horizontalDirection *
      randomBetween(
        minimumParticleSpinDegreesPerSecond,
        maximumParticleSpinDegreesPerSecond,
        random,
      ),
    id,
    isStatic: false,
    rotation: randomBetween(-35, 35, random),
    velocityX:
      horizontalDirection * randomBetween(140, 420, random),
    velocityY: -randomBetween(380, 680, random),
    x,
    y,
  };
}

export function createLightningParticleSystem(
  shouldAnimate: boolean,
): LightningParticleSystem {
  let nextParticleId = 0;
  let particleAnimationFrame = 0;
  let previousParticleFrameTime = 0;
  const particleTimeouts = new Set<number>();
  const [particles, setParticles] = createSignal<LightningParticle[]>([]);

  const removeParticle = (particleId: number) => {
    setParticles((currentParticles) =>
      currentParticles.filter((particle) => particle.id !== particleId),
    );
  };

  const animateParticles = (now: number) => {
    const elapsedSeconds = Math.min(
      Math.max(now - previousParticleFrameTime, 0) / 1_000,
      0.032,
    );
    previousParticleFrameTime = now;
    let hasMovingParticles = false;

    setParticles((currentParticles) =>
      currentParticles
        .map((particle) => {
          if (particle.isStatic) {
            return particle;
          }

          const velocityY =
            particle.velocityY + particleGravityPxPerSecond * elapsedSeconds;

          return {
            ...particle,
            ageMs: particle.ageMs + elapsedSeconds * 1_000,
            rotation:
              particle.rotation + particle.angularVelocity * elapsedSeconds,
            velocityY,
            x: particle.x + particle.velocityX * elapsedSeconds,
            y: particle.y + velocityY * elapsedSeconds,
          };
        })
        .filter((particle) => {
          if (particle.isStatic) {
            return true;
          }

          const isPastHorizontalEdge =
            particle.x < -particleRemovalMarginPx ||
            particle.x > window.innerWidth + particleRemovalMarginPx;
          const isPastBottomEdge =
            particle.y > window.innerHeight + particleRemovalMarginPx;
          const shouldRemove =
            particle.ageMs > 3_000 ||
            (particle.ageMs > 280 &&
              (isPastHorizontalEdge || isPastBottomEdge));

          if (!shouldRemove) {
            hasMovingParticles = true;
          }

          return !shouldRemove;
        }),
    );

    if (hasMovingParticles) {
      particleAnimationFrame = window.requestAnimationFrame(animateParticles);
      return;
    }

    particleAnimationFrame = 0;
  };

  const emit = (x: number, y: number) => {
    nextParticleId += 1;
    const particleId = nextParticleId;

    if (!shouldAnimate) {
      setParticles((currentParticles) => [
        ...currentParticles.slice(-(maximumParticleCount - 1)),
        {
          ageMs: 0,
          angularVelocity: 0,
          id: particleId,
          isStatic: true,
          rotation: 0,
          velocityX: 0,
          velocityY: 0,
          x,
          y,
        },
      ]);
      const timeout = window.setTimeout(() => {
        particleTimeouts.delete(timeout);
        removeParticle(particleId);
      }, 450);
      particleTimeouts.add(timeout);
      return;
    }

    setParticles((currentParticles) => [
      ...currentParticles.slice(-(maximumParticleCount - 1)),
      createMovingLightningParticle(particleId, x, y),
    ]);

    if (particleAnimationFrame === 0) {
      previousParticleFrameTime = performance.now();
      particleAnimationFrame = window.requestAnimationFrame(animateParticles);
    }
  };

  const dispose = () => {
    if (particleAnimationFrame !== 0) {
      window.cancelAnimationFrame(particleAnimationFrame);
    }

    particleTimeouts.forEach((timeout) => window.clearTimeout(timeout));
  };

  return { dispose, emit, particles };
}
