import { describe, expect, it } from "vitest";

import {
  isQualifyingPointerTap,
  registerRapidTap,
  type PointerTapCandidate,
} from "./rapidTapGesture";

describe("registerRapidTap", () => {
  it("triggers on the fifth tap inside an inclusive 800ms window", () => {
    // Arrange
    const tapTimes = [0, 200, 400, 600, 800];
    let recentTapTimes: number[] = [];
    let didTrigger = false;

    // Act
    tapTimes.forEach((tapTime) => {
      const result = registerRapidTap(recentTapTimes, tapTime);
      recentTapTimes = result.recentTapTimes;
      didTrigger = result.didTrigger;
    });

    // Assert
    expect(didTrigger).toBe(true);
    expect(recentTapTimes).toEqual([]);
  });

  it("does not trigger when the five taps exceed 800ms", () => {
    // Arrange
    const tapTimes = [0, 201, 402, 603, 804];
    let recentTapTimes: number[] = [];
    let didTrigger = false;

    // Act
    tapTimes.forEach((tapTime) => {
      const result = registerRapidTap(recentTapTimes, tapTime);
      recentTapTimes = result.recentTapTimes;
      didTrigger = result.didTrigger;
    });

    // Assert
    expect(didTrigger).toBe(false);
    expect(recentTapTimes).toHaveLength(4);
  });
});

describe("isQualifyingPointerTap", () => {
  const qualifyingCandidate: PointerTapCandidate = {
    button: 0,
    durationMs: 600,
    hadConcurrentPointer: false,
    isPrimary: true,
    maximumTravelPx: 12,
  };

  it("accepts a primary short tap at the movement boundary", () => {
    // Act
    const isQualifying = isQualifyingPointerTap(qualifyingCandidate);

    // Assert
    expect(isQualifying).toBe(true);
  });

  it.each([
    ["secondary button", { button: 2 }],
    ["non-primary pointer", { isPrimary: false }],
    ["multi-touch", { hadConcurrentPointer: true }],
    ["drag", { maximumTravelPx: 12.1 }],
    ["long press", { durationMs: 600.1 }],
  ])("rejects a %s gesture", (_name, override) => {
    // Arrange
    const candidate = { ...qualifyingCandidate, ...override };

    // Act
    const isQualifying = isQualifyingPointerTap(candidate);

    // Assert
    expect(isQualifying).toBe(false);
  });
});
