import type { FaceLandmarks68 } from 'face-api.js'
import { isFaceCentered } from './face-centered.js'
import { finiteNumber } from '../validate.js'
import type { FaceBox, FrameSize } from '../types.js'

const DEFAULTS = {
  baselineSamples: 8,
  movementThreshold: 0.18,
  neutralTolerance: 0.1,
  neutralFrames: 3,
  smoothing: 0.5
} as const

export interface LivenessDetectorOptions {
  /** Number of centered, open-eye frames used for the neutral-pose baseline. */
  baselineSamples?: number
  /** Required range of smoothed yaw movement from neutral. */
  movementThreshold?: number
  /** Maximum yaw offset still considered forward-facing. */
  neutralTolerance?: number
  /** Consecutive neutral frames required to report facingForward. */
  neutralFrames?: number
  /** Smoothing factor for head-yaw changes, from 0 through 1. */
  smoothing?: number
}

export interface LivenessSample {
  face: FaceBox | { box: FaceBox }
  landmarks: FaceLandmarks68
  frame: FrameSize
  eyesOpen: boolean
  blinkDetected: boolean
}

export interface LivenessResult {
  calibrated: boolean
  headMovementDetected: boolean
  blinkDetected: boolean
  verified: boolean
  facingForward: boolean
  headTurn: number | null
}

export interface LivenessDetector {
  update(sample: LivenessSample | null): LivenessResult
  reset(): void
}

/**
 * Creates a stateful head-movement and blink liveness check. Blink detection is
 * supplied by createBlinkDetector; this check tracks neutral pose and yaw movement.
 */
export function createLivenessDetector(options: LivenessDetectorOptions = {}): LivenessDetector {
  const baselineSamplesRequired = Math.max(
    1,
    Math.floor(finiteNumber(options.baselineSamples, DEFAULTS.baselineSamples))
  )
  const movementThreshold = Math.max(0, finiteNumber(options.movementThreshold, DEFAULTS.movementThreshold))
  const neutralTolerance = Math.max(0, finiteNumber(options.neutralTolerance, DEFAULTS.neutralTolerance))
  const neutralFramesRequired = Math.max(
    1,
    Math.floor(finiteNumber(options.neutralFrames, DEFAULTS.neutralFrames))
  )
  const smoothing = Math.min(1, Math.max(0, finiteNumber(options.smoothing, DEFAULTS.smoothing)))

  let baselineTotal = 0
  let baselineSamples = 0
  let baseline: number | null = null
  let smoothedHeadTurn: number | null = null
  let maxHeadTurn = 0
  let minHeadTurn = 0
  let headMovementDetected = false
  let blinkDetected = false
  let forwardFrames = 0
  let facingForward = false
  let headTurn: number | null = null

  const result = (): LivenessResult => ({
    calibrated: baseline !== null,
    headMovementDetected,
    blinkDetected,
    verified: headMovementDetected && blinkDetected,
    facingForward,
    headTurn
  })

  const reset = () => {
    baselineTotal = 0
    baselineSamples = 0
    baseline = null
    smoothedHeadTurn = null
    maxHeadTurn = 0
    minHeadTurn = 0
    headMovementDetected = false
    blinkDetected = false
    forwardFrames = 0
    facingForward = false
    headTurn = null
  }

  const update = (sample: LivenessSample | null): LivenessResult => {
    if (sample === null) {
      forwardFrames = 0
      facingForward = false
      headTurn = null
      return result()
    }

    blinkDetected ||= sample.blinkDetected
    const leftEye = sample.landmarks.getLeftEye()
    const rightEye = sample.landmarks.getRightEye()
    const positions = sample.landmarks.positions
    const faceBox = 'box' in sample.face ? sample.face.box : sample.face
    if (
      !sample.eyesOpen ||
      !isFaceCentered(faceBox, sample.frame) ||
      leftEye.length === 0 ||
      rightEye.length === 0 ||
      positions.length <= 30
    ) {
      forwardFrames = 0
      facingForward = false
      headTurn = null
      return result()
    }

    const leftEyeCenterX = leftEye.reduce((sum, point) => sum + point.x, 0) / leftEye.length
    const rightEyeCenterX = rightEye.reduce((sum, point) => sum + point.x, 0) / rightEye.length
    const eyeCenterX = (leftEyeCenterX + rightEyeCenterX) / 2
    const eyeDistance = Math.abs(leftEyeCenterX - rightEyeCenterX)
    if (!Number.isFinite(eyeDistance) || eyeDistance === 0) {
      forwardFrames = 0
      facingForward = false
      headTurn = null
      return result()
    }

    const noseOffset = (positions[30].x - eyeCenterX) / eyeDistance
    if (!Number.isFinite(noseOffset)) {
      forwardFrames = 0
      facingForward = false
      headTurn = null
      return result()
    }

    if (baselineSamples < baselineSamplesRequired) {
      baselineTotal += noseOffset
      baselineSamples++
      if (baselineSamples === baselineSamplesRequired) baseline = baselineTotal / baselineSamples
      forwardFrames = 0
      facingForward = false
      headTurn = null
      return result()
    }

    const rawHeadTurn = noseOffset - (baseline ?? 0)
    headTurn = rawHeadTurn
    smoothedHeadTurn = smoothedHeadTurn === null
      ? rawHeadTurn
      : smoothing * smoothedHeadTurn + (1 - smoothing) * rawHeadTurn
    maxHeadTurn = Math.max(maxHeadTurn, smoothedHeadTurn)
    minHeadTurn = Math.min(minHeadTurn, smoothedHeadTurn)
    headMovementDetected ||= maxHeadTurn - minHeadTurn >= movementThreshold

    if (Math.abs(rawHeadTurn) <= neutralTolerance) {
      forwardFrames++
    } else {
      forwardFrames = 0
    }
    facingForward = forwardFrames >= neutralFramesRequired

    return result()
  }

  return { update, reset }
}
