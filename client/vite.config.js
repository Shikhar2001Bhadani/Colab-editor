import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Explicitly set the port
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000', // Backend server
        changeOrigin: true,
      },
    },
  },
})