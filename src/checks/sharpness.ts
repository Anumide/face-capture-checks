import type { FaceImageMetrics, SharpnessOptions } from '../types.js'

const DEFAULT_MIN_SHARPNESS = 6.5

/** Returns whether the sampled face image meets the minimum gradient sharpness. */
export function isImageSharp(
  metrics: Pick<FaceImageMetrics, 'sharpness'>,
  options: SharpnessOptions = {}
): boolean {
  return metrics.sharpness >= (options.minSharpness ?? DEFAULT_MIN_SHARPNESS)
}
