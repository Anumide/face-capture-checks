import type { FaceLandmarks68 } from 'face-api.js'
import { calculateEyeAspectRatio } from './eyes-visible.js'
import { finiteNumber } from '../validate.js'

const DEFAULTS = {
  calibrationSamples: 8,
  closedRatio: 0.85,
  openRatio: 0.95,
  minClosedDurationMs: 50,
  maxClosedDurationMs: 1000
} as const

export interface BlinkDetectorOptions {
  /** Number of centered samples used to estimate the user's open-eye EAR. */
  calibrationSamples?: number
  /** A blink candidate starts below this ratio of calibrated open-eye EAR. */
  closedRatio?: number
  /** A blink is confirmed after EAR recovers above this baseline ratio. */
  openRatio?: number
  minClosedDurationMs?: number
  maxClosedDurationMs?: number
}

export interface BlinkSampleOptions {
  /** Only centered samples are used for calibration. */
  isCentered: boolean
  /** Use a monotonic timestamp when available; defaults to Date.now(). */
  timestamp?: number
}

export type BlinkStatus = 'calibrating' | 'open' | 'closed' | 'detected'

export interface BlinkResult {
  status: BlinkStatus
  detected: boolean
  calibrated: boolean
  baselineEAR: number | null
  currentEAR: number | null
}

export interface BlinkDetector {
  update(landmarks: FaceLandmarks68, sample: BlinkSampleOptions): BlinkResult
  reset(): void
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2
}

/**
 * Creates a resettable blink detector from a sequence of face-api landmark samples.
 * It calibrates open-eye EAR from centered frames, then detects an EAR close/reopen
 * transition within a bounded duration.
 */
export function createBlinkDetector(options: BlinkDetectorOptions = {}): BlinkDetector {
  const calibrationSamples = Math.max(
    1,
    Math.floor(finiteNumber(options.calibrationSamples, DEFAULTS.calibrationSamples))
  )
  const rawClosedRatio = finiteNumber(options.closedRatio, DEFAULTS.closedRatio)
  const rawOpenRatio = finiteNumber(options.openRatio, DEFAULTS.openRatio)
  const ratiosAreValid = rawClosedRatio > 0 && rawOpenRatio > rawClosedRatio
  const closedRatio = ratiosAreValid ? rawClosedRatio : DEFAULTS.closedRatio
  const openRatio = ratiosAreValid ? rawOpenRatio : DEFAULTS.openRatio
  const minClosedDurationMs = Math.max(
    0,
    finiteNumber(options.minClosedDurationMs, DEFAULTS.minClosedDurationMs)
  )
  const maxClosedDurationMs = Math.max(
    minClosedDurationMs,
    finiteNumber(options.maxClosedDurationMs, DEFAULTS.maxClosedDurationMs)
  )

  let baselineSamples: number[] = []
  let baselineEAR: number | null = null
  let closedAt: number | null = null
  let detected = false
  let currentEAR: number | null = null

  const result = (status: BlinkStatus): BlinkResult => ({
    status,
    detected,
    calibrated: baselineEAR !== null,
    baselineEAR,
    currentEAR
  })

  const reset = () => {
    baselineSamples = []
    baselineEAR = null
    closedAt = null
    detected = false
    currentEAR = null
  }

  const update = (landmarks: FaceLandmarks68, sample: BlinkSampleOptions): BlinkResult => {
    const leftEAR = calculateEyeAspectRatio(landmarks.getLeftEye())
    const rightEAR = calculateEyeAspectRatio(landmarks.getRightEye())
    const averageEAR = (leftEAR + rightEAR) / 2
    currentEAR = Number.isFinite(averageEAR) && averageEAR >= 0 ? averageEAR : null

    if (sample.isCentered && currentEAR !== null && currentEAR > 0 && baselineEAR === null) {
      baselineSamples.push(currentEAR)
      if (baselineSamples.length >= calibrationSamples) {
        const value = median(baselineSamples)
        baselineEAR = Number.isFinite(value) && value > 0 ? value : null
      }
    }

    if (baselineEAR === null || currentEAR === null) return result('calibrating')
    if (detected) return result('detected')

    const timestamp = finiteNumber(sample.timestamp, Date.now())
    const closedThreshold = baselineEAR * closedRatio
    const openThreshold = baselineEAR * openRatio

    if (closedAt === null) {
      if (currentEAR < closedThreshold) {
        closedAt = timestamp
        return result('closed')
      }
      return result('open')
    }

    const closedDuration = timestamp - closedAt
    if (closedDuration < 0 || closedDuration > maxClosedDurationMs) {
      closedAt = null
      return result(currentEAR < closedThreshold ? 'closed' : 'open')
    }

    if (currentEAR > openThreshold) {
      detected = closedDuration >= minClosedDurationMs
      closedAt = null
      return result(detected ? 'detected' : 'open')
    }

    return result('closed')
  }

  return { update, reset }
}
