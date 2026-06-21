import { render, screen, waitFor } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { UsdRevealPopover } from "./UsdRevealPopover";

function installNoCssAnimationComputedStyle(): () => void {
  const originalGetComputedStyle = window.getComputedStyle;

  Object.defineProperty(window, "getComputedStyle", {
    configurable: true,
    value: (element: Element, pseudoElement?: string | null) => {
      const style = originalGetComputedStyle.call(window, element, pseudoElement);

      return new Proxy(style, {
        get(target, property, receiver) {
          if (property === "animationName") {
            return "none";
          }

          return Reflect.get(target, property, receiver);
        },
      });
    },
    writable: true,
  });

  return () => {
    Object.defineProperty(window, "getComputedStyle", {
      configurable: true,
      value: originalGetComputedStyle,
      writable: true,
    });
  };
}

function installReducedMotionMatchMedia(matches: boolean): () => void {
  const originalMatchMedia = window.matchMedia;

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn((query: string): MediaQueryList => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
    writable: true,
  });

  return () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: originalMatchMedia,
      writable: true,
    });
  };
}

describe("UsdRevealPopover", () => {
  it("keeps closing content mounted for the fade-out state", async () => {
    // Arrange
    const restoreComputedStyle = installNoCssAnimationComputedStyle();
    const user = userEvent.setup();

    try {
      render(() => <UsdRevealPopover approxUsdLabel="≈ $0.35" />);

      // Act
      await user.click(screen.getByRole("button", { name: "Reveal USD" }));
      const dialog = await screen.findByRole("dialog", {
        name: "Approximate dollar anchor",
      });

      // Assert
      expect(dialog).toHaveAttribute("data-expanded");
      expect(dialog).toHaveTextContent("≈ $0.35");

      // Act
      await user.keyboard("{Escape}");

      // Assert
      expect(dialog).toHaveAttribute("data-closed");
      await waitFor(
        () => {
          expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        },
        { timeout: 500 },
      );
    } finally {
      restoreComputedStyle();
    }
  });

  it("does not force-mount the close state when reduced motion is requested", async () => {
    // Arrange
    const restoreComputedStyle = installNoCssAnimationComputedStyle();
    const restoreMatchMedia = installReducedMotionMatchMedia(true);
    const user = userEvent.setup();

    try {
      render(() => <UsdRevealPopover approxUsdLabel="≈ $0.35" />);

      // Act
      await user.click(screen.getByRole("button", { name: "Reveal USD" }));
      await screen.findByRole("dialog", {
        name: "Approximate dollar anchor",
      });
      await user.keyboard("{Escape}");

      // Assert
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    } finally {
      restoreComputedStyle();
      restoreMatchMedia();
    }
  });
});
