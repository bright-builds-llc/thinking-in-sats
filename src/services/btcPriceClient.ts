import type { PriceQuote } from "./quoteStore";

type CoinGeckoSimplePriceResponse = {
  bitcoin?: {
    usd?: number;
    last_updated_at?: number;
  };
};

const COINGECKO_SIMPLE_PRICE_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_last_updated_at=true";

function parseCoinGeckoQuote(payload: CoinGeckoSimplePriceResponse): PriceQuote {
  const usdPerBitcoin = payload.bitcoin?.usd;

  if (typeof usdPerBitcoin !== "number" || usdPerBitcoin <= 0) {
    throw new Error("The price source returned an invalid BTC/USD quote.");
  }

  const maybeApiUpdatedAtUnixSeconds = payload.bitcoin?.last_updated_at;
  const fetchedAt =
    typeof maybeApiUpdatedAtUnixSeconds === "number"
      ? maybeApiUpdatedAtUnixSeconds * 1000
      : Date.now();

  return {
    usdPerBitcoin,
    fetchedAt,
    sourceLabel: "CoinGecko",
  };
}

export async function fetchBtcUsdQuote(): Promise<PriceQuote> {
  const response = await fetch(COINGECKO_SIMPLE_PRICE_URL, {
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to load BTC price: ${response.status}`);
  }

  const payload = (await response.json()) as CoinGeckoSimplePriceResponse;

  return parseCoinGeckoQuote(payload);
}
