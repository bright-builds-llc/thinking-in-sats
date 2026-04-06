import { describe, expect, it } from 'vitest'
import {
  btcUsdToUsdPerSat,
  convertUsdCentsToSats,
  satsToBitcoin,
  satsToUsdCents,
} from './pricing'

describe('convertUsdCentsToSats', () => {
  it('converts usd cents into sats using btc usd price', () => {
    // Arrange
    const approxUsdCents = 500
    const btcUsdPrice = 100_000

    // Act
    const sats = convertUsdCentsToSats(approxUsdCents, btcUsdPrice)

    // Assert
    expect(sats).toBe(5_000)
  })

  it('never returns fewer than one sat for positive prices', () => {
    // Arrange
    const approxUsdCents = 1
    const btcUsdPrice = 1_000_000

    // Act
    const sats = convertUsdCentsToSats(approxUsdCents, btcUsdPrice)

    // Assert
    expect(sats).toBe(1)
  })
})

describe('satsToBitcoin', () => {
  it('converts sats to bitcoin units', () => {
    // Arrange
    const sats = 12_345

    // Act
    const bitcoin = satsToBitcoin(sats)

    // Assert
    expect(bitcoin).toBe(0.00012345)
  })
})

describe('satsToUsdCents', () => {
  it('converts sats to approximate usd cents', () => {
    // Arrange
    const sats = 1_000
    const btcUsdPrice = 100_000

    // Act
    const approxUsdCents = satsToUsdCents(sats, btcUsdPrice)

    // Assert
    expect(approxUsdCents).toBe(100)
  })
})

describe('btcUsdToUsdPerSat', () => {
  it('returns usd value per sat', () => {
    // Arrange
    const btcUsdPrice = 100_000

    // Act
    const usdPerSat = btcUsdToUsdPerSat(btcUsdPrice)

    // Assert
    expect(usdPerSat).toBe(0.001)
  })
})
