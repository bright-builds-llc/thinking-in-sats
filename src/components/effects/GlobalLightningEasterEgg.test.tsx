import { fireEvent, render, screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GlobalLightningEasterEgg } from "./GlobalLightningEasterEgg";

function installVibrationMock() {
  const vibrate = vi.fn(() => true);
  Object.defineProperty(navigator, "vibrate", {
    configurable: true,
    value: vibrate,
  });
  return vibrate;
}

async function flushHapticRequest() {
  await Promise.resolve();
}

describe("GlobalLightningEasterEgg", () => {
  afterEach(() => {
    Reflect.deleteProperty(window, "matchMedia");
    Reflect.deleteProperty(navigator, "vibrate");
    vi.restoreAllMocks();
  });

  it("does not observe a button tap and still allows its click action", async () => {
    // Arrange
    const user = userEvent.setup();
    const onClick = vi.fn();
    const vibrate = installVibrationMock();
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
    expect(vibrate).not.toHaveBeenCalled();
    expect(
      container.querySelector(".lightning-easter-egg__particle"),
    ).not.toBeInTheDocument();
  });

  it("uses tap haptics before a stronger fifth-tap strike", async () => {
    // Arrange
    const vibrate = installVibrationMock();
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
      await flushHapticRequest();
    }

    // Assert
    expect(
      container.querySelector(".lightning-easter-egg__canvas"),
    ).toHaveAttribute("data-strike-active", "true");
    expect(
      container.querySelectorAll(".lightning-easter-egg__particle"),
    ).toHaveLength(5);
    expect(vibrate).toHaveBeenCalledTimes(5);
    for (let callIndex = 1; callIndex <= 4; callIndex += 1) {
      expect(vibrate).toHaveBeenNthCalledWith(callIndex, 12);
    }
    expect(vibrate).toHaveBeenNthCalledWith(5, [35, 30, 70]);
  });

  it("requests feedback for header content but not foreground panels", async () => {
    // Arrange
    const vibrate = installVibrationMock();
    render(() => (
      <>
        <GlobalLightningEasterEgg />
        <header data-lightning-gesture-region="header">
          <span>Header background</span>
        </header>
        <main data-lightning-gesture-region="background">
          <article>Foreground panel</article>
        </main>
      </>
    ));
    const headerCopy = screen.getByText("Header background");
    const panel = screen.getByText("Foreground panel");

    // Act
    fireEvent.pointerDown(headerCopy, {
      button: 0,
      isPrimary: true,
      pointerId: 1,
    });
    fireEvent.pointerUp(headerCopy, {
      button: 0,
      isPrimary: true,
      pointerId: 1,
    });
    await flushHapticRequest();
    fireEvent.pointerDown(panel, {
      button: 0,
      isPrimary: true,
      pointerId: 1,
    });
    fireEvent.pointerUp(panel, {
      button: 0,
      isPrimary: true,
      pointerId: 1,
    });
    await flushHapticRequest();

    // Assert
    expect(vibrate).toHaveBeenCalledOnce();
    expect(vibrate).toHaveBeenCalledWith(12);
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

  it("emits one particle and haptic for each qualifying concurrent touch", async () => {
    // Arrange
    const vibrate = installVibrationMock();
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
    await flushHapticRequest();
    fireEvent.pointerUp(document.body, {
      button: 0,
      clientX: 80,
      clientY: 100,
      isPrimary: true,
      pointerId: 1,
      pointerType: "touch",
    });
    await flushHapticRequest();

    // Assert
    expect(
      container.querySelectorAll(".lightning-easter-egg__particle"),
    ).toHaveLength(2);
    expect(vibrate).toHaveBeenCalledTimes(2);
    expect(vibrate).toHaveBeenNthCalledWith(1, 12);
    expect(vibrate).toHaveBeenNthCalledWith(2, 12);
  });

  it("uses strike feedback on fifth contact before fingertip haptics", async () => {
    // Arrange
    const vibrate = installVibrationMock();
    const { container } = render(() => <GlobalLightningEasterEgg />);
    for (let pointerId = 1; pointerId <= 5; pointerId += 1) {
      fireEvent.pointerDown(document.body, {
        button: 0,
        clientX: pointerId * 40,
        clientY: 100,
        isPrimary: pointerId === 1,
        pointerId,
        pointerType: "touch",
      });
    }
    await flushHapticRequest();

    // Act
    for (let pointerId = 1; pointerId <= 5; pointerId += 1) {
      fireEvent.pointerUp(document.body, {
        button: 0,
        clientX: pointerId * 40,
        clientY: 100,
        isPrimary: pointerId === 1,
        pointerId,
        pointerType: "touch",
      });
      await flushHapticRequest();
    }

    // Assert
    expect(vibrate).toHaveBeenCalledTimes(6);
    expect(vibrate).toHaveBeenNthCalledWith(1, [35, 30, 70]);
    for (let callIndex = 2; callIndex <= 6; callIndex += 1) {
      expect(vibrate).toHaveBeenNthCalledWith(callIndex, 12);
    }
    expect(
      container.querySelectorAll(".lightning-easter-egg__particle"),
    ).toHaveLength(5);
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
    const vibrate = installVibrationMock();
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
    expect(vibrate).toHaveBeenCalledWith(12);
  });
});
