import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createLiveQuoteStore,
  type PriceQuote,
} from "./quoteStore";

const nowMs = 1_000_000;
const refreshIntervalMs = 10 * 60 * 1000;

type TestStorage = {
  getItem: ReturnType<typeof vi.fn>;
  getStoredValue: () => string | null;
  setItem: ReturnType<typeof vi.fn>;
  storage: Pick<Storage, "getItem" | "setItem">;
};

function createQuote(
  usdPerBitcoin = 100_000,
  fetchedAt = nowMs,
): PriceQuote {
  return {
    usdPerBitcoin,
    fetchedAt,
    sourceLabel: "Test quote adapter",
  };
}

function serializeCachedQuote(usd: number, fetchedAt: number): string {
  return JSON.stringify({ usd, fetchedAt });
}

function createTestStorage(maybeInitialValue: string | null = null): TestStorage {
  let maybeStoredValue = maybeInitialValue;
  const getItem = vi.fn((_key: string) => maybeStoredValue);
  const setItem = vi.fn((_key: string, value: string) => {
    maybeStoredValue = value;
  });

  return {
    getItem,
    getStoredValue: () => maybeStoredValue,
    setItem,
    storage: {
      getItem,
      setItem,
    },
  };
}

function createDeferred<T>() {
  let resolveDeferred!: (value: T) => void;
  let rejectDeferred!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolveDeferred = resolve;
    rejectDeferred = reject;
  });

  return {
    promise,
    reject: rejectDeferred,
    resolve: resolveDeferred,
  };
}

function createQuoteStoreHarness(options?: {
  fetchQuote?: () => Promise<PriceQuote>;
  maybeCachedRecord?: string | null;
  now?: number;
  visibilityState?: Document["visibilityState"];
}) {
  let currentNowMs = options?.now ?? nowMs;
  let currentVisibilityState = options?.visibilityState ?? "visible";
  let maybeVisibilityListener: (() => void) | undefined;
  const testStorage = createTestStorage(options?.maybeCachedRecord ?? null);
  const fetchQuote = vi.fn(
    options?.fetchQuote ??
      (() => Promise.resolve(createQuote(110_000, currentNowMs + 1_000))),
  );
  const addVisibilityChangeListener = vi.fn((listener: () => void) => {
    maybeVisibilityListener = listener;
  });
  const removeVisibilityChangeListener = vi.fn((listener: () => void) => {
    if (maybeVisibilityListener === listener) {
      maybeVisibilityListener = undefined;
    }
  });
  const store = createLiveQuoteStore({
    addVisibilityChangeListener,
    fetchQuote,
    getVisibilityState: () => currentVisibilityState,
    minimumLoadingStateMs: 0,
    now: () => currentNowMs,
    refreshIntervalMs,
    removeVisibilityChangeListener,
    storage: testStorage.storage,
  });

  return {
    addVisibilityChangeListener,
    emitVisibilityChange: () => {
      maybeVisibilityListener?.();
    },
    fetchQuote,
    removeVisibilityChangeListener,
    setNow: (nextNowMs: number) => {
      currentNowMs = nextNowMs;
    },
    setVisibilityState: (nextVisibilityState: Document["visibilityState"]) => {
      currentVisibilityState = nextVisibilityState;
    },
    store,
    testStorage,
  };
}

async function flushAsyncWork() {
  await Promise.resolve();
  await Promise.resolve();
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("createLiveQuoteStore", () => {
  it("loads a fresh quote when no cache exists", async () => {
    // Arrange
    const freshQuote = createQuote(105_000, nowMs + 500);
    const harness = createQuoteStoreHarness({
      fetchQuote: () => Promise.resolve(freshQuote),
    });

    // Act
    harness.store.start();
    await flushAsyncWork();

    // Assert
    expect(harness.fetchQuote).toHaveBeenCalledTimes(1);
    expect(harness.store.getSnapshot()).toEqual({
      status: "ready",
      currentQuote: freshQuote,
      maybeError: null,
      isStale: false,
    });
    expect(JSON.parse(harness.testStorage.getStoredValue() ?? "{}")).toEqual({
      usd: 105_000,
      fetchedAt: nowMs + 500,
    });
  });

  it("uses a fresh cache without an immediate fetch", () => {
    // Arrange
    const cachedRecord = serializeCachedQuote(98_000, nowMs - 60_000);
    const harness = createQuoteStoreHarness({ maybeCachedRecord: cachedRecord });

    // Act
    harness.store.start();

    // Assert
    expect(harness.fetchQuote).not.toHaveBeenCalled();
    expect(harness.store.getSnapshot()).toEqual({
      status: "ready",
      currentQuote: {
        usdPerBitcoin: 98_000,
        fetchedAt: nowMs - 60_000,
        sourceLabel: "cached quote",
      },
      maybeError: null,
      isStale: false,
    });
  });

  it("shows a stale cache while refreshing, then updates from the quote adapter", async () => {
    // Arrange
    const cachedRecord = serializeCachedQuote(95_000, nowMs - refreshIntervalMs);
    const freshQuote = createQuote(112_000, nowMs + 1_000);
    const harness = createQuoteStoreHarness({
      fetchQuote: () => Promise.resolve(freshQuote),
      maybeCachedRecord: cachedRecord,
    });

    // Act
    harness.store.start();
    const loadingSnapshot = harness.store.getSnapshot();
    await flushAsyncWork();

    // Assert
    expect(loadingSnapshot).toEqual({
      status: "loading",
      currentQuote: {
        usdPerBitcoin: 95_000,
        fetchedAt: nowMs - refreshIntervalMs,
        sourceLabel: "cached quote",
      },
      maybeError: null,
      isStale: true,
    });
    expect(harness.store.getSnapshot()).toEqual({
      status: "ready",
      currentQuote: freshQuote,
      maybeError: null,
      isStale: false,
    });
  });

  it("falls back to a cached quote when refresh fails", async () => {
    // Arrange
    const cachedRecord = serializeCachedQuote(91_000, nowMs - refreshIntervalMs);
    const harness = createQuoteStoreHarness({
      fetchQuote: () => Promise.reject(new Error("Price source unavailable")),
      maybeCachedRecord: cachedRecord,
    });

    // Act
    harness.store.start();
    await flushAsyncWork();

    // Assert
    expect(harness.store.getSnapshot()).toEqual({
      status: "ready",
      currentQuote: {
        usdPerBitcoin: 91_000,
        fetchedAt: nowMs - refreshIntervalMs,
        sourceLabel: "cached quote",
      },
      maybeError: "Price source unavailable Using the last cached quote.",
      isStale: true,
    });
  });

  it("reports an error when refresh fails without a cache", async () => {
    // Arrange
    const harness = createQuoteStoreHarness({
      fetchQuote: () => Promise.reject(new Error("Price source unavailable")),
    });

    // Act
    harness.store.start();
    await flushAsyncWork();

    // Assert
    expect(harness.store.getSnapshot()).toEqual({
      status: "error",
      currentQuote: null,
      maybeError: "Price source unavailable",
      isStale: false,
    });
  });

  it("ignores malformed cache records", async () => {
    // Arrange
    const freshQuote = createQuote(103_000, nowMs + 700);
    const harness = createQuoteStoreHarness({
      fetchQuote: () => Promise.resolve(freshQuote),
      maybeCachedRecord: '{"usd":"oops"}',
    });

    // Act
    harness.store.start();
    await flushAsyncWork();

    // Assert
    expect(harness.fetchQuote).toHaveBeenCalledTimes(1);
    expect(harness.store.getSnapshot()).toEqual({
      status: "ready",
      currentQuote: freshQuote,
      maybeError: null,
      isStale: false,
    });
  });

  it("coalesces inflight refresh calls", async () => {
    // Arrange
    const deferredQuote = createDeferred<PriceQuote>();
    const harness = createQuoteStoreHarness({
      fetchQuote: () => deferredQuote.promise,
    });

    // Act
    const firstRefresh = harness.store.refresh();
    const secondRefresh = harness.store.refresh();
    deferredQuote.resolve(createQuote(106_000, nowMs + 300));
    await Promise.all([firstRefresh, secondRefresh]);

    // Assert
    expect(harness.fetchQuote).toHaveBeenCalledTimes(1);
    expect(harness.store.getSnapshot().status).toBe("ready");
  });

  it("refreshes on visible tab changes only when the cached quote is stale", () => {
    // Arrange
    const cachedRecord = serializeCachedQuote(99_000, nowMs);
    const harness = createQuoteStoreHarness({ maybeCachedRecord: cachedRecord });
    harness.store.start();

    // Act
    harness.emitVisibilityChange();
    harness.setNow(nowMs + refreshIntervalMs);
    harness.setVisibilityState("hidden");
    harness.emitVisibilityChange();
    harness.setVisibilityState("visible");
    harness.emitVisibilityChange();

    // Assert
    expect(harness.fetchQuote).toHaveBeenCalledTimes(1);
  });

  it("removes visibility listeners and clears refresh timers on stop", () => {
    // Arrange
    const cachedRecord = serializeCachedQuote(99_000, nowMs);
    const harness = createQuoteStoreHarness({ maybeCachedRecord: cachedRecord });
    harness.store.start();

    // Act
    harness.store.stop();
    vi.advanceTimersByTime(refreshIntervalMs);

    // Assert
    expect(harness.addVisibilityChangeListener).toHaveBeenCalledTimes(1);
    expect(harness.removeVisibilityChangeListener).toHaveBeenCalledTimes(1);
    expect(harness.fetchQuote).not.toHaveBeenCalled();
  });
});
