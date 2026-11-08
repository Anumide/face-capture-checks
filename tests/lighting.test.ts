import { describe, expect, it } from 'vitest'
import { hasAdequateLighting } from '../src/index.js'

describe('hasAdequateLighting', () => {
  it('accepts brightness at the exact default boundaries (80 and 220)', () => {
    expect(hasAdequateLighting({ brightness: 80 })).toBe(true)
    expect(hasAdequateLighting({ brightness: 220 })).toBe(true)
  })

  it('rejects brightness outside the default range', () => {
    expect(hasAdequateLighting({ brightness: 79.99 })).toBe(false)
    expect(hasAdequateLighting({ brightness: 220.01 })).toBe(false)
    expect(hasAdequateLighting({ brightness: 0 })).toBe(false)
    expect(hasAdequateLighting({ brightness: 255 })).toBe(false)
  })

  it('honours custom thresholds', () => {
    const options = { minBrightness: 0, maxBrightness: 300 }
    expect(hasAdequateLighting({ brightness: 0 }, options)).toBe(true)
    expect(hasAdequateLighting({ brightness: 255 }, options)).toBe(true)
    expect(hasAdequateLighting({ brightness: 301 }, options)).toBe(false)
  })

  it('treats an empty options object the same as no options', () => {
    expect(hasAdequateLighting({ brightness: 120 }, {})).toBe(true)
    expect(hasAdequateLighting({ brightness: 79 }, {})).toBe(false)
  })
})
