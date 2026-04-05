import { describe, expect, it } from 'vitest'

import {
  formatBtcAmount,
  formatMoneyUsd,
  formatRelativeUpdatedAt,
  formatSatRangeLabel,
  formatSats,
} from './formatting'

describe('formatSats', () => {
  it('formats raw sats with human-friendly units', () => {
    // Arrange
    const oneSat = 1
    const thousandSats = 1_500
    const millionSats = 1_200_000

    // Act
    const oneResult = formatSats(oneSat)
    const thousandResult = formatSats(thousandSats)
    const millionResult = formatSats(millionSats)

    // Assert
    expect(oneResult).toBe('1 sat')
    expect(thousandResult).toBe('1.5k sats')
    expect(millionResult).toBe('1.2M sats')
  })
})

describe('formatSatRangeLabel', () => {
  it('formats decade tick labels', () => {
    // Arrange
    const values = [1, 10, 100, 1_000, 10_000, 1_000_000]

    // Act
    const labels = values.map(formatSatRangeLabel)

    // Assert
    expect(labels).toEqual(['1 sat', '10 sats', '100 sats', '1k sats', '10k sats', '1M sats'])
  })
})

describe('formatBtcAmount', () => {
  it('formats bitcoin amounts with useful precision', () => {
    // Arrange
    const sats = 15_000

    // Act
    const result = formatBtcAmount(sats)

    // Assert
    expect(result).toBe('₿0.00015000')
  })
})

describe('formatMoneyUsd', () => {
  it('formats approximate usd values', () => {
    // Arrange
    const usdCents = 1_099

    // Act
    const result = formatMoneyUsd(usdCents)

    // Assert
    expect(result).toBe('≈ $10.99')
  })
})

describe('formatRelativeUpdatedAt', () => {
  it('formats recent timestamps for quote freshness messaging', () => {
    // Arrange
    const nowTimestamp = 1_000_000
    const thirtySecondsAgo = nowTimestamp - 30_000
    const threeMinutesAgo = nowTimestamp - 3 * 60_000

    // Act
    const nowResult = formatRelativeUpdatedAt(nowTimestamp, nowTimestamp)
    const secondsResult = formatRelativeUpdatedAt(thirtySecondsAgo, nowTimestamp)
    const minutesResult = formatRelativeUpdatedAt(threeMinutesAgo, nowTimestamp)

    // Assert
    expect(nowResult).toBe('just now')
    expect(secondsResult).toBe('30s ago')
    expect(minutesResult).toBe('3m ago')
  })
})
