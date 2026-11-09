import type { FaceImageMetrics, SharpnessOptions } from '../types.js'
import { finiteNumber } from '../validate.js'

const DEFAULT_MIN_SHARPNESS = 6.5

/** Returns whether the sampled face image meets the minimum gradient sharpness. */
export function isImageSharp(
  metrics: Pick<FaceImageMetrics, 'sharpness'>,
  options: SharpnessOptions = {}
): boolean {
  const minSharpness = finiteNumber(options.minSharpness, DEFAULT_MIN_SHARPNESS)
  return metrics.sharpness >= minSharpness
}
