import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    open: true,
    historyApiFallback: {
      index: '/index.html',
    },
  },
  preview: {
    port: 4173,
    historyApiFallback: {
      index: '/index.html',
    },
  },
})
