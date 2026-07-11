type HapticKind = "strike" | "tap";

export type LightningHaptics = {
  dispose: () => void;
  strike: () => void;
  tap: () => void;
};

const tapVibrationDurationMs = 12;
const strikeVibrationPattern = [35, 30, 70];
const legacyStrikePulseDelayMs = 80;

function tryVibration(pattern: number | number[]): boolean {
  if (
    typeof navigator === "undefined" ||
    typeof navigator.vibrate !== "function"
  ) {
    return false;
  }

  return navigator.vibrate(pattern);
}

function canAttemptLegacySwitchHaptic(): boolean {
  return (
    typeof document !== "undefined" &&
    typeof navigator !== "undefined" &&
    navigator.maxTouchPoints > 0
  );
}

function triggerLegacySwitchHaptic() {
  const label = document.createElement("label");
  label.setAttribute("aria-hidden", "true");
  label.style.display = "none";

  const input = document.createElement("input");
  input.type = "checkbox";
  input.setAttribute("switch", "");
  label.append(input);

  document.head.append(label);
  label.click();
  label.remove();
}

export function createLightningHaptics(): LightningHaptics {
  const legacyPulseTimers = new Set<number>();
  let isDisposed = false;
  let isFlushScheduled = false;
  let maybePendingHaptic: HapticKind | null = null;

  const scheduleLegacyStrikePulse = () => {
    const timer = window.setTimeout(() => {
      legacyPulseTimers.delete(timer);

      if (!isDisposed) {
        triggerLegacySwitchHaptic();
      }
    }, legacyStrikePulseDelayMs);
    legacyPulseTimers.add(timer);
  };

  const play = (kind: HapticKind) => {
    const pattern =
      kind === "strike" ? strikeVibrationPattern : tapVibrationDurationMs;

    if (tryVibration(pattern) || !canAttemptLegacySwitchHaptic()) {
      return;
    }

    triggerLegacySwitchHaptic();

    if (kind === "strike") {
      scheduleLegacyStrikePulse();
    }
  };

  const flush = () => {
    isFlushScheduled = false;
    const maybeHaptic = maybePendingHaptic;
    maybePendingHaptic = null;

    if (isDisposed || !maybeHaptic) {
      return;
    }

    play(maybeHaptic);
  };

  const request = (kind: HapticKind) => {
    if (isDisposed) {
      return;
    }

    if (kind === "strike" || maybePendingHaptic === null) {
      maybePendingHaptic = kind;
    }

    if (isFlushScheduled) {
      return;
    }

    isFlushScheduled = true;
    queueMicrotask(flush);
  };

  const dispose = () => {
    isDisposed = true;
    maybePendingHaptic = null;
    legacyPulseTimers.forEach((timer) => window.clearTimeout(timer));
    legacyPulseTimers.clear();
  };

  return {
    dispose,
    strike: () => request("strike"),
    tap: () => request("tap"),
  };
}
