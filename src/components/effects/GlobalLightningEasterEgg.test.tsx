import { fireEvent, render, screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GlobalLightningEasterEgg } from "./GlobalLightningEasterEgg";

describe("GlobalLightningEasterEgg", () => {
  afterEach(() => {
    Reflect.deleteProperty(window, "matchMedia");
    vi.restoreAllMocks();
  });

  it("does not observe a button tap and still allows its click action", async () => {
    // Arrange
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { container } = render(() => (
      <>
        <GlobalLightningEasterEgg />
        <button onClick={onClick} type="button">
          Continue
        </button>
      </>
    ));

    // Act
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // Assert
    expect(onClick).toHaveBeenCalledOnce();
    expect(
      container.querySelector(".lightning-easter-egg__particle"),
    ).not.toBeInTheDocument();
  });

  it("activates the viewport strike after five rapid taps", () => {
    // Arrange
    const { container } = render(() => <GlobalLightningEasterEgg />);

    // Act
    for (let index = 0; index < 5; index += 1) {
      fireEvent.pointerDown(document.body, {
        button: 0,
        clientX: 100,
        clientY: 120,
        isPrimary: true,
        pointerId: 1,
      });
      fireEvent.pointerUp(document.body, {
        button: 0,
        clientX: 100,
        clientY: 120,
        isPrimary: true,
        pointerId: 1,
      });
    }

    // Assert
    expect(
      container.querySelector(".lightning-easter-egg__canvas"),
    ).toHaveAttribute("data-strike-active", "true");
    expect(
      container.querySelectorAll(".lightning-easter-egg__particle"),
    ).toHaveLength(5);
  });

  it("does not emit a particle for a drag", () => {
    // Arrange
    const { container } = render(() => <GlobalLightningEasterEgg />);

    // Act
    fireEvent.pointerDown(document.body, {
      button: 0,
      clientX: 20,
      clientY: 20,
      isPrimary: true,
      pointerId: 1,
    });
    fireEvent.pointerMove(document.body, {
      button: 0,
      clientX: 60,
      clientY: 20,
      isPrimary: true,
      pointerId: 1,
    });
    fireEvent.pointerUp(document.body, {
      button: 0,
      clientX: 60,
      clientY: 20,
      isPrimary: true,
      pointerId: 1,
    });

    // Assert
    expect(
      container.querySelector(".lightning-easter-egg__particle"),
    ).not.toBeInTheDocument();
  });

  it("emits one particle for each qualifying concurrent touch", () => {
    // Arrange
    const { container } = render(() => <GlobalLightningEasterEgg />);

    // Act
    fireEvent.pointerDown(document.body, {
      button: 0,
      clientX: 80,
      clientY: 100,
      isPrimary: true,
      pointerId: 1,
      pointerType: "touch",
    });
    fireEvent.pointerDown(document.body, {
      button: 0,
      clientX: 160,
      clientY: 100,
      isPrimary: false,
      pointerId: 2,
      pointerType: "touch",
    });
    fireEvent.pointerUp(document.body, {
      button: 0,
      clientX: 160,
      clientY: 100,
      isPrimary: false,
      pointerId: 2,
      pointerType: "touch",
    });
    fireEvent.pointerUp(document.body, {
      button: 0,
      clientX: 80,
      clientY: 100,
      isPrimary: true,
      pointerId: 1,
      pointerType: "touch",
    });

    // Assert
    expect(
      container.querySelectorAll(".lightning-easter-egg__particle"),
    ).toHaveLength(2);
  });

  it("uses static effects when reduced motion is preferred", async () => {
    // Arrange
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({
        addEventListener: vi.fn(),
        matches: true,
        removeEventListener: vi.fn(),
      }),
    });
    const user = userEvent.setup();
    const { container } = render(() => <GlobalLightningEasterEgg />);

    // Act
    await user.click(document.body);

    // Assert
    expect(
      container.querySelector(".lightning-easter-egg__particle--static"),
    ).toBeInTheDocument();
    expect(
      container.querySelector(".lightning-easter-egg__canvas"),
    ).toHaveAttribute("data-animation-active", "false");
  });
});
