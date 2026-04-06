import {
  parseFreshQuoteFromApi,
  type PriceQuote,
} from "../domain/quoteCache";

type CoinGeckoSimplePriceResponse = {
  bitcoin?: {
    usd?: number;
    last_updated_at?: number;
  };
};

const COINGECKO_SIMPLE_PRICE_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_last_updated_at=true";

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

  return parseFreshQuoteFromApi({
    usdPerBitcoin: payload.bitcoin?.usd,
    maybeApiUpdatedAtUnixSeconds: payload.bitcoin?.last_updated_at,
  });
}
