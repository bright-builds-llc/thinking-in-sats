const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export function formatSats(sats: number): string {
  if (sats === 1) {
    return "1 sat";
  }

  if (sats < 1_000) {
    return `${sats.toLocaleString("en-US")} sats`;
  }

  if (sats < 1_000_000) {
    return `${trimDecimal(sats / 1_000)}k sats`;
  }

  if (sats < 1_000_000_000) {
    return `${trimDecimal(sats / 1_000_000)}M sats`;
  }

  return `${trimDecimal(sats / 1_000_000_000)}B sats`;
}

export const formatSatsLabel = formatSats;
export const formatSatLabel = formatSats;
export const formatSatRangeLabel = formatSats;

export function formatBtcAmount(sats: number): string {
  const btc = sats / 100_000_000;
  return `₿${btc.toFixed(8)}`;
}

export const formatBtcValue = formatBtcAmount;

export function centsToUsdString(usdCents: number): string {
  return usdFormatter.format(usdCents / 100);
}

export function formatMoneyUsd(usdCents: number): string {
  return `≈ ${centsToUsdString(usdCents)}`;
}

export const formatApproxUsd = formatMoneyUsd;

export function formatUsdPerBitcoin(usdPerBitcoin: number): string {
  return `${usdFormatter.format(usdPerBitcoin)} / BTC`;
}

export function formatRelativeUpdatedAt(
  updatedAtTimestamp: number,
  nowTimestamp = Date.now(),
): string {
  const deltaMs = Math.max(0, nowTimestamp - updatedAtTimestamp);
  const deltaSeconds = Math.floor(deltaMs / 1000);

  if (deltaSeconds < 5) {
    return "just now";
  }

  if (deltaSeconds < 60) {
    return `${deltaSeconds}s ago`;
  }

  const deltaMinutes = Math.floor(deltaSeconds / 60);

  if (deltaMinutes < 60) {
    return `${deltaMinutes}m ago`;
  }

  const deltaHours = Math.floor(deltaMinutes / 60);

  if (deltaHours < 24) {
    return `${deltaHours}h ago`;
  }

  const deltaDays = Math.floor(deltaHours / 24);
  return `${deltaDays}d ago`;
}

export function formatAbsoluteTimestamp(timestamp: number): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function trimDecimal(value: number): string {
  return value
    .toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)
    .replace(/\.0+$/, "")
    .replace(/(\.\d*[1-9])0+$/, "$1");
}
