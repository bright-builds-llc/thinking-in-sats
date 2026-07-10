import type {
  EverydayItemWithSats,
  TimelineLane,
  TimelineMark,
  TimelinePlacement,
} from "./itemTypes";
import { formatSatRangeLabel } from "./formatting";

export type TimelineMode = "desktop" | "mobile";

export type TimelineLayout = {
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

const desktopCardSlotRem = 14.5;
// Extra stage room keeps dense lanes from turning into uniform rows with long connector detours.
const desktopDensitySlack = 1.5;
const desktopDecadeHeightRem = 12;
const desktopMinimumStageHeightRem = 44;

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

function buildDesktopStageHeightRem(
  placements: TimelinePlacement[],
  domain: TimelineDomain,
): number {
  const leftLaneCount = placements.filter(
    (placement) => placement.lane === "left",
  ).length;
  const rightLaneCount = placements.filter(
    (placement) => placement.lane === "right",
  ).length;
  const maximumLaneCount = Math.max(1, leftLaneCount, rightLaneCount);
  const densityHeightRem =
    maximumLaneCount * desktopCardSlotRem * desktopDensitySlack;
  const decadeHeightRem =
    (domain.maximumLog - domain.minimumLog) * desktopDecadeHeightRem;

  return Math.max(
    desktopMinimumStageHeightRem,
    densityHeightRem,
    decadeHeightRem,
  );
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
  const boundedExactPositions = exactPositions.map((position) =>
    clampPosition(position, minimumPosition, maximumPosition),
  );
  const positionBlocks: PositionBlock[] = [];

  // Removing the required gap turns collision avoidance into an isotonic fit,
  // which keeps cards as close as possible to their exact logarithmic anchors.
  boundedExactPositions.forEach((position, index) => {
    positionBlocks.push({
      endIndex: index,
      mean: position - index * minimumGap,
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

  const minimumShift = minimumPosition - displayPositions[0];
  const maximumShift =
    maximumPosition - displayPositions[displayPositions.length - 1];

  if (minimumShift > maximumShift + Number.EPSILON * 16) {
    throw new Error("Desktop timeline stage cannot fit its lane placements.");
  }

  const boundedShift = clampPosition(0, minimumShift, maximumShift);

  return displayPositions.map((position) => position + boundedShift);
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
  const stageHeightRem = buildDesktopStageHeightRem(placements, domain);

  return {
    marks: buildMarksForDomain(domain),
    placements:
      mode === "desktop"
        ? resolveDesktopPlacements(placements, stageHeightRem)
        : placements,
    stageHeightRem,
  };
}
