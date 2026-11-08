import { describe, expect, it } from 'vitest'
import { areEyesVisible, calculateEyeAspectRatio } from '../src/index.js'
import { boundaryEye, closedEye, makeLandmarks, openEye, point } from './helpers/fixtures.js'

describe('calculateEyeAspectRatio', () => {
  it('computes the aspect ratio for a canonical open eye', () => {
    expect(calculateEyeAspectRatio(openEye())).toBe(0.5)
  })

  it('returns 0 for a closed (flat) eye', () => {
    expect(calculateEyeAspectRatio(closedEye())).toBe(0)
  })

  it('returns 0 unless the eye has exactly six points', () => {
    expect(calculateEyeAspectRatio([])).toBe(0)
    expect(calculateEyeAspectRatio(openEye().slice(0, 5))).toBe(0)
    expect(calculateEyeAspectRatio([...openEye(), point(5, 5)])).toBe(0)
  })

  it('returns 0 when the horizontal span is zero', () => {
    const eye = [point(2, 0), point(1, 1), point(3, 1), point(2, 0), point(3, -1), point(1, -1)]
    expect(calculateEyeAspectRatio(eye)).toBe(0)
  })
})

describe('areEyesVisible', () => {
  it('is true when both eyes are open', () => {
    expect(areEyesVisible(makeLandmarks(openEye(), openEye()))).toBe(true)
  })

  it('is false when either eye is closed', () => {
    expect(areEyesVisible(makeLandmarks(closedEye(), openEye()))).toBe(false)
    expect(areEyesVisible(makeLandmarks(openEye(), closedEye()))).toBe(false)
    expect(areEyesVisible(makeLandmarks(closedEye(), closedEye()))).toBe(false)
  })

  it('is false when the aspect ratio equals the default threshold (strict comparison)', () => {
    expect(areEyesVisible(makeLandmarks(boundaryEye(), boundaryEye()))).toBe(false)
  })

  it('honours a custom minAspectRatio', () => {
    const landmarks = makeLandmarks(openEye(), openEye())
    expect(areEyesVisible(landmarks, { minAspectRatio: 0.6 })).toBe(false)
    expect(areEyesVisible(landmarks, { minAspectRatio: 0.3 })).toBe(true)
  })
})
