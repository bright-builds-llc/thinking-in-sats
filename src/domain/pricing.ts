import {
  itemCategoryLabels,
  type EverydayItem,
  type EverydayItemWithSats,
} from "./itemTypes";

const SATS_PER_BITCOIN = 100_000_000;

export function convertUsdCentsToSats(
  approxUsdCents: number,
  btcUsdPrice: number,
): number {
  if (approxUsdCents <= 0) {
    return 1;
  }

  const usdValue = approxUsdCents / 100;
  const satsPerUsd = SATS_PER_BITCOIN / btcUsdPrice;
  const sats = Math.round(usdValue * satsPerUsd);

  return Math.max(1, sats);
}

export const usdCentsToSats = convertUsdCentsToSats;

export function satsToBitcoin(sats: number): number {
  return sats / SATS_PER_BITCOIN;
}

export const satsToBtc = satsToBitcoin;

export function satsToUsdCents(sats: number, btcUsdPrice: number): number {
  return Math.round(satsToBitcoin(sats) * btcUsdPrice * 100);
}

export function satsToApproxUsdCents(sats: number, btcUsdPrice: number): number {
  return satsToUsdCents(sats, btcUsdPrice);
}

export function btcUsdToUsdPerSat(btcUsdPrice: number): number {
  return btcUsdPrice / SATS_PER_BITCOIN;
}

export function deriveQuoteSummary(usdPerBitcoin: number) {
  const satsPerDollarRounded = Math.round(SATS_PER_BITCOIN / usdPerBitcoin);

  return {
    usdPerBitcoin,
    satsPerDollarRounded,
    usdPerSat: btcUsdToUsdPerSat(usdPerBitcoin),
  };
}

export function deriveItemWithSats(
  item: EverydayItem,
  usdPerBitcoin: number,
): EverydayItemWithSats {
  const satValue = convertUsdCentsToSats(item.approxUsdCents, usdPerBitcoin);

  return {
    ...item,
    satValue,
    btcValue: satsToBitcoin(satValue),
    categoryLabel: itemCategoryLabels[item.category],
  };
}

export function deriveItemsWithSats(
  items: EverydayItem[],
  usdPerBitcoin: number,
): EverydayItemWithSats[] {
  return items.map((item) => deriveItemWithSats(item, usdPerBitcoin));
}

export function deriveTimelineEntries(
  items: EverydayItem[],
  usdPerBitcoin: number,
): EverydayItemWithSats[] {
  return deriveItemsWithSats(items, usdPerBitcoin).sort(
    (leftItem, rightItem) => leftItem.satValue - rightItem.satValue,
  );
}
