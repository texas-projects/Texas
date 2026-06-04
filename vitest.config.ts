import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'backend',
          root: '.',
          include: ['tests/**/*.test.ts'],
          environment: 'node',
          coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            include: ['src/**/*.ts'],
            exclude: ['src/core/db/__generated__/**'],
          },
        },
      },
      'frontend',
    ],
  },
})
