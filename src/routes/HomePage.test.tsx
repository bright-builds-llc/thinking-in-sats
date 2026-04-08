import { render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { QuoteState } from "../domain/quoteCache";
import type { BuildInfo } from "../services/buildInfo";
import { HomePage } from "./HomePage";

function mockMatchMedia(matches: boolean) {
  const matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: matchMedia,
    writable: true,
  });
}

const buildInfo: BuildInfo = {
  version: "0.1.0",
  commit: "abc123",
  builtAt: "2026-04-08T00:00:00.000Z",
};

const quoteState: QuoteState = {
  status: "ready",
  currentQuote: {
    usdPerBitcoin: 100_000,
    fetchedAt: 1_710_000_000_000,
    source: "coingecko",
  },
  maybeError: null,
  isStale: false,
};

afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(window, "matchMedia");
});

describe("HomePage", () => {
  it("keeps the timeline in desktop lanes above the mobile breakpoint", () => {
    // Arrange
    mockMatchMedia(false);

    // Act
    const { container } = render(
      () => <HomePage quoteState={quoteState} buildInfo={buildInfo} />,
      { location: "/" },
    );

    // Assert
    expect(container.querySelector(".timeline-item--left")).toBeInTheDocument();
    expect(container.querySelector(".timeline-item--right")).toBeInTheDocument();
    expect(container.querySelector(".timeline-item--center")).not.toBeInTheDocument();
  });

  it("switches the timeline into the mobile lane at the mobile breakpoint", () => {
    // Arrange
    mockMatchMedia(true);

    // Act
    const { container } = render(
      () => <HomePage quoteState={quoteState} buildInfo={buildInfo} />,
      { location: "/" },
    );

    // Assert
    expect(container.querySelector(".timeline-item--center")).toBeInTheDocument();
    expect(container.querySelector(".timeline-item--left")).not.toBeInTheDocument();
    expect(container.querySelector(".timeline-item--right")).not.toBeInTheDocument();
  });
});
