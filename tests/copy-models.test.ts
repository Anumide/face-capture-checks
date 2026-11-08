import { execFileSync } from 'node:child_process'
import { readdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'

const script = resolve('bin/copy-models.mjs')
const destination = mkdtempSync(join(tmpdir(), 'face-capture-checks-test-'))

const modelFiles = [
  'face_landmark_68_tiny_model-shard1',
  'face_landmark_68_tiny_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'tiny_face_detector_model-weights_manifest.json'
]

describe('face-capture-checks-copy-models CLI', () => {
  afterAll(() => {
    rmSync(destination, { recursive: true, force: true })
  })

  it('copies every bundled model file into the destination', () => {
    execFileSync(process.execPath, [script, destination])
    expect(readdirSync(destination).sort()).toEqual([...modelFiles].sort())
  })

  it('succeeds when files already exist at the destination', () => {
    expect(() => execFileSync(process.execPath, [script, destination])).not.toThrow()
  })
})
