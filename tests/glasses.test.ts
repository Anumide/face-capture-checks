import { describe, expect, it } from 'vitest'
import { detectGlasses } from '../src/index.js'
import { makeCanvas, makeLandmarks, makeVideo, point, solidPixels, verticalStripePixels } from './helpers/fixtures.js'

const video = () => makeVideo(640, 480)

function landmarks() {
  const leftEye = [
    point(100, 105),
    point(110, 100),
    point(120, 100),
    point(130, 105),
    point(120, 110),
    point(110, 110)
  ]
  const rightEye = leftEye.map(({ x, y }) => point(x + 60, y))
  return makeLandmarks(leftEye, rightEye)
}

describe('detectGlasses', () => {
  it('is true for a frame with strong edges, dark pixels, and high contrast', () => {
    const canvas = makeCanvas(verticalStripePixels(8, 8, 2, 0, 255))
    const options = { canvas, sampleWidth: 8, sampleHeight: 8 }
    expect(detectGlasses(video(), landmarks(), options)).toBe(true)
  })

  it('is true with the default 80x32 sample size', () => {
    const canvas = makeCanvas(verticalStripePixels(80, 32, 2, 0, 255))
    expect(detectGlasses(video(), landmarks(), { canvas })).toBe(true)
  })

  it('is false for a uniform frame (no edges, dark pixels, or contrast)', () => {
    const canvas = makeCanvas(solidPixels(8, 8, 128, 128, 128))
    const options = { canvas, sampleWidth: 8, sampleHeight: 8 }
    expect(detectGlasses(video(), landmarks(), options)).toBe(false)
  })

  it('is false when a custom edge threshold exceeds the gradients', () => {
    const canvas = makeCanvas(verticalStripePixels(8, 8, 2, 0, 255))
    const options = { canvas, sampleWidth: 8, sampleHeight: 8, edgeThreshold: 300 }
    expect(detectGlasses(video(), landmarks(), options)).toBe(false)
  })

  it('is false and never throws when the canvas context is unavailable', () => {
    expect(detectGlasses(video(), landmarks(), { canvas: makeCanvas(null) })).toBe(false)
  })

  it('is false when no eye landmarks are provided', () => {
    const canvas = makeCanvas(verticalStripePixels(80, 32, 2, 0, 255))
    expect(detectGlasses(video(), makeLandmarks([], []), { canvas })).toBe(false)
  })

  it('is false when the video has no dimensions (degenerate region)', () => {
    const canvas = makeCanvas(verticalStripePixels(80, 32, 2, 0, 255))
    expect(detectGlasses(makeVideo(0, 0), landmarks(), { canvas })).toBe(false)
  })

  it('is false when edges and dark pixels pass but overall contrast is too low', () => {
    // Stripes of 0 and 80: strong edges (80 > 46) and dark pixels, but std-dev contrast (40) fails.
    const canvas = makeCanvas(verticalStripePixels(80, 32, 2, 0, 80))
    expect(detectGlasses(video(), landmarks(), { canvas })).toBe(false)
  })

  it('is false when the sample height leaves no interior pixels to scan', () => {
    const canvas = makeCanvas(verticalStripePixels(8, 2, 2, 0, 255))
    const options = { canvas, sampleWidth: 8, sampleHeight: 2 }
    expect(detectGlasses(video(), landmarks(), options)).toBe(false)
  })

  it('is true when sparse very-dark pixels satisfy the dark-pixel condition via the veryDark fallback', () => {
    // One 30-luma column per 8 among 255: dark ratio (0.125) fails the 0.18 bar, but the
    // very-dark ratio (0.125) exceeds 0.07, and gradients, edge ratio, and contrast all pass.
    const width = 80
    const height = 32
    const data = new Uint8ClampedArray(width * height * 4)
    for (let row = 0; row < height; row++) {
      for (let column = 0; column < width; column++) {
        const value = column % 8 === 0 ? 30 : 255
        const index = (row * width + column) * 4
        data[index] = value
        data[index + 1] = value
        data[index + 2] = value
        data[index + 3] = 255
      }
    }
    expect(detectGlasses(video(), landmarks(), { canvas: makeCanvas(data) })).toBe(true)
  })

  it('throws in non-DOM environments without an injected canvas', () => {
    expect(() => detectGlasses(video(), landmarks())).toThrow(
      'Glasses detection requires a browser canvas or a supplied canvas.'
    )
  })

  it('creates its own canvas via document when available (browser default path)', () => {
    const canvas = makeCanvas(verticalStripePixels(80, 32, 2, 0, 255))
    const globals = globalThis as Record<string, unknown>
    globals.document = { createElement: () => canvas }
    try {
      expect(detectGlasses(video(), landmarks())).toBe(true)
    } finally {
      delete globals.document
    }
  })
})
