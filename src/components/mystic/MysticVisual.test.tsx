import { render, screen } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MysticNumberTicker, MysticText } from "./MysticVisual";

function mockReducedMotion(matches: boolean) {
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

afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(window, "matchMedia");
});

describe("MysticVisual", () => {
  it("renders static text when reduced motion is preferred", () => {
    // Arrange
    mockReducedMotion(true);

    // Act
    render(() => (
      <MysticText as="h1" class="title">
        Thinking In Sats
      </MysticText>
    ));

    // Assert
    expect(
      screen.getByRole("heading", { level: 1, name: "Thinking In Sats" }),
    ).toHaveClass("title");
  });

  it("renders formatted number text when reduced motion is preferred", () => {
    // Arrange
    mockReducedMotion(true);

    // Act
    render(() => (
      <MysticNumberTicker
        accessibleLabel="$100,000 per bitcoin"
        formattedValue="$100,000"
        value={100_000}
      />
    ));

    // Assert
    expect(screen.getByLabelText("$100,000 per bitcoin")).toHaveTextContent(
      "$100,000",
    );
  });
});
