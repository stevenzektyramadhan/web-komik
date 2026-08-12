import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'WebKomik — Baca Komik Bahasa Indonesia',
        short_name: 'WebKomik',
        description: 'Baca komik, manga, dan manhwa bahasa Indonesia secara gratis.',
        theme_color: '#0a0a0f',
        background_color: '#0a0a0f',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'id',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        // SPA fallback: semua navigasi (route React) langsung ke index.html
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // Data MangaDex (list, detail, chapter) — NetworkFirst + cache 1 hari
            urlPattern: /^\/api\/mangadex\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'mangadex-api',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Gambar cover & halaman chapter — CacheFirst + cache 30 hari
            urlPattern: /^\/api\/img\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mangadex-images',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Gambar chapter Komiku — CacheFirst + cache 30 hari
            urlPattern: /^\/api\/komiku-img\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'komiku-images',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      // Proxy lokal untuk MangaDex API (server-side) supaya npm run dev
      // tidak terkena blokir CORS MangaDex. Di produksi (Vercel),
      // route yang sama ditangani oleh api/index.js (via rewrite /api/*).
      '/api/mangadex': {
        target: 'https://api.mangadex.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/mangadex/, ''),
      },
      // Proxy lokal untuk gambar MangaDex (uploads anti-hotlink).
      // Di produksi (Vercel), route ini ditangani api/index.js (via rewrite /api/*).
      '/api/img': {
        target: 'https://uploads.mangadex.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/img/, ''),
      },
      // Proxy lokal untuk gambar chapter Komiku (img.komiku.org anti-hotlink
      // + tidak mengirim CORS). Header Referer wajib agar tidak 403.
      '/api/komiku-img': {
        target: 'https://img.komiku.org',
        changeOrigin: true,
        headers: {
          Referer: 'https://komiku.org/',
        },
        rewrite: (path) => path.replace(/^\/api\/komiku-img/, ''),
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
})
