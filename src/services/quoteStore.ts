import {
  createDefaultQuoteState,
  type PriceQuote,
  type QuoteState,
  parseQuoteCacheRecord,
  createQuoteCacheRecord,
  shouldRefreshQuote,
} from "../domain/quoteCache";
import { fetchBtcUsdQuote } from "./btcPriceClient";

type QuoteSubscribers = Set<(state: QuoteState) => void>;

const quoteSubscribers: QuoteSubscribers = new Set();
const minimumLoadingStateMs = 650;
const refreshIntervalMs = 10 * 60 * 1000;
const quoteCacheStorageKey = "thinking-in-sats.quote-cache.v1";

let quoteState: QuoteState = createDefaultQuoteState();
let maybeRefreshTimerId: number | undefined;
let maybeInflightRefresh: Promise<void> | undefined;

function notifyQuoteSubscribers() {
  for (const subscriber of quoteSubscribers) {
    subscriber(quoteState);
  }
}

function updateQuoteState(nextState: QuoteState) {
  quoteState = nextState;
  notifyQuoteSubscribers();
}

function readCachedQuote(storage: Storage): PriceQuote | null {
  const maybeSerializedRecord = storage.getItem(quoteCacheStorageKey);
  const maybeRecord = parseQuoteCacheRecord(maybeSerializedRecord);

  if (!maybeRecord) {
    return null;
  }

  return {
    usdPerBitcoin: maybeRecord.usd,
    fetchedAt: maybeRecord.fetchedAt,
    source: "cache",
  };
}

function writeCachedQuote(storage: Storage, quote: PriceQuote) {
  const cacheRecord = createQuoteCacheRecord(quote.usdPerBitcoin, quote.fetchedAt);
  storage.setItem(quoteCacheStorageKey, JSON.stringify(cacheRecord));
}

function normalizeUnknownError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load the live bitcoin price.";
}

function waitForMinimumLoadingState(startedAtMs: number) {
  const elapsedMs = Date.now() - startedAtMs;
  const remainingMs = Math.max(0, minimumLoadingStateMs - elapsedMs);

  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, remainingMs);
  });
}

function clearRefreshTimer() {
  if (maybeRefreshTimerId === undefined) {
    return;
  }

  window.clearTimeout(maybeRefreshTimerId);
  maybeRefreshTimerId = undefined;
}

function scheduleRefreshTimer() {
  clearRefreshTimer();

  maybeRefreshTimerId = window.setTimeout(() => {
    void refreshQuote({ minimumDelay: false });
  }, refreshIntervalMs);
}

async function refreshQuote(options?: { minimumDelay?: boolean }) {
  if (maybeInflightRefresh) {
    return maybeInflightRefresh;
  }

  const refreshStartedAtMs = Date.now();
  const cachedQuote = readCachedQuote(window.localStorage);
  const minimumDelay = options?.minimumDelay ?? false;

  updateQuoteState({
    ...quoteState,
    status: "loading",
    maybeError: null,
    currentQuote: quoteState.currentQuote ?? cachedQuote,
    isStale: quoteState.isStale,
  });

  maybeInflightRefresh = (async () => {
    try {
      const freshQuote = await fetchBtcUsdQuote();

      if (minimumDelay) {
        await waitForMinimumLoadingState(refreshStartedAtMs);
      }

      writeCachedQuote(window.localStorage, freshQuote);
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

      updateQuoteState({
        status: fallbackQuote ? "ready" : "error",
        currentQuote: fallbackQuote,
        maybeError: fallbackQuote
          ? `${errorMessage} Using the last cached quote.`
          : errorMessage,
        isStale: Boolean(fallbackQuote),
      });
    } finally {
      scheduleRefreshTimer();
      maybeInflightRefresh = undefined;
    }
  })();

  return maybeInflightRefresh;
}

function handleVisibilityRefresh() {
  if (document.visibilityState !== "visible") {
    return;
  }

  const cachedQuote = readCachedQuote(window.localStorage);
  const shouldRefresh = shouldRefreshQuote(
    cachedQuote?.fetchedAt ?? 0,
    Date.now(),
  );

  if (shouldRefresh) {
    void refreshQuote({ minimumDelay: false });
  }
}

export function getQuoteState() {
  return quoteState;
}

export function subscribeToQuoteState(subscriber: (state: QuoteState) => void) {
  quoteSubscribers.add(subscriber);

  return () => {
    quoteSubscribers.delete(subscriber);
  };
}

export function initializeQuoteStore() {
  if (typeof window === "undefined") {
    return;
  }

  const cachedQuote = readCachedQuote(window.localStorage);
  const nowMs = Date.now();

  if (cachedQuote) {
    const cacheIsFresh = !shouldRefreshQuote(cachedQuote.fetchedAt, nowMs);

    updateQuoteState({
      status: cacheIsFresh ? "ready" : "loading",
      currentQuote: cachedQuote,
      maybeError: null,
      isStale: !cacheIsFresh,
    });

    if (cacheIsFresh) {
      scheduleRefreshTimer();
    } else {
      void refreshQuote({ minimumDelay: true });
    }
  } else {
    updateQuoteState(createDefaultQuoteState());
    void refreshQuote({ minimumDelay: true });
  }

  window.addEventListener("visibilitychange", handleVisibilityRefresh);
}

export function cleanupQuoteStore() {
  if (typeof window === "undefined") {
    return;
  }

  window.removeEventListener("visibilitychange", handleVisibilityRefresh);
  clearRefreshTimer();
}

export async function forceRefreshQuote() {
  await refreshQuote({ minimumDelay: false });
}

export function quoteToDerivedMetrics(maybeQuote: PriceQuote | null | undefined) {
  if (!maybeQuote) {
    return {
      maybeSatoshiPerUsd: undefined,
      maybeUsdPerSat: undefined,
    };
  }

  const satoshiPerUsd = Math.round(100_000_000 / maybeQuote.usdPerBitcoin);

  return {
    maybeSatoshiPerUsd: satoshiPerUsd,
    maybeUsdPerSat: 1 / satoshiPerUsd,
  };
}
