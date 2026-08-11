import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Generator icon PWA:
//   npx pwa-assets-generator
// Membaca pwa-assets.config.js dan menghasilkan file PNG di /public:
//   pwa-64x64.png, pwa-192x192.png, pwa-512x512.png,
//   maskable-icon-512x512.png, apple-touch-icon-180x180.png, favicon.ico
export default defineConfig({
  preset: minimal2023Preset,
  images: ['public/favicon.svg'],
})
