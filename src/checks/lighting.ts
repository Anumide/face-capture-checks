import type { FaceImageMetrics, LightingOptions } from '../types.js'

const DEFAULTS = { minBrightness: 80, maxBrightness: 220 } satisfies Required<LightingOptions>

/** Returns whether the sampled face brightness falls within the accepted range. */
export function hasAdequateLighting(
  metrics: Pick<FaceImageMetrics, 'brightness'>,
  options: LightingOptions = {}
): boolean {
  const minBrightness = options.minBrightness ?? DEFAULTS.minBrightness
  const maxBrightness = options.maxBrightness ?? DEFAULTS.maxBrightness
  return metrics.brightness >= minBrightness && metrics.brightness <= maxBrightness
}
