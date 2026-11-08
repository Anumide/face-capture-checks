import { describe, expect, it } from 'vitest'
import { isFaceCentered } from '../src/index.js'
import type { FaceBox } from '../src/index.js'

// 1000x1000 frame: center tolerance radius is 150, face width window is [300, 650].
const frame = { width: 1000, height: 1000 }

/** Face box whose center sits at (500 + offsetX, 500 + offsetY). */
function box(width: number, offsetX = 0, offsetY = 0): FaceBox {
  return { x: (1000 - width) / 2 + offsetX, y: 300 + offsetY, width, height: 400 }
}

describe('isFaceCentered', () => {
  it('is true for a dead-center face of acceptable width', () => {
    expect(isFaceCentered(box(400), frame)).toBe(true)
  })

  it('accepts a center offset within the tolerance radius', () => {
    expect(isFaceCentered(box(400, 140, 0), frame)).toBe(true)
  })

  it('rejects a center offset exactly at the tolerance radius (strict comparison)', () => {
    expect(isFaceCentered(box(400, 150, 0), frame)).toBe(false)
  })

  it('rejects a diagonal offset outside the tolerance radius', () => {
    expect(isFaceCentered(box(400, 110, 110), frame)).toBe(false)
  })

  it('accepts face widths at the exact ratio boundaries (0.3 and 0.65)', () => {
    expect(isFaceCentered(box(300), frame)).toBe(true)
    expect(isFaceCentered(box(650), frame)).toBe(true)
  })

  it('rejects face widths just outside the ratio boundaries', () => {
    expect(isFaceCentered(box(299), frame)).toBe(false)
    expect(isFaceCentered(box(651), frame)).toBe(false)
  })

  it('accepts a small off-center face with relaxed options but not defaults', () => {
    const small = box(100, 350, 0)
    const relaxed = { centerTolerance: 0.5, minFaceWidthRatio: 0.1, maxFaceWidthRatio: 0.9 }
    expect(isFaceCentered(small, frame)).toBe(false)
    expect(isFaceCentered(small, frame, relaxed)).toBe(true)
  })

  it('accepts both a plain face box and a detection-shaped object', () => {
    const faceBox: FaceBox = { x: 300, y: 300, width: 400, height: 400 }
    const detection = { box: faceBox } as unknown as Parameters<typeof isFaceCentered>[0]
    expect(isFaceCentered(faceBox, frame)).toBe(true)
    expect(isFaceCentered(detection, frame)).toBe(true)
  })
})
