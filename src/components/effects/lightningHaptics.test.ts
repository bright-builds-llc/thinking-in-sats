import { afterEach, describe, expect, it, vi } from "vitest";

import { createLightningHaptics } from "./lightningHaptics";

function installNavigatorHaptics(
  vibrate: ((pattern: number | number[]) => boolean) | undefined,
  maximumTouchPoints = 0,
) {
  Object.defineProperty(navigator, "maxTouchPoints", {
    configurable: true,
    value: maximumTouchPoints,
  });
  Object.defineProperty(navigator, "vibrate", {
    configurable: true,
    value: vibrate,
  });
}

async function flushHapticRequest() {
  await Promise.resolve();
}

describe("createLightningHaptics", () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, "maxTouchPoints");
    Reflect.deleteProperty(navigator, "vibrate");
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("uses a short vibration for an emoji tap", async () => {
    // Arrange
    const vibrate = vi.fn(() => true);
    installNavigatorHaptics(vibrate);
    const haptics = createLightningHaptics();

    // Act
    haptics.tap();
    await flushHapticRequest();

    // Assert
    expect(vibrate).toHaveBeenCalledOnce();
    expect(vibrate).toHaveBeenCalledWith(12);
  });

  it("uses a stronger double-pulse vibration for a strike", async () => {
    // Arrange
    const vibrate = vi.fn(() => true);
    installNavigatorHaptics(vibrate);
    const haptics = createLightningHaptics();

    // Act
    haptics.strike();
    await flushHapticRequest();

    // Assert
    expect(vibrate).toHaveBeenCalledOnce();
    expect(vibrate).toHaveBeenCalledWith([35, 30, 70]);
  });

  it("lets a strike supersede a tap requested in the same turn", async () => {
    // Arrange
    const vibrate = vi.fn(() => true);
    installNavigatorHaptics(vibrate);
    const haptics = createLightningHaptics();

    // Act
    haptics.strike();
    haptics.tap();
    await flushHapticRequest();

    // Assert
    expect(vibrate).toHaveBeenCalledOnce();
    expect(vibrate).toHaveBeenCalledWith([35, 30, 70]);
  });

  it("uses an ephemeral hidden switch when vibration is unavailable", async () => {
    // Arrange
    installNavigatorHaptics(undefined, 1);
    const clickedLabels: HTMLLabelElement[] = [];
    vi.spyOn(HTMLLabelElement.prototype, "click").mockImplementation(
      function (this: HTMLLabelElement) {
        clickedLabels.push(this);
      },
    );
    const haptics = createLightningHaptics();

    // Act
    haptics.tap();
    await flushHapticRequest();

    // Assert
    const maybeClickedLabel = clickedLabels[0];
    expect(maybeClickedLabel).toBeDefined();

    if (!maybeClickedLabel) {
      throw new Error("Expected the legacy haptic label to be clicked.");
    }

    expect(maybeClickedLabel.getAttribute("aria-hidden")).toBe("true");
    expect(maybeClickedLabel.style.display).toBe("none");
    expect(
      maybeClickedLabel.querySelector('input[type="checkbox"][switch]'),
    ).not.toBeNull();
    expect(maybeClickedLabel.isConnected).toBe(false);
  });

  it("uses two legacy switch ticks for a strike", async () => {
    // Arrange
    vi.useFakeTimers();
    installNavigatorHaptics(() => false, 1);
    const clickSwitch = vi
      .spyOn(HTMLLabelElement.prototype, "click")
      .mockImplementation(() => undefined);
    const haptics = createLightningHaptics();

    // Act
    haptics.strike();
    await flushHapticRequest();

    // Assert
    expect(clickSwitch).toHaveBeenCalledOnce();

    // Act
    vi.advanceTimersByTime(80);

    // Assert
    expect(clickSwitch).toHaveBeenCalledTimes(2);
  });

  it("cancels a delayed legacy strike tick when disposed", async () => {
    // Arrange
    vi.useFakeTimers();
    installNavigatorHaptics(undefined, 1);
    const clickSwitch = vi
      .spyOn(HTMLLabelElement.prototype, "click")
      .mockImplementation(() => undefined);
    const haptics = createLightningHaptics();
    haptics.strike();
    await flushHapticRequest();

    // Act
    haptics.dispose();
    vi.advanceTimersByTime(80);

    // Assert
    expect(clickSwitch).toHaveBeenCalledOnce();
  });

  it("does nothing on a non-touch device without vibration", async () => {
    // Arrange
    installNavigatorHaptics(undefined, 0);
    const clickSwitch = vi.spyOn(HTMLLabelElement.prototype, "click");
    const haptics = createLightningHaptics();

    // Act
    haptics.tap();
    await flushHapticRequest();

    // Assert
    expect(clickSwitch).not.toHaveBeenCalled();
  });
});
