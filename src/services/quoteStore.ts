import { fetchBtcUsdQuote } from "./btcPriceClient";

const cachedQuoteSourceLabel = "cached quote";
const quoteCacheStorageKey = "thinking-in-sats.quote-cache.v1";
const defaultMinimumLoadingStateMs = 650;
const defaultRefreshIntervalMs = 10 * 60 * 1000;
const quoteRefreshThresholdMs = 10 * 60 * 1000;

export type PriceQuote = {
  usdPerBitcoin: number;
  fetchedAt: number;
  sourceLabel: string;
};

export type QuoteLoadingState = {
  status: "loading";
  currentQuote: PriceQuote | null;
  maybeError: null;
  isStale: boolean;
};

export type QuoteReadyState = {
  status: "ready";
  currentQuote: PriceQuote;
  maybeError: string | null;
  isStale: boolean;
};

export type QuoteErrorState = {
  status: "error";
  currentQuote: null;
  maybeError: string;
  isStale: false;
};

export type QuoteState = QuoteLoadingState | QuoteReadyState | QuoteErrorState;

export type LiveQuoteStore = {
  getSnapshot: () => QuoteState;
  subscribe: (listener: (state: QuoteState) => void) => () => void;
  start: () => void;
  stop: () => void;
  refresh: () => Promise<void>;
};

type QuoteFetcher = () => Promise<PriceQuote>;
type QuoteStorage = Pick<Storage, "getItem" | "setItem">;
type QuoteCacheRecord = {
  usd: number;
  fetchedAt: number;
};
type TimerId = ReturnType<typeof globalThis.setTimeout>;

type LiveQuoteStoreOptions = {
  addVisibilityChangeListener?: (listener: () => void) => void;
  clearDelay?: (timerId: TimerId) => void;
  fetchQuote?: QuoteFetcher;
  getVisibilityState?: () => Document["visibilityState"];
  minimumLoadingStateMs?: number;
  now?: () => number;
  refreshIntervalMs?: number;
  removeVisibilityChangeListener?: (listener: () => void) => void;
  setDelay?: (listener: () => void, delayMs: number) => TimerId;
  storage?: QuoteStorage | null;
};

function createDefaultQuoteState(): QuoteState {
  return {
    status: "loading",
    currentQuote: null,
    maybeError: null,
    isStale: false,
  };
}

function maybeGetBrowserStorage(): QuoteStorage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function defaultSetDelay(listener: () => void, delayMs: number): TimerId {
  return globalThis.setTimeout(listener, delayMs);
}

function defaultClearDelay(timerId: TimerId) {
  globalThis.clearTimeout(timerId);
}

function defaultGetVisibilityState(): Document["visibilityState"] {
  if (typeof document === "undefined") {
    return "visible";
  }

  return document.visibilityState;
}

function defaultAddVisibilityChangeListener(listener: () => void) {
  if (typeof document === "undefined") {
    return;
  }

  document.addEventListener("visibilitychange", listener);
}

function defaultRemoveVisibilityChangeListener(listener: () => void) {
  if (typeof document === "undefined") {
    return;
  }

  document.removeEventListener("visibilitychange", listener);
}

function parseQuoteCacheRecord(
  maybeSerializedRecord: string | null | undefined,
): QuoteCacheRecord | null {
  if (!maybeSerializedRecord) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(maybeSerializedRecord) as Partial<
      Record<keyof QuoteCacheRecord, unknown>
    >;

    if (
      typeof parsedValue.usd !== "number" ||
      parsedValue.usd <= 0 ||
      typeof parsedValue.fetchedAt !== "number"
    ) {
      return null;
    }

    return {
      usd: parsedValue.usd,
      fetchedAt: parsedValue.fetchedAt,
    };
  } catch {
    return null;
  }
}

function readCachedQuote(storage: QuoteStorage | null): PriceQuote | null {
  const maybeSerializedRecord = storage?.getItem(quoteCacheStorageKey);
  const maybeRecord = parseQuoteCacheRecord(maybeSerializedRecord);

  if (!maybeRecord) {
    return null;
  }

  return {
    usdPerBitcoin: maybeRecord.usd,
    fetchedAt: maybeRecord.fetchedAt,
    sourceLabel: cachedQuoteSourceLabel,
  };
}

function writeCachedQuote(storage: QuoteStorage | null, quote: PriceQuote) {
  if (!storage) {
    return;
  }

  const cacheRecord: QuoteCacheRecord = {
    usd: quote.usdPerBitcoin,
    fetchedAt: quote.fetchedAt,
  };

  storage.setItem(quoteCacheStorageKey, JSON.stringify(cacheRecord));
}

function shouldRefreshQuote(maybeFetchedAt: number | null | undefined, nowMs: number) {
  if (typeof maybeFetchedAt !== "number") {
    return true;
  }

  return nowMs - maybeFetchedAt >= quoteRefreshThresholdMs;
}

function normalizeUnknownError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load the live bitcoin price.";
}

export function createLiveQuoteStore(
  options: LiveQuoteStoreOptions = {},
): LiveQuoteStore {
  const fetchQuote = options.fetchQuote ?? fetchBtcUsdQuote;
  const storage =
    options.storage === undefined ? maybeGetBrowserStorage() : options.storage;
  const now = options.now ?? (() => Date.now());
  const setDelay = options.setDelay ?? defaultSetDelay;
  const clearDelay = options.clearDelay ?? defaultClearDelay;
  const getVisibilityState =
    options.getVisibilityState ?? defaultGetVisibilityState;
  const addVisibilityChangeListener =
    options.addVisibilityChangeListener ?? defaultAddVisibilityChangeListener;
  const removeVisibilityChangeListener =
    options.removeVisibilityChangeListener ??
    defaultRemoveVisibilityChangeListener;
  const minimumLoadingStateMs =
    options.minimumLoadingStateMs ?? defaultMinimumLoadingStateMs;
  const refreshIntervalMs =
    options.refreshIntervalMs ?? defaultRefreshIntervalMs;
  const listeners = new Set<(state: QuoteState) => void>();

  let quoteState: QuoteState = createDefaultQuoteState();
  let maybeRefreshTimerId: TimerId | undefined;
  let maybeInflightRefresh: Promise<void> | undefined;
  let isStarted = false;

  function notifyListeners() {
    for (const listener of listeners) {
      listener(quoteState);
    }
  }

  function updateQuoteState(nextState: QuoteState) {
    quoteState = nextState;
    notifyListeners();
  }

  function clearRefreshTimer() {
    if (maybeRefreshTimerId === undefined) {
      return;
    }

    clearDelay(maybeRefreshTimerId);
    maybeRefreshTimerId = undefined;
  }

  function scheduleRefreshTimer() {
    clearRefreshTimer();

    if (!isStarted) {
      return;
    }

    maybeRefreshTimerId = setDelay(() => {
      void refreshQuote({ minimumDelay: false });
    }, refreshIntervalMs);
  }

  function waitForMinimumLoadingState(startedAtMs: number) {
    const elapsedMs = now() - startedAtMs;
    const remainingMs = Math.max(0, minimumLoadingStateMs - elapsedMs);

    if (remainingMs === 0) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      setDelay(resolve, remainingMs);
    });
  }

  function beginLoadingState(cachedQuote: PriceQuote | null) {
    updateQuoteState({
      ...quoteState,
      status: "loading",
      maybeError: null,
      currentQuote: quoteState.currentQuote ?? cachedQuote,
      isStale: quoteState.isStale,
    });
  }

  async function refreshQuote(options?: { minimumDelay?: boolean }) {
    if (maybeInflightRefresh) {
      return maybeInflightRefresh;
    }

    const refreshStartedAtMs = now();
    const cachedQuote = readCachedQuote(storage);
    const minimumDelay = options?.minimumDelay ?? false;

    beginLoadingState(cachedQuote);

    maybeInflightRefresh = (async () => {
      try {
        const freshQuote = await fetchQuote();

        if (minimumDelay) {
          await waitForMinimumLoadingState(refreshStartedAtMs);
        }

        writeCachedQuote(storage, freshQuote);
        updateQuoteState({
          status: "ready",
          currentQuote: freshQuote,
          maybeError: null,
          isStale: false,
        });
      } catch (error) {
        if (minimumDelay) {
          await waitForMinimumLoadingState(refreshStartedAtMs);
        }

        const errorMessage = normalizeUnknownError(error);
        const fallbackQuote = quoteState.currentQuote ?? cachedQuote;

        if (fallbackQuote) {
          updateQuoteState({
            status: "ready",
            currentQuote: fallbackQuote,
            maybeError: `${errorMessage} Using the last cached quote.`,
            isStale: true,
          });
        } else {
          updateQuoteState({
            status: "error",
            currentQuote: null,
            maybeError: errorMessage,
            isStale: false,
          });
        }
      } finally {
        scheduleRefreshTimer();
        maybeInflightRefresh = undefined;
      }
    })();

    return maybeInflightRefresh;
  }

  function handleVisibilityRefresh() {
    if (getVisibilityState() !== "visible") {
      return;
    }

    const cachedQuote = readCachedQuote(storage);

    if (shouldRefreshQuote(cachedQuote?.fetchedAt, now())) {
      void refreshQuote({ minimumDelay: false });
    }
  }

  function start() {
    if (isStarted) {
      return;
    }

    isStarted = true;

    const cachedQuote = readCachedQuote(storage);

    if (cachedQuote) {
      const cacheIsFresh = !shouldRefreshQuote(cachedQuote.fetchedAt, now());

      if (cacheIsFresh) {
        updateQuoteState({
          status: "ready",
          currentQuote: cachedQuote,
          maybeError: null,
          isStale: false,
        });
        scheduleRefreshTimer();
      } else {
        updateQuoteState({
          status: "loading",
          currentQuote: cachedQuote,
          maybeError: null,
          isStale: true,
        });
        void refreshQuote({ minimumDelay: true });
      }
    } else {
      updateQuoteState(createDefaultQuoteState());
      void refreshQuote({ minimumDelay: true });
    }

    addVisibilityChangeListener(handleVisibilityRefresh);
  }

  function stop() {
    if (!isStarted) {
      return;
    }

    isStarted = false;
    removeVisibilityChangeListener(handleVisibilityRefresh);
    clearRefreshTimer();
  }

  return {
    getSnapshot: () => quoteState,
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    start,
    stop,
    refresh: () => refreshQuote({ minimumDelay: false }),
  };
}

export const liveQuoteStore = createLiveQuoteStore();
