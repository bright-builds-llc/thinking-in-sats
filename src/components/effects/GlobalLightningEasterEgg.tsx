import { For, createSignal, onCleanup, onMount } from "solid-js";

import { createLightningParticleSystem } from "./lightningParticles";
import { observeLightningGestures } from "./observeLightningGestures";
import { createViewportLightningStrike } from "./viewportLightningStrike";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function GlobalLightningEasterEgg() {
  let maybeCanvas: HTMLCanvasElement | undefined;
  const shouldAnimate = !prefersReducedMotion();
  const [isStrikeActive, setIsStrikeActive] = createSignal(false);
  const particleSystem = createLightningParticleSystem(shouldAnimate);
  const viewportStrike = createViewportLightningStrike({
    maybeCanvas: () => maybeCanvas,
    onActiveChange: setIsStrikeActive,
    shouldAnimate,
  });

  onMount(() => {
    const stopObserving = observeLightningGestures({
      onParticleTap: (tap) => particleSystem.emit(tap.x, tap.y),
      onStrike: viewportStrike.trigger,
    });

    onCleanup(stopObserving);
  });

  onCleanup(() => {
    particleSystem.dispose();
    viewportStrike.dispose();
  });

  return (
    <div aria-hidden="true" class="lightning-easter-egg">
      <canvas
        class="lightning-easter-egg__canvas"
        data-animation-active={shouldAnimate ? "true" : "false"}
        data-strike-active={isStrikeActive() ? "true" : "false"}
        ref={(element) => {
          maybeCanvas = element;
        }}
      />
      <For each={particleSystem.particles()}>
        {(particle) => (
          <span
            class={`lightning-easter-egg__particle${
              particle.isStatic
                ? " lightning-easter-egg__particle--static"
                : ""
            }`}
            data-particle-id={particle.id}
            style={{
              left: `${particle.x}px`,
              top: `${particle.y}px`,
              transform: `translate(-50%, -50%) rotate(${particle.rotation}deg)`,
            }}
          >
            ⚡
          </span>
        )}
      </For>
    </div>
  );
}
