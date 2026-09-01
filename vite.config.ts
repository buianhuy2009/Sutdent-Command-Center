import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico','apple-touch-icon.png'],
      manifest: {
        name: 'StudentOS - Command Center',
        short_name: 'StudentOS',
        description: 'Local-first academic workspace: notes, flashcards, pomodoro, research briefs',
        theme_color: '#D97757',
        background_color: '#FAF9F5',
        display: 'standalone',
        icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [
          { urlPattern: /^https:\/\/generativelanguage\.googleapis\.com\/.*/i, handler: 'NetworkFirst', options: { cacheName: 'gemini-api', networkTimeoutSeconds: 10 } },
          { urlPattern: /^https:\/\/export\.arxiv\.org\/.*/i, handler: 'StaleWhileRevalidate', options: { cacheName: 'arxiv-cache' } },
          { urlPattern: /^https:\/\/openlibrary\.org\/.*/i, handler: 'StaleWhileRevalidate', options: { cacheName: 'openlib-cache' } }
        ]
      }
    })],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
