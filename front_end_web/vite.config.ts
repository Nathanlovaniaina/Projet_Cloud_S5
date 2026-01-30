import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy API calls to backend Spring Boot (running on port 8080)
      '/api': {
        target: 'http://backend:8080',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      },
      // Proxy map tiles to tileserver-gl (running on port 80 inside maps_server container)
      '/styles': {
        target: 'http://maps_server:80',
        changeOrigin: true,
        secure: false
      },
      '/data': {
        target: 'http://maps_server:80',
        changeOrigin: true,
        secure: false
      }
    }
  },
})
