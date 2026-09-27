import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const apiProxy = {
  // The API runs as a separate process locally. On Vercel the SPA and the API
  // share an origin, so /api resolves to the serverless function directly and
  // no proxy is involved in production.
  '/api': {
    target: 'http://localhost:5000',
    changeOrigin: true,
  },
  // Proxy uploaded media so images/audio resolve on the dev server
  '/uploads': {
    target: 'http://localhost:5000',
    changeOrigin: true,
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: apiProxy,
  },
  // Lets you exercise a real production build locally (`npm run build` then
  // `npm run preview`) against the API on :5000, including /admin/login.
  preview: {
    port: 4173,
    proxy: apiProxy,
  },
})
