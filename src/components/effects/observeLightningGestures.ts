import {
  isQualifyingPointerContact,
  isQualifyingPointerTap,
  registerRapidTap,
  type PointerTapContactCandidate,
} from "../../domain/rapidTapGesture";

type TouchGroup = {
  didEvaluateFiveContacts: boolean;
  maximumContactCount: number;
};

type ActivePointer = {
  button: number;
  hadConcurrentPointer: boolean;
  isEligibleTarget: boolean;
  isPrimary: boolean;
  maximumTravelPx: number;
  pointerType: string;
  startedAt: number;
  startX: number;
  startY: number;
  touchGroup: TouchGroup | null;
};

type QualifyingTap = {
  occurredAt: number;
  x: number;
  y: number;
};

type LightningGestureOptions = {
  onParticleTap: (tap: QualifyingTap) => void;
  onStrike: () => void;
};

const interactiveHeaderSelector = [
  "a",
  "button",
  "input",
  "select",
  "summary",
  "textarea",
  "[contenteditable='true']",
  "[role='button']",
  "[role='link']",
  "[role='menuitem']",
].join(",");

export function isEligibleLightningGestureTarget(
  target: EventTarget | null,
): boolean {
  if (!(target instanceof Element)) {
    return false;
  }

  const isInHeader = Boolean(
    target.closest('[data-lightning-gesture-region="header"]'),
  );

  if (isInHeader) {
    return !target.closest(interactiveHeaderSelector);
  }

  return target.matches(
    'html, body, #root, [data-lightning-gesture-region="background"]',
  );
}

function pointerTravel(
  activePointer: ActivePointer,
  event: PointerEvent,
): number {
  return Math.hypot(
    event.clientX - activePointer.startX,
    event.clientY - activePointer.startY,
  );
}

function pointerContactCandidate(
  activePointer: ActivePointer,
  occurredAt: number,
): PointerTapContactCandidate {
  return {
    button: activePointer.button,
    durationMs: Math.max(occurredAt - activePointer.startedAt, 0),
    maximumTravelPx: activePointer.maximumTravelPx,
  };
}

function isValidLightningContact(
  activePointer: ActivePointer,
  occurredAt: number,
): boolean {
  return (
    activePointer.isEligibleTarget &&
    isQualifyingPointerContact(
      pointerContactCandidate(activePointer, occurredAt),
    )
  );
}

export function observeLightningGestures(
  options: LightningGestureOptions,
): () => void {
  const activePointers = new Map<number, ActivePointer>();
  let currentTouchGroup: TouchGroup | null = null;
  let recentTapTimes: number[] = [];

  const activeTouchPointers = () =>
    [...activePointers.values()].filter(
      (activePointer) => activePointer.pointerType === "touch",
    );

  const maybeCompleteTouchGroup = () => {
    if (activeTouchPointers().length === 0) {
      currentTouchGroup = null;
    }
  };

  const maybeTriggerFiveFingerStrike = (occurredAt: number) => {
    const touchGroup = currentTouchGroup;

    if (!touchGroup || touchGroup.didEvaluateFiveContacts) {
      return;
    }

    const touchPointers = activeTouchPointers();

    if (touchPointers.length !== 5) {
      return;
    }

    touchGroup.didEvaluateFiveContacts = true;
    const allContactsAreValid = touchPointers.every((activePointer) =>
      isValidLightningContact(activePointer, occurredAt),
    );

    if (allContactsAreValid) {
      options.onStrike();
    }
  };

  const handlePointerDown = (event: PointerEvent) => {
    const hadConcurrentPointer = activePointers.size > 0;

    if (hadConcurrentPointer) {
      activePointers.forEach((activePointer) => {
        activePointer.hadConcurrentPointer = true;
      });
    }

    if (event.pointerType === "touch" && !currentTouchGroup) {
      currentTouchGroup = {
        didEvaluateFiveContacts: false,
        maximumContactCount: 0,
      };
    }

    activePointers.set(event.pointerId, {
      button: event.button,
      hadConcurrentPointer,
      isEligibleTarget: isEligibleLightningGestureTarget(event.target),
      isPrimary: event.isPrimary,
      maximumTravelPx: 0,
      pointerType: event.pointerType,
      startedAt: event.timeStamp,
      startX: event.clientX,
      startY: event.clientY,
      touchGroup: event.pointerType === "touch" ? currentTouchGroup : null,
    });

    if (event.pointerType === "touch" && currentTouchGroup) {
      currentTouchGroup.maximumContactCount = Math.max(
        currentTouchGroup.maximumContactCount,
        activeTouchPointers().length,
      );
      maybeTriggerFiveFingerStrike(event.timeStamp);
    }
  };

  const handlePointerMove = (event: PointerEvent) => {
    const maybeActivePointer = activePointers.get(event.pointerId);

    if (!maybeActivePointer) {
      return;
    }

    maybeActivePointer.maximumTravelPx = Math.max(
      maybeActivePointer.maximumTravelPx,
      pointerTravel(maybeActivePointer, event),
    );
  };

  const handlePointerCancel = (event: PointerEvent) => {
    activePointers.delete(event.pointerId);
    maybeCompleteTouchGroup();
  };

  const clearGestureState = () => {
    activePointers.clear();
    currentTouchGroup = null;
    recentTapTimes = [];
  };

  const registerSinglePointerTap = (
    activePointer: ActivePointer,
    occurredAt: number,
  ) => {
    if (!activePointer.isEligibleTarget) {
      return false;
    }

    const isQualifying = isQualifyingPointerTap({
      ...pointerContactCandidate(activePointer, occurredAt),
      hadConcurrentPointer: activePointer.hadConcurrentPointer,
      isPrimary: activePointer.isPrimary,
    });

    if (!isQualifying) {
      return false;
    }

    const rapidTapResult = registerRapidTap(recentTapTimes, occurredAt);
    recentTapTimes = rapidTapResult.recentTapTimes;

    if (rapidTapResult.didTrigger) {
      options.onStrike();
    }

    return true;
  };

  const handlePointerUp = (event: PointerEvent) => {
    const maybeActivePointer = activePointers.get(event.pointerId);
    activePointers.delete(event.pointerId);

    if (!maybeActivePointer) {
      return;
    }

    maybeActivePointer.maximumTravelPx = Math.max(
      maybeActivePointer.maximumTravelPx,
      pointerTravel(maybeActivePointer, event),
    );
    const touchGroup = maybeActivePointer.touchGroup;
    const isSingleTouch =
      maybeActivePointer.pointerType === "touch" &&
      touchGroup?.maximumContactCount === 1;
    const isSingleNonTouchPointer =
      maybeActivePointer.pointerType !== "touch" &&
      !maybeActivePointer.hadConcurrentPointer;
    let isQualifying = false;

    if (isSingleTouch || isSingleNonTouchPointer) {
      isQualifying = registerSinglePointerTap(
        maybeActivePointer,
        event.timeStamp,
      );
    } else if (maybeActivePointer.pointerType === "touch") {
      isQualifying = isValidLightningContact(
        maybeActivePointer,
        event.timeStamp,
      );
    }

    if (isQualifying) {
      options.onParticleTap({
        occurredAt: event.timeStamp,
        x: event.clientX,
        y: event.clientY,
      });
    }

    maybeCompleteTouchGroup();
  };

  const listenerOptions = { capture: true, passive: true } as const;
  window.addEventListener("pointerdown", handlePointerDown, listenerOptions);
  window.addEventListener("pointermove", handlePointerMove, listenerOptions);
  window.addEventListener("pointerup", handlePointerUp, listenerOptions);
  window.addEventListener(
    "pointercancel",
    handlePointerCancel,
    listenerOptions,
  );
  window.addEventListener("blur", clearGestureState, { passive: true });

  return () => {
    window.removeEventListener("pointerdown", handlePointerDown, true);
    window.removeEventListener("pointermove", handlePointerMove, true);
    window.removeEventListener("pointerup", handlePointerUp, true);
    window.removeEventListener("pointercancel", handlePointerCancel, true);
    window.removeEventListener("blur", clearGestureState);
  };
}
