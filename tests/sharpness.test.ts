import { describe, expect, it } from 'vitest'
import { isImageSharp } from '../src/index.js'

describe('isImageSharp', () => {
  it('accepts sharpness at the exact default boundary (6.5)', () => {
    expect(isImageSharp({ sharpness: 6.5 })).toBe(true)
  })

  it('rejects sharpness below the default minimum', () => {
    expect(isImageSharp({ sharpness: 6.49 })).toBe(false)
    expect(isImageSharp({ sharpness: 0 })).toBe(false)
  })

  it('honours a custom minSharpness', () => {
    expect(isImageSharp({ sharpness: 50 }, { minSharpness: 100 })).toBe(false)
    expect(isImageSharp({ sharpness: 150 }, { minSharpness: 100 })).toBe(true)
  })
})
