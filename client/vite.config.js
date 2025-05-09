import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:6090', // URL ของเซิร์ฟเวอร์ Node.js ของคุณ
      }
    }
  }
})
