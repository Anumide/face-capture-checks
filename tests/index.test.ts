import { describe, expect, it } from 'vitest'
import * as api from '../src/index.js'

const expectedExports = [
  'analyzeFaceImage',
  'areEyesVisible',
  'calculateEyeAspectRatio',
  'detectGlasses',
  'hasAdequateLighting',
  'isFaceCentered',
  'isImageSharp'
]

describe('public API surface', () => {
  it('exports every documented check as a function', () => {
    const exports = api as unknown as Record<string, unknown>
    for (const name of expectedExports) {
      expect(exports[name], `export "${name}"`).toBeTypeOf('function')
    }
  })

  it('exports no undocumented runtime values', () => {
    expect(Object.keys(api as unknown as object).sort()).toEqual([...expectedExports].sort())
  })
})
