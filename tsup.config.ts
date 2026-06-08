import { defineConfig } from 'tsup'
import { resolve } from 'node:path'

export default defineConfig({
  entry: {
    'core/main': 'src/core/main.ts',
    worker: 'src/core/worker.ts',
  },
  format: 'esm',
  target: 'node22',
  platform: 'node',
  splitting: true,
  clean: true,
  outDir: 'dist',
  sourcemap: true,
  external: [/^#prisma\/.*/],
  esbuildOptions(options) {
    options.alias = { '@logger': resolve('./src/core/logging/main.ts') }
  },
})
