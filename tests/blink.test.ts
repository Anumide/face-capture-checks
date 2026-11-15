import { describe, expect, it } from 'vitest'
import { createBlinkDetector } from '../src/index.js'
import { closedEye, makeLandmarks, openEye } from './helpers/fixtures.js'

const openLandmarks = () => makeLandmarks(openEye(), openEye())
const closedLandmarks = () => makeLandmarks(closedEye(), closedEye())

function calibrate(detector: ReturnType<typeof createBlinkDetector>, startAt = 0) {
  let result
  for (let sample = 0; sample < 8; sample++) {
    result = detector.update(openLandmarks(), {
      isCentered: true,
      timestamp: startAt + sample * 120
    })
  }
  return result!
}

describe('createBlinkDetector', () => {
  it('calibrates from centered samples and detects a close/reopen transition', () => {
    const detector = createBlinkDetector()
    const calibrated = calibrate(detector)

    expect(calibrated.calibrated).toBe(true)
    expect(calibrated.baselineEAR).toBe(0.5)
    expect(calibrated.detected).toBe(false)

    expect(detector.update(closedLandmarks(), { isCentered: true, timestamp: 1000 }).status).toBe('closed')
    const reopened = detector.update(openLandmarks(), { isCentered: true, timestamp: 1120 })

    expect(reopened.status).toBe('detected')
    expect(reopened.detected).toBe(true)
  })

  it('does not calibrate from off-center samples', () => {
    const detector = createBlinkDetector()
    for (let sample = 0; sample < 10; sample++) {
      detector.update(openLandmarks(), { isCentered: false, timestamp: sample * 120 })
    }

    const result = detector.update(openLandmarks(), { isCentered: false, timestamp: 1200 })
    expect(result.status).toBe('calibrating')
    expect(result.calibrated).toBe(false)
  })

  it('rejects a close/reopen transition shorter than the minimum duration', () => {
    const detector = createBlinkDetector()
    calibrate(detector)
    detector.update(closedLandmarks(), { isCentered: true, timestamp: 1000 })

    const reopened = detector.update(openLandmarks(), { isCentered: true, timestamp: 1020 })
    expect(reopened.detected).toBe(false)
    expect(reopened.status).toBe('open')
  })

  it('expires a close candidate that lasts beyond the maximum duration', () => {
    const detector = createBlinkDetector()
    calibrate(detector)
    detector.update(closedLandmarks(), { isCentered: true, timestamp: 1000 })

    const reopened = detector.update(openLandmarks(), { isCentered: true, timestamp: 2200 })
    expect(reopened.detected).toBe(false)
    expect(reopened.status).toBe('open')
  })

  it('can be reset and calibrated again', () => {
    const detector = createBlinkDetector()
    calibrate(detector)
    detector.update(closedLandmarks(), { isCentered: true, timestamp: 1000 })
    detector.update(openLandmarks(), { isCentered: true, timestamp: 1120 })

    detector.reset()
    const result = detector.update(openLandmarks(), { isCentered: true, timestamp: 2000 })
    expect(result.detected).toBe(false)
    expect(result.calibrated).toBe(false)
  })
})
