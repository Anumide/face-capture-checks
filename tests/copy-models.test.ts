import { execFileSync, spawnSync } from 'node:child_process'
import { readdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
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

  it('exits with usage when given a flag-like argument', () => {
    const result = spawnSync(process.execPath, [script, '--help'], { encoding: 'utf8' })
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Usage')
  })

  it('exits with usage when given an empty destination argument', () => {
    const result = spawnSync(process.execPath, [script, ''], { encoding: 'utf8' })
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Usage')
  })

  it('exits with a clean error when the destination exists as a file', () => {
    const fileDestination = resolve(destination, 'not-a-directory')
    writeFileSync(fileDestination, '')
    const result = spawnSync(process.execPath, [script, fileDestination], { encoding: 'utf8' })
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('face-capture-checks-copy-models:')
  })
})
