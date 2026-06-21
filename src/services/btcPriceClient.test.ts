import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchBtcUsdQuote } from "./btcPriceClient";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("fetchBtcUsdQuote", () => {
  it("parses a CoinGecko quote response", async () => {
    // Arrange
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            bitcoin: {
              usd: 83_500,
              last_updated_at: 1_710_000_000,
            },
          }),
      }),
    );

    // Act
    const result = await fetchBtcUsdQuote();

    // Assert
    expect(result).toEqual({
      usdPerBitcoin: 83_500,
      fetchedAt: 1_710_000_000_000,
      sourceLabel: "CoinGecko",
    });
  });

  it("rejects failed CoinGecko responses", async () => {
    // Arrange
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      }),
    );

    // Act
    const result = fetchBtcUsdQuote();

    // Assert
    await expect(result).rejects.toThrow("Unable to load BTC price: 503");
  });
});
