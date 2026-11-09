/** Returns the supplied numeric option when finite, otherwise the fallback. */
export function finiteNumber(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) ? value : fallback
}
