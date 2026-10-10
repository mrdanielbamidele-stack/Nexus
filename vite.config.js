import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 2009,
    // Google's redirect address is registered for this port, so never drift to another.
    strictPort: true,
    // The API runs beside Vite in development (`npm run dev` starts both).
    // `xfwd` keeps the browser's host so the Google sign-in comes back here.
    proxy: {
      '/api': { target: 'http://localhost:8787', xfwd: true },
    },
  },
})
