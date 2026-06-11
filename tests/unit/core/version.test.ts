import { createRequire } from 'node:module'

import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const pkg = require('../../../package.json') as { version: string }

describe('version', () => {
  it('should export a semver string', () => {
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+/)
  })
})
