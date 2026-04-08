import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";

import { itemCategoryLabels, type EverydayItemWithSats } from "../../domain/itemTypes";
import { TimelineSection } from "./TimelineSection";

function createTimelineItem(id: string, satValue: number): EverydayItemWithSats {
  return {
    id,
    name: id,
    category: "food-drink",
    approxUsdCents: 500,
    description: `${id} description`,
    featuredOnTimeline: true,
    satValue,
    btcValue: satValue / 100_000_000,
    categoryLabel: itemCategoryLabels["food-drink"],
  };
}

describe("TimelineSection", () => {
  it("alternates left and right lanes in desktop mode", () => {
    // Arrange
    const items = [
      createTimelineItem("coffee", 100),
      createTimelineItem("lunch", 1_000),
      createTimelineItem("groceries", 10_000),
    ];

    // Act
    const { container } = render(() => (
      <TimelineSection
        items={items}
        maybeCurrentQuoteLabel="$100,000"
        maybeSatsPerDollarLabel="1,000 sats"
      />
    ));
    const timelineItems = Array.from(
      container.querySelectorAll<HTMLElement>(".timeline-item"),
    );

    // Assert
    expect(timelineItems).toHaveLength(3);
    expect(timelineItems[0]?.classList.contains("timeline-item--left")).toBe(true);
    expect(timelineItems[1]?.classList.contains("timeline-item--right")).toBe(true);
    expect(timelineItems[2]?.classList.contains("timeline-item--left")).toBe(true);
    expect(container.querySelector(".timeline-panel")).toBeInTheDocument();
    expect(container.querySelector(".timeline-stage")).toBeInTheDocument();
  });

  it("uses a single center lane in mobile mode", () => {
    // Arrange
    const items = [
      createTimelineItem("coffee", 100),
      createTimelineItem("lunch", 1_000),
      createTimelineItem("groceries", 10_000),
    ];

    // Act
    const { container } = render(() => (
      <TimelineSection
        items={items}
        maybeCurrentQuoteLabel="$100,000"
        maybeSatsPerDollarLabel="1,000 sats"
        isMobileLayout
      />
    ));
    const timelineItems = Array.from(
      container.querySelectorAll<HTMLElement>(".timeline-item"),
    );

    // Assert
    expect(timelineItems).toHaveLength(3);
    expect(
      timelineItems.every((timelineItem) =>
        timelineItem.classList.contains("timeline-item--center"),
      ),
    ).toBe(true);
    expect(container.querySelector(".timeline-item--left")).not.toBeInTheDocument();
    expect(container.querySelector(".timeline-item--right")).not.toBeInTheDocument();
  });
});
