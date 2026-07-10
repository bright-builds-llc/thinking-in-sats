import type {
  EverydayItemWithSats,
  TimelineLane,
  TimelineMark,
  TimelinePlacement,
} from "./itemTypes";
import { formatSatRangeLabel } from "./formatting";

export type TimelineMode = "desktop" | "mobile";

export type TimelineBreak = {
  endPosition: number;
  maximumSats: number;
  minimumSats: number;
  startPosition: number;
};

export type TimelineLayout = {
  breaks: TimelineBreak[];
  marks: TimelineMark[];
  placements: TimelinePlacement[];
  stageHeightRem: number;
};

type TimelineDomain = {
  maximumLog: number;
  minimumLog: number;
};

type PositionBlock = {
  endIndex: number;
  mean: number;
  startIndex: number;
  weight: number;
};

type ProtectedAxisPoint = {
  position: number;
  valueSats: number;
};

type BreakCandidate = {
  endPosition: number;
  maximumSats: number;
  minimumSats: number;
  originalSpanRem: number;
  startPosition: number;
};

type AppliedBreak = BreakCandidate & {
  reductionRem: number;
};

type TimelineAxisCompression = {
  breaks: TimelineBreak[];
  mapPosition: (position: number) => number;
  stageHeightRem: number;
};

const desktopCardSlotRem = 14.5;
const desktopBreakTargetRem = 8;
const desktopBreakThresholdRem = 30;
// Extra stage room keeps dense lanes from turning into uniform rows with long connector detours.
const desktopDensitySlack = 1.5;
const desktopDecadeHeightRem = 12;
const desktopMinimumStageHeightRem = 44;
const positionTolerance = 0.000000001;

function toLogPosition(sats: number): number {
  return Math.log10(Math.max(1, sats));
}

function buildTimelineDomain(
  minimumSats: number,
  maximumSats: number,
): TimelineDomain {
  const minimumLog = Math.floor(toLogPosition(minimumSats));
  const maximumLog = Math.max(
    minimumLog + 1,
    Math.ceil(toLogPosition(maximumSats)),
  );

  return { maximumLog, minimumLog };
}

function normalizePosition(value: number, domain: TimelineDomain): number {
  return (
    (value - domain.minimumLog) /
    (domain.maximumLog - domain.minimumLog)
  );
}

function clampPosition(
  position: number,
  minimumPosition: number,
  maximumPosition: number,
): number {
  return Math.min(maximumPosition, Math.max(minimumPosition, position));
}

function laneForIndex(index: number, mode: TimelineMode): TimelineLane {
  if (mode === "mobile") {
    return "center";
  }

  return index % 2 === 0 ? "left" : "right";
}

function buildMarksForDomain(domain: TimelineDomain): TimelineMark[] {
  const marks: TimelineMark[] = [];

  for (
    let exponent = domain.minimumLog;
    exponent <= domain.maximumLog;
    exponent += 1
  ) {
    const valueSats = 10 ** exponent;
    marks.push({
      valueSats,
      label: formatSatRangeLabel(valueSats),
      position: normalizePosition(exponent, domain),
    });
  }

  return marks;
}

function maximumDesktopLaneCount(placements: TimelinePlacement[]): number {
  const leftLaneCount = placements.filter(
    (placement) => placement.lane === "left",
  ).length;
  const rightLaneCount = placements.filter(
    (placement) => placement.lane === "right",
  ).length;

  return Math.max(1, leftLaneCount, rightLaneCount);
}

function buildMinimumDesktopStageHeightRem(
  placements: TimelinePlacement[],
): number {
  return Math.max(
    desktopMinimumStageHeightRem,
    maximumDesktopLaneCount(placements) * desktopCardSlotRem,
  );
}

function buildDesktopStageHeightRem(
  placements: TimelinePlacement[],
  domain: TimelineDomain,
): number {
  const densityHeightRem =
    maximumDesktopLaneCount(placements) *
    desktopCardSlotRem *
    desktopDensitySlack;
  const decadeHeightRem =
    (domain.maximumLog - domain.minimumLog) * desktopDecadeHeightRem;

  return Math.max(
    buildMinimumDesktopStageHeightRem(placements),
    densityHeightRem,
    decadeHeightRem,
  );
}

function buildProtectedAxisPoints(
  marks: TimelineMark[],
  placements: TimelinePlacement[],
): ProtectedAxisPoint[] {
  const sortedPoints = [
    ...marks.map((mark) => ({
      position: mark.position,
      valueSats: mark.valueSats,
    })),
    ...placements.map((placement) => ({
      position: placement.exactPosition,
      valueSats: placement.item.satValue,
    })),
  ].sort((leftPoint, rightPoint) => leftPoint.position - rightPoint.position);
  const protectedPoints: ProtectedAxisPoint[] = [];

  for (const point of sortedPoints) {
    const maybePreviousPoint = protectedPoints[protectedPoints.length - 1];

    if (
      maybePreviousPoint &&
      Math.abs(point.position - maybePreviousPoint.position) <=
        positionTolerance
    ) {
      continue;
    }

    protectedPoints.push(point);
  }

  return protectedPoints;
}

function findBreakCandidates(
  protectedPoints: ProtectedAxisPoint[],
  uncompressedStageHeightRem: number,
): BreakCandidate[] {
  const candidates: BreakCandidate[] = [];

  for (let index = 1; index < protectedPoints.length; index += 1) {
    const startPoint = protectedPoints[index - 1];
    const endPoint = protectedPoints[index];
    const originalSpanRem =
      (endPoint.position - startPoint.position) *
      uncompressedStageHeightRem;

    if (originalSpanRem + positionTolerance < desktopBreakThresholdRem) {
      continue;
    }

    candidates.push({
      endPosition: endPoint.position,
      maximumSats: endPoint.valueSats,
      minimumSats: startPoint.valueSats,
      originalSpanRem,
      startPosition: startPoint.position,
    });
  }

  return candidates;
}

function buildAxisCompression(
  marks: TimelineMark[],
  placements: TimelinePlacement[],
  uncompressedStageHeightRem: number,
): TimelineAxisCompression {
  if (placements.length < 2) {
    return {
      breaks: [],
      mapPosition: (position) => position,
      stageHeightRem: uncompressedStageHeightRem,
    };
  }

  const protectedPoints = buildProtectedAxisPoints(marks, placements);
  const candidates = findBreakCandidates(
    protectedPoints,
    uncompressedStageHeightRem,
  );
  const desiredReductionRem = candidates.reduce(
    (totalReductionRem, candidate) =>
      totalReductionRem +
      Math.max(0, candidate.originalSpanRem - desktopBreakTargetRem),
    0,
  );
  const minimumStageHeightRem =
    buildMinimumDesktopStageHeightRem(placements);
  const maximumReductionRem = Math.max(
    0,
    uncompressedStageHeightRem - minimumStageHeightRem,
  );
  const reductionScale =
    desiredReductionRem === 0
      ? 0
      : Math.min(1, maximumReductionRem / desiredReductionRem);
  const appliedBreaks: AppliedBreak[] = candidates.flatMap((candidate) => {
    const reductionRem =
      Math.max(0, candidate.originalSpanRem - desktopBreakTargetRem) *
      reductionScale;

    if (reductionRem <= positionTolerance) {
      return [];
    }

    return [{ ...candidate, reductionRem }];
  });
  const totalReductionRem = appliedBreaks.reduce(
    (sum, timelineBreak) => sum + timelineBreak.reductionRem,
    0,
  );
  const stageHeightRem = uncompressedStageHeightRem - totalReductionRem;
  const mapPosition = (position: number) => {
    let removedRem = 0;

    for (const timelineBreak of appliedBreaks) {
      if (position >= timelineBreak.endPosition) {
        removedRem += timelineBreak.reductionRem;
        continue;
      }

      if (position <= timelineBreak.startPosition) {
        break;
      }

      const progressThroughBreak =
        (position - timelineBreak.startPosition) /
        (timelineBreak.endPosition - timelineBreak.startPosition);
      removedRem += timelineBreak.reductionRem * progressThroughBreak;
      break;
    }

    const mappedPosition =
      (position * uncompressedStageHeightRem - removedRem) /
      stageHeightRem;

    return clampPosition(mappedPosition, 0, 1);
  };

  return {
    breaks: appliedBreaks.map((timelineBreak) => ({
      endPosition: mapPosition(timelineBreak.endPosition),
      maximumSats: timelineBreak.maximumSats,
      minimumSats: timelineBreak.minimumSats,
      startPosition: mapPosition(timelineBreak.startPosition),
    })),
    mapPosition,
    stageHeightRem,
  };
}

function resolveLaneDisplayPositions(
  exactPositions: number[],
  stageHeightRem: number,
): number[] {
  if (exactPositions.length === 0) {
    return [];
  }

  const minimumGap = desktopCardSlotRem / stageHeightRem;
  const edgePadding = minimumGap / 2;
  const minimumPosition = edgePadding;
  const maximumPosition = 1 - edgePadding;
  const maximumBlockPosition =
    maximumPosition - (exactPositions.length - 1) * minimumGap;

  if (maximumBlockPosition < minimumPosition - positionTolerance) {
    throw new Error("Desktop timeline stage cannot fit its lane placements.");
  }

  const transformedPositions = exactPositions.map((position, index) =>
    clampPosition(
      position - index * minimumGap,
      minimumPosition,
      maximumBlockPosition,
    ),
  );
  const positionBlocks: PositionBlock[] = [];

  // Removing the required gap turns collision avoidance into an isotonic fit,
  // which keeps cards as close as possible to their exact logarithmic anchors.
  transformedPositions.forEach((position, index) => {
    positionBlocks.push({
      endIndex: index,
      mean: position,
      startIndex: index,
      weight: 1,
    });

    while (
      positionBlocks.length > 1 &&
      positionBlocks[positionBlocks.length - 2].mean >
        positionBlocks[positionBlocks.length - 1].mean
    ) {
      const leftBlock = positionBlocks[positionBlocks.length - 2];
      const rightBlock = positionBlocks[positionBlocks.length - 1];
      const weight = leftBlock.weight + rightBlock.weight;

      positionBlocks.splice(positionBlocks.length - 2, 2, {
        endIndex: rightBlock.endIndex,
        mean:
          (leftBlock.mean * leftBlock.weight +
            rightBlock.mean * rightBlock.weight) /
          weight,
        startIndex: leftBlock.startIndex,
        weight,
      });
    }
  });

  const displayPositions = new Array<number>(exactPositions.length);

  for (const block of positionBlocks) {
    for (let index = block.startIndex; index <= block.endIndex; index += 1) {
      displayPositions[index] = block.mean + index * minimumGap;
    }
  }

  return displayPositions;
}

function resolveDesktopPlacements(
  placements: TimelinePlacement[],
  stageHeightRem: number,
): TimelinePlacement[] {
  const resolvedPlacements = placements.map((placement) => ({ ...placement }));

  for (const lane of ["left", "right"] as const) {
    const laneIndexes = resolvedPlacements.flatMap((placement, index) =>
      placement.lane === lane ? [index] : [],
    );
    const displayPositions = resolveLaneDisplayPositions(
      laneIndexes.map(
        (placementIndex) =>
          resolvedPlacements[placementIndex].exactPosition,
      ),
      stageHeightRem,
    );

    laneIndexes.forEach((placementIndex, laneIndex) => {
      resolvedPlacements[placementIndex].displayPosition =
        displayPositions[laneIndex];
    });
  }

  return resolvedPlacements;
}

export function buildTimelineLayout(
  items: EverydayItemWithSats[],
  mode: TimelineMode,
): TimelineLayout {
  if (items.length === 0) {
    return {
      breaks: [],
      marks: [],
      placements: [],
      stageHeightRem: desktopMinimumStageHeightRem,
    };
  }

  const sortedItems = [...items].sort(
    (leftItem, rightItem) => leftItem.satValue - rightItem.satValue,
  );
  const domain = buildTimelineDomain(
    sortedItems[0].satValue,
    sortedItems[sortedItems.length - 1].satValue,
  );
  const marks = buildMarksForDomain(domain);
  const placements = sortedItems.map((item, index) => {
    const exactPosition = normalizePosition(
      toLogPosition(item.satValue),
      domain,
    );

    return {
      item,
      exactPosition,
      displayPosition: exactPosition,
      lane: laneForIndex(index, mode),
    };
  });
  const uncompressedStageHeightRem = buildDesktopStageHeightRem(
    placements,
    domain,
  );

  if (mode === "mobile") {
    return {
      breaks: [],
      marks,
      placements,
      stageHeightRem: uncompressedStageHeightRem,
    };
  }

  const axisCompression = buildAxisCompression(
    marks,
    placements,
    uncompressedStageHeightRem,
  );
  const compressedMarks = marks.map((mark) => ({
    ...mark,
    position: axisCompression.mapPosition(mark.position),
  }));
  const compressedPlacements = placements.map((placement) => {
    const exactPosition = axisCompression.mapPosition(
      placement.exactPosition,
    );

    return {
      ...placement,
      displayPosition: exactPosition,
      exactPosition,
    };
  });

  return {
    breaks: axisCompression.breaks,
    marks: compressedMarks,
    placements: resolveDesktopPlacements(
      compressedPlacements,
      axisCompression.stageHeightRem,
    ),
    stageHeightRem: axisCompression.stageHeightRem,
  };
}
