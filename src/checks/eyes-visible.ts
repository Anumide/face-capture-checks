import type { FaceLandmarks68, Point } from 'face-api.js'
import type { EyeVisibilityOptions } from '../types.js'

const DEFAULT_MIN_ASPECT_RATIO = 0.2

/** Calculates the eye aspect ratio for the six ordered landmarks of one eye. */
export function calculateEyeAspectRatio(eye: readonly Point[]): number {
  if (eye.length !== 6) return 0

  const [p1, p2, p3, p4, p5, p6] = eye
  const horizontal = Math.hypot(p1.x - p4.x, p1.y - p4.y)
  if (horizontal === 0) return 0

  const vertical1 = Math.hypot(p2.x - p6.x, p2.y - p6.y)
  const vertical2 = Math.hypot(p3.x - p5.x, p3.y - p5.y)
  return (vertical1 + vertical2) / (2 * horizontal)
}

/** Returns whether both eyes appear open, using the face-api 68-point landmarks. */
export function areEyesVisible(
  landmarks: FaceLandmarks68,
  options: EyeVisibilityOptions = {}
): boolean {
  const minAspectRatio = options.minAspectRatio ?? DEFAULT_MIN_ASPECT_RATIO
  return calculateEyeAspectRatio(landmarks.getLeftEye()) > minAspectRatio
    && calculateEyeAspectRatio(landmarks.getRightEye()) > minAspectRatio
}
