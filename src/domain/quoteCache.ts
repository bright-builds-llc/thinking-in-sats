export const FIVE_MINUTES_MS = 5 * 60 * 1000;
export const TEN_MINUTES_MS = 10 * 60 * 1000;
const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

export type QuoteSource = "coingecko" | "cache" | "stale-cache";

export type PriceQuote = {
  usdPerBitcoin: number;
  fetchedAt: number;
  source: QuoteSource;
};

export type FreshQuote = PriceQuote;

export type QuoteCacheRecord = {
  usd: number;
  fetchedAt: number;
};

export type QuoteCacheStatus = {
  state: "missing" | "fresh" | "stale" | "expired";
  maybeQuoteUsd: number | null;
  maybeFetchedAt: number | null;
  shouldAttemptRefresh: boolean;
};

export type QuoteState = {
  status: "loading" | "ready" | "error";
  currentQuote: PriceQuote | null;
  maybeError: string | null;
  isStale: boolean;
};

export function createDefaultQuoteState(): QuoteState {
  return {
    status: "loading",
    currentQuote: null,
    maybeError: null,
    isStale: false,
  };
}

export function createQuoteCacheRecord(
  usd: number,
  fetchedAt: number,
): QuoteCacheRecord {
  return {
    usd,
    fetchedAt,
  };
}

export function parseQuoteCacheRecord(
  maybeSerializedRecord: string | null | undefined,
): QuoteCacheRecord | null {
  if (!maybeSerializedRecord) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(maybeSerializedRecord) as Partial<QuoteCacheRecord>;

    if (
      typeof parsedValue.usd !== "number" ||
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

export function getQuoteCacheStatus(
  maybeRecord: QuoteCacheRecord | null,
  nowTimestamp: number,
): QuoteCacheStatus {
  if (!maybeRecord) {
    return {
      state: "missing",
      maybeQuoteUsd: null,
      maybeFetchedAt: null,
      shouldAttemptRefresh: true,
    };
  }

  const ageMs = nowTimestamp - maybeRecord.fetchedAt;

  if (ageMs <= FIVE_MINUTES_MS) {
    return {
      state: "fresh",
      maybeQuoteUsd: maybeRecord.usd,
      maybeFetchedAt: maybeRecord.fetchedAt,
      shouldAttemptRefresh: false,
    };
  }

  if (ageMs <= FIFTEEN_MINUTES_MS) {
    return {
      state: "stale",
      maybeQuoteUsd: maybeRecord.usd,
      maybeFetchedAt: maybeRecord.fetchedAt,
      shouldAttemptRefresh: true,
    };
  }

  return {
    state: "expired",
    maybeQuoteUsd: null,
    maybeFetchedAt: null,
    shouldAttemptRefresh: true,
  };
}

export function shouldRefreshQuote(
  maybeRecordOrFetchedAt: QuoteCacheRecord | number | null | undefined,
  nowTimestamp: number,
): boolean {
  if (typeof maybeRecordOrFetchedAt === "number") {
    return nowTimestamp - maybeRecordOrFetchedAt >= TEN_MINUTES_MS;
  }

  if (!maybeRecordOrFetchedAt) {
    return true;
  }

  return nowTimestamp - maybeRecordOrFetchedAt.fetchedAt >= TEN_MINUTES_MS;
}

export function parseFreshQuoteFromApi(input: {
  usdPerBitcoin?: number;
  maybeApiUpdatedAtUnixSeconds?: number;
}): FreshQuote {
  if (typeof input.usdPerBitcoin !== "number" || input.usdPerBitcoin <= 0) {
    throw new Error("The price source returned an invalid BTC/USD quote.");
  }

  const fetchedAt =
    typeof input.maybeApiUpdatedAtUnixSeconds === "number"
      ? input.maybeApiUpdatedAtUnixSeconds * 1000
      : Date.now();

  return {
    usdPerBitcoin: input.usdPerBitcoin,
    fetchedAt,
    source: "coingecko",
  };
}
