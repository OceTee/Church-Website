import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const apiProxy = {
  // The API is a separate app. Locally it runs as its own process on :5000;
  // in production it is a second Vercel project that the frontend reaches via
  // VITE_API_URL, so no proxy is involved.
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

// A production build must point at the backend project. Without this check the
// SPA silently falls back to a relative "/api", which resolves against the
// frontend's own origin and is answered by the index.html rewrite -- the exact
// failure this split exists to fix. It has to be enforced here: a top-level
// throw in a source module does not fail the build, it ships a blank page.
function requireApiUrlInProduction() {
  return {
    name: 'require-api-url-in-production',
    apply: 'build',
    configResolved(config) {
      if (config.mode === 'development') return
      const env = loadEnv(config.mode, config.envDir || process.cwd(), 'VITE_')
      if (env.VITE_API_URL) return
      throw new Error(
        'VITE_API_URL must be set for a production build. Set it to ' +
          'https://<backend-project>.vercel.app/api (Vercel dashboard > frontend ' +
          'project > Settings > Environment Variables, or a .env file for a local build).'
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), requireApiUrlInProduction()],
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
