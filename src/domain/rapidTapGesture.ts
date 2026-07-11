export const rapidTapWindowMs = 800;
export const requiredRapidTapCount = 5;

export type PointerTapContactCandidate = {
  button: number;
  durationMs: number;
  maximumTravelPx: number;
};

export type PointerTapCandidate = PointerTapContactCandidate & {
  hadConcurrentPointer: boolean;
  isPrimary: boolean;
};

type RapidTapResult = {
  didTrigger: boolean;
  recentTapTimes: number[];
};

const maximumTapDurationMs = 600;
const maximumTapTravelPx = 12;

export function isQualifyingPointerTap(
  candidate: PointerTapCandidate,
): boolean {
  return (
    isQualifyingPointerContact(candidate) &&
    candidate.isPrimary &&
    !candidate.hadConcurrentPointer
  );
}

export function isQualifyingPointerContact(
  candidate: PointerTapContactCandidate,
): boolean {
  return (
    candidate.button === 0 &&
    candidate.durationMs <= maximumTapDurationMs &&
    candidate.maximumTravelPx <= maximumTapTravelPx
  );
}

export function registerRapidTap(
  previousTapTimes: readonly number[],
  tapTime: number,
): RapidTapResult {
  const recentTapTimes = previousTapTimes.filter(
    (previousTapTime) =>
      tapTime >= previousTapTime &&
      tapTime - previousTapTime <= rapidTapWindowMs,
  );
  recentTapTimes.push(tapTime);

  if (recentTapTimes.length < requiredRapidTapCount) {
    return { didTrigger: false, recentTapTimes };
  }

  return { didTrigger: true, recentTapTimes: [] };
}
