import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig(({mode}) => ({
  logLevel: 'error',
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    // In local dev, proxy /api to the backend so relative fetch('/api/...') works
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL
          ? process.env.VITE_API_URL.replace('/api', '')
          : 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
}));