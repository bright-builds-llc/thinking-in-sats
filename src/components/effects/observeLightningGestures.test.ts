import { createEvent, fireEvent } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";

import {
  isEligibleLightningGestureTarget,
  observeLightningGestures,
} from "./observeLightningGestures";

function touchDown(
  pointerId: number,
  x = pointerId * 30,
  target: Element = document.body,
) {
  fireEvent.pointerDown(target, {
    button: 0,
    clientX: x,
    clientY: 120,
    isPrimary: pointerId === 1,
    pointerId,
    pointerType: "touch",
  });
}

function touchDownAt(pointerId: number, occurredAt: number) {
  const event = createEvent.pointerDown(document.body, {
    button: 0,
    clientX: pointerId * 30,
    clientY: 120,
    isPrimary: pointerId === 1,
    pointerId,
    pointerType: "touch",
  });
  Object.defineProperty(event, "timeStamp", { value: occurredAt });
  fireEvent(document.body, event);
}

function touchMove(pointerId: number, x: number) {
  fireEvent.pointerMove(document.body, {
    button: 0,
    clientX: x,
    clientY: 120,
    isPrimary: pointerId === 1,
    pointerId,
    pointerType: "touch",
  });
}

function touchUp(
  pointerId: number,
  x = pointerId * 30,
  target: Element = document.body,
) {
  fireEvent.pointerUp(target, {
    button: 0,
    clientX: x,
    clientY: 120,
    isPrimary: pointerId === 1,
    pointerId,
    pointerType: "touch",
  });
}

function singleMouseTap(target: Element = document.body) {
  fireEvent.pointerDown(target, {
    button: 0,
    clientX: 100,
    clientY: 120,
    isPrimary: true,
    pointerId: 20,
    pointerType: "mouse",
  });
  fireEvent.pointerUp(target, {
    button: 0,
    clientX: 100,
    clientY: 120,
    isPrimary: true,
    pointerId: 20,
    pointerType: "mouse",
  });
}

describe("observeLightningGestures", () => {
  it("allows explicit page backgrounds and non-interactive header content", () => {
    // Arrange
    const background = document.createElement("main");
    background.dataset.lightningGestureRegion = "background";
    const header = document.createElement("header");
    header.dataset.lightningGestureRegion = "header";
    const headerCopy = document.createElement("span");
    header.append(headerCopy);

    // Act
    const isBackgroundEligible = isEligibleLightningGestureTarget(background);
    const isHeaderCopyEligible = isEligibleLightningGestureTarget(headerCopy);

    // Assert
    expect(isBackgroundEligible).toBe(true);
    expect(isHeaderCopyEligible).toBe(true);
  });

  it("rejects foreground content and interactive header controls", () => {
    // Arrange
    const background = document.createElement("main");
    background.dataset.lightningGestureRegion = "background";
    const panel = document.createElement("article");
    background.append(panel);
    const header = document.createElement("header");
    header.dataset.lightningGestureRegion = "header";
    const menuButton = document.createElement("button");
    header.append(menuButton);

    // Act
    const isPanelEligible = isEligibleLightningGestureTarget(panel);
    const isMenuButtonEligible = isEligibleLightningGestureTarget(menuButton);

    // Assert
    expect(isPanelEligible).toBe(false);
    expect(isMenuButtonEligible).toBe(false);
  });

  it("does not emit or advance rapid taps from a foreground target", () => {
    // Arrange
    const onParticleTap = vi.fn();
    const onStrike = vi.fn();
    const stopObserving = observeLightningGestures({
      onParticleTap,
      onStrike,
    });
    const background = document.createElement("div");
    background.dataset.lightningGestureRegion = "background";
    const panel = document.createElement("article");
    background.append(panel);
    document.body.append(background);

    // Act
    for (let index = 0; index < 5; index += 1) {
      singleMouseTap(panel);
    }
    for (let index = 0; index < 4; index += 1) {
      singleMouseTap(background);
    }

    // Assert
    expect(onParticleTap).toHaveBeenCalledTimes(4);
    expect(onStrike).not.toHaveBeenCalled();
    stopObserving();
    background.remove();
  });

  it("rejects a five-finger group containing a foreground contact", () => {
    // Arrange
    const onStrike = vi.fn();
    const stopObserving = observeLightningGestures({
      onParticleTap: vi.fn(),
      onStrike,
    });
    const background = document.createElement("div");
    background.dataset.lightningGestureRegion = "background";
    const panel = document.createElement("article");
    background.append(panel);
    document.body.append(background);
    for (let pointerId = 1; pointerId <= 4; pointerId += 1) {
      touchDown(pointerId, pointerId * 30, background);
    }

    // Act
    touchDown(5, 150, panel);

    // Assert
    expect(onStrike).not.toHaveBeenCalled();
    stopObserving();
    background.remove();
  });

  it("triggers once when the fifth valid touch contact lands", () => {
    // Arrange
    const onStrike = vi.fn();
    const stopObserving = observeLightningGestures({
      onParticleTap: vi.fn(),
      onStrike,
    });

    // Act
    for (let pointerId = 1; pointerId <= 4; pointerId += 1) {
      touchDown(pointerId);
    }

    // Assert
    expect(onStrike).not.toHaveBeenCalled();

    // Act
    touchDown(5);
    touchDown(6);

    // Assert
    expect(onStrike).toHaveBeenCalledOnce();

    // Act
    for (let pointerId = 1; pointerId <= 6; pointerId += 1) {
      touchUp(pointerId);
    }

    // Assert
    expect(onStrike).toHaveBeenCalledOnce();
    stopObserving();
  });

  it("does not trigger when an active finger moved before the fifth contact", () => {
    // Arrange
    const onStrike = vi.fn();
    const stopObserving = observeLightningGestures({
      onParticleTap: vi.fn(),
      onStrike,
    });
    for (let pointerId = 1; pointerId <= 4; pointerId += 1) {
      touchDown(pointerId);
    }
    touchMove(1, 80);

    // Act
    touchDown(5);

    // Assert
    expect(onStrike).not.toHaveBeenCalled();
    stopObserving();
  });

  it("does not trigger when an active finger is too old at fifth contact", () => {
    // Arrange
    const onStrike = vi.fn();
    const stopObserving = observeLightningGestures({
      onParticleTap: vi.fn(),
      onStrike,
    });
    touchDownAt(1, 0);
    touchDownAt(2, 100);
    touchDownAt(3, 100);
    touchDownAt(4, 100);

    // Act
    touchDownAt(5, 601);

    // Assert
    expect(onStrike).not.toHaveBeenCalled();
    stopObserving();
  });

  it("emits clean multi-touch contacts without advancing rapid taps", () => {
    // Arrange
    const onParticleTap = vi.fn();
    const onStrike = vi.fn();
    const stopObserving = observeLightningGestures({
      onParticleTap,
      onStrike,
    });
    touchDown(1);
    touchDown(2);
    touchUp(1);
    touchUp(2);

    // Act
    singleMouseTap();

    // Assert
    expect(onParticleTap).toHaveBeenCalledTimes(3);
    expect(onStrike).not.toHaveBeenCalled();

    // Act
    for (let index = 0; index < 4; index += 1) {
      singleMouseTap();
    }

    // Assert
    expect(onStrike).toHaveBeenCalledOnce();
    stopObserving();
  });

  it("emits only the qualifying fingers from a mixed multi-touch group", () => {
    // Arrange
    const onParticleTap = vi.fn();
    const stopObserving = observeLightningGestures({
      onParticleTap,
      onStrike: vi.fn(),
    });
    touchDown(1);
    touchDown(2);
    touchDown(3);
    touchMove(1, 80);
    fireEvent.pointerCancel(document.body, {
      pointerId: 2,
      pointerType: "touch",
    });

    // Act
    touchUp(1, 80);
    touchUp(3);

    // Assert
    expect(onParticleTap).toHaveBeenCalledOnce();
    expect(onParticleTap).toHaveBeenCalledWith(
      expect.objectContaining({ x: 90, y: 120 }),
    );
    stopObserving();
  });
});
