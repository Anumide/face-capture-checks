#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const source = fileURLToPath(new URL('../models/', import.meta.url))
const destination = resolve(process.cwd(), process.argv[2] ?? 'public/models')

mkdirSync(destination, { recursive: true })
for (const entry of readdirSync(source)) {
  const target = resolve(destination, entry)
  if (!existsSync(target)) cpSync(resolve(source, entry), target)
}

process.stdout.write(`Bundled face-api.js models are available at ${destination}\n`)
