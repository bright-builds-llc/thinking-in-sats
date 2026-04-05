import { describe, expect, it } from "vitest";

import {
  buildTimelineMarks,
  buildTimelinePlacements,
} from "./timelineLayout";
import type { ItemSnapshot } from "./itemTypes";
import { itemCategoryLabels } from "./itemTypes";

function createSnapshot(id: string, satoshis: number): ItemSnapshot {
  return {
    id,
    name: id,
    category: "food-drink",
    approxUsdCents: 100,
    description: `${id} snapshot`,
    featuredOnTimeline: true,
    satValue: satoshis,
    btcValue: satoshis / 100_000_000,
    categoryLabel: itemCategoryLabels["food-drink"],
  };
}

describe("buildTimelineMarks", () => {
  it("creates decade markers across the visible range", () => {
    // Arrange
    const minimumSats = 12;
    const maximumSats = 250_000;

    // Act
    const result = buildTimelineMarks(minimumSats, maximumSats);

    // Assert
    expect(result.map((mark) => mark.valueSats)).toEqual([
      10, 100, 1_000, 10_000, 100_000, 1_000_000,
    ]);
  });
});

describe("buildTimelinePlacements", () => {
  it("keeps placements ordered and spaced apart", () => {
    // Arrange
    const items: ItemSnapshot[] = [
      createSnapshot("a", 800),
      createSnapshot("b", 820),
      createSnapshot("c", 12_000),
      createSnapshot("d", 120_000),
    ];

    // Act
    const result = buildTimelinePlacements(items, "desktop");

    // Assert
    expect(result.map((placement) => placement.item.id)).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
    expect(result[0]?.lane).not.toEqual(result[1]?.lane);
    expect((result[1]?.displayPosition ?? 0) - (result[0]?.displayPosition ?? 0)).toBeGreaterThanOrEqual(0.09);
  });

  it("uses a single lane in mobile mode", () => {
    // Arrange
    const items: ItemSnapshot[] = [
      createSnapshot("a", 50),
      createSnapshot("b", 500),
      createSnapshot("c", 5_000),
    ];

    // Act
    const result = buildTimelinePlacements(items, "mobile");

    // Assert
    expect(result.every((placement) => placement.lane === "center")).toBe(true);
  });
});
