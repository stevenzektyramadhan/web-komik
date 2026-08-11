import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
    },
  },
})
