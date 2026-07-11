import { describe, expect, it } from "vitest";

import {
  createMovingLightningParticle,
  maximumParticleSpinDegreesPerSecond,
  minimumParticleSpinDegreesPerSecond,
} from "./lightningParticles";

describe("createMovingLightningParticle", () => {
  it("uses the configured minimum and maximum spin magnitudes", () => {
    // Act
    const minimumSpinParticle = createMovingLightningParticle(1, 0, 0, () => 0);
    const maximumSpinParticle = createMovingLightningParticle(2, 0, 0, () => 1);

    // Assert
    expect(Math.abs(minimumSpinParticle.angularVelocity)).toBe(
      minimumParticleSpinDegreesPerSecond,
    );
    expect(Math.abs(maximumSpinParticle.angularVelocity)).toBe(
      maximumParticleSpinDegreesPerSecond,
    );
  });
});
