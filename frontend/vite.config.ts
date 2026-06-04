import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import ViteFonts from 'unplugin-fonts/vite'
import vuetify from 'vite-plugin-vuetify'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
    ...(mode === 'development' ? [vueDevTools()] : []),
    ViteFonts({
      fontsource: {
        families: [
          {
            name: 'Roboto',
            weights: [300, 400, 500, 700],
            styles: ['normal'],
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        configure: (proxy) => {
          // SSE 需要禁用响应缓冲
          proxy.on('proxyRes', (proxyRes) => {
            if (proxyRes.headers['content-type']?.includes('text/event-stream')) {
              proxyRes.headers['cache-control'] = 'no-cache'
              proxyRes.headers['x-accel-buffering'] = 'no'
            }
          })
        },
      },
      '/health': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (['vue', 'vue-router', 'pinia'].some((p) => id.includes(`/node_modules/${p}/`)))
            return 'vendor-vue'
          if (id.includes('/node_modules/vuetify/')) return 'vendor-vuetify'
          if (id.includes('/node_modules/axios/')) return 'vendor-axios'
        },
      },
    },
  },
}))
