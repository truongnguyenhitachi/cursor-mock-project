import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Spring Boot API runs on http://localhost:8081 with context path /api/v1
// During dev we proxy /api -> http://localhost:8081 so the browser can call
// the API on the same origin and avoid CORS issues.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
})
