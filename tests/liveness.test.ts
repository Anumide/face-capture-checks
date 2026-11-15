import { describe, expect, it } from 'vitest'
import type { FaceLandmarks68, Point } from 'face-api.js'
import { createLivenessDetector } from '../src/index.js'
import { makeLandmarks, openEye, point } from './helpers/fixtures.js'

const frame = { width: 1000, height: 1000 }
const face = { box: { x: 300, y: 300, width: 400, height: 400 } }

function poseLandmarks(noseX: number): FaceLandmarks68 {
  const leftEye = openEye().map(({ x, y }) => point(x + 28, y + 50))
  const rightEye = openEye().map(({ x, y }) => point(x + 68, y + 50))
  const positions: Point[] = Array.from({ length: 68 }, () => point(0, 0))
  positions[30] = point(noseX, 50)
  return makeLandmarks(leftEye, rightEye, positions)
}

function sample(noseX = 50, blinkDetected = false) {
  return {
    face,
    landmarks: poseLandmarks(noseX),
    frame,
    eyesOpen: true,
    blinkDetected
  }
}

function calibrate(detector: ReturnType<typeof createLivenessDetector>) {
  let result
  for (let index = 0; index < 8; index++) result = detector.update(sample())
  return result!
}

describe('createLivenessDetector', () => {
  it('requires both a blink and head movement to verify liveness', () => {
    const detector = createLivenessDetector()
    expect(calibrate(detector).calibrated).toBe(true)

    const movementOnly = detector.update(sample(65))
    expect(movementOnly.headMovementDetected).toBe(true)
    expect(movementOnly.blinkDetected).toBe(false)
    expect(movementOnly.verified).toBe(false)

    const bothSignals = detector.update(sample(65, true))
    expect(bothSignals.verified).toBe(true)
  })

  it('reports return to forward pose after the configured neutral frames', () => {
    const detector = createLivenessDetector()
    calibrate(detector)
    detector.update(sample(65))

    expect(detector.update(sample()).facingForward).toBe(false)
    detector.update(sample())
    const returned = detector.update(sample())
    expect(returned.facingForward).toBe(true)
  })

  it('ignores yaw samples when the face is not centered or eyes are closed', () => {
    const detector = createLivenessDetector()
    calibrate(detector)

    const offCenter = detector.update({
      ...sample(65),
      face: { box: { x: 0, y: 300, width: 400, height: 400 } }
    })
    expect(offCenter.headMovementDetected).toBe(false)

    const eyesClosed = detector.update({ ...sample(65), eyesOpen: false })
    expect(eyesClosed.headMovementDetected).toBe(false)
  })

  it('resets calibration and detected signals', () => {
    const detector = createLivenessDetector()
    calibrate(detector)
    detector.update(sample(65, true))

    detector.reset()
    const result = detector.update(sample())
    expect(result.calibrated).toBe(false)
    expect(result.headMovementDetected).toBe(false)
    expect(result.blinkDetected).toBe(false)
    expect(result.verified).toBe(false)
  })
})
