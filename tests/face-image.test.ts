import { describe, expect, it } from 'vitest'
import { analyzeFaceImage, hasAdequateLighting, isImageSharp } from '../src/index.js'
import { makeCanvas, makeVideo, solidPixels, verticalStripePixels } from './helpers/fixtures.js'

const fullFrameBox = { x: 0, y: 0, width: 640, height: 480 }

function analyze(
  pixels: Uint8ClampedArray,
  options: { sampleSize?: number; box?: { x: number; y: number; width: number; height: number } } = {}
) {
  const video = makeVideo(640, 480)
  const canvas = makeCanvas(pixels)
  const sampleSize = options.sampleSize ?? 8
  return analyzeFaceImage(video, options.box ?? fullFrameBox, { canvas, sampleSize })
}

describe('analyzeFaceImage', () => {
  it('measures brightness and zero sharpness on a uniform frame', () => {
    const metrics = analyze(solidPixels(8, 8, 120, 120, 120))
    expect(metrics.brightness).toBeCloseTo(120, 5)
    expect(metrics.sharpness).toBe(0)
  })

  it('measures high sharpness on a striped frame', () => {
    const metrics = analyze(verticalStripePixels(8, 8, 2, 0, 255))
    expect(metrics.brightness).toBeCloseTo(127.5, 5)
    expect(metrics.sharpness).toBeGreaterThan(250)
  })

  it('measures near-zero brightness for a black frame, failing the lighting check', () => {
    const metrics = analyze(solidPixels(8, 8, 0, 0, 0))
    expect(metrics.brightness).toBeCloseTo(0, 5)
    expect(hasAdequateLighting(metrics)).toBe(false)
  })

  it('measures near-max brightness for a white frame, failing the lighting check', () => {
    const metrics = analyze(solidPixels(8, 8, 255, 255, 255))
    expect(metrics.brightness).toBeCloseTo(255, 5)
    expect(hasAdequateLighting(metrics)).toBe(false)
  })

  it('clips off-frame boxes instead of falling back', () => {
    const metrics = analyze(solidPixels(8, 8, 60, 60, 60), {
      box: { x: -50, y: -50, width: 700, height: 700 }
    })
    expect(metrics.brightness).toBeCloseTo(60, 5)
    expect(metrics.sharpness).toBe(0)
  })

  it('falls back to permissive metrics when the video has no dimensions', () => {
    const canvas = makeCanvas(solidPixels(8, 8, 60, 60, 60))
    const metrics = analyzeFaceImage(makeVideo(0, 0), fullFrameBox, { canvas, sampleSize: 8 })
    expect(metrics).toEqual({ brightness: 120, sharpness: 10 })
  })

  it('falls back to permissive metrics when sampleSize is below 3', () => {
    expect(analyze(solidPixels(8, 8, 60, 60, 60), { sampleSize: 2 })).toEqual({
      brightness: 120,
      sharpness: 10
    })
  })

  it('falls back to permissive metrics when the box lies entirely outside the frame', () => {
    const metrics = analyze(solidPixels(8, 8, 60, 60, 60), {
      box: { x: 700, y: 0, width: 100, height: 100 }
    })
    expect(metrics).toEqual({ brightness: 120, sharpness: 10 })
  })

  it('fallback metrics pass the default lighting and sharpness checks', () => {
    const canvas = makeCanvas(solidPixels(8, 8, 60, 60, 60))
    const metrics = analyzeFaceImage(makeVideo(0, 0), fullFrameBox, { canvas, sampleSize: 8 })
    expect(hasAdequateLighting(metrics)).toBe(true)
    expect(isImageSharp(metrics)).toBe(true)
  })

  it('throws in non-DOM environments without an injected canvas', () => {
    expect(() => analyzeFaceImage(makeVideo(640, 480), fullFrameBox)).toThrow(
      'Face image analysis requires a browser canvas or a supplied canvas.'
    )
  })

  it('creates its own canvas via document when available (browser default path)', () => {
    const canvas = makeCanvas(solidPixels(8, 8, 120, 120, 120))
    const globals = globalThis as Record<string, unknown>
    globals.document = { createElement: () => canvas }
    try {
      const metrics = analyzeFaceImage(makeVideo(640, 480), fullFrameBox, { sampleSize: 8 })
      expect(metrics.brightness).toBeCloseTo(120, 5)
      expect(metrics.sharpness).toBe(0)
    } finally {
      delete globals.document
    }
  })
})
