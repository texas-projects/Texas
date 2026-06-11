import { defineConfig } from '@/core/framework/echo-config.js'

export default defineConfig({
  echoes: {
    handler: ['src/handlers'],
    service: ['src/services', 'src/render-templates'],
    task: ['src/tasks'],
    route: {
      dirs: ['src/apis'],
      exclude: ['**/schemas/**', '**/plugins/**'],
    },
  },
})
