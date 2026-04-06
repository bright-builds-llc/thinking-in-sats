import { describe, expect, it } from 'vitest'

import {
  FIVE_MINUTES_MS,
  createQuoteCacheRecord,
  getQuoteCacheStatus,
  parseQuoteCacheRecord,
  shouldRefreshQuote,
  TEN_MINUTES_MS,
} from './quoteCache'

describe('getQuoteCacheStatus', () => {
  it('reports a fresh quote within the freshness window', () => {
    // Arrange
    const nowTimestamp = 1_000_000
    const cacheRecord = createQuoteCacheRecord(82_000, nowTimestamp - 2 * 60_000)

    // Act
    const result = getQuoteCacheStatus(cacheRecord, nowTimestamp)

    // Assert
    expect(result.state).toBe('fresh')
    expect(result.maybeQuoteUsd).toBe(82_000)
    expect(result.shouldAttemptRefresh).toBe(false)
  })

  it('reports a stale quote that can still be used', () => {
    // Arrange
    const nowTimestamp = 1_000_000
    const cacheRecord = createQuoteCacheRecord(82_000, nowTimestamp - 8 * 60_000)

    // Act
    const result = getQuoteCacheStatus(cacheRecord, nowTimestamp)

    // Assert
    expect(result.state).toBe('stale')
    expect(result.maybeQuoteUsd).toBe(82_000)
    expect(result.shouldAttemptRefresh).toBe(true)
  })

  it('reports an expired quote beyond the stale threshold', () => {
    // Arrange
    const nowTimestamp = 1_000_000
    const cacheRecord = createQuoteCacheRecord(82_000, nowTimestamp - 20 * 60_000)

    // Act
    const result = getQuoteCacheStatus(cacheRecord, nowTimestamp)

    // Assert
    expect(result.state).toBe('expired')
    expect(result.maybeQuoteUsd).toBe(null)
    expect(result.shouldAttemptRefresh).toBe(true)
  })
})

describe('parseQuoteCacheRecord', () => {
  it('parses serialized cache records and rejects invalid payloads', () => {
    // Arrange
    const validSerialized = JSON.stringify(createQuoteCacheRecord(83_500, 123_456))

    // Act
    const validResult = parseQuoteCacheRecord(validSerialized)
    const invalidResult = parseQuoteCacheRecord('{"usd":"oops"}')

    // Assert
    expect(validResult).toEqual({ usd: 83_500, fetchedAt: 123_456 })
    expect(invalidResult).toBeNull()
  })
})

describe('shouldRefreshQuote', () => {
  it('refreshes only when the quote age reaches the refresh threshold', () => {
    // Arrange
    const nowTimestamp = 1_000_000
    const recentRecord = createQuoteCacheRecord(80_000, nowTimestamp - FIVE_MINUTES_MS)
    const oldRecord = createQuoteCacheRecord(80_000, nowTimestamp - TEN_MINUTES_MS)

    // Act
    const recentResult = shouldRefreshQuote(recentRecord, nowTimestamp)
    const oldResult = shouldRefreshQuote(oldRecord, nowTimestamp)

    // Assert
    expect(recentResult).toBe(false)
    expect(oldResult).toBe(true)
  })
})
