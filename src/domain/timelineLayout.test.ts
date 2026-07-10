import { describe, expect, it } from "vitest";

import { featuredEverydayItems } from "../content/items";
import { deriveItemsWithSats } from "./pricing";
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

function createThresholdItems(gapRem: number): ItemSnapshot[] {
  const lowerSats = 20_000;
  const domainDecades = 6;
  const uncompressedStageHeightRem = 348;
  const upperSats =
    10 **
    (Math.log10(lowerSats) +
      (gapRem * domainDecades) / uncompressedStageHeightRem);

  return [
    createSnapshot("minimum", 100),
    ...Array.from({ length: 15 }, (_, index) =>
      createSnapshot(`lower-${index}`, lowerSats),
    ),
    ...Array.from({ length: 15 }, (_, index) =>
      createSnapshot(`upper-${index}`, upperSats),
    ),
    createSnapshot("maximum", 100_000_000),
  ];
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

describe("buildTimelineLayout breaks", () => {
  it("compresses the three large protected gaps in the production fixture", () => {
    // Arrange
    const items = deriveItemsWithSats(featuredEverydayItems, 100_000);

    // Act
    const layout = buildTimelineLayout(items, "desktop");

    // Assert
    expect(layout.breaks).toHaveLength(3);
    expect(
      layout.breaks.map((timelineBreak) => [
        timelineBreak.minimumSats,
        timelineBreak.maximumSats,
      ]),
    ).toEqual([
      [100, 350],
      [1_450_000, 6_500_000],
      [10_000_000, 45_000_000],
    ]);
    expect(layout.stageHeightRem).toBeCloseTo(264.7, 0);

    for (const timelineBreak of layout.breaks) {
      expect(
        (timelineBreak.endPosition - timelineBreak.startPosition) *
          layout.stageHeightRem,
      ).toBeCloseTo(8, 10);
    }
  });

  it("does not place a break across an intermediate decade marker", () => {
    // Arrange
    const items = deriveItemsWithSats(featuredEverydayItems, 100_000);

    // Act
    const layout = buildTimelineLayout(items, "desktop");

    // Assert
    for (const timelineBreak of layout.breaks) {
      expect(
        layout.marks.some(
          (mark) =>
            mark.valueSats > timelineBreak.minimumSats &&
            mark.valueSats < timelineBreak.maximumSats,
        ),
      ).toBe(false);
    }
  });

  it("keeps the compressed axis mapping monotonic", () => {
    // Arrange
    const items = deriveItemsWithSats(featuredEverydayItems, 100_000);

    // Act
    const layout = buildTimelineLayout(items, "desktop");
    const exactPositions = layout.placements.map(
      (placement) => placement.exactPosition,
    );

    // Assert
    expect(
      exactPositions.every(
        (position, index) =>
          position >= 0 &&
          position <= 1 &&
          (index === 0 || position >= exactPositions[index - 1]),
      ),
    ).toBe(true);
    expect(
      layout.breaks.every(
        (timelineBreak, index) =>
          timelineBreak.startPosition < timelineBreak.endPosition &&
          (index === 0 ||
            timelineBreak.startPosition >=
              layout.breaks[index - 1].endPosition),
      ),
    ).toBe(true);
  });

  it("treats the 30rem break threshold as inclusive", () => {
    // Arrange
    const belowThresholdItems = createThresholdItems(29.9);
    const atThresholdItems = createThresholdItems(30);
    const lowerSats = 20_000;

    // Act
    const belowThresholdLayout = buildTimelineLayout(
      belowThresholdItems,
      "desktop",
    );
    const atThresholdLayout = buildTimelineLayout(
      atThresholdItems,
      "desktop",
    );
    const maybeBelowThresholdBreak = belowThresholdLayout.breaks.find(
      (timelineBreak) => timelineBreak.minimumSats === lowerSats,
    );
    const maybeAtThresholdBreak = atThresholdLayout.breaks.find(
      (timelineBreak) => timelineBreak.minimumSats === lowerSats,
    );

    // Assert
    expect(maybeBelowThresholdBreak).toBeUndefined();
    expect(maybeAtThresholdBreak).toBeDefined();
  });

  it("preserves enough stage height for every desktop lane", () => {
    // Arrange
    const items = Array.from({ length: 32 }, (_, index) =>
      createSnapshot(`item-${index}`, index < 16 ? 100 : 100_000_000),
    );

    // Act
    const layout = buildTimelineLayout(items, "desktop");

    // Assert
    expect(layout.stageHeightRem).toBeGreaterThanOrEqual(232);
    expect(layout.breaks.length).toBeGreaterThan(0);
    expect(
      layout.breaks.every(
        (timelineBreak) =>
          Number.isFinite(timelineBreak.startPosition) &&
          Number.isFinite(timelineBreak.endPosition) &&
          timelineBreak.endPosition > timelineBreak.startPosition,
      ),
    ).toBe(true);
  });

  it("reduces every break proportionally when lane capacity limits compression", () => {
    // Arrange
    const items = [
      ...Array.from({ length: 29 }, (_, index) =>
        createSnapshot(`minimum-${index}`, 100),
      ),
      createSnapshot("splitter", 300),
      createSnapshot("maximum-a", 100_000_000),
      createSnapshot("maximum-b", 100_000_000),
    ];
    const uncompressedStageHeightRem = 348;
    const domainDecades = 6;

    // Act
    const layout = buildTimelineLayout(items, "desktop");
    const reductionRatios = layout.breaks.map((timelineBreak) => {
      const originalSpanRem =
        (Math.log10(
          timelineBreak.maximumSats / timelineBreak.minimumSats,
        ) /
          domainDecades) *
        uncompressedStageHeightRem;
      const compressedSpanRem =
        (timelineBreak.endPosition - timelineBreak.startPosition) *
        layout.stageHeightRem;

      return (originalSpanRem - compressedSpanRem) / (originalSpanRem - 8);
    });

    // Assert
    expect(layout.stageHeightRem).toBeCloseTo(232, 10);
    expect(reductionRatios[0]).toBeLessThan(1);
    for (const reductionRatio of reductionRatios.slice(1)) {
      expect(reductionRatio).toBeCloseTo(reductionRatios[0], 10);
    }
  });

  it("does not create breaks when every protected gap stays below the threshold", () => {
    // Arrange
    const items = Array.from({ length: 32 }, (_, index) =>
      createSnapshot(`item-${index}`, 10 ** (2 + (index * 6) / 31)),
    );

    // Act
    const layout = buildTimelineLayout(items, "desktop");

    // Assert
    expect(layout.breaks).toEqual([]);
  });

  it("returns finite layouts for empty, single-item, and duplicate inputs", () => {
    // Arrange
    const cases: ItemSnapshot[][] = [
      [],
      [createSnapshot("single", 1_000)],
      [
        createSnapshot("duplicate-a", 1_000),
        createSnapshot("duplicate-b", 1_000),
      ],
    ];

    // Act
    const layouts = cases.map((items) =>
      buildTimelineLayout(items, "desktop"),
    );

    // Assert
    expect(
      layouts.every(
        (layout) =>
          Number.isFinite(layout.stageHeightRem) &&
          Array.isArray(layout.breaks) &&
          layout.placements.every(
            (placement) =>
              Number.isFinite(placement.exactPosition) &&
              Number.isFinite(placement.displayPosition),
          ),
      ),
    ).toBe(true);
  });

  it("does not create desktop breaks for mobile list mode", () => {
    // Arrange
    const items = deriveItemsWithSats(featuredEverydayItems, 100_000);

    // Act
    const layout = buildTimelineLayout(items, "mobile");

    // Assert
    expect(layout.breaks).toEqual([]);
  });
});
