#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const argument = process.argv[2]

if (argument !== undefined && (argument === '' || argument.startsWith('-'))) {
  process.stderr.write('Usage: face-capture-checks-copy-models [destination-dir]\n')
  process.exit(1)
}

const source = fileURLToPath(new URL('../models/', import.meta.url))
const destination = resolve(process.cwd(), argument ?? 'public/models')

try {
  mkdirSync(destination, { recursive: true })

  let copied = 0
  let skipped = 0
  for (const entry of readdirSync(source)) {
    const target = resolve(destination, entry)
    if (existsSync(target)) {
      process.stdout.write(`skipped (already exists): ${entry}\n`)
      skipped++
      continue
    }
    cpSync(resolve(source, entry), target)
    copied++
  }

  process.stdout.write(`Copied ${copied} bundled model file(s) to ${destination}`)
  if (skipped > 0) process.stdout.write(` (${skipped} already present, left unchanged)`)
  process.stdout.write('\n')
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`face-capture-checks-copy-models: ${message}\n`)
  process.exit(1)
}
