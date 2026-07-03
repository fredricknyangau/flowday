import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'Flowday',
        short_name: 'Flowday',
        description: 'Day planning app for academic freelancers',
        theme_color: '#059669',      // emerald-600
        background_color: '#f9fafb', // gray-50
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Cache the API responses for offline resilience
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/v1/schedule'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'flowday-schedule',
              expiration: { maxAgeSeconds: 60 * 60 * 24 }, // 24 h
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/v1/assignments'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'flowday-assignments',
              networkTimeoutSeconds: 5,
              expiration: { maxAgeSeconds: 60 * 5 }, // 5 min
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/v1/clients'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'flowday-clients',
              expiration: { maxAgeSeconds: 60 * 60 }, // 1 h
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
