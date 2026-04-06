import type {
  EverydayItemWithSats,
  TimelineMark,
  TimelinePlacement,
} from "./itemTypes";
import { formatSatRangeLabel } from "./formatting";

export type TimelineMode = "desktop" | "mobile";

const minimumGapByMode: Record<TimelineMode, number> = {
  desktop: 0.09,
  mobile: 0.11,
};

function toLogPosition(sats: number): number {
  return Math.log10(Math.max(1, sats));
}

function normalizePosition(value: number, minValue: number, maxValue: number): number {
  if (maxValue <= minValue) {
    return 0.5;
  }

  return (value - minValue) / (maxValue - minValue);
}

function clampPosition(position: number): number {
  return Math.min(1, Math.max(0, position));
}

function resolveDisplayPositions(
  exactPositions: number[],
  minimumGap: number,
): number[] {
  if (exactPositions.length === 0) {
    return [];
  }

  const displayPositions = [...exactPositions];

  for (let index = 1; index < displayPositions.length; index += 1) {
    const minimumAllowed = displayPositions[index - 1] + minimumGap;

    if (displayPositions[index] < minimumAllowed) {
      displayPositions[index] = minimumAllowed;
    }
  }

  const overflow = displayPositions[displayPositions.length - 1] - 1;

  if (overflow > 0) {
    for (let index = displayPositions.length - 1; index >= 0; index -= 1) {
      displayPositions[index] -= overflow;

      if (index < displayPositions.length - 1) {
        const maximumAllowed = displayPositions[index + 1] - minimumGap;
        displayPositions[index] = Math.min(displayPositions[index], maximumAllowed);
      }
    }
  }

  const underflow = displayPositions[0];

  if (underflow < 0) {
    for (let index = 0; index < displayPositions.length; index += 1) {
      displayPositions[index] -= underflow;
    }
  }

  return displayPositions.map(clampPosition);
}

function laneForIndex(index: number, mode: TimelineMode) {
  if (mode === "mobile") {
    return "center" as const;
  }

  return index % 2 === 0 ? ("left" as const) : ("right" as const);
}

export function buildTimelineMarks(
  minimumSats: number,
  maximumSats: number,
): TimelineMark[] {
  const minimumExponent = Math.floor(toLogPosition(minimumSats));
  const maximumExponent = Math.ceil(toLogPosition(maximumSats));
  const marks: TimelineMark[] = [];

  for (let exponent = minimumExponent; exponent <= maximumExponent; exponent += 1) {
    const valueSats = 10 ** exponent;
    marks.push({
      valueSats,
      label: formatSatRangeLabel(valueSats),
      position: normalizePosition(exponent, minimumExponent, maximumExponent),
    });
  }

  return marks;
}

export function buildTimelinePlacements(
  items: EverydayItemWithSats[],
  mode: TimelineMode,
): TimelinePlacement[] {
  if (items.length === 0) {
    return [];
  }

  const sortedItems = [...items].sort(
    (leftItem, rightItem) => leftItem.satValue - rightItem.satValue,
  );
  const minimumLog = toLogPosition(sortedItems[0].satValue);
  const maximumLog = toLogPosition(sortedItems[sortedItems.length - 1].satValue);
  const exactPositions = sortedItems.map((item) =>
    normalizePosition(toLogPosition(item.satValue), minimumLog, maximumLog),
  );
  const displayPositions = resolveDisplayPositions(
    exactPositions,
    minimumGapByMode[mode],
  );

  return sortedItems.map((item, index) => ({
    item,
    exactPosition: exactPositions[index],
    displayPosition: displayPositions[index],
    lane: laneForIndex(index, mode),
  }));
}
