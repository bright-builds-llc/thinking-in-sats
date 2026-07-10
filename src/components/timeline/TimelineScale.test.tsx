import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";

import { TimelineScale } from "./TimelineScale";

describe("TimelineScale", () => {
  it("renders a decorative zigzag at the center of each compressed range", () => {
    // Arrange
    const timelineBreak = {
      endPosition: 0.4,
      maximumSats: 10_000,
      minimumSats: 1_000,
      startPosition: 0.2,
    };

    // Act
    const { container } = render(() => (
      <TimelineScale
        breaks={[timelineBreak]}
        markers={[{ label: "1k sats", position: 0.2, valueSats: 1_000 }]}
      />
    ));
    const zigzag = container.querySelector<HTMLElement>(
      ".timeline-scale__break",
    );

    // Assert
    expect(container.querySelector(".timeline-scale")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(Number.parseFloat(zigzag?.style.top ?? "")).toBeCloseTo(30);
    expect(zigzag).toHaveAttribute("data-minimum-sats", "1000");
    expect(zigzag).toHaveAttribute("data-maximum-sats", "10000");
    expect(zigzag?.querySelector("path")).toBeInTheDocument();
  });
});
