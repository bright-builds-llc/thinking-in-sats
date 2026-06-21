import { describe, expect, it } from "vitest";

import { buildInfoSummary, type BuildInfo } from "./buildInfo";

describe("buildInfoSummary", () => {
  it("formats build provenance as one copyable line", () => {
    // Arrange
    const buildInfo: BuildInfo = {
      version: "0.1.0",
      commit: "abcdef1234567890",
      builtAt: "2026-04-08T00:00:00.000Z",
    };

    // Act
    const summary = buildInfoSummary(buildInfo);

    // Assert
    expect(summary).toBe(
      "version=0.1.0 commit=abcdef1234567890 builtAt=2026-04-08T00:00:00.000Z",
    );
  });

  it("keeps unavailable fields visible in the copyable line", () => {
    // Arrange
    const buildInfo: BuildInfo = {
      version: "Unavailable",
      commit: "Unavailable",
      builtAt: "Unavailable",
    };

    // Act
    const summary = buildInfoSummary(buildInfo);

    // Assert
    expect(summary).toBe(
      "version=Unavailable commit=Unavailable builtAt=Unavailable",
    );
  });
});
