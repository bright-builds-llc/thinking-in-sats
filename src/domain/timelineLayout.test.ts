import { describe, expect, it } from "vitest";

import { buildTimelineLayout } from "./timelineLayout";
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

describe("buildTimelineLayout markers", () => {
  it("creates decade markers across the visible range", () => {
    // Arrange
    const items = [
      createSnapshot("minimum", 12),
      createSnapshot("maximum", 250_000),
    ];

    // Act
    const layout = buildTimelineLayout(items, "desktop");

    // Assert
    expect(layout.marks.map((mark) => mark.valueSats)).toEqual([
      10, 100, 1_000, 10_000, 100_000, 1_000_000,
    ]);
  });
});

describe("buildTimelineLayout placements", () => {
  it("uses the same logarithmic domain as the decade markers", () => {
    // Arrange
    const items: ItemSnapshot[] = [
      createSnapshot("minimum", 500),
      createSnapshot("one-thousand", 1_000),
      createSnapshot("maximum", 50_000_000),
    ];

    // Act
    const layout = buildTimelineLayout(items, "desktop");
    const oneThousandMark = layout.marks.find(
      (mark) => mark.valueSats === 1_000,
    );
    const oneThousandPlacement = layout.placements.find(
      (placement) => placement.item.id === "one-thousand",
    );

    // Assert
    expect(oneThousandMark).toBeDefined();
    expect(oneThousandPlacement).toBeDefined();
    expect(oneThousandPlacement?.exactPosition).toBeCloseTo(
      oneThousandMark?.position ?? Number.NaN,
      10,
    );
  });

  it("keeps placements sorted and alternates desktop lanes", () => {
    // Arrange
    const items: ItemSnapshot[] = [
      createSnapshot("a", 800),
      createSnapshot("b", 820),
      createSnapshot("c", 12_000),
      createSnapshot("d", 120_000),
    ];

    // Act
    const layout = buildTimelineLayout(items, "desktop");

    // Assert
    expect(layout.placements.map((placement) => placement.item.id)).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
    expect(layout.placements[0]?.lane).not.toEqual(layout.placements[1]?.lane);
    expect(layout.placements[0]?.lane).toBe(layout.placements[2]?.lane);
    expect(layout.placements[1]?.lane).toBe(layout.placements[3]?.lane);
  });

  it("keeps dense desktop placements distinct within each lane", () => {
    // Arrange
    const items = Array.from({ length: 32 }, (_, index) =>
      createSnapshot(`item-${index}`, Math.round(500 * 1.4 ** index)),
    );

    // Act
    const layout = buildTimelineLayout(items, "desktop");
    const leftPositions = layout.placements
      .filter((placement) => placement.lane === "left")
      .map((placement) => placement.displayPosition);
    const rightPositions = layout.placements
      .filter((placement) => placement.lane === "right")
      .map((placement) => placement.displayPosition);

    // Assert
    expect(layout.stageHeightRem).toBeGreaterThan(44);
    expect(new Set(leftPositions).size).toBe(leftPositions.length);
    expect(new Set(rightPositions).size).toBe(rightPositions.length);
  });

  it("uses a single lane in mobile mode", () => {
    // Arrange
    const items: ItemSnapshot[] = [
      createSnapshot("a", 50),
      createSnapshot("b", 500),
      createSnapshot("c", 5_000),
    ];

    // Act
    const layout = buildTimelineLayout(items, "mobile");

    // Assert
    expect(
      layout.placements.every((placement) => placement.lane === "center"),
    ).toBe(true);
  });
});
